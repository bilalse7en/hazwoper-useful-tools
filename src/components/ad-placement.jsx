'use client';

import { AdContainer } from '@/components/layout/ad-container';

/**
 * AdPlacement Adapter
 * Automatically routes legacy AdPlacement calls to the new centered AdContainer.
 */
export function AdPlacement({ type, className, slot, label }) {
  return (
    <AdContainer
      position={type}
      className={className}
      slot={slot}
      label={label}
    />
  );
}
