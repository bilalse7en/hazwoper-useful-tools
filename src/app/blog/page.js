'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  RefreshCw,
  Mail,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  Video,
  Wand2,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { blogPosts as staticBlogs } from '@/lib/blog-data';
import { cn } from '@/lib/utils';
import { MagneticCapsuleDock } from '@/components/ui/magnetic-capsule-dock';

const POSTS_PER_PAGE = 9;

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function fetchBlogs() {
      setLoading(true);
      try {
        const from = (currentPage - 1) * POSTS_PER_PAGE;
        const to = from + POSTS_PER_PAGE - 1;

        const { data, error, count } = await supabase
          .from('blogs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          setBlogs(data);
          setTotalCount(count || data.length);
        } else {
          // Fallback to static blogs for demo/initial state
          setBlogs(staticBlogs.slice(from, from + POSTS_PER_PAGE));
          setTotalCount(staticBlogs.length);
        }
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setBlogs(staticBlogs.slice(0, POSTS_PER_PAGE));
        setTotalCount(staticBlogs.length);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const blogCategories = [
    { id: 'All', label: 'All Articles', icon: Sparkles },
    { id: 'Document Utilities', label: 'Document & PDF', icon: FileText },
    { id: 'Media Conversion', label: 'Media & Video', icon: Video },
    { id: 'AI & Machine Learning', label: 'AI & Automation', icon: Wand2 },
    {
      id: 'Security & Privacy',
      label: 'Security & Privacy',
      icon: ShieldCheck,
    },
  ];

  const displayedBlogs = useMemo(() => {
    if (selectedCategory === 'All') return blogs;
    return blogs.filter((b) => {
      const cat = (b.category || '').toLowerCase();
      if (selectedCategory === 'Document Utilities') {
        return (
          cat.includes('document') ||
          cat.includes('pdf') ||
          cat.includes('extractor') ||
          cat.includes('word')
        );
      }
      if (selectedCategory === 'Media Conversion') {
        return (
          cat.includes('media') ||
          cat.includes('conversion') ||
          cat.includes('video') ||
          cat.includes('audio') ||
          cat.includes('image')
        );
      }
      if (selectedCategory === 'AI & Machine Learning') {
        return (
          cat.includes('ai') ||
          cat.includes('learning') ||
          cat.includes('neural') ||
          cat.includes('automation')
        );
      }
      if (selectedCategory === 'Security & Privacy') {
        return (
          cat.includes('security') ||
          cat.includes('privacy') ||
          cat.includes('local')
        );
      }
      return cat.includes(selectedCategory.toLowerCase());
    });
  }, [blogs, selectedCategory]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <section className="relative pt-10 sm:pt-14 md:pt-16 pb-10 sm:pb-12 overflow-hidden border-b border-border bg-card/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading & Description */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Engine
                </Link>

                <div className="space-y-3">
                  <Badge className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-3.5 py-1 rounded-full w-fit">
                    Editorial Archive &amp; Insights
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
                    Articles &amp;{' '}
                    <span className="text-primary">Insights</span>
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">
                    Deep dives into document utilities, media conversion
                    techniques, and modern online productivity workflows.
                  </p>
                </div>
              </div>

              {/* Right Column: Editorial Desk Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-card/60 backdrop-blur-xl border border-border shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          Editorial Desk
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                          Verified Research
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[10px] font-bold"
                    >
                      LIVE REPOSITORY
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                        Published Insights
                      </span>
                      <span className="text-2xl font-black text-foreground mt-0.5 block">
                        {totalCount || 10}+
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-medium">
                        Technical Analyses
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                        Publication Cadence
                      </span>
                      <span className="text-2xl font-black text-primary mt-0.5 block">
                        Weekly
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-medium">
                        Continuous Updates
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Category Filter Dock */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-8 pb-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
            <MagneticCapsuleDock
              items={blogCategories}
              activeId={selectedCategory}
              onChange={setSelectedCategory}
              layoutId="blog-category-filter-dock"
            />
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <span>
                Showing{' '}
                <strong className="text-foreground">
                  {displayedBlogs.length}
                </strong>{' '}
                of{' '}
                <strong className="text-foreground">
                  {totalCount || blogs.length}
                </strong>{' '}
                articles
              </span>
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-10 sm:py-14">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {Array(9)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-[380px] rounded-2xl sm:rounded-3xl bg-muted/40 animate-pulse"
                  />
                ))}
            </div>
          ) : displayedBlogs.length === 0 ? (
            <div className="py-16 text-center rounded-2xl sm:rounded-3xl border border-dashed border-border bg-card/20 space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <h3 className="font-bold text-base text-foreground">
                No matching articles found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try selecting another category or reset your filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl mt-2 text-xs font-bold"
                onClick={() => setSelectedCategory('All')}
              >
                Reset Category
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {displayedBlogs.map((post, index) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className="group flex flex-col h-full bg-card/40 backdrop-blur-xl border border-border hover:border-primary/40 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <div className="h-48 bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-black/30 z-10 pointer-events-none" />
                    <Image
                      src={
                        post.image_url ||
                        `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800&h=600&sig=${index}`
                      }
                      alt={post.title}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-70"
                      unoptimized
                    />
                    <div className="absolute top-4 left-4 z-20">
                      <Badge className="bg-background/90 backdrop-blur-md text-foreground border border-border font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-lg">
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{post.read_time || post.readTime}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>

                      <p className="text-xs sm:text-sm text-muted-foreground font-medium line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        {post.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black uppercase text-xs">
                          {post.author?.charAt(0) || 'C'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-foreground uppercase tracking-tight">
                            {post.author}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase">
                            Editorial
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="h-10 w-10 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center group/btn shadow-2xs"
                      >
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 sm:mt-12 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-10 w-10 rounded-xl border-border bg-card/40 hover:bg-primary/10 hover:text-primary transition-all shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      'h-10 min-w-10 px-3 rounded-xl font-black text-xs transition-all shadow-xs',
                      currentPage === i + 1
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'border-border bg-card/40 hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-10 w-10 rounded-xl border-border bg-card/40 hover:bg-primary/10 hover:text-primary transition-all shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Newsletter / CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-10 sm:py-14">
          <div className="relative rounded-2xl sm:rounded-3xl bg-slate-950 p-6 sm:p-8 md:p-10 overflow-hidden border border-white/10 shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-125 rotate-12 pointer-events-none">
              <Sparkles className="w-48 h-48 text-white" />
            </div>
            <div className="relative z-10 max-w-2xl space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-fit">
                  Technical Dispatch
                </Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  Stay updated on modern{' '}
                  <span className="text-primary">productivity tools.</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                  Join our professional circle for early access to neural
                  updates, compliance guides, and advanced client-side
                  automation workflows.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md pt-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="Enter your email address..."
                    className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/15 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
                <Button className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider text-xs shadow-md">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
