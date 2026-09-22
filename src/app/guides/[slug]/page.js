import { notFound } from 'next/navigation';
import Link from 'next/link';
import { guidesData, getGuideBySlug } from '@/lib/guides-data';
import { toolInfo, createPageMetadata } from '@/lib/seo';
import { getCanonicalUrl, getSiteUrl, SITE_CONFIG } from '@/lib/site-config';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Zap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AdPlacement } from '@/components/ad-placement';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return createPageMetadata({
    title: guide.title,
    description: guide.summary,
    path: `/guides/${slug}`,
    keywords: `${guide.category}, ${guide.title}, technical guide, tutorial, all useful tools`,
  });
}

export async function generateStaticParams() {
  return guidesData.map((guide) => ({
    slug: guide.slug,
  }));
}

export default async function GuideDetailPage({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const canonicalUrl = getCanonicalUrl(`/guides/${slug}`);
  const siteUrl = getSiteUrl();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.summary,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    author: {
      '@type': 'Organization',
      name: guide.author.name,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: siteUrl,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: `${siteUrl}/guides`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        id={`schema-article-${slug}`}
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        id={`schema-breadcrumb-guide-${slug}`}
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-background pb-32">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-8"
          >
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/guides"
              className="hover:text-primary transition-colors"
            >
              Guides
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-xs">
              {guide.category}
            </span>
          </nav>

          {/* Article Header */}
          <header className="space-y-4 pb-6 sm:pb-8 border-b border-border">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
              {guide.category}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
              {guide.title}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
              {guide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>{guide.author.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Updated{' '}
                  {new Date(guide.dateModified).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{guide.readingTime}</span>
              </div>
            </div>
          </header>

          <AdPlacement type="top-banner" className="my-6" />

          {/* Table of Contents */}
          <div className="my-6 sm:my-8 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-muted/20 border border-border space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
              Table of Contents
            </h2>
            <ul className="space-y-2 text-sm font-medium">
              {guide.sections.map((sec, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-primary font-bold text-xs">
                    {idx + 1}.
                  </span>
                  <a
                    href={`#section-${idx}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {sec.heading}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Article Body Sections */}
          <article className="space-y-12 leading-relaxed">
            {guide.sections.map((sec, idx) => (
              <section
                key={idx}
                id={`section-${idx}`}
                className="space-y-4 scroll-mt-24"
              >
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  {sec.heading}
                </h2>
                <div className="text-muted-foreground font-medium leading-relaxed whitespace-pre-line space-y-4 text-base md:text-lg">
                  {sec.content}
                </div>
              </section>
            ))}
          </article>

          <AdPlacement type="in-content" className="my-12" />

          {/* Connected Tools CTA Block */}
          {guide.relatedTools?.length > 0 && (
            <div className="mt-10 sm:mt-12 p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card/60 border border-primary/20 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">
                    Try the Interactive Tools Mentioned
                  </h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    Free • Browser-Based • Zero Installation
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {guide.relatedTools.map((tSlug) => {
                  const t = toolInfo[tSlug];
                  return (
                    <Link
                      key={tSlug}
                      href={`/tools/${tSlug}`}
                      className="p-4 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all group block space-y-2"
                    >
                      <span className="text-2xl block">{t?.icon || '⚡'}</span>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {t?.name || tSlug}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {t?.description}
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 pt-1">
                        Launch Tool →
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Back */}
          <div className="mt-16 pt-8 border-t border-border flex justify-between items-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              All Guides
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors"
            >
              Browse 20+ Tools
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <AdPlacement type="footer" className="mt-12" />
        </div>
      </div>
    </>
  );
}
