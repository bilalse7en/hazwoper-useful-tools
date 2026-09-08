'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InteractiveBlogRenderer } from '@/components/interactive-blog-game';
import { BlogGamesSection } from '@/components/blog-games-section';
import { BlogFaqSection } from '@/components/blog-faq-section';
import { useState } from 'react';
import { showToast } from '@/lib/swal';

export function BlogPostClient({ post }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24">
        {/* Article Header */}
        <header className="relative pt-24 pb-14 overflow-hidden border-b border-border bg-gradient-to-b from-muted/20 via-transparent to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_50%)]" />
          <div className="container relative z-10 mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-8 text-center md:text-left">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Archive
              </Link>

              <div className="space-y-6">
                <Badge className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full mx-auto md:mx-0 flex w-fit shadow-xs">
                  {post.category || 'Engineering Insight'}
                </Badge>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.08] text-foreground">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2 text-xs font-black uppercase tracking-widest text-muted-foreground/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase shadow-inner border border-primary/20">
                      {post.author?.charAt(0) || 'S'}
                    </div>
                    <span className="text-foreground">
                      {post.author || 'Se7eN Bot Autopilot'}
                    </span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-border md:block hidden" />
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {post.date}
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-border md:block hidden" />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {post.read_time || post.readTime || '6 min read'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Feature Image (faded/gradient treatment — title stays HTML for accuracy) */}
        {post.image_url && (
          <section className="container mx-auto px-6 pt-12">
            <div className="max-w-4xl mx-auto relative aspect-video rounded-[32px] overflow-hidden shadow-2xl border border-border bg-muted/20">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                priority
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
            </div>
          </section>
        )}

        {/* Content Section */}
        <section className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-16">
            {/* Article Content & Interactive Renderer */}
            <article className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-foreground prose-p:text-muted-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-black prose-a:text-primary hover:prose-a:opacity-80 prose-img:rounded-3xl prose-img:shadow-2xl">
              <InteractiveBlogRenderer content={post.content} />
            </article>

            {/* Sidebar / Actions */}
            <aside className="space-y-12">
              <div className="sticky top-24 space-y-10">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-primary" /> Share
                    Article
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl justify-start gap-3 border-border hover:bg-primary/5 hover:text-primary transition-all group"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                              window.location.href
                            )}`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                        <Facebook className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider">
                        Facebook
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl justify-start gap-3 border-border hover:bg-primary/5 hover:text-primary transition-all group"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open(
                            `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                              window.location.href
                            )}&text=${encodeURIComponent(post.title)}`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                        <Twitter className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider">
                        Twitter / X
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl justify-start gap-3 border-border hover:bg-primary/5 hover:text-primary transition-all group"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.open(
                            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                              window.location.href
                            )}`,
                            '_blank'
                          );
                        }
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-700/10 flex items-center justify-center text-blue-700">
                        <Linkedin className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider">
                        LinkedIn
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl justify-start gap-3 border-border hover:bg-primary/5 hover:text-primary transition-all group"
                      onClick={handleCopyLink}
                    >
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {copied ? 'Link Copied' : 'Copy Link'}
                      </span>
                    </Button>
                  </div>
                </div>

                <div className="p-6 rounded-[28px] bg-primary/5 border border-primary/15 space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> All Useful Tools
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-foreground">
                    Try Our 21+ Digital Tools
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Explore our browser-first PDF editor, AI course creator,
                    audio/video converters, and HTML cleaners with 100% privacy.
                  </p>
                  <Button
                    size="sm"
                    className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[9px]"
                    asChild
                  >
                    <Link href="/tools">Explore Tools</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </section>
        {/* Interactive Games (exactly 3, generated from this article) */}
        <section className="container mx-auto px-6 pb-8">
          <div className="max-w-4xl mx-auto">
            <BlogGamesSection games={post.games} />
          </div>
        </section>

        {/* FAQ (exactly 5, generated from this article) */}
        <section className="container mx-auto px-6 pb-16">
          <div className="max-w-4xl mx-auto">
            <BlogFaqSection faq={post.faq} title={post.title} />
          </div>
        </section>
      </main>

      {/* Global CSS Styling for Blog Post Content Design */}
      <style jsx global>{`
        /* 1. Pro Quote Card Styling */
        .pro-quote {
          position: relative;
          margin: 2.5rem 0;
          padding: 1.75rem 2rem 1.75rem 2.5rem;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.08) 0%,
            rgba(16, 185, 129, 0.04) 100%
          );
          border-left: 4px solid #3b82f6;
          border-radius: 0 24px 24px 0;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
          font-style: normal !important;
        }
        .pro-quote p {
          font-size: 1.125rem;
          line-height: 1.7;
          color: #f1f5f9;
          font-weight: 600;
          margin-bottom: 0.75rem !important;
        }
        .pro-quote cite {
          display: block;
          font-size: 0.8125rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #94a3b8;
          font-style: normal;
        }

        /* 2. Responsive Comparison & Data Tables */
        .table-container {
          display: block;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin: 2.5rem 0;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          box-shadow: 0 12px 36px -10px rgba(0, 0, 0, 0.5);
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.875rem;
          margin-bottom: 0 !important;
        }
        .data-table th {
          background: rgba(30, 41, 59, 0.9);
          color: #f8fafc;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          padding: 1rem 1.25rem;
          border-bottom: 2px solid rgba(59, 130, 246, 0.4);
          white-space: nowrap;
        }
        .data-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }
        .data-table tbody tr:hover {
          background: rgba(59, 130, 246, 0.06);
        }
        .data-table tbody tr:last-child td {
          border-bottom: none;
        }
        .badge-success {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.625rem;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          font-size: 0.75rem;
          font-weight: 800;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* 3. Callout Cards & Pro Tips */
        .callout-card {
          margin: 2rem 0;
          padding: 1.5rem;
          border-radius: 20px;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.3);
        }
        .callout-card.tip {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .callout-card .card-title {
          font-size: 0.875rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #60a5fa;
          margin-bottom: 0.5rem;
        }
        .callout-card p {
          margin: 0 !important;
          font-size: 0.9375rem;
          color: #e2e8f0;
          line-height: 1.6;
        }

        /* 4. Step Cards */
        .step-card {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          margin: 1.5rem 0;
          padding: 1.25rem 1.5rem;
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .step-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.35rem 0.75rem;
          border-radius: 12px;
          background: #3b82f6;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .step-body h4 {
          margin: 0 0 0.35rem 0 !important;
          font-size: 1.05rem;
          font-weight: 800;
          color: #f8fafc;
        }
        .step-body p {
          margin: 0 !important;
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.6;
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-6px);
          }
          40%,
          80% {
            transform: translateX(6px);
          }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
}
