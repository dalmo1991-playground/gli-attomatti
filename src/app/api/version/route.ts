import { NextResponse } from 'next/server';
import { getSiteVersion } from '@/lib/version';

export const dynamic = 'force-dynamic';

export async function GET() {
  const versionInfo = getSiteVersion();

  return NextResponse.json(versionInfo, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
}
