import { NextResponse } from 'next/server';
import { commitToGitHub } from '@/lib/github';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret')?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim();

  // If ADMIN_SECRET is not configured on the server
  if (!configuredSecret) {
    console.error('ADMIN_SECRET environment variable is missing on server.');
    return NextResponse.json(
      {
        error:
          'ADMIN_SECRET non è configurato nelle variabili d\'ambiente del server. Aggiungi ADMIN_SECRET nel file .env.local del progetto.'
      },
      { status: 500 }
    );
  }

  // Basic security check
  if (secret !== configuredSecret) {
    return NextResponse.json(
      { error: 'Password non autorizzata. Verifica la chiave inserita.' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // Process image with Sharp
    // 1. Resize to max 1920px width (keeping aspect ratio)
    // 2. Convert to WebP (better compression)
    // 3. Auto-rotate based on EXIF
    const optimizedBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: 1920,
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Create a unique filename with .webp extension
    const timestamp = Date.now();
    const originalName = file.name.split('.').slice(0, -1).join('.');
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}.webp`;
    const filePath = `public/images/${fileName}`;

    // In local development, ensure public/images directory exists and save locally
    if (process.env.NODE_ENV === 'development') {
      try {
        const localDir = path.join(process.cwd(), 'public/images');
        if (!fs.existsSync(localDir)) {
          await fs.promises.mkdir(localDir, { recursive: true });
        }
        await fs.promises.writeFile(path.join(localDir, fileName), optimizedBuffer);
      } catch (fsErr) {
        console.warn('Local fs write image error in dev:', fsErr);
      }
    }

    // Try committing to GitHub
    try {
      await commitToGitHub({
        path: filePath,
        content: optimizedBuffer,
        message: `Upload optimized image: ${fileName} via Admin Console`,
        isBinary: true
      });
    } catch (githubErr: any) {
      // In development, if GITHUB_TOKEN is not configured, local file is already written
      if (
        process.env.NODE_ENV === 'development' &&
        (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO)
      ) {
        return NextResponse.json({
          success: true,
          url: `/images/${fileName}`
        });
      }
      throw githubErr;
    }

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
