'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateDeviceFinancials } from '@/lib/calculations'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

export async function getMonthlyReport(monthStr: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return null
        }

        // monthStr format: "YYYY-MM"
        const date = parseISO(monthStr + '-01')
        const start = startOfMonth(date)
        const end = endOfMonth(date)

        // Fetch devices sold in this month
        const { data: soldDevices, error: soldError } = await supabase
            .from('devices')
            .select('*')
            .eq('owner_user_id', user.id)
            .eq('status', 'SOLD')
            .gte('sale_date', start.toISOString())
            .lte('sale_date', end.toISOString())

        if (soldError) {
            console.error('Error fetching sold devices:', soldError)
        }

        // Current stock count (regardless of month)
        const { count: stockCount, error: stockError } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .eq('owner_user_id', user.id)
            .eq('status', 'STOCK')

        if (stockError) {
            console.error('Error fetching stock count:', stockError)
        }

        const { count: repairCount, error: repairError } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .eq('owner_user_id', user.id)
            .eq('status', 'REPAIR')

        if (repairError) {
            console.error('Error fetching repair count:', repairError)
        }

        // Initialize aggregation variables
        const aggregations = {
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
        }

        // Calculate aggregations from sold devices
        const safeDevices = soldDevices || []

        for (const device of safeDevices) {
            const financials = calculateDeviceFinancials(device)

            aggregations.totalRevenue += Number(device.sale_price) || 0
            aggregations.totalPurchaseCost += Number(device.purchase_price) || 0
            aggregations.totalRepairCost += Number(device.repair_cost) || 0
            aggregations.totalShippingCost += (Number(device.shipping_buy) || 0) + (Number(device.shipping_sell) || 0)
            aggregations.totalSalesFees += Number(device.sales_fees) || 0

            aggregations.totalTaxableMargin += Number(financials.taxableMargin) || 0
            aggregations.totalActualProfit += Number(financials.actualProfit) || 0
            aggregations.totalGrossProfit += Number(financials.grossProfit) || 0
            aggregations.totalVat += Number(financials.vat) || 0
            aggregations.totalNetProfit += Number(financials.netProfit) || 0
        }

        return {
            devices: safeDevices,
            kpis: {
                soldCount: safeDevices.length,
                stockCount: stockCount || 0,
                repairCount: repairCount || 0,
                ...aggregations,
            },
        }
    } catch (error) {
        console.error('Failed to get monthly report:', error)
        return null
    }
}
