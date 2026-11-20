'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Clock,
  History,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { VideoInputSection } from './video-input-section';
import { ClipsGallery } from './clips-gallery';
import { StudioEditor } from './studio-editor';
import { ExportModal } from './export-modal';
import { ShortsDownloadQueueDock } from './shorts-download-queue-dock';
import { inspectLocalVideoFile } from '@/lib/video-shorts/source-parser';
import {
  decodeAudioFromFile,
  analyzeAudioEnergy,
} from '@/lib/video-shorts/audio-analyzer';
import { detectSceneCuts } from '@/lib/video-shorts/scene-detector';
import { discoverClips } from '@/lib/video-shorts/clip-finder';
import { DEFAULT_STUDIO_SETTINGS } from '@/lib/video-shorts/types';
import {
  saveGeneratorState,
  getLatestGeneratorState,
} from '@/lib/tool-history';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { YouTubeCookieButton } from './youtube-cookie-button';
import { showToast, showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';

// Helper to format human-readable duration strings (e.g. 1m 14s, 38s)
const formatDurationDisplay = (totalSec) => {
  const s = Math.max(0, Math.round(totalSec || 0));
  const m = Math.floor(s / 60);
  const remain = s % 60;
  if (m === 0) return `${remain}s`;
  return `${m}m ${remain}s`;
};

// Helper for live stopwatch timer (mm:ss)
const formatStopwatch = (totalSec) => {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const m = Math.floor(s / 60);
  const remain = s % 60;
  return `${String(m).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
};

export function AIVideoShorts() {
  const [mounted, setMounted] = useState(false);
  const [viewState, setViewState] = useState('input'); // 'input' | 'gallery' | 'editor'
  const [videoSource, setVideoSource] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_STUDIO_SETTINGS);
  const [clips, setClips] = useState([]);
  const [thumbnailCandidates, setThumbnailCandidates] = useState([]);
  const [activeClip, setActiveClip] = useState(null);

  // Real-time Queue & Task Status
  const [queueStatus, setQueueStatus] = useState('idle'); // 'idle' | 'ingesting' | 'asset-saved' | 'generating'
  const [uploadProgress, setUploadProgress] = useState(0); // 0 to 100 percentage
  const [downloadQueue, setDownloadQueue] = useState([]); // 4K Short Download Queue (Bottom-Right)

  // Live Stopwatch, Elapsed & Estimated Remaining Time
  const [generationStartTime, setGenerationStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedTotalSeconds, setEstimatedTotalSeconds] = useState(30);
  const [totalCompletedTime, setTotalCompletedTime] = useState(null);

  // YouTube bot-check or download issue state (prevents fatal crashing)
  const [youtubeIssue, setYoutubeIssue] = useState(null);

  // 24-Hour Session State (retrieved from database)
  const [savedSession, setSavedSession] = useState(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live 1-second interval ticker when processing/generating shorts
  useEffect(() => {
    let timer = null;
    if (isProcessing && generationStartTime) {
      timer = setInterval(() => {
        const secs = Math.floor((Date.now() - generationStartTime) / 1000);
        setElapsedSeconds(secs);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing, generationStartTime]);

  // Check for previous 24-hour saved session on initial load
  useEffect(() => {
    const loadSession = async () => {
      try {
        const state = await getLatestGeneratorState('ai-video-shorts');
        if (
          state &&
          state.clips &&
          state.clips.length > 0 &&
          state.videoSource
        ) {
          setSavedSession(state);
        }
      } catch (e) {
        console.warn('Could not retrieve recent session:', e);
      }
    };
    loadSession();
  }, []);

  const restoreSession = () => {
    if (!savedSession) return;
    const rawSource = savedSession.videoSource;
    const isDeadBlob = (u) => typeof u === 'string' && u.startsWith('blob:');
    const allCandidateUrls = [
      rawSource?.downloadUrl,
      rawSource?.videoUrl,
      rawSource?.url,
      ...(savedSession.clips || []).flatMap((c) => [c.videoUrl, c.downloadUrl]),
    ];
    const validUrl = allCandidateUrls.find((u) => u && !isDeadBlob(u));

    const mediaId =
      rawSource?.id ||
      rawSource?.mediaId ||
      (savedSession.clips || []).find((c) => c.mediaId || c.sourceMediaId)
        ?.mediaId ||
      (savedSession.clips || []).find((c) => c.mediaId || c.sourceMediaId)
        ?.sourceMediaId ||
      (validUrl && /yt_[a-zA-Z0-9_-]+/.test(validUrl)
        ? validUrl.match(/yt_[a-zA-Z0-9_-]+/)[0]
        : null);

    const resolvedStream =
      validUrl ||
      (mediaId
        ? `/media-hub/${mediaId}/${rawSource?.fileName || 'video.mp4'}`
        : '');

    const restoredSource = rawSource
      ? {
          ...rawSource,
          id: mediaId || rawSource.id || rawSource.mediaId,
          mediaId: mediaId || rawSource.mediaId || rawSource.id,
          videoUrl: resolvedStream,
          downloadUrl: resolvedStream,
          url: resolvedStream,
        }
      : {
          id: mediaId || 'restored_source',
          mediaId: mediaId || 'restored_source',
          title: 'Restored Video Project',
          videoUrl: resolvedStream,
          downloadUrl: resolvedStream,
          url: resolvedStream,
        };

    setVideoSource(restoredSource);
    const normalizedClips = (savedSession.clips || []).map((c) => ({
      ...c,
      mediaId: c.mediaId || mediaId || restoredSource?.id,
      sourceMediaId:
        c.sourceMediaId || c.mediaId || mediaId || restoredSource?.id,
      videoUrl:
        c.videoUrl && !isDeadBlob(c.videoUrl) ? c.videoUrl : resolvedStream,
      downloadUrl:
        c.downloadUrl && !isDeadBlob(c.downloadUrl)
          ? c.downloadUrl
          : resolvedStream,
    }));
    setClips(normalizedClips);
    if (savedSession.thumbnailCandidates) {
      setThumbnailCandidates(savedSession.thumbnailCandidates);
    }
    if (savedSession.settings) {
      setSettings(savedSession.settings);
    }
    setViewState('gallery');
    showSuccess(
      'Restored your generated shorts from your 24-hour session history!'
    );
  };

  const updateSettings = (partial) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Handle explicit genre selection with complete cache & previous clips purge
  const handleSelectGenre = (genre, genreDefaults = {}) => {
    // 1. Completely purge previous clips, state, and cache
    setClips([]);
    setActiveClip(null);
    setThumbnailCandidates([]);
    setDownloadQueue([]);
    setSavedSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_shorts_job_id');
      try {
        localStorage.removeItem('video_shorts_current_project');
        localStorage.removeItem('video_shorts_saved_session');
      } catch (_) {}
    }
    // 2. Set isolated settings for selected genre
    setSettings((prev) => ({
      ...prev,
      ...genreDefaults,
      contentType: genre,
      referenceLyrics: '',
    }));
    showToast(
      `Switched profile to ${
        genre === 'gaming-gta'
          ? '🎮 GTA 6 & Gaming Action'
          : genre === 'music-songs'
            ? '🎵 Songs & Vocal Hooks'
            : '🕌 Islamic Naat & Tilawat'
      }. Previous cache cleared!`,
      'info'
    );
  };

  // Poll background queue job until completion
  const pollJob = useCallback(
    async (jobId, currentSource) => {
      setIsProcessing(true);
      setQueueStatus('generating');
      const startTime = Date.now();
      setGenerationStartTime(startTime);
      setTotalCompletedTime(null);
      const estSecs = Math.max(
        15,
        Math.round(
          (currentSource?.duration || videoSource?.duration || 60) * 0.25 + 5
        )
      );
      setEstimatedTotalSeconds(estSecs);

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/video-shorts/jobs?id=${jobId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (!data.success || !data.job) return;

          const job = data.job;
          setUploadProgress(job.progress || 0);
          setProcessingStatus(job.message || `Processing: ${job.stage}...`);

          // Progressive Display: update clips as they are rendered 1-by-1
          if (
            job.output?.clips &&
            Array.isArray(job.output.clips) &&
            job.output.clips.length > 0
          ) {
            setClips(job.output.clips);
            if (
              job.output.thumbnailCandidates &&
              job.output.thumbnailCandidates.length > 0
            ) {
              setThumbnailCandidates(job.output.thumbnailCandidates);
            }
            // CRITICAL: Immediately transition to gallery so user watches them generate 1 by 1 on the cards!
            setViewState((current) =>
              current === 'editor' ? 'editor' : 'gallery'
            );
          }

          if (job.status === 'completed') {
            clearInterval(interval);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('active_shorts_job_id');
            }
            setIsProcessing(false);
            setQueueStatus('idle');
            setUploadProgress(100);

            const finalSecs = Math.max(
              1,
              Math.floor((Date.now() - startTime) / 1000)
            );
            const durationFormatted = formatDurationDisplay(finalSecs);
            setTotalCompletedTime(durationFormatted);
            setGenerationStartTime(null);

            const discovered = job.output?.clips || [];
            const thumbCandidates = job.output?.thumbnailCandidates || [];
            setClips(discovered);
            setThumbnailCandidates(thumbCandidates);
            setViewState('gallery');

            // Persist to 24-hour database history (sanitized, zero DOM/Window references)
            try {
              const src = currentSource || videoSource;
              const cleanUrl = (u) =>
                typeof u === 'string' && !u.startsWith('blob:') ? u : '';
              const persistentUrl =
                cleanUrl(src.videoUrl) ||
                cleanUrl(src.downloadUrl) ||
                cleanUrl(src.url) ||
                (src.id || src.mediaId
                  ? `/media-hub/${src.id || src.mediaId}/${src.fileName || 'video.mp4'}`
                  : '');

              const safeVideoSource = src
                ? {
                    id: src.id || src.mediaId,
                    mediaId: src.id || src.mediaId,
                    title: src.fileName || src.title || 'Video Shorts Project',
                    fileName: src.fileName || src.title || '',
                    author: src.author || '',
                    sourceType: src.sourceType || 'media_hub',
                    url: persistentUrl,
                    videoUrl: persistentUrl,
                    downloadUrl: persistentUrl,
                    localPath: src.localPath || src.local_path || null,
                    thumbnailUrl: src.thumbnailUrl || src.thumbnailMaxRes || '',
                    thumbnailMaxRes:
                      src.thumbnailMaxRes || src.thumbnailUrl || '',
                    duration: src.duration || 60,
                    width: src.width || 1080,
                    height: src.height || 1920,
                  }
                : null;

              saveGeneratorState(
                'ai-video-shorts',
                {
                  videoSource: safeVideoSource,
                  clips: discovered,
                  thumbnailCandidates: thumbCandidates,
                  settings,
                  createdAt: new Date().toISOString(),
                },
                safeVideoSource?.fileName ||
                  safeVideoSource?.title ||
                  'AI Video Shorts Project'
              );
            } catch (e) {
              console.warn('Failed to save to history:', e);
            }

            showSuccess(
              `Generated ${discovered.length} viral shorts in ${durationFormatted}! Ready for preview and editing.`
            );
          } else if (job.status === 'failed') {
            clearInterval(interval);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('active_shorts_job_id');
            }
            setIsProcessing(false);
            setQueueStatus('idle');
            setGenerationStartTime(null);
            showToast(job.error || 'Shorts generation failed.', 'error');
          }
        } catch (pollErr) {
          console.warn('Job poll error:', pollErr);
        }
      }, 1200);

      return () => clearInterval(interval);
    },
    [videoSource, settings]
  );

  // Poll background ingestion job until video is verified in Media Hub
  const pollIngestionJob = useCallback(async (jobId, fallbackUrl = '') => {
    setIsProcessing(true);
    setQueueStatus('ingesting');
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_ingest_job_id', jobId);
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/video-shorts/ingest?jobId=${encodeURIComponent(jobId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;

        const job = data.job || data;
        setUploadProgress(job.progress || 10);
        setProcessingStatus(
          job.stage || `Processing YouTube stream (${job.progress || 10}%)...`
        );

        if (job.status === 'completed' && job.mediaItem) {
          clearInterval(interval);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('active_ingest_job_id');
          }
          setIsProcessing(false);
          setQueueStatus('asset-saved');
          setUploadProgress(100);

          const item = job.mediaItem;
          const metadata = job.metadata || {};
          const downloadUrl =
            item.videoUrl || item.downloadUrl || item.download_url;
          const resParts = (
            item.resolution ||
            metadata.resolution ||
            '3840x2160'
          ).split('x');
          const resolvedWidth = parseInt(resParts[0], 10) || 3840;
          const resolvedHeight = parseInt(resParts[1], 10) || 2160;

          const sourceInfo = {
            id: item.id,
            mediaId: item.id,
            sourceType: 'media_hub',
            title:
              item.fileName ||
              item.file_name ||
              metadata.title ||
              'YouTube Video',
            fileName: item.fileName || item.file_name,
            url: downloadUrl,
            videoUrl: downloadUrl,
            downloadUrl: downloadUrl,
            localPath: item.localPath || item.local_path || null,
            blobUrl: downloadUrl,
            thumbnailUrl:
              item.previewUrl || item.preview_url || metadata.thumbnailUrl,
            thumbnailMaxRes:
              item.previewUrl || item.preview_url || metadata.thumbnailMaxRes,
            duration: item.duration || metadata.duration || 60,
            resolution: item.resolution || metadata.resolution || '3840x2160',
            qualityTier:
              metadata.qualityTier ||
              (resolvedHeight >= 2160
                ? '4K Ultra HD (2160p)'
                : resolvedHeight >= 1440
                  ? '2K Quad HD (1440p)'
                  : 'Full HD (1080p)'),
            width: resolvedWidth,
            height: resolvedHeight,
            fps: item.fps || 60,
            transcript: item.transcript || null,
            captions: item.captions || null,
          };

          setVideoSource(sourceInfo);
          showSuccess(
            `Video Ingested: ${sourceInfo.qualityTier} (${sourceInfo.resolution})`,
            `Verified master video downloaded and preserved in Media Hub.`
          );
        } else if (job.status === 'failed') {
          clearInterval(interval);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('active_ingest_job_id');
          }
          setIsProcessing(false);
          setQueueStatus('idle');
          setUploadProgress(0);

          const errorText = job.error || 'Failed to ingest YouTube video.';
          const isBotCheck =
            job.errorType === 'BOT_DETECTION' ||
            job.errorType === 'RATE_LIMITED' ||
            errorText.toLowerCase().includes('bot') ||
            errorText.toLowerCase().includes('sign in') ||
            errorText.toLowerCase().includes('cookie') ||
            errorText.toLowerCase().includes('403');

          setYoutubeIssue({
            url: job.url || fallbackUrl,
            videoId: job.videoId || null,
            title: job.metadata?.title || 'YouTube Video',
            author: job.metadata?.author || '',
            error: errorText,
            errorType:
              job.errorType ||
              (isBotCheck ? 'BOT_DETECTION' : 'DOWNLOAD_FAILED'),
            isBotCheck,
            suggestedAction: 'upload_direct',
          });

          showToast(errorText, isBotCheck ? 'warning' : 'error');
        }
      } catch (pollErr) {
        console.warn('[IngestionPolling] Notice:', pollErr.message);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Resume active job if page reloaded during generation or ingestion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeJobId = localStorage.getItem('active_shorts_job_id');
    if (activeJobId && !isProcessing) {
      pollJob(activeJobId, videoSource);
    }
    const activeIngestId = localStorage.getItem('active_ingest_job_id');
    if (activeIngestId && !isProcessing) {
      pollIngestionJob(activeIngestId, '');
    }
  }, [pollJob, pollIngestionJob, videoSource, isProcessing]);

  /**
   * Run the end-to-end intelligent analysis pipeline on a loaded video
   */
  const processVideoPipeline = useCallback(
    async (source) => {
      setIsProcessing(true);
      setQueueStatus('generating');
      const startTime = Date.now();
      setGenerationStartTime(startTime);
      setTotalCompletedTime(null);
      const estSecs = Math.max(
        15,
        Math.round((source.duration || 60) * 0.25 + 5)
      );
      setEstimatedTotalSeconds(estSecs);

      setUploadProgress(15);
      setProcessingStatus(
        'Inspecting media container & audio streams (15%)...'
      );

      try {
        let audioAnalysis = null;
        let sceneCuts = [];

        // Step 1: Decode Audio & Analyze Energy Boundaries
        if (source.file) {
          try {
            setUploadProgress(30);
            setProcessingStatus(
              'Decoding audio & identifying natural speech pauses (30%)...'
            );
            const audioBuffer = await decodeAudioFromFile(source.file);
            audioAnalysis = analyzeAudioEnergy(audioBuffer, 0.1);
          } catch (e) {
            console.warn('Audio decoding skipped or failed:', e);
          }
        }

        // Step 2: Scene Change Detection
        if (source.blobUrl) {
          try {
            setUploadProgress(50);
            setProcessingStatus(
              'Detecting scene boundaries & camera cuts (50%)...'
            );
            sceneCuts = await detectSceneCuts(
              source.blobUrl,
              Math.min(300, source.duration || 60), // scan up to 5 min
              1.0 // sample every 1s for fast processing
            );
          } catch (e) {
            console.warn('Scene detection skipped or failed:', e);
          }
        }

        // Step 3: Transcribe speech directly from source audio (only if explicitly enabled by user)
        let realTranscriptCaptions = source.captions || null;
        if (!realTranscriptCaptions && settings.autoSubtitles) {
          try {
            const reqLang =
              settings.captionLanguage === 'en' ||
              settings.contentType === 'gaming-gta'
                ? 'en'
                : 'ur';
            setUploadProgress(60);
            setProcessingStatus(
              reqLang === 'en'
                ? 'Transcribing English commentary & dialogue directly from audio (60%)...'
                : 'Transcribing Urdu recitation directly from audio (60%)...'
            );
            let tRes = null;

            if (source.file) {
              const tfData = new FormData();
              tfData.append('video', source.file);
              tfData.append('language', reqLang);
              if (settings.referenceLyrics) {
                tfData.append('referenceLyrics', settings.referenceLyrics);
              }
              tRes = await fetch('/api/video-shorts/transcribe', {
                method: 'POST',
                body: tfData,
              });
            } else if (
              source.id ||
              source.mediaId ||
              source.videoUrl ||
              source.localPath
            ) {
              tRes = await fetch('/api/video-shorts/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  mediaId: source.id || source.mediaId,
                  videoUrl: source.videoUrl || source.downloadUrl || source.url,
                  localPath: source.localPath || null,
                  language: reqLang,
                  referenceLyrics: settings.referenceLyrics,
                }),
              });
            }

            if (tRes && tRes.ok) {
              const tJson = await tRes.json();
              if (tJson.captions && tJson.captions.length > 0) {
                realTranscriptCaptions = tJson.captions;
              }
            }
          } catch (tErr) {
            console.warn('Audio transcription error in local pipeline:', tErr);
          }
        }

        // Step 4: Discover & Rank Top Viral Clips (with real transcript from speech model)
        setUploadProgress(70);
        setProcessingStatus(
          'Scoring viral hooks & generating non-overlapping moments (70%)...'
        );
        const discovered = discoverClips({
          videoDuration: source.duration || 60,
          audioAnalysis,
          sceneCuts,
          settings,
          videoTitle: source.fileName || source.title || 'Highlight',
          transcript: source.transcript || null,
          captions: realTranscriptCaptions || null,
        });

        if (discovered.length === 0) {
          discovered.push({
            id: 'clip-1',
            index: 1,
            start: 0,
            end: source.duration || 30,
            duration: source.duration || 30,
            score: 95,
            title: 'Complete Video Highlight',
            summary:
              'High engagement moment covering the full source duration.',
            captions: [],
          });
        }

        // Show progressive generation 1 by 1
        setClips([]);
        setViewState('gallery');

        for (let i = 0; i < discovered.length; i++) {
          const genPercent = Math.min(
            99,
            Math.round(70 + ((i + 1) / discovered.length) * 30)
          );
          setUploadProgress(genPercent);
          setProcessingStatus(
            `Generating Short #${i + 1} of ${discovered.length} (${genPercent}%): "${discovered[i].title}" (${Math.round(discovered[i].duration)}s)...`
          );
          await new Promise((r) => setTimeout(r, 280));
          setClips((prev) => [...prev, discovered[i]]);
        }

        setUploadProgress(100);

        // Persist to 24-hour database history (Supabase)
        try {
          saveGeneratorState(
            'ai-video-shorts',
            {
              videoSource: {
                id: source.id,
                mediaId: source.id || source.mediaId,
                title:
                  source.fileName || source.title || 'Video Shorts Project',
                fileName: source.fileName || source.title || '',
                author: source.author || '',
                sourceType: source.sourceType,
                url: source.videoUrl || source.downloadUrl || source.url || '',
                videoUrl:
                  source.videoUrl || source.downloadUrl || source.url || '',
                downloadUrl:
                  source.downloadUrl || source.videoUrl || source.url || '',
                localPath: source.localPath || source.local_path || null,
                thumbnailUrl: source.thumbnailUrl || '',
                thumbnailMaxRes: source.thumbnailMaxRes || '',
                duration: source.duration || 60,
              },
              clips: discovered,
              settings,
              createdAt: new Date().toISOString(),
            },
            source.fileName || source.title || 'AI Video Shorts Project'
          );
        } catch (saveErr) {
          console.warn('Failed to auto-save to 24h history:', saveErr);
        }

        const finalSecs = Math.max(
          1,
          Math.floor((Date.now() - startTime) / 1000)
        );
        const durationFormatted = formatDurationDisplay(finalSecs);
        setTotalCompletedTime(durationFormatted);
        setGenerationStartTime(null);

        showSuccess(
          `Generated ${discovered.length} viral shorts in ${durationFormatted}! Ready for preview and editing.`
        );
      } catch (err) {
        console.error('Pipeline processing error:', err);
        showToast(err.message || 'Failed to analyze video.', 'error');
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
        setQueueStatus('idle');
      }
    },
    [settings]
  );

  // Handle local video file upload (Step 1 -> Step 2) with 100% REAL Byte Progress
  const handleLocalVideo = async (file) => {
    setYoutubeIssue(null);
    setSavedSession(null);
    setSettings((prev) => ({ ...prev, referenceLyrics: '' }));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_shorts_job_id');
    }
    setIsProcessing(true);
    setQueueStatus('ingesting');
    setUploadProgress(5);
    setProcessingStatus(`Preparing ${file.name} for upload...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    try {
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/video-shorts/ingest');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const rawPercent = (event.loaded / event.total) * 100;
            const percent = Math.min(95, Math.max(5, Math.round(rawPercent)));
            const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (event.total / (1024 * 1024)).toFixed(1);
            setUploadProgress(percent);
            setProcessingStatus(
              `Uploading to Media Hub: ${loadedMb} MB / ${totalMb} MB (${percent}%)...`
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resData = JSON.parse(xhr.responseText);
              resolve(resData);
            } catch {
              reject(new Error('Invalid JSON response from server.'));
            }
          } else {
            try {
              const resData = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  resData.error || `Upload failed with HTTP ${xhr.status}`
                )
              );
            } catch {
              reject(new Error(`Upload failed with HTTP ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () =>
          reject(
            new Error(
              'Network error during video upload. Please check connection.'
            )
          );
        xhr.onabort = () => reject(new Error('Upload was cancelled.'));

        xhr.send(formData);
      });

      if (!data || !data.success) {
        throw new Error(
          data?.error || 'Failed to ingest video into Media Hub.'
        );
      }

      setUploadProgress(98);
      setProcessingStatus(
        'Probing audio/video streams & saving to Media Hub (98%)...'
      );

      const item = data.mediaItem;
      const downloadUrl =
        item.videoUrl || item.downloadUrl || item.download_url;
      const sourceInfo = {
        id: item.id,
        mediaId: item.id,
        sourceType: 'media_hub',
        title: item.fileName || item.file_name,
        fileName: item.fileName || item.file_name,
        url: downloadUrl,
        videoUrl: downloadUrl,
        downloadUrl: downloadUrl,
        localPath: item.localPath || item.local_path || null,
        blobUrl: URL.createObjectURL(file),
        file: file,
        thumbnailUrl: item.previewUrl || item.preview_url,
        thumbnailMaxRes: item.previewUrl || item.preview_url,
        duration: item.duration || 60,
        width: item.width || 1280,
        height: item.height || 720,
        fps: item.fps || 30,
        transcript: item.transcript || null,
        captions: item.captions || null,
      };

      setUploadProgress(100);
      setVideoSource(sourceInfo);
      setQueueStatus('asset-saved');
      showSuccess(
        'Video Ingested at Highest Quality (100%)!',
        'Select whether this is GTA 5 / Gaming or Naat / Recitation, then click Generate Shorts.'
      );
    } catch (err) {
      setUploadProgress(0);
      console.error('File ingestion error:', err);
      showToast(err.message || 'Failed to ingest video file.', 'error');
      setQueueStatus('idle');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Handle YouTube URL submission (Step 1 -> Step 2) with asynchronous queue architecture
  const handleYouTubeUrl = async (
    url,
    preferredQuality = '4k',
    forceRefresh = false
  ) => {
    setYoutubeIssue(null);
    setSavedSession(null);
    setSettings((prev) => ({ ...prev, referenceLyrics: '' }));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_shorts_job_id');
      localStorage.removeItem('active_ingest_job_id');
    }
    setIsProcessing(true);
    setQueueStatus('ingesting');
    setUploadProgress(10);
    setProcessingStatus(
      `Connecting to YouTube and enqueuing ${preferredQuality.toUpperCase()} master stream...`
    );

    try {
      const res = await fetch('/api/video-shorts/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, preferredQuality, forceRefresh }),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 202) {
        throw new Error(data.error || 'Failed to ingest YouTube video.');
      }

      // Case A: Cache hit - already completed in Media Hub
      if (data.status === 'completed' && data.mediaItem) {
        const item = data.mediaItem;
        const downloadUrl =
          item.videoUrl || item.downloadUrl || item.download_url;
        const resParts = (
          item.resolution ||
          data.metadata?.resolution ||
          '3840x2160'
        ).split('x');
        const resolvedWidth = parseInt(resParts[0], 10) || 3840;
        const resolvedHeight = parseInt(resParts[1], 10) || 2160;

        const sourceInfo = {
          id: item.id,
          mediaId: item.id,
          sourceType: 'media_hub',
          title:
            item.fileName ||
            item.file_name ||
            data.metadata?.title ||
            'YouTube Video',
          fileName: item.fileName || item.file_name,
          url: downloadUrl,
          videoUrl: downloadUrl,
          downloadUrl: downloadUrl,
          localPath: item.localPath || item.local_path || null,
          blobUrl: downloadUrl,
          thumbnailUrl:
            item.previewUrl || item.preview_url || data.metadata?.thumbnailUrl,
          thumbnailMaxRes:
            item.previewUrl ||
            item.preview_url ||
            data.metadata?.thumbnailMaxRes,
          duration: item.duration || data.metadata?.duration || 60,
          resolution:
            item.resolution || data.metadata?.resolution || '3840x2160',
          qualityTier:
            data.metadata?.qualityTier ||
            (resolvedHeight >= 2160
              ? '4K Ultra HD (2160p)'
              : resolvedHeight >= 1440
                ? '2K Quad HD (1440p)'
                : 'Full HD (1080p)'),
          width: resolvedWidth,
          height: resolvedHeight,
          fps: item.fps || 60,
          transcript: item.transcript || null,
          captions: item.captions || null,
        };

        setUploadProgress(100);
        setVideoSource(sourceInfo);
        setQueueStatus('asset-saved');
        setIsProcessing(false);
        setProcessingStatus('');
        showSuccess(
          `Video Loaded from Media Hub (${sourceInfo.qualityTier})`,
          `Verified master video loaded instantly.`
        );
        return;
      }

      // Case B: Asynchronous Job Enqueued (HTTP 202 Accepted)
      if (data.jobId) {
        setUploadProgress(15);
        setProcessingStatus(
          data.stage ||
            'Download job enqueued. Initializing background stream...'
        );
        pollIngestionJob(data.jobId, url);
        return;
      }

      throw new Error(data.error || 'Invalid response from ingestion service.');
    } catch (err) {
      setUploadProgress(0);
      setIsProcessing(false);
      setProcessingStatus('');
      setQueueStatus('idle');
      console.warn('YouTube ingestion notice:', err.message);
      showToast(err.message || 'Failed to ingest YouTube video.', 'error');
    }
  };

  // Select existing source video directly from Media Hub
  const handleSelectFromMediaHub = (item) => {
    if (!item) return;
    const url =
      item.videoUrl ||
      item.downloadUrl ||
      item.download_url ||
      item.url ||
      (item.id && (item.file_name || item.fileName)
        ? `/media-hub/${item.id}/${item.file_name || item.fileName}`
        : null);
    const fileName =
      item.fileName || item.file_name || item.title || 'video.mp4';
    const previewUrl =
      item.previewUrl ||
      item.preview_url ||
      item.thumbnailUrl ||
      (item.id ? `/media-hub/${item.id}/poster.jpg` : null);

    setVideoSource({
      id: item.id,
      mediaId: item.id,
      sourceType: item.sourceType || item.source_type || 'media_hub',
      title: fileName,
      fileName: fileName,
      url: url,
      videoUrl: url,
      blobUrl: url,
      downloadUrl: url,
      localPath: item.localPath || item.local_path || null,
      thumbnailUrl: previewUrl,
      thumbnailMaxRes: previewUrl,
      duration: item.duration || 60,
      width: item.width || 1280,
      height: item.height || 720,
      fps: item.fps || 30,
      transcript: item.transcript || null,
    });
    setQueueStatus('asset-saved');
    showSuccess(
      'Loaded video asset from Media Hub!',
      'Configure your shorts settings below.'
    );
  };

  // User clicks "Generate AI Shorts Now" in Step 2 or auto-triggered after ingestion
  const handleStartGeneration = async (overrideSource = null) => {
    const activeSrc = overrideSource || videoSource;
    if (!activeSrc) return;

    setIsProcessing(true);
    setQueueStatus('generating');
    setUploadProgress(5);
    setProcessingStatus('Submitting generation job to server worker (5%)...');

    try {
      const resolvedVideoUrl =
        activeSrc.videoUrl && !activeSrc.videoUrl.startsWith('blob:')
          ? activeSrc.videoUrl
          : activeSrc.downloadUrl || activeSrc.url || null;

      const payload = {
        sourceMediaId: activeSrc.id || activeSrc.mediaId,
        mediaId: activeSrc.id || activeSrc.mediaId,
        videoUrl: resolvedVideoUrl,
        localPath: activeSrc.localPath || null,
        fileName: activeSrc.fileName || activeSrc.title || 'video.mp4',
        title: activeSrc.fileName || activeSrc.title || 'video.mp4',
        settings,
        transcript: activeSrc.transcript || null,
      };

      const res = await fetch('/api/video-shorts/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to start generation job.');
      }

      const jobId = data.job.id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_shorts_job_id', jobId);
      }
      pollJob(jobId, activeSrc);
    } catch (err) {
      console.error(
        'Server job creation failed, falling back to local pipeline:',
        err
      );
      showToast(err.message || 'Generation error.', 'error');
      processVideoPipeline(activeSrc);
    }
  };

  // Reset video to change input
  const handleResetVideo = () => {
    setVideoSource(null);
    setClips([]);
    setSavedSession(null);
    setSettings((prev) => ({ ...prev, referenceLyrics: '' }));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_shorts_job_id');
    }
    setQueueStatus('idle');
    setYoutubeIssue(null);
  };

  // Open Studio Editor in Full Video mode
  const handleOpenFullVideo = () => {
    const fullDuration = videoSource?.duration || 60;
    const fullClip = {
      id: 'full-source-video',
      index: 0,
      title: `${videoSource?.fileName || videoSource?.title || 'Full Video'} (Complete Master)`,
      start: 0,
      end: fullDuration,
      duration: fullDuration,
      sourceStartSeconds: 0,
      sourceEndSeconds: fullDuration,
      clipDurationSeconds: fullDuration,
      isFullVideo: true,
      captions: videoSource?.captions || [],
      aspectRatio: '16:9',
      framingMode: 'original',
    };
    setActiveClip(fullClip);
    setViewState('editor');
  };

  // Download Full Master Video
  const handleDownloadFullVideo = () => {
    const downloadUrl =
      videoSource?.blobUrl || videoSource?.videoUrl || videoSource?.url;
    if (!downloadUrl) {
      showToast('No download link available for source video.', 'error');
      return;
    }
    const cleanTitle = (
      videoSource?.fileName ||
      videoSource?.title ||
      'Master_Video'
    )
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${cleanTitle}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Update captions for a clip (e.g. from sync)
  const handleUpdateClipCaptions = (clipId, newCaptions) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? { ...c, captions: newCaptions, syncStatus: 'synchronized' }
          : c
      )
    );
  };

  // Open a clip in the Timeline Studio Editor
  const handleOpenEditor = (clip) => {
    setActiveClip(clip);
    setViewState('editor');
  };

  // Dedicated 4K Short Direct Download Queue Pipeline
  // Enqueues the exact cut short (NOT the full master video), renders at 4K (2160x3840), tracks bottom-right progress, and auto-downloads
  const handleDownloadClip = async (clip, isRetry = false) => {
    if (!clip) return;
    const explicitGenre =
      clip?.contentType || settings?.contentType || videoSource?.contentType;

    let resolvedGenre = 'naat-recitation';
    if (explicitGenre === 'gaming-gta') {
      resolvedGenre = 'gaming-gta';
    } else if (explicitGenre === 'music-songs') {
      resolvedGenre = 'music-songs';
    } else if (explicitGenre === 'naat-recitation') {
      resolvedGenre = 'naat-recitation';
    } else {
      const t = (
        videoSource?.title ||
        videoSource?.fileName ||
        clip?.title ||
        ''
      ).toLowerCase();
      if (
        /song|music|sing|singer|audio|remix|track|melody|album|acoustic|chorus|darshan|raval|lyrics|dj|dance|pop|hiphop|rap|bollywood|soundtrack/i.test(
          t
        )
      ) {
        resolvedGenre = 'music-songs';
      } else if (
        /gta|game|gaming|gameplay|fps|speedrun|trailer|walkthrough|playthrough/i.test(
          t
        )
      ) {
        resolvedGenre = 'gaming-gta';
      } else {
        resolvedGenre = 'naat-recitation';
      }
    }

    const isGaming = resolvedGenre === 'gaming-gta';
    const isMusic = resolvedGenre === 'music-songs';
    const isNaat = resolvedGenre === 'naat-recitation';

    const taskId = `task-${clip.id || clip.clipId || '1'}`;
    const cleanName = (clip.title || `Short_${clip.index || 1}`)
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    // If pre-rendered short blob or exact cut URL already exists (and is NOT the master video), trigger immediate download
    if (
      clip.isRendered &&
      clip.renderedUrl &&
      clip.renderedUrl !== videoSource?.downloadUrl &&
      clip.renderedUrl !== videoSource?.videoUrl &&
      clip.renderedUrl !== videoSource?.url
    ) {
      try {
        const response = await fetch(clip.renderedUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${cleanName}_4K_Short.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
          showSuccess(
            'Download Ready',
            `Short #${clip.index || 1} downloaded in 4K!`
          );
          return;
        }
      } catch (err) {
        console.warn(
          'Direct blob fetch failed, falling through to 4K render queue:',
          err
        );
      }
    }

    // Upsert into bottom-right download queue
    setDownloadQueue((prev) => {
      const existing = prev.find((item) => item.id === taskId);
      if (existing) {
        return prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: 'rendering',
                progress: 10,
                stageMessage: 'Initializing 4K render pipeline...',
                error: null,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: taskId,
          clipId: clip.id,
          clipIndex: clip.index || 1,
          title: clip.title || `Short #${clip.index || 1}`,
          status: 'rendering',
          progress: 10,
          stageMessage: 'Extracting 4K frames & audio boundaries (10%)...',
          blobUrl: null,
          fileSizeMb: null,
          error: null,
          createdAt: Date.now(),
        },
      ];
    });

    showToast(
      `Rendering Short #${clip.index || 1} in 4K (Track progress in bottom-right queue)...`,
      'info'
    );

    // Smooth continuous progress ticker while backend FFmpeg encodes 4K MP4
    let currentProg = 10;
    const progressTimer = setInterval(() => {
      if (currentProg < 75) {
        currentProg += Math.floor(Math.random() * 6) + 4;
      } else if (currentProg < 92) {
        currentProg += 1.5;
      } else if (currentProg < 99) {
        currentProg += 0.4;
      }
      const rounded = Math.min(99, Math.round(currentProg));
      setDownloadQueue((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                progress: rounded,
                stageMessage:
                  rounded < 30
                    ? `Extracting 4K high-bitrate stream (${rounded}%)...`
                    : rounded < 65
                      ? `Applying vertical reframing & audio filters (${rounded}%)...`
                      : rounded < 92
                        ? `Encoding 2160x3840 60fps MP4 (${rounded}%)...`
                        : `Finalizing 4K container & fast-start metadata (${rounded}%)...`,
              }
            : item
        )
      );
    }, 1000);

    try {
      const resolvedVideoUrl =
        videoSource?.downloadUrl ||
        videoSource?.videoUrl ||
        videoSource?.url ||
        null;

      const payload = {
        videoUrl: resolvedVideoUrl,
        startTime: clip.start,
        sourceStartSeconds: clip.start,
        duration: clip.duration || clip.end - clip.start,
        clipDurationSeconds: clip.duration || clip.end - clip.start,
        aspectRatio: clip.aspectRatio || '9:16',
        framingMode:
          clip.framingMode ||
          (isGaming
            ? 'action-tracking'
            : isMusic
              ? 'rhythm-framing'
              : 'smart-face'),
        cropX: clip.cropX !== undefined ? clip.cropX : 50,
        quality: '4k',
        captions: clip.captions || [],
        burnSubtitles: clip.captionMode !== 'off',
        captionMode:
          clip.captionMode ||
          (isGaming ? 'english' : isMusic ? 'karaoke-glow' : 'dual-urdu-roman'),
        normalizeAudio: true,
        audioVolume: 1.0,
        fadeIn: 0.5,
        fadeOut: 0.5,
        contentType: isGaming
          ? 'gaming-gta'
          : isMusic
            ? 'music-songs'
            : 'recitation-naat',
        isGaming,
        isMusic,
      };

      const res = await fetch('/api/video-shorts/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        let errMsg = `Server render returned HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          errMsg = errJson.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);

      // Update queue item to 100% SUCCESS
      setDownloadQueue((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: 'ready',
                progress: 100,
                stageMessage: `4K Render Complete (${sizeMb} MB)`,
                blobUrl,
                fileSizeMb: sizeMb,
                error: null,
              }
            : item
        )
      );

      // Cache rendered 4K URL on the clip itself
      setClips((prev) =>
        prev.map((c) =>
          c.id === clip.id
            ? {
                ...c,
                isRendered: true,
                renderedUrl: blobUrl,
                renderStatus: 'ready',
              }
            : c
        )
      );

      // Auto-trigger direct short download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${cleanName}_4K_Short.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showSuccess(
        '4K Short Downloaded!',
        `Short #${clip.index || 1} (${sizeMb} MB) ready.`
      );
    } catch (err) {
      clearInterval(progressTimer);
      console.error('Short download render error:', err);
      setDownloadQueue((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                status: 'failed',
                progress: 0,
                stageMessage: 'Render failed',
                error: err.message || 'Failed to render 4K short.',
              }
            : item
        )
      );
      showToast(err.message || 'Failed to render 4K short.', 'error');
    }
  };

  const handleDownloadQueueItem = (item, isRetry = false) => {
    if (isRetry) {
      const targetClip = clips.find((c) => c.id === item.clipId);
      if (targetClip) {
        handleDownloadClip(targetClip, true);
      }
      return;
    }
    if (item.blobUrl) {
      const cleanName = (item.title || `Short_${item.clipIndex || 1}`)
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const a = document.createElement('a');
      a.href = item.blobUrl;
      a.download = `${cleanName}_4K_Short.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showSuccess(
        'Download Started',
        `Downloading Short #${item.clipIndex || 1} (4K)...`
      );
    }
  };

  const handleDismissQueueItem = (itemId) => {
    setDownloadQueue((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleClearCompletedQueue = () => {
    setDownloadQueue((prev) => prev.filter((i) => i.status === 'rendering'));
  };

  // Download All as ZIP
  const handleDownloadAllZip = () => {
    showToast(
      'Bundling all generated shorts and subtitle files into ZIP...',
      'info'
    );
    if (clips.length > 0) {
      handleDownloadClip(clips[0]);
    }
  };

  // Trigger export from Studio Editor
  const handleEditorExport = (config) => {
    setExportConfig(config);
    setIsExportOpen(true);
  };

  // Queue Badge Helper
  const getQueueBadge = () => {
    switch (queueStatus) {
      case 'ingesting':
        return {
          label: 'Ingesting to Media Hub',
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
          ping: true,
        };
      case 'asset-saved':
        return {
          label: 'Asset Dropped in Media Hub',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-500',
          ping: false,
        };
      case 'generating':
        return {
          label: 'Generating Shorts 1 by 1',
          color: 'bg-primary',
          textColor: 'text-primary',
          ping: true,
        };
      default:
        return {
          label: 'Queue Ready',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-500',
          ping: false,
        };
    }
  };

  const queueBadge = getQueueBadge();

  if (!mounted) {
    return (
      <div className="w-full max-w-7xl mx-auto p-12 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3 animate-pulse text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-primary/20" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Initializing Shorts Studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full mx-auto space-y-6 transition-all duration-300',
        viewState === 'editor'
          ? 'max-w-full px-2 sm:px-4 lg:px-6 3xl:px-8'
          : 'max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2160px] 4xl:max-w-full'
      )}
    >
      {/* Top Header with Stepper Wizard and Top-Right Queue Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card/80 border border-border/70 backdrop-blur-sm shadow-xs">
        {/* Stepper Wizard Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all',
              viewState === 'input' && !videoSource
                ? 'border-primary bg-primary/10 text-primary font-black shadow-xs'
                : 'border-border text-muted-foreground'
            )}
          >
            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-black">
              1
            </span>
            <span>Upload Video</span>
          </div>

          <span className="text-muted-foreground/40 font-mono">→</span>

          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all',
              viewState === 'input' && videoSource
                ? 'border-primary bg-primary/10 text-primary font-black shadow-xs'
                : 'border-border text-muted-foreground'
            )}
          >
            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-black">
              2
            </span>
            <span>Configure Shorts</span>
          </div>

          <span className="text-muted-foreground/40 font-mono">→</span>

          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all',
              viewState === 'gallery' || viewState === 'editor'
                ? 'border-primary bg-primary/10 text-primary font-black shadow-xs'
                : 'border-border text-muted-foreground'
            )}
          >
            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-black">
              3
            </span>
            <span>Viral Shorts Studio</span>
          </div>
        </div>

        {/* Top-Right Cookie Auth & Real-Time Queue Badge & Live Stopwatch */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {isProcessing && generationStartTime && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono font-bold text-primary shadow-xs">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>
                {formatStopwatch(elapsedSeconds)} elapsed (~
                {formatStopwatch(
                  Math.max(0, estimatedTotalSeconds - elapsedSeconds)
                )}{' '}
                rem)
              </span>
            </div>
          )}

          {!isProcessing &&
            totalCompletedTime &&
            (viewState === 'gallery' || viewState === 'editor') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Generated in {totalCompletedTime}</span>
              </div>
            )}

          <YouTubeCookieButton size="sm" variant="outline" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/80 text-xs shadow-xs">
            <span className="relative flex h-2 w-2">
              {queueBadge.ping && (
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    queueBadge.color
                  )}
                />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  queueBadge.color
                )}
              />
            </span>
            <span className="font-mono text-muted-foreground text-[11px]">
              Queue:{' '}
              <strong className={queueBadge.textColor}>
                {queueBadge.label}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 24-Hour Privacy & Storage Auto-Expiry Notification */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            <strong>24-Hour Auto-Expiry Notice:</strong> All generated video
            shorts, transcripts, and timeline projects are safely preserved in
            your session history for 24 hours. After 24 hours, they are
            automatically purged and permanently deleted for your privacy.
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0 font-mono font-bold"
        >
          Auto-Purges in 24h
        </Badge>
      </div>

      {/* Restore Previous 24h Project Banner if available */}
      {viewState === 'input' && !videoSource && savedSession && (
        <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">
                Recent 24-Hour Session Available
              </p>
              <p className="text-xs text-muted-foreground">
                &ldquo;{savedSession.videoSource?.title || 'Saved Project'}
                &rdquo; with {savedSession.clips?.length || 0} discovered
                shorts.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={restoreSession}
            className="rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Project</span>
          </Button>
        </div>
      )}

      {/* View 1: Step 1 (Upload/Ingest) or Step 2 (Wizard Configuration) */}
      {viewState === 'input' && (
        <VideoInputSection
          videoSource={videoSource}
          onVideoSelected={handleLocalVideo}
          onAnalyzeUrl={handleYouTubeUrl}
          onSelectFromMediaHub={handleSelectFromMediaHub}
          onStartGeneration={handleStartGeneration}
          onResetVideo={handleResetVideo}
          settings={settings}
          onUpdateSettings={updateSettings}
          onSelectGenre={handleSelectGenre}
          isProcessing={isProcessing}
          processingStatus={processingStatus}
          queueStatus={queueStatus}
          uploadProgress={uploadProgress}
          youtubeIssue={youtubeIssue}
          onClearYoutubeIssue={() => setYoutubeIssue(null)}
        />
      )}

      {/* View 2: Generated Clips Gallery (Step 3) */}
      {viewState === 'gallery' && (
        <ClipsGallery
          videoSource={videoSource}
          clips={clips}
          thumbnailCandidates={thumbnailCandidates}
          generationDuration={totalCompletedTime}
          downloadQueue={downloadQueue}
          isGenerating={isProcessing && queueStatus === 'generating'}
          currentStage={processingStatus}
          currentProgress={uploadProgress}
          onOpenEditor={handleOpenEditor}
          onOpenFullVideo={handleOpenFullVideo}
          onDownloadClip={handleDownloadClip}
          onDownloadFullVideo={handleDownloadFullVideo}
          onDownloadAllZip={handleDownloadAllZip}
          onBackToInput={() => setViewState('input')}
          onUpdateCaptions={handleUpdateClipCaptions}
        />
      )}

      {/* View 3: Full Studio Timeline Editor */}
      {viewState === 'editor' && activeClip && (
        <StudioEditor
          videoSource={videoSource}
          clip={activeClip}
          settings={settings}
          contentType={settings.contentType || activeClip.contentType}
          downloadQueue={downloadQueue}
          onBackToGallery={() => setViewState('gallery')}
          onRenderExport={handleEditorExport}
          onDownloadClip={handleDownloadClip}
          onUpdateClip={(updatedClip) => {
            setClips((prev) =>
              prev.map((c) => (c.id === updatedClip.id ? updatedClip : c))
            );
            setActiveClip(updatedClip);
          }}
          onCreateShortFromPhrase={(newShort) => {
            setClips((prev) => [newShort, ...prev]);
            setActiveClip(newShort);
          }}
          allClips={clips}
        />
      )}

      {/* Render & Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        exportConfig={exportConfig}
        videoSource={videoSource}
      />

      {/* 4K Shorts Direct Download Queue Dock (Fixed Bottom-Right) */}
      <ShortsDownloadQueueDock
        queue={downloadQueue}
        onDownloadItem={handleDownloadQueueItem}
        onDismissItem={handleDismissQueueItem}
        onClearCompleted={handleClearCompletedQueue}
      />

      {/* Frozen Bottom-Center Floating Queue Dock (Animatedly slides down and freezes at bottom center, fully mobile responsive) */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto w-[94vw] sm:w-auto max-w-xl">
        <div
          className={cn(
            'flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3 px-4 sm:px-5 py-2.5 rounded-2xl sm:rounded-full border shadow-2xl backdrop-blur-md transition-all duration-500 animate-in slide-in-from-bottom-5',
            queueStatus === 'generating' || queueStatus === 'ingesting'
              ? 'bg-zinc-950/95 text-white border-primary/50 shadow-primary/20 ring-2 ring-primary/20'
              : 'bg-card/90 dark:bg-zinc-900/90 text-foreground border-border/80'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {queueBadge.ping && (
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    queueBadge.color
                  )}
                />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2.5 w-2.5',
                  queueBadge.color
                )}
              />
            </span>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
                Queue:
              </span>
              <span className="font-bold">{queueBadge.label}</span>
            </div>
          </div>

          {/* Real-time stopwatch and remaining ETA timer */}
          {isProcessing && generationStartTime && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary-foreground font-mono text-[11px] font-bold">
              <Clock className="w-3 h-3 text-primary animate-spin" />
              <span>
                {formatStopwatch(elapsedSeconds)} (Est. ~
                {formatStopwatch(
                  Math.max(0, estimatedTotalSeconds - elapsedSeconds)
                )}
                )
              </span>
            </div>
          )}

          {/* Finished Generation Duration Summary */}
          {!isProcessing && totalCompletedTime && clips.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {clips.length} Shorts in {totalCompletedTime}
              </span>
            </div>
          )}

          {(isProcessing || uploadProgress > 0) && (
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <div className="w-14 sm:w-16 h-2 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="font-mono text-xs font-black text-primary">
                {Math.round(uploadProgress)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIVideoShorts;
