import localContent from '@/data/content.json';
import crypto from 'crypto';

export interface SiteVersionInfo {
  commitSha: string;
  contentHash: string;
  version: string;
  timestamp: number;
}

export function getSiteVersion(): SiteVersionInfo {
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    'local';

  // Compute a fast 8-character hash of the current bundled content
  const contentStr = JSON.stringify(localContent);
  const contentHash = crypto.createHash('md5').update(contentStr).digest('hex').substring(0, 8);

  const shortSha = commitSha.substring(0, 7);
  const version = `${shortSha}-${contentHash}`;

  return {
    commitSha: shortSha,
    contentHash,
    version,
    timestamp: Date.now(),
  };
}
