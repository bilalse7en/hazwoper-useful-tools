import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.mov':
      return 'video/quicktime';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.vtt':
      return 'text/vtt; charset=utf-8';
    case '.srt':
      return 'text/plain; charset=utf-8';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

async function resolveMediaFilePath(paramsPromise) {
  const params = await paramsPromise;
  const pathSegments = params?.path || [];
  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    return null;
  }

  // Safely decode URI components to handle spaces, special characters, and URL-encoding
  const decodedSegments = pathSegments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });

  const relativePath = path.join(...decodedSegments);
  const baseHubDir = path.resolve(process.cwd(), 'public', 'media-hub');
  const targetPath = path.resolve(baseHubDir, relativePath);

  // Security: Prevent path traversal outside process.cwd()
  const appRoot = path.resolve(process.cwd());
  if (!targetPath.startsWith(appRoot)) {
    return { error: 'forbidden', status: 403 };
  }

  // 1. Direct path in public/media-hub
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return { filePath: targetPath };
  }

  // 2. Fallback search if directory name is present but filename is slightly varied or sanitized
  if (decodedSegments.length >= 2) {
    const parentFolder = path.resolve(baseHubDir, decodedSegments[0]);
    if (
      fs.existsSync(parentFolder) &&
      fs.statSync(parentFolder).isDirectory()
    ) {
      const files = fs.readdirSync(parentFolder);
      const requestedFile = decodedSegments[decodedSegments.length - 1];
      const match = files.find(
        (f) =>
          f === requestedFile ||
          f.toLowerCase() === requestedFile.toLowerCase() ||
          f.replace(/[^a-zA-Z0-9]/g, '_') ===
            requestedFile.replace(/[^a-zA-Z0-9]/g, '_')
      );
      if (match) {
        const candidate = path.join(parentFolder, match);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return { filePath: candidate };
        }
      }
    }
  }

  // 3. Fallback: temp/yt-downloads directory (e.g. active downloads or cache)
  const tempDir = path.resolve(process.cwd(), 'temp', 'yt-downloads');
  const filename = decodedSegments[decodedSegments.length - 1];
  if (fs.existsSync(tempDir)) {
    const directTemp = path.join(tempDir, filename);
    if (fs.existsSync(directTemp) && fs.statSync(directTemp).isFile()) {
      return { filePath: directTemp };
    }

    // Try matching by video id if folder starts with yt_<id>
    const folderName = decodedSegments[0] || '';
    if (folderName.startsWith('yt_')) {
      const ytId = folderName.replace('yt_', '');
      const files = fs.readdirSync(tempDir);
      const match = files.find((f) => f.includes(ytId) && f.endsWith('.mp4'));
      if (match) {
        const candidate = path.join(tempDir, match);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return { filePath: candidate };
        }
      }
    }
  }

  return { error: 'not_found', status: 404, requested: relativePath };
}

export async function GET(request, { params }) {
  try {
    const resolved = await resolveMediaFilePath(params);
    if (!resolved || resolved.error === 'not_found') {
      return NextResponse.json(
        {
          error: 'Media file not found in Media Hub storage.',
          requestedPath: resolved?.requested || '',
          hint: 'The source video may have been moved or removed.',
        },
        { status: 404 }
      );
    }

    if (resolved.error === 'forbidden') {
      return NextResponse.json(
        { error: 'Access denied: Invalid path traversal.' },
        { status: 403 }
      );
    }

    const { filePath } = resolved;
    const stat = fs.statSync(filePath);
    const totalSize = stat.size;
    const mimeType = getMimeType(filePath);
    const rangeHeader = request.headers.get('range');

    // Handle HTTP Range Requests (206 Partial Content) for seamless seeking and playback in video players
    if (rangeHeader && mimeType.startsWith('video/')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });

      return new NextResponse(readableStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': mimeType,
          'Cache-Control':
            'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }

    // Full file stream response (200 OK)
    const fileStream = fs.createReadStream(filePath);
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(totalSize),
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    console.error('Media stream error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to stream media asset.' },
      { status: 500 }
    );
  }
}

export async function HEAD(request, { params }) {
  try {
    const resolved = await resolveMediaFilePath(params);
    if (!resolved || resolved.error) {
      return new NextResponse(null, { status: resolved?.status || 404 });
    }

    const stat = fs.statSync(resolved.filePath);
    const mimeType = getMimeType(resolved.filePath);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(stat.size),
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
