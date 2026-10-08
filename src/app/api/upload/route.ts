import { NextResponse } from 'next/server';
import { commitMultipleToGitHub, createGitHubBlob, commitTreeItems } from '@/lib/github';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret')?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim();

  const { constantTimeCompare, getClientIp, checkRateLimit } = await import('@/lib/security');
  const clientIp = getClientIp(request);

  const rateCheck = checkRateLimit(`upload-action:${clientIp}`, 40, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Troppe richieste di upload in poco tempo. Attendi un momento prima di riprovare.' },
      { status: 429 }
    );
  }

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

  // Timing-safe security check
  if (!constantTimeCompare(secret, configuredSecret)) {
    return NextResponse.json(
      { error: 'Password non autorizzata. Verifica la chiave inserita.' },
      { status: 401 }
    );
  }

  const contentType = request.headers.get('content-type') || '';

  // 1. COMMIT STAGED BATCH (JSON request: small 1KB payload, commits all blobs in 1 commit)
  if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      if (body.action === 'commit') {
        const items = (body.items || []) as Array<{ path: string; sha: string; url?: string }>;
        if (items.length === 0) {
          return NextResponse.json({ error: 'Nessun elemento da committare' }, { status: 400 });
        }

        const commitMessage =
          body.message ||
          (items.length === 1
            ? `Upload image: ${path.basename(items[0].path)} via Admin Console`
            : `Upload batch of ${items.length} images via Admin Console`);

        let commitSha: string | undefined;
        let commitUrl: string | undefined;

        if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
          const commitResult = await commitTreeItems({
            items: items.filter((i) => i.sha),
            message: commitMessage
          });
          commitSha = commitResult.commitSha;
          commitUrl = commitResult.commitUrl;
        }

        return NextResponse.json({
          success: true,
          count: items.length,
          urls: items.map((i) => i.url || `/${i.path.replace(/^public\//, '')}`),
          commitSha,
          commitUrl
        });
      }
    } catch (err) {
      console.error('Error committing staged batch:', err);
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  // 2. FORM DATA (STAGE SINGLE FILE OR BATCH UPLOAD)
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string | null;

    // A. STAGE A SINGLE FILE (Uploads 1 pre-compressed file, creates blob, NO commit yet)
    if (action === 'stage') {
      const file = (formData.get('file') || formData.get('files')) as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Nessun file fornito per lo staging' }, { status: 400 });
      }

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

      const timestamp = Date.now();
      const originalName = file.name.split('.').slice(0, -1).join('.') || 'image';
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const fileName = `${timestamp}-${randomSuffix}-${sanitizedName}.webp`;
      const filePath = `public/images/${fileName}`;

      // Local filesystem save in dev
      if (process.env.NODE_ENV === 'development') {
        try {
          const localDir = path.join(process.cwd(), 'public/images');
          if (!fs.existsSync(localDir)) {
            await fs.promises.mkdir(localDir, { recursive: true });
          }
          await fs.promises.writeFile(path.join(localDir, fileName), optimizedBuffer);
        } catch (fsErr) {
          console.warn('Local fs write error in dev:', fsErr);
        }
      }

      let blobSha: string | undefined;
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
        blobSha = await createGitHubBlob({
          content: optimizedBuffer,
          isBinary: true
        });
      }

      return NextResponse.json({
        success: true,
        fileName,
        filePath,
        url: `/images/${fileName}`,
        blobSha: blobSha || '',
        size: optimizedBuffer.length
      });
    }

    // B. STANDARD UPLOAD (Single or small batch direct upload)
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
