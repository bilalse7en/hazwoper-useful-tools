'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Scissors,
  Download,
  FileText,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  FolderArchive,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  Languages,
  Copy,
  ExternalLink,
  ScanFace,
  RefreshCw,
  Film,
  Maximize2,
  Music,
  X,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  captionsToSRT,
  renderCanvasCaptions,
  translateToRomanUrdu,
} from '@/lib/video-shorts/caption-engine';
import { generateShortThumbnail } from '@/lib/video-shorts/thumbnail-generator';
import { generateNaatShortMetadata } from '@/lib/video-shorts/naat-seo';
import { detectActiveSpeakerCentroid } from '@/lib/video-shorts/face-tracker';
import { MultiSpeakerTracker } from '@/lib/video-shorts/speaker-tracker';
import { TranscriptEditorModal } from './transcript-editor-modal';
import { ThumbnailEditorModal } from './thumbnail-editor-modal';
import { showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';

/**
 * Individual Interactive Short Card with In-Place 9:16 Filtered Playback
 * and Unique Auto-Generated AI 9:16 Thumbnail with Spoken Lines
 */
function ClipCardPlayer({
  videoSource,
  clip,
  thumbnailCandidates = [],
  isPlaying,
  isSelected = false,
  downloadQueue = [],
  onSelectClip,
  onTogglePlay,
  onOpenEditor,
  onDownloadClip,
  onDownloadSrt,
  onUpdateCaptions,
}) {
  const [showAllLines, setShowAllLines] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentClipTime, setCurrentClipTime] = useState(0);
  const [aiThumbnail, setAiThumbnail] = useState(null);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);
  const [isThumbModalOpen, setIsThumbModalOpen] = useState(false);
  const [seoModalOpen, setSeoModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const explicitContentType = clip?.contentType || videoSource?.contentType;

  let resolvedGenre = 'naat-recitation';
  if (explicitContentType === 'gaming-gta') {
    resolvedGenre = 'gaming-gta';
  } else if (explicitContentType === 'music-songs') {
    resolvedGenre = 'music-songs';
  } else if (explicitContentType === 'naat-recitation') {
    resolvedGenre = 'naat-recitation';
  } else {
    const titleToCheck = (
      videoSource?.title ||
      videoSource?.fileName ||
      clip?.title ||
      ''
    ).toLowerCase();
    if (
      /song|music|sing|singer|audio|remix|track|melody|album|acoustic|chorus|darshan|raval|lyrics|dj|dance|pop|hiphop|rap|bollywood|soundtrack/i.test(
        titleToCheck
      )
    ) {
      resolvedGenre = 'music-songs';
    } else if (
      /gta|game|gaming|gameplay|fps|speedrun|trailer|walkthrough|playthrough|action stunt/i.test(
        titleToCheck
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

  const [captionMode, setCaptionMode] = useState(
    clip.captionMode || (isGaming ? 'english' : 'dual-urdu-roman')
  );
  const [clipCaptions, setClipCaptions] = useState(clip.captions || []);
  const [syncStatus, setSyncStatus] = useState(
    clip.syncStatus || 'synchronized'
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSpeakerTag, setActiveSpeakerTag] = useState(null);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  const handleOpenFullscreen = (e) => {
    if (e) e.stopPropagation();
    if (isPlaying && onTogglePlay) {
      onTogglePlay();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((v) => {
        try {
          v.pause();
        } catch (_) {}
      });
    }
    setFullscreenPreview(true);
  };

  const handleGenerateSubtitles = async () => {
    setIsGeneratingSubtitles(true);
    try {
      const res = await fetch('/api/video-shorts/sync-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId: clip.id,
          sourceStartSeconds: clip.start,
          sourceEndSeconds: clip.end,
          videoUrl: videoStreamUrl,
          language: isGaming ? 'en' : 'ur',
          contentType: isGaming ? 'gaming-gta' : 'naat-recitation',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate subtitles.');
      }
      const caps = data.captions || [];
      setClipCaptions(caps);
      setSyncStatus('synchronized');
      if (isGaming) {
        setCaptionMode('english');
      }
      if (onUpdateCaptions) {
        onUpdateCaptions(clip.id, caps);
      }
      showSuccess(
        isGaming
          ? 'English Dialogue Subtitles Generated!'
          : 'Urdu & Roman Subtitles Generated!',
        `Generated ${caps.length} authentic subtitles for Short #${clip.index || 1}.`
      );
    } catch (err) {
      console.warn('Subtitle generation error:', err.message);
    } finally {
      setIsGeneratingSubtitles(false);
    }
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraPanXRef = useRef(null);
  const speakerTrackerRef = useRef(null);
  const detectorCanvasRef = useRef(null);
  const frameCounterRef = useRef(0);
  const prevFrameDataRef = useRef(null);
  const [mediaLoadError, setMediaLoadError] = useState(false);

  // If clip was pre-rendered to Full HD 1080x1920 MP4, use its rendered URL directly
  const isRenderedClip = Boolean(
    clip.isRendered && (clip.videoUrl || clip.downloadUrl)
  );

  const candidateMasterUrls = [
    videoSource?.videoUrl,
    videoSource?.downloadUrl,
    videoSource?.url,
    clip?.videoUrl,
    clip?.downloadUrl,
    clip?.url,
  ];
  const nonBlobMaster = candidateMasterUrls.find(
    (u) => u && typeof u === 'string' && !u.startsWith('blob:')
  );

  const resolvedMediaId =
    videoSource?.id ||
    videoSource?.mediaId ||
    clip?.mediaId ||
    clip?.sourceMediaId ||
    (nonBlobMaster && /yt_[a-zA-Z0-9_-]+/.test(nonBlobMaster)
      ? nonBlobMaster.match(/yt_[a-zA-Z0-9_-]+/)[0]
      : null);

  const resolvedFileName =
    videoSource?.fileName ||
    videoSource?.file_name ||
    clip?.fileName ||
    clip?.file_name ||
    'video.mp4';

  const resolvedMasterUrl =
    nonBlobMaster ||
    (resolvedMediaId
      ? `/media-hub/${resolvedMediaId}/${resolvedFileName}`
      : null) ||
    videoSource?.blobUrl ||
    clip?.blobUrl ||
    null;

  const videoStreamUrl = isRenderedClip
    ? clip.videoUrl || clip.downloadUrl
    : resolvedMasterUrl;

  const clipStart = isRenderedClip ? 0 : (clip.start ?? 0);
  const clipEnd = isRenderedClip
    ? clip.duration || Math.max(1, (clip.end ?? 30) - (clip.start ?? 0))
    : (clip.end ?? (clip.start ?? 0) + (clip.duration || 30));

  // Sync Subtitles with Short Audio Handler
  const handleSyncSubtitles = async (e) => {
    if (e) e.stopPropagation();
    setIsSyncing(true);
    try {
      const res = await fetch('/api/video-shorts/sync-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId: clip.id,
          sourceStartSeconds: clip.start,
          sourceEndSeconds: clip.end,
          videoUrl: videoStreamUrl,
          existingCaptions: clipCaptions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sync failed');
      }
      setClipCaptions(data.captions);
      setSyncStatus(data.syncStatus || 'synchronized');
      if (onUpdateCaptions) {
        onUpdateCaptions(clip.id, data.captions);
      }
      showSuccess(
        'Subtitles Synchronized!',
        `Aligned ${data.stats?.wordsCount || 0} words directly to Short #${clip.index}'s audio.`
      );
    } catch (err) {
      console.warn('Sync notice:', err.message);
      showToast(err.message || 'Subtitle sync failed.', 'error');
      setSyncStatus('failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const seoData = generateNaatShortMetadata({
    clip,
    videoTitle: videoSource?.title || 'Naat Sharif',
  });

  const copyToClipboard = async (text, fieldKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2200);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const playPromiseRef = useRef(null);

  // Safe Playback Control for Preview Video (prevents AbortError)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaLoadError) return;

    if (isPlaying) {
      if (video.currentTime < clipStart || video.currentTime >= clipEnd) {
        video.currentTime = clipStart;
      }
      const promise = video.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        promise
          .then(() => {
            playPromiseRef.current = null;
          })
          .catch((err) => {
            playPromiseRef.current = null;
            if (err.name !== 'AbortError') {
              console.warn('Clip preview play aborted:', err);
            }
          });
      }
    } else {
      if (playPromiseRef.current !== null) {
        playPromiseRef.current
          .then(() => {
            if (!video.paused) {
              video.pause();
            }
          })
          .catch(() => {})
          .finally(() => {
            playPromiseRef.current = null;
          });
      } else {
        if (!video.paused) {
          video.pause();
        }
      }
    }
  }, [isPlaying, clipStart, clipEnd, mediaLoadError]);

  // Auto-generate unique AI Thumbnail with hook title, badge, and spoken lines from the clip's peak frame
  useEffect(() => {
    if (aiThumbnail || isGeneratingThumb) return;

    const generateThumb = async () => {
      setIsGeneratingThumb(true);
      try {
        let thumbUrl = null;
        if (
          videoRef.current &&
          (videoSource?.blobUrl || videoSource?.videoUrl)
        ) {
          thumbUrl = await generateShortThumbnail({
            videoElement: videoRef.current,
            timestamp: clip.start + 1.2,
            title: clip.title,
            subline: clip.captions?.[0]?.text || '',
            clipIndex: clip.index,
          });
        } else if (videoSource?.thumbnailUrl || videoSource?.thumbnailMaxRes) {
          thumbUrl = await generateShortThumbnail({
            imageUrl: videoSource.thumbnailMaxRes || videoSource.thumbnailUrl,
            title: clip.title,
            subline: clip.captions?.[0]?.text || '',
            clipIndex: clip.index,
          });
        }
        if (thumbUrl) {
          setAiThumbnail(thumbUrl);
        }
      } catch (e) {
        console.warn('AI thumbnail generation skipped:', e);
      } finally {
        setIsGeneratingThumb(false);
      }
    };

    const video = videoRef.current;
    if (!video) {
      generateThumb();
    } else if (video.readyState >= 2) {
      generateThumb();
    } else {
      video.addEventListener('loadeddata', generateThumb, { once: true });
    }
  }, [videoSource, clip, aiThumbnail, isGeneratingThumb]);

  // ALL USEFUL TOOLS Smart 9:16 Portrait GPU Renderer with Active Speaker Face Tracking & Zero Black Background
  const drawFrame = (timeToDraw) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    const cw = 1080; // True 1080p FHD 9:16 target width
    const ch = 1920; // True 1080p FHD 9:16 target height

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    ctx.clearRect(0, 0, cw, ch);

    const vw = video.videoWidth || 1920;
    const vh = video.videoHeight || 1080;
    const cropW = Math.round(vh * (9 / 16));
    const maxCX = Math.max(0, vw - cropW);

    // 1. ALL USEFUL TOOLS Dynamic Ambient Blurred Background Layer (Guarantees ZERO black borders on any aspect ratio)
    ctx.save();
    ctx.filter = 'blur(28px) brightness(0.65)';
    ctx.drawImage(video, 0, 0, cw, ch);
    ctx.restore();

    // 2. Active Audio-Visual Multi-Speaker Tracking (Sampled every 6 frames for fluid 60fps performance)
    if (!speakerTrackerRef.current) {
      speakerTrackerRef.current = new MultiSpeakerTracker({
        sourceWidth: vw,
        sourceHeight: vh,
      });
    }

    const currTime = timeToDraw !== undefined ? timeToDraw : video.currentTime;
    const elapsed = Math.max(0, currTime - clipStart);

    // If clip was pre-rendered by FFmpeg into a 9:16 vertical Short, render frame directly
    if (isRenderedClip) {
      ctx.drawImage(video, 0, 0, cw, ch);
      setCurrentClipTime(elapsed);
      return;
    }

    const isSpeaking = (clipCaptions || []).some(
      (c) => elapsed >= c.start && elapsed <= c.end
    );

    frameCounterRef.current = (frameCounterRef.current || 0) + 1;
    if (!detectorCanvasRef.current && typeof document !== 'undefined') {
      const dCanvas = document.createElement('canvas');
      dCanvas.width = 160;
      dCanvas.height = 90;
      detectorCanvasRef.current = dCanvas;
    }

    if (
      (frameCounterRef.current % 6 === 0 || frameCounterRef.current === 1) &&
      detectorCanvasRef.current
    ) {
      try {
        const dCanvas = detectorCanvasRef.current;
        const dCtx = dCanvas.getContext('2d', { willReadFrequently: true });
        if (dCtx) {
          dCtx.drawImage(video, 0, 0, 160, 90);
          const imgData = dCtx.getImageData(0, 0, 160, 90);
          const trackerResult = speakerTrackerRef.current.processFrame({
            imageData: imgData,
            currentTime: currTime,
            isAudioSpeaking: isSpeaking,
            audioEnergy: isSpeaking ? 0.8 : 0.2,
          });

          if (trackerResult?.cropX !== undefined) {
            cameraPanXRef.current = trackerResult.cropX;
          }

          if (
            trackerResult?.activeSpeakerId &&
            trackerResult.activeSpeakerId !== activeSpeakerTag
          ) {
            setActiveSpeakerTag(trackerResult.activeSpeakerId);
          }
        }
      } catch (cvErr) {
        // Fallback gracefully if CORS prevents direct pixel access
      }
    }

    // Lock face and speaker strictly in the center of 9:16 portrait video
    // Dynamically uses cameraPanXRef from computer vision face tracking, or centers horizontally
    const detectedCropX =
      cameraPanXRef.current !== null
        ? cameraPanXRef.current
        : Math.round((vw - cropW) / 2);
    const safeCX = Math.max(0, Math.min(maxCX, detectedCropX));
    const zoom = isSpeaking ? 1.04 : 1.0;

    const zoomedW = cropW / zoom;
    const zoomedH = vh / zoom;
    const zoomedX = safeCX + (cropW - zoomedW) / 2;
    const zoomedY = (vh - zoomedH) / 2;

    // 3. Draw Sharp 9:16 Portrait Active Speaker Crop at Full 1080x1920 HD
    ctx.drawImage(video, zoomedX, zoomedY, zoomedW, zoomedH, 0, 0, cw, ch);

    // 5. Render dynamic viral subtitles with active word highlight (Dual Stacked / Urdu Nastaliq / Roman Urdu)
    renderCanvasCaptions(ctx, cw, ch, elapsed, clipCaptions, {
      captionMode,
      captionStyle: 'beast-bold',
      captionFontSize: 52,
      captionPosition: 76,
      bgOpacity: 0.72,
    });

    setCurrentClipTime(elapsed);
  };

  // Draw initial 9:16 portrait poster frame as soon as bucket video is loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setMediaLoadError(false);
      video.currentTime = isRenderedClip ? 0.3 : clip.start + 0.6;
    };

    const handleSeeked = () => {
      drawFrame(video.currentTime);
    };

    if (video.readyState >= 2) {
      handleLoadedData();
    } else {
      video.addEventListener('loadeddata', handleLoadedData, { once: true });
    }
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [clip.start, isRenderedClip]);

  // Continuous animation loop when playing
  useEffect(() => {
    let animId;

    const render = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        drawFrame(video.currentTime);

        // Loop clip within bounds
        if (video.currentTime >= clipEnd) {
          video.currentTime = clipStart;
        }
      }

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(render);
    } else {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        drawFrame(video.currentTime);
      }
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, clipStart, clipEnd, isRenderedClip]);

  const downloadThumbnail = () => {
    if (!aiThumbnail && !videoSource?.thumbnailUrl) return;
    const cleanProjectName = (videoSource?.title || 'Naat_Sharif')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const a = document.createElement('a');
    a.href = aiThumbnail || videoSource.thumbnailUrl;
    a.download = `${cleanProjectName}_Short_${clip.index}_AI_Thumbnail.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, (currentClipTime / (clip.duration || 1)) * 100)
  );

  const isCurrentlyRendering =
    clip.renderStatus === 'rendering' || clip.renderStatus === 'in_progress';
  const isQueued = clip.renderStatus === 'queued';
  const isCompleted =
    clip.isRendered ||
    clip.renderStatus === 'completed' ||
    (!isCurrentlyRendering && !isQueued);

  return (
    <Card
      className={cn(
        'rounded-3xl border overflow-hidden shadow-xl bg-card flex flex-col transition-all duration-300 group h-full justify-between',
        isCurrentlyRendering
          ? 'border-primary ring-2 ring-primary/40 shadow-primary/25 shadow-2xl animate-pulse'
          : isSelected
            ? 'border-primary ring-2 ring-primary/30 shadow-2xl'
            : 'border-border/70 hover:border-primary/50'
      )}
    >
      {/* Top Header Card Selector & Status */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-border/40 bg-muted/20">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="radio"
            name="selectedShortRadio"
            checked={isSelected}
            onChange={() => onSelectClip && onSelectClip(clip.id)}
            className="w-4 h-4 text-primary accent-primary cursor-pointer"
          />
          <span className="font-bold text-xs text-foreground">
            Short #{clip.index}
          </span>
        </label>

        <div className="flex items-center gap-1.5">
          {clip.verseStatusLabel && (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-2 py-0.5 font-bold',
                clip.verseCompleteness === 'uncertain'
                  ? 'text-amber-500 border-amber-500/30 bg-amber-500/5'
                  : 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5'
              )}
            >
              {clip.verseStatusLabel}
            </Badge>
          )}

          {/* 1-by-1 Live Generation Badge on Card */}
          {isCurrentlyRendering ? (
            <Badge className="text-[10px] font-mono px-2 py-0.5 bg-primary text-primary-foreground font-black animate-pulse flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Rendering {clip.renderProgress || 35}%</span>
            </Badge>
          ) : isQueued ? (
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-2 py-0.5 text-amber-500 border-amber-500/30 bg-amber-500/5 font-bold flex items-center gap-1"
            >
              <Clock className="w-3 h-3 animate-pulse" />
              <span>Queued #{clip.index}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-2 py-0.5 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-bold"
            >
              ✓ Ready
            </Badge>
          )}
        </div>
      </div>

      {/* 9:16 Portrait Player Container with Controlled Max Height */}
      <div
        onClick={onTogglePlay}
        className="relative aspect-[9/16] w-full max-h-[380px] sm:max-h-[420px] max-w-[260px] mx-auto bg-zinc-950 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer select-none group border border-border/40 shadow-inner"
      >
        {/* Offscreen Bucket Video Element for GPU frame decoding */}
        {videoStreamUrl && (
          <video
            ref={videoRef}
            src={videoStreamUrl}
            crossOrigin={
              videoStreamUrl.startsWith('blob:') ? undefined : 'anonymous'
            }
            playsInline
            preload="auto"
            muted={isMuted}
            onError={() => {
              setMediaLoadError(true);
            }}
            onLoadedData={() => {
              setMediaLoadError(false);
            }}
            className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1"
          />
        )}

        {/* Guaranteed 9:16 Portrait Canvas */}
        <canvas ref={canvasRef} className="w-full h-full object-cover" />

        {/* In-Progress or Queued Card Display (Renders cards progressively 1 by 1) */}
        {(isCurrentlyRendering || isQueued) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-zinc-950/95 text-center select-none space-y-3">
            {isCurrentlyRendering ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_25px_rgba(var(--primary-rgb),0.35)] animate-pulse">
                  <Sparkles className="w-7 h-7 text-primary animate-spin" />
                </div>
                <div className="w-full px-2">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="font-bold text-foreground">
                      Rendering Short #{clip.index}
                    </span>
                    <span className="font-black text-primary">
                      {clip.renderProgress || 35}%
                    </span>
                  </div>
                  {/* Dynamic Progress Bar On Card */}
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-border/50">
                    <div
                      className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${clip.renderProgress || 35}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 max-w-[200px] mx-auto leading-relaxed">
                    {clip.renderStage ||
                      'Cutting 9:16 vertical crop & burning subtitles...'}
                  </p>
                </div>
                <Badge className="bg-primary/15 text-primary border-primary/40 text-[9px] font-mono font-bold animate-pulse">
                  ⚡ 1-by-1 Live Generation
                </Badge>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-border/60 flex items-center justify-center text-muted-foreground">
                  <Clock className="w-6 h-6 text-muted-foreground animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground">
                    Short #{clip.index} Queued
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-[180px] leading-relaxed">
                    Waiting in line... Starts automatically after Short #
                    {clip.index - 1} finishes.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-zinc-900 text-muted-foreground border-border/50 text-[9px] font-mono"
                >
                  ⏳ Position #{clip.index} in Line
                </Badge>
              </>
            )}
          </div>
        )}

        {/* Media Missing or Unreachable Error Overlay */}
        {mediaLoadError &&
          clip.renderStatus !== 'in_progress' &&
          clip.renderStatus !== 'rendering' &&
          clip.renderStatus !== 'queued' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-zinc-950/92 text-center select-none">
              <Film className="w-10 h-10 text-amber-500 mb-2 opacity-85" />
              <p className="text-xs font-bold text-foreground">
                Preview Unavailable
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
                Video source stream could not be loaded from storage.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 text-[11px] h-7 bg-card hover:bg-muted font-bold pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaLoadError(false);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Stream
              </Button>
            </div>
          )}

        {/* Paused Cinematic Overlay with Play Button & Metadata Badges */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none p-3 z-10">
            {/* Top Badges */}
            <div className="w-full flex items-start justify-between">
              <div className="bg-primary/95 text-primary-foreground px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>★ SHORT #{clip.index}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {clip.categoryName ? (
                  <Badge className="bg-purple-600/90 text-white text-[10px] font-bold flex items-center gap-1 border-0 shadow-sm">
                    <span>
                      {clip.categoryIcon || '🎮'}{' '}
                      {clip.categoryBadge || clip.categoryName}
                    </span>
                  </Badge>
                ) : isMusic ? (
                  <Badge className="bg-pink-600/90 text-white text-[10px] font-bold flex items-center gap-1 border-0 shadow-sm">
                    <Music className="w-3 h-3" />
                    <span>🎵 Song Hook</span>
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1 border-0 shadow-sm">
                    <ScanFace className="w-3 h-3" />
                    <span>🕌 Sacred Verse</span>
                  </Badge>
                )}

                <Badge
                  className={cn(
                    'text-xs font-mono font-bold shadow-md border',
                    clip.score >= 90
                      ? 'bg-emerald-500/95 text-white border-emerald-400'
                      : 'bg-amber-500/95 text-white border-amber-400'
                  )}
                >
                  ★ {clip.score}% Viral
                </Badge>

                {/* Fullscreen Preview Icon on Thumbnail */}
                <button
                  type="button"
                  onClick={handleOpenFullscreen}
                  className="p-1 rounded-lg bg-black/60 border border-white/20 text-white hover:text-primary transition-colors cursor-pointer"
                  title="Watch in Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Center Play Button & Hook Indicator */}
            <div className="flex flex-col items-center text-center px-4 space-y-2 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-primary/95 text-primary-foreground flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  ALL USEFUL TOOLS Smart Pan • Zero Black Bars
                </span>
              </div>
            </div>

            {/* Clean Timing Bar on Initial Thumbnail (Zero Black Opacity Caption Pill) */}
            <div className="w-full p-1 flex items-center justify-between text-[11px] font-mono text-white/90 px-1">
              <span className="bg-black/70 px-2 py-0.5 rounded-md border border-white/10">
                {formatSeconds(clip.start)} - {formatSeconds(clip.end)}
              </span>
              <span className="text-white/80 font-bold bg-black/70 px-2 py-0.5 rounded-md border border-white/10">
                {Math.round(clip.duration)}s
              </span>
            </div>
          </div>
        )}

        {/* Controls Overlay when Playing */}
        {isPlaying && (
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 z-20">
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-white text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>

              <span className="font-mono text-[11px]">
                {formatSeconds(clip.start + currentClipTime)} /{' '}
                {formatSeconds(clip.end)}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenFullscreen}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  title="Watch Short in Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Content & Lines Preview */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-primary font-mono uppercase tracking-wider">
              Short #{clip.index}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {clip.captions?.length || 0} Spoken Lines
            </span>
          </div>

          <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2 min-h-[2.5rem]">
            {clip.title}
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2rem]">
            {clip.reason || clip.explanation || clip.summary}
          </p>

          {/* GTA / Gameplay Score Breakdown */}
          {clip.motionScore !== undefined && (
            <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[9px] text-center font-mono">
              <div title="Gameplay motion intensity & action speed">
                <span className="text-muted-foreground block text-[8px] uppercase font-sans">
                  Motion
                </span>
                <span className="font-bold text-amber-500">
                  {Math.round(clip.motionScore)}%
                </span>
              </div>
              <div title="Audio transient, impact, explosion & crash acoustics">
                <span className="text-muted-foreground block text-[8px] uppercase font-sans">
                  Audio
                </span>
                <span className="font-bold text-primary">
                  {Math.round(clip.audioScore || 50)}%
                </span>
              </div>
              <div title="Multimodal AI event detection confidence">
                <span className="text-muted-foreground block text-[8px] uppercase font-sans">
                  Confidence
                </span>
                <span className="font-bold text-emerald-500">
                  {Math.round(clip.confidence || clip.score)}%
                </span>
              </div>
            </div>
          )}

          {/* Transparent ALL USEFUL TOOLS Quality Score Breakdown */}
          {clip.breakdown && (
            <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/40 text-[9px] text-center font-mono">
              <div title="Vocal hook strength in first 3 seconds">
                <span className="text-muted-foreground block text-[8px] uppercase font-sans">
                  Hook
                </span>
                <span className="font-bold text-amber-500">
                  {clip.breakdown.hookScore}%
                </span>
              </div>
              <div title="Speech density and continuous vocal cadence">
                <span className="text-muted-foreground block text-[8px] uppercase font-sans">
                  Cadence
                </span>
                <span className="font-bold text-primary">
                  {clip.breakdown.densityScore}%
                </span>
              </div>
              <div title="Complete recitation stanzas preserved without truncation">
                <span className="text-muted-foreground block text-[8px] uppercase font-sans">
                  Stanzas
                </span>
                <span className="font-bold text-emerald-500">
                  {clip.breakdown.completenessScore}%
                </span>
              </div>
              <div title="Visual cuts & dynamic subject framing">
                <span className="text-muted-foreground block text-[8px] uppercase font-sans">
                  Visual
                </span>
                <span className="font-bold text-indigo-400">
                  {clip.breakdown.visualScore}%
                </span>
              </div>
            </div>
          )}

          {/* Spoken Lines / Transcript Box with Mode Selector & Edit Button */}
          {clipCaptions && clipCaptions.length > 0 && (
            <div className="pt-1 space-y-2">
              {/* Caption Mode Switcher */}
              <div className="flex items-center justify-between gap-1 p-1 bg-muted/30 rounded-xl border border-border/40 text-[10px]">
                {isGaming ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('english')}
                      className={cn(
                        'flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer truncate',
                        captionMode === 'english'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Dynamic Word-by-Word English Highlight"
                    >
                      English (Viral)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('english-clean')}
                      className={cn(
                        'flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer truncate',
                        captionMode === 'english-clean'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Clean Minimal English Subtitles"
                    >
                      English (Clean)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('off')}
                      className={cn(
                        'py-1 px-2 rounded-lg font-bold transition-all cursor-pointer truncate',
                        captionMode === 'off'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Subtitles Off"
                    >
                      Off
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('dual-urdu-roman')}
                      className={cn(
                        'flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer truncate',
                        captionMode === 'dual-urdu-roman'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Urdu Nastaliq top line, Roman Urdu bottom line"
                    >
                      Dual Stacked
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('roman-urdu')}
                      className={cn(
                        'flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer truncate',
                        captionMode === 'roman-urdu'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Roman Urdu only"
                    >
                      Roman Urdu
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('urdu')}
                      className={cn(
                        'flex-1 py-1 px-1.5 rounded-lg font-bold transition-all cursor-pointer truncate',
                        captionMode === 'urdu'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      title="Urdu Nastaliq only"
                    >
                      اردو نستعلیق
                    </button>
                  </>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1 border-b border-border/30">
                  <div className="flex items-center gap-1.5">
                    <span>
                      {isGaming
                        ? 'Dialogue & Action Lines'
                        : 'Spoken Script & Lines'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTranscriptModalOpen(true)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                      title={
                        isGaming
                          ? 'Edit English words and timestamps'
                          : 'Edit Urdu words, Roman spelling, and timestamps'
                      }
                    >
                      <Languages className="w-3 h-3" />
                      <span>Edit Script</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAllLines(!showAllLines)}
                    className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{showAllLines ? 'Show Less' : 'View All'}</span>
                    {showAllLines ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div
                  className={cn(
                    'space-y-1 overflow-hidden transition-all',
                    showAllLines ? 'max-h-48 overflow-y-auto pr-1' : 'max-h-14'
                  )}
                >
                  {clipCaptions.map((cap, cIdx) => (
                    <div
                      key={cap.id || cIdx}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = clip.start + cap.start;
                          if (!isPlaying) onTogglePlay();
                        }
                      }}
                      className={cn(
                        'text-muted-foreground leading-relaxed p-1 rounded-lg transition-colors',
                        'hover:bg-primary/10 hover:text-foreground cursor-pointer flex items-baseline justify-between gap-2'
                      )}
                      title={`Jump to ${formatSeconds(clip.start + cap.start)}`}
                    >
                      <div className="font-mono text-xs truncate">
                        <span className="text-primary/80 font-semibold mr-1.5 text-[10px]">
                          [{formatSeconds(clip.start + cap.start)}]
                        </span>
                        <span>
                          &ldquo;
                          {isGaming
                            ? cap.textEnglish || cap.text
                            : cap.textRoman || cap.text}
                          &rdquo;
                        </span>
                      </div>
                      {!isGaming && cap.textUrdu && (
                        <span className="font-serif text-right text-[11px] opacity-80 shrink-0 text-emerald-400">
                          {cap.textUrdu}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Transcript Editor Modal */}
              <TranscriptEditorModal
                isOpen={isTranscriptModalOpen}
                onClose={() => setIsTranscriptModalOpen(false)}
                clip={{ ...clip, captions: clipCaptions }}
                onSaveCaptions={(newCaps) => {
                  setClipCaptions(newCaps);
                }}
              />
            </div>
          )}

          {(!clipCaptions || clipCaptions.length === 0) && (
            <div className="pt-1">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Languages className="w-3.5 h-3.5 text-primary" />
                    <span>Subtitles: Off</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {isGaming
                      ? 'Generate dynamic English commentary & dialogue subtitles for this short.'
                      : 'Generate authentic Urdu Nastaliq & Roman Urdu subtitles for this short.'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerateSubtitles}
                  disabled={isGeneratingSubtitles}
                  className="w-full sm:w-auto rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-8 shadow-xs"
                >
                  {isGeneratingSubtitles ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transcribing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Subtitles</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          {clipCaptions && clipCaptions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncSubtitles}
              disabled={isSyncing}
              className={cn(
                'w-full text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 h-8.5 transition-all shadow-xs',
                syncStatus === 'synchronized'
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15'
                  : 'border-primary/50 text-primary bg-primary/5 hover:bg-primary/15 font-black'
              )}
              title={
                isGaming
                  ? "Re-align this short's English dialogue with audio"
                  : "Extract this short's exact audio slice and re-align Urdu captions"
              }
            >
              <RefreshCw
                className={cn(
                  'w-3.5 h-3.5 shrink-0',
                  isSyncing && 'animate-spin text-primary'
                )}
              />
              <span>
                {isSyncing
                  ? isGaming
                    ? 'Aligning English Dialogue...'
                    : 'Aligning Urdu Speech & Audio...'
                  : syncStatus === 'synchronized'
                    ? isGaming
                      ? '✓ English Dialogue Synchronized'
                      : '✓ Urdu Captions Synchronized with Audio'
                    : isGaming
                      ? 'SYNC ENGLISH DIALOGUE WITH AUDIO'
                      : 'SYNC URDU CAPTIONS WITH AUDIO'}
              </span>
            </Button>
          )}

          <Button
            onClick={() => {
              if (onSelectClip) onSelectClip(clip.id);
              onOpenEditor({ ...clip, captions: clipCaptions, captionMode });
            }}
            size="sm"
            className="w-full font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Edit Short #{clip.index}</span>
          </Button>

          <div className="grid grid-cols-3 gap-1.5">
            {(() => {
              const queueItem = downloadQueue.find((i) => i.clipId === clip.id);
              const isRendering = queueItem && queueItem.status === 'rendering';
              const isReady = queueItem && queueItem.status === 'ready';

              return (
                <Button
                  variant={isReady ? 'default' : 'outline'}
                  size="sm"
                  disabled={isRendering}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadClip({
                      ...clip,
                      captions: clipCaptions,
                      captionMode,
                    });
                  }}
                  className={cn(
                    'w-full text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 px-1.5 transition-all',
                    isReady &&
                      'bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-0 shadow-sm',
                    isRendering &&
                      'border-primary/40 bg-primary/10 text-primary font-bold cursor-not-allowed'
                  )}
                  title="Direct 4K UHD download with burned-in captions"
                >
                  {isRendering ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                      <span className="truncate">
                        {Math.round(queueItem.progress)}%
                      </span>
                    </>
                  ) : isReady ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="truncate">4K Ready</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">4K Short</span>
                    </>
                  )}
                </Button>
              );
            })()}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsThumbModalOpen(true);
              }}
              className="w-full text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 px-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/30"
              title="Create & Edit 9:16 or 16:9 Thumbnail"
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">AI Cover</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadSrt(clip);
              }}
              className="w-full text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 px-1.5"
              title="Download Subtitles (.SRT)"
            >
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">SRT</span>
            </Button>
          </div>

          {/* YouTube Viral SEO & Posting Package Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSeoModalOpen(true)}
            className="w-full text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {isGaming
                ? '🚀 YouTube SEO & Viral Details (Gaming)'
                : '🚀 YouTube SEO & Viral Details (Roman Urdu)'}
            </span>
          </Button>

          {/* YouTube Viral SEO Modal Dialog */}
          <Dialog open={seoModalOpen} onOpenChange={setSeoModalOpen}>
            <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
              <DialogHeader className="space-y-1.5 text-left border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 text-xs font-bold">
                    {isGaming ? '🎮 Gaming SEO (Global)' : '🇵🇰 Roman Urdu SEO'}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    Short #{clip.index}
                  </span>
                </div>
                <DialogTitle className="text-lg font-black text-foreground">
                  YouTube Viral Posting Details &amp; Metadata
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isGaming
                    ? 'Pre-optimized for high CTR, viral discovery, and YouTube / TikTok gaming recommendations worldwide.'
                    : 'Pre-optimized for high CTR and retention in Pakistan, India, and Bangladesh. 100% compliant with YouTube guidelines.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* 1. Viral Short Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span>1. YouTube Short Title</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({seoData.title.length}/100 chars)
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => copyToClipboard(seoData.title, 'title')}
                      className="h-7 px-2 text-xs font-bold text-primary hover:bg-primary/10 gap-1 rounded-lg cursor-pointer"
                    >
                      {copiedField === 'title' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Title</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 font-semibold text-foreground select-all break-words">
                    {seoData.title}
                  </div>
                </div>

                {/* 2. SEO Description with Durood & CTA */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      2. High-Retention Description (with Durood &amp; CTA)
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(seoData.description, 'description')
                      }
                      className="h-7 px-2 text-xs font-bold text-primary hover:bg-primary/10 gap-1 rounded-lg cursor-pointer"
                    >
                      {copiedField === 'description' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Description</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="p-3 rounded-xl bg-muted/60 border border-border/60 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap select-all max-h-36 overflow-y-auto leading-relaxed">
                    {seoData.description}
                  </pre>
                </div>

                {/* 3. Viral Hashtags */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      3. Hashtags for Shorts Feed
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(seoData.hashtags, 'hashtags')
                      }
                      className="h-7 px-2 text-xs font-bold text-primary hover:bg-primary/10 gap-1 rounded-lg cursor-pointer"
                    >
                      {copiedField === 'hashtags' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Hashtags</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 font-mono text-sky-500 select-all break-words">
                    {seoData.hashtags}
                  </div>
                </div>

                {/* 4. Comma-separated YouTube Studio Tags */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      4. YouTube Studio Tags (Comma-Separated)
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => copyToClipboard(seoData.tags, 'tags')}
                      className="h-7 px-2 text-xs font-bold text-primary hover:bg-primary/10 gap-1 rounded-lg cursor-pointer"
                    >
                      {copiedField === 'tags' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Tags</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 font-mono text-[11px] text-muted-foreground select-all break-words max-h-24 overflow-y-auto">
                    {seoData.tags}
                  </div>
                </div>

                {/* Full Package Copy Button */}
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      const fullPackage = `=== TITLE ===\n${seoData.title}\n\n=== DESCRIPTION ===\n${seoData.description}\n\n=== TAGS ===\n${seoData.tags}`;
                      copyToClipboard(fullPackage, 'all');
                    }}
                    className="w-full font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  >
                    {copiedField === 'all' ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>All Details Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Complete YouTube Package (1-Click)</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Cover & High-Retention Thumbnail Modal */}
          <ThumbnailEditorModal
            isOpen={isThumbModalOpen}
            onClose={() => setIsThumbModalOpen(false)}
            candidateFrames={thumbnailCandidates || []}
            initialFrameUrl={aiThumbnail}
            isGaming={isGaming}
            contentType={isGaming ? 'gaming-gta' : 'naat-recitation'}
            clipTitle={
              clip.title || (isGaming ? 'GTA 6 Stunt & Action' : 'Naat Sharif')
            }
            clipSubline={
              isGaming
                ? clip.captions?.[0]?.textEnglish ||
                  clip.captions?.[0]?.text ||
                  clip.categoryName ||
                  'High-Speed Action'
                : clip.primaryVerse ||
                  clip.captions?.[0]?.textUrdu ||
                  clip.captions?.[0]?.textRoman ||
                  clip.captions?.[0]?.text ||
                  ''
            }
            onSaveThumbnail={(dataUrl) => {
              setAiThumbnail(dataUrl);
            }}
          />
        </div>
      </div>

      {/* 9:16 Fullscreen Shorts Preview Modal */}
      {fullscreenPreview && (
        <Dialog open={fullscreenPreview} onOpenChange={setFullscreenPreview}>
          <DialogContent className="max-w-md w-full h-[90vh] p-4 bg-black/95 border-white/20 text-white rounded-3xl flex flex-col justify-between items-center shadow-2xl backdrop-blur-2xl">
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-primary/20 text-primary px-2.5 py-0.5 rounded-full border border-primary/30">
                  Short #{clip.index}
                </span>
                <span className="text-xs text-white/70 font-mono">
                  {Math.round(clip.duration)}s • {clip.score}% Viral
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFullscreenPreview(false)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative w-full h-[75vh] aspect-[9/16] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/20 my-auto">
              {clip?.categoryName && (
                <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/40 text-white text-xs font-bold shadow-lg pointer-events-none">
                  <span>{clip.categoryIcon || '🎮'}</span>
                  <span className="text-purple-300 uppercase tracking-wider text-[10px] font-black">
                    {clip.categoryBadge || clip.categoryName}
                  </span>
                </div>
              )}
              {videoStreamUrl && (
                <video
                  src={videoStreamUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  onLoadedMetadata={(e) => {
                    e.currentTarget.currentTime = clip.start;
                  }}
                />
              )}
            </div>

            <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
              <span className="font-mono text-white/70">
                {formatSeconds(clip.start)} - {formatSeconds(clip.end)}
              </span>
              <Button
                size="sm"
                onClick={() => {
                  setFullscreenPreview(false);
                  onDownloadClip({
                    ...clip,
                    captions: clipCaptions,
                    captionMode,
                  });
                }}
                className="h-8 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>Download Short</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

export function ClipsGallery({
  videoSource,
  clips = [],
  thumbnailCandidates = [],
  generationDuration = null,
  downloadQueue = [],
  isGenerating = false,
  currentStage = '',
  currentProgress = 0,
  onOpenEditor,
  onOpenFullVideo,
  onDownloadClip,
  onDownloadFullVideo,
  onDownloadAllZip,
  onBackToInput,
  onUpdateCaptions,
}) {
  const [activePlayingId, setActivePlayingId] = useState(null);
  const [selectedClipId, setSelectedClipId] = useState(clips[0]?.id || null);
  const isGamingOverall =
    clips.some(
      (c) =>
        c.isGaming ||
        c.contentType === 'gaming-gta' ||
        c.captionMode === 'english' ||
        Boolean(c.category)
    ) ||
    videoSource?.contentType === 'gaming-gta' ||
    /gta|game|gaming/i.test(videoSource?.fileName || '') ||
    /gta|game|gaming/i.test(videoSource?.title || '');

  const isDefaultEnglish =
    isGamingOverall || clips[0]?.captionMode === 'english';
  const [captionLang, setCaptionLang] = useState(
    isDefaultEnglish ? 'en' : 'urdu'
  ); // 'urdu' | 'roman-urdu' | 'en'
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [confirmedClips, setConfirmedClips] = useState({});

  useEffect(() => {
    if (!selectedClipId && clips.length > 0) {
      setSelectedClipId(clips[0]?.id);
    }
    if (isGamingOverall) {
      setCaptionLang('en');
    }
  }, [clips, selectedClipId, isGamingOverall]);

  const formatSeconds = (sec) => {
    const s = Math.max(0, sec || 0);
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Map clips with dynamic language translation
  const displayClips = clips.map((clip) => {
    if (captionLang === 'roman-urdu') {
      return {
        ...clip,
        title: clip.title,
        captions: (clip.captions || []).map((c) => ({
          ...c,
          text: c.textRoman || translateToRomanUrdu(c.text),
        })),
      };
    } else if (captionLang === 'urdu') {
      return {
        ...clip,
        title: clip.primaryVerse || clip.title,
        captions: (clip.captions || []).map((c) => ({
          ...c,
          text: c.textUrdu || c.text,
        })),
      };
    } else if (captionLang === 'en') {
      return {
        ...clip,
        title: clip.title,
        captions: (clip.captions || []).map((c) => ({
          ...c,
          text: c.textEnglish || c.text || '',
        })),
      };
    }
    return clip;
  });

  const selectedClip =
    displayClips.find((c) => c.id === selectedClipId) || displayClips[0];

  const handleSelectClip = (id) => {
    setSelectedClipId(id);
    const idx = displayClips.findIndex((c) => c.id === id);
    if (idx !== -1) setActiveReviewIndex(idx);
  };

  const downloadSrtFile = (clip) => {
    const cleanProjectName = (videoSource?.title || 'Naat_Sharif')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const srtContent = captionsToSRT(clip.captions);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanProjectName}_Short_${clip.index}_Subtitles_${captionLang}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTogglePlay = (id) => {
    setActivePlayingId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Gallery Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-3xl border border-border/70 bg-card/80 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToInput}
            className="rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>New Video</span>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-foreground">
                Discovered {clips.length} Short Moments
              </h2>
              {generationDuration && (
                <Badge className="bg-emerald-600/90 text-white font-mono text-[10px] font-bold shadow-xs border-0">
                  ⚡ Generated in {generationDuration}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-primary border-primary/30 text-[10px]"
              >
                Trending AI Filter Ready
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Source:{' '}
              <span className="font-semibold text-foreground">
                {videoSource?.fileName || videoSource?.title || 'Video'}
              </span>{' '}
              ({Math.round(videoSource?.duration || 0)}s)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Mode B: Full Video Mode Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenFullVideo && onOpenFullVideo()}
            className="rounded-xl font-bold cursor-pointer flex items-center gap-1.5 border-dashed border-primary/50 text-foreground hover:bg-primary/5"
            title="Open the complete original video in Timeline Studio to create custom phrases"
          >
            <Film className="w-4 h-4 text-primary" />
            <span>Open Full Video Mode</span>
          </Button>

          {/* Mode A: Edit Selected Short Action */}
          <Button
            size="sm"
            disabled={!selectedClip}
            onClick={() => selectedClip && onOpenEditor(selectedClip)}
            className="rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            title={`Open Short #${selectedClip?.index || 1} in the Studio Editor`}
          >
            <Scissors className="w-4 h-4" />
            <span>Edit Selected Short #{selectedClip?.index || 1}</span>
          </Button>

          {/* Subtitle Language Switcher */}
          {isGamingOverall ? (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-xl border border-primary/30 text-xs font-bold">
              <span>🎮 English Gaming Dialogue Active</span>
            </div>
          ) : (
            <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border/60 shadow-xs">
              <button
                type="button"
                onClick={() => setCaptionLang('urdu')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  captionLang === 'urdu'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>🇵🇰 اردو نستعلیق</span>
                <span className="text-[10px] opacity-80">(Urdu)</span>
              </button>
              <button
                type="button"
                onClick={() => setCaptionLang('roman-urdu')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                  captionLang === 'roman-urdu'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>Roman Urdu</span>
              </button>
              <button
                type="button"
                onClick={() => setCaptionLang('en')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  captionLang === 'en'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>English</span>
              </button>
            </div>
          )}

          {onDownloadFullVideo && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadFullVideo}
              className="font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Full MP4</span>
            </Button>
          )}

          <Button
            onClick={onDownloadAllZip}
            className="font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
          >
            <FolderArchive className="w-4 h-4" />
            <span>Download All ZIP</span>
          </Button>
        </div>
      </div>

      {/* 1-by-1 Live Generation In-Progress Banner */}
      {(isGenerating ||
        displayClips.some(
          (c) => c.renderStatus === 'rendering' || c.renderStatus === 'queued'
        )) && (
        <div className="p-4 rounded-3xl border border-primary/40 bg-gradient-to-r from-primary/15 via-indigo-500/10 to-primary/5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/50 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
              <Sparkles className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-foreground">
                  ⚡ Generating Shorts 1-by-1
                </span>
                <Badge className="bg-primary text-primary-foreground text-[10px] font-mono font-black animate-pulse">
                  Rendering Live
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentStage ||
                  `Currently rendering Short #${
                    displayClips.find((c) => c.renderStatus === 'rendering')
                      ?.index || 1
                  } of ${displayClips.length}. Ready shorts are playable immediately!`}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-72 flex flex-col gap-1.5 shrink-0 bg-background/60 p-3 rounded-2xl border border-border/50">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground font-semibold">
                Total Queue Progress
              </span>
              <span className="font-black text-primary">
                {currentProgress || 45}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-border/40">
              <div
                className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${currentProgress || 45}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactive Phrase Boundary Review & Confirmation for All Clips */}
      {displayClips.length > 0 && (
        <div className="p-5 rounded-3xl border border-primary/30 bg-card/90 backdrop-blur-md shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              <h3 className="font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>
                  {isGamingOverall
                    ? 'Action Sequence Verification: Review Your Shorts'
                    : 'Phrase Boundary Verification: Perfect Your Shorts'}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {isGamingOverall
                  ? 'Each Short is bounded to complete, high-intensity gameplay moments. Verify timestamps and English dialogue before 4K export.'
                  : 'Each Short is bounded to full poetic verses. Verify each Short sequentially to ensure the recitation is 100% complete and synchronized.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {displayClips.map((c, idx) => (
                <button
                  key={c.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveReviewIndex(idx);
                    handleSelectClip(c.id);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    activeReviewIndex === idx
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {confirmedClips[idx] ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                  )}
                  <span>Short #{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Short Review Card */}
          {displayClips[activeReviewIndex] && (
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold font-mono">
                    Short #{activeReviewIndex + 1}:{' '}
                    {formatSeconds(displayClips[activeReviewIndex].start)} –{' '}
                    {formatSeconds(displayClips[activeReviewIndex].end)} (
                    {Math.round(displayClips[activeReviewIndex].duration)}s)
                  </Badge>
                  {displayClips[activeReviewIndex].verseStatusLabel && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold"
                    >
                      {displayClips[activeReviewIndex].verseStatusLabel}
                    </Badge>
                  )}
                  {confirmedClips[activeReviewIndex] ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                      ✓ Confirmed Perfect
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px]"
                    >
                      Needs Confirmation
                    </Badge>
                  )}
                </div>
                {isGamingOverall ? (
                  <>
                    <p className="text-xs sm:text-sm font-bold text-foreground">
                      Action Hook: &ldquo;
                      {displayClips[activeReviewIndex].captions?.[0]
                        ?.textEnglish ||
                        displayClips[activeReviewIndex].captions?.[0]?.text ||
                        displayClips[activeReviewIndex].primaryVerse ||
                        displayClips[activeReviewIndex].title}
                      &rdquo;
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Moment Title: &ldquo;
                      {displayClips[activeReviewIndex].title ||
                        'High Octane Action'}
                      &rdquo; •{' '}
                      {displayClips[activeReviewIndex].captions?.length || 0}{' '}
                      dialogue &amp; commentary cues with dynamic 4K framing.
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className="text-xs sm:text-sm font-bold text-foreground font-urdu"
                      dir="rtl"
                    >
                      پہلا شعر: &ldquo;
                      {displayClips[activeReviewIndex].captions?.[0]
                        ?.textUrdu ||
                        displayClips[activeReviewIndex].captions?.[0]?.text ||
                        displayClips[activeReviewIndex].primaryVerse ||
                        displayClips[activeReviewIndex].title}
                      &rdquo;
                    </p>
                    <p
                      className="text-[11px] text-muted-foreground font-urdu"
                      dir="rtl"
                    >
                      آخری شعر: &ldquo;
                      {displayClips[activeReviewIndex].captions?.[
                        displayClips[activeReviewIndex].captions.length - 1
                      ]?.textUrdu ||
                        displayClips[activeReviewIndex].captions?.[
                          displayClips[activeReviewIndex].captions.length - 1
                        ]?.text ||
                        'مکمل قافیہ و ردیف'}
                      &rdquo; • مشتمل بر{' '}
                      {displayClips[activeReviewIndex].captions?.length || 0}{' '}
                      کلمات بغیر کسی لفظ کی کٹوتی کے۔
                    </p>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleTogglePlay(displayClips[activeReviewIndex].id)
                  }
                  className="rounded-xl text-xs font-bold gap-1 cursor-pointer h-9"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {activePlayingId === displayClips[activeReviewIndex].id
                      ? 'Pause'
                      : 'Preview'}
                  </span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const activeClipToSync = displayClips[activeReviewIndex];
                    if (!activeClipToSync) return;
                    fetch('/api/video-shorts/sync-captions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        clipId: activeClipToSync.id,
                        sourceStartSeconds: activeClipToSync.start,
                        sourceEndSeconds: activeClipToSync.end,
                        videoUrl:
                          videoSource?.blobUrl ||
                          videoSource?.videoUrl ||
                          videoSource?.url,
                        language: isGamingOverall ? 'en' : 'ur',
                        contentType: isGamingOverall
                          ? 'gaming-gta'
                          : 'naat-recitation',
                        existingCaptions: activeClipToSync.captions,
                      }),
                    })
                      .then((r) => r.json())
                      .then((data) => {
                        if (data.success && onUpdateCaptions) {
                          onUpdateCaptions(activeClipToSync.id, data.captions);
                          showSuccess(
                            isGamingOverall
                              ? 'English Dialogue Synchronized!'
                              : 'Urdu Captions Synchronized!',
                            `Aligned ${data.stats?.wordsCount || 0} words directly to Short #${activeReviewIndex + 1}'s audio.`
                          );
                        }
                      })
                      .catch((err) => showToast(err.message, 'error'));
                  }}
                  className="rounded-xl text-xs font-bold gap-1 cursor-pointer h-9 border-primary/40 text-primary hover:bg-primary/10"
                  title={
                    isGamingOverall
                      ? "Re-align this Short's English dialogue with audio"
                      : "Re-align this Short's Urdu captions directly against its audio"
                  }
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {isGamingOverall
                      ? 'Sync English Dialogue'
                      : 'Sync Urdu Captions'}
                  </span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setConfirmedClips((prev) => ({
                      ...prev,
                      [activeReviewIndex]: true,
                    }));
                    showSuccess(
                      `Short #${activeReviewIndex + 1} Confirmed!`,
                      `Timestamps ${formatSeconds(displayClips[activeReviewIndex].start)} to ${formatSeconds(displayClips[activeReviewIndex].end)} verified.`
                    );
                    if (activeReviewIndex < displayClips.length - 1) {
                      setActiveReviewIndex(activeReviewIndex + 1);
                      handleSelectClip(displayClips[activeReviewIndex + 1].id);
                    }
                  }}
                  className={cn(
                    'rounded-xl text-xs font-bold gap-1.5 cursor-pointer h-9',
                    confirmedClips[activeReviewIndex]
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {confirmedClips[activeReviewIndex]
                      ? 'Confirmed Perfect'
                      : `Confirm Short #${activeReviewIndex + 1}`}
                  </span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onOpenEditor(displayClips[activeReviewIndex])}
                  className="rounded-xl text-xs font-bold gap-1 cursor-pointer h-9"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Adjust in Studio</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid of Generated Clips with Controlled Responsive Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-5 sm:gap-6">
        {displayClips.map((clip) => (
          <ClipCardPlayer
            key={`${clip.id}-${captionLang}`}
            videoSource={videoSource}
            clip={clip}
            thumbnailCandidates={thumbnailCandidates}
            isPlaying={activePlayingId === clip.id}
            isSelected={clip.id === (selectedClip?.id || selectedClipId)}
            onSelectClip={handleSelectClip}
            onTogglePlay={() => handleTogglePlay(clip.id)}
            onOpenEditor={onOpenEditor}
            onDownloadClip={onDownloadClip}
            onDownloadSrt={downloadSrtFile}
            onUpdateCaptions={onUpdateCaptions}
          />
        ))}
      </div>
    </div>
  );
}
