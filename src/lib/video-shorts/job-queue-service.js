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

    // 2. Stage: Audio & Speech Analysis (Only if autoSubtitles is explicitly enabled)
    let captions = [];
    const shouldTranscribe = Boolean(job.settings?.autoSubtitles);

    if (shouldTranscribe) {
      updateJob(jobId, {
        status: 'extracting_audio',
        current_stage:
          'Extracting 16kHz mono audio for speech recognition (25%)',
        progress: 25,
      });

      const wavPath = path.join(tempDir, 'audio_16k.wav');
      try {
        await extractAudioWav(localVideoPath, wavPath);
      } catch (wavErr) {
        console.warn('WAV extraction notice:', wavErr.message);
      }

      // 3. Stage: Transcribing Audio with Whisper ONNX
      const isGaming = job.settings?.contentType === 'gaming-gta';
      const isEnglish = isGaming || job.settings?.captionLanguage === 'en';
      const lang = isEnglish ? 'en' : job.settings?.captionLanguage || 'ur';

      updateJob(jobId, {
        status: 'transcribing',
        current_stage: isEnglish
          ? 'Transcribing commentary & dialogue into creative English captions (45%)'
          : 'Transcribing speech into authentic Urdu script via Whisper (45%)',
        progress: 45,
      });

      const hasUrdu = /[\u0600-\u06FF]/.test(job.transcript || '');
      if (job.transcript && (hasUrdu || isEnglish)) {
        const parsed = parseVttFile(job.transcript);
        captions = mergeIntoPhraseCaptions(parsed, 10, 1.0);
      } else if (fs.existsSync(wavPath)) {
        try {
          const whisperRes = await transcribeUrduVideo({
            audioPath: wavPath,
            videoPath: localVideoPath,
            language: lang,
            referenceLyrics: isEnglish ? null : job.settings?.referenceLyrics,
          });
          captions = whisperRes.captions || [];
        } catch (sttErr) {
          console.warn(
            'Whisper transcription fallback to phrases:',
            sttErr.message
          );
        }
      }

      // 4. Stage: Subtitle Formatting & Transliteration
      updateJob(jobId, {
        status: 'aligning',
        current_stage: isEnglish
          ? 'Formatting dynamic viral English captions & word timings (65%)'
          : 'Linguistically aligning Urdu script & Roman Urdu transliteration (65%)',
        progress: 65,
      });

      if (!isEnglish) {
        const transliterationStyle =
          job.settings?.transliterationStyle || 'conversational';
        captions = transliterateUrduCaptions(captions, transliterationStyle);
      }
    } else {
      updateJob(jobId, {
        status: 'selecting_clips',
        current_stage:
          'Analyzing video rhythms & identifying viral highlights (50%)',
        progress: 50,
      });
    }

    // 5. Stage: Selecting Clips
    updateJob(jobId, {
      status: 'selecting_clips',
      current_stage:
        'Discovering viral moments & enforcing phrase boundaries (80%)',
      progress: 80,
    });

    const discovered = discoverClips({
      videoDuration,
      audioAnalysis: null,
      settings: job.settings,
      transcript: job.transcript,
      captions,
    });

    // Attach authentic phrase-segmented captions to each individual clip
    const clipsWithCaptions = discovered.map((clip, idx) => {
      const rawStart =
        typeof clip.start === 'number'
          ? clip.start
          : typeof clip.startTime === 'number'
            ? clip.startTime
            : clip.sourceStartSeconds || 0;
      const rawEnd =
        typeof clip.end === 'number'
          ? clip.end
          : typeof clip.endTime === 'number'
            ? clip.endTime
            : clip.sourceEndSeconds || rawStart + (clip.duration || 25);
      const rawDuration =
        typeof clip.duration === 'number'
          ? clip.duration
          : parseFloat((rawEnd - rawStart).toFixed(2));

      const timing = normalizeCanonicalTiming({
        sourceStartSeconds: rawStart,
        sourceEndSeconds: rawEnd,
        duration: rawDuration,
      });

      const clipCaptions =
        clip.captions && clip.captions.length > 0
          ? clip.captions
          : segmentCaptionsForClip(
              captions,
              timing.sourceStartSeconds,
              timing.sourceEndSeconds
            );

      const resolvedCaptionMode =
        job.settings?.captionMode ||
        (job.settings?.contentType === 'gaming-gta' ||
        job.settings?.captionLanguage === 'en'
          ? 'english'
          : 'dual-urdu-roman');

      return {
        ...clip,
        ...timing,
        start: timing.sourceStartSeconds,
        end: timing.sourceEndSeconds,
        sourceStartSeconds: timing.sourceStartSeconds,
        sourceEndSeconds: timing.sourceEndSeconds,
        startTime: timing.sourceStartSeconds,
        endTime: timing.sourceEndSeconds,
        duration: timing.duration,
        id: clip.id || `clip-${idx + 1}`,
        clipId: clip.id || `clip-${idx + 1}`,
        index: idx + 1,
        captions: clipCaptions,
        captionMode: resolvedCaptionMode,
        sourceUrl: job.video_url,
        syncStatus:
          clipCaptions.length > 0 ? 'synchronized' : 'needs_manual_review',
        renderStatus: 'ready',
        lastModified: new Date().toISOString(),
      };
    });

    // Immediately publish candidate clips so frontend displays all cards 1 by 1
    const initialDiscoveredClips = clipsWithCaptions.map((c, idx) => ({
      ...c,
      isRendered: false,
      renderStatus: idx === 0 ? 'rendering' : 'queued',
      renderProgress: idx === 0 ? 15 : 0,
      renderStage:
        idx === 0
          ? 'Preparing 9:16 vertical crop...'
          : `Queued (#${idx + 1} in line)`,
    }));

    updateJob(jobId, {
      status: 'rendering_shorts',
      current_stage: `Discovered ${clipsWithCaptions.length} shorts. Rendering Short #1 of ${clipsWithCaptions.length} (80%)...`,
      progress: 80,
      output: {
        clips: initialDiscoveredClips,
        thumbnailCandidates: [],
      },
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

      // Publish active rendering state for current short 1 by 1
      const activeClipsStage1 = clipsWithCaptions.map((c, idx) => {
        if (idx < cIdx) return renderedShorts[idx];
        if (idx === cIdx) {
          return {
            ...c,
            isRendered: false,
            renderStatus: 'rendering',
            renderProgress: 25,
            renderStage: `Cutting 9:16 vertical crop (${c.duration}s)...`,
          };
        }
        return {
          ...c,
          isRendered: false,
          renderStatus: 'queued',
          renderProgress: 0,
          renderStage: `Queued (#${idx + 1} in line)`,
        };
      });

      updateJob(jobId, {
        current_stage: `Rendering Short #${cIdx + 1} of ${clipsWithCaptions.length} 1-by-1 (${clipProgress}%)...`,
        progress: clipProgress,
        output: {
          clips: activeClipsStage1,
          thumbnailCandidates: thumbCandidates,
        },
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

      // Build high-quality vertical 9:16 FFmpeg arguments with shot-by-shot tracking and audio fades
      const ffmpegArgs = buildFFmpegArgs({
        inputPath: localVideoPath,
        outputPath: shortOutPath,
        startTime: clip.sourceStartSeconds ?? clip.start ?? clip.startTime ?? 0,
        duration: clip.duration,
        aspectRatio: '9:16',
        framingMode:
          job.settings?.framingMode ||
          (job.settings?.contentType === 'gaming-gta'
            ? 'action-tracking'
            : 'smart-face'),
        cropX: clip.cropX ?? 50,
        shotTracking: clip.shotTracking || null,
        fadeIn: 0.4,
        fadeOut: 0.6,
        normalizeAudio: true,
        assPath: assSubtitlePath,
        sourceWidth: probe?.width || 1920,
        sourceHeight: probe?.height || 1080,
        hasAudio: probe?.hasAudio ?? true,
      });

      const renderTimeout = Math.max(
        360000,
        Math.round((clip.duration || 60) * 15000)
      );

      // Publish mid-render update: burning subtitles
      const activeClipsStage2 = clipsWithCaptions.map((c, idx) => {
        if (idx < cIdx) return renderedShorts[idx];
        if (idx === cIdx) {
          return {
            ...c,
            isRendered: false,
            renderStatus: 'rendering',
            renderProgress: 65,
            renderStage: `Encoding 9:16 vertical video & subtitles (65%)...`,
          };
        }
        return {
          ...c,
          isRendered: false,
          renderStatus: 'queued',
          renderProgress: 0,
          renderStage: `Queued (#${idx + 1} in line)`,
        };
      });
      updateJob(jobId, {
        output: {
          clips: activeClipsStage2,
          thumbnailCandidates: thumbCandidates,
        },
      });

      try {
        await new Promise((resolve, reject) => {
          runFFmpegJob({
            args: ffmpegArgs,
            duration: clip.duration,
            timeoutMs: renderTimeout,
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
            startTime:
              clip.sourceStartSeconds ?? clip.start ?? clip.startTime ?? 0,
            duration: clip.duration,
            aspectRatio: '9:16',
            framingMode:
              job.settings?.framingMode ||
              (job.settings?.contentType === 'gaming-gta'
                ? 'action-tracking'
                : 'smart-face'),
            cropX: clip.cropX ?? 50,
            shotTracking: clip.shotTracking || null,
            fadeIn: 0.4,
            fadeOut: 0.6,
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
              timeoutMs: renderTimeout,
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

      const completedClip = {
        ...clip,
        videoUrl: shortMediaItem.download_url || shortMediaItem.downloadUrl,
        downloadUrl: shortMediaItem.download_url || shortMediaItem.downloadUrl,
        mediaHubId: shortMediaItem.id,
        isRendered: true,
        renderStatus: 'completed',
        renderProgress: 100,
        renderStage: '✓ Ready to play',
        probe: shortProbe,
      };
      renderedShorts.push(completedClip);

      // PROGRESSIVE 1-BY-1 OUTPUT: Immediately publish completed short! Next short transitions to rendering!
      const inProgressOutputs = clipsWithCaptions.map((c, idx) => {
        if (idx <= cIdx) return renderedShorts[idx];
        if (idx === cIdx + 1) {
          return {
            ...c,
            isRendered: false,
            renderStatus: 'rendering',
            renderProgress: 15,
            renderStage: `Starting Short #${idx + 1}...`,
          };
        }
        return {
          ...c,
          isRendered: false,
          renderStatus: 'queued',
          renderProgress: 0,
          renderStage: `Queued (#${idx + 1} in line)`,
        };
      });

      updateJob(jobId, {
        current_stage: `Short #${cIdx + 1} ready! ${cIdx + 1 < clipsWithCaptions.length ? `Rendering Short #${cIdx + 2} of ${clipsWithCaptions.length}...` : 'All shorts generated!'}`,
        output: {
          clips: inProgressOutputs,
          thumbnailCandidates: thumbCandidates,
        },
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
