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
  allClips = [],
}) {
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
      fileName: videoSource.fileName || 'Recitation Source',
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
    clip.framingMode || 'trending-ai-speaker'
  );
  const [manualCropX, setManualCropX] = useState(50); // 0 to 100%

  // Stream URL
  const videoStreamUrl =
    videoSource?.blobUrl || videoSource?.videoUrl || videoSource?.url || null;

  // Audio Settings
  const [audioVolume, setAudioVolume] = useState(1.0);
  const [fadeIn, setFadeIn] = useState(0.5);
  const [fadeOut, setFadeOut] = useState(0.5);
  const [normalizeAudio, setNormalizeAudio] = useState(true);

  // Captions State & Styling (Subtitles OFF by default; generated on-demand)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(
    Boolean(
      clip.captions &&
      clip.captions.length > 0 &&
      clip.syncStatus === 'synchronized'
    )
  );
  const [captions, setCaptions] = useState(clip.captions || []);
  const [captionMode, setCaptionMode] = useState(
    clip.captionMode || 'dual-urdu-roman'
  );
  const [captionStyle, setCaptionStyle] = useState('beast-bold');
  const [captionFontSize, setCaptionFontSize] = useState(24);
  const [captionPosition, setCaptionPosition] = useState(76); // percent from top
  const [bgOpacity, setBgOpacity] = useState(0.72);
  const [isSyncingCaptions, setIsSyncingCaptions] = useState(false);
  const [isThumbModalOpen, setIsThumbModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  // Keyboard shortcut listener ('c' toggles subtitles)
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subtitlesEnabled]);

  // Re-align selected Short's Urdu transcript with its exact audio slice
  const handleSyncUrduCaptions = async () => {
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
          videoUrl: videoStreamUrl,
          existingCaptions: captions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync captions with audio.');
      }
      setCaptions(data.captions);
      setSubtitlesEnabled(true);
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
        'Urdu Captions Synchronized!',
        `Aligned ${data.stats?.wordsCount || 0} words directly to Short #${clip.index || 1}'s audio.`
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
  const timelineRef = useRef(null);
  const lastReportedTimeRef = useRef(clip.start);

  // Extract available phrases from video transcript or clip captions
  useEffect(() => {
    if (clip.captions && clip.captions.length > 0) {
      setAvailablePhrases(clip.captions);
    } else if (videoSource.transcript) {
      // Parse transcript into phrase cards
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
  }, [clip, videoSource]);

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
          if (manualCropX !== 50 && framingMode === 'manual') {
            cx = maxCX * (manualCropX / 100);
          }

          if (framingMode === 'blurred-bg') {
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
      }

      if (isPlaying) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

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
  const handleSplitSegment = useCallback(() => {
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

    const cutId = `seg-${Date.now()}`;
    const seg1 = {
      ...activeSeg,
      id: `${cutId}-a`,
      end: currentTime,
      duration: currentTime - activeSeg.start,
    };

    const seg2 = {
      ...activeSeg,
      id: `${cutId}-b`,
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
  }, [
    segments,
    activeSegmentIndex,
    currentTime,
    pushHistory,
    captions,
    showToast,
  ]);

  const togglePlayRef = useRef(togglePlay);
  const handleSplitSegmentRef = useRef(handleSplitSegment);

  useEffect(() => {
    togglePlayRef.current = togglePlay;
    handleSplitSegmentRef.current = handleSplitSegment;
  });

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
      {/* Top Header Bar: Mode Indicator & Global Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-4 rounded-3xl border border-border/70 bg-card/90 backdrop-blur-md shadow-lg">
        {/* Left Side: Back & Project Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToGallery}
            className="rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Clips Gallery</span>
          </Button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <span>
                  {editorMode === 'short'
                    ? `Editing Short #${currentClip.index || 1}`
                    : 'Full Video Master Mode'}
                </span>
                <Badge
                  className={cn(
                    'text-[10px] font-mono',
                    editorMode === 'short'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  )}
                >
                  {editorMode === 'short' ? 'Bounded Short' : 'Full Video'}
                </Badge>
              </h2>
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-amber-500 border-amber-500/40"
                >
                  Unsaved Edits
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-sm sm:max-w-md">
              {currentClip.title ||
                videoSource.title ||
                'Naat Recitation Project'}
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher & Aspect Ratio */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher Button */}
          <Button
            size="sm"
            variant={editorMode === 'short' ? 'secondary' : 'default'}
            onClick={toggleEditorMode}
            className="rounded-xl text-xs font-bold cursor-pointer h-8"
          >
            <Film className="w-3.5 h-3.5 mr-1.5" />
            <span>
              {editorMode === 'short'
                ? 'Switch to Full Video'
                : 'Return to Short Mode'}
            </span>
          </Button>

          {/* Aspect Ratio Switcher */}
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
              'rounded-xl text-xs font-bold cursor-pointer h-8 gap-1.5 transition-all shadow-xs',
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
            <span>Subtitles: {subtitlesEnabled ? 'ON' : 'OFF'}</span>
          </Button>

          {/* Subtitle Script Mode Selector */}
          {subtitlesEnabled && (
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setCaptionMode('urdu')}
                className={cn(
                  'px-2 py-1 rounded-lg transition-all cursor-pointer',
                  captionMode === 'urdu'
                    ? 'bg-primary text-primary-foreground'
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
                  'px-2 py-1 rounded-lg transition-all cursor-pointer',
                  captionMode === 'roman-urdu'
                    ? 'bg-primary text-primary-foreground'
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
                  'px-2 py-1 rounded-lg transition-all cursor-pointer',
                  captionMode === 'dual-urdu-roman'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Dual Stacked: Urdu on top, Roman Urdu below"
              >
                Dual
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Apply, Sync & Render Actions */}
        <div className="flex items-center gap-2">
          {/* Prominent On-Demand Generate / Sync Subtitles Action */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSyncUrduCaptions}
            disabled={isSyncingCaptions}
            className="rounded-xl text-xs font-bold cursor-pointer h-9 gap-1.5 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 shadow-xs"
            title="Generate or sync this Short's Urdu captions directly against its audio"
          >
            <Sparkles
              className={cn(
                'w-3.5 h-3.5 text-amber-500',
                isSyncingCaptions && 'animate-spin'
              )}
            />
            <span>
              {isSyncingCaptions
                ? 'Transcribing Speech...'
                : captions?.length > 0
                  ? 'Re-Sync Urdu Captions'
                  : '✨ Generate Urdu Subtitles'}
            </span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsThumbModalOpen(true)}
            className="rounded-xl text-xs font-bold cursor-pointer h-9 gap-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/30"
            title="Download Short Thumbnail in Kumail Urdu Font"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Thumbnail (Kumail Font)</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleApplyChanges}
            className={cn(
              'rounded-xl text-xs font-bold cursor-pointer h-9 gap-1.5',
              hasUnsavedChanges && 'border-primary text-primary bg-primary/5'
            )}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </Button>

          <Button
            size="sm"
            onClick={handleInitiateExport}
            className="rounded-xl text-xs sm:text-sm font-black cursor-pointer h-9 sm:h-10 px-4 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all ring-1 ring-emerald-400/40"
          >
            <Download className="w-4 h-4" />
            <span>Download Short Video</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Workspace: Responsive 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Column 1: Shorts Feed (3 Cols when allClips has multiple items) */}
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
          <Card className="rounded-3xl border-border/70 overflow-hidden bg-black/95 shadow-xl p-3 flex flex-col items-center justify-center relative min-h-[440px]">
            {/* Offscreen Video element used as render source */}
            {videoStreamUrl && (
              <video
                ref={videoRef}
                src={videoStreamUrl}
                crossOrigin="anonymous"
                playsInline
                preload="auto"
                className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1"
                onLoadedMetadata={(e) => {
                  const initialTime = segments[0]?.start ?? clip?.start ?? 0;
                  e.currentTarget.currentTime = initialTime;
                  setCurrentTime(initialTime);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
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

            {/* Rendered Live Monitor Output */}
            <div
              className={cn(
                'relative max-w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10 bg-black',
                aspectRatio === '9:16'
                  ? 'aspect-[9/16] h-[480px]'
                  : aspectRatio === '1:1'
                    ? 'aspect-square h-[420px]'
                    : 'aspect-[16/9] w-full max-h-[420px]'
              )}
            >
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
                <span>Phrases</span>
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
                onClick={() => setActiveTab('media')}
                className={cn(
                  'py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1',
                  activeTab === 'media'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>B-Roll</span>
              </button>
            </div>

            {/* TAB 1: Phrase-Based Short Creation & Selection System */}
            {activeTab === 'phrases' && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold text-xs">
                      Recitation Phrases ({availablePhrases.length})
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Select verses to create or expand your Short.
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

                        {/* Urdu Script Line */}
                        {phrase.textUrdu && (
                          <p
                            className="font-urdu text-right text-xs text-foreground font-medium pr-1"
                            dir="rtl"
                          >
                            {phrase.textUrdu}
                          </p>
                        )}

                        {/* Roman Urdu Line */}
                        <p className="font-sans text-xs text-muted-foreground font-medium">
                          {phrase.textRoman || phrase.text}
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
                {/* Caption Mode Selector */}
                <div className="space-y-1.5">
                  <Label className="font-bold flex items-center justify-between text-xs">
                    <span>Subtitle Display Mode</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-primary border-primary/30 font-mono"
                    >
                      {captionMode === 'dual-urdu-roman'
                        ? 'Stacked 2-Line'
                        : captionMode === 'urdu'
                          ? 'Urdu Nastaliq'
                          : 'Roman Urdu'}
                    </Badge>
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CAPTION_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setCaptionMode(mode.id);
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
                  <span>Review &amp; Edit Urdu / Roman Captions</span>
                </Button>

                {/* Editable Subtitle Lines List */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[190px] pr-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-xs">
                      Live Text &amp; Timing Correction
                    </Label>
                    <button
                      type="button"
                      onClick={handleSyncUrduCaptions}
                      disabled={isSyncingCaptions}
                      className="text-[10px] font-bold text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Sync Urdu Captions with Audio"
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

                  {captions.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-border/80 text-center space-y-2 bg-muted/20 my-1">
                      <Sparkles className="w-5 h-5 text-amber-500 mx-auto" />
                      <p className="text-xs font-bold text-foreground">
                        No Subtitles Generated Yet
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Generate authentic Urdu Nastaliq &amp; Roman Urdu dual
                        subtitles directly from this Short&apos;s audio slice
                        whenever you like.
                      </p>
                      <Button
                        size="sm"
                        onClick={handleSyncUrduCaptions}
                        disabled={isSyncingCaptions}
                        className="rounded-xl text-xs font-bold gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 mt-1 shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {isSyncingCaptions
                            ? 'Transcribing Audio...'
                            : 'Generate Urdu AI Subtitles'}
                        </span>
                      </Button>
                    </div>
                  ) : (
                    captions.map((cap, i) => {
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
                              #{i + 1}{' '}
                              {cap.isVerseBoundary ? '• Verse End' : ''}
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
                                  clipElapsed >= w.start &&
                                  clipElapsed <= w.end;
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
                    })
                  )}

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
            <Button
              size="sm"
              onClick={handleInitiateExport}
              className="rounded-xl text-xs font-bold cursor-pointer h-8 px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Short</span>
            </Button>

            <div className="h-4 w-px bg-border/60 mx-1" />

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

        {/* Visual Timeline Track Container */}
        <div
          ref={timelineRef}
          className="relative w-full overflow-x-auto min-h-[140px] bg-muted/20 rounded-2xl border border-border/40 p-2 space-y-2 select-none"
        >
          {/* Track 1: Video Track */}
          <div className="flex items-center gap-1.5 h-14 bg-background/80 rounded-xl p-1 border border-border/50 relative">
            <div className="absolute left-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 pointer-events-none">
              Video Track
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
                      ? 'border-primary bg-primary/20 text-primary font-bold ring-2 ring-primary/30 shadow-xs'
                      : seg.isStock
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-500 hover:border-amber-500/70'
                        : 'border-border/60 bg-muted/50 text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{seg.fileName}</p>
                    <p className="text-[10px] font-mono">
                      {formatTimecode(seg.start)} - {formatTimecode(seg.end)} (
                      {Math.round(seg.duration)}s)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Track 2: Audio Track */}
          <div
            onClick={() => setActiveTab('audio')}
            className="flex items-center h-8 bg-background/60 rounded-xl px-3 border border-border/30 text-[10px] font-mono text-muted-foreground justify-between cursor-pointer hover:border-primary/40 transition-colors"
          >
            <span className="flex items-center gap-1 font-bold text-primary">
              <Volume2 className="w-3 h-3" />
              <span>Audio (Normalized -14 LUFS)</span>
            </span>
            <span>Volume: {Math.round(audioVolume * 100)}%</span>
          </div>

          {/* Track 3: Captions Track */}
          <div
            onClick={() => setActiveTab('captions')}
            className="flex items-center h-8 bg-background/60 rounded-xl px-3 border border-border/30 text-[10px] font-mono text-muted-foreground justify-between cursor-pointer hover:border-amber-500/40 transition-colors"
          >
            <span className="flex items-center gap-1 font-bold text-amber-500">
              <Type className="w-3 h-3" />
              <span>
                Viral Captions ({captions.length} phrases synchronized)
              </span>
            </span>
            <span className="text-foreground capitalize">{captionMode}</span>
          </div>
        </div>
      </Card>

      {/* Islamic Stock Footage Discovery Drawer (80% Left Sidebar) */}
      <IslamicStockGalleryModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onAddToTimeline={handleAddStockToTimeline}
        onImportToMediaBin={(importedItem) => {
          setMediaBin((prev) => [...prev, importedItem]);
        }}
        targetDuration={
          segments[activeSegmentIndex]?.duration || currentClip?.duration || 30
        }
      />

      {/* Thumbnail Editor Modal with Kumail Urdu Font */}
      <ThumbnailEditorModal
        isOpen={isThumbModalOpen}
        onClose={() => setIsThumbModalOpen(false)}
        initialFrameUrl={
          currentClip.thumbnailUrl ||
          videoSource?.thumbnailMaxRes ||
          videoSource?.thumbnailUrl
        }
        clipTitle={currentClip.title || 'فاصلوں کو تکلف ہے ہم سے اگر'}
        clipSubline={
          currentClip.primaryVerse ||
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
    </div>
  );
}
