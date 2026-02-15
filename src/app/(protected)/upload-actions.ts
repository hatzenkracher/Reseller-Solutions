'use server';

import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function uploadFile(deviceId: string, formData: FormData) {
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'OTHER';

    if (!file) {
        throw new Error('No file uploaded');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists: public/uploads/{deviceId}
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', deviceId);
    await mkdir(uploadDir, { recursive: true });

    // Create filename (keep original name or unique? User said: "In diesem Ordner sollen Belege... gespeichert werden")
    // Let's keep original name simple but safe, or adding timestamp to avoid conflicts.
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, filename);

    // Write file
    await writeFile(filePath, buffer);

    // Save to DB
    // Public URL path
    const publicPath = `/uploads/${deviceId}/${filename}`;

    try {
        await prisma.document.create({
            data: {
                deviceId,
                filePath: publicPath,
                category,
            }
        });
        revalidatePath(`/devices/${deviceId}`);
        return { success: true };
    } catch (e) {
        console.error("DB Error", e);
        return { success: false, error: "Database error" };
    }
}

export async function deleteFile(documentId: number) {
    const doc = await prisma.document.findUnique({
        where: { id: documentId }
    });

    if (!doc) return { success: false, error: "Document not found" };

    try {
        // Remove from DB first
        await prisma.document.delete({ where: { id: documentId } });

        // Remove from disk
        const absolutePath = path.join(process.cwd(), 'public', doc.filePath);
        await unlink(absolutePath).catch(err => console.error("File deletion error (might define missing)", err));

        revalidatePath(`/devices/${doc.deviceId}`);
        return { success: true };
    } catch (e) {
        console.error("Delete Error", e);
        return { success: false, error: "Delete failed" };
    }
}
