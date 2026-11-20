import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import {
  buildFFmpegArgs,
  runFFmpegJob,
  probeVideo,
} from '@/lib/video-shorts/ffmpeg-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request) {
  let tempDir = null;

  try {
    let videoFile = null;
    let startTime = 0;
    let duration = 30;
    let aspectRatio = '9:16';
    let framingMode = 'action-tracking';
    let cropX = null;
    let fadeIn = 0.5;
    let fadeOut = 0.5;
    let normalizeAudio = true;
    let audioVolume = 1.0;
    let captionsRaw = null;
    let burnSubtitles = true;
    let captionMode = 'english';
    let captionFontSize = 46;
    let videoUrl = null;
    let openingStyle = 'none';
    let openingDuration = 1.5;
    let quality = '4k';
    let brollVideoUrl = null;
    let shotTrackingRaw = null;
    let isGaming = true;

    const contentTypeHeader = request.headers.get('content-type') || '';
    if (contentTypeHeader.includes('application/json')) {
      const body = await request.json();
      videoUrl = body.videoUrl || body.url || null;
      startTime = parseFloat(body.sourceStartSeconds || body.startTime || '0');
      duration = parseFloat(body.clipDurationSeconds || body.duration || '30');
      aspectRatio = body.aspectRatio || '9:16';
      framingMode = body.framingMode || 'action-tracking';
      cropX =
        body.cropX !== undefined && body.cropX !== null
          ? parseFloat(body.cropX)
          : null;
      fadeIn = parseFloat(body.fadeIn !== undefined ? body.fadeIn : '0.5');
      fadeOut = parseFloat(body.fadeOut !== undefined ? body.fadeOut : '0.5');
      normalizeAudio =
        body.normalizeAudio !== false && body.normalizeAudio !== 'false';
      audioVolume = parseFloat(body.audioVolume || '1.0');
      captionsRaw = body.captions
        ? typeof body.captions === 'string'
          ? body.captions
          : JSON.stringify(body.captions)
        : null;
      burnSubtitles =
        body.burnSubtitles !== false && body.burnSubtitles !== 'false';
      captionMode = body.captionMode || 'english';
      captionFontSize = parseFloat(body.captionFontSize || '46');
      openingStyle = body.openingStyle || 'none';
      openingDuration = parseFloat(body.openingDuration || '1.5');
      quality = body.quality || '4k';
      brollVideoUrl = body.brollVideoUrl || body.brollUrl || null;
      shotTrackingRaw = body.shotTracking
        ? JSON.stringify(body.shotTracking)
        : null;
      isGaming =
        body.contentType === 'gaming-gta' ||
        body.isGaming === true ||
        !body.captionMode ||
        body.captionMode.startsWith('english');
    } else {
      const formData = await request.formData();
      videoFile = formData.get('video');
      startTime = parseFloat(
        formData.get('sourceStartSeconds') || formData.get('startTime') || '0'
      );
      duration = parseFloat(
        formData.get('clipDurationSeconds') || formData.get('duration') || '30'
      );
      aspectRatio = formData.get('aspectRatio') || '9:16';
      framingMode = formData.get('framingMode') || 'action-tracking';
      cropX = formData.get('cropX') ? parseFloat(formData.get('cropX')) : null;
      fadeIn = parseFloat(formData.get('fadeIn') || '0.5');
      fadeOut = parseFloat(formData.get('fadeOut') || '0.5');
      normalizeAudio = formData.get('normalizeAudio') !== 'false';
      audioVolume = parseFloat(formData.get('audioVolume') || '1.0');
      captionsRaw = formData.get('captions');
      burnSubtitles = formData.get('burnSubtitles') !== 'false';
      captionMode = formData.get('captionMode') || 'english';
      captionFontSize = parseFloat(formData.get('captionFontSize') || '46');
      videoUrl = formData.get('videoUrl');
      openingStyle = formData.get('openingStyle') || 'none';
      openingDuration = parseFloat(formData.get('openingDuration') || '1.5');
      quality = formData.get('quality') || '4k';
      brollVideoUrl = formData.get('brollVideoUrl') || formData.get('brollUrl');
      shotTrackingRaw = formData.get('shotTracking');
      isGaming =
        formData.get('contentType') === 'gaming-gta' ||
        formData.get('isGaming') === 'true' ||
        captionMode.startsWith('english');
    }

    if (
      isGaming &&
      (captionMode === 'dual-urdu-roman' ||
        captionMode === 'urdu' ||
        captionMode === 'roman-urdu')
    ) {
      captionMode = 'english';
    }

    if ((!videoFile || typeof videoFile === 'string') && !videoUrl) {
      return NextResponse.json(
        { error: 'Video file or videoUrl is required.' },
        { status: 400 }
      );
    }

    // Create unique temporary directory
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    tempDir = path.join(os.tmpdir(), 'video-shorts', jobId);
    fs.mkdirSync(tempDir, { recursive: true });

    // Write input video to disk
    const inputExt =
      videoFile && videoFile.name
        ? path.extname(videoFile.name) || '.mp4'
        : '.mp4';
    const inputPath = path.join(tempDir, `input${inputExt}`);
    const outputPath = path.join(tempDir, `rendered_short_${jobId}.mp4`);

    if (videoFile && typeof videoFile !== 'string') {
      const arrayBuffer = await videoFile.arrayBuffer();
      fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));
    } else if (videoUrl) {
      const localRel = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
      const localPath = path.join(process.cwd(), 'public', localRel);
      if (fs.existsSync(localPath)) {
        fs.copyFileSync(localPath, inputPath);
      } else {
        const resp = await fetch(videoUrl);
        if (!resp.ok) {
          throw new Error(
            `Failed to fetch source video URL: ${resp.statusText}`
          );
        }
        const ab = await resp.arrayBuffer();
        fs.writeFileSync(inputPath, Buffer.from(ab));
      }
    }

    // Handle B-roll replacement video stream if provided
    let brollPath = null;
    if (brollVideoUrl) {
      try {
        const brollCandidatePath = path.join(tempDir, 'broll.mp4');
        const localRel = brollVideoUrl.startsWith('/')
          ? brollVideoUrl.slice(1)
          : brollVideoUrl;
        const localPath = path.join(process.cwd(), 'public', localRel);
        if (fs.existsSync(localPath)) {
          fs.copyFileSync(localPath, brollCandidatePath);
          brollPath = brollCandidatePath;
        } else {
          const resp = await fetch(brollVideoUrl);
          if (resp.ok) {
            const ab = await resp.arrayBuffer();
            fs.writeFileSync(brollCandidatePath, Buffer.from(ab));
            brollPath = brollCandidatePath;
          }
        }
      } catch (brollErr) {
        console.warn(
          'Could not fetch B-roll video for render:',
          brollErr.message
        );
      }
    }

    // Handle burned-in subtitles via ASS file with canonical relative retiming
    let assPath = null;
    if (burnSubtitles && captionsRaw) {
      try {
        const parsedCaptions = JSON.parse(captionsRaw);
        if (Array.isArray(parsedCaptions) && parsedCaptions.length > 0) {
          // Guarantee captions are relative to the short (0 .. duration)
          const relativeCaptions = parsedCaptions.map((c) => {
            let s = Number(c.clipRelativeStartSeconds ?? c.start ?? 0);
            let e = Number(c.clipRelativeEndSeconds ?? c.end ?? s + 2);
            // If absolute source timestamps were passed, shift to clip relative
            if (startTime > 0 && s >= startTime - 0.5) {
              s = Math.max(0, s - startTime);
              e = Math.max(s + 0.2, e - startTime);
            }
            return {
              ...c,
              start: Math.max(0, parseFloat(s.toFixed(3))),
              end: Math.min(duration, parseFloat(e.toFixed(3))),
            };
          });

          const { captionsToASS } =
            await import('@/lib/video-shorts/caption-engine');
          const assContent = captionsToASS(relativeCaptions, {
            captionMode,
            fontSize: captionFontSize,
          });
          assPath = path.join(tempDir, 'subtitles.ass');
          fs.writeFileSync(assPath, assContent, 'utf8');
        }
      } catch (subErr) {
        console.warn('Could not generate ASS subtitles for burn-in:', subErr);
      }
    }

    // Probe video to accurately detect dimensions and audio stream
    const probe = await probeVideo(inputPath);
    const sourceWidth = probe?.width || 1920;
    const sourceHeight = probe?.height || 1080;
    const hasAudio = probe?.hasAudio ?? true;

    let shotTracking = null;
    if (shotTrackingRaw) {
      try {
        shotTracking =
          typeof shotTrackingRaw === 'string'
            ? JSON.parse(shotTrackingRaw)
            : shotTrackingRaw;
      } catch (e) {}
    }

    // Construct FFmpeg arguments with dynamic shot-by-shot tracking and audio fades
    const args = buildFFmpegArgs({
      inputPath,
      outputPath,
      startTime,
      duration,
      aspectRatio,
      framingMode,
      cropX,
      shotTracking,
      fadeIn,
      fadeOut,
      normalizeAudio,
      audioVolume,
      assPath,
      openingStyle,
      openingDuration,
      sourceWidth,
      sourceHeight,
      hasAudio,
      brollPath,
      quality: quality || '4k',
    });

    // Execute FFmpeg with automated fallback if subtitle font parser fails
    const renderTimeout = Math.max(
      900000,
      Math.round((duration || 60) * 30000)
    );
    try {
      await new Promise((resolve, reject) => {
        runFFmpegJob({
          args,
          duration,
          timeoutMs: renderTimeout,
          onComplete: resolve,
          onError: reject,
        });
      });
    } catch (renderErr) {
      if (assPath) {
        console.warn(
          'FFmpeg render with ASS failed, retrying clean fallback render:',
          renderErr.message
        );
        const fallbackArgs = buildFFmpegArgs({
          inputPath,
          outputPath,
          startTime,
          duration,
          aspectRatio,
          framingMode,
          cropX,
          shotTracking,
          fadeIn,
          fadeOut,
          normalizeAudio,
          audioVolume,
          assPath: null,
          openingStyle,
          openingDuration,
          sourceWidth,
          sourceHeight,
          hasAudio,
          brollPath,
          quality: quality || '4k',
        });
        await new Promise((resolve, reject) => {
          runFFmpegJob({
            args: fallbackArgs,
            duration,
            timeoutMs: renderTimeout,
            onComplete: resolve,
            onError: reject,
          });
        });
      } else {
        throw renderErr;
      }
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error('Render output file was not created by FFmpeg.');
    }

    const outputBuffer = fs.readFileSync(outputPath);

    // Return rendered MP4 directly
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="short_${jobId}.mp4"`,
        'Content-Length': outputBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error rendering short video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to render video short.' },
      { status: 500 }
    );
  } finally {
    // Cleanup temporary files
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup failure
      }
    }
  }
}
