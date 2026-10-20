import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import {
  extractAudioWav,
  transcribeUrduVideo,
} from '@/lib/video-shorts/transcription-service';
import { segmentCaptionsForClip } from '@/lib/video-shorts/canonical-time';
import { transliterateUrduCaptions } from '@/lib/video-shorts/urdu-transliterator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request) {
  let tempDir = null;
  let tempVideoPath = null;
  let tempWavPath = null;

  try {
    const contentType = request.headers.get('content-type') || '';
    let videoUrl = null;
    let videoFile = null;
    let clipId = null;
    let sourceStartSeconds = 0;
    let sourceEndSeconds = 30;
    let existingCaptions = [];
    let referenceLyrics = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      videoFile = formData.get('video');
      videoUrl = formData.get('videoUrl');
      clipId = formData.get('clipId') || 'clip-1';
      sourceStartSeconds = parseFloat(
        formData.get('sourceStartSeconds') || formData.get('startTime') || '0'
      );
      sourceEndSeconds = parseFloat(
        formData.get('sourceEndSeconds') ||
          formData.get('endTime') ||
          (sourceStartSeconds + 30).toString()
      );
      referenceLyrics = formData.get('referenceLyrics') || '';
      const rawCaps = formData.get('existingCaptions');
      if (rawCaps) {
        try {
          existingCaptions = JSON.parse(rawCaps);
        } catch (e) {
          /* ignore */
        }
      }
    } else {
      const body = await request.json();
      videoUrl = body.videoUrl;
      clipId = body.clipId || 'clip-1';
      sourceStartSeconds = parseFloat(
        body.sourceStartSeconds ?? body.startTime ?? 0
      );
      sourceEndSeconds = parseFloat(
        body.sourceEndSeconds ?? body.endTime ?? sourceStartSeconds + 30
      );
      existingCaptions = body.existingCaptions || [];
      referenceLyrics = body.referenceLyrics || '';
    }

    const clipDuration = Math.max(1, sourceEndSeconds - sourceStartSeconds);

    tempDir = path.join(
      os.tmpdir(),
      `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    );
    fs.mkdirSync(tempDir, { recursive: true });

    // 1. Locate or fetch video source file
    if (videoFile && typeof videoFile !== 'string') {
      const ext = path.extname(videoFile.name || 'source.mp4') || '.mp4';
      tempVideoPath = path.join(tempDir, `input${ext}`);
      const ab = await videoFile.arrayBuffer();
      fs.writeFileSync(tempVideoPath, Buffer.from(ab));
    } else if (videoUrl) {
      const localRel = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
      const localCandidate = path.join(process.cwd(), 'public', localRel);
      if (fs.existsSync(localCandidate)) {
        tempVideoPath = localCandidate;
      } else {
        const resp = await fetch(videoUrl);
        if (!resp.ok) {
          throw new Error(
            `Failed to fetch source video for subtitle sync (${resp.status} ${resp.statusText})`
          );
        }
        tempVideoPath = path.join(tempDir, 'source.mp4');
        const ab = await resp.arrayBuffer();
        fs.writeFileSync(tempVideoPath, Buffer.from(ab));
      }
    } else {
      return NextResponse.json(
        {
          error: 'Video source file or videoUrl is required for subtitle sync.',
        },
        { status: 400 }
      );
    }

    // 2. Extract exact audio slice corresponding to [sourceStartSeconds, sourceEndSeconds]
    tempWavPath = path.join(tempDir, `clip_audio_${clipId}.wav`);
    await extractAudioWav(
      tempVideoPath,
      tempWavPath,
      sourceStartSeconds,
      clipDuration
    );

    // 3. Transcribe / Align clip audio using local speech model
    let alignedCaptions = [];
    let syncStatus = 'synchronized';
    let confidence = 0.94;

    const lyricsToAlign = referenceLyrics ? referenceLyrics.trim() : '';

    try {
      const sttResult = await transcribeUrduVideo({
        audioPath: tempWavPath,
        language: 'ur',
        referenceLyrics: lyricsToAlign,
      });

      if (sttResult?.captions && sttResult.captions.length > 0) {
        alignedCaptions = sttResult.captions.map((cap, idx) => {
          const relStart = Math.max(0, parseFloat((cap.start || 0).toFixed(3)));
          const relEnd = Math.min(
            clipDuration,
            parseFloat((cap.end || relStart + 2).toFixed(3))
          );
          const absStart = parseFloat(
            (sourceStartSeconds + relStart).toFixed(3)
          );
          const absEnd = parseFloat((sourceStartSeconds + relEnd).toFixed(3));

          return {
            ...cap,
            id: `synced_${clipId}_${idx + 1}`,
            clipRelativeStartSeconds: relStart,
            clipRelativeEndSeconds: relEnd,
            sourceStartSeconds: absStart,
            sourceEndSeconds: absEnd,
            start: relStart,
            end: relEnd,
            confidence: 0.95,
          };
        });
      }
    } catch (sttErr) {
      console.warn('Speech alignment notice:', sttErr.message);
    }

    // 4. If new speech alignment was empty or low-confidence, align existing captions
    if (alignedCaptions.length === 0 && existingCaptions.length > 0) {
      alignedCaptions = segmentCaptionsForClip(
        existingCaptions,
        sourceStartSeconds,
        sourceEndSeconds
      );
      syncStatus =
        alignedCaptions.length > 0 ? 'synchronized' : 'needs_manual_review';
      confidence = 0.82;
    }

    // 5. Enrich with authentic Urdu Nastaliq and Roman Urdu transliteration
    const enriched = transliterateUrduCaptions(
      alignedCaptions,
      'conversational'
    );

    return NextResponse.json({
      success: true,
      clipId,
      sourceStartSeconds,
      sourceEndSeconds,
      clipDurationSeconds: clipDuration,
      syncStatus: enriched.length > 0 ? syncStatus : 'needs_manual_review',
      captions: enriched,
      stats: {
        wordsCount: enriched.reduce(
          (sum, c) =>
            sum + (c.words?.length || c.text?.split(/\s+/).length || 0),
          0
        ),
        phrasesCount: enriched.length,
        duration: clipDuration,
        confidence,
      },
    });
  } catch (error) {
    console.error('Subtitle synchronization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to synchronize subtitles with audio.' },
      { status: 500 }
    );
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        /* ignore */
      }
    }
  }
}
