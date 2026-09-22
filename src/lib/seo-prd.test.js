import { describe, it, expect } from 'vitest';
import { SITE_CONFIG, getSiteUrl, getCanonicalUrl } from './site-config';
import {
  toolIdToSlug,
  slugToToolId,
  toolInfo,
  createPageMetadata,
  generateWebSiteSchema,
  organizationSchema,
} from './seo';
import { toolEditorialContent } from './editorial';
import { guidesData } from './guides-data';

describe('Site Config and Dynamic Canonical URL resolution', () => {
  it('correctly resolves default site URL without trailing slash', () => {
    const url = getSiteUrl();
    expect(url).toMatch(/^https?:\/\//);
    expect(url.endsWith('/')).toBe(false);
  });

  it('generates properly formatted canonical URLs for internal routes', () => {
    const baseUrl = getSiteUrl();
    expect(getCanonicalUrl('')).toBe(baseUrl);
    expect(getCanonicalUrl('/')).toBe(baseUrl);
    expect(getCanonicalUrl('/tools')).toBe(`${baseUrl}/tools`);
    expect(getCanonicalUrl('tools/image-converter')).toBe(
      `${baseUrl}/tools/image-converter`
    );
    expect(getCanonicalUrl('/guides')).toBe(`${baseUrl}/guides`);
  });
});

describe('Page Metadata Factory (PRD Standardized Metadata)', () => {
  it('creates full metadata object with canonical and OpenGraph', () => {
    const meta = createPageMetadata({
      title: 'Test Title',
      description: 'Test Description',
      path: '/test-page',
    });

    expect(meta.title).toContain('Test Title');
    expect(meta.title).toContain(SITE_CONFIG.name);
    expect(meta.description).toBe('Test Description');
    expect(meta.alternates.canonical).toBe(getCanonicalUrl('/test-page'));
    expect(meta.openGraph.url).toBe(getCanonicalUrl('/test-page'));
    expect(meta.openGraph.siteName).toBe(SITE_CONFIG.name);
    expect(meta.twitter.card).toBe('summary_large_image');
  });

  it('handles noindex flag properly for administrative/not-found pages', () => {
    const meta = createPageMetadata({
      title: 'Admin Only',
      description: 'Secret area',
      path: '/admin',
      noindex: true,
    });

    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});

describe('PRD Editorial Completeness: 100% of all 21 Interactive Tools', () => {
  const allToolSlugs = Object.keys(slugToToolId);

  it('has exactly 21 tools mapped in slugToToolId and toolIdToSlug', () => {
    expect(allToolSlugs.length).toBe(21);
    expect(Object.keys(toolIdToSlug).length).toBe(21);
  });

  it('provides complete editorial content for every single tool', () => {
    allToolSlugs.forEach((slug) => {
      const editorial = toolEditorialContent[slug];
      expect(
        editorial,
        `Tool "${slug}" is missing from toolEditorialContent`
      ).toBeDefined();

      // Check key sections required by PRD
      expect(
        editorial.overview,
        `Tool "${slug}" missing overview`
      ).toBeTruthy();
      expect(
        typeof editorial.stepByStep === 'string' &&
          editorial.stepByStep.length > 50,
        `Tool "${slug}" missing substantial stepByStep instructions`
      ).toBe(true);
      expect(
        editorial.methodology,
        `Tool "${slug}" missing methodology`
      ).toBeTruthy();
      expect(
        editorial.examples,
        `Tool "${slug}" missing examples`
      ).toBeTruthy();
      expect(
        Array.isArray(editorial.additionalFaq),
        `Tool "${slug}" missing additionalFaq array`
      ).toBe(true);
      expect(
        editorial.additionalFaq.length,
        `Tool "${slug}" must have at least 3 additional FAQs`
      ).toBeGreaterThanOrEqual(3);
    });
  });

  it('has corresponding toolInfo for every single tool', () => {
    allToolSlugs.forEach((slug) => {
      const info = toolInfo[slug];
      expect(info, `Tool "${slug}" is missing from toolInfo`).toBeDefined();
      expect(info.name).toBeTruthy();
      expect(info.detailedDescription).toBeTruthy();
      expect(Array.isArray(info.benefits)).toBe(true);
    });
  });
});

describe('Educational Technical Guides Structure', () => {
  it('has at least 4 authoritative technical guides', () => {
    expect(guidesData.length).toBeGreaterThanOrEqual(4);
  });

  it('each guide contains title, summary, readingTime, relatedTools, and sections', () => {
    guidesData.forEach((guide) => {
      expect(guide.slug).toBeTruthy();
      expect(guide.title).toBeTruthy();
      expect(guide.summary).toBeTruthy();
      expect(guide.readingTime).toMatch(/min read/);
      expect(Array.isArray(guide.relatedTools)).toBe(true);
      expect(guide.relatedTools.length).toBeGreaterThan(0);
      expect(Array.isArray(guide.sections)).toBe(true);
      expect(guide.sections.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('Schema.org Structured Data', () => {
  it('generates valid WebSite schema with potentialAction', () => {
    const webSiteSchema = generateWebSiteSchema();
    expect(webSiteSchema['@context']).toBe('https://schema.org');
    expect(webSiteSchema['@type']).toBe('WebSite');
    expect(webSiteSchema.potentialAction['@type']).toBe('SearchAction');
  });

  it('has valid Organization schema matching site identity', () => {
    expect(organizationSchema['@context']).toBe('https://schema.org');
    expect(organizationSchema['@type']).toBe('Organization');
    expect(organizationSchema.name).toBe(SITE_CONFIG.name);
    expect(organizationSchema.contactPoint.email).toBe(
      SITE_CONFIG.contactEmail
    );
  });
});
