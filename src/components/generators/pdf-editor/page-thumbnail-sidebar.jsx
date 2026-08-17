'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  RotateCw,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageThumbnailSidebar({
  pages,
  activePageIndex,
  onSelectPage,
  onMovePage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onOpenInsertModal,
  thumbnailsMap = {},
}) {
  return (
    <div className="w-52 border-r border-border bg-card flex flex-col h-full select-none">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Pages ({pages.length})
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenInsertModal}
          className="h-7 text-xs font-semibold gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {pages.map((page, idx) => {
          const isActive = idx === activePageIndex;
          const thumbUrl = thumbnailsMap[page.id];

          return (
            <div
              key={page.id}
              className={cn(
                'group relative border-2 rounded-lg p-1.5 transition-all bg-background cursor-pointer hover:border-primary/60',
                isActive
                  ? 'border-primary shadow-md ring-2 ring-primary/20'
                  : 'border-border'
              )}
              onClick={() => onSelectPage(idx)}
            >
              {/* Page Thumbnail Image */}
              <div className="w-full aspect-[1/1.4] bg-muted/30 rounded overflow-hidden flex items-center justify-center relative border border-border/40">
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbUrl}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-full object-contain transition-transform"
                    style={{
                      transform: `rotate(${page.rotation || 0}deg)`,
                    }}
                  />
                ) : (
                  <div className="text-xs font-semibold text-muted-foreground flex flex-col items-center">
                    <span>Page</span>
                    <span className="text-lg font-black">{idx + 1}</span>
                  </div>
                )}

                {/* Badge for page number */}
                <div className="absolute top-1 left-1 bg-black/75 text-white px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                  {idx + 1}
                </div>
              </div>

              {/* Quick actions overlay bar */}
              <div className="mt-2 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(idx, idx - 1);
                    }}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === pages.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(idx, idx + 1);
                    }}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(idx);
                    }}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(idx);
                    }}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  {pages.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(idx);
                      }}
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
