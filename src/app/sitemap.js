import { toolMetadata } from '@/lib/seo';
import { blogPosts } from '@/lib/blog-data';
import { guidesData } from '@/lib/guides-data';
import { getCanonicalUrl } from '@/lib/site-config';

export default async function sitemap() {
  const now = new Date().toISOString();

  // 1. Core Public Static Pages — high priority for main entry points
  const staticRoutes = [
    { path: '', changeFrequency: 'daily', priority: 1.0 },
    { path: '/tools', changeFrequency: 'daily', priority: 0.95 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/guides', changeFrequency: 'weekly', priority: 0.85 },
    { path: '/blog', changeFrequency: 'daily', priority: 0.85 },
    { path: '/courses', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/disclaimer', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/cookies', changeFrequency: 'yearly', priority: 0.3 },
  ].map((item) => ({
    url: getCanonicalUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // 2. Interactive Tool Pages — these are the money pages, highest priority
  const toolSlugs = Object.keys(toolMetadata).filter(
    (slug) => slug !== 'privacy' && slug !== 'terms' && slug !== 'cookies'
  );
  const toolPages = toolSlugs.map((slug) => ({
    url: getCanonicalUrl(`/tools/${slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // 3. Educational Guide Pages
  const guidePages = guidesData.map((guide) => ({
    url: getCanonicalUrl(`/guides/${guide.slug}`),
    lastModified: guide.dateModified ? guide.dateModified.split('T')[0] : now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // 4. Dynamic Blog Post Pages
  const blogPages = blogPosts.map((post) => ({
    url: getCanonicalUrl(`/blog/${post.slug}`),
    lastModified: post.date ? new Date(post.date).toISOString() : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...toolPages, ...guidePages, ...blogPages];
}
