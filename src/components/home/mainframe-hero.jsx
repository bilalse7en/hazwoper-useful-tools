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
  Laptop,
  Play,
  Rotate3d,
  FileText,
  Video,
  Music,
  Wand2,
  Cpu,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Custom hook for smooth typewriter effect with start delay
 */
function useTypewriter(text, speed = 32, startDelay = 300) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let index = 0;
    let intervalId = null;

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        index++;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

export const HERO_CATEGORIES = [
  {
    id: 'pdf',
    label: '📄 PDF & Docs',
    desc: 'Editor, Merge, Word-to-HTML',
    slug: 'pdf-editor',
    targetId: 'pdf',
  },
  {
    id: 'video',
    label: '🎬 Video & GIF',
    desc: 'WASM Compressor, Converter',
    slug: 'video-compressor',
    targetId: 'video',
  },
  {
    id: 'audio',
    label: '🎵 Audio & Voice',
    desc: 'Lossless MP3/WAV, Speed',
    slug: 'audio-converter',
    targetId: 'audio',
  },
  {
    id: 'ocr',
    label: '👁️ OCR & Vision',
    desc: 'Image to Text, BG Remover',
    slug: 'image-to-text',
    targetId: 'ocr',
  },
  {
    id: 'ai',
    label: '⚡ AI Assistant',
    desc: 'Course Creator, Prompt Studio',
    slug: 'ai-course-creator',
    targetId: 'ai',
  },
];

const DEFAULT_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4';

/**
 * MainframeHeroUnit Component
 * Replaces the static 'Quick Launch Utilities' column with the interactive 3D turntable
 * video scrubber, multi-select category launcher, and responsive cursor turntable.
 */
