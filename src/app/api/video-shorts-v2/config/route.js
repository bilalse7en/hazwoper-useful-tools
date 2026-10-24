import { NextResponse } from 'next/server';
import { getProvidersStatusReport } from '@/lib/video-providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const providers = getProvidersStatusReport();
  return NextResponse.json({
    success: true,
    providers,
  });
}
