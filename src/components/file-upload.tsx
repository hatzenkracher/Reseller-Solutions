'use client'

import { useState } from 'react'
import { Upload, File, Trash2, Download, FileText, Receipt, MessageSquare, FileCheck, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { uploadDeviceFile, deleteDeviceFile } from '@/app/(protected)/devices/[id]/upload-actions'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/formatters'

interface DeviceFile {
    id: string
    file_name: string
    file_size: number
    file_type: string
    category: string
    created_at: string
    download_url: string | null
}

interface FileUploadProps {
    deviceId: string
    files: DeviceFile[]
}

const CATEGORY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    PAYPAL: { label: 'Zahlungsbeleg', icon: Receipt, color: 'bg-blue-500/15 text-blue-600' },
    INVOICE: { label: 'Rechnung', icon: FileText, color: 'bg-green-500/15 text-green-600' },
    CHAT: { label: 'Chats mit Verkäufer', icon: MessageSquare, color: 'bg-purple-500/15 text-purple-600' },
    EIGENBELEG: { label: 'Eigenbeleg', icon: FileCheck, color: 'bg-amber-500/15 text-amber-600' },
    SALES_AD: { label: 'Verkaufsanzeige', icon: ShoppingCart, color: 'bg-teal-500/15 text-teal-600' },
    OTHER: { label: 'Sonstiges', icon: File, color: 'bg-gray-500/15 text-gray-600' },
}

export function FileUpload({ deviceId, files: initialFiles }: FileUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [category, setCategory] = useState<string>('OTHER')
    const router = useRouter()

    const isMultiUpload = category === 'CHAT' || category === 'SALES_AD'

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFiles = e.target.files
        if (!selectedFiles || selectedFiles.length === 0) return

        setUploading(true)
        try {
            let successCount = 0
            let errorMsg = ''

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]
                const formData = new FormData()
                formData.append('file', file)
                formData.append('category', category)

                const result = await uploadDeviceFile(deviceId, formData)

                if (result.success) {
                    successCount++
                } else {
                    errorMsg = result.error || 'Upload fehlgeschlagen'
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} Datei(en) hochgeladen`)
                router.refresh()
            }
            if (errorMsg) {
                toast.error(errorMsg)
            }
        } catch (error) {
            toast.error('Upload fehlgeschlagen')
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    async function handleDelete(fileId: string, filename: string) {
        if (!confirm(`Möchten Sie "${filename}" wirklich löschen?`)) return

        const result = await deleteDeviceFile(fileId)
        if (result.success) {
            toast.success('Datei gelöscht')
            router.refresh()
        } else {
            toast.error(result.error || 'Löschen fehlgeschlagen')
        }
    }

    function formatFileSize(bytes: number) {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    function getCategoryDisplay(cat: string) {
        return CATEGORY_LABELS[cat] || CATEGORY_LABELS.OTHER
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    Dokumente & Dateien
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Section */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <Select value={category} onValueChange={setCategory} disabled={uploading}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Kategorie wählen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INVOICE">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Rechnung
                                    </div>
                                </SelectItem>
                                <SelectItem value="PAYPAL">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Zahlungsbeleg
                                    </div>
                                </SelectItem>
                                <SelectItem value="CHAT">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Chats mit Verkäufer
                                    </div>
                                </SelectItem>
                                <SelectItem value="SALES_AD">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4" />
                                        Verkaufsanzeige
                                    </div>
                                </SelectItem>
                                <SelectItem value="EIGENBELEG">
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="h-4 w-4" />
                                        Eigenbeleg
                                    </div>
                                </SelectItem>
                                <SelectItem value="OTHER">
                                    <div className="flex items-center gap-2">
                                        <File className="h-4 w-4" />
                                        Sonstiges
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label htmlFor="file-upload">
                            <Button asChild disabled={uploading} className="w-full sm:w-auto">
                                <span className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploading ? 'Wird hochgeladen...' : 'Datei hochladen'}
                                </span>
                            </Button>
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                            multiple={isMultiUpload}
                        />
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Erlaubte Dateitypen: PDF, PNG, JPG, WEBP, TXT • Max. 10 MB
                    {isMultiUpload && ' • Mehrfach-Upload möglich'}
                </p>

                {/* Files List */}
                {initialFiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Keine Dateien hochgeladen</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {initialFiles.map((file) => {
                            const categoryInfo = getCategoryDisplay(file.category)
                            const Icon = categoryInfo.icon

                            return (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-sm truncate">
                                                {file.file_name}
                                            </p>
                                            <Badge variant="outline" className={`text-xs ${categoryInfo.color} flex-shrink-0`}>
                                                {categoryInfo.label}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                                        </p>
                                    </div>

                                    <div className="flex gap-1 flex-shrink-0">
                                        {file.download_url && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                asChild
                                            >
                                                <a
                                                    href={file.download_url}
                                                    download={file.file_name}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 hover:text-destructive"
                                            onClick={() => handleDelete(file.id, file.file_name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
