'use client'

import { useState } from 'react'
import { signUp } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await signUp(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Account erstellen</CardTitle>
                    <CardDescription className="text-center">
                        Erstellen Sie einen neuen Account
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}

                        {/* Persönliche Daten */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Persönliche Daten</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Vorname *</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        placeholder="Max"
                                        required
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nachname *</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        placeholder="Mustermann"
                                        required
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Firmenname <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <Input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    placeholder="Muster GmbH"
                                    autoComplete="organization"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefonnummer *</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+49 123 4567890"
                                    required
                                    autoComplete="tel"
                                />
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adresse</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="street">Straße *</Label>
                                    <Input
                                        id="street"
                                        name="street"
                                        type="text"
                                        placeholder="Musterstraße"
                                        required
                                        autoComplete="address-line1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="houseNumber">Nr. *</Label>
                                    <Input
                                        id="houseNumber"
                                        name="houseNumber"
                                        type="text"
                                        placeholder="42"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="postalCode">PLZ *</Label>
                                    <Input
                                        id="postalCode"
                                        name="postalCode"
                                        type="text"
                                        placeholder="12345"
                                        required
                                        autoComplete="postal-code"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="city">Ort *</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        type="text"
                                        placeholder="Berlin"
                                        required
                                        autoComplete="address-level2"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Land *</Label>
                                <Input
                                    id="country"
                                    name="country"
                                    type="text"
                                    defaultValue="Deutschland"
                                    required
                                    autoComplete="country-name"
                                />
                            </div>
                        </div>

                        {/* Account-Daten */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h3>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="ihre@email.de"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Passwort *</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Passwort wiederholen *</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Account wird erstellt...' : 'Account erstellen'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Bereits einen Account?{' '}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Anmelden
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

