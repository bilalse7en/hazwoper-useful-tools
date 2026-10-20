'use client';

import { useState, useEffect } from 'react';
import { Cookie, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { YouTubeCookieModal } from './youtube-cookie-modal';
import { cn } from '@/lib/utils';

export function YouTubeCookieButton({
  variant = 'outline',
  size = 'sm',
  className = '',
  showLabel = true,
  initialUrl = '',
  onAnalyzeUrl,
  onUpdated,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [cookieStatus, setCookieStatus] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/video-shorts/cookies');
      const data = await res.json();
      setCookieStatus(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const hasCookies = cookieStatus?.hasCookies;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={cn(
          'rounded-xl text-xs font-bold gap-2 cursor-pointer transition-all',
          hasCookies
            ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
            : 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10',
          className
        )}
        title={
          hasCookies
            ? 'YouTube Cookies Active (Click to manage)'
            : 'No YouTube Cookies (Click to upload cookies.txt)'
        }
      >
        <div className="relative">
          <Cookie className="w-3.5 h-3.5" />
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-background',
              hasCookies ? 'bg-emerald-500' : 'bg-amber-500'
            )}
          />
        </div>
        {showLabel && (
          <span>{hasCookies ? 'Cookies Active' : 'Upload cookies.txt'}</span>
        )}
      </Button>

      <YouTubeCookieModal
        isOpen={isOpen}
        initialUrl={initialUrl}
        onAnalyzeUrl={onAnalyzeUrl}
        onClose={() => setIsOpen(false)}
        onCookiesUpdated={() => {
          fetchStatus();
          if (onUpdated) onUpdated();
        }}
      />
    </>
  );
}
