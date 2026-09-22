import { getSiteUrl } from '@/lib/site-config';

export default function robots() {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/chat/',
          '/auth/',
          '/course-player/preview',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
