'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'
import { calculateDeviceFinancials } from '@/lib/calculations'
import { format } from 'date-fns'
import { type DbDevice, parseNumber, parseDate } from '@/lib/device-transforms'

export interface DeviceFilters {
    dateFrom?: string
    dateTo?: string
    dateType?: 'created_at' | 'sale_date' | 'purchase_date'
}

// Export device type (snake_case as returned from DB)
export type Device = DbDevice

/**
 * Get all devices for the authenticated user
 * Returns devices in snake_case format (as stored in DB)
 */
export async function getDevices(filters?: DeviceFilters): Promise<Device[]> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        let query = supabase
            .from('devices')
            .select('*')
            .eq('owner_user_id', user.id)
            .order('created_at', { ascending: false })

        // Apply date filters
        if (filters?.dateFrom || filters?.dateTo) {
            const dateField = filters?.dateType === 'sale_date' ? 'sale_date' : filters?.dateType === 'created_at' ? 'created_at' : 'purchase_date'

            if (filters.dateFrom) {
                query = query.gte(dateField, filters.dateFrom)
            }

            if (filters.dateTo) {
                const endDate = new Date(filters.dateTo)
                endDate.setHours(23, 59, 59, 999)
                query = query.lte(dateField, endDate.toISOString())
            }

            if (dateField === 'sale_date') {
                query = query.not('sale_date', 'is', null)
            }
        }

        const { data, error } = await query

        if (error) {
            console.error('Failed to fetch devices:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Failed to fetch devices:', error)
        return []
    }
}

/**
 * Get a single device by ID
 * Returns device in snake_case format (as stored in DB)
 */
export async function getDevice(id: string): Promise<Device | null> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('id', id)
            .eq('owner_user_id', user.id)
            .single()

        if (error) {
            console.error(`Failed to fetch device ${id}:`, error)
            return null
        }

        return data
    } catch (error) {
        console.error(`Failed to fetch device ${id}:`, error)
        return null
    }
}

/**
 * Create a new device
 * Accepts camelCase input from form, converts to snake_case for DB
 */
export async function createDevice(formData: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        // Check if ID already exists
        const { data: existing } = await supabase
            .from('devices')
            .select('id')
            .eq('id', formData.id)
            .single()

        if (existing) {
            return { success: false, error: 'Geräte-ID existiert bereits' }
        }

        // Convert form data (camelCase) to database format (snake_case)
        const deviceData: Partial<DbDevice> = {
            id: formData.id,
            owner_user_id: user.id,
            model: formData.model,
            storage: formData.storage,
            color: formData.color,
            condition: formData.condition,
            status: formData.status,
            imei: formData.imei || null,
            purchase_date: parseDate(formData.purchaseDate) || new Date().toISOString(),
            purchase_price: parseNumber(formData.purchasePrice),
            shipping_buy: parseNumber(formData.shippingBuy),
            repair_cost: parseNumber(formData.repairCost),
            shipping_sell: parseNumber(formData.shippingSell),
            sale_price: formData.salePrice ? parseNumber(formData.salePrice) : null,
            sales_fees: parseNumber(formData.salesFees),
            sale_date: parseDate(formData.saleDate),
            repair_date: parseDate(formData.repairDate),
            buyer_name: formData.buyerName || null,
            platform_order_number: formData.platformOrderNumber || null,
            sale_invoice_number: formData.saleInvoiceNumber || null,
            seller_name: formData.sellerName || null,
            is_diff_tax: formData.isDiffTax === true || formData.isDiffTax === 'on' || formData.isDiffTax === 'true',
            defects: formData.defects || null,
        }

        const { data: device, error } = await supabase
            .from('devices')
            .insert(deviceData)
            .select()
            .single()

        if (error) {
            console.error('Failed to create device:', error)

            if (error.code === '23505' && error.message.includes('imei')) {
                return { success: false, error: 'IMEI existiert bereits in der Datenbank' }
            }

            return { success: false, error: 'Fehler beim Erstellen des Geräts: ' + error.message }
        }

        revalidatePath('/devices')
        revalidatePath('/')
        return { success: true, device }
    } catch (error: any) {
        console.error('Failed to create device:', error)
        return { success: false, error: 'Fehler beim Erstellen des Geräts: ' + error.message }
    }
}

/**
 * Update an existing device
 * Accepts camelCase input from form, converts to snake_case for DB
 */
