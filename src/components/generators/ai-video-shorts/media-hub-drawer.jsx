'use client';

import { useState, useEffect } from 'react';
import {
  Library,
  X,
  Play,
  Trash2,
  Clock,
  FileVideo,
  Youtube,
  Search,
  CheckCircle2,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { YouTubeCookieButton } from './youtube-cookie-button';
import { showToast } from '@/lib/swal';
import { cn } from '@/lib/utils';

export function MediaHubDrawer({
  isOpen,
  onClose,
  onSelectMedia,
  onAnalyzeUrl,
}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/video-shorts/media-hub${search ? `?q=${encodeURIComponent(search)}` : ''}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.warn('Could not fetch Media Hub assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, search]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/video-shorts/media-hub', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        showToast('Asset removed from Media Hub.', 'info');
      }
    } catch (err) {
      showToast('Failed to delete asset.', 'error');
    }
  };

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-foreground flex items-center gap-2">
                <span>Media Hub Video Library</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-primary border-primary/30 font-bold"
                >
                  {items.length} Assets
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                All source videos ingested from local uploads or YouTube are
                preserved here for 24 hours.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <YouTubeCookieButton
              size="sm"
              variant="outline"
              className="h-8"
              onAnalyzeUrl={(url) => {
                onClose();
                if (onAnalyzeUrl) onAnalyzeUrl(url);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchItems}
              disabled={isLoading}
              className="rounded-xl h-8 text-xs font-bold gap-1 cursor-pointer"
            >
              <RefreshCw
                className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')}
              />
              <span>Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-xl w-8 h-8 p-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border/40 bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by video title, file name, or source..."
              className="pl-9 text-xs h-9 rounded-xl bg-background/80"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">
                Loading Media Hub repository...
              </span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <FileVideo className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                No Media Assets Found
              </h4>
              <p className="text-xs max-w-sm">
                Upload a local video file or paste a YouTube URL to
                automatically store your source video in the Media Hub.
              </p>
              <div className="pt-2">
                <YouTubeCookieButton
                  size="sm"
                  variant="outline"
                  onAnalyzeUrl={(url) => {
                    onClose();
                    if (onAnalyzeUrl) onAnalyzeUrl(url);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectMedia(item);
                    onClose();
                  }}
                  className="group rounded-2xl border border-border/70 bg-card hover:border-primary/60 transition-all p-3 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md cursor-pointer relative"
                >
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
                    {item.preview_url ? (
                      <img
                        src={item.preview_url}
                        alt={item.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <FileVideo className="w-8 h-8 text-white/40" />
                    )}

                    {/* Source Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        className={cn(
                          'text-[9px] font-mono font-bold uppercase gap-1 px-1.5 py-0.5',
                          item.source_type === 'youtube'
                            ? 'bg-red-600/90 text-white'
                            : 'bg-primary/90 text-primary-foreground'
                        )}
                      >
                        {item.source_type === 'youtube' ? (
                          <Youtube className="w-2.5 h-2.5" />
                        ) : (
                          <HardDrive className="w-2.5 h-2.5" />
                        )}
                        <span>{item.source_type || 'upload'}</span>
                      </Badge>
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-bold">
                      {formatDuration(item.duration)}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <h4
                      className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors"
                      title={item.file_name}
                    >
                      {item.file_name}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>
                        {item.resolution || '1080p'} •{' '}
                        {formatFileSize(item.file_size)}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Clock className="w-2.5 h-2.5" /> 24h Expiry
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      className="h-7 text-xs font-bold rounded-lg cursor-pointer bg-primary text-primary-foreground flex-1 mr-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Select Video</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 rounded-lg cursor-pointer shrink-0"
                      title="Delete from Media Hub"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
