'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Download,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  FileVideo,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  'Prayer',
  'Ramadan',
  'Desert',
  'Sunset',
  'Nature',
  'Stars',
];

// Module-level persistent cache across modal open/close during session
let sessionPersistentSelectedIds = [];
let sessionPersistentCardStates = {};

export function IslamicStockGalleryModal({
  isOpen,
  onClose,
  onAddToTimeline,
  onImportToMediaBin,
  selectedIds: propSelectedIds,
  onSelectionChange,
}) {
  const [query, setQuery] = useState('islamic');
  const [provider, setProvider] = useState('all');
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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
      }
    } catch (err) {
      console.warn('Stock gallery fetch error:', err);
      showToast(
        'Could not load stock video gallery. Using local stock assets.',
        'info'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVideos(query, provider, 1);
    }
  }, [isOpen]);

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
      navigator.clipboard.writeText(
        video.attribution || `${video.title} - ${video.license}`
      );
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast(
        'Attribution text copied! Paste it in your YouTube video description.',
        'success'
      );
    }
  };

  // Toggle single item selection
  const toggleSelect = (id) => {
    updateSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllCurrentPage = () => {
    const pageIds = videos.map((v) => v.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      updateSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      updateSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Single Item Save to Media Hub
  const handleImportToHub = async (video) => {
    updateCardState(video.id, 'saving');
    try {
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
        `"${video.title}" is permanently persisted.`
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
      'Batch Import Finished!',
      'Selected B-roll assets processed into your Media Hub.'
    );
  };

  const handleAddToShort = (video) => {
    if (onAddToTimeline) {
      onAddToTimeline(video);
      showSuccess(
        'Added to Short!',
        `"${video.title}" inserted into timeline.`
      );
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 rounded-3xl overflow-hidden border-border/80 shadow-2xl bg-card">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
                  <span>Islamic &amp; Scenic Stock B-Roll</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-emerald-500 border-emerald-500/30 font-bold"
                  >
                    {totalVideos}+ Licensed Assets
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Search &amp; persist verified footage into your Media Hub.
                  Pexels, Pixabay &amp; Wikimedia Commons.
                </p>
              </div>
            </div>

            {/* Batch Selection Action Button */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={handleSaveSelectedToHub}
                  className="w-full sm:w-auto font-bold rounded-xl text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Selected to Hub ({selectedIds.length})</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateSelectedIds([])}
                  className="rounded-xl text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
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
                placeholder="Search Makkah, Madinah, Kaaba, Tawaf, Quran, Mosques, Sunset, Stars..."
                className="pl-9 h-10 text-xs rounded-xl bg-background/80"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  fetchVideos(query, e.target.value, 1);
                }}
                className="h-10 px-3 text-xs rounded-xl bg-background border border-border text-foreground font-bold cursor-pointer"
              >
                <option value="all">All Providers</option>
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

          {/* Quick Tag Pills */}
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
        </DialogHeader>

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <RefreshCw className="w-7 h-7 animate-spin text-primary" />
              <span className="text-xs font-bold">
                Discovering Islamic stock videos &amp; licenses...
              </span>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-center text-muted-foreground">
              <FileVideo className="w-10 h-10 text-muted-foreground/60" />
              <p className="text-sm font-bold text-foreground">
                No stock footage found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs max-w-sm">
                Try searching for Makkah, Kaaba, Madinah, or Mosques.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((vid) => {
                const isSelected = selectedIds.includes(vid.id);
                const state = cardStates[vid.id] || 'idle';

                return (
                  <div
                    key={vid.id}
                    className={cn(
                      'rounded-2xl border transition-all flex flex-col justify-between p-3 space-y-2.5 bg-card/90',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 shadow-md'
                        : 'border-border/70 hover:border-border shadow-xs'
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

                    {/* Video Thumbnail / Preview */}
                    <div className="relative aspect-[9/16] max-h-[220px] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10 group">
                      {previewVideo?.id === vid.id ? (
                        <video
                          src={vid.videoUrl}
                          controls
                          autoPlay
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewVideo(vid)}
                            className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg"
                            aria-label="Preview video"
                          >
                            <Play className="w-5 h-5 ml-0.5" />
                          </button>
                        </>
                      )}

                      <div className="absolute bottom-2 right-2 bg-black/85 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                        {Math.round(vid.duration || 15)}s
                      </div>
                    </div>

                    {/* License text & Attribution */}
                    <div className="p-2 rounded-xl bg-muted/40 border border-border/40 text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="font-medium truncate">
                          {vid.license}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAttribution(vid)}
                          className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold shrink-0 ml-1"
                        >
                          {copiedId === vid.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>
                            {copiedId === vid.id ? 'Copied' : 'Attribution'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Actions: Save to Media Hub + Add to Timeline */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={state === 'saved' ? 'secondary' : 'outline'}
                        onClick={() => handleImportToHub(vid)}
                        disabled={state === 'saving'}
                        className={cn(
                          'text-xs font-bold rounded-xl cursor-pointer h-8 gap-1',
                          state === 'saved' &&
                            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                          state === 'failed' &&
                            'bg-destructive/10 text-destructive border-destructive/30'
                        )}
                      >
                        {state === 'saving' ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : state === 'saved' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : state === 'failed' ? (
                          <AlertCircle className="w-3 h-3 text-destructive" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>
                          {state === 'saving'
                            ? 'Saving...'
                            : state === 'saved'
                              ? 'Saved'
                              : state === 'failed'
                                ? 'Retry'
                                : 'Save to Hub'}
                        </span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleAddToShort(vid)}
                        className="text-xs font-bold rounded-xl cursor-pointer h-8 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add to Short</span>
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
                  className="rounded-xl h-8 px-2.5"
                >
                  <ChevronLeft className="w-4 h-4 mr-0.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchVideos(query, provider, Math.min(totalPages, page + 1))
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
      </DialogContent>
    </Dialog>
  );
}
