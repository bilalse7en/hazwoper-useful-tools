"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeDialog } from "@/components/theme-dialog";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function AdminLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role !== 'admin') {
            router.push('/');
            return;
        }
        setUser(parsed);
      } catch (e) {
        setUser(null);
        router.push('/');
      }
    } else {
        router.push('/');
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem('user');
    router.push('/');
  };

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
        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out"
          )}
        >
          <ScrollArea className="h-full">
            {children}
          </ScrollArea>
        </main>

      <ThemeDialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
