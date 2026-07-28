import { blogPosts as staticBlogs } from '@/lib/blog-data';
import { BlogPostClient } from '@/components/blog-post-client';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getPost(slug) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://gyglsbmpxopaoeljoofp.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseAnonKey && supabaseAnonKey !== 'sb_publishable_placeholder') {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/blogs?slug=eq.${encodeURIComponent(
          slug
        )}&select=*`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          next: { revalidate: 3600 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return data[0];
        }
      }
    }
  } catch (err) {
    console.error('Error fetching blog post from Supabase:', err);
  }

  // Fallback to static
  return staticBlogs.find((p) => p.slug === slug) || null;
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Article Not Found | Content Suite',
      description: 'The requested safety training article was not found page.',
    };
  }

  return {
    title: `${post.title} | Content Suite Neural Insights`,
    description:
      post.description ||
      'Safety documentation insights, training materials, and HAZWOPER/OSHA guidelines.',
    keywords: `${post.category?.toLowerCase() || 'safety'}, hazwoper, osha guidelines, industrial training, safety tech`,
    alternates: {
      canonical: `https://hazwoper-useful-tools.vercel.app/blog/${params.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);

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

  return <BlogPostClient post={post} />;
}
