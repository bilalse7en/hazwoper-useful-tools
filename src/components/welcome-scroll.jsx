'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Code,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Wand2,
  Layout,
  Search,
  ArrowRight,
} from 'lucide-react';
import { toolInfo, toolIdToSlug } from '@/lib/seo';
import { isLowEnd } from '@/lib/utils';

/* ── icon & gradient maps ──────────────────────────────────── */
const iconMap = {
  'web-content': Layout,
  'blog-generator': FileText,
  'glossary-generator': BookOpen,
  'resource-generator': Search,
  'html-cleaner': Code,
  'image-converter': ImageIcon,
  'video-compressor': Video,
  'ai-assistant': MessageSquare,
  'image-to-text': Wand2,
  'document-extractor': FileText,
};

const gradientMap = {
  'web-content': 'from-blue-500 to-cyan-400',
  'blog-generator': 'from-violet-500 to-purple-400',
  'glossary-generator': 'from-amber-500 to-yellow-400',
  'resource-generator': 'from-emerald-500 to-green-400',
  'html-cleaner': 'from-rose-500 to-pink-400',
  'image-converter': 'from-indigo-500 to-blue-400',
  'video-compressor': 'from-teal-500 to-cyan-400',
  'ai-assistant': 'from-fuchsia-500 to-pink-400',
  'image-to-text': 'from-sky-500 to-indigo-400',
  'document-extractor': 'from-lime-500 to-emerald-400',
};

const glowMap = {
  'web-content': 'shadow-blue-500/30',
  'blog-generator': 'shadow-violet-500/30',
  'glossary-generator': 'shadow-amber-500/30',
  'resource-generator': 'shadow-emerald-500/30',
  'html-cleaner': 'shadow-rose-500/30',
  'image-converter': 'shadow-indigo-500/30',
  'video-compressor': 'shadow-teal-500/30',
  'ai-assistant': 'shadow-fuchsia-500/30',
  'image-to-text': 'shadow-sky-500/30',
  'document-extractor': 'shadow-lime-500/30',
};

