"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { saveCompanySettings, uploadLogo, deleteLogo } from "@/app/(protected)/company-settings/actions"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { Upload, X, Building2 } from "lucide-react"
import Image from "next/image"

const formSchema = z.object({
    companyName: z.string().min(1, "Firmenname ist erforderlich"),
    ownerName: z.string().min(1, "Inhabername ist erforderlich"),
    street: z.string().min(1, "Straße ist erforderlich"),
    houseNumber: z.string().min(1, "Hausnummer ist erforderlich"),
    postalCode: z.string().min(1, "PLZ ist erforderlich"),
    city: z.string().min(1, "Ort ist erforderlich"),
    country: z.string().min(1, "Land ist erforderlich"),
    vatId: z.string().optional(),
    taxId: z.string().optional(),
    email: z.string().email("Ungültige E-Mail-Adresse"),
    phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanySettingsFormProps {
    settings?: any;
}

export function CompanySettingsForm({ settings }: CompanySettingsFormProps) {
    const router = useRouter();
    const [logoPath, setLogoPath] = useState(settings?.logoPath || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: settings?.companyName || "",
            ownerName: settings?.ownerName || "",
            street: settings?.street || "",
            houseNumber: settings?.houseNumber || "",
            postalCode: settings?.postalCode || "",
            city: settings?.city || "",
            country: settings?.country || "Deutschland",
            vatId: settings?.vatId || "",
            taxId: settings?.taxId || "",
            email: settings?.email || "",
            phone: settings?.phone || "",
        },
    });

    async function onSubmit(values: FormValues) {
        try {
            const res = await saveCompanySettings(values);
            if (res.success) {
                toast.success("Firmendaten gespeichert");
                router.refresh();
            } else {
                toast.error("Fehler beim Speichern: " + res.error);
            }
        } catch (e) {
            toast.error("Ein unerwarteter Fehler ist aufgetreten");
        }
    }

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("logo", file);

            const res = await uploadLogo(formData);
            if (res.success) {
                setLogoPath(res.logoPath);
                toast.success("Logo hochgeladen");
                router.refresh();
            } else {
                toast.error("Fehler beim Hochladen: " + res.error);
            }
        } catch (e) {
            toast.error("Ein unerwarteter Fehler ist aufgetreten");
        } finally {
            setUploading(false);
        }
    }

    async function handleLogoDelete() {
        if (!confirm("Möchten Sie das Logo wirklich löschen?")) return;

        try {
            const res = await deleteLogo();
            if (res.success) {
                setLogoPath(null);
                toast.success("Logo gelöscht");
                router.refresh();
            } else {
                toast.error("Fehler beim Löschen: " + res.error);
            }
        } catch (e) {
            toast.error("Ein unerwarteter Fehler ist aufgetreten");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Company Info */}
                <div className="space-y-4 border p-6 rounded-lg bg-card shadow-sm">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Unternehmensdaten
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Firmenname *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="z.B. Musterfirma GmbH" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ownerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Inhaber/in *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Max Mustermann" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Address */}
                <div className="space-y-4 border p-6 rounded-lg bg-card shadow-sm">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">Adresse</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Straße *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Musterstraße" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="houseNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hausnummer *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>PLZ *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="12345" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ort *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Musterstadt" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Land</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Deutschland" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Tax Info */}
                <div className="space-y-4 border p-6 rounded-lg bg-card shadow-sm">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">Steuerinformationen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="vatId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Umsatzsteuer-ID (USt-IdNr.)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="DE123456789" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="taxId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Steuer-ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="12 345 678 901" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Contact */}
                <div className="space-y-4 border p-6 rounded-lg bg-card shadow-sm">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">Kontakt</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-Mail *</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="info@firma.de" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefon (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+49 123 456789" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-4 border p-6 rounded-lg bg-card shadow-sm">
                    <h3 className="font-semibold text-lg border-b pb-2 mb-4">Firmenlogo</h3>
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                            {logoPath ? (
                                <div className="relative w-32 h-32 border-2 border-border rounded-lg overflow-hidden bg-muted/30">
                                    <Image
                                        src={logoPath}
                                        alt="Company Logo"
                                        fill
                                        className="object-contain p-2"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
                                    <Building2 className="h-12 w-12 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Laden Sie Ihr Firmenlogo hoch. Unterstützte Formate: PNG, JPG, SVG (max. 2MB)
                            </p>
                            <div className="flex gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploading ? "Wird hochgeladen..." : "Logo hochladen"}
                                </Button>
                                {logoPath && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleLogoDelete}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Löschen
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" className="min-w-[200px]">
                        Speichern
                    </Button>
                </div>
            </form>
        </Form>
    );
}
