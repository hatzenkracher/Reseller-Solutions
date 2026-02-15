import { getCompanySettings } from "./actions";
import { CompanySettingsForm } from "@/components/company-settings-form";

export default async function CompanySettingsPage() {
    const { settings } = await getCompanySettings();

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
