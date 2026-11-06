'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  BookOpen,
  Presentation,
  Wand2,
  Film,
  CheckCircle2,
  FileText,
  Search,
  Database,
  ArrowRight,
  RotateCw,
  Terminal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const PROFESSIONAL_TOOLS = [
  {
    id: 'ai-course',
    title: 'AI Course Creator (PRO)',
    badge: 'Instant WASM Launch',
    category: 'Curriculum Engine',
    description:
      'Enterprise-grade Multi-Agent AI Course Generator with 8K Photorealistic Canvas, Humanized Audio Narration, and automated assessment trees.',
    iconName: 'Sparkles',
    accentColor: '#6366f1',
    route: '/tools/ai-course-creator',
    techSpecs: {
      engine: 'Multi-Agent v4.2',
      runtime: 'WASM WebWorker',
      memory: '48 MB VRAM',
      latency: '2.8ms / token',
    },
  },
  {
    id: 'web-content',
    title: 'Web Content Generator',
    badge: 'Instant WASM Launch',
    category: 'Document Parsing',
    description:
      'Extract course content from DOCX and markdown documents, restructuring raw text into semantic web pages with automated SEO taxonomy.',
    iconName: 'BookOpen',
    accentColor: '#0ea5e9',
    route: '/tools/web-content',
    techSpecs: {
      engine: 'Semantic AST v3',
      runtime: 'Rust / WASM Core',
      memory: '32 MB VRAM',
      latency: '1.4ms parse',
    },
  },
  {
    id: 'slide-generator',
    title: 'Slide Generator',
    badge: 'Instant WASM Launch',
    category: 'Presentation Deck',
    description:
      'Dynamic presentation slide generator with live interactive preview, customizable vector layouts, and zero-comment clean export.',
    iconName: 'Presentation',
    accentColor: '#10b981',
    route: '/tools/ai-course-creator',
    techSpecs: {
      engine: 'Vector SVG Deck 2.0',
      runtime: 'Offscreen Canvas',
      memory: '28 MB VRAM',
      latency: '60 FPS live preview',
    },
  },
  {
    id: 'html-enhancer',
    title: 'HTML Design Enhancer',
    badge: 'Instant WASM Launch',
    category: 'CSS / Tailwind Refactor',
    description:
      '100% free AI HTML design enhancer that converts legacy inline styles to modern Tailwind CSS v4 and injects fluid responsive layouts.',
    iconName: 'Wand2',
    accentColor: '#8b5cf6',
    route: '/tools/html-cleaner',
    techSpecs: {
      engine: 'Tailwind v4 JIT Parser',
      runtime: 'Client-Side AST',
      memory: '18 MB VRAM',
      latency: '0.8ms compile',
    },
  },
  {
    id: 'short-generator',
    title: 'Short Generator 2.0 (AI Cloud)',
    badge: 'Instant WASM Launch',
    category: 'Kinetic Motion Studio',
    description:
      'Third-party cloud AI video shorts studio powered by OpusClip AI, Shotstack Cloud Render, and authentic kinetic motion typography.',
    iconName: 'Film',
    accentColor: '#f59e0b',
    route: '/tools/ai-video-shorts',
    techSpecs: {
      engine: 'Shotstack Cloud v2.4',
      runtime: 'GPU Hardware Transcode',
      memory: '64 MB Shared',
      latency: '4K 60fps render',
    },
  },
  {
    id: 'quiz-builder',
    title: 'Lesson Quiz Builder',
    badge: 'Instant WASM Launch',
    category: 'Adaptive Assessment',
    description:
      'Generate adaptive lesson quizzes, interactive flashcards, multi-tier rubrics, and conceptual distractors from source curricula.',
    iconName: 'CheckCircle2',
    accentColor: '#ec4899',
    route: '/tools/course-json-converter',
    techSpecs: {
      engine: 'Bloom Taxonomy Engine',
      runtime: 'Edge Worker',
      memory: '22 MB VRAM',
      latency: '3.1ms rubric test',
    },
  },
  {
    id: 'pdf-editor',
    title: 'Free PDF Editor',
    badge: 'Instant WASM Launch',
    category: 'Document Engine',
    description:
      'Edit PDFs online: add pages, insert vector stamps, edit text, draw annotations, and cryptographically sign with zero server upload.',
    iconName: 'FileText',
    accentColor: '#06b6d4',
    route: '/tools/pdf-editor',
    techSpecs: {
      engine: 'PDF-lib Native WASM',
      runtime: 'Zero-Telemetry Sandbox',
      memory: '26 MB VRAM',
      latency: 'Immediate In-Memory',
    },
  },
  {
    id: 'stock-finder',
    title: 'AI Adobe Stock Image Finder',
    badge: 'Instant WASM Launch',
    category: 'Visual Asset Search',
    description:
      'Intelligent vector and graphic discovery for training slides. Paste a slide title and AI automatically searches, filters, and ranks color palettes.',
    iconName: 'Search',
    accentColor: '#3b82f6',
    route: '/tools/adobe-stock-search',
    techSpecs: {
      engine: 'CLIP Visual Embeddings',
      runtime: 'Vector Dot Product',
      memory: '40 MB VRAM',
      latency: '1.2ms kNN query',
    },
  },
  {
    id: 'lms-converter',
    title: 'LMS Course JSON Converter',
    badge: 'Instant WASM Launch',
    category: 'Schema Pipeline',
    description:
      'Convert Word (.docx) and PDF course documents into exact LMS-compatible SCORM and xAPI JSON schemas with clean validated HTML trees.',
    iconName: 'Database',
    accentColor: '#14b8a6',
    route: '/tools/course-json-converter',
    techSpecs: {
      engine: 'SCORM 2004 / xAPI v2',
      runtime: 'Strict JSON-Schema Validator',
      memory: '19 MB VRAM',
      latency: '0.5ms schema check',
    },
  },
];

