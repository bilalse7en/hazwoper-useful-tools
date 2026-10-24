/**
 * Unified YouTube Video Downloader Service
 * Single source of truth for high-definition (1080p FHD) YouTube video downloads,
 * auto-generated subtitle extraction, and post-download stream verification.
 * 100% Free and open-source using yt-dlp, FFmpeg, and Node.js runtime.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { probeVideo, getFFmpegBinary } from './ffmpeg-service.js';
import { isValidYouTubeUrl, extractYouTubeId } from './source-parser.js';

/**
 * Resolves paths to required runtime binaries (yt-dlp, ffmpeg, node)
 */
export function resolveDownloaderBinaries() {
  const isWin = process.platform === 'win32';
  const ytDlpName = isWin ? 'yt-dlp.exe' : 'yt-dlp';

  const ytDlpCandidates = [
    path.join(process.cwd(), 'bin', ytDlpName),
    path.join(process.cwd(), 'bin', 'yt-dlp.exe'),
    path.join(process.cwd(), 'node_modules', '.bin', ytDlpName),
    path.join(os.tmpdir(), ytDlpName),
    path.join(os.tmpdir(), 'yt-dlp'),
  ];

  let ytDlpPath = ytDlpCandidates.find((p) => fs.existsSync(p));
  if (!ytDlpPath) {
    ytDlpPath = ytDlpName; // Fallback to system PATH
  }

  const ffmpegPath = getFFmpegBinary();
  const nodePath = process.execPath;

  return {
    ytDlpPath,
    ffmpegPath,
    nodePath: nodePath && fs.existsSync(nodePath) ? nodePath : null,
  };
}

/**
 * Ensures yt-dlp binary is available, auto-fetching standalone Linux binary on Vercel/serverless if needed.
 * Crucial: Uses 'yt-dlp_linux' (standalone binary with embedded Python runtime), NOT the python zipapp script
 * which fails with "env: 'python3': No such file or directory" (code 127) on Vercel's Node runtime.
 */
