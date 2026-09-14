/**
 * @file blog-sync.js
 * Unified Blog Synchronization Engine for "All Useful Tools".
 *
 * Gives EVERY blog (existing or newly generated) the same structure:
 *   Rewritten Article + Feature Image + Exactly 3 AI Games + Exactly 5 AI FAQs
 *
 * Key guarantees:
 *  - During sync the article content is AI-rewritten & enhanced (same facts,
 *    same meaning, better structure). Title, slug, author, category, date,
 *    description and SEO stay untouched. If the rewrite fails, the original
 *    article is preserved and sync continues.
 *  - IDEMPOTENT: re-running skips blogs already synced at CURRENT_BLOG_SYNC_VERSION.
 *    Games/FAQs are wholesale-replaced (never appended), so no duplicates.
 *  - Per-blog failure isolation: a failed blog is marked `failed` with a
 *    `sync_error` and the rest of the run continues.
 *
 * Runs client-side (Puter.js AI is browser-only), driven from the admin
 * sync dashboard or automatically after a new blog is published.
 */

import { supabase } from '@/lib/supabase';
import {
  callPuterAiBlogEngine,
  parseAndRepairJson,
  stripInteractiveEmbeds,
  isPuterFundingError,
} from '@/lib/blog-ai-engine';
import { convertImage } from '@/lib/image-converter';
import { recordMediaUpload } from '@/lib/media-hub';

// ---------------------------------------------------------------------------
// 1. Constants
// ---------------------------------------------------------------------------
// v3: sync now also rewrites/enhances the article content
export const CURRENT_BLOG_SYNC_VERSION = 3;

export const SYNC_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const GAME_TYPES = {
  WORD_MATCH: 'word-match',
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  CORRECT_ORDER: 'correct-order',
  GUESS_TERM: 'guess-term',
};

const MAX_CONTENT_CHARS = 9000; // article text passed to the AI per blog

// ---------------------------------------------------------------------------
// 2. Content analysis — extract key concepts from the article HTML
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'if',
  'then',
  'than',
  'that',
  'this',
  'these',
  'those',
  'with',
  'without',
  'within',
  'into',
  'onto',
  'from',
  'for',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'as',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'it',
  'its',
  'you',
  'your',
  'yours',
  'we',
  'our',
  'they',
  'their',
  'them',
  'he',
  'she',
  'his',
  'her',
  'can',
  'could',
  'should',
  'would',
  'will',
  'shall',
  'may',
  'might',
  'must',
  'do',
  'does',
  'did',
  'done',
  'have',
  'has',
  'had',
  'not',
  'no',
  'nor',
  'so',
  'such',
  'also',
  'more',
  'most',
  'other',
  'some',
  'any',
  'each',
  'every',
  'all',
  'both',
  'few',
  'own',
  'same',
  'only',
  'just',
  'very',
  'when',
  'where',
  'which',
  'who',
  'whom',
  'why',
  'how',
  'what',
  'about',
  'after',
  'before',
  'between',
  'during',
  'through',
  'under',
  'over',
  'above',
  'below',
  'up',
  'down',
  'out',
  'off',
  'again',
  'further',
  'once',
  'here',
  'there',
  'because',
  'while',
  'until',
  'against',
  'upon',
  'per',
  'via',
  'use',
  'used',
  'using',
  'using',
  'make',
  'makes',
  'made',
  'get',
  'gets',
  'got',
  'like',
  'across',
]);

