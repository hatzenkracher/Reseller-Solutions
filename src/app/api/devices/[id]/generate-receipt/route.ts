import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { generateEigenbeleg } from '@/lib/pdf/eigenbeleg'

export async function POST(
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

        // Parse request body for recipientName and reason
        const body = await request.json().catch(() => ({}))
        const recipientName = body.recipientName
        const reason = body.reason || ''

        if (!recipientName || recipientName.trim() === '') {
            return NextResponse.json(
                { error: 'Name des Empfängers ist erforderlich' },
                { status: 400 }
            )
        }

        // Fetch device
        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .select('*')
            .eq('id', deviceId)
            .eq('owner_user_id', user.id)
            .single()

        if (deviceError || !device) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 })
        }

        // Fetch company profile
        const { data: companyProfile } = await supabase
            .from('company_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!companyProfile) {
            return NextResponse.json(
                { error: 'Bitte hinterlege zuerst deine Firmendaten unter Einstellungen.' },
                { status: 400 }
            )
        }

        // Generate PDF with recipient name and reason
        const pdfBuffer = await generateEigenbeleg(device, companyProfile, {
            recipientName: recipientName.trim(),
            reason: reason.trim() || undefined,
        })

        // Generate structured filename: Eigenbeleg_DeviceID_Date.pdf
        const today = new Date().toISOString().slice(0, 10)
        const fileName = `Eigenbeleg_${deviceId}_${today}.pdf`

        // Generate folder path: {user_id}/{YYYY-MM}/{device_id}/
        const purchaseDate = new Date(device.purchase_date)
        const yearMonth = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`
        const filePath = `${user.id}/${yearMonth}/${deviceId}/${fileName}`

        // Upload PDF to Storage
        const serviceClient = createServiceRoleClient()
        const { error: uploadError } = await serviceClient
            .storage
            .from('device-files')
            .upload(filePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({ error: 'Failed to save PDF' }, { status: 500 })
        }

        // Check if a file record already exists for this device with EIGENBELEG category
        const { data: existingFile } = await supabase
            .from('device_files')
            .select('id')
            .eq('device_id', deviceId)
            .eq('owner_user_id', user.id)
            .eq('category', 'EIGENBELEG')
            .maybeSingle()

        if (existingFile) {
            // Update existing record
            await supabase
                .from('device_files')
                .update({
                    file_name: fileName,
                    file_path: filePath,
                    file_size: pdfBuffer.length,
                    file_type: 'application/pdf',
                })
                .eq('id', existingFile.id)
        } else {
            // Insert new record
            const { error: dbError } = await supabase
                .from('device_files')
                .insert({
                    device_id: deviceId,
                    owner_user_id: user.id,
                    file_name: fileName,
                    file_path: filePath,
                    file_size: pdfBuffer.length,
                    file_type: 'application/pdf',
                    category: 'EIGENBELEG',
                })

            if (dbError) {
                console.error('Database error:', dbError)
            }
        }

        return NextResponse.json({ success: true, filePath, fileName })
    } catch (error) {
        console.error('Generate receipt error:', error)
        return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 })
    }
}
