function getLocalGitBranch(): string | undefined {
  // Only meaningful on a developer machine; never spawn git in deployed environments
  if (process.env.NODE_ENV === 'production') return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('child_process') as typeof import('child_process');
    return execSync('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' })
      .toString()
      .trim();
  } catch {
    return undefined;
  }
}

export function resolveTargetBranch(host?: string): string {
  // 1. If host is provided and matches production domain, ALWAYS target main
  if (host) {
    const cleanHost = host.split(':')[0].toLowerCase();
    if (
      cleanHost === 'gliattomatti.ch' ||
      cleanHost === 'www.gliattomatti.ch' ||
      cleanHost.endsWith('.gliattomatti.ch')
    ) {
      return 'main';
    }
  }

  // 2. If running on Vercel with a known commit ref (e.g. 'dev' or 'main')
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    return process.env.VERCEL_GIT_COMMIT_REF;
  }

  // 3. Distinguish by Vercel environment
  if (process.env.VERCEL_ENV === 'production') {
    return 'main';
  }
  if (process.env.VERCEL_ENV === 'preview') {
    return 'dev';
  }

  // 4. Explicit override via env variable if set
  if (process.env.GITHUB_BRANCH) {
    return process.env.GITHUB_BRANCH;
  }

  // 5. Fallback for local development or other hosting environments
  return (
    process.env.CF_PAGES_BRANCH ||
    process.env.BRANCH ||
    getLocalGitBranch() ||
    'dev'
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface GitHubContext {
  repo: string;
  branch: string;
  headers: Record<string, string>;
}

/**
 * Reads GitHub credentials from the environment and builds the common request context.
 * Throws if GITHUB_TOKEN / GITHUB_REPO are not configured.
 */
function getGitHubContext(overrideBranch?: string): GitHubContext {
  const token = process.env.GITHUB_TOKEN;
  const rawRepo = process.env.GITHUB_REPO;
  if (!token || !rawRepo) {
    throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured');
  }

  return {
    repo: rawRepo.replace('https://github.com/', '').replace(/\/$/, ''),
    branch: overrideBranch || resolveTargetBranch(),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Attomatti-CMS'
    }
  };
}

async function githubError(res: Response, what: string): Promise<Error> {
  const err = await res.json().catch(() => ({}));
  return new Error(`${what}: ${err.message || res.statusText}`);
}

function toBase64(content: string | Buffer, isBinary?: boolean): string {
  return isBinary
    ? (content as Buffer).toString('base64')
    : Buffer.from(content as string).toString('base64');
}

/**
 * Creates ONE commit on the target branch applying the given tree items
 * (Git Data API: ref -> base tree -> new tree -> commit -> ref update).
 * A tree item with `sha: null` deletes the file.
 */
async function commitTree(
  ctx: GitHubContext,
  treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string | null }>,
  message: string
) {
  const { repo, branch, headers } = ctx;
  const api = `https://api.github.com/repos/${repo}/git`;

  // 1. Latest commit on the branch
  const refRes = await fetch(`${api}/ref/heads/${branch}`, { cache: 'no-store', headers });
  if (!refRes.ok) throw await githubError(refRes, `Failed to get branch ref (${branch})`);
  const latestCommitSha: string | undefined = (await refRes.json()).object?.sha;
  if (!latestCommitSha) throw new Error(`Unable to resolve commit SHA for branch ${branch}`);

  // 2. Base tree of that commit
  const commitRes = await fetch(`${api}/commits/${latestCommitSha}`, { cache: 'no-store', headers });
  if (!commitRes.ok) throw await githubError(commitRes, `Failed to get commit (${latestCommitSha})`);
  const baseTreeSha: string | undefined = (await commitRes.json()).tree?.sha;
  if (!baseTreeSha) throw new Error(`Unable to resolve base tree SHA for commit ${latestCommitSha}`);

  // 3. New tree
  const treeRes = await fetch(`${api}/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
  });
  if (!treeRes.ok) throw await githubError(treeRes, 'Failed to create Git tree');
  const newTreeSha: string = (await treeRes.json()).sha;

  // 4. New commit
  const newCommitRes = await fetch(`${api}/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, tree: newTreeSha, parents: [latestCommitSha] })
  });
  if (!newCommitRes.ok) throw await githubError(newCommitRes, 'Failed to create Git commit');
  const newCommitSha: string = (await newCommitRes.json()).sha;

  // 5. Fast-forward the branch (never forced)
  const updateRefRes = await fetch(`${api}/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: newCommitSha, force: false })
  });
  if (!updateRefRes.ok) {
    throw await githubError(updateRefRes, `Failed to update branch ${branch} to ${newCommitSha}`);
  }

  return {
    success: true,
    branch,
    repo,
    commitSha: newCommitSha,
    shortSha: newCommitSha.substring(0, 7),
    commitUrl: `https://github.com/${repo}/commit/${newCommitSha}`,
    count: treeItems.length
  };
}

/**
 * Commits a file to GitHub via the REST API.
 */
