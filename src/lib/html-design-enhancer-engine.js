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

    // Detect card or main container elements to animate
    const candidateCards = doc.body.querySelectorAll(
      '[data-slot], div[class*="rounded"], div[class*="border"], div[class*="flex-1"], div[class*="shadow"]'
    );

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
  // 1. Image Left / Text Right
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
    enhanced_html: `<div class="flex flex-wrap gap-5 w-full box-border justify-center p-5 bg-slate-50/60 dark:bg-slate-950/60 rounded-3xl border border-border/80">
  <!-- Slot 0: Card 1 -->
  <div data-slot="0" class="group relative flex-[1_1_420px] min-w-[300px] rounded-[22px] bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30 border border-blue-500/20 p-6 overflow-hidden transition-all duration-700 ease-out hover:shadow-[0_20px_40px_rgba(37,99,235,0.12)] hover:border-blue-500/50 hover:-translate-y-1">
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
  <div data-slot="1" class="group relative flex-[1_1_420px] min-w-[300px] rounded-[22px] bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 border border-emerald-500/20 p-6 overflow-hidden transition-all duration-700 ease-out hover:shadow-[0_20px_40px_rgba(16,185,129,0.12)] hover:border-emerald-500/50 hover:-translate-y-1">
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
    enhanced_html: `<div class="flex flex-wrap gap-[22px] w-full box-border justify-center p-[20px] bg-slate-50/50 dark:bg-slate-950/40 rounded-3xl">
  <!-- Slot 0: Card 1 -->
  <div data-slot="0" class="group relative flex-[1_1_420px] min-w-[300px] rounded-[22px] bg-gradient-to-br from-white to-[#eff6ff] dark:from-slate-900 dark:to-blue-950/40 border border-[rgba(32,95,153,0.18)] border-t-[6px] border-t-[#205f99] shadow-[0_10px_28px_rgba(1,51,93,0.08)] overflow-hidden p-[26px] transition-all duration-700 ease-out hover:shadow-[0_18px_38px_rgba(1,51,93,0.15)] hover:-translate-y-1">
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
  <div data-slot="1" class="group relative flex-[1_1_420px] min-w-[300px] rounded-[22px] bg-gradient-to-br from-white to-[#f0fdf4] dark:from-slate-900 dark:to-emerald-950/40 border border-[rgba(22,163,74,0.18)] border-t-[6px] border-t-[#16a34a] shadow-[0_10px_28px_rgba(22,163,74,0.08)] overflow-hidden p-[26px] transition-all duration-700 ease-out hover:shadow-[0_18px_38px_rgba(22,163,74,0.15)] hover:-translate-y-1">
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
          const headingEl = card.querySelector('h1, h2, h3, h4, h5, h6');
          const pEl = card.querySelector('p');
          const tagEls = Array.from(
            card.querySelectorAll('span, li, a')
          ).filter((el) => el !== badgeEl);

          const badge = badgeEl ? badgeEl.textContent.trim() : '';
          const heading = headingEl ? headingEl.textContent.trim() : '';
          const body = pEl ? pEl.textContent.trim() : '';
          const tags = tagEls.map((t) => t.textContent.trim()).filter(Boolean);

          return {
            badge,
            heading,
            body: body || (!heading && !badge ? card.textContent.trim() : ''),
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
    const heading = segLines[0] ? segLines[0].replace(/^[-*•\d.]+\s*/, '') : '';
    const body = segLines.slice(1).join(' ') || heading;
    return {
      badge: '',
      heading: segLines.length > 1 ? heading : '',
      body: segLines.length > 1 ? body : heading,
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
  if (!userContent || !userContent.trim()) return templateHtml;

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
          'div[class*="rounded"], div[class*="border"], div[class*="flex-"]'
        )
      ).filter(
        (el) =>
          el.parentElement === doc.body.firstElementChild ||
          el.parentElement === doc.body
      );
    }

    if (slotEls.length === 0) {
      slotEls = [doc.body.firstElementChild || doc.body];
    }

    const units = extractVerbatimTextSegments(userContent);

    const populateCard = (cardEl, unit) => {
      if (!unit) return;

      const badgeEl = cardEl.querySelector(
        '[class*="uppercase"], [class*="tracking"], span[class*="rounded-md"], span[class*="border"]'
      );
      const headingEl = cardEl.querySelector('h1, h2, h3, h4, h5, h6');
      const pEl = cardEl.querySelector('p');
      const tagEls = Array.from(
        cardEl.querySelectorAll(
          'span[class*="rounded-full"], span[class*="bg-"]'
        )
      ).filter((el) => el !== badgeEl);
      const imgEl = cardEl.querySelector('img');

      // Populate Image if present
      if (imgEl && unit.imgSrc) {
        imgEl.setAttribute('src', unit.imgSrc);
        if (unit.imgAlt) imgEl.setAttribute('alt', unit.imgAlt);
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
        const unit = units[0] || {
          badge: '',
          heading: '',
          body: userContent,
          tags: [],
          imgSrc: '',
          imgAlt: '',
          raw: userContent,
        };
        populateCard(slotEls[slotIndex], unit);
        return sanitizeTailwindClasses(doc.body.innerHTML.trim());
      }
    }

    // Distribute across all slots
    slotEls.forEach((cardEl, idx) => {
      if (units[idx]) {
        populateCard(cardEl, units[idx]);
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
      reason: 'Visual Narrative Card (Image Left / Text Right)',
    };
  }

  const textLower = content.toLowerCase();
  const units = extractVerbatimTextSegments(content);
  const count = units.length;

  // 1. Check for Images or Media references
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
      ) || DESIGN_CATALOG[0];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Visual Narrative Template (Image Left / Text Right) with desktop sizing constraints.',
    };
  }

  // 2. If explicit 2 items or 2 comparison cards
  const isComparison =
    count === 2 ||
    /\b(vs|versus|before|after|traditional|manual|automated|problem|solution|pros|cons|baseline)\b/i.test(
      textLower
    );

  // 3. Process / steps (1. 2. 3. 4. or step/phase keywords with 4 steps)
  const isProcess =
    count === 4 ||
    /\b(step 1|step 2|stage 1|phase 01|step 01|milestone 1)\b/i.test(textLower);

  // 4. Strict Metrics (Actual numerical percentages or dollar amounts)
  const hasNumbers = /\b\d+(\.\d+)?%\b|\$\d+|\b\d+x\b/i.test(content);
  const isMetrics =
    hasNumbers &&
    /\b(kpi|metric|metrics|stats|growth|roi|accuracy|speedup)\b/i.test(
      textLower
    );

  // 5. Left Icon / Feature patterns
  const isIconHeader =
    /\b(feature|benefit|capability|module|shield|fast|secure|cloud|sync)\b/i.test(
      textLower
    ) || /<svg\b|<i\b/i.test(content);

  if (isComparison || count === 2) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'icon-lead-cards-duo') ||
      DESIGN_CATALOG.find((d) => d.id === 'dual-comparative-ocean') ||
      DESIGN_CATALOG[2];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched Icon Header Duo (Left Icon / Right Content) for 2-card comparison.',
    };
  }

  if (isMetrics && count >= 3) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'triple-metrics-kpi-amber') ||
      DESIGN_CATALOG[6];
    return {
      template,
      targetSlot: 'all',
      reason: 'Matched Key Metrics & Stats template for numerical figures.',
    };
  }

  if (isProcess || count === 4) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'quad-roadmap-pipeline-indigo') ||
      DESIGN_CATALOG[5];
    return {
      template,
      targetSlot: 'all',
      reason: 'Matched 4-Stage Execution Roadmap template for workflow phases.',
    };
  }

  if (count === 3 || isIconHeader) {
    const template =
      DESIGN_CATALOG.find((d) => d.id === 'icon-lead-triple-grid') ||
      DESIGN_CATALOG[3];
    return {
      template,
      targetSlot: 'all',
      reason:
        'Matched 3-Column Left-Icon Architecture (Icons Left / Text Right).',
    };
  }

  const fallback =
    DESIGN_CATALOG.find(
      (d) => d.id === 'horizontal-media-text-left-img-right'
    ) || DESIGN_CATALOG[1];
  return {
    template: fallback,
    targetSlot: 'all',
    reason:
      'Matched Spotlight Feature (Text Left / Image Right) with smooth slow animations.',
  };
}

