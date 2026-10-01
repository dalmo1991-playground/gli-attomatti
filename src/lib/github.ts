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

function resolveTargetBranch(): string {
  // 1. If running on Vercel with a known commit ref (e.g. 'dev' or 'main')
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    return process.env.VERCEL_GIT_COMMIT_REF;
  }

  // 2. Distinguish by Vercel environment
  if (process.env.VERCEL_ENV === 'preview') {
    return 'dev';
  }
  if (process.env.VERCEL_ENV === 'production') {
    return process.env.GITHUB_BRANCH || 'main';
  }

  // 3. Fallback for local development or other hosting environments
  return (
    process.env.CF_PAGES_BRANCH ||
    process.env.BRANCH ||
    getLocalGitBranch() ||
    process.env.GITHUB_BRANCH ||
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
