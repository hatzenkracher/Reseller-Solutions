'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCompanyProfile() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('company_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No profile exists yet
                return null
            }
            console.error('Failed to fetch company profile:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Failed to fetch company profile:', error)
        return null
    }
}

// Alias for page.tsx compatibility
export async function getCompanySettings() {
    const settings = await getCompanyProfile()
    return { settings }
}

export async function upsertCompanyProfile(data: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const profileData = {
            user_id: user.id,
            company_name: data.companyName,
            owner_name: data.ownerName,
            street: data.street,
            house_number: data.houseNumber,
            postal_code: data.postalCode,
            city: data.city,
            country: data.country || 'Deutschland',
            vat_id: data.vatId || null,
            tax_id: data.taxId || null,
            email: data.email,
            phone: data.phone || null,
        }

        const { data: profile, error } = await supabase
            .from('company_profiles')
            .upsert(profileData, { onConflict: 'user_id' })
            .select()
            .single()

        if (error) {
            console.error('Failed to save company profile:', error)
            return { success: false, error: 'Failed to save profile' }
        }

        revalidatePath('/company-settings')
        return { success: true, profile }
    } catch (error) {
        console.error('Failed to save company profile:', error)
        return { success: false, error: 'Failed to save profile' }
    }
}

export async function uploadCompanyLogo(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const file = formData.get('logo') as File
        if (!file) {
            return { success: false, error: 'No file provided' }
        }

        const filePath = `${user.id}/company/logo.png`

        // Upload to storage
        const serviceClient = createServiceRoleClient()
        const { error: uploadError } = await serviceClient
            .storage
            .from('device-files')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { success: false, error: 'Failed to upload logo' }
        }

        // Get public URL
        const { data: urlData } = serviceClient
            .storage
            .from('device-files')
            .getPublicUrl(filePath)

        // Update company profile with logo URL
        const { error } = await supabase
            .from('company_profiles')
            .update({ logo_url: urlData.publicUrl })
            .eq('user_id', user.id)

        if (error) {
            return { success: false, error: 'Failed to update profile' }
        }

        revalidatePath('/company-settings')
        return { success: true, logoUrl: urlData.publicUrl, logoPath: urlData.publicUrl }
    } catch (error) {
        console.error('Failed to upload logo:', error)
        return { success: false, error: 'Upload failed' }
    }
}

// Alias for existing function to match form expectations
export async function saveCompanySettings(data: any) {
    return await upsertCompanyProfile(data)
}

// Alias for existing function to match form expectations
export async function uploadLogo(formData: FormData) {
    return await uploadCompanyLogo(formData)
}

// Delete logo function
export async function deleteLogo() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        // Get current profile to find logo path
        const { data: profile } = await supabase
            .from('company_profiles')
            .select('logo_url')
            .eq('user_id', user.id)
            .single()

        if (profile?.logo_url) {
            // Delete from storage
            const filePath = `${user.id}/company/logo.png`
            const serviceClient = createServiceRoleClient()
            await serviceClient.storage.from('device-files').remove([filePath])
        }

        // Update profile to remove logo URL
        const { error } = await supabase
            .from('company_profiles')
            .update({ logo_url: null })
            .eq('user_id', user.id)

        if (error) {
            return { success: false, error: 'Failed to delete logo' }
        }

        revalidatePath('/company-settings')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete logo:', error)
        return { success: false, error: 'Delete failed' }
    }
}
