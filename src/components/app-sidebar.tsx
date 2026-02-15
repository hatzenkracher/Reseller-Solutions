"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Smartphone, FileText, Settings, BarChart3, LogOut, Building2 } from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Geräte",
        href: "/devices",
        icon: Smartphone,
    },
    {
        title: "Monatsbericht",
        href: "/monthly-report",
        icon: FileText,
    },
    {
        title: "Firmendaten",
        href: "/company-settings",
        icon: Building2,
    },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-screen w-64 bg-card border-r border-border/40 fixed left-0 top-0 z-40">
            <div className="p-6 border-b border-border/40">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Reseller
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Management System</p>
            </div>

            <div className="flex-1 py-6 px-3 space-y-1">
                {sidebarItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                            pathname === item.href
                                ? "bg-primary/10 text-primary shadow-sm"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        {item.title}
                    </Link>
                ))}
            </div>

            <div className="p-6 border-t border-border/40 space-y-3">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {typeof window !== 'undefined' && localStorage.getItem('user_email')?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">
                            {typeof window !== 'undefined' && localStorage.getItem('user_email') || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">Account</p>
                    </div>
                </div>
                <form action="/api/auth/signout" method="POST" className="w-full">
                    <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 group"
                    >
                        <LogOut className="h-4 w-4" />
                        Abmelden
                    </button>
                </form>
            </div>
        </div>
    )
}
