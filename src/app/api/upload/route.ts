import { NextResponse } from 'next/server';
import { commitToGitHub } from '@/lib/github';
import sharp from 'sharp';

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret');

  // Basic security check
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    
    // Process image with Sharp
    // 1. Resize to max 1920px width (keeping aspect ratio)
    // 2. Convert to WebP (better compression)
    // 3. Auto-rotate based on EXIF
    const optimizedBuffer = await sharp(inputBuffer)
      .rotate() // Handles EXIF orientation
      .resize({
        width: 1920,
        withoutEnlargement: true, // Don't upscale small images
        fit: 'inside'
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Create a unique filename with .webp extension
    const timestamp = Date.now();
    const originalName = file.name.split('.').slice(0, -1).join('.'); // Remove original extension
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}.webp`;
    const filePath = `public/images/${fileName}`;

    // Commit the optimized image to GitHub
    await commitToGitHub({
      path: filePath,
      content: optimizedBuffer,
      message: `Upload optimized image: ${fileName} via Admin Console`,
      isBinary: true
    });

    const publicUrl = `/images/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
