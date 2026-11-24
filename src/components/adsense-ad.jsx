'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Google AdSense Ad Container Component
 *
 * Configured for AdSense Publisher ID: ca-pub-9874465109252768
 *
 * Props:
 * - slot: AdSense ad unit slot ID
 * - format: Ad format (auto, rectangle, horizontal, vertical)
 * - responsive: Whether ad should be responsive
 * - style: Custom styles for the container
 * - className: Additional CSS classes
 */
export function AdSenseAd({
  slot,
  format = 'auto',
  responsive = true,
  style = {},
  className,
}) {
  const adRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only attempt ad push once mounted on client
    if (!mounted || adLoaded || !adRef.current) return;

    // Filter out invalid placeholder slot IDs
    const isPlaceholder =
      !slot ||
      slot === '0000000000' ||
      slot === '1234567890' ||
      slot === '6543210987' ||
      slot === '9876543210';

    if (isPlaceholder) return;

    // Guard: Check if the ins element already has ads rendered or pushed
    const insElement = adRef.current.querySelector('.adsbygoogle');
    if (
      !insElement ||
      insElement.getAttribute('data-ad-status') ||
      insElement.getAttribute('data-adsbygoogle-status')
    ) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setAdLoaded(true);
    } catch (e) {
      console.warn('AdSense push notice:', e);
    }
  }, [mounted, slot, adLoaded]);

  // Don't render if no slot provided
  if (!slot) return null;

  // Render responsive AdSense ad unit
  return (
    <div
      ref={adRef}
      className={cn(
        'adsense-container w-full min-w-full overflow-hidden block text-center',
        className
      )}
      style={style}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          minWidth: '280px',
        }}
        data-ad-client="ca-pub-9874465109252768"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}
