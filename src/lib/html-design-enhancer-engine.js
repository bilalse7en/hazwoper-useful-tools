/**
 * HTML Design Enhancer Engine
 * 100% Free AI & Tailwind CSS Conversion System
 * - Checks HTML and converts all inline style="..." attributes to 100% Tailwind classes
 * - Strictly strips <style> and <script> tags
 * - Dynamically injects slow, smooth hover animations, border movement, background shift, and corner faded circles (when animateOnHover is ON)
 * - Guarantees clean static Tailwind output (when animateOnHover is OFF)
 * - Restrains desktop images so they never blow up or become too large
 * - Supports Image Left/Right & Icon Left/Right structured presentation cards
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

  // 10. Overflow, Opacity, Cursor, Media & Transitions
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
    return ['transition-all duration-700 ease-out'];
  }
  if (p === 'object-fit') {
    if (v === 'cover') return ['object-cover'];
    if (v === 'contain') return ['object-contain'];
    if (v === 'fill') return ['object-fill'];
    if (v === 'none') return ['object-none'];
    if (v === 'scale-down') return ['object-scale-down'];
    return [`object-[${twVal}]`];
  }
  if (p === 'object-position') {
    if (v === 'center') return ['object-center'];
    if (v === 'top') return ['object-top'];
    if (v === 'bottom') return ['object-bottom'];
    if (v === 'left') return ['object-left'];
    if (v === 'right') return ['object-right'];
    return [`object-[${twVal}]`];
  }
  if (p === 'aspect-ratio') {
    if (v === '1/1' || v === '1 / 1' || v === '1') return ['aspect-square'];
    if (v === '16/9' || v === '16 / 9') return ['aspect-video'];
    return [`aspect-[${twVal}]`];
  }
  if (p === 'backdrop-filter') {
    if (v.includes('blur')) return ['backdrop-blur-md'];
    return [`backdrop-[${twVal}]`];
  }
  if (p === 'filter') {
    if (v.includes('blur')) return ['blur-md'];
    if (v === 'none') return ['filter-none'];
    return [`filter-[${twVal}]`];
  }
  if (p === 'transform') {
    return [`transform-[${twVal}]`];
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
 * Sanitize and clean up Tailwind classes in HTML
 * - Fixes corrupted units like 'ppx' -> 'px', 'pprem' -> 'rem'
 * - Deduplicates classes across every element
 * - Cleans up malformed arbitrary bracket notation
 */
export function sanitizeTailwindClasses(html) {
  if (!html || typeof html !== 'string') return '';

  let sanitized = html
    .replace(/\b(\d+)ppx\b/g, '$1px')
    .replace(/\b(\d+)pprem\b/g, '$1rem')
    .replace(/\b(\d+)%%/g, '$1%');

  if (typeof window === 'undefined') {
    return sanitized;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, 'text/html');

    doc.body.querySelectorAll('*').forEach((el) => {
      const cls = el.getAttribute('class');
      if (cls) {
        const tokens = cls
          .replace(/(\d+)ppx/g, '$1px')
          .replace(/(\d+)pprem/g, '$1rem')
          .split(/\s+/)
          .filter(Boolean);
        const uniqueTokens = Array.from(new Set(tokens));
        el.setAttribute('class', uniqueTokens.join(' '));
      }
    });

    return doc.body.innerHTML.trim();
  } catch {
    return sanitized;
  }
}

/**
 * 100% Deterministic Style-to-Tailwind Converter
 * - Strips any <style> or <script> tags
 * - Finds every style="..." attribute and replaces it with pure Tailwind classes
 * - Merges with existing class="..." attribute
 * - Removes style="..." attribute completely
 * - Safeguards <img> tags so they are responsive and never blow up on desktop
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
    return sanitizeTailwindClasses(
      cleaned.replace(/\sstyle=(["'])(.*?)\1/gi, '')
    );
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

        // Combine and deduplicate
        const combined = Array.from(
          new Set([...existingClassList, ...newClasses])
        );
        el.setAttribute('class', combined.join(' '));
        el.removeAttribute('style');
      }

      // Safeguard images from expanding too large on desktop
      if (el.tagName.toLowerCase() === 'img') {
        const imgCls = el.getAttribute('class') || '';
        const imgClasses = imgCls.split(/\s+/).filter(Boolean);
        if (
          !imgClasses.some((c) => c.startsWith('max-w-') || c.startsWith('w-'))
        ) {
          imgClasses.push('max-w-full');
        }
        if (
          !imgClasses.some((c) => c.startsWith('h-') || c.startsWith('max-h-'))
        ) {
          imgClasses.push('h-auto');
        }
        if (!imgClasses.some((c) => c.startsWith('object-'))) {
          imgClasses.push('object-cover');
        }
        if (!imgClasses.some((c) => c.startsWith('rounded'))) {
          imgClasses.push('rounded-xl');
        }
        el.setAttribute('class', Array.from(new Set(imgClasses)).join(' '));
      }
    });

    return sanitizeTailwindClasses(doc.body.innerHTML.trim());
  } catch (e) {
    console.warn('Error converting inline styles to Tailwind:', e);
    return sanitizeTailwindClasses(
      cleaned.replace(/\sstyle=(["'])(.*?)\1/gi, '')
    );
  }
}

/**
 * Injects Smooth Slow Ambient Animations, Faded Corner Glow Circles,
 * and Desktop-Constrained Card Elevation
 */
export function applyHoverAnimationsAndCornerGlow(tailwindHtml, options = {}) {
  const { animateOnHover = true, themeColor = 'ocean' } = options;

  if (!tailwindHtml || typeof tailwindHtml !== 'string') return '';
  if (typeof window === 'undefined') return tailwindHtml;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(tailwindHtml, 'text/html');

    // If user disabled hover animation, remove all circles and hover classes for static Tailwind
    if (!animateOnHover) {
      doc.body
        .querySelectorAll('.faded-corner-circle')
        .forEach((el) => el.remove());
      doc.body.querySelectorAll('*').forEach((el) => {
        const cls = el.getAttribute('class') || '';
        if (cls) {
          const cleaned = cls
            .split(/\s+/)
            .filter(
              (c) =>
                !c.startsWith('group-hover:') &&
                !c.startsWith('hover:') &&
                !c.startsWith('transition-') &&
                !c.startsWith('duration-') &&
                !c.startsWith('ease-')
            )
            .join(' ');
          if (cleaned) {
            el.setAttribute('class', cleaned);
          } else {
            el.removeAttribute('class');
          }
        }
      });
      return doc.body.innerHTML.trim();
    }

    // Color definitions for corner faded glow circles
    const glowColors = {
      ocean: {
        circle1: 'bg-[#205f99]/15 group-hover:bg-[#205f99]/30',
        circle2: 'bg-sky-400/15 group-hover:bg-sky-400/30',
        border: 'group-hover:border-[#205f99]',
      },
      purple: {
        circle1: 'bg-purple-600/15 group-hover:bg-purple-600/30',
        circle2: 'bg-indigo-400/15 group-hover:bg-indigo-400/30',
        border: 'group-hover:border-purple-500',
      },
      emerald: {
        circle1: 'bg-emerald-600/15 group-hover:bg-emerald-600/30',
        circle2: 'bg-teal-400/15 group-hover:bg-teal-400/30',
        border: 'group-hover:border-emerald-500',
      },
      rose: {
        circle1: 'bg-rose-600/15 group-hover:bg-rose-600/30',
        circle2: 'bg-pink-400/15 group-hover:bg-pink-400/30',
        border: 'group-hover:border-rose-500',
      },
      amber: {
        circle1: 'bg-amber-500/15 group-hover:bg-amber-500/30',
        circle2: 'bg-orange-400/15 group-hover:bg-orange-400/30',
        border: 'group-hover:border-amber-500',
      },
    };

    const currentGlow = glowColors[themeColor] || glowColors.ocean;

    // If the HTML is already an existing polished card design (e.g. from DESIGN_CATALOG),
    // preserve its hand-crafted animations and styles without injecting duplicate layers
    if (isExistingCardDesign(tailwindHtml)) {
      return sanitizeTailwindClasses(tailwindHtml);
    }

    // Detect card or main container elements to animate (top-level only, never nested child divs)
    const allMatches = Array.from(
      doc.body.querySelectorAll(
        '[data-slot], div[class*="rounded-"], div[class*="border"], div[class*="flex-[1"]'
      )
    );

    const candidateCards = allMatches.filter((card) => {
      // Skip very small wrappers or parent container
      if (card.children.length === 0 && !card.textContent?.trim()) return false;
      if (card === doc.body.firstElementChild && allMatches.length > 1)
        return false;
      // Skip if an ancestor is already a candidate card container
      let parent = card.parentElement;
      while (parent && parent !== doc.body) {
        if (allMatches.includes(parent)) return false;
        parent = parent.parentElement;
      }
      return true;
    });

    candidateCards.forEach((card) => {
      // Skip very small wrappers or parent container
      if (card.children.length === 0 && !card.textContent?.trim()) return;
      if (card === doc.body.firstElementChild && candidateCards.length > 1)
        return;

      const cls = card.getAttribute('class') || '';

      // Only decorate substantive cards
      const isCardLike =
        card.hasAttribute('data-slot') ||
        cls.includes('rounded') ||
        cls.includes('border') ||
        cls.includes('flex-[1') ||
        cls.includes('basis-');

      if (!isCardLike) return;

      // Filter out existing animation/transition classes to prevent duplicates
      const existingClasses = cls
        .split(/\s+/)
        .filter(
          (c) =>
            !c.startsWith('transition-[') &&
            !c.startsWith('hover:shadow-') &&
            !c.startsWith('hover:-translate-') &&
            !c.startsWith('group-hover:border-')
        );

      if (!existingClasses.includes('group')) existingClasses.push('group');
      if (!existingClasses.includes('relative'))
        existingClasses.push('relative');
      if (!existingClasses.includes('overflow-hidden'))
        existingClasses.push('overflow-hidden');

      // Add smooth, slow animations (700ms duration)
      if (!existingClasses.some((c) => c.startsWith('transition-'))) {
        existingClasses.push('transition-all', 'duration-700', 'ease-out');
      }

      // Add hover shadow and gentle elevation
      if (!existingClasses.some((c) => c.startsWith('hover:shadow-'))) {
        existingClasses.push('hover:shadow-[0_20px_40px_rgba(1,51,93,0.14)]');
      }
      if (!existingClasses.some((c) => c.startsWith('hover:-translate-'))) {
        existingClasses.push('hover:-translate-y-1');
      }

      // Apply clean deduplicated class list
      card.setAttribute(
        'class',
        Array.from(new Set(existingClasses)).join(' ').trim()
      );

      // Check if faded circles are already present
      const hasCircle = card.querySelector('.faded-corner-circle');
      if (!hasCircle) {
        // Create Top-Right Faded Ambient Circle (Slow animated scale & translate)
        const circleTopRight = doc.createElement('div');
        circleTopRight.setAttribute(
          'class',
          `faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl ${currentGlow.circle1} transition-all duration-1000 ease-out group-hover:scale-125 group-hover:-translate-y-2 group-hover:translate-x-2`
        );

        // Create Bottom-Left Faded Ambient Circle (Slow animated scale & translate)
        const circleBottomLeft = doc.createElement('div');
        circleBottomLeft.setAttribute(
          'class',
          `faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl ${currentGlow.circle2} transition-all duration-1000 ease-out group-hover:scale-125 group-hover:translate-y-2 group-hover:-translate-x-2`
        );

        // Insert at beginning of card so they stay in background
        card.insertBefore(circleBottomLeft, card.firstChild);
        card.insertBefore(circleTopRight, card.firstChild);
      }

      // Check if top accent bar exists
      const hasTopBar = card.querySelector(
        'div[class*="h-[2px]"][class*="w-0"], div[class*="h-0.5"][class*="w-0"]'
      );
      if (!hasTopBar) {
        const topBar = doc.createElement('div');
        topBar.setAttribute(
          'class',
          'absolute top-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary via-sky-400 to-primary transition-all duration-700 ease-out group-hover:w-full'
        );
        card.appendChild(topBar);
      }

      // Check if glassy sweep light beam exists
      const hasShimmer = card.querySelector(
        'div[class*="rotate-[18deg]"], div[class*="skew-x-"]'
      );
      if (!hasShimmer) {
        const shimmer = doc.createElement('div');
        shimmer.setAttribute(
          'class',
          'pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]'
        );
        card.insertBefore(shimmer, card.firstChild);
      }

      // Check if rotating dashed ring exists around image/icon
      const hasDashed = card.querySelector('div[class*="border-dashed"]');
      if (!hasDashed) {
        const img = card.querySelector('img');
        if (img) {
          const parent = img.parentElement;
          if (parent) {
            const dashedRing = doc.createElement('div');
            dashedRing.setAttribute(
              'class',
              'absolute border-2 border-primary/50 border-dashed duration-[1000ms] ease-out group-hover:rotate-[135deg] group-hover:scale-[1.10] h-[98px] w-[98px] sm:h-[110px] sm:w-[110px] rounded-full transition-all'
            );
            if (!parent.classList.contains('relative'))
              parent.classList.add('relative');
            if (!parent.classList.contains('rounded-full'))
              parent.classList.add('rounded-full');
            parent.insertBefore(dashedRing, img);
            img.classList.add(
              'transition-all',
              'duration-700',
              'ease-out',
              'group-hover:scale-[1.08]',
              'rounded-full',
              'border-2',
              'drop-shadow-md'
            );
          }
        } else {
          // If no img, check for an icon emblem or svg (not inside button/link)
          const svg = card.querySelector('svg');
          if (svg && !svg.closest('button, a')) {
            const parent = svg.parentElement;
            if (
              parent &&
              (parent.classList.contains('rounded-full') ||
                parent.classList.contains('rounded-2xl') ||
                parent.classList.contains('w-12') ||
                parent.classList.contains('h-12') ||
                parent.classList.contains('w-14') ||
                parent.classList.contains('h-14') ||
                parent.classList.contains('w-16') ||
                parent.classList.contains('h-16') ||
                parent.classList.contains('w-[62px]') ||
                parent.classList.contains('w-[72px]'))
            ) {
              const dashedRing = doc.createElement('div');
              dashedRing.setAttribute(
                'class',
                'absolute -inset-1.5 border-2 border-primary/40 border-dashed duration-[1000ms] ease-out group-hover:rotate-[135deg] group-hover:scale-[1.12] rounded-full transition-all pointer-events-none'
              );
              if (!parent.classList.contains('relative'))
                parent.classList.add('relative');
              parent.insertBefore(dashedRing, svg);
              parent.classList.add(
                'transition-all',
                'duration-700',
                'ease-out',
                'group-hover:scale-[1.08]'
              );
            }
          }
        }
      }

      // Check if premium corner dot exists
      const hasCornerDot = card.querySelector(
        'div[class*="w-[8px]"][class*="rounded-full"], div[class*="w-2"][class*="rounded-full"]'
      );
      if (!hasCornerDot) {
        const dot = doc.createElement('div');
        dot.setAttribute(
          'class',
          'pointer-events-none absolute top-[22px] right-[22px] w-[8px] h-[8px] rounded-full bg-primary/40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.7] group-hover:shadow-[0_0_0_6px_rgba(37,99,235,0.15)]'
        );
        card.appendChild(dot);
      }

      // Check if expanding bottom accent line exists
      const hasBottomBar = card.querySelector(
        'div[class*="h-1"][class*="rounded"], div[class*="h-[3px]"][class*="rounded"], div[class*="h-[4px]"][class*="rounded"]'
      );
      if (!hasBottomBar) {
        const bar = doc.createElement('div');
        bar.setAttribute(
          'class',
          'bg-primary h-1 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[75px] group-hover:h-[4px] mt-4'
        );
        card.appendChild(bar);
      }
    });

    return sanitizeTailwindClasses(doc.body.innerHTML.trim());
  } catch (err) {
    console.warn('Error applying animations & corner glow:', err);
    return sanitizeTailwindClasses(tailwindHtml);
  }
}

/**
 * Curated Catalog of Modern 100% Tailwind Presentation & Card Designs
 * Featuring:
 * 1. Image + Text Cards (Left Text / Right Image & Left Image / Right Text) with strictly bounded desktop sizing
 * 2. Icon + Text Cards (Left Icon Emblem / Right Heading & Body Text)
 * 3. Dual Comparative Cards
 * 4. 3-Pillar & 4-Step Roadmaps
 * 5. Numerical Metrics & KPIs
 */
