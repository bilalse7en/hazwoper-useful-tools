import { createPageMetadata } from '@/lib/seo';
import { ToolsDirectoryClient } from '@/components/tools-directory-client';

export const metadata = createPageMetadata({
  title: 'Professional Online Tool Directory',
  description:
    'Explore our comprehensive suite of 21 automated content generation, document management, and media optimization tools. Engineered for speed, privacy, and high-performance browser execution.',
  path: '/tools',
  keywords:
    'tools directory, online utilities, pdf editor, word to html, video converter, audio converter, image converter, free productivity tools',
});

export default function ToolsDirectoryPage() {
  return <ToolsDirectoryClient />;
}
