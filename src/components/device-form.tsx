"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { createDevice, updateDevice, deleteDevice } from "@/app/(protected)/actions"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"

const APPLE_MODELS = [
    "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
    "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
    "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
    "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
    "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
    "iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max",
];

const SAMSUNG_MODELS = [
    // Galaxy S-Serie (2020-2025)
    "Galaxy S20", "Galaxy S20+", "Galaxy S20 Ultra", "Galaxy S20 FE",
    "Galaxy S21", "Galaxy S21+", "Galaxy S21 Ultra", "Galaxy S21 FE",
    "Galaxy S22", "Galaxy S22+", "Galaxy S22 Ultra",
    "Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra", "Galaxy S23 FE",
    "Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra",
    "Galaxy S25", "Galaxy S25+", "Galaxy S25 Ultra",
    // Galaxy Z-Serie (Foldables)
    "Galaxy Z Flip", "Galaxy Z Flip 3", "Galaxy Z Flip 4", "Galaxy Z Flip 5", "Galaxy Z Flip 6",
    "Galaxy Z Fold 2", "Galaxy Z Fold 3", "Galaxy Z Fold 4", "Galaxy Z Fold 5", "Galaxy Z Fold 6",
    // Galaxy A-Serie (Beliebte Mittelklasse)
    "Galaxy A52", "Galaxy A53", "Galaxy A54", "Galaxy A55",
    "Galaxy A72", "Galaxy A73",
];

const GOOGLE_MODELS = [
    "Pixel 5", "Pixel 5a",
    "Pixel 6", "Pixel 6 Pro", "Pixel 6a",
    "Pixel 7", "Pixel 7 Pro", "Pixel 7a",
    "Pixel 8", "Pixel 8 Pro", "Pixel 8a",
    "Pixel 9", "Pixel 9 Pro", "Pixel 9 Pro XL",
];

