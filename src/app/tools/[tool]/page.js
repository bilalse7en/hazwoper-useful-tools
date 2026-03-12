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

import { PublicToolLanding } from "@/components/public-tool-landing";
import { ThemeDialog } from "@/components/theme-dialog";

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
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
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
        setUser(null);
      }
    }
  }, []);

  // If invalid tool, redirect
  if (!ToolComponent) {
    router.push('/');
    return null;
  }

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    localStorage.removeItem('reward_claim_time');
    sessionStorage.removeItem('reward_attempted');
    router.push('/');
  };

  const handleAction = () => {
    router.push('/');
  };

  return (
    <>
      {/* Structured Data */}
      {toolSchema && <JsonLd data={toolSchema} />}
      {breadcrumbSchema && <JsonLd data={breadcrumbSchema} />}

      <div className="min-h-screen bg-transparent transition-opacity duration-500">
        {/* Mobile Header */}
        <MobileHeader
          activeTab={toolId}
          onTabChange={(tab) => {
            const nextSlug = Object.entries(slugToToolId).find(([s, id]) => id === tab)?.[0];
            if (nextSlug) router.push(`/tools/${nextSlug}`);
          }}
          onThemeToggle={() => setThemeDialogOpen(true)}
          user={user}
          onLogout={handleLogout}
        />

        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <AppSidebar
            activeTab={toolId}
            onTabChange={(tab) => {
              const nextSlug = Object.entries(slugToToolId).find(([s, id]) => id === tab)?.[0];
              if (nextSlug) router.push(`/tools/${nextSlug}`);
            }}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onThemeToggle={() => setThemeDialogOpen(true)}
            user={user}
            onLogout={handleLogout}
            className="hidden lg:block fixed left-0 top-0 z-40 h-screen"
          />

          {/* Main Content */}
          <main
            className={cn(
              "flex-1 transition-all duration-300 ease-in-out lg:pt-0",
              sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
            )}
          >
            <ScrollArea className="h-screen">
              {/* Content Area */}
              <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* AdSense Banner - Top of Content */}
                <div className="mb-8 flex justify-center">
                  <AdSenseAd 
                    slot="9491607826" 
                    format="horizontal"
                    style={{ maxWidth: '970px', width: '100%' }}
                  />
                </div>
                
                {/* Condition: Show Actual Tool if User, else Show Public Landing */}
                {user ? (
                  <ToolComponent />
                ) : (
                  <PublicToolLanding toolSlug={toolSlug} onAction={handleAction} />
                )}
              </div>
            </ScrollArea>
          </main>
        </div>

        {/* Theme Dialog */}
        <ThemeDialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />

        {/* Session Timer (only for users) */}
        {user && <SessionTimer onExpire={handleLogout} />}
      </div>
    </>
  );
}
