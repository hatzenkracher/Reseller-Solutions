import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let companyName = "";
    let userEmail = user?.email || "";

    if (user) {
        const { data: profile } = await supabase
            .from("company_profiles")
            .select("company_name")
            .eq("user_id", user.id)
            .single();

        companyName = profile?.company_name || "";
    }

    return (
        <div className="flex min-h-screen">
            <AppSidebar companyName={companyName} userEmail={userEmail} />
            <main className="flex-1 ml-64 p-8 transition-all duration-300 ease-in-out">
                {children}
            </main>
        </div>
    );
}
