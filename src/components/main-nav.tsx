import Link from "next/link"

import { cn } from "@/lib/utils"

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            <Link
                href="/"
                className="text-sm font-medium transition-colors hover:text-primary"
            >
                Dashboard
            </Link>
            <Link
                href="/devices"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Geräte
            </Link>
            <Link
                href="/monthly-report"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
                Monatsbericht
            </Link>
        </nav>
    )
}
