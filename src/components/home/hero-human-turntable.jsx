'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Rotate3d } from 'lucide-react';

const HUMAN_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4';

/**
 * HeroHumanTurntable
 * Left hero column component: ONLY the 3D rotating human model.
 * Zero text clutter on top.
 * Fully theme-consistent (Light, Dark, Nebula).
 * Desktop cursor movement scrubs the human 360° smoothly.
 */
export function HeroHumanTurntable() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const rafIdRef = useRef(null);
  const pendingTimeRef = useRef(null);
  const isSeekingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      setIsReady(true);
      if (video.currentTime === 0) {
        try {
          video.currentTime = 0.05;
        } catch {
          // ignore seek restrictions
        }
      }
    };

    video.addEventListener('loadeddata', handleLoaded);
    if (video.readyState >= 2) {
      handleLoaded();
    }

    const handleSeeked = () => {
      isSeekingRef.current = false;
      if (pendingTimeRef.current !== null) {
        const nextTime = pendingTimeRef.current;
        pendingTimeRef.current = null;
        isSeekingRef.current = true;
        try {
          video.currentTime = nextTime;
        } catch {
          // ignore
        }
      }
    };

    video.addEventListener('seeked', handleSeeked);

    let isVisible = true;
    let observer = null;
    if (containerRef.current && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
      });
      observer.observe(containerRef.current);
    }

    // Desktop mouse tracking across the entire hero / window
    const handleMouseMove = (e) => {
      if (!isVisible) return;
      if (window.innerWidth < 1024) return;
      if (!video.duration || Number.isNaN(video.duration)) return;

      const rect = containerRef.current?.getBoundingClientRect();
      let progress = 0.5;

      if (rect) {
        // Track relative position with generous padding for natural cursor control
        const minX = rect.left - 150;
        const maxX = rect.right + 150;
        progress = Math.max(0, Math.min(1, (e.clientX - minX) / (maxX - minX)));
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
            // ignore
          }
        } else {
          pendingTimeRef.current = targetTime;
        }
      });
    };

    // Mobile fallback: loop autoplay
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

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('seeked', handleSeeked);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] sm:h-[460px] lg:h-[540px] rounded-3xl sm:rounded-[36px] overflow-hidden border border-border/80 bg-card/60 dark:bg-card/40 backdrop-blur-2xl shadow-2xl flex items-center justify-center cursor-ew-resize group select-none transition-all duration-300"
    >
      {/* Dynamic theme ambient backdrops */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-emerald-500/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/15 dark:bg-primary/25 rounded-full blur-[90px] pointer-events-none" />

      {/* The 3D Human Model Video — Clean, Pure Human View */}
      <video
        ref={videoRef}
        src={HUMAN_VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        className={`w-full h-full object-cover object-center filter contrast-[1.08] saturate-[1.1] transition-opacity duration-500 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Subtle edge vignetting to blend seamlessly with Light, Dark, and Nebula themes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,var(--background)_100%)] pointer-events-none opacity-60 dark:opacity-80" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/40 to-transparent pointer-events-none" />

      {/* High-tech minimalist corner reticles */}
      <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-primary/60 pointer-events-none" />
      <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-primary/60 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-primary/60 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-primary/60 pointer-events-none" />

      {/* Minimal subtle floating status badge (Bottom) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 dark:bg-black/60 backdrop-blur-md border border-border/60 text-[10px] font-mono text-muted-foreground shadow-sm">
        <Rotate3d
          className="w-3.5 h-3.5 text-emerald-500 animate-spin"
          style={{ animationDuration: '8s' }}
        />
        <span>Scrub 360° on cursor</span>
      </div>
    </div>
  );
}

export default HeroHumanTurntable;
