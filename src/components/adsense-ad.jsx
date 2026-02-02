"use client";

import { useEffect, useRef } from "react";

/**
 * Google AdSense Ad Container Component
 * 
 * Usage:
 * <AdSenseAd 
 *   slot="1234567890" 
 *   format="auto" 
 *   responsive={true}
 * />
 * 
 * Props:
 * - slot: Your AdSense ad slot ID (you'll get this from Google AdSense)
 * - format: Ad format (auto, rectangle, horizontal, vertical)
 * - responsive: Whether ad should be responsive
 * - style: Custom styles for the container
 */
export function AdSenseAd({ 
  slot = "0000000000", 
  format = "auto", 
  responsive = true,
  style = {}
}) {
  const adRef = useRef(null);

  useEffect(() => {
    // Only push ads in production and if window.adsbygoogle exists
    if (typeof window !== 'undefined' && window.adsbygoogle && process.env.NODE_ENV === 'production') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    }
  }, []);

  // Only show ads in production
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div 
        className="bg-muted/20 border border-dashed border-muted-foreground/20 rounded-lg p-4 text-center text-xs text-muted-foreground"
        style={{ minHeight: '90px', ...style }}
      >
        Ad Placeholder (Production Only)
      </div>
    );
  }

  return (
    <div ref={adRef} style={style}>
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
