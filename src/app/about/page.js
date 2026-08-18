import { AboutPageClient } from '@/components/about-page-client';

export const metadata = {
  title: 'About All Useful Tools | Online Productivity & Utility Suite',
  description:
    'Learn about All Useful Tools, our mission to build high-performance, private, browser-first tools for document management, media conversion, and content automation.',
  keywords:
    'about All Useful Tools, online utilities, PDF editor, media converter, document extractor, web tools, local-first processing',
  alternates: {
    canonical: 'https://hazwoper-useful-tools.vercel.app/about',
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
