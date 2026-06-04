'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { AdSenseAd } from '@/components/adsense-ad';

export default function ToolDetailsPage({ params }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const unwrappedParams = use(params);
  const toolSlug = unwrappedParams.tool;

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
                slot="6543210987"
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

            {/* Bottom Ad Section */}
            <AdSenseAd
              slot="9876543210"
              format="horizontal"
              className="my-12 rounded-3xl overflow-hidden ring-1 ring-border/50"
            />
          </div>
        </div>
      </div>
    </>
  );
}
