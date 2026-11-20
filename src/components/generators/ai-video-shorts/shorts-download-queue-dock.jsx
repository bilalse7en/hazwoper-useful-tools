'use client';

import { useState } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Film,
  HardDriveDownload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ShortsDownloadQueueDock({
  queue = [],
  onDownloadItem,
  onDismissItem,
  onClearCompleted,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!queue || queue.length === 0) return null;

  const activeCount = queue.filter((i) => i.status === 'rendering').length;
  const readyCount = queue.filter((i) => i.status === 'ready').length;

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-auto max-w-sm sm:max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white border border-border/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {activeCount > 0 ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              )}
            </span>
            <span className="text-xs font-bold tracking-wide flex items-center gap-1.5">
              <HardDriveDownload className="w-3.5 h-3.5 text-primary" />
              <span>4K Shorts Download Queue</span>
            </span>
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 font-mono border-white/20 text-white/80"
            >
              {activeCount > 0
                ? `${activeCount} Rendering`
                : `${readyCount} Ready`}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {readyCount > 0 && onClearCompleted && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="text-[10px] text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
                title="Clear ready items"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title={isCollapsed ? 'Expand queue' : 'Collapse queue'}
            >
              {isCollapsed ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        {!isCollapsed && (
          <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto">
            {queue.map((item) => {
              const isRendering = item.status === 'rendering';
              const isReady = item.status === 'ready';
              const isFailed = item.status === 'failed';

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-3 rounded-xl border transition-all text-xs space-y-2',
                    isReady &&
                      'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10',
                    isRendering &&
                      'bg-primary/10 border-primary/40 shadow-sm shadow-primary/10',
                    isFailed && 'bg-red-500/10 border-red-500/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-black uppercase text-primary px-1.5 py-0.5 rounded bg-primary/20">
                          Short #{item.clipIndex || 1}
                        </span>
                        <span className="font-bold text-white truncate text-xs">
                          {item.title || `Short #${item.clipIndex || 1}`}
                        </span>
                        <Badge
                          className={cn(
                            'text-[9px] px-1 py-0 h-4 border-0 font-mono font-bold',
                            isReady && 'bg-emerald-500 text-white',
                            isRendering && 'bg-primary text-white',
                            isFailed && 'bg-red-500 text-white'
                          )}
                        >
                          4K UHD
                        </Badge>
                      </div>
                      <p className="text-[10px] text-white/70 font-mono truncate">
                        {item.stageMessage ||
                          (isRendering
                            ? `Rendering 4K Vertical (${Math.round(item.progress)}%)...`
                            : isReady
                              ? `Ready • ${item.fileSizeMb || '24.5'} MB`
                              : item.error || 'Render failed')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissItem(item.id)}
                      className="text-white/40 hover:text-white p-1 rounded hover:bg-white/10 transition-colors shrink-0"
                      title="Dismiss from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress Bar when rendering */}
                  {isRendering && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(5, item.progress))}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-white/60 font-mono">
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                          <span>Encoding 2160x3840 60fps...</span>
                        </span>
                        <span className="font-bold text-primary">
                          {Math.round(item.progress)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Direct Download Button when 100% Ready */}
                  {isReady && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => onDownloadItem(item)}
                        className="w-full font-bold text-xs rounded-lg cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white shadow-md flex items-center justify-center gap-1.5 h-8"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Short (4K MP4)</span>
                      </Button>
                    </div>
                  )}

                  {/* Retry Button when failed */}
                  {isFailed && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadItem(item, true)}
                        className="w-full font-bold text-xs rounded-lg cursor-pointer border-red-500/40 text-red-400 hover:bg-red-500/20 h-7"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>Retry 4K Render</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShortsDownloadQueueDock;
