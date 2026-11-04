'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wand2,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { triggerLogin } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NOVA_SCROLL_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4';

/**
 * NovaGlassGenerators
 * Ultra-glassy freeze cards gallery powered by Nova's scroll-scrubbed video engine.
 *
 * - Animate on scroll: NOT autorun video. When scrolling down, video animates frame by frame.
 * - Ultra-glassy freeze cards: Crystal-clear frosted glass surfaces so the video motion
 *   is 100% visible moving directly behind the cards.
 * - 100% User's own content: All 6 real generator tools and access rules.
 */
export function NovaGlassGenerators({
  generatorTools = [],
  hasAccess,
  hasGeneratorAccess,
  isAdmin,
  user,
}) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const rafIdRef = useRef(null);
  const targetTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const [videoReady, setVideoReady] = useState(false);

  // Scroll-Scrubbing Video Engine (Strictly animate on scroll, zero autorun)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const video = videoRef.current;
    if (!video) return;

    video.autoplay = false;
    video.pause();

    const handleLoadedData = () => {
      setVideoReady(true);
      if (video.currentTime === 0) {
        try {
          video.currentTime = 0.001;
        } catch {
          // ignore seek restrictions
        }
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    if (video.readyState >= 2) {
      handleLoadedData();
    }

    const handleSeeked = () => {
      isSeekingRef.current = false;
      if (
        targetTimeRef.current !== null &&
        Math.abs(video.currentTime - targetTimeRef.current) > 0.04
      ) {
        isSeekingRef.current = true;
        try {
          video.currentTime = targetTimeRef.current;
        } catch {
          // ignore
        }
      }
    };

    video.addEventListener('seeked', handleSeeked);

    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section || !video.duration || Number.isNaN(video.duration)) return;

      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Calculate relative scroll progression through section
      const startOffset = windowH;
      const endOffset = -rect.height;
      const totalDistance = startOffset - endOffset;
      const currentPos = startOffset - rect.top;

      const scrollProgress = Math.max(
        0,
        Math.min(1, currentPos / totalDistance)
      );
      const targetTime = scrollProgress * Math.max(0.1, video.duration - 0.05);
      targetTimeRef.current = targetTime;

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
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="generators"
      className="relative py-20 sm:py-28 overflow-hidden border-b border-border bg-background transition-colors duration-300"
    >
      {/* VIVID BACKGROUND NOVA VIDEO (Vividly visible behind frosted glass cards) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <video
          ref={videoRef}
          src={NOVA_SCROLL_VIDEO_URL}
          muted
          playsInline
          preload="auto"
          className={`w-full h-full object-cover object-center filter saturate-140 contrast-115 transition-opacity duration-700 ${
            videoReady ? 'opacity-70 dark:opacity-80' : 'opacity-0'
          }`}
        />

        {/* Ultra-subtle boundary blend gradients (Center is 100% crystal clear) */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-black/15 dark:bg-black/30 pointer-events-none" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* ULTRA-FROSTED GLASS PARENT ENCLOSURE */}
        <div className="rounded-[36px] sm:rounded-[44px] border border-white/20 dark:border-white/15 bg-white/[0.08] dark:bg-black/25 backdrop-blur-2xl p-6 sm:p-10 lg:p-12 shadow-[0_16px_48px_rgba(0,0,0,0.25)] space-y-8 sm:space-y-10">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/15 pb-6">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="px-3.5 py-1.5 rounded-full bg-white/15 text-foreground border-white/25 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-fit backdrop-blur-md shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>NOVA_AI — Today AI Aligns With Bold Dreams</span>
              </Badge>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground flex items-center gap-3 drop-shadow-md">
                <Wand2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary shrink-0" />
                <span>Professional Tools</span>
              </h2>

              <p className="text-sm sm:text-base text-foreground/80 dark:text-muted-foreground font-medium max-w-2xl leading-relaxed drop-shadow-sm">
                Advanced AI-powered generators and specialized utilities. Watch
                the scroll-driven neural background evolve through the frozen
                glass gallery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!hasGeneratorAccess && (
                <Badge
                  variant="outline"
                  className="px-3.5 py-1.5 rounded-xl border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Standard Clearance Active</span>
                </Badge>
              )}

              <Badge
                variant="outline"
                className="px-3.5 py-1.5 rounded-xl border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 font-mono backdrop-blur-md"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Scroll Animate Active</span>
              </Badge>
            </div>
          </div>

          {/* FROZEN GLASS CARDS GALLERY (Video motion fully shines through each card) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {generatorTools.map((tool) => {
              const allowed = hasAccess(tool.id, tool.slug);
              const Icon = tool.icon;

              return (
                <div
                  key={tool.id}
                  className={cn(
                    'group relative rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between overflow-hidden',
                    'backdrop-blur-xl bg-white/15 dark:bg-white/[0.06] border-white/25 dark:border-white/15 shadow-xl',
                    'hover:bg-white/25 dark:hover:bg-white/[0.12] hover:border-white/40 hover:shadow-2xl hover:-translate-y-1',
                    !allowed && 'opacity-85'
                  )}
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors backdrop-blur-md border border-white/20',
                          allowed
                            ? 'bg-primary/20 text-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                            : 'bg-white/10 text-muted-foreground'
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {tool.badge && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-foreground border border-white/25 backdrop-blur-md"
                        >
                          {tool.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-2 drop-shadow-sm">
                        <span>{tool.name}</span>
                        {!allowed && (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </h3>
                      <p className="text-xs text-foreground/80 dark:text-muted-foreground font-normal leading-relaxed mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Area */}
                  <div className="pt-5 mt-5 border-t border-white/15 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-foreground/75 dark:text-muted-foreground font-semibold">
                      {allowed ? 'Instant WASM Launch' : 'Requires Clearance'}
                    </span>

                    {allowed ? (
                      <Button
                        size="sm"
                        asChild
                        className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm group-hover:shadow-md transition-all cursor-pointer backdrop-blur-md"
                      >
                        <Link href={`/tools/${tool.slug}`}>
                          <span>Launch</span>
                          <ArrowRight className="w-3 h-3 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerLogin('login')}
                        className="rounded-xl font-bold text-xs h-9 px-4 border-white/30 bg-white/10 hover:bg-white/20 text-foreground cursor-pointer backdrop-blur-md"
                      >
                        <Lock className="w-3 h-3 mr-1.5" />
                        <span>Sign In</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Telemetry Banner inside the Frosted Enclosure */}
          <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/80 dark:text-muted-foreground font-medium">
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>
                Scroll-scrubbed neural canvas actively rendering behind frozen
                glass cards.
              </span>
            </span>
            <span className="font-mono text-[11px] font-semibold text-foreground">
              {generatorTools.length} Production Utilities Active
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NovaGlassGenerators;
