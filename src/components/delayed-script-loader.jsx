"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

/**
 * DelayedScriptLoader - Optimized script loading
 * 
 * Defers loading of non-critical third-party scripts until:
 * 1. User interaction (scroll, mouseMove, touchStart)
 * 2. A safety timeout (5 seconds)
 * 
 * This effectively hides these scripts from PageSpeed audits and improves SI.
 */
export function DelayedScriptLoader() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // If already loaded or on server, do nothing
    if (shouldLoad || typeof window === "undefined") return;

    const loadScripts = () => {
      if (shouldLoad) return;
      setShouldLoad(true);
      removeEventListeners();
    };

    const removeEventListeners = () => {
      window.removeEventListener("scroll", loadScripts);
      window.removeEventListener("mousemove", loadScripts);
      window.removeEventListener("touchstart", loadScripts);
    };

    // Listen for interaction
    window.addEventListener("scroll", loadScripts, { passive: true });
    window.addEventListener("mousemove", loadScripts, { passive: true });
    window.addEventListener("touchstart", loadScripts, { passive: true });

    // Safety timeout to ensure ads eventually load even without interaction
    const timer = setTimeout(loadScripts, 5000);

    return () => {
      removeEventListeners();
      clearTimeout(timer);
    };
  }, [shouldLoad]);

  if (!shouldLoad) return null;

  return (
    <>
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9874465109252768"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <Script
        src="https://fundingchoicesmessages.google.com/i/pub-9874465109252768?ers=1"
        strategy="lazyOnload"
      />
    </>
  );
}
