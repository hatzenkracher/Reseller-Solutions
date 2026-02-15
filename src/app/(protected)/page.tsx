import { getMonthlyReport } from "./monthly-report/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Package, Hammer } from "lucide-react";
import { getDevices } from "./actions";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const reportData = await getMonthlyReport(currentMonth);

  // Handle null/empty state
  const kpis = reportData?.kpis || {
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

  const recentDevices = (await getDevices()).slice(0, 5); // Get last 5 devices

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Überblick für {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="space-x-4">
          <Link href="/devices/new">
            <Button>Neues Gerät erfassen</Button>
          </Link>
          <Link href="/monthly-report">
            <Button variant="outline">Zum Monatsbericht</Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verkäufe (Monat)</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.soldCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lagerbestand</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.stockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Reparatur</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.repairCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monats-Gewinn</CardTitle>
            <span className="text-xs text-muted-foreground">Netto</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(kpis.totalNetProfit)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Neueste Geräte</CardTitle>
            <CardDescription>
              Die letzten 5 erfassten Geräte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDevices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Geräte erfasst.</p>
              ) : (
                recentDevices.map(device => (
                  <div key={device.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{device.model}</p>
                        <p className="text-sm text-muted-foreground">{device.storage} • {device.color}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={device.status === 'SOLD' ? 'default' : device.status === 'REPAIR' ? 'destructive' : 'secondary'}>
                        {device.status}
                      </Badge>
                      <div className="font-medium">{formatCurrency(device.purchase_price)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions Shortcut */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/devices" className="block p-4 border rounded hover:bg-muted transition-colors">
              <h3 className="font-semibold">Geräteverwaltung</h3>
              <p className="text-sm text-muted-foreground">Alle Geräte anzeigen, filtern und bearbeiten.</p>
            </Link>
            <Link href="/monthly-report" className="block p-4 border rounded hover:bg-muted transition-colors">
              <h3 className="font-semibold">Monatsbericht</h3>
              <p className="text-sm text-muted-foreground">Detaillierte Auswertung und Buchhaltungsexport.</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