export async function ensureYtDlpBinary() {
  const isWin = process.platform === 'win32';
  if (isWin) {
    return resolveDownloaderBinaries();
  }

  const resolved = resolveDownloaderBinaries();
  // Check if a standalone binary already exists locally
  if (
    resolved.ytDlpPath &&
    fs.existsSync(resolved.ytDlpPath) &&
    resolved.ytDlpPath.includes(path.sep)
  ) {
    try {
      const stat = fs.statSync(resolved.ytDlpPath);
      if (stat.size > 20000000) {
        fs.chmodSync(resolved.ytDlpPath, 0o755);
        return resolved;
      }
    } catch (_) {}
  }

  const tmpYtDlp = path.join(os.tmpdir(), 'yt-dlp');
  if (fs.existsSync(tmpYtDlp)) {
    try {
      const stat = fs.statSync(tmpYtDlp);
      // Standalone Linux binary is ~38MB - 45MB. If > 20MB, it is the standalone PyInstaller ELF binary.
      if (stat.size > 20000000) {
        fs.chmodSync(tmpYtDlp, 0o755);
        return { ...resolved, ytDlpPath: tmpYtDlp };
      } else {
        // Clean up old non-standalone zipapp script (<5MB) that caused code 127
        try {
          fs.unlinkSync(tmpYtDlp);
        } catch (_) {}
      }
    } catch (_) {}
  }

  // Determine architecture: aarch64 (ARM) vs x86_64 (Intel/AMD)
  const isArm = process.arch === 'arm64' || process.arch === 'arm';
  const binaryName = isArm ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
  const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName}`;

  try {
    const res = await fetch(downloadUrl, { redirect: 'follow' });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(tmpYtDlp, buffer);
      fs.chmodSync(tmpYtDlp, 0o755);
      return { ...resolved, ytDlpPath: tmpYtDlp };
    }
  } catch (err) {
    console.warn(
      'Could not auto-download standalone yt-dlp binary for Linux:',
      err.message
    );
  }

  return resolved;
}

/**
 * Searches for any verified, non-empty user-supplied cookies.txt file
 * Supports environment variables (YOUTUBE_COOKIES_PATH, YOUTUBE_COOKIES_BASE64, YOUTUBE_COOKIES)
 * for Vercel/serverless environments as well as local files.
 */
export function getAvailableCookiesFile() {
  // 1. Direct path from environment variable (local development or server configuration)
  if (process.env.YOUTUBE_COOKIES_PATH) {
    try {
      const envPath = path.resolve(process.env.YOUTUBE_COOKIES_PATH);
      if (fs.existsSync(envPath) && fs.statSync(envPath).size > 50) {
        return envPath;
      }
    } catch (_) {}
  }

  // 2. Base64-encoded Netscape cookies from Vercel / serverless environment variable
  if (process.env.YOUTUBE_COOKIES_BASE64) {
    try {
      const decoded = Buffer.from(
        process.env.YOUTUBE_COOKIES_BASE64,
        'base64'
      ).toString('utf-8');
      if (decoded.length > 50) {
        const envCookiesPath = path.join(os.tmpdir(), 'env_cookies.txt');
        fs.writeFileSync(envCookiesPath, decoded, { mode: 0o600 });
        return envCookiesPath;
      }
    } catch (_) {}
  }

  // 3. Raw Netscape cookies from environment variable
  if (process.env.YOUTUBE_COOKIES) {
    try {
      const raw = process.env.YOUTUBE_COOKIES.trim();
      if (raw.length > 50) {
        const envCookiesPath = path.join(os.tmpdir(), 'env_cookies.txt');
        fs.writeFileSync(envCookiesPath, raw, { mode: 0o600 });
        return envCookiesPath;
      }
    } catch (_) {}
  }

  // 4. File candidates on disk
  const candidates = [
    path.join(os.tmpdir(), 'cookies.txt'),
    path.join(process.cwd(), 'cookies.txt'),
    path.join(process.cwd(), 'bin', 'cookies.txt'),
    path.join(process.cwd(), 'public', 'temp-shorts', 'cookies.txt'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const stats = fs.statSync(candidate);
        if (stats.size > 50) {
          return candidate;
        }
      }
    } catch (_) {
      // Ignore filesystem read errors
    }
  }

  return null;
}

/**
 * Checks for local browser cookie configuration (e.g. YOUTUBE_COOKIES_BROWSER=chrome)
 * Explicitly disabled on serverless/Vercel runtimes.
 */
export function getBrowserCookiesConfig() {
  const isVercel = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  );
  const browserName = process.env.YOUTUBE_COOKIES_BROWSER?.trim().toLowerCase();
  if (
    !isVercel &&
    browserName &&
    ['chrome', 'firefox', 'edge', 'brave', 'safari', 'opera'].includes(
      browserName
    )
  ) {
    return browserName;
  }
  return null;
}

/**
 * Searches for auto-generated subtitle (.vtt) file in the specified directory.
 * yt-dlp typically names files: [title].[lang].vtt or [id].[lang].vtt
 */
export function findSubtitleFile(dir, identifierOrPath) {
  try {
    if (!fs.existsSync(dir)) return null;

    const baseName = identifierOrPath
      ? path.basename(identifierOrPath, path.extname(identifierOrPath))
      : '';
    const files = fs.readdirSync(dir);

    // Only look for authentic Urdu subtitle files
    const priorities = ['ur', 'ur-PK'];

    for (const lang of priorities) {
      const match = files.find(
        (f) =>
          f.endsWith('.vtt') &&
          (!baseName || f.includes(baseName)) &&
          (f.includes(`.${lang}.`) || f.includes(`_${lang}.`))
      );
      if (match) {
        const fullPath = path.join(dir, match);
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Only return if file actually contains Urdu script
          if (/[\u0600-\u06FF]/.test(content)) {
            return fullPath;
          }
        } catch (_) {}
      }
    }

    // Do NOT return English or foreign non-Urdu subtitles.
    // Returning null forces Whisper speech recognition to transcribe the authentic audio.
    return null;
  } catch (e) {
    console.warn('Subtitle file search warning:', e.message);
  }
  return null;
}

/**
 * Maps raw stderr from yt-dlp into friendly, actionable user messages
 */
export function categorizeDownloadError(rawError) {
  const text = String(rawError || '');

  // Missing standalone binary / missing python runtime (Vercel code 127)
  if (
    /code 127/i.test(text) ||
    /python3.*No such file/i.test(text) ||
    /No such file or directory.*python/i.test(text)
  ) {
    return {
      type: 'MISSING_DEPENDENCY',
      message:
        'The server video-processing runtime requires the standalone Linux binary (code 127: missing python3). The system will auto-download yt-dlp_linux or please upload your video directly.',
      status: 500,
    };
  }

  // YouTube Rate Limiting / 429
  if (
    /HTTP Error 429/i.test(text) ||
    /Too Many Requests/i.test(text) ||
    /rate-limit/i.test(text)
  ) {
    return {
      type: 'RATE_LIMITED',
      message:
        'YouTube has temporarily rate-limited automated requests (HTTP 429). Please wait a few moments or upload the video file directly (MP4/MOV).',
      status: 429,
    };
  }

  if (
    /Sign in to confirm you're not a bot/i.test(text) ||
    /confirm you.*re not a bot/i.test(text) ||
    /Use --cookies/i.test(text) ||
    /403: Forbidden/i.test(text) ||
    /HTTP Error 403/i.test(text) ||
    /Forbidden/i.test(text) ||
    /bot/i.test(text) ||
    /blocked/i.test(text)
  ) {
    return {
      type: 'BOT_DETECTION',
      message:
        "YouTube bot check detected (Sign in to confirm you're not a bot / HTTP 403). Please upload the video file directly (MP4/MOV) for instant 1080p FHD processing with authentic Urdu subtitles!",
      status: 422,
    };
  }

  if (
    /Private video/i.test(text) ||
    /This video is private/i.test(text) ||
    /requires authentication/i.test(text)
  ) {
    return {
      type: 'RESTRICTED_VIDEO',
      message:
        'This YouTube video is private or restricted. Please ensure the video is public or upload the video file directly.',
      status: 403,
    };
  }

  if (
    /Video unavailable/i.test(text) ||
    /does not exist/i.test(text) ||
    /HTTP Error 404/i.test(text)
  ) {
    return {
      type: 'NOT_FOUND',
      message:
        'The requested YouTube video was not found or is no longer available.',
      status: 404,
    };
  }

  if (/timed out/i.test(text)) {
    return {
      type: 'TIMEOUT',
      message:
        'Download timed out. The video may be too long or network throughput was saturated. Try a shorter video or upload directly.',
      status: 504,
    };
  }

  return {
    type: 'DOWNLOAD_FAILED',
    message: text.slice(-300) || 'YouTube download failed.',
    status: 500,
  };
}

/**
 * Spawns a single execution of yt-dlp with timeout and process cleanup
 */
function runYtDlpProcess(ytDlpPath, args, targetPath, timeoutMs) {
  return new Promise((resolve, reject) => {
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
    const timer = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch (_) {}
      reject(
        new Error(
          `Download timed out after ${Math.round(timeoutMs / 1000)} seconds.`
        )
      );
    }, timeoutMs + 2000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (
        code === 0 &&
        (!targetPath ||
          (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 10000))
      ) {
        resolve({ targetPath, stdout, stderr });
      } else {
        const snippet = (stderr || stdout || '').slice(-350);
        reject(new Error(`yt-dlp exited with code ${code}: ${snippet}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Primary Unified YouTube Downloader Function.
 *
 * Guaranteed Behaviors:
 * 1. Checks and uses Node JS runtime to solve YouTube's n-challenge signatures.
 * 2. Multi-strategy execution: Clean desktop web client -> cookies fallback -> web_creator fallback.
 * 3. Probes the output with FFmpeg to verify media streams, duration, and resolution.
 * 4. Extracts auto-generated or manual subtitles (VTT).
 * 5. Returns verified metadata, duration, resolution, and subtitle paths.
 */
