import { NextResponse } from 'next/server';
import { getJob, updateJob } from '@/lib/video-shorts/job-queue-service';
import { getOpusClipProjectStatus } from '@/lib/video-providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required.' },
        { status: 400 }
      );
    }

    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    // Check OpusClip provider status if active
    if (
      job.provider === 'opusclip' &&
      job.providerJobId &&
      job.status !== 'completed'
    ) {
      try {
        const opusStatus = await getOpusClipProjectStatus(job.providerJobId);
        if (opusStatus.status === 'completed' && opusStatus.clips?.length > 0) {
          const updated = updateJob(job.id, {
            status: 'completed',
            stage: 'ready',
            progress: 100,
            clips: opusStatus.clips,
            outputClips: opusStatus.clips,
          });
          return NextResponse.json({
            success: true,
            job: updated,
          });
        } else {
          updateJob(job.id, {
            progress: Math.max(job.progress || 30, opusStatus.progress || 50),
          });
        }
      } catch (err) {
        console.warn('OpusClip status poll notice:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      job: getJob(jobId) || job,
    });
  } catch (err) {
    console.error('Shorts V2 status error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to check job status.' },
      { status: 500 }
    );
  }
}
