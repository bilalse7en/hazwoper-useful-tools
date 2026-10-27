import { NextResponse } from 'next/server';
import { executeSmartStockSearch } from '@/lib/adobe-stock/adobe-stock-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title || body.slideTitle || '';
    const offset = parseInt(body.offset || 0, 10);
    const limit = parseInt(body.limit || 12, 10);
    const threshold = parseInt(body.threshold || 45, 10);

    if (!title || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'TITLE_REQUIRED',
          message: 'Please provide a slide title.',
          results: [],
        },
        { status: 400 }
      );
    }

    const context = body.context || {
      course: body.course || '',
      module: body.module || '',
      lesson: body.lesson || '',
      parentSection: body.parentSection || '',
    };

    const styleFilter = body.styleFilter || {
      photo:
        body.photo !== false &&
        body.imageType !== 'cartoonic' &&
        body.imageType !== 'illustration',
      illustration:
        body.illustration !== false &&
        body.imageType !== 'photo' &&
        body.imageType !== 'real-life',
    };

    const provider = body.provider || 'all';

    const result = await executeSmartStockSearch({
      title,
      context,
      styleFilter,
      provider,
      offset,
      limit,
      threshold,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /api/adobe-stock/search] Error:', error);

    const isAuth = error.code === 'AUTH_FAILED';
    return NextResponse.json(
      {
        success: false,
        error: error.code || 'SEARCH_ERROR',
        message: error.message || 'An unexpected search error occurred.',
        results: [],
      },
      { status: isAuth ? 401 : 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || searchParams.get('q') || '';
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const threshold = parseInt(searchParams.get('threshold') || '45', 10);

    if (!title || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'TITLE_REQUIRED',
          message: 'Please provide a slide title.',
          results: [],
        },
        { status: 400 }
      );
    }

    const context = {
      course: searchParams.get('course') || '',
      module: searchParams.get('module') || '',
      lesson: searchParams.get('lesson') || '',
      parentSection: searchParams.get('parentSection') || '',
    };

    const styleFilter = {
      photo:
        searchParams.get('photo') !== 'false' &&
        searchParams.get('imageType') !== 'cartoonic' &&
        searchParams.get('imageType') !== 'illustration',
      illustration:
        searchParams.get('illustration') !== 'false' &&
        searchParams.get('imageType') !== 'photo' &&
        searchParams.get('imageType') !== 'real-life',
    };

    const provider = searchParams.get('provider') || 'all';

    const result = await executeSmartStockSearch({
      title,
      context,
      styleFilter,
      provider,
      offset,
      limit,
      threshold,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /api/adobe-stock/search] Error:', error);

    const isAuth = error.code === 'AUTH_FAILED';
    return NextResponse.json(
      {
        success: false,
        error: error.code || 'SEARCH_ERROR',
        message: error.message || 'An unexpected search error occurred.',
        results: [],
      },
      { status: isAuth ? 401 : 500 }
    );
  }
}
