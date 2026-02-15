import { getDevices, DeviceFilters } from "../actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DeviceList } from "@/components/device-list";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface DevicesPageProps {
    searchParams: Promise<{
        dateFrom?: string;
        dateTo?: string;
        dateType?: 'created_at' | 'sale_date';
    }>;
}

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
    const params = await searchParams;

    // Default to current month if no filters set
    const now = new Date();
    const defaultDateFrom = format(startOfMonth(now), 'yyyy-MM-dd');
    const defaultDateTo = format(endOfMonth(now), 'yyyy-MM-dd');

    const filters: DeviceFilters = {
        dateFrom: params.dateFrom || defaultDateFrom,
        dateTo: params.dateTo || defaultDateTo,
        dateType: params.dateType,
    };

    const devices = await getDevices(filters);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Geräteverwaltung</h1>
                    <p className="text-muted-foreground mt-1">Verwalte deinen Lagerbestand und Verkäufe.</p>
                </div>
                <Link href="/devices/new">
                    <Button className="shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Neues Gerät
                    </Button>
                </Link>
            </div>

            <DeviceList devices={devices} />
        </div>
    );
}
