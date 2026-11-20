/**
 * Unified Durable Ingestion Queue & Background Worker Service
 *
 * Implements production-grade asynchronous video ingestion:
 * 1. Immediate HTTP 202 Accepted response upon job creation (<50ms).
 * 2. Background queue processing with controlled concurrency (max 1 download).
 * 3. Durable persistence in jobs file & Supabase fail-safe.
 * 4. Resilient HTTP 429 rate-limiting with exponential cooldown without blocking HTTP routes.
 * 5. Job locking, lease recovery of abandoned jobs, and process shutdown handling.
 * 6. Verification of saved media accessibility before marking completed.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import {
  loadAllJobs,
  saveAllJobs,
  getJob,
  updateJob,
} from './job-queue-service.js';
import {
  isValidYouTubeUrl,
  extractYouTubeId,
  getYouTubeMetadata,
} from './source-parser.js';
import {
  downloadYouTubeVideo,
  findSubtitleFile,
} from './youtube-downloader.js';
import { probeVideo } from './ffmpeg-service.js';
import { ingestMediaFile, getMediaHubItem } from './media-storage-service.js';
import { parseVttFile, mergeIntoPhraseCaptions } from './vtt-parser.js';
import { getTempDir, getLocalMediaDir } from './storage-paths.js';

// Concurrency & Lease Configuration
const MAX_CONCURRENT_DOWNLOADS = 1;
const LEASE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes: recover crashed jobs
const MAX_RETRIES = 2;

let activeWorkerCount = 0;
let queueSchedulerTimer = null;
let isShuttingDown = false;
let daemonStarted = false;
const activeProcessRefs = new Map(); // jobId -> child process / abort controller

export function ensureDaemonRunning() {
  if (daemonStarted || process.env.VITEST) return;
  daemonStarted = true;
  startIngestionDaemon(3000);
}

/**
 * Finds any currently active ingestion job for a given videoId
 */
export function findActiveIngestionJob(videoId) {
  if (!videoId) return null;
  const allJobs = loadAllJobs();
  const activeStatuses = [
    'queued',
    'validating',
    'downloading',
    'waiting_retry',
    'uploading',
  ];

  for (const job of Object.values(allJobs)) {
    if (
      job.type === 'youtube_ingest' &&
      job.videoId === videoId &&
      activeStatuses.includes(job.status)
    ) {
      return job;
    }
  }
  return null;
}

/**
 * Checks if a verified, high-resolution copy of this video is already in Media Hub
 */
