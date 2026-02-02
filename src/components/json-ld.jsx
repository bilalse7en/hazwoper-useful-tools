"use client";

import { useEffect } from "react";

/**
 * JSON-LD Structured Data Component
 * Injects schema.org markup into the page for better SEO
 */
export function JsonLd({ data }) {
  useEffect(() => {
    // Inject structured data into the page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'jsonld-script';
    
    // Remove existing script if present
    const existing = document.getElementById('jsonld-script');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('jsonld-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data]);

  return null;
}
