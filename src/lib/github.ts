import { execSync } from 'child_process';

function getLocalGitBranch(): string | undefined {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' })
      .toString()
      .trim();
  } catch (e) {
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
  const token = process.env.GITHUB_TOKEN;
  let repo = process.env.GITHUB_REPO; // e.g. "owner/repo"
  const branch = overrideBranch || resolveTargetBranch();


  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured');
  }

  const maskedToken = `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  console.log(`[GitHub API] Config: Repo=${repo}, Branch=${branch}, Token=${maskedToken} (len: ${token.length})`);

  // Sanitize repo: remove https://github.com/ and trailing slashes
  repo = repo.replace('https://github.com/', '').replace(/\/$/, '');


  const baseUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  console.log(`[GitHub API] Attempting to commit to: ${baseUrl} on branch: ${branch}`);

  // 1. Try to get the existing file SHA (if it exists)
  let sha: string | undefined;
  try {
    const res = await fetch(`${baseUrl}?ref=${branch}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Attomatti-CMS'
      },
    });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
      console.log(`[GitHub API] Found existing file SHA: ${sha}`);
    } else {
      console.log(`[GitHub API] SHA fetch returned status ${res.status}. Possibly a new file.`);
    }
  } catch (e) {
    console.log(`[GitHub API] Failed to fetch SHA:`, e);
    // File likely doesn't exist yet
  }


  // 2. Prepare the payload
  // Content must be base64 encoded
  const contentBase64 = isBinary 
    ? (content as Buffer).toString('base64')
    : Buffer.from(content as string).toString('base64');

  const body = {
    message,
    content: contentBase64,
    branch,
    sha // If provided, updates the file; if not, creates it
  };

  // 3. Push to GitHub
  const pushRes = await fetch(baseUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Attomatti-CMS'
    },

    body: JSON.stringify(body),
  });

  if (!pushRes.ok) {
    const errorData = await pushRes.json();
    console.error(`[GitHub API] Push failed:`, errorData);
    throw new Error(`GitHub API Error: ${errorData.message || pushRes.statusText}`);
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
  const token = process.env.GITHUB_TOKEN;
  let repo = process.env.GITHUB_REPO;
  const branch = branchOverride || resolveTargetBranch();

  if (!token || !repo) {
    return [];
  }

  repo = repo.replace('https://github.com/', '').replace(/\/$/, '');
  const url = `https://api.github.com/repos/${repo}/contents/public/images?ref=${branch}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Attomatti-CMS'
      }
    });

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

  // If only 1 file, delegate to standard commitToGitHub
  if (files.length === 1) {
    return commitToGitHub({
      path: files[0].path,
      content: files[0].content,
      message,
      branch: overrideBranch,
      isBinary: files[0].isBinary
    });
  }

  const token = process.env.GITHUB_TOKEN;
  let repo = process.env.GITHUB_REPO;
  const branch = overrideBranch || resolveTargetBranch();

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured');
  }

  repo = repo.replace('https://github.com/', '').replace(/\/$/, '');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Attomatti-CMS'
  };

  console.log(`[GitHub API] Starting batch commit of ${files.length} files to ${repo} on branch: ${branch}`);

  // 1. Get the latest commit SHA on the target branch
  const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
    cache: 'no-store',
    headers
  });

  if (!refRes.ok) {
    const err = await refRes.json().catch(() => ({}));
    throw new Error(`Failed to get branch ref (${branch}): ${err.message || refRes.statusText}`);
  }
  const refData = await refRes.json();
  const latestCommitSha = refData.object?.sha;
  if (!latestCommitSha) {
    throw new Error(`Unable to resolve commit SHA for branch ${branch}`);
  }

  // 2. Get the base tree SHA from the latest commit
  const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, {
    cache: 'no-store',
    headers
  });
  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to get commit (${latestCommitSha}): ${err.message || commitRes.statusText}`);
  }
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree?.sha;
  if (!baseTreeSha) {
    throw new Error(`Unable to resolve base tree SHA for commit ${latestCommitSha}`);
  }

  // 3. Create blobs for each file in parallel
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const contentBase64 = file.isBinary
        ? (file.content as Buffer).toString('base64')
        : Buffer.from(file.content as string).toString('base64');

      const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: contentBase64,
          encoding: 'base64'
        })
      });

      if (!blobRes.ok) {
        const err = await blobRes.json().catch(() => ({}));
        throw new Error(`Failed to create blob for ${file.path}: ${err.message || blobRes.statusText}`);
      }

      const blobData = await blobRes.json();
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha
      };
    })
  );

  // 4. Create new tree referencing the base tree
  const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems
    })
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git tree: ${err.message || treeRes.statusText}`);
  }
  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  // 5. Create new commit
  const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: newTreeSha,
      parents: [latestCommitSha]
    })
  });

  if (!newCommitRes.ok) {
    const err = await newCommitRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git commit: ${err.message || newCommitRes.statusText}`);
  }
  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 6. Update target branch reference
  const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitSha,
      force: false
    })
  });

  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(`Failed to update branch ${branch} to ${newCommitSha}: ${err.message || updateRefRes.statusText}`);
  }

  const shortSha = newCommitSha ? newCommitSha.substring(0, 7) : undefined;
  const commitUrl = newCommitSha ? `https://github.com/${repo}/commit/${newCommitSha}` : undefined;

  console.log(`[GitHub API] Batch commit successful! SHA=${shortSha}, URL=${commitUrl}`);

  return {
    success: true,
    branch,
    repo,
    commitSha: newCommitSha,
    shortSha,
    commitUrl,
    count: files.length
  };
}

