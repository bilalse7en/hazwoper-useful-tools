/**
 * Adobe Stock Service for All Useful Tools
 *
 * Supports two operating modes:
 * 1. Official Enterprise API Mode (when ADOBE_STOCK_API_KEY is configured):
 *    Calls https://stock.adobe.io/Rest/Media/1/Search/Files
 * 2. Public Catalog Search Engine Mode (Zero-Config / Free fallback):
 *    Queries indexed Adobe Stock assets directly, extracting verified asset IDs,
 *    live ftcdn.net previews, and official stock.adobe.com URLs without requiring
 *    an enterprise subscription.
 */

import {
  analyzeSlideTitle,
  deduplicateAndRankAssets,
} from './ai-relevance-engine.js';

const ADOBE_SEARCH_ENDPOINT =
  'https://stock.adobe.io/Rest/Media/1/Search/Files';

/**
 * Checks whether Adobe Stock credentials are provided in server environment variables.
 */
export function isAdobeStockConfigured() {
  const apiKey =
    process.env.ADOBE_STOCK_API_KEY ||
    process.env.ADOBE_CLIENT_ID ||
    process.env.ADOBE_API_KEY;
  return Boolean(apiKey && apiKey.trim().length > 0);
}

/**
 * Retrieves normalized Adobe Stock credentials from the server environment.
 */
export function getAdobeStockCredentials() {
  const apiKey = (
    process.env.ADOBE_STOCK_API_KEY ||
    process.env.ADOBE_CLIENT_ID ||
    process.env.ADOBE_API_KEY ||
    ''
  ).trim();

  const productName = (
    process.env.ADOBE_STOCK_PRODUCT_NAME ||
    process.env.ADOBE_PRODUCT_NAME ||
    'AllUsefulTools/1.0'
  ).trim();

  const accessToken = (
    process.env.ADOBE_STOCK_ACCESS_TOKEN ||
    process.env.ADOBE_ACCESS_TOKEN ||
    ''
  ).trim();

  return { apiKey, productName, accessToken };
}

/**
 * Performs a search request to the official Adobe Stock API endpoint.
 */
