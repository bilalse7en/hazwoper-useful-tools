'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Rotate3d,
  FileText,
  Video,
  Music,
  Wand2,
  Cpu,
  MousePointer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const TURNTABLE_CATEGORIES = [
  {
    id: 'pdf',
    label: '📄 PDF & Docs',
    desc: 'Editor, Merge, Word-to-HTML',
    slug: 'pdf-editor',
    filterId: 'pdf',
  },
  {
    id: 'video',
    label: '🎬 Video & GIF',
    desc: 'WASM Compressor, Converter',
    slug: 'video-compressor',
    filterId: 'video',
  },
  {
    id: 'audio',
    label: '🎵 Audio & Voice',
    desc: 'Lossless MP3/WAV, Speed',
    slug: 'audio-converter',
    filterId: 'audio',
  },
  {
    id: 'ocr',
    label: '👁️ OCR & Vision',
    desc: 'Image to Text, BG Remover',
    slug: 'image-to-text',
    filterId: 'ocr',
  },
  {
    id: 'ai',
    label: '⚡ AI Assistant',
    desc: 'Course Creator, Prompt Studio',
    slug: 'ai-course-creator',
    filterId: 'ai',
  },
];

const TURNTABLE_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4';

/**
 * MainframeTurntableCard Component
 * Replaces the static 'Quick Launch Utilities' column in the hero.
 * Features 360° mouse scrubbing turntable, interactive category pills, and instant WASM launcher.
 */
export function MainframeTurntableCard({ onCategorySelect }) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState(['pdf', 'ai']);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const rafIdRef = useRef(null);
  const pendingTimeRef = useRef(null);
  const isSeekingRef = useRef(false);

  // Toggle category pill
  const toggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId];
      if (typeof onCategorySelect === 'function') {
        onCategorySelect(next);
      }
      return next;
    });
  };

  // Launch workspace action
  const handleLaunch = () => {
    if (selectedCategories.length === 0) return;
    setHasLaunched(true);

    if (selectedCategories.length === 1) {
      const match = TURNTABLE_CATEGORIES.find(
        (c) => c.id === selectedCategories[0]
      );
      if (match?.slug) {
        router.push(`/tools/${match.slug}`);
        return;
      }
    }

    // Scroll to tools directory or generators
    const target =
      document.getElementById('tools-directory') ||
      document.getElementById('generators');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/tools');
    }
  };

  // 360° Mouse Scrubbing Hook
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const video = videoRef.current;
    if (!video) return;

    const handleSeeked = () => {
      isSeekingRef.current = false;
      if (pendingTimeRef.current !== null) {
        const nextTime = pendingTimeRef.current;
        pendingTimeRef.current = null;
        isSeekingRef.current = true;
        try {
          video.currentTime = nextTime;
        } catch {
          // ignore seek restrictions
        }
      }
    };

    video.addEventListener('seeked', handleSeeked);

    // Track mouse movement across the turntable card or hero
    const handleMouseMove = (e) => {
      if (window.innerWidth < 1024) return;
      if (!video.duration || Number.isNaN(video.duration)) return;

      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Expand detection zone slightly around card for comfortable scrubbing
      const relativeX = e.clientX - rect.left;
      const progress = Math.max(
        0,
        Math.min(1, relativeX / Math.max(1, rect.width))
      );
      const targetTime = progress * (video.duration || 1);

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        if (!isSeekingRef.current && !video.seeking) {
          isSeekingRef.current = true;
          try {
            video.currentTime = targetTime;
          } catch {
            // ignore
          }
        } else {
          pendingTimeRef.current = targetTime;
        }
      });
    };

    // Mobile fallback: auto play & loop
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    if (window.innerWidth < 1024) {
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {});
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      video.removeEventListener('seeked', handleSeeked);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-3xl border border-border/80 bg-card/85 dark:bg-card/50 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl space-y-4 overflow-hidden group transition-all duration-300 hover:shadow-primary/5"
    >
      {/* Background ambient radial glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-primary/15 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 blur-2xl -z-10 pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>Mainframe Hero Engine</span>
          </span>
        </div>

        <Badge
          variant="outline"
          className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
        >
          100% LOCAL
        </Badge>
      </div>

      {/* 360° Interactive Turntable Video Display */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/70 bg-black/90 shadow-inner group/turntable cursor-ew-resize">
        <video
          ref={videoRef}
          src={TURNTABLE_VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center filter contrast-105 transition-transform duration-300"
        />

        {/* Scanline & HUD overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

        {/* High-Tech HUD Corner Brackets */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-primary/80 pointer-events-none" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-primary/80 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-primary/80 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-primary/80 pointer-events-none" />

        {/* Turntable Scrubbing Live Indicator */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-[10px] font-mono text-white/95 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
          <span className="flex items-center gap-1.5">
            <Rotate3d
              className="w-3.5 h-3.5 text-emerald-400 animate-spin"
              style={{ animationDuration: '6s' }}
            />
            <span className="hidden sm:inline">Move mouse to scrub 360°</span>
            <span className="sm:hidden">360° 3D Model</span>
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <MousePointer className="w-3 h-3 text-emerald-400" />
            TURNTABLE
          </span>
        </div>
      </div>

      {/* Category Pills Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <span>Select Utilities:</span>
          </span>
          <span className="text-[10px] font-mono text-primary">
            {selectedCategories.length} selected
          </span>
        </div>

        {/* Multi-Select Category Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {TURNTABLE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-between select-none border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/40 hover:bg-muted text-foreground border-border/70 hover:border-primary/40'
                }`}
              >
                <span className="truncate">{cat.label}</span>
                {isSelected && (
                  <Check className="w-3 h-3 stroke-[3] ml-1 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Launch Action Dock */}
      <div className="space-y-2 pt-1">
        <Button
          onClick={handleLaunch}
          disabled={selectedCategories.length === 0}
          className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
        >
          <span>
            {selectedCategories.length === 0
              ? 'Select Categories Above'
              : selectedCategories.length === 1
                ? `Open ${TURNTABLE_CATEGORIES.find((c) => c.id === selectedCategories[0])?.label || 'Tool'}`
                : `Launch ${selectedCategories.length} Tool Suites`}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>

        {/* Launch Feedback Toast */}
        {hasLaunched && selectedCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-500" />
              Initializing WebAssembly workers...
            </span>
            <button
              type="button"
              onClick={() => setHasLaunched(false)}
              className="font-bold underline text-[10px] ml-2"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Security Footnote */}
      <div className="pt-1.5 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Zero server uploads
        </span>
        <Link
          href="/tools"
          className="font-bold text-primary hover:underline flex items-center gap-1 text-[11px]"
        >
          All 21 Tools
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default MainframeTurntableCard;