export const DESIGN_CATALOG = [
  // 1. Challenge vs AI Solution Split Presentation Cards
  {
    id: 'split-media-challenge-solution',
    title: 'Challenge vs AI Solution Split Cards',
    category: 'Comparison / Split Media',
    description:
      'Executive 100% responsive two-tone split cards. Mobile stacks with top accent border; desktop expands horizontally with left stripe, circular media frame, rotating dashed ring, and bulleted content.',
    slotsCount: 2,
    slotNames: ['The Challenge (Navy Blue)', 'AI Solution (Emerald Mint)'],
    badge: 'Split Media Duo',
    enhanced_html: `<div class="flex flex-wrap gap-[22px] w-full box-border justify-center">

    <!-- THE CHALLENGE -->
    <div data-slot="0" class="group relative flex-[1_1_520px] min-w-[480px] max-[997px]:min-w-full box-border rounded-[22px] bg-gradient-to-br from-white to-[#e8f4fd] border border-[rgba(32,95,153,0.16)] border-t-[6px] border-t-[#205f99] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#205f99] shadow-[0_10px_28px_rgba(1,51,93,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-[border-color,box-shadow] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(1,51,93,0.14)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.1s]">

        <!-- IMAGE PANEL -->
        <div class="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(32,95,153,0.055)] border-b border-[rgba(32,95,153,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] min-[1500px]:basis-[205px] min-[1500px]:min-w-[205px] min-[1728px]:basis-[230px] min-[1728px]:min-w-[230px] min-[2400px]:basis-[270px] min-[2400px]:min-w-[270px] transition-all duration-500 group-hover:bg-[rgba(32,95,153,0.09)]">

            <!-- SOFT BACKGROUND GLOW -->
            <div class="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(32,95,153,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(32,95,153,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-auto min-[998px]:bottom-[-170px] min-[998px]:translate-y-0 min-[998px]:w-[190px] min-[998px]:h-[190px] min-[1400px]:w-[205px] min-[1400px]:h-[205px] min-[1500px]:w-[225px] min-[1500px]:h-[225px] min-[1728px]:w-[250px] min-[1728px]:h-[250px] min-[2400px]:w-[285px] min-[2400px]:h-[285px] min-[1400px]:group-hover:scale-[1.35]"></div>

            <!-- IMAGE FRAME -->
            <div class="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.82)] flex items-center justify-center shadow-[0_0_0_8px_rgba(32,95,153,0.06),0_10px_22px_rgba(32,95,153,0.12)] z-[2] min-[1400px]:w-[155px] min-[1400px]:h-[155px] min-[1500px]:w-[170px] min-[1500px]:h-[170px] min-[1728px]:w-[190px] min-[1728px]:h-[190px] min-[2400px]:w-[220px] min-[2400px]:h-[220px]">

                <!-- ROTATING DOTTED CIRCLE -->
                <div class="absolute border-2 border-[#205f99eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] min-[1400px]:h-[126px] min-[1400px]:w-[126px] min-[1500px]:h-[140px] min-[1500px]:w-[140px] min-[1728px]:h-[156px] min-[1728px]:w-[156px] min-[2400px]:h-[180px] min-[2400px]:w-[180px] rounded-full transition-all w-[118px]"></div>

                <!-- IMAGE -->
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/the-challange.webp" alt="The Challenge" class="max-w-[112px] max-h-[112px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(32,95,153,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(32,95,153,0.42)] min-[1400px]:max-w-[120px] min-[1400px]:max-h-[120px] min-[1500px]:max-w-[132px] min-[1500px]:max-h-[132px] min-[1728px]:max-w-[148px] min-[1728px]:max-h-[148px] min-[2400px]:max-w-[172px] min-[2400px]:max-h-[172px]">

            </div>
        </div>

        <!-- CONTENT -->
        <div class="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">

            <!-- PREMIUM CORNER DOT -->
            <div class="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#205f99] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(32,95,153,0.10)]"></div>

            <h3 class="m-0 mb-3 text-[#205f99] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#174f82]">
                The Challenge
            </h3>

            <ul class="leading-[1.6] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
                <li>To balance speed, accuracy, and personalization.</li>
                <li>Each response must address the customer’s specific situation.</li>
                <li>Manual tasks like locating information, reviewing previous messages, and rewriting similar explanations.</li>
                <li>Fast work increases the risk of error.</li>
                <li>A rushed response may omit an important detail, use an inappropriate tone, or provide outdated information.</li>
            </ul>

            <!-- EXISTING ACCENT -->
            <div class="!mx-auto bg-[#205f99] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]"></div>

        </div>
    </div>


    <!-- HOW AI CAN HELP -->
    <div data-slot="1" class="group relative flex-[1_1_520px] min-w-[480px] max-[997px]:min-w-full box-border rounded-[22px] bg-gradient-to-br from-white to-[#e5faec] border border-[rgba(16,185,129,0.16)] border-t-[6px] border-t-[#10b981] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#10b981] shadow-[0_10px_28px_rgba(16,185,129,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-[border-color,box-shadow] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(16,185,129,0.14)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.2s]">

        <!-- IMAGE PANEL -->
        <div class="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(16,185,129,0.055)] border-b border-[rgba(16,185,129,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] min-[1500px]:basis-[205px] min-[1500px]:min-w-[205px] min-[1728px]:basis-[230px] min-[1728px]:min-w-[230px] min-[2400px]:basis-[270px] min-[2400px]:min-w-[270px] transition-all duration-500 group-hover:bg-[rgba(16,185,129,0.09)]">

            <!-- SOFT BACKGROUND GLOW -->
            <div class="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(16,185,129,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(16,185,129,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-[-170px] min-[998px]:bottom-auto min-[998px]:translate-y-0 min-[998px]:w-[190px] min-[998px]:h-[190px] min-[1400px]:w-[205px] min-[1400px]:h-[205px] min-[1500px]:w-[225px] min-[1500px]:h-[225px] min-[1728px]:w-[250px] min-[1728px]:h-[250px] min-[2400px]:w-[285px] min-[2400px]:h-[285px] min-[1400px]:group-hover:scale-[1.35]"></div>

            <!-- IMAGE FRAME -->
            <div class="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.84)] flex items-center justify-center shadow-[0_0_0_8px_rgba(16,185,129,0.06),0_10px_22px_rgba(16,185,129,0.12)] z-[2] min-[1400px]:w-[155px] min-[1400px]:h-[155px] min-[1500px]:w-[170px] min-[1500px]:h-[170px] min-[1728px]:w-[190px] min-[1728px]:h-[190px] min-[2400px]:w-[220px] min-[2400px]:h-[220px]">

                <!-- ROTATING DOTTED CIRCLE -->
                <div class="absolute border-2 border-[#209967eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] min-[1400px]:h-[126px] min-[1400px]:w-[126px] min-[1500px]:h-[140px] min-[1500px]:w-[140px] min-[1728px]:h-[156px] min-[1728px]:w-[156px] min-[2400px]:h-[180px] min-[2400px]:w-[180px] rounded-full transition-all w-[118px]"></div>

                <!-- IMAGE -->
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/how-ai-can-help.webp" alt="AI Solution" class="max-w-[115px] max-h-[108px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(16,185,129,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(16,185,129,0.45)] min-[1400px]:max-w-[123px] min-[1400px]:max-h-[116px] min-[1500px]:max-w-[135px] min-[1500px]:max-h-[128px] min-[1728px]:max-w-[151px] min-[1728px]:max-h-[143px] min-[2400px]:max-w-[176px] min-[2400px]:max-h-[166px]">

            </div>
        </div>

        <!-- CONTENT -->
        <div class="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">

            <!-- PREMIUM CORNER DOT -->
            <div class="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#10b981] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(16,185,129,0.10)]"></div>

            <h3 class="m-0 mb-3 text-[#079669] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#087e5a]">
                AI Solution
            </h3>

            <ul class="leading-[1.6] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
                <li>Turn approved organizational information into clear response drafts.</li>
                <li>Organize information into a response that acknowledges the question, provides the available answer, and explains any required next steps.</li>
                <li>Help adjust the length, clarity, and tone of a response for different situations.</li>
            </ul>

            <!-- EXISTING ACCENT -->
            <div class="!mx-auto bg-[#10b981] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]"></div>

        </div>
    </div>

</div>`,
  },

  // 2. Executive Compliance & Medical/Legal Advisory Card
  {
    id: 'advisory-compliance-shield-callout',
    title: 'Executive Compliance & Advisory Card',
    category: 'Advisory / Compliance',
    description:
      'Executive compliance & legal advisory layout with dual-tone left/top border stripe, dynamic hover highlight beam, expanding red divider bar, and a multi-layered concentric shield media badge with pulsing glow.',
    slotsCount: 2,
    slotNames: ['Advisory Content (Text & Divider)', 'Shield Media Panel'],
    badge: 'Compliance & Advisory',
    enhanced_html: `<div class="group relative flex flex-col min-[850px]:flex-row items-stretch w-full my-[20px] overflow-hidden rounded-[24px] border border-[#f2b8b8] border-t-[6px] border-t-[#d30000] min-[850px]:border-t min-[850px]:border-t-[#f2b8b8] min-[850px]:border-l-[6px] min-[850px]:border-l-[#d30000] bg-[#fffafa] transition-all duration-500 ease-out animate-[fadeIn_1s_ease-out_forwards] hover:-translate-y-[4px] hover:border-[#e04747]">

    <!-- SUBTLE HOVER HIGHLIGHT -->
    <div class="pointer-events-none absolute inset-0 z-10 opacity-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] transition-all duration-1000 ease-out group-hover:translate-x-[100%] group-hover:opacity-100"></div>

    <!-- CONTENT SECTION -->
    <div data-slot="0" class="relative flex-1 min-w-0 p-[22px] min-[600px]:p-[30px] min-[1200px]:p-[38px] flex items-center box-border">

        <div class="absolute top-0 left-0 w-[3px] h-full bg-[#d30000] opacity-70 transition-all duration-500 group-hover:w-[7px] group-hover:opacity-100 min-[850px]:block max-[849px]:hidden"></div>

        <div class="pointer-events-none absolute -top-[140px] -left-[140px] w-[300px] h-[300px] rounded-full bg-[#ffd6d6]/20 blur-[50px] opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>

        <div class="relative w-full text-[#444] text-[15px] min-[600px]:text-[16px] min-[1200px]:text-[17px] leading-[1.8] transition-transform duration-500 ease-out group-hover:translate-x-[2px]">

            <p class="m-0 mb-[18px]">
                The material and information presented in this training are for educational purposes only. It should not be used in lieu of professional legal or medical advice. No party involved in the research and development of this course shall be liable for the information contained therein.
            </p>

            <div class="relative w-full h-[1px] bg-[#f3d3d3] mb-[18px] overflow-hidden">
                <div class="absolute left-0 top-0 h-full w-0 bg-[#d30000] transition-all duration-700 ease-out group-hover:w-full"></div>
            </div>

            <p class="m-0">
                Online or classroom training provided by an external provider may not meet the full training needs of every participant. Employers must ensure their employees are adequately trained. In-house training may also be needed.
            </p>

        </div>

    </div>

    <!-- IMAGE SECTION -->
    <div data-slot="1" class="relative w-full min-[850px]:w-[32%] min-[1200px]:w-[30%] min-[850px]:min-w-[270px] min-[1200px]:min-w-[320px] min-[850px]:max-w-[430px] min-h-[280px] min-[600px]:min-h-[340px] min-[850px]:min-h-[400px] flex items-center justify-center overflow-hidden box-border bg-[#ffe5e5] border-t min-[850px]:border-t-0 min-[850px]:border-l border-[#f5caca] transition-colors duration-700 group-hover:bg-[#ffdcdc]">

        <!-- SOFT BACKGROUND LIGHT -->
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),transparent_68%)] opacity-70 transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.08]"></div>

        <!-- MINIMAL DECORATIVE ARC -->
        <div class="absolute -right-[95px] -top-[95px] w-[300px] h-[300px] rounded-full border border-[#f1baba] transition-transform duration-1000 ease-out group-hover:translate-x-[-15px] group-hover:translate-y-[15px]"></div>

        <div class="absolute -left-[130px] -bottom-[130px] w-[310px] h-[310px] rounded-full border border-[#f1baba] transition-transform duration-1000 ease-out group-hover:translate-x-[15px] group-hover:translate-y-[-15px]"></div>

        <!-- SHIELD GLOW -->
        <div class="absolute w-[200px] h-[200px] rounded-full bg-[#fca5a5]/20 blur-[35px] opacity-60 transition-all duration-700 group-hover:scale-[1.18] group-hover:bg-[#f87171]/25"></div>

        <!-- SHIELD CONTAINER -->
        <div class="relative flex items-center justify-center w-[220px] h-[220px] min-[600px]:w-[260px] min-[600px]:h-[260px] min-[850px]:w-[280px] min-[850px]:h-[280px] rounded-full bg-white/65 border border-white/90 transition-all duration-700 ease-out group-hover:scale-[1.035] group-hover:shadow-[0_0_35px_rgba(211,0,0,0.12)]">

            <!-- INNER RING -->
            <div class="absolute inset-[12px] rounded-full border border-[#f5cccc] transition-all duration-700 group-hover:inset-[9px] group-hover:border-[#e99a9a]"></div>

            <!-- STATIC DASHED RING WITH SUBTLE HOVER -->
            <div class="absolute inset-[23px] rounded-full border border-dashed border-[#edb4b4] opacity-70 transition-all duration-700 group-hover:scale-[1.035] group-hover:opacity-100"></div>

            <!-- IMAGE BACKDROP -->
            <div class="relative flex items-center justify-center w-[82%] h-[82%] rounded-full bg-[#ffdada] border border-[#f5baba] transition-all duration-700 group-hover:bg-[#ffcaca] group-hover:border-[#ed9999] group-hover:shadow-[0_0_25px_rgba(211,0,0,0.12)]">

                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/08/1788167178/M1L00128.08.2026.webp" alt="Shield Icon" class="relative block w-[90%] max-w-[240px] h-auto object-contain transition-transform duration-700 ease-out group-hover:scale-[1.08]">

            </div>

        </div>

        <!-- SMALL BOTTOM ACCENT -->
        <div class="absolute bottom-[24px] left-[26px] flex items-center gap-[6px] opacity-60 transition-all duration-500 group-hover:opacity-100">

            <div class="w-[22px] h-[3px] rounded-full bg-[#d30000] transition-all duration-500 group-hover:w-[34px]"></div>

            <div class="w-[5px] h-[5px] rounded-full bg-[#e99a9a]"></div>

        </div>

    </div>

</div>`,
  },

  // 3. Reference Citation & Source Link Card
  {
    id: 'reference-citation-source-card',
    title: 'Reference Citation & Source Link Card',
    category: 'Citations / Reference',
    description:
      'Official academic reference citation card with top tri-color gradient bar, reference header badge with expanding mint underline, citation text, and interactive source link with animated arrow button.',
    slotsCount: 2,
    slotNames: ['Citation Header & Text', 'Interactive Source Link'],
    badge: 'Reference & Link',
    enhanced_html: `<div class="group relative w-full my-[20px] overflow-hidden rounded-[20px] border border-[#d9e5ed] bg-white transition-all duration-500 ease-out hover:-translate-y-[5px] hover:border-[#38b5e4] hover:shadow-[0_18px_45px_rgba(1,51,93,0.16)] opacity-0 animate-[fadeIn_.6s_ease_.1s_forwards]">

    <!-- TOP ACCENT LINE -->
    <div class="h-[4px] w-full bg-gradient-to-r from-[#01335d] via-[#38b5e4] to-[#68e5ab]"></div>

    <!-- HEADER -->
    <div class="relative overflow-hidden bg-gradient-to-br from-[#01335d] via-[#0f5176] to-[#205f99] px-[18px] py-[17px] min-[768px]:px-[24px]">

        <!-- Decorative Hover Elements -->
        <div class="pointer-events-none absolute -right-[35px] -top-[45px] h-[130px] w-[130px] rounded-full border border-white/10 transition-transform duration-700 ease-out group-hover:scale-[1.5]"></div>

        <div class="pointer-events-none absolute -bottom-[65px] right-[65px] h-[125px] w-[125px] rounded-full border border-[#38b5e4]/20 transition-transform duration-700 ease-out group-hover:-translate-x-[25px] group-hover:scale-[1.2]"></div>

        <div class="relative flex items-center gap-[12px]">

            <!-- REFERENCE ICON -->
            <div class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] border border-white/20 bg-white/10 transition-all duration-500 ease-out group-hover:border-[#38b5e4] group-hover:bg-[#38b5e4]/20 group-hover:shadow-[0_0_0_3px_rgba(56,181,228,0.18),0_6px_18px_rgba(56,181,228,0.22)]">

                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789815919/refrence-icon.webp" alt="Reference" class="h-[26px] w-[26px] object-contain">

            </div>

            <div class="min-w-0">
                <p class="m-0 text-[clamp(0.95rem,1.4vw,1.15rem)] font-bold leading-[1.4] tracking-[0.02em] text-white">
                    Reference
                </p>

                <div class="mt-[4px] h-[2px] w-[30px] rounded-full bg-[#68e5ab] transition-all duration-500 group-hover:w-[55px]"></div>
            </div>

        </div>
    </div>

    <!-- CONTENT -->
    <div data-slot="0" class="px-[18px] py-[20px] min-[768px]:px-[24px] min-[768px]:py-[24px]">

        <p class="m-0 text-[clamp(0.9rem,1.25vw,1.05rem)] leading-[1.8] text-[#334155]">
            Stanford Institute for Human-Centered Artificial Intelligence. (2026). Artificial Intelligence Index Report 2026. Stanford University.
        </p>

        <!-- SOURCE LINK -->
        <div data-slot="1" class="mt-[18px] overflow-hidden rounded-[13px] border border-[#d8e6ef] bg-[#f4f8fb] transition-all duration-500 group-hover:border-[#9ed9ef] group-hover:bg-[#edf9fe]">

            <a href="https://hai.stanford.edu/ai-index/2026-ai-index-report" target="_blank" rel="noopener noreferrer" class="group/link flex items-center justify-between gap-[12px] px-[14px] py-[13px] no-underline min-[768px]:px-[18px]">

                <span class="min-w-0 text-[clamp(0.82rem,1.15vw,0.98rem)] font-semibold leading-[1.5] text-[#205f99] decoration-[#9ecfe5] underline-offset-[4px] transition-colors duration-300 group-hover/link:text-[#01335d]">
                    Read the original article →
                </span>

                <!-- ARROW ICON -->
                <span class="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full border border-[#c6dce9] bg-white text-[#205f99] transition-all duration-300 group-hover/link:translate-x-[4px] group-hover/link:border-[#38b5e4] group-hover/link:bg-[#01335d] group-hover/link:text-white">

                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-[15px] w-[15px]">
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                    </svg>

                </span>

            </a>
        </div>
    </div>

    <!-- BOTTOM HOVER ACCENT -->
    <div class="h-[3px] w-0 bg-gradient-to-r from-[#01335d] via-[#38b5e4] to-[#68e5ab] transition-all duration-700 ease-out group-hover:w-full"></div>

</div>`,
  },

  // 4. Before AI vs With AI Transformation Matrix
  {
    id: 'comparative-before-after-matrix',
    title: 'Before AI vs With AI Transformation Matrix',
    category: 'Comparison / Before & After',
    description:
      'Metallic gradient borders, top glow stripes, floating glass orbs, vertical indicator pills, rotating icon badges, and emphasized keyword highlights.',
    slotsCount: 2,
    slotNames: ['Before AI (Metallic Gray)', 'With AI (Cyan & Emerald)'],
    badge: 'Before vs After',
    enhanced_html: `<div class="w-full box-border my-[25px]">
	<div class="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-7 w-full items-stretch">
		<div data-slot="0" class="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#777777] via-[#d0d0d0] to-[#777777] p-[2px] transition-all duration-700 ease-out hover:from-[#4d4d4d] hover:via-[#eaeaea] hover:to-[#7a7a7a] hover:shadow-[0_0_24px_rgba(130,130,130,0.28)]">
			<div class="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f1f1f1] via-[#e7e7e7] to-[#d6d6d6] p-5 sm:p-7 lg:p-[30px] box-border">
				<div class="absolute bg-gradient-to-r duration-700 ease-out from-[#777777] group-hover:h-[11px] group-hover:shadow-[0_0_14px_rgba(130,130,130,0.35)] h-[7px] left-0 to-[#c8c8c8] top-0 transition-all via-[#a7a7a7] w-full z-30"></div>
				<div class="absolute -top-20 -right-20 w-[190px] h-[190px] rounded-full bg-white/40 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.5] group-hover:bg-white/60 group-hover:translate-x-2 group-hover:-translate-y-2 pointer-events-none"></div>
				<div class="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/25 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/45 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none"></div>
				<div class="relative z-10 text-center mb-[26px] pt-1">
					<h2 class="m-0 text-[#222222] text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">Before AI</h2>
					<div class="w-[55px] h-1 bg-[#777777] rounded-full mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20 group-hover:bg-[#555555]"></div>
				</div>
				<div class="relative z-10 flex flex-col gap-[13px]">
					<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
						<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
							<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
							<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
								<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/Before-Ai--1.webp" alt="Searching emails" class="w-[42px] h-[42px] object-contain">
							</div>
							<div class="flex-1 min-w-0">
								<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Searching through old emails for a piece of information</p>
							</div>
						</div>
					</div>
					<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
						<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
							<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
							<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
								<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--2.webp" alt="Rewriting messages" class="w-[42px] h-[42px] object-contain">
							</div>
							<div class="flex-1 min-w-0">
								<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Rewriting the same type of message over and over</p>
							</div>
						</div>
					</div>
					<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
						<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
							<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
							<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
								<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--3.webp" alt="Reports from scratch" class="w-[42px] h-[42px] object-contain">
							</div>
							<div class="flex-1 min-w-0">
								<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Starting reports from scratch every time</p>
							</div>
						</div>
					</div>
					<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
						<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
							<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
							<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
								<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai---4.webp" alt="Manual notes" class="w-[42px] h-[42px] object-contain">
							</div>
							<div class="flex-1 min-w-0">
								<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Organizing notes manually after a meeting</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div data-slot="1" class="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] p-[2px] transition-all duration-700 ease-out hover:from-[#30b6e5] hover:via-[#68e5ab] hover:to-[#087443] hover:shadow-[0_0_26px_rgba(48,182,229,0.28)]">
			<div class="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#edf9f4] via-[#e4f6ee] to-[#d7eee4] p-5 sm:p-7 lg:p-[30px] box-border">
				<div class="absolute bg-gradient-to-r duration-700 ease-out from-[#087443] group-hover:h-[11px] group-hover:shadow-[0_0_16px_rgba(48,182,229,0.35)] h-[7px] left-0 to-[#19aa9f] top-0 transition-all via-[#30b6e5] w-full z-30"></div>
				<div class="-right-20 -top-20 absolute backdrop-blur-sm bg-white/35 duration-700 ease-out group-hover:-translate-y-2 group-hover:bg-white/68 group-hover:scale-[1.5] group-hover:translate-x-2 h-[190px] pointer-events-none rounded-full transition-all w-[190px]"></div>
				<div class="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/35 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/35 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none"></div>
				<div class="relative z-10 text-center mb-[26px] pt-1">
					<h2 class="m-0 bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] bg-clip-text text-transparent text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">With AI</h2>
					<div class="w-[55px] h-1 rounded-full bg-gradient-to-r from-[#30b6e5] to-[#087443] mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20"></div>
				</div>
				<div class="relative z-10 flex flex-col gap-[13px]">
					<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#30b6e5]/30 hover:to-white/70 hover:-translate-y-2 hover:shadow-[0_14px_26px_rgba(48,182,229,0.18)]">
						<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#30b6e5]/20 rounded-[18px]"></div>
						<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
							<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#30b6e5] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(48,182,229,0.35)]"></div>
							<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out group-hover/pt:scale-[1.18] group-hover/pt:rotate-[360deg] group-hover/pt:rounded-[50%] group-hover/pt:bg-gradient-to-br group-hover/pt:from-[#30b6e5] group-hover/pt:to-white group-hover/pt:border-[#30b6e5] group-hover/pt:shadow-[0_0_16px_rgba(48,182,229,0.30)]">
								<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---1.webp" alt="Faster search" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out group-hover/pt:scale-90 group-hover/pt:-rotate-[360deg]">
							</div>
							<div class="flex-1 min-w-0">
								<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#30b6e5] font-bold">Faster</span> searching, summarizing, and writing first drafts</p>
							</div>
						</div>
					</div>
					<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#24abb3]/30 hover:to-white/70 hover:-translate-y-2 hover:shadow-[0_14px_26px_rgba(36,171,179,0.18)]">
						<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#24abb3]/20 rounded-[18px]"></div>
						<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
							<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#24abb3] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(36,171,179,0.35)]"></div>
							<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-500 ease-out group-hover/pt:-translate-y-2 group-hover/pt:scale-[1.15] group-hover/pt:bg-[#d9f4ed] group-hover/pt:border-[#24abb3] group-hover/pt:shadow-[0_10px_16px_-4px_rgba(36,171,179,0.25)]">
								<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---2.webp" alt="Automating messages" class="w-[42px] h-[42px] object-contain transition-transform duration-500 ease-out group-hover/pt:scale-110">
							</div>
							<div class="flex-1 min-w-0">
								<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#24abb3] font-bold">Automating</span> templated messages</p>
							</div>
						</div>
					</div>
					<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#19aa9f]/30 hover:to-white/70 hover:-translate-y-2 hover:shadow-[0_14px_26px_rgba(25,170,159,0.18)]">
						<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#19aa9f]/20 rounded-[18px]"></div>
						<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
							<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#19aa9f] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(25,170,159,0.35)]"></div>
							<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out group-hover/pt:scale-[1.15] group-hover/pt:rounded-[10px] group-hover/pt:-rotate-6 group-hover/pt:bg-[#d9f4ed] group-hover/pt:border-[#19aa9f] group-hover/pt:shadow-[0_0_16px_rgba(25,170,159,0.25)]">
								<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785078099/With-AI---3.webp" alt="Instant summaries" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out group-hover/pt:rotate-6">
							</div>
							<div class="flex-1 min-w-0">
								<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#19aa9f] font-bold">Instant</span> summaries of long documents</p>
							</div>
						</div>
					</div>
					<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#2ebe78]/30 hover:to-white/70 hover:-translate-y-2 hover:shadow-[0_14px_26px_rgba(46,190,120,0.18)]">
						<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#2ebe78]/20 rounded-[18px]"></div>
						<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
							<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#2ebe78] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(46,190,120,0.35)]"></div>
							<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out group-hover/pt:scale-[1.18] group-hover/pt:-rotate-[18deg] group-hover/pt:bg-gradient-to-tr group-hover/pt:from-[#2ebe78] group-hover/pt:to-white group-hover/pt:border-[#2ebe78] group-hover/pt:shadow-[0_0_18px_rgba(46,190,120,0.28)]">
								<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/With-AI---4.webp" alt="Organized action items" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out group-hover/pt:scale-90 group-hover/pt:rotate-[18deg]">
							</div>
							<div class="flex-1 min-w-0">
								<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#2ebe78] font-bold">Organized</span> action items from meetings</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>`,
  },

  // 3. Executive Multi-Color Feature Highlight Cards
  {
    id: 'feature-rows-multi-color-stream',
    title: 'Executive Multi-Color Feature Highlight Cards',
    category: 'Features / Rows',
    description:
      '5-stage color spectrum feature cards (Navy, Slate, Ocean, Cyan, Mint) with 7px thick left accent stripes, animated light sweeps, rotating dashed rings, and 3-stage progressive accent bars.',
    slotsCount: 5,
    slotNames: [
      'Card 1: Navy (#01335d)',
      'Card 2: Gray (#b3b3b3)',
      'Card 3: Ocean (#205f99)',
      'Card 4: Cyan (#38b5e4)',
      'Card 5: Mint (#68e5ab)',
    ],
    badge: '5 Feature Cards',
    enhanced_html: `<div class="w-full mx-auto my-[25px] px-[12px] box-border">
    <div class="flex flex-wrap justify-center gap-[16px] w-full box-border">

        <!-- CARD 1 -->
        <div data-slot="0" class="group relative w-full box-border overflow-hidden rounded-[26px] border border-[#a9cfee] border-l-[7px] border-l-[#01335d] bg-gradient-to-br from-[#d4e8fb] via-[#eff7ff] to-[#c4def5] p-[5px] shadow-[0_12px_30px_rgba(1,51,93,0.12)] transition-all duration-500 hover:-translate-y-[7px] hover:shadow-[0_18px_40px_rgba(1,51,93,0.20)] opacity-0 animate-[fadeIn_.6s_ease_forwards]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>
            <div class="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_20%,rgba(1,51,93,0.18),transparent_45%)]"></div>
            <div class="relative overflow-hidden rounded-[20px] border border-white/80 bg-white/40 px-[12px] py-[12px]">
                <div class="pointer-events-none absolute -right-[40px] -top-[40px] h-[150px] w-[150px] rounded-full border-[25px] border-[#01335d]/10 transition-all duration-700 group-hover:scale-[1.25] group-hover:rotate-45 group-hover:border-[#01335d]/20"></div>
                <div class="pointer-events-none absolute -bottom-[55px] -left-[35px] h-[125px] w-[125px] rounded-full bg-[#01335d]/[0.06] transition-all duration-700 group-hover:scale-[1.35]"></div>
                <div class="pointer-events-none absolute right-[18px] top-[18px] h-[8px] w-[8px] rounded-full bg-[#01335d]/40 transition-all duration-500 group-hover:scale-[2] group-hover:bg-[#01335d]/70"></div>
                <div class="relative z-[1] flex items-center gap-[12px]">
                    <div class="relative flex h-[105px] w-[105px] shrink-0 items-center justify-center">
                        <div class="absolute inset-0 rounded-full border-[2px] border-dashed border-[#01335d]/35 transition-all duration-700 group-hover:rotate-[135deg] group-hover:scale-[1.08] group-hover:border-[#01335d]/70"></div>
                        <div class="absolute inset-[6px] rounded-full bg-white shadow-[0_5px_14px_rgba(1,51,93,0.14)] transition-all duration-500 group-hover:scale-[0.94] group-hover:shadow-[0_8px_22px_rgba(1,51,93,0.25)]"></div>
                        <div class="relative flex h-[90px] w-[90px] items-center justify-center rounded-full bg-gradient-to-br from-[#e5f2ff] to-[#c4def5] transition-all duration-500 group-hover:scale-[1.04]">
                            <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Email-Autocompletes.webp" alt="Email Autocompletes" title="Email Autocompletes" class="relative h-[90%] w-[90%] object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.10)] transition-all duration-500 group-hover:scale-[1.13] group-hover:-translate-y-[3px]">
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="m-0 font-semibold leading-tight text-[#01335d] transition-all duration-400 group-hover:translate-x-[4px] group-hover:text-[#012644]">
                            Email autocompletes
                        </h3>
                        <div class="flex gap-[6px] items-center mb-[9px] mt-[9px]">
                            <div class="h-[4px] w-[35px] rounded-full bg-[#01335d] transition-all duration-500 group-hover:w-[70px]"></div>
                            <div class="h-[4px] w-[12px] rounded-full bg-[#01335d]/30 transition-all duration-500 group-hover:w-[18px] group-hover:bg-[#01335d]/50"></div>
                            <div class="h-[4px] w-[6px] rounded-full bg-[#01335d]/20 transition-all duration-500 group-hover:w-[12px] group-hover:bg-[#01335d]/40"></div>
                        </div>
                        <p class="mt-[8px] mb-0 text-[#01294d] leading-[1.5]">
                            Gmail/Outlook suggests your next words
                        </p>
                    </div>
                </div>
                <div class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-[45px] rounded-full bg-[#01335d]/50 transition-all duration-700 group-hover:left-[calc(100%-80px)] group-hover:w-[65px] group-hover:bg-[#01335d]"></div>
            </div>
        </div>

        <!-- CARD 2 -->
        <div data-slot="1" class="group relative w-full box-border overflow-hidden rounded-[26px] border border-[#d5d5d5] border-l-[7px] border-l-[#b3b3b3] bg-gradient-to-br from-[#e9e9e9] via-[#f7f7f7] to-[#dedede] p-[5px] shadow-[0_12px_30px_rgba(107,114,128,0.12)] transition-all duration-500 hover:-translate-y-[7px] hover:shadow-[0_18px_40px_rgba(107,114,128,0.20)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.15s]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>
            <div class="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_20%,rgba(107,114,128,0.18),transparent_45%)]"></div>
            <div class="relative overflow-hidden rounded-[20px] border border-white/80 bg-white/40 px-[12px] py-[12px]">
                <div class="pointer-events-none absolute -right-[40px] -top-[40px] h-[150px] w-[150px] rounded-full border-[25px] border-[#b3b3b3]/10 transition-all duration-700 group-hover:scale-[1.25] group-hover:rotate-45 group-hover:border-[#b3b3b3]/20"></div>
                <div class="pointer-events-none absolute -bottom-[55px] -left-[35px] h-[125px] w-[125px] rounded-full bg-[#b3b3b3]/[0.06] transition-all duration-700 group-hover:scale-[1.35]"></div>
                <div class="pointer-events-none absolute right-[18px] top-[18px] h-[8px] w-[8px] rounded-full bg-[#b3b3b3]/40 transition-all duration-500 group-hover:scale-[2] group-hover:bg-[#b3b3b3]/70"></div>
                <div class="relative z-[1] flex items-center gap-[12px]">
                    <div class="relative flex h-[105px] w-[105px] shrink-0 items-center justify-center">
                        <div class="absolute inset-0 rounded-full border-[2px] border-dashed border-[#b3b3b3]/35 transition-all duration-700 group-hover:rotate-[135deg] group-hover:scale-[1.08] group-hover:border-[#b3b3b3]/70"></div>
                        <div class="absolute inset-[6px] rounded-full bg-white shadow-[0_5px_14px_rgba(107,114,128,0.14)] transition-all duration-500 group-hover:scale-[0.94] group-hover:shadow-[0_8px_22px_rgba(107,114,128,0.25)]"></div>
                        <div class="relative flex h-[90px] w-[90px] items-center justify-center rounded-full bg-gradient-to-br from-[#f5f5f5] to-[#dedede] transition-all duration-500 group-hover:scale-[1.04]">
                            <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Spam-Filter.webp" alt="Spam filter" title="Spam filter" class="relative h-[90%] w-[90%] object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.10)] transition-all duration-500 group-hover:scale-[1.13] group-hover:-translate-y-[3px]">
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="m-0 font-semibold leading-tight text-[#666666] transition-all duration-400 group-hover:translate-x-[4px] group-hover:text-[#4d4d4d]">
                            Spam filter
                        </h3>
                        <div class="mt-[9px] mb-[9px] flex items-center gap-[6px]">
                            <div class="h-[4px] w-[35px] rounded-full bg-[#b3b3b3] transition-all duration-500 group-hover:w-[70px]"></div>
                            <div class="h-[4px] w-[12px] rounded-full bg-[#b3b3b3]/30 transition-all duration-500 group-hover:w-[18px] group-hover:bg-[#b3b3b3]/50"></div>
                            <div class="h-[4px] w-[6px] rounded-full bg-[#b3b3b3]/20 transition-all duration-500 group-hover:w-[12px] group-hover:bg-[#b3b3b3]/40"></div>
                        </div>
                        <p class="mt-[8px] mb-0 text-[#4d4d4d] leading-[1.5]">
                            AI sorting junk mail
                        </p>
                    </div>
                </div>
                <div class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-[45px] rounded-full bg-[#b3b3b3]/50 transition-all duration-700 group-hover:left-[calc(100%-80px)] group-hover:w-[65px] group-hover:bg-[#b3b3b3]"></div>
            </div>
        </div>

        <!-- CARD 3 -->
        <div data-slot="2" class="group relative w-full box-border overflow-hidden rounded-[26px] border border-[#b7d6ef] border-l-[7px] border-l-[#205f99] bg-gradient-to-br from-[#ecf6ff] via-[#f6fbff] to-[#d9ecfb] p-[5px] shadow-[0_12px_30px_rgba(32,95,153,0.12)] transition-all duration-500 hover:-translate-y-[7px] hover:shadow-[0_18px_40px_rgba(32,95,153,0.20)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.3s]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>
            <div class="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_20%,rgba(32,95,153,0.18),transparent_45%)]"></div>
            <div class="relative overflow-hidden rounded-[20px] border border-white/80 bg-white/40 px-[12px] py-[12px]">
                <div class="pointer-events-none absolute -right-[40px] -top-[40px] h-[150px] w-[150px] rounded-full border-[25px] border-[#205f99]/10 transition-all duration-700 group-hover:scale-[1.25] group-hover:rotate-45 group-hover:border-[#205f99]/20"></div>
                <div class="pointer-events-none absolute -bottom-[55px] -left-[35px] h-[125px] w-[125px] rounded-full bg-[#205f99]/[0.06] transition-all duration-700 group-hover:scale-[1.35]"></div>
                <div class="pointer-events-none absolute right-[18px] top-[18px] h-[8px] w-[8px] rounded-full bg-[#205f99]/40 transition-all duration-500 group-hover:scale-[2] group-hover:bg-[#205f99]/70"></div>
                <div class="relative z-[1] flex items-center gap-[12px]">
                    <div class="relative flex h-[105px] w-[105px] shrink-0 items-center justify-center">
                        <div class="absolute inset-0 rounded-full border-[2px] border-dashed border-[#205f99]/35 transition-all duration-700 group-hover:rotate-[135deg] group-hover:scale-[1.08] group-hover:border-[#205f99]/70"></div>
                        <div class="absolute inset-[6px] rounded-full bg-white shadow-[0_5px_14px_rgba(32,95,153,0.14)] transition-all duration-500 group-hover:scale-[0.94] group-hover:shadow-[0_8px_22px_rgba(32,95,153,0.25)]"></div>
                        <div class="relative flex h-[90px] w-[90px] items-center justify-center rounded-full bg-gradient-to-br from-[#e0f0ff] to-[#c6e0f7] transition-all duration-500 group-hover:scale-[1.04]">
                            <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Appointment-Reminders.webp" alt="Appointment reminders" title="Appointment reminders" class="relative h-[90%] w-[90%] object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.10)] transition-all duration-500 group-hover:scale-[1.13] group-hover:-translate-y-[3px]">
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="m-0 font-semibold leading-tight text-[#205f99] transition-all duration-400 group-hover:translate-x-[4px] group-hover:text-[#174a78]">
                            Appointment reminders
                        </h3>
                        <div class="mt-[9px] mb-[9px] flex items-center gap-[6px]">
                            <div class="h-[4px] w-[35px] rounded-full bg-[#205f99] transition-all duration-500 group-hover:w-[70px]"></div>
                            <div class="h-[4px] w-[12px] rounded-full bg-[#205f99]/30 transition-all duration-500 group-hover:w-[18px] group-hover:bg-[#205f99]/50"></div>
                            <div class="h-[4px] w-[6px] rounded-full bg-[#205f99]/20 transition-all duration-500 group-hover:w-[12px] group-hover:bg-[#205f99]/40"></div>
                        </div>
                        <p class="mt-[8px] mb-0 text-[#164a7a] leading-[1.5]">
                            AI flagging unconfirmed appointments
                        </p>
                    </div>
                </div>
                <div class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-[45px] rounded-full bg-[#205f99]/50 transition-all duration-700 group-hover:left-[calc(100%-80px)] group-hover:w-[65px] group-hover:bg-[#205f99]"></div>
            </div>
        </div>

        <!-- CARD 4 -->
        <div data-slot="3" class="group relative w-full box-border overflow-hidden rounded-[26px] border border-[#a9e2f5] border-l-[7px] border-l-[#38b5e4] bg-gradient-to-br from-[#ddf6ff] via-[#f0fcff] to-[#c8eefb] p-[5px] shadow-[0_12px_30px_rgba(56,181,228,0.12)] transition-all duration-500 hover:-translate-y-[7px] hover:shadow-[0_18px_40px_rgba(56,181,228,0.20)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.45s]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>
            <div class="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_20%,rgba(56,181,228,0.18),transparent_45%)]"></div>
            <div class="relative overflow-hidden rounded-[20px] border border-white/80 bg-white/40 px-[12px] py-[12px]">
                <div class="pointer-events-none absolute -right-[40px] -top-[40px] h-[150px] w-[150px] rounded-full border-[25px] border-[#38b5e4]/10 transition-all duration-700 group-hover:scale-[1.25] group-hover:rotate-45 group-hover:border-[#38b5e4]/20"></div>
                <div class="pointer-events-none absolute -bottom-[55px] -left-[35px] h-[125px] w-[125px] rounded-full bg-[#38b5e4]/[0.06] transition-all duration-700 group-hover:scale-[1.35]"></div>
                <div class="pointer-events-none absolute right-[18px] top-[18px] h-[8px] w-[8px] rounded-full bg-[#38b5e4]/40 transition-all duration-500 group-hover:scale-[2] group-hover:bg-[#38b5e4]/70"></div>
                <div class="relative z-[1] flex items-center gap-[12px]">
                    <div class="relative flex h-[105px] w-[105px] shrink-0 items-center justify-center">
                        <div class="absolute inset-0 rounded-full border-[2px] border-dashed border-[#38b5e4]/35 transition-all duration-700 group-hover:rotate-[135deg] group-hover:scale-[1.08] group-hover:border-[#38b5e4]/70"></div>
                        <div class="absolute inset-[6px] rounded-full bg-white shadow-[0_5px_14px_rgba(56,181,228,0.14)] transition-all duration-500 group-hover:scale-[0.94] group-hover:shadow-[0_8px_22px_rgba(56,181,228,0.25)]"></div>
                        <div class="relative flex h-[90px] w-[90px] items-center justify-center rounded-full bg-gradient-to-br from-[#e0f8ff] to-[#c0ebfa] transition-all duration-500 group-hover:scale-[1.04]">
                            <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Search-Suggestions.webp" alt="Search suggestions" title="Search suggestions" class="relative h-[90%] w-[90%] object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.10)] transition-all duration-500 group-hover:scale-[1.13] group-hover:-translate-y-[3px]">
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="m-0 font-semibold leading-tight text-[#1686b2] transition-all duration-400 group-hover:translate-x-[4px] group-hover:text-[#0f6e95]">
                            Search suggestions
                        </h3>
                        <div class="mt-[9px] mb-[9px] flex items-center gap-[6px]">
                            <div class="h-[4px] w-[35px] rounded-full bg-[#38b5e4] transition-all duration-500 group-hover:w-[70px]"></div>
                            <div class="h-[4px] w-[12px] rounded-full bg-[#38b5e4]/30 transition-all duration-500 group-hover:w-[18px] group-hover:bg-[#38b5e4]/50"></div>
                            <div class="h-[4px] w-[6px] rounded-full bg-[#38b5e4]/20 transition-all duration-500 group-hover:w-[12px] group-hover:bg-[#38b5e4]/40"></div>
                        </div>
                        <p class="mt-[8px] mb-0 text-[#08749e] leading-[1.5]">
                            Google finishing your query
                        </p>
                    </div>
                </div>
                <div class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-[45px] rounded-full bg-[#38b5e4]/50 transition-all duration-700 group-hover:left-[calc(100%-80px)] group-hover:w-[65px] group-hover:bg-[#38b5e4]"></div>
            </div>
        </div>

        <!-- CARD 5 -->
        <div data-slot="4" class="group relative w-full box-border overflow-hidden rounded-[26px] border border-[#b8efd7] border-l-[7px] border-l-[#68e5ab] bg-gradient-to-br from-[#e5fff3] via-[#f2fff9] to-[#d1f8e6] p-[5px] shadow-[0_12px_30px_rgba(46,180,119,0.12)] transition-all duration-500 hover:-translate-y-[7px] hover:shadow-[0_18px_40px_rgba(46,180,119,0.20)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.6s]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>
            <div class="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_20%,rgba(46,180,119,0.18),transparent_45%)]"></div>
            <div class="relative overflow-hidden rounded-[20px] border border-white/80 bg-white/40 px-[12px] py-[12px]">
                <div class="pointer-events-none absolute -right-[40px] -top-[40px] h-[150px] w-[150px] rounded-full border-[25px] border-[#68e5ab]/10 transition-all duration-700 group-hover:scale-[1.25] group-hover:rotate-45 group-hover:border-[#68e5ab]/20"></div>
                <div class="pointer-events-none absolute -bottom-[55px] -left-[35px] h-[125px] w-[125px] rounded-full bg-[#68e5ab]/[0.06] transition-all duration-700 group-hover:scale-[1.35]"></div>
                <div class="pointer-events-none absolute right-[18px] top-[18px] h-[8px] w-[8px] rounded-full bg-[#68e5ab]/40 transition-all duration-500 group-hover:scale-[2] group-hover:bg-[#68e5ab]/70"></div>
                <div class="relative z-[1] flex items-center gap-[12px]">
                    <div class="relative flex h-[105px] w-[105px] shrink-0 items-center justify-center">
                        <div class="absolute inset-0 rounded-full border-[2px] border-dashed border-[#68e5ab]/35 transition-all duration-700 group-hover:rotate-[135deg] group-hover:scale-[1.08] group-hover:border-[#68e5ab]/70"></div>
                        <div class="absolute inset-[6px] rounded-full bg-white shadow-[0_5px_14px_rgba(46,180,119,0.14)] transition-all duration-500 group-hover:scale-[0.94] group-hover:shadow-[0_8px_22px_rgba(46,180,119,0.25)]"></div>
                        <div class="relative flex h-[90px] w-[90px] items-center justify-center rounded-full bg-gradient-to-br from-[#e5fff2] to-[#c6f2dc] transition-all duration-500 group-hover:scale-[1.04]">
                            <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Voice-Assistants.webp" alt="Voice assistants" title="Voice assistants" class="relative h-[90%] w-[90%] object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.10)] transition-all duration-500 group-hover:scale-[1.13] group-hover:-translate-y-[3px]">
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="m-0 font-semibold leading-tight text-[#249663] transition-all duration-400 group-hover:translate-x-[4px] group-hover:text-[#18794d]">
                            Voice assistants
                        </h3>
                        <div class="mt-[9px] mb-[9px] flex items-center gap-[6px]">
                            <div class="h-[4px] w-[35px] rounded-full bg-[#68e5ab] transition-all duration-500 group-hover:w-[70px]"></div>
                            <div class="h-[4px] w-[12px] rounded-full bg-[#68e5ab]/30 transition-all duration-500 group-hover:w-[18px] group-hover:bg-[#68e5ab]/50"></div>
                            <div class="h-[4px] w-[6px] rounded-full bg-[#68e5ab]/20 transition-all duration-500 group-hover:w-[12px] group-hover:bg-[#68e5ab]/40"></div>
                        </div>
                        <p class="mt-[8px] mb-0 text-[#187a4b] leading-[1.5]">
                            Siri, Alexa, and Google Assistant
                        </p>
                    </div>
                </div>
                <div class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-[45px] rounded-full bg-[#68e5ab]/50 transition-all duration-700 group-hover:left-[calc(100%-80px)] group-hover:w-[65px] group-hover:bg-[#68e5ab]"></div>
            </div>
        </div>

    </div>
</div>`,
  },

  // 4. AI-Powered Capability Showcase Grid
  {
    id: 'ai-powered-ecosystem-showcase',
    title: 'AI-Powered Capability Showcase Grid',
    category: 'Showcase / Ecosystem',
    description:
      'Ambient glass container with top gradient fill line, rotating dashed circular badge, "AI Powered" pill badge, centered title and description, and expanding bottom accent bar. Highly responsive (1-col mobile, 2-col tablet, 3-col desktop, 5-col wide).',
    slotsCount: 5,
    slotNames: [
      'Card 1: Recommendations (Cyan)',
      'Card 2: Fraud Alerts (Slate)',
      'Card 3: Google Maps (Blue)',
      'Card 4: Amazon (Teal)',
      'Card 5: Social Feeds (Green)',
    ],
    badge: '5-Col Showcase',
    enhanced_html: `<div class="w-full mx-auto px-3 py-8 box-border">
<div class="relative w-full overflow-hidden rounded-[28px] border border-[#d9e6f0] bg-[#f7fbff] px-3 py-8 sm:px-5 md:px-8">

    <div class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#38b5e4]/10 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#68e5ab]/10 blur-3xl pointer-events-none"></div>

    <div class="relative z-10 mx-auto flex w-full flex-wrap items-stretch justify-center gap-4 lg:gap-5">

        <!-- NETFLIX & SPOTIFY -->
        <div data-slot="0" class="group relative flex w-full min-w-0 flex-col items-center overflow-hidden rounded-[24px] border border-[#38b5e4]/25 bg-gradient-to-br from-white via-[#f5fbff] to-[#e0f2fe] px-4 py-5 opacity-0 animate-[fadeIn_.6s_ease_.1s_forwards] transition-all duration-700 hover:-translate-y-3 hover:border-[#38b5e4]/80 hover:bg-[#f0faff] hover:shadow-[0_18px_45px_rgba(56,181,228,0.18)] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-14px)] min-[1500px]:w-[calc(20%-16px)]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/60 to-transparent transition-all duration-1000 group-hover:left-[150%]"></div>
            <div class="pointer-events-none absolute -inset-8 rounded-full bg-[#38b5e4]/0 blur-3xl transition-all duration-700 group-hover:bg-[#38b5e4]/10"></div>
            <div class="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#01335d] via-[#38b5e4] to-transparent">
                <div class="h-full w-0 bg-[#38b5e4] shadow-[0_0_14px_#38b5e4] transition-all duration-700 group-hover:w-full"></div>
            </div>
            <div class="absolute -right-10 -top-10 h-24 w-24 rounded-full border border-[#38b5e4]/15 transition-all duration-700 group-hover:scale-[2.1] group-hover:border-[#38b5e4]/30"></div>
            <div class="relative mb-5 flex aspect-square w-[clamp(76px,9vw,128px)] max-w-full items-center justify-center rounded-full border border-[#38b5e4]/25 bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] p-3 transition-all duration-700 group-hover:scale-110 group-hover:border-[#38b5e4]/60 group-hover:shadow-[0_0_30px_rgba(56,181,228,0.28)]">
                <div class="absolute inset-2 rounded-full border border-dashed border-[#38b5e4]/45 transition-all duration-1000 group-hover:rotate-180 group-hover:scale-110"></div>
                <div class="absolute inset-4 rounded-full border border-[#38b5e4]/15 transition-all duration-700 group-hover:scale-90"></div>
                <div class="absolute right-0 top-5 h-2 w-2 rounded-full bg-[#38b5e4] shadow-[0_0_10px_#38b5e4] transition-all duration-500 group-hover:scale-150"></div>
                <div class="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-white/30 p-2 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/50">
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497819/Netflix--Spotify.webp" alt="Netflix &amp; Spotify" class="h-full w-full object-contain drop-shadow-[0_5px_8px_rgba(1,51,93,0.15)] transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_8px_18px_rgba(56,181,228,0.35)]">
                </div>
            </div>
            <div class="relative z-10 mb-3 flex items-center gap-1.5 rounded-full border border-[#38b5e4]/25 bg-[#d9f1fc] px-3 py-1.5 transition-all duration-500 group-hover:border-[#38b5e4]/60 group-hover:bg-[#c8edfb] group-hover:shadow-[0_0_18px_rgba(56,181,228,0.2)] group-hover:-translate-y-1">
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783499235/Ai-Powered-Icon.webp" alt="AI" class="h-4 w-4 object-contain transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <span class="font-bold tracking-wide text-[#0f5176]">AI Powered</span>
            </div>
            <div class="relative z-10 flex min-h-[2.5rem] items-center justify-center text-center font-extrabold leading-tight text-[#01335d] transition-all duration-500 group-hover:-translate-y-1">
                Netflix &amp; Spotify
            </div>
            <p class="relative z-10 mt-2 text-center leading-relaxed text-[#285d7b] transition-all duration-500 group-hover:-translate-y-1">
                Recommendations
            </p>
            <div class="relative z-10 mt-auto pt-5">
                <div class="h-1 w-10 rounded-full bg-[#38b5e4]/50 transition-all duration-700 group-hover:w-24 group-hover:bg-[#38b5e4] group-hover:shadow-[0_0_12px_rgba(56,181,228,0.7)]"></div>
            </div>
        </div>

        <!-- BANK FRAUD ALERTS -->
        <div data-slot="1" class="group relative flex w-full min-w-0 flex-col items-center overflow-hidden rounded-[24px] border border-[#6b7280]/25 bg-gradient-to-br from-white via-[#f9fafb] to-[#e5e7eb] px-4 py-5 opacity-0 animate-[fadeIn_.6s_ease_.2s_forwards] transition-all duration-700 hover:-translate-y-3 hover:border-[#6b7280]/80 hover:bg-[#f5f6f7] hover:shadow-[0_18px_45px_rgba(75,85,99,0.18)] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-14px)] min-[1500px]:w-[calc(20%-16px)]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all duration-1000 group-hover:left-[150%]"></div>
            <div class="pointer-events-none absolute -inset-8 rounded-full bg-[#6b7280]/0 blur-3xl transition-all duration-700 group-hover:bg-[#6b7280]/10"></div>
            <div class="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#374151] via-[#9ca3af] to-transparent">
                <div class="h-full w-0 bg-[#6b7280] shadow-[0_0_14px_#6b7280] transition-all duration-700 group-hover:w-full"></div>
            </div>
            <div class="absolute -right-10 -top-10 h-24 w-24 rounded-full border border-[#6b7280]/15 transition-all duration-700 group-hover:scale-[2.1] group-hover:border-[#6b7280]/30"></div>
            <div class="relative mb-5 flex aspect-square w-[clamp(76px,9vw,128px)] max-w-full items-center justify-center rounded-full border border-[#6b7280]/25 bg-gradient-to-br from-[#f3f4f6] to-[#d1d5db] p-3 transition-all duration-700 group-hover:scale-110 group-hover:border-[#6b7280]/60 group-hover:shadow-[0_0_30px_rgba(107,114,128,0.25)]">
                <div class="absolute inset-2 rounded-full border border-dashed border-[#6b7280]/45 transition-all duration-1000 group-hover:rotate-180 group-hover:scale-110"></div>
                <div class="absolute inset-4 rounded-full border border-[#6b7280]/15 transition-all duration-700 group-hover:scale-90"></div>
                <div class="absolute right-0 top-5 h-2 w-2 rounded-full bg-[#6b7280] shadow-[0_0_10px_#6b7280] transition-all duration-500 group-hover:scale-150"></div>
                <div class="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-white/30 p-2 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/50">
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497819/Bank-Fraud-Alerts.webp" alt="Bank Fraud Alerts" class="h-full w-full object-contain drop-shadow-[0_5px_8px_rgba(55,65,81,0.15)] transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_8px_18px_rgba(107,114,128,0.35)]">
                </div>
            </div>
            <div class="relative z-10 mb-3 flex items-center gap-1.5 rounded-full border border-[#6b7280]/25 bg-[#e5e7eb] px-3 py-1.5 transition-all duration-500 group-hover:border-[#6b7280]/60 group-hover:bg-[#dfe2e6] group-hover:shadow-[0_0_18px_rgba(107,114,128,0.2)] group-hover:-translate-y-1">
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783499235/Ai-Powered-Icon.webp" alt="AI" class="h-4 w-4 object-contain transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <span class="font-bold tracking-wide text-[#374151]">AI Powered</span>
            </div>
            <div class="relative z-10 flex min-h-[2.5rem] items-center justify-center text-center font-extrabold leading-tight text-[#1f2937] transition-all duration-500 group-hover:-translate-y-1">
                Bank Fraud Alerts
            </div>
            <p class="relative z-10 mt-2 text-center leading-relaxed text-[#4b5563] transition-all duration-500 group-hover:-translate-y-1">
                Detects unusual spending instantly
            </p>
            <div class="relative z-10 mt-auto pt-5">
                <div class="h-1 w-10 rounded-full bg-[#6b7280]/50 transition-all duration-700 group-hover:w-24 group-hover:bg-[#6b7280] group-hover:shadow-[0_0_12px_rgba(107,114,128,0.7)]"></div>
            </div>
        </div>

        <!-- GOOGLE MAPS -->
        <div data-slot="2" class="group relative flex w-full min-w-0 flex-col items-center overflow-hidden rounded-[24px] border border-[#3b82f6]/25 bg-gradient-to-br from-white via-[#f5f9ff] to-[#dbeafe] px-4 py-5 opacity-0 animate-[fadeIn_.6s_ease_.3s_forwards] transition-all duration-700 hover:-translate-y-3 hover:border-[#3b82f6]/80 hover:bg-[#f0f6ff] hover:shadow-[0_18px_45px_rgba(59,130,246,0.18)] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-14px)] min-[1500px]:w-[calc(20%-16px)]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all duration-1000 group-hover:left-[150%]"></div>
            <div class="pointer-events-none absolute -inset-8 rounded-full bg-[#3b82f6]/0 blur-3xl transition-all duration-700 group-hover:bg-[#3b82f6]/10"></div>
            <div class="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-transparent">
                <div class="h-full w-0 bg-[#3b82f6] shadow-[0_0_14px_#3b82f6] transition-all duration-700 group-hover:w-full"></div>
            </div>
            <div class="absolute -right-10 -top-10 h-24 w-24 rounded-full border border-[#3b82f6]/15 transition-all duration-700 group-hover:scale-[2.1] group-hover:border-[#38b5e4]/30"></div>
            <div class="relative mb-5 flex aspect-square w-[clamp(76px,9vw,128px)] max-w-full items-center justify-center rounded-full border border-[#3b82f6]/25 bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] p-3 transition-all duration-700 group-hover:scale-110 group-hover:border-[#3b82f6]/60 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.28)]">
                <div class="absolute inset-2 rounded-full border border-dashed border-[#3b82f6]/45 transition-all duration-1000 group-hover:rotate-180 group-hover:scale-110"></div>
                <div class="absolute inset-4 rounded-full border border-[#3b82f6]/15 transition-all duration-700 group-hover:scale-90"></div>
                <div class="absolute right-0 top-5 h-2 w-2 rounded-full bg-[#3b82f6] shadow-[0_0_10px_#3b82f6] transition-all duration-500 group-hover:scale-150"></div>
                <div class="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-white/30 p-2 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/50">
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497819/Google-Maps.webp" alt="Google Maps" class="h-full w-full object-contain drop-shadow-[0_5px_8px_rgba(29,78,216,0.15)] transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_8px_18px_rgba(59,130,246,0.35)]">
                </div>
            </div>
            <div class="relative z-10 mb-3 flex items-center gap-1.5 rounded-full border border-[#3b82f6]/25 bg-[#bfdbfe] px-3 py-1.5 transition-all duration-500 group-hover:border-[#3b82f6]/60 group-hover:bg-[#b5d5fb] group-hover:shadow-[0_0_18px_rgba(59,130,246,0.2)] group-hover:-translate-y-1">
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783499235/Ai-Powered-Icon.webp" alt="AI" class="h-4 w-4 object-contain transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <span class="font-bold tracking-wide text-[#1d4ed8]">AI Powered</span>
            </div>
            <div class="relative z-10 flex min-h-[2.5rem] items-center justify-center text-center font-extrabold leading-tight text-[#1e40af] transition-all duration-500 group-hover:-translate-y-1">
                Google Maps
            </div>
            <p class="relative z-10 mt-2 text-center leading-relaxed text-[#285da1] transition-all duration-500 group-hover:-translate-y-1">
                Real-time traffic prediction
            </p>
            <div class="relative z-10 mt-auto pt-5">
                <div class="h-1 w-10 rounded-full bg-[#3b82f6]/50 transition-all duration-700 group-hover:w-24 group-hover:bg-[#3b82f6] group-hover:shadow-[0_0_12px_rgba(59,130,246,0.7)]"></div>
            </div>
        </div>

        <!-- AMAZON -->
        <div data-slot="3" class="group relative flex w-full min-w-0 flex-col items-center overflow-hidden rounded-[24px] border border-[#14b8a6]/25 bg-gradient-to-br from-white via-[#f0fdfa] to-[#ccfbf1] px-4 py-5 opacity-0 animate-[fadeIn_.6s_ease_.4s_forwards] transition-all duration-700 hover:-translate-y-3 hover:border-[#14b8a6]/80 hover:bg-[#ecfdf9] hover:shadow-[0_18px_45px_rgba(20,184,166,0.18)] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-14px)] min-[1500px]:w-[calc(20%-16px)]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all duration-1000 group-hover:left-[150%]"></div>
            <div class="pointer-events-none absolute -inset-8 rounded-full bg-[#14b8a6]/0 blur-3xl transition-all duration-700 group-hover:bg-[#14b8a6]/10"></div>
            <div class="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#0f766e] via-[#14b8a6] to-transparent">
                <div class="h-full w-0 bg-[#14b8a6] shadow-[0_0_14px_#14b8a6] transition-all duration-700 group-hover:w-full"></div>
            </div>
            <div class="absolute -right-10 -top-10 h-24 w-24 rounded-full border border-[#14b8a6]/15 transition-all duration-700 group-hover:scale-[2.1] group-hover:border-[#14b8a6]/30"></div>
            <div class="relative mb-5 flex aspect-square w-[clamp(76px,9vw,128px)] max-w-full items-center justify-center rounded-full border border-[#14b8a6]/25 bg-gradient-to-br from-[#ccfbf1] to-[#99f6e4] p-3 transition-all duration-700 group-hover:scale-110 group-hover:border-[#14b8a6]/60 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.28)]">
                <div class="absolute inset-2 rounded-full border border-dashed border-[#14b8a6]/45 transition-all duration-1000 group-hover:rotate-180 group-hover:scale-110"></div>
                <div class="absolute inset-4 rounded-full border border-[#14b8a6]/15 transition-all duration-700 group-hover:scale-90"></div>
                <div class="absolute right-0 top-5 h-2 w-2 rounded-full bg-[#14b8a6] shadow-[0_0_10px_#14b8a6] transition-all duration-500 group-hover:scale-150"></div>
                <div class="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-white/30 p-2 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/50">
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497820/Amazon.webp" alt="Amazon" class="h-full w-full object-contain drop-shadow-[0_5px_8px_rgba(15,118,110,0.15)] transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_8px_18px_rgba(20,184,166,0.35)]">
                </div>
            </div>
            <div class="relative z-10 mb-3 flex items-center gap-1.5 rounded-full border border-[#14b8a6]/25 bg-[#ccfbf1] px-3 py-1.5 transition-all duration-500 group-hover:border-[#14b8a6]/60 group-hover:bg-[#c0f8ee] group-hover:shadow-[0_0_18px_rgba(20,184,166,0.2)] group-hover:-translate-y-1">
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783499235/Ai-Powered-Icon.webp" alt="AI" class="h-4 w-4 object-contain transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <span class="font-bold tracking-wide text-[#0f766e]">AI Powered</span>
            </div>
            <div class="relative z-10 flex min-h-[2.5rem] items-center justify-center text-center font-extrabold leading-tight text-[#115e59] transition-all duration-500 group-hover:-translate-y-1">
                Amazon
            </div>
            <p class="relative z-10 mt-2 text-center leading-relaxed text-[#176b63] transition-all duration-500 group-hover:-translate-y-1">
                Product <br>suggestions
            </p>
            <div class="relative z-10 mt-auto pt-5">
                <div class="h-1 w-10 rounded-full bg-[#14b8a6]/50 transition-all duration-700 group-hover:w-24 group-hover:bg-[#14b8a6] group-hover:shadow-[0_0_12px_rgba(20,184,166,0.7)]"></div>
            </div>
        </div>

        <!-- SOCIAL MEDIA FEEDS -->
        <div data-slot="4" class="group relative flex w-full min-w-0 flex-col items-center overflow-hidden rounded-[24px] border border-[#22c55e]/25 bg-gradient-to-br from-white via-[#f0fdf4] to-[#dcfce7] px-4 py-5 opacity-0 animate-[fadeIn_.6s_ease_.5s_forwards] transition-all duration-700 hover:-translate-y-3 hover:border-[#22c55e]/80 hover:bg-[#edfff2] hover:shadow-[0_18px_45px_rgba(34,197,94,0.18)] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-14px)] min-[1500px]:w-[calc(20%-16px)]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all duration-1000 group-hover:left-[150%]"></div>
            <div class="pointer-events-none absolute -inset-8 rounded-full bg-[#22c55e]/0 blur-3xl transition-all duration-700 group-hover:bg-[#22c55e]/10"></div>
            <div class="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#15803d] via-[#22c55e] to-transparent">
                <div class="h-full w-0 bg-[#22c55e] shadow-[0_0_14px_#22c55e] transition-all duration-700 group-hover:w-full"></div>
            </div>
            <div class="absolute -right-10 -top-10 h-24 w-24 rounded-full border border-[#22c55e]/15 transition-all duration-700 group-hover:scale-[2.1] group-hover:border-[#22c55e]/30"></div>
            <div class="relative mb-5 flex aspect-square w-[clamp(76px,9vw,128px)] max-w-full items-center justify-center rounded-full border border-[#22c55e]/25 bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] p-3 transition-all duration-700 group-hover:scale-110 group-hover:border-[#22c55e]/60 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.28)]">
                <div class="absolute inset-2 rounded-full border border-dashed border-[#22c55e]/45 transition-all duration-1000 group-hover:rotate-180 group-hover:scale-110"></div>
                <div class="absolute inset-4 rounded-full border border-[#22c55e]/15 transition-all duration-700 group-hover:scale-90"></div>
                <div class="absolute right-0 top-5 h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_10px_#22c55e] transition-all duration-500 group-hover:scale-150"></div>
                <div class="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-white/30 p-2 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/50">
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497820/Social-Media-Feeds.webp" alt="Social Media Feeds" class="h-full w-full object-contain drop-shadow-[0_5px_8px_rgba(21,128,61,0.15)] transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_8px_18px_rgba(34,197,94,0.35)]">
                </div>
            </div>
            <div class="relative z-10 mb-3 flex items-center gap-1.5 rounded-full border border-[#22c55e]/25 bg-[#dcfce7] px-3 py-1.5 transition-all duration-500 group-hover:border-[#22c55e]/60 group-hover:bg-[#cffbdc] group-hover:shadow-[0_0_18px_rgba(34,197,94,0.2)] group-hover:-translate-y-1">
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783499235/Ai-Powered-Icon.webp" alt="AI" class="h-4 w-4 object-contain transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                <span class="font-bold tracking-wide text-[#15803d]">AI Powered</span>
            </div>
            <div class="relative z-10 flex min-h-[2.5rem] items-center justify-center text-center font-extrabold leading-tight text-[#166534] transition-all duration-500 group-hover:-translate-y-1">
                Social Media Feeds
            </div>
            <p class="relative z-10 mt-2 text-center leading-relaxed text-[#216b3c] transition-all duration-500 group-hover:-translate-y-1">
                AI decides<br> what you see
            </p>
            <div class="relative z-10 mt-auto pt-5">
                <div class="h-1 w-10 rounded-full bg-[#22c55e]/50 transition-all duration-700 group-hover:w-24 group-hover:bg-[#22c55e] group-hover:shadow-[0_0_12px_rgba(34,197,94,0.7)]"></div>
            </div>
        </div>

    </div>
</div>
</div>`,
  },

  // 6. 3-Pillar Numbered Core Principles
  {
    id: 'numbered-core-principles-trio',
    title: '3-Pillar Numbered Core Principles',
    category: 'Process / Numbered Principles',
    description:
      '3-card responsive foundation pillars (Context, Patterns, Human Expertise) featuring top number tiles with hover tilt, rotating dashed media rings (rotate-270), animated light shine beams, and heading letter-spacing micro-motion.',
    slotsCount: 3,
    slotNames: [
      '01 Context (Navy)',
      '02 Patterns (Emerald)',
      '03 Human Expertise (Amber)',
    ],
    badge: '3 Numbered Pillars',
    enhanced_html: `<div class="w-full flex flex-wrap justify-center gap-6 box-border my-[25px]">

    <!-- CARD 01 -->
    <div data-slot="0" class="group relative w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-none min-w-0 min-h-[325px] p-[22px_20px_20px] box-border rounded-[28px] overflow-hidden flex flex-col items-center text-center bg-gradient-to-br from-white via-[#f7fbff] to-[#e8f4fd] border border-[#205f99]/15 border-t-[5px] border-t-[#205f99] transition-all duration-700 hover:-translate-y-3 opacity-0 animate-[fadeIn_.6s_ease_.1s_forwards]">

        <!-- Animated Shine -->
        <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>

        <!-- Decorative Glow -->
        <div class="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-[#205f99]/[0.07] transition-all duration-700 group-hover:scale-[1.7] group-hover:bg-[#205f99]/[0.13]"></div>

        <!-- Decorative Circle -->
        <div class="absolute -left-10 bottom-8 w-24 h-24 rounded-full border border-[#205f99]/10 transition-all duration-700 group-hover:scale-[1.5] group-hover:translate-x-5 group-hover:-translate-y-3 group-hover:border-[#205f99]/25"></div>

        <!-- Number -->
        <div class="absolute top-4 left-4 w-[48px] h-[48px] rounded-[15px] bg-[#205f99] text-white flex items-center justify-center font-extrabold tracking-[0.5px] shadow-[0_8px_20px_rgba(32,95,153,0.28)] z-10 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6">
            01
        </div>

        <!-- Image Area -->
        <div class="relative w-[155px] h-[155px] min-h-[155px] mt-1 mb-[17px] rounded-full bg-white/80 backdrop-blur-sm flex-shrink-0 flex items-center justify-center shadow-[0_0_0_9px_rgba(32,95,153,0.06),0_15px_30px_rgba(32,95,153,0.14)] z-[2] transition-all duration-700 group-hover:scale-[1.09]">

            <!-- Rotating Ring -->
            <div class="absolute w-[128px] h-[128px] rounded-full border-2 border-dashed border-[#205f99cc] transition-all duration-[1200ms] ease-out group-hover:rotate-[270deg] group-hover:scale-[1.08]"></div>

            <!-- Inner Glow -->
            <div class="absolute w-[105px] h-[105px] rounded-full bg-[#205f99]/0 transition-all duration-700 group-hover:bg-[#205f99]/[0.06] group-hover:scale-[1.15]"></div>

            <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783502737/Content.webp" alt="Context" class="relative z-[2] max-w-[100px] max-h-[100px] w-auto h-auto object-contain transition-all duration-700 group-hover:scale-[1.13] group-hover:-rotate-3">
        </div>

        <!-- Heading -->
        <h3 class="relative z-[3] m-0 mb-[9px] text-[#205f99] font-extrabold uppercase tracking-[1.5px] leading-tight transition-all duration-500 group-hover:tracking-[2.5px]">
            Context
        </h3>

        <!-- Content -->
        <p class="relative z-[3] m-0 mb-[25px] text-[#303d48] leading-[1.5]">
            <b>AI does not know your specific situation unless you tell it. The more context you give, the better the result.</b>
        </p>

        <!-- Bottom Accent -->
        <div class="relative z-[3] mt-auto w-[55px] h-[5px] rounded-full bg-[#205f99] transition-all duration-700 group-hover:w-[105px] group-hover:h-[6px] group-hover:shadow-[0_0_18px_rgba(32,95,153,0.45)]"></div>

    </div>

    <!-- CARD 02 -->
    <div data-slot="1" class="group relative w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-none min-w-0 min-h-[325px] p-[22px_20px_20px] box-border rounded-[28px] overflow-hidden flex flex-col items-center text-center bg-gradient-to-br from-white via-[#f9fffb] to-[#e5faec] border border-[#10b981]/15 border-t-[5px] border-t-[#10b981] transition-all duration-700 hover:-translate-y-3 opacity-0 animate-[fadeIn_.6s_ease_.2s_forwards]">

        <!-- Animated Shine -->
        <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>

        <!-- Decorative Glow -->
        <div class="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-[#10b981]/[0.07] transition-all duration-700 group-hover:scale-[1.7] group-hover:bg-[#10b981]/[0.14]"></div>

        <!-- Decorative Circle -->
        <div class="absolute -left-10 bottom-8 w-24 h-24 rounded-full border border-[#10b981]/10 transition-all duration-700 group-hover:scale-[1.5] group-hover:translate-x-5 group-hover:-translate-y-3 group-hover:border-[#10b981]/25"></div>

        <!-- Number -->
        <div class="absolute top-4 left-4 w-[48px] h-[48px] rounded-[15px] bg-[#10b981] text-white flex items-center justify-center font-extrabold tracking-[0.5px] shadow-[0_8px_20px_rgba(16,185,129,0.28)] z-10 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6">
            02
        </div>

        <!-- Image Area -->
        <div class="relative w-[155px] h-[155px] min-h-[155px] mt-1 mb-[17px] rounded-full bg-white/80 backdrop-blur-sm flex-shrink-0 flex items-center justify-center shadow-[0_0_0_9px_rgba(16,185,129,0.06),0_15px_30px_rgba(16,185,129,0.14)] z-[2] transition-all duration-700 group-hover:scale-[1.09]">

            <!-- Rotating Ring -->
            <div class="absolute w-[128px] h-[128px] rounded-full border-2 border-dashed border-[#09704eba] transition-all duration-[1200ms] ease-out group-hover:rotate-[270deg] group-hover:scale-[1.08]"></div>

            <!-- Inner Glow -->
            <div class="absolute w-[105px] h-[105px] rounded-full bg-[#10b981]/0 transition-all duration-700 group-hover:bg-[#10b981]/[0.06] group-hover:scale-[1.15]"></div>

            <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783502738/Pattern.webp" alt="Pattern" class="relative z-[2] max-w-[123px] max-h-[113px] w-auto h-auto object-contain transition-all duration-700 group-hover:scale-[1.13] group-hover:-rotate-3">
        </div>

        <!-- Heading -->
        <h3 class="relative z-[3] m-0 mb-[9px] text-[#079669] font-extrabold uppercase tracking-[1.5px] leading-tight transition-all duration-500 group-hover:tracking-[2.5px]">
            Patterns
        </h3>

        <!-- Content -->
        <p class="relative z-[3] m-0 mb-[25px] text-[#303d48] leading-[1.5]">
            <b>AI does not have feelings or opinions. It generates responses based on patterns, not judgment.</b>
        </p>

        <!-- Bottom Accent -->
        <div class="relative z-[3] mt-auto w-[55px] h-[5px] rounded-full bg-[#10b981] transition-all duration-700 group-hover:w-[105px] group-hover:h-[6px] group-hover:shadow-[0_0_18px_rgba(16,185,129,0.45)]"></div>

    </div>

    <!-- CARD 03 -->
    <div data-slot="2" class="group relative w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-none min-w-0 min-h-[325px] p-[22px_20px_20px] box-border rounded-[28px] overflow-hidden flex flex-col items-center text-center bg-gradient-to-br from-white via-[#fffdf5] to-[#fff8df] border border-[#f59e0b]/15 border-t-[5px] border-t-[#f59e0b] transition-all duration-700 hover:-translate-y-3 opacity-0 animate-[fadeIn_.6s_ease_.3s_forwards]">

        <!-- Animated Shine -->
        <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>

        <!-- Decorative Glow -->
        <div class="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-[#f59e0b]/[0.08] transition-all duration-700 group-hover:scale-[1.7] group-hover:bg-[#f59e0b]/[0.15]"></div>

        <!-- Decorative Circle -->
        <div class="absolute -left-10 bottom-8 w-24 h-24 rounded-full border border-[#f59e0b]/10 transition-all duration-700 group-hover:scale-[1.5] group-hover:translate-x-5 group-hover:-translate-y-3 group-hover:border-[#f59e0b]/25"></div>

        <!-- Number -->
        <div class="absolute top-4 left-4 w-[48px] h-[48px] rounded-[15px] bg-[#f59e0b] text-white flex items-center justify-center font-extrabold tracking-[0.5px] shadow-[0_8px_20px_rgba(245,158,11,0.28)] z-10 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6">
            03
        </div>

        <!-- Image Area -->
        <div class="relative w-[155px] h-[155px] min-h-[155px] mt-1 mb-[17px] rounded-full bg-white/80 backdrop-blur-sm flex-shrink-0 flex items-center justify-center shadow-[0_0_0_9px_rgba(245,158,11,0.06),0_15px_30px_rgba(245,158,11,0.14)] z-[2] transition-all duration-700 group-hover:scale-[1.09]">

            <!-- Rotating Ring -->
            <div class="absolute w-[128px] h-[128px] rounded-full border-2 border-dashed border-[#f59e0bcc] transition-all duration-[1200ms] ease-out group-hover:rotate-[270deg] group-hover:scale-[1.08]"></div>

            <!-- Inner Glow -->
            <div class="absolute w-[105px] h-[105px] rounded-full bg-[#f59e0b]/0 transition-all duration-700 group-hover:bg-[#f59e0b]/[0.06] group-hover:scale-[1.15]"></div>

            <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783502737/Expertise.webp" alt="Human Expertise" class="relative z-[2] max-w-[108px] max-h-[108px] w-auto h-auto object-contain transition-all duration-700 group-hover:scale-[1.13] group-hover:-rotate-3">
        </div>

        <!-- Heading -->
        <h3 class="relative z-[3] m-0 mb-[9px] text-[#d88900] font-extrabold uppercase tracking-[1.5px] leading-tight transition-all duration-500 group-hover:tracking-[2.5px]">
            Human Expertise
        </h3>

        <!-- Content -->
        <p class="relative z-[3] m-0 mb-[25px] text-[#303d48] leading-[1.5]">
            <b>AI does not replace your expertise. It cannot offer emotional support or handle complex decisions.</b>
        </p>

        <!-- Bottom Accent -->
        <div class="relative z-[3] mt-auto w-[55px] h-[5px] rounded-full bg-[#f59e0b] transition-all duration-700 group-hover:w-[105px] group-hover:h-[6px] group-hover:shadow-[0_0_18px_rgba(245,158,11,0.45)]"></div>

    </div>

</div>`,
  },

  // 7. 6-Role Capability Executive Matrix
  {
    id: 'role-capability-executive-matrix',
    title: '6-Role Capability Executive Matrix',
    category: 'Matrix / Roles & Teams',
    description:
      '6-column responsive team capability grid (Supervisors, Operations, Healthcare, Warehouse, Customer-Facing, Managers) with 360-degree rotating gradient borders, dot-grid pattern mask, 3D icon tile with animate-ping halo, and bottom progress track.',
    slotsCount: 6,
    slotNames: [
      'Supervisors (#0f2a4d)',
      'Operations teams (#1e6fdb)',
      'Healthcare staff (#5ec4c4)',
      'Warehouse & field (#f59e42)',
      'Customer-facing (#3cb371)',
      'Managers (#8c8c8c)',
    ],
    badge: '6-Role Matrix',
    enhanced_html: `<div class="w-full box-border px-4 py-8 sm:px-6 lg:px-8 my-[20px]">
    <div class="mx-auto flex w-full max-w-[1800px] flex-wrap justify-center gap-6">

        <!-- ================= CARD 01 ================= -->
        <div data-slot="0" class="group relative flex h-[430px] w-full min-w-0 flex-col items-center overflow-hidden rounded-[28px] p-[1px] opacity-0 transition-all duration-700 ease-out hover:-translate-y-3 hover:shadow-[0_34px_60px_-28px_rgba(15,42,77,0.55)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.1s] max-[600px]:w-full min-[601px]:max-[850px]:w-[calc(50%-12px)] min-[851px]:max-[1280px]:w-[calc(33.333%-16px)] min-[1281px]:max-[1500px]:w-[calc(25%-18px)] min-[1501px]:max-[1750px]:w-[calc(20%-19.2px)] min-[1751px]:w-[calc(16.666%-20px)]">
            <div class="absolute inset-0 rounded-[28px] bg-gradient-to-r from-transparent via-[#0f2a4d] to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:rotate-180"></div>
            <div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#0f2a4d]/10 blur-xl transition-all duration-700 group-hover:scale-[2] group-hover:rotate-45"></div>
            <div class="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[#0f2a4d]/5 blur-2xl transition-all duration-700 group-hover:translate-x-10 group-hover:-translate-y-10"></div>
            <div class="relative z-10 flex h-full w-full flex-col items-center overflow-hidden rounded-[27px] bg-gradient-to-br from-white via-[#f5f8fb] to-[#dbe7f2] backdrop-blur-xl px-6 pb-7 pt-8 transition-all duration-700 group-hover:from-white group-hover:to-[#c8d9e8]">
                <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [background-image:radial-gradient(rgba(15,42,77,0.22)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"></div>
                <div class="absolute left-0 top-0 h-1.5 w-full overflow-hidden">
                    <div class="h-full w-full bg-[linear-gradient(90deg,#0f2a4d_100%,white_0,#0f2a4d_100%)] bg-[length:200%_100%] transition-all duration-700 group-hover:bg-[position:100%_0]"></div>
                </div>
                <div class="relative mb-6 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#0f2a4d] to-[#173d61] transition-all duration-700 group-hover:-translate-y-3 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_20px_40px_rgba(15,42,77,0.25)]">
                    <span class="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-[#0f2a4d] opacity-0 group-hover:animate-ping group-hover:opacity-60"></span>
                    <span class="pointer-events-none absolute -inset-2 rounded-[30px] border border-[#0f2a4d]/40 opacity-0 scale-75 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"></span>
                    <div class="absolute inset-1 rounded-[20px] border border-white/20"></div>
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335869/Supervisors.webp" alt="Supervisors" class="relative h-[42px] w-[42px] object-contain brightness-0 invert">
                </div>
                <h3 class="relative m-0 mb-4 text-center font-semibold leading-tight text-[#0f2a4d] transition-all duration-500 group-hover:-translate-y-1 group-hover:tracking-wide">
                    Supervisors
                </h3>
                <div class="relative mb-5 h-1 w-12 rounded-full bg-gradient-to-r from-[#0f2a4d] to-[#24557d] transition-all duration-500 group-hover:w-20"></div>
                <p class="relative m-0 max-w-[250px] text-center leading-[1.65] text-[#374151] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-[#111827]">
                    Shift summaries, scheduling, safety briefings
                </p>
                <div class="relative mt-auto w-full pt-7">
                    <div class="relative h-1 w-full overflow-hidden rounded-full bg-[#0f2a4d]/20">
                        <div class="absolute left-0 top-0 h-full w-0 rounded-full bg-gradient-to-r from-[#0f2a4d] to-white transition-all duration-700 group-hover:w-full"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= CARD 02 ================= -->
        <div data-slot="1" class="group relative flex h-[430px] w-full min-w-0 flex-col items-center overflow-hidden rounded-[28px] p-[1px] opacity-0 transition-all duration-700 ease-out hover:-translate-y-3 hover:shadow-[0_34px_60px_-28px_rgba(30,111,219,0.55)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.2s] max-[600px]:w-full min-[601px]:max-[850px]:w-[calc(50%-12px)] min-[851px]:max-[1280px]:w-[calc(33.333%-16px)] min-[1281px]:max-[1500px]:w-[calc(25%-18px)] min-[1501px]:max-[1750px]:w-[calc(20%-19.2px)] min-[1751px]:w-[calc(16.666%-20px)]">
            <div class="absolute inset-0 rounded-[28px] bg-gradient-to-r from-transparent via-[#1e6fdb] to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:rotate-180"></div>
            <div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#1e6fdb]/10 blur-xl transition-all duration-700 group-hover:scale-[2] group-hover:rotate-45"></div>
            <div class="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[#1e6fdb]/5 blur-2xl transition-all duration-700 group-hover:translate-x-10 group-hover:-translate-y-10"></div>
            <div class="relative z-10 flex h-full w-full flex-col items-center overflow-hidden rounded-[27px] bg-gradient-to-br from-white via-[#eef5ff] to-[#d4e5ff] backdrop-blur-xl px-6 pb-7 pt-8 transition-all duration-700 group-hover:from-white group-hover:to-[#c1d9ff]">
                <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [background-image:radial-gradient(rgba(30,111,219,0.22)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"></div>
                <div class="absolute left-0 top-0 h-1.5 w-full overflow-hidden">
                    <div class="h-full w-full bg-[linear-gradient(90deg,#1e6fdb_100%,white_0%,#1e6fdb_100%)] bg-[length:200%_100%] transition-all duration-700 group-hover:bg-[position:100%_0]"></div>
                </div>
                <div class="relative mb-6 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#1e6fdb] to-[#1456ac] transition-all duration-700 group-hover:-translate-y-3 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_20px_40px_rgba(30,111,219,0.25)]">
                    <span class="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-[#1e6fdb] opacity-0 group-hover:animate-ping group-hover:opacity-60"></span>
                    <span class="pointer-events-none absolute -inset-2 rounded-[30px] border border-[#1e6fdb]/40 opacity-0 scale-75 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"></span>
                    <div class="absolute inset-1 rounded-[20px] border border-white/20"></div>
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Operations-Teams.webp" alt="Operations teams" class="relative h-[42px] w-[42px] object-contain brightness-0 invert">
                </div>
                <h3 class="relative m-0 mb-4 text-center font-semibold leading-tight text-[#1e6fdb] transition-all duration-500 group-hover:-translate-y-1 group-hover:tracking-wide">
                    Operations teams
                </h3>
                <div class="relative mb-5 h-1 w-12 rounded-full bg-gradient-to-r from-[#1e6fdb] to-[#1456ac] transition-all duration-500 group-hover:w-20"></div>
                <p class="relative m-0 max-w-[250px] text-center leading-[1.65] text-[#374151] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-[#111827]">
                    SOPs, reporting, workflow organisation
                </p>
                <div class="relative mt-auto w-full pt-7">
                    <div class="relative h-1 w-full overflow-hidden rounded-full bg-[#1e6fdb]/20">
                        <div class="absolute left-0 top-0 h-full w-0 rounded-full bg-gradient-to-r from-[#1e6fdb] to-white transition-all duration-700 group-hover:w-full"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= CARD 03 ================= -->
        <div data-slot="2" class="group relative flex h-[430px] w-full min-w-0 flex-col items-center overflow-hidden rounded-[28px] p-[1px] opacity-0 transition-all duration-700 ease-out hover:-translate-y-3 hover:shadow-[0_34px_60px_-28px_rgba(65,158,158,0.55)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.3s] max-[600px]:w-full min-[601px]:max-[850px]:w-[calc(50%-12px)] min-[851px]:max-[1280px]:w-[calc(33.333%-16px)] min-[1281px]:max-[1500px]:w-[calc(25%-18px)] min-[1501px]:max-[1750px]:w-[calc(20%-19.2px)] min-[1751px]:w-[calc(16.666%-20px)]">
            <div class="absolute inset-0 rounded-[28px] bg-gradient-to-r from-transparent via-[#5ec4c4] to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:rotate-180"></div>
            <div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#5ec4c4]/10 blur-xl transition-all duration-700 group-hover:scale-[2] group-hover:rotate-45"></div>
            <div class="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[#5ec4c4]/5 blur-2xl transition-all duration-700 group-hover:translate-x-10 group-hover:-translate-y-10"></div>
            <div class="relative z-10 flex h-full w-full flex-col items-center overflow-hidden rounded-[27px] bg-gradient-to-br from-white via-[#f0fbfb] to-[#d5eeee] backdrop-blur-xl px-6 pb-7 pt-8 transition-all duration-700 group-hover:from-white group-hover:to-[#bfe5e5]">
                <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [background-image:radial-gradient(rgba(65,158,158,0.22)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"></div>
                <div class="absolute left-0 top-0 h-1.5 w-full overflow-hidden">
                    <div class="h-full w-full bg-[linear-gradient(90deg,#5ec4c4_100%,white_0%,#5ec4c4_100%)] bg-[length:200%_100%] transition-all duration-700 group-hover:bg-[position:100%_0]"></div>
                </div>
                <div class="relative mb-6 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#5ec4c4] to-[#419e9e] transition-all duration-700 group-hover:-translate-y-3 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_20px_40px_rgba(65,158,158,0.25)]">
                    <span class="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-[#5ec4c4] opacity-0 group-hover:animate-ping group-hover:opacity-60"></span>
                    <span class="pointer-events-none absolute -inset-2 rounded-[30px] border border-[#5ec4c4]/40 opacity-0 scale-75 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"></span>
                    <div class="absolute inset-1 rounded-[20px] border border-white/20"></div>
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Healthcare-Staff.webp" alt="Healthcare staff" class="relative h-[42px] w-[42px] object-contain brightness-0 invert">
                </div>
                <h3 class="relative m-0 mb-4 text-center font-semibold leading-tight text-[#419e9e] transition-all duration-500 group-hover:-translate-y-1 group-hover:tracking-wide">
                    Healthcare staff
                </h3>
                <div class="relative mb-5 h-1 w-12 rounded-full bg-gradient-to-r from-[#5ec4c4] to-[#419e9e] transition-all duration-500 group-hover:w-20"></div>
                <p class="relative m-0 max-w-[250px] text-center leading-[1.65] text-[#374151] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-[#111827]">
                    Documentation support and summaries
                </p>
                <div class="relative mt-auto w-full pt-7">
                    <div class="relative h-1 w-full overflow-hidden rounded-full bg-[#5ec4c4]/20">
                        <div class="absolute left-0 top-0 h-full w-0 rounded-full bg-gradient-to-r from-[#5ec4c4] to-white transition-all duration-700 group-hover:w-full"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= CARD 04 ================= -->
        <div data-slot="3" class="group relative flex h-[430px] w-full min-w-0 flex-col items-center overflow-hidden rounded-[28px] p-[1px] opacity-0 transition-all duration-700 ease-out hover:-translate-y-3 hover:shadow-[0_34px_60px_-28px_rgba(215,123,33,0.55)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.4s] max-[600px]:w-full min-[601px]:max-[850px]:w-[calc(50%-12px)] min-[851px]:max-[1280px]:w-[calc(33.333%-16px)] min-[1281px]:max-[1500px]:w-[calc(25%-18px)] min-[1501px]:max-[1750px]:w-[calc(20%-19.2px)] min-[1751px]:w-[calc(16.666%-20px)]">
            <div class="absolute inset-0 rounded-[28px] bg-gradient-to-r from-transparent via-[#f59e42] to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:rotate-180"></div>
            <div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#f59e42]/10 blur-xl transition-all duration-700 group-hover:scale-[2] group-hover:rotate-45"></div>
            <div class="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[#f59e42]/5 blur-2xl transition-all duration-700 group-hover:translate-x-10 group-hover:-translate-y-10"></div>
            <div class="relative z-10 flex h-full w-full flex-col items-center overflow-hidden rounded-[27px] bg-gradient-to-br from-white via-[#fff7ed] to-[#fde0b8] backdrop-blur-xl px-6 pb-7 pt-8 transition-all duration-700 group-hover:from-white group-hover:to-[#ffd59a]">
                <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [background-image:radial-gradient(rgba(215,123,33,0.22)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"></div>
                <div class="absolute left-0 top-0 h-1.5 w-full overflow-hidden">
                    <div class="h-full w-full bg-[linear-gradient(90deg,#f59e42_100%,white_0%,#f59e42_100%)] bg-[length:200%_100%] transition-all duration-700 group-hover:bg-[position:100%_0]"></div>
                </div>
                <div class="relative mb-6 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#f59e42] to-[#d77b21] transition-all duration-700 group-hover:-translate-y-3 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_20px_40px_rgba(215,123,33,0.25)]">
                    <span class="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-[#f59e42] opacity-0 group-hover:animate-ping group-hover:opacity-60"></span>
                    <span class="pointer-events-none absolute -inset-2 rounded-[30px] border border-[#f59e42]/40 opacity-0 scale-75 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"></span>
                    <div class="absolute inset-1 rounded-[20px] border border-white/20"></div>
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Warehouse-and-field-teams.webp" alt="Warehouse and field teams" class="relative h-[42px] w-[42px] object-contain brightness-0 invert">
                </div>
                <h3 class="relative m-0 mb-4 text-center font-semibold leading-tight text-[#d77b21] transition-all duration-500 group-hover:-translate-y-1 group-hover:tracking-wide">
                    Warehouse and field teams
                </h3>
                <div class="relative mb-5 h-1 w-12 rounded-full bg-gradient-to-r from-[#f59e42] to-[#d77b21] transition-all duration-500 group-hover:w-20"></div>
                <p class="relative m-0 max-w-[250px] text-center leading-[1.65] text-[#374151] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-[#111827]">
                    Inventory lookup, issue logging, voice notes
                </p>
                <div class="relative mt-auto w-full pt-7">
                    <div class="relative h-1 w-full overflow-hidden rounded-full bg-[#f59e42]/20">
                        <div class="absolute left-0 top-0 h-full w-0 rounded-full bg-gradient-to-r from-[#f59e42] to-white transition-all duration-700 group-hover:w-full"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= CARD 05 ================= -->
        <div data-slot="4" class="group relative flex h-[430px] w-full min-w-0 flex-col items-center overflow-hidden rounded-[28px] p-[1px] opacity-0 transition-all duration-700 ease-out hover:-translate-y-3 hover:shadow-[0_34px_60px_-28px_rgba(49,150,94,0.55)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.5s] max-[600px]:w-full min-[601px]:max-[850px]:w-[calc(50%-12px)] min-[851px]:max-[1280px]:w-[calc(33.333%-16px)] min-[1281px]:max-[1500px]:w-[calc(25%-18px)] min-[1501px]:max-[1750px]:w-[calc(20%-19.2px)] min-[1751px]:w-[calc(16.666%-20px)]">
            <div class="absolute inset-0 rounded-[28px] bg-gradient-to-r from-transparent via-[#3cb371] to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:rotate-180"></div>
            <div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#3cb371]/10 blur-xl transition-all duration-700 group-hover:scale-[2] group-hover:rotate-45"></div>
            <div class="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[#3cb371]/5 blur-2xl transition-all duration-700 group-hover:translate-x-10 group-hover:-translate-y-10"></div>
            <div class="relative z-10 flex h-full w-full flex-col items-center overflow-hidden rounded-[27px] bg-gradient-to-br from-white via-[#f1fbf5] to-[#ccebd8] backdrop-blur-xl px-6 pb-7 pt-8 transition-all duration-700 group-hover:from-white group-hover:to-[#b6dfc7]">
                <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [background-image:radial-gradient(rgba(49,150,94,0.22)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"></div>
                <div class="absolute left-0 top-0 h-1.5 w-full overflow-hidden">
                    <div class="h-full w-full bg-[linear-gradient(90deg,#3cb371_100%,white_0%,#3cb371_100%)] bg-[length:200%_100%] transition-all duration-700 group-hover:bg-[position:100%_0]"></div>
                </div>
                <div class="relative mb-6 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#3cb371] to-[#31965e] transition-all duration-700 group-hover:-translate-y-3 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_20px_40px_rgba(49,150,94,0.25)]">
                    <span class="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-[#3cb371] opacity-0 group-hover:animate-ping group-hover:opacity-60"></span>
                    <span class="pointer-events-none absolute -inset-2 rounded-[30px] border border-[#3cb371]/40 opacity-0 scale-75 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"></span>
                    <div class="absolute inset-1 rounded-[20px] border border-white/20"></div>
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Customer-facing-roles.webp" alt="Customer-facing roles" class="relative h-[42px] w-[42px] object-contain brightness-0 invert">
                </div>
                <h3 class="relative m-0 mb-4 text-center font-semibold leading-tight text-[#31965e] transition-all duration-500 group-hover:-translate-y-1 group-hover:tracking-wide">
                    Customer-facing roles
                </h3>
                <div class="relative mb-5 h-1 w-12 rounded-full bg-gradient-to-r from-[#3cb371] to-[#31965e] transition-all duration-500 group-hover:w-20"></div>
                <p class="relative m-0 max-w-[250px] text-center leading-[1.65] text-[#374151] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-[#111827]">
                    Follow-ups, responses, communication drafts
                </p>
                <div class="relative mt-auto w-full pt-7">
                    <div class="relative h-1 w-full overflow-hidden rounded-full bg-[#3cb371]/20">
                        <div class="absolute left-0 top-0 h-full w-0 rounded-full bg-gradient-to-r from-[#3cb371] to-white transition-all duration-700 group-hover:w-full"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================= CARD 06 ================= -->
        <div data-slot="5" class="group relative flex h-[430px] w-full min-w-0 flex-col items-center overflow-hidden rounded-[28px] p-[1px] opacity-0 transition-all duration-700 ease-out hover:-translate-y-3 hover:shadow-[0_34px_60px_-28px_rgba(102,102,102,0.55)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.6s] max-[600px]:w-full min-[601px]:max-[850px]:w-[calc(50%-12px)] min-[851px]:max-[1280px]:w-[calc(33.333%-16px)] min-[1281px]:max-[1500px]:w-[calc(25%-18px)] min-[1501px]:max-[1750px]:w-[calc(20%-19.2px)] min-[1751px]:w-[calc(16.666%-20px)]">
            <div class="absolute inset-0 rounded-[28px] bg-gradient-to-r from-transparent via-[#8c8c8c] to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:rotate-180"></div>
            <div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#8c8c8c]/10 blur-xl transition-all duration-700 group-hover:scale-[2] group-hover:rotate-45"></div>
            <div class="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[#8c8c8c]/5 blur-2xl transition-all duration-700 group-hover:translate-x-10 group-hover:-translate-y-10"></div>
            <div class="relative z-10 flex h-full w-full flex-col items-center overflow-hidden rounded-[27px] bg-gradient-to-br from-white via-[#f5f5f5] to-[#dedede] backdrop-blur-xl px-6 pb-7 pt-8 transition-all duration-700 group-hover:from-white group-hover:to-[#cccccc]">
                <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [background-image:radial-gradient(rgba(102,102,102,0.22)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"></div>
                <div class="absolute left-0 top-0 h-1.5 w-full overflow-hidden">
                    <div class="h-full w-full bg-[linear-gradient(90deg,#8c8c8c_100%,white_0%,#8c8c8c_100%)] bg-[length:200%_100%] transition-all duration-700 group-hover:bg-[position:100%_0]"></div>
                </div>
                <div class="relative mb-6 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#8c8c8c] to-[#666666] transition-all duration-700 group-hover:-translate-y-3 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_20px_40px_rgba(102,102,102,0.25)]">
                    <span class="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-[#8c8c8c] opacity-0 group-hover:animate-ping group-hover:opacity-60"></span>
                    <span class="pointer-events-none absolute -inset-2 rounded-[30px] border border-[#8c8c8c]/40 opacity-0 scale-75 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"></span>
                    <div class="absolute inset-1 rounded-[20px] border border-white/20"></div>
                    <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Managers.webp" alt="Managers" class="relative h-[42px] w-[42px] object-contain brightness-0 invert">
                </div>
                <h3 class="relative m-0 mb-4 text-center font-semibold leading-tight text-[#333333] transition-all duration-500 group-hover:-translate-y-1 group-hover:tracking-wide">
                    Managers
                </h3>
                <div class="relative mb-5 h-1 w-12 rounded-full bg-gradient-to-r from-[#8c8c8c] to-[#666666] transition-all duration-500 group-hover:w-20"></div>
                <p class="relative m-0 max-w-[250px] text-center leading-[1.65] text-[#374151] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-[#111827]">
                    Reports, onboarding materials, policy summaries
                </p>
                <div class="relative mt-auto w-full pt-7">
                    <div class="relative h-1 w-full overflow-hidden rounded-full bg-[#8c8c8c]/20">
                        <div class="absolute left-0 top-0 h-full w-0 rounded-full bg-gradient-to-r from-[#8c8c8c] to-white transition-all duration-700 group-hover:w-full"></div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>`,
  },

  // 8. Visual Narrative Card (Image Left / Text Right)
  {
    id: 'horizontal-media-img-left-text-right',
    title: 'Visual Narrative Card (Image Left / Text Right)',
    category: 'Media / Cards',
    description:
      'Executive side-by-side card with a strictly constrained image on the left and structured heading, badge, description, and status pills on the right.',
    slotsCount: 1,
    slotNames: ['Main Card (Image Left, Content Right)'],
    badge: 'Image + Text',
    enhanced_html: `<div class="w-full p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-950/60 rounded-3xl border border-border/80">
  <div data-slot="0" class="group relative flex flex-col md:flex-row items-center gap-6 rounded-[22px] bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-indigo-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden p-6 transition-all duration-700 ease-out hover:shadow-[0_20px_45px_rgba(99,102,241,0.15)] hover:border-indigo-500/50 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl bg-indigo-500/15 group-hover:bg-indigo-500/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    <div class="faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-purple-400/15 group-hover:bg-purple-400/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    
    <!-- Left: Constrained Image Container (Never blown up on desktop) -->
    <div class="w-full md:w-[260px] lg:w-[300px] max-h-[220px] md:max-h-[260px] h-[200px] md:h-full shrink-0 rounded-2xl overflow-hidden relative border border-border/60 shadow-sm bg-slate-100 dark:bg-slate-800">
      <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80" alt="Executive Analytics Dashboard" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
      <span class="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">Featured</span>
    </div>

    <!-- Right: Structured Content -->
    <div class="flex-1 min-w-0 space-y-3">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">Enterprise AI</span>
        <span class="text-[11px] text-muted-foreground font-mono">100% Verbatim</span>
      </div>
      <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
        Next-Generation Autonomous Workflow Orchestration
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        Streamline multi-source data extraction and design generation. All content is analyzed with millimeter precision and transformed into pure atomic Tailwind structures.
      </p>
      <div class="flex items-center gap-2 pt-1 flex-wrap">
        <span class="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-semibold">Real-Time Sync</span>
        <span class="px-3 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 rounded-full text-xs font-semibold">Zero Style Bloat</span>
      </div>
    </div>
  </div>
</div>`,
  },

  // 2. Text Left / Image Right
  {
    id: 'horizontal-media-text-left-img-right',
    title: 'Spotlight Feature (Text Left / Image Right)',
    category: 'Media / Cards',
    description:
      'High-impact showcase card featuring heading, description, and status tags on the left, with an elegant bounded illustration/image on the right.',
    slotsCount: 1,
    slotNames: ['Main Card (Content Left, Image Right)'],
    badge: 'Text + Image',
    enhanced_html: `<div class="w-full p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-950/60 rounded-3xl border border-border/80">
  <div data-slot="0" class="group relative flex flex-col-reverse md:flex-row items-center gap-6 rounded-[22px] bg-gradient-to-br from-white to-blue-50/40 dark:from-slate-900 dark:to-slate-950 border border-blue-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden p-6 transition-all duration-700 ease-out hover:shadow-[0_20px_45px_rgba(37,99,235,0.15)] hover:border-blue-500/50 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl bg-blue-500/15 group-hover:bg-blue-500/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    <div class="faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-sky-400/15 group-hover:bg-sky-400/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    
    <!-- Left: Structured Text Content -->
    <div class="flex-1 min-w-0 space-y-3">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Executive Overview</span>
        <span class="text-[11px] text-muted-foreground font-mono">Precision Design</span>
      </div>
      <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
        Intelligent Style & Layout Transformation
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        Eliminate inline style overhead with pure Tailwind utility mapping. Built-in ambient glow transitions bring presentation decks and slides to life with smooth, subtle animations.
      </p>
      <div class="flex items-center gap-2 pt-1 flex-wrap">
        <span class="px-3 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-semibold">100% Tailwind</span>
        <span class="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-semibold">Verbatim Safe</span>
      </div>
    </div>

    <!-- Right: Constrained Image Container (Never blown up on desktop) -->
    <div class="w-full md:w-[260px] lg:w-[300px] max-h-[220px] md:max-h-[260px] h-[200px] md:h-full shrink-0 rounded-2xl overflow-hidden relative border border-border/60 shadow-sm bg-slate-100 dark:bg-slate-800">
      <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80" alt="Executive Performance Chart" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
    </div>
  </div>
</div>`,
  },

  // 3. Left Icon / Right Heading & Text Duo
  {
    id: 'icon-lead-cards-duo',
    title: 'Icon Header Duo (Left Icon / Right Content)',
    category: 'Icon Headers',
    description:
      'Twin presentation cards with glowing rounded icon badges on the left, paired with titles, descriptions, and feature pills on the right.',
    slotsCount: 2,
    slotNames: [
      'Card 1 (Left Icon / Right Text)',
      'Card 2 (Left Icon / Right Text)',
    ],
    badge: 'Icon + Content',
    enhanced_html: `<div class="grid grid-cols-1 md:grid-cols-2 gap-5 w-full box-border justify-center p-5 bg-slate-50/60 dark:bg-slate-950/60 rounded-3xl border border-border/80">
  <!-- Slot 0: Card 1 -->
  <div data-slot="0" class="group relative w-full min-w-0 rounded-[22px] bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30 border border-blue-500/20 p-6 overflow-hidden transition-all duration-700 ease-out hover:shadow-[0_20px_40px_rgba(37,99,235,0.12)] hover:border-blue-500/50 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl bg-blue-500/15 group-hover:bg-blue-500/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    <div class="faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-sky-400/15 group-hover:bg-sky-400/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    
    <div class="flex items-start gap-4">
      <!-- Left: Glowing Icon Squircle -->
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700 ease-out">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>

      <!-- Right: Content -->
      <div class="flex-1 min-w-0 space-y-2">
        <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Phase 01: Core Ingestion</span>
        <h4 class="text-lg font-black text-slate-900 dark:text-white leading-tight">Instant Syntax Conversion</h4>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Deep structural analysis converts messy inline styling to clean, responsive Tailwind classes while maintaining 100% verbatim accuracy.
        </p>
        <div class="flex gap-2 pt-1">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">Deterministic</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Slot 1: Card 2 -->
  <div data-slot="1" class="group relative w-full min-w-0 rounded-[22px] bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 border border-emerald-500/20 p-6 overflow-hidden transition-all duration-700 ease-out hover:shadow-[0_20px_40px_rgba(16,185,129,0.12)] hover:border-emerald-500/50 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl bg-emerald-500/15 group-hover:bg-emerald-500/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    <div class="faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-teal-400/15 group-hover:bg-teal-400/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    
    <div class="flex items-start gap-4">
      <!-- Left: Glowing Icon Squircle -->
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700 ease-out">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
      </div>

      <!-- Right: Content -->
      <div class="flex-1 min-w-0 space-y-2">
        <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Phase 02: Verification</span>
        <h4 class="text-lg font-black text-slate-900 dark:text-white leading-tight">Verbatim Content Shield</h4>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Zero words rephrased or summarized. High-fidelity guarantee ensures every single header, body token, and badge remains completely unaltered.
        </p>
        <div class="flex gap-2 pt-1">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">100% Faithful</span>
        </div>
      </div>
    </div>
  </div>
</div>`,
  },

  // 4. 3-Column Left-Icon Architecture
  {
    id: 'icon-lead-triple-grid',
    title: '3-Column Left-Icon Architecture (Icons Left / Text Right)',
    category: 'Features / Pillars',
    description:
      'Three-pillar layout where each card features an icon badge on the left with title, subtitle, and paragraph on the right.',
    slotsCount: 3,
    slotNames: [
      'Pillar 1 (Icon Left)',
      'Pillar 2 (Icon Left)',
      'Pillar 3 (Icon Left)',
    ],
    badge: '3-Pillars',
    enhanced_html: `<div class="grid grid-cols-1 md:grid-cols-3 gap-5 w-full p-6 bg-slate-950 rounded-3xl border border-purple-500/20">
  <!-- Slot 0: Pillar 1 -->
  <div data-slot="0" class="group relative rounded-2xl bg-slate-900/90 border border-purple-500/20 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-purple-500/70 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(168,85,247,0.2)]">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-purple-600/20 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="flex items-start gap-3.5">
      <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform duration-700 ease-out">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
      </div>
      <div class="flex-1 min-w-0 space-y-1">
        <span class="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">Capability 01</span>
        <h4 class="text-sm font-bold text-white leading-snug">Real-Time Detection</h4>
        <p class="text-xs text-slate-400 leading-relaxed">Instant parsing of document trees and multi-format text structures.</p>
      </div>
    </div>
  </div>

  <!-- Slot 1: Pillar 2 -->
  <div data-slot="1" class="group relative rounded-2xl bg-slate-900/90 border border-purple-500/20 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-purple-500/70 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(168,85,247,0.2)]">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-purple-600/20 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="flex items-start gap-3.5">
      <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform duration-700 ease-out">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
      </div>
      <div class="flex-1 min-w-0 space-y-1">
        <span class="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">Capability 02</span>
        <h4 class="text-sm font-bold text-white leading-snug">Zero Style Tags</h4>
        <p class="text-xs text-slate-400 leading-relaxed">Guaranteed 100% pure Tailwind utilities with no raw CSS bloat.</p>
      </div>
    </div>
  </div>

  <!-- Slot 2: Pillar 3 -->
  <div data-slot="2" class="group relative rounded-2xl bg-slate-900/90 border border-purple-500/20 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-purple-500/70 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(168,85,247,0.2)]">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-purple-600/20 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="flex items-start gap-3.5">
      <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform duration-700 ease-out">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
      </div>
      <div class="flex-1 min-w-0 space-y-1">
        <span class="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">Capability 03</span>
        <h4 class="text-sm font-bold text-white leading-snug">Fluid Ambient Glow</h4>
        <p class="text-xs text-slate-400 leading-relaxed">Slow ambient transitions animate gracefully on user interaction.</p>
      </div>
    </div>
  </div>
</div>`,
  },

  // 5. Dual 3D Comparative Cards
  {
    id: 'dual-comparative-ocean',
    title: 'Dual 3D Comparative Cards (Ocean Blue & Emerald)',
    category: 'Comparison',
    description:
      'Side-by-side comparative cards with 3D elevation, accent borders, and ambient glow. Perfect for Before/After, Manual vs AI, or Problem vs Solution.',
    slotsCount: 2,
    slotNames: ['Card 1 (Left / Baseline)', 'Card 2 (Right / Enhanced)'],
    badge: 'Comparison',
    enhanced_html: `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full box-border justify-center p-5 bg-slate-50/50 dark:bg-slate-950/40 rounded-3xl">
  <!-- Slot 0: Card 1 -->
  <div data-slot="0" class="group relative w-full min-w-0 rounded-[22px] bg-gradient-to-br from-white to-[#eff6ff] dark:from-slate-900 dark:to-blue-950/40 border border-[rgba(32,95,153,0.18)] border-t-[6px] border-t-[#205f99] shadow-[0_10px_28px_rgba(1,51,93,0.08)] overflow-hidden p-[26px] transition-all duration-700 ease-out hover:shadow-[0_18px_38px_rgba(1,51,93,0.15)] hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl bg-[#205f99]/15 group-hover:bg-[#205f99]/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    <div class="faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-sky-400/15 group-hover:bg-sky-400/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    <div class="text-[12px] font-bold uppercase tracking-wider text-[#205f99] dark:text-sky-400 mb-2">Phase 01: Baseline Approach</div>
    <h3 class="text-[20px] font-black text-slate-900 dark:text-white mb-3">Manual Workflow Review</h3>
    <p class="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed mb-4">Teams manually inspect data tables and document checklists, leading to substantial verification overhead.</p>
    <div class="flex gap-2 flex-wrap">
      <span class="px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">High Latency</span>
      <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold">Manual Overhead</span>
    </div>
  </div>

  <!-- Slot 1: Card 2 -->
  <div data-slot="1" class="group relative w-full min-w-0 rounded-[22px] bg-gradient-to-br from-white to-[#f0fdf4] dark:from-slate-900 dark:to-emerald-950/40 border border-[rgba(22,163,74,0.18)] border-t-[6px] border-t-[#16a34a] shadow-[0_10px_28px_rgba(22,163,74,0.08)] overflow-hidden p-[26px] transition-all duration-700 ease-out hover:shadow-[0_18px_38px_rgba(22,163,74,0.15)] hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl bg-emerald-600/15 group-hover:bg-emerald-600/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    <div class="faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-teal-400/15 group-hover:bg-teal-400/25 transition-all duration-1000 ease-out group-hover:scale-125"></div>
    <div class="text-[12px] font-bold uppercase tracking-wider text-[#16a34a] dark:text-emerald-400 mb-2">Phase 02: AI-Powered Copilot</div>
    <h3 class="text-[20px] font-black text-slate-900 dark:text-white mb-3">Autonomous Real-Time Synthesis</h3>
    <p class="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed mb-4">Generative intelligence parses documents instantly, flags variances in milliseconds, and suggests remediation.</p>
    <div class="flex gap-2 flex-wrap">
      <span class="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-semibold">10x Speedup</span>
      <span class="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-semibold">Zero Error Rate</span>
    </div>
  </div>
</div>`,
  },

  // 6. 4-Stage Execution Roadmap
  {
    id: 'quad-roadmap-pipeline-indigo',
    title: '4-Stage Execution Roadmap (Numbered Badges Left)',
    category: 'Process / Roadmap',
    description:
      'Sequential 4-step workflow pipeline with numbered step badges, progress tracks, and high-impact descriptions.',
    slotsCount: 4,
    slotNames: [
      'Step 1: Discovery',
      'Step 2: Conversion',
      'Step 3: Optimization',
      'Step 4: Deployment',
    ],
    badge: '4-Steps',
    enhanced_html: `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full p-6 bg-slate-900/60 dark:bg-slate-950 border border-indigo-500/20 rounded-3xl">
  <!-- Slot 0: Step 1 -->
  <div data-slot="0" class="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-cyan-400 hover:-translate-y-1 hover:shadow-xl">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl bg-indigo-500/20 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-3 shadow-md shadow-indigo-500/30">01</div>
    <h5 class="text-sm font-bold text-white mb-1.5">Intake & Scan</h5>
    <p class="text-xs text-slate-400 leading-relaxed">Parse raw input code and isolate legacy inline style attributes across nested DOM structures.</p>
  </div>

  <!-- Slot 1: Step 2 -->
  <div data-slot="1" class="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-cyan-400 hover:-translate-y-1 hover:shadow-xl">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl bg-indigo-500/20 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-3 shadow-md shadow-indigo-500/30">02</div>
    <h5 class="text-sm font-bold text-white mb-1.5">Tailwind Mapping</h5>
    <p class="text-xs text-slate-400 leading-relaxed">Map CSS declarations to deterministic modern Tailwind classes, including arbitrary hex values.</p>
  </div>

  <!-- Slot 2: Step 3 -->
  <div data-slot="2" class="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-cyan-400 hover:-translate-y-1 hover:shadow-xl">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl bg-indigo-500/20 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-3 shadow-md shadow-indigo-500/30">03</div>
    <h5 class="text-sm font-bold text-white mb-1.5">Glow Injection</h5>
    <p class="text-xs text-slate-400 leading-relaxed">Embed corner blur spheres and interactive hover elevation states for presentation-grade polish.</p>
  </div>

  <!-- Slot 3: Step 4 -->
  <div data-slot="3" class="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-cyan-300 hover:-translate-y-1 hover:shadow-xl">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl bg-cyan-500/20 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center mb-3 shadow-md shadow-cyan-400/30">04</div>
    <h5 class="text-sm font-bold text-white mb-1.5">Slide Export</h5>
    <p class="text-xs text-slate-400 leading-relaxed">Copy pristine code directly or inject into live presentation decks with zero external CSS dependencies.</p>
  </div>
</div>`,
  },

  // 7. Key Metrics & High-Impact Stats
  {
    id: 'triple-metrics-kpi-amber',
    title: 'Key Metrics & High-Impact Stats (Amber & Emerald)',
    category: 'Metrics / KPIs',
    description:
      'High-impact numerical metric showcase cards featuring oversized statistical callouts and explanatory growth notes.',
    slotsCount: 3,
    slotNames: ['Metric 1 (Left)', 'Metric 2 (Center)', 'Metric 3 (Right)'],
    badge: 'Stats & KPIs',
    enhanced_html: `<div class="grid grid-cols-1 md:grid-cols-3 gap-5 w-full p-6 bg-slate-900 rounded-3xl border border-amber-500/20">
  <!-- Slot 0: Metric 1 -->
  <div data-slot="0" class="group relative rounded-2xl bg-slate-950 border border-amber-500/20 p-6 overflow-hidden transition-all duration-700 ease-out hover:border-amber-400 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-amber-500/15 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="text-3xl font-black text-amber-400 mb-1">99.8%</div>
    <div class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">CSS Parsing Accuracy</div>
    <p class="text-xs text-slate-400 leading-relaxed">Deterministic syntax conversion across 60+ core CSS properties without CSS bleeding.</p>
  </div>

  <!-- Slot 1: Metric 2 -->
  <div data-slot="1" class="group relative rounded-2xl bg-slate-950 border border-emerald-500/20 p-6 overflow-hidden transition-all duration-700 ease-out hover:border-emerald-400 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-emerald-500/15 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="text-3xl font-black text-emerald-400 mb-1">10x</div>
    <div class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Workflow Speedup</div>
    <p class="text-xs text-slate-400 leading-relaxed">Eliminates manual CSS debugging and refactoring time for presentation designers.</p>
  </div>

  <!-- Slot 2: Metric 3 -->
  <div data-slot="2" class="group relative rounded-2xl bg-slate-950 border border-cyan-500/20 p-6 overflow-hidden transition-all duration-700 ease-out hover:border-cyan-400 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl bg-cyan-500/15 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="text-3xl font-black text-cyan-400 mb-1">0 KB</div>
    <div class="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">External Style Overhead</div>
    <p class="text-xs text-slate-400 leading-relaxed">Pure atomic utilities compile seamlessly within modern Next.js & Tailwind ecosystems.</p>
  </div>
</div>`,
  },

  // 8. 4-Card Minimalist Matrix
  {
    id: 'quad-grid-modern-slate',
    title: '4-Card Minimalist Matrix (Slate & Sky Glass)',
    category: 'Grid Matrix',
    description:
      'Balanced 2x2 grid cards with crisp borders, subtle background tints, and versatile multi-purpose content slots.',
    slotsCount: 4,
    slotNames: [
      'Card 1 (Top Left)',
      'Card 2 (Top Right)',
      'Card 3 (Bottom Left)',
      'Card 4 (Bottom Right)',
    ],
    badge: '2x2 Grid',
    enhanced_html: `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full p-6 bg-slate-950 rounded-3xl border border-slate-800">
  <!-- Slot 0: Card 1 -->
  <div data-slot="0" class="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-sky-500/60 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-xl bg-sky-500/15 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Module 01</div>
    <h5 class="text-sm font-bold text-white mb-1.5">Intelligent Parsing</h5>
    <p class="text-xs text-slate-400 leading-relaxed">Deconstructs complex inline styling and normalizes color tokens.</p>
  </div>

  <!-- Slot 1: Card 2 -->
  <div data-slot="1" class="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-sky-500/60 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-xl bg-sky-500/15 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Module 02</div>
    <h5 class="text-sm font-bold text-white mb-1.5">Strict Sanitation</h5>
    <p class="text-xs text-slate-400 leading-relaxed">Strips obsolete style tags and script blocks for total security.</p>
  </div>

  <!-- Slot 2: Card 3 -->
  <div data-slot="2" class="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-sky-500/60 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-xl bg-sky-500/15 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Module 03</div>
    <h5 class="text-sm font-bold text-white mb-1.5">Interactive Polish</h5>
    <p class="text-xs text-slate-400 leading-relaxed">Adds ambient corner glow circles and responsive elevation states.</p>
  </div>

  <!-- Slot 3: Card 4 -->
  <div data-slot="3" class="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-5 overflow-hidden transition-all duration-700 ease-out hover:border-sky-500/60 hover:-translate-y-1">
    <div class="faded-corner-circle pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-xl bg-sky-500/15 group-hover:scale-125 transition-all duration-1000 ease-out"></div>
    <div class="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Module 04</div>
    <h5 class="text-sm font-bold text-white mb-1.5">Zero CSS Bloat</h5>
    <p class="text-xs text-slate-400 leading-relaxed">Lightweight atomic utility code ready for slide decks and production web apps.</p>
  </div>
</div>`,
  },
];

