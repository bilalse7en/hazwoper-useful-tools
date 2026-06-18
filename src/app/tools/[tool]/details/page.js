'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  slugToToolId,
  toolInfo,
  generateToolSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo';
import { JsonLd } from '@/components/json-ld';
import { ToolInfo as DetailContent } from '@/components/tool-info';
import { ToolBreadcrumbs } from '@/components/tool-breadcrumbs';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  BookOpen,
  Zap,
  ShieldCheck,
  Globe,
  Cpu,
  Award,
} from 'lucide-react';
import { AdSenseAd } from '@/components/adsense-ad';

export default function ToolDetailsPage({ params: paramsProp }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const toolSlug = params.tool;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || !toolInfo[toolSlug]) return null;

  const allTools = Object.entries(slugToToolId).map(([slug, id]) => ({
    slug,
    id,
    name: toolInfo[slug]?.name || slug,
  }));

  return (
    <>
      <JsonLd data={generateToolSchema(toolSlug)} />
      <JsonLd data={generateBreadcrumbSchema(toolSlug)} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Navigation Between Tool Details */}
          <aside className="lg:w-64 shrink-0 space-y-6">
            <div className="p-6 rounded-[32px] bg-card/40 backdrop-blur-xl border border-border shadow-xl sticky top-24">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Documentation
              </h3>
              <nav className="space-y-1">
                {allTools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tools/${t.slug}/details`}
                    className={cn(
                      'w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between group',
                      toolSlug === t.slug
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                    )}
                  >
                    <span className="truncate">{t.name}</span>
                    {toolSlug === t.slug && (
                      <div className="w-1 h-1 rounded-full bg-primary-foreground" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="hidden lg:block">
              <AdSenseAd
                slot="2228101298"
                format="vertical"
                className="mt-6 rounded-2xl overflow-hidden border border-border/50"
              />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <ToolBreadcrumbs slug={toolSlug} />
                <Link
                  href={`/tools/${toolSlug}`}
                  className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.05] transition-all shadow-lg shadow-primary/20"
                >
                  Launch Tool
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
                    {toolInfo[toolSlug]?.name}
                  </h1>
                  <p className="text-xl text-muted-foreground font-medium mt-2">
                    Technical Specifications & Operational Overview
                  </p>
                </div>
              </div>
            </div>

            {/* The actual detailed content section */}
            <div className="p-1 rounded-[40px] bg-gradient-to-br from-primary/10 via-border/5 to-primary/10">
              <div className="bg-card/40 backdrop-blur-3xl rounded-[38px] border border-white/10 p-8 md:p-12">
                <DetailContent slug={toolSlug} />
              </div>
            </div>

            {/* New: Professional Standard Operating Procedures (SOP) Section to boost content value */}
            <section className="space-y-8">
              <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-8 md:p-12 space-y-6">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  Standard Operating Procedures
                </h2>
                <div className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed">
                  <p>
                    When utilizing the {toolInfo[toolSlug]?.name} in a
                    professional or industrial setting, it is crucial to follow
                    the established technical hierarchy. Our engineering team
                    has optimized this tool to handle complex data
                    interdependencies without compromising the structural
                    integrity of the output.
                  </p>
                  <ul className="grid md:grid-cols-2 gap-4 list-none p-0">
                    <li className="flex gap-3 bg-card/40 p-4 rounded-2xl border border-border">
                      <Zap className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="font-bold text-foreground block mb-1 uppercase text-[10px] tracking-wider">
                          Input Validation
                        </span>
                        Ensure and verify that all source assets meet the Neural
                        Engine&apos;s intake requirements.
                      </div>
                    </li>
                    <li className="flex gap-3 bg-card/40 p-4 rounded-2xl border border-border">
                      <Globe className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="font-bold text-foreground block mb-1 uppercase text-[10px] tracking-wider">
                          Browser Integrity
                        </span>
                        Optimal performance is achieved on Chromium-based
                        engines with hardware acceleration enabled.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* New: Technical Commitment Section */}
            <section className="bg-card/40 border border-border rounded-[40px] p-10 md:p-16 space-y-10">
              <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-6">
                  <h3 className="text-2xl font-black">
                    Our Commitment to <br />
                    Professional Excellence
                  </h3>
                  <div className="prose prose-sm prose-invert max-w-none text-muted-foreground font-medium leading-relaxed">
                    <p>
                      At Content Suite, we understand that technical
                      documentation is the backbone of safety and compliance.
                      That&apos;s why the {toolInfo[toolSlug]?.name} is built to
                      the highest standards of digital precision. Our engineers
                      continuously refine our extraction and conversion
                      algorithms to adapt to the ever-evolving landscape of
                      industrial documentation structures.
                    </p>
                    <p>
                      Whether you are an individual instructor or a large-scale
                      training facility, our goal is to provide you with the
                      most reliable, secure, and efficient tools possible. By
                      automating the repetitive aspects of content migration, we
                      empower you to focus on what matters most: delivering
                      high-quality, life-saving information to your trainees.
                    </p>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-3xl border border-primary/20 p-8 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-black">Quality First</h4>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">
                    Industrial Grade <br /> Reliability
                  </p>
                </div>
              </div>
            </section>

            {/* Bottom Ad Section - Wrapped in a descriptive container per AdSense best practices */}
            <div className="space-y-4">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 ml-4">
                Sponsored Content
              </span>
              <AdSenseAd
                slot="2228101298"
                format="horizontal"
                className="rounded-3xl overflow-hidden ring-1 ring-border/50 bg-muted/5 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