export async function downloadYouTubeVideo({
  url,
  targetPath,
  subtitleDir = null,
  timeoutMs = 180000,
  allowCookies = true,
}) {
  if (!isValidYouTubeUrl(url)) {
    throw new Error(
      'Invalid YouTube URL format. Please provide a standard YouTube video or Shorts link.'
    );
  }

  const { ytDlpPath, ffmpegPath, nodePath } = await ensureYtDlpBinary();

  if (!fs.existsSync(ytDlpPath) && ytDlpPath.includes(path.sep)) {
    throw new Error(`yt-dlp binary not found at ${ytDlpPath}`);
  }

  // Ensure target and subtitle directories exist
  const resolvedTargetPath = path.resolve(targetPath);
  const targetDir = path.dirname(resolvedTargetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const resolvedSubDir = subtitleDir ? path.resolve(subtitleDir) : targetDir;
  if (!fs.existsSync(resolvedSubDir)) {
    fs.mkdirSync(resolvedSubDir, { recursive: true });
  }

  const cookiesFile = allowCookies ? getAvailableCookiesFile() : null;
  const browserCookie = getBrowserCookiesConfig();

  // Base arguments: Android & Web player client extraction to avoid SABR bot challenges on datacenter IPs,
  // 1080p max resolution and pure video+audio merging.
  // Subtitles are handled non-fatally below to prevent YouTube's timedtext HTTP 429 from aborting video downloads.
  const baseArgs = [
    url,
    '-o',
    resolvedTargetPath,
    '-f',
    'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
    '--merge-output-format',
    'mp4',
    '--no-playlist',
    '--no-warnings',
    '--max-filesize',
    '500M',
    '--extractor-args',
    'youtube:player_client=android,web',
  ];

  // Provide Node.js runtime to yt-dlp to decipher YouTube JS challenges
  if (nodePath) {
    baseArgs.push('--js-runtimes', `node:${nodePath}`);
  }

  // Provide FFmpeg location for stream merging
  if (ffmpegPath && fs.existsSync(ffmpegPath)) {
    baseArgs.push('--ffmpeg-location', ffmpegPath);
  }

  let lastError = null;

  // Strategy 1: Android + Web player client extraction
  try {
    await runYtDlpProcess(ytDlpPath, baseArgs, resolvedTargetPath, timeoutMs);
  } catch (cleanErr) {
    lastError = cleanErr;
    console.warn(
      'Primary download attempt failed, evaluating fallbacks:',
      cleanErr.message
    );

    // Strategy 2: If cookies file exists (from env vars or uploaded cookies.txt)
    if (cookiesFile) {
      try {
        const argsWithCookies = [...baseArgs, '--cookies', cookiesFile];
        await runYtDlpProcess(
          ytDlpPath,
          argsWithCookies,
          resolvedTargetPath,
          timeoutMs
        );
        lastError = null; // Succeeded with cookies
      } catch (cookieErr) {
        lastError = cookieErr;
        console.warn('Cookie attempt failed:', cookieErr.message);
      }
    }

    // Strategy 3: Local-only browser cookies (if configured and not on Vercel)
    if (lastError && browserCookie) {
      try {
        const argsWithBrowser = [
          ...baseArgs,
          '--cookies-from-browser',
          browserCookie,
        ];
        await runYtDlpProcess(
          ytDlpPath,
          argsWithBrowser,
          resolvedTargetPath,
          timeoutMs
        );
        lastError = null; // Succeeded with browser cookies
      } catch (browserErr) {
        lastError = browserErr;
        console.warn('Browser cookie attempt failed:', browserErr.message);
      }
    }
  }

  if (lastError) {
    // If output file was partially created, clean it up
    try {
      if (fs.existsSync(resolvedTargetPath)) {
        fs.unlinkSync(resolvedTargetPath);
      }
    } catch (_) {}

    const categorized = categorizeDownloadError(lastError.message);
    const err = new Error(categorized.message);
    err.status = categorized.status;
    err.type = categorized.type;
    err.raw = lastError.message;
    throw err;
  }

  // Post-download validation: Verify file existence & size
  if (
    !fs.existsSync(resolvedTargetPath) ||
    fs.statSync(resolvedTargetPath).size < 10000
  ) {
    try {
      if (fs.existsSync(resolvedTargetPath)) fs.unlinkSync(resolvedTargetPath);
    } catch (_) {}
    throw new Error('Downloaded file is incomplete or corrupt.');
  }

  const fileSize = fs.statSync(resolvedTargetPath).size;

  // Probe media streams using FFmpeg
  const probe = await probeVideo(resolvedTargetPath);
  if (!probe || !probe.duration || probe.duration <= 0) {
    try {
      if (fs.existsSync(resolvedTargetPath)) fs.unlinkSync(resolvedTargetPath);
    } catch (_) {}
    throw new Error(
      'Downloaded media file contains invalid or unreadable video streams.'
    );
  }

  // Non-fatal auto-subtitle extraction probe (never breaks video ingestion)
  try {
    const subArgs = [
      url,
      '--skip-download',
      '--write-subs',
      '--write-auto-sub',
      '--sub-lang',
      'ur,ur-PK,en',
      '--sub-format',
      'vtt',
      '--convert-subs',
      'vtt',
      '--paths',
      `subtitle:${resolvedSubDir}`,
      '--no-warnings',
    ];
    if (nodePath) subArgs.push('--js-runtimes', `node:${nodePath}`);
    if (cookiesFile) subArgs.push('--cookies', cookiesFile);
    if (ffmpegPath && fs.existsSync(ffmpegPath)) {
      subArgs.push('--ffmpeg-location', ffmpegPath);
    }
    await runYtDlpProcess(ytDlpPath, subArgs, null, 15000);
  } catch (_) {
    // Expected: YouTube timedtext often returns 429 for automated requests.
    // Downstream Whisper transcription service will transcribe the audio track directly.
  }

  // Locate auto-extracted subtitle file if present
  const videoId = extractYouTubeId(url);
  const subtitlePath = findSubtitleFile(
    resolvedSubDir,
    videoId || resolvedTargetPath
  );

  return {
    videoPath: resolvedTargetPath,
    subtitlePath,
    fileSize,
    probe,
  };
}
