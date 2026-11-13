import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAllowedUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    // SSRF protection: block local/private hosts
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'stock-asset.jpg';

    if (!targetUrl || !isAllowedUrl(targetUrl)) {
      return NextResponse.json(
        { error: 'Valid http or https media URL is required' },
        { status: 400 }
      );
    }

    const isWikimedia =
      targetUrl.includes('wikimedia.org') || targetUrl.includes('wikipedia.org');

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': isWikimedia
          ? 'HazwoperUsefulTools/1.0 (https://hazwoper-useful-tools.vercel.app; admin@hazwoper.com)'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream media server returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';
    const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Convert response array buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanFilename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[Download Proxy Error]:', error.message);
    return NextResponse.json(
      { error: 'Failed to download asset', details: error.message },
      { status: 500 }
    );
  }
}
