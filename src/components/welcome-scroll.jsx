'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Code,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Video,
  Wand2,
  Layout,
  Search,
  ArrowRight,
  FileType,
  Repeat,
  Music,
  AudioWaveform,
  Target,
  Download,
  Eraser,
  Layers,
  ChevronDown,
  X,
} from 'lucide-react';
import { toolInfo, toolIdToSlug } from '@/lib/seo';
import { isLowEnd } from '@/lib/utils';

const LOGO_SRC =
  'https://gyglsbmpxopaoeljoofp.supabase.co/storage/v1/object/public/media/library/1779796669800-Hi.gif';

/* ── ICON & GRADIENT MAPS ──────────────────────────────────── */
const iconMap = {
  'pdf-editor': FileText,
  'web-content': Layout,
  'blog-generator': FileText,
  'glossary-generator': BookOpen,
  'resource-generator': Search,
  'html-cleaner': Code,
  'image-converter': ImageIcon,
  'video-compressor': Video,
  'ai-assistant': Wand2,
  'image-to-text': Wand2,
  'document-extractor': Layers,
  'video-converter': Repeat,
  'audio-converter': Music,
  'audio-editor': AudioWaveform,
  'video-to-gif': Video,
  'word-to-html': FileType,
  'lesson-quiz-builder': Target,
  'youtube-downloader': Download,
  'watermark-remover': Eraser,
  'bg-remover': Wand2,
};

const gradientMap = {
  'pdf-editor': 'from-blue-600 to-indigo-500',
  'web-content': 'from-blue-500 to-cyan-400',
  'blog-generator': 'from-violet-500 to-purple-400',
  'glossary-generator': 'from-amber-500 to-yellow-400',
  'resource-generator': 'from-emerald-500 to-green-400',
  'html-cleaner': 'from-rose-500 to-pink-400',
  'image-converter': 'from-indigo-500 to-blue-400',
  'video-compressor': 'from-teal-500 to-cyan-400',
  'ai-assistant': 'from-sky-500 to-blue-600',
  'image-to-text': 'from-cyan-500 to-indigo-400',
  'document-extractor': 'from-emerald-500 to-cyan-400',
  'video-converter': 'from-orange-500 to-amber-400',
  'audio-converter': 'from-pink-500 to-rose-400',
  'audio-editor': 'from-violet-500 to-indigo-400',
  'video-to-gif': 'from-yellow-500 to-amber-400',
  'word-to-html': 'from-blue-600 to-indigo-500',
  'lesson-quiz-builder': 'from-purple-500 to-blue-500',
  'youtube-downloader': 'from-red-500 to-orange-400',
  'watermark-remover': 'from-indigo-500 to-teal-400',
  'bg-remover': 'from-cyan-500 to-blue-500',
};

const glowMap = {
  'pdf-editor': 'shadow-blue-500/25',
  'web-content': 'shadow-blue-500/25',
  'blog-generator': 'shadow-violet-500/25',
  'glossary-generator': 'shadow-amber-500/25',
  'resource-generator': 'shadow-emerald-500/25',
  'html-cleaner': 'shadow-rose-500/25',
  'image-converter': 'shadow-indigo-500/25',
  'video-compressor': 'shadow-teal-500/25',
  'ai-assistant': 'shadow-sky-500/25',
  'image-to-text': 'shadow-cyan-500/25',
  'document-extractor': 'shadow-emerald-500/25',
  'video-converter': 'shadow-orange-500/25',
  'audio-converter': 'shadow-pink-500/25',
  'audio-editor': 'shadow-violet-500/25',
  'video-to-gif': 'shadow-yellow-500/25',
  'word-to-html': 'shadow-blue-600/25',
  'lesson-quiz-builder': 'shadow-purple-500/25',
  'youtube-downloader': 'shadow-red-500/25',
  'watermark-remover': 'shadow-indigo-500/25',
  'bg-remover': 'shadow-cyan-500/25',
};