const formSchema = z.object({
    id: z.string().min(1, "Geräte-ID ist erforderlich"),
    model: z.string().min(1, "Modell ist erforderlich"),
    storage: z.string().min(1, "Speicher ist erforderlich"),
    color: z.string().min(1, "Farbe ist erforderlich"),
    condition: z.enum(["NEW", "USED", "DEFECT"]),
    status: z.enum(["STOCK", "REPAIR", "SOLD"]),
    purchasePrice: z.union([z.string(), z.number()]).transform(val => Number(val) || 0),
    purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Ungültiges Datum"),
    shippingBuy: z.union([z.string(), z.number()]).transform(val => Number(val) || 0),
    repairCost: z.union([z.string(), z.number()]).transform(val => Number(val) || 0),
    shippingSell: z.union([z.string(), z.number()]).transform(val => Number(val) || 0),
    salePrice: z.union([z.string(), z.number()]).transform(val => Number(val) || 0),
    salesFees: z.union([z.string(), z.number()]).transform(val => Number(val) || 0),
    platformOrderNumber: z.string().optional(),
    saleInvoiceNumber: z.string().optional(),
    saleDate: z.string().optional().or(z.literal("")),
    isDiffTax: z.boolean().default(true),
    imei: z.string().optional(),
    sellerName: z.string().optional(),

    defectDisplay: z.boolean().optional(),
    defectBackcover: z.boolean().optional(),
    defectBattery: z.boolean().optional(),
    defectFunction: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DeviceFormProps {
    device?: any;
}

export function DeviceForm({ device }: DeviceFormProps) {
    const router = useRouter();

    // Parse defects JSON if editing
    const defects = device?.defects ? (typeof device.defects === 'string' ? JSON.parse(device.defects) : device.defects) : {};

    const defaultValues: Partial<FormValues> = {
        id: device?.id || "",
        model: device?.model || "",
        storage: device?.storage || "",
        color: device?.color || "",
        condition: (device?.condition as any) || "USED",
        status: (device?.status as any) || "STOCK",
        purchasePrice: device?.purchasePrice || 0,
        purchaseDate: device?.purchaseDate ? new Date(device.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        shippingBuy: device?.shippingBuy || 0,
        repairCost: device?.repairCost || 0,
        shippingSell: device?.shippingSell || 0,
        salePrice: device?.salePrice || 0,
        salesFees: device?.salesFees || 0,
        platformOrderNumber: device?.platformOrderNumber || "",
        saleInvoiceNumber: device?.saleInvoiceNumber || "",
        saleDate: device?.saleDate ? new Date(device.saleDate).toISOString().split('T')[0] : "",
        isDiffTax: device?.isDiffTax ?? true,
        imei: device?.imei || "",
        sellerName: device?.sellerName || device?.seller_name || "",
        defectDisplay: defects.display || false,
        defectBackcover: defects.backcover || false,
        defectBattery: defects.battery || false,
        defectFunction: defects.function === false ? true : false,
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues,
    })

    // Manufacturer selection state - initialize with correct value from device.model
    const [manufacturer, setManufacturer] = useState<string>(() => {
        if (!device?.model) return "";
        if (APPLE_MODELS.includes(device.model)) return "Apple";
        if (SAMSUNG_MODELS.includes(device.model)) return "Samsung";
        if (GOOGLE_MODELS.includes(device.model)) return "Google";
        return "Custom";
    });

    // Sync form and manufacturer when device changes
    useEffect(() => {
        if (device) {
            // Parse defects inside useEffect to avoid stale closures
            const deviceDefects = device?.defects ? (typeof device.defects === 'string' ? JSON.parse(device.defects) : device.defects) : {};

            // Reset form with device values (only when device.id changes, not on every render)
            form.reset({
                id: device.id || "",
                model: device.model || "",
                storage: device.storage || "",
                color: device.color || "",
                condition: (device.condition as any) || "USED",
                status: (device.status as any) || "STOCK",
                purchasePrice: device.purchasePrice || 0,
                purchaseDate: device.purchaseDate ? new Date(device.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                shippingBuy: device.shippingBuy || 0,
                repairCost: device.repairCost || 0,
                shippingSell: device.shippingSell || 0,
                salePrice: device.salePrice || 0,
                salesFees: device.salesFees || 0,
                platformOrderNumber: device.platformOrderNumber || "",
                saleInvoiceNumber: device.saleInvoiceNumber || "",
                saleDate: device.saleDate ? new Date(device.saleDate).toISOString().split('T')[0] : "",
                isDiffTax: device.isDiffTax ?? true,
                imei: device.imei || "",
                sellerName: device.sellerName || device.seller_name || "",
                defectDisplay: deviceDefects.display || false,
                defectBackcover: deviceDefects.backcover || false,
                defectBattery: deviceDefects.battery || false,
                defectFunction: deviceDefects.function === false ? true : false,
            });

            // Detect and set manufacturer from model
            if (device.model) {
                if (APPLE_MODELS.includes(device.model)) {
                    setManufacturer("Apple");
                } else if (SAMSUNG_MODELS.includes(device.model)) {
                    setManufacturer("Samsung");
                } else if (GOOGLE_MODELS.includes(device.model)) {
                    setManufacturer("Google");
                } else {
                    setManufacturer("Custom");
                }
            }
        }
    }, [device?.id, device?.model]); // Re-run when device ID or model changes

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const defectsObj = {
            display: values.defectDisplay,
            backcover: values.defectBackcover,
            battery: values.defectBattery,
            function: !values.defectFunction,
        };

        const submissionData = {
            ...values,
            defects: JSON.stringify(defectsObj),
            // Ensure number conversion
            purchasePrice: Number(values.purchasePrice),
            shippingBuy: Number(values.shippingBuy),
            repairCost: Number(values.repairCost),
            shippingSell: Number(values.shippingSell),
            salePrice: Number(values.salePrice),
            // Handle empty date strings
            saleDate: values.saleDate === "" ? null : values.saleDate,
        };

        try {
            if (device) {
                const res = await updateDevice(device.id, submissionData);
                if (res.success) {
                    toast.success("Gerät aktualisiert");
                    router.refresh();
                } else {
                    toast.error("Fehler beim Aktualisieren: " + res.error);
                }
            } else {
                const res = await createDevice(submissionData);
                if (res.success) {
                    toast.success("Gerät erstellt");
                    router.push(`/devices/${values.id}`); // Go to edit page
                    router.refresh();
                } else {
                    toast.error("Fehler beim Erstellen: " + res.error);
                }
            }
        } catch (e) {
            toast.error("Ein unerwarteter Fehler ist aufgetreten");
        }
    }

    async function handleDelete() {
        if (confirm("Bist du sicher, dass du dieses Gerät unwiderruflich löschen möchtest?")) {
            const res = await deleteDevice(device.id);
            if (res.success) {
                toast.success("Gerät gelöscht");
                router.push("/devices");
                router.refresh();
            } else {
                toast.error("Fehler beim Löschen: " + res.error);
            }
        }
    }

    const watchedCondition = form.watch("condition");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Geräte-Details</h3>
                    {device && (
                        <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-2" /> Löschen
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Basic Info */}
                    <div className="space-y-4 border p-4 rounded-lg bg-card shadow-sm">
                        <h3 className="font-semibold text-base border-b pb-2 mb-4">Basisdaten</h3>

                        <FormField
                            control={form.control}
                            name="id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Geräte-ID (Manuell)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="z.B. RS-2026-001" {...field} disabled={!!device} />
                                    </FormControl>
                                    <FormDescription>
                                        Eindeutige Kennung.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Hersteller und Modell nebeneinander */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormItem>
                                <FormLabel>Hersteller</FormLabel>
                                <Select
                                    value={manufacturer}
                                    onValueChange={(value) => {
                                        setManufacturer(value);
                                        form.setValue("model", ""); // Reset model when manufacturer changes
                                    }}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Wähle einen Hersteller" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Apple">Apple</SelectItem>
                                        <SelectItem value="Samsung">Samsung</SelectItem>
                                        <SelectItem value="Google">Google</SelectItem>
                                        <SelectItem value="Custom">Eigenes Gerät</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modell</FormLabel>
                                        {manufacturer === "Custom" ? (
                                            <FormControl>
                                                <Input
                                                    placeholder="Modellbezeichnung eingeben"
                                                    {...field}
                                                />
                                            </FormControl>
                                        ) : (
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!manufacturer || manufacturer === "Custom"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={
                                                            !manufacturer ? "Erst Hersteller wählen" : "Wähle ein Modell"
                                                        } />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {manufacturer === "Apple" && APPLE_MODELS.map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                    {manufacturer === "Samsung" && SAMSUNG_MODELS.map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                    {manufacturer === "Google" && GOOGLE_MODELS.map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="storage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Speicher</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="GB" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {["64GB", "128GB", "256GB", "512GB", "1TB"].map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Farbe</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Farbe" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {["Schwarz", "Weiß", "Rot", "Blau", "Grün", "Gelb", "Violett", "Graphit", "Silber", "Gold", "Sierra Blau", "Mitternacht", "Polarstern", "Titan Natur", "Titan Blau", "Titan Weiß", "Titan Schwarz"].map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="imei"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IMEI (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="IMEI Nummer" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Zustand und Status nebeneinander */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Zustand</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Zustand" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NEW">Neu</SelectItem>
                                                <SelectItem value="USED">Gebraucht</SelectItem>
                                                <SelectItem value="DEFECT">Defekt</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aktueller Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="STOCK">Lagerbestand</SelectItem>
                                                <SelectItem value="REPAIR">In Reparatur</SelectItem>
                                                <SelectItem value="SOLD">Verkauft</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Defects only visible when condition is DEFECT */}
                        {watchedCondition === "DEFECT" && (
                            <div className="space-y-2 p-3 bg-muted/50 rounded border border-border/50">
                                <h4 className="font-medium text-sm">Defekt Details</h4>
                                <FormField
                                    control={form.control}
                                    name="defectDisplay"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Display defekt?</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="defectBackcover"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Backcover defekt?</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="defectBattery"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Akku defekt?</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {/* Costs & Sales */}
                    <div className="space-y-4 border p-4 rounded-lg bg-card shadow-sm">
                        <h3 className="font-semibold text-base border-b pb-2 mb-4">Finanzen & Buchhaltung</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="purchasePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Einkaufspreis (€)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Einkaufsdatum</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="repairCost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reparaturkosten</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isDiffTax"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4 border-y border-border/50 my-2">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Differenzbesteuerung (§25a UStG)</FormLabel>
                                        <FormDescription>
                                            Gewinn wird besteuert anstatt des vollen Verkaufspreises.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Always visible for editing history, clearer separation */}
                        <div className="space-y-4 bg-muted/10 p-4 rounded border border-border/40">
                            <h4 className="font-medium text-primary flex items-center gap-2">
                                Verkaufsdaten
                                <span className="text-xs font-normal text-muted-foreground">(Jederzeit editierbar)</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="salePrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Verkaufspreis (€)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="saleDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Verkaufsdatum</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="shippingSell"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Versand (Verkauf)</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    if (value === "custom") {
                                                        field.onChange(0);
                                                    } else {
                                                        field.onChange(parseFloat(value));
                                                    }
                                                }}
                                                value={field.value === 6.19 ? "6.19" : field.value === 7.49 ? "7.49" : "custom"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Versandart wählen" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="6.19">DHL 2kg - 6,19 €</SelectItem>
                                                    <SelectItem value="7.49">DHL 5kg - 7,49 €</SelectItem>
                                                    <SelectItem value="custom">Individuelle Kosten</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {(field.value !== 6.19 && field.value !== 7.49) && (
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    placeholder="Betrag eingeben"
                                                    className="mt-2"
                                                />
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="salesFees"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Verkaufsgebühren (€)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="platformOrderNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bestellnummer Plattform (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="z.B. eBay-Bestellnummer" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="saleInvoiceNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rechnungsnummer Verkauf (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="z.B. RE-2026-001" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 border-t pt-6">
                    <Button type="button" variant="outline" onClick={() => router.push("/devices")}>Abbrechen</Button>
                    <Button type="submit" size="lg" className="min-w-[150px]">Speichern</Button>
                </div>
            </form>
        </Form >
    )
}
