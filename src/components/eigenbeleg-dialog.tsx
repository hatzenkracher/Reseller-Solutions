'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface EigenbelegDialogProps {
    deviceId: string
}

export function EigenbelegDialog({ deviceId }: EigenbelegDialogProps) {
    const [open, setOpen] = useState(false)
    const [recipientName, setRecipientName] = useState('')
    const defaultReason = 'Ankauf eines gebrauchten Geräts von einer Privatperson. Privatverkäufer stellt keine Rechnung aus.'
    const [reason, setReason] = useState(defaultReason)
    const [generating, setGenerating] = useState(false)
    const router = useRouter()

    const handleGenerate = async () => {
        if (!recipientName.trim()) {
            toast.error('Bitte gib einen Namen ein.')
            return
        }

        setGenerating(true)
        try {
            const response = await fetch(`/api/devices/${deviceId}/generate-receipt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientName: recipientName.trim(),
                    reason: reason.trim(),
                }),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success(`Eigenbeleg erstellt: ${result.fileName}`)
                setOpen(false)
                setRecipientName('')
                setReason(defaultReason)
                router.refresh()
            } else {
                toast.error(result.error || 'Eigenbeleg konnte nicht erstellt werden')
            }
        } catch (error) {
            toast.error('Ein Fehler ist aufgetreten')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Eigenbeleg generieren
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Eigenbeleg generieren</DialogTitle>
                    <DialogDescription>
                        Eigenbeleg-Nr.: {deviceId}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="recipientName">
                            Name (Gegenpartei / Verkäufer) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="recipientName"
                            placeholder="z.B. Max Mustermann"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            disabled={generating}
                        />
                        <p className="text-xs text-muted-foreground">
                            Die Person, von der das Gerät gekauft wurde.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Grund für Eigenbeleg</Label>
                        <textarea
                            id="reason"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="z.B. Privatverkauf ohne Rechnung"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={generating}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={generating}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || !recipientName.trim()}
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Wird erstellt...
                            </>
                        ) : (
                            <>
                                <FileText className="h-4 w-4 mr-2" />
                                Eigenbeleg erstellen
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
