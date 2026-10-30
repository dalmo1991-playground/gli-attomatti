import { NextResponse } from 'next/server';
import {
  fetchFileFromBranch,
  getBranchGitTree,
  getBranchLastCommit,
  resolveTargetBranch
} from '@/lib/github';
import {
  discoverPageScopes,
  resolveScopedValue,
  extractImagesFromValue
} from '@/lib/contentScopes';

export async function GET(request: Request) {
  const secret = request.headers.get('x-admin-secret')?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim();

  const { constantTimeCompare } = await import('@/lib/security');
  if (configuredSecret && !constantTimeCompare(secret, configuredSecret)) {
    return NextResponse.json({ error: 'Password non autorizzata.' }, { status: 401 });
  }

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const currentEnvBranch = resolveTargetBranch(host);

  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    return NextResponse.json(
      {
        error:
          'GITHUB_TOKEN o GITHUB_REPO non sono configurati nell\'ambiente corrente (.env.local). La comparazione e la sincronizzazione con GitHub richiedono queste variabili.'
      },
      { status: 503 }
    );
  }

  try {
    // 1. Fetch content.json from both branches in parallel
    const [fileDev, fileMain, commitDev, commitMain, imagesDev, imagesMain] = await Promise.all([
      fetchFileFromBranch('src/data/content.json', 'dev'),
      fetchFileFromBranch('src/data/content.json', 'main'),
      getBranchLastCommit('dev'),
      getBranchLastCommit('main'),
      getBranchGitTree('dev', 'public/images'),
      getBranchGitTree('main', 'public/images')
    ]);

    let contentDev: any = null;
    let contentMain: any = null;

    try {
      contentDev = fileDev?.content ? JSON.parse(fileDev.content) : null;
    } catch (e) {
      console.warn('Failed to parse dev content.json:', e);
    }

    try {
      contentMain = fileMain?.content ? JSON.parse(fileMain.content) : null;
    } catch (e) {
      console.warn('Failed to parse main content.json:', e);
    }

    if (!contentDev || !contentMain) {
      return NextResponse.json(
        {
          error: 'Impossibile leggere content.json da uno o entrambi i branch (dev/main). Verifica le credenziali GitHub.'
        },
        { status: 500 }
      );
    }

    // 2. Build image map for fast lookup: path -> { sha, size }
    const devImageMap = new Map<string, { sha: string; size?: number }>();
    imagesDev.forEach((img) => devImageMap.set(img.path, img));

    const mainImageMap = new Map<string, { sha: string; size?: number }>();
    imagesMain.forEach((img) => mainImageMap.set(img.path, img));

    // 3. Discover scopes dynamically
    const allScopes = discoverPageScopes(contentDev, contentMain);

    // 4. Compare scope by scope
    const scopedDiffs = allScopes.map((scope) => {
      const devVal = resolveScopedValue(contentDev, scope.jsonPath);
      const mainVal = resolveScopedValue(contentMain, scope.jsonPath);

      const devStr = JSON.stringify(devVal ?? null);
      const mainStr = JSON.stringify(mainVal ?? null);
      const hasDiff = devStr !== mainStr;

      // Extract images referenced in dev and main for this scope
      const devImages = extractImagesFromValue(devVal);
      const mainImages = extractImagesFromValue(mainVal);

      // Images in dev that don't exist in main branch git tree
      const devMissingOnMain = devImages.filter((img) => {
        const repoPath = img.startsWith('/') ? `public${img}` : `public/${img}`;
        return !mainImageMap.has(repoPath) && devImageMap.has(repoPath);
      });

      // Images in main that don't exist in dev branch git tree
      const mainMissingOnDev = mainImages.filter((img) => {
        const repoPath = img.startsWith('/') ? `public${img}` : `public/${img}`;
        return !devImageMap.has(repoPath) && mainImageMap.has(repoPath);
      });

      return {
        scope,
        hasDiff,
        devValue: devVal,
        mainValue: mainVal,
        devImagesCount: devImages.length,
        mainImagesCount: mainImages.length,
        devMissingOnMain,
        mainMissingOnDev
      };
    });

    // 5. Total counts
    const totalDiffCount = scopedDiffs.filter((s) => s.hasDiff).length;

    return NextResponse.json({
      success: true,
      currentEnvBranch,
      branches: {
        dev: {
          name: 'dev',
          lastCommit: commitDev,
          imagesCount: imagesDev.length,
          fileSha: fileDev?.sha
        },
        main: {
          name: 'main',
          lastCommit: commitMain,
          imagesCount: imagesMain.length,
          fileSha: fileMain?.sha
        }
      },
      content: {
        dev: contentDev,
        main: contentMain
      },
      scopes: scopedDiffs,
      totalDiffCount
    });
  } catch (error) {
    console.error('[API Compare] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
