"use client"

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Search, Calendar, X, Download } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { exportDevicesToExcel } from "@/app/(protected)/actions";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from 'date-fns';

const MONTHS = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

interface Device {
    id: string;
    model: string;
    storage: string;
    color: string;
    condition: string;
    status: string;
    purchase_price: number;
    purchase_date: string;
}

interface DeviceListProps {
    devices: Device[];
}

export function DeviceList({ devices }: DeviceListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || "");
    const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || "");
    const [dateType, setDateType] = useState<'created_at' | 'sale_date' | 'purchase_date'>(
        (searchParams.get('dateType') as 'created_at' | 'sale_date' | 'purchase_date') || 'purchase_date'
    );
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const updateFilters = (newDateFrom?: string, newDateTo?: string, newDateType?: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newDateFrom) {
            params.set('dateFrom', newDateFrom);
        } else {
            params.delete('dateFrom');
        }

        if (newDateTo) {
            params.set('dateTo', newDateTo);
        } else {
            params.delete('dateTo');
        }

        if (newDateType && newDateType !== 'purchase_date') {
            params.set('dateType', newDateType);
        } else {
            params.delete('dateType');
        }

        router.push(`/devices?${params.toString()}`);
    };

    const handleDateFromChange = (value: string) => {
        setDateFrom(value);
        updateFilters(value, dateTo, dateType);
    };

    const handleDateToChange = (value: string) => {
        setDateTo(value);
        updateFilters(dateFrom, value, dateType);
    };

    const handleDateTypeChange = (value: 'created_at' | 'sale_date' | 'purchase_date') => {
        setDateType(value);
        updateFilters(dateFrom, dateTo, value);
    };

    const setMonthFilter = (monthIndex: number, year: number = selectedYear) => {
        const date = new Date(year, monthIndex, 1);
        const from = format(startOfMonth(date), 'yyyy-MM-dd');
        const to = format(endOfMonth(date), 'yyyy-MM-dd');
        setDateFrom(from);
        setDateTo(to);
        updateFilters(from, to, dateType);
    };

    const setYearFilter = (year: number) => {
        setSelectedYear(year);
        const date = new Date(year, 0, 1);
        const from = format(startOfYear(date), 'yyyy-MM-dd');
        const to = format(endOfYear(date), 'yyyy-MM-dd');
        setDateFrom(from);
        setDateTo(to);
        updateFilters(from, to, dateType);
    };

    const setQuickFilter = (type: 'thisMonth' | 'lastMonth' | 'thisYear') => {
        const now = new Date();
        let from, to;

        switch (type) {
            case 'thisMonth':
                from = format(startOfMonth(now), 'yyyy-MM-dd');
                to = format(endOfMonth(now), 'yyyy-MM-dd');
                break;
            case 'lastMonth':
                const lastMonth = subMonths(now, 1);
                from = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
                to = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
                break;
            case 'thisYear':
                from = format(startOfYear(now), 'yyyy-MM-dd');
                to = format(endOfYear(now), 'yyyy-MM-dd');
                break;
        }

        setDateFrom(from);
        setDateTo(to);
        updateFilters(from, to, dateType);
    };

    const resetFilters = () => {
        setDateFrom("");
        setDateTo("");
        setDateType('purchase_date');
        router.push('/devices');
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await exportDevicesToExcel({
                dateFrom,
                dateTo,
                dateType
            });

            if (result.success && result.data && result.filename) {
                // Convert base64 to blob and trigger download
                const byteCharacters = atob(result.data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                // Create download link
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = result.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast.success('Geräte erfolgreich exportiert!');
            } else {
                toast.error(result.error || 'Export fehlgeschlagen');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Ein Fehler ist beim Export aufgetreten');
        } finally {
            setIsExporting(false);
        }
    };

    const filteredDevices = devices.filter((device) => {
        // Status filter
        if (statusFilter !== "ALL" && device.status !== statusFilter) {
            return false;
        }

        // Search query filter
        const query = searchQuery.toLowerCase();
        return (
            device.id.toLowerCase().includes(query) ||
            device.model.toLowerCase().includes(query) ||
            device.color.toLowerCase().includes(query) ||
            device.status.toLowerCase().includes(query) ||
            device.storage.toLowerCase().includes(query)
        );
    });

    const hasActiveFilters = dateFrom || dateTo;

    return (
        <div className="space-y-3">
            {/* Date Filters */}
            <div className="rounded-lg border border-border/60 bg-card shadow-sm p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-semibold text-foreground">Datumsfilter</h3>
                </div>

                {/* Month Quick Selection */}
                <div className="mb-2 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <div className="space-y-1">
                            <label htmlFor="monthSelector" className="text-[10px] font-medium text-muted-foreground">
                                Monat wählen
                            </label>
                            <Select onValueChange={(value) => setMonthFilter(parseInt(value))}>
                                <SelectTrigger id="monthSelector" className="bg-background/50 border-border/60">
                                    <SelectValue placeholder="Monat auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((month, index) => (
                                        <SelectItem key={index} value={index.toString()}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="yearSelector" className="text-[10px] font-medium text-muted-foreground">
                                Jahr wählen
                            </label>
                            <Select value={selectedYear.toString()} onValueChange={(value) => setYearFilter(parseInt(value))}>
                                <SelectTrigger id="yearSelector" className="bg-background/50 border-border/60">
                                    <SelectValue placeholder="Jahr auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground">Schnellauswahl</label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQuickFilter('thisMonth')}
                                className="w-full border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                            >
                                Dieser Monat
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-transparent">-</label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQuickFilter('lastMonth')}
                                className="w-full border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                            >
                                Letzter Monat
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-transparent">-</label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setQuickFilter('thisYear')}
                                className="w-full border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                            >
                                Dieses Jahr
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Date Range Inputs */}

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <div className="space-y-1">
                        <label htmlFor="dateFrom" className="text-[10px] font-medium text-muted-foreground">
                            Von
                        </label>
                        <Input
                            id="dateFrom"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => handleDateFromChange(e.target.value)}
                            className="bg-background/50 border-border/60"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="dateTo" className="text-[10px] font-medium text-muted-foreground">
                            Bis
                        </label>
                        <Input
                            id="dateTo"
                            type="date"
                            value={dateTo}
                            onChange={(e) => handleDateToChange(e.target.value)}
                            className="bg-background/50 border-border/60"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="dateType" className="text-[10px] font-medium text-muted-foreground">
                            Datumstyp
                        </label>
                        <Select value={dateType} onValueChange={handleDateTypeChange}>
                            <SelectTrigger id="dateType" className="bg-background/50 border-border/60">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="purchase_date">Einkaufsdatum</SelectItem>
                                <SelectItem value="created_at">Erstellungsdatum</SelectItem>
                                <SelectItem value="sale_date">Verkaufsdatum</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-transparent">Action</label>
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={!hasActiveFilters || isExporting}
                            className="w-full border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {isExporting ? 'Exportiere...' : 'Excel exportieren'}
                        </Button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-transparent">Reset</label>
                        <Button
                            variant="outline"
                            onClick={resetFilters}
                            disabled={!hasActiveFilters}
                            className="w-full border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Zurücksetzen
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search + Status Filter */}
            <div className="rounded-lg border border-border/60 bg-card shadow-sm p-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Suche nach ID, Modell, Farbe, Status..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background/50 border-border/60"
                        />
                    </div>
                    <div className="w-[200px]">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-background/50 border-border/60">
                                <SelectValue placeholder="Status filtern" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Alle Status</SelectItem>
                                <SelectItem value="SOLD">Sold</SelectItem>
                                <SelectItem value="STOCK">Stock</SelectItem>
                                <SelectItem value="REPAIR">Repair</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Device Table */}
            <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-muted/50 text-sm border-b border-border/60">
                            <TableHead className="font-semibold text-muted-foreground px-2">ID</TableHead>
                            <TableHead className="font-semibold text-muted-foreground px-2">Modell</TableHead>
                            <TableHead className="font-semibold text-muted-foreground px-2">Speicher</TableHead>
                            <TableHead className="font-semibold text-muted-foreground px-2">Zustand</TableHead>
                            <TableHead className="font-semibold text-muted-foreground px-2">Status</TableHead>
                            <TableHead className="font-semibold text-muted-foreground px-2">Einkaufspreis</TableHead>
                            <TableHead className="font-semibold text-muted-foreground px-2">Einkaufsdatum</TableHead>
                            <TableHead className="text-right font-semibold text-muted-foreground px-2">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDevices.map((device) => (
                            <TableRow key={device.id} className="hover:bg-muted/50 text-sm">
                                <TableCell className="font-medium text-foreground px-2">
                                    <Link href={`/devices/${device.id}`} className="hover:underline text-primary">
                                        {device.id}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground px-2">{device.model}</TableCell>
                                <TableCell className="text-muted-foreground px-2">{device.storage}</TableCell>
                                <TableCell className="px-2">
                                    <Badge variant="outline" className="text-xs bg-background/50 border-border/60">{device.condition}</Badge>
                                </TableCell>
                                <TableCell className="px-2">
                                    <Badge
                                        className={`text-xs px-2 py-0.5 border-0 ${device.status === "SOLD"
                                            ? "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25"
                                            : device.status === "REPAIR"
                                                ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25"
                                                : "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                                            }`}
                                    >
                                        {device.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="px-2">{formatCurrency(device.purchase_price)}</TableCell>
                                <TableCell className="text-muted-foreground px-2">{formatDate(device.purchase_date)}</TableCell>
                                <TableCell className="text-right px-2">
                                    <Link href={`/devices/${device.id}`}>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary">
                                            <span className="sr-only">Details</span>
                                            <div className="h-4 w-4 rotate-90 scale-0 transition-all md:rotate-0 md:scale-100">➤</div>
                                            Details
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredDevices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                    {searchQuery ? "Keine Geräte gefunden, die deiner Suche entsprechen." : "Keine Geräte gefunden."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
