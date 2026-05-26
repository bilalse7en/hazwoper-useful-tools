'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { BrandLogo } from './brand-logo';
import { UserNav } from './user-nav';
import { Menu, Moon, Sun, Palette, LogIn, UserPlus } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './app-sidebar';
import { ThemeDialog } from './theme-dialog';

export function GlobalHeader({ activeTab, onTabChange }) {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isToolsPage = pathname.startsWith('/tools');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // Initial load from session storage
    const stored = sessionStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Header: Auth state change', event, session?.user?.id);
      if (session?.user) {
        // Set basic info immediately
        const baseUser = {
          id: session.user.id,
          email: session.user.email,
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            '',
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email,
          avatar:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            null,
          role: 'user',
        };

        setUser(baseUser);
        sessionStorage.setItem('user', JSON.stringify(baseUser));

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select(
              'role, username, first_name, last_name, full_name, avatar_url, has_generator_access, email'
            )
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const activeUser = {
              ...baseUser,
              first_name: profile.first_name || baseUser.first_name || '',
              last_name: profile.last_name || baseUser.last_name || '',
              full_name: profile.full_name || baseUser.full_name,
              username: profile.username || baseUser.email,
              role: profile.role || 'user',
              has_generator_access: profile.has_generator_access || false,
              name: profile.full_name || baseUser.name,
              avatar: profile.avatar_url || baseUser.avatar,
            };
            setUser(activeUser);
            sessionStorage.setItem('user', JSON.stringify(activeUser));
          }
        } catch (err) {
          console.error('Header profile sync error:', err);
        }
      } else {
        // Only clear if we don't have a reward-user
        const stored = sessionStorage.getItem('user');
        let isRewardUser = false;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            isRewardUser = parsed.id === 'reward-user';
          } catch (e) {}
        }

        if (!isRewardUser) {
          setUser(null);
          sessionStorage.removeItem('user');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem('user');
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-[60] w-full border-b border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isToolsPage && (
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="max-w-[300px] p-0 border-r-border"
                  >
                    <AppSidebar
                      activeTab={activeTab}
                      onTabChange={onTabChange}
                      user={user}
                      onLogout={handleLogout}
                      className="border-none w-full"
                    />
                  </SheetContent>
                </Sheet>
              </div>
            )}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <BrandLogo
                  size="sm"
                  className="relative group-hover:scale-110 transition-transform"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight uppercase leading-tight">
                  Content Suite
                </span>
                <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em]">
                  Enterprise
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setThemeDialogOpen(true)}
            >
              <Palette className="h-4 w-4" />
            </Button>

            {!mounted ? (
              <div className="flex items-center gap-2 opacity-0 animate-in fade-in duration-500">
                <div className="h-9 w-20 bg-primary/5 rounded-xl animate-pulse" />
                <div className="h-9 w-20 bg-primary/5 rounded-xl animate-pulse" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-4 border-l border-white/10 pl-4 ml-2">
                <UserNav user={user} onLogout={handleLogout} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-9 rounded-xl font-bold text-xs"
                  onClick={() => router.push('/auth?mode=login')}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button
                  className="h-9 rounded-xl font-bold text-xs shadow-lg shadow-primary/20"
                  onClick={() => router.push('/auth?mode=signup')}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <ThemeDialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
    </>
  );
}
