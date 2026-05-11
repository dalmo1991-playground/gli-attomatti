import localContent from '@/data/content.json';
import fs from 'fs';
import path from 'path';

export const getContent = async () => {
  // In development, read the file fresh from the filesystem
  if (process.env.NODE_ENV === 'development') {
    try {
      const filePath = path.join(process.cwd(), 'src/data/content.json');
      const fileContents = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(fileContents);
    } catch (e) {
      console.error("Error reading local json in dev:", e);
      return localContent;
    }
  }

  // In production, we rely on the bundled JSON file which is updated via GitHub commits and redeploys.
  return localContent;
};
