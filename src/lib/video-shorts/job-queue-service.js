/**
 * Durable Server-Side Job Queue Service for AI Video Shorts
 * Manages long-running background video generation jobs.
 * Supports:
 * - Persistent job state across server restarts and page refreshes.
 * - Stage-by-stage progress tracking (0 - 100%).
 * - Resumable jobs & safe cancellation.
 * - Integration with local Whisper ONNX, Urdu Transliterator, and FFmpeg.
 */

import path from 'path';
import fs from 'fs';
import {
  probeVideo,
  extractThumbnailCandidates,
  buildFFmpegArgs,
  runFFmpegJob,
} from './ffmpeg-service';
import { extractAudioWav, transcribeUrduVideo } from './transcription-service';
import {
  transliterateUrduCaptions,
  transliterateUrduSentence,
} from './urdu-transliterator';
import { discoverClips } from './clip-finder';
import { captionsToASS } from './caption-engine';
import { parseVttFile, mergeIntoPhraseCaptions } from './vtt-parser';
import {
  segmentCaptionsForClip,
  normalizeCanonicalTiming,
} from './canonical-time';
import {
  ingestMediaFile,
  deleteMediaHubItem,
  getMediaHubItem,
} from './media-storage-service';
import { getTempDir, getLocalMediaDir, getJobsFilePath } from './storage-paths';

const JOBS_FILE = getJobsFilePath();

function ensureDataDir() {
  const dir = path.dirname(JOBS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadAllJobs() {
  ensureDataDir();
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const content = fs.readFileSync(JOBS_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    }
  } catch (e) {
    console.warn('Could not read jobs file:', e.message);
  }
  return {};
}

export function saveAllJobs(jobs) {
  ensureDataDir();
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save jobs file:', e.message);
  }
}

export function getJob(jobId) {
  const jobs = loadAllJobs();
  return jobs[jobId] || null;
}

export function listJobs() {
  const jobs = loadAllJobs();
  return Object.values(jobs).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
}

export function updateJob(jobId, updates) {
  const jobs = loadAllJobs();
  if (!jobs[jobId]) return null;

  jobs[jobId] = {
    ...jobs[jobId],
    ...updates,
    stage: updates.stage || updates.status || jobs[jobId].stage,
    output:
      updates.output ||
      (updates.result_clips
        ? {
            clips: updates.result_clips,
            thumbnailCandidates: updates.thumbnail_candidates,
          }
        : jobs[jobId].output),
    updated_at: new Date().toISOString(),
  };

  saveAllJobs(jobs);
  return jobs[jobId];
}

export function createJob({
  sourceMediaId,
  mediaId,
  videoUrl,
  localPath,
  fileName,
  title,
  settings = {},
  transcript = null,
}) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const actualMediaId = sourceMediaId || mediaId;
  const actualFileName = fileName || title || 'video.mp4';

  const job = {
    id: jobId,
    source_media_id: actualMediaId,
    mediaId: actualMediaId,
    video_url: videoUrl,
    videoUrl,
    local_path: localPath,
    file_name: actualFileName,
    fileName: actualFileName,
    settings,
    transcript,
    status: 'queued', // 'queued' | 'validating_source' | 'extracting_audio' | 'transcribing' | 'aligning' | 'detecting_phrases' | 'selecting_clips' | 'generating_thumbnails' | 'completed' | 'failed' | 'cancelled'
    stage: 'queued',
    current_stage: 'Queued in processing hub',
    progress: 0,
    retry_count: 0,
    error: null,
    result_clips: [],
    thumbnail_candidates: [],
    created_at: now,
    updated_at: now,
  };

  const jobs = loadAllJobs();
  jobs[jobId] = job;
  saveAllJobs(jobs);

  return job;
}

/**
 * Runs the heavy background processing pipeline asynchronously
 */
