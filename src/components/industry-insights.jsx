'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ShieldCheck,
  Zap,
  Globe,
  FileText,
  Activity,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { blogPosts as staticBlogs } from '@/lib/blog-data';

// NOVA AI Cinematic Spiral Animation
const NOVA_ANIMATION_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4';

const HEADING_WORDS = [
  'ADVANCING',
  'PRODUCTIVITY',
  'STANDARDS',
  'THROUGH',
  'AUTOMATION.',
];

export function IndustryInsights() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  const [blogs, setBlogs] = useState(staticBlogs.slice(0, 6));
  const [loading, setLoading] = useState(false);

  // Fetch blogs from Supabase or fallback to staticBlogs
  const fetchBlogs = useCallback(async () => {
    const isPlaceholder =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('sb_') ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (isPlaceholder) {
      setBlogs(staticBlogs.slice(0, 6));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data && data.length > 0) {
        setBlogs(data);
      } else {
        setBlogs(staticBlogs.slice(0, 6));
      }
    } catch {
      setBlogs(staticBlogs.slice(0, 6));
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Scroll-bound video animation engine with seeking guards
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    video.autoplay = false;
    video.pause();

    let lastSeekTime = 0;

    const handleScroll = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      if (video.seeking) return; // Guard against range request flooding

      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Only calculate if section is in viewport
      if (rect.bottom < 0 || rect.top > windowH) return;

      const totalDist = rect.height + windowH;
      const currentDist = windowH - rect.top;
      const progress = Math.max(0, Math.min(1, currentDist / totalDist));

      const now = performance.now();
      if (now - lastSeekTime < 80) return; // Throttled to prevent flooding

      const targetTime = progress * video.duration;
      if (Math.abs(video.currentTime - targetTime) > 0.08) {
        lastSeekTime = now;
        try {
          video.currentTime = targetTime;
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-background border-y border-border transition-colors duration-300"
    >
      {/* FROZEN / STICKY BACKGROUND VIDEO (Zero blur, Crystal-Clear Animation Visible Behind Glassy Cards) */}
      <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none select-none z-0">
        <video
          ref={videoRef}
          src={NOVA_ANIMATION_VIDEO_URL}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center opacity-85 dark:opacity-90"
          style={{
            imageRendering: 'high-quality',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* Subtle edge gradients */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent opacity-85" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent opacity-85" />
        <div className="absolute inset-0 bg-white/[0.02] dark:bg-black/25 pointer-events-none" />
      </div>

      {/* FOREGROUND CONTENT (SCROLLS OVER FROZEN BACKGROUND - PARENT GLASS REMOVED!) */}
      <div className="relative z-10 -mt-[100vh] py-20 sm:py-28 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Direct Layout (No enclosing parent glass border box!) */}
        <div className="space-y-12">
          {/* Main Grid: Typography + Utility Standards + Metrics Grid */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              {/* Word Reveal Typography */}
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.08] flex flex-wrap gap-x-2.5 sm:gap-x-3.5 gap-y-1 select-none drop-shadow-md">
                  {HEADING_WORDS.map((word, i) => (
                    <motion.span
                      key={`${word}-${i}`}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: 0.05 + i * 0.07,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={
                        word === 'AUTOMATION.' || word === 'PRODUCTIVITY'
                          ? 'text-primary bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 font-black'
                          : 'text-foreground'
                      }
                    >
                      {word}
                    </motion.span>
                  ))}
                </h2>

                <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed pt-2 drop-shadow-xs">
                  In today&apos;s fast-moving digital world, speed and accuracy
                  in file conversion, document management, and media editing are
                  essential. Our platform is engineered to bridge the gap
                  between complex workflows and effortless, lightning-fast
                  browser execution.
                </p>
              </div>

              {/* FULLY GLASSY CARDS (NO BLUR, VIDEO RUNS CRYSTAL CLEAR BEHIND) */}
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 p-5 rounded-3xl bg-white/25 dark:bg-black/50 border border-white/35 dark:border-white/15 hover:bg-white/35 hover:dark:bg-black/65 transition-all shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-foreground">
                      Universal Standards
                    </h3>
                  </div>
                  <p className="text-xs text-foreground/90 dark:text-white/80 leading-relaxed font-normal">
                    Every tool follows strict web and media specifications,
                    ensuring lossless output and seamless compatibility across
                    all browsers, operating systems, and devices.
                  </p>
                </div>
                <div className="space-y-2 p-5 rounded-3xl bg-white/25 dark:bg-black/50 border border-white/35 dark:border-white/15 hover:bg-white/35 hover:dark:bg-black/65 transition-all shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-sm text-foreground">
                      Absolute Data Privacy
                    </h3>
                  </div>
                  <p className="text-xs text-foreground/90 dark:text-white/80 leading-relaxed font-normal">
                    Direct browser-isolated execution ensures your confidential
                    documents, videos, and media never leave your machine. Zero
                    remote storage, zero tracking, and zero leaks.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white/25 dark:bg-black/50 border border-white/35 dark:border-white/15 flex items-start gap-3.5 shadow-xl">
                <Activity className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider mb-1 text-foreground">
                    High-Throughput Processing
                  </h4>
                  <p className="text-xs text-foreground/90 dark:text-white/80 leading-relaxed font-normal">
                    Multi-threaded parallel pipelines execute media conversions,
                    document parsing, and high-precision OCR operations with
                    sub-second response times.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Metric Grid (NO BLUR, VIDEO RUNS CLEARLY THROUGH) */}
            <div className="relative">
              <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 sm:space-y-4">
                  <div className="aspect-[4/5] bg-white/25 dark:bg-black/50 rounded-3xl border border-white/35 dark:border-white/15 p-5 sm:p-6 flex flex-col justify-end hover:bg-white/35 hover:dark:bg-black/65 transition-all shadow-xl">
                    <Zap className="w-7 h-7 text-emerald-400 mb-2.5" />
                    <h4 className="font-black text-base sm:text-lg mb-1 text-foreground">
                      Instant Speed
                    </h4>
                    <p className="text-[11px] sm:text-xs text-foreground/90 dark:text-white/80 leading-relaxed font-medium">
                      Immediate client execution delivers lightning-fast file
                      conversion without cloud wait times or queues.
                    </p>
                  </div>
                  <div className="aspect-square bg-white/25 dark:bg-black/50 rounded-3xl border border-white/35 dark:border-white/15 p-5 sm:p-6 flex flex-col justify-end hover:bg-white/35 hover:dark:bg-black/65 transition-all shadow-xl">
                    <Globe className="w-7 h-7 text-cyan-400 mb-2.5" />
                    <h4 className="font-black text-base sm:text-lg mb-1 text-foreground">
                      Global UI
                    </h4>
                    <p className="text-[11px] sm:text-xs text-foreground/90 dark:text-white/80 leading-relaxed font-medium">
                      Clean, responsive interface standardized for modern
                      creative and technical workflows.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8">
                  <div className="aspect-square bg-white/25 dark:bg-black/50 rounded-3xl border border-white/35 dark:border-white/15 p-5 sm:p-6 flex flex-col justify-end hover:bg-white/35 hover:dark:bg-black/65 transition-all shadow-xl">
                    <BookOpen className="w-7 h-7 text-amber-400 mb-2.5" />
                    <h4 className="font-black text-base sm:text-lg mb-1 text-foreground">
                      Smart Engine
                    </h4>
                    <p className="text-[11px] sm:text-xs text-foreground/90 dark:text-white/80 leading-relaxed font-medium">
                      Intelligent structure recognition preserves formatting,
                      typography, and visual fidelity.
                    </p>
                  </div>
                  <div className="aspect-[4/5] bg-white/25 dark:bg-black/50 rounded-3xl border border-white/35 dark:border-white/15 p-5 sm:p-6 flex flex-col justify-end hover:bg-white/35 hover:dark:bg-black/65 transition-all shadow-xl">
                    <ShieldCheck className="w-7 h-7 text-emerald-400 mb-2.5" />
                    <h4 className="font-black text-base sm:text-lg mb-1 text-foreground">
                      Privacy First
                    </h4>
                    <p className="text-[11px] sm:text-xs text-foreground/90 dark:text-white/80 leading-relaxed font-medium">
                      Zero tracking, zero cloud uploads, and zero data
                      harvesting. Your files stay strictly on your device.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High Value Content Block */}
          <div className="mt-8 max-w-4xl mx-auto space-y-4 border-t border-white/15 pt-8">
            <h3 className="text-xl sm:text-2xl font-black text-center text-foreground drop-shadow-sm">
              The Role of All-in-One Online Utilities in Modern Workflows
            </h3>
            <div className="prose prose-invert max-w-none text-foreground/85 dark:text-white/80 font-medium text-xs sm:text-sm leading-relaxed columns-1 md:columns-2 gap-8">
              <p>
                Modern digital tasks require more than just separate,
                disconnected websites; they demand a cohesive, unified workspace
                where you can edit PDFs, convert audio and video, extract text
                via OCR, and clean HTML in one single place. Our utility
                platform is designed to simplify high-friction workflows,
                providing professionals with the speed and reliability needed to
                get work done efficiently.
              </p>
              <p>
                By focusing on clean outputs and client-side processing, we
                ensure that every file you convert or generate remains 100%
                private to your device. This reduces bandwidth costs, eliminates
                upload wait times, and provides instant results. Our commitment
                to performance reflects the needs of students, creators, and
                business professionals alike.
              </p>
              <p>
                Furthermore, the architectural resilience of our platform allows
                for continuous updates and expansion. As new formats and browser
                technologies emerge, our utility engine evolves to ensure that
                your workflow remains smooth, frictionless, and lightning-fast.
              </p>
            </div>
          </div>

          {/* MERGED: PROFESSIONAL EDITORIAL (UNDER THE SAME SCROLL-DRIVEN FROZEN BACKGROUND) */}
          <div
            id="blog"
            className="mt-12 sm:mt-16 pt-10 sm:pt-14 border-t border-white/20 dark:border-white/10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="px-3 py-1 rounded-full border-white/30 dark:border-white/20 bg-white/20 dark:bg-black/40 text-foreground text-[10px] font-black uppercase tracking-widest"
                >
                  <BookOpen className="w-3 h-3 mr-1.5 text-cyan-400" />
                  Neural Editorial
                </Badge>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
                  Professional Editorial
                </h3>
                <p className="text-foreground/85 dark:text-white/80 font-medium text-xs sm:text-sm max-w-xl leading-relaxed">
                  Expert insights on document workflows, media processing, and
                  digital productivity tools.
                </p>
              </div>

              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/25 hover:bg-white/35 dark:bg-black/50 dark:hover:bg-black/70 border border-white/35 dark:border-white/20 text-foreground text-xs font-bold transition-all shadow-md group shrink-0"
              >
                <span>Explore All Insights</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Glassy Editorial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {blogs.map((post, index) => (
                <div
                  key={post.slug || index}
                  className="group flex flex-col h-full bg-white/25 dark:bg-black/50 border border-white/35 dark:border-white/15 hover:border-cyan-400/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.01]"
                >
                  {/* Visual Header */}
                  <div className="h-40 w-full bg-gradient-to-br from-cyan-500/15 via-primary/10 to-transparent relative overflow-hidden flex items-center justify-center border-b border-white/15">
                    <Sparkles className="w-10 h-10 text-cyan-400/40 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/30 dark:bg-black/60 border border-white/25 text-foreground">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-foreground/75 dark:text-white/70 mb-2.5">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {post.readTime || post.read_time || '8 min read'}
                        </span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>

                      <h4 className="text-base sm:text-lg font-black mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug text-foreground">
                        {post.title}
                      </h4>

                      <p className="text-xs text-foreground/85 dark:text-white/80 font-normal mb-5 line-clamp-3 leading-relaxed">
                        {post.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/15 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                        {post.author}
                      </span>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default IndustryInsights;
