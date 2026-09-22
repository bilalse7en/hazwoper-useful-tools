import Link from 'next/link';
import { guidesData } from '@/lib/guides-data';
import { toolInfo, createPageMetadata } from '@/lib/seo';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileText,
  Zap,
} from 'lucide-react';

export const metadata = createPageMetadata({
  title: 'Educational Guides & Technical Manuals | All Useful Tools',
  description:
    'In-depth technical guides and tutorials on automated document extraction, next-generation media optimization, LMS assessment design, and browser security.',
  path: '/guides',
  keywords:
    'technical guides, document extraction guide, WebP optimization, LMS assessment guide, browser security, educational articles',
});

export default function GuidesPage() {
  const guidesSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Educational Guides & Technical Manuals',
    description:
      'In-depth technical guides and tutorials on automated document extraction, next-generation media optimization, LMS assessment design, and browser security.',
    hasPart: guidesData.map((guide) => ({
      '@type': 'Article',
      headline: guide.title,
      description: guide.summary,
      datePublished: guide.datePublished,
      dateModified: guide.dateModified,
      author: {
        '@type': 'Organization',
        name: guide.author.name,
      },
    })),
  };

  return (
    <>
      <script
        id="schema-guides-collection"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guidesSchema) }}
      />

      <div className="min-h-screen bg-background pb-20">
        {/* Hero Section */}
        <section className="relative pt-10 sm:pt-14 md:pt-16 pb-10 sm:pb-12 overflow-hidden border-b border-border bg-card/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Heading & Description */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                <Badge className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-3.5 py-1 rounded-full w-fit">
                  Knowledge Base &amp; Technical Manuals
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                  Engineering <br className="hidden sm:inline" />
                  <span className="text-primary">Guides &amp; Insights</span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-medium max-w-2xl">
                  Evergreen, peer-reviewed educational articles and
                  architectural breakdowns supporting our interactive document,
                  media, and productivity tools.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-xs">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{guidesData.length} Detailed Manuals</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Peer-Reviewed Standards</span>
                  </div>
                </div>
              </div>

              {/* Right: Cubic Knowledge Overview Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          Curriculum Index
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                          Engineering Standards
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[10px] font-bold"
                    >
                      VERIFIED
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                        Manuals Available
                      </span>
                      <span className="text-2xl font-black text-foreground mt-0.5 block">
                        {guidesData.length} Guides
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-medium">
                        Full Technical Depth
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                        Average Read Time
                      </span>
                      <span className="text-2xl font-black text-primary mt-0.5 block">
                        8 Min
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-medium">
                        Actionable Insights
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guides Responsive Cubic Grid */}
        <section className="py-10 sm:py-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {guidesData.map((guide) => (
              <article
                key={guide.slug}
                className="group relative p-5 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl bg-card/50 hover:bg-card border border-border hover:border-primary/40 transition-all shadow-md hover:shadow-xl flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-black text-primary uppercase tracking-wider">
                      {guide.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {guide.readingTime}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(guide.dateModified).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight leading-snug">
                      <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium line-clamp-3">
                      {guide.summary}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-border/50">
                  {/* Related Interactive Tools Bar */}
                  {guide.relatedTools?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                        Tools:
                      </span>
                      {guide.relatedTools.map((tSlug) => (
                        <Link
                          key={tSlug}
                          href={`/tools/${tSlug}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-muted/40 hover:bg-primary/10 hover:text-primary border border-border text-[10px] font-bold transition-colors"
                        >
                          <Zap className="w-3 h-3 text-primary" />
                          {toolInfo[tSlug]?.name || tSlug}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs font-bold text-muted-foreground">
                      By {guide.author.name}
                    </div>
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary hover:underline group-hover:translate-x-1 transition-transform"
                    >
                      Read Guide
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
