import { NextResponse } from 'next/server';
import { commitMultipleToGitHub } from '@/lib/github';
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
    // Accept multiple files from 'files' or single from 'file'
    const filesFromAll = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    const allFiles: File[] =
      filesFromAll.length > 0
        ? filesFromAll
        : singleFile
        ? [singleFile]
        : [];

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    const timestamp = Date.now();

    // Process all images in parallel with Sharp
    // 1. Resize to max 1920px width (keeping aspect ratio)
    // 2. Convert to WebP (better compression)
    // 3. Auto-rotate based on EXIF
    const processedFiles = await Promise.all(
      allFiles.map(async (file, idx) => {
        const inputBuffer = Buffer.from(await file.arrayBuffer());
        const optimizedBuffer = await sharp(inputBuffer)
          .rotate()
          .resize({
            width: 1920,
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: 80 })
          .toBuffer();

        const originalName = file.name.split('.').slice(0, -1).join('.') || 'image';
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const fileName = `${timestamp}-${idx}-${randomSuffix}-${sanitizedName}.webp`;
        const filePath = `public/images/${fileName}`;

        return {
          fileName,
          filePath,
          buffer: optimizedBuffer,
          url: `/images/${fileName}`,
          size: optimizedBuffer.length
        };
      })
    );

    // In local development, ensure public/images directory exists and save locally
    if (process.env.NODE_ENV === 'development') {
      try {
        const localDir = path.join(process.cwd(), 'public/images');
        if (!fs.existsSync(localDir)) {
          await fs.promises.mkdir(localDir, { recursive: true });
        }
        for (const item of processedFiles) {
          await fs.promises.writeFile(path.join(localDir, item.fileName), item.buffer);
        }
      } catch (fsErr) {
        console.warn('Local fs write image error in dev:', fsErr);
      }
    }

    // Try committing all images to GitHub in a SINGLE commit
    try {
      const commitMessage =
        processedFiles.length === 1
          ? `Upload optimized image: ${processedFiles[0].fileName} via Admin Console`
          : `Upload batch of ${processedFiles.length} optimized images via Admin Console`;

      await commitMultipleToGitHub({
        files: processedFiles.map((p) => ({
          path: p.filePath,
          content: p.buffer,
          isBinary: true
        })),
        message: commitMessage
      });
    } catch (githubErr: any) {
      // In development, if GITHUB_TOKEN is not configured, local files are already written
      if (
        process.env.NODE_ENV === 'development' &&
        (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO)
      ) {
        return NextResponse.json({
          success: true,
          count: processedFiles.length,
          url: processedFiles[0].url,
          urls: processedFiles.map((p) => p.url),
          items: processedFiles.map((p) => ({
            url: p.url,
            name: p.fileName,
            size: p.size
          }))
        });
      }
      throw githubErr;
    }

    return NextResponse.json({
      success: true,
      count: processedFiles.length,
      url: processedFiles[0].url,
      urls: processedFiles.map((p) => p.url),
      items: processedFiles.map((p) => ({
        url: p.url,
        name: p.fileName,
        size: p.size
      }))
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