export function stripHtmlTags(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts the most salient key concepts (terms + capitalized phrases)
 * from an article's HTML content. Used to ground AI generation and to
 * validate that generated games/FAQs actually come from this article.
 */
export function extractKeyConcepts(html) {
  const text = stripHtmlTags(html);
  if (!text) return { concepts: [], text: '' };

  // Capitalized multi-word phrases (likely technical terms / regulations)
  const phrases = {};
  const phraseRegex =
    /\b([A-Z][a-zA-Z0-9]*(?:[-'\u2019][A-Z][a-zA-Z0-9]*)*)(?:\s+(?:of|and|the|[A-Z][a-zA-Z0-9]*(?:[-'\u2019][A-Z][a-zA-Z0-9]*)*)){0,3}\b/g;
  let m;
  while ((m = phraseRegex.exec(text)) !== null) {
    const phrase = m[0].trim().replace(/\s+/g, ' ');
    const words = phrase.split(' ');
    if (phrase.length < 4 || words.length > 4) continue;
    // Skip pure sentence-start artifacts
    if (words.length === 1 && phrases[phrase] === undefined && m.index > 0) {
      const preceding = text.slice(Math.max(0, m.index - 2), m.index);
      if (preceding.endsWith('. ') || preceding === '') continue;
    }
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }

  // Significant word frequency
  const words = {};
  const tokens = text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [];
  for (const token of tokens) {
    if (STOPWORDS.has(token)) continue;
    words[token] = (words[token] || 0) + 1;
  }

  const topPhrases = Object.entries(phrases)
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([phrase]) => phrase);

  const topWords = Object.entries(words)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([word]) => word);

  return {
    concepts: [...new Set([...topPhrases, ...topWords])].slice(0, 30),
    text,
  };
}

// ---------------------------------------------------------------------------
// 3. AI prompt builders (one call per blog → 3 games + 5 FAQs)
// ---------------------------------------------------------------------------
export function buildSyncPrompt(blog, concepts) {
  const title = blog.title || 'Untitled Article';
  const category = blog.category || 'Technical Guide';
  const contentText = stripHtmlTags(blog.content).slice(0, MAX_CONTENT_CHARS);

  return `You are the Interactive Learning Designer for "All Useful Tools" — a free online utility platform (PDF editor, image/video converters, compressors, AI assistants, document tools, etc.) that makes everyday digital work faster and easier. All tools run privately in the browser.

SOURCE ARTICLE (the ONLY source of truth — every game and FAQ must be strictly derived from it):
TITLE: "${title}"
CATEGORY: "${category}"
KEY CONCEPTS DETECTED: ${concepts.join(', ')}

ARTICLE BODY:
"""
${contentText}
"""

TASK: Analyze the article above and generate interactive learning content based ONLY on facts, terms, numbers and procedures actually present in it.

Return a strictly valid JSON object with EXACTLY this shape (no markdown fences, no commentary):
{
  "games": [
    {
      "type": "word-match",
      "title": "Match the Key Terms",
      "pairs": [{"term": "...", "match": "..."}, {"term": "...", "match": "..."}, {"term": "...", "match": "..."}, {"term": "...", "match": "..."}, {"term": "...", "match": "..."}]
    },
    {
      "type": "multiple-choice",
      "title": "Knowledge Check",
      "question": "...?",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Why this answer is correct, referencing the article."
    },
    {
      "type": "true-false",
      "title": "True or False",
      "question": "...?",
      "answer": true,
      "explanation": "..."
    }
  ],
  "faq": [
    {"question": "...?", "answer": "2-4 sentence answer grounded in the article."},
    {"question": "...?", "answer": "..."},
    {"question": "...?", "answer": "..."},
    {"question": "...?", "answer": "..."},
    {"question": "...?", "answer": "..."}
  ]
}

STRICT RULES:
1. EXACTLY 3 games in this order: word-match (5 pairs from key article terms), multiple-choice (4 options), true-false. Optionally the system may swap multiple-choice for "correct-order" ({"items": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."], "explanation": "..."}) or "guess-term" ({"term": "...", "hint": "...", "explanation": "..."}) when the article suits it better — but always EXACTLY 3 games.
2. EXACTLY 5 FAQs. Questions must be realistic questions a reader of THIS article would ask; answers must be 2-4 sentences grounded ONLY in the article.
3. This is a productivity/utility-tools website — NOT a regulatory or compliance website. Do NOT mention, imply or invent OSHA, HIPAA, GDPR compliance claims, safety regulations or certifications UNLESS the article itself explicitly states them. Focus on how the tool saves time, enhances work and makes tasks quick and simple.
4. No duplicate questions, terms or options. All strings in English. Options must not reveal the answer.
5. For "correct-order", "items" must be listed in the CORRECT order.
6. Output raw JSON only.`;
}

// ---------------------------------------------------------------------------
// 4. Validators
// ---------------------------------------------------------------------------
function isNonEmptyString(v, maxLen = 2000) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen;
}

