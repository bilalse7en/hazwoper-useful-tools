import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
}

function extractMetadata(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  const description = descMatch ? descMatch[1].trim() : '';

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);

  // Extract headings
  const headings = [];
  const headingRegex = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
  let hMatch;
  while ((hMatch = headingRegex.exec(html)) !== null && headings.length < 30) {
    const text = hMatch[2].replace(/<[^>]+>/g, '').trim();
    if (text) {
      headings.push({ level: hMatch[1].toUpperCase(), text });
    }
  }

  // Extract links
  const links = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lMatch;
  while ((lMatch = linkRegex.exec(html)) !== null && links.length < 25) {
    const href = lMatch[1].trim();
    const text = lMatch[2].replace(/<[^>]+>/g, '').trim();
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      links.push({ href, text: text || href });
    }
  }

  // Extract images
  const images = [];
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*alt=["']?([^"'>]*)["']?[^>]*>/gi;
  let iMatch;
  while ((iMatch = imgRegex.exec(html)) !== null && images.length < 15) {
    const src = iMatch[1].trim();
    const alt = iMatch[2] ? iMatch[2].trim() : '';
    if (src && !src.startsWith('data:')) {
      images.push({ src, alt });
    }
  }

  // Extract paragraphs / text blocks
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(html)) !== null && paragraphs.length < 40) {
    const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text && text.length > 20) {
      paragraphs.push(text);
    }
  }

  // Extract tables
  const tables = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tMatch;
  while ((tMatch = tableRegex.exec(html)) !== null && tables.length < 5) {
    const tableHtml = tMatch[1];
    const rows = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(tableHtml)) !== null) {
      const cells = [];
      const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      let cMatch;
      while ((cMatch = cellRegex.exec(trMatch[1])) !== null) {
        cells.push(cMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length > 0) tables.push(rows);
  }

  return {
    title: ogTitleMatch ? ogTitleMatch[1].trim() : title,
    description: ogDescMatch ? ogDescMatch[1].trim() : description,
    headings,
    paragraphs,
    links,
    images,
    tables,
  };
}

function jsonToXml(obj, rootName = 'root') {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;

  function buildXml(data, indent = '  ') {
    let result = '';
    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          result += `${indent}<item>\n${buildXml(item, indent + '  ')}${indent}</item>\n`;
        } else {
          result += `${indent}<item>${escapeXml(String(item))}</item>\n`;
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, val]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (typeof val === 'object' && val !== null) {
          result += `${indent}<${safeKey}>\n${buildXml(val, indent + '  ')}${indent}</${safeKey}>\n`;
        } else {
          result += `${indent}<${safeKey}>${escapeXml(String(val ?? ''))}</${safeKey}>\n`;
        }
      });
    } else {
      result += `${indent}${escapeXml(String(data ?? ''))}\n`;
    }
    return result;
  }

  function escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  xml += buildXml(obj);
  xml += `</${rootName}>`;
  return xml;
}

export async function POST(request) {
  try {
    const { url, format = 'json' } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Target URL returned HTTP status ${res.status}` },
        { status: res.status }
      );
    }

    const rawHtml = await res.text();
    const clean = cleanHtml(rawHtml);
    const extracted = extractMetadata(clean);

    const payload = {
      sourceUrl: targetUrl,
      fetchedAt: new Date().toISOString(),
      metadata: {
        title: extracted.title,
        description: extracted.description,
      },
      headings: extracted.headings,
      contentSummary: extracted.paragraphs.slice(0, 10).join(' '),
      paragraphs: extracted.paragraphs,
      links: extracted.links,
      images: extracted.images,
      tables: extracted.tables,
    };

    if (format === 'xml') {
      const xmlOutput = jsonToXml(payload, 'ScrapedData');
      return new Response(xmlOutput, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: payload,
      xml: jsonToXml(payload, 'ScrapedData'),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err.name === 'AbortError' ? 'URL request timed out' : err.message || 'Scraping failed',
      },
      { status: 500 }
    );
  }
}
