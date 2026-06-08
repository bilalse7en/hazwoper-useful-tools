'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { AdSenseAd } from '@/components/adsense-ad';
import { JsonLd } from '@/components/json-ld';
import {
  slugToToolId,
  toolInfo,
  generateToolSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo';
import { useToolMetadata } from '@/lib/use-tool-metadata';
import nextDynamic from 'next/dynamic';
import { ToolInfo } from '@/components/tool-info';
import { ToolBreadcrumbs } from '@/components/tool-breadcrumbs';
import { triggerLogin } from '@/lib/auth';
import { cn } from '@/lib/utils';

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
const VideoCompressor = nextDynamic(
  () => import('@/components/generators').then((m) => m.VideoCompressor),
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
const VideoConverter = nextDynamic(
  () => import('@/components/generators').then((m) => m.VideoConverter),
  { ssr: false }
);
const AudioConverter = nextDynamic(
  () => import('@/components/generators').then((m) => m.AudioConverter),
  { ssr: false }
);
const VideoToGif = nextDynamic(
  () => import('@/components/generators').then((m) => m.VideoToGif),
  { ssr: false }
);
const WordToHtml = nextDynamic(
  () => import('@/components/generators').then((m) => m.WordToHtml),
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
  'video-compressor': VideoCompressor,
  'ai-assistant': AIAssistant,
  'image-to-text': ImageToText,
  'document-extractor': DocumentExtractor,
  'video-converter': VideoConverter,
  'audio-converter': AudioConverter,
  'video-to-gif': VideoToGif,
  'word-to-html': WordToHtml,
};

// Free tools that don't require login to USE
const FREE_TOOL_SLUGS = [
  'html-cleaner',
  'image-converter',
  'video-compressor',
  'image-to-text',
  'document-extractor',
  'video-converter',
  'audio-converter',
  'video-to-gif',
  'word-to-html',
];

// Generator tools that require login and generator access
const GENERATOR_TOOL_SLUGS = [
  'web-content',
  'blog-generator',
  'glossary-generator',
  'resource-generator',
];

export default function ToolPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const params = useParams();
  const toolSlug = params.tool;
  const ToolComponent = toolComponents[toolSlug];

  useToolMetadata(toolSlug);
  const toolSchema = generateToolSchema(toolSlug);
  const breadcrumbSchema = generateBreadcrumbSchema(toolSlug);

  useEffect(() => {
    if (!ToolComponent) {
      router.push('/');
    }
  }, [ToolComponent, router]);

  if (!ToolComponent || !mounted) {
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

  const isFree = FREE_TOOL_SLUGS.includes(toolSlug);
  const isGenerator = GENERATOR_TOOL_SLUGS.includes(toolSlug);
  const hasAccess =
    user &&
    (isFree ||
      user.role === 'admin' ||
      (isGenerator && user.has_generator_access));

  return (
    <>
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
          <ToolComponent />
        </div>
      </div>
    </>
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
