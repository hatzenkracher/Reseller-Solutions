import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: deviceId } = await params

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch device (with owner verification via RLS)
        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .select('*')
            .eq('id', deviceId)
            .eq('owner_user_id', user.id)
            .single()

        if (deviceError || !device) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 })
        }

        // Fetch files for this device
        const { data: files } = await supabase
            .from('device_files')
            .select('*')
            .eq('device_id', deviceId)
            .eq('owner_user_id', user.id)

        // Create ZIP
        const zip = new JSZip()

        // Add device metadata JSON
        const deviceMetadata = {
            id: device.id,
            model: device.model,
            storage: device.storage,
            color: device.color,
            condition: device.condition,
            status: device.status,
            purchase_date: device.purchase_date,
            purchase_price: device.purchase_price,
            sale_date: device.sale_date,
            sale_price: device.sale_price,
            seller_name: device.seller_name,
            created_at: device.created_at,
        }
        zip.file('device.json', JSON.stringify(deviceMetadata, null, 2))

        // Add files to ZIP
        if (files && files.length > 0) {
            const serviceClient = await createServiceRoleClient()

            for (const file of files) {
                try {
                    const { data: fileData, error } = await serviceClient
                        .storage
                        .from('device-files')
                        .download(file.file_path)

                    if (error) {
                        console.error(`Error downloading file ${file.file_name}:`, error)
                        continue
                    }

                    if (fileData) {
                        // Convert Blob to ArrayBuffer for JSZip
                        const arrayBuffer = await fileData.arrayBuffer()
                        zip.file(file.file_name, arrayBuffer)
                    }
                } catch (error) {
                    console.error(`Failed to download file: ${file.file_name}`, error)
                    // Continue with next file even if one fails
                }
            }
        }

        // Generate ZIP as Uint8Array (works in Node.js environment)
        const zipBlob = await zip.generateAsync({ type: 'uint8array' })

        // Return ZIP as download
        return new NextResponse(Buffer.from(zipBlob) as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${deviceId}_export.zip"`,
            },
        })
    } catch (error) {
        console.error('ZIP export error:', error)
        return NextResponse.json({
            error: 'Export failed',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
