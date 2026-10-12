import { HomePageClient } from '@/components/home-page-client';
import {
  createPageMetadata,
  generateWebSiteSchema,
  organizationSchema,
  generateToolsListSchema,
} from '@/lib/seo';
import { getSiteUrl, SITE_CONFIG } from '@/lib/site-config';

export const metadata = createPageMetadata({
  title:
    'All Useful Tools – 20+ Free Online PDF, Video, Image & AI Productivity Tools',
  description:
    'All Useful Tools offers 20+ free browser-based tools: PDF Editor, Video Compressor, Word to HTML, Image Converter, Audio Editor, OCR, AI Assistant, Background Remover & more. No signup required. 100% private local processing.',
  path: '/',
  keywords:
    'all useful tools, free online tools, useful tools online, page by page tools, pdf editor free, video compressor, word to html, image converter, audio editor, audio converter, video to gif, ocr, background remover, watermark remover, ai tools, html cleaner, online productivity suite, browser tools, no signup tools',
});

export default function Home() {
  const siteUrl = getSiteUrl();

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_CONFIG.name,
    url: siteUrl,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description:
      '20+ professional tools for document management, media conversion, OCR, and content automation. Browser-based, fast, and privacy-first.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '2340',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <>
      <script
        id="schema-website"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateWebSiteSchema()),
        }}
      />
      <script
        id="schema-organization"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        id="schema-web-application"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webAppSchema),
        }}
      />
      <script
        id="schema-tools-list-home"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateToolsListSchema()),
        }}
      />
      <HomePageClient />
    </>
  );
}
