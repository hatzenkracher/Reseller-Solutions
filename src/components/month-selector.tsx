"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const MONTHS = [
    { value: "01", label: "Januar" },
    { value: "02", label: "Februar" },
    { value: "03", label: "März" },
    { value: "04", label: "April" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Dezember" },
];

export function MonthSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const [currentYear, currentMonthNum] = currentMonth.split("-");

    const currentYearNum = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => String(currentYearNum - 2 + i));

    const handleMonthChange = (newMonthNum: string) => {
        router.push(`/monthly-report?month=${currentYear}-${newMonthNum}`);
    };

    const handleYearChange = (newYear: string) => {
        router.push(`/monthly-report?month=${newYear}-${currentMonthNum}`);
    };

    return (
        <div className="flex items-center gap-3">
            <Label className="whitespace-nowrap font-medium">Monat auswählen:</Label>
            <Select value={currentMonthNum} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Monat" />
                </SelectTrigger>
                <SelectContent>
                    {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                            {m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={currentYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Jahr" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                        <SelectItem key={y} value={y}>
                            {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
