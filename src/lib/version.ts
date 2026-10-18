import localContent from '@/data/content.json';
import crypto from 'crypto';

export interface SiteVersionInfo {
  commitSha: string;
  contentHash: string;
  version: string;
  timestamp: number;
}

// Compute a fast 8-character hash of the bundled content once at module load
const STATIC_CONTENT_HASH = crypto
  .createHash('md5')
  .update(JSON.stringify(localContent))
  .digest('hex')
  .substring(0, 8);

export function getSiteVersion(): SiteVersionInfo {
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    'local';

  const shortSha = commitSha.substring(0, 7);
  const version = `${shortSha}-${STATIC_CONTENT_HASH}`;

  return {
    commitSha: shortSha,
    contentHash: STATIC_CONTENT_HASH,
    version,
    timestamp: Date.now(),
  };
}
