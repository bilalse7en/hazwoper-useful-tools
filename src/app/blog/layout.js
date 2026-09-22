import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Insights & Tutorials Blog',
  description:
    'Deep dives into web productivity tools, PDF editing techniques, browser media conversion, and content workflows. Powered by All Useful Tools.',
  path: '/blog',
  keywords:
    'utility blog, web tools tutorial, PDF editing guide, video converter tips, OCR extraction, audio editor tutorial, online productivity',
});

export default function BlogLayout({ children }) {
  return <>{children}</>;
}