export const SEMANTIC_ICONS = {
  security: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
  speed: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  ai: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>`,
  analytics: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  database: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>`,
  cloud: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"/></svg>`,
  workflow: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>`,
  code: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`,
  rocket: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.84 2.58m0 0a6 6 0 01-7.38-5.84h4.8m2.58 5.84L3 21l3.75-6.75"/></svg>`,
  global: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>`,
  check: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
};

export const SEMANTIC_IMAGES = [
  // 1. Hazwoper AI Card Assets (High Priority)
  {
    topic: 'challenge',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/the-challange.webp',
    alt: 'The Challenge',
  },
  {
    topic: 'ai-help',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/how-ai-can-help.webp',
    alt: 'How AI Can Help / AI Solution',
  },
  {
    topic: 'before-search',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/Before-Ai--1.webp',
    alt: 'Searching through old emails for a piece of information',
  },
  {
    topic: 'before-rewriting',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--2.webp',
    alt: 'Rewriting the same type of message over and over',
  },
  {
    topic: 'before-scratch',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--3.webp',
    alt: 'Starting reports from scratch every time',
  },
  {
    topic: 'before-notes',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai---4.webp',
    alt: 'Organizing notes manually after a meeting',
  },
  {
    topic: 'with-ai-faster',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---1.webp',
    alt: 'Faster searching, summarizing, and writing first drafts',
  },
  {
    topic: 'with-ai-automating',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---2.webp',
    alt: 'Automating templated messages',
  },
  {
    topic: 'with-ai-summaries',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785078099/With-AI---3.webp',
    alt: 'Instant summaries of long documents',
  },
  {
    topic: 'with-ai-action-items',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/With-AI---4.webp',
    alt: 'Organized action items from meetings',
  },
  {
    topic: 'email-autocomplete',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Email-Autocompletes.webp',
    alt: 'Email autocompletes',
  },
  {
    topic: 'spam-filter',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Spam-Filter.webp',
    alt: 'Spam filter',
  },
  {
    topic: 'appointment-reminders',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Appointment-Reminders.webp',
    alt: 'Appointment reminders',
  },
  {
    topic: 'search-suggestions',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Search-Suggestions.webp',
    alt: 'Search suggestions',
  },
  {
    topic: 'voice-assistants',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789988132/Voice-Assistants.webp',
    alt: 'Voice assistants',
  },
  {
    topic: 'netflix-spotify',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497819/Netflix--Spotify.webp',
    alt: 'Netflix & Spotify Recommendations',
  },
  {
    topic: 'bank-fraud',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497819/Bank-Fraud-Alerts.webp',
    alt: 'Bank Fraud Alerts',
  },
  {
    topic: 'google-maps',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497819/Google-Maps.webp',
    alt: 'Google Maps Traffic Prediction',
  },
  {
    topic: 'amazon',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497820/Amazon.webp',
    alt: 'Amazon Product Suggestions',
  },
  {
    topic: 'social-media',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783497820/Social-Media-Feeds.webp',
    alt: 'Social Media Feeds',
  },
  {
    topic: 'ai-badge-icon',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783499235/Ai-Powered-Icon.webp',
    alt: 'AI Powered',
  },
  // Official Master Course Archetype Images
  {
    topic: 'compliance-shield',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/08/1788167178/M1L00128.08.2026.webp',
    alt: 'Compliance & Legal Shield Advisory',
  },
  {
    topic: 'reference-icon',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789815919/refrence-icon.webp',
    alt: 'Reference Citation Badge',
  },
  {
    topic: 'principle-context',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783502737/Content.webp',
    alt: 'Context Principle',
  },
  {
    topic: 'principle-pattern',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783502738/Pattern.webp',
    alt: 'Pattern Recognition',
  },
  {
    topic: 'principle-expertise',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1783502737/Expertise.webp',
    alt: 'Human Expertise Principle',
  },
  {
    topic: 'role-supervisors',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335869/Supervisors.webp',
    alt: 'Supervisors Role',
  },
  {
    topic: 'role-operations',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Operations-Teams.webp',
    alt: 'Operations Teams Role',
  },
  {
    topic: 'role-healthcare',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Healthcare-Staff.webp',
    alt: 'Healthcare Staff Role',
  },
  {
    topic: 'role-warehouse',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Warehouse-and-field-teams.webp',
    alt: 'Warehouse and Field Teams Role',
  },
  {
    topic: 'role-customer',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Customer-facing-roles.webp',
    alt: 'Customer Facing Roles',
  },
  {
    topic: 'role-managers',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785335866/Managers.webp',
    alt: 'Managers Role',
  },
  {
    topic: 'prompt-skills',
    url: 'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1784026927/Promp-Skills.webp',
    alt: 'Prompt Skills',
  },
  // 2. Generic Photography Fallbacks
  {
    topic: 'analytics',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    alt: 'Executive Analytics and Performance Dashboard',
  },
  {
    topic: 'strategy',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    alt: 'Business Strategy and Data Insights',
  },
  {
    topic: 'technology',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    alt: 'Intelligent AI Computing Network',
  },
  {
    topic: 'security',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    alt: 'Enterprise Cyber Security Shield',
  },
  {
    topic: 'teamwork',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    alt: 'Autonomous Team Collaboration and Delivery',
  },
  {
    topic: 'engineering',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
    alt: 'Precision Code Architecture and Systems',
  },
];

export function findBestSemanticIcon(text, index = 0) {
  if (!text) {
    const keys = Object.keys(SEMANTIC_ICONS);
    return SEMANTIC_ICONS[keys[index % keys.length]];
  }
  const t = text.toLowerCase();
  if (
    /\b(secur|protect|shield|lock|auth|safe|guard|compliance|verif)/i.test(t)
  ) {
    return SEMANTIC_ICONS.security;
  }
  if (/\b(speed|fast|instant|latency|perform|turbo|quick|accelerat)/i.test(t)) {
    return SEMANTIC_ICONS.speed;
  }
  if (/\b(ai|bot|smart|intel|model|neural|auto|generat|copilot)/i.test(t)) {
    return SEMANTIC_ICONS.ai;
  }
  if (/\b(metric|stat|chart|kpi|growth|analy|graph|percent|measur)/i.test(t)) {
    return SEMANTIC_ICONS.analytics;
  }
  if (/\b(data|store|sql|db|table|record|lake|warehouse)/i.test(t)) {
    return SEMANTIC_ICONS.database;
  }
  if (/\b(cloud|host|server|infra|cluster|deploy|scale)/i.test(t)) {
    return SEMANTIC_ICONS.cloud;
  }
  if (/\b(flow|work|pipel|step|phase|stage|process|task)/i.test(t)) {
    return SEMANTIC_ICONS.workflow;
  }
  if (/\b(code|syntax|tag|css|html|tailwind|script|dev)/i.test(t)) {
    return SEMANTIC_ICONS.code;
  }
  if (/\b(launch|ship|deploy|growth|scale|rocket|future)/i.test(t)) {
    return SEMANTIC_ICONS.rocket;
  }
  if (/\b(global|world|sync|network|team|connect|api)/i.test(t)) {
    return SEMANTIC_ICONS.global;
  }
  if (/\b(check|done|success|finish|valid|shield)/i.test(t)) {
    return SEMANTIC_ICONS.check;
  }

  const keys = Object.keys(SEMANTIC_ICONS);
  return SEMANTIC_ICONS[keys[index % keys.length]];
}

export function findBestSemanticImage(text, index = 0) {
  if (!text) {
    return SEMANTIC_IMAGES[index % SEMANTIC_IMAGES.length];
  }
  const t = text.toLowerCase();

  // 1. Direct Hazwoper AI Card Asset Matching
  if (
    /\b(challenge|obstacle|problem|hurdle|difficulty|manual task|risk of error|balance speed)\b/i.test(
      t
    )
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'challenge') ||
      SEMANTIC_IMAGES[0]
    );
  }
  if (
    /\b(how ai can help|ai solution|ai helps?|copilot|automated solution|smart draft|response draft)\b/i.test(
      t
    )
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'ai-help') ||
      SEMANTIC_IMAGES[1]
    );
  }
  if (
    /\b(email\s*autocomplete|autocomplete|gmail|outlook|suggest.*words)\b/i.test(
      t
    )
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'email-autocomplete') ||
      SEMANTIC_IMAGES[10]
    );
  }
  if (/\b(spam\s*filter|spam|junk\s*mail|phish)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'spam-filter') ||
      SEMANTIC_IMAGES[11]
    );
  }
  if (
    /\b(appointment\s*reminder|appointment|reminder|calendar|flag.*appointment)\b/i.test(
      t
    )
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'appointment-reminders') ||
      SEMANTIC_IMAGES[12]
    );
  }
  if (/\b(search\s*suggestion|search|query|google finish)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'search-suggestions') ||
      SEMANTIC_IMAGES[13]
    );
  }
  if (
    /\b(voice\s*assistant|voice|siri|alexa|google assistant|speech)\b/i.test(t)
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'voice-assistants') ||
      SEMANTIC_IMAGES[14]
    );
  }
  if (
    /\b(netflix|spotify|media|streaming|recommendation|playlist)\b/i.test(t)
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'netflix-spotify') ||
      SEMANTIC_IMAGES[15]
    );
  }
  if (
    /\b(fraud|bank|transaction|credit card|unusual spending|theft)\b/i.test(t)
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'bank-fraud') ||
      SEMANTIC_IMAGES[16]
    );
  }
  if (/\b(google\s*maps?|maps?|traffic|gps|navigation|route)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'google-maps') ||
      SEMANTIC_IMAGES[17]
    );
  }
  if (/\b(amazon|store|ecommerce|shopping|product suggestion)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'amazon') ||
      SEMANTIC_IMAGES[18]
    );
  }
  if (
    /\b(social\s*media|feed|timeline|instagram|facebook|twitter|posts?)\b/i.test(
      t
    )
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'social-media') ||
      SEMANTIC_IMAGES[19]
    );
  }
  if (/\b(before ai.*email|searching old email)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'before-search') ||
      SEMANTIC_IMAGES[2]
    );
  }
  if (/\b(rewriting|same type of message)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'before-rewriting') ||
      SEMANTIC_IMAGES[3]
    );
  }
  if (/\b(from scratch|starting reports)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'before-scratch') ||
      SEMANTIC_IMAGES[4]
    );
  }
  if (/\b(notes manually|meeting notes)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'before-notes') ||
      SEMANTIC_IMAGES[5]
    );
  }
  if (/\b(faster searching|first drafts?)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'with-ai-faster') ||
      SEMANTIC_IMAGES[6]
    );
  }
  if (/\b(automating|templated message)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'with-ai-automating') ||
      SEMANTIC_IMAGES[7]
    );
  }
  if (/\b(instant summar|document summar)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'with-ai-summaries') ||
      SEMANTIC_IMAGES[8]
    );
  }
  if (/\b(action items|organized action)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'with-ai-action-items') ||
      SEMANTIC_IMAGES[9]
    );
  }

  // Master Course Archetype Detectors
  if (
    /\b(disclaimer|legal|medical|advice|liability|shield|compliance)\b/i.test(t)
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'compliance-shield') ||
      SEMANTIC_IMAGES[20]
    );
  }
  if (
    /\b(reference|citation|index report|stanford|bibliography|source link)\b/i.test(
      t
    )
  ) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'reference-icon') ||
      SEMANTIC_IMAGES[21]
    );
  }
  if (/\b(context|situation|clarity)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'principle-context') ||
      SEMANTIC_IMAGES[22]
    );
  }
  if (/\b(pattern|patterns|predict|algorithm)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'principle-pattern') ||
      SEMANTIC_IMAGES[23]
    );
  }
  if (/\b(expertise|judgment|human expertise|complex decisions)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'principle-expertise') ||
      SEMANTIC_IMAGES[24]
    );
  }
  if (/\b(supervisor|supervisors|scheduling|briefing)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'role-supervisors') ||
      SEMANTIC_IMAGES[25]
    );
  }
  if (/\b(operations|incident logs|checklist|workflow)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'role-operations') ||
      SEMANTIC_IMAGES[26]
    );
  }
  if (/\b(healthcare|doctor|nurse|clinic|patient)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'role-healthcare') ||
      SEMANTIC_IMAGES[27]
    );
  }
  if (/\b(warehouse|field teams?|inventory|equipment)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'role-warehouse') ||
      SEMANTIC_IMAGES[28]
    );
  }
  if (/\b(customer|customer-facing|support|ticket|client)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'role-customer') ||
      SEMANTIC_IMAGES[29]
    );
  }
  if (/\b(manager|managers|executive|leadership|onboarding)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'role-managers') ||
      SEMANTIC_IMAGES[30]
    );
  }
  if (/\b(prompt|prompts|prompting|skills)\b/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'prompt-skills') ||
      SEMANTIC_IMAGES[31]
    );
  }

  // 2. Generic Topics
  if (/\b(chart|stat|metric|analy|growth|kpi|finance|report)/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'analytics') ||
      SEMANTIC_IMAGES[21]
    );
  }
  if (/\b(strat|plan|exec|leader|manage|overview|goal)/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'strategy') ||
      SEMANTIC_IMAGES[22]
    );
  }
  if (/\b(ai|tech|intel|model|comput|neural|algo|system)/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'technology') ||
      SEMANTIC_IMAGES[23]
    );
  }
  if (/\b(secur|guard|protect|shield|lock|privacy|safe)/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'security') ||
      SEMANTIC_IMAGES[24]
    );
  }
  if (/\b(team|collab|people|user|work|partner|meet)/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'teamwork') ||
      SEMANTIC_IMAGES[25]
    );
  }
  if (/\b(code|develop|build|engine|soft|api|logic)/i.test(t)) {
    return (
      SEMANTIC_IMAGES.find((img) => img.topic === 'engineering') ||
      SEMANTIC_IMAGES[26]
    );
  }

  return SEMANTIC_IMAGES[index % SEMANTIC_IMAGES.length];
}

/**
 * Extracts structured verbatim content units from user text or HTML.
 * STRICT CRITICAL RULE: Preserves 100% of user text without altering a single word or adding filler.
 */
export function extractVerbatimTextSegments(content) {
  if (!content || typeof content !== 'string') return [];

  // Check if content is HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml && typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');

      // Check for images
      const topImg = doc.body.querySelector('img');
      const imgSrc = topImg ? topImg.getAttribute('src') : '';
      const imgAlt = topImg ? topImg.getAttribute('alt') : '';

      // Check for top-level child cards
      const topLevelCards = Array.from(
        doc.body.querySelectorAll(
          '[data-slot], div[style*="flex:"], div[style*="min-width"], div[class*="rounded"], div[style*="border-radius"], div[class*="border"]'
        )
      ).filter(
        (el) =>
          el.parentElement === doc.body ||
          el.parentElement === doc.body.firstElementChild
      );

      if (topLevelCards.length > 0) {
        return topLevelCards.map((card) => {
          const cardImg = card.querySelector('img');
          const badgeEl = card.querySelector(
            '[style*="uppercase"], [class*="uppercase"], [style*="letter-spacing"], [class*="tracking"]'
          );
          const headingEl = card.querySelector(
            'h1, h2, h3, h4, h5, h6, div[class*="font-extrabold"], div[class*="font-bold"]:not([class*="flex"])'
          );
          const pEl = card.querySelector('p');
          const tagEls = Array.from(
            card.querySelectorAll('span, li, a')
          ).filter((el) => el !== badgeEl);

          // Extract list bullets if any
          const bulletEls = Array.from(
            card.querySelectorAll('ul > li, ol > li')
          );
          const bullets = bulletEls
            .map((li) => li.textContent.trim())
            .filter(Boolean);

          // Extract row items if any (e.g. Before AI / With AI items)
          const rowEls = Array.from(
            card.querySelectorAll(
              'div[class*="items-center"], div[class*="flex-row"]'
            )
          ).filter(
            (r) =>
              r.querySelector('img') &&
              (r.querySelector('p') || r.querySelector('span'))
          );
          const items = rowEls.map((r) => r.textContent.trim()).filter(Boolean);

          const badge = badgeEl ? badgeEl.textContent.trim() : '';
          const heading = headingEl ? headingEl.textContent.trim() : '';
          const body = pEl ? pEl.textContent.trim() : '';
          const tags = tagEls.map((t) => t.textContent.trim()).filter(Boolean);

          return {
            badge,
            heading,
            body:
              body ||
              (!heading && !badge && bullets.length === 0
                ? card.textContent.trim()
                : ''),
            bullets,
            items,
            tags,
            imgSrc: cardImg ? cardImg.getAttribute('src') : imgSrc,
            imgAlt: cardImg ? cardImg.getAttribute('alt') : imgAlt,
            raw: card.textContent.trim(),
          };
        });
      }
    } catch {
      // fallback
    }
  }

  // Plain text splitting (paragraphs or bullet lines)
  const lines = content
    .split(/\n\s*\n|\n(?=[-*•\d]+\.?\s+)/)
    .map((s) => s.trim())
    .filter(Boolean);

  return lines.map((seg) => {
    const segLines = seg
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let badge = '';
    let firstLine = segLines[0] ? segLines[0].replace(/^[-*•\d.]+\s*/, '') : '';
    const badgeMatch = firstLine.match(
      /^(\[[^\]]+\]|\([^)]+\)|Step\s*\d+:?|Phase\s*\d+:?|Before\s*(?:AI)?:?|With\s*(?:AI)?:?)/i
    );
    if (badgeMatch) {
      badge = badgeMatch[1].replace(/^[\[\(]|[\)\]:]$/g, '').trim();
      firstLine = firstLine.slice(badgeMatch[0].length).trim();
    }

    let heading = '';
    let body = '';

    const colonSplit = firstLine.split(/\s*[:–—]\s+(.+)/);
    if (colonSplit.length > 1 && colonSplit[1]?.trim()) {
      heading = colonSplit[0].trim();
      body = colonSplit[1].trim();
    } else {
      heading = firstLine;
    }

    const remainingLines = segLines.slice(1);
    const bullets = remainingLines
      .filter((l) => /^[-*•\d.]+\s+/.test(l))
      .map((l) => l.replace(/^[-*•\d.]+\s*/, ''));

    if (remainingLines.length > 0) {
      const nonBullets = remainingLines
        .filter((l) => !/^[-*•\d.]+\s+/.test(l))
        .join(' ');
      if (nonBullets) {
        body = body ? `${body} ${nonBullets}` : nonBullets;
      }
    }

    return {
      badge,
      heading: heading || (segLines.length > 1 ? firstLine : ''),
      body: body || heading || firstLine,
      bullets,
      items: [],
      tags: [],
      imgSrc: '',
      imgAlt: '',
      raw: seg,
    };
  });
}

/**
 * Injects user's content verbatim into design template slots.
 * - targetSlot = 'all': distributes segments across all available card slots
 * - targetSlot = 0, 1, 2...: replaces only that specific card's content, preserving other slots
 * STRICT CRITICAL RULE: NEVER creates nested outer card wrappers (no card inside card).
 * Strictly preserves 100% of user text verbatim.
 */
export function injectContentIntoDesignSlots(
  templateHtml,
  userContent,
  targetSlot = 'all'
) {
  if (!templateHtml) return '';
  if (!userContent) return templateHtml;
  if (typeof userContent === 'string' && !userContent.trim())
    return templateHtml;

  if (typeof window === 'undefined') {
    return templateHtml;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(templateHtml, 'text/html');

    // Identify card slots (either via data-slot or child card containers)
    let slotEls = Array.from(doc.body.querySelectorAll('[data-slot]'));
    if (slotEls.length === 0) {
      slotEls = Array.from(
        doc.body.querySelectorAll(
          'div.group, div[class*="rounded-[2"], div[class*="rounded-2xl"], div[class*="rounded-3xl"], div[class*="rounded-xl"]'
        )
      ).filter(
        (el) =>
          el.parentElement === doc.body.firstElementChild ||
          el.parentElement === doc.body
      );
    }

    const units = Array.isArray(userContent)
      ? userContent
      : extractVerbatimTextSegments(userContent);

    // If template has multiple slots but user provided fewer units (e.g. 1 unit with multiple bullets or sentences),
    // intelligently distribute them across the cards so NO slot is left empty or with mismatched text.
    let distributedUnits = [...units];
    if (
      slotEls.length > distributedUnits.length &&
      distributedUnits.length > 0
    ) {
      if (
        distributedUnits.length === 1 &&
        distributedUnits[0].bullets &&
        distributedUnits[0].bullets.length >= slotEls.length
      ) {
        distributedUnits = distributedUnits[0].bullets
          .slice(0, slotEls.length)
          .map((bText, bIdx) => {
            const colonSplit = bText.split(/\s*[:–—]\s+(.+)/);
            const heading =
              colonSplit.length > 1 ? colonSplit[0] : `Card ${bIdx + 1}`;
            const body = colonSplit.length > 1 ? colonSplit[1] : bText;
            return {
              badge: distributedUnits[0].badge || `Phase 0${bIdx + 1}`,
              heading,
              body,
              bullets: [],
              items: [],
              tags: [],
              imgSrc: '',
              imgAlt: '',
              raw: bText,
            };
          });
      } else if (distributedUnits.length === 1 && distributedUnits[0].body) {
        const sentences = distributedUnits[0].body
          .split(/(?<=[.!?])\s+(?=[A-Z])/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (sentences.length >= slotEls.length) {
          distributedUnits = sentences
            .slice(0, slotEls.length)
            .map((sText, sIdx) => ({
              badge: distributedUnits[0].badge || `Feature 0${sIdx + 1}`,
              heading:
                sIdx === 0 && distributedUnits[0].heading
                  ? distributedUnits[0].heading
                  : `Capability 0${sIdx + 1}`,
              body: sText,
              bullets: [],
              items: [],
              tags: [],
              imgSrc: '',
              imgAlt: '',
              raw: sText,
            }));
        }
      }
    }

    const populateCard = (cardEl, unit, cardIdx = 0) => {
      if (!unit) return;

      const badgeEl = cardEl.querySelector(
        'span[class*="rounded-md"], span[class*="border"], div[class*="uppercase"][class*="text-[1"], div[class*="uppercase"][class*="text-xs"], div[class*="uppercase"][class*="text-sm"]'
      );
      const headingEl = cardEl.querySelector(
        'h1, h2, h3, h4, h5, h6, div[class*="font-extrabold"], div[class*="font-bold"]:not([class*="flex"])'
      );
      const pEl = cardEl.querySelector('p');
      const tagEls = Array.from(
        cardEl.querySelectorAll(
          'span[class*="rounded-full"], span[class*="bg-"]'
        )
      ).filter((el) => el !== badgeEl);
      const imgEl = cardEl.querySelector('img');
      const svgEl = cardEl.querySelector('svg');

      const fullContextText = `${unit.heading || ''} ${unit.body || ''} ${unit.badge || ''} ${unit.raw || ''}`;

      // Populate or Smart-Research Image to match card's topic
      if (imgEl) {
        if (unit.imgSrc) {
          imgEl.setAttribute('src', unit.imgSrc);
          if (unit.imgAlt) imgEl.setAttribute('alt', unit.imgAlt);
        } else {
          const matchedImage = findBestSemanticImage(fullContextText, cardIdx);
          imgEl.setAttribute('src', matchedImage.url);
          imgEl.setAttribute('alt', matchedImage.alt);
        }
      }

      // Populate or Smart-Research SVG Icon to match card's topic
      if (svgEl) {
        const newSvgMarkup = findBestSemanticIcon(fullContextText, cardIdx);
        const tempDiv = doc.createElement('div');
        tempDiv.innerHTML = newSvgMarkup;
        const newSvg = tempDiv.querySelector('svg');
        if (newSvg) {
          const existingSvgClass = svgEl.getAttribute('class');
          if (existingSvgClass) {
            newSvg.setAttribute('class', existingSvgClass);
          }
          svgEl.parentNode.replaceChild(newSvg, svgEl);
        }
      }

      // Populate Badge if unit has one
      if (badgeEl && unit.badge) {
        badgeEl.textContent = unit.badge;
      }

      // Populate Heading if unit has one
      if (headingEl) {
        if (unit.heading) {
          headingEl.textContent = unit.heading;
        } else if (unit.body && !pEl) {
          headingEl.textContent = unit.body;
        } else if (unit.raw && !pEl) {
          headingEl.textContent = unit.raw;
        }
      }

      // Populate Body
      if (pEl) {
        if (unit.body) {
          pEl.textContent = unit.body;
        } else if (unit.heading && !headingEl) {
          pEl.textContent = unit.heading;
        } else if (unit.raw && !headingEl) {
          pEl.textContent = unit.raw;
        }
      }

      // Populate List Bullets (ul > li or ol > li) e.g., in Challenge/Solution cards
      const listEls = Array.from(cardEl.querySelectorAll('ul, ol'));
      if (listEls.length > 0) {
        const bulletData =
          unit.bullets && unit.bullets.length > 0
            ? unit.bullets
            : unit.body && !unit.heading
              ? unit.body
                  .split(/\n|(?<=[.!?])\s+(?=[A-Z])/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];

        if (bulletData.length > 0) {
          listEls.forEach((listEl) => {
            const existingLis = Array.from(listEl.querySelectorAll('li'));
            if (existingLis.length > 0) {
              const liTemplate = existingLis[0].cloneNode(true);
              listEl.innerHTML = '';
              bulletData.forEach((bText) => {
                const li = liTemplate.cloneNode(true);
                const indicator = li.querySelector('span, svg, div');
                if (indicator) {
                  const indClone = indicator.cloneNode(true);
                  li.innerHTML = '';
                  li.appendChild(indClone);
                  li.appendChild(doc.createTextNode(' ' + bText));
                } else {
                  li.textContent = bText;
                }
                listEl.appendChild(li);
              });
            }
          });
        }
      }

      // Populate Row Items (e.g. in Before AI / With AI Matrix)
      const rowEls = Array.from(
        cardEl.querySelectorAll(
          'div[class*="items-center"], div[class*="flex-row"]'
        )
      ).filter(
        (r) =>
          r.querySelector('img') &&
          (r.querySelector('span') || r.querySelector('p'))
      );
      if (
        rowEls.length > 0 &&
        ((unit.items && unit.items.length > 0) ||
          (unit.bullets && unit.bullets.length > 0))
      ) {
        const rowData =
          unit.items && unit.items.length > 0 ? unit.items : unit.bullets;
        rowData.forEach((itemText, rIdx) => {
          if (rowEls[rIdx]) {
            const row = rowEls[rIdx];
            const rowImg = row.querySelector('img');
            if (rowImg) {
              const matchedRowImg = findBestSemanticImage(itemText, rIdx);
              rowImg.setAttribute('src', matchedRowImg.url);
              rowImg.setAttribute('alt', matchedRowImg.alt);
            }
            const textSpan = row.querySelector(
              'span:not([class*="shrink-0"]):not([class*="rounded"]), p, div[class*="text-"]'
            );
            if (textSpan) {
              const words = itemText.trim().split(/\s+/);
              if (
                words.length > 1 &&
                textSpan.querySelector('strong, b, span[class*="font-bold"]')
              ) {
                const boldClass =
                  textSpan
                    .querySelector('span[class*="font-bold"]')
                    ?.getAttribute('class') || 'font-bold';
                textSpan.innerHTML = `<span class="${boldClass}">${words[0]}</span> ${words.slice(1).join(' ')}`;
              } else {
                textSpan.textContent = itemText;
              }
            }
          }
        });
      }

      // Populate Tags
      if (unit.tags && unit.tags.length > 0 && tagEls.length > 0) {
        unit.tags.forEach((tagText, tIdx) => {
          if (tagEls[tIdx]) {
            tagEls[tIdx].textContent = tagText;
          }
        });
      }
    };

    // Target a specific slot (e.g. Card 1 or Card 2)
    if (
      targetSlot !== 'all' &&
      targetSlot !== null &&
      targetSlot !== undefined
    ) {
      const slotIndex = parseInt(targetSlot, 10);
      if (!isNaN(slotIndex) && slotEls[slotIndex]) {
        const unit = distributedUnits[0] || {
          badge: '',
          heading: '',
          body: typeof userContent === 'string' ? userContent : '',
          tags: [],
          imgSrc: '',
          imgAlt: '',
          raw: typeof userContent === 'string' ? userContent : '',
        };
        populateCard(slotEls[slotIndex], unit, slotIndex);
        return sanitizeTailwindClasses(doc.body.innerHTML.trim());
      }
    }

    // Distribute across all slots
    slotEls.forEach((cardEl, idx) => {
      if (distributedUnits[idx]) {
        populateCard(cardEl, distributedUnits[idx], idx);
      }
    });

    return sanitizeTailwindClasses(doc.body.innerHTML.trim());
  } catch (err) {
    console.warn('Error injecting content into design slots:', err);
    return sanitizeTailwindClasses(templateHtml);
  }
}

/**
 * Intelligent Auto Design Matcher
 * Analyzes the user's content structure (card count, image presence, icon patterns, comparison keywords, metrics, step workflows)
 * and automatically picks the best matching design from DESIGN_CATALOG.
 */
export function autoSelectBestDesign(content) {
  if (!content || typeof content !== 'string') {
    return {
      template: DESIGN_CATALOG[0],
      targetSlot: 'all',
      reason: 'Challenge vs AI Solution Split Cards',
    };
  }

  const textLower = content.toLowerCase();
  const units = extractVerbatimTextSegments(content);
  const count = units.length;

  // 1. Direct Hazwoper Archetype Matching
  // A. Challenge vs AI Solution Split Cards
  if (
    /\b(challenge|obstacle|problem.*solution|how ai can help|split cards?)\b/i.test(
      textLower
    )
  ) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'split-media-challenge-solution') ||
      DESIGN_CATALOG[0];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Challenge vs AI Solution Split Cards (Two-Tone Split Media Frame with Rotating Dashed Ring).',
    };
  }

  // B. Comparative Before AI vs With AI Matrix
  if (
    /\b(before ai|with ai|transformation matrix|before and after|before vs after|comparison matrix)\b/i.test(
      textLower
    )
  ) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'comparative-before-after-matrix') ||
      DESIGN_CATALOG[1];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Comparative Before AI vs With AI Transformation Matrix (Dual Glow Progress Bar & Interactive Rows).',
    };
  }

  // C. Executive Multi-Color Feature Highlight Cards
  if (
    /\b(spectrum|multi-color|feature stream|feature rows?|email autocomplete|spam filter|appointment reminder|voice assistant)\b/i.test(
      textLower
    )
  ) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'feature-rows-multi-color-stream') ||
      DESIGN_CATALOG[2];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Executive Multi-Color Feature Stream (5-Color Spectrum, Accent Borders & Animated Slider Line).',
    };
  }

  // D. AI-Powered Capability Showcase Grid (5-column / apps)
  if (
    /\b(ecosystem|capability showcase|showcase grid|5 column|netflix|spotify|bank fraud|google maps|amazon|social media|ai powered)\b/i.test(
      textLower
    )
  ) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'ai-powered-ecosystem-showcase') ||
      DESIGN_CATALOG[3];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched AI-Powered Capability Showcase Grid (5-Column Responsive Matrix with Rotating Dashed Badges).',
    };
  }

  // E. Executive Compliance & Medical/Legal Advisory Card (Design 2)
  if (
    /\b(disclaimer|legal|medical|advice|liability|educational purposes|adequately trained|compliance.*advisory|shield callout)\b/i.test(
      textLower
    )
  ) {
    const template =
      DESIGN_CATALOG.find(
        (d) => d.id === 'advisory-compliance-shield-callout'
      ) || DESIGN_CATALOG[1];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Executive Compliance & Medical/Legal Advisory Card (Concentric Shield Media & Expanding Divider).',
    };
  }

  // F. Reference Citation & Source Link Card (Design 3/4)
  if (
    /\b(reference|citation|index report|stanford|hai\.stanford|read the original article|source link|academic cite|bibliography)\b/i.test(
      textLower
    )
  ) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'reference-citation-source-card') ||
      DESIGN_CATALOG[2];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Reference Citation & Source Link Card (Top Spectrum Line & Interactive Link Button).',
    };
  }

  // G. 3-Pillar Numbered Core Principles (Design 6)
  if (
    /\b(principles|numbered.*pillars?|3\s*pillars?|context.*patterns|human expertise|01 context|02 patterns|03 human)\b/i.test(
      textLower
    )
  ) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'numbered-core-principles-trio') ||
      DESIGN_CATALOG[5];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched 3-Pillar Numbered Core Principles (01-03 Number Badges, Rotate-270 Rings & Tracking Micro-Motion).',
    };
  }

  // H. 6-Role Capability Executive Grid (Design 7)
  if (
    /\b(supervisors|operations teams|healthcare staff|warehouse and field|customer-facing|managers|role capability|team roles|role matrix|across roles)\b/i.test(
      textLower
    )
  ) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'role-capability-executive-matrix') ||
      DESIGN_CATALOG[6];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched 6-Role Capability Executive Grid (360 Rotating Borders, Dot-Grid Mask & Pulsing Halo Tiles).',
    };
  }

  // 2. Check for Images or Media references
  const hasImage =
    /<img\b/i.test(content) ||
    /\b(image|photo|thumbnail|banner|illustration|graphic|figure)\b/i.test(
      textLower
    ) ||
    /https?:\/\/[^\s"']+\.(png|jpe?g|webp|gif|svg)/i.test(content);

  if (hasImage) {
    const template =
      DESIGN_CATALOG.find(
        (d) => d.id === 'horizontal-media-img-left-text-right'
      ) || DESIGN_CATALOG[4];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Visual Narrative Template (Image Left / Text Right) with desktop sizing constraints.',
    };
  }

  // 3. If explicit 2 items or 2 comparison cards
  const isComparison =
    count === 2 ||
    /\b(vs|versus|before|after|traditional|manual|automated|problem|solution|pros|cons|baseline)\b/i.test(
      textLower
    );

  // 4. Process / steps (1. 2. 3. 4. or step/phase keywords with 4 steps)
  const isProcess =
    count === 4 ||
    /\b(step 1|step 2|stage 1|phase 01|step 01|milestone 1)\b/i.test(textLower);

  // 5. Strict Metrics (Actual numerical percentages or dollar amounts)
  const hasNumbers = /\b\d+(\.\d+)?%\b|\$\d+|\b\d+x\b/i.test(content);
  const isMetrics =
    hasNumbers &&
    /\b(kpi|metric|metrics|stats|growth|roi|accuracy|speedup)\b/i.test(
      textLower
    );

  // 6. Left Icon / Feature patterns
  const isIconHeader =
    /\b(feature|benefit|capability|module|shield|fast|secure|cloud|sync)\b/i.test(
      textLower
    ) || /<svg\b|<i\b/i.test(content);

  if (isComparison || count === 2) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'split-media-challenge-solution') ||
      DESIGN_CATALOG.find((d) => d.id === 'icon-lead-cards-duo') ||
      DESIGN_CATALOG[0];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Challenge vs AI Solution Split Cards for 2-card comparison.',
    };
  }

  if (isMetrics && count >= 3) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'triple-metrics-kpi-amber') ||
      DESIGN_CATALOG[10];
    return {
      template,
      targetSlot: 'all',
      reason: 'Matched Key Metrics & Stats template for numerical figures.',
    };
  }

  if (isProcess || count === 4) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'quad-roadmap-pipeline-indigo') ||
      DESIGN_CATALOG[9];
    return {
      template,
      targetSlot: 'all',
      reason: 'Matched 4-Stage Execution Roadmap template for workflow phases.',
    };
  }

  if (count === 5) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'feature-rows-multi-color-stream') ||
      DESIGN_CATALOG.find((d) => d.id === 'ai-powered-ecosystem-showcase') ||
      DESIGN_CATALOG[2];
    return {
      template,
      targetSlot: 'all',
      reason: 'Matched 5-Item Feature Highlight Stream for 5 structured units.',
    };
  }

  if (count === 3 || isIconHeader) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'icon-lead-triple-grid') ||
      DESIGN_CATALOG[7];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched 3-Column Left-Icon Architecture (Icons Left / Text Right).',
    };
  }

  const fallback =
    DESIGN_CATALOG.find((d) => d.id === 'split-media-challenge-solution') ||
    DESIGN_CATALOG[0];
  return {
    template: fallback,
    targetSlot: 'all',
    reason:
      'Matched Challenge vs AI Solution Split Cards with responsive desktop/mobile layouts.',
  };
}

/**
 * Detects if the HTML is an already constructed presentation card architecture
 */
export function isExistingCardDesign(html) {
  if (!html || typeof html !== 'string') return false;
  return (
    /class=["'][^"']*\bgroup\b[^"']*\brelative\b[^"']*/i.test(html) ||
    /data-slot=/i.test(html) ||
    /faded-corner-circle/i.test(html) ||
    /(?:border-t-\[6px\]|border-l-\[6px\]|border-l-\[7px\])/i.test(html) ||
    /min-\[998px\]:border-l/i.test(html)
  );
}

/**
 * Surgically applies incremental adjustments (border colors, backgrounds, layout columns,
 * text tweaks, or animations) to an ALREADY FINALIZED card design.
 * Guarantees that only the targeted attribute changes while 100% of all cards, elements,
 * images, icons, and text are preserved completely.
 */
export function applyIncrementalPromptToHtml(html, customPrompt, options = {}) {
  if (!html || typeof html !== 'string') return '';
  if (!customPrompt || typeof customPrompt !== 'string' || !customPrompt.trim())
    return html;
  if (typeof window === 'undefined') return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const promptLower = customPrompt.trim().toLowerCase();

    // 1. Color Palette Resolution
    const colorMap = {
      amber: {
        hex: '#d97706',
        borderOuter: 'border-[rgba(217,119,6,0.22)]',
        borderTop: 'border-t-[#d97706]',
        borderLeft: 'md:border-l-[#d97706] min-[998px]:border-l-[#d97706]',
        glow: 'bg-amber-500/20 group-hover:bg-amber-500/35',
        ring: 'border-amber-500/15 group-hover:border-amber-500/25',
        badge:
          'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
        headingText: 'text-amber-600 dark:text-amber-400',
        dashed: 'border-[#d97706eb]',
        dot: 'bg-[#d97706]',
        bar: 'bg-[#d97706]',
      },
      emerald: {
        hex: '#10b981',
        borderOuter: 'border-[rgba(16,185,129,0.22)]',
        borderTop: 'border-t-[#10b981]',
        borderLeft: 'md:border-l-[#10b981] min-[998px]:border-l-[#10b981]',
        glow: 'bg-emerald-500/20 group-hover:bg-emerald-500/35',
        ring: 'border-emerald-500/15 group-hover:border-emerald-500/25',
        badge:
          'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        headingText: 'text-emerald-600 dark:text-emerald-400',
        dashed: 'border-[#10b981eb]',
        dot: 'bg-[#10b981]',
        bar: 'bg-[#10b981]',
      },
      green: {
        hex: '#16a34a',
        borderOuter: 'border-[rgba(22,163,74,0.22)]',
        borderTop: 'border-t-[#16a34a]',
        borderLeft: 'md:border-l-[#16a34a] min-[998px]:border-l-[#16a34a]',
        glow: 'bg-green-500/20 group-hover:bg-green-500/35',
        ring: 'border-green-500/15 group-hover:border-green-500/25',
        badge:
          'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20',
        headingText: 'text-green-600 dark:text-green-400',
        dashed: 'border-[#16a34aeb]',
        dot: 'bg-[#16a34a]',
        bar: 'bg-[#16a34a]',
      },
      blue: {
        hex: '#2563eb',
        borderOuter: 'border-[rgba(37,99,235,0.22)]',
        borderTop: 'border-t-[#2563eb]',
        borderLeft: 'md:border-l-[#2563eb] min-[998px]:border-l-[#2563eb]',
        glow: 'bg-blue-500/20 group-hover:bg-blue-500/35',
        ring: 'border-blue-500/15 group-hover:border-blue-500/25',
        badge:
          'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
        headingText: 'text-blue-600 dark:text-blue-400',
        dashed: 'border-[#2563ebeb]',
        dot: 'bg-[#2563eb]',
        bar: 'bg-[#2563eb]',
      },
      ocean: {
        hex: '#205f99',
        borderOuter: 'border-[rgba(32,95,153,0.22)]',
        borderTop: 'border-t-[#205f99]',
        borderLeft: 'md:border-l-[#205f99] min-[998px]:border-l-[#205f99]',
        glow: 'bg-[#205f99]/20 group-hover:bg-[#205f99]/35',
        ring: 'border-[#205f99]/15 group-hover:border-[#205f99]/25',
        badge:
          'text-[#205f99] dark:text-sky-400 bg-blue-500/10 border-blue-500/20',
        headingText: 'text-[#205f99] dark:text-sky-400',
        dashed: 'border-[#205f99eb]',
        dot: 'bg-[#205f99]',
        bar: 'bg-[#205f99]',
      },
      purple: {
        hex: '#9333ea',
        borderOuter: 'border-[rgba(147,51,234,0.22)]',
        borderTop: 'border-t-[#9333ea]',
        borderLeft: 'md:border-l-[#9333ea] min-[998px]:border-l-[#9333ea]',
        glow: 'bg-purple-500/20 group-hover:bg-purple-500/35',
        ring: 'border-purple-500/15 group-hover:border-purple-500/25',
        badge:
          'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
        headingText: 'text-purple-600 dark:text-purple-400',
        dashed: 'border-[#9333eaeb]',
        dot: 'bg-[#9333ea]',
        bar: 'bg-[#9333ea]',
      },
      indigo: {
        hex: '#4f46e5',
        borderOuter: 'border-[rgba(79,70,229,0.22)]',
        borderTop: 'border-t-[#4f46e5]',
        borderLeft: 'md:border-l-[#4f46e5] min-[998px]:border-l-[#4f46e5]',
        glow: 'bg-indigo-500/20 group-hover:bg-indigo-500/35',
        ring: 'border-indigo-500/15 group-hover:border-indigo-500/25',
        badge:
          'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        headingText: 'text-indigo-600 dark:text-indigo-400',
        dashed: 'border-[#4f46e5eb]',
        dot: 'bg-[#4f46e5]',
        bar: 'bg-[#4f46e5]',
      },
      rose: {
        hex: '#e11d48',
        borderOuter: 'border-[rgba(225,29,72,0.22)]',
        borderTop: 'border-t-[#e11d48]',
        borderLeft: 'md:border-l-[#e11d48] min-[998px]:border-l-[#e11d48]',
        glow: 'bg-rose-500/20 group-hover:bg-rose-500/35',
        ring: 'border-rose-500/15 group-hover:border-rose-500/25',
        badge:
          'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
        headingText: 'text-rose-600 dark:text-rose-400',
        dashed: 'border-[#e11d48eb]',
        dot: 'bg-[#e11d48]',
        bar: 'bg-[#e11d48]',
      },
      red: {
        hex: '#dc2626',
        borderOuter: 'border-[rgba(220,38,38,0.22)]',
        borderTop: 'border-t-[#dc2626]',
        borderLeft: 'md:border-l-[#dc2626] min-[998px]:border-l-[#dc2626]',
        glow: 'bg-red-500/20 group-hover:bg-red-500/35',
        ring: 'border-red-500/15 group-hover:border-red-500/25',
        badge: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
        headingText: 'text-red-600 dark:text-red-400',
        dashed: 'border-[#dc2626eb]',
        dot: 'bg-[#dc2626]',
        bar: 'bg-[#dc2626]',
      },
      cyan: {
        hex: '#0891b2',
        borderOuter: 'border-[rgba(8,145,178,0.22)]',
        borderTop: 'border-t-[#0891b2]',
        borderLeft: 'md:border-l-[#0891b2] min-[998px]:border-l-[#0891b2]',
        glow: 'bg-cyan-500/20 group-hover:bg-cyan-500/35',
        ring: 'border-cyan-500/15 group-hover:border-cyan-500/25',
        badge:
          'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        headingText: 'text-cyan-600 dark:text-cyan-400',
        dashed: 'border-[#0891b2eb]',
        dot: 'bg-[#0891b2]',
        bar: 'bg-[#0891b2]',
      },
      teal: {
        hex: '#0d9488',
        borderOuter: 'border-[rgba(13,148,136,0.22)]',
        borderTop: 'border-t-[#0d9488]',
        borderLeft: 'md:border-l-[#0d9488] min-[998px]:border-l-[#0d9488]',
        glow: 'bg-teal-500/20 group-hover:bg-teal-500/35',
        ring: 'border-teal-500/15 group-hover:border-teal-500/25',
        badge:
          'text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20',
        headingText: 'text-teal-600 dark:text-teal-400',
        dashed: 'border-[#0d9488eb]',
        dot: 'bg-[#0d9488]',
        bar: 'bg-[#0d9488]',
      },
      orange: {
        hex: '#ea580c',
        borderOuter: 'border-[rgba(234,88,12,0.22)]',
        borderTop: 'border-t-[#ea580c]',
        borderLeft: 'md:border-l-[#ea580c] min-[998px]:border-l-[#ea580c]',
        glow: 'bg-orange-500/20 group-hover:bg-orange-500/35',
        ring: 'border-orange-500/15 group-hover:border-orange-500/25',
        badge:
          'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
        headingText: 'text-orange-600 dark:text-orange-400',
        dashed: 'border-[#ea580ceb]',
        dot: 'bg-[#ea580c]',
        bar: 'bg-[#ea580c]',
      },
    };

    // Check for custom hex code in prompt (e.g. #ff0055)
    const customHexMatch = promptLower.match(/#[0-9a-f]{3,8}\b/i);
    let matchedColor = null;

    if (customHexMatch) {
      const hex = customHexMatch[0];
      matchedColor = {
        hex,
        borderOuter: `border-[${hex}]/25`,
        borderTop: `border-t-[${hex}]`,
        borderLeft: `md:border-l-[${hex}] min-[998px]:border-l-[${hex}]`,
        glow: `bg-[${hex}]/20 group-hover:bg-[${hex}]/35`,
        ring: `border-[${hex}]/15 group-hover:border-[${hex}]/25`,
        badge: `text-[${hex}] border-[${hex}]/25 bg-[${hex}]/10`,
        headingText: `text-[${hex}]`,
        dashed: `border-[${hex}eb]`,
        dot: `bg-[${hex}]`,
        bar: `bg-[${hex}]`,
      };
    } else {
      // Find color name
      for (const [colorName, palette] of Object.entries(colorMap)) {
        if (new RegExp(`\\b${colorName}\\b`, 'i').test(promptLower)) {
          matchedColor = palette;
          break;
        }
      }
    }

    // Find cards in the DOM
    const cards = Array.from(
      doc.body.querySelectorAll(
        '[data-slot], div.group, div[class*="rounded-[22px]"], div[class*="rounded-[26px]"], div[class*="rounded-2xl"]'
      )
    ).filter((c) => {
      const cls = c.getAttribute('class') || '';
      return (
        cls.includes('group') ||
        c.hasAttribute('data-slot') ||
        cls.includes('shadow-')
      );
    });

    // 2. APPLY BORDER COLOR CHANGE IF REQUESTED
    const isBorderChange =
      /\b(border|stroke|accent|outline)\b/i.test(promptLower) ||
      (matchedColor &&
        !/\b(background|bg|font|text\s*only)\b/i.test(promptLower));

    if (isBorderChange && matchedColor && cards.length > 0) {
      cards.forEach((card) => {
        let cls = card.getAttribute('class') || '';

        // Replace border-t-
        cls = cls.replace(
          /border-t-\[[^\]]+\]|border-t-[a-z0-9\/-]+/g,
          matchedColor.borderTop
        );
        // Replace border-l-
        cls = cls.replace(
          /(?:min-\[998px\]:border-l-\[[^\]]+\]|md:border-l-\[[^\]]+\]|border-l-\[[^\]]+\]|border-l-[a-z0-9\/-]+)/g,
          matchedColor.borderLeft
        );
        // Replace card outer border color
        cls = cls.replace(
          /border-\[[^\]]+\]|border-[a-z]+-[0-9]+(?:\/[0-9]+)?/g,
          (match) => {
            if (
              match.startsWith('border-t-') ||
              match.startsWith('border-l-') ||
              match.includes('border-t-0')
            )
              return match;
            return matchedColor.borderOuter;
          }
        );

        card.setAttribute('class', cls);

        // Update rotating dashed ring border color if present
        card
          .querySelectorAll('div[class*="border-dashed"]')
          .forEach((dashedEl) => {
            let dCls = dashedEl.getAttribute('class') || '';
            dCls = dCls.replace(
              /border-\[[^\]]+\]|border-[a-z]+-[0-9]+(?:\/[0-9]+)?/g,
              matchedColor.dashed
            );
            dashedEl.setAttribute('class', dCls);
          });

        // Update corner dot color if present
        card
          .querySelectorAll(
            'div[class*="w-[8px]"][class*="rounded-full"], div[class*="w-2"][class*="rounded-full"]'
          )
          .forEach((dotEl) => {
            let dotCls = dotEl.getAttribute('class') || '';
            dotCls = dotCls.replace(
              /bg-\[[^\]]+\]|bg-[a-z]+-[0-9]+/g,
              matchedColor.dot
            );
            dotEl.setAttribute('class', dotCls);
          });

        // Update bottom expanding accent line if present
        card
          .querySelectorAll(
            'div[class*="h-1"], div[class*="h-[3px]"], div[class*="h-[4px]"]'
          )
          .forEach((barEl) => {
            let barCls = barEl.getAttribute('class') || '';
            if (barCls.includes('rounded') || barCls.includes('mt-auto')) {
              barCls = barCls.replace(
                /bg-\[[^\]]+\]|bg-[a-z]+-[0-9]+/g,
                matchedColor.bar
              );
              barEl.setAttribute('class', barCls);
            }
          });

        // Update corner glow circles if present
        card.querySelectorAll('.faded-corner-circle').forEach((circleEl) => {
          let cCls = circleEl.getAttribute('class') || '';
          cCls = cCls.replace(
            /bg-\[[^\]]+\]\/[0-9]+|bg-[a-z]+-[0-9]+\/[0-9]+/g,
            matchedColor.glow.split(' ')[0]
          );
          circleEl.setAttribute('class', cCls);
        });

        // Update card headings matching the border accent if requested
        if (
          /\b(header|heading|title|text\s*color)\b/i.test(promptLower) ||
          !/\b(border\s*only)\b/i.test(promptLower)
        ) {
          card.querySelectorAll('h1, h2, h3, h4').forEach((h) => {
            let hCls = h.getAttribute('class') || '';
            if (
              /text-\[[^\]]+\]|text-(?:blue|emerald|amber|purple|indigo|rose|cyan|teal|sky)-[0-9]+/i.test(
                hCls
              )
            ) {
              hCls = hCls.replace(
                /text-\[[^\]]+\]|text-[a-z]+-[0-9]+/g,
                matchedColor.headingText.split(' ')[0]
              );
              h.setAttribute('class', hCls);
            }
          });
        }
      });
    }

    // 3. APPLY BACKGROUND / THEME CHANGE IF REQUESTED
    if (/\b(dark|black|slate-900|slate-950|night)\b/i.test(promptLower)) {
      cards.forEach((card) => {
        let cls = card.getAttribute('class') || '';
        cls = cls.replace(
          /from-white\s+to-\[[^\]]+\]/g,
          'from-slate-900 via-slate-900 to-slate-950 text-slate-100'
        );
        cls = cls.replace(
          /bg-gradient-to-br\s+from-white/g,
          'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-slate-100'
        );
        card.setAttribute('class', cls);
        card.querySelectorAll('p, li, span').forEach((p) => {
          let pCls = p.getAttribute('class') || '';
          pCls = pCls.replace(
            /text-slate-600|text-slate-700|text-slate-800/g,
            'text-slate-300'
          );
          p.setAttribute('class', pCls);
        });
      });
    } else if (/\b(light|white|bright)\b/i.test(promptLower)) {
      cards.forEach((card) => {
        let cls = card.getAttribute('class') || '';
        cls = cls.replace(
          /from-slate-900\s+(?:via-slate-900\s+)?to-slate-950/g,
          'from-white to-[#f0f9ff]'
        );
        cls = cls.replace(/text-slate-100|text-white/g, 'text-slate-900');
        card.setAttribute('class', cls);
      });
    }

    // 4. APPLY GRID COLUMN CHANGES IF REQUESTED
    if (
      /\b(1\s*row\s*2\s*col|2\s*col|two\s*col|2\s*in\s*1\s*row)\b/i.test(
        promptLower
      )
    ) {
      const container = doc.body.querySelector(
        '[class*="grid-cols"], [class*="flex-wrap"]'
      );
      if (container) {
        let cCls = container.getAttribute('class') || '';
        cCls = cCls.replace(/grid-cols-[0-9]+/g, 'grid-cols-1 md:grid-cols-2');
        container.setAttribute('class', cCls);
      }
    } else if (
      /\b(3\s*col|three\s*col|3\s*in\s*1\s*row)\b/i.test(promptLower)
    ) {
      const container = doc.body.querySelector(
        '[class*="grid-cols"], [class*="flex-wrap"]'
      );
      if (container) {
        let cCls = container.getAttribute('class') || '';
        cCls = cCls.replace(
          /grid-cols-[0-9]+/g,
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        );
        container.setAttribute('class', cCls);
      }
    } else if (
      /\b(1\s*col|single\s*column|stacked|vertical)\b/i.test(promptLower)
    ) {
      const container = doc.body.querySelector(
        '[class*="grid-cols"], [class*="flex-wrap"]'
      );
      if (container) {
        let cCls = container.getAttribute('class') || '';
        cCls = cCls.replace(
          /grid-cols-[0-9]+/g,
          'grid-cols-1 max-w-4xl mx-auto'
        );
        container.setAttribute('class', cCls);
      }
    }

    // 5. APPLY SIGNATURE ANIMATIONS & CHALLENGE CIRCLES IF REQUESTED
    if (
      /\b(circle|animation|motion|dashed|hover|the\s*challenge|challenge\s*style)\b/i.test(
        promptLower
      )
    ) {
      cards.forEach((card) => {
        const img = card.querySelector('img');
        const hasDashed = card.querySelector('div[class*="border-dashed"]');
        if (img && !hasDashed) {
          const parent = img.parentElement;
          if (parent) {
            const hex = matchedColor?.hex || '#205f99';
            const dashedRing = doc.createElement('div');
            dashedRing.setAttribute(
              'class',
              `absolute border-2 border-[${hex}eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[135deg] group-hover:scale-[1.10] h-[98px] w-[98px] sm:h-[110px] sm:w-[110px] rounded-full transition-all`
            );
            if (!parent.classList.contains('relative'))
              parent.classList.add('relative');
            if (!parent.classList.contains('rounded-full'))
              parent.classList.add('rounded-full');
            parent.insertBefore(dashedRing, img);
            img.classList.add(
              'transition-all',
              'duration-700',
              'ease-out',
              'group-hover:scale-[1.08]',
              'rounded-full',
              'border-2'
            );
          }
        }
      });
      return applyHoverAnimationsAndCornerGlow(
        doc.body.innerHTML.trim(),
        options
      );
    }

    // 6. DYNAMICALLY ADD NEW CARDS IF REQUESTED (e.g. "add card for Quality Assurance", "add a card", "add one more card")
    if (
      /\b(add\s+(?:a\s+|one\s+|1\s+|another\s+)?card|new\s+card|create\s+card)\b/i.test(
        promptLower
      )
    ) {
      if (cards.length > 0) {
        const lastCard = cards[cards.length - 1];
        const newCard = lastCard.cloneNode(true);
        const newCardIndex = cards.length;

        // Update data-slot
        newCard.setAttribute('data-slot', String(newCardIndex));

        // Update animation delay
        let cls = newCard.getAttribute('class') || '';
        cls = cls.replace(
          /\[animation-delay:[^\]]+\]/g,
          `[animation-delay:${(newCardIndex * 0.15).toFixed(2)}s]`
        );
        cls = cls.replace(
          /animate-\[fadeIn_\.6s_ease_\.[0-9]+s_forwards\]/g,
          `animate-[fadeIn_.6s_ease_.${newCardIndex + 1}s_forwards]`
        );
        newCard.setAttribute('class', cls);

        // Extract title from prompt
        const titleMatch = customPrompt.match(
          /(?:for|named|titled|called|about|with\s+title)\s+["']?([^"'\n,;.]+)["']?/i
        );
        const cardTitle = titleMatch
          ? titleMatch[1].trim()
          : `Card ${newCardIndex + 1}`;

        // Update heading
        const headingEl = newCard.querySelector(
          'h1, h2, h3, h4, h5, div[class*="font-extrabold"], div[class*="font-bold"]:not([class*="flex"])'
        );
        if (headingEl) {
          headingEl.textContent = cardTitle;
        }

        // If it has number badge (Design 6 style "01", "02", "03"), update number
        const numberEl = Array.from(newCard.querySelectorAll('div, span')).find(
          (el) => /^\s*0?\d\s*$/.test(el.textContent.trim())
        );
        if (numberEl) {
          numberEl.textContent = String(newCardIndex + 1).padStart(2, '0');
        }

        // Update paragraph body
        const pEl = newCard.querySelector('p');
        if (pEl) {
          pEl.textContent = `Optimized ${cardTitle.toLowerCase()} workflows with responsive automation and precision monitoring.`;
        }

        // Update Image/Icon if present
        const imgEl = newCard.querySelector('img');
        if (imgEl) {
          const matchedImg = findBestSemanticImage(cardTitle, newCardIndex);
          imgEl.setAttribute('src', matchedImg.url);
          imgEl.setAttribute('alt', matchedImg.alt || cardTitle);
        }

        // Append new card into container
        if (lastCard.parentElement) {
          lastCard.parentElement.appendChild(newCard);
        }
      }
    }

    return doc.body.innerHTML.trim();
  } catch (err) {
    console.warn('Error applying incremental edit:', err);
    return html;
  }
}

/**
 * Intelligent Prompt-Driven Structural & Style Transformer
 * Translates natural language layout prompts directly into responsive, battle-tested Tailwind HTML architectures while preserving 100% verbatim content.
 * Supports both incremental edits on existing cards AND fresh card synthesis with the signature "The Challenge" motion design.
 */
export function applyCustomPromptToHtml(html, customPrompt = '', options = {}) {
  const {
    animateOnHover = true,
    themeColor = 'ocean',
    isIncremental = false,
  } = options;
  if (!html || typeof html !== 'string') return '';

  const promptLower = (customPrompt || '').toLowerCase();

  // 1. If this is already an enhanced card design and the user requested an incremental change:
  if (isIncremental || isExistingCardDesign(html)) {
    const isNewTemplateRequest =
      /\b(challenge\s*vs\s*solution|split\s*cards?|the\s*challenge|ai\s*solution|before\s*ai|with\s*ai|transformation\s*matrix|showcase\s*grid|5\s*cols?|advisory|compliance|shield\s*callout|reference|citation|numbered\s*core|3\s*pillars?|role\s*capability|executive\s*matrix)\b/i.test(
        promptLower
      );

    if (!isNewTemplateRequest && customPrompt && customPrompt.trim()) {
      return applyIncrementalPromptToHtml(html, customPrompt, options);
    }
  }

  // 2. Direct Template Archetype Matching from Custom Prompt
  // A. Challenge vs Solution Split Cards (Design 1)
  if (
    /\b(challenge\s*vs\s*solution|split\s*cards?|the\s*challenge|ai\s*solution)\b/i.test(
      promptLower
    )
  ) {
    const template = DESIGN_CATALOG.find(
      (d) => d.id === 'split-media-challenge-solution'
    );
    if (template)
      return injectContentIntoDesignSlots(template.enhanced_html, html, 'all');
  }

  // B. Compliance & Advisory Shield Card (Design 2)
  if (
    /\b(advisory|compliance|legal|medical|disclaimer|shield\s*callout)\b/i.test(
      promptLower
    )
  ) {
    const template = DESIGN_CATALOG.find(
      (d) => d.id === 'advisory-compliance-shield-callout'
    );
    if (template)
      return injectContentIntoDesignSlots(template.enhanced_html, html, 'all');
  }

  // C. Reference Citation & Source Link Card (Design 3/4)
  if (
    /\b(reference|citation|source\s*card|source\s*link|academic\s*cite)\b/i.test(
      promptLower
    )
  ) {
    const template = DESIGN_CATALOG.find(
      (d) => d.id === 'reference-citation-source-card'
    );
    if (template)
      return injectContentIntoDesignSlots(template.enhanced_html, html, 'all');
  }

  // D. Before AI vs With AI Transformation Matrix
  if (
    /\b(before\s*ai|with\s*ai|transformation\s*matrix|before\s*after\s*matrix)\b/i.test(
      promptLower
    )
  ) {
    const template = DESIGN_CATALOG.find(
      (d) => d.id === 'comparative-before-after-matrix'
    );
    if (template)
      return injectContentIntoDesignSlots(template.enhanced_html, html, 'all');
  }

  // E. Executive Multi-Color Feature Highlight Cards (Design 8)
  if (
    /\b(multi\s*color\s*stream|feature\s*rows?|color\s*spectrum|skill\s*rows?)\b/i.test(
      promptLower
    )
  ) {
    const template = DESIGN_CATALOG.find(
      (d) => d.id === 'feature-rows-multi-color-stream'
    );
    if (template)
      return injectContentIntoDesignSlots(template.enhanced_html, html, 'all');
  }

  // F. AI-Powered Capability Showcase Grid (Design 5)
  if (
    /\b(showcase\s*grid|5\s*cols?|5\s*columns?|ai\s*powered\s*grid|ecosystem\s*grid)\b/i.test(
      promptLower
    )
  ) {
    const template = DESIGN_CATALOG.find(
      (d) => d.id === 'ai-powered-ecosystem-showcase'
    );
    if (template)
      return injectContentIntoDesignSlots(template.enhanced_html, html, 'all');
  }

  // G. 3-Pillar Numbered Core Principles (Design 6)
  if (
    /\b(numbered\s*core\s*principles|3\s*pillars?|numbered\s*pillars?|context\s*patterns\s*expertise|numbered\s*trio)\b/i.test(
      promptLower
    )
  ) {
    const template = DESIGN_CATALOG.find(
      (d) => d.id === 'numbered-core-principles-trio'
    );
    if (template)
      return injectContentIntoDesignSlots(template.enhanced_html, html, 'all');
  }

  // H. 6-Role Capability Executive Grid (Design 7)
  if (
    /\b(role\s*capability|executive\s*matrix|6\s*roles?|roles\s*grid|team\s*capability\s*matrix)\b/i.test(
      promptLower
    )
  ) {
    const template = DESIGN_CATALOG.find(
      (d) => d.id === 'role-capability-executive-matrix'
    );
    if (template)
      return injectContentIntoDesignSlots(template.enhanced_html, html, 'all');
  }

  const units = extractVerbatimTextSegments(html);
  const count = units.length;

  // 3. Synthesize Fresh Modern Presentation Cards with Signature Motions & Rotating Rings
  if (units.length >= 1) {
    // 3A. SYNTHESIZE DESIGN 6 (3-Pillar Numbered Core Principles: 01, 02, 03... with Rotate-270 rings & micro-motion)
    if (
      /\b(design\s*6|numbered|pillars?|core\s*principles)\b/i.test(promptLower)
    ) {
      const design6Palettes = [
        {
          borderTop: 'border-t-[#205f99]',
          borderOuter: 'border-[#205f99]/15',
          bg: 'from-white via-[#f7fbff] to-[#e8f4fd]',
          glow: 'bg-[#205f99]/[0.07] group-hover:bg-[#205f99]/[0.13]',
          circle: 'border-[#205f99]/10 group-hover:border-[#205f99]/25',
          numBg: 'bg-[#205f99] shadow-[0_8px_20px_rgba(32,95,153,0.28)]',
          ring: 'border-[#205f99cc]',
          heading: 'text-[#205f99]',
          bar: 'bg-[#205f99] group-hover:shadow-[0_0_18px_rgba(32,95,153,0.45)]',
        },
        {
          borderTop: 'border-t-[#10b981]',
          borderOuter: 'border-[#10b981]/15',
          bg: 'from-white via-[#f9fffb] to-[#e5faec]',
          glow: 'bg-[#10b981]/[0.07] group-hover:bg-[#10b981]/[0.14]',
          circle: 'border-[#10b981]/10 group-hover:border-[#10b981]/25',
          numBg: 'bg-[#10b981] shadow-[0_8px_20px_rgba(16,185,129,0.28)]',
          ring: 'border-[#09704eba]',
          heading: 'text-[#079669]',
          bar: 'bg-[#10b981] group-hover:shadow-[0_0_18px_rgba(16,185,129,0.45)]',
        },
        {
          borderTop: 'border-t-[#f59e0b]',
          borderOuter: 'border-[#f59e0b]/15',
          bg: 'from-white via-[#fffdf5] to-[#fff8df]',
          glow: 'bg-[#f59e0b]/[0.08] group-hover:bg-[#f59e0b]/[0.15]',
          circle: 'border-[#f59e0b]/10 group-hover:border-[#f59e0b]/25',
          numBg: 'bg-[#f59e0b] shadow-[0_8px_20px_rgba(245,158,11,0.28)]',
          ring: 'border-[#f59e0bcc]',
          heading: 'text-[#d88900]',
          bar: 'bg-[#f59e0b] group-hover:shadow-[0_0_18px_rgba(245,158,11,0.45)]',
        },
        {
          borderTop: 'border-t-[#7c3aed]',
          borderOuter: 'border-purple-500/15',
          bg: 'from-white via-[#fcfaff] to-[#f3e8ff]',
          glow: 'bg-purple-500/[0.08] group-hover:bg-purple-500/[0.15]',
          circle: 'border-purple-500/10 group-hover:border-purple-500/25',
          numBg: 'bg-[#7c3aed] shadow-[0_8px_20px_rgba(124,58,237,0.28)]',
          ring: 'border-[#7c3aedcc]',
          heading: 'text-[#7c3aed]',
          bar: 'bg-[#7c3aed] group-hover:shadow-[0_0_18px_rgba(124,58,237,0.45)]',
        },
      ];

      const cardsHtml = units
        .map((u, idx) => {
          const pal = design6Palettes[idx % design6Palettes.length];
          const numStr = String(idx + 1).padStart(2, '0');
          const contextText = `${u.badge || ''} ${u.heading || ''} ${u.body || ''} ${u.raw || ''}`;
          const imageAsset = u.imgSrc
            ? null
            : findBestSemanticImage(contextText, idx);
          const imgSrc = u.imgSrc || imageAsset.url;
          const imgAlt =
            u.imgAlt || imageAsset.alt || u.heading || `Principle ${idx + 1}`;

          return `    <!-- CARD ${numStr} -->
    <div data-slot="${idx}" class="group relative w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-none min-w-0 min-h-[325px] p-[22px_20px_20px] box-border rounded-[28px] overflow-hidden flex flex-col items-center text-center bg-gradient-to-br ${pal.bg} border ${pal.borderOuter} border-t-[5px] ${pal.borderTop} transition-all duration-700 hover:-translate-y-3 opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:${(idx * 0.15).toFixed(2)}s]">
        <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>
        <div class="absolute -right-20 -top-20 w-44 h-44 rounded-full ${pal.glow} transition-all duration-700 group-hover:scale-[1.7]"></div>
        <div class="absolute -left-10 bottom-8 w-24 h-24 rounded-full border ${pal.circle} transition-all duration-700 group-hover:scale-[1.5] group-hover:translate-x-5 group-hover:-translate-y-3"></div>

        <!-- Number -->
        <div class="absolute top-4 left-4 w-[48px] h-[48px] rounded-[15px] ${pal.numBg} text-white flex items-center justify-center font-extrabold tracking-[0.5px] z-10 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6">
            ${numStr}
        </div>

        <!-- Image Area with Rotating Ring -->
        <div class="relative w-[155px] h-[155px] min-h-[155px] mt-1 mb-[17px] rounded-full bg-white/80 backdrop-blur-sm flex-shrink-0 flex items-center justify-center shadow-[0_0_0_9px_rgba(0,0,0,0.04),0_15px_30px_rgba(0,0,0,0.10)] z-[2] transition-all duration-700 group-hover:scale-[1.09]">
            <div class="absolute w-[128px] h-[128px] rounded-full border-2 border-dashed ${pal.ring} transition-all duration-[1200ms] ease-out group-hover:rotate-[270deg] group-hover:scale-[1.08]"></div>
            <img src="${imgSrc}" alt="${imgAlt}" class="relative z-[2] max-w-[110px] max-h-[110px] w-auto h-auto object-contain transition-all duration-700 group-hover:scale-[1.13] group-hover:-rotate-3">
        </div>

        <!-- Heading with letter-spacing motion -->
        <h3 class="relative z-[3] m-0 mb-[9px] ${pal.heading} font-extrabold uppercase tracking-[1.5px] leading-tight transition-all duration-500 group-hover:tracking-[2.5px]">
            ${u.heading || `Principle ${numStr}`}
        </h3>

        <!-- Content -->
        <p class="relative z-[3] m-0 mb-[25px] text-[#303d48] leading-[1.5]">
            <b>${u.body || u.raw || ''}</b>
        </p>

        <!-- Bottom Accent -->
        <div class="relative z-[3] mt-auto w-[55px] h-[5px] rounded-full ${pal.bar} transition-all duration-700 group-hover:w-[105px] group-hover:h-[6px]"></div>
    </div>`;
        })
        .join('\n\n');

      return `<div class="w-full flex flex-wrap justify-center gap-6 box-border my-[25px]">
${cardsHtml}
</div>`;
    }

    // 3B. SYNTHESIZE DESIGN 7 (6-Role Capability Executive Grid: 360 Rotating Borders, Dot-Grid & Pulsing 3D Halo)
    if (/\b(design\s*7|role|roles|matrix|ping|halo)\b/i.test(promptLower)) {
      const design7Palettes = [
        {
          hex: '#0f2a4d',
          bg: 'via-[#f5f8fb] to-[#dbe7f2] group-hover:to-[#c8d9e8]',
          shadow: 'rgba(15,42,77,0.55)',
          darkBg: 'from-[#0f2a4d] to-[#173d61]',
        },
        {
          hex: '#1e6fdb',
          bg: 'via-[#eef5ff] to-[#d4e5ff] group-hover:to-[#c1d9ff]',
          shadow: 'rgba(30,111,219,0.55)',
          darkBg: 'from-[#1e6fdb] to-[#1456ac]',
        },
        {
          hex: '#5ec4c4',
          bg: 'via-[#f0fbfb] to-[#d5eeee] group-hover:to-[#bfe5e5]',
          shadow: 'rgba(65,158,158,0.55)',
          darkBg: 'from-[#5ec4c4] to-[#419e9e]',
        },
        {
          hex: '#f59e42',
          bg: 'via-[#fff7ed] to-[#fde0b8] group-hover:to-[#ffd59a]',
          shadow: 'rgba(215,123,33,0.55)',
          darkBg: 'from-[#f59e42] to-[#d77b21]',
        },
        {
          hex: '#3cb371',
          bg: 'via-[#f1fbf5] to-[#ccebd8] group-hover:to-[#b6dfc7]',
          shadow: 'rgba(49,150,94,0.55)',
          darkBg: 'from-[#3cb371] to-[#31965e]',
        },
        {
          hex: '#8c8c8c',
          bg: 'via-[#f5f5f5] to-[#dedede] group-hover:to-[#cccccc]',
          shadow: 'rgba(102,102,102,0.55)',
          darkBg: 'from-[#8c8c8c] to-[#666666]',
        },
      ];

      const cardsHtml = units
        .map((u, idx) => {
          const pal = design7Palettes[idx % design7Palettes.length];
          const contextText = `${u.badge || ''} ${u.heading || ''} ${u.body || ''} ${u.raw || ''}`;
          const imageAsset = u.imgSrc
            ? null
            : findBestSemanticImage(contextText, idx);
          const imgSrc = u.imgSrc || imageAsset.url;
          const imgAlt =
            u.imgAlt || imageAsset.alt || u.heading || `Role ${idx + 1}`;

          return `        <!-- CARD ${idx + 1} -->
        <div data-slot="${idx}" class="group relative flex h-[430px] w-full min-w-0 flex-col items-center overflow-hidden rounded-[28px] p-[1px] opacity-0 transition-all duration-700 ease-out hover:-translate-y-3 hover:shadow-[0_34px_60px_-28px_${pal.shadow}] animate-[fadeIn_.6s_ease_forwards] [animation-delay:${(idx * 0.15).toFixed(2)}s] max-[600px]:w-full min-[601px]:max-[850px]:w-[calc(50%-12px)] min-[851px]:max-[1280px]:w-[calc(33.333%-16px)] min-[1281px]:max-[1500px]:w-[calc(25%-18px)] min-[1501px]:max-[1750px]:w-[calc(20%-19.2px)] min-[1751px]:w-[calc(16.666%-20px)]">
            <div class="absolute inset-0 rounded-[28px] bg-gradient-to-r from-transparent via-[${pal.hex}] to-transparent opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:rotate-180"></div>
            <div class="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[${pal.hex}]/10 blur-xl transition-all duration-700 group-hover:scale-[2] group-hover:rotate-45"></div>
            <div class="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[${pal.hex}]/5 blur-2xl transition-all duration-700 group-hover:translate-x-10 group-hover:-translate-y-10"></div>

            <div class="relative z-10 flex h-full w-full flex-col items-center overflow-hidden rounded-[27px] bg-gradient-to-br from-white ${pal.bg} backdrop-blur-xl px-6 pb-7 pt-8 transition-all duration-700 group-hover:from-white">
                <div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [background-image:radial-gradient(rgba(0,0,0,0.12)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] [-webkit-mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"></div>

                <div class="absolute left-0 top-0 h-1.5 w-full overflow-hidden">
                    <div class="h-full w-full bg-[linear-gradient(90deg,${pal.hex}_100%,white_0,${pal.hex}_100%)] bg-[length:200%_100%] transition-all duration-700 group-hover:bg-[position:100%_0]"></div>
                </div>

                <div class="relative mb-6 flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br ${pal.darkBg} transition-all duration-700 group-hover:-translate-y-3 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
                    <span class="pointer-events-none absolute inset-0 rounded-[24px] border-2 border-[${pal.hex}] opacity-0 group-hover:animate-ping group-hover:opacity-60"></span>
                    <span class="pointer-events-none absolute -inset-2 rounded-[30px] border border-[${pal.hex}]/40 opacity-0 scale-75 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"></span>
                    <div class="absolute inset-1 rounded-[20px] border border-white/20"></div>
                    <img src="${imgSrc}" alt="${imgAlt}" class="relative h-[42px] w-[42px] object-contain brightness-0 invert">
                </div>

                <h3 class="relative m-0 mb-4 text-center font-semibold leading-tight text-[${pal.hex}] transition-all duration-500 group-hover:-translate-y-1 group-hover:tracking-wide">
                    ${u.heading || `Role ${idx + 1}`}
                </h3>

                <div class="relative mb-5 h-1 w-12 rounded-full bg-[${pal.hex}] transition-all duration-500 group-hover:w-20"></div>

                <p class="relative m-0 max-w-[250px] text-center leading-[1.65] text-[#374151] transition-all duration-500 group-hover:-translate-y-1 group-hover:text-[#111827]">
                    ${u.body || u.raw || ''}
                </p>

                <div class="relative mt-auto w-full pt-7">
                    <div class="relative h-1 w-full overflow-hidden rounded-full bg-[${pal.hex}]/20">
                        <div class="absolute left-0 top-0 h-full w-0 rounded-full bg-gradient-to-r from-[${pal.hex}] to-white transition-all duration-700 group-hover:w-full"></div>
                    </div>
                </div>
            </div>
        </div>`;
        })
        .join('\n\n');

      return `<div class="w-full box-border px-4 py-8 sm:px-6 lg:px-8 my-[20px]">
    <div class="mx-auto flex w-full max-w-[1800px] flex-wrap justify-center gap-6">
${cardsHtml}
    </div>
</div>`;
    }

    // 3C. SYNTHESIZE DESIGN 8 (Horizontal Feature Stream: 7px Left Accent, Rotate-135 Rings & Sliding Bottom Line)
    if (/\b(design\s*8|rows?|stream|horizontal|skills?)\b/i.test(promptLower)) {
      const design8Palettes = [
        {
          borderLeft: 'border-l-[#01335d]',
          borderOuter: 'border-[#a9cfee]',
          bg: 'from-[#d4e8fb] via-[#eff7ff] to-[#c4def5]',
          text: 'text-[#01335d]',
          hex: '#01335d',
        },
        {
          borderLeft: 'border-l-[#b3b3b3]',
          borderOuter: 'border-[#d5d5d5]',
          bg: 'from-[#e9e9e9] via-[#f7f7f7] to-[#dedede]',
          text: 'text-[#666666]',
          hex: '#b3b3b3',
        },
        {
          borderLeft: 'border-l-[#205f99]',
          borderOuter: 'border-[#b7d6ef]',
          bg: 'from-[#ecf6ff] via-[#f6fbff] to-[#d9ecfb]',
          text: 'text-[#205f99]',
          hex: '#205f99',
        },
        {
          borderLeft: 'border-l-[#38b5e4]',
          borderOuter: 'border-[#a9e2f5]',
          bg: 'from-[#ddf6ff] via-[#f0fcff] to-[#c8eefb]',
          text: 'text-[#1686b2]',
          hex: '#38b5e4',
        },
        {
          borderLeft: 'border-l-[#68e5ab]',
          borderOuter: 'border-[#b8efd7]',
          bg: 'from-[#e5fff3] via-[#f2fff9] to-[#d1f8e6]',
          text: 'text-[#249663]',
          hex: '#68e5ab',
        },
      ];

      const cardsHtml = units
        .map((u, idx) => {
          const pal = design8Palettes[idx % design8Palettes.length];
          const contextText = `${u.badge || ''} ${u.heading || ''} ${u.body || ''} ${u.raw || ''}`;
          const imageAsset = u.imgSrc
            ? null
            : findBestSemanticImage(contextText, idx);
          const imgSrc = u.imgSrc || imageAsset.url;
          const imgAlt =
            u.imgAlt || imageAsset.alt || u.heading || `Skill ${idx + 1}`;

          return `        <!-- CARD ${idx + 1} -->
        <div data-slot="${idx}" class="group relative w-full box-border overflow-hidden rounded-[26px] border ${pal.borderOuter} border-l-[7px] ${pal.borderLeft} bg-gradient-to-br ${pal.bg} p-[5px] shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-[7px] hover:shadow-[0_18px_40px_rgba(0,0,0,0.15)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:${(idx * 0.15).toFixed(2)}s]">
            <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>
            <div class="pointer-events-none absolute inset-0 rounded-[26px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.08),transparent_45%)]"></div>
            <div class="relative overflow-hidden rounded-[20px] border border-white/80 bg-white/40 px-[12px] py-[12px]">
                <div class="pointer-events-none absolute -right-[40px] -top-[40px] h-[150px] w-[150px] rounded-full border-[25px] border-[${pal.hex}]/10 transition-all duration-700 group-hover:scale-[1.25] group-hover:rotate-45 group-hover:border-[${pal.hex}]/20"></div>
                <div class="pointer-events-none absolute -bottom-[55px] -left-[35px] h-[125px] w-[125px] rounded-full bg-[${pal.hex}]/[0.06] transition-all duration-700 group-hover:scale-[1.35]"></div>
                <div class="pointer-events-none absolute right-[18px] top-[18px] h-[8px] w-[8px] rounded-full bg-[${pal.hex}]/40 transition-all duration-500 group-hover:scale-[2] group-hover:bg-[${pal.hex}]/70"></div>
                <div class="relative z-[1] flex items-center gap-[12px]">
                    <div class="relative flex h-[105px] w-[105px] shrink-0 items-center justify-center">
                        <div class="absolute inset-0 rounded-full border-[2px] border-dashed border-[${pal.hex}]/35 transition-all duration-700 group-hover:rotate-[135deg] group-hover:scale-[1.08] group-hover:border-[${pal.hex}]/70"></div>
                        <div class="absolute inset-[6px] rounded-full bg-white shadow-[0_5px_14px_rgba(0,0,0,0.10)] transition-all duration-500 group-hover:scale-[0.94]"></div>
                        <div class="relative flex h-[90px] w-[90px] items-center justify-center rounded-full bg-gradient-to-br from-white to-[${pal.hex}]/20 transition-all duration-500 group-hover:scale-[1.04]">
                            <img src="${imgSrc}" alt="${imgAlt}" class="relative h-[90%] w-[90%] object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.10)] transition-all duration-500 group-hover:scale-[1.13] group-hover:-translate-y-[3px]">
                        </div>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="m-0 font-semibold leading-tight ${pal.text} transition-all duration-400 group-hover:translate-x-[4px]">
                            ${u.heading || `Feature ${idx + 1}`}
                        </h3>
                        <div class="flex gap-[6px] items-center mb-[9px] mt-[9px]">
                            <div class="h-[4px] w-[35px] rounded-full bg-[${pal.hex}] transition-all duration-500 group-hover:w-[70px]"></div>
                            <div class="h-[4px] w-[12px] rounded-full bg-[${pal.hex}]/30 transition-all duration-500 group-hover:w-[18px] group-hover:bg-[${pal.hex}]/50"></div>
                            <div class="h-[4px] w-[6px] rounded-full bg-[${pal.hex}]/20 transition-all duration-500 group-hover:w-[12px] group-hover:bg-[${pal.hex}]/40"></div>
                        </div>
                        <p class="mt-[8px] mb-0 text-[#303d48] leading-[1.5]">
                            ${u.body || u.raw || ''}
                        </p>
                    </div>
                </div>
                <div class="pointer-events-none absolute bottom-0 left-0 h-[3px] w-[45px] rounded-full bg-[${pal.hex}]/50 transition-all duration-700 group-hover:left-[calc(100%-80px)] group-hover:w-[65px] group-hover:bg-[${pal.hex}]"></div>
            </div>
        </div>`;
        })
        .join('\n\n');

      return `<div class="w-full mx-auto my-[25px] px-[12px] box-border">
    <div class="flex flex-wrap justify-center gap-[16px] w-full box-border">
${cardsHtml}
    </div>
</div>`;
    }

    let gridColsCls = 'grid-cols-1 md:grid-cols-2';
    if (/\b(1\s*col|single\s*column|vertical|stacked)\b/i.test(promptLower)) {
      gridColsCls = 'grid-cols-1 max-w-4xl mx-auto';
    } else if (
      count === 3 ||
      /\b(3\s*col|three\s*col|triple)\b/i.test(promptLower)
    ) {
      gridColsCls = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    } else if (
      count === 4 ||
      /\b(4\s*col|four\s*col|quad|roadmap)\b/i.test(promptLower)
    ) {
      gridColsCls = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    } else if (count === 5 || /\b(5\s*col|five\s*col)\b/i.test(promptLower)) {
      gridColsCls =
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[1500px]:grid-cols-5';
    }

    const cardPalettes = [
      {
        borderLeft: 'border-l-[#205f99] border-t-[#205f99]',
        borderHex: '#205f99',
        border: 'border-[rgba(32,95,153,0.20)]',
        bg: 'from-white to-[#eff6fd] dark:from-slate-900 dark:to-slate-950',
        badge:
          'text-[#205f99] dark:text-sky-400 bg-blue-500/10 border-blue-500/20',
        iconBg: 'from-[#01335d] via-[#205f99] to-[#38b5e4]',
        glow: 'bg-[#205f99]/15',
        ring: 'border-[#205f99]/15',
        dot: 'bg-[#205f99]',
        shadow: 'hover:shadow-[0_20px_42px_rgba(1,51,93,0.14)]',
        pillBg:
          'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200/50',
      },
      {
        borderLeft: 'border-l-[#087443] border-t-[#087443]',
        borderHex: '#087443',
        border: 'border-[rgba(8,116,67,0.20)]',
        bg: 'from-white to-[#edf9f4] dark:from-slate-900 dark:to-slate-950',
        badge:
          'text-[#087443] dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        iconBg: 'from-[#087443] via-[#16a34a] to-[#68e5ab]',
        glow: 'bg-[#087443]/15',
        ring: 'border-[#087443]/15',
        dot: 'bg-[#087443]',
        shadow: 'hover:shadow-[0_20px_42px_rgba(8,116,67,0.14)]',
        pillBg:
          'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200/50',
      },
      {
        borderLeft: 'border-l-[#7c3aed] border-t-[#7c3aed]',
        borderHex: '#7c3aed',
        border: 'border-purple-500/20',
        bg: 'from-white to-[#faf5ff] dark:from-slate-900 dark:to-slate-950',
        badge:
          'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
        iconBg: 'from-purple-600 via-indigo-600 to-violet-400',
        glow: 'bg-purple-500/15',
        ring: 'border-purple-500/15',
        dot: 'bg-[#7c3aed]',
        shadow: 'hover:shadow-[0_20px_42px_rgba(124,58,237,0.14)]',
        pillBg:
          'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border-purple-200/50',
      },
      {
        borderLeft: 'border-l-[#d97706] border-t-[#d97706]',
        borderHex: '#d97706',
        border: 'border-amber-500/20',
        bg: 'from-white to-[#fffbeb] dark:from-slate-900 dark:to-slate-950',
        badge:
          'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
        iconBg: 'from-amber-600 via-orange-500 to-yellow-400',
        glow: 'bg-amber-500/15',
        ring: 'border-amber-500/15',
        dot: 'bg-[#d97706]',
        shadow: 'hover:shadow-[0_20px_42px_rgba(217,119,6,0.14)]',
        pillBg:
          'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200/50',
      },
      {
        borderLeft: 'border-l-[#0284c7] border-t-[#0284c7]',
        borderHex: '#0284c7',
        border: 'border-sky-500/20',
        bg: 'from-white to-[#f0f9ff] dark:from-slate-900 dark:to-slate-950',
        badge: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
        iconBg: 'from-sky-600 via-cyan-500 to-teal-400',
        glow: 'bg-sky-500/15',
        ring: 'border-sky-500/15',
        dot: 'bg-[#0284c7]',
        shadow: 'hover:shadow-[0_20px_42px_rgba(2,132,199,0.14)]',
        pillBg:
          'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border-sky-200/50',
      },
    ];

    const cardsHtml = units
      .map((u, idx) => {
        const palette = cardPalettes[idx % cardPalettes.length];
        const contextText = `${u.badge || ''} ${u.heading || ''} ${u.body || ''} ${u.raw || ''}`;
        const iconSvg = findBestSemanticIcon(contextText, idx);
        const imageAsset = u.imgSrc
          ? null
          : findBestSemanticImage(contextText, idx);
        const isLeftImageReq =
          /\b(left\s*image|image\s*left|left\s*img)\b/i.test(promptLower);

        // Pills markup
        const tagsHtml =
          u.tags && u.tags.length > 0
            ? `<div class="flex items-center gap-2 pt-2 flex-wrap">${u.tags
                .map(
                  (t) =>
                    `<span class="px-3 py-1 rounded-full text-xs font-bold border ${palette.pillBg}">${t}</span>`
                )
                .join('')}</div>`
            : '';

        // Bullets markup if any
        const bulletsHtml =
          u.bullets && u.bullets.length > 0
            ? `<ul class="flex flex-col gap-2 p-0 m-0 list-none my-2">${u.bullets
                .map(
                  (b) =>
                    `<li class="relative pl-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"><span class="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary"></span>${b}</li>`
                )
                .join('')}</ul>`
            : '';

        // Signature Animated Media Container (Rotating dashed circle & image hover border)
        const mediaElement =
          u.imgSrc || (isLeftImageReq && imageAsset)
            ? `<div class="relative w-[120px] h-[120px] sm:w-[135px] sm:h-[135px] max-w-full shrink-0 rounded-full bg-white/85 dark:bg-slate-900/85 flex items-center justify-center shadow-[0_0_0_8px_rgba(0,0,0,0.04),0_10px_22px_rgba(0,0,0,0.08)] z-[2] transition-all duration-500 group-hover:shadow-[0_0_0_10px_rgba(0,0,0,0.08),0_14px_28px_rgba(0,0,0,0.12)]">
                 <!-- Rotating Dashed Circle -->
                 <div class="absolute border-2 border-[${palette.borderHex}eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[135deg] group-hover:scale-[1.10] h-[98px] w-[98px] sm:h-[110px] sm:w-[110px] rounded-full transition-all"></div>
                 <!-- Image with Animated Border on Hover -->
                 <img src="${u.imgSrc || imageAsset.url}" alt="${u.imgAlt || imageAsset.alt || u.heading}" class="max-w-[88px] max-h-[88px] sm:max-w-[100px] sm:max-h-[100px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[${palette.borderHex}]/25 transition-all duration-700 ease-out group-hover:scale-[1.08] group-hover:border-[${palette.borderHex}] drop-shadow-md" />
               </div>`
            : `<div class="relative w-[105px] h-[105px] sm:w-[120px] sm:h-[120px] max-w-full shrink-0 rounded-full bg-white/85 dark:bg-slate-900/85 flex items-center justify-center shadow-[0_0_0_8px_rgba(0,0,0,0.04),0_10px_22px_rgba(0,0,0,0.08)] z-[2] transition-all duration-500 group-hover:shadow-[0_0_0_10px_rgba(0,0,0,0.08),0_14px_28px_rgba(0,0,0,0.12)]">
                 <!-- Rotating Dashed Circle -->
                 <div class="absolute border-2 border-[${palette.borderHex}eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[135deg] group-hover:scale-[1.10] h-[86px] w-[86px] sm:h-[98px] sm:w-[98px] rounded-full transition-all"></div>
                 <!-- Icon with Animated Hover Scale & Rotation -->
                 <div class="w-[62px] h-[62px] sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center bg-gradient-to-tr ${palette.iconBg} text-white relative z-[2] border-2 border-white/80 dark:border-slate-800 shadow-md transition-all duration-700 ease-out group-hover:scale-[1.10] group-hover:rotate-6 drop-shadow-md">
                   ${iconSvg}
                 </div>
               </div>`;

        return `
    <!-- Card ${idx + 1} -->
    <div data-slot="${idx}" class="group relative w-full min-w-0 rounded-[22px] bg-gradient-to-br ${palette.bg} border ${palette.border} border-t-[6px] ${palette.borderLeft.split(' ')[1]} md:border-t-0 md:border-l-[6px] ${palette.borderLeft.split(' ')[0]} shadow-[0_10px_28px_rgba(0,0,0,0.07)] overflow-hidden p-6 sm:p-7 flex flex-col justify-between transition-all duration-700 ease-out ${palette.shadow} hover:-translate-y-1.5 opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:${idx * 0.15}s]">
      <!-- Shimmer Light Beam -->
      <div class="pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%]"></div>

      <!-- Faded Ambient Background Circles -->
      <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl ${palette.glow} transition-all duration-1000 ease-out group-hover:scale-125 group-hover:-translate-y-2 group-hover:translate-x-2"></div>
      <div class="faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl ${palette.glow} transition-all duration-1000 ease-out group-hover:scale-125 group-hover:translate-y-2 group-hover:-translate-x-2"></div>

      <!-- Large Geometric Background Ring -->
      <div class="pointer-events-none absolute -right-[40px] -top-[40px] h-[140px] w-[140px] rounded-full border-[22px] ${palette.ring} transition-all duration-700 group-hover:scale-[1.25] group-hover:rotate-45"></div>

      <!-- Premium Corner Accent Dot -->
      <div class="absolute top-[22px] right-[22px] w-[8px] h-[8px] rounded-full ${palette.dot} opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.7] group-hover:shadow-[0_0_0_6px_rgba(0,0,0,0.06)]"></div>

      <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
        ${mediaElement}

        <div class="flex-1 min-w-0 space-y-2.5">
          ${u.badge ? `<div class="flex items-center gap-2"><span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${palette.badge}">${u.badge}</span></div>` : ''}
          ${u.heading ? `<h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug m-0">${u.heading}</h3>` : ''}
          ${u.body ? `<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">${u.body}</p>` : ''}
          ${bulletsHtml}
          ${tagsHtml}
        </div>
      </div>

      <!-- Expanding Bottom Accent Bar -->
      <div class="${palette.dot} h-1 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[75px] group-hover:h-[4px] mt-4"></div>
    </div>`;
      })
      .join('\n');

    return `<div class="w-full box-border p-3 sm:p-5 bg-slate-50/60 dark:bg-slate-950/60 rounded-3xl border border-border/70">
  <div class="grid ${gridColsCls} gap-5 sm:gap-6 w-full items-stretch justify-center">
${cardsHtml}
  </div>
</div>`;
  }

  // Fallback: Convert inline styles to tailwind and apply glow
  return applyHoverAnimationsAndCornerGlow(
    convertInlineStylesToTailwind(html),
    {
      animateOnHover,
      themeColor,
    }
  );
}

/**
 * 100% Free AI HTML Design Enhancement via Puter.js
 * Combines free AI reasoning with guaranteed fallback to prompt-aware Tailwind engine
 * Strictly preserves 100% of user text verbatim and supports custom styling prompts
 */
export async function enhanceHtmlWithFreeAi(rawHtml, options = {}) {
  const {
    animateOnHover = true,
    themeColor = 'ocean',
    requestedModel = 'gpt-4o-mini',
    customPrompt = '',
    isIncremental = false,
  } = options;

  if (!rawHtml || typeof rawHtml !== 'string') return '';

  const isIncrementalMode = isIncremental || isExistingCardDesign(rawHtml);

  // 1. Run prompt-aware deterministic structural transformation first as safety baseline
  const baselineTailwind = applyCustomPromptToHtml(rawHtml, customPrompt, {
    animateOnHover,
    themeColor,
    isIncremental: isIncrementalMode,
  });

  const prompt = isIncrementalMode
    ? `You are "Se7eN AI Bot", elite Frontend Architect and Tailwind CSS Master.
INCREMENTAL EDIT MODE: The user has already finalized this presentation card HTML and requested a targeted modification: "${customPrompt || 'Refine styling'}".

CRITICAL MANDATORY INSTRUCTIONS:
1. DO NOT REWRITE OR DISCARD THE EXISTING CARD ARCHITECTURE.
2. Modify ONLY what was specifically requested (e.g. if changing border color to amber, change only the border classes like 'border-t-[#d97706]', 'md:border-l-[#d97706]', 'border-amber-500').
3. PRESERVE 100% OF ALL HTML TAGS, CARDS, IMAGES, ICONS, HEADINGS, BULLETS, AND TEXT VERBATIM. DO NOT ALTER A SINGLE WORD.
4. Output ONLY valid pure HTML with Tailwind classes, without markdown code fences.

INPUT HTML TO MODIFY:
${baselineTailwind || rawHtml}`
    : `You are a Tailwind CSS design enhancer. Convert any pasted HTML into a fully animated, 100% Tailwind, production-grade component. Follow these rules exactly.

GLOBAL RULES:
1. Output pure Tailwind utility classes only. Zero inline style="", zero <style> tags, zero custom CSS files.
2. NEVER wrap output in a class called "html-content-container" or any generic wrapper div with no styling purpose.
3. NEVER change, rename, or "improve" any color the user provided (hex codes, rgba values, gradients). Preserve them exactly as given.
4. NEVER add rotation to icons/images unless the source design already rotates them. Default icon hover = scale + background fill + shadow, not spin.
5. Every card, row item, or list item that has its own icon/image must get its OWN hover scope (group/xxx + group-hover/xxx:) — never let one shared group trigger every sibling's icon at once. If a design has repeating rows inside one card, each row gets a unique group name (group/row1, group/row2...).
6. Build mobile-first. Every card/grid must reflow cleanly at all breakpoints using flex-wrap, grid-cols, min-w-0, box-border, and w-full defaults with sm:/md:/lg:/xl: overrides. No fixed pixel widths without a responsive fallback.
7. No comments, no extra blank lines, no line breaks inside class strings — compact single-line class attributes only.

CARD ANATOMY:
A. CONTAINER: rounded-[20px] to rounded-[30px], border with a soft tint border color swapping to brand color on hover, transition-all duration-700 ease-out, hover:-translate-y-2 to -3, hover:shadow-[0_18px_45px_rgba(BRAND-COLOR,0.16-0.28)] using the card's accent color, opacity-0 animate-[fadeIn_.6s_ease_forwards] with staggered animation delay per card.
B. TOP ACCENT BAR: 1-2px bar with gradient of card colors growing on hover: w-0 group-hover:w-full.
C. GLASSY SWEEP: pointer-events-none absolute -left-[120%] top-0 h-full w-[70%] rotate-[18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-1000 ease-out group-hover:left-[140%].
D. DECORATIVE BLURRED CIRCLES: 2 corner circles per card minimum (top-right and bottom-left) using card accent color at 5-15% opacity, blur-2xl, scale-[1.4] to [1.8] on hover.
E. ICON / IMAGE TREATMENT: Scoped group-hover. Solid tile: rounded-[16px], scale-110 -translate-y-1, pulsing ping halo and expanding ring. Photo: frame with rotating dashed ring and hover border.
F. FLOATING DOT: Small 6-8px rounded-full dot at top-right, group-hover:scale-[1.6-2] group-hover:opacity-100.
G. BOTTOM ACCENT BAR: Static w-12 h-1 rounded-full bar in card color, group-hover:w-24.
H. TEXT MICRO-MOTION: Heading group-hover:tracking-wide, subtle whisper lift -translate-y-0.5.

OUTPUT FORMAT:
- Return ONLY the HTML block, compact, no comments, no explanation before/after.
- Class order per element: layout → spacing → sizing → color/bg → border/radius → shadow → transition/animation → hover states last.

${customPrompt && customPrompt.trim() ? `USER CUSTOM PROMPT: "${customPrompt.trim()}". Strictly enforce this request.` : ''}

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

      // CRITICAL CHECK: AI output must be valid HTML with card structures and classes!
      // If AI returned plain text, markdown without containers, or unstyled text, REJECT IT!
      const hasCardContainers =
        /<div[\s\S]*class=["'][^"']*(?:rounded|border|shadow|flex|grid)[^"']*["']/i.test(
          cleanHtml
        );
      const hasHtmlTags = /<[a-z][\s\S]*>/i.test(cleanHtml);

      if (!hasCardContainers || !hasHtmlTags || cleanHtml.length < 50) {
        console.warn(
          'AI returned plain text or unstyled HTML, rejecting and using deterministic card engine.'
        );
        return baselineTailwind;
      }

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
      'Puter AI enhancement encountered error, using prompt-aware transformation engine:',
      aiErr
    );
  }

  // Fallback: Return the high-fidelity prompt-aware transformed HTML
  return baselineTailwind;
}

/**
 * Quick Text Generator for Published Templates
 * Injects user's pasted quick text into a published design template while preserving 100% of styles & animations.
 * Uses Free AI (Puter.js) to intelligently map user content into exact template slots (headings, badges, bullets, body),
 * with instantaneous deterministic fallback.
 * STRICT RULE: Verbatim preservation of user facts, metrics, and terminology.
 */
export async function injectQuickTextIntoDesign(
  templateHtml,
  quickText,
  requestedModel = 'gpt-4o'
) {
  if (!templateHtml) return '';
  if (!quickText || !quickText.trim()) return templateHtml;

  try {
    if (typeof window !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(templateHtml, 'text/html');
      let slotEls = Array.from(doc.body.querySelectorAll('[data-slot]'));
      if (slotEls.length === 0) {
        slotEls = Array.from(
          doc.body.querySelectorAll(
            'div.group, div[class*="rounded-[2"], div[class*="rounded-2xl"], div[class*="rounded-3xl"], div[class*="rounded-xl"]'
          )
        ).filter(
          (el) =>
            el.parentElement === doc.body.firstElementChild ||
            el.parentElement === doc.body
        );
      }

      const cardCount = Math.max(1, slotEls.length || 2);

      const prompt = `You are an expert presentation designer.
Format the following user content so it populates into a presentation component with exactly ${cardCount} cards.

USER CONTENT:
"""
${quickText.trim()}
"""

Return ONLY a JSON array with exactly ${cardCount} objects. Each object must have:
- "badge": short category/phase tag (e.g. "Phase 01", "Challenge", "Key Metric", "Feature", "With AI")
- "heading": bold concise title (3-6 words)
- "body": 1-2 concise explanatory sentences
- "bullets": array of 2-3 short bullet strings (or [] if none)
- "tag": optional 1-2 word highlight badge

RULES:
1. Preserve 100% of the user's facts, meaning, data, and terminology verbatim.
2. Return ONLY the raw JSON array (no markdown fences, no explanation).`;

      const aiResponse = await callPuterAiChat(prompt, requestedModel);
      if (aiResponse && typeof aiResponse === 'string') {
        let cleanJson = aiResponse
          .trim()
          .replace(/^```(?:json)?\n?/i, '')
          .replace(/\n?```$/i, '')
          .trim();

        const jsonMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) cleanJson = jsonMatch[0];

        const cardsData = JSON.parse(cleanJson);
        if (Array.isArray(cardsData) && cardsData.length > 0) {
          const aiUnits = cardsData.map((c, i) => ({
            badge: c.badge || `Phase 0${i + 1}`,
            heading: c.heading || '',
            body: c.body || '',
            bullets: Array.isArray(c.bullets) ? c.bullets : [],
            items: [],
            tags: c.tag ? [c.tag] : [],
            imgSrc: '',
            imgAlt: '',
            raw: `${c.heading || ''} ${c.body || ''}`,
          }));

          const populated = injectContentIntoDesignSlots(
            templateHtml,
            aiUnits,
            'all'
          );
          if (populated) return populated;
        }
      }
    }
  } catch (err) {
    console.warn(
      'Free AI quick text injection encountered an error, falling back to deterministic:',
      err
    );
  }

  // Robust Fallback: Deterministic slot injection
  return injectContentIntoDesignSlots(templateHtml, quickText, 'all');
}

/**
 * Converts an image URL (data URL, webp, png, unsplash, hazwoper asset) to a high-definition Data URL
 * with automatic fallback through the local Next.js proxy route /api/proxy-image to guarantee 0 CORS issues.
 */
export async function convertImageUrlToDataUrl(
  imageUrl,
  format = 'png',
  size = null
) {
  if (!imageUrl || typeof window === 'undefined') return null;
  if (
    imageUrl.startsWith('data:image/') &&
    (!format || imageUrl.includes(format))
  ) {
    return imageUrl;
  }

  return new Promise((resolve) => {
    let resolved = false;

    const tryLoad = (srcUrl, isFallback = false) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (resolved) return;
        try {
          const canvas = document.createElement('canvas');
          const width = size || img.naturalWidth || 512;
          const height = size
            ? Math.round(size * (img.naturalHeight / (img.naturalWidth || 1)))
            : img.naturalHeight || 512;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
          const dataUrl = canvas.toDataURL(mimeType, 0.95);
          resolved = true;
          resolve(dataUrl);
        } catch {
          if (!isFallback && !srcUrl.includes('/api/proxy-image')) {
            tryLoad(
              `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`,
              true
            );
          } else {
            resolved = true;
            resolve(imageUrl);
          }
        }
      };
      img.onerror = () => {
        if (resolved) return;
        if (!isFallback && !srcUrl.includes('/api/proxy-image')) {
          tryLoad(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`, true);
        } else {
          resolved = true;
          resolve(imageUrl);
        }
      };
      img.src = srcUrl;
    };

    tryLoad(imageUrl);

    // Timeout safety after 4 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(imageUrl);
      }
    }, 4000);
  });
}

function extractImageFileName(src, alt = '', idx = 1, format = 'png') {
  const ext = format === 'webp' ? 'webp' : 'png';
  if (alt && alt.trim()) {
    const slug = alt
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (slug) return `${slug}.${ext}`;
  }
  try {
    const urlObj = new URL(src, window.location.origin);
    const pathParts = urlObj.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      const baseName = lastPart.substring(0, lastPart.lastIndexOf('.'));
      const slug = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (slug) return `${slug}.${ext}`;
    }
  } catch {
    // fallback
  }
  return `design-image-${idx}.${ext}`;
}

/**
 * Detects and extracts all SVGs (vector icons) AND all Images (AI graphics, webp/png) from enhanced HTML,
 * converts them to crisp PNG / WebP Data URLs, and allows 1-click batch download
 * and auto-synchronization to the user's Supabase Media Hub.
 */
export async function extractAndConvertAssetsFromHtml(
  html,
  format = 'png',
  size = 256
) {
  if (!html || typeof html !== 'string' || typeof window === 'undefined')
    return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const svgElements = Array.from(doc.body.querySelectorAll('svg'));
    const imgElements = Array.from(doc.body.querySelectorAll('img'));

    if (svgElements.length === 0 && imgElements.length === 0) return [];

    const assets = [];

    // 1. Process SVG Elements (React Icons, Lucide, Vector Icons)
    for (let idx = 0; idx < svgElements.length; idx++) {
      const svgEl = svgElements[idx];
      const clonedSvg = svgEl.cloneNode(true);
      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      if (!clonedSvg.getAttribute('width')) {
        clonedSvg.setAttribute('width', String(size));
      }
      if (!clonedSvg.getAttribute('height')) {
        clonedSvg.setAttribute('height', String(size));
      }

      // Check nearby text or aria for a semantic name
      const parentEl = svgEl.parentElement;
      const nearbyHeading =
        parentEl
          ?.querySelector('h1, h2, h3, h4, h5, h6, span, p')
          ?.textContent?.trim() || '';
      const slug = nearbyHeading
        ? nearbyHeading
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 24)
        : '';
      const ext = format === 'webp' ? 'webp' : 'png';
      const fileName = slug
        ? `icon-${idx + 1}-${slug}.${ext}`
        : `enhanced-icon-${idx + 1}.${ext}`;

      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      const mimeType = format === 'webp' ? 'image/webp' : 'image/png';

      const dataUrl = await new Promise((resolve) => {
        try {
          const svgBlob = new Blob([svgString], {
            type: 'image/svg+xml;charset=utf-8',
          });
          const blobUrl = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            const convertedDataUrl = canvas.toDataURL(mimeType, 0.95);
            URL.revokeObjectURL(blobUrl);
            resolve(convertedDataUrl);
          };
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(null);
          };
          img.src = blobUrl;
        } catch {
          resolve(null);
        }
      });

      assets.push({
        id: `icon-${idx + 1}`,
        type: 'icon',
        name: fileName,
        title: slug ? `Icon: ${nearbyHeading}` : `Vector Icon ${idx + 1}`,
        format,
        svgCode: svgString,
        dataUrl,
        previewUrl: dataUrl,
        size: `${size}x${size}`,
      });
    }

    // 2. Process Image Elements (AI generated images, Hazwoper card graphics, webp/png)
    for (let imgIdx = 0; imgIdx < imgElements.length; imgIdx++) {
      const imgEl = imgElements[imgIdx];
      const rawSrc = imgEl.getAttribute('src');
      if (!rawSrc) continue;

      const altText = imgEl.getAttribute('alt') || '';
      const fileName = extractImageFileName(
        rawSrc,
        altText,
        imgIdx + 1,
        format
      );

      const convertedDataUrl = await convertImageUrlToDataUrl(rawSrc, format);

      assets.push({
        id: `img-${imgIdx + 1}`,
        type: 'image',
        name: fileName,
        title: altText || `Image Asset ${imgIdx + 1}`,
        format,
        originalSrc: rawSrc,
        dataUrl: convertedDataUrl || rawSrc,
        previewUrl: convertedDataUrl || rawSrc,
        size: 'High-Res',
      });
    }

    return assets;
  } catch (err) {
    console.warn('Error extracting and converting assets:', err);
    return [];
  }
}

// Backwards-compatible alias
export const extractAndConvertIconsFromHtml = extractAndConvertAssetsFromHtml;

/**
 * Auto-synchronizes converted icon and image assets to Supabase Media Hub
 */
export async function syncIconsToMediaHub(assets) {
  if (!assets || assets.length === 0) return;
  try {
    const { recordMediaUpload } = await import('@/lib/media-hub');
    for (const asset of assets) {
      if (asset.dataUrl) {
        const approximateSize = Math.round((asset.dataUrl.length * 3) / 4);
        await recordMediaUpload({
          fileName: asset.name,
          fileType: asset.format === 'webp' ? 'image/webp' : 'image/png',
          fileSize: approximateSize,
          previewUrl: asset.dataUrl,
          downloadUrl: asset.dataUrl,
        });
      }
    }
  } catch (err) {
    console.warn('Could not auto-sync assets to media hub:', err);
  }
}

export const syncAssetsToMediaHub = syncIconsToMediaHub;
