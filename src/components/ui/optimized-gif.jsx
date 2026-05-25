'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Professional Optimized GIF Component
 * Bypasses Vercel Image Optimization credits by using unoptimized prop
 * Handles loading, errors, and provides a premium presentation
 */
export function OptimizedGif({
  src,
  alt,
  className,
  containerClassName,
  width,
  height,
  priority = false,
  showStatus = false,
  noLoading = false,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Use proxy for staging media to resolve MIME type issues and QUIC timeouts
  const displaySrc =
    src && src.includes('staging-media')
      ? `/api/proxy-image?url=${encodeURIComponent(src)}`
      : src;

  return (
    <div
      className={cn(
        'relative overflow-hidden group rounded-xl bg-card border border-border/50 shadow-sm',
        containerClassName
      )}
    >
      {loading && !noLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-md z-10 animate-in-fade">
          <div className="relative">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
          </div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 min-h-[100px]">
          <AlertCircle className="w-8 h-8 text-destructive/50" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Neural Link Severed
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reconnect
          </button>
        </div>
      ) : (
        <Image
          src={displaySrc}
          alt={alt || 'Professional Animation'}
          width={width}
          height={height}
          priority={priority}
          unoptimized={true}
          onLoad={() => setLoading(false)}
          onError={(e) => {
            console.error('OptimizedGif Load Error:', e);
            setLoading(false);
            setError(true);
          }}
          className={cn(
            !noLoading && 'transition-all duration-1000 ease-out',
            loading && !noLoading
              ? 'scale-110 blur-2xl opacity-0'
              : 'scale-100 blur-0 opacity-100',
            className
          )}
        />
      )}

      {showStatus && !loading && !error && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest text-emerald-500 backdrop-blur-md">
            Optimized Engine
          </div>
        </div>
      )}
    </div>
  );
}
