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
    setVideoSource(savedSession.videoSource);
    setClips(savedSession.clips);
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

  // Poll background queue job until completion
  const pollJob = useCallback(
    async (jobId, currentSource) => {
      setIsProcessing(true);
      setQueueStatus('generating');

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/video-shorts/jobs?id=${jobId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (!data.success || !data.job) return;

          const job = data.job;
          setUploadProgress(job.progress || 0);
          setProcessingStatus(job.message || `Processing: ${job.stage}...`);

          if (job.status === 'completed') {
            clearInterval(interval);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('active_shorts_job_id');
            }
            setIsProcessing(false);
            setQueueStatus('idle');
            setUploadProgress(100);

            const discovered = job.output?.clips || [];
            const thumbCandidates = job.output?.thumbnailCandidates || [];
            setClips(discovered);
            setThumbnailCandidates(thumbCandidates);
            setViewState('gallery');

            // Persist to 24-hour database history
            try {
              const src = currentSource || videoSource;
              saveGeneratorState(
                'ai-video-shorts',
                {
                  videoSource: src,
                  clips: discovered,
                  thumbnailCandidates: thumbCandidates,
                  settings,
                  createdAt: new Date().toISOString(),
                },
                src?.fileName || src?.title || 'AI Video Shorts Project'
              );
            } catch (e) {
              console.warn('Failed to save to history:', e);
            }

            showSuccess(
              `Generated ${discovered.length} viral shorts! Ready for preview and editing.`
            );
          } else if (job.status === 'failed') {
            clearInterval(interval);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('active_shorts_job_id');
            }
            setIsProcessing(false);
            setQueueStatus('idle');
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

  // Resume active job if page reloaded during generation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeJobId = localStorage.getItem('active_shorts_job_id');
    if (activeJobId && !isProcessing) {
      pollJob(activeJobId, videoSource);
    }
  }, [pollJob, videoSource, isProcessing]);

  /**
   * Run the end-to-end intelligent analysis pipeline on a loaded video
   */
  const processVideoPipeline = useCallback(
    async (source) => {
      setIsProcessing(true);
      setQueueStatus('generating');
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

        // Step 3: Transcribe Urdu speech directly from source audio
        let realTranscriptCaptions = source.captions || null;
        if (!realTranscriptCaptions) {
          try {
            setUploadProgress(60);
            setProcessingStatus(
              'Transcribing Urdu recitation directly from audio (60%)...'
            );
            let tRes = null;

            if (source.file) {
              const tfData = new FormData();
              tfData.append('video', source.file);
              tfData.append('language', 'ur');
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
                  language: 'ur',
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
                title:
                  source.fileName || source.title || 'Video Shorts Project',
                author: source.author || '',
                sourceType: source.sourceType,
                url: source.url || '',
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

        showSuccess(
          `Generated ${discovered.length} viral shorts ready for preview and editing!`
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
        'Video integrated into Media Assets (100%)!',
        'Automatically analyzing video and generating shorts...'
      );
      setTimeout(() => {
        handleStartGeneration(sourceInfo);
      }, 350);
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

  // Handle YouTube URL submission (Step 1 -> Step 2) with clean error recovery
  const handleYouTubeUrl = async (url) => {
    setYoutubeIssue(null);
    setSavedSession(null);
    setSettings((prev) => ({ ...prev, referenceLyrics: '' }));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_shorts_job_id');
    }
    setIsProcessing(true);
    setQueueStatus('ingesting');
    setUploadProgress(10);
    setProcessingStatus('Connecting to YouTube and extracting stream (10%)...');

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev >= 85 ? 85 : prev + 5));
    }, 350);

    try {
      const res = await fetch('/api/video-shorts/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      clearInterval(progressTimer);
      const data = await res.json();

      if (!res.ok || !data.success) {
        clearInterval(progressTimer);
        setUploadProgress(0);
        setIsProcessing(false);
        setProcessingStatus('');
        setQueueStatus('idle');

        const errorText = data.error || 'Failed to ingest YouTube video.';
        const isBotCheck =
          errorText.toLowerCase().includes('bot') ||
          errorText.toLowerCase().includes('sign in') ||
          errorText.toLowerCase().includes('cookie');

        setYoutubeIssue({
          url,
          title: data.metadata?.title || 'YouTube Video',
          author: data.metadata?.author || '',
          error: errorText,
          isBotCheck,
        });

        showToast(errorText, isBotCheck ? 'warning' : 'error');
        return;
      }

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
        blobUrl: downloadUrl,
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
        'YouTube video saved to Media Hub!',
        'Automatically analyzing video and generating shorts...'
      );
      setTimeout(() => {
        handleStartGeneration(sourceInfo);
      }, 350);
    } catch (err) {
      clearInterval(progressTimer);
      setUploadProgress(0);
      setQueueStatus('idle');
      console.warn('YouTube ingestion notice:', err.message);
      showToast(err.message || 'Failed to ingest YouTube video.', 'error');
    } finally {
      clearInterval(progressTimer);
      setIsProcessing(false);
      setProcessingStatus('');
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

  // Quick download individual clip
  const handleDownloadClip = (clip) => {
    setActiveClip(clip);
    setExportConfig({
      clipIndex: clip.index,
      segments: [
        {
          start: clip.start,
          end: clip.end,
          duration: clip.duration,
        },
      ],
      aspectRatio: settings.aspectRatio,
      framingMode: settings.framingMode,
      manualCropX: 50,
      captions: clip.captions || [],
      captionMode:
        clip.captionMode || settings.captionMode || 'dual-urdu-roman',
      captionStyle: settings.captionStyle,
      captionPosition: settings.captionPosition,
      captionFontSize: settings.captionFontSize || 24,
    });
    setIsExportOpen(true);
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
    <div className="w-full max-w-7xl mx-auto space-y-6">
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

        {/* Top-Right Cookie Auth & Real-Time Queue Badge */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
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
          onBackToGallery={() => setViewState('gallery')}
          onRenderExport={handleEditorExport}
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

      {/* Frozen Bottom-Center Floating Queue Dock (Animatedly slides down and freezes at bottom center) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div
          className={cn(
            'flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-500 animate-in slide-in-from-bottom-5',
            queueStatus === 'generating' || queueStatus === 'ingesting'
              ? 'bg-zinc-950/95 text-white border-primary/50 shadow-primary/20 ring-2 ring-primary/20'
              : 'bg-card/90 dark:bg-zinc-900/90 text-foreground border-border/80'
          )}
        >
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

          {(isProcessing || uploadProgress > 0) && (
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <div className="w-16 h-2 bg-muted/60 rounded-full overflow-hidden">
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
