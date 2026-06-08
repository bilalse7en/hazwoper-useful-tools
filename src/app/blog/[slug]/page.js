'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { blogPosts as staticBlogs } from '@/lib/blog-data';
import { cn } from '@/lib/utils';

export default function BlogPostPage({ params: paramsProp }) {
  const params = useParams();
  const slug = params.slug;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setPost(data);
        } else {
          // Fallback to static
          const staticPost = staticBlogs.find((p) => p.slug === slug);
          setPost(staticPost || null);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        const staticPost = staticBlogs.find((p) => p.slug === slug);
        setPost(staticPost || null);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8">
        <AlertCircle className="w-20 h-20 text-muted-foreground opacity-20" />
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">
            Post Not Located
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The editorial sequence you&apos;ve requested is not present in our
            registry. It may have been archived or relocated.
          </p>
        </div>
        <Button asChild className="h-12 rounded-xl px-8 font-bold">
          <Link href="/blog">Return to Archive</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24">
        {/* Article Header */}
        <header className="relative pt-24 pb-12 overflow-hidden border-b border-border">
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
                <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full mx-auto md:mx-0 flex w-fit">
                  {post.category}
                </Badge>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1]">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase shadow-inner">
                      {post.author?.charAt(0) || 'C'}
                    </div>
                    <span className="text-foreground">{post.author}</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-border md:block hidden" />
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-border md:block hidden" />
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {post.read_time || post.readTime}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-16">
            {/* Article Content */}
            <article className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-foreground prose-p:text-muted-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-black prose-a:text-primary hover:prose-a:opacity-80 prose-img:rounded-3xl prose-img:shadow-2xl">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {/* Sidebar / Actions */}
            <aside className="space-y-12">
              <div className="sticky top-24 space-y-12">
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                    Share Article
                  </h3>
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className="h-12 w-full rounded-2xl justify-start gap-3 border-border hover:bg-primary/5 hover:text-primary transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                        <Facebook className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-widest">
                        Facebook
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 w-full rounded-2xl justify-start gap-3 border-border hover:bg-primary/5 hover:text-primary transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                        <Twitter className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-widest">
                        Twitter
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 w-full rounded-2xl justify-start gap-3 border-border hover:bg-primary/5 hover:text-primary transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-700/10 flex items-center justify-center text-blue-700">
                        <Linkedin className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-widest">
                        LinkedIn
                      </span>
                    </Button>
                  </div>
                </div>

                <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 space-y-6">
                  <h3 className="text-sm font-black tracking-tight text-primary">
                    Need Professional Content?
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Use our AI-powered generators to create course materials,
                    blogs, and technical documentation in seconds.
                  </p>
                  <Button
                    size="sm"
                    className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[9px]"
                    asChild
                  >
                    <Link href="/">Enter Workspace</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
