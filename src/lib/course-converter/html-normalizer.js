/**
 * html-normalizer.js
 *
 * Normalizes and sanitizes HTML from Word documents (mammoth) or PDFs into
 * clean, semantic, LMS-compliant HTML.
 *
 * Rules:
 * - Strips all class and style attributes from ALL HTML elements (including divs, p, lists, tables).
 * - Strips Word/Office junk: MsoNormal, style="mso-...", id attributes, empty spans, fonts.
 * - Preserves semantic formatting: <p>, <ul>, <ol>, <li>, <h2>, <h3>, <h4>, <table>, <thead>, <tbody>,
 *   <tr>, <th>, <td>, <strong>, <em>, <a>.
 * - Unwraps redundant nested / inner / empty <div> wrappers.
 * - Wraps topic content in strictly ONE parent <div> without any classes or styles: <div>...content...</div>.
 * - Optional Image Handling (stripImages):
 *   - When TRUE (default): strips all <img> tags, removes image captions, bracketed image codes ([Image: ...]),
 *     AI image prompt lines, and stock photo codes like #897489635 from the body text.
 *   - When FALSE: preserves standard <img> tags and image callout text.
 */

/**
 * Extracts image asset codes (e.g. #897489635, FILE #: 43500089, Adobe Stock URLs) and AI prompt metadata from HTML or text
 * @param {string} rawHtml
 * @returns {object} { imageCodes, primaryImageCode, aiPrompts, primaryPrompt, hasImages }
 */
