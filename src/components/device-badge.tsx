"use client"

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeviceBadgeProps {
    id: string;
    model: string;
    storage: string;
    imei?: string | null;
}

export function DeviceBadge({ id, model, storage, imei }: DeviceBadgeProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="print:hidden"
            >
                <Printer className="h-4 w-4 mr-2" />
                Badge drucken
            </Button>

            {/* Hidden badge content - only visible when printing */}
            <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:h-full print:bg-white">
                <div className="flex items-center justify-center min-h-screen p-8">
                    <div className="border-4 border-black p-8 bg-white" style={{ width: '400px' }}>
                        <div className="space-y-4 text-black">
                            <div className="border-b-2 border-black pb-3">
                                <div className="text-sm font-semibold text-gray-600">GERÄTE-ID</div>
                                <div className="text-2xl font-bold font-mono">{id}</div>
                            </div>

                            {imei && (
                                <div className="border-b-2 border-black pb-3">
                                    <div className="text-sm font-semibold text-gray-600">IMEI</div>
                                    <div className="text-xl font-mono">{imei}</div>
                                </div>
                            )}

                            <div className="border-b-2 border-black pb-3">
                                <div className="text-sm font-semibold text-gray-600">SPEICHER</div>
                                <div className="text-xl font-bold">{storage}</div>
                            </div>

                            <div>
                                <div className="text-sm font-semibold text-gray-600">MODELL</div>
                                <div className="text-xl font-bold">{model}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
