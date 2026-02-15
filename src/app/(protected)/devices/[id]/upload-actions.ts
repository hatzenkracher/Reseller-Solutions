'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'text/plain',
]

type FileCategory = 'PAYPAL' | 'INVOICE' | 'CHAT' | 'EIGENBELEG' | 'OTHER'

// Category to German filename prefix mapping
const CATEGORY_FILENAME_MAP: Record<FileCategory, string> = {
    INVOICE: 'Rechnung',
    PAYPAL: 'Zahlungsbeleg',
    CHAT: 'KleinanzeigenChat',
    EIGENBELEG: 'Eigenbeleg',
    OTHER: 'Dokument',
}

/**
 * Generate a structured filename based on category, device ID, and date.
 * Example: Rechnung_RS-2026-001_2026-02-14.pdf
 */
function generateStructuredFilename(
    category: FileCategory,
    deviceId: string,
    originalFilename: string
): string {
    const prefix = CATEGORY_FILENAME_MAP[category] || 'Dokument'
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const extension = originalFilename.match(/\.[^/.]+$/)?.[0] || ''
    return `${prefix}_${deviceId}_${today}${extension}`
}

/**
 * Check if a file exists in storage
 */
async function fileExists(filePath: string): Promise<boolean> {
    try {
        const serviceClient = createServiceRoleClient()
        const { data, error } = await serviceClient
            .storage
            .from('device-files')
            .list(filePath.substring(0, filePath.lastIndexOf('/')))

        if (error) return false

        const filename = filePath.substring(filePath.lastIndexOf('/') + 1)
        return (data || []).some(file => file.name === filename)
    } catch {
        return false
    }
}

/**
 * Generate unique filename by appending timestamp if duplicate exists
 */
async function getUniqueFilename(
    userId: string,
    yearMonth: string,
    deviceId: string,
    filename: string
): Promise<string> {
    const basePath = `${userId}/${yearMonth}/${deviceId}`
    const baseFilename = filename.replace(/\.[^/.]+$/, '')
    const extension = filename.match(/\.[^/.]+$/)?.[0] || ''

    let result = filename
    let counter = 0

    // Check if file exists, if so, append timestamp
    while (await fileExists(`${basePath}/${result}`)) {
        const timestamp = Date.now() + counter
        result = `${baseFilename}_${timestamp}${extension}`
        counter++
    }

    return result
}

/**
 * Upload a file for a device
 */
export async function uploadDeviceFile(
    deviceId: string,
    formData: FormData
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get device to verify ownership and extract purchase_date for folder structure
        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .select('purchase_date')
            .eq('id', deviceId)
            .eq('owner_user_id', user.id)
            .single()

        if (deviceError || !device) {
            return { success: false, error: 'Device not found or access denied' }
        }

        // Extract file and category from form data
        const file = formData.get('file') as File
        const category = (formData.get('category') as FileCategory) || 'OTHER'

        if (!file) {
            return { success: false, error: 'No file provided' }
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return {
                success: false,
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
            }
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return {
                success: false,
                error: 'File type not allowed. Allowed: PDF, PNG, JPG, WEBP, TXT'
            }
        }

        // Generate folder path: {user_id}/{YYYY-MM}/{device_id}/
        const purchaseDate = new Date(device.purchase_date)
        const yearMonth = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`

        // Generate structured filename from category + device ID + date
        const structuredName = generateStructuredFilename(category, deviceId, file.name)

        // Ensure uniqueness (handles duplicates)
        const uniqueFilename = await getUniqueFilename(
            user.id,
            yearMonth,
            deviceId,
            structuredName
        )

        const filePath = `${user.id}/${yearMonth}/${deviceId}/${uniqueFilename}`

        // Upload to Supabase Storage using service role client
        const serviceClient = createServiceRoleClient()
        const { data: uploadData, error: uploadError } = await serviceClient
            .storage
            .from('device-files')
            .upload(filePath, file, {
                upsert: false, // We handle duplicates ourselves
                contentType: file.type,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return {
                success: false,
                error: uploadError.message || 'File upload failed'
            }
        }

        // Save metadata to database
        const { error: dbError } = await supabase
            .from('device_files')
            .insert({
                device_id: deviceId,
                owner_user_id: user.id,
                file_name: uniqueFilename,
                file_path: filePath,
                file_size: file.size,
                file_type: file.type,
                category: category,
            })

        if (dbError) {
            console.error('Database error:', dbError)
            // Rollback: delete uploaded file from storage
            await serviceClient.storage
                .from('device-files')
                .remove([filePath])

            return {
                success: false,
                error: 'Failed to save file metadata'
            }
        }

        revalidatePath(`/devices/${deviceId}`)
        return {
            success: true,
            filePath,
            filename: uniqueFilename,
        }
    } catch (error: any) {
        console.error('Upload file error:', error)
        return {
            success: false,
            error: error.message || 'Upload failed'
        }
    }
}

/**
 * List all files for a device with signed download URLs
 */
export async function listDeviceFiles(deviceId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return []

        const { data, error } = await supabase
            .from('device_files')
            .select('*')
            .eq('device_id', deviceId)
            .eq('owner_user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('List files error:', error)
            return []
        }

        // Generate signed URLs for downloads (1 hour expiry)
        const serviceClient = createServiceRoleClient()
        const filesWithUrls = await Promise.all(
            (data || []).map(async (file) => {
                const { data: urlData } = await serviceClient.storage
                    .from('device-files')
                    .createSignedUrl(file.file_path, 3600)

                return {
                    ...file,
                    download_url: urlData?.signedUrl || null,
                }
            })
        )

        return filesWithUrls
    } catch (error) {
        console.error('List files error:', error)
        return []
    }
}

/**
 * Delete a file (both from storage and database)
 */
export async function deleteDeviceFile(fileId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get file metadata (with ownership verification)
        const { data: file, error: fetchError } = await supabase
            .from('device_files')
            .select('file_path, device_id')
            .eq('id', fileId)
            .eq('owner_user_id', user.id)
            .single()

        if (fetchError || !file) {
            return { success: false, error: 'File not found or access denied' }
        }

        // Delete from storage
        const serviceClient = createServiceRoleClient()
        const { error: storageError } = await serviceClient.storage
            .from('device-files')
            .remove([file.file_path])

        if (storageError) {
            console.error('Storage delete error:', storageError)
            // Continue anyway to clean up database
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from('device_files')
            .delete()
            .eq('id', fileId)
            .eq('owner_user_id', user.id)

        if (dbError) {
            return { success: false, error: 'Failed to delete file record' }
        }

        revalidatePath(`/devices/${file.device_id}`)
        return { success: true }
    } catch (error: any) {
        console.error('Delete file error:', error)
        return { success: false, error: error.message || 'Delete failed' }
    }
}
