import { HomePageClient } from '@/components/home-page-client';

export const metadata = {
  title: 'HAZWOPER Content Suite | Professional Generator Tools',
  description:
    'Extract Overview, Syllabus, FAQs, Glossary, Resources, Lesson Quizzes and Blog Content from safety and technical documents. Browser-based, secure, and compliance-first.',
  keywords:
    'HAZWOPER tools, course generator, web content generator, safety training documentation, DOCX to HTML, blog generator, glossary generator, video compressor, image converter, tesseract ocr',
  alternates: {
    canonical: 'https://hazwoper-useful-tools.vercel.app',
  },
};

export default function Home() {
  return (
    <>
      {/* Professional SEO Infrastructure without policy-violating fake aggregateRating */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'HAZWOPER Content Suite',
            url: 'https://hazwoper-useful-tools.vercel.app',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description: '20+ professional tools for safety documentation, media processing, and content automation. Browser-based, privacy-first, HAZWOPER compliant.',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Content Suite',
            operatingSystem: 'Web',
            applicationCategory: 'BusinessApplication',
            description:
              'Professional automated course content generator and safety documentation tool. Engineered for HAZWOPER compliance, technical blog creation, and media asset management.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          }),
        }}
      />
      <HomePageClient />
    </>
  );
}
