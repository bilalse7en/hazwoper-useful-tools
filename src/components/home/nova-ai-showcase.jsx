'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  ArrowRight,
  Code2,
  Lock,
  Play,
  RotateCcw,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NOVA_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4';

/**
 * Reveal animation helper with configurable delay
 */
function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function NovaAiShowcase() {
  const router = useRouter();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [activeModal, setActiveModal] = useState(null); // 'demo' | 'specs' | null
  const [demoState, setDemoState] = useState({
    running: false,
    progress: 0,
    completed: false,
  });

  // Native smooth autoplay and scroll-responsive speed
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});

    // Scroll scrubbing subtle parallax
    const handleScroll = () => {
      if (!containerRef.current || !video.duration) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Only adjust if visible in viewport
      if (rect.top < windowH && rect.bottom > 0) {
        const visibleProgress = Math.max(
          0,
          Math.min(1, (windowH - rect.top) / (windowH + rect.height))
        );
        // Gently modulate playback rate or frame alignment for cinematic response
        video.playbackRate = 0.8 + visibleProgress * 0.4;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Demo simulation trigger
  const runLocalWasmDemo = () => {
    setActiveModal('demo');
    setDemoState({ running: true, progress: 0, completed: false });

    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        clearInterval(interval);
        setDemoState({ running: false, progress: 100, completed: true });
      } else {
        setDemoState((prev) => ({ ...prev, progress: p }));
      }
    }, 180);
  };

  const capabilities = [
    {
      num: '01',
      title: 'Local-First WASM Architecture',
      body: 'Zero remote server uploads. Heavy PDF parsing, media transcode, and Whisper models run strictly inside browser memory.',
    },
    {
      num: '02',
      title: 'Multi-Format Content Intelligence',
      body: 'Extract structured tables, clean dirty HTML from Word, strip watermarks, and normalize LMS curriculum in seconds.',
    },
    {
      num: '03',
      title: 'AI Course & Assessment Pipeline',
      body: 'Automatically structure lesson hierarchies, generate bloom-compliant knowledge checks, and export verified SCORM schemas.',
    },
  ];

  const services = [
    '/ CLIENT-SIDE WASM ENGINES',
    '/ DOCUMENT & MEDIA INTELLIGENCE',
    '/ ENTERPRISE COMPLIANCE AUTOMATION',
  ];

  return (
    <section
      ref={containerRef}
      id="nova-ai"
      className="relative w-full min-h-screen py-20 lg:py-28 overflow-hidden bg-background border-b border-border transition-colors duration-300"
    >
      {/* Background Cinematic Video Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src={NOVA_VIDEO_URL}
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-center opacity-30 dark:opacity-40 filter saturate-120"
        />

        {/* Dynamic theme-aware overlays for 100% text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_80%)]" />
      </div>

      {/* Main Content Wrapper */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col justify-between min-h-[85vh] space-y-16">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Left Service List */}
          <div className="flex flex-col gap-2">
            {services.map((service, i) => (
              <Reveal key={service} delay={100 + i * 100}>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-primary font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{service}</span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Right Brand Statement */}
          <Reveal delay={250} className="max-w-md md:text-right">
            <p className="text-base sm:text-lg text-foreground/90 font-medium leading-relaxed">
              We design client-side automation that brings speed, precision, and
              absolute privacy to your daily productivity workflow.
            </p>
          </Reveal>
        </div>

        {/* Centerpiece Hero Grid */}
        <div className="grid lg:grid-cols-12 gap-12 items-end pt-8">
          {/* Left Hero Title */}
          <div className="lg:col-span-7 space-y-6">
            <Reveal delay={150}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-md font-mono text-[11px] uppercase tracking-wider text-primary font-bold">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>NOVA_AI — Today AI Aligns With Bold Dreams</span>
              </div>
            </Reveal>

            <Reveal delay={250}>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.05]">
                Fast. Private.
                <br />
                <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-cyan-400">
                  Fully Automated.
                </span>
              </h2>
            </Reveal>

            <Reveal delay={350}>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl font-normal leading-relaxed">
                From PDF editing and video compression to local OCR extraction
                and automated course curriculum, All Useful Tools handles heavy
                computational workloads right in your browser.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={450}>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={runLocalWasmDemo}
                  className="h-12 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 cursor-pointer flex items-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run WASM Benchmark</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 px-6 rounded-xl font-bold border-border bg-card/60 hover:bg-card text-foreground cursor-pointer text-sm"
                >
                  <Link href="/tools/ai-course-creator">
                    <span>Explore AI Studio</span>
                    <ChevronRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Right Architecture Glass Showcase */}
          <div className="lg:col-span-5">
            <Reveal delay={400}>
              <div className="rounded-3xl border border-border/80 bg-card/70 dark:bg-card/40 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-wider text-foreground">
                      Core Pipeline Capabilities
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-emerald-500 border-emerald-500/30"
                  >
                    ONLINE • WASM
                  </Badge>
                </div>

                <div className="space-y-4">
                  {capabilities.map((item, idx) => (
                    <div
                      key={item.num}
                      className="group p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 border border-border/50 hover:border-primary/40 transition-all space-y-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-black text-primary">
                          {item.num}
                        </span>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    Zero server telemetry
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModal('specs')}
                    className="font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View System Specs
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Interactive Modal (Benchmark Demo / Specs) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {activeModal === 'demo' ? (
                <>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">
                      Local WASM Engine Benchmark
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Testing multi-threaded WebAssembly execution, local memory
                      buffers, and SIMD pipeline speed.
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span>Pipeline Compilation:</span>
                      <span className="font-bold text-primary">
                        {demoState.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        style={{ width: `${demoState.progress}%` }}
                        transition={{ ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Log stream */}
                  <div className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-emerald-400 space-y-1">
                    <div>[READY] Browser WebAssembly threads: active (4/4)</div>
                    <div>[BENCHMARK] FFmpeg WASM buffer: initialized</div>
                    {demoState.progress >= 50 && (
                      <div>[ALLOC] 64MB zero-copy Float32 buffer allocated</div>
                    )}
                    {demoState.progress >= 100 && (
                      <div className="text-white font-bold">
                        [SUCCESS] Complete in 38ms. 0 bytes leaked remotely.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setActiveModal(null)}
                      className="rounded-xl text-xs"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => router.push('/tools')}
                      className="rounded-xl text-xs font-bold"
                    >
                      Open Full Workspace
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">
                      All Useful Tools Architecture Specifications
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Built with Next.js 16.2.7 App Router, React 19, and native
                      WebAssembly.
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-muted/50 flex justify-between">
                      <span className="text-muted-foreground">
                        Data Retention:
                      </span>
                      <span className="font-bold text-foreground">
                        0 ms (Ephemeral memory only)
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 flex justify-between">
                      <span className="text-muted-foreground">OCR Engine:</span>
                      <span className="font-bold text-foreground">
                        Tesseract.js WASM + Web Worker
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 flex justify-between">
                      <span className="text-muted-foreground">
                        Video Transcode:
                      </span>
                      <span className="font-bold text-foreground">
                        @ffmpeg/ffmpeg WASM SharedArrayBuffer
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 flex justify-between">
                      <span className="text-muted-foreground">
                        LMS Normalizer:
                      </span>
                      <span className="font-bold text-foreground">
                        SCORM / 14-Point Validation Engine
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => setActiveModal(null)}
                      className="rounded-xl text-xs font-bold"
                    >
                      Done
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default NovaAiShowcase;
