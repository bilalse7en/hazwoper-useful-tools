'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  RotateCcw,
  Grid,
  Image as ImageIcon,
  AlertTriangle,
  Bookmark,
  Activity,
  ListOrdered,
  Columns,
  Lightbulb,
  Quote,
  Split,
  Images,
  FileText,
  Minus,
  Search,
  Plus,
  GripVertical,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  COMPONENT_DEFINITIONS,
  COMPONENT_CATEGORIES,
} from '@/lib/component-registry';

const ICON_MAP = {
  Layers,
  RotateCcw,
  Grid,
  Image: ImageIcon,
  AlertTriangle,
  Bookmark,
  Activity,
  ListOrdered,
  Columns,
  Lightbulb,
  Quote,
  Split,
  Images,
  FileText,
  Minus,
};

export default function ComponentPalette({
  onSelectComponent,
  collapsed = false,
  onToggleCollapse,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact' | 'full'

  const filteredComponents = useMemo(() => {
    return COMPONENT_DEFINITIONS.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: item.type })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border select-none relative">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/40 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Palette
          </span>

          {/* View Mode Selector Switcher */}
          <div className="flex items-center gap-0.5 bg-muted/80 p-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Compact 2-Column Grid (Icons & Hover Tooltips)"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`p-1 rounded-md transition-all ${
                viewMode === 'compact'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Compact List Rows (Hover Tooltips)"
            >
              <List className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`p-1 rounded-md transition-all ${
                viewMode === 'full'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Detailed Expanded View"
            >
              <Columns className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full h-7 pl-8 pr-3 rounded-lg border border-border bg-background text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="p-1.5 border-b border-border bg-muted/20 flex gap-1 overflow-x-auto custom-scrollbar shrink-0">
        {['ALL', ...Object.values(COMPONENT_CATEGORIES)].map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat === 'ALL' ? 'All (15)' : cat.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Component Items Workspace */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {filteredComponents.length === 0 ? (
          <div className="text-center p-6 text-xs text-muted-foreground">
            No components match &quot;{searchQuery}&quot;
          </div>
        ) : viewMode === 'grid' ? (
          /* 1. GRID MODE: Sleek 2-Column Icon Grid with Floating Tooltips */
          <div className="grid grid-cols-2 gap-1.5">
            {filteredComponents.map((item) => {
              const IconComp = ICON_MAP[item.icon] || Layers;
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={() => onSelectComponent(item.type)}
                  className="group/item relative p-2 rounded-xl border border-border/80 bg-background/60 hover:bg-amber-500/10 hover:border-amber-500/60 cursor-grab active:cursor-grabbing transition-all flex flex-col items-center justify-center text-center gap-1.5 shadow-xs hover:shadow-md"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover/item:scale-110 group-hover/item:bg-amber-500 group-hover/item:text-slate-950 transition-all">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-[11px] text-foreground group-hover/item:text-amber-500 transition-colors line-clamp-1 leading-tight">
                    {item.name}
                  </span>

                  {/* High-End Floating Tooltip Card */}
                  <div className="absolute left-full top-0 ml-2 z-[9999] w-60 p-3 rounded-2xl bg-slate-950/95 border border-amber-500/50 shadow-2xl text-slate-100 hidden group-hover/item:flex flex-col gap-2 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-mono font-black uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {item.category || 'COMPONENT'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-amber-400">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400 font-mono flex items-center justify-between">
                      <span>✨ Drag onto canvas</span>
                      <span className="text-amber-400 font-bold">
                        + Click to add
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'compact' ? (
          /* 2. COMPACT LIST MODE: Single Column Tight Rows */
          <div className="space-y-1">
            {filteredComponents.map((item) => {
              const IconComp = ICON_MAP[item.icon] || Layers;
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={() => onSelectComponent(item.type)}
                  className="group/item relative p-1.5 rounded-xl border border-border/80 bg-background/60 hover:bg-amber-500/10 hover:border-amber-500/60 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-xs"
                >
                  <GripVertical className="w-3 h-3 text-muted-foreground opacity-40 group-hover/item:opacity-100" />
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 group-hover/item:scale-105 group-hover/item:bg-amber-500 group-hover/item:text-slate-950 transition-all">
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-foreground group-hover/item:text-amber-500 truncate flex-1">
                    {item.name}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 text-amber-500" />

                  {/* Floating Tooltip Card */}
                  <div className="absolute left-full top-0 ml-2 z-[9999] w-60 p-3 rounded-2xl bg-slate-950/95 border border-amber-500/50 shadow-2xl text-slate-100 hidden group-hover/item:flex flex-col gap-2 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-mono font-black uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {item.category || 'COMPONENT'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-amber-400">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400 font-mono flex items-center justify-between">
                      <span>✨ Drag onto canvas</span>
                      <span className="text-amber-400 font-bold">
                        + Click to add
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 3. FULL MODE: Full Expanded Cards */
          <div className="space-y-1.5">
            {filteredComponents.map((item) => {
              const IconComp = ICON_MAP[item.icon] || Layers;
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={() => onSelectComponent(item.type)}
                  className="group/item relative p-2.5 rounded-2xl border border-border/80 bg-background/60 hover:bg-muted/60 hover:border-amber-500/50 cursor-grab active:cursor-grabbing transition-all flex items-start gap-2.5 shadow-xs"
                >
                  <div className="opacity-40 group-hover/item:opacity-100 text-muted-foreground pt-0.5">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 group-hover/item:scale-105 group-hover/item:bg-amber-500 group-hover/item:text-slate-950 transition-all">
                    <IconComp className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground group-hover/item:text-amber-500 transition-colors truncate">
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectComponent(item.type);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-1 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold transition-all shrink-0 ml-1"
                        title="Configure & Add"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="p-2 border-t border-border bg-muted/40 text-[10px] text-muted-foreground text-center shrink-0 font-mono">
        💡 Drag icon to canvas or click +
      </div>
    </div>
  );
}
