'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { AdSenseAd } from '@/components/adsense-ad';
import { ToolSEOContent } from '@/components/tool-seo-content';
import { JsonLd } from '@/components/json-ld';
import {
  slugToToolId,
  toolInfo,
  generateToolSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo';
import { useToolMetadata } from '@/lib/use-tool-metadata';
import nextDynamic from 'next/dynamic';
import { ToolBreadcrumbs } from '@/components/tool-breadcrumbs';
import { triggerLogin } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { ToolAccessGuard } from '@/components/tool-access-guard';

// Dynamically import all tool components with no SSR from the index file
const CourseGenerator = nextDynamic(
  () => import('@/components/generators').then((m) => m.CourseGenerator),
  { ssr: false }
);
const BlogGenerator = nextDynamic(
  () => import('@/components/generators').then((m) => m.BlogGenerator),
  { ssr: false }
);
const GlossaryGenerator = nextDynamic(
  () => import('@/components/generators').then((m) => m.GlossaryGenerator),
  { ssr: false }
);
const ResourceGenerator = nextDynamic(
  () => import('@/components/generators').then((m) => m.ResourceGenerator),
  { ssr: false }
);
const HTMLCleaner = nextDynamic(
  () => import('@/components/generators').then((m) => m.HTMLCleaner),
  { ssr: false }
);
const ImageConverter = nextDynamic(
  () => import('@/components/generators').then((m) => m.ImageConverter),
  { ssr: false }
);
const AIAssistant = nextDynamic(
  () => import('@/components/generators').then((m) => m.AIAssistant),
  { ssr: false }
);
const ImageToText = nextDynamic(
  () => import('@/components/generators').then((m) => m.ImageToText),
  { ssr: false }
);
const DocumentExtractor = nextDynamic(
  () => import('@/components/generators').then((m) => m.DocumentExtractor),
  { ssr: false }
);
const AudioHub = nextDynamic(
  () => import('@/components/generators').then((m) => m.AudioHub),
  { ssr: false }
);
const VideoHub = nextDynamic(
  () => import('@/components/generators').then((m) => m.VideoHub),
  { ssr: false }
);
const WordToHtml = nextDynamic(
  () => import('@/components/generators').then((m) => m.WordToHtml),
  { ssr: false }
);
const LessonQuizBuilder = nextDynamic(
  () => import('@/components/generators').then((m) => m.LessonQuizBuilder),
  { ssr: false }
);
const YouTubeDownloader = nextDynamic(
  () => import('@/components/generators').then((m) => m.YouTubeDownloader),
  { ssr: false }
);
const WatermarkRemover = nextDynamic(
  () => import('@/components/generators').then((m) => m.WatermarkRemover),
  { ssr: false }
);
const BgRemover = nextDynamic(
  () => import('@/components/generators').then((m) => m.BgRemover),
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
};

export default function ToolPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const params = useParams();
  const toolSlug = params.tool;
  const ToolComponent = toolComponents[toolSlug];
  const { user, loading, toolSettings } = useAuth();
  const toolId = slugToToolId[toolSlug];

  useToolMetadata(toolSlug);
  const toolSchema = generateToolSchema(toolSlug);
  const breadcrumbSchema = generateBreadcrumbSchema(toolSlug);

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
      {toolSchema && <JsonLd data={toolSchema} />}
      {breadcrumbSchema && <JsonLd data={breadcrumbSchema} />}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
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

        {/* SEO Content Section - renders rich text for search engine crawlers */}
        <ToolSEOContent slug={toolSlug} />
      </div>
    </ToolAccessGuard>
  );
}

function Badge({ className, children, variant = 'default' }) {
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
