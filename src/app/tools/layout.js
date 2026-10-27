'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SessionTimer } from '@/components/session-timer';
import { ThemeDialog } from '@/components/theme-dialog';
import { supabase } from '@/lib/supabase';
import { Footer } from '@/components/footer';

export default function ToolsLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
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

  return (
    <div className="flex flex-1 min-h-[calc(100vh-64px)] w-full relative transition-all duration-300">
      {/* Main Content Area - 100% full width workspace (zero disruptive sidebars) */}
      <main className="flex-1 min-w-0 w-full flex flex-col relative transition-all duration-300">
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
