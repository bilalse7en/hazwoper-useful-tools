'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4';

const HEADING_WORDS = [
  'WE',
  'ENGINEER',
  'PRIVATE',
  'BROWSER-BASED',
  'AUTOMATION',
  'SYSTEMS.',
];

/**
 * AutomationSystemsBanner Component
 * High-impact cinematic video section featuring staggered word typography,
 * interactive media playback controls, and client-side automation benchmarks.
 */
export function AutomationSystemsBanner() {
  const [animKey, setAnimKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  // Guarantee smooth autoplay
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleAudio = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleReplay = () => {
    setAnimKey((prev) => prev + 1);
  };

  return (
    <section className="relative w-full min-h-[90vh] py-24 sm:py-32 overflow-hidden bg-black text-white selection:bg-white selection:text-black border-y border-border/40">
      {/* Background cinematic looping video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          className="w-full h-full object-cover object-center filter brightness-75 contrast-110"
        />

        {/* Cinematic dark gradients for maximum contrast and theme compatibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_95%)]" />
      </div>

      {/* Floating Control HUD (Top of Section) */}
      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mb-12 sm:mb-16">
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-white/90">
              All Useful Tools • Automation Systems
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all cursor-pointer"
              title="Replay word reveal animation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Replay</span>
            </button>

            <button
              type="button"
              onClick={toggleVideoPlayback}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all cursor-pointer"
              title={
                isPlaying ? 'Pause background video' : 'Play background video'
              }
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleAudio}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all cursor-pointer"
              title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col justify-center space-y-12">
        {/* Staggered Word Reveal Typography */}
        <div key={animKey} className="max-w-5xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs tracking-wider uppercase font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Next-Generation Productivity Infrastructure</span>
          </motion.div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[1.04] flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 select-none">
            {HEADING_WORDS.map((word, i) => (
              <motion.span
                key={`${animKey}-${word}-${i}`}
                initial={{ opacity: 0, y: 35, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.6,
                  delay: 0.15 + i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={
                  word === 'SYSTEMS.' || word === 'AUTOMATION'
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500'
                    : 'text-white'
                }
              >
                {word}
              </motion.span>
            ))}
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-base sm:text-xl text-white/80 max-w-3xl leading-relaxed font-light"
          >
            High-performance client-side WebAssembly pipelines for documents,
            video compression, OCR vision, and AI generation. No server
            subscriptions, zero queues, and 100% private processing.
          </motion.p>
        </div>

        {/* Real Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6"
        >
          {[
            {
              metric: '0 Bytes',
              label: 'Remote Server Data Leakage',
              desc: '100% Local In-Browser Processing',
            },
            {
              metric: '20+',
              label: 'Specialized Utilities',
              desc: 'PDF, Audio, Video, OCR & AI Studio',
            },
            {
              metric: '<50ms',
              label: 'Initialization Speed',
              desc: 'Instant WebAssembly Module Spinup',
            },
            {
              metric: '100%',
              label: 'Private & Free Forever',
              desc: 'No Sign-in Required for Core Utilities',
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all space-y-1.5"
            >
              <p className="text-2xl sm:text-4xl font-black text-white tracking-tight font-mono">
                {stat.metric}
              </p>
              <p className="text-xs sm:text-sm font-bold text-white/90">
                {stat.label}
              </p>
              <p className="text-[11px] text-white/60">{stat.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Action Button Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15 }}
          className="flex flex-wrap items-center gap-4 pt-4"
        >
          <Button
            size="lg"
            asChild
            className="h-12 px-7 rounded-xl font-bold bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10 cursor-pointer text-sm"
          >
            <Link href="/tools">
              <span>Explore All Automation Tools</span>
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 px-6 rounded-xl font-bold border-white/20 bg-white/5 hover:bg-white/15 text-white backdrop-blur-md cursor-pointer text-sm"
          >
            <Link href="/tools/ai-course-creator">
              <Terminal className="mr-2 w-4 h-4 text-emerald-400" />
              <span>Launch AI Prompt Studio</span>
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default AutomationSystemsBanner;
