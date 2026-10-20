import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import {
  getYouTubeMetadata,
  isValidYouTubeUrl,
  extractYouTubeId,
} from '@/lib/video-shorts/source-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to 3 minutes for large video downloads
export const maxDuration = 180;

/**
 * Downloads a YouTube video using yt-dlp with timeout and auto-subtitle extraction.
 * Returns { videoPath, subtitlePath } on success.
 */
function downloadYouTubeVideo(
  url,
  targetPath,
  subtitleDir,
  timeoutMs = 150000
) {
  return new Promise((resolve, reject) => {
    const ytDlpPath = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
    const ffmpegPath = path.join(
      process.cwd(),
      'node_modules',
      'ffmpeg-static',
      'ffmpeg.exe'
    );

    if (!fs.existsSync(ytDlpPath)) {
      return reject(new Error('yt-dlp binary not found in bin directory'));
    }

    // Check for user-uploaded cookies in temp-shorts or bin
    const cookiesCandidates = [
      path.join(process.cwd(), 'public', 'temp-shorts', 'cookies.txt'),
      path.join(process.cwd(), 'bin', 'cookies.txt'),
    ];
    let cookiesFile = cookiesCandidates.find((p) => fs.existsSync(p));

    const args = [
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
      // Download YouTube auto-generated subtitles
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

    // Standard modern web extraction uses Node JS runtime to solve YouTube decipher challenges
    try {
      const nodePath = process.execPath;
      if (nodePath && fs.existsSync(nodePath)) {
        args.push('--js-runtimes', `node:${nodePath}`);
      }
    } catch (e) {
      /* ignore */
    }

    // If a verified cookie file is provided, pass it; otherwise use clean web client (NEVER android/ios client)
    if (cookiesFile) {
      args.push('--cookies', cookiesFile);
    }

    if (fs.existsSync(ffmpegPath)) {
      args.push('--ffmpeg-location', ffmpegPath);
    }

    const proc = spawn(ytDlpPath, args, { timeout: timeoutMs });
    let stderr = '';
    let stdout = '';

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    // Hard timeout safety net
    const killTimer = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch (e) {
        /* ignore */
      }
      reject(
        new Error(
          'Download timed out after ' +
            Math.round(timeoutMs / 1000) +
            ' seconds. Try a shorter video.'
        )
      );
    }, timeoutMs + 5000);

    proc.on('close', (code) => {
      clearTimeout(killTimer);
      if (code === 0 && fs.existsSync(targetPath)) {
        // Find the subtitle file (yt-dlp names it based on the video)
        const subtitlePath = findSubtitleFile(subtitleDir, targetPath);
        resolve({ videoPath: targetPath, subtitlePath });
      } else {
        const errorSnippet = (stderr || stdout || '').slice(-350);
        reject(new Error(`yt-dlp exited with code ${code}: ${errorSnippet}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(killTimer);
      reject(err);
    });
  });
}

/**
 * Searches for auto-generated subtitle VTT file near the video file.
 * yt-dlp typically names it: videoId.en.vtt or videoId.ur.vtt
 */
function findSubtitleFile(dir, videoPath) {
  try {
    const baseName = path.basename(videoPath, path.extname(videoPath));
    const files = fs.readdirSync(dir);

    // Priority: en > ur > ar > hi > any .vtt
    const priorities = ['en', 'ur', 'ar', 'hi'];
    for (const lang of priorities) {
      const match = files.find(
        (f) =>
          f.endsWith('.vtt') &&
          (f.includes(`.${lang}.`) || f.includes(`_${lang}.`))
      );
      if (match) return path.join(dir, match);
    }

    // Fallback: any VTT file
    const anyVtt = files.find((f) => f.endsWith('.vtt'));
    if (anyVtt) return path.join(dir, anyVtt);
  } catch (e) {
    console.warn('Could not search for subtitle file:', e.message);
  }
  return null;
}

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
      const publicTempDir = path.join(process.cwd(), 'public', 'temp-shorts');
      if (!fs.existsSync(publicTempDir)) {
        fs.mkdirSync(publicTempDir, { recursive: true });
      }

      // Purge temp videos older than 24 hours
      cleanOldTempVideos(publicTempDir);

      const targetPath = path.join(publicTempDir, `${videoId}.mp4`);
      const subtitleCachePath = path.join(publicTempDir, `${videoId}.vtt`);

      // Check if already cached (video + subtitle)
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 50000) {
        videoUrl = `/temp-shorts/${videoId}.mp4`;
        isDownloaded = true;

        // Try to load cached subtitle
        if (fs.existsSync(subtitleCachePath)) {
          transcript = fs.readFileSync(subtitleCachePath, 'utf-8');
        }
      } else {
        try {
          const result = await downloadYouTubeVideo(
            url,
            targetPath,
            publicTempDir
          );

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
          // Return partial success with metadata only
          return NextResponse.json({
            success: true,
            metadata: {
              ...metadata,
              videoUrl: null,
              isDownloaded: false,
              transcript: null,
              downloadError: dlErr.message,
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
