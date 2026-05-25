import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');

    const blob = await response.blob();
    let contentType = response.headers.get('content-type');

    // Force correct MIME type for known extensions if origin is misconfigured
    if (url.toLowerCase().endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (url.toLowerCase().endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (!contentType || contentType === 'application/octet-stream') {
      contentType = 'image/jpeg'; // Fallback
    }

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
