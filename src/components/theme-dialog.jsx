'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Sparkles, Check, Zap, ZapOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const themes = [
  {
    id: 'light',
    name: 'Professional Light',
    icon: Sun,
    description: 'Clean white workspace',
  },
  {
    id: 'dark',
    name: 'Professional Dark',
    icon: Moon,
    description: 'Deep slate focus',
  },
  {
    id: 'nebula',
    name: 'Cosmic Nebula',
    icon: Sparkles,
    description: 'Navy blue gradients & glow',
  },
];

export function ThemeDialog({ open, onOpenChange }) {
  const { theme, setTheme } = useTheme();
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      queueMicrotask(() =>
        setPerformanceMode(localStorage.getItem('performance_mode') === 'true')
      );
    }
  }, [open]);

  const togglePerformanceMode = (value) => {
    setPerformanceMode(value);
    localStorage.setItem('performance_mode', value ? 'true' : 'false');
    window.location.reload();
  };

  const handleThemeChange = (themeId) => {
    setTheme(themeId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Theme</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;

            return (
              <div
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={cn(
                  'w-full flex items-center justify-start gap-4 h-auto py-4 px-4 rounded-2xl transition-all duration-300 border-2 relative overflow-hidden group mb-3 last:mb-0 cursor-pointer',
                  t.id === 'light' && 'theme-preview-light',
                  t.id === 'dark' && 'theme-preview-dark',
                  t.id === 'nebula' &&
                    'bg-[#02081e] text-white border-sky-900/50',
                  isActive
                    ? 'border-primary ring-2 ring-primary/20 scale-[1.02] cursor-default shadow-md'
                    : 'hover:scale-[1.01] hover:shadow-lg active:scale-95'
                )}
                style={{
                  backgroundColor:
                    t.id === 'light'
                      ? '#ffffff'
                      : t.id === 'dark'
                        ? '#0f172a'
                        : '#02081e',
                  color: t.id === 'light' ? '#0f172a' : '#ffffff',
                }}
              >
                {/* Visual Flavor Backgrounds for Nebula */}
                {t.id === 'nebula' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none" />
                )}

                <div
                  className={cn(
                    'rounded-xl p-2.5 transition-all duration-300 z-10',
                    !isActive && 'group-hover:opacity-80'
                  )}
                  style={{
                    backgroundColor: t.id === 'light' ? '#f1f5f9' : '#1e293b',
                    color: t.id === 'light' ? '#0f172a' : '#ffffff',
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: 'inherit' }} />
                </div>

                <div className="flex-1 text-left z-10">
                  <div
                    className="font-bold text-sm tracking-tight"
                    style={{ color: 'inherit' }}
                  >
                    {t.name}
                  </div>
                  <div
                    className="text-[10px] font-medium uppercase tracking-[0.15em] opacity-60"
                    style={{ color: 'inherit' }}
                  >
                    {t.description}
                  </div>
                </div>

                {isActive && (
                  <div className="bg-primary p-1.5 rounded-full z-10 shadow-lg animate-in zoom-in shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border mt-2 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold">Visual Effects</span>
              <span className="text-xs text-muted-foreground">
                Animations & particles
              </span>
            </div>
            <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50 h-10 w-32">
              <button
                onClick={() => performanceMode && togglePerformanceMode(false)}
                className={cn(
                  'flex-1 h-full rounded-lg text-[10px] font-black transition-all',
                  !performanceMode
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                YES
              </button>
              <button
                onClick={() => !performanceMode && togglePerformanceMode(true)}
                className={cn(
                  'flex-1 h-full rounded-lg text-[10px] font-black transition-all',
                  performanceMode
                    ? 'bg-muted-foreground/30 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                NO
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
