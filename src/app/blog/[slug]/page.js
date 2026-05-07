
import Link from "next/link";
import { blogPosts } from "@/lib/blog-data";
import { notFound } from "next/navigation";
import { AdSenseAd } from "@/components/adsense-ad";
import { Calendar, User, Clock, ChevronLeft, Share2 } from "lucide-react";

export async function generateMetadata({ params }) {
  const { slug } = params;
  const post = blogPosts.find((p) => p.slug === slug);
  
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: `${post.title} | Content Suite Blog`,
    description: post.description,
  };
}

export default function BlogPostPage({ params }) {
  const { slug } = params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-background pb-24">
      {/* Article Header */}
      <div className="relative border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-16 max-w-4xl relative z-10">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all mb-8 font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Insights
          </Link>
          
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest">
              {post.category}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {post.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> {post.readTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12 max-w-4xl">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1">
            {/* Top Ad */}
            <div className="mb-12 flex justify-center">
              <AdSenseAd 
                slot="9491607826" 
                format="horizontal"
                style={{ width: '100%', minHeight: '90px' }}
              />
            </div>

            {/* Content Area */}
            <div className="prose prose-slate lg:prose-xl max-w-none dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary hover:prose-a:opacity-80 transition-opacity prose-img:rounded-[32px] prose-img:shadow-2xl">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* Bottom Ad */}
            <div className="mt-16 py-12 border-t border-border flex justify-center">
              <AdSenseAd 
                slot="9491607826" 
                format="rectangle"
                style={{ width: '100%', minHeight: '250px' }}
              />
            </div>

            {/* Footer / Share */}
            <div className="mt-12 p-8 rounded-3xl bg-muted/30 border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg">Share this article:</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <button key={i} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1">
                      <Share2 className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              <Link href="/blog" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                Read More Articles
              </Link>
            </div>
          </div>

          {/* Sidebar / Related (Optional) */}
          <aside className="w-full lg:w-64 space-y-8">
            <div className="sticky top-8">
              <div className="p-8 rounded-[32px] bg-primary text-primary-foreground space-y-4 shadow-xl shadow-primary/20">
                <h3 className="font-black text-xl leading-tight">Ready to try these tools?</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  Start optimizing your training workflow with our specialized suite of generators.
                </p>
                <Link 
                  href="/" 
                  className="block w-full py-3 bg-white text-primary rounded-xl font-bold text-center hover:bg-slate-100 transition-colors mt-4"
                >
                  Launch App
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
