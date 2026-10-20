import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { transcribeUrduVideo } from '@/lib/video-shorts/transcription-service';
import { getMediaHubItem } from '@/lib/video-shorts/media-storage-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request) {
  let tempVideoPath = null;
  let shouldCleanupTemp = false;

  try {
    const contentType = request.headers.get('content-type') || '';
    let targetPath = null;
    let referenceLyrics = '';
    let videoTitle = '';
    let language = 'ur';

    // Branch A: Multipart form upload (Blob/File from browser)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const videoFile = formData.get('video');
      referenceLyrics = formData.get('referenceLyrics') || '';
      videoTitle = formData.get('videoTitle') || '';
      language = formData.get('language') || 'ur';

      if (!videoFile || typeof videoFile === 'string') {
        return NextResponse.json(
          { error: 'Video file is required.' },
          { status: 400 }
        );
      }

      const tempDir = path.join(os.tmpdir(), 'video-shorts-transcribe');
      fs.mkdirSync(tempDir, { recursive: true });

      const ext = path.extname(videoFile.name || 'video.mp4') || '.mp4';
      tempVideoPath = path.join(
        tempDir,
        `input_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`
      );

      const buffer = Buffer.from(await videoFile.arrayBuffer());
      fs.writeFileSync(tempVideoPath, buffer);
      targetPath = tempVideoPath;
      shouldCleanupTemp = true;
    } else {
      // Branch B: JSON payload with mediaId or videoUrl
      const body = await request.json();
      const {
        mediaId,
        videoUrl,
        localPath,
        referenceLyrics: lyrics,
        videoTitle: title,
        language: lang,
      } = body;
      referenceLyrics = lyrics || '';
      videoTitle = title || '';
      language = lang || 'ur';

      if (localPath && fs.existsSync(localPath)) {
        targetPath = localPath;
      } else if (mediaId) {
        const item = await getMediaHubItem(mediaId);
        if (item?.localPath && fs.existsSync(item.localPath)) {
          targetPath = item.localPath;
        } else {
          const hubDir = path.join(
            process.cwd(),
            'public',
            'media-hub',
            mediaId
          );
          if (fs.existsSync(hubDir)) {
            const files = fs
              .readdirSync(hubDir)
              .filter(
                (f) =>
                  !f.endsWith('.jpg') &&
                  !f.endsWith('.png') &&
                  !f.endsWith('.json')
              );
            if (files.length > 0) targetPath = path.join(hubDir, files[0]);
          }
        }
      } else if (videoUrl && !videoUrl.startsWith('http')) {
        const rel = path.join(
          process.cwd(),
          'public',
          videoUrl.replace(/^\//, '')
        );
        if (fs.existsSync(rel)) targetPath = rel;
      }
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      return NextResponse.json(
        { error: 'Valid source video file could not be located on disk.' },
        { status: 400 }
      );
    }

    const result = await transcribeUrduVideo({
      videoPath: targetPath,
      language,
      referenceLyrics,
      videoTitle,
    });

    return NextResponse.json({
      success: true,
      transcription: result.rawText,
      captions: result.captions,
      language: result.language,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio.' },
      { status: 500 }
    );
  } finally {
    if (shouldCleanupTemp && tempVideoPath && fs.existsSync(tempVideoPath)) {
      try {
        fs.unlinkSync(tempVideoPath);
      } catch (e) {
        /* ignore */
      }
    }
  }
}
