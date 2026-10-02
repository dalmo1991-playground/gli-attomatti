import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getContent } from '@/lib/data';
import { commitToGitHub, resolveTargetBranch } from '@/lib/github';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const content = await getContent();
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const branch = resolveTargetBranch(host);

  return NextResponse.json(content, {
    headers: {
      'x-git-branch': branch,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret')?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim();
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const targetBranch = resolveTargetBranch(host);

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
    const json = await request.json();

    // In development, also write directly to the local filesystem for immediate hot-reloading
    if (process.env.NODE_ENV === 'development') {
      try {
        const filePath = path.join(process.cwd(), 'src/data/content.json');
        await fs.promises.writeFile(filePath, JSON.stringify(json, null, 2), 'utf8');
      } catch (fsErr) {
        console.warn('Local fs write error in dev:', fsErr);
      }
    }

    // Try committing to GitHub
    let commitResult: any = null;
    try {
      commitResult = await commitToGitHub({
        path: 'src/data/content.json',
        content: JSON.stringify(json, null, 2),
        message: 'Update site content via Admin Console',
        branch: targetBranch,
        isBinary: false
      });
    } catch (githubErr: any) {
      // In local dev, if GITHUB_TOKEN or GITHUB_REPO is not set, allow local save to succeed
      if (
        process.env.NODE_ENV === 'development' &&
        (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO)
      ) {
        revalidatePath('/', 'layout');
        return NextResponse.json({
          success: true,
          branch: 'locale (sviluppo)',
          shortSha: 'locale',
          msg: 'Contenuto salvato localmente in src/data/content.json (GITHUB_TOKEN non presente in locale).'
        });
      }
      throw githubErr;
    }

    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      branch: commitResult.branch,
      repo: commitResult.repo,
      commitSha: commitResult.commitSha,
      shortSha: commitResult.shortSha,
      commitUrl: commitResult.commitUrl
    });
  } catch (error) {
    console.error('Content update error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
