import { toolMetadata } from '@/lib/seo';
import { blogPosts } from '@/lib/blog-data';
import { guidesData } from '@/lib/guides-data';
import { getCanonicalUrl } from '@/lib/site-config';

export default async function sitemap() {
  const currentDate = new Date().toISOString().split('T')[0];

  // 1. Core Public Static Pages
  const staticRoutes = [
    { path: '', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/tools', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/guides', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/disclaimer', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/cookies', changeFrequency: 'yearly', priority: 0.5 },
  ].map((item) => ({
    url: getCanonicalUrl(item.path),
    lastModified: currentDate,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // 2. Interactive Tool Pages (21 tools)
  const toolSlugs = Object.keys(toolMetadata);
  const toolPages = toolSlugs.map((slug) => ({
    url: getCanonicalUrl(`/tools/${slug}`),
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // 3. Educational Guide Pages
  const guidePages = guidesData.map((guide) => ({
    url: getCanonicalUrl(`/guides/${guide.slug}`),
    lastModified: guide.dateModified
      ? guide.dateModified.split('T')[0]
      : currentDate,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // 4. Dynamic Blog Post Pages
  const blogPages = blogPosts.map((post) => ({
    url: getCanonicalUrl(`/blog/${post.slug}`),
    lastModified: post.date
      ? new Date(post.date).toISOString().split('T')[0]
      : currentDate,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...toolPages, ...guidePages, ...blogPages];
}
