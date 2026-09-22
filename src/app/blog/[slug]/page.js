import { blogPosts as staticBlogs } from '@/lib/blog-data';
import { BlogPostClient } from '@/components/blog-post-client';
import Link from 'next/link';
import Script from 'next/script';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/seo';
import { SITE_CONFIG, getSiteUrl, getCanonicalUrl } from '@/lib/site-config';

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
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return createPageMetadata({
      title: 'Article Not Found',
      description: 'The requested article was not found.',
      path: `/blog/${slug}`,
      noindex: true,
    });
  }

  return createPageMetadata({
    title: post.title,
    description:
      post.description ||
      'Productivity insights, tutorials, and online utility guides.',
    path: `/blog/${slug}`,
    keywords: `${post.category?.toLowerCase() || 'utilities'}, online tools, web utilities, productivity`,
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

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

  const siteUrl = getSiteUrl();
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: 'https://gyglsbmpxopaoeljoofp.supabase.co/storage/v1/object/public/media/library/1779796669800-Hi.gif',
      },
    },
    datePublished: post.created_at || '2026-01-01',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getCanonicalUrl(`/blog/${slug}`),
    },
  };

  const faqSchema =
    Array.isArray(post.faq) && post.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <Script
        id={`blog-article-schema-${slug}`}
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <Script
          id={`blog-faq-schema-${slug}`}
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <BlogPostClient post={post} />
    </>
  );
}
