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
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  useEffect(() => {
    // Push ads in production
    if (isProduction && typeof window !== 'undefined') {
      try {
        // Wait for script to load
        const interval = setInterval(() => {
          if (window.adsbygoogle) {
            clearInterval(interval);
            window.adsbygoogle = window.adsbygoogle || [];
            window.adsbygoogle.push({});
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => clearInterval(interval), 5000);
      } catch (error) {
        // Silent error handling in production
      }
    }
  }, [isProduction, slot]);

  // Show placeholder in development
  if (!isProduction) {
    return (
      <div 
        className="bg-muted/20 border border-dashed border-muted-foreground/20 rounded-lg p-4 text-center text-xs text-muted-foreground"
        style={{ minHeight: '90px', ...style }}>
        Ad Placeholder (Production Only)
      </div>
    );
  }

  // Production: render actual ad
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
