import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  analyzeSlideTitle,
  evaluateAssetRelevance,
  deduplicateAndRankAssets,
} from '@/lib/adobe-stock/ai-relevance-engine';
import {
  isAdobeStockConfigured,
  getAdobeStockCredentials,
  searchAdobeStockFiles,
  searchAdobeStockPublicCatalog,
  executeSmartStockSearch,
} from '@/lib/adobe-stock/adobe-stock-service';

describe('AI-Powered Adobe Stock Finder Test Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('1. AI Title Understanding & Technical Query Synthesis', () => {
    it('understands "Utility Power Entry and Service Configuration" and identifies technical equipment', async () => {
      const analysis = await analyzeSlideTitle(
        'Utility Power Entry and Service Configuration'
      );

      expect(analysis).toBeDefined();
      expect(analysis.primarySubject).toContain('Utility Power Entry');
      expect(analysis.domain).toContain('Electrical');

      const equipmentStr = analysis.equipment.join(' ').toLowerCase();
      expect(equipmentStr).toMatch(
        /(switchgear|service entrance|transformer|meter)/
      );

      expect(analysis.queries.length).toBeGreaterThanOrEqual(2);
      expect(analysis.queries[0]).toMatch(
        /(utility|service entrance|switchgear|electrical)/i
      );

      expect(analysis.negativeKeywords).toEqual(
        expect.arrayContaining(['living room', 'kitchen', 'toy'])
      );
    });

    it('understands "General Industry Hand Protection" and prioritizes industrial safety gloves', async () => {
      const analysis = await analyzeSlideTitle(
        'General Industry Hand Protection'
      );

      expect(analysis).toBeDefined();
      expect(analysis.domain).toContain('Hand Protection');

      const equipmentStr = analysis.equipment.join(' ').toLowerCase();
      expect(equipmentStr).toMatch(/(gloves|cut resistant|chemical)/);

      expect(analysis.queries[0]).toMatch(/(gloves|hand protection|safety)/i);

      expect(analysis.negativeKeywords).toEqual(
        expect.arrayContaining(['doctor', 'surgeon', 'fashion leather gloves'])
      );
    });

    it('handles Fall Protection titles with harnesses and lanyards', async () => {
      const analysis = await analyzeSlideTitle(
        'Construction Fall Protection and Safety Harnesses'
      );

      expect(analysis.domain).toContain('Fall Protection');
      expect(analysis.equipment.some((e) => /harness/i.test(e))).toBe(true);
      expect(analysis.negativeKeywords).toContain('bungee jumping');
    });

    it('gracefully handles empty or minimal titles', async () => {
      const analysis = await analyzeSlideTitle('');
      expect(analysis).toBeDefined();
      expect(analysis.queries.length).toBeGreaterThan(0);
    });
  });

  describe('2. Semantic Relevance Scoring & False Positive Penalization', () => {
    const handProtectionAnalysis = {
      domain: 'Industrial Safety & Hand Protection',
      primarySubject: 'Workplace Hand Protection & Safety Gloves',
      equipment: [
        'industrial safety gloves',
        'cut resistant gloves',
        'heavy duty work gloves',
      ],
      negativeKeywords: [
        'doctor',
        'surgeon',
        'surgical',
        'fashion',
        'handshake',
      ],
    };

    it('awards high score (>=80%) to an authentic industrial protective glove photo', () => {
      const genuineAsset = {
        id: 101,
        title:
          'Industrial worker wearing heavy duty cut resistant safety gloves in factory',
        keywords: [
          'industrial safety gloves',
          'workplace',
          'worker',
          'equipment',
          'manufacturing',
        ],
        category: 'Industry',
        thumbnail_500_url: 'https://example.com/thumb500.jpg',
      };

      const result = evaluateAssetRelevance(
        genuineAsset,
        'General Industry Hand Protection',
        handProtectionAnalysis
      );

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.tier).toMatch(/(High|Good) Match/);
    });

    it('severely penalizes medical surgical gloves for industrial hand protection', () => {
      const medicalAsset = {
        id: 102,
        title:
          'Doctor surgeon wearing blue surgical latex exam gloves in hospital',
        keywords: ['doctor', 'surgeon', 'surgical', 'hospital', 'medicine'],
        category: 'Medical',
      };

      const result = evaluateAssetRelevance(
        medicalAsset,
        'General Industry Hand Protection',
        handProtectionAnalysis
      );

      expect(result.score).toBeLessThan(50);
      expect(result.factors.some((f) => f.includes('Deprioritized'))).toBe(
        true
      );
    });

    it('penalizes generic business office handshakes', () => {
      const businessAsset = {
        id: 103,
        title:
          'Business meeting handshake between two executives in modern office',
        keywords: [
          'business meeting',
          'handshake',
          'executives',
          'office laptop',
        ],
        category: 'Business',
      };

      const result = evaluateAssetRelevance(
        businessAsset,
        'General Industry Hand Protection',
        handProtectionAnalysis
      );

      expect(result.score).toBeLessThan(40);
      expect(result.factors.some((f) => f.includes('Generic office'))).toBe(
        true
      );
    });
  });

  describe('3. Deduplication & Slicing (Displaying Correct Number of Images)', () => {
    const analysis = {
      domain: 'Electrical',
      primarySubject: 'Utility Power Entry',
      equipment: ['switchgear', 'transformer'],
      negativeKeywords: ['toy'],
    };

    const mockAssets = [
      {
        id: 201,
        title: 'Utility service entrance switchgear',
        keywords: ['switchgear', 'utility'],
      },
      {
        id: 202,
        title: 'Industrial electrical meter installation',
        keywords: ['electrical meter', 'industrial'],
      },
      { id: 201, title: 'Duplicate of 201', keywords: ['switchgear'] },
      {
        id: 203,
        title: 'Power distribution transformer unit',
        keywords: ['transformer', 'power'],
      },
      {
        id: 204,
        title: 'Electrical switchgear cabinet in plant',
        keywords: ['switchgear', 'equipment'],
      },
      {
        id: 205,
        title: 'High voltage utility service entrance',
        keywords: ['utility', 'service entrance'],
      },
      {
        id: 206,
        title: 'Electrician inspecting meter base',
        keywords: ['electrician', 'meter'],
      },
      {
        id: 207,
        title: 'Transformer substation equipment',
        keywords: ['transformer', 'substation'],
      },
    ];

    it('deduplicates assets strictly by ID', () => {
      const ranked = deduplicateAndRankAssets(
        mockAssets,
        'Utility Power Entry and Service Configuration',
        analysis,
        40
      );

      const ids = ranked.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('accurately displays 1 image if only 1 qualifies', () => {
      const singleAssetList = [mockAssets[0]];
      const ranked = deduplicateAndRankAssets(
        singleAssetList,
        'Utility Power Entry',
        analysis,
        40
      );
      expect(ranked.length).toBe(1);
    });

    it('accurately displays 2 images if 2 qualify', () => {
      const twoAssets = [mockAssets[0], mockAssets[1]];
      const ranked = deduplicateAndRankAssets(
        twoAssets,
        'Utility Power Entry',
        analysis,
        40
      );
      expect(ranked.length).toBe(2);
    });

    it('accurately displays 5 images if 5 qualify', () => {
      const fiveAssets = mockAssets.slice(0, 6).filter((a, idx) => idx !== 2);
      const ranked = deduplicateAndRankAssets(
        fiveAssets,
        'Utility Power Entry',
        analysis,
        40
      );
      expect(ranked.length).toBe(5);
    });

    it('supports 6 initial results and enables hasMore for batches > 6', () => {
      const ranked = deduplicateAndRankAssets(
        mockAssets,
        'Utility Power Entry',
        analysis,
        40
      );
      expect(ranked.length).toBe(7);

      const firstBatch = ranked.slice(0, 6);
      expect(firstBatch.length).toBe(6);

      const hasMore = firstBatch.length < ranked.length;
      expect(hasMore).toBe(true);

      const secondBatch = ranked.slice(6, 12);
      expect(secondBatch.length).toBe(1);
      expect([206, 207]).toContain(secondBatch[0].id);
    });
  });

  describe('4. Zero-Key Fallback & Configuration Readiness', () => {
    it('detects unconfigured ADOBE_STOCK_API_KEY and throws CONFIG_MISSING when directly invoking official API', async () => {
      delete process.env.ADOBE_STOCK_API_KEY;
      delete process.env.ADOBE_CLIENT_ID;
      delete process.env.ADOBE_API_KEY;

      expect(isAdobeStockConfigured()).toBe(false);

      await expect(
        searchAdobeStockFiles({ query: 'switchgear' })
      ).rejects.toThrow('Adobe Stock API credentials are not configured.');
    });

    it('falls back to public catalog search mode when no official API key is present', async () => {
      delete process.env.ADOBE_STOCK_API_KEY;
      delete process.env.ADOBE_CLIENT_ID;

      const mockFallbackFiles = [
        {
          id: 701,
          assetId: '701',
          title: 'Electrician working on utility service entrance switchgear',
          stockUrl: 'https://stock.adobe.com/701',
          previewUrl: 'https://as1.ftcdn.net/701.jpg',
          category: 'Industrial',
          keywords: ['service entrance', 'switchgear', 'utility'],
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const u = String(url);
        if (u.includes('duckduckgo.com/?q=')) {
          return {
            ok: true,
            text: async () => 'vqd=test-vqd-token-123',
          };
        }
        if (u.includes('duckduckgo.com/i.js')) {
          return {
            ok: true,
            json: async () => ({
              results: [
                {
                  url: 'https://stock.adobe.com/images/utility-switchgear/701',
                  image: 'https://as1.ftcdn.net/701.jpg',
                  title:
                    'Electrician working on utility service entrance switchgear',
                },
              ],
            }),
          };
        }
        return { ok: false };
      });

      const res = await executeSmartStockSearch({
        title: 'Utility Power Entry and Service Configuration',
      });

      expect(res.success).toBe(true);
      expect(res.mode).toBe('public-catalog');
      expect(res.results.length).toBe(1);
      expect(res.results[0].assetId).toBe('701');
      expect(res.results[0].stockUrl).toBe('https://stock.adobe.com/701');
    });

    it('recognizes configured ADOBE_STOCK_API_KEY and retrieves credentials', () => {
      process.env.ADOBE_STOCK_API_KEY = 'test_adobe_client_id_123';
      process.env.ADOBE_STOCK_PRODUCT_NAME = 'CustomApp/2.0';

      expect(isAdobeStockConfigured()).toBe(true);
      const creds = getAdobeStockCredentials();
      expect(creds.apiKey).toBe('test_adobe_client_id_123');
      expect(creds.productName).toBe('CustomApp/2.0');
    });
  });

  describe('5. Authorized Adobe Stock API Request Construction & Parsing', () => {
    it('formats search parameters and columns correctly for Adobe Stock API', async () => {
      process.env.ADOBE_STOCK_API_KEY = 'valid_api_key_456';

      const mockAdobeResponse = {
        nb_results: 1,
        files: [
          {
            id: 999888,
            title: 'High voltage utility service entrance disconnect switch',
            width: 4000,
            height: 3000,
            creator_name: 'Jane Expert',
            category: { name: 'Industrial' },
            keywords: [{ name: 'utility' }, { name: 'service entrance' }],
            thumbnail_url: 'https://as2.ftcdn.net/thumb.jpg',
            thumbnail_500_url: 'https://as2.ftcdn.net/thumb500.jpg',
            details_url: 'https://stock.adobe.com/999888',
          },
        ],
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdobeResponse,
      });

      const res = await searchAdobeStockFiles({
        query: 'utility service entrance switchgear',
        limit: 6,
      });

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = new URL(fetchSpy.mock.calls[0][0]);
      expect(calledUrl.origin).toBe('https://stock.adobe.io');
      expect(calledUrl.pathname).toBe('/Rest/Media/1/Search/Files');
      expect(calledUrl.searchParams.get('search_parameters[words]')).toBe(
        'utility service entrance switchgear'
      );

      const calledHeaders = fetchSpy.mock.calls[0][1].headers;
      expect(calledHeaders['x-api-key']).toBe('valid_api_key_456');
      expect(calledHeaders['X-Product']).toBe('AllUsefulTools/1.0');

      expect(res.files.length).toBe(1);
      expect(res.files[0].assetId).toBe('999888');
      expect(res.files[0].stockUrl).toBe('https://stock.adobe.com/999888');
      expect(res.files[0].previewUrl).toBe(
        'https://as2.ftcdn.net/thumb500.jpg'
      );
    });
  });

  describe('6. Client-Side Topic Search Caching & Refresh Policy', () => {
    it('caches searched topics so revisiting previously viewed slides skips re-fetching', () => {
      const topicCache = new Map();
      const fetchCalls = [];

      const mockSearchFunction = (query, forceRefresh = false) => {
        const key = query.trim().toLowerCase();
        if (!forceRefresh && topicCache.has(key)) {
          return { cached: true, ...topicCache.get(key) };
        }
        // Simulated network fetch
        fetchCalls.push(query);
        const resultData = {
          results: [{ assetId: `id_${query}`, title: `Image for ${query}` }],
          totalFound: 1,
          offset: 0,
          hasMore: false,
        };
        topicCache.set(key, resultData);
        return { cached: false, ...resultData };
      };

      // 1. Visit Slide 1 (Topic 1)
      const res1 = mockSearchFunction(
        'Topic 1 Introduction to Fall Protection'
      );
      expect(res1.cached).toBe(false);
      expect(fetchCalls.length).toBe(1);

      // 2. Visit Slide 10 (Topic 10)
      const res10 = mockSearchFunction('Topic 10 Suspension Trauma Relief');
      expect(res10.cached).toBe(false);
      expect(fetchCalls.length).toBe(2);

      // 3. Return to Slide 1 (User scenario: "when i go to 10th slide and i click 1st again")
      const res1Revisit = mockSearchFunction(
        'Topic 1 Introduction to Fall Protection',
        false
      );
      expect(res1Revisit.cached).toBe(true);
      expect(res1Revisit.results[0].assetId).toBe(
        'id_Topic 1 Introduction to Fall Protection'
      );
      // No extra network calls made!
      expect(fetchCalls.length).toBe(2);

      // 4. User explicitly clicks Refresh on Slide 1
      const res1Refresh = mockSearchFunction(
        'Topic 1 Introduction to Fall Protection',
        true
      );
      expect(res1Refresh.cached).toBe(false);
      expect(fetchCalls.length).toBe(3);
    });

    it('updates cached topic results when Show More loads additional images', () => {
      const topicCache = new Map();
      const topicTitle = 'General Industry Hand Protection';
      const key = topicTitle.toLowerCase();

      // Initial search
      topicCache.set(key, {
        results: [{ assetId: '101', title: 'Glove 1' }],
        offset: 0,
        hasMore: true,
        totalFound: 5,
      });

      // Show More action
      const cachedEntry = topicCache.get(key);
      const moreImages = [{ assetId: '102', title: 'Glove 2' }];
      topicCache.set(key, {
        ...cachedEntry,
        results: [...cachedEntry.results, ...moreImages],
        offset: 1,
        hasMore: false,
      });

      // Verification
      const updated = topicCache.get(key);
      expect(updated.results.length).toBe(2);
      expect(updated.results.map((i) => i.assetId)).toEqual(['101', '102']);
      expect(updated.hasMore).toBe(false);
    });
  });

  describe('7. Hierarchical Curriculum Context & Query Distinctness (Course -> Module -> Lesson -> Topic)', () => {
    const courseContext = {
      course: 'Power Systems & Electrical Fundamentals',
      module: 'Module 1: Utility Interconnection & Distribution',
      lesson: 'Lesson 1: Utility Power Entry and Service Configuration',
    };

    it('enriches generic subtopic "Key Components" with parent section and domain context', async () => {
      const analysis = await analyzeSlideTitle('Key Components', {
        ...courseContext,
        parentSection: 'Utility Service Entrance Equipment',
      });

      expect(analysis).toBeDefined();
      expect(analysis.domain).toContain('Electrical');
      // Queries must contain the parent section or domain context, not just generic "key components"
      const queriesJoined = analysis.queries.join(' ').toLowerCase();
      expect(queriesJoined).toMatch(/(utility|service entrance|electrical)/);
      expect(queriesJoined).toContain('key components');
    });

    it('guarantees different topics in the same course produce distinct search queries without repetition', async () => {
      const topic1 = await analyzeSlideTitle('Harmonic Distortion', {
        ...courseContext,
        parentSection: 'Power Factor and Harmonic Distortion Effects',
      });

      const topic2 = await analyzeSlideTitle('Metering Instrumentation', {
        ...courseContext,
        parentSection: 'Metering and Monitoring at the Service Entrance',
      });

      const topic3 = await analyzeSlideTitle('Three-Phase Service', {
        ...courseContext,
        parentSection: 'Three-Phase vs. Single-Phase Service Configuration',
      });

      // Topic 1 must focus on harmonic distortion / power factor
      expect(topic1.queries.some((q) => /harmonic/i.test(q))).toBe(true);

      // Topic 2 must focus on metering / instrumentation
      expect(topic2.queries.some((q) => /meter/i.test(q))).toBe(true);

      // Topic 3 must focus on three-phase
      expect(topic3.queries.some((q) => /three-phase/i.test(q))).toBe(true);

      // Query pools must be mutually distinct (no duplicate first query)
      expect(topic1.queries[0]).not.toBe(topic2.queries[0]);
      expect(topic2.queries[0]).not.toBe(topic3.queries[0]);
      expect(topic1.queries[0]).not.toBe(topic3.queries[0]);
    });
  });

  describe('6. Real Life vs Cartoonic Style Filtering & Curriculum Context Scoring', () => {
    const baseAssetPhoto = {
      id: 'photo_101',
      title:
        'Electrician inspecting industrial switchgear cabinet in power distribution plant',
      media_type_id: 1, // photo
      keywords: [
        { name: 'electrician' },
        { name: 'switchgear' },
        { name: 'photography' },
      ],
    };

    const baseAssetIllustration = {
      id: 'vector_202',
      title:
        'Isometric cartoon vector illustration of utility power transformer and electrical substation',
      media_type_id: 2, // illustration / vector
      keywords: [
        { name: 'cartoon' },
        { name: 'vector' },
        { name: 'illustration' },
        { name: 'substation' },
      ],
    };

    const analysis = {
      domain: 'Electrical Power Systems',
      primarySubject: 'Utility Power Entry and Switchgear',
      equipment: ['switchgear', 'transformer', 'distribution panel'],
      negativeKeywords: ['home', 'toy'],
      courseTerms: ['power', 'electrical', 'systems'],
      moduleTerms: ['interconnection', 'distribution'],
    };

    it('prioritizes Real Life (Photos) when photo=true, illustration=false', () => {
      const photoResult = evaluateAssetRelevance(
        baseAssetPhoto,
        'Utility Power Entry and Service Configuration',
        analysis,
        { photo: true, illustration: false }
      );

      const vectorResult = evaluateAssetRelevance(
        baseAssetIllustration,
        'Utility Power Entry and Service Configuration',
        analysis,
        { photo: true, illustration: false }
      );

      expect(photoResult.score).toBeGreaterThan(vectorResult.score);
      expect(
        photoResult.factors.some((f) => f.includes('Real Life photograph'))
      ).toBe(true);
      expect(
        vectorResult.factors.some((f) => f.includes('illustration/vector'))
      ).toBe(true);
    });

    it('prioritizes Cartoonic (Vectors & Illustrations) when photo=false, illustration=true', () => {
      const photoResult = evaluateAssetRelevance(
        baseAssetPhoto,
        'Utility Power Entry and Service Configuration',
        analysis,
        { photo: false, illustration: true }
      );

      const vectorResult = evaluateAssetRelevance(
        baseAssetIllustration,
        'Utility Power Entry and Service Configuration',
        analysis,
        { photo: false, illustration: true }
      );

      expect(vectorResult.score).toBeGreaterThan(photoResult.score);
      expect(
        vectorResult.factors.some((f) => f.includes('cartoonic/vector'))
      ).toBe(true);
      expect(photoResult.factors.some((f) => f.includes('photograph'))).toBe(
        true
      );
    });

    it('accepts both styles fairly when both photo=true and illustration=true (default)', () => {
      const photoResult = evaluateAssetRelevance(
        baseAssetPhoto,
        'Utility Power Entry and Service Configuration',
        analysis,
        { photo: true, illustration: true }
      );

      const vectorResult = evaluateAssetRelevance(
        baseAssetIllustration,
        'Utility Power Entry and Service Configuration',
        analysis,
        { photo: true, illustration: true }
      );

      // Both should have good positive relevance without style penalties
      expect(photoResult.score).toBeGreaterThan(50);
      expect(vectorResult.score).toBeGreaterThan(50);
      expect(photoResult.factors.some((f) => f.includes('Excluded:'))).toBe(
        false
      );
      expect(vectorResult.factors.some((f) => f.includes('Excluded:'))).toBe(
        false
      );
    });

    it('boosts relevance score when asset matches Course and Module context', () => {
      const assetWithModuleTerms = {
        id: 'module_match_303',
        title:
          'Utility interconnection and distribution line feeding industrial power facility',
        keywords: [
          { name: 'utility' },
          { name: 'interconnection' },
          { name: 'distribution' },
        ],
      };

      const assetWithoutModuleTerms = {
        id: 'generic_404',
        title: 'High voltage warning signage on metal fence',
        keywords: [{ name: 'warning' }, { name: 'danger' }],
      };

      const matchScore = evaluateAssetRelevance(
        assetWithModuleTerms,
        'Utility Power Entry and Service Configuration',
        analysis,
        { photo: true, illustration: true }
      );

      const noMatchScore = evaluateAssetRelevance(
        assetWithoutModuleTerms,
        'Utility Power Entry and Service Configuration',
        analysis,
        { photo: true, illustration: true }
      );

      expect(matchScore.score).toBeGreaterThan(noMatchScore.score);
      expect(
        matchScore.factors.some(
          (f) => f.includes('Course') || f.includes('Module')
        )
      ).toBe(true);
    });
  });
});