/* ── SCROLL-SYNCHRONIZED 3D PURE-CSS CUBE ───────────────────────── */
function DynamicScroll3DCube({
  size = 44,
  rotX = 0,
  rotY = 0,
  rotZ = 0,
  className = '',
  borderGlow = 'border-cyan-400/50 shadow-cyan-500/30',
}) {
  const half = size / 2;
  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        perspective: 800,
      }}
    >
      <div
        className="w-full h-full relative transition-transform duration-75 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
        }}
      >
        {/* Front Face */}
        <div
          className={`absolute inset-0 rounded-2xl border ${borderGlow} bg-slate-900/80 backdrop-blur-md overflow-hidden p-1 shadow-lg`}
          style={{ transform: `translateZ(${half}px)` }}
        >
          <img
            src={LOGO_SRC}
            alt="Cube Face"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Back Face */}
        <div
          className="absolute inset-0 rounded-2xl border border-blue-500/50 bg-slate-900/80 backdrop-blur-md overflow-hidden p-1 shadow-lg shadow-blue-500/20"
          style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}
        >
          <img
            src={LOGO_SRC}
            alt="Cube Face"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Right Face */}
        <div
          className="absolute inset-0 rounded-2xl border border-indigo-400/50 bg-slate-900/80 backdrop-blur-md overflow-hidden p-1"
          style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}
        >
          <img
            src={LOGO_SRC}
            alt="Cube Face"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Left Face */}
        <div
          className="absolute inset-0 rounded-2xl border border-teal-400/50 bg-slate-900/80 backdrop-blur-md overflow-hidden p-1"
          style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}
        >
          <img
            src={LOGO_SRC}
            alt="Cube Face"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Top Face */}
        <div
          className="absolute inset-0 rounded-2xl border border-sky-400/50 bg-slate-900/80 backdrop-blur-md overflow-hidden p-1"
          style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}
        >
          <img
            src={LOGO_SRC}
            alt="Cube Face"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Bottom Face */}
        <div
          className="absolute inset-0 rounded-2xl border border-cyan-500/50 bg-slate-900/80 backdrop-blur-md overflow-hidden p-1"
          style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}
        >
          <img
            src={LOGO_SRC}
            alt="Cube Face"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export function WelcomeScroll({ onComplete }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [introCountdown, setIntroCountdown] = useState(3);
  const [introUnlocked, setIntroUnlocked] = useState(false);
  const scrollRef = useRef(null);

  const welcomeText = 'Welcome to All Useful Tools';

  /* build tools array from shared SEO data */
  const tools = useMemo(() => {
    return Object.entries(toolIdToSlug).map(([id, slug]) => ({
      id,
      slug,
      ...toolInfo[slug],
      Icon: iconMap[slug] || Layout,
      gradient: gradientMap[slug] || 'from-blue-500 to-cyan-400',
      glow: glowMap[slug] || 'shadow-blue-500/25',
    }));
  }, []);

  /* ── 3-SECOND INITIAL INTRO TIMER ───────────────────────── */
  useEffect(() => {
    const timer = setInterval(() => {
      setIntroCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIntroUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ── TYPING EFFECT ──────────────────────────────────────── */
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < welcomeText.length) {
        setTypedText(welcomeText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 45);
    return () => clearInterval(timer);
  }, []);

  /* ── HIGH-PERFORMANCE SCROLL TRACKING (rAF) ─────────────── */
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const total = scrollHeight - clientHeight;
            const progress = total > 0 ? scrollTop / total : 0;
            const clamped = Math.min(Math.max(progress, 0), 1);
            setScrollProgress(clamped);

            if (clamped > 0.005 && !introUnlocked) {
              setIntroUnlocked(true);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true });
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, [introUnlocked]);

  /* ── SCROLL STAGE BREAKPOINTS ────────────────────────────── */
  const zipperEnd = 0.08;
  const heroEnd = 0.18;
  const toolsStart = 0.18;
  const toolsEnd = 0.88;
  const toolCount = tools.length;
  const toolRange = (toolsEnd - toolsStart) / toolCount;

  // Zipper calculations on initial stage
  const zipperProgress = Math.min(scrollProgress / zipperEnd, 1);
  const zipperTopPercent = 10 + zipperProgress * 76; // moves from 10% to 86% (bottom center)
  const openWidthPercent = 6 + zipperProgress * 70;

  const showZipper = scrollProgress < zipperEnd;
  const showHero = scrollProgress >= zipperEnd && scrollProgress < heroEnd;
  const showTools = scrollProgress >= toolsStart && scrollProgress < toolsEnd;
  const showFinal = scrollProgress >= toolsEnd;

  const activeToolIndex = Math.min(
    Math.max(Math.floor((scrollProgress - toolsStart) / toolRange), 0),
    toolCount - 1
  );

  const getToolVisibility = (index) => {
    const start = toolsStart + index * toolRange;
    const end = start + toolRange;
    const isVisible = scrollProgress >= start && scrollProgress < end;
    const fromLeft = index % 2 === 0;
    const translateX = fromLeft ? '-80px' : '80px';

    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible
        ? 'translateX(0) scale(1)'
        : `translateX(${translateX}) scale(0.92)`,
    };
  };

  /* ── MULTI-DIRECTIONAL 3D ROTATIONS FOR ALL CUBES ON SCROLL ── */
  const centerCubeRotations = useMemo(() => {
    // Center cube rotates in 3D on scroll
    return {
      rotX: scrollProgress * 720,
      rotY: scrollProgress * 1080,
      rotZ: scrollProgress * 360,
    };
  }, [scrollProgress]);

  const cornerCubes = useMemo(() => {
    return {
      topLeft: {
        rotX: -scrollProgress * 540 + 15,
        rotY: scrollProgress * 720 + 30,
        rotZ: -scrollProgress * 180,
      },
      bottomLeft: {
        rotX: scrollProgress * 360 + 20,
        rotY: -scrollProgress * 540 - 20,
        rotZ: scrollProgress * 360,
      },
      topRight: {
        rotX: scrollProgress * 720 - 15,
        rotY: -scrollProgress * 720 + 45,
        rotZ: scrollProgress * 180,
      },
      bottomRight: {
        rotX: -scrollProgress * 360 - 25,
        rotY: scrollProgress * 540 - 35,
        rotZ: -scrollProgress * 540,
      },
    };
  }, [scrollProgress]);

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-y-auto overflow-x-hidden scroll-smooth select-none"
    >
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }
        .animate-float-slow {
          animation: floatSlow 3.5s ease-in-out infinite;
        }
        @keyframes zipperGlow {
          0%, 100% { filter: drop-shadow(0 0 14px rgba(56, 189, 248, 0.6)); }
          50% { filter: drop-shadow(0 0 30px rgba(56, 189, 248, 0.95)); }
        }
        .animate-zipper-glow {
          animation: zipperGlow 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* ── SCROLL TRACK (1200vh ensures smooth 1-by-1 tool transitions) ── */}
      <div className="h-[1200vh] relative">
        {/* sticky viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* ── BACKGROUND LAYER & ATMOSPHERIC LIGHTING ─────────── */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden pointer-events-none">
            {!isLowEnd() && (
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(56, 189, 248, 0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(56, 189, 248, 0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: '70px 70px',
                  transform: `translateY(${scrollProgress * 120}px)`,
                }}
              />
            )}
            <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[15%] w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
          </div>

          {/* ── 4 CORNER 3D CUBES (SYNCHRONIZED MULTI-DIRECTIONAL ROTATIONS ON SCROLL) ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {/* Top-Left Cube */}
            <div
              className="absolute left-[8%] top-[22%]"
              style={{ transform: `translateY(${scrollProgress * -80}px)` }}
            >
              <DynamicScroll3DCube
                size={48}
                rotX={cornerCubes.topLeft.rotX}
                rotY={cornerCubes.topLeft.rotY}
                rotZ={cornerCubes.topLeft.rotZ}
                className="animate-float-slow opacity-85"
                borderGlow="border-cyan-400/60 shadow-cyan-500/30"
              />
            </div>
            {/* Bottom-Left Cube */}
            <div
              className="absolute left-[12%] bottom-[20%]"
              style={{ transform: `translateY(${scrollProgress * 60}px)` }}
            >
              <DynamicScroll3DCube
                size={38}
                rotX={cornerCubes.bottomLeft.rotX}
                rotY={cornerCubes.bottomLeft.rotY}
                rotZ={cornerCubes.bottomLeft.rotZ}
                className="animate-float-slow opacity-75"
                borderGlow="border-teal-400/60 shadow-teal-500/20"
              />
            </div>
            {/* Top-Right Cube */}
            <div
              className="absolute right-[8%] top-[22%]"
              style={{ transform: `translateY(${scrollProgress * -80}px)` }}
            >
              <DynamicScroll3DCube
                size={48}
                rotX={cornerCubes.topRight.rotX}
                rotY={cornerCubes.topRight.rotY}
                rotZ={cornerCubes.topRight.rotZ}
                className="animate-float-slow opacity-85"
                borderGlow="border-blue-400/60 shadow-blue-500/30"
              />
            </div>
            {/* Bottom-Right Cube */}
            <div
              className="absolute right-[12%] bottom-[20%]"
              style={{ transform: `translateY(${scrollProgress * 60}px)` }}
            >
              <DynamicScroll3DCube
                size={38}
                rotX={cornerCubes.bottomRight.rotX}
                rotY={cornerCubes.bottomRight.rotY}
                rotZ={cornerCubes.bottomRight.rotZ}
                className="animate-float-slow opacity-75"
                borderGlow="border-indigo-400/60 shadow-indigo-500/20"
              />
            </div>
          </div>

          {/* ── TOP PROGRESS BAR ────────────────────────────── */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800/40 z-50">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 transition-all duration-150"
              style={{
                width: `${scrollProgress * 100}%`,
              }}
            />
          </div>

          {/* ── TOP HEADER / SKIP BUTTON ────────────────────── */}
          <div className="relative z-50 w-full p-6 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-700/60 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
              <Sparkles
                className="w-4 h-4 text-cyan-400 animate-spin"
                style={{ animationDuration: '6s' }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                All Useful Tools
              </span>
            </div>

            {showTools &&
              activeToolIndex >= 0 &&
              activeToolIndex < toolCount && (
                <div className="hidden md:flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-700/60 shadow-xl">
                  <div className="flex gap-1">
                    {tools.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === activeToolIndex
                            ? 'w-6 bg-gradient-to-r from-cyan-400 to-blue-500'
                            : i < activeToolIndex
                              ? 'w-1.5 bg-cyan-500/40'
                              : 'w-1.5 bg-slate-700/50'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono tracking-wider">
                    {activeToolIndex + 1}/{toolCount}
                  </span>
                </div>
              )}

            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all text-xs font-bold shadow-lg shadow-cyan-500/10 cursor-pointer"
            >
              <span>Skip to Workspace</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ════════════════════════════════════════════════════
              STEP 1: INITIAL STAGE ZIPPER UNZIPPING CURTAINS (0 -> 8%)
          ════════════════════════════════════════════════════ */}
          <div
            className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-300 ${
              showZipper ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Left Zipper Curtain */}
            <div
              className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900/95 border-r-2 border-cyan-500/50 shadow-2xl transition-all duration-75"
              style={{
                clipPath: `polygon(0 0, 0 100%, 100% 100%, 100% ${zipperTopPercent}%, ${100 - openWidthPercent}% 0)`,
              }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-3 flex flex-col justify-between opacity-75">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-1.5 bg-gradient-to-r from-cyan-400 to-slate-300 rounded-sm mb-1 ml-auto shadow-sm"
                  />
                ))}
              </div>
            </div>

            {/* Right Zipper Curtain */}
            <div
              className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-slate-950 via-slate-900 to-slate-900/95 border-l-2 border-cyan-500/50 shadow-2xl transition-all duration-75"
              style={{
                clipPath: `polygon(100% 0, 100% 100%, 0 100%, 0 ${zipperTopPercent}%, ${openWidthPercent}% 0)`,
              }}
            >
              <div className="absolute top-0 left-0 bottom-0 w-3 flex flex-col justify-between opacity-75">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-1.5 bg-gradient-to-l from-cyan-400 to-slate-300 rounded-sm mb-1 mr-auto shadow-sm"
                  />
                ))}
              </div>
            </div>

            {/* Scroll Down to Unzip Prompt */}
            {zipperProgress < 0.35 && (
              <div className="absolute top-[26%] left-1/2 -translate-x-1/2 z-30 text-center space-y-2 pointer-events-none animate-bounce">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/20 border border-cyan-400/50 backdrop-blur-md shadow-xl">
                  <ChevronDown className="w-4 h-4 text-cyan-300" />
                  <span className="text-xs font-black tracking-widest uppercase text-cyan-200">
                    Scroll Down to Unzip &amp; Explore
                  </span>
                  <ChevronDown className="w-4 h-4 text-cyan-300" />
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════
              CENTER LOGO: ZIPPER HEAD -> 3D ROTATING CUBE ON SCROLL
          ════════════════════════════════════════════════════ */}
          {!showFinal && (
            <div
              className="absolute z-30 pointer-events-none transition-all duration-150 ease-out flex flex-col items-center justify-center"
              style={{
                left: '50%',
                top: showZipper ? `${zipperTopPercent}%` : '86%',
                transform: `translate3d(-50%, -50%, 0) scale(${showZipper ? 1 - zipperProgress * 0.25 : 0.85})`,
              }}
            >
              <div className="relative flex flex-col items-center justify-center">
                {showZipper ? (
                  /* Zipper Head view during unzipping */
                  <>
                    <div className="relative w-28 h-28 md:w-36 md:h-36 p-2.5 rounded-2xl bg-slate-900 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/50 flex items-center justify-center animate-zipper-glow mx-auto">
                      <img
                        src={LOGO_SRC}
                        alt="All Useful Tools Logo"
                        className="w-full h-full object-contain rounded-xl drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]"
                      />
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 bg-gradient-to-b from-cyan-400 to-slate-700 rounded-t-md border border-cyan-300" />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-5 bg-gradient-to-b from-slate-700 to-cyan-500 rounded-b-md border border-cyan-400" />
                    </div>
                    <div className="w-1.5 h-7 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full shadow-md shadow-cyan-400 mt-2 mx-auto" />
                  </>
                ) : (
                  /* Full 3D Rotating Cube at bottom center after zip ends */
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="absolute -inset-8 bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-indigo-500/40 blur-3xl rounded-full animate-pulse pointer-events-none" />
                    <DynamicScroll3DCube
                      size={68}
                      rotX={centerCubeRotations.rotX}
                      rotY={centerCubeRotations.rotY}
                      rotZ={centerCubeRotations.rotZ}
                      className="shadow-2xl shadow-cyan-500/40"
                      borderGlow="border-2 border-cyan-400/80 shadow-cyan-500/50"
                    />
                    <div className="mt-4 bg-slate-900/90 border border-cyan-500/40 px-3 py-1 rounded-full shadow-lg">
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                        All Useful Tools
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════
              STEP 2: WELCOME CONTENT & ANIMATED MOUSE SCROLL DOWN PROMPT
          ════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-700 z-20"
            style={{
              opacity: showHero ? 1 : 0,
              transform: showHero ? 'scale(1)' : 'scale(0.9)',
              pointerEvents: showHero ? 'auto' : 'none',
            }}
          >
            <div className="text-center space-y-4 max-w-2xl mb-28">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-300 bg-clip-text text-transparent">
                  {typedText}
                  <span className="inline-block w-0.5 h-10 bg-cyan-400 ml-1 animate-pulse align-middle" />
                </span>
              </h1>

              <p className="text-sm md:text-lg text-slate-300 font-light max-w-xl mx-auto leading-relaxed">
                20 high-performance web utilities engineered for local-first PDF
                editing, media processing, and 100% private execution.
              </p>

              {/* ── ANIMATED MOUSE SCROLL DOWN PROMPT ─────────── */}
              <div className="flex flex-col items-center gap-3 pt-6 opacity-90 animate-bounce">
                <div className="w-6 h-10 rounded-full border-2 border-cyan-400/70 flex items-start justify-center p-1.5 shadow-lg shadow-cyan-500/20">
                  <div className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Scroll down to explore all tools
                </p>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              STEP 3: STICKY ON-SCROLL 20 TOOLS SHOWCASE (1-BY-1)
          ════════════════════════════════════════════════════ */}
          {tools.map((tool, index) => {
            const visibility = getToolVisibility(index);
            const Icon = tool.Icon;

            return (
              <div
                key={tool.id}
                className="absolute inset-0 flex items-center justify-center p-4 md:p-12 transition-all duration-700 ease-out z-20"
                style={{
                  opacity: visibility.opacity,
                  transform: visibility.transform,
                  pointerEvents: visibility.opacity > 0 ? 'auto' : 'none',
                }}
              >
                <div className="relative max-w-2xl w-full mb-24">
                  <div
                    className={`absolute -inset-6 bg-gradient-to-r ${tool.gradient} opacity-[0.15] blur-[60px] rounded-[40px] pointer-events-none`}
                  />

                  <div
                    className={`relative bg-slate-900/85 backdrop-blur-2xl border border-slate-700/40 rounded-3xl p-7 md:p-10 shadow-2xl ${tool.glow}`}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        {tool.category || 'Tool'}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
                        Tool {index + 1} / {toolCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className={`p-3.5 rounded-2xl bg-gradient-to-br ${tool.gradient} shadow-lg shrink-0`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                          {tool.name}
                        </h2>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-300/90 text-sm md:text-[15px] leading-relaxed mb-6">
                      {tool.detailedDescription || tool.description}
                    </p>

                    {tool.benefits && tool.benefits.length > 0 && (
                      <div className="space-y-2.5 pt-4 border-t border-slate-700/30">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-3">
                          Key Features
                        </span>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {tool.benefits.slice(0, 4).map((benefit, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/40 border border-slate-700/40"
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tool.gradient} mt-1.5 flex-shrink-0 shadow-sm`}
                              />
                              <span className="text-xs text-slate-300 leading-relaxed">
                                {benefit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ════════════════════════════════════════════════════
              STEP 4: FINAL CTA SECTION (AT END OF SCROLL)
          ════════════════════════════════════════════════════ */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700 z-20 ${
              showFinal
                ? 'opacity-100 pointer-events-auto scale-100'
                : 'opacity-0 pointer-events-none scale-90'
            }`}
          >
            <div className="text-center space-y-8 max-w-lg">
              <div className="relative inline-block">
                <div className="absolute -inset-10 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-indigo-500/25 blur-[80px] rounded-full animate-pulse" />
                <Image
                  src={LOGO_SRC}
                  alt="All Useful Tools"
                  width={192}
                  height={192}
                  priority={true}
                  loading="eager"
                  className="relative w-36 h-36 md:w-48 md:h-48 mx-auto object-contain rounded-3xl"
                  unoptimized
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  Ready to Get Started
                </h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Your 20-tool platform is loaded and ready.
                  <br />
                  Explore all utilities and start creating.
                </p>
              </div>

              <p className="text-[11px] text-slate-500 italic tracking-wide">
                Crafted with excellence by Bilal Se7eN
              </p>

              <button
                onClick={onComplete}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/40 text-base cursor-pointer shadow-xl"
              >
                <Sparkles className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Enter Workspace</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* ── 3-SECOND INITIAL INTRO OVERLAY ────────────────── */}
          <div
            className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 transition-all duration-700 ${
              !introUnlocked
                ? 'opacity-100 pointer-events-auto scale-100'
                : 'opacity-0 pointer-events-none scale-95'
            }`}
          >
            <div className="text-center space-y-6 max-w-md flex flex-col items-center justify-center">
              <div className="relative inline-block mx-auto">
                <div className="absolute -inset-6 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-indigo-500/30 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-36 h-36 md:w-44 md:h-44 p-3 rounded-3xl bg-slate-900/90 border-2 border-cyan-400/60 shadow-2xl shadow-cyan-500/40 flex items-center justify-center mx-auto animate-float-slow">
                  <img
                    src={LOGO_SRC}
                    alt="All Useful Tools"
                    className="w-full h-full object-contain rounded-2xl animate-zipper-glow"
                  />
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                  All Useful Tools
                </h1>
                <p className="text-xs md:text-sm text-slate-400 font-medium">
                  Initializing High-Performance Web Tools...
                </p>
              </div>

              <div className="space-y-2 pt-2 w-full flex flex-col items-center">
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${((4 - introCountdown) / 3) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-cyan-400/80">
                  Opening in {introCountdown}s
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
