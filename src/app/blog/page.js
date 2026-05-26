'use client';

import { useEffect, useState, Suspense } from 'react';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { blogPosts as staticBlogs } from '@/lib/blog-data';

const POSTS_PER_PAGE = 10;

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden border-b border-border">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          </div>

          <div className="container relative z-10 mx-auto px-6">
            <div className="max-w-3xl space-y-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Engine
              </Link>

              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full">
                  Editorial Archive
                </Badge>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  Neural <span className="text-primary">Insights</span>
                </h1>
                <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
                  Deep dives into HAZWOPER automation, safety technical
                  standards, and the future of industrial safety education.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="container mx-auto px-6 py-20">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-[450px] rounded-[32px] bg-muted animate-pulse"
                  />
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((post, index) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex flex-col h-full bg-card/40 backdrop-blur-xl border border-border hover:border-primary/30 rounded-[32px] overflow-hidden transition-all duration-500 shadow-xl"
                >
                  <div className="h-56 bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-black/20" />
                    <Image
                      src={
                        post.image_url ||
                        `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800&h=600&sig=${index}`
                      }
                      alt={post.title}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                      unoptimized
                    />
                    <div className="absolute top-6 left-6">
                      <Badge className="bg-background/90 backdrop-blur-md text-foreground border-none font-bold text-[10px] uppercase px-3">
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
                      <Clock className="w-3.5 h-3.5" />
                      {post.read_time || post.readTime}
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>{post.date}</span>
                    </div>

                    <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-sm text-muted-foreground font-medium mb-8 line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>

                    <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase shadow-inner">
                          {post.author?.charAt(0) || 'C'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {post.author}
                          </span>
                          <span className="text-[9px] text-muted-foreground/60 font-bold uppercase">
                            Editorial
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="h-12 w-12 rounded-2xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center group/btn shadow-sm"
                      >
                        <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="h-12 w-12 rounded-2xl border-border bg-card/40"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(i + 1)}
                    className="h-12 w-12 rounded-2xl font-bold"
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
                className="h-12 w-12 rounded-2xl border-border bg-card/40"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </section>

        {/* Newsletter / CTA */}
        <section className="container mx-auto px-6 pt-12 pb-24">
          <div className="relative rounded-[48px] bg-slate-950 p-12 md:p-24 overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 p-24 opacity-5 scale-150 rotate-12">
              <Sparkles className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 max-w-2xl space-y-8">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Stay updated on the latest{' '}
                <span className="text-primary">safety tech.</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Join our professional circle for early access to neural updates,
                compliance guides, and advanced automation workflows.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    placeholder="Enter your email..."
                    className="w-full h-14 pl-12 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs">
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
