'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toolIdToSlug, toolInfo } from '@/lib/seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MagneticCapsuleDock } from '@/components/ui/magnetic-capsule-dock';
import {
  ArrowRight,
  Sparkles,
  Layout,
  FileText,
  BookOpen,
  Search,
  Code,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Wand2,
  ShieldCheck,
  Zap,
  Target,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const iconMap = {
  course: Layout,
  blog: FileText,
  glossary: BookOpen,
  resources: Search,
  'html-cleaner': Code,
  'image-converter': ImageIcon,
  'video-compressor': Video,
  'ai-assistant': MessageSquare,
  'image-to-text': Wand2,
  'document-extractor': FileText,
  'video-converter': Zap,
  'audio-converter': Zap,
  'video-to-gif': Video,
  'word-to-html': FileText,
  'lesson-quiz-builder': Target,
  'youtube-downloader': Video,
  'watermark-remover': Wand2,
  'bg-remover': Wand2,
  'pdf-editor': FileText,
};

const categoryItems = [
  { id: 'All', label: 'All Tools', icon: Sparkles },
  { id: 'Media & Conversion', label: 'Media & Conversion', icon: Video },
  { id: 'Document & PDF', label: 'Document & PDF', icon: FileText },
  { id: 'Content & AI', label: 'Content & AI', icon: Wand2 },
  { id: 'Developer & Web', label: 'Developer & Web', icon: Code },
];

export function ToolsDirectoryClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const allTools = useMemo(() => {
    return Object.entries(toolIdToSlug).map(([id, slug]) => ({
      id,
      slug,
      ...toolInfo[slug],
    }));
  }, []);

  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        tool.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.detailedDescription
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'All' ||
        (tool.category || '').toLowerCase() ===
          selectedCategory.toLowerCase() ||
        (selectedCategory === 'Media & Conversion' &&
          (tool.category?.toLowerCase().includes('media') ||
            tool.category?.toLowerCase().includes('conversion') ||
            tool.category?.toLowerCase().includes('audio') ||
            tool.category?.toLowerCase().includes('video') ||
            tool.category?.toLowerCase().includes('image'))) ||
        (selectedCategory === 'Document & PDF' &&
          (tool.category?.toLowerCase().includes('document') ||
            tool.category?.toLowerCase().includes('pdf') ||
            tool.category?.toLowerCase().includes('extractor'))) ||
        (selectedCategory === 'Content & AI' &&
          (tool.category?.toLowerCase().includes('ai') ||
            tool.category?.toLowerCase().includes('generator') ||
            tool.category?.toLowerCase().includes('content'))) ||
        (selectedCategory === 'Developer & Web' &&
          (tool.category?.toLowerCase().includes('developer') ||
            tool.category?.toLowerCase().includes('html') ||
            tool.category?.toLowerCase().includes('web')));

      return matchesSearch && matchesCat;
    });
  }, [allTools, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-14 md:pt-16 pb-10 sm:pb-12 overflow-hidden border-b border-border bg-muted/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading & Description */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <Badge
                variant="secondary"
                className="px-3.5 py-1 rounded-full bg-primary/10 text-primary border-primary/20 flex items-center gap-2 w-fit"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground opacity-80">
                  Universal Utility Matrix
                </span>
              </Badge>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                Professional <br className="hidden sm:inline" />
                <span className="text-primary">Tool Directory</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-medium max-w-2xl">
                Explore our comprehensive suite of automated content generation,
                document management, and media optimization tools. Engineered
                for privacy, zero upload latency, and high-performance browser
                execution.
              </p>

              {/* Trust badges */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>100% Client-Side WASM</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-xs">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>Zero Data Storage</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-xs">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>{allTools.length}+ Active Tools</span>
                </div>
              </div>
            </div>

            {/* Right Column: Cubic Directory Matrix Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs">
                      <Layout className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        Ecosystem Overview
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                        Real-time Registry
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[10px] font-bold"
                  >
                    ● ALL SYSTEMS OPERATIONAL
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Total Utilities
                    </span>
                    <span className="text-2xl font-black text-foreground mt-0.5 block">
                      {allTools.length} Units
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      Browser-Native
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Security Engine
                    </span>
                    <span className="text-2xl font-black text-primary mt-0.5 block">
                      Local
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      Zero Upload
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Execution Speed
                    </span>
                    <span className="text-2xl font-black text-foreground mt-0.5 block">
                      &lt; 50ms
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      WASM Accelerators
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      License
                    </span>
                    <span className="text-2xl font-black text-emerald-500 mt-0.5 block">
                      Free
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">
                      No Subscription
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Filter & Grid Section */}
      <section className="py-10 sm:py-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8">
        {/* Search and Category Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search tools by name, features, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl sm:rounded-2xl border-border bg-card shadow-2xs text-xs font-medium"
            />
          </div>

          {/* Results Counter */}
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span>
              Showing{' '}
              <strong className="text-foreground">
                {filteredTools.length}
              </strong>{' '}
              of <strong className="text-foreground">{allTools.length}</strong>{' '}
              tools
            </span>
          </div>
        </div>

        {/* Category Pills using Magnetic Floating Capsule Dock */}
        <div className="pb-1">
          <MagneticCapsuleDock
            items={categoryItems}
            activeId={selectedCategory}
            onChange={setSelectedCategory}
            layoutId="tools-directory-category-dock"
          />
        </div>

        {/* Tools Responsive Cubic Grid */}
        {filteredTools.length === 0 ? (
          <div className="py-16 text-center rounded-2xl sm:rounded-3xl border border-dashed border-border bg-card/20 space-y-3">
            <Search className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <h3 className="font-bold text-base text-foreground">
              No matching tools found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search query or reset the category filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl mt-2 text-xs"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredTools.map((tool, index) => {
              const Icon = iconMap[tool.id] || Layout;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(index * 0.03, 0.3),
                  }}
                  className="flex"
                >
                  <div className="group relative w-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/50 hover:bg-card border border-border hover:border-primary/40 transition-all shadow-md hover:shadow-xl">
                    {/* Header: Icon & Category */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-xs">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-black uppercase tracking-wider border-primary/20 text-primary bg-primary/5 px-2.5 py-0.5 rounded-lg"
                          >
                            {tool.category || 'Utility Unit'}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>READY</span>
                          </div>
                        </div>
                      </div>

                      {/* Tool Title & Description */}
                      <div className="space-y-2">
                        <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                          <Link href={`/tools/${tool.slug}`}>{tool.name}</Link>
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed line-clamp-2 sm:line-clamp-3">
                          {tool.detailedDescription || tool.description}
                        </p>
                      </div>

                      {/* Benefits chips */}
                      {tool.benefits && tool.benefits.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tool.benefits.slice(0, 2).map((benefit, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/70 text-[10px] font-semibold text-muted-foreground"
                            >
                              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {benefit}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-5 mt-4 border-t border-border/50 flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="w-full h-11 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                        asChild
                      >
                        <Link href={`/tools/${tool.slug}`}>
                          Launch Tool
                          <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                      <Link
                        href={`/tools/${tool.slug}#documentation`}
                        className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-1"
                      >
                        View Technical Specs
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Corporate Value Addition Section */}
      <section className="py-12 sm:py-16 bg-muted/30 border-t border-border relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-card/60 border border-border shadow-xl space-y-8">
            <div className="max-w-2xl space-y-3">
              <Badge
                variant="outline"
                className="px-3.5 py-1 rounded-full border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest bg-primary/5"
              >
                Zero-Latency Framework
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
                Engineered for{' '}
                <span className="text-primary">Professional Excellence</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                By shifting core processing tasks directly into your local
                browser environment, we eliminate server upload delays, preserve
                confidential data, and maximize throughput.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-muted/20 border border-border space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">
                    Performance-First Design
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  Our suite is built with enterprise standards in mind. Every
                  tool produces clean, optimized outputs that integrate
                  seamlessly into modern workflows, learning platforms, and web
                  deployments.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/20 border border-border space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">
                    Zero-Latency Processing
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  Shifting compute to client-side Web Workers eliminates server
                  queue bottlenecks and ensures complete confidential data
                  protection. Your files never leave your workstation.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Active Tools', val: `${allTools.length}+` },
                { label: 'Uptime SLA', val: '99.9%' },
                { label: 'Tech Stack', val: 'Next.js 16' },
                { label: 'Security Model', val: 'Client-Only' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-muted/30 border border-border/40"
                >
                  <p className="text-xl sm:text-2xl font-black text-primary">
                    {stat.val}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
