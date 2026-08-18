'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { slugToToolId } from '@/lib/seo';
import { useToolMetadata } from '@/lib/use-tool-metadata';
import nextDynamic from 'next/dynamic';
import { ToolBreadcrumbs } from '@/components/tool-breadcrumbs';
import { cn } from '@/lib/utils';
import { ToolAccessGuard } from '@/components/tool-access-guard';

// Dynamically import all tool components directly from file paths for optimal code-splitting
const CourseGenerator = nextDynamic(
  () =>
    import('@/components/generators/course-generator').then(
      (m) => m.CourseGenerator
    ),
  { ssr: false }
);
const BlogGenerator = nextDynamic(
  () =>
    import('@/components/generators/blog-generator').then(
      (m) => m.BlogGenerator
    ),
  { ssr: false }
);
const GlossaryGenerator = nextDynamic(
  () =>
    import('@/components/generators/glossary-generator').then(
      (m) => m.GlossaryGenerator
    ),
  { ssr: false }
);
const ResourceGenerator = nextDynamic(
  () =>
    import('@/components/generators/resource-generator').then(
      (m) => m.ResourceGenerator
    ),
  { ssr: false }
);
const HTMLCleaner = nextDynamic(
  () =>
    import('@/components/generators/html-cleaner').then((m) => m.HTMLCleaner),
  { ssr: false }
);
const ImageConverter = nextDynamic(
  () =>
    import('@/components/generators/image-converter').then(
      (m) => m.ImageConverter
    ),
  { ssr: false }
);
const AIAssistant = nextDynamic(
  () =>
    import('@/components/generators/ai-assistant').then((m) => m.AIAssistant),
  { ssr: false }
);
const ImageToText = nextDynamic(
  () =>
    import('@/components/generators/image-to-text').then(
      (m) => m.default || m.ImageToText
    ),
  { ssr: false }
);
const DocumentExtractor = nextDynamic(
  () =>
    import('@/components/generators/document-extractor').then(
      (m) => m.default || m.DocumentExtractor
    ),
  { ssr: false }
);
const AudioHub = nextDynamic(
  () => import('@/components/generators/audio-hub').then((m) => m.AudioHub),
  { ssr: false }
);
const VideoHub = nextDynamic(
  () => import('@/components/generators/video-hub').then((m) => m.VideoHub),
  { ssr: false }
);
const WordToHtml = nextDynamic(
  () =>
    import('@/components/generators/word-to-html').then((m) => m.WordToHtml),
  { ssr: false }
);
const LessonQuizBuilder = nextDynamic(
  () =>
    import('@/components/generators/lesson-quiz-builder').then(
      (m) => m.default || m.LessonQuizBuilder
    ),
  { ssr: false }
);
const YouTubeDownloader = nextDynamic(
  () =>
    import('@/components/generators/youtube-downloader').then(
      (m) => m.YouTubeDownloader
    ),
  { ssr: false }
);
const WatermarkRemover = nextDynamic(
  () =>
    import('@/components/generators/watermark-remover').then(
      (m) => m.WatermarkRemover
    ),
  { ssr: false }
);
const BgRemover = nextDynamic(
  () => import('@/components/generators/bg-remover').then((m) => m.BgRemover),
  { ssr: false }
);
const PDFEditor = nextDynamic(
  () => import('@/components/generators/pdf-editor').then((m) => m.PDFEditor),
  { ssr: false }
);

// Map slugs to components
const toolComponents = {
  'web-content': CourseGenerator,
  'blog-generator': BlogGenerator,
  'glossary-generator': GlossaryGenerator,
  'resource-generator': ResourceGenerator,
  'html-cleaner': HTMLCleaner,
  'image-converter': ImageConverter,
  'video-compressor': VideoHub,
  'ai-assistant': AIAssistant,
  'image-to-text': ImageToText,
  'document-extractor': DocumentExtractor,
  'video-converter': VideoHub,
  'audio-converter': AudioHub,
  'audio-editor': AudioHub,
  'video-to-gif': VideoHub,
  'word-to-html': WordToHtml,
  'lesson-quiz-builder': LessonQuizBuilder,
  'youtube-downloader': YouTubeDownloader,
  'watermark-remover': WatermarkRemover,
  'bg-remover': BgRemover,
  'pdf-editor': PDFEditor,
};

export function ToolPageClient({ toolSlug }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const ToolComponent = toolComponents[toolSlug];
  const { loading } = useAuth();
  const toolId = slugToToolId[toolSlug];

  useToolMetadata(toolSlug);

  useEffect(() => {
    if (!ToolComponent) {
      router.push('/');
    }
  }, [ToolComponent, router]);

  if (!ToolComponent || !mounted || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Initializing Tool Interface...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToolAccessGuard toolId={toolId}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <ToolBreadcrumbs slug={toolSlug} />
          <Link
            href={`/tools/${toolSlug}/details`}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Technical Documentation
          </Link>
        </div>
        {ToolComponent === AudioHub ? (
          <AudioHub
            initialMode={toolSlug === 'audio-editor' ? 'editor' : 'converter'}
          />
        ) : ToolComponent === VideoHub ? (
          <VideoHub
            initialMode={
              toolSlug === 'video-converter'
                ? 'converter'
                : toolSlug === 'video-to-gif'
                  ? 'gif'
                  : 'compressor'
            }
          />
        ) : (
          <ToolComponent />
        )}
      </div>
    </ToolAccessGuard>
  );
}

export function Badge({ className, children, variant = 'default' }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variant === 'default'
          ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
          : 'border-border text-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}