export function MainframeHeroUnit({ user }) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState(['pdf', 'ai']);
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isHoveringTurntable, setIsHoveringTurntable] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const rafIdRef = useRef(null);
  const pendingTimeRef = useRef(null);
  const isSeekingRef = useRef(false);

  const isGuest = !user || user.isGuest;

  // Typewriter text
  const headlineTargetText = isGuest
    ? 'Instant, Private\nContent Utilities.'
    : `Welcome back, ${user?.name?.split(' ')[0] || 'Architect'}.\nYour workspace is ready.`;

  const { displayed, done } = useTypewriter(headlineTargetText, 32, 250);

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Launch action trigger
  const handleLaunch = () => {
    if (selectedCategories.length === 0) return;
    setHasLaunched(true);

    // If single category selected, navigate directly to primary tool
    if (selectedCategories.length === 1) {
      const match = HERO_CATEGORIES.find((c) => c.id === selectedCategories[0]);
      if (match?.slug) {
        router.push(`/tools/${match.slug}`);
        return;
      }
    }

    // Otherwise scroll smoothly to the tools directory
    const directorySection =
      document.getElementById('tools-directory') ||
      document.getElementById('generators');
    if (directorySection) {
      directorySection.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/tools');
    }
  };

  // Mouse Scrubbing Hook & Mobile Autoplay Hook
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

    // Horizontal cursor tracking over hero
    const handleMouseMove = (e) => {
      if (window.innerWidth < 1024) return;
      if (!video.duration || Number.isNaN(video.duration)) return;

      // Calculate progress relative to window or hero container
      const rect = containerRef.current?.getBoundingClientRect();
      let progress = 0.5;

      if (rect) {
        const relativeX = e.clientX - rect.left;
        progress = Math.max(
          0,
          Math.min(1, relativeX / Math.max(1, rect.width))
        );
      } else {
        progress = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
      }

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
            // ignore seek restrictions
          }
        } else {
          pendingTimeRef.current = targetTime;
        }
      });
    };

    // Mobile / Resize logic
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

  const selectedLabels = selectedCategories.map((id) => {
    const item = HERO_CATEGORIES.find((c) => c.id === id);
    return item ? item.label : id;
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl overflow-hidden border border-border/80 bg-card/60 dark:bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300"
    >
      {/* Background ambient radial glow (Theme-sensitive) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 dark:bg-primary/20 blur-[90px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 dark:bg-sky-500/10 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* Top Header Row of the Hero Unit */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <span>Mainframe Hero Engine</span>
            <span className="hidden sm:inline-block text-muted-foreground font-normal">
              |
            </span>
            <span className="hidden sm:inline-block text-[10px] text-muted-foreground font-mono font-medium">
              360° Turntable Active
            </span>
          </span>
        </div>

        <Badge
          variant="outline"
          className="text-[10px] font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1.5"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          100% LOCAL PRIVACY
        </Badge>
      </div>

      {/* 2-Column Responsive Layout inside Hero */}
      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive 3D Turntable Video Monitor */}
        <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col gap-3">
          <div
            onMouseEnter={() => setIsHoveringTurntable(true)}
            onMouseLeave={() => setIsHoveringTurntable(false)}
            className="relative w-full aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden border border-border/80 bg-black/80 shadow-2xl group cursor-ew-resize"
          >
            {/* The 360° Scrubbing Turntable Video */}
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover object-center filter contrast-105"
              src={DEFAULT_VIDEO_SRC}
            />

            {/* Subtle high-tech scanlines & HUD overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Corner Bracket Accents (High-Tech Mainframe Feel) */}
            <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-primary/70 pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-primary/70 pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-primary/70 pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-primary/70 pointer-events-none" />

            {/* Interactive Indicator Badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-white/90 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <span className="flex items-center gap-1.5">
                <Rotate3d
                  className="w-3.5 h-3.5 text-emerald-400 animate-spin"
                  style={{ animationDuration: '6s' }}
                />
                <span>Move mouse horizontally to scrub 360°</span>
              </span>
              <span className="text-emerald-400 font-bold">WASM</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3 text-primary" />
              Real-time hardware canvas
            </span>
            <span className="font-mono text-[10px]">0 Remote Latency</span>
          </div>
        </div>

        {/* Right Column: Multi-Select Category Pills & Dynamic Action Dock */}
        <div className="lg:col-span-7 order-1 lg:order-2 space-y-4 text-left">
          {/* Category Pills Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-primary" />
              Select tool categories to launch:
            </span>
            <button
              type="button"
              onClick={() => {
                if (selectedCategories.length === HERO_CATEGORIES.length) {
                  setSelectedCategories([]);
                } else {
                  setSelectedCategories(HERO_CATEGORIES.map((c) => c.id));
                }
              }}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              {selectedCategories.length === HERO_CATEGORIES.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          {/* Interactive Multi-Select Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {HERO_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <motion.button
                  key={category.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCategory(category.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 select-none border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 border-primary scale-[1.02]'
                      : 'bg-muted/50 hover:bg-muted text-foreground border-border/80 hover:border-primary/40'
                  }`}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0, width: 0 }}
                        animate={{ scale: 1, opacity: 1, width: 'auto' }}
                        exit={{ scale: 0, opacity: 0, width: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 350,
                          damping: 22,
                        }}
                        className="inline-flex items-center overflow-hidden"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span>{category.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Contingent Dynamic Action Dock */}
          <div className="min-h-[76px] pt-1">
            <AnimatePresence mode="wait">
              {selectedCategories.length === 0 ? (
                <motion.div
                  key="empty-hint"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="p-3.5 rounded-2xl bg-muted/40 border border-dashed border-border/80 flex items-center justify-between text-xs text-muted-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Click one or more categories above to launch instant browser
                    tools.
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setSelectedCategories(HERO_CATEGORIES.map((c) => c.id))
                    }
                    className="text-[11px] font-bold text-primary cursor-pointer"
                  >
                    Select All
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="action-dock"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 25 }}
                  className="rounded-2xl p-4 bg-muted/60 dark:bg-zinc-900/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
                >
                  {/* Left feedback text */}
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        Ready to launch {selectedCategories.length} tool{' '}
                        {selectedCategories.length > 1 ? 'suites' : 'suite'}:
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        [{selectedLabels.join(', ')}]
                      </p>
                    </div>
                  </div>

                  {/* Right Action Button */}
                  <Button
                    onClick={handleLaunch}
                    className="h-10 px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer shrink-0"
                  >
                    <span>Launch Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Launching Feedback Toast */}
            {hasLaunched && selectedCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  WASM workers loaded for {selectedCategories.length}{' '}
                  categories. Launching tools...
                </span>
                <button
                  type="button"
                  onClick={() => setHasLaunched(false)}
                  className="font-bold underline hover:opacity-75 cursor-pointer ml-3 text-[11px]"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </div>

          {/* Quick Shortcuts to Primary Tools */}
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground/80">
              Direct Launch:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/tools/pdf-editor"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <FileText className="w-3 h-3 text-red-500" /> PDF Editor
              </Link>
              <span>•</span>
              <Link
                href="/tools/video-compressor"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <Video className="w-3 h-3 text-blue-500" /> Video Compressor
              </Link>
              <span>•</span>
              <Link
                href="/tools/audio-converter"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <Music className="w-3 h-3 text-amber-500" /> Audio Converter
              </Link>
              <span>•</span>
              <Link
                href="/tools/image-to-text"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3 text-purple-500" /> OCR Vision
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainframeHeroUnit;