// Pure abstract / kinetic technological video loops (Strictly ZERO human/male/female characters)
const ABSTRACT_CARD_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4',
];

function DynamicIcon({ name, className, color }) {
  switch (name) {
    case 'Sparkles':
      return <Sparkles className={className} style={{ color }} />;
    case 'BookOpen':
      return <BookOpen className={className} style={{ color }} />;
    case 'Presentation':
      return <Presentation className={className} style={{ color }} />;
    case 'Wand2':
      return <Wand2 className={className} style={{ color }} />;
    case 'Film':
      return <Film className={className} style={{ color }} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} style={{ color }} />;
    case 'FileText':
      return <FileText className={className} style={{ color }} />;
    case 'Search':
      return <Search className={className} style={{ color }} />;
    case 'Database':
      return <Database className={className} style={{ color }} />;
    default:
      return <Sparkles className={className} style={{ color }} />;
  }
}

export function FrozenGlassToolsGallery() {
  const router = useRouter();

  const cardCount = PROFESSIONAL_TOOLS.length;
  const cardsRefs = useRef([]);
  const containerRef = useRef(null);
  const frameId = useRef(0);

  // Continuous progress tracking
  const progress = useRef(0);
  const targetProgress = useRef(0);

  // Mouse coordinates for interactive 3D parallax tilt
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const [flippedCards, setFlippedCards] = useState({});
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const activeCardRef = useRef(0);
  const [metrics, setMetrics] = useState({ cardW: 360, cardH: 226 });

  // Mouse move handler for interactive 3D parallax tilt
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const ry =
        (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      mouse.current.targetX = Math.max(-1, Math.min(1, rx));
      mouse.current.targetY = Math.max(-1, Math.min(1, ry));
    };

    const handleMouseLeave = () => {
      mouse.current.targetX = 0;
      mouse.current.targetY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Responsive card metrics matching the 3D cylinder aspect ratio
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      let cardW = Math.round(w * 0.22 + 150);
      const heightFactor = Math.min(1.0, Math.max(0.68, h / 850));
      cardW = Math.round(cardW * heightFactor);
      cardW = Math.min(380, Math.max(300, Math.min(cardW, w - 40)));
      const cardH = Math.round(cardW / 1.58);

      setMetrics({ cardW, cardH });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Freeze on scroll:
  // When scrolling down, the sticky section freezes full-screen.
  // As the user scrolls through the container height, targetProgress traverses all cards (0 to cardCount - 1).
  // Once the end of the container is reached, page scroll unfreezes and flows naturally to the next section!
  // When scrolling back up, it reverses through the cards, then unfreezes back to hero!
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollDistance = -rect.top;
      const maxScroll = rect.height - window.innerHeight;

      if (maxScroll <= 0) return;

      const rawFraction = Math.max(0, Math.min(1, scrollDistance / maxScroll));
      targetProgress.current = rawFraction * (cardCount - 1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [cardCount]);

  // 60FPS 3D Cylinder Physics Loop
  const renderLoop = () => {
    progress.current += (targetProgress.current - progress.current) * 0.12;

    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

    const cards = cardsRefs.current;
    const h = window.innerHeight;
    const { cardH } = metrics;

    const continuousProgress = progress.current;
    const roundedIndex = Math.round(continuousProgress);
    const diffFromRound = continuousProgress - roundedIndex;

    const easedDiff =
      (Math.sign(diffFromRound) * Math.pow(Math.abs(diffFromRound) * 2, 4.2)) /
      2;
    const virtualActiveIndex = roundedIndex + easedDiff;

    const clampedActive = Math.max(0, Math.min(cardCount - 1, roundedIndex));
    if (activeCardRef.current !== clampedActive) {
      activeCardRef.current = clampedActive;
      setActiveCardIndex(clampedActive);
    }

    for (let i = 0; i < cardCount; i++) {
      const card = cards[i];
      if (!card) continue;

      const offset = i - virtualActiveIndex;
      const absOffset = Math.abs(offset);
      const sign = Math.sign(offset);

      if (absOffset > 3.2) {
        card.style.visibility = 'hidden';
        continue;
      } else {
        card.style.visibility = 'visible';
      }

      const gap = 38;
      const peekAmount = -60;
      const D = 1350;

      let y = 0;
      let z = 0;
      let rot = 0;

      if (absOffset <= 1) {
        const t = absOffset;
        const easedT = t * t * (3 - 2 * t);
        const targetY = cardH + gap;
        y = -sign * (easedT * targetY);
        z = 400 + easedT * (220 - 400);
        rot = easedT * 132;
      } else if (absOffset <= 2) {
        const t = absOffset - 1;
        const easedT = t * t * (3 - 2 * t);
        const yStart = cardH + gap;
        const zStart = 220;
        const rotStart = 132;
        const zEnd = -60;
        const rotEnd = 175;

        const sEnd = D / (D - zEnd);
        const yEnd = (h / 2 - peekAmount) / sEnd - cardH / 2;
        const currentY = yStart + easedT * (yEnd - yStart);
        y = -sign * currentY;
        z = zStart + easedT * (zEnd - zStart);
        rot = rotStart + easedT * (rotEnd - rotStart);
      } else {
        const t = Math.min(absOffset - 2, 1);
        const easedT = t * t * (3 - 2 * t);
        const zStart = -60;
        const rotStart = 175;
        const zEnd3 = -260;
        const rotEnd3 = 195;

        const sEnd2 = D / (D - zStart);
        const yEnd2 = (h / 2 - peekAmount) / sEnd2 - cardH / 2;
        const sEnd3 = D / (D - zEnd3);
        const yEnd3 = (h / 2 + 100) / sEnd3 + cardH / 2;
        const currentY = yEnd2 + easedT * (yEnd3 - yEnd2);
        y = -sign * currentY;
        z = zStart + easedT * (zEnd3 - zStart);
        rot = rotStart + easedT * (rotEnd3 - rotStart);
      }

      const localCardRotation = -sign * rot;
      const centerFactor = Math.max(0, 1 - absOffset);

      const maxTiltY = 15;
      const maxTiltX = 12;
      const activeTiltX = -mouse.current.y * maxTiltX * centerFactor;
      const activeTiltY = mouse.current.x * maxTiltY * centerFactor;

      const totalRotX = localCardRotation + activeTiltX;
      const totalRotY = activeTiltY;

      card.style.zIndex = Math.round(z + 500).toString();
      card.style.transform = `translateY(${y.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateX(${totalRotX.toFixed(2)}deg) rotateY(${totalRotY.toFixed(2)}deg) rotateZ(-3deg)`;
    }
  };

  useEffect(() => {
    let isVisible = true;
    const container = containerRef.current;
    let observer = null;

    const startTick = () => {
      if (!frameId.current && isVisible) {
        frameId.current = requestAnimationFrame(tick);
      }
    };

    const stopTick = () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
        frameId.current = null;
      }
    };

    const tick = () => {
      if (!isVisible) {
        frameId.current = null;
        return;
      }
      frameId.current = requestAnimationFrame(tick);
      renderLoop();
    };

    if (container && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          const wasVisible = isVisible;
          isVisible = entry.isIntersecting;
          if (isVisible && !wasVisible) {
            startTick();
          } else if (!isVisible && wasVisible) {
            stopTick();
          }
        },
        { rootMargin: '350px' }
      );
      observer.observe(container);
    }

    startTick();
    return () => {
      if (observer) observer.disconnect();
      stopTick();
    };
  }, [metrics]);

  const handleToggleFlip = (cardIdx) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardIdx]: !prev[cardIdx],
    }));
  };

  const handleLaunchTool = (tool) => {
    if (tool.route) {
      router.push(tool.route);
    }
  };

  return (
    <div
      ref={containerRef}
      id="generators"
      className="relative w-full"
      style={{ height: `${(cardCount + 1) * 55}vh` }}
    >
      {/* Sticky Full-Screen Pinned Stage (Freeze on scroll) */}
      <section className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-background/85 backdrop-blur-md border-b border-border select-none transition-colors duration-300">
        {/* 100% Hydration-Safe Ambient Background Atmosphere (Zero client/server mismatch) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-sky-200/50 dark:bg-primary/10 rounded-full blur-[140px]" />
          <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-indigo-100/60 dark:bg-cyan-600/10 rounded-full blur-[130px]" />
          <div className="hidden dark:block absolute top-1/3 -right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]" />
        </div>

        {/* Ambient Top Title (Zero instructional clutter) */}
        <div className="absolute top-8 left-6 sm:left-12 z-30 pointer-events-none space-y-1">
          <Badge
            variant="outline"
            className="px-3 py-1 rounded-full bg-primary/10 text-primary border-primary/25 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-fit"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Professional Suite</span>
          </Badge>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <span>Specialized Tools</span>
            <span className="text-xs font-mono font-normal text-muted-foreground">
              ({activeCardIndex + 1} of {cardCount})
            </span>
          </h2>
        </div>

        {/* 3D Perspective Camera Viewport */}
        <div
          className="relative w-full h-full flex items-center justify-center pointer-events-none"
          style={{ perspective: '1350px' }}
        >
          {/* Dynamic 3D coordinate frame */}
          <div
            className="absolute"
            style={{
              width: `${metrics.cardW}px`,
              height: `${metrics.cardH}px`,
              transformStyle: 'preserve-3d',
            }}
          >
            {Array.from({ length: cardCount }).map((_, i) => {
              const tool = PROFESSIONAL_TOOLS[i % PROFESSIONAL_TOOLS.length];
              const isFlipped = !!flippedCards[i];
              const videoSrc =
                ABSTRACT_CARD_VIDEOS[i % ABSTRACT_CARD_VIDEOS.length];

              return (
                <div
                  key={tool.id}
                  ref={(el) => {
                    cardsRefs.current[i] = el;
                  }}
                  className="absolute inset-0 cursor-pointer pointer-events-auto"
                  style={{
                    width: `${metrics.cardW}px`,
                    height: `${metrics.cardH}px`,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'visible',
                  }}
                >
                  {/* 2-Sided True 3D Flip Card Container: Zero occluding middle slices! */}
                  <div
                    className="relative w-full h-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transition:
                        'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)',
                      transform: isFlipped
                        ? 'rotateY(180deg)'
                        : 'rotateY(0deg)',
                    }}
                  >
                    {/* FRONT FACE (Professional Card - Not a bank card) */}
                    <div
                      className="absolute inset-0 rounded-[24px] overflow-hidden border border-slate-300 dark:border-white/30 bg-white/55 dark:bg-black/50 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                      }}
                    >
                      {/* Abstract Kinetic Motion Video Running Inside Card */}
                      <video
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-35 dark:opacity-40 pointer-events-none"
                      />

                      {/* Ambient Gradient Tint */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-90"
                        style={{
                          background: `radial-gradient(circle at 80% 20%, ${tool.accentColor}30, transparent 65%)`,
                        }}
                      />

                      {/* Glass Content Overlay */}
                      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-10 text-foreground">
                        {/* Top Row: Icon Badge + Category + Flip for specs */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-transform hover:scale-110 bg-white dark:bg-white/15 border border-slate-200 dark:border-white/20 shadow-slate-200 dark:shadow-black/40">
                              <DynamicIcon
                                name={tool.iconName}
                                className="w-5 h-5"
                                color={tool.accentColor}
                              />
                            </div>
                            <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full border bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/15 text-slate-700 dark:text-white/90">
                              {tool.category}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFlip(i);
                            }}
                            title="Flip for Tech Specs"
                            className="p-1.5 rounded-full transition-all cursor-pointer opacity-85 hover:opacity-100 hover:bg-slate-200/80 dark:hover:bg-white/15 text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Middle: Title & Description */}
                        <div className="my-auto pt-1">
                          <h3 className="text-base sm:text-[17px] font-black tracking-tight line-clamp-1 drop-shadow-sm text-foreground">
                            {tool.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs leading-relaxed line-clamp-2 mt-1.5 font-medium text-slate-700 dark:text-white/85">
                            {tool.description}
                          </p>
                        </div>

                        {/* Bottom Row: Instant WASM Launch + Launch Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-wide text-slate-700 dark:text-white/80">
                              {tool.badge}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunchTool(tool);
                            }}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold tracking-wide shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/15"
                          >
                            <span>Launch</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* BACK FACE (Tech Specs - Crystal Clear Glassy) */}
                    <div
                      className="absolute inset-0 rounded-[24px] overflow-hidden border border-slate-300 dark:border-white/30 bg-white/70 dark:bg-black/65 shadow-[0_20px_45px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      {/* Abstract Kinetic Motion Video Running Inside Card */}
                      <video
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-25 dark:opacity-30 pointer-events-none"
                      />

                      {/* Glass Content Overlay */}
                      <div className="absolute inset-0 p-5 flex flex-col justify-between z-10 text-foreground">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
                              <Terminal className="w-3 h-3" /> Runtime
                              Specifications
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFlip(i);
                              }}
                              className="text-xs hover:underline cursor-pointer flex items-center gap-1 opacity-90 hover:opacity-100 font-semibold text-slate-700 dark:text-white"
                            >
                              <RotateCw className="w-3 h-3" /> Flip Front
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs font-mono">
                            <div className="p-2 rounded-xl border bg-white/80 dark:bg-white/10 border-slate-200 dark:border-white/15 text-slate-900 dark:text-white">
                              <div className="text-[9px] opacity-70">
                                ENGINE
                              </div>
                              <div className="font-bold truncate">
                                {tool.techSpecs.engine}
                              </div>
                            </div>
                            <div className="p-2 rounded-xl border bg-white/80 dark:bg-white/10 border-slate-200 dark:border-white/15 text-slate-900 dark:text-white">
                              <div className="text-[9px] opacity-70">
                                RUNTIME
                              </div>
                              <div className="font-bold truncate">
                                {tool.techSpecs.runtime}
                              </div>
                            </div>
                            <div className="p-2 rounded-xl border bg-white/80 dark:bg-white/10 border-slate-200 dark:border-white/15 text-slate-900 dark:text-white">
                              <div className="text-[9px] opacity-70">
                                ALLOCATION
                              </div>
                              <div className="font-bold truncate">
                                {tool.techSpecs.memory}
                              </div>
                            </div>
                            <div className="p-2 rounded-xl border bg-white/80 dark:bg-white/10 border-slate-200 dark:border-white/15 text-slate-900 dark:text-white">
                              <div className="text-[9px] opacity-70">
                                LATENCY
                              </div>
                              <div className="font-bold text-emerald-500 dark:text-emerald-400 truncate">
                                {tool.techSpecs.latency}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchTool(tool);
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>Launch Tool Module</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default FrozenGlassToolsGallery;
