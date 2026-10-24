/**
 * FFmpeg Command Generator & Execution Engine
 * Safe, validated FFmpeg arguments for rendering 9:16 shorts, audio normalization, fades, and captions.
 * 100% Free, powered by ffmpeg-static.
 */

import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Resolves verified executable FFmpeg binary path
 */
export function getFFmpegBinary() {
  let bin = ffmpegStatic;
  if (bin && fs.existsSync(bin)) return bin;

  const isWin = os.platform() === 'win32';
  const name = isWin ? 'ffmpeg.exe' : 'ffmpeg';

  const candidates = [
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', name),
    path.join(process.cwd(), 'node_modules', '.bin', name),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return 'ffmpeg';
}

/**
 * Builds safe FFmpeg CLI arguments for a clip render job.
 */
export function buildFFmpegArgs({
  inputPath,
  outputPath,
  startTime = 0,
  duration = 30,
  aspectRatio = '9:16',
  framingMode = 'smart-face',
  cropX = null,
  fadeIn = 0.5,
  fadeOut = 0.5,
  normalizeAudio = true,
  audioVolume = 1.0,
  bgmPath = null,
  bgmVolume = 0.15,
  assPath = null,
  sourceWidth = 1920,
  sourceHeight = 1080,
  openingStyle = 'none',
  openingDuration = 1.5,
  hasAudio = true,
  brollPath = null,
}) {
  const args = ['-y'];

  // Accurate seeking with guaranteed zero-offset stream alignment
  args.push('-ss', String(Math.max(0, startTime)));
  args.push('-i', inputPath);
  args.push('-avoid_negative_ts', 'make_zero');
  args.push('-t', String(Math.max(1, duration)));

  const hasBroll = Boolean(brollPath && fs.existsSync(brollPath));
  if (hasBroll) {
    // Input 1: Islamic B-roll visual (seamlessly looped to match short duration, strictly capped at clip duration)
    args.push(
      '-stream_loop',
      '-1',
      '-t',
      String(Math.max(1, duration)),
      '-i',
      brollPath
    );
  }

  // Background music input if provided
  if (bgmPath && fs.existsSync(bgmPath)) {
    args.push(
      '-stream_loop',
      '-1',
      '-t',
      String(Math.max(1, duration)),
      '-i',
      bgmPath
    );
  }

  // Video Filter Construction
  const vFilters = [];
  const targetW =
    aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920;
  const targetH =
    aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080;

  if (aspectRatio === '9:16') {
    const cropXPct = cropX !== null ? Math.min(100, Math.max(0, cropX)) : 50;

    if (framingMode === 'blurred-bg') {
      const vSrc = hasBroll ? '[1:v]' : '[0:v]';
      vFilters.push(
        `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase:flags=lanczos,boxblur=20:5,setsar=1[bg];${vSrc}scale=${targetW}:-1:force_original_aspect_ratio=decrease:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`
      );
    } else if (cropX !== null && cropX > 100) {
      // Explicit pixel-coordinate crop (for exact pixel framing tests/configs)
      const cropW = Math.round(sourceHeight * (9 / 16));
      const cropH = sourceHeight;
      const resolvedX = Math.min(
        Math.max(0, Math.round(cropX)),
        Math.max(0, sourceWidth - cropW)
      );
      vFilters.push(
        `crop=${cropW}:${cropH}:${resolvedX}:0,scale=${targetW}:${targetH}:flags=lanczos,setsar=1`
      );
    } else {
      // Dynamic crop expression safe for any source resolution (4K, 1080p, 720p, 360p)
      const cropXPct = cropX !== null ? Math.min(100, Math.max(0, cropX)) : 50;
      vFilters.push(
        `crop='min(iw,ih*9/16):min(ih,iw*16/9):(iw-out_w)*${cropXPct}/100:(ih-out_h)/2',scale=${targetW}:${targetH}:flags=lanczos,setsar=1`
      );
    }
  } else if (aspectRatio === '1:1') {
    vFilters.push(
      `crop='min(iw,ih):min(iw,ih):(iw-out_w)/2:(ih-out_h)/2',scale=${targetW}:${targetH}:flags=lanczos,setsar=1`
    );
  } else {
    // 16:9 Landscape - Full 1920x1080 FHD
    vFilters.push(
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2,setsar=1`
    );
  }

  // Video Fades
  if (fadeIn > 0) {
    vFilters.push(`fade=t=in:st=0:d=${fadeIn}`);
  }
  if (fadeOut > 0) {
    const fadeOutStart = Math.max(0, duration - fadeOut);
    vFilters.push(`fade=t=out:st=${fadeOutStart}:d=${fadeOut}`);
  }

  // Burned-in ASS Subtitles if provided
  if (assPath && fs.existsSync(assPath)) {
    const escapedAssPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    vFilters.push(`ass='${escapedAssPath}'`);
  }

  // Audio Filter Construction
  const aFilters = [];
  if (hasAudio !== false) {
    if (audioVolume !== 1.0) {
      aFilters.push(`volume=${audioVolume}`);
    }
    if (fadeIn > 0) {
      aFilters.push(`afade=t=in:st=0:d=${fadeIn}`);
    }
    if (fadeOut > 0) {
      const fadeOutStart = Math.max(0, duration - fadeOut);
      aFilters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOut}`);
    }
    if (normalizeAudio && duration >= 3.0) {
      aFilters.push('loudnorm=I=-14:TP=-1.0:LRA=11');
    }
  }

  if (hasBroll) {
    // Complex filter mapping: [1:v] for visual, [0:a] for recitation audio
    const filterComplex = [
      `[1:v]${vFilters.join(',')}[vfinal]`,
      hasAudio !== false
        ? `[0:a]${aFilters.length > 0 ? aFilters.join(',') : 'anull'}[afinal]`
        : null,
    ]
      .filter(Boolean)
      .join(';');

    args.push('-filter_complex', filterComplex);
    args.push('-map', '[vfinal]');
    if (hasAudio !== false) {
      args.push('-map', '[afinal]');
      args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
    } else {
      args.push('-an');
    }
  } else {
    if (vFilters.length > 0) {
      args.push('-vf', vFilters.join(','));
    }
    if (hasAudio !== false) {
      if (aFilters.length > 0) {
        args.push('-af', aFilters.join(','));
      }
      args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
    } else {
      args.push('-an');
    }
  }

  // Strictly enforce duration limit & shortest stream on output to guarantee process terminates
  args.push('-t', String(Math.max(1, duration)));
  args.push('-shortest');

  // Codecs & Ultra-Fast High-Quality 1080x1920 FHD Encoding
  // preset veryfast provides 10x encoding speedup while CRF 18 preserves pristine visual quality
  args.push(
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '18',
    '-pix_fmt',
    'yuv420p',
    '-maxrate',
    '16M',
    '-bufsize',
    '32M',
    '-movflags',
    '+faststart'
  );
  args.push(outputPath);

  return args;
}

