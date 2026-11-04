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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Typewriter effect hook
 */
function useTypewriter(text, speed = 35, startDelay = 350) {
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
  },
  {
    id: 'video',
    label: '🎬 Video & GIF',
    desc: 'WASM Compressor, Converter',
    slug: 'video-compressor',
  },
  {
    id: 'audio',
    label: '🎵 Audio & Voice',
    desc: 'Lossless MP3/WAV, Speed',
    slug: 'audio-converter',
  },
  {
    id: 'ocr',
    label: '👁️ OCR & Vision',
    desc: 'Image to Text, BG Remover',
    slug: 'image-to-text',
  },
  {
    id: 'ai',
    label: '⚡ AI Assistant',
    desc: 'Course Creator, Prompt Studio',
    slug: 'ai-course-creator',
  },
];

const DEFAULT_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4';

/**
 * MainframeHeroBanner Component
 * Full-bleed Hero section matching the exact AI Studio reference design:
 * - Full-height 3D human model integrated directly on the right (NO card/frame).
 * - Real-time 360° mouse scrubbing turntable cursor tracking.
 * - Dynamic typewriter headline, multi-select category pills, and instant launch dock.
 * - 100% theme consistent (Light, Dark, Nebula).
 */
export function MainframeHeroBanner({ user }) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [hasLaunched, setHasLaunched] = useState(false);

  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const rafIdRef = useRef(null);
  const pendingTimeRef = useRef(null);
  const isSeekingRef = useRef(false);

  const isGuest = !user || user.isGuest;

  const headlineTargetText = isGuest
    ? 'Instant, Private\nContent Utilities.'
    : `Welcome back, ${user?.name?.split(' ')[0] || 'Architect'}.\nYour workspace is ready.`;

  const { displayed, done } = useTypewriter(headlineTargetText, 35, 300);

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleLaunch = () => {
    if (selectedCategories.length === 0) return;
    setHasLaunched(true);

    if (selectedCategories.length === 1) {
      const match = HERO_CATEGORIES.find((c) => c.id === selectedCategories[0]);
      if (match?.slug) {
        router.push(`/tools/${match.slug}`);
        return;
      }
    }

    const directory =
      document.getElementById('free-tools') ||
      document.getElementById('generators');
    if (directory) {
      directory.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/tools');
    }
  };

  // 360° Cursor Face Rotation: ONLY on active mouse hover inside Hero (ZERO rotation on scroll)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const video = videoRef.current;
    const heroElement = heroRef.current;
    if (!video || !heroElement) return;

    let lastSeekTimestamp = 0;
    const MIN_SEEK_GAP_MS = 50;
    let isScrolling = false;
    let scrollTimeout = null;

    // Detect user scrolling and strictly freeze hero rotation during scroll
    const onScroll = () => {
      isScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 200);
    };

    const handleMouseMove = (e) => {
      // STRICT RULE: Zero face rotation during scrolling
      if (isScrolling) return;
      if (window.innerWidth < 1024) return;
      if (!video.duration || Number.isNaN(video.duration)) return;

      const rect = heroElement.getBoundingClientRect();
      // Ensure mouse is strictly hovering inside visible hero element
      if (
        e.clientY < rect.top ||
        e.clientY > rect.bottom ||
        e.clientX < rect.left ||
        e.clientX > rect.right
      ) {
        return;
      }

      // Turntable face rotation: scrubs video time directly to cursor X position on hover only
      const progress = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const targetTime = progress * video.duration;

      const now = performance.now();
      if (now - lastSeekTimestamp < MIN_SEEK_GAP_MS || video.seeking) {
        return;
      }

      if (Math.abs(video.currentTime - targetTime) > 0.04) {
        lastSeekTimestamp = now;
        try {
          video.currentTime = targetTime;
        } catch {
          // ignore
        }
      }
    };

    // Mobile fallback: gentle autoplay loop
    if (window.innerWidth < 1024) {
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {});
    } else {
      video.autoplay = false;
      video.pause();
    }

    // Attach mousemove ONLY to the Hero container itself (not window)
    heroElement.addEventListener('mousemove', handleMouseMove, {
      passive: true,
    });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      heroElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', onScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  const selectedLabels = selectedCategories.map((id) => {
    const item = HERO_CATEGORIES.find((c) => c.id === id);
    return item ? item.label : id;
  });

  return (
    <section
      ref={heroRef}
      className="relative w-full min-h-[92vh] flex items-center overflow-hidden bg-background/85 backdrop-blur-md text-foreground selection:bg-primary/20 selection:text-primary transition-colors duration-300 border-b border-border"
    >
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s step-end infinite; }
      `}</style>

      {/* FULL HERO 3D HUMAN VIDEO LAYER (NO FRAME, SEAMLESS RIGHT-ALIGNED, ONLY HUMAN MOVES) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <video
          ref={videoRef}
          src={DEFAULT_VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center lg:object-right-center filter contrast-[1.05]"
          style={{ imageRendering: 'high-quality', transform: 'translateZ(0)' }}
        />

        {/* Horizontal Gradient Overlay: Guarantees 100% text readability on left while human is fully visible on right */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent pointer-events-none" />
        <div className="lg:hidden absolute inset-0 bg-background/80 pointer-events-none" />

        {/* Ambient Radial Theme Lighting */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* LEFT CONTENT COLUMN OVERLAY */}
      <div className="container relative z-10 mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 max-w-7xl">
        <div className="max-w-2xl lg:max-w-3xl space-y-6">
          {/* Typewriter Headline */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12] sm:leading-[1.08] select-none whitespace-pre-wrap">
              {displayed}
              {!done && (
                <span className="inline-block w-[3px] h-[1em] bg-emerald-500 align-middle ml-1.5 animate-blink" />
              )}
            </h1>
          </motion.div>

          {/* Secondary Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-normal"
          >
            Fast browser-based tools for PDF editing, video compression, audio
            conversion, and OCR extraction. Powered by WebAssembly — your files
            never leave your device.
          </motion.p>

          {/* INTERACTIVE MULTI-SELECT CATEGORY PILLS */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full space-y-3 pt-2"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-emerald-500" />
              <span>Select tool categories to launch:</span>
            </h3>

            {/* Pills Container */}
            <div className="flex flex-wrap items-center gap-2.5">
              {HERO_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <motion.button
                    key={category.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleCategory(category.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 select-none border backdrop-blur-md ${
                      isSelected
                        ? 'bg-foreground text-background shadow-lg shadow-black/10 scale-[1.02] border-foreground'
                        : 'bg-card/70 hover:bg-card text-foreground border-border/80 hover:border-foreground/30'
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

            {/* CONTINGENT DYNAMIC ACTION DOCK */}
            <div className="min-h-[72px] max-w-xl pt-1">
              <AnimatePresence mode="wait">
                {selectedCategories.length === 0 ? (
                  <motion.p
                    key="empty-hint"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 0.75, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-muted-foreground italic flex items-center gap-1.5"
                  >
                    <span>
                      💡 Click one or more categories above to launch instant
                      browser tools.
                    </span>
                  </motion.p>
                ) : (
                  <motion.div
                    key="action-dock"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 25 }}
                    className="backdrop-blur-2xl bg-card/80 dark:bg-zinc-900/80 border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
                  >
                    {/* Left text feedback */}
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-foreground">
                          Ready to launch {selectedCategories.length} tool
                          {selectedCategories.length > 1 ? ' suites' : ' suite'}
                          :
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          [{selectedLabels.join(', ')}]
                        </p>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <button
                      type="button"
                      onClick={handleLaunch}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    >
                      <span>Open Selected Tools</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Feedback toast when launched */}
              {hasLaunched && selectedCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between backdrop-blur-md"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    Initializing WebAssembly workers for{' '}
                    {selectedCategories.length} selected tool suites...
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default MainframeHeroBanner;
