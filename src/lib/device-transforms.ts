/**
 * Device Data Transformation Utilities
 * Handles conversion between database (snake_case) and application (camelCase) formats
 */

// Database device format (snake_case)
export interface DbDevice {
    id: string
    owner_user_id: string
    model: string
    storage: string
    color: string
    condition: string
    status: string
    imei?: string | null
    purchase_date: string
    repair_date?: string | null
    sale_date?: string | null
    shipping_buy_date?: string | null
    shipping_sell_date?: string | null
    purchase_price: number
    repair_cost: number
    shipping_buy: number
    shipping_sell: number
    sale_price?: number | null
    buyer_name?: string | null
    sales_fees: number
    platform_order_number?: string | null
    sale_invoice_number?: string | null
    seller_name?: string | null
    is_diff_tax: boolean
    defects?: string | null
    created_at: string
    updated_at: string
}

// Application device format (camelCase)
export interface AppDevice {
    id: string
    ownerUserId: string
    model: string
    storage: string
    color: string
    condition: string
    status: string
    imei?: string | null
    purchaseDate: string
    repairDate?: string | null
    saleDate?: string | null
    shippingBuyDate?: string | null
    shippingSellDate?: string | null
    purchasePrice: number
    repairCost: number
    shippingBuy: number
    shippingSell: number
    salePrice?: number | null
    buyerName?: string | null
    salesFees: number
    platformOrderNumber?: string | null
    saleInvoiceNumber?: string | null
    sellerName?: string | null
    isDiffTax: boolean
    defects?: string | null
    createdAt: string
    updatedAt: string
}

/**
 * Convert database device (snake_case) to application device (camelCase)
 */
export function dbToApp(db: DbDevice): AppDevice {
    return {
        id: db.id,
        ownerUserId: db.owner_user_id,
        model: db.model,
        storage: db.storage,
        color: db.color,
        condition: db.condition,
        status: db.status,
        imei: db.imei,
        purchaseDate: db.purchase_date,
        repairDate: db.repair_date,
        saleDate: db.sale_date,
        shippingBuyDate: db.shipping_buy_date,
        shippingSellDate: db.shipping_sell_date,
        purchasePrice: db.purchase_price,
        repairCost: db.repair_cost,
        shippingBuy: db.shipping_buy,
        shippingSell: db.shipping_sell,
        salePrice: db.sale_price,
        buyerName: db.buyer_name,
        salesFees: db.sales_fees,
        platformOrderNumber: db.platform_order_number,
        saleInvoiceNumber: db.sale_invoice_number,
        sellerName: db.seller_name,
        isDiffTax: db.is_diff_tax,
        defects: db.defects,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
    }
}

/**
 * Convert application device (camelCase) to database format (snake_case)
 */
export function appToDb(app: Partial<AppDevice>): Partial<DbDevice> {
    const db: Partial<DbDevice> = {}

    if (app.id !== undefined) db.id = app.id
    if (app.ownerUserId !== undefined) db.owner_user_id = app.ownerUserId
    if (app.model !== undefined) db.model = app.model
    if (app.storage !== undefined) db.storage = app.storage
    if (app.color !== undefined) db.color = app.color
    if (app.condition !== undefined) db.condition = app.condition
    if (app.status !== undefined) db.status = app.status
    if (app.imei !== undefined) db.imei = app.imei
    if (app.purchaseDate !== undefined) db.purchase_date = app.purchaseDate
    if (app.repairDate !== undefined) db.repair_date = app.repairDate
    if (app.saleDate !== undefined) db.sale_date = app.saleDate
    if (app.shippingBuyDate !== undefined) db.shipping_buy_date = app.shippingBuyDate
    if (app.shippingSellDate !== undefined) db.shipping_sell_date = app.shippingSellDate
    if (app.purchasePrice !== undefined) db.purchase_price = app.purchasePrice
    if (app.repairCost !== undefined) db.repair_cost = app.repairCost
    if (app.shippingBuy !== undefined) db.shipping_buy = app.shippingBuy
    if (app.shippingSell !== undefined) db.shipping_sell = app.shippingSell
    if (app.salePrice !== undefined) db.sale_price = app.salePrice
    if (app.buyerName !== undefined) db.buyer_name = app.buyerName
    if (app.salesFees !== undefined) db.sales_fees = app.salesFees
    if (app.platformOrderNumber !== undefined) db.platform_order_number = app.platformOrderNumber
    if (app.saleInvoiceNumber !== undefined) db.sale_invoice_number = app.saleInvoiceNumber
    if (app.sellerName !== undefined) db.seller_name = app.sellerName
    if (app.isDiffTax !== undefined) db.is_diff_tax = app.isDiffTax
    if (app.defects !== undefined) db.defects = app.defects
    if (app.createdAt !== undefined) db.created_at = app.createdAt
    if (app.updatedAt !== undefined) db.updated_at = app.updatedAt

    return db
}

/**
 * Safely parse a number from any input
 */
export function parseNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0
    const num = typeof val === 'string' ? parseFloat(val) : Number(val)
    return isNaN(num) ? 0 : num
}

/**
 * Safely parse a date to ISO string
 */
export function parseDate(val: any): string | null {
    if (!val || val === '') return null
    try {
        const date = new Date(val)
        return isNaN(date.getTime()) ? null : date.toISOString()
    } catch {
        return null
    }
}
