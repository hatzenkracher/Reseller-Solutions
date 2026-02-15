import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = Date.now() + '_' + file.name.replace(/\s/g, '_');
        const uploadDir = path.join(process.cwd(), 'public/uploads'); // Ensure this directory exists
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Return the relative path for storing in DB
        const relativePath = `/uploads/${filename}`;

        return NextResponse.json({ success: true, path: relativePath });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
