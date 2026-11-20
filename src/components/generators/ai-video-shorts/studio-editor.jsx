'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Download,
  ArrowLeft,
  Smartphone,
  Laptop,
  Square,
  Volume2,
  VolumeX,
  Type,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  Layers,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Film,
  Music,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  BookOpen,
  RefreshCw,
  Languages,
  Maximize2,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  renderCanvasCaptions,
  captionsToSRT,
  captionsToVTT,
} from '@/lib/video-shorts/caption-engine';
import {
  ASPECT_RATIOS,
  CAPTION_STYLES,
  CAPTION_MODES,
  GAMING_CAPTION_MODES,
  MUSIC_CAPTION_MODES,
  FRAMING_MODES,
} from '@/lib/video-shorts/types';
import { IslamicStockGalleryModal } from './islamic-stock-gallery-modal';
import { ThumbnailEditorModal } from './thumbnail-editor-modal';
import { TranscriptEditorModal } from './transcript-editor-modal';
import { showToast, showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';

// Format Timecode Helper (mm:ss.cs)
const formatTimecode = (sec) => {
  const s = Math.max(0, sec || 0);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
};

export function StudioEditor({
  videoSource,
  clip,
  onBackToGallery,
  onRenderExport,
  onUpdateClip,
  onCreateShortFromPhrase,
  onDownloadClip,
  downloadQueue = [],
  allClips = [],
  settings = {},
  contentType,
}) {
  const explicitContentType =
    clip?.contentType ||
    settings?.contentType ||
    contentType ||
    videoSource?.contentType;

  let resolvedGenre = 'naat-recitation';
  if (explicitContentType === 'gaming-gta') {
    resolvedGenre = 'gaming-gta';
  } else if (explicitContentType === 'music-songs') {
    resolvedGenre = 'music-songs';
  } else if (explicitContentType === 'naat-recitation') {
    resolvedGenre = 'naat-recitation';
  } else {
    // Infer strictly from title when no explicit contentType is set
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

  // Mode A: 'short' (editing specific short) vs Mode B: 'full_video' (scrubbing full master video)
  const [editorMode, setEditorMode] = useState(
    clip?.isFullVideo ? 'full_video' : 'short'
  ); // 'short' | 'full_video'

  // Current short project state
  const [currentClip, setCurrentClip] = useState(clip);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Timeline Segments State
  const [segments, setSegments] = useState([
    {
      id: `seg-${clip.id || '1'}`,
      sourceId: videoSource.id,
      fileName:
        videoSource.fileName ||
        (isGaming
          ? 'Gameplay Source'
          : isMusic
            ? 'Music Track'
            : 'Recitation Source'),
      start: clip.start,
      end: clip.end,
      duration: clip.duration || clip.end - clip.start,
      isStock: false,
      cropX: null,
    },
  ]);

  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(clip.start);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0); // 0.5 to 2.5
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [aspectRatio, setAspectRatio] = useState(
    clip?.aspectRatio || (clip?.isFullVideo ? '16:9' : '9:16')
  );
  const [framingMode, setFramingMode] = useState(
    clip.framingMode ||
      (isGaming
        ? 'action-tracking'
        : isMusic
          ? 'rhythm-framing'
          : 'trending-ai-speaker')
  );
  const [manualCropX, setManualCropX] = useState(50); // 0 to 100%

  // Stream URL with robust fallback and dead-blob protection across both videoSource and clip
  const candidateUrls = [
    videoSource?.videoUrl,
    videoSource?.downloadUrl,
    videoSource?.url,
    clip?.videoUrl,
    clip?.downloadUrl,
    clip?.url,
  ];
  const nonBlobUrl = candidateUrls.find(
    (u) => u && typeof u === 'string' && !u.startsWith('blob:')
  );

  const resolvedMediaId =
    videoSource?.id ||
    videoSource?.mediaId ||
    clip?.mediaId ||
    clip?.sourceMediaId ||
    (nonBlobUrl && /yt_[a-zA-Z0-9_-]+/.test(nonBlobUrl)
      ? nonBlobUrl.match(/yt_[a-zA-Z0-9_-]+/)[0]
      : null);

  const resolvedFileName =
    videoSource?.fileName ||
    videoSource?.file_name ||
    clip?.fileName ||
    clip?.file_name ||
    'video.mp4';

  const videoStreamUrl =
    nonBlobUrl ||
    (resolvedMediaId
      ? `/media-hub/${resolvedMediaId}/${resolvedFileName}`
      : null) ||
    videoSource?.blobUrl ||
    clip?.blobUrl ||
    null;

  // Audio Settings
  const [audioVolume, setAudioVolume] = useState(1.0);
  const [fadeIn, setFadeIn] = useState(0.4);
  const [fadeOut, setFadeOut] = useState(0.6);
  const [normalizeAudio, setNormalizeAudio] = useState(true);

  // Captions State & Styling (Subtitles OFF by default unless user requests them)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [captions, setCaptions] = useState(clip.captions || []);
  const [captionMode, setCaptionMode] = useState(
    clip.captionMode || (isGaming ? 'english' : 'dual-urdu-roman')
  );
  const [captionStyle, setCaptionStyle] = useState('beast-bold');
  const [captionFontSize, setCaptionFontSize] = useState(24);
  const [captionPosition, setCaptionPosition] = useState(76); // percent from top
  const [bgOpacity, setBgOpacity] = useState(0.72);
  const [isSyncingCaptions, setIsSyncingCaptions] = useState(false);
  const [isThumbModalOpen, setIsThumbModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const fsCanvasRef = useRef(null);

  const closeFullscreenPreview = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    if (brollVideoRef.current && !brollVideoRef.current.paused) {
      brollVideoRef.current.pause();
    }
    setIsPlaying(false);
    setIsFullscreenPreview(false);
  };

  // Keyboard shortcut listener ('c' toggles subtitles, 'Escape' exits fullscreen)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName))
        return;
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setSubtitlesEnabled((prev) => !prev);
        showToast(
          `Subtitles ${!subtitlesEnabled ? 'Enabled' : 'Disabled'}`,
          'info'
        );
      } else if (e.key === 'Escape' && isFullscreenPreview) {
        closeFullscreenPreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subtitlesEnabled, isFullscreenPreview]);

  // Re-align selected Short's speech transcript with its exact audio slice
  const handleSyncCaptions = async () => {
    setIsSyncingCaptions(true);
    try {
      const sourceStartSeconds = segments[0]?.start ?? clip.start ?? 0;
      const sourceEndSeconds =
        segments[segments.length - 1]?.end ??
        clip.end ??
        sourceStartSeconds + 30;
      const res = await fetch('/api/video-shorts/sync-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId: clip.id,
          sourceStartSeconds,
          sourceEndSeconds,
          mediaId:
            resolvedMediaId ||
            videoSource?.id ||
            videoSource?.mediaId ||
            clip?.mediaId ||
            clip?.sourceMediaId ||
            null,
          sourceMediaId:
            resolvedMediaId ||
            videoSource?.mediaId ||
            videoSource?.id ||
            clip?.sourceMediaId ||
            clip?.mediaId ||
            null,
          localPath:
            videoSource?.localPath ||
            videoSource?.local_path ||
            clip?.localPath ||
            null,
          videoUrl:
            videoStreamUrl ||
            clip?.videoUrl ||
            clip?.downloadUrl ||
            videoSource?.downloadUrl ||
            videoSource?.url ||
            null,
          existingCaptions: captions,
          language: isGaming ? 'en' : isMusic ? 'en' : 'ur',
          contentType: isGaming
            ? 'gaming-gta'
            : isMusic
              ? 'music-songs'
              : 'naat-recitation',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync captions with audio.');
      }
      setCaptions(data.captions);
      setSubtitlesEnabled(true);
      if (isGaming) {
        setCaptionMode('english');
      } else if (isMusic) {
        setCaptionMode('karaoke-glow');
      }
      pushHistory({ segments, captions: data.captions });
      setHasUnsavedChanges(true);
      if (onUpdateClip) {
        onUpdateClip({
          ...currentClip,
          captions: data.captions,
          syncStatus: 'synchronized',
        });
      }
      showSuccess(
        isGaming
          ? 'English Dialogue Subtitles Generated!'
          : isMusic
            ? 'Song Lyrics Synchronized to Beat!'
            : 'Urdu & Roman Subtitles Generated!',
        `Generated and aligned ${data.captions?.length || 0} subtitles directly to Short #${clip.index || 1}'s audio.`
      );
    } catch (err) {
      console.warn('Sync error:', err.message);
      showToast(err.message || 'Failed to sync subtitles.', 'error');
    } finally {
      setIsSyncingCaptions(false);
    }
  };

  // Phrase Selection State
  const [selectedPhraseIds, setSelectedPhraseIds] = useState([]);
  const [availablePhrases, setAvailablePhrases] = useState([]);
  const [selectedCaptionId, setSelectedCaptionId] = useState(null);

  // Media Bin State & Stock Modal
  const [mediaBin, setMediaBin] = useState([
    {
      id: videoSource.id,
      fileName:
        videoSource.fileName || videoSource.title || 'Original Source Video',
      duration: videoSource.duration || 60,
      isOriginal: true,
    },
  ]);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  // Active Tab for sidebar: 'phrases' | 'framing' | 'captions' | 'audio' | 'media' | 'downloads'
  const [activeTab, setActiveTab] = useState('phrases');

  // History stack for Undo / Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const videoRef = useRef(null);
  const brollVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const renderFrameRef = useRef(null);
  const timelineRef = useRef(null);
  const lastReportedTimeRef = useRef(clip.start);

  // Extract available phrases or action moments
  useEffect(() => {
    if (clip.captions && clip.captions.length > 0) {
      if (isGaming) {
        const gamingCaps = clip.captions
          .filter(
            (c) =>
              !/[\u0600-\u06FF]/.test(c.text || '') &&
              !/[\u0600-\u06FF]/.test(c.textUrdu || '')
          )
          .map((c, idx) => ({
            ...c,
            id: c.id || `moment-${idx + 1}`,
            text: c.textEnglish || c.text || `Action Moment #${idx + 1}`,
            textEnglish: c.textEnglish || c.text || `Action Moment #${idx + 1}`,
            textUrdu: '',
          }));

        if (gamingCaps.length > 0) {
          setAvailablePhrases(gamingCaps);
          return;
        }
      } else {
        setAvailablePhrases(clip.captions);
        return;
      }
    }

    if (isGaming) {
      // For GTA / Gaming: Generate exciting action moments partitioned across clip duration
      const clipDur = clip.duration || clip.end - clip.start || 30;
      const step = Math.min(6.5, Math.max(3.5, clipDur / 4));
      const actionLabels = [
        'High Speed Action & Vehicle Acceleration',
        'Stunt Maneuver & Drift Cornering',
        'Near Miss Traffic Evasion',
        'Massive Explosion & Destruction',
        'Police Evasion & High-Octane Escape',
      ];
      const moments = [];
      let cur = 0;
      let mIdx = 0;
      while (cur < clipDur) {
        const mEnd = Math.min(clipDur, parseFloat((cur + step).toFixed(2)));
        moments.push({
          id: `moment-${mIdx + 1}`,
          start: cur,
          end: mEnd,
          duration: parseFloat((mEnd - cur).toFixed(2)),
          text: actionLabels[mIdx % actionLabels.length],
          textEnglish: actionLabels[mIdx % actionLabels.length],
          textUrdu: '',
        });
        cur = mEnd;
        mIdx++;
      }
      setAvailablePhrases(moments);
    } else if (videoSource.transcript && !isGaming) {
      // Parse transcript into phrase cards for Naat/recitation
      const lines = videoSource.transcript
        .split('\n')
        .filter((l) => l.trim().length > 0);
      const estDuration = videoSource.duration || 60;
      const step = estDuration / Math.max(1, lines.length);
      const parsed = lines.map((line, idx) => ({
        id: `phrase-${idx + 1}`,
        start: parseFloat((idx * step).toFixed(2)),
        end: parseFloat(((idx + 1) * step).toFixed(2)),
        duration: parseFloat(step.toFixed(2)),
        text: line.trim(),
        textRoman: line.trim(),
        textUrdu: line.trim(),
      }));
      setAvailablePhrases(parsed);
    }
  }, [clip, videoSource, isGaming]);

  // Switch to another Short from the Left Feed
  const handleSwitchClip = (targetClip) => {
    if (!targetClip || targetClip.id === currentClip.id) return;
    setCurrentClip(targetClip);
    setCaptions(targetClip.captions || []);
    const newStart = targetClip.start || 0;
    const newEnd = targetClip.end || newStart + 30;
    setSegments([
      {
        id: `seg-${targetClip.id || targetClip.index || 'switch'}`,
        sourceId: videoSource.id,
        fileName: videoSource.fileName || 'Recitation Source',
        start: newStart,
        end: newEnd,
        duration: newEnd - newStart,
        isStock: false,
        cropX: null,
      },
    ]);
    setCurrentTime(newStart);
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
    if (onUpdateClip) {
      onUpdateClip(targetClip);
    }
  };

  // Push snapshot to undo history
  const pushHistory = useCallback(
    (newState) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
      setHistoryIndex((prev) => prev + 1);
      setHasUnsavedChanges(true);
    },
    [historyIndex]
  );

  // Total duration of current timeline
  const totalTimelineDuration = segments.reduce(
    (sum, s) => sum + s.duration,
    0
  );

  // Playhead Animation Loop & Canvas Rendering
  useEffect(() => {
    let animId;

    const renderFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        const aspectConfig =
          aspectRatio === '9:16'
            ? ASPECT_RATIOS.PORTRAIT
            : aspectRatio === '1:1'
              ? ASPECT_RATIOS.SQUARE
              : ASPECT_RATIOS.LANDSCAPE;

        const cw = aspectConfig.width;
        const ch = aspectConfig.height;

        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
        }

        ctx.clearRect(0, 0, cw, ch);

        const activeSeg = segments[activeSegmentIndex] || segments[0];
        const isBrollActive = Boolean(
          activeSeg?.isStock &&
          activeSeg?.stockVideoUrl &&
          brollVideoRef.current &&
          brollVideoRef.current.readyState >= 2
        );
        const sourceVideo = isBrollActive ? brollVideoRef.current : video;

        const vw = sourceVideo.videoWidth || 1920;
        const vh = sourceVideo.videoHeight || 1080;

        // Draw Video Crop
        if (aspectRatio === '9:16') {
          const cropW = Math.round(vh * (9 / 16));
          const maxCX = Math.max(0, vw - cropW);

          let cx = (vw - cropW) / 2;
          if (framingMode === 'action-tracking') {
            const actionTargetX =
              manualCropX !== 50 ? manualCropX : clip.cropX || 50;
            cx = maxCX * (actionTargetX / 100);
          } else if (manualCropX !== 50 && framingMode === 'manual') {
            cx = maxCX * (manualCropX / 100);
          }

          if (
            framingMode === 'blurred-bg' ||
            framingMode === 'gameplay-blur-bg'
          ) {
            // Draw blurred background
            ctx.filter = 'blur(25px) brightness(0.6)';
            ctx.drawImage(sourceVideo, 0, 0, cw, ch);
            ctx.filter = 'none';

            // Draw centered original video
            const targetH = Math.round(cw / (vw / vh));
            ctx.drawImage(sourceVideo, 0, (ch - targetH) / 2, cw, targetH);
          } else if (framingMode === 'trending-ai-speaker') {
            const elapsed = video.currentTime - (segments[0]?.start || 0);
            const isSpeakingNow = captions.some(
              (c) => elapsed >= c.start && elapsed <= c.end
            );
            const zoom = isSpeakingNow ? 1.05 : 1.0;

            const zoomedW = cropW / zoom;
            const zoomedH = vh / zoom;
            const zoomedX = cx + (cropW - zoomedW) / 2;
            const zoomedY = (vh - zoomedH) / 2;

            ctx.drawImage(
              sourceVideo,
              zoomedX,
              zoomedY,
              zoomedW,
              zoomedH,
              0,
              0,
              cw,
              ch
            );
          } else {
            ctx.drawImage(sourceVideo, cx, 0, cropW, vh, 0, 0, cw, ch);
          }
        } else if (aspectRatio === '1:1') {
          const dim = Math.min(vw, vh);
          const cx = (vw - dim) / 2;
          ctx.drawImage(sourceVideo, cx, 0, dim, dim, 0, 0, cw, ch);
        } else {
          ctx.drawImage(sourceVideo, 0, 0, vw, vh, 0, 0, cw, ch);
        }

        // Render Live Dynamic Captions with word-wrap and safe background fitting if enabled
        if (subtitlesEnabled) {
          renderCanvasCaptions(
            ctx,
            cw,
            ch,
            video.currentTime - (segments[0]?.start || 0),
            captions,
            {
              captionMode,
              captionStyle,
              captionFontSize,
              captionPosition,
              bgOpacity,
            }
          );
        }

        // Synchronize B-Roll video playback if active
        if (isBrollActive && brollVideoRef.current) {
          if (isPlaying && brollVideoRef.current.paused) {
            brollVideoRef.current.play().catch(() => {});
          } else if (!isPlaying && !brollVideoRef.current.paused) {
            brollVideoRef.current.pause();
          }
        }

        // Only throttle React currentTime state when playing; NEVER update state during paused render!
        if (isPlaying) {
          const now = video.currentTime;
          if (Math.abs(now - lastReportedTimeRef.current) >= 0.15) {
            lastReportedTimeRef.current = now;
            setCurrentTime(now);
          }

          // In Short Mode, loop or pause when reaching segment end
          if (editorMode === 'short') {
            const activeSeg = segments[0];
            if (activeSeg && now >= activeSeg.end) {
              video.currentTime = activeSeg.start;
              lastReportedTimeRef.current = activeSeg.start;
              setCurrentTime(activeSeg.start);
              if (brollVideoRef.current) {
                brollVideoRef.current.currentTime = 0;
              }
            }
          }
        }

        // Mirror active monitor frame to fullscreen canvas if modal is open
        if (fsCanvasRef.current && canvas) {
          if (fsCanvasRef.current.width !== canvas.width) {
            fsCanvasRef.current.width = canvas.width;
            fsCanvasRef.current.height = canvas.height;
          }
          const fsCtx = fsCanvasRef.current.getContext('2d');
          if (fsCtx) {
            fsCtx.drawImage(canvas, 0, 0);
          }
        }
      }

      if (isPlaying) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrameRef.current = renderFrame;

    if (isPlaying) {
      animId = requestAnimationFrame(renderFrame);
    } else {
      renderFrame();
    }

    return () => cancelAnimationFrame(animId);
  }, [
    isPlaying,
    aspectRatio,
    framingMode,
    manualCropX,
    subtitlesEnabled,
    captionMode,
    captionStyle,
    captionFontSize,
    captionPosition,
    bgOpacity,
    captions,
    segments,
    editorMode,
  ]);

  // Safe Play / Pause Toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
      if (brollVideoRef.current && !brollVideoRef.current.paused) {
        brollVideoRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (brollVideoRef.current && brollVideoRef.current.paused) {
              brollVideoRef.current.play().catch(() => {});
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError')
              console.warn('Playback interrupted:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  // Seek video
  const handleSeek = (newTime) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = newTime;
      lastReportedTimeRef.current = newTime;
      setCurrentTime(newTime);
      if (brollVideoRef.current) {
        const activeSeg = segments[activeSegmentIndex] || segments[0];
        const brollDuration = brollVideoRef.current.duration || 15;
        const offset = Math.max(0, newTime - (activeSeg?.start || 0));
        brollVideoRef.current.currentTime = offset % brollDuration;
      }
    }
  };

  // Ensure video element seeks to clip's exact start when loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initialTime = segments[0]?.start ?? clip?.start ?? 0;
    const seekInitial = () => {
      video.currentTime = initialTime;
      setCurrentTime(initialTime);
    };

    if (video.readyState >= 1) {
      seekInitial();
    } else {
      video.addEventListener('loadedmetadata', seekInitial, { once: true });
    }

    return () => {
      video.removeEventListener('loadedmetadata', seekInitial);
    };
  }, [clip?.id, clip?.start]);

  // Switch between Short Mode (bounded) and Full Video Mode (0 to duration)
  const toggleEditorMode = () => {
    if (editorMode === 'short') {
      setEditorMode('full_video');
      handleSeek(0);
      showToast(
        'Switched to Full Video Mode: Scrubbing entire original video.',
        'info'
      );
    } else {
      setEditorMode('short');
      const start = segments[0]?.start || clip.start;
      handleSeek(start);
      showToast(
        'Switched to Short Mode: Playing edited Short boundaries.',
        'info'
      );
    }
  };

  // Split Segment at Current Playhead (Blade Tool)
  const handleSplitSegment = () => {
    const activeSeg = segments[activeSegmentIndex];
    if (!activeSeg) return;

    if (
      currentTime <= activeSeg.start + 0.5 ||
      currentTime >= activeSeg.end - 0.5
    ) {
      showToast(
        'Cannot split too close to segment boundary (min 0.5s).',
        'warning'
      );
      return;
    }

    const segTimeSuffix = Math.round(currentTime * 100);
    const seg1 = {
      ...activeSeg,
      id: `${activeSeg.id || 'seg'}-split-a-${segTimeSuffix}`,
      end: currentTime,
      duration: currentTime - activeSeg.start,
    };

    const seg2 = {
      ...activeSeg,
      id: `${activeSeg.id || 'seg'}-split-b-${segTimeSuffix}`,
      start: currentTime,
      duration: activeSeg.end - currentTime,
    };

    const updated = [
      ...segments.slice(0, activeSegmentIndex),
      seg1,
      seg2,
      ...segments.slice(activeSegmentIndex + 1),
    ];

    setSegments(updated);
    pushHistory({ segments: updated, captions });
    showToast('Split segment at playhead (Blade cut executed).', 'success');
  };

  const togglePlayRef = useRef(togglePlay);
  const handleSplitSegmentRef = useRef(handleSplitSegment);

  useEffect(() => {
    togglePlayRef.current = togglePlay;
    handleSplitSegmentRef.current = handleSplitSegment;
  }, [togglePlay, handleSplitSegment]);

  // Keyboard shortcut (Space to play/pause, C to blade split)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayRef.current?.();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        handleSplitSegmentRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Delete Selected Segment
  const handleDeleteSegment = (idx) => {
    if (segments.length <= 1) {
      showToast('Timeline must contain at least one video segment.', 'warning');
      return;
    }
    const updated = segments.filter((_, i) => i !== idx);
    setSegments(updated);
    setActiveSegmentIndex(Math.max(0, idx - 1));
    pushHistory({ segments: updated, captions });
    showToast('Segment removed from timeline.', 'info');
  };

  // Trim Active Segment
  const handleTrimSegment = (deltaStart, deltaEnd) => {
    const activeSeg = segments[activeSegmentIndex];
    if (!activeSeg) return;

    const newStart = Math.max(0, activeSeg.start + deltaStart);
    const newEnd = Math.max(newStart + 1.0, activeSeg.end + deltaEnd);

    const updatedSeg = {
      ...activeSeg,
      start: newStart,
      end: newEnd,
      duration: newEnd - newStart,
    };

    const updated = [...segments];
    updated[activeSegmentIndex] = updatedSeg;
    setSegments(updated);
    pushHistory({ segments: updated, captions });
  };

  // Phrase Multi-Selection Toggle
  const togglePhraseSelection = (phraseId) => {
    setSelectedPhraseIds((prev) =>
      prev.includes(phraseId)
        ? prev.filter((id) => id !== phraseId)
        : [...prev, phraseId]
    );
  };

  // Calculate combined time range of selected phrases
  const selectedPhrasesInfo = useMemo(() => {
    const selected = availablePhrases.filter((p) =>
      selectedPhraseIds.includes(p.id)
    );
    if (selected.length === 0) return null;

    const minStart = Math.min(...selected.map((p) => p.start));
    const maxEnd = Math.max(...selected.map((p) => p.end));
    const duration = maxEnd - minStart;

    return {
      count: selected.length,
      start: minStart,
      end: maxEnd,
      duration,
      phrases: selected,
    };
  }, [availablePhrases, selectedPhraseIds]);

  // Create New Short from Selected Phrases
  const handleCreateShortFromSelected = useCallback(() => {
    if (!selectedPhrasesInfo) return;

    const newShortId = `short-${selectedPhrasesInfo.start.toFixed(1)}-${selectedPhrasesInfo.end.toFixed(1)}`;
    const newShort = {
      id: newShortId,
      index: (allClips.length || 0) + 1,
      start: selectedPhrasesInfo.start,
      end: selectedPhrasesInfo.end,
      duration: selectedPhrasesInfo.duration,
      title:
        selectedPhrasesInfo.phrases[0]?.text?.slice(0, 45) ||
        'Custom Phrase Short',
      captions: selectedPhrasesInfo.phrases,
      framingMode,
      captionMode,
      score: 95,
      isCustom: true,
    };

    if (onCreateShortFromPhrase) {
      onCreateShortFromPhrase(newShort);
    }

    setCurrentClip(newShort);
    setSegments([
      {
        id: `seg-${newShortId}`,
        sourceId: videoSource.id,
        fileName: videoSource.fileName || 'Recitation Source',
        start: newShort.start,
        end: newShort.end,
        duration: newShort.duration,
        isStock: false,
        cropX: null,
      },
    ]);
    setCaptions(selectedPhrasesInfo.phrases);
    setSelectedPhraseIds([]);
    handleSeek(newShort.start);
    setEditorMode('short');
    showSuccess(
      'Created New Short!',
      `Loaded range ${formatTimecode(newShort.start)} - ${formatTimecode(newShort.end)} (${Math.round(newShort.duration)}s) into timeline.`
    );
  }, [
    selectedPhrasesInfo,
    allClips.length,
    framingMode,
    captionMode,
    onCreateShortFromPhrase,
    videoSource,
    handleSeek,
    setSelectedPhraseIds,
  ]);

  // Add Selected Phrases to Current Short
  const handleAddPhrasesToCurrentShort = (position = 'append') => {
    if (!selectedPhrasesInfo) return;

    const newSeg = {
      id: `seg-${selectedPhrasesInfo.start.toFixed(1)}-${selectedPhrasesInfo.end.toFixed(1)}`,
      sourceId: videoSource.id,
      fileName: 'Additional Verses',
      start: selectedPhrasesInfo.start,
      end: selectedPhrasesInfo.end,
      duration: selectedPhrasesInfo.duration,
      isStock: false,
      cropX: null,
    };

    const updatedSegments =
      position === 'prepend' ? [newSeg, ...segments] : [...segments, newSeg];
    const updatedCaptions = [...captions, ...selectedPhrasesInfo.phrases].sort(
      (a, b) => a.start - b.start
    );

    setSegments(updatedSegments);
    setCaptions(updatedCaptions);
    setSelectedPhraseIds([]);
    pushHistory({ segments: updatedSegments, captions: updatedCaptions });
    showSuccess(
      'Phrases Added!',
      `Inserted ${selectedPhrasesInfo.count} phrase(s) to ${position === 'prepend' ? 'start' : 'end'} of Short.`
    );
  };

  // Apply Changes to This Short (Save Project State)
  const handleApplyChanges = () => {
    const updatedClip = {
      ...currentClip,
      start: segments[0]?.start || currentClip.start,
      end: segments[segments.length - 1]?.end || currentClip.end,
      duration: totalTimelineDuration,
      framingMode,
      manualCropX,
      captionMode,
      captionStyle,
      captionFontSize,
      captionPosition,
      bgOpacity,
      audioVolume,
      fadeIn,
      fadeOut,
      normalizeAudio,
      captions,
      segments,
      lastEditedAt: new Date().toISOString(),
    };

    setCurrentClip(updatedClip);
    setHasUnsavedChanges(false);

    if (onUpdateClip) {
      onUpdateClip(updatedClip);
    }

    showSuccess(
      'Applied Changes to This Short!',
      'Project state saved. Edits are locked to this Short.'
    );
  };

  // Apply Stock Video to Timeline as Visual Replacement (Preserves Naat Audio)
  const handleAddStockToTimeline = (stockVideo, replaceScope = 'segment') => {
    const updated = segments.map((seg, idx) => {
      if (replaceScope === 'whole' || idx === activeSegmentIndex) {
        return {
          ...seg,
          isStock: true,
          stockVideoUrl: stockVideo.videoUrl,
          stockVideoTitle: stockVideo.title || 'Islamic B-Roll',
          stockVideoId: stockVideo.id,
          stockAuthor: stockVideo.author,
          stockLicense: stockVideo.license,
          stockAttribution: stockVideo.attribution,
          fileName: stockVideo.title || 'Islamic B-Roll',
        };
      }
      return seg;
    });

    setSegments(updated);
    pushHistory({ segments: updated, captions });
    showSuccess(
      'Islamic B-Roll Applied!',
      `"${stockVideo.title}" is now the visual content for ${replaceScope === 'whole' ? 'the entire short' : 'the active segment'}. Original recitation audio is strictly preserved.`
    );
  };

  const handleRevertStockSegment = (idx) => {
    const updated = segments.map((seg, i) => {
      if (i === idx) {
        return {
          ...seg,
          isStock: false,
          stockVideoUrl: null,
          fileName: videoSource.fileName || 'Recitation Source',
        };
      }
      return seg;
    });
    setSegments(updated);
    pushHistory({ segments: updated, captions });
    showToast('Reverted segment back to original camera footage.', 'info');
  };

  // Initiate Export with exact parameters
  const handleInitiateExport = () => {
    handleApplyChanges();
    onRenderExport({
      clipIndex: currentClip.index || 1,
      segments,
      aspectRatio,
      framingMode,
      manualCropX,
      audioVolume,
      fadeIn,
      fadeOut,
      normalizeAudio,
      captions,
      burnSubtitles: subtitlesEnabled,
      subtitlesEnabled,
      captionMode,
      captionStyle,
      captionPosition,
      captionFontSize,
      bgOpacity,
      videoUrl: videoStreamUrl,
    });
  };

  // Download Standalone Subtitle Files (.SRT / .VTT)
  const handleDownloadSubtitles = (format = 'srt') => {
    const content =
      format === 'srt'
        ? captionsToSRT(captions, captionMode)
        : captionsToVTT(captions, captionMode);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `short_${currentClip.index || 1}_captions.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess(
      `Downloaded ${format.toUpperCase()}!`,
      'Subtitle file exported successfully.'
    );
  };

  const activeSeg = segments[activeSegmentIndex] || segments[0];
  const activeStockUrl =
    activeSeg?.isStock && activeSeg?.stockVideoUrl
      ? activeSeg.stockVideoUrl
      : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Professional Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-3.5 rounded-3xl bg-card border border-border/80 shadow-md">
        {/* Left Side: Navigation & Active Short Context */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToGallery}
            className="rounded-xl font-bold cursor-pointer h-9 px-3 border border-border/70 hover:bg-muted/80 text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Clips Gallery</span>
          </Button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-foreground flex items-center gap-1.5">
                <span>
                  {editorMode === 'short'
                    ? `Short #${currentClip.index || 1}`
                    : 'Master Video'}
                </span>
                {isGaming ? (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-mono font-bold">
                    🎮 4K Action • {Math.round(currentClip.duration || 30)}s
                  </Badge>
                ) : isMusic ? (
                  <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-[10px] font-mono font-bold">
                    🎵 Song Hook • {Math.round(currentClip.duration || 30)}s
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono font-bold">
                    🕌 Sacred Verse • {Math.round(currentClip.duration || 30)}s
                  </Badge>
                )}
              </h2>
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-amber-500 border-amber-500/40 bg-amber-500/10"
                >
                  Unsaved
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md">
              {currentClip.title || videoSource?.title || 'Short Video Project'}
            </p>
          </div>
        </div>

        {/* Center: Clean Aspect Ratio & Captions Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleEditorMode}
            className="rounded-xl text-xs font-bold cursor-pointer h-8 px-2.5 text-muted-foreground hover:text-foreground"
            title={
              editorMode === 'short'
                ? 'Switch to Scrubbing Full Master Video'
                : 'Return to Editing Short Segment'
            }
          >
            <Film className="w-3.5 h-3.5 mr-1" />
            <span>{editorMode === 'short' ? 'Full Video' : 'Short Mode'}</span>
          </Button>

          {/* Aspect Ratio Segmented Control */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setAspectRatio('9:16')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                aspectRatio === '9:16'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('16:9')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                aspectRatio === '16:9'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Laptop className="w-3 h-3" />
              <span>16:9</span>
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('1:1')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                aspectRatio === '1:1'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Square className="w-3 h-3" />
              <span>1:1</span>
            </button>
          </div>

          {/* Subtitles ON / OFF Master Switch */}
          <Button
            size="sm"
            variant={subtitlesEnabled ? 'default' : 'outline'}
            onClick={() => {
              setSubtitlesEnabled(!subtitlesEnabled);
              showToast(
                `Subtitles ${!subtitlesEnabled ? 'Turned ON' : 'Turned OFF'}`,
                'info'
              );
            }}
            className={cn(
              'rounded-xl text-xs font-bold cursor-pointer h-8 px-2.5 gap-1.5 transition-all shadow-xs',
              subtitlesEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'text-muted-foreground border-border hover:bg-muted'
            )}
            title="Toggle Subtitles ON / OFF (Press 'C' key)"
          >
            {subtitlesEnabled ? (
              <Eye className="w-3.5 h-3.5 text-white" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            <span>Captions: {subtitlesEnabled ? 'ON' : 'OFF'}</span>
          </Button>

          {/* Subtitle Script Mode Selector */}
          {subtitlesEnabled && (
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50 text-[11px] font-bold">
              {isGaming ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCaptionMode('english')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      captionMode === 'english'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Dynamic Word-by-Word English Highlight"
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptionMode('english-clean')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      captionMode === 'english-clean'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Clean Minimal English Captions"
                  >
                    Clean
                  </button>
                </>
              ) : isMusic ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCaptionMode('karaoke-glow')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      captionMode === 'karaoke-glow'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Karaoke Neon Word Glow"
                  >
                    Glow
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptionMode('kinetic-lyrics')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      captionMode === 'kinetic-lyrics'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Kinetic Rhythm Pop Lyrics"
                  >
                    Pop
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCaptionMode('urdu')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      captionMode === 'urdu'
                        ? 'bg-emerald-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Authentic Urdu Nastaliq Script"
                  >
                    اردو
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptionMode('roman-urdu')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      captionMode === 'roman-urdu'
                        ? 'bg-emerald-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Conversational Roman Urdu"
                  >
                    Roman
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptionMode('dual-urdu-roman')}
                    className={cn(
                      'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                      captionMode === 'dual-urdu-roman'
                        ? 'bg-emerald-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Dual Stacked: Urdu on top, Roman Urdu below"
                  >
                    Dual
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Streamlined Actions & Primary 4K Download */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncCaptions}
            disabled={isSyncingCaptions}
            className={cn(
              'rounded-xl text-xs font-bold cursor-pointer h-9 px-3 gap-1.5 shadow-xs',
              isGaming
                ? 'border-purple-500/40 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                : isMusic
                  ? 'border-pink-500/40 text-pink-400 bg-pink-500/10 hover:bg-pink-500/20'
                  : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
            )}
            title={
              isGaming
                ? 'Sync English commentary and dialogue with audio'
                : isMusic
                  ? 'Sync song lyrics with rhythmic beat drop'
                  : "Re-align this Short's Urdu captions directly against its audio"
            }
          >
            <RefreshCw
              className={cn(
                'w-3.5 h-3.5',
                isSyncingCaptions && 'animate-spin text-primary'
              )}
            />
            <span>
              {isSyncingCaptions
                ? 'Syncing...'
                : isGaming
                  ? 'Sync Dialogue'
                  : isMusic
                    ? 'Sync Lyrics'
                    : 'Sync Audio'}
            </span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsThumbModalOpen(true)}
            className="rounded-xl text-xs font-bold cursor-pointer h-9 px-3 gap-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/40"
            title={
              isGaming
                ? 'Customize Gaming Thumbnail & Cover'
                : isMusic
                  ? 'Customize Music Cover & Thumbnail'
                  : 'Download Short Thumbnail in Kumail Urdu Font'
            }
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Thumbnail</span>
          </Button>

          {hasUnsavedChanges && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApplyChanges}
              className="rounded-xl text-xs font-bold cursor-pointer h-9 px-3 gap-1.5 border-primary text-primary bg-primary/10 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply</span>
            </Button>
          )}

          {onDownloadClip && (
            <Button
              size="sm"
              onClick={() =>
                onDownloadClip({
                  ...currentClip,
                  start: segments[0]?.start ?? currentClip.start,
                  end: segments[0]?.end ?? currentClip.end,
                  duration: segments[0]?.duration ?? currentClip.duration,
                  aspectRatio,
                  framingMode,
                  cropX: manualCropX,
                  captions,
                  captionMode,
                })
              }
              className="rounded-xl text-xs font-black cursor-pointer h-9 px-4 gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30 transition-all hover:scale-[1.02]"
              title="Directly download this exact cut short in 4K UHD"
            >
              <Download className="w-4 h-4" />
              <span>Download Short (4K)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Studio Workspace: Responsive 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Studio Shorts Feed (3 Cols when allClips has multiple items) */}
        {allClips && allClips.length > 1 && (
          <div className="lg:col-span-3 flex flex-col space-y-3">
            <Card className="p-3.5 rounded-3xl border-border/70 bg-card/90 shadow-xl space-y-3 flex-1 flex flex-col max-h-[750px]">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Generated Shorts
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-primary border-primary/30"
                >
                  {allClips.length} Clips
                </Badge>
              </div>

              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {allClips.map((c, idx) => {
                  const isActive = c.id === currentClip.id;
                  const viralityScore =
                    c.viralityScore ||
                    Math.min(99, 88 + (idx === 0 ? 10 : (idx * 3) % 9));
                  const durationSec = Math.round(
                    c.duration || c.end - c.start || 45
                  );

                  return (
                    <div
                      key={c.id || idx}
                      onClick={() => handleSwitchClip(c)}
                      className={cn(
                        'p-2.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group relative',
                        isActive
                          ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                          : 'border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          Short #{c.index || idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono px-1.5 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                          >
                            🔥 {viralityScore}/100
                          </Badge>
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {durationSec}s
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {c.primaryVerse || c.title || `Viral Verse ${idx + 1}`}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                        <span className="font-mono">
                          {formatTimecode(c.start)} - {formatTimecode(c.end)}
                        </span>
                        <span className="text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          Edit &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Column 2: Video Preview & Smartphone Viewport (5 Cols if Feed active, else 7 Cols) */}
        <div
          className={cn(
            'flex flex-col space-y-3',
            allClips && allClips.length > 1 ? 'lg:col-span-5' : 'lg:col-span-7'
          )}
        >
          <Card className="rounded-3xl border-border/70 overflow-hidden bg-black/95 shadow-xl p-3 flex flex-col items-center justify-center relative min-h-[360px] sm:min-h-[400px]">
            {/* Offscreen Video element used as render source */}
            {videoStreamUrl && (
              <video
                ref={videoRef}
                src={videoStreamUrl}
                crossOrigin={
                  videoStreamUrl.startsWith('blob:') ? undefined : 'anonymous'
                }
                playsInline
                preload="auto"
                className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1"
                onLoadedMetadata={(e) => {
                  const initialTime = segments[0]?.start ?? clip?.start ?? 0;
                  e.currentTarget.currentTime = initialTime;
                  setCurrentTime(initialTime);
                }}
                onLoadedData={() => {
                  renderFrameRef.current?.();
                }}
                onSeeked={() => {
                  renderFrameRef.current?.();
                }}
                onCanPlay={() => {
                  renderFrameRef.current?.();
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => {
                  setIsPlaying(false);
                  renderFrameRef.current?.();
                }}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            {/* Offscreen B-Roll Video element used as replacement visual source */}
            {activeStockUrl && (
              <video
                ref={brollVideoRef}
                src={activeStockUrl}
                crossOrigin="anonymous"
                playsInline
                loop
                muted
                preload="auto"
                className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1"
              />
            )}

            {/* Rendered Live Monitor Output (Controlled Viewport Height) */}
            <div
              className={cn(
                'relative max-w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10 bg-black',
                aspectRatio === '9:16'
                  ? 'aspect-[9/16] h-[360px] sm:h-[400px] lg:h-[440px] max-h-[52vh]'
                  : aspectRatio === '1:1'
                    ? 'aspect-square h-[300px] sm:h-[360px] max-h-[50vh]'
                    : 'aspect-[16/9] w-full max-h-[320px]'
              )}
            >
              {/* Fallback frame preview or poster if video is paused/buffering before first render */}
              {!isPlaying &&
                (videoSource?.thumbnailMaxRes ||
                  videoSource?.thumbnailUrl ||
                  clip?.thumbnailUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      clip?.thumbnailUrl ||
                      videoSource?.thumbnailMaxRes ||
                      videoSource?.thumbnailUrl
                    }
                    alt={clip?.title || 'Preview'}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 filter blur-xs"
                  />
                )}

              {clip?.categoryName && (
                <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/40 text-white text-xs font-bold shadow-lg pointer-events-none">
                  <span>{clip.categoryIcon || '🎮'}</span>
                  <span className="text-purple-300 uppercase tracking-wider text-[10px] font-black">
                    {clip.categoryBadge || clip.categoryName}
                  </span>
                  <span className="text-white/60 text-[10px]">
                    • {clip.score}% Viral
                  </span>
                </div>
              )}

              {/* Fullscreen 9:16 Preview Button */}
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                  }
                  if (brollVideoRef.current && !brollVideoRef.current.paused) {
                    brollVideoRef.current.pause();
                  }
                  setIsPlaying(false);
                  setIsFullscreenPreview(true);
                }}
                className="absolute top-3 right-3 z-30 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white hover:text-primary hover:border-primary/50 transition-all cursor-pointer shadow-lg hover:scale-105"
                title="Watch Short in Fullscreen 9:16 Preview"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-xl"
                  aria-label="Play video"
                >
                  <Play className="w-8 h-8 ml-1" />
                </button>
              )}
            </div>
          </Card>

          {/* Floating Control Pill Bar directly beneath video */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-card/90 border border-border/60 shadow-md backdrop-blur-md">
            <Button
              size="sm"
              variant={subtitlesEnabled ? 'default' : 'outline'}
              onClick={() => {
                setSubtitlesEnabled(!subtitlesEnabled);
                showToast(
                  `Subtitles ${!subtitlesEnabled ? 'Turned ON' : 'Turned OFF'}`,
                  'info'
                );
              }}
              className={cn(
                'rounded-xl text-xs font-bold cursor-pointer h-7.5 px-3 gap-1.5 transition-all shadow-xs',
                subtitlesEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-muted-foreground border-border hover:bg-muted'
              )}
              title="Toggle Subtitles ON / OFF (Press 'C')"
            >
              {subtitlesEnabled ? (
                <Eye className="w-3.5 h-3.5 text-white" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>Subtitles: {subtitlesEnabled ? 'ON' : 'OFF'}</span>
            </Button>

            {subtitlesEnabled && (
              <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50 text-[11px] font-bold">
                {isGaming ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('english')}
                      className={cn(
                        'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                        captionMode === 'english'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('english-clean')}
                      className={cn(
                        'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                        captionMode === 'english-clean'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Clean
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('urdu')}
                      className={cn(
                        'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                        captionMode === 'urdu'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      اردو
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('roman-urdu')}
                      className={cn(
                        'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                        captionMode === 'roman-urdu'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Roman
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptionMode('dual-urdu-roman')}
                      className={cn(
                        'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                        captionMode === 'dual-urdu-roman'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Dual
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFramingMode('trending-ai-speaker')}
                className={cn(
                  'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                  framingMode === 'trending-ai-speaker'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Auto-center reciter / active speaker"
              >
                Speaker
              </button>
              <button
                type="button"
                onClick={() => setFramingMode('centered-focus')}
                className={cn(
                  'px-2 py-0.5 rounded-lg transition-all cursor-pointer',
                  framingMode === 'centered-focus'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Centered 9:16 crop"
              >
                Center
              </button>
            </div>
          </div>

          {/* Transport & Playback Controls Bar */}
          <Card className="p-3 rounded-2xl border-border/70 bg-card flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSeek(Math.max(0, currentTime - 5))}
                className="rounded-lg h-9 w-9 p-0 cursor-pointer"
                title="Back 5s"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant={isPlaying ? 'secondary' : 'default'}
                size="sm"
                onClick={togglePlay}
                className="rounded-xl h-9 px-4 font-bold cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 mr-1.5" />
                ) : (
                  <Play className="w-4 h-4 mr-1.5" />
                )}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSeek(currentTime + 5)}
                className="rounded-lg h-9 w-9 p-0 cursor-pointer"
                title="Forward 5s"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Timecode Display */}
            <div className="font-mono text-xs sm:text-sm font-bold bg-muted/60 px-3 py-1.5 rounded-lg border border-border/40">
              <span className="text-primary">
                {formatTimecode(currentTime)}
              </span>
              <span className="text-muted-foreground">
                {' '}
                / {formatTimecode(totalTimelineDuration)}
              </span>
            </div>

            {/* Playback speed selector */}
            <div className="flex items-center gap-1">
              {[1.0, 1.5, 2.0].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => {
                    setPlaybackSpeed(speed);
                    if (videoRef.current) videoRef.current.playbackRate = speed;
                  }}
                  className={cn(
                    'px-2 py-1 rounded text-[11px] font-mono cursor-pointer',
                    playbackSpeed === speed
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Column 3: Tabbed Tool Panels (4 Cols if Feed active, else 5 Cols) */}
        <div
          className={cn(
            'flex flex-col space-y-3',
            allClips && allClips.length > 1 ? 'lg:col-span-4' : 'lg:col-span-5'
          )}
        >
          <Card className="p-4 sm:p-5 rounded-3xl border-border/70 bg-card shadow-xl flex-1 flex flex-col space-y-4">
            {/* Sidebar Tab Selector */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-muted/50 rounded-xl border border-border/50 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('phrases')}
                className={cn(
                  'py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1',
                  activeTab === 'phrases'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {isGaming ? 'Moments' : isMusic ? 'Chorus' : 'Phrases'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('framing')}
                className={cn(
                  'py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1',
                  activeTab === 'framing'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Framing</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('captions')}
                className={cn(
                  'py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1',
                  activeTab === 'captions'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Captions</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={cn(
                  'py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1',
                  activeTab === 'audio'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isGaming) {
                    showToast(
                      'Direct gameplay action is preserved without external B-Roll.',
                      'info'
                    );
                    return;
                  }
                  if (isMusic) {
                    showToast(
                      'Dynamic rhythm video is preserved; external B-Roll is only for recitation.',
                      'info'
                    );
                    return;
                  }
                  setActiveTab('media');
                }}
                className={cn(
                  'py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1',
                  (isGaming || isMusic) && 'opacity-50 cursor-not-allowed',
                  activeTab === 'media'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {isGaming ? 'Gameplay' : isMusic ? 'Visuals' : 'B-Roll'}
                </span>
              </button>
            </div>

            {/* TAB 1: Phrase / Action Moment System */}
            {activeTab === 'phrases' && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold text-xs">
                      {isGaming
                        ? `Action Moments & Dialogue (${availablePhrases.length})`
                        : isMusic
                          ? `Chorus Hooks & Lyrics (${availablePhrases.length})`
                          : `Recitation Phrases (${availablePhrases.length})`}
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      {isGaming
                        ? 'Select gameplay events & dialogue lines to expand your Short.'
                        : 'Select verses to create or expand your Short.'}
                    </p>
                  </div>
                  {selectedPhrasesInfo && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-primary border-primary/30 font-bold"
                    >
                      {selectedPhrasesInfo.count} Selected (
                      {Math.round(selectedPhrasesInfo.duration)}s)
                    </Badge>
                  )}
                </div>

                {/* Multi-Selection Action Toolbar */}
                {selectedPhrasesInfo && (
                  <div className="p-3 rounded-2xl border border-primary/30 bg-primary/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        Selected Range:{' '}
                        {formatTimecode(selectedPhrasesInfo.start)} -{' '}
                        {formatTimecode(selectedPhrasesInfo.end)}
                      </span>
                      <span className="font-mono font-bold text-primary">
                        {selectedPhrasesInfo.duration.toFixed(1)}s
                      </span>
                    </div>

                    {selectedPhrasesInfo.duration < 15 && (
                      <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>
                          Tip: Select 1 more phrase to reach optimal 20-45s
                          Shorts length.
                        </span>
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={handleCreateShortFromSelected}
                        className="text-xs font-bold rounded-xl cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-8"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        <span>Create Short</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddPhrasesToCurrentShort('append')}
                        className="text-xs font-bold rounded-xl cursor-pointer h-8"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        <span>Append to Short</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Phrase Cards List */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[290px] pr-1">
                  {availablePhrases.map((phrase, idx) => {
                    const isSelected = selectedPhraseIds.includes(phrase.id);
                    return (
                      <div
                        key={phrase.id || idx}
                        className={cn(
                          'p-2.5 rounded-xl border transition-all text-xs space-y-1.5 cursor-pointer',
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-xs'
                            : 'border-border/60 hover:border-border bg-card'
                        )}
                        onClick={() => togglePhraseSelection(phrase.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePhraseSelection(phrase.id)}
                              className="w-3.5 h-3.5 rounded text-primary cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="font-mono text-[10px] text-muted-foreground font-bold">
                              {formatTimecode(phrase.start)} -{' '}
                              {formatTimecode(phrase.end)}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                            {(phrase.end - phrase.start).toFixed(1)}s
                          </span>
                        </div>

                        {/* Urdu Script Line (Naat Only) */}
                        {!isGaming && !isMusic && phrase.textUrdu && (
                          <p
                            className="font-urdu text-right text-xs text-foreground font-medium pr-1"
                            dir="rtl"
                          >
                            {phrase.textUrdu}
                          </p>
                        )}

                        {/* Dialogue / Action Moment / Roman Line */}
                        <p className="font-sans text-xs text-foreground font-medium">
                          {isGaming
                            ? phrase.textEnglish || phrase.text
                            : isMusic
                              ? phrase.textEnglish || phrase.text
                              : phrase.textRoman || phrase.text}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeek(phrase.start);
                            }}
                            className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5" />
                            <span>Preview Phrase</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPhraseIds([phrase.id]);
                            }}
                            className="text-[10px] text-muted-foreground hover:text-foreground font-bold"
                          >
                            Select Only
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Framing & Crop */}
            {activeTab === 'framing' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <Label className="font-bold">
                    Framing Mode for 9:16 Shorts
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(FRAMING_MODES).map(([k, mode]) => {
                      const active = framingMode === mode.id;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setFramingMode(mode.id);
                            setHasUnsavedChanges(true);
                          }}
                          className={cn(
                            'p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                            active
                              ? 'border-primary bg-primary/10 text-primary font-bold'
                              : 'border-border/60 hover:border-border text-muted-foreground'
                          )}
                        >
                          <p className="font-bold text-xs text-foreground truncate">
                            {mode.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                            {mode.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horizontal Crop Position Slider */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">
                      Manual Camera Pan / Position
                    </Label>
                    <span className="font-mono text-xs text-primary">
                      {manualCropX}%
                    </span>
                  </div>
                  <Slider
                    value={[manualCropX]}
                    onValueChange={(vals) => {
                      setManualCropX(vals[0]);
                      setHasUnsavedChanges(true);
                    }}
                    min={0}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Captions Editor */}
            {activeTab === 'captions' && (
              <div className="space-y-3 text-xs sm:text-sm flex-1 flex flex-col">
                {/* Master Subtitle Toggle & Generation */}
                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-bold text-xs text-foreground">
                          Subtitle Display
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {subtitlesEnabled
                            ? 'Subtitles active on preview & export'
                            : 'Subtitles turned off'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={subtitlesEnabled ? 'default' : 'outline'}
                      onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                      className="rounded-xl text-xs h-7 px-3 font-bold cursor-pointer"
                    >
                      {subtitlesEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>

                  {captions.length === 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {isGaming
                          ? "Subtitles are off by default. Click below to generate creative English dialogue & commentary subtitles directly from this short's audio."
                          : isMusic
                            ? "Subtitles are off by default. Click below to synchronize song lyrics & karaoke neon word-glow directly from this track's audio."
                            : "Subtitles are off by default. Click below to generate authentic Urdu Nastaliq & Roman Urdu subtitles directly from this short's audio."}
                      </p>
                      <Button
                        size="sm"
                        onClick={handleSyncCaptions}
                        disabled={isSyncingCaptions}
                        className="w-full rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-8 shadow-sm"
                      >
                        {isSyncingCaptions ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Transcribing Speech...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              {isGaming
                                ? 'Generate English Dialogue Subtitles'
                                : isMusic
                                  ? 'Generate Karaoke Song Lyrics'
                                  : 'Generate Urdu & Roman Subtitles'}
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Caption Mode Selector */}
                <div className="space-y-1.5">
                  <Label className="font-bold flex items-center justify-between text-xs">
                    <span>Subtitle Display Mode</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-primary border-primary/30 font-mono"
                    >
                      {isGaming
                        ? captionMode === 'english'
                          ? 'Viral Pop Highlight'
                          : captionMode === 'english-clean'
                            ? 'Clean Minimal'
                            : 'Subtitles Off'
                        : isMusic
                          ? captionMode === 'karaoke-glow'
                            ? 'Karaoke Neon Glow'
                            : captionMode === 'kinetic-lyrics'
                              ? 'Kinetic Pop'
                              : captionMode === 'minimal-lyrics'
                                ? 'Clean Lyrics'
                                : 'Subtitles Off'
                          : captionMode === 'dual-urdu-roman'
                            ? 'Stacked 2-Line'
                            : captionMode === 'urdu'
                              ? 'Urdu Nastaliq'
                              : 'Roman Urdu'}
                    </Badge>
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(isGaming
                      ? GAMING_CAPTION_MODES
                      : isMusic
                        ? MUSIC_CAPTION_MODES.slice(0, 3)
                        : CAPTION_MODES.slice(0, 3)
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setCaptionMode(mode.id);
                          if (mode.id === 'off') {
                            setSubtitlesEnabled(false);
                          } else {
                            setSubtitlesEnabled(true);
                          }
                          setHasUnsavedChanges(true);
                        }}
                        className={cn(
                          'p-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5',
                          captionMode === mode.id
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                            : 'border-border/60 hover:border-border text-muted-foreground'
                        )}
                      >
                        <span className="text-xs font-bold leading-tight">
                          {mode.label.split('(')[0].trim()}
                        </span>
                        <span className="text-[9px] opacity-75 font-mono">
                          {mode.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtitle Font Size Slider (Smaller, compact, never clipped) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <Label className="font-bold">
                      Font Sizing (Mobile Optimized)
                    </Label>
                    <span className="font-mono text-primary font-bold">
                      {captionFontSize}px
                    </span>
                  </div>
                  <Slider
                    value={[captionFontSize]}
                    onValueChange={(vals) => {
                      setCaptionFontSize(vals[0]);
                      setHasUnsavedChanges(true);
                    }}
                    min={18}
                    max={34}
                    step={1}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Compact (18px)</span>
                    <span>Standard (24px)</span>
                    <span>Large (34px)</span>
                  </div>
                </div>

                {/* Vertical Position Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <Label className="font-bold">Vertical Placement</Label>
                    <span className="font-mono text-primary font-bold">
                      {captionPosition}%
                    </span>
                  </div>
                  <Slider
                    value={[captionPosition]}
                    onValueChange={(vals) => {
                      setCaptionPosition(vals[0]);
                      setHasUnsavedChanges(true);
                    }}
                    min={30}
                    max={85}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                {/* Full Caption Review & Side-by-Side Editor Action */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTranscriptModalOpen(true)}
                  className="w-full rounded-xl text-xs font-bold gap-2 h-9 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer shadow-xs"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>
                    {isGaming
                      ? 'Review & Edit English Dialogue Captions'
                      : 'Review & Edit Urdu / Roman Captions'}
                  </span>
                </Button>

                {/* Editable Subtitle Lines List */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[190px] pr-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-xs">
                      Live Text &amp; Timing Correction
                    </Label>
                    <button
                      type="button"
                      onClick={handleSyncCaptions}
                      disabled={isSyncingCaptions}
                      className="text-[10px] font-bold text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
                      title={
                        isGaming
                          ? 'Sync English Dialogue with Audio'
                          : 'Sync Urdu Captions with Audio'
                      }
                    >
                      <RefreshCw
                        className={cn(
                          'w-3 h-3',
                          isSyncingCaptions && 'animate-spin'
                        )}
                      />
                      <span>
                        {isSyncingCaptions ? 'Syncing...' : 'Sync with Audio'}
                      </span>
                    </button>
                  </div>

                  {captions.map((cap, i) => {
                    const isCurrent =
                      currentTime - (segments[0]?.start || 0) >= cap.start &&
                      currentTime - (segments[0]?.start || 0) <= cap.end;
                    const isUrduMode = captionMode === 'urdu';
                    const displayText = isUrduMode
                      ? cap.textUrdu || cap.text || ''
                      : cap.text || cap.textRoman || '';

                    return (
                      <div
                        key={cap.id || i}
                        onClick={() =>
                          handleSeek((segments[0]?.start || 0) + cap.start)
                        }
                        className={cn(
                          'p-2 rounded-xl border transition-all cursor-pointer space-y-1',
                          isCurrent
                            ? 'bg-primary/10 border-primary shadow-xs'
                            : 'bg-muted/40 border-border/50 hover:border-border'
                        )}
                        title="Click to seek preview to this line"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span>
                            {formatTimecode(cap.start)} -{' '}
                            {formatTimecode(cap.end)}
                          </span>
                          <span
                            className={cn(
                              'font-bold',
                              isCurrent
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          >
                            #{i + 1} {cap.isVerseBoundary ? '• Verse End' : ''}
                          </span>
                        </div>
                        <Input
                          value={displayText}
                          dir={isUrduMode ? 'rtl' : 'ltr'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCaptions((prev) =>
                              prev.map((c, idx) =>
                                idx === i
                                  ? {
                                      ...c,
                                      text: val,
                                      textUrdu: isUrduMode ? val : c.textUrdu,
                                      textRoman: !isUrduMode
                                        ? val
                                        : c.textRoman,
                                    }
                                  : c
                              )
                            );
                            setHasUnsavedChanges(true);
                          }}
                          className={cn(
                            'text-xs h-7.5 bg-background/80',
                            isUrduMode && 'font-urdu text-right'
                          )}
                        />

                        {/* Interactive Word Chips (Click word to seek directly) */}
                        {cap.words && cap.words.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {cap.words.map((w, wIdx) => {
                              const clipElapsed =
                                currentTime - (segments[0]?.start || 0);
                              const isWordActive =
                                clipElapsed >= w.start && clipElapsed <= w.end;
                              const wordText = isUrduMode
                                ? w.wordUrdu || w.word
                                : w.wordRoman || w.word;

                              return (
                                <span
                                  key={wIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSeek(
                                      (segments[0]?.start || 0) + w.start
                                    );
                                  }}
                                  className={cn(
                                    'text-[10px] px-1.5 py-0.5 rounded-md cursor-pointer transition-all',
                                    isWordActive
                                      ? 'bg-amber-400 text-black font-black scale-105 shadow-xs'
                                      : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                                  )}
                                  title={`Seek to ${w.start.toFixed(2)}s`}
                                >
                                  {wordText}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Verse / Line Action */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const lastCap = captions[captions.length - 1];
                        const newStart = lastCap ? lastCap.end : 0;
                        const newEnd = Math.min(
                          segments[0]?.duration || 30,
                          newStart + 3.0
                        );
                        const newLine = {
                          id: `cap-${captions.length + 1}`,
                          start: parseFloat(newStart.toFixed(2)),
                          end: parseFloat(newEnd.toFixed(2)),
                          textUrdu: '',
                          textRoman: '',
                          text: '',
                          words: [],
                        };
                        setCaptions((prev) => [...prev, newLine]);
                        pushHistory({
                          segments,
                          captions: [...captions, newLine],
                        });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full rounded-xl text-xs font-bold gap-1.5 h-8 border-dashed border-border hover:border-primary cursor-pointer text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Verse / Line</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Audio & Loudness Normalization */}
            {activeTab === 'audio' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="font-bold">
                      Primary Recitation Volume
                    </Label>
                    <span className="font-mono text-xs text-primary font-bold">
                      {Math.round(audioVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[audioVolume]}
                    onValueChange={(vals) => {
                      setAudioVolume(vals[0]);
                      if (videoRef.current)
                        videoRef.current.volume = Math.min(
                          1.0,
                          Math.max(0, vals[0])
                        );
                      setHasUnsavedChanges(true);
                    }}
                    min={0}
                    max={2.0}
                    step={0.05}
                    className="cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Fade In (sec)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="3.0"
                      value={fadeIn}
                      onChange={(e) => {
                        setFadeIn(parseFloat(e.target.value) || 0);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Fade Out (sec)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="3.0"
                      value={fadeOut}
                      onChange={(e) => {
                        setFadeOut(parseFloat(e.target.value) || 0);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <div>
                    <Label className="font-bold">
                      Broadcast Loudness Normalization
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Guarantees YouTube &amp; TikTok -14 LUFS compliance.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={normalizeAudio}
                    onChange={(e) => {
                      setNormalizeAudio(e.target.checked);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: B-Roll & Stock Gallery */}
            {activeTab === 'media' && (
              <div className="space-y-3 text-xs sm:text-sm flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">
                    Project Footage &amp; B-Roll
                  </Label>
                  <Button
                    size="sm"
                    onClick={() => setIsStockModalOpen(true)}
                    className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Search Islamic B-Roll</span>
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Adding B-roll overlays scenic Kaaba/Madinah visuals while
                  strictly preserving the original Naat audio recitation.
                </p>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1">
                  {segments.map((seg, idx) => (
                    <div
                      key={seg.id || idx}
                      className={cn(
                        'p-2.5 rounded-xl border flex items-center justify-between gap-2',
                        seg.isStock
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-border/50 bg-muted/30'
                      )}
                    >
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] font-mono px-1 py-0',
                              seg.isStock
                                ? 'text-amber-500 border-amber-500/30'
                                : 'text-primary border-primary/30'
                            )}
                          >
                            {seg.isStock ? 'B-Roll' : 'Recitation'}
                          </Badge>
                          <p className="font-bold text-xs truncate">
                            {seg.fileName}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {formatTimecode(seg.start)} -{' '}
                          {formatTimecode(seg.end)} ({Math.round(seg.duration)}
                          s)
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {seg.isStock && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevertStockSegment(idx)}
                            className="h-7 px-2 text-[10px] font-bold rounded-lg cursor-pointer text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                            title="Revert back to original camera footage"
                          >
                            Revert Visual
                          </Button>
                        )}
                        {segments.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSegment(idx)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Panel: Interactive Multi-Track Timeline */}
      <Card className="p-4 rounded-3xl border-border/70 bg-card/95 shadow-xl space-y-3">
        {/* Timeline Action Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSplitSegment}
              className="rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <Scissors className="w-3.5 h-3.5 text-primary" />
              <span>Split at Playhead (C)</span>
            </Button>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTrimSegment(-0.5, 0)}
                className="rounded-xl text-xs cursor-pointer h-8 px-2"
                title="Extend start by 0.5s"
              >
                +0.5s Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTrimSegment(0.5, 0)}
                className="rounded-xl text-xs cursor-pointer h-8 px-2"
                title="Trim start by 0.5s"
              >
                -0.5s Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTrimSegment(0, -0.5)}
                className="rounded-xl text-xs cursor-pointer h-8 px-2"
                title="Trim end by 0.5s"
              >
                -0.5s End
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTrimSegment(0, 0.5)}
                className="rounded-xl text-xs cursor-pointer h-8 px-2"
                title="Extend end by 0.5s"
              >
                +0.5s End
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Subtitle standalone export buttons */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDownloadSubtitles('srt')}
              className="text-xs h-8 rounded-lg cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span>.SRT</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDownloadSubtitles('vtt')}
              className="text-xs h-8 rounded-lg cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span>.VTT</span>
            </Button>

            <div className="h-4 w-px bg-border/60 mx-1" />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="rounded-lg h-8 w-8 p-0 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-[11px] font-mono text-muted-foreground">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="rounded-lg h-8 w-8 p-0 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Studio Multi-Layer Timeline Track Workspace */}
        <div
          ref={timelineRef}
          className="relative w-full overflow-hidden bg-zinc-950/80 rounded-2xl border border-border/70 p-3 space-y-3 select-none shadow-inner"
        >
          {/* Top Track Controls & Subtitle Add Action */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>ALL USEFUL TOOLS Multi-Layer Timeline Engine</span>
              </span>
              <Badge variant="outline" className="text-[9px] h-4 font-mono">
                3 Synchronized Layers
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const relTime = Math.max(
                    0,
                    parseFloat(
                      (currentTime - (segments[0]?.start || 0)).toFixed(2)
                    )
                  );
                  const newCap = {
                    id: `cap-${Date.now()}`,
                    start: relTime,
                    end: parseFloat((relTime + 2.5).toFixed(2)),
                    text: isGaming ? 'High speed action sequence' : 'نئی سطر',
                    textEnglish: 'High speed action sequence',
                    textUrdu: isGaming ? '' : 'نئی سطر',
                    textRoman: 'Nayi satar',
                    words: [],
                  };
                  const updated = [...captions, newCap].sort(
                    (a, b) => a.start - b.start
                  );
                  setCaptions(updated);
                  setSelectedCaptionId(newCap.id);
                  setActiveTab('captions');
                  setHasUnsavedChanges(true);
                }}
                className="h-6 text-[10px] font-bold text-amber-400 hover:bg-amber-500/10 gap-1 rounded-lg cursor-pointer"
                title="Insert subtitle block at current playhead"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Subtitle</span>
              </Button>

              <span className="font-mono text-[11px] text-primary font-bold">
                {formatTimecode(currentTime)} /{' '}
                {formatTimecode(
                  (segments[0]?.start || 0) + (currentClip?.duration || 30)
                )}
              </span>
            </div>
          </div>

          {/* LAYER 1: VIDEO / GAMEPLAY TRACK */}
          <div className="flex items-center gap-1.5 h-14 bg-zinc-900/90 rounded-xl p-1 border border-indigo-500/30 relative overflow-hidden group">
            <div className="absolute left-2 z-10 text-[9px] font-black uppercase tracking-wider bg-black/70 text-indigo-300 px-2 py-0.5 rounded pointer-events-none flex items-center gap-1 border border-indigo-500/20">
              <Film className="w-3 h-3 text-indigo-400" />
              <span>
                V1 • {isGaming ? 'GTA 6 Gameplay (4K)' : 'Video Master'}
              </span>
            </div>
            {segments.map((seg, idx) => {
              const active = idx === activeSegmentIndex;
              return (
                <div
                  key={seg.id}
                  onClick={() => {
                    setActiveSegmentIndex(idx);
                    setActiveTab(seg.isStock ? 'media' : 'framing');
                  }}
                  className={cn(
                    'h-full flex-1 rounded-lg border p-2 flex items-center justify-between cursor-pointer transition-all relative overflow-hidden',
                    active
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-bold ring-2 ring-indigo-500/30 shadow-xs'
                      : seg.isStock
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:border-amber-500/70'
                        : 'border-white/10 bg-indigo-950/40 text-muted-foreground hover:border-indigo-500/50'
                  )}
                >
                  <div className="truncate pl-24">
                    <p className="text-xs font-bold truncate text-foreground">
                      {seg.fileName}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {formatTimecode(seg.start)} - {formatTimecode(seg.end)} (
                      {Math.round(seg.duration)}s)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* LAYER 2: CAPTIONS / SUBTITLE TRACK (Synchronized Visual Blocks) */}
          <div className="relative h-12 bg-zinc-900/90 rounded-xl p-1 border border-amber-500/30 overflow-hidden flex items-center">
            <div className="absolute left-2 z-10 text-[9px] font-black uppercase tracking-wider bg-black/70 text-amber-300 px-2 py-0.5 rounded pointer-events-none flex items-center gap-1 border border-amber-500/20">
              <Type className="w-3 h-3 text-amber-400" />
              <span>T1 • Captions ({captions.length})</span>
            </div>

            {/* Horizontal timeline blocks placed proportionally */}
            <div className="relative w-full h-full pl-24 pr-2 flex items-center">
              {captions.map((cap, cIdx) => {
                const totalDur = currentClip?.duration || 30;
                const leftPct = Math.max(
                  0,
                  Math.min(95, (cap.start / totalDur) * 100)
                );
                const widthPct = Math.max(
                  4,
                  Math.min(
                    100 - leftPct,
                    ((cap.end - cap.start) / totalDur) * 100
                  )
                );
                const isSelected = selectedCaptionId === cap.id;
                const isPlayingActive =
                  currentTime - (segments[0]?.start || 0) >= cap.start &&
                  currentTime - (segments[0]?.start || 0) <= cap.end;

                return (
                  <div
                    key={cap.id || cIdx}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCaptionId(cap.id);
                      handleSeek((segments[0]?.start || 0) + cap.start);
                    }}
                    className={cn(
                      'h-8 rounded-md px-1.5 flex items-center justify-between text-[10px] font-medium transition-all cursor-pointer truncate border shadow-xs',
                      isSelected
                        ? 'bg-amber-400 text-black font-bold ring-2 ring-white border-white z-20 shadow-md'
                        : isPlayingActive
                          ? 'bg-amber-500 text-white font-bold border-amber-300 z-10 animate-pulse'
                          : 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border-amber-500/40'
                    )}
                    title={cap.textEnglish || cap.text}
                  >
                    <span className="truncate pr-1 text-[9px]">
                      {cap.textEnglish || cap.text || `Line #${cIdx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LAYER 3: AUDIO & LUFS NORMALIZATION TRACK */}
          <div
            onClick={() => setActiveTab('audio')}
            className="flex items-center h-8 bg-zinc-900/90 rounded-xl px-3 border border-emerald-500/30 text-[10px] font-mono text-muted-foreground justify-between cursor-pointer hover:border-emerald-500/60 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Volume2 className="w-3 h-3 text-emerald-400" />
              <span>A1 • Master Audio (Normalized -14 LUFS)</span>
            </span>
            <div className="flex items-center gap-3 text-emerald-300/80">
              <span>Fade In: {fadeIn}s</span>
              <span>Fade Out: {fadeOut}s</span>
              <span>Volume: {Math.round(audioVolume * 100)}%</span>
            </div>
          </div>

          {/* INLINE SUBTITLE QUICK INSPECTOR (Studio Inline Editor) */}
          {selectedCaptionId && (
            <div className="p-2.5 rounded-xl bg-card border border-primary/40 flex flex-wrap items-center justify-between gap-2 shadow-sm animate-in fade-in">
              {(() => {
                const targetCap = captions.find(
                  (c) => c.id === selectedCaptionId
                );
                if (!targetCap) return null;
                return (
                  <>
                    <div className="flex-1 min-w-[220px] flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-mono shrink-0">
                        Editing Line
                      </Badge>
                      <Input
                        value={targetCap.textEnglish || targetCap.text || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCaptions((prev) =>
                            prev.map((c) =>
                              c.id === targetCap.id
                                ? {
                                    ...c,
                                    text: val,
                                    textEnglish: val,
                                    textUrdu: isGaming ? '' : val,
                                  }
                                : c
                            )
                          );
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Type subtitle line..."
                        className="h-8 text-xs font-medium bg-background"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        <span className="text-muted-foreground text-[10px]">
                          Start:
                        </span>
                        <Input
                          type="number"
                          step="0.1"
                          value={targetCap.start}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCaptions((prev) =>
                              prev.map((c) =>
                                c.id === targetCap.id ? { ...c, start: val } : c
                              )
                            );
                            setHasUnsavedChanges(true);
                          }}
                          className="h-7 w-16 text-[11px] px-1 font-mono"
                        />
                        <span className="text-muted-foreground text-[10px]">
                          End:
                        </span>
                        <Input
                          type="number"
                          step="0.1"
                          value={targetCap.end}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setCaptions((prev) =>
                              prev.map((c) =>
                                c.id === targetCap.id ? { ...c, end: val } : c
                              )
                            );
                            setHasUnsavedChanges(true);
                          }}
                          className="h-7 w-16 text-[11px] px-1 font-mono"
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCaptions((prev) =>
                            prev.filter((c) => c.id !== targetCap.id)
                          );
                          setSelectedCaptionId(null);
                          setHasUnsavedChanges(true);
                        }}
                        className="h-7 px-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 text-xs cursor-pointer"
                        title="Delete this subtitle line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCaptionId(null)}
                        className="h-7 px-2 text-muted-foreground text-xs cursor-pointer"
                      >
                        Done
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </Card>

      {/* Islamic Stock Footage Discovery Drawer (80% Left Sidebar) */}
      <IslamicStockGalleryModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onAddToTimeline={handleAddStockToTimeline}
        targetDuration={currentClip?.duration || 35}
        shortTitle={currentClip?.title || 'Active Short'}
        onImportToMediaBin={(importedItem) => {
          setMediaBin((prev) => [...prev, importedItem]);
        }}
      />

      {/* Thumbnail Editor Modal */}
      <ThumbnailEditorModal
        isOpen={isThumbModalOpen}
        onClose={() => setIsThumbModalOpen(false)}
        isGaming={isGaming}
        contentType={isGaming ? 'gaming-gta' : 'naat-recitation'}
        initialFrameUrl={
          currentClip.thumbnailUrl ||
          videoSource?.thumbnailMaxRes ||
          videoSource?.thumbnailUrl
        }
        clipTitle={
          currentClip.title ||
          (isGaming ? 'GTA 6 Stunt & Action' : 'فاصلوں کو تکلف ہے ہم سے اگر')
        }
        clipSubline={
          isGaming
            ? captions[0]?.textEnglish ||
              captions[0]?.text ||
              currentClip.categoryName ||
              'High-Speed Action'
            : currentClip.primaryVerse ||
              captions[0]?.textUrdu ||
              captions[0]?.text ||
              'قاری شاہد محمود'
        }
        onSaveThumbnail={(dataUrl) => {
          setCurrentClip((prev) => ({ ...prev, thumbnailUrl: dataUrl }));
        }}
      />

      {/* Urdu & Roman Urdu Caption Review & Editor Modal */}
      <TranscriptEditorModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        clip={{ ...currentClip, captions }}
        onSaveCaptions={(newCaptions) => {
          setCaptions(newCaptions);
          pushHistory({ segments, captions: newCaptions });
          setHasUnsavedChanges(true);
          if (onUpdateClip) {
            onUpdateClip({
              ...currentClip,
              captions: newCaptions,
            });
          }
          showSuccess(
            'Captions Updated',
            'Changes applied to Shorts preview and renderer.'
          );
        }}
      />
      {/* 9:16 Fullscreen Shorts Preview Modal */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl flex items-center justify-between z-10 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <span className="text-xs font-black uppercase tracking-wider bg-primary/20 text-primary px-2.5 py-1 rounded-full border border-primary/30">
                9:16 Fullscreen Shorts Preview
              </span>
              <span className="text-xs font-mono text-white/70">
                Short #{clip.index || 1} • {Math.round(clip.duration || 30)}s
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={closeFullscreenPreview}
              className="rounded-xl border-white/20 text-white bg-white/10 hover:bg-white/20 h-8 px-3 gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close (ESC)</span>
            </Button>
          </div>

          {/* Center High-Definition Vertical Preview Screen */}
          <div className="relative h-[75vh] sm:h-[80vh] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black flex items-center justify-center my-auto">
            {clip?.categoryName && (
              <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/40 text-white text-xs font-bold shadow-lg pointer-events-none">
                <span>{clip.categoryIcon || '🎮'}</span>
                <span className="text-purple-300 uppercase tracking-wider text-[10px] font-black">
                  {clip.categoryBadge || clip.categoryName}
                </span>
                <span className="text-white/60 text-[10px]">
                  • {clip.score}% Viral
                </span>
              </div>
            )}
            <canvas
              className="w-full h-full object-contain cursor-pointer"
              ref={(fsCanvas) => {
                fsCanvasRef.current = fsCanvas;
                if (fsCanvas && canvasRef.current) {
                  fsCanvas.width = canvasRef.current.width || 1080;
                  fsCanvas.height = canvasRef.current.height || 1920;
                  const fsCtx = fsCanvas.getContext('2d');
                  if (fsCtx) {
                    fsCtx.drawImage(canvasRef.current, 0, 0);
                  }
                }
              }}
              onClick={togglePlay}
            />
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-2xl"
                aria-label="Play video"
              >
                <Play className="w-10 h-10 ml-1.5" />
              </button>
            )}
          </div>

          {/* Bottom Playback Bar */}
          <div className="w-full max-w-md flex items-center justify-between gap-3 p-2 rounded-2xl bg-card/90 border border-white/10 shadow-lg text-white">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlay}
              className="h-8 px-3 rounded-xl hover:bg-white/10 text-white cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 mr-1.5" />
              ) : (
                <Play className="w-4 h-4 mr-1.5" />
              )}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            <span className="font-mono text-xs text-white/80">
              {formatTimecode(currentTime)} /{' '}
              {formatTimecode(clip.end || clip.duration || 30)}
            </span>
            <Button
              size="sm"
              variant={subtitlesEnabled ? 'default' : 'outline'}
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              className="h-8 px-3 rounded-xl text-xs font-bold cursor-pointer"
            >
              Subtitles: {subtitlesEnabled ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