export async function updateDevice(id: string, formData: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        // Build update object, converting camelCase to snake_case
        const updateData: Partial<DbDevice> = {}

        if (formData.model !== undefined) updateData.model = formData.model
        if (formData.storage !== undefined) updateData.storage = formData.storage
        if (formData.color !== undefined) updateData.color = formData.color
        if (formData.condition !== undefined) updateData.condition = formData.condition
        if (formData.status !== undefined) updateData.status = formData.status
        if (formData.imei !== undefined) updateData.imei = formData.imei || null
        if (formData.sellerName !== undefined) updateData.seller_name = formData.sellerName || null

        // Dates
        if (formData.purchaseDate !== undefined) updateData.purchase_date = parseDate(formData.purchaseDate)!
        if (formData.saleDate !== undefined) updateData.sale_date = parseDate(formData.saleDate)
        if (formData.repairDate !== undefined) updateData.repair_date = parseDate(formData.repairDate)

        // Numeric fields
        if (formData.purchasePrice !== undefined) updateData.purchase_price = parseNumber(formData.purchasePrice)
        if (formData.repairCost !== undefined) updateData.repair_cost = parseNumber(formData.repairCost)
        if (formData.shippingBuy !== undefined) updateData.shipping_buy = parseNumber(formData.shippingBuy)
        if (formData.shippingSell !== undefined) updateData.shipping_sell = parseNumber(formData.shippingSell)
        if (formData.salePrice !== undefined) updateData.sale_price = formData.salePrice ? parseNumber(formData.salePrice) : null
        if (formData.salesFees !== undefined) updateData.sales_fees = parseNumber(formData.salesFees)

        // Other fields
        if (formData.buyerName !== undefined) updateData.buyer_name = formData.buyerName || null
        if (formData.platformOrderNumber !== undefined) updateData.platform_order_number = formData.platformOrderNumber || null
        if (formData.saleInvoiceNumber !== undefined) updateData.sale_invoice_number = formData.saleInvoiceNumber || null
        if (formData.isDiffTax !== undefined) updateData.is_diff_tax = formData.isDiffTax === true || formData.isDiffTax === 'on' || formData.isDiffTax === 'true'
        if (formData.defects !== undefined) updateData.defects = formData.defects || null

        const { data: device, error } = await supabase
            .from('devices')
            .update(updateData)
            .eq('id', id)
            .eq('owner_user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error(`Failed to update device ${id}:`, error)
            return { success: false, error: 'Failed to update device: ' + error.message }
        }

        revalidatePath('/devices')
        revalidatePath(`/devices/${id}`)
        revalidatePath('/')
        return { success: true, device }
    } catch (error: any) {
        console.error(`Failed to update device ${id}:`, error)
        return { success: false, error: 'Failed to update device: ' + error.message }
    }
}

/**
 * Delete a device
 */
export async function deleteDevice(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const { error } = await supabase
            .from('devices')
            .delete()
            .eq('id', id)
            .eq('owner_user_id', user.id)

        if (error) {
            console.error(`Failed to delete device ${id}:`, error)
            return { success: false, error: 'Failed to delete device' }
        }

        revalidatePath('/devices')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error(`Failed to delete device ${id}:`, error)
        return { success: false, error: 'Failed to delete device' }
    }
}

/**
 * Export devices to Excel
 */
