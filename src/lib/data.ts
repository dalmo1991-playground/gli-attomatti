import { unstable_cache } from 'next/cache';
import localContent from '@/data/content.json';
import fs from 'fs';
import path from 'path';

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

const getCachedContent = unstable_cache(
  async () => {
    return fetchLatestContent();
  },
  ['site-content'],
  { tags: ['content'] }
);

export const getContent = async () => {
  // In development, completely bypass Next.js caching and read the file fresh
  // so that manual edits to content.json show up instantly.
  if (process.env.NODE_ENV === 'development') {
    try {
      const filePath = path.join(process.cwd(), 'src/data/content.json');
      const fileContents = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(fileContents);
    } catch (e) {
      console.error("Error reading local json:", e);
      return localContent;
    }
  }

  // In production, if no token is available, use the statically bundled content
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return localContent;
  }

  // Otherwise, use the aggressively cached Vercel Blob content
  return getCachedContent();
};
