'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signInSchema = z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
})

const signUpSchema = z.object({
    email: z.string().email('Ungültige E-Mail-Adresse'),
    password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'Vorname ist erforderlich'),
    lastName: z.string().min(1, 'Nachname ist erforderlich'),
    companyName: z.string().optional(),
    street: z.string().min(1, 'Straße ist erforderlich'),
    houseNumber: z.string().min(1, 'Hausnummer ist erforderlich'),
    postalCode: z.string().min(1, 'PLZ ist erforderlich'),
    city: z.string().min(1, 'Ort ist erforderlich'),
    country: z.string().min(1, 'Land ist erforderlich'),
    phone: z.string().min(1, 'Telefonnummer ist erforderlich'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
})

export async function signIn(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const validation = signInSchema.safeParse({ email, password })
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Ungültige E-Mail oder Passwort' }
    }

    redirect('/')
}

export async function signUp(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const companyName = (formData.get('companyName') as string) || ''
    const street = formData.get('street') as string
    const houseNumber = formData.get('houseNumber') as string
    const postalCode = formData.get('postalCode') as string
    const city = formData.get('city') as string
    const country = formData.get('country') as string
    const phone = formData.get('phone') as string

    const validation = signUpSchema.safeParse({
        email, password, confirmPassword,
        firstName, lastName, companyName,
        street, houseNumber, postalCode, city, country, phone,
    })
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Create company profile with the registration data
    if (authData.user) {
        try {
            const serviceClient = createServiceRoleClient()
            await serviceClient.from('company_profiles').upsert({
                user_id: authData.user.id,
                owner_name: `${firstName} ${lastName}`,
                company_name: companyName || null,
                street,
                house_number: houseNumber,
                postal_code: postalCode,
                city,
                country,
                phone,
                email,
            }, { onConflict: 'user_id' })
        } catch (profileError) {
            console.error('Failed to create company profile:', profileError)
            // Don't fail registration if profile creation fails
        }
    }

    redirect('/')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
