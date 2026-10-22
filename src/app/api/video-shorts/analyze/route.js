import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import {
  getYouTubeMetadata,
  isValidYouTubeUrl,
  extractYouTubeId,
} from '@/lib/video-shorts/source-parser';
import { downloadYouTubeVideo } from '@/lib/video-shorts/youtube-downloader';
import { getTempDir, getLocalMediaDir } from '@/lib/video-shorts/storage-paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to 3 minutes for large video downloads
export const maxDuration = 180;

/**
 * Purges temp video & subtitle files older than 24 hours.
 */
function cleanOldTempVideos(tempDir) {
  try {
    if (!fs.existsSync(tempDir)) return;
    const now = Date.now();
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > 24 * 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        /* skip locked files */
      }
    }
  } catch (err) {
    console.warn('Error cleaning old temp videos:', err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, downloadVideo = true } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        {
          error:
            'Invalid YouTube URL. Please provide a standard YouTube video or Shorts link.',
        },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeId(url);
    const metadata = await getYouTubeMetadata(url);

    let videoUrl = null;
    let isDownloaded = false;
    let transcript = null;

    if (downloadVideo && videoId) {
      const publicTempDir = getTempDir('temp-shorts');

      // Purge temp videos older than 24 hours
      cleanOldTempVideos(publicTempDir);

      const targetPath = path.join(publicTempDir, `${videoId}.mp4`);
      const subtitleCachePath = path.join(publicTempDir, `${videoId}.vtt`);

      // 1. Check if already cached in Media Hub
      const hubDir = getLocalMediaDir(`yt_${videoId}`);
      let hubFile = null;
      if (fs.existsSync(hubDir)) {
        const files = fs.readdirSync(hubDir).filter((f) => f.endsWith('.mp4'));
        if (
          files.length > 0 &&
          fs.statSync(path.join(hubDir, files[0])).size > 50000
        ) {
          hubFile = files[0];
        }
      }

      if (hubFile) {
        videoUrl = `/media-hub/yt_${videoId}/${hubFile}`;
        isDownloaded = true;
        if (fs.existsSync(subtitleCachePath)) {
          transcript = fs.readFileSync(subtitleCachePath, 'utf-8');
        }
      } else if (
        fs.existsSync(targetPath) &&
        fs.statSync(targetPath).size > 50000
      ) {
        // 2. Check if already cached in temp-shorts
        videoUrl = `/temp-shorts/${videoId}.mp4`;
        isDownloaded = true;
        if (fs.existsSync(subtitleCachePath)) {
          transcript = fs.readFileSync(subtitleCachePath, 'utf-8');
        }
      } else {
        try {
          const result = await downloadYouTubeVideo({
            url,
            targetPath,
            subtitleDir: publicTempDir,
            timeoutMs: 150000,
          });

          if (fs.existsSync(targetPath)) {
            videoUrl = `/temp-shorts/${videoId}.mp4`;
            isDownloaded = true;
          }

          // Read and cache the subtitle file
          if (result.subtitlePath && fs.existsSync(result.subtitlePath)) {
            transcript = fs.readFileSync(result.subtitlePath, 'utf-8');
            // Cache subtitle next to video for future loads
            if (result.subtitlePath !== subtitleCachePath) {
              try {
                fs.copyFileSync(result.subtitlePath, subtitleCachePath);
              } catch (e) {
                /* ignore copy failure */
              }
            }
          }
        } catch (dlErr) {
          console.warn('yt-dlp download failed:', dlErr.message);
          // Return partial success with metadata and actionable error
          return NextResponse.json({
            success: true,
            metadata: {
              ...metadata,
              videoUrl: null,
              isDownloaded: false,
              transcript: null,
              downloadError: dlErr.message,
              errorType: dlErr.type || 'DOWNLOAD_ERROR',
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      metadata: {
        ...metadata,
        videoUrl,
        isDownloaded,
        transcript,
      },
    });
  } catch (error) {
    console.error('Error analyzing video URL:', error);
    return NextResponse.json(
      {
        error:
          error.message ||
          'Failed to retrieve video metadata. The video might be private or restricted.',
      },
      { status: 500 }
    );
  }
}