/* ── component ─────────────────────────────────────────────── */
export function WelcomeScroll({ onComplete }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [typedText, setTypedText] = useState('');
  const scrollRef = useRef(null);

  const welcomeText = 'Welcome to Content Suite';

  /* build tools array from shared SEO data */
  const tools = Object.entries(toolIdToSlug).map(([id, slug]) => ({
    id,
    slug,
    ...toolInfo[slug],
    Icon: iconMap[slug] || Layout,
    gradient: gradientMap[slug] || 'from-blue-500 to-cyan-400',
    glow: glowMap[slug] || 'shadow-blue-500/30',
  }));

  /* ── typing effect ──────────────────────────────────────── */
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < welcomeText.length) {
        setTypedText(welcomeText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 55);
    return () => clearInterval(timer);
  }, []);

  /* ── scroll tracking ────────────────────────────────────── */
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const progress = scrollTop / (scrollHeight - clientHeight);
        setScrollProgress(Math.min(progress, 1));
      }
    };
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, []);

  /* ── scroll-based visibility math ───────────────────────── */
  const toolCount = tools.length;
  const heroEnd = 0.1;
  const toolsEnd = 0.88;
  const toolRange = (toolsEnd - heroEnd) / toolCount;

  const getToolVisibility = (index) => {
    const start = heroEnd + index * toolRange;
    const end = start + toolRange;
    const isVisible = scrollProgress >= start && scrollProgress < end;

    // enter progress within current segment (0→1)
    const segmentProgress = isVisible
      ? Math.min((scrollProgress - start) / (toolRange * 0.4), 1)
      : 0;

    const fromLeft = index % 2 === 0;
    const translateX = fromLeft ? '-80px' : '80px';

    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible
        ? `translateX(0) scale(1)`
        : `translateX(${translateX}) scale(0.92)`,
    };
  };

  const activeToolIndex = Math.floor((scrollProgress - heroEnd) / toolRange);

  const showHero = scrollProgress < heroEnd;
  const showTools = scrollProgress >= heroEnd && scrollProgress < toolsEnd;
  const showFinal = scrollProgress >= toolsEnd;

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-y-auto overflow-x-hidden scroll-smooth"
    >
      {/* total scroll height — enough for hero + 10 tools + outro */}
      <div className="h-[900vh] relative">
        {/* sticky viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* ── background grid ─────────────────────────────── */}
          {!isLowEnd() && (
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(139,92,246,0.4) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(139,92,246,0.4) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
                transform: `translateY(${scrollProgress * 120}px)`,
              }}
            />
          )}

          {/* ── ambient glow orbs ───────────────────────────── */}
          {!isLowEnd() && (
            <>
              <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[150px] pointer-events-none" />
              <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute top-[60%] left-[60%] w-[300px] h-[300px] bg-pink-600/6 rounded-full blur-[100px] pointer-events-none" />
            </>
          )}

          {/* ── progress bar ────────────────────────────────── */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-800/40 z-50">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-200"
              style={{
                width: `${scrollProgress * 100}%`,
                boxShadow: '0 0 20px rgba(168,85,247,0.5)',
              }}
            />
          </div>

          {/* ── tool progress dots ──────────────────────────── */}
          {showTools && activeToolIndex >= 0 && activeToolIndex < toolCount && (
            <div className="absolute top-5 right-5 z-50 flex items-center gap-3 bg-gray-900/60 backdrop-blur-xl px-4 py-2.5 rounded-full border border-gray-700/40">
              <div className="flex gap-1">
                {tools.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === activeToolIndex
                        ? 'w-6 bg-gradient-to-r from-purple-400 to-pink-400'
                        : i < activeToolIndex
                          ? 'w-1.5 bg-purple-500/50'
                          : 'w-1.5 bg-gray-600/50'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-400 font-mono tracking-wider">
                {Math.min(activeToolIndex + 1, toolCount)}/{toolCount}
              </span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════
              SECTION 1 — WELCOME HERO
          ════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700"
            style={{
              opacity: showHero ? 1 : 0,
              transform: showHero ? 'translateY(0)' : 'translateY(-60px)',
              pointerEvents: showHero ? 'auto' : 'none',
            }}
          >
            <div className="max-w-3xl text-center space-y-8">
              {/* badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-purple-300">
                  Professional Tool Suite
                </span>
              </div>

              {/* logo */}
              <div className="flex justify-center relative">
                <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-2xl rounded-full animate-pulse" />
                <Image
                  src="https://staging-media.hazwoper-osha.com/wp-content/uploads/2026/05/1779695072/Hi.gif"
                  alt="Content Suite"
                  width={144}
                  height={144}
                  className="relative w-28 h-28 md:w-36 md:h-36 object-contain rounded-3xl"
                  unoptimized
                />
              </div>

              {/* typed heading */}
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent leading-tight">
                {typedText}
                <span className="inline-block w-0.5 h-10 bg-purple-400 ml-1 animate-pulse align-middle" />
              </h1>

              {/* subtitle */}
              <p className="text-base md:text-xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
                Your all-in-one professional toolkit for content generation,
                media processing, and intelligent automation.
              </p>

              {/* scroll hint */}
              <div className="flex flex-col items-center gap-3 pt-4 opacity-60">
                <div className="w-6 h-10 rounded-full border-2 border-purple-400/50 flex items-start justify-center p-1.5">
                  <div className="w-1.5 h-3 bg-purple-400 rounded-full animate-bounce" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-300/80">
                  Scroll to explore tools
                </p>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              SECTION 2 — TOOL SHOWCASE (one at a time)
          ════════════════════════════════════════════════════ */}
          {tools.map((tool, index) => {
            const visibility = getToolVisibility(index);
            const Icon = tool.Icon;

            return (
              <div
                key={tool.id}
                className="absolute inset-0 flex items-center justify-center p-4 md:p-12 transition-all duration-700 ease-out"
                style={{
                  opacity: visibility.opacity,
                  transform: visibility.transform,
                  pointerEvents: visibility.opacity > 0 ? 'auto' : 'none',
                }}
              >
                <div className="relative max-w-2xl w-full">
                  {/* outer glow */}
                  <div
                    className={`absolute -inset-6 bg-gradient-to-r ${tool.gradient} opacity-[0.12] blur-[60px] rounded-[40px]`}
                  />

                  {/* card */}
                  <div
                    className={`relative bg-gray-900/85 backdrop-blur-2xl border border-gray-700/40 rounded-3xl p-7 md:p-10 shadow-2xl ${tool.glow}`}
                  >
                    {/* top row: category + emoji */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                        {tool.category}
                      </span>
                      <span className="text-3xl">{tool.icon}</span>
                    </div>

                    {/* icon pill */}
                    <div
                      className={`inline-flex p-3.5 rounded-2xl bg-gradient-to-br ${tool.gradient} mb-5 shadow-lg`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* title */}
                    <h2 className="text-2xl md:text-3xl font-black mb-2 text-white tracking-tight leading-tight">
                      {tool.name}
                    </h2>

                    {/* short description */}
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">
                      {tool.description}
                    </p>

                    {/* detailed description */}
                    <p className="text-gray-300/80 text-sm md:text-[15px] leading-relaxed mb-6">
                      {tool.detailedDescription}
                    </p>

                    {/* benefits list */}
                    {tool.benefits && tool.benefits.length > 0 && (
                      <div className="space-y-2.5 pt-4 border-t border-gray-700/30">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 block mb-3">
                          Key Features
                        </span>
                        {tool.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div
                              className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tool.gradient} mt-1.5 flex-shrink-0 shadow-sm`}
                            />
                            <span className="text-xs md:text-sm text-gray-300/80 leading-relaxed">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ════════════════════════════════════════════════════
              SECTION 3 — FINAL CTA
          ════════════════════════════════════════════════════ */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700"
            style={{
              opacity: showFinal ? 1 : 0,
              transform: showFinal ? 'scale(1)' : 'scale(0.85)',
              pointerEvents: showFinal ? 'auto' : 'none',
            }}
          >
            <div className="text-center space-y-8 max-w-lg">
              {/* logo */}
              <div className="relative inline-block">
                <div className="absolute -inset-10 bg-gradient-to-r from-purple-500/25 via-pink-500/25 to-purple-500/25 blur-[80px] rounded-full animate-pulse" />
                <Image
                  src="https://staging-media.hazwoper-osha.com/wp-content/uploads/2026/05/1779695072/Hi.gif"
                  alt="Content Suite"
                  width={192}
                  height={192}
                  className="relative w-36 h-36 md:w-48 md:h-48 mx-auto object-contain rounded-3xl"
                  unoptimized
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Ready to Get Started
                </h2>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                  Your professional toolkit is loaded and ready.
                  <br />
                  Explore all tools and start creating.
                </p>
              </div>

              <p className="text-[11px] text-gray-600 italic tracking-wide">
                Crafted with excellence by Bilal
              </p>

              {/* CTA button */}
              <button
                onClick={onComplete}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40 text-base"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Sparkles className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Enter Workspace</span>
                <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