export async function exportDevicesToExcel(filters?: DeviceFilters) {
    try {
        const devices = await getDevices(filters)

        if (devices.length === 0) {
            return { success: false, error: 'Keine Geräte zum Exportieren gefunden' }
        }

        // Calculate totals
        let totalPurchasePrice = 0
        let totalRepairCost = 0
        let totalShippingCost = 0
        let totalOtherCosts = 0
        let totalSalePrice = 0
        let totalTax = 0

        // Create device rows with new structure
        const excelData = devices.map((device) => {
            const financials = calculateDeviceFinancials(device)

            // Individual cost components
            const purchasePrice = device.purchase_price || 0
            const repairCost = device.repair_cost || 0
            const shippingCost = (device.shipping_buy || 0) + (device.shipping_sell || 0)
            const otherCosts = device.sales_fees || 0
            const totalCosts = purchasePrice + repairCost + shippingCost + otherCosts
            const salePrice = device.sale_price || 0
            const tax = financials.vat
            const profitBeforeTax = financials.actualProfit
            const profitAfterTax = financials.netProfit

            // Accumulate totals (only for sold devices)
            if (device.status === 'SOLD' && salePrice > 0) {
                totalPurchasePrice += purchasePrice
                totalRepairCost += repairCost
                totalShippingCost += shippingCost
                totalOtherCosts += otherCosts
                totalSalePrice += salePrice
                totalTax += tax
            }

            const row: any = {
                'Geräte-ID': device.id,
                'Einkaufsdatum': device.purchase_date ? format(new Date(device.purchase_date), 'dd.MM.yyyy') : '',
                'Verkaufsdatum': device.sale_date ? format(new Date(device.sale_date), 'dd.MM.yyyy') : '',
                'Besteuerungsart': device.is_diff_tax ? 'Differenzbesteuerung' : 'Regelbesteuerung',
                'Differenzbesteuerung': device.is_diff_tax ? '✓' : '',
                'Regelbesteuerung': device.is_diff_tax ? '' : '✓',
                'Einkaufspreis': purchasePrice,
                'Reparaturkosten': repairCost,
                'Versandkosten': shippingCost,
                'Sonstige Kosten': otherCosts,
                'Gesamtkosten': totalCosts,
                'Verkaufspreis': salePrice > 0 ? salePrice : '',
                'Steuerbetrag': tax > 0 ? tax : '',
                'Gewinn vor Steuern': device.status === 'SOLD' ? profitBeforeTax : '',
                'Gewinn nach Steuern': device.status === 'SOLD' ? profitAfterTax : '',
            }

            return row
        })

        // Create worksheet from device data
        const worksheet = XLSX.utils.json_to_sheet(excelData)

        // Calculate totals
        const totalAllCosts = totalPurchasePrice + totalRepairCost + totalShippingCost + totalOtherCosts
        const totalProfitBeforeTax = totalSalePrice - totalAllCosts
        const totalProfitAfterTax = totalProfitBeforeTax - totalTax

        // Add blank row for separation
        const lastDataRow = excelData.length + 1 // +1 for header
        const blankRowNum = lastDataRow + 1
        const totalsStartRow = blankRowNum + 1

        // Add totals section manually
        XLSX.utils.sheet_add_aoa(worksheet, [['']], { origin: `A${blankRowNum}` })

        // Add totals rows with labels and formulas/values
        const totalsRows = [
            ['Gesamte Einkaufskosten', '', '', '', '', '', totalPurchasePrice],
            ['Gesamte Reparaturkosten', '', '', '', '', '', totalRepairCost],
            ['Gesamte Versandkosten', '', '', '', '', '', totalShippingCost],
            ['Gesamte sonstige Kosten', '', '', '', '', '', totalOtherCosts],
            ['Gesamtkosten gesamt', '', '', '', '', '', totalAllCosts],
            ['Gesamtumsatz', '', '', '', '', '', totalSalePrice],
            ['Gesamtsteuer', '', '', '', '', '', totalTax],
            ['Gesamtgewinn vor Steuern', '', '', '', '', '', totalProfitBeforeTax],
            ['Gesamtgewinn nach Steuern', '', '', '', '', '', totalProfitAfterTax],
        ]

        XLSX.utils.sheet_add_aoa(worksheet, totalsRows, { origin: `A${totalsStartRow}` })

        // Set column widths for better readability
        const colWidths = [
            { wch: 15 }, // Geräte-ID
            { wch: 12 }, // Einkaufsdatum
            { wch: 12 }, // Verkaufsdatum
            { wch: 20 }, // Besteuerungsart
            { wch: 18 }, // Differenzbesteuerung
            { wch: 16 }, // Regelbesteuerung
            { wch: 12 }, // Einkaufspreis
            { wch: 14 }, // Reparaturkosten
            { wch: 12 }, // Versandkosten
            { wch: 14 }, // Sonstige Kosten
            { wch: 12 }, // Gesamtkosten
            { wch: 12 }, // Verkaufspreis
            { wch: 12 }, // Steuerbetrag
            { wch: 16 }, // Gewinn vor Steuern
            { wch: 16 }, // Gewinn nach Steuern
        ]
        worksheet['!cols'] = colWidths

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Geräte')

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
        const base64 = Buffer.from(excelBuffer).toString('base64')

        return {
            success: true,
            data: base64,
            filename: `geraete-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
        }
    } catch (error) {
        console.error('Failed to export devices:', error)
        return { success: false, error: 'Export fehlgeschlagen' }
    }
}
