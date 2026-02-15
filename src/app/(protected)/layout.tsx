import { AppSidebar } from "@/components/app-sidebar";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <AppSidebar />
            <main className="flex-1 ml-64 p-8 transition-all duration-300 ease-in-out">
                {children}
            </main>
        </div>
    );
}
