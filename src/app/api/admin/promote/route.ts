import { NextResponse } from 'next/server';
import {
  fetchFileFromBranch,
  getBranchGitTree,
  commitSyncToBranch
} from '@/lib/github';
import {
  applyScopedPromotion,
  extractImagesFromValue
} from '@/lib/contentScopes';

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret')?.trim();
  const configuredSecret = process.env.ADMIN_SECRET?.trim();

  const { constantTimeCompare, getClientIp, checkRateLimit } = await import('@/lib/security');
  const clientIp = getClientIp(request);

  // Rate limiting to protect against abuse
  const rateCheck = checkRateLimit(`promote-action:${clientIp}`, 20, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Troppe richieste di promozione ravvicinate. Attendi un istante.' },
      { status: 429 }
    );
  }

  if (configuredSecret && !constantTimeCompare(secret, configuredSecret)) {
    return NextResponse.json({ error: 'Password non autorizzata.' }, { status: 401 });
  }

  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    return NextResponse.json(
      {
        error:
          'GITHUB_TOKEN o GITHUB_REPO non sono configurati sul server (.env.local). Impossibile eseguire commit su GitHub.'
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      sourceBranch,
      targetBranch,
      mode, // 'page' | 'raw_json'
      jsonPath, // if mode === 'page'
      pageUrl, // if mode === 'page'
      customTargetContent, // if mode === 'raw_json'
      message: customMessage
    } = body;

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const currentEnvBranch = (await import('@/lib/github')).resolveTargetBranch(host);

    if (!sourceBranch || !targetBranch || sourceBranch === targetBranch) {
      return NextResponse.json(
        { error: 'Branch sorgente e destinazione non validi o identici.' },
        { status: 400 }
      );
    }

    if (sourceBranch !== 'dev' && sourceBranch !== 'main') {
      return NextResponse.json({ error: 'Branch sorgente non supportato.' }, { status: 400 });
    }
    if (targetBranch !== 'dev' && targetBranch !== 'main') {
      return NextResponse.json({ error: 'Branch destinazione non supportato.' }, { status: 400 });
    }

    // SICUREZZA INDEROGABILE: PULL-ONLY. Si può scrivere SOLO sul branch dell'ambiente corrente.
    if (targetBranch !== currentEnvBranch) {
      return NextResponse.json(
        {
          error: `Operazione non consentita: per sicurezza puoi solo importare (PULL) contenuti nel tuo ambiente corrente ("${currentEnvBranch}"). Non è permesso sovrascrivere direttamente un ambiente esterno ("${targetBranch}"). Passa alla console di ${targetBranch} per effettuare promozioni verso di esso.`
        },
        { status: 403 }
      );
    }

    // 1. Fetch current content from both branches
    const [fileSource, fileTarget] = await Promise.all([
      fetchFileFromBranch('src/data/content.json', sourceBranch),
      fetchFileFromBranch('src/data/content.json', targetBranch)
    ]);

    if (!fileSource?.content || !fileTarget?.content) {
      return NextResponse.json(
        { error: 'Impossibile recuperare content.json da uno dei branch.' },
        { status: 500 }
      );
    }

    const sourceContent = JSON.parse(fileSource.content);
    const targetContent = JSON.parse(fileTarget.content);

    let resultingTargetContent: any = null;
    let imagesToCheck: string[] = [];
    let defaultMessage = '';

    // 2. Compute resulting target content based on mode
    if (mode === 'page') {
      if (!jsonPath) {
        return NextResponse.json({ error: 'Parametro jsonPath mancante per lo scope di pagina.' }, { status: 400 });
      }

      resultingTargetContent = applyScopedPromotion(targetContent, sourceContent, jsonPath);

      // Extract images referenced in the promoted slice
      const promotedSlice = body.promotedSlice || sourceContent;
      imagesToCheck = extractImagesFromValue(promotedSlice);
      defaultMessage = `Promote page ${pageUrl || jsonPath} (${sourceBranch} -> ${targetBranch}) via Admin`;
    } else if (mode === 'raw_json') {
      if (!customTargetContent || typeof customTargetContent !== 'object') {
        return NextResponse.json({ error: 'customTargetContent non valido.' }, { status: 400 });
      }
      resultingTargetContent = customTargetContent;
      imagesToCheck = extractImagesFromValue(customTargetContent);
      defaultMessage = `Apply line-by-line promote (${sourceBranch} -> ${targetBranch}) via Admin`;
    } else {
      return NextResponse.json({ error: 'Modalità di promozione non valida (ammessi: page, raw_json).' }, { status: 400 });
    }

    const commitMessage = customMessage?.trim() || defaultMessage;

    // 3. Image sync: find which referenced images exist in source git tree but miss in target git tree
    const [treeSource, treeTarget] = await Promise.all([
      getBranchGitTree(sourceBranch, 'public/images'),
      getBranchGitTree(targetBranch, 'public/images')
    ]);

    const sourceTreeMap = new Map<string, { path: string; sha: string }>();
    treeSource.forEach((item) => sourceTreeMap.set(item.path, item));

    const targetTreeMap = new Set<string>();
    treeTarget.forEach((item) => targetTreeMap.add(item.path));

    const extraBlobsToCopy: Array<{ path: string; sha: string }> = [];

    for (const imgUrl of imagesToCheck) {
      const cleanRel = imgUrl.startsWith('/') ? imgUrl.slice(1) : imgUrl;
      const repoPath = cleanRel.startsWith('public/') ? cleanRel : `public/${cleanRel}`;

      // If it exists in source and NOT in target, copy the blob
      if (sourceTreeMap.has(repoPath) && !targetTreeMap.has(repoPath)) {
        const item = sourceTreeMap.get(repoPath)!;
        extraBlobsToCopy.push({
          path: repoPath,
          sha: item.sha
        });
      }
    }

    // 4. Commit atomically to GitHub targetBranch
    const formattedJson = JSON.stringify(resultingTargetContent, null, 2);
    const commitResult = await commitSyncToBranch({
      targetBranch,
      contentJsonString: formattedJson,
      extraBlobs: extraBlobsToCopy,
      message: commitMessage
    });

    return NextResponse.json({
      success: true,
      commitSha: commitResult.commitSha,
      shortSha: commitResult.shortSha,
      commitUrl: commitResult.commitUrl,
      targetBranch,
      copiedImagesCount: extraBlobsToCopy.length,
      copiedImages: extraBlobsToCopy.map((b) => b.path)
    });
  } catch (error) {
    console.error('[API Promote] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
