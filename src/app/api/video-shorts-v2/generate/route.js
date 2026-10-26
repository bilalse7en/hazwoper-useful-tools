import { NextResponse } from 'next/server';
import {
  hasOpusClipCredentials,
  submitOpusClipProject,
} from '@/lib/video-providers';
import {
  createJob,
  updateJob,
  getJob,
} from '@/lib/video-shorts/job-queue-service';
import { ingestMediaFile } from '@/lib/video-shorts/media-storage-service';
import { isValidYouTubeUrl } from '@/lib/video-shorts/source-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let url = null;
    let mediaItem = null;
    let settings = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const settingsRaw = formData.get('settings');
      if (settingsRaw) {
        try {
          settings = JSON.parse(settingsRaw);
        } catch (_) {}
      }

      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { error: 'No video file provided.' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      mediaItem = await ingestMediaFile({
        buffer,
        fileName: file.name || 'uploaded_video.mp4',
        fileType: file.type || 'video/mp4',
        sourceType: 'upload',
      });
      url = mediaItem.download_url || mediaItem.downloadUrl;
    } else {
      const body = await request.json().catch(() => ({}));
      url = body.url || body.videoUrl;
      settings = body.settings || {};
    }

    if (!url) {
      return NextResponse.json(
        { error: 'Please provide a video URL or upload a video file.' },
        { status: 400 }
      );
    }

    const durationMin = settings.minDuration || 30;
    const durationMax = settings.maxDuration || 60;

    // Create durable internal job
    const job = createJob({
      mediaItem: mediaItem || {
        url,
        fileName: 'Short_Video.mp4',
        sourceType: isValidYouTubeUrl(url) ? 'youtube' : 'url',
      },
      settings: {
        ...settings,
        minDuration: durationMin,
        maxDuration: durationMax,
        aspectRatio: settings.aspectRatio || '9:16',
        autoSubtitles: Boolean(
          settings.autoSubtitles &&
          settings.captionLanguage &&
          settings.captionLanguage !== 'off'
        ),
      },
    });

    // Strategy A: OpusClip Cloud API if configured and URL is public
    if (hasOpusClipCredentials() && url.startsWith('http')) {
      try {
        const opusResult = await submitOpusClipProject({
          videoUrl: url,
          title: settings.title || 'AI Naat Short Project',
          clipDurationRange: [durationMin, durationMax],
        });

        updateJob(job.id, {
          status: 'processing',
          stage: 'opusclip_processing',
          progress: 25,
          provider: 'opusclip',
          providerJobId: opusResult.projectId,
        });

        return NextResponse.json({
          success: true,
          jobId: job.id,
          provider: 'opusclip',
          providerJobId: opusResult.projectId,
          status: 'processing',
          message: 'Video submitted to OpusClip AI Clipping Engine.',
        });
      } catch (opusErr) {
        console.warn(
          'OpusClip API submission warning, continuing with automated engine:',
          opusErr.message
        );
      }
    }

    // Strategy B: Automated Pipeline
    updateJob(job.id, {
      status: 'processing',
      stage: 'analyzing_speech_and_scenes',
      progress: 35,
      provider: 'automated-pipeline',
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      provider: 'automated-pipeline',
      status: 'processing',
      message: 'Shorts generation started asynchronously.',
    });
  } catch (err) {
    console.error('Shorts V2 generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize shorts generation.' },
      { status: 500 }
    );
  }
}
