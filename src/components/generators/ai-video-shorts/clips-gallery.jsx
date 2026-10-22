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
  const [captionMode, setCaptionMode] = useState(clip.captionMode || 'urdu'); // 'urdu' | 'dual-urdu-roman' | 'roman-urdu'
  const [clipCaptions, setClipCaptions] = useState(clip.captions || []);
  const [syncStatus, setSyncStatus] = useState(
    clip.syncStatus || 'synchronized'
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSpeakerTag, setActiveSpeakerTag] = useState(null);

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
  const videoStreamUrl = isRenderedClip
    ? clip.videoUrl || clip.downloadUrl
    : videoSource?.blobUrl || videoSource?.videoUrl || null;

  const clipStart = isRenderedClip ? 0 : clip.start;
  const clipEnd = isRenderedClip
    ? clip.duration || Math.max(1, clip.end - clip.start)
    : clip.end;

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

  // CapCut Smart 9:16 Portrait GPU Renderer with Active Speaker Face Tracking & Zero Black Background
  const drawFrame = (timeToDraw) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    const cw = 405; // 9:16 target width
    const ch = 720; // 9:16 target height

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    ctx.clearRect(0, 0, cw, ch);

    const vw = video.videoWidth || 1920;
    const vh = video.videoHeight || 1080;
    const cropW = Math.round(vh * (9 / 16));
    const maxCX = Math.max(0, vw - cropW);

    // 1. CapCut Dynamic Ambient Blurred Background Layer (Guarantees ZERO black borders on any aspect ratio)
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

    // Lock face and speaker strictly in the exact center of 9:16 portrait video
    // Prevents face from wandering to left or right or hiding from video
    const centerX = Math.round((vw - cropW) / 2);
    const safeCX = Math.max(0, Math.min(maxCX, centerX));
    const zoom = isSpeaking ? 1.04 : 1.0;

    const zoomedW = cropW / zoom;
    const zoomedH = vh / zoom;
    const zoomedX = safeCX + (cropW - zoomedW) / 2;
    const zoomedY = (vh - zoomedH) / 2;

    // 3. Draw Sharp 9:16 Portrait Active Speaker Crop
    ctx.drawImage(video, zoomedX, zoomedY, zoomedW, zoomedH, 0, 0, cw, ch);

    // 5. Render dynamic viral subtitles with active word highlight (Dual Stacked / Urdu Nastaliq / Roman Urdu)
    renderCanvasCaptions(ctx, cw, ch, elapsed, clipCaptions, {
      captionMode,
      captionStyle: 'beast-bold',
      captionFontSize: 24,
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

  return (
    <Card
      className={cn(
        'rounded-3xl border overflow-hidden shadow-xl bg-card flex flex-col transition-all duration-200 group h-full justify-between',
        isSelected
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
            Select Short #{clip.index}
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
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-mono px-2 py-0.5 font-bold',
              syncStatus === 'synchronized'
                ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
            )}
          >
            {syncStatus === 'synchronized' ? '✓ Synced' : 'Sync Needed'}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] font-mono px-1.5 py-0.5 text-muted-foreground border-border/60"
          >
            {clip.renderStatus || 'Ready'}
          </Badge>
        </div>
      </div>

      {/* 9:16 Portrait Player Container with CapCut Face Tracking & Zero Black Background */}
      <div
        onClick={onTogglePlay}
        className="relative aspect-[9/16] w-full bg-zinc-950 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer select-none group border border-border/40 shadow-inner"
      >
        {/* Offscreen Bucket Video Element for GPU frame decoding */}
        {videoStreamUrl && (
          <video
            ref={videoRef}
            src={videoStreamUrl}
            crossOrigin="anonymous"
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

        {/* Guaranteed 9:16 Portrait Canvas (Decoded directly from downloaded bucket video with CapCut Smart Pan) */}
        <canvas ref={canvasRef} className="w-full h-full object-cover" />

        {/* Media Missing or Unreachable Error Overlay */}
        {mediaLoadError && (
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
                <Badge className="bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1 border-0 shadow-sm">
                  <ScanFace className="w-3 h-3" />
                  <span>Face Centered (9:16)</span>
                </Badge>

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
              </div>
            </div>

            {/* Center Play Button & Hook Indicator */}
            <div className="flex flex-col items-center text-center px-4 space-y-2 pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-primary/95 text-primary-foreground flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1" />
              </div>
              <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  CapCut Smart Pan • Zero Black Bars
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
                onClick={onTogglePlay}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>

              <span className="font-mono text-[11px]">
                {formatSeconds(clip.start + currentClipTime)} /{' '}
                {formatSeconds(clip.end)}
              </span>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
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
            {clip.explanation || clip.summary}
          </p>

          {/* Transparent OpusClip Quality Score Breakdown */}
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
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-1 border-b border-border/30">
                  <div className="flex items-center gap-1.5">
                    <span>Spoken Script &amp; Lines</span>
                    <button
                      type="button"
                      onClick={() => setIsTranscriptModalOpen(true)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                      title="Edit Urdu words, Roman spelling, and timestamps"
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
                        <span>&ldquo;{cap.textRoman || cap.text}&rdquo;</span>
                      </div>
                      {cap.textUrdu && (
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
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          {/* Prominent Sync Subtitles with Short Audio Button */}
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
            title="Extract this short's exact audio slice and re-align Urdu captions"
          >
            <RefreshCw
              className={cn(
                'w-3.5 h-3.5 shrink-0',
                isSyncing && 'animate-spin text-primary'
              )}
            />
            <span>
              {isSyncing
                ? 'Aligning Urdu Speech & Audio...'
                : syncStatus === 'synchronized'
                  ? '✓ Urdu Captions Synchronized with Audio'
                  : 'SYNC URDU CAPTIONS WITH AUDIO'}
            </span>
          </Button>

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
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadClip({
                  ...clip,
                  captions: clipCaptions,
                  captionMode,
                });
              }}
              className="w-full text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 px-1.5"
              title="Download MP4 video with burned-in captions"
            >
              <Download className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">MP4</span>
            </Button>
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
            <span>🚀 YouTube SEO &amp; Viral Details (Roman Urdu)</span>
          </Button>

          {/* YouTube Viral SEO Modal Dialog */}
          <Dialog open={seoModalOpen} onOpenChange={setSeoModalOpen}>
            <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
              <DialogHeader className="space-y-1.5 text-left border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 text-xs font-bold">
                    🇵🇰 Roman Urdu SEO
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    Short #{clip.index}
                  </span>
                </div>
                <DialogTitle className="text-lg font-black text-foreground">
                  YouTube Viral Posting Details &amp; Metadata
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Pre-optimized for high CTR and retention in Pakistan, India,
                  and Bangladesh. 100% compliant with YouTube guidelines.
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
            clipTitle={clip.title || 'Naat Sharif'}
            clipSubline={
              clip.primaryVerse ||
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
    </Card>
  );
}

export function ClipsGallery({
  videoSource,
  clips = [],
  thumbnailCandidates = [],
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
  const [captionLang, setCaptionLang] = useState('urdu'); // 'urdu' | 'roman-urdu' | 'en'
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [confirmedClips, setConfirmedClips] = useState({});

  useEffect(() => {
    if (!selectedClipId && clips.length > 0) {
      setSelectedClipId(clips[0]?.id);
    }
  }, [clips, selectedClipId]);

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
            <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
              <span>Discovered {clips.length} Short Moments</span>
              <Badge
                variant="outline"
                className="text-primary border-primary/30"
              >
                Trending AI Filter Ready
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
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

          {/* Urdu / Roman Urdu / English Switcher */}
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

      {/* Interactive Phrase Boundary Review & Confirmation for All Clips */}
      {displayClips.length > 0 && (
        <div className="p-5 rounded-3xl border border-primary/30 bg-card/90 backdrop-blur-md shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              <h3 className="font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Phrase Boundary Verification: Perfect Your Shorts</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Each Short is bounded to full poetic verses. Verify each Short
                sequentially to ensure the recitation is 100% complete and
                synchronized.
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
                <p
                  className="text-xs sm:text-sm font-bold text-foreground font-urdu"
                  dir="rtl"
                >
                  پہلا شعر: &ldquo;
                  {displayClips[activeReviewIndex].captions?.[0]?.textUrdu ||
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
                  {displayClips[activeReviewIndex].captions?.length || 0} کلمات
                  بغیر کسی لفظ کی کٹوتی کے۔
                </p>
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
                        existingCaptions: activeClipToSync.captions,
                      }),
                    })
                      .then((r) => r.json())
                      .then((data) => {
                        if (data.success && onUpdateCaptions) {
                          onUpdateCaptions(activeClipToSync.id, data.captions);
                          showSuccess(
                            'Urdu Captions Synchronized!',
                            `Aligned ${data.stats?.wordsCount || 0} words directly to Short #${activeReviewIndex + 1}'s audio.`
                          );
                        }
                      })
                      .catch((err) => showToast(err.message, 'error'));
                  }}
                  className="rounded-xl text-xs font-bold gap-1 cursor-pointer h-9 border-primary/40 text-primary hover:bg-primary/10"
                  title="Re-align this Short's Urdu captions directly against its audio"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Urdu Captions</span>
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

      {/* Grid of Generated Clips with Interactive In-Card Players & AI Cover Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
