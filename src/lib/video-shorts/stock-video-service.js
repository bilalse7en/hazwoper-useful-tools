/**
 * Stock Islamic Video Discovery & Licensing Service
 * Integrates:
 * 1. Pexels Video API (via PEXELS_API_KEY with pagination)
 * 2. Pixabay Video API (via PIXABAY_API_KEY with pagination)
 * 3. Wikimedia Commons Open Video Search (100% Free, no API key required)
 * 4. High-Quality Curated Islamic B-Roll Collection of 100+ verified videos
 *
 * All items preserve author, license name, license URL, and YouTube-ready attribution text.
 */

import { ingestMediaFile, getMediaHubItem } from './media-storage-service';
import { CURATED_ISLAMIC_VIDEOS } from './curated-b-roll';

export { CURATED_ISLAMIC_VIDEOS };

const ISLAMIC_STRICT_REGEX =
  /(makkah|mecca|kaaba|ka'aba|tawaf|hajj|umrah|haram|madinah|medina|nabawi|green dome|roza|prophet|rawdah|quran|koran|mosque|masjid|minaret|adhan|azan|islamic|islam|namaz|salah|sujood|dua|quba|arafat|calligraphy|sunset|desert|stars|night sky|celestial)/i;

const NON_ISLAMIC_REJECT_REGEX =
  /(visualisierung|liste der berge|sachsen|germany|deutschland|bicycle|car-detection|sintel|flower\.mp4|election|polit|party|war |military|covid|person-bicycle)/i;

// In-memory LRU-style cache for fast repeated stock searches
const STOCK_SEARCH_CACHE = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Searches Islamic stock videos with query filtering, provider selection, and pagination.
 * Supports browsing at least 100+ genuine results across pages.
 */
export async function searchIslamicStockVideos({
  query = 'islamic',
  provider = 'all', // 'all' | 'pexels' | 'pixabay' | 'wikimedia'
  page = 1,
  limit = 12,
} = {}) {
  const normalizedQuery = (query || '').toLowerCase().trim();
  const cacheKey = `${normalizedQuery}:${provider}:${page}:${limit}`;

  const cached = STOCK_SEARCH_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let results = [...CURATED_ISLAMIC_VIDEOS];

  // 1. Dynamic Pexels Search if API key exists
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey && (provider === 'all' || provider === 'pexels')) {
    try {
      const pexRes = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query || 'islamic')}&page=${page}&per_page=${limit}&orientation=portrait`,
        {
          headers: { Authorization: pexelsKey },
          signal: AbortSignal.timeout(3500),
          next: { revalidate: 3600 },
        }
      );
      if (pexRes.ok) {
        const pexData = await pexRes.json();
        const pexVideos = (pexData.videos || []).map((v) => {
          const videoFile =
            v.video_files?.find((f) => f.quality === 'hd') ||
            v.video_files?.[0];
          return {
            id: `pexels-${v.id}`,
            title:
              v.url.split('/').filter(Boolean).pop().replace(/-/g, ' ') ||
              'Islamic Stock Video',
            tags: ['islamic', query],
            provider: 'Pexels',
            author: v.user?.name || 'Pexels Creator',
            duration: v.duration || 15,
            resolution: `${videoFile?.width || 1080}x${videoFile?.height || 1920}`,
            aspectRatio: '9:16',
            thumbnailUrl: v.image,
            videoUrl: videoFile?.link,
            license: 'Pexels Free License',
            licenseUrl: 'https://www.pexels.com/license/',
            attribution: `Footage by ${v.user?.name || 'Pexels Creator'} via Pexels (Free to use)`,
          };
        });
        results = [...pexVideos, ...results];
      }
    } catch (pexErr) {
      console.warn('Pexels API query notice:', pexErr.message);
    }
  }

  // 2. Dynamic Pixabay Search if API key exists
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (pixabayKey && (provider === 'all' || provider === 'pixabay')) {
    try {
      const pixRes = await fetch(
        `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${encodeURIComponent(query || 'islamic')}&page=${page}&per_page=${limit}`,
        {
          signal: AbortSignal.timeout(3500),
          next: { revalidate: 3600 },
        }
      );
      if (pixRes.ok) {
        const pixData = await pixRes.json();
        const pixVideos = (pixData.hits || []).map((h) => {
          const videoObj =
            h.videos?.medium || h.videos?.large || h.videos?.small;
          return {
            id: `pixabay-${h.id}`,
            title: h.tags || 'Islamic Scene',
            tags: (h.tags || '').split(',').map((t) => t.trim()),
            provider: 'Pixabay',
            author: h.user || 'Pixabay Creator',
            duration: h.duration || 15,
            resolution: `${videoObj?.width || 1080}x${videoObj?.height || 1920}`,
            aspectRatio: '9:16',
            thumbnailUrl: `https://i.vimeocdn.com/video/${h.picture_id}_640x360.jpg`,
            videoUrl: videoObj?.url,
            license: 'Pixabay Content License',
            licenseUrl: 'https://pixabay.com/service/license-summary/',
            attribution: `Footage by ${h.user || 'Pixabay Creator'} from Pixabay`,
          };
        });
        results = [...pixVideos, ...results];
      }
    } catch (pixErr) {
      console.warn('Pixabay API query notice:', pixErr.message);
    }
  }

  // 3. Dynamic Wikimedia Commons Open Search (No API Key Required)
  if (provider === 'all' || provider === 'wikimedia') {
    try {
      const wikiQuery = `${query || 'islamic'} filetype:video`;
      const wikiRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(wikiQuery)}&gsrlimit=${Math.min(limit, 8)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&origin=*`,
        {
          headers: {
            'User-Agent':
              'HazwoperIslamicStudio/1.0 (https://hazwoper-useful-tools.vercel.app; contact@hazwoper.com)',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(4000),
          next: { revalidate: 7200 },
        }
      );
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const pages = wikiData?.query?.pages
          ? Object.values(wikiData.query.pages)
          : [];
        const wikiVideos = pages
          .filter((p) => {
            const ii = p.imageinfo?.[0];
            const title = (p.title || '').toLowerCase();
            if (
              !ii?.url ||
              (!ii.mime?.startsWith('video/') &&
                !ii.url.endsWith('.webm') &&
                !ii.url.endsWith('.mp4'))
            ) {
              return false;
            }
            if (NON_ISLAMIC_REJECT_REGEX.test(title)) return false;
            return (
              ISLAMIC_STRICT_REGEX.test(title) ||
              ISLAMIC_STRICT_REGEX.test(query)
            );
          })
          .map((p) => {
            const ii = p.imageinfo[0];
            const cleanTitle =
              p.title
                ?.replace(/^File:/i, '')
                .replace(/\.[a-zA-Z0-9]+$/, '')
                .replace(/_/g, ' ') || 'Wikimedia Video';
            const meta = ii.extmetadata || {};
            const author =
              meta.Artist?.value?.replace(/<[^>]*>/g, '') ||
              'Wikimedia Contributor';
            const license =
              meta.LicenseShortName?.value ||
              'Creative Commons Attribution 4.0';

            return {
              id: `wikimedia-${p.pageid || Math.abs(p.title.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`,
              title: cleanTitle,
              tags: ['wikimedia', query, 'creative commons'],
              provider: 'Wikimedia Commons',
              author,
              duration: 18.0,
              resolution: `${ii.width || 1080}x${ii.height || 1920}`,
              aspectRatio: '9:16',
              thumbnailUrl:
                ii.thumburl ||
                ii.responsive?.['640'] ||
                'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=600&q=80',
              videoUrl: ii.url,
              license,
              licenseUrl:
                meta.LicenseUrl?.value ||
                'https://creativecommons.org/licenses/by/4.0/',
              attribution: `Footage: "${cleanTitle}" by ${author} (${license})`,
            };
          });
        results = [...wikiVideos, ...results];
      }
    } catch (wikiErr) {
      console.warn('Wikimedia Commons search notice:', wikiErr.message);
    }
  }

  // 4. Strictly filter out any non-Islamic results and blacklist items
  results = results.filter((item) => {
    const combined =
      `${item.title} ${(item.tags || []).join(' ')} ${item.author || ''} ${item.category || ''}`.toLowerCase();
    if (NON_ISLAMIC_REJECT_REGEX.test(combined)) return false;
    return ISLAMIC_STRICT_REGEX.test(combined);
  });

  // 5. Filter by search query
  if (
    normalizedQuery &&
    normalizedQuery !== 'all' &&
    normalizedQuery !== 'islamic'
  ) {
    results = results.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(normalizedQuery);
      const matchTags = item.tags.some((t) =>
        t.toLowerCase().includes(normalizedQuery)
      );
      const matchAuthor = item.author.toLowerCase().includes(normalizedQuery);
      const matchCategory =
        item.category && item.category.toLowerCase().includes(normalizedQuery);
      return matchTitle || matchTags || matchAuthor || matchCategory;
    });
  }

  // 5. Filter by provider if specified
  if (provider && provider !== 'all') {
    results = results.filter((item) =>
      item.provider.toLowerCase().includes(provider.toLowerCase())
    );
  }

  const total = results.length;
  const startIndex = (page - 1) * limit;
  const paginated = results.slice(startIndex, startIndex + limit);

  const payload = {
    success: true,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    videos: paginated,
  };

  STOCK_SEARCH_CACHE.set(cacheKey, { timestamp: Date.now(), data: payload });
  return payload;
}

/**
 * Imports an external stock video directly into the user's permanent Media Hub repository
 * Deduplicates using a stable provider asset ID to avoid duplicate downloads.
 */
export async function importStockVideoToMediaHub(stockVideo) {
  if (!stockVideo || !stockVideo.videoUrl) {
    throw new Error('Valid stock video item with videoUrl is required.');
  }

  // Stable provider asset identifier
  const cleanAssetId = String(stockVideo.id || 'stock').replace(
    /[^a-zA-Z0-9_-]/g,
    '_'
  );
  const stableCustomId = cleanAssetId.startsWith('stock_')
    ? cleanAssetId
    : `stock_${cleanAssetId}`;

  // Check if already in Media Hub
  const existing = await getMediaHubItem(stableCustomId);
  if (existing && (existing.localPath || existing.downloadUrl)) {
    return {
      ...existing,
      isSaved: true,
      stockMetadata: {
        provider: stockVideo.provider,
        author: stockVideo.author,
        license: stockVideo.license,
        licenseUrl: stockVideo.licenseUrl,
        attribution: stockVideo.attribution,
        originalVideoUrl: stockVideo.videoUrl,
      },
    };
  }

  // Resilient multi-tier download to prevent 403 Forbidden or CDN blocking
  let resp = null;
  const primaryHeaders = {
    'User-Agent': stockVideo.videoUrl.includes('wikimedia')
      ? 'AntigravityIslamicStudio/1.0 (contact@hazwoper-useful-tools.com)'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    const origin = new URL(stockVideo.videoUrl).origin;
    if (!stockVideo.videoUrl.includes('wikimedia')) {
      primaryHeaders['Referer'] = `${origin}/`;
    }
  } catch (_) {}

  try {
    resp = await fetch(stockVideo.videoUrl, { headers: primaryHeaders });
  } catch (netErr) {
    console.warn('Initial stock video fetch notice:', netErr.message);
  }

  // Attempt 2: If 403 or failed, retry with clean headers without Referer
  if (!resp || !resp.ok) {
    try {
      resp = await fetch(stockVideo.videoUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'video/*,*/*',
        },
        signal: AbortSignal.timeout(10000),
      });
    } catch (_) {}
  }

  if (!resp || !resp.ok) {
    throw new Error(
      `Failed to download stock video (${resp?.status || 403} Forbidden). The footage provider URL may have expired. Please retry with a fresh search or choose another B-roll asset.`
    );
  }

  const arrayBuffer = await resp.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const cleanName = `${(stockVideo.title || 'islamic_stock').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45)}.mp4`;

  // Ingest into configured Media Hub & Supabase bucket
  const mediaItem = await ingestMediaFile({
    buffer,
    fileName: cleanName,
    fileType: 'video/mp4',
    sourceType: 'stock_gallery',
    customId: stableCustomId,
  });

  // Attach license attribution
  mediaItem.isSaved = true;
  mediaItem.stockMetadata = {
    provider: stockVideo.provider,
    author: stockVideo.author,
    license: stockVideo.license,
    licenseUrl: stockVideo.licenseUrl,
    attribution: stockVideo.attribution,
    originalVideoUrl: stockVideo.videoUrl,
  };

  return mediaItem;
}

/**
 * Bulk imports multiple selected stock videos into Media Hub
 */
export async function importMultipleStockVideos(stockVideos = []) {
  const results = {
    total: stockVideos.length,
    saved: [],
    failed: [],
  };

  for (const video of stockVideos) {
    try {
      const item = await importStockVideoToMediaHub(video);
      results.saved.push({ id: video.id, item });
    } catch (err) {
      results.failed.push({ id: video.id, error: err.message });
    }
  }

  return results;
}
