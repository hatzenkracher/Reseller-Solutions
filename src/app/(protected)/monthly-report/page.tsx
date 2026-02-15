import { MonthSelector } from "@/components/month-selector";
import { getMonthlyReport } from "./actions"; // Import from same folder's actions
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateDeviceFinancials } from "@/lib/calculations";

interface MonthlyReportPageProps {
    searchParams: Promise<{ month?: string }>;
}

export default async function MonthlyReportPage({ searchParams }: MonthlyReportPageProps) {
    const { month } = await searchParams;
    const currentMonth_ = month || new Date().toISOString().slice(0, 7);

    // Fetch data with null handling
    const data = await getMonthlyReport(currentMonth_);
    const kpis = data?.kpis || {
        soldCount: 0,
        stockCount: 0,
        repairCount: 0,
        totalRevenue: 0,
        totalPurchaseCost: 0,
        totalRepairCost: 0,
        totalShippingCost: 0,
        totalSalesFees: 0,
        totalTaxableMargin: 0,
        totalActualProfit: 0,
        totalGrossProfit: 0,
        totalVat: 0,
        totalNetProfit: 0,
    };
    const devices = data?.devices || [];

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Monatsübersicht</h1>
                <MonthSelector />
            </div>

            {/* KPIs Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verkäufe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.soldCount}</div>
                        <p className="text-xs text-muted-foreground">Geräte diesen Monat</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Umsatz</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">Gesamtverkaufspreis</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tatsächl. Gewinn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis.totalActualProfit)}</div>
                        <p className="text-xs text-muted-foreground">Nach allen Kosten (Buchhaltung)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Netto-Gewinn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.totalNetProfit)}</div>
                        <p className="text-xs text-muted-foreground">Nach MwSt-Abzug</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed KPI Row 2 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Steuern (MwSt)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpis.totalVat)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Einkaufskosten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpis.totalPurchaseCost)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verkaufsgebühren</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpis.totalSalesFees)}</div>
                        <p className="text-xs text-muted-foreground">eBay, Kleinanzeigen etc.</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Differenzbetrag (§25a)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-500">{formatCurrency(kpis.totalTaxableMargin)}</div>
                        <p className="text-xs text-muted-foreground">Steuerpflichtige Marge</p>
                    </CardContent>
                </Card>
            </div>

            {/* Device List */}
            <Card>
                <CardHeader>
                    <CardTitle>Verkaufte Geräte ({currentMonth_})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Modell</TableHead>
                                <TableHead>Einkauf</TableHead>
                                <TableHead>Verkauf</TableHead>
                                <TableHead>Gewinn (Netto)</TableHead>
                                <TableHead>Steuerart</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {devices.map((device) => {
                                const fin = calculateDeviceFinancials(device);
                                return (
                                    <TableRow key={device.id}>
                                        <TableCell className="font-medium">{device.model} ({device.storage})</TableCell>
                                        <TableCell>{formatCurrency(device.purchase_price || device.purchasePrice)}</TableCell>
                                        <TableCell>{formatCurrency(device.sale_price || device.salePrice || 0)}</TableCell>
                                        <TableCell className="font-bold text-green-700">{formatCurrency(fin.netProfit)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{(device.is_diff_tax ?? device.isDiffTax ?? true) ? "Diff. Best." : "Regelbesteuerung"}</Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {devices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Keine Verkäufe in diesem Monat.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
