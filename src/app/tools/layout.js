'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/app-sidebar';
import { MainHeader } from '@/components/main-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SessionTimer } from '@/components/session-timer';
import { ThemeDialog } from '@/components/theme-dialog';
import { slugToToolId } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { Footer } from '@/components/footer';

export default function ToolsLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        queueMicrotask(() => setUser(JSON.parse(storedUser)));
      } catch (e) {
        queueMicrotask(() => setUser(null));
      }
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem('user');
    localStorage.removeItem('reward_claim_time');
    sessionStorage.removeItem('reward_attempted');
    router.push('/');
  };

  const currentToolSlug = pathname.split('/').pop();
  const activeTab = slugToToolId[currentToolSlug] || 'course';
  const isDetailsPage = pathname.endsWith('/details');

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] relative transition-all duration-300">
      {/* Sidebar - Hidden on details pages */}
      {!isDetailsPage && (
        <AppSidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSidebarCollapsed(true);
            if (tab === 'admin') {
              router.push('/admin');
              return;
            }
            if (tab === 'slide-generator' || tab === 'slide') {
              router.push('/tools/slide-generator');
              return;
            }
            const nextSlug = Object.entries(slugToToolId).find(
              ([s, id]) => id === tab
            )?.[0];
            if (nextSlug) router.push(`/tools/${nextSlug}`);
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onThemeToggle={() => setThemeDialogOpen(true)}
          user={user}
          onLogout={handleLogout}
          className="hidden lg:block h-full relative z-30 transition-all duration-300"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden transition-all duration-300">
        <ScrollArea className="h-full w-full">
          <div className="min-h-full w-full max-w-full min-w-0 flex flex-col">
            <div className="flex-1 w-full max-w-full min-w-0">{children}</div>
            {/* Internal Footer for Tools Dashboard */}
            <div className="mt-auto w-full">
              <Footer overrideShow={true} />
            </div>
          </div>
        </ScrollArea>
      </main>

      <ThemeDialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
      {user && <SessionTimer onExpire={handleLogout} />}
    </div>
  );
}
