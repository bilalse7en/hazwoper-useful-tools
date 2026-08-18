import { HomePageClient } from '@/components/home-page-client';

export const metadata = {
  title: 'All Useful Tools | Free Online Document, Media & AI Utilities',
  description:
    'Free online productivity and media tools: PDF Editor, Word to HTML, Video Compressor, Video to GIF, Audio Converter, Audio Editor, Image Converter, Document Extractor, OCR, and AI Assistants.',
  keywords:
    'all useful tools, pdf editor, word to html, video converter, audio converter, image converter, free online tools, document extractor, audio editor, video to gif',
  alternates: {
    canonical: 'https://hazwoper-useful-tools.vercel.app',
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'All Useful Tools',
            url: 'https://hazwoper-useful-tools.vercel.app',
            applicationCategory: 'ProductivityApplication',
            operatingSystem: 'Web Browser',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description:
              '20+ professional tools for document management, media conversion, OCR, and content automation. Browser-based, fast, and privacy-first.',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'All Useful Tools',
            operatingSystem: 'Web',
            applicationCategory: 'BusinessApplication',
            description:
              'Professional automated content generator, PDF editor, and media conversion tools. Engineered for high performance, ease of use, and local privacy.',
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
