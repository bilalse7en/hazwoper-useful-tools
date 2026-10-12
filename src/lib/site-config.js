/**
 * Global Site Configuration for All Useful Tools
 * Handles dynamic canonical URL resolution, brand identity, and metadata defaults.
 */

export const SITE_CONFIG = {
  name: 'All Useful Tools',
  shortName: 'Useful Tools',
  tagline: 'All-in-One Online Productivity, Media & AI Utilities',
  description:
    'All Useful Tools is your free all-in-one online tool suite with 20+ browser-based utilities. PDF Editor, Word to HTML Converter, Video Compressor, Image Converter, Audio Editor, OCR, AI Assistant, Background Remover & more. No signup. 100% private.',
  publisher: 'All Useful Tools',
  contactEmail: 'bilalghaffar46@gmail.com',
  defaultOgImage: '/og-image.png',
};

/**
 * Resolves the canonical base URL from environment variables or sensible default.
 * Strips any trailing slashes to ensure consistent path concatenation.
 */
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  // Production default domain
  return 'https://hazwoper-useful-tools.vercel.app';
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
