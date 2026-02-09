import { useEffect, useState } from "react";
import { BrandLogo } from "./brand-logo";

/**
 * Initial Loading Shell - Optimized for SI and LCP
 */
export function InitialLoadingShell({ isReady = false }) {
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (!shouldShow) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500"
      style={{ 
        opacity: isReady ? 0 : 1,
        backgroundColor: 'var(--background)'
      }}
    >
      <div className="flex flex-col items-center gap-6 px-4">
        {/* Animated GIF Logo - Set to priority for LCP */}
        <div className="relative">
          <BrandLogo size="lg" animate={true} className="shadow-2xl shadow-primary/40 relative z-10" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-cyan-500 blur-2xl opacity-20 animate-pulse" />
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent italic tracking-tighter">
            Content Suite
          </h2>
          <p className="text-sm text-foreground/70 font-bold uppercase tracking-widest animate-pulse">
            Loading Workspace
          </p>
        </div>

        {/* Loading Bars */}
        <div className="flex gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
