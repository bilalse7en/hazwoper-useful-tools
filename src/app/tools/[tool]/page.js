import { notFound } from 'next/navigation';
import {
  toolMetadata,
  slugToToolId,
  toolInfo,
  generateToolSchema,
  generateBreadcrumbSchema,
  createPageMetadata,
} from '@/lib/seo';
import { ToolSEOContentServer } from '@/components/tool-seo-content-server';
import { ToolPageClient } from '@/components/tool-page-client';
import { AdPlacement } from '@/components/ad-placement';

export async function generateMetadata({ params }) {
  const { tool } = await params;
  const meta = toolMetadata[tool];
  if (!meta) return {};

  return createPageMetadata({
    title: meta.title,
    description: meta.description,
    path: `/tools/${tool}`,
    keywords: meta.keywords,
    image: meta.ogImage,
  });
}

export async function generateStaticParams() {
  return Object.keys(slugToToolId).map((tool) => ({
    tool,
  }));
}

export default async function ToolPage({ params }) {
  const { tool: toolSlug } = await params;
  if (!slugToToolId[toolSlug]) notFound();

  const toolSchema = generateToolSchema(toolSlug);
  const breadcrumbSchema = generateBreadcrumbSchema(toolSlug);

  return (
    <>
      {toolSchema && (
        <script
          id={`schema-tool-${toolSlug}`}
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          id={`schema-breadcrumb-${toolSlug}`}
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <div className="w-full min-w-0 px-2 sm:px-3 md:px-4 py-4 sm:py-6 transition-all duration-300">
        <AdPlacement type="top-banner" className="mb-6" />
        <ToolPageClient toolSlug={toolSlug} />
        <AdPlacement type="in-content" className="my-8" />
        <div id="documentation">
          <ToolSEOContentServer slug={toolSlug} />
        </div>
        <AdPlacement type="footer" className="mt-12" />
      </div>
    </>
  );
}
