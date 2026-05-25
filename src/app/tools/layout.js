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
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
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

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] relative">
      {/* Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'admin') {
            router.push('/admin');
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
        className="hidden lg:block h-full relative z-30"
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="min-h-full flex flex-col">
            <div className="flex-1">{children}</div>
            {/* Internal Footer for Tools Dashboard */}
            <div className="mt-auto">
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
