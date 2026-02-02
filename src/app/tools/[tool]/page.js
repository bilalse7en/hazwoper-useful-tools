"use client";

// Disable static generation since this page requires authentication
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionTimer } from "@/components/session-timer";
import { AdSenseAd } from "@/components/adsense-ad";
import { JsonLd } from "@/components/json-ld";
import { slugToToolId, generateToolSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { useToolMetadata } from "@/lib/use-tool-metadata";
import {
  CourseGenerator,
  BlogGenerator,
  GlossaryGenerator,
  ResourceGenerator,
  HTMLCleaner,
  ImageConverter,
  VideoCompressor,
  AIAssistant,
  ImageToText,
  DocumentExtractor
} from "@/components/generators";

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

export default function ToolPage({ params }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toolSlug = params.tool;
  const toolId = slugToToolId[toolSlug];
  const ToolComponent = toolComponents[toolSlug];

  // Update metadata
  useToolMetadata(toolSlug);

  // Generate structured data
  const toolSchema = generateToolSchema(toolSlug);
  const breadcrumbSchema = generateBreadcrumbSchema(toolSlug);

  useEffect(() => {
    // Check authentication
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        // Redirect to homepage if no valid user
        router.push('/');
      }
    } else {
      // Redirect to homepage if not logged in
      router.push('/');
    }
  }, [router]);

  // If invalid tool, redirect
  if (!ToolComponent) {
    router.push('/');
    return null;
  }

  // Loading state while checking auth
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Structured Data */}
      {toolSchema && <JsonLd data={toolSchema} />}
      {breadcrumbSchema && <JsonLd data={breadcrumbSchema} />}

      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <MobileHeader
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <AppSidebar
            activeTab={toolId}
            setActiveTab={(newToolId) => {
              // Navigate to the new tool page
              const newSlug = Object.entries(slugToToolId).find(
                ([slug, id]) => id === newToolId
              )?.[0];
              if (newSlug) {
                router.push(`/tools/${newSlug}`);
              }
            }}
            user={user}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />

          {/* Main Content */}
          <main
            className={cn(
              "flex-1 transition-all duration-300 ease-in-out",
              sidebarCollapsed ? "md:ml-16" : "md:ml-64"
            )}
          >
            <ScrollArea className="h-screen">
              {/* Content Area */}
              <div className="container mx-auto px-4 py-8">
                {/* AdSense Banner - Top of Content */}
                <div className="mb-8 flex justify-center">
                  <AdSenseAd 
                    slot="9491607826" 
                    format="horizontal"
                    style={{ maxWidth: '970px', width: '100%' }}
                  />
                </div>
                
                {/* Tool Component */}
                <ToolComponent />
              </div>
            </ScrollArea>
          </main>

          {/* Session Timer */}
          <SessionTimer user={user} />
        </div>
      </div>
    </>
  );
}
