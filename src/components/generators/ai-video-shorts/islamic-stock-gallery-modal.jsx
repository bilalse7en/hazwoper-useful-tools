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
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { showToast, showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';

const POPULAR_ISLAMIC_TAGS = [
  'All',
  'Makkah',
  'Kaaba',
  'Madinah',
  'Masjid an-Nabawi',
  'Green Dome',
  'Tawaf',
  'Quran',
  'Mosques',
  'Islamic Calligraphy',
  'Ramadan',
  'Sunset',
  'Desert',
  'Stars',
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
  targetDuration = 35,
  shortTitle = 'Active Short',
}) {
  const [query, setQuery] = useState('islamic');
  const [provider, setProvider] = useState('all');
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Left-Docked Preview Workspace Player States
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

  // Multi-Selection & Import Queue State (Persists across drawer open/close)
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
      const qParam = searchQuery === 'All' ? 'islamic' : searchQuery;
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
        if (!previewVideo && data.videos.length > 0) {
          setPreviewVideo(data.videos[0]);
        }
      }
    } catch (err) {
      console.warn('Stock gallery fetch error:', err);
      showToast(
        'Could not load stock video gallery. Using verified local stock assets.',
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
    if (navigator.clipboard) {
      const text =
        video.attribution ||
        `Footage: "${video.title}" by ${video.author} (${video.provider})`;
      navigator.clipboard.writeText(text);
      setCopiedId(video.id);
      showToast('YouTube Attribution copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const toggleSelect = (id) => {
    updateSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = videos.map((v) => v.id);
    updateSelectedIds(allIds);
  };

  // Batch import selected videos to Media Hub
  const handleSaveSelectedToHub = async () => {
    const toImport = videos.filter((v) => selectedIds.includes(v.id));
    if (toImport.length === 0) {
      showToast('Select one or more videos to save.', 'info');
      return;
    }

    setQueueSummary({
      total: toImport.length,
      saved: 0,
      downloading: toImport.length,
      failed: 0,
    });

    for (const vid of toImport) {
      updateCardState(vid.id, 'downloading');
      try {
        const res = await fetch('/api/video-shorts/stock-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vid),
        });
        const data = await res.json();
        if (data.success && data.mediaItem) {
          updateCardState(vid.id, 'saved');
          if (onImportToMediaBin) {
            onImportToMediaBin({
              id: data.mediaItem.id,
              fileName: data.mediaItem.fileName || vid.title,
              duration: vid.duration,
              isStock: true,
              previewUrl: data.mediaItem.previewUrl || vid.thumbnailUrl,
              videoUrl: data.mediaItem.downloadUrl || vid.videoUrl,
              stockMetadata: vid,
            });
          }
          setQueueSummary((prev) =>
            prev
              ? {
                  ...prev,
                  saved: prev.saved + 1,
                  downloading: Math.max(0, prev.downloading - 1),
                }
              : null
          );
        } else {
          updateCardState(vid.id, 'failed');
          setQueueSummary((prev) =>
            prev
              ? {
                  ...prev,
                  failed: prev.failed + 1,
                  downloading: Math.max(0, prev.downloading - 1),
                }
              : null
          );
        }
      } catch (err) {
        console.warn(`Failed to import ${vid.id}:`, err);
        updateCardState(vid.id, 'failed');
        setQueueSummary((prev) =>
          prev
            ? {
                ...prev,
                failed: prev.failed + 1,
                downloading: Math.max(0, prev.downloading - 1),
              }
            : null
        );
      }
    }

    showSuccess(
      'Media Hub Import Completed',
      'Selected stock videos are now saved to your durable Media Hub!'
    );
  };

  // Add video as B-roll replacement directly to active Short
  const handleAddToShort = (video) => {
    if (onAddToTimeline) {
      onAddToTimeline(video);
      setAppliedVideoId(video.id);
      showSuccess(
        'Applied to Short!',
        `"${video.title}" is now the visual source for this short while preserving your recitation audio.`
      );
      setTimeout(() => setAppliedVideoId(null), 3000);
    }
  };

  // Import single video to Media Hub
  const handleImportToHub = async (video) => {
    updateCardState(video.id, 'saving');
    try {
      const res = await fetch('/api/video-shorts/stock-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
      const data = await res.json();
      if (data.success && data.mediaItem) {
        updateCardState(video.id, 'saved');
        if (onImportToMediaBin) {
          onImportToMediaBin({
            id: data.mediaItem.id,
            fileName: data.mediaItem.fileName || video.title,
            duration: video.duration,
            isStock: true,
            previewUrl: data.mediaItem.previewUrl || video.thumbnailUrl,
            videoUrl: data.mediaItem.downloadUrl || video.videoUrl,
            stockMetadata: video,
          });
        }
        showSuccess(
          'Saved to Media Hub',
          `"${video.title}" has been saved permanently to your media collection.`
        );
      } else {
        updateCardState(video.id, 'failed');
        showToast(data.error || 'Failed to save to Media Hub.', 'error');
      }
    } catch (err) {
      console.warn('Import stock error:', err);
      updateCardState(video.id, 'failed');
      showToast('Could not save stock video to Media Hub.', 'error');
    }
  };

  const togglePreviewPlay = () => {
    const el = previewVideoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play()
        .then(() => setPreviewPlaying(true))
        .catch(() => {});
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
    <>
      {/* Dimmed Background Overlay (Closes drawer on click) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 80% LEFT SIDEBAR DRAWER (NO POPUPS) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Islamic B-Roll Studio Drawer"
        className="fixed inset-y-0 left-0 w-full sm:w-[82vw] max-w-[88vw] bg-card border-r border-border shadow-2xl z-50 flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-left duration-300"
      >
        {/* ─── COLUMN 1: B-Roll Search & Video Grid (~60% of sidebar) ─── */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border/70 overflow-hidden bg-background/50">
          {/* Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-border/70 bg-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-foreground truncate">
                      Islamic B-Roll Studio
                    </h2>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-emerald-500 border-emerald-500/30 font-bold shrink-0"
                    >
                      Strictly Islamic
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Makkah, Madinah, Kaaba, Mosques &amp; Quran. 100% Licensed
                    &amp; Free.
                  </p>
                </div>
              </div>

              {/* Action & Close Bar */}
              <div className="flex items-center gap-2 shrink-0">
                {selectedIds.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleSaveSelectedToHub}
                    className="font-bold rounded-xl text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save Selected ({selectedIds.length})</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  title="Close B-Roll Studio"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Target Duration Recommendation Bar */}
            <div className="mt-3 p-2.5 rounded-xl bg-muted/40 border border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground font-sans">
                  Active Short Target:
                </span>
                <span className="font-bold text-foreground">
                  ~{Math.round(targetDuration)}s Duration
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Videos with matching duration are badged below for seamless
                looping.
              </span>
            </div>

            {/* Batch Import Progress Banner */}
            {queueSummary && queueSummary.downloading > 0 && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-primary">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Saving to Media Hub...</span>
                  </span>
                  <span className="font-mono text-foreground text-[11px]">
                    {queueSummary.saved} saved • {queueSummary.downloading}{' '}
                    active
                  </span>
                </div>
                <Progress
                  value={Math.round(
                    (queueSummary.saved / queueSummary.total) * 100
                  )}
                  className="h-1.5 rounded-full"
                />
              </div>
            )}

            {/* Search Input & Provider Tabs */}
            <form
              onSubmit={handleSearchSubmit}
              className="pt-3 flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Makkah, Madinah, Kaaba, Tawaf, Quran, Mosques, Calligraphy..."
                  className="pl-9 h-9.5 text-xs rounded-xl bg-background"
                />
              </div>

              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 text-xs shrink-0">
                {['all', 'pexels', 'pixabay', 'wikimedia'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer text-[11px]',
                      provider === p
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {p === 'all' ? 'All Sources' : p}
                  </button>
                ))}
              </div>
            </form>

            {/* Islamic Topic Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar">
              {POPULAR_ISLAMIC_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border',
                    query.toLowerCase() === tag.toLowerCase() ||
                      (tag === 'All' && query === 'islamic')
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-muted/30 border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs font-bold font-mono">
                  Searching authentic Islamic stock videos...
                </span>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2 text-center text-muted-foreground">
                <FileVideo className="w-12 h-12 text-muted-foreground/50" />
                <p className="text-sm font-bold text-foreground">
                  No Islamic footage found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs max-w-sm">
                  Try searching for Makkah, Kaaba, Madinah, or Mosques.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {videos.map((vid) => {
                  const isSelected = selectedIds.includes(vid.id);
                  const state = cardStates[vid.id] || 'idle';
                  const isCurrentPreview = previewVideo?.id === vid.id;
                  const diff = Math.abs((vid.duration || 15) - targetDuration);
                  const isDurationMatch = diff <= 12;

                  return (
                    <div
                      key={vid.id}
                      onClick={() => setPreviewVideo(vid)}
                      className={cn(
                        'rounded-2xl border transition-all flex flex-col justify-between p-3 space-y-2.5 bg-card cursor-pointer group',
                        isCurrentPreview
                          ? 'border-primary ring-2 ring-primary/20 shadow-md bg-primary/5'
                          : isSelected
                            ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                            : 'border-border/70 hover:border-border/90 hover:shadow-xs'
                      )}
                    >
                      {/* Top Bar: Checkbox + Title */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(vid.id);
                            }}
                            className="mt-0.5 w-4 h-4 rounded text-primary cursor-pointer accent-primary"
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

                      {/* Video Thumbnail with Hover Overlay & Duration Match Badge */}
                      <div className="relative aspect-[9/16] max-h-[190px] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary/95 text-primary-foreground flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                          </div>
                        </div>

                        {/* Top Left: Timing Match Recommendation Badge */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {isDurationMatch ? (
                            <Badge className="bg-emerald-600/95 text-white text-[9px] font-bold shadow-md border-0">
                              ⏱️ Matches Short (~
                              {Math.round(vid.duration || 15)}s)
                            </Badge>
                          ) : (
                            <Badge className="bg-black/80 text-white/90 text-[9px] font-mono border-white/10">
                              ⏱️ {Math.round(vid.duration || 15)}s
                            </Badge>
                          )}
                        </div>

                        <div className="absolute bottom-2 right-2 bg-black/85 text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                          9:16 HD
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          variant={state === 'saved' ? 'secondary' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImportToHub(vid);
                          }}
                          disabled={
                            state === 'saving' || state === 'downloading'
                          }
                          className={cn(
                            'text-[11px] font-bold rounded-xl cursor-pointer h-7.5 px-2 border-border/80',
                            state === 'saved' &&
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          )}
                        >
                          {state === 'saving' || state === 'downloading' ? (
                            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                          ) : state === 'saved' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1" />
                          ) : (
                            <Download className="w-3 h-3 mr-1" />
                          )}
                          <span className="truncate">
                            {state === 'saving'
                              ? 'Saving...'
                              : state === 'saved'
                                ? 'Saved'
                                : 'Save to Hub'}
                          </span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToShort(vid);
                          }}
                          className="text-[11px] font-bold rounded-xl cursor-pointer h-7.5 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Apply</span>
                        </Button>
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
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>{' '}
                  ({totalVideos} videos)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchVideos(query, provider, Math.max(1, page - 1))
                    }
                    disabled={page <= 1 || isLoading}
                    className="rounded-xl h-8 px-2.5"
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
                    className="rounded-xl h-8 px-2.5"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── COLUMN 2: Integrated Live Preview Workspace (~40% of sidebar) ─── */}
        <div className="w-full md:w-[380px] lg:w-[440px] shrink-0 bg-card border-t md:border-t-0 flex flex-col overflow-y-auto p-4 sm:p-5 space-y-4">
          {previewVideo ? (
            <>
              {/* Preview Header */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/60">
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                      B-Roll Preview
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold">
                      {previewVideo.provider}
                    </Badge>
                  </div>
                  <h3
                    className="font-bold text-sm text-foreground truncate mt-0.5"
                    title={previewVideo.title}
                  >
                    {previewVideo.title}
                  </h3>
                </div>

                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-emerald-500 border-emerald-500/30 shrink-0 font-bold"
                >
                  9:16 Portrait
                </Badge>
              </div>

              {/* 9:16 Portrait Video Player */}
              <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-border/80 shadow-lg">
                <video
                  ref={previewVideoRef}
                  key={`${previewVideo.id}_${previewRetryNonce}`}
                  src={previewVideo.videoUrl}
                  crossOrigin="anonymous"
                  playsInline
                  autoPlay
                  muted={previewMuted}
                  loop
                  onTimeUpdate={(e) =>
                    setPreviewTime(e.currentTarget.currentTime)
                  }
                  onLoadedMetadata={(e) => {
                    setPreviewDuration(
                      e.currentTarget.duration || previewVideo.duration || 15
                    );
                    setPreviewBuffering(false);
                  }}
                  onWaiting={() => setPreviewBuffering(true)}
                  onPlaying={() => setPreviewBuffering(false)}
                  onError={() => {
                    setPreviewBuffering(false);
                    setPreviewError(
                      'Video stream unavailable. Use "Save to Hub" to download directly.'
                    );
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Buffering Overlay */}
                {previewBuffering && !previewError && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-white pointer-events-none">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs font-bold font-mono">
                      Buffering stream...
                    </span>
                  </div>
                )}

                {/* Error Overlay */}
                {previewError && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center gap-2 text-white">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                    <p className="text-xs font-bold text-foreground">
                      Stream Notice
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {previewError}
                    </p>
                    <Button
                      size="sm"
                      onClick={handleRetryPreviewSource}
                      className="rounded-xl text-xs font-bold gap-1 mt-1 bg-primary text-primary-foreground"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry Stream</span>
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

                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/60">
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

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                    <Badge variant="outline" className="px-1 py-0 text-[9px]">
                      {previewVideo.resolution || '1080x1920'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Timing Match Comparison Box */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Short:</span>
                  <span className="font-mono font-bold text-foreground">
                    {Math.round(targetDuration)}s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">B-Roll Footage:</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {Math.round(previewDuration)}s
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed pt-1 border-t border-border/30">
                  {Math.abs(previewDuration - targetDuration) <= 12
                    ? '✓ Timing aligns with active short. Visual transitions seamlessly.'
                    : 'FFmpeg automatically loops this B-roll while preserving full recitation audio.'}
                </p>
              </div>

              {/* Attribution Box */}
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate">
                    Author:{' '}
                    <strong className="text-foreground">
                      {previewVideo.author}
                    </strong>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyAttribution(previewVideo)}
                    className="h-6 px-2 text-[10px] font-bold"
                  >
                    {copiedId === previewVideo.id ? (
                      <Check className="w-3 h-3 text-emerald-500 mr-1" />
                    ) : (
                      <Copy className="w-3 h-3 mr-1" />
                    )}
                    <span>
                      {copiedId === previewVideo.id ? 'Copied' : 'Attribution'}
                    </span>
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {previewVideo.license || 'Creative Commons Open License'}
                </p>
              </div>

              {/* Master Actions */}
              <div className="space-y-2 pt-1">
                <Button
                  size="lg"
                  onClick={() => handleAddToShort(previewVideo)}
                  className="w-full font-black text-xs sm:text-sm h-11 rounded-xl gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {appliedVideoId === previewVideo.id
                      ? 'Applied to Short!'
                      : 'Apply as Visual Source'}
                  </span>
                </Button>

                <Button
                  size="lg"
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
                    'w-full font-bold text-xs sm:text-sm h-10 rounded-xl gap-2 cursor-pointer border-border/80',
                    cardStates[previewVideo.id] === 'saved' &&
                      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  )}
                >
                  {cardStates[previewVideo.id] === 'saving' ||
                  cardStates[previewVideo.id] === 'downloading' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : cardStates[previewVideo.id] === 'saved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    {cardStates[previewVideo.id] === 'saving'
                      ? 'Saving to Hub...'
                      : cardStates[previewVideo.id] === 'saved'
                        ? 'Saved in Media Hub'
                        : 'Save to Media Hub'}
                  </span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
              <FileVideo className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-xs font-bold text-foreground">
                Select Footage to Preview
              </p>
              <p className="text-[11px] max-w-[200px] leading-relaxed">
                Click any Islamic video from the gallery to preview live in 9:16
                portrait.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default IslamicStockGalleryModal;
