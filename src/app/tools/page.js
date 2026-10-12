import { createPageMetadata, generateToolsListSchema } from '@/lib/seo';
import { ToolsDirectoryClient } from '@/components/tools-directory-client';

export const metadata = createPageMetadata({
  title:
    'All Online Tools Directory – Free PDF, Video, Audio, Image & AI Tools',
  description:
    'Browse all 21+ free online tools: PDF Editor, Video Compressor, Word to HTML Converter, Image Converter, Audio Editor, OCR, AI Assistant, Background Remover, Watermark Remover & more. All tools work in your browser with zero uploads.',
  path: '/tools',
  keywords:
    'all useful tools directory, online tools list, free tools collection, pdf editor, video compressor, image converter, audio converter, word to html, ocr tool, ai assistant, background remover, page by page tools',
});

export default function ToolsDirectoryPage() {
  const toolsListSchema = generateToolsListSchema();

  return (
    <>
      <script
        id="schema-tools-list"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(toolsListSchema),
        }}
      />
      <ToolsDirectoryClient />
    </>
  );
}
