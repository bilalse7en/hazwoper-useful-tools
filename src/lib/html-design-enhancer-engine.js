/**
 * HTML Design Enhancer Engine
 * 100% Free AI & Tailwind CSS Conversion System
 * - Checks HTML and converts all inline style="..." attributes to 100% Tailwind classes
 * - Strictly strips <style> and <script> tags
 * - Dynamically injects hover animations, border movement, background shift, and corner faded circles (when animateOnHover is ON)
 * - Guarantees clean static Tailwind output (when animateOnHover is OFF)
 * - Supports Quick Text generation into published template designs
 */

import { callPuterAiChat } from '@/lib/se7en-ai';

/**
 * Detect all style attributes and tags in the HTML
 */
export function detectStyleAttributes(html) {
  if (!html || typeof html !== 'string') {
    return {
      count: 0,
      hasStyleTags: false,
      hasScriptTags: false,
      elements: [],
    };
  }

  const hasStyleTags = /<style[\s>]/i.test(html);
  const hasScriptTags = /<script[\s>]/i.test(html);

  // Match style="..." or style='...'
  const styleAttrRegex = /\sstyle=(["'])(.*?)\1/gi;
  let match;
  let count = 0;
  const elements = [];

  while ((match = styleAttrRegex.exec(html)) !== null) {
    count++;
    if (elements.length < 10) {
      elements.push(match[2].trim());
    }
  }

  return {
    count,
    hasStyleTags,
    hasScriptTags,
    sampleStyles: elements,
    isClean: count === 0 && !hasStyleTags && !hasScriptTags,
  };
}

/**
 * Normalize CSS value for Tailwind arbitrary class usage
 * e.g., "0 10px 28px rgba(1, 51, 93, 0.10)" -> "0_10px_28px_rgba(1,51,93,0.10)"
 */
function toTailwindValue(val) {
  if (!val) return '';
  return val
    .trim()
    .replace(/\s*,\s*/g, ',') // Remove spaces around commas in rgba(...)
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}

/**
 * Convert individual CSS property and value to Tailwind classes
 */
function cssPropToTailwind(prop, value) {
  const p = prop.trim().toLowerCase();
  const v = value.trim();
  const twVal = toTailwindValue(v);

  // 1. Display
  if (p === 'display') {
    if (v === 'flex') return ['flex'];
    if (v === 'grid') return ['grid'];
    if (v === 'block') return ['block'];
    if (v === 'inline-block') return ['inline-block'];
    if (v === 'inline') return ['inline'];
    if (v === 'inline-flex') return ['inline-flex'];
    if (v === 'none') return ['hidden'];
    return [`[display:${twVal}]`];
  }

  // 2. Flexbox & Grid
  if (p === 'flex-direction') {
    if (v === 'column') return ['flex-col'];
    if (v === 'row') return ['flex-row'];
    if (v === 'column-reverse') return ['flex-col-reverse'];
    if (v === 'row-reverse') return ['flex-row-reverse'];
    return [`flex-[${twVal}]`];
  }
  if (p === 'flex-wrap') {
    if (v === 'wrap') return ['flex-wrap'];
    if (v === 'nowrap') return ['flex-nowrap'];
    if (v === 'wrap-reverse') return ['flex-wrap-reverse'];
    return [`flex-[${twVal}]`];
  }
  if (p === 'justify-content') {
    if (v === 'center') return ['justify-center'];
    if (v === 'space-between') return ['justify-between'];
    if (v === 'space-around') return ['justify-around'];
    if (v === 'space-evenly') return ['justify-evenly'];
    if (v === 'flex-start' || v === 'start') return ['justify-start'];
    if (v === 'flex-end' || v === 'end') return ['justify-end'];
    return [`justify-[${twVal}]`];
  }
  if (p === 'align-items') {
    if (v === 'center') return ['items-center'];
    if (v === 'flex-start' || v === 'start') return ['items-start'];
    if (v === 'flex-end' || v === 'end') return ['items-end'];
    if (v === 'stretch') return ['items-stretch'];
    if (v === 'baseline') return ['items-baseline'];
    return [`items-[${twVal}]`];
  }
  if (p === 'gap') {
    return [`gap-[${twVal}]`];
  }
  if (p === 'row-gap') return [`gap-y-[${twVal}]`];
  if (p === 'column-gap') return [`gap-x-[${twVal}]`];

  if (p === 'flex') {
    if (v === '1' || v === '1 1 0%') return ['flex-1'];
    if (v === 'auto') return ['flex-auto'];
    if (v === 'initial') return ['flex-initial'];
    if (v === 'none') return ['flex-none'];
    return [`flex-[${twVal}]`];
  }
  if (p === 'flex-grow') return [`grow-[${twVal}]`];
  if (p === 'flex-shrink') return [`shrink-[${twVal}]`];
  if (p === 'flex-basis') return [`basis-[${twVal}]`];

  // 3. Spacing (Padding & Margin)
  if (p === 'padding') return [`p-[${twVal}]`];
  if (p === 'padding-top') return [`pt-[${twVal}]`];
  if (p === 'padding-bottom') return [`pb-[${twVal}]`];
  if (p === 'padding-left') return [`pl-[${twVal}]`];
  if (p === 'padding-right') return [`pr-[${twVal}]`];

  if (p === 'margin') {
    if (v === '0 auto' || v === 'auto') return ['mx-auto'];
    return [`m-[${twVal}]`];
  }
  if (p === 'margin-top') return [`mt-[${twVal}]`];
  if (p === 'margin-bottom') return [`mb-[${twVal}]`];
  if (p === 'margin-left') {
    if (v === 'auto') return ['ml-auto'];
    return [`ml-[${twVal}]`];
  }
  if (p === 'margin-right') {
    if (v === 'auto') return ['mr-auto'];
    return [`mr-[${twVal}]`];
  }

  // 4. Dimensions
  if (p === 'width') {
    if (v === '100%') return ['w-full'];
    if (v === 'auto') return ['w-auto'];
    if (v === 'fit-content') return ['w-fit'];
    return [`w-[${twVal}]`];
  }
  if (p === 'max-width') {
    if (v === '100%') return ['max-w-full'];
    if (v === 'none') return ['max-w-none'];
    return [`max-w-[${twVal}]`];
  }
  if (p === 'min-width') {
    if (v === '100%') return ['min-w-full'];
    if (v === '0') return ['min-w-0'];
    return [`min-w-[${twVal}]`];
  }
  if (p === 'height') {
    if (v === '100%') return ['h-full'];
    if (v === 'auto') return ['h-auto'];
    if (v === '100vh') return ['h-screen'];
    return [`h-[${twVal}]`];
  }
  if (p === 'max-height') return [`max-h-[${twVal}]`];
  if (p === 'min-height') return [`min-h-[${twVal}]`];

  // 5. Colors & Background
  if (p === 'color') {
    if (v === '#fff' || v === '#ffffff' || v === 'white') return ['text-white'];
    if (v === '#000' || v === '#000000' || v === 'black') return ['text-black'];
    return [`text-[${twVal}]`];
  }

  if (p === 'background' || p === 'background-color') {
    if (v === '#fff' || v === '#ffffff' || v === 'white') return ['bg-white'];
    if (v === 'transparent') return ['bg-transparent'];
    if (v.startsWith('linear-gradient') || v.startsWith('radial-gradient')) {
      return [`bg-[${twVal}]`];
    }
    return [`bg-[${twVal}]`];
  }

  // 6. Typography
  if (p === 'font-size') return [`text-[${twVal}]`];
  if (p === 'font-weight') {
    if (v === '700' || v === 'bold') return ['font-bold'];
    if (v === '600' || v === 'semibold') return ['font-semibold'];
    if (v === '800' || v === 'extrabold') return ['font-extrabold'];
    if (v === '900' || v === 'black') return ['font-black'];
    if (v === '500' || v === 'medium') return ['font-medium'];
    if (v === '400' || v === 'normal') return ['font-normal'];
    if (v === '300' || v === 'light') return ['font-light'];
    return [`font-[${twVal}]`];
  }
  if (p === 'font-family') {
    if (v.includes('monospace') || v.includes('mono')) return ['font-mono'];
    if (v.includes('sans-serif') || v.includes('sans')) return ['font-sans'];
    if (v.includes('serif')) return ['font-serif'];
    return [`font-[${twVal}]`];
  }
  if (p === 'text-align') {
    if (v === 'center') return ['text-center'];
    if (v === 'left') return ['text-left'];
    if (v === 'right') return ['text-right'];
    if (v === 'justify') return ['text-justify'];
    return [`text-[${twVal}]`];
  }
  if (p === 'line-height') return [`leading-[${twVal}]`];
  if (p === 'letter-spacing') return [`tracking-[${twVal}]`];
  if (p === 'text-transform') {
    if (v === 'uppercase') return ['uppercase'];
    if (v === 'lowercase') return ['lowercase'];
    if (v === 'capitalize') return ['capitalize'];
    if (v === 'none') return ['normal-case'];
  }
  if (p === 'text-decoration') {
    if (v === 'underline') return ['underline'];
    if (v === 'line-through') return ['line-through'];
    if (v === 'none') return ['no-underline'];
  }

  // 7. Borders & Radius
  if (p === 'border-radius') {
    if (v === '50%' || v === '9999px') return ['rounded-full'];
    if (v === '0' || v === '0px') return ['rounded-none'];
    return [`rounded-[${twVal}]`];
  }
  if (p === 'border') {
    if (v === 'none' || v === '0') return ['border-0'];
    const parts = v.split(/\s+/);
    const classes = ['border'];
    if (parts.length >= 3) {
      const colorVal = parts.slice(2).join(' ');
      classes.push(`border-[${toTailwindValue(colorVal)}]`);
    } else if (parts.length === 2) {
      classes.push(`border-[${toTailwindValue(parts[1])}]`);
    }
    return classes;
  }
  if (p === 'border-left') {
    if (v === 'none' || v === '0') return ['border-l-0'];
    const parts = v.split(/\s+/);
    const classes = ['border-l-[6px]'];
    if (parts[0] && parts[0].includes('px')) {
      classes[0] = `border-l-[${parts[0]}]`;
    }
    if (parts.length >= 3) {
      classes.push(`border-l-[${toTailwindValue(parts.slice(2).join(' '))}]`);
    }
    return classes;
  }
  if (p === 'border-top') {
    if (v === 'none' || v === '0') return ['border-t-0'];
    const parts = v.split(/\s+/);
    const classes = ['border-t-[6px]'];
    if (parts[0] && parts[0].includes('px')) {
      classes[0] = `border-t-[${parts[0]}]`;
    }
    if (parts.length >= 3) {
      classes.push(`border-t-[${toTailwindValue(parts.slice(2).join(' '))}]`);
    }
    return classes;
  }
  if (p === 'border-right') {
    if (v === 'none' || v === '0') return ['border-r-0'];
    return [`border-r-[${twVal}]`];
  }
  if (p === 'border-bottom') {
    if (v === 'none' || v === '0') return ['border-b-0'];
    return [`border-b-[${twVal}]`];
  }
  if (p === 'border-color') return [`border-[${twVal}]`];
  if (p === 'border-width') return [`border-[${twVal}]`];

  // 8. Box Shadow & Sizing
  if (p === 'box-shadow') {
    if (v === 'none') return ['shadow-none'];
    return [`shadow-[${twVal}]`];
  }
  if (p === 'box-sizing') {
    if (v === 'border-box') return ['box-border'];
    if (v === 'content-box') return ['box-content'];
  }

  // 9. Positioning & Z-Index
  if (p === 'position') {
    if (v === 'relative') return ['relative'];
    if (v === 'absolute') return ['absolute'];
    if (v === 'fixed') return ['fixed'];
    if (v === 'sticky') return ['sticky'];
    return [`[position:${twVal}]`];
  }
  if (p === 'top') return [`top-[${twVal}]`];
  if (p === 'bottom') return [`bottom-[${twVal}]`];
  if (p === 'left') return [`left-[${twVal}]`];
  if (p === 'right') return [`right-[${twVal}]`];
  if (p === 'z-index') return [`z-[${twVal}]`];

  // 10. Overflow, Opacity, Cursor, Transitions
  if (p === 'overflow') {
    if (v === 'hidden') return ['overflow-hidden'];
    if (v === 'auto') return ['overflow-auto'];
    if (v === 'visible') return ['overflow-visible'];
    return [`overflow-[${twVal}]`];
  }
  if (p === 'overflow-x') {
    if (v === 'auto') return ['overflow-x-auto'];
    if (v === 'hidden') return ['overflow-x-hidden'];
  }
  if (p === 'overflow-y') {
    if (v === 'auto') return ['overflow-y-auto'];
    if (v === 'hidden') return ['overflow-y-hidden'];
  }
  if (p === 'opacity') {
    const num = parseFloat(v);
    if (!isNaN(num)) {
      return [`opacity-${Math.round(num * 100)}`];
    }
    return [`opacity-[${twVal}]`];
  }
  if (p === 'cursor') {
    if (v === 'pointer') return ['cursor-pointer'];
    if (v === 'default') return ['cursor-default'];
    if (v === 'not-allowed') return ['cursor-not-allowed'];
    return [`cursor-[${twVal}]`];
  }
  if (p === 'transition') {
    return ['transition-all duration-300 ease-in-out'];
  }

  // Fallback for any other CSS property: Tailwind arbitrary property syntax
  return [`[${p}:${twVal}]`];
}

/**
 * Convert all inline styles inside an element's style attribute to Tailwind classes
 */
function parseStyleStringToTailwindClasses(styleStr) {
  if (!styleStr) return [];
  const declarations = styleStr
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const classes = [];

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.substring(0, colonIdx).trim();
    const val = decl.substring(colonIdx + 1).trim();
    if (prop && val) {
      const tw = cssPropToTailwind(prop, val);
      if (tw && tw.length > 0) {
        classes.push(...tw);
      }
    }
  }

  return classes;
}

/**
 * 100% Deterministic Style-to-Tailwind Converter
 * - Strips any <style> or <script> tags
 * - Finds every style="..." attribute and replaces it with pure Tailwind classes
 * - Merges with existing class="..." attribute
 * - Removes style="..." attribute completely
 */
export function convertInlineStylesToTailwind(html) {
  if (!html || typeof html !== 'string') return '';

  // 1. Remove all <style> and <script> tags
  let cleaned = html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, ''); // strip comments

  if (typeof window === 'undefined') {
    // Basic regex fallback if executed outside browser environment
    return cleaned.replace(/\sstyle=(["'])(.*?)\1/gi, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'text/html');

    // Remove any remaining style/script elements from DOM
    doc.querySelectorAll('style, script').forEach((el) => el.remove());

    const allElements = doc.body.querySelectorAll('*');

    allElements.forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr) {
        const newClasses = parseStyleStringToTailwindClasses(styleAttr);
        const existingClass = el.getAttribute('class') || '';
        const existingClassList = existingClass.split(/\s+/).filter(Boolean);

        // Deduplicate and combine
        const combined = Array.from(
          new Set([...existingClassList, ...newClasses])
        );
        if (combined.length > 0) {
          el.setAttribute('class', combined.join(' '));
        }

        // REMOVE style attribute completely
        el.removeAttribute('style');
      }
    });

    return doc.body.innerHTML.trim();
  } catch (err) {
    console.warn(
      'DOMParser failed in convertInlineStylesToTailwind, falling back to regex:',
      err
    );
    // Regex fallback
    return cleaned.replace(/\sstyle=(["'])(.*?)\1/gi, '');
  }
}

/**
 * Apply Professional Hover Animations & Corner Faded Circles
 * - Injects group and transition classes
 * - Injects border and background movement on hover
 * - Injects ambient faded blur circles at the corners that expand and drift on hover
 * - IF options.animateOnHover is false, NO animations or hover effects are added!
 */
export function applyHoverAnimationsAndCornerGlow(html, options = {}) {
  const {
    animateOnHover = true,
    themeColor = 'ocean', // 'ocean', 'purple', 'emerald', 'rose', 'amber'
  } = options;

  if (!html || typeof html !== 'string') return '';

  // First ensure all inline styles are converted to Tailwind
  const tailwindHtml = convertInlineStylesToTailwind(html);

  // If user disabled hover animation, return clean static Tailwind code!
  if (!animateOnHover) {
    return tailwindHtml;
  }

  if (typeof window === 'undefined') {
    return tailwindHtml;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(tailwindHtml, 'text/html');

    // Color definitions for corner faded glow circles
    const glowColors = {
      ocean: {
        circle1: 'bg-[#205f99]/15 group-hover:bg-[#205f99]/25',
        circle2: 'bg-sky-400/15 group-hover:bg-sky-400/25',
        border: 'group-hover:border-[#205f99]',
      },
      purple: {
        circle1: 'bg-purple-600/15 group-hover:bg-purple-600/25',
        circle2: 'bg-indigo-400/15 group-hover:bg-indigo-400/25',
        border: 'group-hover:border-purple-500',
      },
      emerald: {
        circle1: 'bg-emerald-600/15 group-hover:bg-emerald-600/25',
        circle2: 'bg-teal-400/15 group-hover:bg-teal-400/25',
        border: 'group-hover:border-emerald-500',
      },
      rose: {
        circle1: 'bg-rose-600/15 group-hover:bg-rose-600/25',
        circle2: 'bg-pink-400/15 group-hover:bg-pink-400/25',
        border: 'group-hover:border-rose-500',
      },
      amber: {
        circle1: 'bg-amber-500/15 group-hover:bg-amber-500/25',
        circle2: 'bg-orange-400/15 group-hover:bg-orange-400/25',
        border: 'group-hover:border-amber-500',
      },
    };

    const currentGlow = glowColors[themeColor] || glowColors.ocean;

    // Detect card or main container elements to animate
    const candidateCards = doc.body.querySelectorAll(
      'div[class*="rounded"], div[class*="border"], div[class*="flex-1"], div[class*="shadow"]'
    );

    let cardIndex = 0;
    candidateCards.forEach((card) => {
      // Skip very small wrappers or parent container
      if (card.children.length === 0 && !card.textContent?.trim()) return;
      if (card === doc.body.firstElementChild && candidateCards.length > 1)
        return;

      const cls = card.getAttribute('class') || '';

      // Only decorate substantive cards
      const isCardLike =
        cls.includes('rounded') ||
        cls.includes('border') ||
        cls.includes('flex-[1') ||
        cls.includes('basis-');

      if (!isCardLike) return;

      // Ensure relative & overflow-hidden so corner circles stay neatly inside
      const ensureRelative = cls.includes('relative') ? '' : ' relative';
      const ensureOverflow = cls.includes('overflow-hidden')
        ? ''
        : ' overflow-hidden';
      const ensureGroup = cls.includes('group') ? '' : ' group';

      // Hover elevation, border transitions, and staggered delay
      const animationClasses = `transition-[border-color,box-shadow,transform] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(1,51,93,0.14)] hover:-translate-y-0.5 ${currentGlow.border}`;

      card.setAttribute(
        'class',
        `${cls}${ensureGroup}${ensureRelative}${ensureOverflow} ${animationClasses}`.trim()
      );

      // Check if faded circles are already present
      const hasCircle = card.querySelector('.faded-corner-circle');
      if (!hasCircle) {
        // Create Top-Right Faded Ambient Circle
        const circleTopRight = doc.createElement('div');
        circleTopRight.setAttribute(
          'class',
          `faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl ${currentGlow.circle1} transition-all duration-700 ease-out group-hover:scale-125 group-hover:-translate-y-2 group-hover:translate-x-2`
        );

        // Create Bottom-Left Faded Ambient Circle
        const circleBottomLeft = doc.createElement('div');
        circleBottomLeft.setAttribute(
          'class',
          `faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl ${currentGlow.circle2} transition-all duration-700 ease-out group-hover:scale-125 group-hover:translate-y-2 group-hover:-translate-x-2`
        );

        // Insert at beginning of card so they stay in background
        card.insertBefore(circleBottomLeft, card.firstChild);
        card.insertBefore(circleTopRight, card.firstChild);
      }

      cardIndex++;
    });

    return doc.body.innerHTML.trim();
  } catch (err) {
    console.warn('Error applying animations & corner glow:', err);
    return tailwindHtml;
  }
}

/**
 * 100% Free AI HTML Design Enhancement via Puter.js
 * Combines free AI reasoning with fallback to deterministic Tailwind engine
 */
export async function enhanceHtmlWithFreeAi(rawHtml, options = {}) {
  const {
    animateOnHover = true,
    themeColor = 'ocean',
    requestedModel = 'gpt-4o-mini',
  } = options;

  if (!rawHtml || typeof rawHtml !== 'string') return '';

  // 1. Run deterministic style conversion first as safety baseline
  const baselineTailwind = convertInlineStylesToTailwind(rawHtml);

  // 2. Prepare AI prompt
  const prompt = `You are an elite Frontend Architect and Tailwind CSS Master.
Your task is to ENHANCE the following HTML code.

STRICT REQUIREMENTS:
1. CHECK FOR STYLE ATTRIBUTES: If there are ANY 'style="..."' inline attributes, replace 100% of them with exact modern Tailwind CSS classes (including arbitrary values like 'bg-[#205f99]', 'p-[22px]', 'border-l-[6px]').
2. ZERO STYLE TAGS OR SCRIPT TAGS: You must NEVER include <style> or <script> tags. All styling must be pure Tailwind classes.
3. ANIMATION ON HOVER OPTION:
   - "Animate on Hover" is set to: ${animateOnHover ? 'TRUE' : 'FALSE'}.
   ${
     animateOnHover
       ? `- Since Animate on Hover is TRUE: Add unique hover transitions ('transition-all duration-500 ease-out'), subtle card border highlight ('hover:border-primary/60'), subtle elevation ('hover:-translate-y-1 hover:shadow-2xl'), and embed subtle corner faded ambient circles on card containers (e.g. '<div class="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/15 blur-2xl group-hover:scale-125 transition-all duration-700"></div>'). Ensure card containers have 'relative overflow-hidden group'.`
       : `- Since Animate on Hover is FALSE: DO NOT add any hover transitions, animations, hover shadows, or corner circles. Provide clean, pristine, static responsive Tailwind classes only.`
   }
4. PRESERVE ALL TEXT AND CONTENT: Do not delete headings, text, or bullet points.
5. OUTPUT ONLY PURE HTML: No markdown wrappers (\`\`\`html), no preamble, no explanations. Just clean HTML.

INPUT HTML TO ENHANCE:
${baselineTailwind || rawHtml}`;

  try {
    const aiResponse = await callPuterAiChat(prompt, requestedModel);
    if (aiResponse && typeof aiResponse === 'string') {
      let cleanHtml = aiResponse.trim();
      // Remove any markdown codeblocks if AI wrapped it
      cleanHtml = cleanHtml
        .replace(/^```(?:html)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      // Ensure style tags and script tags are stripped even from AI output
      cleanHtml = convertInlineStylesToTailwind(cleanHtml);

      // If user requested hover animations, ensure corner circles and effects are finalized
      if (animateOnHover) {
        cleanHtml = applyHoverAnimationsAndCornerGlow(cleanHtml, {
          animateOnHover: true,
          themeColor,
        });
      }

      return cleanHtml;
    }
  } catch (aiErr) {
    console.warn(
      'Puter AI enhancement encountered error, using instant engine:',
      aiErr
    );
  }

  // Fallback: Instant Deterministic Enhancement
  return applyHoverAnimationsAndCornerGlow(baselineTailwind, {
    animateOnHover,
    themeColor,
  });
}

/**
 * Quick Text Generator for Published Templates
 * Injects user's pasted quick text into a published design template while preserving 100% of styles & animations
 */
export async function injectQuickTextIntoDesign(templateHtml, quickText) {
  if (!templateHtml || !quickText) return templateHtml;

  const prompt = `You are a Presentation & Web Content Specialist.
We have a finalized, perfectly styled Tailwind HTML design template.
The user wants to replace the text inside this template with their new content from "Quick Text".

RULES:
1. PRESERVE 100% of HTML tags, Tailwind classes, animations, corner glow circles, and layout structure.
2. DO NOT change class names or layout.
3. Replace the placeholder headings, bullet points, and descriptions with the user's text.
4. If there are 4 or 5 points, map the points logically.
5. NEVER add <style> or <script> tags.
6. OUTPUT ONLY PURE HTML (no markdown codeblocks, no explanations).

USER QUICK TEXT:
${quickText}

HTML TEMPLATE TO POPULATE:
${templateHtml}`;

  try {
    const response = await callPuterAiChat(prompt, 'gpt-4o-mini');
    if (response && typeof response === 'string') {
      let clean = response
        .trim()
        .replace(/^```(?:html)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();
      return convertInlineStylesToTailwind(clean);
    }
  } catch (err) {
    console.warn(
      'AI Quick Text injection error, using DOM text replacement:',
      err
    );
  }

  // Fallback: DOM-based text injection
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(templateHtml, 'text/html');
      const lines = quickText
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(Boolean);

      const textContainers = doc.body.querySelectorAll(
        'p, span, li, h1, h2, h3, h4'
      );
      lines.forEach((line, idx) => {
        if (textContainers[idx]) {
          textContainers[idx].textContent = line;
        }
      });

      return doc.body.innerHTML.trim();
    } catch {
      return templateHtml;
    }
  }

  return templateHtml;
}
