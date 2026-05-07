
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { blogPosts } from "@/lib/blog-data";
import { ChevronRight, Calendar, User, Clock } from "lucide-react";

export const metadata = {
  title: 'Blog - Content Suite | Expert Insights on Training Development',
  description: 'Read the latest articles on HAZWOPER training development, content automation, and digital workflow optimization.',
};

export default function BlogListPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center space-y-6">
          <Link 
            href="/" 
            className="text-primary hover:text-primary/80 transition-colors mb-4 inline-block font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent pb-2">
            Insights & Guides
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Resources and strategies for professional training developers and content creators.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-card border border-border rounded-[32px] overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
            >
              <div className="p-8 space-y-4 flex-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                  <span className="px-2 py-1 bg-primary/10 rounded-md">{post.category}</span>
                </div>
                <h2 className="text-2xl font-bold group-hover:text-primary transition-colors leading-tight">
                  {post.title}
                </h2>
                <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                  {post.description}
                </p>
              </div>
              
              <div className="px-8 py-6 bg-muted/30 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-primary transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter / CTA */}
        <div className="mt-24 p-12 rounded-[48px] bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Stay Updated</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Get the latest guides and tool updates delivered directly to your inbox. Join our community of professional training developers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
            />
            <button className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
