"use client";

import { useEffect } from "react";
import { toolMetadata, toolInfo, generateToolSchema, generateBreadcrumbSchema } from "@/lib/seo";

// Generate metadata on the client side for each tool
export function useToolMetadata(toolSlug) {
  const metadata = toolMetadata[toolSlug];
  const info = toolInfo[toolSlug];

  useEffect(() => {
    if (!metadata || !info) return;

    // Update document title
    document.title = metadata.title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = metadata.description;

    // Update keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = metadata.keywords;

    // Update canonical
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = `https://hazwoper-useful-tools.vercel.app${metadata.canonical}`;

    // Update Open Graph tags
    const ogTags = {
      'og:title': metadata.title,
      'og:description': metadata.description,
      'og:url': `https://hazwoper-useful-tools.vercel.app${metadata.canonical}`,
      'og:type': 'website',
      'og:image': `https://hazwoper-useful-tools.vercel.app${metadata.ogImage}`,
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Update Twitter Card tags
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': metadata.title,
      'twitter:description': metadata.description,
      'twitter:image': `https://hazwoper-useful-tools.vercel.app${metadata.ogImage}`,
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });
  }, [metadata, info, toolSlug]);
}
