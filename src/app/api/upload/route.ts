import { NextResponse } from 'next/server';
import { commitToGitHub } from '@/lib/github';

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret');

  // Basic security check
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-0.\-_]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}`;
    const filePath = `public/images/${fileName}`;

    // Commit the image to GitHub
    await commitToGitHub({
      path: filePath,
      content: buffer,
      message: `Upload image: ${fileName} via Admin Console`,
      isBinary: true
    });

    // In production, the file will be available at /images/fileName after the next build.
    // However, the JSON update (which happens later when "Publish" is clicked)
    // will use this relative path.
    const publicUrl = `/images/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
