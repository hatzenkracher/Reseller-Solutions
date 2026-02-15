"use client"

import React from "react"
import { motion } from "framer-motion"
import { FileText, Smartphone } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Purchase } from "@/lib/types"

interface PurchaseListProps {
    purchases: Purchase[]
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
}

export function PurchaseList({ purchases }: PurchaseListProps) {
    if (purchases.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                Noch keine Ankäufe vorhanden.
            </div>
        )
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
            {purchases.map((purchase) => (
                <motion.div key={purchase.id} variants={item}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-muted/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
                            <CardTitle className="text-sm font-medium">
                                {purchase.model}
                            </CardTitle>
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-amber-600">
                                {purchase.price.toFixed(2)} €
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {purchase.storage} • {purchase.condition}
                            </p>

                            <div className="mt-4 flex items-center justify-between text-xs">
                                <span className={purchase.is_diff_taxed ? "text-green-600" : "text-gray-500"}>
                                    {purchase.is_diff_taxed ? "Differenzbesteuert" : "Regelbesteuert"}
                                </span>

                                {purchase.receipt_path && (
                                    <a
                                        href={purchase.receipt_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-blue-500 hover:underline"
                                    >
                                        <FileText className="h-3 w-3 mr-1" />
                                        Beleg
                                    </a>
                                )}
                            </div>

                            <div className="text-[10px] text-muted-foreground mt-2 text-right">
                                {new Date(purchase.created_at).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    )
}