/**
 * Executes FFmpeg render job with real-time progress callbacks, strict timeout, and detailed stderr error capture.
 */
export function runFFmpegJob({
  args,
  duration,
  timeoutMs = 60000,
  onProgress,
  onComplete,
  onError,
}) {
  const binary = getFFmpegBinary();
  const proc = spawn(binary, args);
  let stderrBuffer = '';

  const timer = setTimeout(() => {
    try {
      proc.kill('SIGKILL');
    } catch (_) {}
    if (onError) {
      onError(
        new Error(
          `FFmpeg render timed out after ${Math.round(timeoutMs / 1000)} seconds.`
        )
      );
    }
  }, timeoutMs);

  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderrBuffer += text;
    if (stderrBuffer.length > 8000) {
      stderrBuffer = stderrBuffer.slice(-4000);
    }

    // Parse time=HH:MM:SS.ms
    const timeMatch = text.match(/time=(\d+):(\d+):(\d+\.\d+)/);
    if (timeMatch && onProgress && duration > 0) {
      const hrs = parseFloat(timeMatch[1]);
      const mins = parseFloat(timeMatch[2]);
      const secs = parseFloat(timeMatch[3]);
      const currentSec = hrs * 3600 + mins * 60 + secs;
      const percent = Math.min(99, Math.round((currentSec / duration) * 100));
      onProgress(percent, currentSec);
    }
  });

  proc.on('close', (code) => {
    clearTimeout(timer);
    if (code === 0) {
      if (onProgress) onProgress(100, duration);
      if (onComplete) onComplete();
    } else {
      const errorLines = stderrBuffer.trim().split('\n').slice(-6).join(' ');
      if (onError)
        onError(
          new Error(
            `FFmpeg exited with code ${code}: ${errorLines || 'Execution interrupted'}`
          )
        );
    }
  });

  proc.on('error', (err) => {
    clearTimeout(timer);
    if (onError) onError(err);
  });

  return proc;
}

