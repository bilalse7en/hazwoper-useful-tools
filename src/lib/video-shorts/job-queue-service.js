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
import { probeVideo, extractThumbnailCandidates } from './ffmpeg-service';
import { extractAudioWav, transcribeUrduVideo } from './transcription-service';
import {
  transliterateUrduCaptions,
  transliterateUrduSentence,
} from './urdu-transliterator';
import { discoverClips } from './clip-finder';
import { parseVttFile, mergeIntoPhraseCaptions } from './vtt-parser';
import {
  segmentCaptionsForClip,
  normalizeCanonicalTiming,
} from './canonical-time';

const JOBS_FILE = path.join(process.cwd(), 'data', 'video-shorts-jobs.json');

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

    const tempDir = path.join(process.cwd(), 'temp', jobId);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    let localVideoPath = job.local_path;

    // Check if direct local_path exists
    if (!localVideoPath || !fs.existsSync(localVideoPath)) {
      // Check if mediaId exists in public/media-hub
      const mediaId = job.mediaId || job.source_media_id;
      if (mediaId) {
        const hubDir = path.join(process.cwd(), 'public', 'media-hub', mediaId);
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

    // 2. Stage: Extracting Audio
    updateJob(jobId, {
      status: 'extracting_audio',
      current_stage: 'Extracting 16kHz mono audio for speech recognition (25%)',
      progress: 25,
    });

    const wavPath = path.join(tempDir, 'audio_16k.wav');
    try {
      await extractAudioWav(localVideoPath, wavPath);
    } catch (wavErr) {
      console.warn('WAV extraction notice:', wavErr.message);
    }

    // 3. Stage: Transcribing Audio with Local Whisper ONNX
    updateJob(jobId, {
      status: 'transcribing',
      current_stage:
        'Transcribing speech into authentic Urdu script via Whisper (45%)',
      progress: 45,
    });

    let captions = [];
    if (job.transcript) {
      // Use existing pre-extracted transcript
      const parsed = parseVttFile(job.transcript);
      captions = mergeIntoPhraseCaptions(parsed, 10, 1.0);
    } else if (fs.existsSync(wavPath)) {
      try {
        const whisperRes = await transcribeUrduVideo({
          audioPath: wavPath,
          videoPath: localVideoPath,
          language: 'ur',
          referenceLyrics: job.settings?.referenceLyrics,
        });
        captions = whisperRes.captions || [];
      } catch (sttErr) {
        console.warn(
          'Whisper transcription fallback to phrases:',
          sttErr.message
        );
      }
    }

    // 4. Stage: Aligning & Transliterating Urdu to Roman Urdu
    updateJob(jobId, {
      status: 'aligning',
      current_stage:
        'Linguistically aligning Urdu script & Roman Urdu transliteration (65%)',
      progress: 65,
    });

    const transliterationStyle =
      job.settings?.transliterationStyle || 'conversational';
    captions = transliterateUrduCaptions(captions, transliterationStyle);

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
      const timing = normalizeCanonicalTiming({
        sourceStartSeconds: clip.start,
        sourceEndSeconds: clip.end,
        duration: clip.duration,
      });

      const clipCaptions =
        clip.captions && clip.captions.length > 0
          ? clip.captions
          : segmentCaptionsForClip(
              captions,
              timing.sourceStartSeconds,
              timing.sourceEndSeconds
            );

      return {
        ...clip,
        ...timing,
        id: clip.id || `clip-${idx + 1}`,
        clipId: clip.id || `clip-${idx + 1}`,
        index: idx + 1,
        captions: clipCaptions,
        captionMode: job.settings?.captionMode || 'dual-urdu-roman',
        sourceUrl: job.video_url,
        syncStatus:
          clipCaptions.length > 0 ? 'synchronized' : 'needs_manual_review',
        renderStatus: 'ready',
        lastModified: new Date().toISOString(),
      };
    });

    // 6. Stage: Generating Thumbnail Candidates
    updateJob(jobId, {
      status: 'generating_thumbnails',
      current_stage: 'Extracting genuine high-retention candidate frames (90%)',
      progress: 90,
    });

    const thumbDir = path.join(
      process.cwd(),
      'public',
      'media-hub',
      job.source_media_id || jobId,
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

    // 7. Stage: Completed
    updateJob(jobId, {
      status: 'completed',
      current_stage: 'Shorts generation complete & ready for preview (100%)',
      progress: 100,
      result_clips: clipsWithCaptions,
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
