'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Target,
  Users,
  Code,
  Award,
  Landmark,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AboutPageClient() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-14 md:pt-16 pb-10 sm:pb-12 overflow-hidden border-b border-border bg-card/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading & Mission */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-4 sm:space-y-5"
            >
              <Badge className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-3.5 py-1 rounded-full w-fit">
                Since 2024 • Global Utility Ecosystem
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                Pioneering <br className="hidden sm:inline" />
                <span className="text-primary italic">Universal Tools.</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-medium max-w-2xl">
                All Useful Tools was born from a simple mission: to build a
                fast, private, browser-first workstation for document
                management, media conversion, and content automation without
                paywalls or unnecessary subscriptions.
              </p>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Local First Security</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-xs">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Zero Server Bottlenecks</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-xs">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Worldwide Access</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Platform Architecture & Velocity Matrix */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        Platform Velocity
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                        Performance Telemetry
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[10px] font-bold"
                  >
                    ● 99.9% ACCURACY
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Founded
                    </span>
                    <span className="text-2xl font-black text-foreground mt-0.5 block">
                      2024
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      Built for Scale
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Engine Precision
                    </span>
                    <span className="text-2xl font-black text-primary mt-0.5 block">
                      99.9%
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      Verified Heuristics
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Operations Run
                    </span>
                    <span className="text-2xl font-black text-foreground mt-0.5 block">
                      1M+
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      Browser-Side Tasks
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Global Users
                    </span>
                    <span className="text-2xl font-black text-emerald-500 mt-0.5 block">
                      Active
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      140+ Countries
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Core Values Section */}
      <section className="py-10 sm:py-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Mission */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                Our Mission
              </h2>
              <div className="space-y-4 text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                <p>
                  Our primary objective is to empower creators, developers,
                  educators, and professionals with instant tools that bridge
                  the gap between complex file formats and frictionless digital
                  workflows. We believe online utilities should be accurate,
                  lightning-fast, and completely private.
                </p>
                <p>
                  By shifting compute-heavy tasks like PDF editing, media
                  re-encoding, and OCR directly into your browser, we guarantee
                  zero server latency and 100% data privacy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Founded', val: '2024' },
                { label: 'Engine Accuracy', val: '99.9%' },
                { label: 'Operations Run', val: '1M+' },
                { label: 'Active Users', val: 'Global' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs"
                >
                  <div className="text-xl sm:text-2xl font-black text-primary mb-0.5">
                    {stat.val}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Values Card */}
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card/60 border border-border shadow-xl space-y-6 relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                Core Principles
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5"
              >
                Guiding Foundations
              </Badge>
            </div>

            <div className="space-y-5">
              {[
                {
                  title: 'Security by Design',
                  desc: 'We prioritize local-first processing. Your files and data remain in your browser, always.',
                  icon: Shield,
                },
                {
                  title: 'Technical Excellence',
                  desc: 'Our stack leverages the latest in WebAssembly and Web Workers for peak performance.',
                  icon: Code,
                },
                {
                  title: 'Accessibility First',
                  desc: 'Every tool is optimized for zero-friction usability, responsive design, and SEO visibility.',
                  icon: Users,
                },
              ].map((value, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <value.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-foreground tracking-tight">
                      {value.title}
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Worldwide Banner */}
      <section className="py-10 sm:py-12 border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              Trusted Worldwide
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
              All Useful Tools is the preferred utility suite for developers,
              content creators, students, and businesses worldwide. Our focus
              remains on speed, simplicity, and data privacy.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Infrastructure Section */}
      <section className="py-10 sm:py-14 border-t border-border bg-card/40 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Ecosystem Points */}
            <div className="order-2 lg:order-1">
              <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-muted/30 border border-border space-y-5">
                <h3 className="text-lg sm:text-xl font-black text-foreground">
                  Technical Ecosystem
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3.5 items-start">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                      <span className="text-foreground font-bold">
                        Decentralized Processing:{' '}
                      </span>
                      By leveraging WebAssembly (WASM), we shift heavy
                      conversion and media tasks to the client side, ensuring
                      data privacy and zero upload latency.
                    </p>
                  </div>
                  <div className="flex gap-3.5 items-start">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                      <span className="text-foreground font-bold">
                        Universal File Standards:{' '}
                      </span>
                      Our engines support modern video, audio, image, and PDF
                      standards for clean, cross-platform compatibility.
                    </p>
                  </div>
                  <div className="flex gap-3.5 items-start">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                      <span className="text-foreground font-bold">
                        Seamless Integration:{' '}
                      </span>
                      Every tool output is clean, semantically valid, and ready
                      for instant export, copy-to-clipboard, or direct download.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Architectural Statement */}
            <div className="order-1 lg:order-2 space-y-4">
              <Badge className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-widest text-[10px] px-3.5 py-1 rounded-full w-fit">
                Foundations
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-foreground">
                Architectural <br className="hidden sm:inline" />
                <span className="text-primary">Integrity &amp; Scale.</span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium leading-relaxed">
                We didn&apos;t just build a set of tools; we built a
                professional engineering environment. Our platform is designed
                to handle heavy workflows while providing the simplicity and
                instant responsiveness of a modern web application.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact Section */}
      <section className="py-10 sm:py-14 border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-card/60 border border-border shadow-xl space-y-6">
            <div className="max-w-2xl space-y-2">
              <Badge
                variant="outline"
                className="px-3.5 py-1 rounded-full border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest bg-primary/5"
              >
                Forward Vision
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
                Commitment to{' '}
                <span className="text-primary">Universal Productivity</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  As we look toward the future of web applications, All Useful
                  Tools remains committed to providing accessible,
                  high-performance tools for everyone. We believe that powerful
                  utilities should be freely available and respect user privacy
                  at every interaction.
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  Our roadmap includes expanded format converters, advanced
                  AI-assisted enhancements, and faster processing pipelines.
                  Join the thousands of users worldwide who have streamlined
                  their daily tasks with our suite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
