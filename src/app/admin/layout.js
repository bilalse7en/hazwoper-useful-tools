'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/app-sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeDialog } from '@/components/theme-dialog';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function AdminLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  useEffect(() => {
    async function verifyAccess() {
      setIsChecking(true);

      // 1. Try session storage first for speed
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'admin') {
            setUser(parsed);
            setIsChecking(false);
            return;
          }
        } catch (e) {}
      }

      // 2. Verified fallback to direct Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, id, email, full_name, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'admin') {
          const activeUser = {
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            avatar: profile.avatar_url,
            role: profile.role,
          };
          setUser(activeUser);
          sessionStorage.setItem('user', JSON.stringify(activeUser));
          setIsChecking(false);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Core security link failure:', err);
        router.push('/');
      }
    }

    verifyAccess();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem('user');
    router.push('/');
  };

  if (isChecking) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background space-y-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
            Verifying Administrative Clearances...
          </p>
          <div className="h-0.5 w-32 bg-muted overflow-hidden rounded-full">
            <div className="h-full bg-primary w-2/3 animate-[loading_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  const currentView = searchParams.get('view') || 'dashboard';

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] relative">
      {/* Admin Sidebar */}
      <AppSidebar
        activeTab={currentView}
        onTabChange={(tab) => {
          if (tab === 'tools') {
            router.push('/tools/web-content');
          } else {
            router.push(`/admin?view=${tab === 'admin' ? 'permissions' : tab}`);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onThemeToggle={() => setThemeDialogOpen(true)}
        user={user}
        onLogout={handleLogout}
        adminMode={true}
        className="hidden lg:block h-full relative"
      />

      {/* Main Content */}
      <main className={cn('flex-1 transition-all duration-300 ease-in-out')}>
        <ScrollArea className="h-full">{children}</ScrollArea>
      </main>

      <ThemeDialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
