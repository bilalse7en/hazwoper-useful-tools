'use client';

import React, { useState } from 'react';
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
  X,
  Plus,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  COMPONENT_DEFINITIONS,
  COLOR_THEMES,
  generateComponentDefaults,
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

export default function ComponentConfigModal({
  isOpen,
  onClose,
  componentType,
  onConfirmInsert,
  topicTitle = 'Topic Procedure',
}) {
  const definition = COMPONENT_DEFINITIONS.find(
    (d) => d.type === componentType
  );
  const [itemCount, setItemCount] = useState(definition?.defaultCount || 3);
  const [selectedTheme, setSelectedTheme] = useState('amber');
  const [selectedVariant, setSelectedVariant] = useState('warning');
  const [customTitle, setCustomTitle] = useState('');

  if (!isOpen || !definition) return null;

  const IconComp = ICON_MAP[definition.icon] || Layers;

  const handleConfirm = () => {
    const generated = generateComponentDefaults(componentType, {
      count: itemCount,
      theme: selectedTheme,
      variant: selectedVariant,
      topicTitle,
    });

    if (customTitle.trim()) {
      generated.props.title = customTitle.trim();
    }

    onConfirmInsert(generated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                Configure {definition.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {definition.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Item Count Selector (e.g., How many accordions, flip cards, stats, steps) */}
          {definition.hasItemCountConfig && (
            <div className="space-y-2">
              <label className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
                {definition.countLabel || 'Number of items to generate:'}
              </label>
              <div className="flex items-center gap-2">
                {Array.from({
                  length: definition.maxCount - definition.minCount + 1,
                }).map((_, idx) => {
                  const val = definition.minCount + idx;
                  const isSelected = itemCount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setItemCount(val)}
                      className={`flex-1 py-2.5 rounded-xl font-black text-xs border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-muted/40 hover:bg-muted border-border text-foreground'
                      }`}
                    >
                      {val} {val === 1 ? 'Item' : 'Items'}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Will auto-generate with <strong>{itemCount}</strong> OSHA safety
                & compliance templates with realistic dummy content.
              </p>
            </div>
          )}

          {/* Alert Variant Selector for Callout */}
          {componentType === 'callout' && (
            <div className="space-y-2">
              <label className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
                Alert Severity / Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'warning',
                    label: 'Warning (Amber)',
                    border:
                      'border-amber-500/50 bg-amber-500/10 text-amber-500',
                  },
                  {
                    id: 'danger',
                    label: 'Danger / Stop (Red)',
                    border: 'border-rose-500/50 bg-rose-500/10 text-rose-500',
                  },
                  {
                    id: 'info',
                    label: 'Info Note (Blue)',
                    border: 'border-sky-500/50 bg-sky-500/10 text-sky-500',
                  },
                  {
                    id: 'success',
                    label: 'Compliant / Pass (Green)',
                    border:
                      'border-emerald-500/50 bg-emerald-500/10 text-emerald-500',
                  },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${v.border} ${
                      selectedVariant === v.id
                        ? 'ring-2 ring-primary shadow-sm font-black'
                        : 'opacity-80'
                    }`}
                  >
                    <span>{v.label}</span>
                    {selectedVariant === v.id && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Accent Theme */}
          {[
            'accordion',
            'flip-cards',
            'icon-cards',
            'tabs',
            'stats',
            'steps',
            'key-takeaways',
          ].includes(componentType) && (
            <div className="space-y-2">
              <label className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
                Color Theme & Accent:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_THEMES.map((theme) => {
                  const isSelected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/10 font-bold shadow-xs'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: theme.accent }}
                      />
                      <span className="truncate text-[11px]">
                        {theme.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Custom Header Title */}
          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-muted-foreground block text-[11px]">
              Optional Section Title (or leave default):
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Mandatory Equipment Donning Protocol"
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border font-bold text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Generate & Insert {definition.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
