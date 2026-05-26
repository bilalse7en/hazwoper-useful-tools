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
              <Button
                key={t.id}
                variant={isActive ? 'secondary' : 'outline'}
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => handleThemeChange(t.id)}
              >
                <div
                  className={`rounded-full p-2 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.description}
                  </div>
                </div>
                {isActive && <Check className="h-5 w-5 text-primary" />}
              </Button>
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
