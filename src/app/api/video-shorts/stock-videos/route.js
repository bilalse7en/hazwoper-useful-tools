import { NextResponse } from 'next/server';
import {
  searchIslamicStockVideos,
  importStockVideoToMediaHub,
  importMultipleStockVideos,
} from '@/lib/video-shorts/stock-video-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'islamic';
    const provider = searchParams.get('provider') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const data = await searchIslamicStockVideos({
      query,
      provider,
      page,
      limit,
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Stock videos search error:', err);
    return NextResponse.json(
      { success: false, error: err.message, videos: [] },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { stockVideo, stockVideos } = body;

    // Bulk import handling
    if (Array.isArray(stockVideos) && stockVideos.length > 0) {
      const results = await importMultipleStockVideos(stockVideos);
      return NextResponse.json({
        success: true,
        results,
        message: `Imported ${results.saved.length} of ${results.total} stock videos to Media Hub.`,
      });
    }

    if (!stockVideo || !stockVideo.videoUrl) {
      return NextResponse.json(
        { error: 'stockVideo object with videoUrl is required.' },
        { status: 400 }
      );
    }

    const mediaItem = await importStockVideoToMediaHub(stockVideo);

    return NextResponse.json({
      success: true,
      mediaItem,
      message: 'Islamic stock video successfully imported into Media Hub.',
    });
  } catch (err) {
    console.error('Stock video import error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to import stock video.' },
      { status: 500 }
    );
  }
}
