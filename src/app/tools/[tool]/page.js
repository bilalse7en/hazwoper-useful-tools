import { notFound } from 'next/navigation';
import { toolMetadata, slugToToolId, toolInfo, generateToolSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { ToolSEOContentServer } from '@/components/tool-seo-content-server';
import { ToolPageClient } from '@/components/tool-page-client';
import { AdPlacement } from '@/components/ad-placement';

export async function generateMetadata({ params }) {
  const { tool } = await params;
  const meta = toolMetadata[tool];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `https://hazwoper-useful-tools.vercel.app${meta.canonical}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://hazwoper-useful-tools.vercel.app/tools/${tool}`,
      type: 'website',
      images: meta.ogImage ? [{ url: meta.ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
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
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <AdPlacement type="top-banner" className="mb-6" />
        <ToolPageClient toolSlug={toolSlug} />
        <AdPlacement type="in-content" className="my-8" />
        <ToolSEOContentServer slug={toolSlug} />
        <AdPlacement type="footer" className="mt-12" />
      </div>
    </>
  );
}
