'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AdSenseAd } from '@/components/adsense-ad';

/**
 * Standard IAB display ad formats with controlled dimensions
 */
const AD_FORMAT_SIZES = {
  // Top/Header Leaderboard (728x90, 970x90, 970x250)
  'top-banner': {
    slot: process.env.NEXT_PUBLIC_ADSENSE_TOP_BANNER_SLOT || '2843368252',
    label: 'Advertisement',
    minHeight: 90,
    maxWidthClass: 'max-w-[728px] lg:max-w-[970px]',
    aspectRatio: '970 / 90',
  },
  // In-Content Medium Rectangle or Large Leaderboard (336x280, 300x250, 970x250)
  'in-content': {
    slot: process.env.NEXT_PUBLIC_ADSENSE_IN_CONTENT_SLOT || '6825091272',
    label: 'Sponsored',
    minHeight: 250,
    maxWidthClass: 'max-w-[336px] sm:max-w-[728px] lg:max-w-[970px]',
    aspectRatio: '970 / 250',
  },
  // Above-Footer Horizontal Ad (728x90, 970x90)
  footer: {
    slot: process.env.NEXT_PUBLIC_ADSENSE_FOOTER_SLOT || '1516924274',
    label: 'Sponsored Content',
    minHeight: 90,
    maxWidthClass: 'max-w-[728px] lg:max-w-[970px]',
    aspectRatio: '970 / 90',
  },
  // Below-Header Ad Slot
  'below-header': {
    slot: process.env.NEXT_PUBLIC_ADSENSE_TOP_BANNER_SLOT || '2843368252',
    label: 'Advertisement',
    minHeight: 90,
    maxWidthClass: 'max-w-[728px] lg:max-w-[970px]',
    aspectRatio: '970 / 90',
  },
  // Sidebar Skyscraper / Half-Page (300x250, 300x600)
  sidebar: {
    slot: process.env.NEXT_PUBLIC_ADSENSE_IN_CONTENT_SLOT || '6825091272',
    label: 'Advertisement',
    minHeight: 250,
    maxWidthClass: 'max-w-[300px]',
    aspectRatio: '300 / 250',
  },
  // Auto Responsive Clamped
  auto: {
    slot: process.env.NEXT_PUBLIC_ADSENSE_IN_CONTENT_SLOT || '6825091272',
    label: 'Advertisement',
    minHeight: 90,
    maxWidthClass: 'max-w-[320px] sm:max-w-[728px] lg:max-w-[970px]',
    aspectRatio: 'auto',
  },
};

/**
 * AdContainer Component
 *
 * Professional, strictly centered container for advertisements.
 * Enforces controlled max-widths so advertisements NEVER stretch liquidly across
 * 2560px or 3840px (4K) viewports when the parent layout expands.
 *
 * Props:
 * - position: 'top-banner' | 'in-content' | 'footer' | 'below-header' | 'sidebar' | 'auto'
 * - slot: Optional custom AdSense slot override
 * - label: Optional label override ('Sponsored', 'Advertisement', etc.)
 * - showLabel: Boolean flag to show/hide the micro disclaimer label
 * - className: Outer wrapper classes
 */
export const AdContainer = forwardRef(function AdContainer(
  {
    position = 'in-content',
    slot,
    label,
    showLabel = true,
    className,
    margin = 'default', // 'tight' | 'default' | 'loose' | 'none'
    ...props
  },
  ref
) {
  const formatConfig = AD_FORMAT_SIZES[position] || AD_FORMAT_SIZES.auto;
  const activeSlot = slot || formatConfig.slot;
  const displayLabel = label || formatConfig.label;

  const marginClasses = {
    tight: 'my-3 sm:my-4',
    default: 'my-6 sm:my-8 md:my-10',
    loose: 'my-10 sm:my-14 md:my-16',
    none: 'my-0',
  };

  return (
    <aside
      ref={ref}
      aria-label="Advertisement Container"
      className={cn(
        'w-full flex flex-col items-center justify-center clear-both relative z-10 transition-all duration-200 select-none pointer-events-auto',
        marginClasses[margin] || marginClasses.default,
        className
      )}
      {...props}
    >
      {/* Centered Constrained Ad Shell (Never stretches to ultrawide width) */}
      <div
        className={cn(
          'w-full mx-auto flex flex-col items-center justify-center',
          formatConfig.maxWidthClass
        )}
      >
        {showLabel && (
          <div className="w-full flex items-center justify-center mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 dark:text-muted-foreground/50 select-none">
              {displayLabel}
            </span>
          </div>
        )}

        {/* Ad Unit Surface with Controlled Height & Aspect Ratio */}
        <div
          style={{ minHeight: `${formatConfig.minHeight}px` }}
          className="w-full rounded-2xl overflow-hidden bg-card/40 dark:bg-card/20 border border-border/40 shadow-xs flex items-center justify-center transition-all"
        >
          <AdSenseAd
            slot={activeSlot}
            format="auto"
            responsive={true}
            className="w-full flex items-center justify-center"
          />
        </div>
      </div>
    </aside>
  );
});
