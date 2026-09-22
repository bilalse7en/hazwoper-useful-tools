'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrandLogo } from './brand-logo';
import { UserNav } from './user-nav';
import {
  Menu,
  Palette,
  LogIn,
  UserPlus,
  MessageCircle,
  ChevronRight,
  Wrench,
  GraduationCap,
  Compass,
  BookOpenText,
  Sparkles,
  Send,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './app-sidebar';
import { ThemeDialog } from './theme-dialog';
import { useAuth } from './auth-provider';
import { useChat } from '@/components/chat-provider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function GlobalHeader({ activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const { totalUnread } = useChat();
  const [mounted, setMounted] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  const isToolsPage = pathname.startsWith('/tools');
  const isAdminPath = pathname.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    {
      id: 'tools',
      label: 'Tools',
      href: '/tools',
      icon: Wrench,
      active: pathname.startsWith('/tools'),
    },
    {
      id: 'courses',
      label: 'Courses',
      href: '/courses',
      icon: GraduationCap,
      active: pathname.startsWith('/courses'),
    },
    {
      id: 'guides',
      label: 'Guides',
      href: '/guides',
      icon: Compass,
      active: pathname.startsWith('/guides'),
    },
    {
      id: 'blog',
      label: 'Blogs',
      href: '/blog',
      icon: BookOpenText,
      active: pathname.startsWith('/blog'),
    },
    {
      id: 'about',
      label: 'About',
      href: '/about',
      icon: Sparkles,
      active: pathname === '/about',
    },
    {
      id: 'contact',
      label: 'Contact',
      href: '/contact',
      icon: Send,
      active: pathname === '/contact',
    },
  ];

  const activeItem = navItems.find((item) => item.active);
  const currentActive = hoveredPath || (activeItem ? activeItem.href : null);

  return (
    <>
      <header className="sticky top-0 z-[60] w-full border-b border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="max-w-[300px] p-6 border-r-border flex flex-col justify-between"
                >
                  {isToolsPage || isAdminPath ? (
                    <AppSidebar
                      activeTab={activeTab}
                      onTabChange={onTabChange}
                      user={user}
                      onLogout={handleLogout}
                      adminMode={isAdminPath}
                      className="border-none w-full"
                    />
                  ) : (
                    <div className="space-y-6 pt-4">
                      {/* Preserved Original Brand Identity in Mobile Drawer */}
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                        <BrandLogo size="sm" />
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tight">
                            All Useful Tools
                          </span>
                          <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em]">
                            Utilities
                          </span>
                        </div>
                      </div>

                      <nav className="flex flex-col gap-1.5 font-semibold text-sm">
                        {navItems.map((item) => {
                          const isActive = item.active;
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.id || item.href}
                              href={item.href}
                              className={cn(
                                'px-3.5 py-2.5 rounded-xl text-xs tracking-wide font-semibold transition-all flex items-center justify-between group border',
                                isActive
                                  ? 'bg-primary/10 text-primary border-primary/20 font-bold shadow-xs'
                                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/40'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                                    isActive
                                      ? 'bg-primary text-primary-foreground shadow-xs'
                                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                  )}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold">
                                  {item.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isActive && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                  </span>
                                )}
                                <ChevronRight
                                  className={cn(
                                    'w-4 h-4 transition-transform group-hover:translate-x-1',
                                    isActive
                                      ? 'text-primary'
                                      : 'text-muted-foreground/40'
                                  )}
                                />
                              </div>
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pt-4 border-t border-border">
                    All Useful Tools • Local-First
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Preserved Original Brand Logo & Identity */}
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
                  All Useful Tools
                </span>
                <span className="text-[8px] font-bold text-primary uppercase tracking-[0.2em]">
                  Utilities
                </span>
              </div>
            </Link>

            {/* Ultra-Stylish Magnetic Floating Capsule Navigation Dock (Public Pages Only) */}
            {!isAdminPath && (
              <div className="hidden md:flex items-center">
                <nav
                  onMouseLeave={() => setHoveredPath(null)}
                  className="relative flex items-center p-1 rounded-full bg-muted/50 dark:bg-zinc-900/60 backdrop-blur-xl border border-border/70 dark:border-white/10 shadow-xs ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
                >
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isCurrentActive = item.active;
                    const isGlidingHere = currentActive === item.href;

                    return (
                      <Link
                        key={item.id || item.href}
                        href={item.href}
                        onMouseEnter={() => setHoveredPath(item.href)}
                        className={cn(
                          'relative px-3 py-1.5 lg:px-3.5 lg:py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 select-none group',
                          isGlidingHere
                            ? 'text-foreground font-bold'
                            : 'text-muted-foreground/80 hover:text-foreground'
                        )}
                      >
                        {/* Dynamic Framer Motion Magnetic Sliding Pill */}
                        {isGlidingHere && (
                          <motion.div
                            layoutId="header-nav-pill"
                            className={cn(
                              'absolute inset-0 rounded-full z-0 pointer-events-none',
                              isCurrentActive && !hoveredPath
                                ? 'bg-background dark:bg-zinc-800 shadow-xs border border-border/80 dark:border-white/15'
                                : 'bg-background/90 dark:bg-zinc-800/90 shadow-xs border border-border/60 dark:border-white/10'
                            )}
                            transition={{
                              type: 'spring',
                              stiffness: 450,
                              damping: 32,
                            }}
                          />
                        )}

                        <span className="relative z-10 flex items-center gap-1.5">
                          <Icon
                            className={cn(
                              'w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110',
                              isCurrentActive
                                ? 'text-primary'
                                : 'text-muted-foreground/70 group-hover:text-foreground'
                            )}
                          />
                          <span>{item.label}</span>

                          {/* Active Micro Glowing Beacon */}
                          {isCurrentActive && (
                            <span className="relative flex h-1.5 w-1.5 ml-0.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary shadow-[0_0_6px_var(--primary)]" />
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setThemeDialogOpen(true)}
              aria-label="Open theme customization modal"
            >
              <Palette className="h-4 w-4" />
            </Button>

            {user && (
              <div className="relative group/chat">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors relative"
                  onClick={() => router.push('/chat')}
                  aria-label="Open chat messages"
                >
                  <MessageCircle className="h-4 w-4" />
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[8px] font-black flex items-center justify-center rounded-full ring-2 ring-background animate-in zoom-in duration-300">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </Button>
              </div>
            )}

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
                  className="h-9 rounded-xl font-bold text-xs hover:bg-primary/10 hover:text-primary transition-all"
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