export async function commitToGitHub({
  path,
  content,
  message,
  branch: overrideBranch,
  isBinary = false
}: {
  path: string;
  content: string | Buffer;
  message: string;
  branch?: string;
  isBinary?: boolean;
}) {
  const ctx = getGitHubContext(overrideBranch);
  const { repo, branch, headers } = ctx;
  const baseUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  // 1. Existing file SHA (if the file already exists)
  let sha: string | undefined;
  try {
    const res = await fetch(`${baseUrl}?ref=${branch}`, { cache: 'no-store', headers });
    if (res.ok) {
      sha = (await res.json()).sha;
    }
  } catch {
    // File likely doesn't exist yet
  }

  // 2. Push (with sha updates the file; without creates it)
  const pushRes = await fetch(baseUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message, content: toBase64(content, isBinary), branch, sha })
  });

  if (!pushRes.ok) {
    throw await githubError(pushRes, 'GitHub API Error');
  }

  const data = await pushRes.json();
  const commitSha: string | undefined = data.commit?.sha || data.sha;
  const shortSha = commitSha ? commitSha.substring(0, 7) : undefined;
  const commitUrl: string | undefined =
    data.commit?.html_url ||
    data.html_url ||
    (commitSha ? `https://github.com/${repo}/commit/${commitSha}` : undefined);

  return {
    ...data,
    branch,
    repo,
    commitSha,
    shortSha,
    commitUrl
  };
}

/**
 * Lists images stored under public/images in GitHub repository via REST API.
 */
export async function listGitHubImages(branchOverride?: string): Promise<Array<{ url: string; name: string; size?: number }>> {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    return [];
  }

  const { repo, branch, headers } = getGitHubContext(branchOverride);
  const url = `https://api.github.com/repos/${repo}/contents/public/images?ref=${branch}`;

  try {
    const res = await fetch(url, { cache: 'no-store', headers });

    if (!res.ok) {
      console.warn(`[GitHub API] List images failed with status ${res.status}`);
      return [];
    }

    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items
      .filter((item: any) => item.type === 'file' && /\.(webp|jpg|jpeg|png|gif|svg)$/i.test(item.name))
      .map((item: any) => ({
        url: `/images/${item.name}`,
        name: item.name,
        size: item.size
      }));
  } catch (err) {
    console.warn('[GitHub API] List images error:', err);
    return [];
  }
}

export interface GitFileCommit {
  path: string;
  content: string | Buffer;
  isBinary?: boolean;
}

/**
 * Commits multiple files in a SINGLE Git commit using GitHub's Git Data API
 * (Blobs -> Tree -> Commit -> Ref update).
 */
export async function commitMultipleToGitHub({
  files,
  message,
  branch: overrideBranch
}: {
  files: GitFileCommit[];
  message: string;
  branch?: string;
}) {
  if (!files || files.length === 0) {
    return { success: true, count: 0 };
  }

  // A single file goes through the simpler Contents API
  if (files.length === 1) {
    return commitToGitHub({
      path: files[0].path,
      content: files[0].content,
      message,
      branch: overrideBranch,
      isBinary: files[0].isBinary
    });
  }

  const ctx = getGitHubContext(overrideBranch);

  const treeItems = await Promise.all(
    files.map(async (file) => {
      const blobRes = await fetch(`https://api.github.com/repos/${ctx.repo}/git/blobs`, {
        method: 'POST',
        headers: ctx.headers,
        body: JSON.stringify({ content: toBase64(file.content, file.isBinary), encoding: 'base64' })
      });
      if (!blobRes.ok) throw await githubError(blobRes, `Failed to create blob for ${file.path}`);

      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: (await blobRes.json()).sha as string
      };
    })
  );

  return commitTree(ctx, treeItems, message);
}

/**
 * Deletes multiple files in a SINGLE Git commit (tree items with sha: null).
 */
export async function deleteMultipleFromGitHub({
  paths,
  message,
  branch: overrideBranch
}: {
  paths: string[];
  message: string;
  branch?: string;
}) {
  if (!paths || paths.length === 0) {
    return { success: true, count: 0 };
  }

  const ctx = getGitHubContext(overrideBranch);
  const treeItems = paths.map((p) => ({
    path: p,
    mode: '100644' as const,
    type: 'blob' as const,
    sha: null
  }));

  return commitTree(ctx, treeItems, message);
}

/**
 * Creates a Git Blob on GitHub without committing it yet.
 * Returns the blob SHA.
 */
export async function createGitHubBlob({
  content,
  isBinary = true
}: {
  content: string | Buffer;
  isBinary?: boolean;
}): Promise<string> {
  const { repo, headers } = getGitHubContext();

  const res = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: toBase64(content, isBinary), encoding: 'base64' })
  });
  if (!res.ok) throw await githubError(res, 'Failed to create blob');

  return (await res.json()).sha;
}

/**
 * Commits a list of previously staged Git blobs (path + sha) in a SINGLE commit.
 */
export async function commitTreeItems({
  items,
  message,
  branch: overrideBranch
}: {
  items: Array<{ path: string; sha: string }>;
  message: string;
  branch?: string;
}) {
  if (!items || items.length === 0) return { success: true, count: 0, commitSha: undefined, commitUrl: undefined };

  const ctx = getGitHubContext(overrideBranch);
  const treeItems = items.map((item) => ({
    path: item.path,
    mode: '100644' as const,
    type: 'blob' as const,
    sha: item.sha
  }));

  return commitTree(ctx, treeItems, message);
}
