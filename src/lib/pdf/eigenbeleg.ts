import jsPDF from 'jspdf'

interface CompanyProfile {
    company_name: string
    owner_name: string
    street: string
    house_number: string
    postal_code: string
    city: string
    country: string
    vat_id?: string | null
    tax_id?: string | null
    email: string
    phone?: string | null
    logo_url?: string | null
}

interface Device {
    id: string
    model: string
    storage: string
    color: string
    seller_name?: string | null
    purchase_price: number
    purchase_date: string
}

interface EigenbelegOptions {
    recipientName: string
    reason?: string
}

/**
 * Load logo image from URL and return as base64 data URL
 */
async function loadLogoAsBase64(logoUrl: string): Promise<string | null> {
    try {
        const response = await fetch(logoUrl)
        if (!response.ok) return null
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const contentType = response.headers.get('content-type') || 'image/png'
        return `data:${contentType};base64,${base64}`
    } catch {
        return null
    }
}

// ─── Layout constants ───
const MARGIN_LEFT = 25
const MARGIN_RIGHT = 25
const LABEL_X = MARGIN_LEFT
const VALUE_X = 85
const PAGE_BOTTOM = 270   // leave room for footer
const FOOTER_Y = 280
const LINE_HEIGHT = 5     // line height for font size 10

/**
 * Helper class that wraps jsPDF and tracks the Y cursor with
 * automatic page breaks and a persistent footer on every page.
 */
class PdfWriter {
    doc: jsPDF
    y: number
    pageWidth: number
    maxValueWidth: number

    private labelColor = { r: 100, g: 100, b: 100 }
    private valueColor = { r: 30, g: 30, b: 30 }
    private lineColor = { r: 200, g: 200, b: 200 }
    private footerText: string = ''

    constructor(doc: jsPDF) {
        this.doc = doc
        this.y = 25
        this.pageWidth = doc.internal.pageSize.getWidth()
        this.maxValueWidth = this.pageWidth - VALUE_X - MARGIN_RIGHT
    }

    /** Check if we have enough space; if not, add a new page */
    ensureSpace(needed: number) {
        if (this.y + needed > PAGE_BOTTOM) {
            this.addFooter()
            this.doc.addPage()
            this.y = 25
        }
    }

    /** Advance Y by amount, handling page breaks */
    advance(amount: number) {
        this.y += amount
    }

    /** Set the footer text that appears on every page */
    setFooter(text: string) {
        this.footerText = text
    }

    /** Render footer on current page */
    addFooter() {
        if (!this.footerText) return
        this.doc.setFontSize(8)
        this.doc.setTextColor(150, 150, 150)
        this.doc.text(this.footerText, LABEL_X, FOOTER_Y)
    }

    /** Draw a horizontal separator line */
    separator() {
        this.ensureSpace(10)
        this.doc.setDrawColor(this.lineColor.r, this.lineColor.g, this.lineColor.b)
        this.doc.line(LABEL_X, this.y, this.pageWidth - MARGIN_RIGHT, this.y)
        this.advance(10)
    }

    /**
     * Render a label-value row. The value text auto-wraps and can
     * span multiple lines / pages. The label stays on the first line.
     */
    labelValue(
        label: string,
        value: string,
        opts?: {
            valueBold?: boolean
            valueFontSize?: number
            labelFontSize?: number
        }
    ) {
        const fontSize = opts?.valueFontSize || 10
        const labelFontSize = opts?.labelFontSize || 10

        // Split value into wrapped lines
        this.doc.setFontSize(fontSize)
        this.doc.setFont('helvetica', opts?.valueBold ? 'bold' : 'normal')
        const lines: string[] = this.doc.splitTextToSize(value, this.maxValueWidth)
        const lineH = fontSize * 0.4  // approximate line height for the font size
        const totalHeight = lines.length * lineH

        // Ensure at least the first line + label fits
        this.ensureSpace(Math.min(totalHeight, lineH + 2))

        // Draw label on first line
        this.doc.setFontSize(labelFontSize)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(this.labelColor.r, this.labelColor.g, this.labelColor.b)
        this.doc.text(label, LABEL_X, this.y)

        // Draw value lines with page break support
        this.doc.setFontSize(fontSize)
        this.doc.setFont('helvetica', opts?.valueBold ? 'bold' : 'normal')
        this.doc.setTextColor(this.valueColor.r, this.valueColor.g, this.valueColor.b)

        for (let i = 0; i < lines.length; i++) {
            if (i > 0) {
                this.ensureSpace(lineH)
            }
            this.doc.text(lines[i], VALUE_X, this.y)
            if (i < lines.length - 1) {
                this.advance(lineH)
            }
        }

        this.advance(lineH + 2) // spacing after the row
    }