/**
 * Extracts accurate media stream metadata (duration, width, height, fps, audio presence) using FFmpeg.
 */
export function probeVideo(filePath) {
  return new Promise((resolve) => {
    const binary = getFFmpegBinary();
    const proc = spawn(binary, ['-i', filePath]);
    let stderr = '';

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', () => {
      // Parse duration: Duration: 00:03:15.22 or 00:03:15
      const durMatch = stderr.match(
        /Duration:\s*(\d+):(\d+):(\d+(?:[.,]\d+)?)/
      );
      let duration = 60;
      if (durMatch) {
        duration =
          parseInt(durMatch[1], 10) * 3600 +
          parseInt(durMatch[2], 10) * 60 +
          parseFloat(durMatch[3].replace(',', '.'));
      }

      // Parse video stream: Video: h264 (...), 1920x1080 [SAR 1:1 DAR 16:9], 29.97 fps
      const dimMatch = stderr.match(/Video:.*?,\s*(\d{2,5})x(\d{2,5})/);
      const width = dimMatch ? parseInt(dimMatch[1], 10) : 1920;
      const height = dimMatch ? parseInt(dimMatch[2], 10) : 1080;

      const fpsMatch = stderr.match(/(\d+(?:\.\d+)?)\s*fps/);
      const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 30;

      const hasAudio = /Audio:/i.test(stderr);

      resolve({
        duration: Math.round(duration * 100) / 100,
        width,
        height,
        fps,
        hasAudio,
        rawStderr: stderr.slice(-400),
      });
    });

    proc.on('error', () => {
      resolve({
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        hasAudio: true,
      });
    });
  });
}

/**
 * Extracts a high-quality JPEG poster frame from a video at a specified timestamp.
 */
export function extractVideoPoster(filePath, outputPath, timeSec = 1.0) {
  return new Promise((resolve, reject) => {
    const binary = getFFmpegBinary();
    const args = [
      '-y',
      '-ss',
      String(Math.max(0, timeSec)),
      '-i',
      filePath,
      '-vframes',
      '1',
      '-q:v',
      '2',
      outputPath,
    ];
    const proc = spawn(binary, args);
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error(`Failed to extract poster frame, exit code: ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

/**
 * Extracts multiple non-black candidate frames across the video for the Thumbnail Gallery.
 */
export async function extractThumbnailCandidates(
  filePath,
  outputDir,
  count = 8
) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const meta = await probeVideo(filePath);
  const dur = meta.duration || 60;

  // Space frames evenly between 6% and 92% of duration to avoid opening/ending black slides
  const startSec = dur * 0.06;
  const endSec = dur * 0.92;
  const step = (endSec - startSec) / Math.max(1, count - 1);

  const candidates = [];
  for (let i = 0; i < count; i++) {
    const timeSec = Math.round((startSec + i * step) * 10) / 10;
    const outPath = path.join(
      outputDir,
      `frame_${i + 1}_${Math.round(timeSec)}s.jpg`
    );
    try {
      await extractVideoPoster(filePath, outPath, timeSec);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
        candidates.push({
          index: i + 1,
          timeSec,
          filePath: outPath,
          fileName: path.basename(outPath),
          width: meta.width,
          height: meta.height,
        });
      }
    } catch (e) {
      console.warn(`Frame ${i} extraction skipped:`, e.message);
    }
  }
  return candidates;
}
