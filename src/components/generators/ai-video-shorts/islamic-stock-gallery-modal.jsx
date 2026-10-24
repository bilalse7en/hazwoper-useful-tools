'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Download,
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  FileVideo,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  Clock,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { showToast, showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';

const POPULAR_ISLAMIC_TAGS = [
  'All Islamic',
  'Makkah',
  'Madinah',
  'Kaaba & Tawaf',
  'Masjid an-Nabawi',
  'Roza e Rasool',
  'Quran & Calligraphy',
  'Mosques & Minarets',
  'Dua & Supplication',
  'Ramadan & Eid',
];

// Module-level persistent cache across modal open/close during session
let sessionPersistentSelectedIds = [];
let sessionPersistentCardStates = {};

const formatTimecode = (sec) => {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const remain = s % 60;
  return `${String(m).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
};

export function IslamicStockGalleryModal({
  isOpen,
  onClose,
  onAddToTimeline,
  onImportToMediaBin,
  selectedIds: propSelectedIds,
  onSelectionChange,
  targetDuration = 30,
}) {
  const [query, setQuery] = useState('islamic');
  const [provider, setProvider] = useState('all');
  const [timingFilter, setTimingFilter] = useState('all'); // 'all' | 'match' | 'longer'
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // In-Sidebar Preview Workspace Player States
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(15);
  const [previewBuffering, setPreviewBuffering] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewRetryNonce, setPreviewRetryNonce] = useState(0);
  const [appliedVideoId, setAppliedVideoId] = useState(null);
  const previewVideoRef = useRef(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const limit = 12;

  // Multi-Selection & Import Queue State (Persists across modal open/close)
  const [selectedIds, setSelectedIds] = useState(
    propSelectedIds || sessionPersistentSelectedIds
  );
  const [cardStates, setCardStates] = useState(sessionPersistentCardStates);
  const [queueSummary, setQueueSummary] = useState(null); // { total, saved, downloading, failed }

  // Sync prop changes
  useEffect(() => {
    if (propSelectedIds && Array.isArray(propSelectedIds)) {
      sessionPersistentSelectedIds = propSelectedIds;
      setSelectedIds(propSelectedIds);
    }
  }, [propSelectedIds]);

  const updateSelectedIds = (updater) => {
    setSelectedIds((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      sessionPersistentSelectedIds = next;
      if (onSelectionChange) onSelectionChange(next);
      return next;
    });
  };

  const updateCardState = (id, state) => {
    sessionPersistentCardStates[id] = state;
    setCardStates((prev) => ({ ...prev, [id]: state }));
  };

  const fetchVideos = async (
    searchQuery = query,
    providerFilter = provider,
    targetPage = 1
  ) => {
    setIsLoading(true);
    try {
      const qParam =
        searchQuery === 'All Islamic' || searchQuery === 'All'
          ? 'islamic'
          : searchQuery;
      const res = await fetch(
        `/api/video-shorts/stock-videos?q=${encodeURIComponent(qParam)}&provider=${encodeURIComponent(providerFilter)}&page=${targetPage}&limit=${limit}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.videos)) {
        setVideos(data.videos);
        setPage(data.page || targetPage);
        setTotalPages(
          data.totalPages ||
            Math.ceil((data.total || data.videos.length) / limit) ||
            1
        );
        setTotalVideos(data.total || data.videos.length);
      }
    } catch (err) {
      console.warn('Stock gallery fetch error:', err);
      showToast(
        'Could not load stock video gallery. Using verified local Islamic stock assets.',
        'info'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchVideos(query, provider, 1);
    }
  }, [isOpen]);

  // Debounced search on query/provider change
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchVideos(query, provider, 1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, provider]);

  // Reset preview player states when selecting another preview video
  useEffect(() => {
    if (previewVideo) {
      setPreviewTime(0);
      setPreviewBuffering(true);
      setPreviewError(null);
      setPreviewPlaying(true);
      setPreviewDuration(previewVideo.duration || 15);
    }
  }, [previewVideo, previewRetryNonce]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVideos(query, provider, 1);
  };

  const handleTagClick = (tag) => {
    setQuery(tag);
    fetchVideos(tag, provider, 1);
  };

  const handleCopyAttribution = (video) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        video.attribution || `${video.title} - ${video.license}`
      );
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2500);
      showToast(
        'Attribution text copied to clipboard! Ready to paste into your YouTube video description.',
        'success'
      );
    }
  };

  // Duration match calculation
  const isVideoTimingMatch = (vid) => {
    const vDur = vid.duration || 15;
    return (
      Math.abs(vDur - targetDuration) <= 10 ||
      (vDur >= targetDuration && vDur <= targetDuration + 30)
    );
  };

  // Filter displayed videos by timing match pill
  const displayedVideos = videos.filter((vid) => {
    if (timingFilter === 'match') {
      return isVideoTimingMatch(vid);
    }
    if (timingFilter === 'longer') {
      return (vid.duration || 15) >= targetDuration;
    }
    return true;
  });

  // Direct MP4 Download to User's Computer
  const handleDownloadDirect = async (video, e) => {
    if (e) e.stopPropagation();
    try {
      showToast(`Starting direct download for "${video.title}"...`, 'info');
      const a = document.createElement('a');
      a.href = video.videoUrl;
      a.download = `${video.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showSuccess(
        'Download Initiated!',
        `Saving "${video.title}" MP4 file directly.`
      );
    } catch (err) {
      console.error('Direct download error:', err);
      if (typeof window !== 'undefined') {
        window.open(video.videoUrl, '_blank');
      }
    }
  };

  // Toggle single item selection
  const toggleSelect = (id) => {
    updateSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllCurrentPage = () => {
    const pageIds = displayedVideos.map((v) => v.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      updateSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      updateSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Single Item Save to Media Hub
  const handleImportToHub = async (video) => {
    updateCardState(video.id, 'downloading');
    try {
      updateCardState(video.id, 'saving');
      const res = await fetch('/api/video-shorts/stock-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockVideo: video }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import video into Media Hub.');
      }

      updateCardState(video.id, 'saved');
      showSuccess(
        'Saved to Media Hub!',
        `"${video.title}" is permanently persisted in your Media Hub.`
      );
      if (onImportToMediaBin && data.mediaItem) {
        onImportToMediaBin(data.mediaItem);
      }
    } catch (err) {
      console.error('Import error:', err);
      updateCardState(video.id, 'failed');
      showToast(err.message || 'Failed to download stock video.', 'error');
    }
  };

  // Bulk Save Selected to Media Hub
  const handleSaveSelectedToHub = async () => {
    const itemsToSave = videos.filter((v) => selectedIds.includes(v.id));
    if (itemsToSave.length === 0) return;

    setQueueSummary({
      total: itemsToSave.length,
      saved: 0,
      downloading: itemsToSave.length,
      failed: 0,
    });

    for (const vid of itemsToSave) {
      updateCardState(vid.id, 'saving');
      try {
        const res = await fetch('/api/video-shorts/stock-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stockVideo: vid }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          updateCardState(vid.id, 'saved');
          setQueueSummary((prev) => ({
            ...prev,
            saved: prev.saved + 1,
            downloading: Math.max(0, prev.downloading - 1),
          }));
          if (onImportToMediaBin && data.mediaItem) {
            onImportToMediaBin(data.mediaItem);
          }
        } else {
          throw new Error('Import failed');
        }
      } catch (err) {
        updateCardState(vid.id, 'failed');
        setQueueSummary((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          downloading: Math.max(0, prev.downloading - 1),
        }));
      }
    }

    showSuccess(
      'Batch Import Complete!',
      'Selected Islamic B-roll assets processed into your permanent Media Hub.'
    );
  };

  const handleAddToShort = (video) => {
    if (onAddToTimeline) {
      onAddToTimeline(video);
      setAppliedVideoId(video.id);
      showSuccess(
        'B-Roll Applied to Short!',
        `"${video.title}" applied as visual source. Original recitation audio is preserved.`
      );
    }
  };

  // In-Sidebar Preview Player Controls
  const togglePreviewPlay = () => {
    const el = previewVideoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play()
        .then(() => setPreviewPlaying(true))
        .catch(() => setPreviewPlaying(false));
    } else {
      el.pause();
      setPreviewPlaying(false);
    }
  };

  const togglePreviewMute = () => {
    const el = previewVideoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setPreviewMuted(el.muted);
  };

  const handlePreviewSeek = (val) => {
    const el = previewVideoRef.current;
    if (!el) return;
    el.currentTime = val;
    setPreviewTime(val);
  };

  const handlePreviewRestart = () => {
    const el = previewVideoRef.current;
    if (!el) return;
    el.currentTime = 0;
    setPreviewTime(0);
    el.play()
      .then(() => setPreviewPlaying(true))
      .catch(() => {});
  };

  const handleRetryPreviewSource = () => {
    setPreviewError(null);
    setPreviewBuffering(true);
    setPreviewRetryNonce((n) => n + 1);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Islamic & Scenic B-Roll Workspace"
      className="fixed inset-0 z-[9990] flex justify-start bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* 80% Left Sidebar Workspace Drawer (100% on mobile, 85% on tablet, 80% on desktop) */}
      <aside className="relative w-full sm:w-[88vw] lg:w-[80vw] h-full bg-card text-card-foreground border-r border-border shadow-2xl flex flex-col z-20 overflow-hidden animate-in slide-in-from-left duration-300">
        {/* Workspace Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-border/70 bg-card/95 backdrop-blur-sm shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-xs shrink-0 border border-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-foreground">
                    Islamic &amp; Scenic B-Roll Studio
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-emerald-500 border-emerald-500/30 font-bold bg-emerald-500/5"
                  >
                    Makkah &amp; Madinah Sanctuary
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-primary border-primary/30 font-bold bg-primary/5 flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Target Short: ~{Math.round(targetDuration)}s</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verified authentic Islamic footage. Preview, match duration,
                  and replace visual sources with 1-click.
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveSelectedToHub}
                    className="font-bold rounded-xl text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-md h-8"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save Selected ({selectedIds.length})</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateSelectedIds([])}
                    className="rounded-xl text-xs h-8"
                  >
                    Clear
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive cursor-pointer shrink-0"
                title="Close Sidebar (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Batch Import Live Status Banner */}
          {queueSummary && queueSummary.downloading > 0 && (
            <div className="mt-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-primary">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Saving {queueSummary.total} videos to Media Hub...
                  </span>
                </span>
                <span className="font-mono text-foreground">
                  {queueSummary.saved} saved • {queueSummary.downloading} active
                  • {queueSummary.failed} failed
                </span>
              </div>
              <Progress
                value={Math.round(
                  (queueSummary.saved / queueSummary.total) * 100
                )}
                className="h-2 rounded-full"
              />
            </div>
          )}

          {/* Search bar & Provider Filter */}
          <form
            onSubmit={handleSearchSubmit}
            className="pt-3 flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Makkah, Madinah, Kaaba, Tawaf, Masjid an-Nabawi, Roza e Rasool, Quran, Mosques..."
                className="pl-9 h-10 text-xs rounded-xl bg-background/80"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  fetchVideos(query, e.target.value, 1);
                }}
                className="h-10 px-3 text-xs rounded-xl bg-background border border-border text-foreground font-bold cursor-pointer"
              >
                <option value="all">All Providers</option>
                <option value="curated">Verified Islamic Library</option>
                <option value="pexels">Pexels Free Video</option>
                <option value="pixabay">Pixabay Creative</option>
                <option value="wikimedia">Wikimedia Commons</option>
              </select>
              <Button
                type="submit"
                size="sm"
                className="h-10 px-4 rounded-xl font-bold cursor-pointer"
              >
                <span>Search</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllCurrentPage}
                className="h-10 px-3 rounded-xl text-xs font-semibold"
                title="Select all on this page"
              >
                <Layers className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Select Page</span>
              </Button>
            </div>
          </form>

          {/* Islamic Category Tag Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 no-scrollbar">
            {POPULAR_ISLAMIC_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer border',
                  query.toLowerCase() === tag.toLowerCase()
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/50'
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Timing Match Filter Pills */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-2.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mr-1">
              Timing Match:
            </span>
            <button
              type="button"
              onClick={() => setTimingFilter('all')}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border',
                timingFilter === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted'
              )}
            >
              All Islamic Footage ({videos.length})
            </button>
            <button
              type="button"
              onClick={() => setTimingFilter('match')}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1',
                timingFilter === 'match'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              )}
            >
              <Sparkles className="w-3 h-3" />
              <span>
                ⚡ Matches Short Timing (~{Math.round(targetDuration)}s)
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTimingFilter('longer')}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border',
                timingFilter === 'longer'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
              )}
            >
              Longer Footage (&ge; {Math.round(targetDuration)}s)
            </button>
          </div>
        </div>

        {/* Workspace Body: Split-Pane In-Sidebar Preview (No Popup!) */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0 bg-muted/10">
          {/* Left/Top: In-Sidebar Integrated Preview Player */}
          {previewVideo && (
            <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-border/80 bg-card flex flex-col p-4 sm:p-5 space-y-3 shadow-lg overflow-y-auto">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-500">
                      In-Sidebar Preview
                    </span>
                    <h3
                      className="font-black text-xs sm:text-sm text-foreground truncate"
                      title={previewVideo.title}
                    >
                      {previewVideo.title}
                    </h3>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewVideo(null)}
                  className="rounded-xl text-xs h-7 px-2 font-bold cursor-pointer shrink-0 border-border/80 hover:bg-destructive/10 hover:text-destructive"
                  title="Close preview and return to full grid"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Full Grid</span>
                </Button>
              </div>

              {/* 9:16 Video Player Container */}
              <div className="relative w-full aspect-[9/16] max-h-[340px] sm:max-h-[380px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black mx-auto">
                <video
                  ref={previewVideoRef}
                  key={`${previewVideo.id}-${previewRetryNonce}`}
                  src={previewVideo.videoUrl}
                  playsInline
                  autoPlay
                  loop
                  muted={previewMuted}
                  className="w-full h-full object-cover"
                  onWaiting={() => setPreviewBuffering(true)}
                  onPlaying={() => setPreviewBuffering(false)}
                  onLoadedMetadata={(e) => {
                    setPreviewDuration(e.currentTarget.duration || 15);
                    setPreviewBuffering(false);
                  }}
                  onTimeUpdate={(e) => {
                    setPreviewTime(e.currentTarget.currentTime);
                  }}
                  onError={(e) => {
                    const mediaErr = e.currentTarget.error;
                    const errDetail = mediaErr
                      ? `Code ${mediaErr.code} (${mediaErr.message || 'Stream decode/network failure'})`
                      : 'Unknown media stream error';
                    console.warn(
                      'Preview video stream playback error:',
                      errDetail
                    );
                    setPreviewBuffering(false);
                    setPreviewError(
                      'Video stream failed or provider link expired. Please click Retry below to reconnect.'
                    );
                  }}
                />

                {/* Buffering Indicator Overlay */}
                {previewBuffering && !previewError && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white pointer-events-none">
                    <RefreshCw className="w-7 h-7 animate-spin text-primary" />
                    <span className="text-xs font-bold font-mono">
                      Buffering video stream...
                    </span>
                  </div>
                )}

                {/* Video Error & Retry Action Overlay */}
                {previewError && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-3 text-white">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-foreground">
                        Stream Unavailable
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {previewError}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleRetryPreviewSource}
                      className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 mt-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Loading Footage</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Scrubber & Player Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span>{formatTimecode(previewTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={previewDuration || 15}
                    step="0.1"
                    value={previewTime}
                    onChange={(e) =>
                      handlePreviewSeek(parseFloat(e.target.value))
                    }
                    className="flex-1 accent-primary h-1.5 bg-muted rounded-full cursor-pointer"
                  />
                  <span>{formatTimecode(previewDuration)}</span>
                </div>

                <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-card border border-border/70">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={togglePreviewPlay}
                      className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                      title={previewPlaying ? 'Pause' : 'Play'}
                    >
                      {previewPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handlePreviewRestart}
                      className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                      title="Restart Video"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={togglePreviewMute}
                      className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                      title={previewMuted ? 'Unmute' : 'Mute'}
                    >
                      {previewMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {previewVideo.provider}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      9:16 Portrait
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Timing Fit Comparison */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    Footage Duration:
                  </span>
                  <span className="font-bold text-foreground">
                    {Math.round(previewVideo.duration || 15)}s
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Short Duration:</span>
                  <span className="font-bold text-foreground">
                    {Math.round(targetDuration)}s
                  </span>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-border/30 text-[10px]">
                  <span className="text-muted-foreground">
                    Timing Alignment:
                  </span>
                  <span
                    className={cn(
                      'font-bold',
                      isVideoTimingMatch(previewVideo)
                        ? 'text-emerald-500'
                        : 'text-amber-500'
                    )}
                  >
                    {isVideoTimingMatch(previewVideo)
                      ? '⚡ Optimal Duration Fit'
                      : (previewVideo.duration || 15) < targetDuration
                        ? 'Loops Seamlessly'
                        : 'Covers Full Short'}
                  </span>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="space-y-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => handleAddToShort(previewVideo)}
                  className="w-full font-black text-xs h-10 rounded-xl gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {appliedVideoId === previewVideo.id
                      ? 'Applied to Short!'
                      : 'Apply as Visual Source'}
                  </span>
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleDownloadDirect(previewVideo, e)}
                    className="font-bold text-xs h-9 rounded-xl gap-1.5 cursor-pointer border-border/80"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </Button>

                  <Button
                    size="sm"
                    variant={
                      cardStates[previewVideo.id] === 'saved'
                        ? 'secondary'
                        : 'outline'
                    }
                    onClick={() => handleImportToHub(previewVideo)}
                    disabled={
                      cardStates[previewVideo.id] === 'saving' ||
                      cardStates[previewVideo.id] === 'downloading'
                    }
                    className={cn(
                      'font-bold text-xs h-9 rounded-xl gap-1.5 cursor-pointer border-border/80',
                      cardStates[previewVideo.id] === 'saved' &&
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    )}
                  >
                    {cardStates[previewVideo.id] === 'saved' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {cardStates[previewVideo.id] === 'saved'
                        ? 'Saved'
                        : 'Save to Hub'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Attribution */}
              <div className="p-2 rounded-xl bg-muted/30 border border-border/40 text-[10px] flex items-center justify-between gap-1 text-muted-foreground">
                <span className="truncate">
                  {previewVideo.author} • {previewVideo.license}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyAttribution(previewVideo)}
                  className="text-primary hover:underline font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === previewVideo.id ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>
                    {copiedId === previewVideo.id ? 'Copied' : 'Attribution'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Right/Main: Video Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <RefreshCw className="w-7 h-7 animate-spin text-primary" />
                <span className="text-xs font-bold">
                  Discovering authentic Islamic footage &amp; licenses...
                </span>
              </div>
            ) : displayedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-center text-muted-foreground">
                <FileVideo className="w-10 h-10 text-muted-foreground/60" />
                <p className="text-sm font-bold text-foreground">
                  No Islamic footage found matching your criteria.
                </p>
                <p className="text-xs max-w-sm">
                  Try switching the timing match filter or searching for Makkah,
                  Kaaba, Madinah, or Mosques.
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  'grid gap-4',
                  previewVideo
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                )}
              >
                {displayedVideos.map((vid) => {
                  const isSelected = selectedIds.includes(vid.id);
                  const state = cardStates[vid.id] || 'idle';
                  const isCurrentPreview = previewVideo?.id === vid.id;
                  const matchesShort = isVideoTimingMatch(vid);

                  return (
                    <div
                      key={vid.id}
                      className={cn(
                        'rounded-2xl border transition-all flex flex-col justify-between p-3 space-y-2.5 bg-card/90 shadow-xs hover:shadow-md',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 shadow-md'
                          : isCurrentPreview
                            ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                            : 'border-border/70 hover:border-border'
                      )}
                    >
                      {/* Top Bar: Checkbox + Title */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(vid.id)}
                            className="mt-1 w-4 h-4 rounded text-primary cursor-pointer accent-primary"
                          />
                          <div className="truncate">
                            <h4
                              className="font-bold text-xs text-foreground truncate"
                              title={vid.title}
                            >
                              {vid.title}
                            </h4>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {vid.author}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-black/70 text-[9px] font-mono shrink-0 text-white border-white/20">
                          {vid.provider}
                        </Badge>
                      </div>

                      {/* Video Thumbnail / In-Sidebar Preview Trigger */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setPreviewVideo(vid)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setPreviewVideo(vid);
                          }
                        }}
                        className="relative aspect-[9/16] max-h-[190px] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10 group cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/85 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                          {Math.round(vid.duration || 15)}s
                        </div>

                        {/* Timing Match Badge */}
                        {matchesShort && (
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>⚡ Matches Short</span>
                          </div>
                        )}

                        {appliedVideoId === vid.id && (
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Applied</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Preview, Apply, Download, Hub */}
                      <div className="space-y-1.5 pt-1">
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewVideo(vid)}
                            className="text-xs font-bold rounded-xl cursor-pointer h-7 gap-1"
                          >
                            <Play className="w-3 h-3" />
                            <span>Preview</span>
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleAddToShort(vid)}
                            className="text-xs font-bold rounded-xl cursor-pointer h-7 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Apply</span>
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleDownloadDirect(vid, e)}
                            className="text-[11px] font-bold rounded-xl cursor-pointer h-7 gap-1"
                            title="Direct MP4 Download"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </Button>

                          <Button
                            size="sm"
                            variant={
                              state === 'saved' ? 'secondary' : 'outline'
                            }
                            onClick={() => handleImportToHub(vid)}
                            disabled={
                              state === 'saving' || state === 'downloading'
                            }
                            className={cn(
                              'text-[11px] font-bold rounded-xl cursor-pointer h-7 gap-1',
                              state === 'saved' &&
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            )}
                          >
                            {state === 'saved' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            <span>
                              {state === 'saved' ? 'Saved' : 'To Hub'}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                <span className="text-muted-foreground font-mono">
                  Showing page <strong>{page}</strong> of{' '}
                  <strong>{totalPages}</strong> ({totalVideos} total videos)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchVideos(query, provider, Math.max(1, page - 1))
                    }
                    disabled={page <= 1 || isLoading}
                    className="rounded-xl h-8 px-2.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 mr-0.5" />
                    <span>Previous</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchVideos(
                        query,
                        provider,
                        Math.min(totalPages, page + 1)
                      )
                    }
                    disabled={page >= totalPages || isLoading}
                    className="rounded-xl h-8 px-2.5 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right 20% Backdrop (Click to close sidebar drawer) */}
      <div
        className="hidden sm:block flex-1 h-full cursor-pointer transition-colors"
        onClick={onClose}
        title="Click outside to close sidebar"
      />
    </div>
  );
}
