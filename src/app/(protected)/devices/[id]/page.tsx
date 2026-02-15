import { DeviceForm } from "@/components/device-form";
import { FileUpload } from "@/components/file-upload";
import { DeviceFinancials } from "@/components/device-financials";
import { EigenbelegDialog } from "@/components/eigenbeleg-dialog";
import { getDevice } from "../../actions";
import { listDeviceFiles } from "./upload-actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";

interface DevicePageProps {
    params: Promise<{ id: string }>;
}

export default async function DevicePage({ params }: DevicePageProps) {
    const { id } = await params;
    const device = await getDevice(id);

    if (!device) {
        notFound();
    }

    // Fetch uploaded files for this device
    const files = await listDeviceFiles(id);

    // Device comes from DB in snake_case
    // Need to pass to form which expects camelCase
    const serializedDevice = {
        id: device.id,
        model: device.model,
        storage: device.storage,
        color: device.color,
        condition: device.condition,
        status: device.status,
        imei: device.imei,
        purchaseDate: device.purchase_date,
        repairDate: device.repair_date,
        saleDate: device.sale_date,
        shippingBuyDate: device.shipping_buy_date,
        shippingSellDate: device.shipping_sell_date,
        purchasePrice: device.purchase_price,
        repairCost: device.repair_cost,
        shippingBuy: device.shipping_buy,
        shippingSell: device.shipping_sell,
        salePrice: device.sale_price,
        buyerName: device.buyer_name,
        salesFees: device.sales_fees,
        platformOrderNumber: device.platform_order_number,
        saleInvoiceNumber: device.sale_invoice_number,
        sellerName: device.seller_name,
        isDiffTax: device.is_diff_tax,
        defects: device.defects,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
    };

    return (
        <div className="container mx-auto py-10 max-w-4xl space-y-10">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Gerät bearbeiten</h1>
                        <p className="text-muted-foreground mt-1">ID: {device.id}</p>
                    </div>
                </div>
                {/* @ts-ignore - Date serialization mismatch, handled in component */}
                <DeviceForm device={serializedDevice} />
            </div>

            <DeviceFinancials
                purchasePrice={device.purchase_price}
                repairCost={device.repair_cost || 0}
                shippingBuy={device.shipping_buy || 0}
                shippingSell={device.shipping_sell || 0}
                salePrice={device.sale_price || 0}
                salesFees={device.sales_fees || 0}
                isDiffTax={device.is_diff_tax}
                status={device.status}
            />

            {/* Export Actions */}
            <div className="flex gap-3">
                <Button variant="outline" asChild className="flex-1">
                    <Link href={`/api/devices/${device.id}/export`}>
                        <Download className="h-4 w-4 mr-2" />
                        Als ZIP exportieren
                    </Link>
                </Button>
                <EigenbelegDialog deviceId={device.id} />
            </div>

            {/* File Upload Section */}
            <FileUpload deviceId={device.id} files={files} />
        </div>
    );
}