export function validateGame(game) {
  if (!game || typeof game !== 'object') return false;
  switch (game.type) {
    case GAME_TYPES.WORD_MATCH:
      return (
        isNonEmptyString(game.title, 200) &&
        Array.isArray(game.pairs) &&
        game.pairs.length >= 3 &&
        game.pairs.every(
          (p) =>
            p && isNonEmptyString(p.term, 300) && isNonEmptyString(p.match, 600)
        )
      );
    case GAME_TYPES.MULTIPLE_CHOICE:
      return (
        isNonEmptyString(game.question, 500) &&
        Array.isArray(game.options) &&
        game.options.length >= 3 &&
        game.options.every((o) => isNonEmptyString(o, 300)) &&
        Number.isInteger(game.answer) &&
        game.answer >= 0 &&
        game.answer < game.options.length
      );
    case GAME_TYPES.TRUE_FALSE:
      return (
        isNonEmptyString(game.question, 500) && typeof game.answer === 'boolean'
      );
    case GAME_TYPES.CORRECT_ORDER:
      return (
        Array.isArray(game.items) &&
        game.items.length >= 3 &&
        game.items.every((i) => isNonEmptyString(i, 300))
      );
    case GAME_TYPES.GUESS_TERM:
      return (
        isNonEmptyString(game.term, 200) && isNonEmptyString(game.hint, 500)
      );
    default:
      return false;
  }
}

export function validateGames(games, { exactCount = 3 } = {}) {
  if (!Array.isArray(games) || games.length !== exactCount) return false;
  const seenQuestions = new Set();
  for (const game of games) {
    if (!validateGame(game)) return false;
    const fingerprint = JSON.stringify(
      game.question || game.title || game.term || ''
    ).toLowerCase();
    if (seenQuestions.has(fingerprint)) return false;
    seenQuestions.add(fingerprint);
  }
  return true;
}

export function validateFaq(faq, { exactCount = 5, articleText = '' } = {}) {
  if (!Array.isArray(faq) || faq.length !== exactCount) return false;
  const seen = new Set();
  for (const item of faq) {
    if (!item || !isNonEmptyString(item.question, 500)) return false;
    if (!isNonEmptyString(item.answer, 3000)) return false;
    const key = item.question.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
  }
  // Content relevance: at least one FAQ shares a keyword with the article
  if (articleText) {
    const articleLower = articleText.toLowerCase();
    const relevant = faq.some((item) => {
      const words =
        item.question.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [];
      return words.some((w) => !STOPWORDS.has(w) && articleLower.includes(w));
    });
    if (!relevant) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 5. Local fallback generator (deterministic, article-grounded)
// ---------------------------------------------------------------------------
function sentencesFromArticle(text, count) {
  return (text || '')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 40)
    .slice(0, count);
}

export function generateLocalFallbackSyncData(blog) {
  const { concepts, text } = extractKeyConcepts(blog.content);
  const title = blog.title || 'This Article';
  const picked = concepts.slice(0, 5);
  while (picked.length < 5) picked.push(`Core Concept ${picked.length + 1}`);
  const sentences = sentencesFromArticle(text, 6);

  const games = [
    {
      type: GAME_TYPES.WORD_MATCH,
      title: `Terminology Matcher: ${title.slice(0, 60)}`,
      pairs: picked.map((term, i) => ({
        term,
        match:
          sentences[i]?.slice(0, 140) ||
          'A core concept explained in this article.',
      })),
    },
    {
      type: GAME_TYPES.MULTIPLE_CHOICE,
      title: 'Knowledge Check',
      question: `Which statement best reflects the central focus of "${title.slice(0, 80)}"?`,
      options: [
        picked[0]
          ? `Practical guidance about ${picked[0]}`
          : 'Core operational guidance',
        'Unrelated marketing material',
        'Random statistics from another domain',
        'None of the above',
      ],
      answer: 0,
      explanation:
        sentences[0]?.slice(0, 250) ||
        'The article focuses on the key concepts listed above.',
    },
    {
      type: GAME_TYPES.TRUE_FALSE,
      title: 'True or False',
      question: `Does "${title.slice(0, 80)}" discuss ${picked[1] || picked[0]}?`,
      answer: true,
      explanation:
        sentences[1]?.slice(0, 250) ||
        'Yes — it is one of the key concepts covered in this article.',
    },
  ];

  const faq = sentences.slice(0, 5).map((sentence, i) => ({
    question:
      i === 0
        ? `What is the main topic of "${title.slice(0, 80)}"?`
        : `What does this article say about ${picked[i] || 'this topic'}?`,
    answer: sentence.slice(0, 400),
  }));
  while (faq.length < 5) {
    faq.push({
      question: `Why is ${picked[faq.length] || picked[0]} important?`,
      answer:
        sentences[faq.length % Math.max(sentences.length, 1)]?.slice(0, 400) ||
        'See the related section in this article.',
    });
  }

  return { games, faq };
}

// ---------------------------------------------------------------------------
// 6. AI generation: games + FAQs (single call, one retry, local fallback)
// ---------------------------------------------------------------------------
async function generateGamesAndFaq(blog, concepts) {
  const prompt = buildSyncPrompt(blog, concepts);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text } = await callPuterAiBlogEngine(
        attempt === 0
          ? prompt
          : `${prompt}\n\nIMPORTANT CORRECTION: Your previous output was invalid. Return EXACTLY 3 valid games and EXACTLY 5 valid FAQs as specified, raw JSON only.`,
        'You are a strict JSON generator. Output raw valid JSON only — no fences, no commentary.'
      );
      const parsed = parseAndRepairJson(text);
      if (parsed && validateGames(parsed.games) && validateFaq(parsed.faq)) {
        return { games: parsed.games, faq: parsed.faq, source: 'ai' };
      }
      console.warn(
        `[BlogSync] AI output invalid for "${blog.title}" (attempt ${attempt + 1}).`
      );
    } catch (err) {
      // Funding errors must abort — falling back to templates would silently
      // produce low-quality syncs across the whole run.
      if (isPuterFundingError(err)) throw err;
      console.warn(
        `[BlogSync] AI generation attempt ${attempt + 1} failed for "${blog.title}":`,
        err?.message || err
      );
    }
  }

  // Deterministic fallback so a blog is never left permanently unsynced
  const fallback = generateLocalFallbackSyncData(blog);
  return { ...fallback, source: 'fallback' };
}

