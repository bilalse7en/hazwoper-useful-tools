'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { toolIdToSlug, toolInfo } from '@/lib/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
};

export default function ToolsDirectoryPage() {
  const tools = Object.entries(toolIdToSlug).map(([id, slug]) => ({
    id,
    slug,
    ...toolInfo[slug],
  }));

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden border-b border-border bg-muted/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="container relative mx-auto px-6">
          <div className="max-w-3xl">
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary border-primary/20 flex items-center gap-2 w-fit"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground opacity-80">
                Neural Content Ecosystem
              </span>
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-foreground leading-[1.1]">
              Professional <br />
              <span className="text-primary">Tool Directory</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium max-w-2xl">
              Explore our comprehensive suite of automated content generation
              and media optimization units. Each tool is engineered for
              professional safety training, industrial documentation, and
              high-performance web deployment.
            </p>
          </div>
        </div>
      </section>

      {/* Directory List */}
      <section className="py-32 container mx-auto px-6">
        <div className="grid gap-20">
          {tools.map((tool, index) => {
            const Icon = iconMap[tool.id] || Layout;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="group relative grid lg:grid-cols-12 gap-12 items-center p-8 md:p-12 rounded-[50px] bg-card/40 backdrop-blur-3xl border border-border hover:border-primary/30 transition-all shadow-2xl">
                  {/* Icon & Meta */}
                  <div className="lg:col-span-3 flex flex-col items-center lg:items-start gap-8 text-center lg:text-left">
                    <div className="w-24 h-24 rounded-[36px] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-primary-foreground transform group-hover:-rotate-6 transition-transform duration-500">
                      <Icon className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5"
                      >
                        {tool.category || 'Utility Unit'}
                      </Badge>
                      <h3 className="text-sm font-black text-foreground/40 uppercase tracking-tighter">
                        Unit ID: {tool.id.toUpperCase()}
                      </h3>
                    </div>
                  </div>

                  {/* Description & Value */}
                  <div className="lg:col-span-6 space-y-6">
                    <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {tool.name}
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                      {tool.detailedDescription}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {tool.benefits?.slice(0, 3).map((benefit, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-[11px] font-bold text-foreground/80"
                        >
                          <Zap className="w-3 h-3 text-primary" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center gap-6">
                    <div className="text-right hidden lg:block">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">
                        Operational Ready
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-foreground">
                          STABLE
                        </span>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="h-16 px-10 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 border-none transition-all group-hover:scale-[1.05]"
                      asChild
                    >
                      <Link href={`/tools/${tool.slug}`}>
                        Initialize Tool
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>

                  {/* Dynamic background pulse */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[50px]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Corporate Value Addition Section */}
      <section className="py-40 bg-muted/40 border-y border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-black/[0.02] -z-10" />
        <div className="container mx-auto px-6 text-center max-w-4xl space-y-12">
          <Badge
            variant="outline"
            className="px-5 py-2 rounded-full border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest bg-primary/5"
          >
            HAZWOPER Content Architecture
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
            Engineered for <br />
            <span className="text-primary text-glow">
              Professional Excellence
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-12 text-left pt-12">
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-foreground flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-primary" />
                Compliance-First Design
              </h4>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Our suite is built with industrial standards in mind. We
                understand the specific structural requirements of HAZWOPER,
                OSHA, and complex safety training environments. Every tool
                produces semantically accurate HTML5 that integrates seamlessly
                into enterprise LMS platforms.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-foreground flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                Zero-Latency Extraction
              </h4>
              <p className="text-muted-foreground font-medium leading-relaxed">
                By shifting core processing tasks directly into the
                decentralized browser environment, we eliminate server
                bottlenecks and ensure maximum data privacy. Your technical
                documentation remains local while being transformed by our
                high-performance neural extraction logic.
              </p>
            </div>
          </div>

          <div className="pt-20 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Units Active', val: '10+' },
              { label: 'Uptime', val: '99.9%' },
              { label: 'Tech Stack', val: 'NEXT.JS' },
              { label: 'Encryption', val: 'AES-256' },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <p className="text-3xl font-black text-primary">{stat.val}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
