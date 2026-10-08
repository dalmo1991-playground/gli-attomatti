import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { listGitHubImages, deleteMultipleFromGitHub } from '@/lib/github';
import contentData from '@/data/content.json';

export interface MediaImage {
  url: string;
  name: string;
  timestamp: number;
  size?: number;
  folder?: string;
}

function extractNameAndTimestamp(filename: string): { name: string; timestamp: number } {
  // Pattern: 1782553836322-DSC_0980.webp
  const match = filename.match(/^(\d{10,14})-(.+)\.[^.]+$/);
  if (match) {
    const timestamp = parseInt(match[1], 10);
    const cleanName = match[2].replace(/[-_]/g, ' ');
    return { name: cleanName, timestamp };
  }

  // Without timestamp prefix
  const baseName = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  return { name: baseName, timestamp: 0 };
}

function scanLocalImages(dir: string, baseDir: string = dir): MediaImage[] {
  const results: MediaImage[] = [];
  if (!fs.existsSync(dir)) return results;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...scanLocalImages(fullPath, baseDir));
      } else if (entry.isFile() && /\.(webp|jpg|jpeg|png|gif|svg)$/i.test(entry.name)) {
        try {
          const stats = fs.statSync(fullPath);
          const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const url = `/images/${relPath}`;
          const { name, timestamp } = extractNameAndTimestamp(entry.name);
          const folder = path.dirname(relPath) !== '.' ? path.dirname(relPath).replace(/\\/g, '/') : undefined;

          results.push({
            url,
            name,
            timestamp: timestamp || stats.mtimeMs || 0,
            size: stats.size,
            folder
          });
        } catch (e) {
          // ignore stat errors
        }
      }
    }
  } catch (err) {
    console.warn('[Images API] Local scan error:', err);
  }

  return results;
}

function extractImagesFromContent(data: any): string[] {
  const images = new Set<string>();

  function traverse(node: any) {
    if (!node) return;
    if (typeof node === 'string') {
      if (node.startsWith('/images/') || node.match(/\.(webp|jpg|jpeg|png|gif|svg)$/i)) {
        const cleanUrl = node.startsWith('/') ? node : `/${node}`;
        images.add(cleanUrl);
      }
    } else if (Array.isArray(node)) {
      node.forEach(traverse);
    } else if (typeof node === 'object') {
      Object.values(node).forEach(traverse);
    }
  }

  traverse(data);
  return Array.from(images);
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-admin-secret')?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim();

  const { constantTimeCompare } = await import('@/lib/security');

  // Enforce ADMIN_SECRET if configured; in production require it
  if (configuredSecret) {
    if (!constantTimeCompare(secret, configuredSecret)) {
      return NextResponse.json(
        { error: 'Password non autorizzata.' },
        { status: 401 }
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'ADMIN_SECRET non configurato sul server.' },
      { status: 500 }
    );
  }

  const imageMap = new Map<string, MediaImage>();

  // 1. Scan local filesystem public/images
  try {
    const publicImagesDir = path.join(process.cwd(), 'public/images');
    const localFiles = scanLocalImages(publicImagesDir);
    for (const img of localFiles) {
      imageMap.set(img.url, img);
    }
  } catch (err) {
    console.warn('[Images API] Local fs read failed:', err);
  }

  // 2. Fetch from GitHub if configured
  try {
    const githubImages = await listGitHubImages();
    for (const gh of githubImages) {
      if (!imageMap.has(gh.url)) {
        const { name, timestamp } = extractNameAndTimestamp(gh.name);
        imageMap.set(gh.url, {
          url: gh.url,
          name,
          timestamp,
          size: gh.size
        });
      }
    }
  } catch (err) {
    console.warn('[Images API] GitHub fetch failed:', err);
  }

  // 3. Fallback / supplement: check images used across content.json
  try {
    const contentImages = extractImagesFromContent(contentData);
    for (const url of contentImages) {
      if (!imageMap.has(url)) {
        const filename = path.basename(url);
        const { name, timestamp } = extractNameAndTimestamp(filename);
        imageMap.set(url, {
          url,
          name,
          timestamp: timestamp || 0
        });
      }
    }
  } catch (err) {
    console.warn('[Images API] content.json extract failed:', err);
  }

  // Convert to array and sort newest first (by timestamp descending)
  const sortedImages = Array.from(imageMap.values()).sort((a, b) => {
    if (b.timestamp !== a.timestamp) {
      return b.timestamp - a.timestamp;
    }
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({
    success: true,
    total: sortedImages.length,
    images: sortedImages
  });
}

export async function DELETE(request: Request) {
  const secret = request.headers.get('x-admin-secret')?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim();

  const { constantTimeCompare } = await import('@/lib/security');

  // If ADMIN_SECRET is not configured on the server
  if (!configuredSecret) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET non è configurato sul server.' },
      { status: 500 }
    );
  }

  // Security check with constant-time comparison
  if (!constantTimeCompare(secret, configuredSecret)) {
    return NextResponse.json(
      { error: 'Password non autorizzata.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls
      : body.url
      ? [body.url]
      : [];

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'Nessun URL fornito per l\'eliminazione.' },
        { status: 400 }
      );
    }

    // Sanitize and resolve repo paths and local paths strictly within public/images
    const allowedBaseDir = path.resolve(process.cwd(), 'public/images');
    const filesToDelete = urls.map((url) => {
      const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
      const subPath = cleanUrl.replace(/^images\//, '');
      const localPath = path.resolve(allowedBaseDir, subPath);

      if (!localPath.startsWith(allowedBaseDir)) {
        throw new Error(`Percorso non consentito: ${url}`);
      }

      const relPath = path.relative(allowedBaseDir, localPath).replace(/\\/g, '/');
      const repoPath = `public/images/${relPath}`;
      return { url, repoPath, localPath };
    });

    // 1. Delete from local filesystem
    for (const item of filesToDelete) {
      try {
        if (fs.existsSync(item.localPath)) {
          await fs.promises.unlink(item.localPath);
        }
      } catch (fsErr) {
        console.warn(`[Images API] Local fs unlink error for ${item.localPath}:`, fsErr);
      }
    }

    // 2. Delete from GitHub in 1 single commit
    try {
      const commitMessage =
        filesToDelete.length === 1
          ? `Delete image: ${path.basename(filesToDelete[0].repoPath)} via Admin Console`
          : `Delete batch of ${filesToDelete.length} images via Admin Console`;

      await deleteMultipleFromGitHub({
        paths: filesToDelete.map((f) => f.repoPath),
        message: commitMessage
      });
    } catch (githubErr: any) {
      // In development, if GITHUB_TOKEN is not configured, local files are already deleted
      if (
        process.env.NODE_ENV === 'development' &&
        (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO)
      ) {
        return NextResponse.json({
          success: true,
          count: filesToDelete.length,
          deletedUrls: filesToDelete.map((f) => f.url)
        });
      }
      throw githubErr;
    }

    return NextResponse.json({
      success: true,
      count: filesToDelete.length,
      deletedUrls: filesToDelete.map((f) => f.url)
    });
  } catch (error) {
    console.error('Delete error in /api/images:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
