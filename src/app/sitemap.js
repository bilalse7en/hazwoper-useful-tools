import { toolMetadata } from '@/lib/seo';
import { blogPosts } from '@/lib/blog-data';

export default async function sitemap() {
  const baseUrl = 'https://hazwoper-useful-tools.vercel.app';

  // 1. Static Pages
  const staticPages = [
    '',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
    '/blog',
    '/tools',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Dynamic Tool Pages & Tool Technical Details Pages
  const toolSlugs = Object.keys(toolMetadata);
  const toolPages = [];

  toolSlugs.forEach((slug) => {
    // Main tool interface page
    toolPages.push({
      url: `${baseUrl}/tools/${slug}`,
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'monthly',
      priority: 0.7,
    });
    // Technical documentation page (very unique/high value)
    toolPages.push({
      url: `${baseUrl}/tools/${slug}/details`,
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  // 3. Dynamic Blog Post Pages
  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date
      ? new Date(post.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticPages, ...toolPages, ...blogPages];
}
