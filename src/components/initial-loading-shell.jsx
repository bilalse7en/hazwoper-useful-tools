"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Initial Loading Shell - Instant Render Component
 * 
 * This component provides immediate visual feedback during initial page load
 * and authentication checks. It helps PageSpeed Insights measure performance
 * by ensuring something renders instantly (First Contentful Paint).
 * 
 * Features:
 * - Minimal, fast-loading design
 * - Smooth fade-in animation
 * - Theme-aware (respects dark/light mode)
 * - Auto-hides when ready
 */
export function InitialLoadingShell({ isReady = false }) {
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    if (isReady) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShouldShow(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (!shouldShow) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500"
      style={{ opacity: isReady ? 0 : 1 }}
    >
      <div className="flex flex-col items-center gap-6 px-4 animate-in fade-in duration-700">
        {/* Actual Brand Logo */}
        <div className="relative">
          <Image 
            src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
            alt="Content Suite Logo"
            width={80}
            height={80}
            priority={true}
            className="h-20 w-20 rounded-2xl shadow-2xl shadow-primary/50 object-cover"
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-cyan-500 blur-xl opacity-30 animate-pulse" />
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Content Suite
          </h2>
          <p className="text-sm text-foreground/80 animate-pulse">
            Loading your workspace...
          </p>
        </div>

        {/* Loading Bars */}
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
