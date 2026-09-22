/**
 * Global Site Configuration for All Useful Tools
 * Handles dynamic canonical URL resolution, brand identity, and metadata defaults.
 */

export const SITE_CONFIG = {
  name: 'All Useful Tools',
  shortName: 'Useful Tools',
  tagline: 'All-in-One Online Productivity, Media & AI Utilities',
  description:
    'Free online productivity and media tools: PDF Editor, Word to HTML, Video Compressor, Video to GIF, Audio Converter, Audio Editor, Image Converter, OCR, and AI Assistants. High performance with local-first browser privacy.',
  publisher: 'All Useful Tools',
  contactEmail: 'bilalghaffar46@gmail.com',
  defaultOgImage: '/og-image.png',
};

/**
 * Resolves the canonical base URL from environment variables or sensible default.
 * Strips any trailing slashes to ensure consistent path concatenation.
 */
export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://hazwoper-useful-tools.vercel.app');
  return url.replace(/\/+$/, '');
}

/**
 * Builds an absolute canonical URL for any internal route.
 * Guarantees leading slash on path and no duplicate slashes.
 *
 * @param {string} [path=''] - The relative path, e.g. '/tools/image-converter'
 * @returns {string} Fully qualified canonical URL
 */
export function getCanonicalUrl(path = '') {
  const baseUrl = getSiteUrl();
  if (!path || path === '/') {
    return baseUrl;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