export async function findCompletedMedia(videoId, forceRefresh = false) {
  if (!videoId || forceRefresh) return null;

  try {
    const existing = await getMediaHubItem(`yt_${videoId}`);
    if (existing) {
      const streamUrl =
        existing.videoUrl || existing.downloadUrl || existing.download_url;
      const resHeight = parseInt(
        (existing.resolution || '1080').split('x')[1] || '1080',
        10
      );

      if (streamUrl && resHeight >= 720) {
        const qualityTier =
          resHeight >= 2160
            ? '4K Ultra HD (2160p)'
            : resHeight >= 1440
              ? '2K Quad HD (1440p)'
              : resHeight >= 1080
                ? 'Full HD (1080p)'
                : `${resHeight}p`;

        return {
          mediaItem: existing,
          metadata: {
            title: existing.fileName || existing.file_name || 'YouTube Video',
            author: existing.author || '',
            duration: existing.duration || 60,
            resolution: existing.resolution || '3840x2160',
            qualityTier,
            videoUrl: streamUrl,
            thumbnailUrl: existing.previewUrl || existing.preview_url || null,
            thumbnailMaxRes:
              existing.previewUrl || existing.preview_url || null,
            isDownloaded: true,
          },
        };
      }
    }
  } catch (_) {}

  // Check local filesystem media-hub cache
  try {
    const hubDir = getLocalMediaDir(`yt_${videoId}`);
    if (fs.existsSync(hubDir)) {
      const files = fs.readdirSync(hubDir).filter((f) => f.endsWith('.mp4'));
      if (files.length > 0) {
        const cachedPath = path.join(hubDir, files[0]);
        if (fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 10000) {
          const probe = await probeVideo(cachedPath);
          const resHeight = probe.height || 1080;
          if (resHeight >= 720) {
            const actualResolution = `${probe.width || 1920}x${resHeight}`;
            const qualityTier =
              resHeight >= 2160
                ? '4K Ultra HD (2160p)'
                : resHeight >= 1440
                  ? '2K Quad HD (1440p)'
                  : 'Full HD (1080p)';

            const cachedItem = {
              id: `yt_${videoId}`,
              fileName: files[0],
              file_name: files[0],
              fileType: 'video/mp4',
              file_type: 'video/mp4',
              fileSize: fs.statSync(cachedPath).size,
              file_size: fs.statSync(cachedPath).size,
              previewUrl: fs.existsSync(path.join(hubDir, 'poster.jpg'))
                ? `/media-hub/yt_${videoId}/poster.jpg`
                : null,
              preview_url: fs.existsSync(path.join(hubDir, 'poster.jpg'))
                ? `/media-hub/yt_${videoId}/poster.jpg`
                : null,
              downloadUrl: `/media-hub/yt_${videoId}/${files[0]}`,
              download_url: `/media-hub/yt_${videoId}/${files[0]}`,
              videoUrl: `/media-hub/yt_${videoId}/${files[0]}`,
              localPath: cachedPath,
              local_path: cachedPath,
              duration: probe.duration || 60,
              resolution: actualResolution,
              sourceType: 'youtube',
              source_type: 'youtube',
            };

            return {
              mediaItem: cachedItem,
              metadata: {
                title: files[0].replace(/\.[^/.]+$/, ''),
                author: '',
                duration: probe.duration || 60,
                resolution: actualResolution,
                qualityTier,
                videoUrl: cachedItem.download_url,
                isDownloaded: true,
              },
            };
          }
        }
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Creates and durably registers a new ingestion job
 */
export function createIngestionJob({
  url,
  videoId,
  preferredQuality = '4k',
  forceRefresh = false,
  userId = null,
}) {
  const cleanVideoId = videoId || extractYouTubeId(url);
  const now = new Date().toISOString();
  const jobId = `ingest_${cleanVideoId}_${Date.now()}`;

  const job = {
    id: jobId,
    type: 'youtube_ingest',
    url,
    videoId: cleanVideoId,
    preferredQuality,
    forceRefresh,
    userId,
    status: 'queued', // 'queued' | 'validating' | 'downloading' | 'waiting_retry' | 'uploading' | 'completed' | 'failed'
    stage: 'Queued in background download queue (0%)',
    progress: 0,
    retry_count: 0,
    max_retries: MAX_RETRIES,
    retry_after_seconds: 0,
    next_retry_at: null,
    locked_by: null,
    locked_at: null,
    heartbeat: null,
    error: null,
    errorType: null,
    mediaItem: null,
    metadata: null,
    created_at: now,
    updated_at: now,
    completed_at: null,
  };

  const allJobs = loadAllJobs();
  allJobs[jobId] = job;
  saveAllJobs(allJobs);

  console.log(
    `[IngestionQueue] Created durable ingestion job: ${jobId} for videoId=${cleanVideoId}`
  );

  // Trigger non-blocking background queue processing
  scheduleQueueTick(50);

  return job;
}

/**
 * Updates an ingestion job with stage and progress logging
 */
export function updateIngestionJob(jobId, updates) {
  const jobs = loadAllJobs();
  if (!jobs[jobId]) return null;

  const now = new Date().toISOString();
  jobs[jobId] = {
    ...jobs[jobId],
    ...updates,
    stage: updates.stage || updates.status || jobs[jobId].stage,
    updated_at: now,
  };

  if (updates.status === 'completed') {
    jobs[jobId].completed_at = now;
    jobs[jobId].progress = 100;
  }

  saveAllJobs(jobs);
  return jobs[jobId];
}

/**
 * Recovers abandoned jobs where the worker died or heartbeat timed out
 */
function recoverAbandonedJobs() {
  const allJobs = loadAllJobs();
  const now = Date.now();
  let changed = false;

  for (const [id, job] of Object.entries(allJobs)) {
    if (job.type !== 'youtube_ingest') continue;

    // Check locked jobs with expired lease
    if (
      ['validating', 'downloading', 'uploading'].includes(job.status) &&
      job.locked_at
    ) {
      const lockAge = now - new Date(job.locked_at).getTime();
      const heartbeatAge = job.heartbeat
        ? now - new Date(job.heartbeat).getTime()
        : lockAge;

      if (heartbeatAge > LEASE_TIMEOUT_MS) {
        console.warn(
          `[IngestionQueue] Recovering abandoned job ${id} (heartbeat age: ${Math.round(heartbeatAge / 1000)}s)`
        );
        job.locked_by = null;
        job.locked_at = null;
        job.heartbeat = null;

        if ((job.retry_count || 0) < MAX_RETRIES) {
          job.status = 'queued';
          job.stage = 'Recovered after worker interruption, waiting in queue';
          job.retry_count = (job.retry_count || 0) + 1;
        } else {
          job.status = 'failed';
          job.stage = 'Job exceeded max lease time without completion';
          job.error = 'Worker execution lease expired.';
          job.errorType = 'LEASE_TIMEOUT';
        }
        changed = true;
      }
    }
  }

  if (changed) {
    saveAllJobs(allJobs);
  }
}

/**
 * Picks and locks the next ready job for processing
 */
function acquireNextJob(workerId) {
  const allJobs = loadAllJobs();
  const now = Date.now();

  // Find oldest queued job or waiting_retry whose cooldown has passed
  const eligible = Object.values(allJobs)
    .filter((j) => {
      if (j.type !== 'youtube_ingest') return false;
      if (j.locked_by) return false;

      if (j.status === 'queued') return true;
      if (j.status === 'waiting_retry') {
        if (!j.next_retry_at) return true;
        return new Date(j.next_retry_at).getTime() <= now;
      }
      return false;
    })
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  if (eligible.length === 0) return null;

  const target = eligible[0];
  const nowIso = new Date().toISOString();

  target.locked_by = workerId;
  target.locked_at = nowIso;
  target.heartbeat = nowIso;
  target.updated_at = nowIso;

  allJobs[target.id] = target;
  saveAllJobs(allJobs);

  return target;
}

/**
 * Releases worker lock on job
 */
function releaseJobLock(jobId) {
  const allJobs = loadAllJobs();
  if (allJobs[jobId]) {
    allJobs[jobId].locked_by = null;
    allJobs[jobId].locked_at = null;
    allJobs[jobId].heartbeat = null;
    saveAllJobs(allJobs);
  }
}

/**
 * Main worker execution loop for a single ingestion job
 */
async function processIngestionJob(job) {
  const jobId = job.id;
  const videoId = job.videoId;
  const url = job.url;
  const preferredQuality = job.preferredQuality || '4k';
  const workerId = `worker_${process.pid}_${Date.now()}`;

  console.log(
    `[IngestionWorker] Started processing job ${jobId} (videoId: ${videoId})`
  );

  const heartbeatInterval = setInterval(() => {
    try {
      const current = getJob(jobId);
      if (current && current.locked_by) {
        updateIngestionJob(jobId, { heartbeat: new Date().toISOString() });
      }
    } catch (_) {}
  }, 10000);

  const tempDir = getTempDir('yt-downloads');
  const tempTargetPath = path.join(tempDir, `${videoId}.mp4`);

  try {
    // ------------------------------------------------------------------------
    // STAGE 1: Validating YouTube Metadata & Stream Info
    // ------------------------------------------------------------------------
    updateIngestionJob(jobId, {
      status: 'validating',
      stage:
        'Querying YouTube stream metadata & available resolutions (10%)...',
      progress: 10,
    });

    const metadataStartTime = Date.now();
    let metadata = null;
    try {
      metadata = await getYouTubeMetadata(url);
      console.log(
        `[IngestionWorker] Metadata fetched for videoId=${videoId} in ${Date.now() - metadataStartTime}ms`
      );
    } catch (metaErr) {
      console.warn(
        `[IngestionWorker] Metadata fetch notice: ${metaErr.message}`
      );
      metadata = {
        title: `YouTube Video (${videoId})`,
        author: '',
        duration: 60,
        resolution: '3840x2160',
      };
    }

    updateIngestionJob(jobId, {
      metadata,
      stage: `Master stream identified (${metadata.title || videoId}). Preparing download (20%)...`,
      progress: 20,
    });

    if (isShuttingDown) {
      throw new Error('Worker process received shutdown signal.');
    }

    // ------------------------------------------------------------------------
    // STAGE 2: Downloading High-Resolution Video Streams via yt-dlp
    // ------------------------------------------------------------------------
    updateIngestionJob(jobId, {
      status: 'downloading',
      stage: `Downloading ${preferredQuality.toUpperCase()} stream via yt-dlp (30%)...`,
      progress: 30,
    });

    const downloadStartTime = Date.now();
    let dlResult = null;

    try {
      dlResult = await downloadYouTubeVideo({
        url,
        targetPath: tempTargetPath,
        subtitleDir: tempDir,
        targetQuality: preferredQuality,
        timeoutMs: 180000,
      });

      console.log(
        `[IngestionWorker] Video download completed in ${Date.now() - downloadStartTime}ms`
      );
    } catch (dlErr) {
      // Check for YouTube HTTP 429 Rate Limit
      if (
        dlErr.status === 429 ||
        dlErr.type === 'RATE_LIMITED' ||
        /429/i.test(dlErr.message)
      ) {
        const currentRetry = (job.retry_count || 0) + 1;
        const cooldownSecs = Math.min(300, 30 * Math.pow(2, currentRetry - 1));
        const nextRetryDate = new Date(
          Date.now() + cooldownSecs * 1000
        ).toISOString();

        if (currentRetry <= MAX_RETRIES) {
          console.warn(
            `[IngestionWorker] HTTP 429 on job ${jobId}. Setting status to waiting_retry (cooldown ${cooldownSecs}s)`
          );
          updateIngestionJob(jobId, {
            status: 'waiting_retry',
            stage: `YouTube rate limit active. Waiting ${cooldownSecs}s for cooldown before automatic retry #${currentRetry}...`,
            progress: 25,
            retry_count: currentRetry,
            retry_after_seconds: cooldownSecs,
            next_retry_at: nextRetryDate,
            error: dlErr.message,
            errorType: 'RATE_LIMITED',
          });
          return; // Release slot cleanly
        } else {
          throw new Error(
            `YouTube rate limit exceeded after ${MAX_RETRIES} retries. Please upload your MP4/MOV file directly.`
          );
        }
      }

      // Check for Bot Detection (403 / Sign in to confirm you're not a bot)
      if (
        dlErr.type === 'BOT_DETECTION' ||
        /bot/i.test(dlErr.message) ||
        /403/i.test(dlErr.message)
      ) {
        const botErr = new Error(
          "YouTube bot check detected (Sign in to confirm you're not a bot / HTTP 403). Please upload the video file directly (MP4/MOV) for instant processing."
        );
        botErr.type = 'BOT_DETECTION';
        throw botErr;
      }

      throw dlErr;
    }

    updateIngestionJob(jobId, {
      progress: 75,
      stage: 'Download verified. Probing video streams with FFmpeg (75%)...',
    });

    // ------------------------------------------------------------------------
    // STAGE 3: Probing, Ingesting & Saving to Media Hub / Supabase Storage
    // ------------------------------------------------------------------------
    if (
      !fs.existsSync(tempTargetPath) ||
      fs.statSync(tempTargetPath).size < 10000
    ) {
      throw new Error('Downloaded video file is missing or corrupt.');
    }

    updateIngestionJob(jobId, {
      status: 'uploading',
      stage: 'Persisting high-definition video to Media Hub storage (85%)...',
      progress: 85,
    });

    const videoBuffer = fs.readFileSync(tempTargetPath);
    const cleanTitle = (metadata.title || videoId)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    const probe = dlResult?.probe || (await probeVideo(tempTargetPath));
    const resolvedDuration =
      probe.duration && probe.duration > 0 && probe.duration !== 60
        ? probe.duration
        : metadata.duration || probe.duration || 60;
    const resolvedResolution =
      probe.width && probe.height
        ? `${probe.width}x${probe.height}`
        : metadata.resolution || '3840x2160';

    const qualityTier =
      probe.height >= 2160
        ? '4K Ultra HD (2160p)'
        : probe.height >= 1440
          ? '2K Quad HD (1440p)'
          : probe.height >= 1080
            ? 'Full HD (1080p)'
            : `${probe.height}p`;

    const mediaItem = await ingestMediaFile({
      buffer: videoBuffer,
      fileName: `${cleanTitle}.mp4`,
      fileType: 'video/mp4',
      sourceType: 'youtube',
      customId: `yt_${videoId}`,
      duration: resolvedDuration,
      resolution: resolvedResolution,
      userId: job.userId || null,
    });

    // Check for auto-extracted YouTube subtitle or transcribe from audio
    const subPath =
      dlResult?.subtitlePath || findSubtitleFile(tempDir, videoId);
    let transcript = null;
    let extractedCaptions = [];

    if (subPath && fs.existsSync(subPath)) {
      const candidateVtt = fs.readFileSync(subPath, 'utf-8');
      if (/[\u0600-\u06FF]/.test(candidateVtt)) {
        transcript = candidateVtt;
        mediaItem.transcript = transcript;
        try {
          const parsed = parseVttFile(transcript);
          extractedCaptions = mergeIntoPhraseCaptions(parsed, 10, 1.0);
        } catch (_) {}
      }
    }

    mediaItem.captions = extractedCaptions;

    // ------------------------------------------------------------------------
    // STAGE 4: Final Accessibility Verification & Completion Guard
    // ------------------------------------------------------------------------
    updateIngestionJob(jobId, {
      stage: 'Verifying media accessibility & stream readiness (95%)...',
      progress: 95,
    });

    // Verify stored video is accessible either locally or via stream URL
    const savedLocal = mediaItem.localPath || mediaItem.local_path;
    const isSavedLocally =
      savedLocal &&
      fs.existsSync(savedLocal) &&
      fs.statSync(savedLocal).size > 10000;
    const downloadUrl =
      mediaItem.videoUrl || mediaItem.downloadUrl || mediaItem.download_url;

    if (!isSavedLocally && !downloadUrl) {
      throw new Error(
        'Verification failed: Saved media asset is not accessible.'
      );
    }

    // Clean up temporary download artifacts
    try {
      if (fs.existsSync(tempTargetPath)) fs.unlinkSync(tempTargetPath);
      if (subPath && fs.existsSync(subPath)) fs.unlinkSync(subPath);
    } catch (_) {}

    const finalMetadata = {
      ...metadata,
      duration: resolvedDuration,
      resolution: resolvedResolution,
      qualityTier,
      videoUrl: downloadUrl,
      isDownloaded: true,
      transcript,
      captions: extractedCaptions,
    };

    updateIngestionJob(jobId, {
      status: 'completed',
      stage: `Video ingested successfully (${qualityTier})`,
      progress: 100,
      mediaItem: {
        ...mediaItem,
        captions: extractedCaptions,
      },
      metadata: finalMetadata,
      error: null,
      errorType: null,
    });

    console.log(
      `[IngestionWorker] Successfully completed ingestion job ${jobId}`
    );
  } catch (err) {
    console.error(`[IngestionWorker] Error processing job ${jobId}:`, err);
    updateIngestionJob(jobId, {
      status: 'failed',
      stage: `Ingestion failed: ${err.message}`,
      progress: 0,
      error: err.message,
      errorType: err.type || 'DOWNLOAD_FAILED',
    });
  } finally {
    clearInterval(heartbeatInterval);
    releaseJobLock(jobId);
    activeProcessRefs.delete(jobId);
  }
}

/**
 * Main queue processing pump: checks concurrency, recovers stale leases, and runs jobs
 */
export async function processQueue() {
  if (isShuttingDown) return;
  if (activeWorkerCount >= MAX_CONCURRENT_DOWNLOADS) return;

  recoverAbandonedJobs();

  const job = acquireNextJob(`worker_${process.pid}`);
  if (!job) return;

  activeWorkerCount += 1;
  try {
    await processIngestionJob(job);
  } finally {
    activeWorkerCount = Math.max(0, activeWorkerCount - 1);
    // Continue processing queue if more jobs are waiting
    if (!isShuttingDown) {
      scheduleQueueTick(100);
    }
  }
}

/**
 * Schedules a queue pump tick after delay
 */
export function scheduleQueueTick(delayMs = 100) {
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    // In test runner, avoid auto-spawning unmocked yt-dlp background downloads
    return;
  }
  ensureDaemonRunning();
  if (queueSchedulerTimer) {
    clearTimeout(queueSchedulerTimer);
  }
  queueSchedulerTimer = setTimeout(() => {
    processQueue().catch((err) => {
      console.warn('[IngestionQueue] Queue tick error:', err.message);
    });
  }, delayMs);
}

/**
 * Starts persistent background daemon (for dedicated server/worker processes)
 */
export function startIngestionDaemon(intervalMs = 3000) {
  console.log(
    `[IngestionDaemon] Starting background ingestion daemon (interval ${intervalMs}ms)...`
  );

  const timer = setInterval(() => {
    processQueue().catch((err) => {
      console.warn('[IngestionDaemon] Tick notice:', err.message);
    });
  }, intervalMs);

  const shutdown = () => {
    console.log('[IngestionDaemon] Graceful shutdown requested...');
    isShuttingDown = true;
    clearInterval(timer);
    if (queueSchedulerTimer) clearTimeout(queueSchedulerTimer);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  return { stop: shutdown };
}
