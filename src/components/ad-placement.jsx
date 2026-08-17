'use client';

import { AdSenseAd } from '@/components/adsense-ad';
import { cn } from '@/lib/utils';

const AD_CONFIG = {
  'top-banner': {
    slot: '2228101298',
    format: 'horizontal',
    minHeight: '90px',
    label: 'Sponsored',
  },
  'in-content': {
    slot: '2228101298',
    format: 'rectangle',
    minHeight: '250px',
    label: 'Advertisement',
  },
  footer: {
    slot: '2228101298',
    format: 'horizontal',
    minHeight: '90px',
    label: 'Sponsored Content',
  },
};

export function AdPlacement({ type, className }) {
  const config = AD_CONFIG[type];
  if (!config) return null;

  return (
    <div className={cn('w-full my-6', className)}>
      <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-1 ml-1">
        {config.label}
      </span>
      <div style={{ minHeight: config.minHeight }} className="flex justify-center items-center">
        <AdSenseAd
          slot={config.slot}
          format={config.format}
          className="rounded-2xl overflow-hidden border border-border/30 w-full"
        />
      </div>
    </div>
  );
}