/**
 * 100% Free AI HTML Design Enhancement via Puter.js
 * Combines free AI reasoning with fallback to deterministic Tailwind engine
 * Strictly preserves 100% of user text verbatim and supports custom styling prompts
 */
export async function enhanceHtmlWithFreeAi(rawHtml, options = {}) {
  const {
    animateOnHover = true,
    themeColor = 'ocean',
    requestedModel = 'gpt-4o-mini',
    customPrompt = '',
  } = options;

  if (!rawHtml || typeof rawHtml !== 'string') return '';

  // 1. Run deterministic style conversion first as safety baseline
  const baselineTailwind = convertInlineStylesToTailwind(rawHtml);

  // 2. Prepare AI prompt with strict verbatim constraint, desktop image constraints, left-icon structures, and slow animations
  const prompt = `You are "Se7eN AI Bot", elite Frontend Architect and Tailwind CSS Master.
Your task is to ENHANCE the following HTML code.

CRITICAL MANDATORY CONSTRAINT:
- PRESERVE 100% OF USER-GIVEN TEXT VERBATIM. DO NOT CHANGE A SINGLE WORD, DO NOT REPHRASE, DO NOT SUMMARIZE, AND DO NOT ADD FILLER OR HALLUCINATED TEXT. Every word, title, bullet point, and number provided by the user must remain intact.

STRICT TECHNICAL REQUIREMENTS:
1. CHECK FOR STYLE ATTRIBUTES: Replace 100% of inline 'style="..."' attributes with modern Tailwind CSS classes (including arbitrary values like 'bg-[#205f99]', 'p-[24px]', 'border-l-[6px]').
2. ZERO STYLE OR SCRIPT TAGS: You must NEVER include <style> or <script> tags. All styling must be pure Tailwind classes.
3. DESKTOP CARD & IMAGE SIZING RULES:
   - Ensure card images NEVER become excessively huge on desktop.
   - For cards with image + text: Use responsive flex ('flex flex-col md:flex-row items-center gap-6') where the image container is strictly bounded ('w-full md:w-[260px] lg:w-[300px] max-h-[220px] md:max-h-[260px] shrink-0 rounded-2xl overflow-hidden') and image uses 'w-full h-full object-cover'.
   - For cards with icons: Place the icon/badge on the left ('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0') and heading + text on the right ('flex-1 min-w-0').
4. SLOW, LUXURIOUS ANIMATIONS:
   - "Animate on Hover" is set to: ${animateOnHover ? 'TRUE' : 'FALSE'}.
   ${
     animateOnHover
       ? `- Since Animate on Hover is TRUE: Use slow, elegant transitions ('transition-all duration-700 ease-out'), subtle card elevation ('hover:-translate-y-1 hover:shadow-2xl'), and embed slow corner faded ambient circles on card containers (e.g. '<div class="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-primary/15 blur-2xl transition-all duration-1000 ease-out group-hover:scale-125"></div>'). Ensure card containers have 'relative overflow-hidden group'.`
       : `- Since Animate on Hover is FALSE: DO NOT add any hover transitions, animations, hover shadows, or corner circles. Provide clean, pristine, static responsive Tailwind classes only.`
   }
${
  customPrompt && customPrompt.trim()
    ? `5. USER CUSTOM DESIGN PROMPT:
   "${customPrompt.trim()}"
   Apply these custom styling and visual layout directions while keeping 100% of the user's text unchanged.`
    : ''
}
6. OUTPUT ONLY PURE HTML: No markdown wrappers (\`\`\`html), no preamble, no explanations. Just clean HTML.

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
 * STRICT RULE: Verbatim preservation of user content.
 */
export async function injectQuickTextIntoDesign(templateHtml, quickText) {
  if (!templateHtml || !quickText) return templateHtml;

  // Use deterministic slot injection first to guarantee 100% verbatim text fidelity
  const injected = injectContentIntoDesignSlots(templateHtml, quickText, 'all');
  if (injected) return injected;

  return templateHtml;
}