// ---------------------------------------------------------------------------
// 6b. AI content rewrite — rewrite & enhance the full article, one blog at a
// time. Preserves every fact, name, number and step; upgrades structure.
// Returns enhanced HTML or null (original content is kept on failure).
// ---------------------------------------------------------------------------
function buildContentRewritePrompt(blog) {
  const title = blog.title || 'Untitled Article';
  const category = blog.category || 'Technical Guide';
  const contentText = stripHtmlTags(blog.content).slice(0, MAX_CONTENT_CHARS);

  return `You are the Chief Technical Editor for "All Useful Tools" — a free online utility platform (PDF editor, image/video converters, compressors, AI assistants, document tools, etc.) that makes everyday digital work faster and easier. All tools run privately in the browser.

Rewrite and enhance the following blog article. This is a FULL rewrite of the article body.

ORIGINAL ARTICLE:
TITLE: "${title}"
CATEGORY: "${category}"
BODY:
"""
${contentText}
"""

REWRITE RULES (STRICT):
1. Preserve EVERY fact, number, product/tool name, step and recommendation from the original. Never invent new facts.
2. Same language and same overall meaning. Improve clarity, flow, headings and formatting — make it feel professionally edited, not translated.
3. Angle: this is a productivity/utility-tools website. Emphasize how the tool saves time, simplifies work and gets tasks done quickly — do NOT add or amplify OSHA, HIPAA, GDPR, safety-regulation or compliance framing UNLESS the original article explicitly contains it (in that case keep it exactly as-is, without expanding it).
4. Output clean semantic HTML body only: <h2>/<h3>, <p>, <ul>/<ol>, <strong>, <a> where the original had links.
5. Where suitable include: at least one comparison/data table (<div class="table-container"><table class="data-table"><thead>...</table></div>), at least one styled quote (<blockquote class="pro-quote"><p>"..."</p><cite>— Name, Title</cite></blockquote>), and at least one pro-tip box (<div class="callout-card tip"><div class="card-title">⚡ Pro-Tip</div><p>...</p></div>).
6. Do NOT include: <html>, <head>, <body> tags, scripts, styles, images, or any interactive games/quizzes/FAQ sections — those are generated separately.
7. Keep a similar length to the original (±30%).

OUTPUT: raw valid JSON only, no markdown fences, no commentary:
{ "content": "<the complete rewritten HTML article body>" }`;
}

