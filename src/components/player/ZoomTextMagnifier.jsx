'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Move,
  Sparkles,
  Sun,
  Eye,
  Sliders,
  Crosshair,
  Maximize2,
  X,
  Volume2,
  Check,
  RotateCcw,
  Zap,
  AlignLeft,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ZoomText Magnifier & Assistive Reader Component
 * Specialized for low-vision learners, dyslexia assistance, and OSHA compliance reading.
 * Provides floating glassmorphic optical lens, auto-tracking TTS sync, reading ruler, and high-contrast spotlight.
 */
export default function ZoomTextMagnifier({
  isEnabled = false,
  onClose,
  activeWord = '',
  activeWordIndex = 0,
  activeSentence = '',
  isSpeaking = false,
  containerRef,
  theme = 'dark',
}) {
  // Magnification & Mode State
  const [zoomLevel, setZoomLevel] = useState(1.5); // 1.25, 1.5, 2.0, 3.0
  const [mode, setMode] = useState('lens_loupe'); // 'lens_loupe' | 'focus_spotlight' | 'reading_ruler'
  const [highContrast, setHighContrast] = useState('yellow_black'); // 'standard' | 'yellow_black' | 'cyan_navy'
  const [isAutoTracking, setIsAutoTracking] = useState(true);
  const [lensShape, setLensShape] = useState('circle'); // 'circle' | 'rect'

  // Lens Position Coordinates (Viewport space)
  const [lensPos, setLensPos] = useState({ x: 300, y: 260 });
  const [isDragging, setIsDragging] = useState(false);
  const [isManualHovering, setIsManualHovering] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startLensX: 0, startLensY: 0 });

  // Floating Micro-Toolbar Position
  const [toolbarPos, setToolbarPos] = useState({ x: 24, y: 80 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const toolbarDragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  // Target element tracked during TTS narration
  const targetElementRef = useRef(null);

  // High-Contrast Theme Color Palettes
  const contrastThemes = {
    standard: {
      id: 'standard',
      name: 'Standard',
      borderColor: 'border-amber-400',
      lensBg: 'bg-slate-900/90 text-slate-100',
      highlightWordBg:
        'bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md shadow-xs',
      rulerColor: 'bg-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
      spotlightBorder:
        'border-amber-400/80 ring-4 ring-amber-400/20 shadow-2xl',
      badgeBg: 'bg-amber-500 text-slate-950',
    },
    yellow_black: {
      id: 'yellow_black',
      name: 'OSHA High-Vis Yellow',
      borderColor: 'border-[#ffc800]',
      lensBg: 'bg-[#090d16]/95 text-[#fef08a]',
      highlightWordBg:
        'bg-[#ffc800] text-black font-black px-1.5 py-0.5 rounded-md shadow-sm',
      rulerColor: 'bg-[#ffc800] shadow-[0_0_16px_rgba(255,200,0,0.8)]',
      spotlightBorder: 'border-[#ffc800] ring-4 ring-[#ffc800]/30 shadow-2xl',
      badgeBg: 'bg-[#ffc800] text-black',
    },
    cyan_navy: {
      id: 'cyan_navy',
      name: 'Electric Cyan SuperNova',
      borderColor: 'border-cyan-400',
      lensBg: 'bg-[#030712]/95 text-cyan-100',
      highlightWordBg:
        'bg-cyan-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md shadow-sm',
      rulerColor: 'bg-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.8)]',
      spotlightBorder: 'border-cyan-400 ring-4 ring-cyan-400/30 shadow-2xl',
      badgeBg: 'bg-cyan-400 text-slate-950',
    },
  };

  const activeTheme =
    contrastThemes[highContrast] || contrastThemes.yellow_black;

  // Auto-track speech: center the magnifier lens over the active spoken element or text
  useEffect(() => {
    if (!isEnabled || !isAutoTracking || isDragging || isManualHovering) return;

    if (isSpeaking && containerRef?.current) {
      // Find elements containing the active word or sentence
      const container = containerRef.current;
      const highlightSpan =
        container.querySelector('[data-tts-active="true"]') ||
        container.querySelector('.tts-active-word') ||
        container.querySelector('h2') ||
        container.querySelector('p');

      if (highlightSpan) {
        const rect = highlightSpan.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const targetX = rect.left + rect.width / 2;
          const targetY = rect.top + rect.height / 2;

          setLensPos((prev) => ({
            x: prev.x + (targetX - prev.x) * 0.45,
            y: prev.y + (targetY - prev.y) * 0.45,
          }));
        }
      }
    }
  }, [
    activeWord,
    activeSentence,
    isSpeaking,
    isAutoTracking,
    isDragging,
    isManualHovering,
    containerRef,
    isEnabled,
  ]);

  // Mouse hover tracking across content when manual hovering is active
  useEffect(() => {
    if (!isEnabled || !containerRef?.current) return;

    const handleMouseMove = (e) => {
      if (isDragging || !isManualHovering) return;
      setLensPos({
        x: e.clientX,
        y: e.clientY,
      });
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [isEnabled, isDragging, isManualHovering, containerRef]);

  // Mouse dragging handlers for Loupe Lens
  const handleLensMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setIsAutoTracking(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startLensX: lensPos.x,
      startLensY: lensPos.y,
    };
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        setLensPos({
          x: Math.max(
            80,
            Math.min(
              window.innerWidth - 80,
              dragStartRef.current.startLensX + deltaX
            )
          ),
          y: Math.max(
            80,
            Math.min(
              window.innerHeight - 80,
              dragStartRef.current.startLensY + deltaY
            )
          ),
        });
      }
      if (isDraggingToolbar) {
        const deltaX = e.clientX - toolbarDragStartRef.current.x;
        const deltaY = e.clientY - toolbarDragStartRef.current.y;
        setToolbarPos({
          x: Math.max(
            12,
            Math.min(
              window.innerWidth - 300,
              toolbarDragStartRef.current.startX + deltaX
            )
          ),
          y: Math.max(
            12,
            Math.min(
              window.innerHeight - 100,
              toolbarDragStartRef.current.startY + deltaY
            )
          ),
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) setIsDragging(false);
      if (isDraggingToolbar) setIsDraggingToolbar(false);
    };

    if (isDragging || isDraggingToolbar) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isDraggingToolbar]);

  if (!isEnabled) return null;

  // Render high-clarity tokenized active sentence with highlighted word
  const renderSentenceWithActiveWord = (sentence, word) => {
    if (!sentence) return word || 'OSHA Safety Training Focus';
    if (!word) return sentence;

    const parts = sentence.split(
      new RegExp(`(\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`, 'gi')
    );

    return parts.map((part, i) => {
      const isMatch = part.toLowerCase() === word.toLowerCase();
      if (isMatch) {
        return (
          <span key={i} className={activeTheme.highlightWordBg}>
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[99998] overflow-hidden select-none">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. LENS / LOUPE MODE (OPTICAL FLOATING MAGNIFIER)            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mode === 'lens_loupe' && (
        <motion.div
          animate={{
            x: lensPos.x - (lensShape === 'circle' ? 140 : 180),
            y: lensPos.y - (lensShape === 'circle' ? 140 : 100),
          }}
          transition={{
            type: 'spring',
            damping: 28,
            stiffness: 320,
            mass: 0.5,
          }}
          onMouseDown={handleLensMouseDown}
          className={cn(
            'pointer-events-auto absolute cursor-grab active:cursor-grabbing backdrop-blur-xl border-2 shadow-2xl flex flex-col justify-between p-4 overflow-hidden group transition-colors duration-200',
            lensShape === 'circle'
              ? 'w-72 h-72 rounded-full'
              : 'w-96 h-52 rounded-3xl',
            activeTheme.borderColor,
            activeTheme.lensBg
          )}
          style={{
            boxShadow:
              '0 20px 60px rgba(0,0,0,0.6), inset 0 0 24px rgba(255,255,255,0.08)',
          }}
        >
          {/* Top Info Bar inside Lens */}
          <div className="flex items-center justify-between text-[10px] font-mono font-black uppercase tracking-wider px-2 shrink-0">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full font-bold shadow-xs',
                activeTheme.badgeBg
              )}
            >
              ZoomText {zoomLevel}x
            </span>
            <div className="flex items-center gap-1.5 opacity-80">
              {isAutoTracking ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Compass className="w-3 h-3 animate-spin" /> Speech Track
                </span>
              ) : (
                <span className="flex items-center gap-1 opacity-70">
                  <Move className="w-3 h-3" /> Manual Loupe
                </span>
              )}
            </div>
          </div>

          {/* Center Magnified Text Display Area (Crisp Subpixel High-Contrast Rendering) */}
          <div
            className="flex-1 flex flex-col items-center justify-center p-3 text-center my-auto overflow-hidden"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          >
            <div className="font-extrabold tracking-tight leading-snug drop-shadow-md max-w-xs line-clamp-3">
              {renderSentenceWithActiveWord(
                activeSentence || activeWord,
                activeWord
              )}
            </div>
          </div>

          {/* Bottom Crosshair / Status */}
          <div className="flex items-center justify-between text-[9px] font-mono opacity-70 px-2 shrink-0">
            <span>OSHA Loupe Assist</span>
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-amber-400" /> Focus Centered
            </span>
          </div>

          {/* Center Reticle Crosshairs */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
            <div className="w-full h-px bg-white" />
            <div className="h-full w-px bg-white absolute" />
          </div>
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. FOCUS SPOTLIGHT MODE                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mode === 'focus_spotlight' && (
        <motion.div
          animate={{ x: lensPos.x - 240, y: lensPos.y - 65 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className={cn(
            'pointer-events-auto absolute w-[480px] min-h-[130px] rounded-3xl p-5 border-2 backdrop-blur-2xl shadow-2xl flex flex-col justify-between cursor-grab active:cursor-grabbing',
            activeTheme.spotlightBorder,
            activeTheme.lensBg
          )}
          onMouseDown={handleLensMouseDown}
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider pb-2 border-b border-white/10">
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-lg font-black',
                activeTheme.badgeBg
              )}
            >
              Focus Spotlight ({zoomLevel}x)
            </span>
            <span className="opacity-75 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Active Reading
              Line
            </span>
          </div>

          <div
            className="my-auto py-2 font-black text-sm md:text-base leading-relaxed text-center"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          >
            {renderSentenceWithActiveWord(
              activeSentence || activeWord,
              activeWord
            )}
          </div>

          <div className="text-[10px] font-mono opacity-60 text-right">
            Drag spotlight anywhere to magnify
          </div>
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. READING RULER MODE (PACING FOCUS LINE)                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mode === 'reading_ruler' && (
        <motion.div
          animate={{ y: lensPos.y + 24 }}
          transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          className="pointer-events-auto absolute left-0 right-0 h-10 flex flex-col items-center justify-center cursor-ns-resize"
          onMouseDown={handleLensMouseDown}
        >
          {/* Horizontal Highlight Ruler Line */}
          <div
            className={cn(
              'w-full h-1.5 transition-all',
              activeTheme.rulerColor
            )}
          />
          {/* Small Center Ruler Badge */}
          <div
            className={cn(
              'px-3 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest mt-1 shadow-md',
              activeTheme.badgeBg
            )}
          >
            Reading Focus Ruler • Line Guide
          </div>
        </motion.div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. FLOATING MICRO-TOOLBAR (ZOOMTEXT CONTROLLER)             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <motion.div
        animate={{ x: toolbarPos.x, y: toolbarPos.y }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="pointer-events-auto absolute bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-2xl p-3.5 backdrop-blur-2xl text-slate-100 flex flex-col gap-3 min-w-[280px] max-w-xs z-50 ring-1 ring-white/10"
      >
        {/* Toolbar Header (Draggable Handle) */}
        <div
          onMouseDown={(e) => {
            setIsDraggingToolbar(true);
            toolbarDragStartRef.current = {
              x: e.clientX,
              y: e.clientY,
              startX: toolbarPos.x,
              startY: toolbarPos.y,
            };
          }}
          className="flex items-center justify-between pb-2 border-b border-slate-800 cursor-move"
        >
          <div className="flex items-center gap-2 font-black text-xs text-amber-400">
            <Search className="w-4 h-4 text-amber-400" />
            <span>ZoomText Reader</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setLensPos({
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2,
                });
                setIsAutoTracking(true);
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Reset Position to Center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
              title="Close Magnifier Mode"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. Magnification Factor Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Magnification Factor</span>
            <span className="text-amber-400 font-mono font-black">
              {zoomLevel}x
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1.25, 1.5, 2.0, 3.0].map((z) => (
              <button
                key={z}
                onClick={() => setZoomLevel(z)}
                className={cn(
                  'py-1.5 rounded-xl font-mono text-xs font-black border transition-all',
                  zoomLevel === z
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                )}
              >
                {z}x
              </button>
            ))}
          </div>
        </div>

        {/* 2. Mode Selector: Loupe / Spotlight / Ruler */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Assistive Lens Mode
          </span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'lens_loupe', label: 'Loupe', icon: Search },
              { id: 'focus_spotlight', label: 'Spotlight', icon: Sparkles },
              { id: 'reading_ruler', label: 'Ruler', icon: AlignLeft },
            ].map((m) => {
              const IconComp = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'py-2 px-1 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 transition-all',
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. High Contrast Palette Switcher */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            High Contrast Colorway
          </span>
          <div className="grid grid-cols-3 gap-1">
            {Object.values(contrastThemes).map((th) => (
              <button
                key={th.id}
                onClick={() => setHighContrast(th.id)}
                className={cn(
                  'py-1.5 px-1 rounded-xl text-[9px] font-bold border truncate transition-all',
                  highContrast === th.id
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-black ring-1 ring-amber-400/40'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                )}
                title={th.name}
              >
                {th.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Auto-Track TTS vs Manual Hover Drag Toggle */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Compass
              className={cn(
                'w-4 h-4',
                isAutoTracking ? 'text-emerald-400' : 'text-slate-500'
              )}
            />
            <span className="font-bold text-[11px]">Speech Auto-Track</span>
          </div>
          <button
            onClick={() => setIsAutoTracking(!isAutoTracking)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all',
              isAutoTracking
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-xs'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            )}
          >
            {isAutoTracking ? 'ON (Sync)' : 'OFF (Drag)'}
          </button>
        </div>

        {/* Lens Shape Toggle (Circle / Rect) if in Loupe mode */}
        {mode === 'lens_loupe' && (
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
            <span>Lens Shape</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLensShape('circle')}
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-bold',
                  lensShape === 'circle'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400'
                )}
              >
                Circle
              </button>
              <button
                onClick={() => setLensShape('rect')}
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-bold',
                  lensShape === 'rect'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400'
                )}
              >
                Rect
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
