import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import {
  createJob,
  getJob,
  runJobWorker,
  updateJob,
  loadAllJobs,
} from '@/lib/video-shorts/job-queue-service';
import { scheduleQueueTick } from '@/lib/video-shorts/ingestion-queue-service';
import { getMediaHubItem } from '@/lib/video-shorts/media-storage-service';
import { getLocalMediaDir } from '@/lib/video-shorts/storage-paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    let {
      sourceMediaId,
      mediaId,
      videoUrl,
      localPath,
      fileName,
      title,
      settings,
      transcript,
    } = body;

    const actualMediaId = sourceMediaId || mediaId;

    if (
      videoUrl &&
      typeof videoUrl === 'string' &&
      videoUrl.startsWith('blob:')
    ) {
      videoUrl = null;
    }

    if ((!videoUrl || !localPath) && actualMediaId) {
      const mediaItem = await getMediaHubItem(actualMediaId);
      if (mediaItem) {
        videoUrl =
          videoUrl ||
          mediaItem.downloadUrl ||
          mediaItem.videoUrl ||
          mediaItem.download_url;
        localPath = localPath || mediaItem.localPath || mediaItem.local_path;
        fileName =
          fileName || title || mediaItem.fileName || mediaItem.file_name;
      }
    }

    // Direct filesystem check for media-hub/<actualMediaId>
    if ((!localPath || !videoUrl) && actualMediaId) {
      const hubDir = getLocalMediaDir(actualMediaId);
      if (fs.existsSync(hubDir)) {
        const files = fs
          .readdirSync(hubDir)
          .filter(
            (f) =>
              !f.endsWith('.jpg') && !f.endsWith('.png') && !f.endsWith('.json')
          );
        if (files.length > 0) {
          localPath = localPath || path.join(hubDir, files[0]);
          videoUrl = videoUrl || `/media-hub/${actualMediaId}/${files[0]}`;
        }
      }
    }

    // Check relative videoUrl (e.g. /media-hub/...)
    if (
      !localPath &&
      videoUrl &&
      typeof videoUrl === 'string' &&
      !videoUrl.startsWith('http')
    ) {
      const relCandidate = path.join(
        process.cwd(),
        'public',
        videoUrl.replace(/^\//, '')
      );
      if (fs.existsSync(relCandidate)) {
        localPath = relCandidate;
      }
    }

    // Strictly resolve from specified actualMediaId if localPath is not yet set
    if (!localPath && actualMediaId) {
      const hubBase = getLocalMediaDir();
      const targetDir = path.join(hubBase, actualMediaId);
      if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
        const vFiles = fs
          .readdirSync(targetDir)
          .filter((f) => f.endsWith('.mp4') || f.endsWith('.webm'));
        if (vFiles.length > 0) {
          localPath = path.join(targetDir, vFiles[0]);
          if (!videoUrl) {
            videoUrl = `/media-hub/${actualMediaId}/${vFiles[0]}`;
          }
        }
      }
    }

    if (!videoUrl && !localPath) {
      return NextResponse.json(
        {
          error: 'A valid source video URL or path is required to start a job.',
        },
        { status: 400 }
      );
    }

    const job = createJob({
      sourceMediaId: actualMediaId,
      mediaId: actualMediaId,
      videoUrl,
      localPath,
      fileName: fileName || title,
      settings,
      transcript,
    });

    // Start background processing immediately (non-blocking)
    runJobWorker(job.id).catch((err) => {
      console.error(`Background worker error on job ${job.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (err) {
    console.error('Job creation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create job.' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('id') || searchParams.get('jobId');

    if (!jobId) {
      const allJobs = loadAllJobs();
      const list = Object.values(allJobs).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return NextResponse.json({ success: true, jobs: list.slice(0, 20) });
    }

    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    // If this is an ingestion job that is waiting, ensure worker is alive
    if (
      job.type === 'youtube_ingest' &&
      ['queued', 'waiting_retry'].includes(job.status)
    ) {
      scheduleQueueTick(50);
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (err) {
    console.error('Job query error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to query job.' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required.' },
        { status: 400 }
      );
    }

    if (action === 'cancel') {
      const updated = updateJob(id, {
        status: 'cancelled',
        current_stage: 'Processing cancelled by user',
      });
      return NextResponse.json({ success: true, job: updated });
    }

    if (action === 'retry') {
      const job = getJob(id);
      if (!job)
        return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

      updateJob(id, {
        status: 'queued',
        current_stage: 'Retrying job',
        progress: 0,
        error: null,
        retry_count: (job.retry_count || 0) + 1,
      });

      runJobWorker(id).catch((err) =>
        console.error('Retry worker error:', err)
      );
      return NextResponse.json({ success: true, job: getJob(id) });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('Job update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
