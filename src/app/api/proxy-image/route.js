import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/*',
        Referer: 'https://pollinations.ai/',
      },
    });

    if (!response.ok) {
      console.error(
        `Proxy Fetch Error: ${response.status} ${response.statusText} for URL: ${url}`
      );
      return NextResponse.json(
        {
          error: `Origin block: ${response.status}`,
          details: response.statusText,
        },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    let contentType = response.headers.get('content-type');

    if (!contentType || !contentType.startsWith('image/')) {
      console.error(
        `Proxy Security Block: Non-image content detected (${contentType}) for URL: ${url}`
      );
      return NextResponse.json(
        { error: 'Origin returned non-image content', type: contentType },
        { status: 415 }
      );
    }

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
