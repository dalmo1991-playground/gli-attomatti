import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getContent } from '@/lib/data';
import { commitToGitHub } from '@/lib/github';

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content);
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret');

  // Basic security check
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    
    // Commit the new content to GitHub
    await commitToGitHub({
      path: 'src/data/content.json',
      content: JSON.stringify(json, null, 2),
      message: 'Update site content via Admin Console',
      isBinary: false
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Content update error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
