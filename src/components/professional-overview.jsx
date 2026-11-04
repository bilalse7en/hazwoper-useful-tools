'use client';

import { useEffect, useRef } from 'react';
import {
  Cpu,
  BarChart,
  Globe,
  FileCheck,
  Lock,
  Search,
  Zap,
  CheckCircle2,
} from 'lucide-react';

const AI_AUTOMATION_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4';

export function ProfessionalOverview() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {});
  }, []);

  const leftCards = [
    {
      title: 'Proprietary Extraction Logic',
      desc: 'Our neural-enhanced processing engines analyze semantic hierarchy of DOCX and PDF documents to identify critical structures and content blocks.',
      icon: Cpu,
    },
    {
      title: 'Universal Utility Alignment',
      desc: 'Specifically tailored for digital creators and professionals, our tools handle PDF manipulation, media re-encoding, and content conversion with zero friction.',
      icon: FileCheck,
    },
    {
      title: 'SEO-First Architecture',
      desc: 'Every piece of HTML exported by our suite is built with semantic integrity, prioritizing clean heading structures and ARIA accessibility.',
      icon: Search,
    },
  ];

  const rightCards = [
    {
      title: 'Enterprise-Grade Privacy',
      desc: "Security is non-negotiable. Media processing and video compression occur entirely within your browser's runtime. Your proprietary data never touches our servers.",
      icon: Lock,
    },
    {
      title: 'Digital Transformation',
      desc: 'We bridge the gap between legacy static documentation and modern digital platforms. Seamlessly transition thousands of pages into formatted web content.',
      icon: Globe,
    },
    {
      title: 'Analytical Precision',
      desc: 'Monitor tool performance and content accuracy through our advanced administrative telemetry with real-time insight into tool cycles.',
      icon: BarChart,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative bg-background border-t border-border transition-colors duration-300"
    >
      {/* FROZEN / STICKY AI AUTOMATION SYSTEMS BACKGROUND VIDEO */}
      <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none select-none z-0">
        <video
          ref={videoRef}
          src={AI_AUTOMATION_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center opacity-85 dark:opacity-85 dark:brightness-75 dark:contrast-110"
          style={{
            imageRendering: 'high-quality',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* Ambient edge fades preserving center video visibility */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent opacity-85" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent opacity-85" />
        <div className="absolute inset-0 bg-white/[0.03] dark:bg-black/60 pointer-events-none" />
      </div>

      {/* FOREGROUND CONTENT (SCROLLS OVER FROZEN BACKGROUND) */}
      <div className="relative z-10 -mt-[100vh] py-20 sm:py-28 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-[1.12] text-foreground drop-shadow-md">
            Authoritative Utility <br />
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 font-black">
              Ecosystem &amp; Workspace
            </span>
          </h2>

          <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-xs">
            At the intersection of artificial intelligence and professional
            productivity standards, engineered for the rigorous demands of
            digital documentation, media editing, and content generation.
          </p>
        </div>

        {/* CORNER CARDS WITH WIDE OPEN CENTER CHANNEL (Animation Clearly Visible In Between) */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-center mb-16">
          {/* Left Corner Cards Column (3 Cards) */}
          <div className="lg:col-span-4 space-y-5">
            {leftCards.map((item, i) => (
              <div
                key={i}
                className="p-5 sm:p-6 rounded-3xl bg-white/25 dark:bg-black/50 border border-white/35 dark:border-white/15 hover:bg-white/35 hover:dark:bg-black/65 transition-all shadow-xl space-y-3"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-xs">
                  <item.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-foreground/90 dark:text-white/80 font-normal leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Center Open Animation Portal (Allows the background video to shine through in between cards) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 sm:p-8 min-h-[340px] pointer-events-none">
            <div className="w-20 h-20 rounded-full border border-white/30 dark:border-white/20 bg-white/10 dark:bg-black/35 flex items-center justify-center shadow-2xl mb-4">
              <Zap className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/20 dark:bg-black/45 border border-white/30 dark:border-white/15 text-xs font-mono font-bold tracking-wider text-foreground">
              CORE AUTOMATION PORTAL
            </div>
            <p className="text-[11px] text-foreground/80 dark:text-white/70 mt-2 font-mono">
              Live Neural Compute Pipeline
            </p>
          </div>

          {/* Right Corner Cards Column (3 Cards) */}
          <div className="lg:col-span-4 space-y-5">
            {rightCards.map((item, i) => (
              <div
                key={i}
                className="p-5 sm:p-6 rounded-3xl bg-white/25 dark:bg-black/50 border border-white/35 dark:border-white/15 hover:bg-white/35 hover:dark:bg-black/65 transition-all shadow-xl space-y-3"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-xs">
                  <item.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-foreground/90 dark:text-white/80 font-normal leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Long Form Copy for AdSense & SEO */}
        <div className="max-w-5xl mx-auto space-y-10 py-10 sm:py-12 border-t border-white/20 dark:border-white/10">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                The Future of Online Productivity &amp; Content Automation
              </h3>
              <p className="text-xs sm:text-sm text-foreground/85 dark:text-white/80 leading-relaxed font-normal">
                In today&apos;s fast-paced digital landscape, the efficiency of
                technical workflows and content creation is paramount. Legacy
                tools often rely on cumbersome software or inefficient
                &quot;copy-paste&quot; methods that consume hundreds of hours of
                valuable time.
              </p>
              <p className="text-xs sm:text-sm text-foreground/85 dark:text-white/80 leading-relaxed font-normal">
                All Useful Tools is designed to eliminate these bottlenecks. By
                leveraging automated processing protocols, we allow creators,
                professionals, and developers to transform documents, media, and
                code into dynamic, web-optimized resources in seconds.
              </p>
              <ul className="space-y-2.5 pt-2">
                {[
                  'Automated Document and Module Mapping',
                  'Intelligent Glossary and Resource Extraction',
                  'Clean HTML5 and PDF Editing Tools',
                  'Secure Local Browser Media Processing',
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative aspect-square max-w-[340px] mx-auto rounded-3xl bg-white/20 dark:bg-black/45 border border-white/30 dark:border-white/15 shadow-2xl flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/[0.05]" />
              <Zap className="w-32 h-32 text-primary opacity-25 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/30 dark:bg-black/60 rounded-2xl border border-white/35 dark:border-white/15 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground font-mono">
                    System Telemetry
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-white/20 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-emerald-400 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-foreground/80 dark:text-white/70">
                    <span>Active Compute</span>
                    <span>100% Private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfessionalOverview;