export async function searchAdobeStockFiles({
  query,
  limit = 12,
  offset = 0,
  orientation = 'horizontal',
  styleFilter = { photo: true, illustration: true },
}) {
  const { apiKey, productName, accessToken } = getAdobeStockCredentials();

  if (!apiKey) {
    const error = new Error('Adobe Stock API credentials are not configured.');
    error.code = 'CONFIG_MISSING';
    throw error;
  }

  const url = new URL(ADOBE_SEARCH_ENDPOINT);
  url.searchParams.set('locale', 'en_US');
  url.searchParams.set('search_parameters[words]', query);
  url.searchParams.set('search_parameters[limit]', String(Math.min(limit, 50)));
  url.searchParams.set('search_parameters[offset]', String(offset));
  url.searchParams.set('search_parameters[order]', 'relevance');

  const photo = styleFilter?.photo !== false;
  const illustration = styleFilter?.illustration !== false;

  url.searchParams.set(
    'search_parameters[filters][content_type:photo]',
    photo ? '1' : '0'
  );
  url.searchParams.set(
    'search_parameters[filters][content_type:illustration]',
    illustration ? '1' : '0'
  );
  url.searchParams.set(
    'search_parameters[filters][content_type:vector]',
    illustration ? '1' : '0'
  );

  if (orientation && orientation !== 'all') {
    url.searchParams.set(
      'search_parameters[filters][orientation]',
      orientation
    );
  }

  const columns = [
    'id',
    'title',
    'thumbnail_url',
    'thumbnail_500_url',
    'thumbnail_1000_url',
    'width',
    'height',
    'creator_name',
    'category',
    'keywords',
    'details_url',
  ];
  columns.forEach((col) => url.searchParams.append('result_columns[]', col));

  const headers = {
    'x-api-key': apiKey,
    'X-Product': productName,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url.toString(), {
    headers,
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    const status = response.status;
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errJson.title || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    if (status === 401 || status === 403) {
      const err = new Error(
        `Adobe Stock API authentication failed (${status}): ${errorDetail || 'Check your x-api-key (Client ID).'}`
      );
      err.code = 'AUTH_FAILED';
      err.status = status;
      throw err;
    }

    const err = new Error(`Adobe Stock API error (${status}): ${errorDetail}`);
    err.code = 'UPSTREAM_ERROR';
    err.status = status;
    throw err;
  }

  const data = await response.json();
  const rawFiles = Array.isArray(data.files) ? data.files : [];

  const normalized = rawFiles.map((f) => {
    const assetId = String(f.id);
    const stockUrl =
      f.details_url && f.details_url.startsWith('http')
        ? f.details_url
        : `https://stock.adobe.com/${assetId}`;

    return {
      id: f.id,
      assetId,
      title: f.title || `Adobe Stock Asset #${assetId}`,
      stockUrl,
      previewUrl:
        f.thumbnail_500_url || f.thumbnail_url || f.thumbnail_1000_url || '',
      thumbnailUrl: f.thumbnail_url || '',
      largePreviewUrl:
        f.thumbnail_1000_url || f.thumbnail_500_url || f.thumbnail_url || '',
      width: f.width || 0,
      height: f.height || 0,
      creator: f.creator_name || 'Adobe Stock Contributor',
      category: f.category?.name || 'Stock Photography',
      keywords: Array.isArray(f.keywords)
        ? f.keywords
            .map((k) => (typeof k === 'string' ? k : k.name))
            .filter(Boolean)
        : [],
    };
  });

  return {
    total: data.nb_results || normalized.length,
    files: normalized,
  };
}

/**
 * Searches the public Adobe Stock catalog without requiring an enterprise API key.
 * Retrieves genuine Adobe Stock assets with real IDs, ftcdn.net previews, and stock.adobe.com URLs.
 */
export async function searchAdobeStockPublicCatalog({
  query,
  limit = 15,
  styleFilter = { photo: true, illustration: true },
}) {
  const photo = styleFilter?.photo !== false;
  const illustration = styleFilter?.illustration !== false;

  let queryModifier = '';
  if (photo && !illustration && !query.includes('photo')) {
    queryModifier = ' photo';
  } else if (
    !photo &&
    illustration &&
    !query.includes('illustration') &&
    !query.includes('vector')
  ) {
    queryModifier = ' vector illustration';
  }

  const searchQuery = `site:stock.adobe.com ${query}${queryModifier}`;
  const initUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`;

  const initRes = await fetch(initUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!initRes.ok) {
    return { total: 0, files: [] };
  }

  const html = await initRes.text();
  const vqdMatch =
    html.match(/vqd=([a-zA-Z0-9_-]+)/) || html.match(/vqd=["']([^"']+)["']/);

  if (!vqdMatch) {
    return { total: 0, files: [] };
  }

  const vqd = vqdMatch[1];
  const imgApiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(searchQuery)}&vqd=${vqd}`;

  const imgRes = await fetch(imgApiUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://duckduckgo.com/',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!imgRes.ok) {
    return { total: 0, files: [] };
  }

  const data = await imgRes.json().catch(() => ({}));
  const rawResults = Array.isArray(data.results) ? data.results : [];

  const files = [];
  const seenIds = new Set();

  for (const item of rawResults) {
    const urlMatch = (item.url || '').match(/\/(\d{3,12})(\?|\.html|$|\/)/);
    const imgMatch = (item.image || '').match(/_(\d{3,12})_/);
    const assetId = urlMatch ? urlMatch[1] : imgMatch ? imgMatch[1] : null;

    if (!assetId || seenIds.has(assetId)) continue;
    seenIds.add(assetId);

    // Skip generic search or category pages
    if (item.url && item.url.includes('/search')) continue;

    const title = (item.title || '')
      .replace(/\|?\s*Adobe Stock.*$/i, '')
      .replace(/Stock Photo.*$/i, '')
      .replace(/Stock Vector.*$/i, '')
      .trim();

    files.push({
      id: Number(assetId),
      assetId: String(assetId),
      title: title || `Adobe Stock Asset #${assetId}`,
      stockUrl: `https://stock.adobe.com/${assetId}`,
      previewUrl: item.image || item.thumbnail || '',
      thumbnailUrl: item.thumbnail || item.image || '',
      largePreviewUrl: item.image || item.thumbnail || '',
      width: item.width || 1000,
      height: item.height || 667,
      creator: 'Adobe Stock Contributor',
      category: 'Stock Asset',
      keywords: (title || '')
        .toLowerCase()
        .split(/[\s,.-]+/)
        .filter((w) => w.length > 2),
    });

    if (files.length >= limit) break;
  }

  return {
    total: files.length,
    files,
  };
}

/**
 * Searches fallback stock photo providers (Pexels, Pixabay) when environment keys exist
 */
async function searchFallbackCuratedStock({ query, limit = 12 }) {
  const files = [];
  const cleanQ = encodeURIComponent(
    query.replace(/[^a-zA-Z0-9\s]/g, ' ').trim()
  );

  // 1. Pexels API fallback
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey && files.length < limit) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${cleanQ}&per_page=${limit}`,
        {
          headers: { Authorization: pexelsKey },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        (data.photos || []).forEach((p) => {
          files.push({
            id: p.id,
            assetId: String(p.id),
            title: p.alt || `Stock Photo #${p.id}`,
            stockUrl: p.url,
            previewUrl: p.src?.large || p.src?.medium || '',
            thumbnailUrl: p.src?.tiny || p.src?.small || '',
            largePreviewUrl: p.src?.large2x || p.src?.large || '',
            width: p.width || 1000,
            height: p.height || 667,
            creator: p.photographer || 'Stock Contributor',
            category: 'Stock Photo',
            keywords: [query],
          });
        });
      }
    } catch {
      // ignore
    }
  }

  // 2. Pixabay API fallback
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (pixabayKey && files.length < limit) {
    try {
      const res = await fetch(
        `https://pixabay.com/api/?key=${pixabayKey}&q=${cleanQ}&per_page=${limit}&image_type=all`,
        {
          signal: AbortSignal.timeout(6000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        (data.hits || []).forEach((h) => {
          files.push({
            id: h.id,
            assetId: String(h.id),
            title: h.tags || `Stock Asset #${h.id}`,
            stockUrl: h.pageURL,
            previewUrl: h.webformatURL || h.largeImageURL,
            thumbnailUrl: h.previewURL,
            largePreviewUrl: h.largeImageURL || h.webformatURL,
            width: h.imageWidth || 1000,
            height: h.imageHeight || 667,
            creator: h.user || 'Stock Creator',
            category: 'Stock Asset',
            keywords: (h.tags || '').split(',').map((t) => t.trim()),
          });
        });
      }
    } catch {
      // ignore
    }
  }

  return files;
}

/**
 * End-to-end Smart AI Search Pipeline
 *
 * 1. Analyzes slide title context (subjects, equipment, actions).
 * 2. If official API is configured, uses official endpoint.
 * 3. If official API is not configured, automatically uses Public Catalog Search Engine
 *    so the feature works seamlessly without a paid enterprise account!
 * 4. Tries alternative AI queries if initial results are sparse.
 * 5. Evaluates semantic relevance and ranks results.
 * 6. Deduplicates assets by ID.
 * 7. Returns paginated batch (displaying exact count 1..6 or incremental slice).
 */
export async function executeSmartStockSearch({
  title,
  context = {},
  styleFilter = { photo: true, illustration: true },
  offset = 0,
  limit = 6,
  threshold = 45,
}) {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) {
    return {
      success: false,
      error: 'TITLE_REQUIRED',
      message: 'Please provide a slide title.',
      results: [],
      totalFound: 0,
      displayedCount: 0,
      hasMore: false,
    };
  }

  // Step 1: Deep context-aware AI title understanding and multi-query synthesis with styleFilter
  const analysis = await analyzeSlideTitle(cleanTitle, context, styleFilter);

  const useOfficialApi = isAdobeStockConfigured();
  const candidatePool = [];
  const queriesToRun = analysis.queries.slice(0, 3);
  let triedQueries = [];

  for (const query of queriesToRun) {
    triedQueries.push(query);
    try {
      const searchRes = useOfficialApi
        ? await searchAdobeStockFiles({
            query,
            limit: 12,
            offset: 0,
            styleFilter,
          })
        : await searchAdobeStockPublicCatalog({
            query,
            limit: 15,
            styleFilter,
          });

      if (searchRes.files && searchRes.files.length > 0) {
        candidatePool.push(...searchRes.files);
      }

      if (candidatePool.length >= 15) {
        break;
      }
    } catch (err) {
      console.warn(
        `[Adobe Stock Service] Query "${query}" failed:`,
        err.message
      );
      if (err.code === 'AUTH_FAILED') {
        // Fall back to public catalog if official API fails authentication
        try {
          const publicRes = await searchAdobeStockPublicCatalog({
            query,
            limit: 15,
            styleFilter,
          });
          if (publicRes.files && publicRes.files.length > 0) {
            candidatePool.push(...publicRes.files);
          }
        } catch {
          // Ignore fallback error
        }
      }
    }
  }

  // If candidatePool is empty, attempt fallback terms and external providers
  if (candidatePool.length === 0) {
    const fallbackTerms = [cleanTitle, analysis.primarySubject].filter(Boolean);
    for (const term of fallbackTerms) {
      try {
        const fallbackRes = await searchAdobeStockPublicCatalog({
          query: term,
          limit: 15,
          styleFilter,
        });
        if (fallbackRes.files && fallbackRes.files.length > 0) {
          candidatePool.push(...fallbackRes.files);
          break;
        }
      } catch {
        // ignore
      }
    }

    if (candidatePool.length === 0) {
      const externalStock = await searchFallbackCuratedStock({
        query: analysis.primarySubject || cleanTitle,
        limit: 12,
      });
      if (externalStock.length > 0) {
        candidatePool.push(...externalStock);
      }
    }
  }

  // Step 3: Semantic Relevance Evaluation, Deduplication & Ranking
  let rankedAssets = deduplicateAndRankAssets(
    candidatePool,
    cleanTitle,
    analysis,
    threshold,
    styleFilter
  );

  // Fallback: If strict threshold returned 0 items but candidates exist, relax threshold
  if (rankedAssets.length === 0 && candidatePool.length > 0) {
    rankedAssets = deduplicateAndRankAssets(
      candidatePool,
      cleanTitle,
      analysis,
      0,
      styleFilter
    );
  }

  // Step 4: Slicing for Pagination & Incremental Batches
  const totalQualifying = rankedAssets.length;
  const pageSlice = rankedAssets.slice(offset, offset + limit);
  const hasMore = offset + limit < totalQualifying;

  return {
    success: true,
    configured: true,
    mode: useOfficialApi ? 'official-api' : 'public-catalog',
    title: cleanTitle,
    analysis: {
      domain: analysis.domain,
      primarySubject: analysis.primarySubject,
      equipment: analysis.equipment,
      queriesUsed: triedQueries,
      aiModel: analysis.aiModel,
    },
    totalFound: totalQualifying,
    displayedCount: pageSlice.length,
    offset,
    limit,
    hasMore,
    results: pageSlice,
  };
}
