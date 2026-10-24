import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { ingestMediaFile } from '@/lib/video-shorts/media-storage-service';
import { probeVideo } from '@/lib/video-shorts/ffmpeg-service';
import {
  isValidYouTubeUrl,
  extractYouTubeId,
  getYouTubeMetadata,
} from '@/lib/video-shorts/source-parser';
import {
  downloadYouTubeVideo,
  findSubtitleFile,
} from '@/lib/video-shorts/youtube-downloader';
import { transcribeUrduVideo } from '@/lib/video-shorts/transcription-service';
import {
  parseVttFile,
  mergeIntoPhraseCaptions,
} from '@/lib/video-shorts/vtt-parser';
import { getTempDir, getLocalMediaDir } from '@/lib/video-shorts/storage-paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow up to 5 minutes for download & probe

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // A. Handle Local Video File Upload (Multipart Form Data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { error: 'No video file provided.' },
          { status: 400 }
        );
      }

      const fileName = file.name || 'uploaded_video.mp4';
      const fileType = file.type || 'video/mp4';

      // Verify supported formats
      const ext = path.extname(fileName).toLowerCase();
      if (!['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) {
        return NextResponse.json(
          {
            error: `Unsupported format (${ext}). Supported formats: MP4, MOV, WEBM.`,
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 50000) {
        return NextResponse.json(
          { error: 'File is too small or corrupt to be a valid video.' },
          { status: 400 }
        );
      }

      const mediaItem = await ingestMediaFile({
        buffer,
        fileName,
        fileType,
        sourceType: 'upload',
      });

      return NextResponse.json({
        success: true,
        mediaItem,
      });
    }

    // B. Handle YouTube Ingestion (JSON payload)
    const body = await request.json();
    const url = body.url || body.youtubeUrl;

    if (!url) {
      return NextResponse.json(
        { error: 'URL or video file is required.' },
        { status: 400 }
      );
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

    // 1. Check if this exact video was already downloaded and preserved in Media Hub
    const hubDir = getLocalMediaDir(`yt_${videoId}`);
    if (fs.existsSync(hubDir)) {
      const files = fs.readdirSync(hubDir).filter((f) => f.endsWith('.mp4'));
      if (files.length > 0) {
        const cachedVideoPath = path.join(hubDir, files[0]);
        if (
          fs.existsSync(cachedVideoPath) &&
          fs.statSync(cachedVideoPath).size > 10000
        ) {
          const probe = await probeVideo(cachedVideoPath);
          const actualDuration =
            probe.duration && probe.duration > 0 && probe.duration !== 60
              ? probe.duration
              : metadata.duration || 60;
          const actualResolution = `${probe.width || 1920}x${probe.height || 1080}`;

          const cachedItem = {
            id: `yt_${videoId}`,
            fileName: files[0],
            file_name: files[0],
            fileType: 'video/mp4',
            file_type: 'video/mp4',
            fileSize: fs.statSync(cachedVideoPath).size,
            file_size: fs.statSync(cachedVideoPath).size,
            previewUrl: fs.existsSync(path.join(hubDir, 'poster.jpg'))
              ? `/media-hub/yt_${videoId}/poster.jpg`
              : null,
            preview_url: fs.existsSync(path.join(hubDir, 'poster.jpg'))
              ? `/media-hub/yt_${videoId}/poster.jpg`
              : null,
            downloadUrl: `/media-hub/yt_${videoId}/${files[0]}`,
            download_url: `/media-hub/yt_${videoId}/${files[0]}`,
            videoUrl: `/media-hub/yt_${videoId}/${files[0]}`,
            localPath: cachedVideoPath,
            local_path: cachedVideoPath,
            duration: actualDuration,
            resolution: actualResolution,
            sourceType: 'youtube',
            source_type: 'youtube',
          };

          return NextResponse.json({
            success: true,
            mediaItem: cachedItem,
            metadata: {
              ...metadata,
              duration: actualDuration,
              resolution: actualResolution,
              videoUrl: cachedItem.download_url,
              isDownloaded: true,
            },
          });
        }
      }
    }

    const tempDir = getTempDir('yt-downloads');
    const tempTargetPath = path.join(tempDir, `${videoId}.mp4`);

    let dlResult = null;
    try {
      dlResult = await downloadYouTubeVideo({
        url,
        targetPath: tempTargetPath,
        subtitleDir: tempDir,
        timeoutMs: 180000,
      });
    } catch (dlErr) {
      return NextResponse.json(
        {
          success: false,
          error: dlErr.message || 'YouTube download failed.',
          errorType: dlErr.type,
          metadata,
        },
        { status: dlErr.status || 422 }
      );
    }

    // Verify downloaded file
    if (
      !fs.existsSync(tempTargetPath) ||
      fs.statSync(tempTargetPath).size < 10000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "YouTube blocked automated fetch. You can drop the video file directly into 'Upload Video' for instant 1080p FHD processing with authentic Urdu subtitles!",
          errorType: 'BOT_DETECTION',
          metadata,
        },
        { status: 422 }
      );
    }

    const videoBuffer = fs.readFileSync(tempTargetPath);
    const cleanTitle = (metadata.title || videoId)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    // Accurately probe downloaded video timing, resolution and streams
    const probe = dlResult.probe || (await probeVideo(tempTargetPath));
    const resolvedDuration =
      probe.duration && probe.duration > 0 && probe.duration !== 60
        ? probe.duration
        : metadata.duration || probe.duration || 60;
    const resolvedResolution =
      probe.width && probe.height
        ? `${probe.width}x${probe.height}`
        : metadata.resolution || '1920x1080';

    const mediaItem = await ingestMediaFile({
      buffer: videoBuffer,
      fileName: `${cleanTitle}.mp4`,
      fileType: 'video/mp4',
      sourceType: 'youtube',
      customId: `yt_${videoId}`,
      duration: resolvedDuration,
      resolution: resolvedResolution,
    });

    // Check for auto-extracted YouTube subtitle or transcribe from audio
    const subPath = dlResult.subtitlePath || findSubtitleFile(tempDir, videoId);
    let transcript = null;
    let extractedCaptions = [];

    if (subPath && fs.existsSync(subPath)) {
      const candidateVtt = fs.readFileSync(subPath, 'utf-8');
      // Strictly verify subtitle has authentic Urdu script characters
      if (/[\u0600-\u06FF]/.test(candidateVtt)) {
        transcript = candidateVtt;
        mediaItem.transcript = transcript;
        try {
          const parsed = parseVttFile(transcript);
          extractedCaptions = mergeIntoPhraseCaptions(parsed, 10, 1.0);
        } catch (_) {}
      }
    }

    // If no YouTube subtitle file was found, transcribe audio directly with Whisper ONNX
    if (
      (!extractedCaptions || extractedCaptions.length === 0) &&
      fs.existsSync(tempTargetPath)
    ) {
      try {
        const whisperRes = await transcribeUrduVideo({
          videoPath: tempTargetPath,
          language: 'ur',
        });
        if (whisperRes?.captions?.length > 0) {
          extractedCaptions = whisperRes.captions;
          transcript = whisperRes.rawText || transcript;
          mediaItem.transcript = transcript;
        }
      } catch (whisperErr) {
        console.warn('Ingest audio transcription notice:', whisperErr.message);
      }
    }

    mediaItem.captions = extractedCaptions;

    // Clean up temporary download file
    try {
      fs.unlinkSync(tempTargetPath);
      if (subPath && fs.existsSync(subPath)) fs.unlinkSync(subPath);
    } catch (e) {
      /* ignore cleanup failure */
    }

    return NextResponse.json({
      success: true,
      mediaItem: {
        ...mediaItem,
        captions: extractedCaptions,
      },
      metadata: {
        ...metadata,
        duration: resolvedDuration,
        resolution: resolvedResolution,
        videoUrl: mediaItem.download_url,
        isDownloaded: true,
        transcript,
        captions: extractedCaptions,
      },
    });
  } catch (err) {
    console.error('Ingest API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal media ingestion failure.' },
      { status: 500 }
    );
  }
}
