'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AppSidebar } from './app-sidebar';
import { BrandLogo } from './brand-logo';
import { UserNav } from './user-nav';
import { cn } from '@/lib/utils';

export function MainHeader({
  activeTab,
  onTabChange,
  onThemeToggle,
  user,
  onLogout,
}) {
  const { theme, setTheme } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 backdrop-blur-xl px-4 lg:px-8"
      style={{ backgroundColor: 'var(--sidebar)' }}
    >
      <div className="flex items-center gap-4">
        {/* Mobile Menu Trigger */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="max-w-[300px] p-0 border-r-border"
            >
              <AppSidebar
                activeTab={activeTab}
                onTabChange={onTabChange}
                collapsed={false}
                onToggleCollapse={() => {}}
                onThemeToggle={onThemeToggle}
                user={user}
                onLogout={onLogout}
                className="border-none w-full"
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <BrandLogo
              size="md"
              className="relative shadow-lg ring-1 ring-white/10"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-black text-lg tracking-tighter text-foreground uppercase leading-none">
              Content Suite
            </span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              Enterprise
            </span>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Desktop Theme Toggle with Palette icon as requested */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors hidden sm:flex"
          onClick={onThemeToggle}
        >
          <Palette className="h-5 w-5" />
        </Button>

        {/* User Profile Dropdown */}
        <UserNav user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
