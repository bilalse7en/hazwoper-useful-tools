'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Clock, User, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { blogPosts as staticBlogs } from '@/lib/blog-data';
import { isLowEnd } from '@/lib/utils';

export function BlogSection() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = useCallback(async () => {
    // Skip remote fetch if using placeholders (common in CI/Build)
    const isPlaceholder =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('sb_') ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (isPlaceholder) {
      setBlogs(staticBlogs.slice(0, 6));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (data && data.length > 0) {
        setBlogs(data);
      } else {
        setBlogs(staticBlogs.slice(0, 6));
      }
    } catch (err) {
      // Don't log full error for common key issues
      if (
        err.message?.includes('API key') ||
        err.message?.includes('Invalid')
      ) {
        console.log('Using local editorial content (Cloud Sync Deferred)');
      } else {
        console.error('Editorial error:', err);
      }
      setBlogs(staticBlogs.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <section id="blog" className="py-24 container mx-auto px-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div className="space-y-4">
          <Badge
            variant="outline"
            className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest"
          >
            <BookOpen className="w-3 h-3 mr-2" />
            Neural Blog
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Professional Editorial
          </h2>
          <p className="text-muted-foreground font-medium max-w-xl leading-relaxed">
            Expert insights on HAZWOPER automation, safety technology, and
            digital compliance strategies.
          </p>
        </div>

        <Button
          variant="outline"
          className="h-12 rounded-xl px-6 border-border hover:bg-primary/5 hover:text-primary transition-all font-bold gap-2 group"
          asChild
        >
          <Link href="/blog">
            Explore All Insights
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading
          ? Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-[400px] rounded-[32px] bg-muted animate-pulse"
                />
              ))
          : blogs.map((post, index) => (
              <motion.div
                key={post.slug}
                initial={isLowEnd() ? false : { opacity: 0, y: 20 }}
                whileInView={isLowEnd() ? false : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex flex-col h-full bg-card/40 backdrop-blur-xl border border-border hover:border-primary/20 rounded-[32px] overflow-hidden transition-all duration-500 shadow-xl hover:shadow-primary/5"
              >
                {/* Image / Gradient Header */}
                <div className="h-48 w-full bg-gradient-to-br from-primary/10 via-muted to-primary/5 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-primary/20 group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none font-bold text-[10px] uppercase tracking-wider px-3">
                      {post.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {post.readTime || post.read_time}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{post.date}</span>
                  </div>

                  <h3 className="text-xl font-black mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {post.title}
                  </h3>

                  <p className="text-sm text-muted-foreground font-medium mb-8 line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {post.author?.charAt(0) || 'C'}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {post.author}
                      </span>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="p-3 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all group/btn"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>
    </section>
  );
}
