import { getCompanySettings } from "./actions";
import { CompanySettingsForm } from "@/components/company-settings-form";

export default async function CompanySettingsPage() {
    const { settings: rawSettings } = await getCompanySettings();

    // Map snake_case DB fields to camelCase form fields
    const settings = rawSettings ? {
        companyName: rawSettings.company_name || "",
        ownerName: rawSettings.owner_name || "",
        street: rawSettings.street || "",
        houseNumber: rawSettings.house_number || "",
        postalCode: rawSettings.postal_code || "",
        city: rawSettings.city || "",
        country: rawSettings.country || "Deutschland",
        vatId: rawSettings.vat_id || "",
        taxId: rawSettings.tax_id || "",
        email: rawSettings.email || "",
        phone: rawSettings.phone || "",
        logoPath: rawSettings.logo_url || null,
    } : null;

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Firmendaten</h1>
                <p className="text-muted-foreground mt-1">Verwalte deine Unternehmensinformationen</p>
            </div>

            <CompanySettingsForm settings={settings} />
        </div>
    );
}

