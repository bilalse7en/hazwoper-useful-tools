import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { ingestMediaFile } from '@/lib/video-shorts/media-storage-service';
import {
  isValidYouTubeUrl,
  extractYouTubeId,
} from '@/lib/video-shorts/source-parser';
import {
  createIngestionJob,
  findActiveIngestionJob,
  findCompletedMedia,
  scheduleQueueTick,
} from '@/lib/video-shorts/ingestion-queue-service';
import { getJob, loadAllJobs } from '@/lib/video-shorts/job-queue-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/video-shorts/ingest
 *
 * Guaranteed Behaviors:
 * 1. Direct MP4/MOV file upload processed via multipart/form-data.
 * 2. YouTube URL submissions:
 *    - Validates URL and checks for existing completed Media Hub copy.
 *    - Checks for active in-flight ingestion jobs (idempotency & deduplication).
 *    - Creates a durable ingestion job.
 *    - Triggers background worker queue non-blockingly.
 *    - Returns HTTP 202 Accepted IMMEDIATELY (<50ms). Zero 504 timeouts!
 */
export async function POST(request) {
  const reqStart = Date.now();
  try {
    const contentType = request.headers.get('content-type') || '';

    // ========================================================================
    // A. Handle Local Video File Upload (Multipart Form Data)
    // ========================================================================
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

      console.log(
        `[ingest] Direct file upload completed in ${Date.now() - reqStart}ms`
      );

      return NextResponse.json({
        success: true,
        mediaItem,
      });
    }

    // ========================================================================
    // B. Handle YouTube Ingestion (Asynchronous Queue Architecture)
    // ========================================================================
    const body = await request.json();
    const url = body.url || body.youtubeUrl;
    const preferredQuality = body.preferredQuality || body.quality || '4k';
    const forceRefresh = Boolean(body.forceRefresh);

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

    // 1. FAST CHECK: If this video was already downloaded and is ready in Media Hub
    if (!forceRefresh) {
      const existing = await findCompletedMedia(videoId);
      if (existing) {
        console.log(
          `[ingest] Cache hit for videoId=${videoId}. Responding immediately in ${Date.now() - reqStart}ms`
        );
        return NextResponse.json({
          success: true,
          status: 'completed',
          mediaItem: existing.mediaItem,
          metadata: existing.metadata,
          isDownloaded: true,
        });
      }
    }

    // 2. IDEMPOTENCY CHECK: Is there already an active job for this videoId?
    const activeJob = findActiveIngestionJob(videoId);
    if (activeJob) {
      console.log(
        `[ingest] Deduplicated active job ${activeJob.id} for videoId=${videoId}. Responding 202 in ${Date.now() - reqStart}ms`
      );
      // Ensure the worker is ticking for this job
      scheduleQueueTick(50);
      return NextResponse.json(
        {
          success: true,
          status: activeJob.status,
          jobId: activeJob.id,
          message: 'Video ingestion already in progress',
          stage: activeJob.stage,
          progress: activeJob.progress,
        },
        { status: 202 }
      );
    }

    // 3. CREATE DURABLE INGESTION JOB
    const job = createIngestionJob({
      url,
      videoId,
      preferredQuality,
      forceRefresh,
    });

    console.log(
      `[ingest] Durable job enqueued: ${job.id} for videoId=${videoId}. Responding 202 in ${Date.now() - reqStart}ms`
    );

    // 4. RETURN HTTP 202 ACCEPTED IMMEDIATELY (< 50ms)
    return NextResponse.json(
      {
        success: true,
        status: 'queued',
        jobId: job.id,
        message: 'Video ingestion started',
        stage: job.stage,
        progress: 0,
      },
      { status: 202 }
    );
  } catch (err) {
    console.error(`[ingest] API error after ${Date.now() - reqStart}ms:`, err);
    return NextResponse.json(
      { error: err.message || 'Internal media ingestion failure.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video-shorts/ingest?jobId=... or ?id=...
 * Retrieves status of an asynchronous ingestion job
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId') || searchParams.get('id');

    if (!jobId) {
      const allJobs = loadAllJobs();
      const ingestionJobs = Object.values(allJobs)
        .filter((j) => j.type === 'youtube_ingest')
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      return NextResponse.json({
        success: true,
        jobs: ingestionJobs.slice(0, 20),
      });
    }

    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Ingestion job not found.' },
        { status: 404 }
      );
    }

    // If job is queued or waiting retry, trigger queue pump
    if (['queued', 'waiting_retry'].includes(job.status)) {
      scheduleQueueTick(50);
    }

    return NextResponse.json({
      success: true,
      job,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      mediaItem: job.mediaItem,
      metadata: job.metadata,
      error: job.error,
      errorType: job.errorType,
      retryAfter: job.retry_after_seconds,
    });
  } catch (err) {
    console.error('Ingestion status error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
