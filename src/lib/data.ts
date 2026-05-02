import { list } from '@vercel/blob';
import localContent from '@/data/content.json';

export async function getContent() {
  // In development, or if the environment variable is missing, always use local content
  if (process.env.NODE_ENV === 'development' || !process.env.BLOB_READ_WRITE_TOKEN) {
    return localContent;
  }

  try {
    // Try to find the content.json in Vercel Blob
    const { blobs } = await list({ prefix: 'content' });
    
    if (blobs.length > 0) {
      // Sort by date descending to get the absolute latest version
      const latestBlob = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0];
      
      const response = await fetch(latestBlob.url, { cache: 'no-store' });
      if (response.ok) {
        return await response.json();
      }
    }
  } catch (error) {
    console.error('Error fetching content from Blob:', error);
  }

  // Fallback to local content bundled with the build
  return localContent;
}
