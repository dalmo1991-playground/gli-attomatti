import { unstable_cache } from 'next/cache';
import localContent from '@/data/content.json';

function getBlobStoreUrl() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const match = token.match(/^vercel_blob_rw_([^_]+)_/);
  if (match) {
    return `https://${match[1].toLowerCase()}.public.blob.vercel-storage.com`;
  }
  return null;
}

const fetchLatestContent = async () => {
  try {
    const storeUrl = getBlobStoreUrl();
    if (storeUrl) {
      // Fetch the pointer file to find the URL of the latest version
      const pointerRes = await fetch(`${storeUrl}/latest.json`, { cache: 'no-store' });
      if (pointerRes.ok) {
        const { url } = await pointerRes.json();
        
        // Fetch the actual content from that URL
        const contentRes = await fetch(url, { cache: 'no-store' });
        if (contentRes.ok) {
          return await contentRes.json();
        }
      }
    }
  } catch (error) {
    console.error('Error fetching content from Blob:', error);
  }

  // Fallback to local content bundled with the build
  return localContent;
};

export const getContent = unstable_cache(
  async () => {
    // In development, or if the environment variable is missing, always use local content
    if (process.env.NODE_ENV === 'development' || !process.env.BLOB_READ_WRITE_TOKEN) {
      return localContent;
    }
    return fetchLatestContent();
  },
  ['site-content'],
  { tags: ['content'] }
);
