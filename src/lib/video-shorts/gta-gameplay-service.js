/**
 * GTA Gameplay Shorts Service & Python Worker Bridge
 * Seamlessly manages GTA 6 multimodal event detection and video reframing.
 *
 * Architecture:
 * 1. Checks if the external persistent Python FastAPI worker is reachable (GTA_WORKER_URL).
 * 2. If available, delegates heavy AI/CV processing to the worker.
 * 3. If unavailable (e.g. running on Vercel or local dev without Docker), falls back to
 *    in-engine native JavaScript + FFmpeg processing with 100% feature parity.
 */

import {
  discoverGameplayMoments,
  GTA_EVENT_CATEGORIES,
} from './gta-event-detector';
import { buildFFmpegArgs, runFFmpegJob } from './ffmpeg-service';

const WORKER_BASE_URL = process.env.GTA_WORKER_URL || 'http://127.0.0.1:8000';

/**
 * Checks if external Python FastAPI worker is responsive.
 */
export async function checkWorkerHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${WORKER_BASE_URL}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { available: true, info: data };
    }
  } catch (e) {
    // Expected when worker is not running locally
  }
  return { available: false, info: null };
}

/**
 * Discovers GTA gameplay moments using either Python worker or native JS engine.
 */
export async function analyzeGameplayVideo({
  videoPath,
  videoDuration,
  motionCurve = null,
  audioAnalysis = null,
  sceneCuts = [],
  settings = {},
  videoTitle = 'GTA 6 Gameplay',
}) {
  const workerStatus = await checkWorkerHealth();

  if (workerStatus.available && videoPath) {
    try {
      const res = await fetch(`${WORKER_BASE_URL}/api/v1/analyze-gameplay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_path: videoPath,
          target_count: settings.clipCount || 4,
          min_duration: settings.minDuration || 30,
          max_duration: settings.maxDuration || 60,
          game_title: videoTitle,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.moments && data.moments.length > 0) {
          // Normalize worker output
          return data.moments.map((m, idx) => ({
            id: `gta_clip_${idx + 1}_${Math.round(m.start)}`,
            index: idx + 1,
            title: `Clip ${idx + 1}: ${m.category_name}`,
            startTime: m.start,
            endTime: m.end,
            duration: m.duration,
            peakTime: m.peak,
            score: Math.round(m.score),
            category: m.category,
            categoryName: m.category_name,
            confidence: m.confidence,
            motionScore: m.motion_score,
            audioScore: m.audio_score,
            visualScore: m.visual_score,
            reason: m.reason,
            framingMode: 'action-tracking',
            cropX: m.crop_x,
            viralHookText: m.viral_hook,
            youtubeTitle: m.youtube_title,
            hashtags: [
              '#GTA6',
              '#GrandTheftAuto6',
              '#GTA6Clips',
              '#GamingShorts',
            ],
          }));
        }
      }
    } catch (workerErr) {
      console.warn(
        'Worker call failed, falling back to native engine:',
        workerErr.message
      );
    }
  }

  // Native In-Engine Fallback
  return discoverGameplayMoments({
    videoDuration: videoDuration || 120,
    motionCurve,
    audioSpikes: audioAnalysis?.timeline
      ? audioAnalysis.timeline
          .filter((pt) => pt.rms > audioAnalysis.avgEnergy * 1.8)
          .map((pt) => ({
            time: pt.time,
            peakScore: Math.min(100, Math.round(pt.rms * 100)),
          }))
      : [],
    sceneCuts,
    settings,
    videoTitle,
  });
}

/**
 * Renders a GTA gameplay short with action tracking crop or blurred background.
 */
export async function renderGameplayShort({
  inputVideo,
  outputVideo,
  startTime,
  duration,
  framingMode = 'action-tracking',
  cropX = 50,
  onProgress = null,
}) {
  const workerStatus = await checkWorkerHealth();

  if (workerStatus.available && inputVideo && outputVideo) {
    try {
      const res = await fetch(
        `${WORKER_BASE_URL}/api/v1/render-gameplay-short`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input_video: inputVideo,
            output_video: outputVideo,
            start_time: startTime,
            duration: duration,
            framing_mode: framingMode,
            crop_x: cropX,
          }),
        }
      );

      if (res.ok) {
        return { success: true, outputPath: outputVideo };
      }
    } catch (e) {
      console.warn(
        'Worker render failed, falling back to native FFmpeg:',
        e.message
      );
    }
  }

  // Native FFmpeg execution
  const args = buildFFmpegArgs({
    inputPath: inputVideo,
    outputPath: outputVideo,
    startTime,
    duration,
    aspectRatio: '9:16',
    framingMode,
    cropX,
    normalizeAudio: true,
  });

  return runFFmpegJob({
    args,
    duration,
    onProgress,
  });
}
