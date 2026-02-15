"use client"

import { useState } from "react"
import { Document } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, FileText, Upload } from "lucide-react"
import { uploadFile, deleteFile } from "@/app/(protected)/upload-actions"
import { toast } from "sonner"
import Link from "next/link"

interface DocumentListProps {
    deviceId: string;
    documents: Document[];
}

export function DocumentList({ deviceId, documents }: DocumentListProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [category, setCategory] = useState("OTHER");

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsUploading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("category", category);

        try {
            const res = await uploadFile(deviceId, formData);
            if (res.success) {
                toast.success("Datei hochgeladen");
                // Reset form
                (e.target as HTMLFormElement).reset();
            } else {
                toast.error("Fehler beim Hochladen");
            }
        } catch (err) {
            toast.error("Fehler beim Hochladen");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Datei wirklich löschen?")) return;

        const res = await deleteFile(id);
        if (res.success) {
            toast.success("Datei gelöscht");
        } else {
            toast.error("Fehler beim Löschen");
        }
    }

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Dokumente & Belege</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Upload Form */}
                <form onSubmit={handleUpload} className="flex gap-4 items-end border p-4 rounded-md bg-muted/20">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">Datei auswählen</Label>
                        <Input id="file" name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                    <div className="w-[200px]">
                        <Label htmlFor="category">Kategorie</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Kategorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PAYPAL">PayPal Beleg</SelectItem>
                                <SelectItem value="INVOICE">Rechnung</SelectItem>
                                <SelectItem value="CHAT">Kleinanzeigen Chat</SelectItem>
                                <SelectItem value="OTHER">Sonstiges</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={isUploading}>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "..." : "Hochladen"}
                    </Button>
                </form>

                {/* Document List */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Datei</TableHead>
                                <TableHead>Kategorie</TableHead>
                                <TableHead>Datum</TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <Link href={doc.filePath} target="_blank" className="hover:underline">
                                            {doc.filePath.split('/').pop()}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{doc.category}</TableCell>
                                    <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {documents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Keine Dokumente vorhanden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