    /**
     * Render multiple value lines under one label (like address blocks).
     * Each string in `values` is one line.
     */
    labelBlock(label: string, values: string[]) {
        const lineH = LINE_HEIGHT

        this.ensureSpace(lineH + 2)

        // Label
        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(this.labelColor.r, this.labelColor.g, this.labelColor.b)
        this.doc.text(label, LABEL_X, this.y)

        // Values
        this.doc.setTextColor(this.valueColor.r, this.valueColor.g, this.valueColor.b)
        for (let i = 0; i < values.length; i++) {
            this.ensureSpace(lineH)
            this.doc.text(values[i], VALUE_X, this.y)
            this.advance(lineH)
        }

        this.advance(3) // spacing after block
    }
}

export async function generateEigenbeleg(
    device: Device,
    companyProfile: CompanyProfile,
    options: EigenbelegOptions
): Promise<Buffer> {
    const doc = new jsPDF()
    const w = new PdfWriter(doc)

    // Set footer for all pages
    const footerParts = [companyProfile.email]
    if (companyProfile.phone) footerParts.push(companyProfile.phone)
    w.setFooter(footerParts.join(' • '))

    // ─── Logo (if available) ───
    if (companyProfile.logo_url) {
        const logoData = await loadLogoAsBase64(companyProfile.logo_url)
        if (logoData) {
            try {
                doc.addImage(logoData, 'PNG', w.pageWidth - 65, 15, 40, 20)
            } catch {
                // Logo failed to load, continue without it
            }
        }
    }

    // ─── Title ───
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(30, 30, 30)
    doc.text('Eigenbeleg', LABEL_X, w.y)
    w.advance(8)

    // Subtitle
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Eigenbeleg-Nummer ${device.id}`, LABEL_X, w.y)
    w.advance(18)

    // ─── Belegdatum ───
    const dateStr = new Date(device.purchase_date).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    })
    w.labelValue('Belegdatum', dateStr, { valueBold: true })

    // ─── Gegenpartei ───
    w.labelValue('Gegenpartei', options.recipientName, { valueBold: true })

    // ─── Beschreibung der Leistung ───
    w.labelValue(
        'Beschreibung der Leistung',
        `Ankauf ${device.model} ${device.storage} ${device.color}`
    )

    // Geräte-ID (sub-line, slightly smaller)
    w.ensureSpace(5)
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Geräte-ID: ${device.id}`, VALUE_X, w.y)
    doc.setFontSize(10)
    w.advance(8)

    // ─── Betrag ───
    const amountStr = `${device.purchase_price.toLocaleString('de-DE', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    })} €`
    w.labelValue('Betrag', amountStr, { valueBold: true, valueFontSize: 14 })

    // ─── Separator ───
    w.separator()

    // ─── Grund für Eigenbeleg ───
    w.labelValue(
        'Grund für Eigenbeleg',
        options.reason || 'Kein externer Beleg vorhanden',
        { valueBold: true }
    )

    // ─── Separator ───
    w.separator()

    // ─── Erstellt durch ───
    w.labelBlock('Erstellt durch', [
        companyProfile.owner_name,
        companyProfile.company_name,
        `${companyProfile.street} ${companyProfile.house_number}`,
        `${companyProfile.postal_code} ${companyProfile.city}`,
    ])

    // ─── Erstellt am ───
    w.labelValue('Erstellt am', dateStr)

    // ─── Steuer-Info ───
    if (companyProfile.tax_id) {
        w.labelValue('Steuer-Nr.', companyProfile.tax_id)
    }
    if (companyProfile.vat_id) {
        w.labelValue('USt-IdNr.', companyProfile.vat_id)
    }

    // ─── Digitale Signatur (GUID) ───
    const guid = crypto.randomUUID()
    w.labelValue('Digitale Signatur (GUID)', guid, { valueFontSize: 9 })

    w.advance(8)

    // ─── Unterschrift ───
    w.ensureSpace(20)
    doc.setDrawColor(200, 200, 200)
    doc.line(LABEL_X, w.y, LABEL_X + 70, w.y)
    w.advance(5)
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.text(`Inhaber ${companyProfile.company_name}`, LABEL_X, w.y)

    // ─── Footer on last page ───
    w.addFooter()

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    return pdfBuffer
}
