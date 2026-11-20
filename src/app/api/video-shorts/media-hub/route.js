import { NextResponse } from 'next/server';
import {
  listMediaHubItems,
  purgeExpiredMedia,
  deleteMediaHubItem,
  getLocalRegistry,
  saveLocalRegistry,
} from '@/lib/video-shorts/media-storage-service';
import { supabase } from '@/lib/supabase';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Filenames that should be purged from Supabase DB if they appear as phantom entries
const PHANTOM_FILENAMES = [
  'another_hub_video.mp4',
  'naat_recitation_sample.mp4',
  'to_be_deleted.mp4',
];

async function purgePhantomSupabaseEntries() {
  try {
    for (const fname of PHANTOM_FILENAMES) {
      await supabase.from('media_hub').delete().eq('file_name', fname);
    }
    // Also purge entries where file_size < 1000 bytes (stub/corrupt)
    await supabase.from('media_hub').delete().lt('file_size', 1000);
  } catch (_) {
    /* non-critical — ignore Supabase errors */
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    // Proactively purge expired media and Supabase phantom entries
    await purgeExpiredMedia();
    purgePhantomSupabaseEntries(); // fire-and-forget, non-blocking

    const items = await listMediaHubItems(search);

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (err) {
    console.error('Media Hub GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message, items: [] },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID is required.' },
        { status: 400 }
      );
    }

    const success = await deleteMediaHubItem(id);

    return NextResponse.json({
      success,
      message: 'Asset deleted successfully.',
    });
  } catch (err) {
    console.error('Media Hub DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
