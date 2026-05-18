"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AdSenseAd } from "@/components/adsense-ad";
import { JsonLd } from "@/components/json-ld";
import { slugToToolId, generateToolSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { useToolMetadata } from "@/lib/use-tool-metadata";
import nextDynamic from "next/dynamic";
import { triggerLogin } from "@/lib/auth";

// Dynamically import all tool components with no SSR from the index file
const CourseGenerator = nextDynamic(() => import("@/components/generators").then(m => m.CourseGenerator), { ssr: false });
const BlogGenerator = nextDynamic(() => import("@/components/generators").then(m => m.BlogGenerator), { ssr: false });
const GlossaryGenerator = nextDynamic(() => import("@/components/generators").then(m => m.GlossaryGenerator), { ssr: false });
const ResourceGenerator = nextDynamic(() => import("@/components/generators").then(m => m.ResourceGenerator), { ssr: false });
const HTMLCleaner = nextDynamic(() => import("@/components/generators").then(m => m.HTMLCleaner), { ssr: false });
const ImageConverter = nextDynamic(() => import("@/components/generators").then(m => m.ImageConverter), { ssr: false });
const VideoCompressor = nextDynamic(() => import("@/components/generators").then(m => m.VideoCompressor), { ssr: false });
const AIAssistant = nextDynamic(() => import("@/components/generators").then(m => m.AIAssistant), { ssr: false });
const ImageToText = nextDynamic(() => import("@/components/generators").then(m => m.ImageToText), { ssr: false });
const DocumentExtractor = nextDynamic(() => import("@/components/generators").then(m => m.DocumentExtractor), { ssr: false });

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
};

// Free tools that don't require login to USE (but copy/download requires login)
const FREE_TOOL_SLUGS = ['html-cleaner', 'image-converter', 'video-compressor', 'image-to-text', 'document-extractor', 'web-content', 'blog-generator', 'glossary-generator', 'resource-generator'];

// Generator tools that require login (Access is now open to all authenticated users)
const GENERATOR_TOOL_SLUGS = [];

export default function ToolPage({ params }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const unwrappedParams = use(params);
  const toolSlug = unwrappedParams.tool;
  const ToolComponent = toolComponents[toolSlug];

  useToolMetadata(toolSlug);
  if (!ToolComponent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Initializing Tool Interface...</p>
        </div>
      </div>
    );
  }

  const toolSchema = generateToolSchema(toolSlug);
  const breadcrumbSchema = generateBreadcrumbSchema(toolSlug);

  useEffect(() => {
    if (!ToolComponent) {
      router.push('/');
      return;
    }

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }
  }, [ToolComponent, router]);

  if (!ToolComponent) {
    return null;
  }

  const isFree = FREE_TOOL_SLUGS.includes(toolSlug);
  const isGenerator = GENERATOR_TOOL_SLUGS.includes(toolSlug);

  // If not logged in and it's NOT a free tool → redirect to home with login prompt
  if (!user && !isFree) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in-card">
        <div className="p-10 rounded-[40px] bg-card/60 backdrop-blur-2xl border border-border shadow-2xl space-y-8 max-w-lg">
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl" />
            <div className="w-24 h-24 bg-primary/10 border border-border rounded-3xl flex items-center justify-center mx-auto text-primary relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-foreground">Sign In Required</h2>
            <p className="text-muted-foreground leading-relaxed font-medium">
              This tool requires authentication. Sign in with Google to access the full professional suite.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-4">
            <button 
              onClick={() => triggerLogin()}
              className="group relative w-full h-14 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-slate-200 flex items-center justify-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="relative z-10 text-slate-800">Sign In with Google</span>
            </button>
            <button 
              onClick={() => router.push('/')}
              className="w-full h-11 text-muted-foreground/60 font-black uppercase tracking-widest text-[10px] hover:text-foreground transition-colors"
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If logged in, but it's a generator tool and they lack generator access
  if (user && isGenerator && user.role !== 'admin' && !user.has_generator_access) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in-card">
        <div className="p-10 rounded-[40px] bg-card/60 backdrop-blur-2xl border border-border shadow-2xl space-y-8 max-w-lg">
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl" />
            <div className="w-24 h-24 bg-primary/10 border border-border rounded-3xl flex items-center justify-center mx-auto text-primary relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black tracking-tight text-foreground">Access Protocol Required</h2>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Content generators require elevated permissions. Contact administration to upgrade your access level.
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-4">
            <button 
              onClick={() => router.push('/')}
              className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border-none"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {toolSchema && <JsonLd data={toolSchema} />}
      {breadcrumbSchema && <JsonLd data={breadcrumbSchema} />}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <ToolComponent />
        </div>
      </div>
    </>
  );
}
