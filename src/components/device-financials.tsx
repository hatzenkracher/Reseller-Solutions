"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/formatters"
import { Separator } from "@/components/ui/separator"
import { calculateDeviceFinancials } from "@/lib/calculations"

interface DeviceFinancialsProps {
    purchasePrice: number;
    repairCost: number;
    shippingBuy: number;
    shippingSell: number;
    salePrice: number;
    salesFees: number;
    isDiffTax: boolean;
    status: string;
}

export function DeviceFinancials({
    purchasePrice,
    repairCost,
    shippingBuy,
    shippingSell,
    salePrice,
    salesFees,
    isDiffTax,
    status
}: DeviceFinancialsProps) {

    // Use the correct calculation function
    const device = {
        purchasePrice,
        repairCost,
        shippingBuy,
        shippingSell,
        salePrice,
        salesFees,
        isDiffTax,
        status
    } as any;

    const financials = calculateDeviceFinancials(device);

    return (
        <Card className="mt-8 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg text-primary">Geräte-Abrechnung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Costs Column */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-muted-foreground text-sm">Ausgaben</h4>
                        <div className="flex justify-between text-sm">
                            <span>Einkaufspreis</span>
                            <span>{formatCurrency(purchasePrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>+ Reparatur</span>
                            <span>{formatCurrency(repairCost)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>+ Versand (Einkauf)</span>
                            <span>{formatCurrency(shippingBuy)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>+ Versand (Verkauf)</span>
                            <span>{formatCurrency(shippingSell)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>+ Verkaufsgebühren</span>
                            <span>{formatCurrency(salesFees)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                            <span>= Gesamtkosten</span>
                            <span className="text-destructive">{formatCurrency(financials.totalCosts)}</span>
                        </div>
                    </div>

                    {/* Revenue Column */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-muted-foreground text-sm">Einnahmen</h4>
                        <div className="flex justify-between text-sm">
                            <span>Verkaufspreis</span>
                            <span>{formatCurrency(salePrice)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                            <span>= Umsatz</span>
                            <span className="text-green-600">{formatCurrency(salePrice)}</span>
                        </div>
                    </div>
                </div>

                <Separator className="my-4 bg-primary/20" />

                {/* Differential Taxation Breakdown */}
                {status === 'SOLD' && isDiffTax && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg space-y-2 border border-amber-200 dark:border-amber-800">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-amber-900 dark:text-amber-300">Differenzbesteuerung (§25a UStG)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Marge (Verkauf - Einkauf)</span>
                            <span className="font-medium">{formatCurrency(financials.taxableMargin)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">MwSt auf Marge (× 19/119)</span>
                            <span className="font-medium text-amber-700 dark:text-amber-500">-{formatCurrency(financials.vat)}</span>
                        </div>
                    </div>
                )}

                {/* Final Result */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Tatsächl. Gewinn (vor Steuer)</span>
                        <span className="text-lg">{formatCurrency(financials.actualProfit)}</span>
                    </div>
                    {status === 'SOLD' && !isDiffTax && (
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Regelbesteuerung (19% auf Umsatz)</span>
                            <span>-{formatCurrency(financials.vat)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xl font-bold mt-2 p-3 bg-primary/10 rounded-lg">
                        <span className="text-primary">Reingewinn (nach Steuer)</span>
                        <span className={financials.netProfit >= 0 ? "text-green-600" : "text-destructive"}>
                            {formatCurrency(financials.netProfit)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
