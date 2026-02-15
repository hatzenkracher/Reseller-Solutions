// Calculation utilities for device financials


export interface CalculationResult {
    totalCosts: number;           // All costs including salesFees
    taxableMargin: number;        // Only: salePrice - purchasePrice (for differential taxation §25a UStG)
    actualProfit: number;         // Actual profit after all costs (for internal accounting)
    grossProfit: number;          // Deprecated: Use actualProfit instead
    vat: number;                  // VAT (correctly calculated)
    netProfit: number;            // Net profit after tax
    isFinal: boolean;             // Is sold?
}

export function calculateDeviceFinancials(device: any): CalculationResult {
    const isSold = device.status === 'SOLD'

    // Support both Prisma (camelCase) and Supabase (snake_case) field names
    const purchasePrice = device.purchasePrice || device.purchase_price || 0
    const repairCost = device.repairCost || device.repair_cost || 0
    const shippingBuy = device.shippingBuy || device.shipping_buy || 0
    const shippingSell = device.shippingSell || device.shipping_sell || 0
    const salesFees = device.salesFees || device.sales_fees || 0
    const salePrice = device.salePrice || device.sale_price || 0
    const isDiffTax = device.isDiffTax ?? device.is_diff_tax ?? true

    // Total costs include ALL expenses
    const totalCosts = purchasePrice + repairCost + shippingBuy + shippingSell + salesFees

    // Taxable margin: ONLY salePrice - purchasePrice (for differential taxation §25a UStG)
    const taxableMargin = salePrice - purchasePrice

    // Actual profit: Revenue minus ALL costs
    const actualProfit = salePrice - totalCosts

    // Deprecated but kept for backward compatibility
    const grossProfit = actualProfit

    // Calculate VAT
    let vat = 0
    if (isSold) {
        if (isDiffTax) {
            // Differential Taxation (§25a UStG): Tax on margin ONLY
            if (taxableMargin > 0) {
                vat = taxableMargin * (19 / 119)
            }
        } else {
            // Standard Tax: Tax on full sale price
            vat = salePrice * (19 / 119)
        }
    }

    // Net profit after tax deduction
    const netProfit = actualProfit - vat

    return {
        totalCosts,
        taxableMargin,
        actualProfit,
        grossProfit,
        vat,
        netProfit,
        isFinal: isSold
    }
}
