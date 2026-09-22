import { HomePageClient } from '@/components/home-page-client';
import {
  createPageMetadata,
  generateWebSiteSchema,
  organizationSchema,
} from '@/lib/seo';
import { getSiteUrl, SITE_CONFIG } from '@/lib/site-config';

export const metadata = createPageMetadata({
  title: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
  path: '/',
  keywords:
    'all useful tools, pdf editor, word to html, video converter, audio converter, image converter, free online tools, document extractor, audio editor, video to gif, ocr, local-first web utilities',
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
      <HomePageClient />
    </>
  );
}
