import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getContent } from '@/lib/data';

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = request.headers.get('x-admin-secret');

  // Basic security check using an environment variable
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    
    // Upload the new content to Vercel Blob
    // 'addRandomSuffix: true' ensures we keep a history of all versions
    const blob = await put('content.json', JSON.stringify(json, null, 2), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0
    });

    // Create a pointer file that always points to the latest version's URL
    await put('latest.json', JSON.stringify({ url: blob.url }), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 0
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
