import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { ingestMediaFile } from '@/lib/video-shorts/media-storage-service';
import { probeVideo } from '@/lib/video-shorts/ffmpeg-service';
import {
  isValidYouTubeUrl,
  extractYouTubeId,
  getYouTubeMetadata,
} from '@/lib/video-shorts/source-parser';
import { transcribeUrduVideo } from '@/lib/video-shorts/transcription-service';
import {
  parseVttFile,
  mergeIntoPhraseCaptions,
} from '@/lib/video-shorts/vtt-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow up to 5 minutes for download & probe

function runYtDlpAttempt(args, targetPath, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const ytDlpPath = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
    const proc = spawn(ytDlpPath, args, { timeout: timeoutMs });
    let stderr = '';
    let stdout = '';

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (
        code === 0 &&
        fs.existsSync(targetPath) &&
        fs.statSync(targetPath).size > 10000
      ) {
        resolve({ targetPath });
      } else {
        const errorSnippet = (stderr || stdout || '').slice(-350);
        reject(new Error(`yt-dlp exited with code ${code}: ${errorSnippet}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Downloads a YouTube video via yt-dlp with multi-strategy fallbacks
 */
async function downloadYouTubeToTemp(
  url,
  targetPath,
  subtitleDir,
  timeoutMs = 180000
) {
  const ytDlpPath = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
  const ffmpegPath = path.join(
    process.cwd(),
    'node_modules',
    'ffmpeg-static',
    'ffmpeg.exe'
  );

  if (!fs.existsSync(ytDlpPath)) {
    throw new Error('yt-dlp binary not found in bin directory');
  }

  // Check for uploaded cookies only in temp-shorts or bin
  const cookiesCandidates = [
    path.join(process.cwd(), 'public', 'temp-shorts', 'cookies.txt'),
    path.join(process.cwd(), 'bin', 'cookies.txt'),
  ];
  const cookiesFile = cookiesCandidates.find((p) => fs.existsSync(p));

  const baseArgs = [
    url,
    '-o',
    targetPath,
    '-f',
    'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
    '--merge-output-format',
    'mp4',
    '--no-playlist',
    '--no-warnings',
    '--max-filesize',
    '500M',
    '--write-subs',
    '--write-auto-sub',
    '--sub-lang',
    'ur,ur-PK,en,hi,ar,all',
    '--sub-format',
    'vtt',
    '--convert-subs',
    'vtt',
    '--paths',
    subtitleDir,
  ];

  try {
    const nodePath = process.execPath;
    if (nodePath && fs.existsSync(nodePath)) {
      baseArgs.push('--js-runtimes', `node:${nodePath}`);
    }
  } catch (e) {
    /* ignore */
  }

  if (fs.existsSync(ffmpegPath)) {
    baseArgs.push('--ffmpeg-location', ffmpegPath);
  }

  // Strategy 1: Primary clean Web client (direct download, solves JS challenge natively via Node)
  try {
    return await runYtDlpAttempt(baseArgs, targetPath, timeoutMs);
  } catch (cleanErr) {
    console.warn(
      'Clean web download attempt failed, trying fallback strategies:',
      cleanErr.message
    );

    // Strategy 2: If clean web failed and user-uploaded cookies exist, try with cookies
    if (cookiesFile) {
      try {
        const argsWithCookies = [...baseArgs, '--cookies', cookiesFile];
        return await runYtDlpAttempt(argsWithCookies, targetPath, timeoutMs);
      } catch (cookieErr) {
        console.warn('Cookie attempt notice:', cookieErr.message);
      }
    }

    // Strategy 3: Web Creator client fallback
    try {
      const argsWebCreator = [
        ...baseArgs,
        '--extractor-args',
        'youtube:player_client=web_creator',
      ];
      return await runYtDlpAttempt(argsWebCreator, targetPath, timeoutMs);
    } catch (webCreatorErr) {
      console.warn('Web Creator client attempt notice:', webCreatorErr.message);
    }

    throw cleanErr;
  }
}

function findSubtitleFile(dir, videoId) {
  try {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    const priorities = ['ur', 'en', 'ar', 'hi'];
    for (const lang of priorities) {
      const match = files.find(
        (f) =>
          f.includes(videoId) && f.endsWith('.vtt') && f.includes(`.${lang}.`)
      );
      if (match) return path.join(dir, match);
    }
    const anyVtt = files.find((f) => f.includes(videoId) && f.endsWith('.vtt'));
    if (anyVtt) return path.join(dir, anyVtt);
  } catch (e) {
    console.warn('Could not read subtitle directory:', e.message);
  }
  return null;
}

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
    const hubDir = path.join(
      process.cwd(),
      'public',
      'media-hub',
      `yt_${videoId}`
    );
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

    const tempDir = path.join(process.cwd(), 'temp', 'yt-downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempTargetPath = path.join(tempDir, `${videoId}.mp4`);

    try {
      await downloadYouTubeToTemp(url, tempTargetPath, tempDir);
    } catch (dlErr) {
      return NextResponse.json(
        {
          success: false,
          error: dlErr.message || 'YouTube download failed.',
          metadata,
        },
        { status: 422 }
      );
    }

    // Verify downloaded file
    if (
      !fs.existsSync(tempTargetPath) ||
      fs.statSync(tempTargetPath).size < 10000
    ) {
      return NextResponse.json(
        { error: 'Downloaded file is incomplete or unreadable.' },
        { status: 500 }
      );
    }

    const videoBuffer = fs.readFileSync(tempTargetPath);
    const cleanTitle = (metadata.title || videoId)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    // Accurately probe downloaded video timing, resolution and streams
    const probe = await probeVideo(tempTargetPath);
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
    const subPath = findSubtitleFile(tempDir, videoId);
    let transcript = null;
    let extractedCaptions = [];

    if (subPath && fs.existsSync(subPath)) {
      transcript = fs.readFileSync(subPath, 'utf-8');
      mediaItem.transcript = transcript;
      try {
        const parsed = parseVttFile(transcript);
        extractedCaptions = mergeIntoPhraseCaptions(parsed, 10, 1.0);
      } catch (_) {}
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
