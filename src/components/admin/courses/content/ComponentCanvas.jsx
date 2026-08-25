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
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit3,
  Eye,
  Code,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Shield,
  Flame,
  Sparkles,
  Wand2,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  COMPONENT_DEFINITIONS,
  COLOR_THEMES,
  generateComponentId,
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

export default function ComponentCanvas({
  components = [],
  onChange,
  onOpenConfigModal,
  topicTitle = 'Topic Content',
}) {
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'preview' | 'code'
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [activeTabs, setActiveTabs] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropInsertIndex, setDropInsertIndex] = useState(null);

  // Handle Drag & Drop over Canvas
  const handleDragOver = (e, index = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
    setDropInsertIndex(index);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDropInsertIndex(null);
  };

  const handleDrop = (e, index = null) => {
    e.preventDefault();
    setIsDragOver(false);
    setDropInsertIndex(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const { type } = JSON.parse(dataStr);
      if (type) {
        onOpenConfigModal(type, index);
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  };

  // Component manipulation helpers
  const handleUpdateComponent = (id, newProps) => {
    const updated = components.map((c) =>
      c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
    );
    onChange(updated);
  };

  const handleDeleteComponent = (id) => {
    const updated = components.filter((c) => c.id !== id);
    onChange(updated);
  };

  const handleDuplicateComponent = (id) => {
    const targetIdx = components.findIndex((c) => c.id === id);
    if (targetIdx === -1) return;
    const target = components[targetIdx];
    const clone = {
      ...JSON.parse(JSON.stringify(target)),
      id: generateComponentId(target.type.substring(0, 3)),
    };
    const updated = [...components];
    updated.splice(targetIdx + 1, 0, clone);
    onChange(updated);
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const updated = [...components];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index) => {
    if (index >= components.length - 1) return;
    const updated = [...components];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Top Canvas Toolbar */}
      <div className="p-3 border-b border-border bg-card flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-primary" /> Visual Block Canvas
          </span>
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground">
            {components.length} {components.length === 1 ? 'block' : 'blocks'}
          </span>
          <button
            type="button"
            onClick={() => onOpenConfigModal('accordion', components.length)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1 shadow-xs ml-1"
            title="Quick Insert Component"
          >
            <Plus className="w-3 h-3" />
            <span>Add Block</span>
          </button>
        </div>

        {/* View Mode Toggle (Visual Builder vs Learner Live Preview vs Code) */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'visual'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit3 className="w-3 h-3" /> Visual Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'preview'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3 h-3" /> Live Player View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'code'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code className="w-3 h-3" /> JSON
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
        className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 transition-colors ${
          isDragOver
            ? 'bg-amber-500/5 ring-2 ring-amber-500/30'
            : 'bg-background'
        }`}
      >
        {/* Code / JSON View */}
        {activeTab === 'code' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>Structured Topic JSON (Version 2)</span>
              <span>{JSON.stringify(components).length} chars</span>
            </div>
            <textarea
              readOnly
              value={JSON.stringify({ version: 2, components }, null, 2)}
              className="w-full h-96 p-4 rounded-xl border border-border bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none"
            />
          </div>
        )}

        {/* Live Preview View (Learner Experience) */}
        {activeTab === 'preview' && (
          <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-[#0f172a] border border-slate-800 text-slate-100 shadow-2xl space-y-6">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-mono">
                Learner Live Simulation
              </span>
              <span className="text-xs text-slate-400">Exact Theme Render</span>
            </div>

            {components.map((comp) => (
              <div key={comp.id}>
                {renderPreviewBlock(comp, {
                  expandedAccordions,
                  setExpandedAccordions,
                  flippedCards,
                  setFlippedCards,
                  activeTabs,
                  setActiveTabs,
                })}
              </div>
            ))}
          </div>
        )}

        {/* Visual Builder Workspace */}
        {activeTab === 'visual' && (
          <>
            {components.length === 0 ? (
              <div
                onDragOver={(e) => handleDragOver(e, 0)}
                onDrop={(e) => handleDrop(e, 0)}
                className="border-2 border-dashed border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 bg-muted/20 hover:border-amber-500/50 transition-all cursor-pointer"
                onClick={() => onOpenConfigModal('accordion', 0)}
              >
                <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 animate-bounce">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">
                    Drop Components Here or Click to Start
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Drag elements like Accordions, 3D Flip Cards, Callouts, or
                    Feature Cards from the left palette.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {['accordion', 'flip-cards', 'icon-cards', 'callout'].map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenConfigModal(type, 0);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-border bg-card hover:border-amber-500/50 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-amber-500" />
                        <span className="capitalize">
                          {type.replace('-', ' ')}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              components.map((comp, idx) => (
                <div key={comp.id} className="space-y-3">
                  {/* Top Drop Divider Insert */}
                  <div
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="h-2 group/divider relative flex items-center justify-center transition-all"
                  >
                    <div className="w-full h-px bg-border/40 group-hover/divider:bg-amber-500 transition-colors" />
                    <button
                      type="button"
                      onClick={() => onOpenConfigModal('accordion', idx)}
                      className="opacity-0 group-hover/divider:opacity-100 absolute px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] shadow-sm transition-opacity flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Insert Block Here
                    </button>
                  </div>

                  {/* Component Block Card */}
                  <div className="border border-border rounded-2xl bg-card shadow-sm hover:border-border/80 transition-all overflow-hidden">
                    {/* Component Header / Toolbar */}
                    <div className="p-3 border-b border-border bg-muted/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-mono font-bold text-[10px] uppercase">
                          #{idx + 1} {comp.type}
                        </span>
                        <input
                          type="text"
                          value={comp.props.title || ''}
                          onChange={(e) =>
                            handleUpdateComponent(comp.id, {
                              title: e.target.value,
                            })
                          }
                          placeholder="Component title..."
                          className="font-bold text-xs bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground w-48 md:w-80 truncate"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === components.length - 1}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateComponent(comp.id)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Duplicate Block"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComponent(comp.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors"
                          title="Delete Block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Component In-Place Editor Body */}
                    <div className="p-4">
                      {renderEditableBlock(comp, handleUpdateComponent)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Bottom Add Component Drop Area */}
            {components.length > 0 && (
              <div
                onDragOver={(e) => handleDragOver(e, components.length)}
                onDrop={(e) => handleDrop(e, components.length)}
                className="p-4 border-2 border-dashed border-border/80 hover:border-amber-500/50 rounded-2xl text-center flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all cursor-pointer"
                onClick={() =>
                  onOpenConfigModal('accordion', components.length)
                }
              >
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Add Next Block (or drag from palette)</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * In-place editable block renderer for the visual builder
 */
function renderEditableBlock(comp, onUpdate) {
  switch (comp.type) {
    case 'accordion': {
      const items = comp.props.items || [];
      const handleAddItem = () => {
        const newItem = {
          title: `Section ${items.length + 1}: Additional Guideline`,
          content:
            '<p>Comprehensive instructions and regulatory procedures.</p>',
          badge: `PART ${items.length + 1}`,
        };
        onUpdate(comp.id, { items: [...items, newItem] });
      };

      const handleUpdateItem = (itemIdx, updates) => {
        const updated = [...items];
        updated[itemIdx] = { ...updated[itemIdx], ...updates };
        onUpdate(comp.id, { items: updated });
      };

      const handleDeleteItem = (itemIdx) => {
        const updated = items.filter((_, i) => i !== itemIdx);
        onUpdate(comp.id, { items: updated });
      };

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-muted-foreground">
              Accordion Panels ({items.length} sections)
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Accordion Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, iIdx) => (
              <div
                key={iIdx}
                className="p-3 rounded-xl border border-border bg-muted/20 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      handleUpdateItem(iIdx, { title: e.target.value })
                    }
                    className="font-bold text-xs bg-transparent border-b border-border/60 flex-1 py-1 focus:outline-none"
                    placeholder="Accordion item title..."
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(iIdx)}
                    className="text-rose-500 hover:text-rose-600 p-1"
                    title="Delete item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <textarea
                  value={item.content?.replace(/<[^>]*>/g, '') || ''}
                  onChange={(e) =>
                    handleUpdateItem(iIdx, {
                      content: `<p>${e.target.value}</p>`,
                    })
                  }
                  rows={2}
                  className="w-full p-2 rounded-lg border border-border bg-background text-xs focus:outline-none"
                  placeholder="Accordion body content..."
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'flip-cards': {
      const cards = comp.props.cards || [];
      const handleUpdateCard = (cardIdx, updates) => {
        const updated = [...cards];
        updated[cardIdx] = { ...updated[cardIdx], ...updates };
        onUpdate(comp.id, { cards: updated });
      };

      return (
        <div className="space-y-3">
          <span className="font-bold text-xs text-muted-foreground block">
            3D Flip Cards ({cards.length} cards)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((card, cIdx) => (
              <div
                key={cIdx}
                className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-500">
                    Card #{cIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={card.category || ''}
                    onChange={(e) =>
                      handleUpdateCard(cIdx, { category: e.target.value })
                    }
                    placeholder="Badge (e.g. OSHA Standard)"
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border focus:outline-none w-32 text-right"
                  />
                </div>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) =>
                    handleUpdateCard(cIdx, { title: e.target.value })
                  }
                  className="w-full font-bold bg-transparent border-b border-border py-1 focus:outline-none"
                  placeholder="Card Title..."
                />
                <textarea
                  value={card.frontText}
                  onChange={(e) =>
                    handleUpdateCard(cIdx, { frontText: e.target.value })
                  }
                  rows={2}
                  className="w-full p-2 rounded-lg border border-border bg-background text-[11px] focus:outline-none"
                  placeholder="Front side summary..."
                />
                <textarea
                  value={card.backText}
                  onChange={(e) =>
                    handleUpdateCard(cIdx, { backText: e.target.value })
                  }
                  rows={2}
                  className="w-full p-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-[11px] focus:outline-none"
                  placeholder="Back side compliance detail..."
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'callout': {
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={comp.props.title || ''}
            onChange={(e) => onUpdate(comp.id, { title: e.target.value })}
            className="w-full font-bold text-xs bg-transparent border-b border-border py-1 focus:outline-none"
            placeholder="Alert title..."
          />
          <textarea
            value={comp.props.content?.replace(/<[^>]*>/g, '') || ''}
            onChange={(e) =>
              onUpdate(comp.id, { content: `<p>${e.target.value}</p>` })
            }
            rows={2}
            className="w-full p-2 rounded-lg border border-border bg-background text-xs focus:outline-none"
            placeholder="Alert message content..."
          />
        </div>
      );
    }

    case 'stats': {
      const stats = comp.props.stats || [];
      const handleUpdateStat = (idx, updates) => {
        const updated = [...stats];
        updated[idx] = { ...updated[idx], ...updates };
        onUpdate(comp.id, { stats: updated });
      };

      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {stats.map((stat, sIdx) => (
            <div
              key={sIdx}
              className="p-3 rounded-xl border border-border bg-muted/20 space-y-1 text-center"
            >
              <input
                type="text"
                value={stat.value}
                onChange={(e) =>
                  handleUpdateStat(sIdx, { value: e.target.value })
                }
                className="w-full font-black text-sm text-center bg-transparent border-b border-border py-0.5 focus:outline-none text-amber-500"
                placeholder="1,800 lbs"
              />
              <input
                type="text"
                value={stat.label}
                onChange={(e) =>
                  handleUpdateStat(sIdx, { label: e.target.value })
                }
                className="w-full text-[10px] font-bold text-center bg-transparent focus:outline-none text-foreground"
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      );
    }

    case 'steps': {
      const steps = comp.props.steps || [];
      const handleUpdateStep = (idx, updates) => {
        const updated = [...steps];
        updated[idx] = { ...updated[idx], ...updates };
        onUpdate(comp.id, { steps: updated });
      };

      return (
        <div className="space-y-2">
          {steps.map((step, sIdx) => (
            <div
              key={sIdx}
              className="flex items-start gap-2 p-2.5 rounded-xl border border-border bg-muted/20 text-xs"
            >
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                {step.number || sIdx + 1}
              </span>
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) =>
                    handleUpdateStep(sIdx, { title: e.target.value })
                  }
                  className="w-full font-bold bg-transparent border-b border-border/60 py-0.5 focus:outline-none"
                  placeholder="Step title..."
                />
                <textarea
                  value={step.description}
                  onChange={(e) =>
                    handleUpdateStep(sIdx, { description: e.target.value })
                  }
                  rows={1}
                  className="w-full p-1.5 rounded-md border border-border bg-background text-[11px] focus:outline-none"
                  placeholder="Step instructions..."
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'rich-text': {
      return (
        <textarea
          value={comp.props.html || ''}
          onChange={(e) => onUpdate(comp.id, { html: e.target.value })}
          rows={5}
          className="w-full p-3 rounded-xl border border-border bg-background text-xs font-mono focus:outline-none leading-relaxed"
          placeholder="Formatted HTML or text content..."
        />
      );
    }

    default:
      return (
        <div className="text-xs text-muted-foreground italic">
          Block parameters configured. Switch to Live Player View to interact.
        </div>
      );
  }
}

/**
 * Preview renderer replicating learner experience in dark theme
 */
function renderPreviewBlock(comp, state) {
  const {
    expandedAccordions,
    setExpandedAccordions,
    flippedCards,
    setFlippedCards,
    activeTabs,
    setActiveTabs,
  } = state;

  switch (comp.type) {
    case 'accordion': {
      const items = comp.props.items || [];
      return (
        <div className="space-y-2">
          {comp.props.title && (
            <h3 className="text-sm font-bold text-white mb-2">
              {comp.props.title}
            </h3>
          )}
          {items.map((item, idx) => {
            const isOpen = expandedAccordions[`${comp.id}_${idx}`] ?? idx === 0;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedAccordions((prev) => ({
                      ...prev,
                      [`${comp.id}_${idx}`]: !isOpen,
                    }))
                  }
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                  <span>{item.title}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div
                    className="p-4 pt-1 text-xs text-slate-300 border-t border-slate-800/40 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case 'flip-cards': {
      const cards = comp.props.cards || [];
      return (
        <div className="space-y-3">
          {comp.props.title && (
            <h3 className="text-sm font-bold text-white">{comp.props.title}</h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cards.map((card, cIdx) => {
              const isFlipped = flippedCards[`${comp.id}_${cIdx}`];
              return (
                <div
                  key={cIdx}
                  onClick={() =>
                    setFlippedCards((prev) => ({
                      ...prev,
                      [`${comp.id}_${cIdx}`]: !isFlipped,
                    }))
                  }
                  className={`min-h-[160px] p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isFlipped
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase text-amber-400">
                      {isFlipped
                        ? 'COMPLIANCE CHECK'
                        : card.category || 'FRONT'}
                    </span>
                    <h4 className="font-bold text-xs text-white mt-1">
                      {isFlipped ? card.backTitle || card.title : card.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                      {isFlipped ? card.backText : card.frontText}
                    </p>
                  </div>
                  <span className="text-[9px] text-amber-400 font-bold flex items-center gap-1 pt-2 border-t border-slate-800">
                    <RotateCcw className="w-3 h-3" /> Click to flip
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'callout': {
      return (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>{comp.props.title || 'Safety Directive'}</span>
          </div>
          <div dangerouslySetInnerHTML={{ __html: comp.props.content }} />
        </div>
      );
    }

    case 'stats': {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {comp.props.stats?.map((s, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-800 bg-slate-900 text-center"
            >
              <span className="font-black text-xl text-amber-400 block">
                {s.value}
              </span>
              <span className="text-[11px] font-bold text-slate-300 mt-1 block">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      );
    }

    case 'steps': {
      return (
        <div className="space-y-2">
          {comp.props.steps?.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900 text-xs"
            >
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                {step.number || idx + 1}
              </span>
              <div>
                <h5 className="font-bold text-white">{step.title}</h5>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'rich-text': {
      return (
        <div
          className="prose prose-invert max-w-none text-xs text-slate-200 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: comp.props.html }}
        />
      );
    }

    default:
      return null;
  }
}
