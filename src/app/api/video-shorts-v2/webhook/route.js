import { NextResponse } from 'next/server';
import { updateJob, getJob } from '@/lib/video-shorts/job-queue-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const payload = await request.json().catch(() => ({}));
    console.log(
      '[webhook] Received third-party provider event:',
      payload?.type || payload?.action || 'unknown'
    );

    // Handle OpusClip Webhook
    if (payload.projectId || payload.project_id) {
      const projectId = payload.projectId || payload.project_id;
      const clips = payload.clips || [];

      if (clips.length > 0) {
        console.log(
          `[webhook] OpusClip project ${projectId} completed with ${clips.length} clips.`
        );
        // Find matching job and update
        const jobId = payload.customId || payload.jobId;
        if (jobId) {
          updateJob(jobId, {
            status: 'completed',
            progress: 100,
            stage: 'ready',
            clips,
          });
        }
      }
    }

    // Handle Shotstack Webhook
    if (payload.id && payload.status) {
      const renderId = payload.id;
      const status = payload.status;
      const url = payload.url;
      console.log(
        `[webhook] Shotstack render ${renderId} status: ${status}, url: ${url}`
      );
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