async function enhanceArticleContent(blog) {
  const originalText = stripHtmlTags(blog.content);
  const minLength = Math.max(300, Math.floor(originalText.length * 0.5));

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text } = await callPuterAiBlogEngine(
        attempt === 0
          ? buildContentRewritePrompt(blog)
          : `${buildContentRewritePrompt(
              blog
            )}\n\nIMPORTANT CORRECTION: Your previous output was invalid. Return raw JSON with a single "content" key containing the complete rewritten HTML article body.`,
        'You are a strict JSON generator. Output raw valid JSON only — no fences, no commentary.'
      );
      const parsed = parseAndRepairJson(text);
      const rawHtml =
        typeof parsed === 'string' ? parsed : parsed?.content || null;
      if (!rawHtml || typeof rawHtml !== 'string') {
        console.warn(
          `[BlogSync] Content rewrite invalid for "${blog.title}" (attempt ${attempt + 1}).`
        );
        continue;
      }
      const cleanHtml = stripInteractiveEmbeds(rawHtml);
      if (stripHtmlTags(cleanHtml).length >= minLength) {
        return cleanHtml;
      }
      console.warn(
        `[BlogSync] Content rewrite too short for "${blog.title}" (attempt ${attempt + 1}).`
      );
    } catch (err) {
      if (isPuterFundingError(err)) throw err;
      console.warn(
        `[BlogSync] Content rewrite attempt ${attempt + 1} failed for "${blog.title}":`,
        err?.message || err
      );
    }
  }

  return null; // caller keeps the original article
}

// ---------------------------------------------------------------------------
// 7. Feature image — reuse if valid, generate only when missing
// ---------------------------------------------------------------------------
export function hasValidFeatureImage(blog) {
  return (
    typeof blog.image_url === 'string' && blog.image_url.trim().length > 10
  );
}

async function generateFeatureImage(blog) {
  const title = blog.title || 'Professional Article';
  const category = blog.category || 'modern digital workspace';

  // 1. Puter writes a one-sentence photography prompt (no text in image —
  //    the blog title is overlaid as HTML/CSS by the frontend for accuracy).
  let finalizedPrompt = `professional cinematic photography, ${category} workspace, ${title}, clean minimal composition, photorealistic, no text`;
  try {
    const response = await window.puter.ai.chat(
      `I need a professional, high-end photography prompt for an article titled "${title}". Context: ${category}. Rules: absolutely no text or letters in the image, 8k resolution, cinematic lighting, wide 16:9 composition. Output only the 1-sentence prompt itself.`,
      { model: 'gpt-4o-mini' }
    );
    const aiPrompt =
      typeof response === 'string'
        ? response
        : response?.message?.content || response?.toString();
    if (aiPrompt) finalizedPrompt = aiPrompt.trim();
  } catch (e) {
    console.warn('[BlogSync] Prompt enhancement failed, using fallback.');
  }

  // 2. Generate via Pollinations → fetch through the local proxy
  const encodedPrompt = encodeURIComponent(finalizedPrompt);
  const tempImageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Math.floor(
    Math.random() * 10000
  )}`;

  let response;
  try {
    response = await fetch(
      `/api/proxy-image?url=${encodeURIComponent(tempImageUrl)}`
    );
    if (!response.ok) {
      // Failover: curated professional industrial photo
      const fallbackUrl = `https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=1280&h=720&sig=${Date.now()}`;
      response = await fetch(
        `/api/proxy-image?url=${encodeURIComponent(fallbackUrl)}`
      );
    }
  } catch (e) {
    throw new Error(`Feature image generation failed: ${e?.message || e}`);
  }

  if (!response.ok || response.status === 415) {
    throw new Error(
      `Feature image provider rejected the request (status ${response.status}).`
    );
  }

  const rawBlob = await response.blob();
  if (!rawBlob || rawBlob.size < 100) {
    throw new Error('Feature image stream was empty or corrupt.');
  }

  // 3. Optimize (webp, 1280w) and upload to the existing media bucket
  const rawFile = new File([rawBlob], 'ai_sync.jpg', {
    type: rawBlob.type || 'image/jpeg',
  });
  const optimized = await convertImage(rawFile, 'webp', {
    quality: 80,
    width: 1280,
  });

  const fileName = `ai_sync_${Date.now()}.webp`;
  const filePath = `blog-media/${fileName}`;
  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, optimized.blob, {
      contentType: 'image/webp',
      upsert: true,
    });
  if (error) throw new Error(`Feature image upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from('media').getPublicUrl(filePath);

  try {
    recordMediaUpload({
      fileName,
      fileType: 'image/webp',
      fileSize: optimized.blob.size,
      previewUrl: publicUrl,
      downloadUrl: publicUrl,
      expiresAt: null,
    });
  } catch {
    // Media hub tracking is best-effort
  }

  return publicUrl;
}

