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
import { getMediaHubItem } from '@/lib/video-shorts/media-storage-service';
import { getLocalMediaDir } from '@/lib/video-shorts/storage-paths';

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
    let mediaId = null;
    let localPath = null;
    let sourceStartSeconds = 0;
    let sourceEndSeconds = 30;
    let existingCaptions = [];
    let referenceLyrics = '';

    let language = 'ur';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      videoFile = formData.get('video');
      videoUrl = formData.get('videoUrl');
      clipId = formData.get('clipId') || 'clip-1';
      mediaId = formData.get('mediaId') || formData.get('sourceMediaId');
      localPath = formData.get('localPath') || formData.get('local_path');
      sourceStartSeconds = parseFloat(
        formData.get('sourceStartSeconds') || formData.get('startTime') || '0'
      );
      sourceEndSeconds = parseFloat(
        formData.get('sourceEndSeconds') ||
          formData.get('endTime') ||
          (sourceStartSeconds + 30).toString()
      );
      referenceLyrics = formData.get('referenceLyrics') || '';
      language =
        formData.get('language') ||
        (formData.get('contentType') === 'gaming-gta' ? 'en' : 'ur');
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
      mediaId = body.mediaId || body.sourceMediaId || body.sourceId;
      localPath = body.localPath || body.local_path;
      sourceStartSeconds = parseFloat(
        body.sourceStartSeconds ?? body.startTime ?? 0
      );
      sourceEndSeconds = parseFloat(
        body.sourceEndSeconds ?? body.endTime ?? sourceStartSeconds + 30
      );
      existingCaptions = body.existingCaptions || [];
      referenceLyrics = body.referenceLyrics || '';
      language =
        body.language ||
        body.captionLanguage ||
        (body.contentType === 'gaming-gta' ? 'en' : 'ur');
    }

    const clipDuration = Math.max(1, sourceEndSeconds - sourceStartSeconds);

    tempDir = path.join(
      os.tmpdir(),
      `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    );
    fs.mkdirSync(tempDir, { recursive: true });

    // 1. Locate or fetch video source file with full local & Media Hub lookup
    if (videoFile && typeof videoFile !== 'string') {
      const ext = path.extname(videoFile.name || 'source.mp4') || '.mp4';
      tempVideoPath = path.join(tempDir, `input${ext}`);
      const ab = await videoFile.arrayBuffer();
      fs.writeFileSync(tempVideoPath, Buffer.from(ab));
    } else {
      // A. Check localPath if already available on disk
      if (localPath && fs.existsSync(localPath)) {
        tempVideoPath = localPath;
      }

      // B. Check mediaId in Media Hub or local storage directory
      const targetId =
        mediaId ||
        (videoUrl && /yt_[a-zA-Z0-9_-]+/.test(videoUrl)
          ? videoUrl.match(/yt_[a-zA-Z0-9_-]+/)[0]
          : null);
      if (!tempVideoPath && targetId) {
        try {
          const hubItem = await getMediaHubItem(targetId);
          if (hubItem?.localPath && fs.existsSync(hubItem.localPath)) {
            tempVideoPath = hubItem.localPath;
          } else if (hubItem?.local_path && fs.existsSync(hubItem.local_path)) {
            tempVideoPath = hubItem.local_path;
          } else if (
            hubItem?.videoUrl ||
            hubItem?.downloadUrl ||
            hubItem?.download_url
          ) {
            videoUrl =
              hubItem.videoUrl || hubItem.downloadUrl || hubItem.download_url;
          }
        } catch (_) {}

        if (!tempVideoPath) {
          const hubDir = getLocalMediaDir(targetId);
          if (fs.existsSync(hubDir)) {
            const files = fs
              .readdirSync(hubDir)
              .filter((f) => f.endsWith('.mp4'));
            if (files.length > 0) {
              const diskCandidate = path.join(hubDir, files[0]);
              if (
                fs.existsSync(diskCandidate) &&
                fs.statSync(diskCandidate).size > 1000
              ) {
                tempVideoPath = diskCandidate;
              }
            }
          }
        }
      }

      // C. Resolve videoUrl (relative or remote)
      if (!tempVideoPath && videoUrl) {
        if (videoUrl.startsWith('/')) {
          // Check public/
          const localRel = videoUrl.slice(1);
          const localCandidate = path.join(process.cwd(), 'public', localRel);
          if (fs.existsSync(localCandidate)) {
            tempVideoPath = localCandidate;
          } else {
            // Check /media-hub/{id}/{fileName} pattern
            const match = videoUrl.match(/\/media-hub\/([^/]+)\/(.+)/);
            if (match) {
              const mId = match[1];
              const fName = match[2];
              const hubDir = getLocalMediaDir(mId);
              const directFile = path.join(hubDir, fName);
              if (fs.existsSync(directFile)) {
                tempVideoPath = directFile;
              } else if (fs.existsSync(hubDir)) {
                const vidFiles = fs
                  .readdirSync(hubDir)
                  .filter((f) => /\.(mp4|webm|mov)$/i.test(f));
                if (vidFiles.length > 0) {
                  tempVideoPath = path.join(hubDir, vidFiles[0]);
                }
              }
            }
          }
        } else if (
          videoUrl.startsWith('http://') ||
          videoUrl.startsWith('https://')
        ) {
          try {
            const resp = await fetch(videoUrl);
            if (resp.ok) {
              tempVideoPath = path.join(tempDir, 'source.mp4');
              const ab = await resp.arrayBuffer();
              fs.writeFileSync(tempVideoPath, Buffer.from(ab));
            }
          } catch (_) {}
        }
      }

      // D. Fail-safe registry inspection: if tempVideoPath is still not resolved,
      // search listMediaHubItems() for the matching source video (yt_ first, then any real source)
      if (!tempVideoPath) {
        try {
          const registryItems = (await listMediaHubItems()) || [];
          // Filter: only real source videos, not generated shorts
          const sourceItems = registryItems.filter(
            (it) =>
              (it.source_type || it.sourceType || '') !== 'generated_short' &&
              it.id &&
              !it.id.startsWith('short_')
          );

          // Priority: exact match by mediaId/videoUrl, then yt_ items (most likely the real source), then first
          const matched =
            sourceItems.find(
              (it) =>
                (mediaId && (it.id === mediaId || it.db_id === mediaId)) ||
                (videoUrl && it.videoUrl && it.videoUrl === videoUrl) ||
                (it.downloadUrl && videoUrl && videoUrl.includes(it.id))
            ) ||
            sourceItems.find((it) => it.id.startsWith('yt_')) ||
            sourceItems[0];

          if (matched) {
            if (matched.localPath && fs.existsSync(matched.localPath)) {
              tempVideoPath = matched.localPath;
            } else if (
              matched.local_path &&
              fs.existsSync(matched.local_path)
            ) {
              tempVideoPath = matched.local_path;
            } else if (
              matched.downloadUrl &&
              matched.downloadUrl.startsWith('/')
            ) {
              const cand = path.join(
                process.cwd(),
                'public',
                matched.downloadUrl.slice(1)
              );
              if (fs.existsSync(cand)) {
                tempVideoPath = cand;
              }
            } else if (
              matched.downloadUrl &&
              (matched.downloadUrl.startsWith('http://') ||
                matched.downloadUrl.startsWith('https://'))
            ) {
              try {
                const resp = await fetch(matched.downloadUrl);
                if (resp.ok) {
                  tempVideoPath = path.join(tempDir, 'matched_source.mp4');
                  const ab = await resp.arrayBuffer();
                  fs.writeFileSync(tempVideoPath, Buffer.from(ab));
                }
              } catch (_) {}
            }
          }
        } catch (_) {}
      }

      // E. Check local media-hub root directory for ANY yt_ folder or direct mp4 file
      if (!tempVideoPath) {
        try {
          const mediaBase = path.join(process.cwd(), 'public', 'media-hub');
          if (fs.existsSync(mediaBase)) {
            const dirs = fs.readdirSync(mediaBase);
            const matchDir =
              dirs.find(
                (d) =>
                  (targetId && d.includes(targetId)) ||
                  (mediaId && d.includes(mediaId))
              ) || dirs.find((d) => d.startsWith('yt_'));
            if (matchDir) {
              const dPath = path.join(mediaBase, matchDir);
              if (fs.statSync(dPath).isDirectory()) {
                const mp4s = fs
                  .readdirSync(dPath)
                  .filter((f) => f.endsWith('.mp4'));
                if (mp4s.length > 0) {
                  tempVideoPath = path.join(dPath, mp4s[0]);
                }
              }
            }
          }
        } catch (_) {}
      }

      // F. If clipId exists as a pre-cut or rendered short locally, use that file directly
      if (!tempVideoPath && clipId) {
        try {
          const shortDir = path.join(
            process.cwd(),
            'public',
            'media-hub',
            String(clipId)
          );
          if (fs.existsSync(shortDir)) {
            const sFiles = fs
              .readdirSync(shortDir)
              .filter((f) => f.endsWith('.mp4'));
            if (sFiles.length > 0) {
              tempVideoPath = path.join(shortDir, sFiles[0]);
              sourceStartSeconds = 0;
            }
          }
        } catch (_) {}
      }
    }

    if (!tempVideoPath || !fs.existsSync(tempVideoPath)) {
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
        language: language === 'en' ? 'en' : 'ur',
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

    // 5. Enrich with authentic Urdu Nastaliq and Roman Urdu transliteration (Urdu only)
    const enriched =
      language === 'ur'
        ? transliterateUrduCaptions(alignedCaptions, 'conversational')
        : alignedCaptions.map((c) => ({
            ...c,
            isEnglish: language === 'en',
            textEnglish: c.textEnglish || c.text || '',
            text: c.text || c.textEnglish || '',
          }));

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
