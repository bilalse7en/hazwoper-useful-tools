import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookiesCandidates = [
      path.join(process.cwd(), 'cookies.txt'),
      path.join(process.cwd(), 'bin', 'cookies.txt'),
      path.join(process.cwd(), 'public', 'temp-shorts', 'cookies.txt'),
    ];
    const found = cookiesCandidates.find((p) => fs.existsSync(p));
    if (found) {
      const stats = fs.statSync(found);
      return NextResponse.json({
        hasCookies: true,
        path: path.basename(found),
        size: stats.size,
        updatedAt: stats.mtime,
      });
    }
    return NextResponse.json({ hasCookies: false });
  } catch (error) {
    return NextResponse.json({ hasCookies: false, error: error.message });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { cookiesContent } = body;

    if (!cookiesContent || typeof cookiesContent !== 'string') {
      return NextResponse.json(
        { error: 'Valid cookies text content is required' },
        { status: 400 }
      );
    }

    const targetPath = path.join(process.cwd(), 'cookies.txt');
    fs.writeFileSync(targetPath, cookiesContent.trim(), 'utf-8');

    return NextResponse.json({
      success: true,
      message:
        'cookies.txt successfully saved. YouTube downloads will now use authenticated session.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookiesCandidates = [
      path.join(process.cwd(), 'cookies.txt'),
      path.join(process.cwd(), 'bin', 'cookies.txt'),
      path.join(process.cwd(), 'public', 'temp-shorts', 'cookies.txt'),
    ];

    let deletedCount = 0;
    for (const p of cookiesCandidates) {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        deletedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message:
        deletedCount > 0
          ? 'YouTube cookies removed successfully.'
          : 'No cookie file was found.',
      deletedCount,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