// ---------------------------------------------------------------------------
// 8. Idempotency gate
// ---------------------------------------------------------------------------
export function needsSync(blog, { force = false } = {}) {
  if (!blog || !blog.id) return false;
  if (force) return true;

  const statusOk = blog.sync_status === SYNC_STATUS.COMPLETED;
  const versionOk = blog.sync_version === CURRENT_BLOG_SYNC_VERSION;
  const gamesOk = Array.isArray(blog.games) && blog.games.length === 3;
  const faqOk = Array.isArray(blog.faq) && blog.faq.length === 5;
  const imageOk = hasValidFeatureImage(blog);

  return !(statusOk && versionOk && gamesOk && faqOk && imageOk);
}

// ---------------------------------------------------------------------------
// 9. Per-blog sync pipeline (safe to run multiple times)
// ---------------------------------------------------------------------------
/**
 * @param {Object} blog - full blogs row (must include id + content)
 * @param {Object} opts - { force?: boolean, onUpdate?: (status, info) => void }
 * @returns {{ ok: boolean, skipped?: boolean, error?: string }}
 */
export async function syncSingleBlog(blog, { force = false, onUpdate } = {}) {
  const report = (status, info) => {
    try {
      onUpdate?.(status, info);
    } catch {
      /* UI callbacks must never break the pipeline */
    }
  };

  if (!blog?.id) return { ok: false, error: 'Blog record has no id.' };

  try {
    if (!needsSync(blog, { force })) {
      return { ok: true, skipped: true };
    }

    report(SYNC_STATUS.PROCESSING);
    await supabase
      .from('blogs')
      .update({ sync_status: SYNC_STATUS.PROCESSING, sync_error: null })
      .eq('id', blog.id);

    // 1. Rewrite & enhance the article content (AI). On failure the original
    //    article is kept and sync continues — never a data loss scenario.
    let content = blog.content;
    try {
      const enhanced = await enhanceArticleContent(blog);
      if (enhanced) content = enhanced;
    } catch (err) {
      if (isPuterFundingError(err)) throw err;
      console.warn(
        `[BlogSync] Content rewrite skipped for "${blog.title}":`,
        err?.message || err
      );
    }

    // 2. Analyze the (possibly rewritten) article to ground games/FAQs
    const { concepts, text: articleText } = extractKeyConcepts(content);
    if (articleText.length < 80) {
      throw new Error(
        'Article content is too short to generate meaningful games/FAQs.'
      );
    }

    // 3. Generate exactly 3 games + exactly 5 FAQs from THIS article
    const { games, faq } = await generateGamesAndFaq(
      { ...blog, content },
      concepts
    );
    if (!validateGames(games)) {
      throw new Error(
        'Generated games failed validation (expected 3 valid games).'
      );
    }
    if (!validateFaq(faq, { articleText })) {
      throw new Error(
        'Generated FAQs failed validation (expected 5 valid, article-grounded FAQs).'
      );
    }

    // 4. Feature image: reuse existing valid image, generate only if missing
    let imageUrl;
    const updatePayload = {
      games,
      faq,
      sync_status: SYNC_STATUS.COMPLETED,
      sync_version: CURRENT_BLOG_SYNC_VERSION,
      last_synced_at: new Date().toISOString(),
      sync_error: null,
    };
    if (content !== blog.content) {
      updatePayload.content = content;
    }
    if (hasValidFeatureImage(blog)) {
      imageUrl = blog.image_url; // preserved untouched
    } else {
      imageUrl = await generateFeatureImage(blog);
      updatePayload.image_url = imageUrl;
    }

    // 5. Save — rewritten content (when successful) + generated fields + sync
    //    metadata. Title, slug, author, category, tags, dates and SEO stay
    //    untouched.
    const { error: updateError } = await supabase
      .from('blogs')
      .update(updatePayload)
      .eq('id', blog.id);
    if (updateError) throw updateError;

    report(SYNC_STATUS.COMPLETED, { imageUrl });
    return { ok: true };
  } catch (err) {
    const message = err?.message || String(err);
    console.error(`[BlogSync] Failed to sync blog "${blog.title}":`, message);

    try {
      await supabase
        .from('blogs')
        .update({ sync_status: SYNC_STATUS.FAILED, sync_error: message })
        .eq('id', blog.id);
    } catch (markErr) {
      console.error('[BlogSync] Could not persist failure status:', markErr);
    }

    report(SYNC_STATUS.FAILED, { error: message });
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// 10. Bulk runner — batched, failure-isolated, cancel-friendly
// ---------------------------------------------------------------------------
/**
 * Processes all blogs in controlled batches of `batchSize`.
 * One failing blog never stops the run.
 *
 * @param {Object} opts
 * @param {'all'|'retry'|'force'} [opts.mode='all']
 *    'all'   → only blogs needing sync (idempotent gate)
 *    'retry' → only pending/failed blogs
 *    'force' → every blog, regenerating games/FAQs (original article kept)
 * @param {(blogId, status, info) => void} [opts.onBlogUpdate]
 * @param {() => boolean} [opts.shouldCancel] - polled between blogs
 * @param {(processed, total) => void} [opts.onProgress]
 * @returns {{ total: number, succeeded: number, failed: number, skipped: number, cancelled: boolean }}
 */
export async function syncAllBlogs({
  mode = 'all',
  onBlogUpdate,
  shouldCancel,
  onProgress,
  batchSize = 5,
} = {}) {
  // Fetch all blogs in pages of 50 (never one giant request)
  const allBlogs = [];
  const PAGE = 50;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('blogs')
      .select(
        'id, title, slug, category, content, image_url, sync_status, sync_version, last_synced_at, sync_error, games, faq'
      )
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (data) allBlogs.push(...data);
    if (!data || data.length < PAGE) break;
  }

  let targets;
  if (mode === 'force') {
    targets = allBlogs;
  } else if (mode === 'retry') {
    targets = allBlogs.filter(
      (b) =>
        b.sync_status === SYNC_STATUS.FAILED ||
        b.sync_status === SYNC_STATUS.PENDING
    );
  } else {
    targets = allBlogs.filter((b) => needsSync(b));
  }

  const results = {
    total: targets.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    cancelled: false,
    aborted: false,
  };

  // Controlled batches: process `batchSize` blogs, brief checkpoint between
  let consecutiveFundingFailures = 0;
  outer: for (let i = 0; i < targets.length; i += batchSize) {
    if (shouldCancel?.()) {
      results.cancelled = true;
      break;
    }
    const batch = targets.slice(i, i + batchSize);
    for (const blog of batch) {
      if (shouldCancel?.()) {
        results.cancelled = true;
        break outer;
      }
      const result = await syncSingleBlog(blog, {
        force: mode === 'force',
        onUpdate: (status, info) => onBlogUpdate?.(blog.id, status, info),
      });
      if (result.skipped) results.skipped += 1;
      else if (result.ok) {
        results.succeeded += 1;
        consecutiveFundingFailures = 0;
      } else {
        results.failed += 1;
        // Puter funding/permission errors fail every blog — stop the run
        // early instead of pointlessly processing hundreds of records.
        if (result.error && isPuterFundingError({ message: result.error })) {
          consecutiveFundingFailures += 1;
          if (consecutiveFundingFailures >= 3) {
            results.aborted = true;
            results.error = result.error;
            break outer;
          }
        } else {
          consecutiveFundingFailures = 0;
        }
      }
      onProgress?.(i + batch.indexOf(blog) + 1, targets.length);
    }
    // Yield a moment between batches so the UI stays responsive
    if (i + batchSize < targets.length) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return results;
}