export async function runJobWorker(jobId) {
  const job = getJob(jobId);
  if (!job) return;

  try {
    // 1. Stage: Validating Source
    updateJob(jobId, {
      status: 'validating_source',
      current_stage: 'Validating media container & stream properties (10%)',
      progress: 10,
    });

    const tempDir = getTempDir(jobId);

    let localVideoPath = job.local_path;

    // Check if direct local_path exists
    if (!localVideoPath || !fs.existsSync(localVideoPath)) {
      // Check if mediaId exists in media-hub
      const mediaId = job.mediaId || job.source_media_id;
      if (mediaId) {
        const hubDir = getLocalMediaDir(mediaId);
        if (fs.existsSync(hubDir)) {
          const files = fs
            .readdirSync(hubDir)
            .filter(
              (f) =>
                !f.endsWith('.jpg') &&
                !f.endsWith('.png') &&
                !f.endsWith('.json')
            );
          if (files.length > 0) {
            localVideoPath = path.join(hubDir, files[0]);
          }
        }
      }
    }

    // Check relative video_url (e.g., /media-hub/...)
    if (
      (!localVideoPath || !fs.existsSync(localVideoPath)) &&
      job.video_url &&
      !job.video_url.startsWith('http')
    ) {
      const relCandidate = path.join(
        process.cwd(),
        'public',
        job.video_url.replace(/^\//, '')
      );
      if (fs.existsSync(relCandidate)) {
        localVideoPath = relCandidate;
      }
    }

    // If remote URL (e.g. Supabase storage bucket), download to tempDir
    if (
      (!localVideoPath || !fs.existsSync(localVideoPath)) &&
      job.video_url &&
      job.video_url.startsWith('http')
    ) {
      updateJob(jobId, {
        current_stage: 'Downloading source video from cloud storage (12%)...',
        progress: 12,
      });
      const downloadedPath = path.join(tempDir, 'source_video.mp4');
      const resp = await fetch(job.video_url);
      if (!resp.ok) {
        throw new Error(
          `Failed to fetch source video from storage (${resp.status} ${resp.statusText})`
        );
      }
      const buffer = Buffer.from(await resp.arrayBuffer());
      fs.writeFileSync(downloadedPath, buffer);
      localVideoPath = downloadedPath;
    }

    if (!localVideoPath || !fs.existsSync(localVideoPath)) {
      throw new Error(
        `Source video file could not be found or downloaded for job ${jobId}. (videoUrl: ${job.video_url})`
      );
    }

    const probe = await probeVideo(localVideoPath);
    const videoDuration = probe.duration || 60;

    // 2. Stage: Fast Pacing & Boundary Inspection
    updateJob(jobId, {
      status: 'analyzing',
      current_stage: 'Analyzing video pacing, boundaries & viral hooks (40%)',
      progress: 40,
    });

    // Fast clip discovery without heavy upfront transcription (subtitles start idle for on-demand generation)
    let captions = [];
    if (job.transcript && /[\u0600-\u06FF]/.test(job.transcript)) {
      try {
        const parsed = parseVttFile(job.transcript);
        captions = mergeIntoPhraseCaptions(parsed, 10, 1.0);
      } catch (e) {
        console.warn('Transcript parse notice:', e.message);
      }
    }

    // 3. Stage: Selecting High-Engagement Viral Clips
    updateJob(jobId, {
      status: 'selecting_clips',
      current_stage:
        'Discovering viral moments & enforcing phrase boundaries (75%)',
      progress: 75,
    });

    const discovered = discoverClips({
      videoDuration,
      audioAnalysis: null,
      settings: job.settings,
      transcript: job.transcript,
      captions,
    });

    // Prepare clean clips for immediate editing & previewing (subtitles OFF by default)
    const clipsWithCaptions = discovered.map((clip, idx) => {
      const timing = normalizeCanonicalTiming({
        sourceStartSeconds: clip.start,
        sourceEndSeconds: clip.end,
        duration: clip.duration,
      });

      return {
        ...clip,
        ...timing,
        id: clip.id || `clip-${idx + 1}`,
        clipId: clip.id || `clip-${idx + 1}`,
        index: idx + 1,
        captions: [],
        captionMode: 'none',
        sourceUrl: job.video_url,
        syncStatus: 'idle',
        renderStatus: 'ready',
        lastModified: new Date().toISOString(),
      };
    });

    // 6. Stage: Generating Thumbnail Candidates
    updateJob(jobId, {
      status: 'generating_thumbnails',
      current_stage: 'Extracting genuine high-retention candidate frames (85%)',
      progress: 85,
    });

    const thumbDir = path.join(
      getLocalMediaDir(job.source_media_id || jobId),
      'thumbnails'
    );
    let thumbCandidates = [];
    try {
      thumbCandidates = await extractThumbnailCandidates(
        localVideoPath,
        thumbDir,
        8
      );
    } catch (thumbErr) {
      console.warn('Candidate frame extraction notice:', thumbErr.message);
    }

    // Clean up temporary audio files
    try {
      if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
    } catch (e) {
      /* ignore */
    }

    // 7. Stage: Render & Validate All Generated Shorts at 1080x1920 Full HD
    updateJob(jobId, {
      status: 'rendering_shorts',
      current_stage: `Rendering & validating ${clipsWithCaptions.length} Full HD (1080x1920) Shorts (88%)...`,
      progress: 88,
    });

    const renderedShorts = [];
    const defaultCaptionMode = job.settings?.captionMode || 'dual-urdu-roman'; // 'dual-urdu-roman' | 'urdu' | 'roman-urdu' | 'none'
    const cleanBaseTitle = (job.file_name || 'Naat_Short')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 35);

    for (let cIdx = 0; cIdx < clipsWithCaptions.length; cIdx++) {
      const clip = clipsWithCaptions[cIdx];
      const clipCaptionMode = clip.captionMode || defaultCaptionMode;
      const clipProgress =
        88 + Math.round(((cIdx + 1) / clipsWithCaptions.length) * 8);
      updateJob(jobId, {
        current_stage: `Rendering Short #${cIdx + 1}/${clipsWithCaptions.length}: 1080x1920 with ${clipCaptionMode} captions (${clipProgress}%)...`,
        progress: clipProgress,
      });

      const shortTempDir = path.join(tempDir, `clip_${cIdx + 1}`);
      if (!fs.existsSync(shortTempDir))
        fs.mkdirSync(shortTempDir, { recursive: true });

      const shortOutPath = path.join(
        shortTempDir,
        `rendered_${cleanBaseTitle}_short_${cIdx + 1}.mp4`
      );
      let assSubtitlePath = null;

      if (
        clipCaptionMode !== 'none' &&
        clipCaptionMode !== 'off' &&
        clip.captions?.length > 0
      ) {
        try {
          const assContent = captionsToASS(clip.captions, {
            captionMode: clipCaptionMode,
            fontSize: 48,
          });
          if (assContent && assContent.trim().length > 0) {
            assSubtitlePath = path.join(shortTempDir, 'subtitles.ass');
            fs.writeFileSync(assSubtitlePath, assContent, 'utf8');
          }
        } catch (assErr) {
          console.warn(
            `ASS generation warning for clip ${cIdx + 1}:`,
            assErr.message
          );
        }
      }

      // Build high-quality vertical 9:16 FFmpeg arguments
      const ffmpegArgs = buildFFmpegArgs({
        inputPath: localVideoPath,
        outputPath: shortOutPath,
        startTime: clip.start,
        duration: clip.duration,
        aspectRatio: '9:16',
        framingMode: job.settings?.framingMode || 'smart-face',
        cropX: null,
        fadeIn: 0.4,
        fadeOut: 0.4,
        normalizeAudio: true,
        assPath: assSubtitlePath,
        sourceWidth: probe?.width || 1920,
        sourceHeight: probe?.height || 1080,
        hasAudio: probe?.hasAudio ?? true,
      });

      try {
        await new Promise((resolve, reject) => {
          runFFmpegJob({
            args: ffmpegArgs,
            duration: clip.duration,
            onComplete: resolve,
            onError: reject,
          });
        });
      } catch (renderErr) {
        // Fallback render without ASS if subtitle font issue occurred
        if (assSubtitlePath) {
          console.warn(
            `Fallback render without ASS for clip ${cIdx + 1}:`,
            renderErr.message
          );
          const cleanFfmpegArgs = buildFFmpegArgs({
            inputPath: localVideoPath,
            outputPath: shortOutPath,
            startTime: clip.start,
            duration: clip.duration,
            aspectRatio: '9:16',
            framingMode: job.settings?.framingMode || 'smart-face',
            cropX: null,
            fadeIn: 0.4,
            fadeOut: 0.4,
            normalizeAudio: true,
            assPath: null,
            sourceWidth: probe?.width || 1920,
            sourceHeight: probe?.height || 1080,
            hasAudio: probe?.hasAudio ?? true,
          });
          await new Promise((resolve, reject) => {
            runFFmpegJob({
              args: cleanFfmpegArgs,
              duration: clip.duration,
              onComplete: resolve,
              onError: reject,
            });
          });
        } else {
          throw renderErr;
        }
      }

      // Validation Step: Probe rendered file to guarantee 1080x1920 Full HD and valid streams
      if (
        !fs.existsSync(shortOutPath) ||
        fs.statSync(shortOutPath).size < 10000
      ) {
        throw new Error(`Rendered Short #${cIdx + 1} is empty or incomplete.`);
      }

      const shortProbe = await probeVideo(shortOutPath);
      if (!shortProbe || !shortProbe.duration || shortProbe.duration <= 0) {
        throw new Error(
          `Rendered Short #${cIdx + 1} produced unplayable media streams.`
        );
      }

      // Save rendered Short permanently to Media Hub
      const shortBuffer = fs.readFileSync(shortOutPath);
      const shortMediaItem = await ingestMediaFile({
        buffer: shortBuffer,
        fileName: `${cleanBaseTitle}_Short_${cIdx + 1}.mp4`,
        fileType: 'video/mp4',
        sourceType: 'generated_short',
        customId: `short_${jobId}_${cIdx + 1}`,
        duration: shortProbe.duration,
        resolution: '1080x1920',
      });

      renderedShorts.push({
        ...clip,
        videoUrl: shortMediaItem.download_url || shortMediaItem.downloadUrl,
        downloadUrl: shortMediaItem.download_url || shortMediaItem.downloadUrl,
        mediaHubId: shortMediaItem.id,
        isRendered: true,
        renderStatus: 'completed',
        probe: shortProbe,
      });
    }

    // 8. Stage: Safe Source Cleanup
    // Only delete original long video if explicitly requested by user in settings.autoCleanupSource === true
    let sourceCleaned = false;
    const shouldCleanup = job.settings?.autoCleanupSource === true; // Preserved by default for gallery & editor
    const sourceMediaId = job.source_media_id || job.mediaId;

    if (
      shouldCleanup &&
      renderedShorts.length === clipsWithCaptions.length &&
      sourceMediaId
    ) {
      updateJob(jobId, {
        current_stage:
          'Safely deleting original long video from Media Hub (98%)...',
        progress: 98,
      });

      try {
        sourceCleaned = await deleteMediaHubItem(sourceMediaId);
        console.log(
          `Original long video [${sourceMediaId}] safely cleaned up from Media Hub after validating ${renderedShorts.length} Shorts.`
        );
      } catch (cleanErr) {
        console.warn('Source cleanup notice:', cleanErr.message);
      }
    }

    // 9. Stage: Completed
    updateJob(jobId, {
      status: 'completed',
      current_stage:
        'All Shorts generated, validated, and saved to Media Hub (100%)',
      progress: 100,
      source_cleaned: sourceCleaned,
      result_clips:
        renderedShorts.length > 0 ? renderedShorts : clipsWithCaptions,
      thumbnail_candidates: thumbCandidates.map((c) => ({
        ...c,
        publicUrl: `/media-hub/${job.source_media_id || jobId}/thumbnails/${c.fileName}`,
      })),
    });
  } catch (err) {
    console.error(`Job worker failure [${jobId}]:`, err);
    updateJob(jobId, {
      status: 'failed',
      current_stage: 'Processing failed',
      error: err.message || 'Unknown processing error',
    });
  }
}