export function extractImageMetadata(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return {
      imageCodes: [],
      primaryImageCode: '',
      aiPrompts: [],
      primaryPrompt: '',
      hasImages: false,
    };
  }

  const hasImgTag = /<img[^>]*>/i.test(rawHtml);
  const imageCodes = [];

  // 1. Extract Adobe Stock URLs with numeric asset IDs (e.g. stock.adobe.com/images/.../43500089?prev_url=detail)
  const stockUrlMatches =
    rawHtml.match(/stock\.adobe\.com\/[^\s"'>]*\/(\d{6,12})/gi) || [];
  stockUrlMatches.forEach((u) => {
    const numMatch = u.match(/\d{6,12}/);
    if (numMatch) {
      const formatted = `#${numMatch[0]}`;
      if (!imageCodes.includes(formatted)) {
        imageCodes.push(formatted);
      }
    }
  });

  // 2. Extract FILE #: / File #: patterns (e.g. FILE #:  43500089, FILE #: 271990967)
  const fileMatches =
    rawHtml.match(
      /(?:FILE|File)\s*#?[:\s\u00a0&nbsp;]*(?:<[^>]+>)*[\s\u00a0&nbsp;]*(\d{6,12})/gi
    ) || [];
  fileMatches.forEach((f) => {
    const numMatch = f.match(/\d{6,12}/);
    if (numMatch) {
      const formatted = `#${numMatch[0]}`;
      if (!imageCodes.includes(formatted)) {
        imageCodes.push(formatted);
      }
    }
  });

  // 3. Extract 6-12 digit stock asset codes with # or ID: or Asset:, e.g. #897489635
  const codeMatches =
    rawHtml.match(/(?:#|ID:?\s*|Asset:?\s*|Stock\s*#?\s*)(\d{6,12})/gi) || [];
  codeMatches.forEach((m) => {
    const numMatch = m.match(/\d{6,12}/);
    if (numMatch) {
      const formatted = `#${numMatch[0]}`;
      if (!imageCodes.includes(formatted)) {
        imageCodes.push(formatted);
      }
    }
  });

  // Extract AI image prompts or visual descriptions
  const aiPrompts = [];
  const promptMatches = rawHtml.match(
    /(?:AI\s*Image\s*Prompt|Image\s*Prompt|Visual\s*Description|Visual\s*Prompt|Image\s*Suggestion)[:\s-]+([^<\n\r]+)/gi
  );
  if (promptMatches) {
    promptMatches.forEach((p) => {
      const cleaned = p
        .replace(
          /^(?:AI\s*Image\s*Prompt|Image\s*Prompt|Visual\s*Description|Visual\s*Prompt|Image\s*Suggestion)[:\s-]+/i,
          ''
        )
        .trim();
      if (cleaned && !aiPrompts.includes(cleaned)) {
        aiPrompts.push(cleaned);
      }
    });
  }

  const hasImages =
    hasImgTag ||
    imageCodes.length > 0 ||
    /stock\.adobe\.com/i.test(rawHtml) ||
    /FILE\s*#/i.test(rawHtml);

  return {
    imageCodes,
    primaryImageCode: imageCodes[0] || '',
    aiPrompts,
    primaryPrompt: aiPrompts[0] || '',
    hasImages,
  };
}

/**
 * Clean and normalize a block of raw HTML
 * @param {string} rawHtml - HTML snippet or full document HTML
 * @param {object} [options={}] - { stripImages: boolean }
 * @returns {string} - Clean inner semantic HTML without classes or styles
 */
export function normalizeHtmlContent(rawHtml, options = {}) {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  const stripImages = options.stripImages !== false; // default: true (clean text without image junk)
  let html = rawHtml;

  // 1. Remove comments and doctype / html / head / body tags
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<!DOCTYPE[^>]*>/gi, '');
  html = html.replace(/<\/?(html|head|body|meta|title|link)[^>]*>/gi, '');

  // 2. Remove XML tags and Word office namespaces (e.g., <o:p>, </o:p>, <w:...>)
  html = html.replace(/<\/?\w+:[^>]*>/gi, '');

  // 3. Remove non-semantic wrappers: <font>, <span>
  html = html.replace(/<\/?font[^>]*>/gi, '');
  html = html.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');

  // 4. Strip pure slide markers (e.g. <p><strong>Slide 3 </strong></p>, <p>Slide 5</p>, <h3>Slide 6</h3>, <div>Slide 7</div>)
  // Standalone slide markers are PowerPoint/Word layout artifacts, not educational reading content
  html = html.replace(
    /<(?:p|h[2-6]|div)[^>]*>\s*(?:<[^>]+>\s*)*Slide\s*\d+\s*(?:<[^>]+>\s*)*<\/(?:p|h[2-6]|div)>/gi,
    ''
  );

  // Strip leading slide markers from content paragraphs (e.g. <p><strong>Slide 1:</strong> Content here</p> -> <p>Content here</p>)
  html = html.replace(
    /(<p[^>]*>\s*(?:<[^>]+>\s*)*)Slide\s*\d+[\s:.-]+(?:<\/[^>]+>\s*)*(?=\S)/gi,
    '$1'
  );

  // 5. Strip images, image links, FILE # codes, and prompts if stripImages is enabled
  if (stripImages) {
    // Strip <img> tags
    html = html.replace(/<img[^>]*>/gi, '');

    // Strip entire paragraphs or headings containing FILE #, stock.adobe.com URLs, or Asset IDs
    html = html.replace(
      /<p[^>]*>(?:(?!<\/p>)[\s\S])*(?:FILE\s*#|File\s*#|stock\.adobe\.com|Asset\s*ID:?\s*\d+)(?:(?!<\/p>)[\s\S])*<\/p>/gi,
      ''
    );
    html = html.replace(
      /<h[2-6][^>]*>(?:(?!<\/h[2-6]>)[\s\S])*(?:FILE\s*#|File\s*#|stock\.adobe\.com|Asset\s*ID:?\s*\d+)(?:(?!<\/h[2-6]>)[\s\S])*<\/h[2-6]>/gi,
      ''
    );

    // Strip paragraphs that represent image callouts, captions, bracketed descriptions, or prompts
    html = html.replace(
      /<p[^>]*>(?:(?!<\/p>)[\s\S])*(?:\[Image:?|\[Figure:?|Image:?|Figure\s*\d+:?|AI\s*Image\s*Prompt:?|Visual\s*Description:?|Visual\s*Prompt:?|Image\s*Prompt:?|Stock\s*Asset:?)(?:(?!<\/p>)[\s\S])*<\/p>/gi,
      ''
    );

    // Strip any remaining inline stock asset codes or FILE #: embedded in paragraphs
    html = html.replace(
      /(?:FILE|File)\s*#?[:\s\u00a0&nbsp;]*(?:<[^>]+>)*[\s\u00a0&nbsp;]*\d{6,12}/gi,
      ''
    );
    html = html.replace(/#\d{6,12}\b/g, '');
  } else {
    // Standardize <img> tags (strip inline styles/classes, preserve src and alt)
    html = html.replace(
      /<img\s+[^>]*src=(["'])(.*?)\1[^>]*>/gi,
      (m, q, src) => `<img src="${src}" alt="Topic Image" />`
    );
  }

  // 6. Strip ALL class and style attributes from all elements
  html = html.replace(/\s*class=(?:"[^"]*"|'[^']*')/gi, '');
  html = html.replace(/\s*style=(?:"[^"]*"|'[^']*')/gi, '');

  // 7. Strip IDs, lang, and obsolete formatting/presentational attributes
  html = html.replace(
    /\s*(id|lang|align|valign|width|height|border|cellspacing|cellpadding|bgcolor|clear|color|face|size)=(?:"[^"]*"|'[^']*')/gi,
    ''
  );

  // 8. Standardize headers (strip any remaining attributes, enforce clean tags)
  html = html.replace(
    /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
    (m, text) => `<h2>${text.trim()}</h2>`
  );
  html = html.replace(
    /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
    (m, text) => `<h3>${text.trim()}</h3>`
  );
  html = html.replace(
    /<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi,
    (m, text) => `<h4>${text.trim()}</h4>`
  );

  // 9. Standardize lists and list items
  html = html.replace(/<ul[^>]*>/gi, '<ul>');
  html = html.replace(/<ol[^>]*>/gi, '<ol>');
  html = html.replace(
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
    (m, text) => `<li>${text.trim()}</li>`
  );

  // 10. Standardize paragraphs and drop completely empty paragraphs (or paragraphs containing only empty tags)
  html = html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (m, content) => {
    const textOnly = content.replace(/<[^>]*>/g, '').trim();
    const hasMedia = /<img[^>]*>/i.test(content);
    const trimmed = content.trim();
    if (
      (!textOnly && !hasMedia) ||
      trimmed === '&nbsp;' ||
      trimmed === '<br>' ||
      trimmed === '<br/>'
    ) {
      return '';
    }
    return `<p>${trimmed}</p>`;
  });

  // 10. Standardize strong and emphasis
  html = html.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '<strong>$1</strong>');
  html = html.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '<em>$1</em>');
  html = html.replace(
    /<strong[^>]*>([\s\S]*?)<\/strong>/gi,
    (m, text) => `<strong>${text.trim()}</strong>`
  );
  html = html.replace(
    /<em[^>]*>([\s\S]*?)<\/em>/gi,
    (m, text) => `<em>${text.trim()}</em>`
  );

  // 11. Standardize tables
  html = html.replace(/<table[^>]*>/gi, '<table>');
  html = html.replace(/<tr[^>]*>/gi, '<tr>');
  html = html.replace(
    /<th[^>]*>([\s\S]*?)<\/th>/gi,
    (m, text) => `<th>${text.trim()}</th>`
  );
  html = html.replace(
    /<td[^>]*>([\s\S]*?)<\/td>/gi,
    (m, text) => `<td>${text.trim()}</td>`
  );

  // 12. Clean links (preserve href and target)
  html = html.replace(
    /<a\s+[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$3</a>'
  );

  // 13. Unwrap all inner / nested / empty <div> tags so they never nest or create empty wrappers
  let prev;
  do {
    prev = html;
    html = html.replace(/<div>\s*<\/div>/gi, '');
    html = html.replace(/<div>([\s\S]*?)<\/div>/gi, '$1');
  } while (html !== prev);

  // 14. Clean up multiple empty lines or trailing breaks
  html = html.replace(/<p>\s*<\/p>/gi, '');
  html = html.replace(/(\r?\n\s*){3,}/g, '\n\n');

  return html.trim();
}

/**
 * Wraps clean inner HTML in strictly ONE single parent <div> without any classes or styles:
 * <div>...content elements...</div>
 * @param {string} innerHtml - Normalized inner HTML
 * @param {object} [options={}] - { stripImages: boolean }
 * @returns {string} - Clean LMS editorHtml wrapped in 1 parent div
 */
export function wrapInLmsContainer(innerHtml, options = {}) {
  const clean = normalizeHtmlContent(innerHtml, options);
  return `<div>${clean}</div>`;
}

/**
 * Calculates word count from an HTML string or text
 * @param {string} htmlOrText
 * @returns {number}
 */
export function calculateWordCount(htmlOrText) {
  if (!htmlOrText) return 0;
  // Strip tags
  const plainText = htmlOrText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plainText) return 0;
  return plainText.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculates reading duration in seconds for a topic
 * Reference formula: Math.max(30, Math.round(wordCount * 0.5))
 * @param {number|string} wordCountOrHtml
 * @returns {number} duration in seconds
 */
export function calculateTopicDuration(wordCountOrHtml) {
  const wordCount =
    typeof wordCountOrHtml === 'number'
      ? wordCountOrHtml
      : calculateWordCount(wordCountOrHtml);
  return Math.max(30, Math.round(wordCount * 0.5));
}
