/**
 * Commits a file to GitHub via the REST API.
 */
export async function commitToGitHub({
  path,
  content,
  message,
  isBinary = false
}: {
  path: string;
  content: string | Buffer;
  message: string;
  isBinary?: boolean;
}) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // e.g. "owner/repo"
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured');
  }

  const baseUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  // 1. Try to get the existing file SHA (if it exists)
  let sha: string | undefined;
  try {
    const res = await fetch(`${baseUrl}?ref=${branch}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
    }
  } catch (e) {
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
    },
    body: JSON.stringify(body),
  });

  if (!pushRes.ok) {
    const errorData = await pushRes.json();
    throw new Error(`GitHub API Error: ${errorData.message || pushRes.statusText}`);
  }

  return await pushRes.json();
}