/**
 * Deletes multiple files in a SINGLE Git commit using GitHub's Git Data API
 * (Tree with sha: null -> Commit -> Ref update).
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

  const token = process.env.GITHUB_TOKEN;
  let repo = process.env.GITHUB_REPO;
  const branch = overrideBranch || resolveTargetBranch();

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured');
  }

  repo = repo.replace('https://github.com/', '').replace(/\/$/, '');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Attomatti-CMS'
  };

  console.log(`[GitHub API] Starting batch delete of ${paths.length} files from ${repo} on branch: ${branch}`);

  // 1. Get the latest commit SHA on the target branch
  const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
    cache: 'no-store',
    headers
  });

  if (!refRes.ok) {
    const err = await refRes.json().catch(() => ({}));
    throw new Error(`Failed to get branch ref (${branch}): ${err.message || refRes.statusText}`);
  }
  const refData = await refRes.json();
  const latestCommitSha = refData.object?.sha;
  if (!latestCommitSha) {
    throw new Error(`Unable to resolve commit SHA for branch ${branch}`);
  }

  // 2. Get the base tree SHA from the latest commit
  const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, {
    cache: 'no-store',
    headers
  });
  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to get commit (${latestCommitSha}): ${err.message || commitRes.statusText}`);
  }
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree?.sha;
  if (!baseTreeSha) {
    throw new Error(`Unable to resolve base tree SHA for commit ${latestCommitSha}`);
  }

  // 3. Create tree items with sha: null to remove files
  const treeItems = paths.map((p) => ({
    path: p,
    mode: '100644' as const,
    type: 'blob' as const,
    sha: null
  }));

  // 4. Create new tree referencing the base tree
  const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems
    })
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git delete tree: ${err.message || treeRes.statusText}`);
  }
  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  // 5. Create new commit
  const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: newTreeSha,
      parents: [latestCommitSha]
    })
  });

  if (!newCommitRes.ok) {
    const err = await newCommitRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git delete commit: ${err.message || newCommitRes.statusText}`);
  }
  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 6. Update target branch reference
  const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitSha,
      force: false
    })
  });

  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(`Failed to update branch ${branch} to ${newCommitSha}: ${err.message || updateRefRes.statusText}`);
  }

  const shortSha = newCommitSha ? newCommitSha.substring(0, 7) : undefined;
  const commitUrl = newCommitSha ? `https://github.com/${repo}/commit/${newCommitSha}` : undefined;

  console.log(`[GitHub API] Batch delete successful! SHA=${shortSha}, URL=${commitUrl}`);

  return {
    success: true,
    branch,
    repo,
    commitSha: newCommitSha,
    shortSha,
    commitUrl,
    count: paths.length
  };
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
  const token = process.env.GITHUB_TOKEN;
  let repo = process.env.GITHUB_REPO;
  if (!token || !repo) throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured');
  repo = repo.replace('https://github.com/', '').replace(/\/$/, '');

  const contentBase64 = isBinary
    ? (content as Buffer).toString('base64')
    : Buffer.from(content as string).toString('base64');

  const res = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Attomatti-CMS'
    },
    body: JSON.stringify({
      content: contentBase64,
      encoding: 'base64'
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to create blob: ${err.message || res.statusText}`);
  }

  const data = await res.json();
  return data.sha;
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
  if (!items || items.length === 0) return { success: true, count: 0 };

  const token = process.env.GITHUB_TOKEN;
  let repo = process.env.GITHUB_REPO;
  const branch = overrideBranch || resolveTargetBranch();
  if (!token || !repo) throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured');
  repo = repo.replace('https://github.com/', '').replace(/\/$/, '');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Attomatti-CMS'
  };

  // 1. Get latest commit
  const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
    cache: 'no-store',
    headers
  });
  if (!refRes.ok) {
    const err = await refRes.json().catch(() => ({}));
    throw new Error(`Failed to get branch ref (${branch}): ${err.message || refRes.statusText}`);
  }
  const refData = await refRes.json();
  const latestCommitSha = refData.object?.sha;

  // 2. Get base tree
  const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, {
    cache: 'no-store',
    headers
  });
  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to get commit (${latestCommitSha}): ${err.message || commitRes.statusText}`);
  }
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree?.sha;

  // 3. Create tree
  const treeItems = items.map((item) => ({
    path: item.path,
    mode: '100644' as const,
    type: 'blob' as const,
    sha: item.sha
  }));

  const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems
    })
  });
  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create tree: ${err.message || treeRes.statusText}`);
  }
  const treeData = await treeRes.json();

  // 4. Create commit
  const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [latestCommitSha]
    })
  });
  if (!newCommitRes.ok) {
    const err = await newCommitRes.json().catch(() => ({}));
    throw new Error(`Failed to create commit: ${err.message || newCommitRes.statusText}`);
  }
  const newCommitData = await newCommitRes.json();

  // 5. Update ref
  const updateRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitData.sha,
      force: false
    })
  });
  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(`Failed to update ref: ${err.message || updateRefRes.statusText}`);
  }

  const shortSha = newCommitData.sha ? newCommitData.sha.substring(0, 7) : undefined;
  const commitUrl = newCommitData.sha ? `https://github.com/${repo}/commit/${newCommitData.sha}` : undefined;

  return {
    success: true,
    branch,
    repo,
    commitSha: newCommitData.sha,
    shortSha,
    commitUrl,
    count: items.length
  };
}
