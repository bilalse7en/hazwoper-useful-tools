'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Google AdSense Ad Container Component
 *
 * IMPORTANT: Replace slot IDs with your REAL ad unit IDs from
 * https://www.google.com/adsense → Ads → By ad unit → Create ad unit
 *
 * Props:
 * - slot: Your REAL AdSense ad slot ID from your AdSense dashboard
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
  const [adLoaded, setAdLoaded] = useState(false);
  const isProduction =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  useEffect(() => {
    // Don't render ads in development or if already loaded
    if (!isProduction || adLoaded || !adRef.current) return;

    // Don't push if no valid slot is provided or if it's a placeholder
    const isPlaceholder =
      !slot ||
      slot === '0000000000' ||
      slot === '1234567890' ||
      slot === '6543210987' ||
      slot === '9876543210';

    if (isPlaceholder) {
      if (!isProduction) {
        console.warn(
          `AdSenseAd: Placeholder slot ID "${slot}" detected. Replace with real ID from dashboard.`
        );
      }
      return;
    }

    // Check if the ins element already has ads rendered (data-ad-status)
    const insElement = adRef.current.querySelector('.adsbygoogle');
    if (insElement?.getAttribute('data-ad-status')) {
      return; // Already filled by Google
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          try {
            // Wait for the adsbygoogle script to be available
            const interval = setInterval(() => {
              if (window.adsbygoogle) {
                clearInterval(interval);
                // Only push if not already filled
                const currentIns = adRef.current?.querySelector('.adsbygoogle');
                if (currentIns && !currentIns.getAttribute('data-ad-status')) {
                  window.adsbygoogle = window.adsbygoogle || [];
                  window.adsbygoogle.push({});

                  setAdLoaded(true);
                }
              }
            }, 200);
            // Safety timeout: stop trying after 8 seconds
            setTimeout(() => clearInterval(interval), 8000);
          } catch (e) {
            console.error('AdSense push error:', e);
          }
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(adRef.current);

    const currentAd = adRef.current;
    return () => {
      if (currentAd) {
        observer.unobserve(currentAd);
        currentAd.innerHTML = '';
      }
    };
  }, [isProduction, slot, adLoaded]);

  // Show placeholder in development
  if (!isProduction) {
    return (
      <div
        className={cn(
          'bg-muted/20 border border-dashed border-muted-foreground/20 rounded-lg p-4 text-center text-xs text-muted-foreground',
          className
        )}
        style={{ minHeight: '90px', ...style }}
      >
        Ad Placeholder — Slot: {slot || 'NOT SET'} (Production Only)
      </div>
    );
  }

  // Don't render if no slot provided
  if (!slot) return null;

  // Production: render actual ad
  return (
    <div
      ref={adRef}
      className={cn('adsense-container', className)}
      style={style}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9874465109252768"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
}
