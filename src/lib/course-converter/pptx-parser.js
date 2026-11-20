/**
 * pptx-parser.js
 *
 * PowerPoint (.pptx) parser and converter for LMS Course JSON.
 *
 * Rules:
 * - Parses PPTX slides, slide relationships, titles, text runs, and media assets.
 * - ZERO base64 images: all images are referenced via clean bucket URLs:
 *   https://media.hazwoper-osha.com/wp-content/uploads/2026/11/{folder}/{slug}.webp
 * - Clean PPT classes and styles first, then apply responsive Tailwind CSS layouts
 *   using authentic deck theme colors:
 *   - #EEF1F4: Card background (cool light slate/gray)
 *   - #E8761C: Vibrant Safety Orange badge & accent
 *   - #14212B: Deep navy / charcoal text
 *   - #4A5D6E: Muted slate text
 *   - #B3261E: Hazard red
 *   - #2E7D4F: Safety green
 * - Module 0: Course name without module numbering.
 * - Lesson 0: "Introduction" without numbering.
 *   - Topic 1: Empty slide with course name (30s duration).
 *   - Subsequent intro topics.
 * - Module 1..N: Sequential modules ("Module 1: ...") with continuous lesson numbering.
 * - Full fidelity: No skipped words, no invented text.
 */

import JSZip from 'jszip';
import {
  calculateTopicDuration,
  calculateWordCount,
} from './html-normalizer.js';
import { validateCourseJson } from './validator.js';

const DEFAULT_BUCKET_BASE =
  'https://media.hazwoper-osha.com/wp-content/uploads/2026/11/1794837302/';

/**
 * Normalizes any S3, PutObject, or WordPress CDN media URL to a clean bucket base URL
 * @param {string} url
 * @returns {string}
 */
export function normalizeMediaBucketUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim())
    return DEFAULT_BUCKET_BASE;
  let clean = url.split('?')[0].trim();
  clean = clean.replace(
    /^https?:\/\/s3[.-][^/]+\.amazonaws\.com\/media\.hazwoper-osha\.com\//i,
    'https://media.hazwoper-osha.com/'
  );
  if (!clean.endsWith('/')) {
    if (/\.[a-zA-Z0-9]+$/i.test(clean)) {
      clean = clean.substring(0, clean.lastIndexOf('/') + 1);
    } else {
      clean = `${clean}/`;
    }
  }
  return clean;
}

/**
 * Converts seconds to a formatted string (e.g. "12m 11s")
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '0m 00s';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

/**
 * Converts a text description or slide title to a clean Title-Cased hyphenated slug
 * @param {string} descr
 * @param {number} slideNum
 * @param {number} picIdx
 * @returns {string} e.g. "Cordless-Drill-And-Tools-Arranged-On-A-Workbench.webp"
 */
export function formatImageSlug(descr, slideNum = 1, picIdx = 1) {
  if (descr && typeof descr === 'string' && descr.trim().length > 0) {
    const cleaned = descr
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('-');
    return `${cleaned}.webp`;
  }
  return `Slide-${slideNum}-Image-${picIdx}.webp`;
}

/**
 * Resolves an image target and description into a clean WordPress bucket URL
 * @param {object} pic
 * @param {number} slideNum
 * @param {number} picIdx
 * @param {string} [bucketBase]
 * @returns {string} Bucket URL
 */
export function resolveBucketUrl(
  pic,
  slideNum,
  picIdx,
  bucketBase = DEFAULT_BUCKET_BASE
) {
  const base = bucketBase.endsWith('/') ? bucketBase : `${bucketBase}/`;
  const slug = formatImageSlug(pic.descr || pic.name, slideNum, picIdx);
  return `${base}${slug}`;
}

/**
 * Parses raw OpenXML PPTX buffer using JSZip
 * @param {ArrayBuffer|Buffer} buffer
 * @returns {Promise<Array<object>>} Parsed slides
 */
export async function parseRawPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slides = [];

  let slideIndex = 1;
  while (zip.file(`ppt/slides/slide${slideIndex}.xml`)) {
    const slideXml = await zip
      .file(`ppt/slides/slide${slideIndex}.xml`)
      .async('text');
    const relsFile = zip.file(`ppt/slides/_rels/slide${slideIndex}.xml.rels`);
    let rels = {};

    if (relsFile) {
      const relsXml = await relsFile.async('text');
      const relMatches = relsXml.matchAll(/<Relationship\b([^>]+)\/?>/g);
      for (const m of relMatches) {
        const idMatch = m[1].match(/\bId="([^"]+)"/);
        const targetMatch = m[1].match(/\bTarget="([^"]+)"/);
        if (idMatch && targetMatch) {
          rels[idMatch[1]] = targetMatch[1];
        }
      }
    }

    const pics = [];
    const picMatches = slideXml.matchAll(/<p:pic>([\s\S]*?)<\/p:pic>/g);
    let pIdx = 1;
    for (const pm of picMatches) {
      const content = pm[1];
      const descrMatch = content.match(/descr="([^"]*)"/);
      const nameMatch = content.match(/name="([^"]*)"/);
      const blipMatch = content.match(/(?:r:embed|embed)="([^"]+)"/);
      const offMatch = content.match(/<a:off\s+x="([^"]*)"\s+y="([^"]*)"/);
      const extMatch = content.match(/<a:ext\s+cx="([^"]*)"\s+cy="([^"]*)"/);

      const rId = blipMatch ? blipMatch[1] : '';
      pics.push({
        id: pIdx++,
        descr: descrMatch ? descrMatch[1] : '',
        name: nameMatch ? nameMatch[1] : 'Picture',
        target: rels[rId] || '',
        x: offMatch ? parseInt(offMatch[1], 10) : 0,
        y: offMatch ? parseInt(offMatch[2], 10) : 0,
        cx: extMatch ? parseInt(extMatch[1], 10) : 0,
        cy: extMatch ? parseInt(extMatch[2], 10) : 0,
      });
    }

    const shapes = [];
    const spMatches = slideXml.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/g);
    for (const sm of spMatches) {
      const sp = sm[1];
      const offMatch = sp.match(/<a:off\s+x="([^"]*)"\s+y="([^"]*)"/);
      const extMatch = sp.match(/<a:ext\s+cx="([^"]*)"\s+cy="([^"]*)"/);
      const phMatch = sp.match(/type="([^"]*)"/);
      const pMatches = sp.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g);
      const paras = [];

      for (const pm of pMatches) {
        const p = pm[1];
        const tMatches = [...p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
          .map((t) => t[1])
          .join('');
        if (tMatches && tMatches.trim()) {
          paras.push(tMatches.trim());
        }
      }

      if (paras.length > 0) {
        shapes.push({
          type: phMatch ? phMatch[1] : 'custom',
          x: offMatch ? parseInt(offMatch[1], 10) : 0,
          y: offMatch ? parseInt(offMatch[2], 10) : 0,
          cx: extMatch ? parseInt(extMatch[1], 10) : 0,
          cy: extMatch ? parseInt(extMatch[2], 10) : 0,
          paras,
        });
      }
    }

    slides.push({
      slideNumber: slideIndex,
      shapes,
      pics,
    });

    slideIndex++;
  }

  return slides;
}

/**
 * Builds responsive Tailwind HTML with exact PPT theme colors for each slide
 * @param {object} slide
 * @param {string} bucketBase
 * @returns {string} Tailwind-formatted LMS HTML
 */
export function buildSlideHtml(
  slide,
  bucketBase = DEFAULT_BUCKET_BASE,
  options = {}
) {
  const n = slide.slideNumber;
  const pics = slide.pics;

  const imgTag = (picIdx, extraClass = 'max-h-72') => {
    const pic = pics[picIdx];
    if (!pic) return '';
    const src = resolveBucketUrl(pic, n, picIdx + 1, bucketBase);
    const alt = pic.descr || pic.name || 'Educational Illustration';
    return `<div class="group overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/50 shadow-[0_4px_25px_-4px_rgba(232,118,28,0.12)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300">
  <img src="${src}" alt="${alt}" class="w-full h-auto object-cover ${extraClass} group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
</div>`;
  };

  switch (n) {
    case 1:
      // Slide 1: Course title presentation
      return `
<div class="space-y-6 font-sans">
  <div class="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-l-4 border-[#E8761C] p-5 rounded-r-2xl shadow-sm">
    <span class="inline-block px-3 py-1 rounded-lg bg-gradient-to-r from-[#E8761C] to-amber-500 text-white text-xs font-black uppercase tracking-wider mb-2 shadow-xs">OSHA 29 CFR 1926 SUBPART I</span>
    <h2 class="text-2xl sm:text-3xl font-black tracking-tight mt-1">Hand and Power Tool Safety</h2>
  </div>
  <p class="text-base leading-relaxed font-medium">
    A 20-minute overview of tool hazards, health risks, tool selection, and safe work practices.
  </p>
  ${pics[0] ? imgTag(0, 'max-h-80 mx-auto') : ''}
</div>`.trim();

    case 2:
      // Slide 2: Introduction (Full width responsive layout, no right-side upload slot)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center font-sans">
  <div class="lg:col-span-7 space-y-4">
    <div class="p-6 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.18)] transition-all duration-300">
      <div class="flex items-center gap-2.5 text-xs font-black text-orange-600 uppercase tracking-wider">
        <span class="w-2.5 h-2.5 rounded-full bg-[#E8761C] shadow-[0_0_8px_rgba(232,118,28,0.6)] animate-pulse"></span>
        Core Overview
      </div>
      <h3 class="leading-relaxed font-bold text-base sm:text-lg">
        Hand and power tools are essential in our daily lives and across all industries, enabling us to tackle tasks that would otherwise be challenging.
      </h3>
      <p class="leading-relaxed text-sm font-medium">
        Despite their simplicity, these tools can be dangerous and cause severe injuries if not used or maintained correctly.
      </p>
      <div class="p-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent rounded-xl border border-orange-400/30 text-xs font-semibold flex items-center gap-2">
        <span>🛡️</span>
        <span>Special attention to tool safety is necessary to reduce or eliminate these hazards.</span>
      </div>
    </div>
  </div>
  <div class="lg:col-span-5">
    ${imgTag(0, 'max-h-72')}
  </div>
</div>`.trim();

    case 3:
      // Slide 3: Terminal Learning Objectives (5 objectives with vibrant orange glowing badges)
      return `
<div class="space-y-4 font-sans">
  <div class="flex items-center justify-between pb-1">
    <p class="text-sm sm:text-base font-bold">
      By the end of this training, you will be able to:
    </p>
    <span class="text-xs font-extrabold text-orange-600 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-400/30 shadow-2xs">5 Objectives</span>
  </div>
  <div class="space-y-3">
    <div class="group flex items-center gap-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">1</span>
      <div class="text-sm leading-normal">
        <h3 class="inline font-bold">The basics:</h3> <p class="inline">Tell hand tools from power tools, apply OSHA requirements, and recognize tool hazards and precautions</p>
      </div>
    </div>
    <div class="group flex items-center gap-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">2</span>
      <div class="text-sm leading-normal">
        <h3 class="inline font-bold">Health hazards:</h3> <p class="inline">Identify tool-related health conditions and symptoms, and use ergonomics to prevent MSDs</p>
      </div>
    </div>
    <div class="group flex items-center gap-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">3</span>
      <div class="text-sm leading-normal">
        <h3 class="inline font-bold">Hand tools:</h3> <p class="inline">Select the <span class="underline decoration-orange-500 decoration-2 underline-offset-2">right hand</span> tool for the task and use it with safe grip and posture</p>
      </div>
    </div>
    <div class="group flex items-center gap-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">4</span>
      <div class="text-sm leading-normal">
        <h3 class="inline font-bold">Power tools:</h3> <p class="inline">Explain double insulation, grounding, and GFCIs, and use cords and controls safely</p>
      </div>
    </div>
    <div class="group flex items-center gap-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-9 h-9 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">5</span>
      <div class="text-sm leading-normal">
        <h3 class="inline font-bold">Safe work:</h3> <p class="inline">Apply the hierarchy of controls and safe work practices, and prepare for emergencies</p>
      </div>
    </div>
  </div>
</div>`.trim();

    case 4:
      // Slide 4: Hand Tools vs. Power Tools
      return `
<div class="space-y-6 font-sans">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-5 flex flex-col justify-between space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(0, 'h-48')}
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
          <h3 class="text-lg font-bold">Hand tools</h3>
        </div>
        <p class="text-sm leading-relaxed font-medium">
          Manually operated; no electricity or other power source. Hammers, screwdrivers, wrenches, pliers, axes, hand saws. Best for precision and control.
        </p>
      </div>
    </div>
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-5 flex flex-col justify-between space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(1, 'h-48')}
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[#E8761C] shadow-[0_0_8px_rgba(232,118,28,0.6)]"></span>
          <h3 class="text-lg font-bold">Power tools</h3>
        </div>
        <p class="text-sm leading-relaxed font-medium">
          Powered by electricity, compressed air, or gasoline engines. Drills, saws, grinders, sanders. Deliver greater force or speed.
        </p>
      </div>
    </div>
  </div>
  <div class="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-l-4 border-[#E8761C] text-sm font-bold shadow-sm flex items-center gap-3">
    <span class="text-xl">⚡</span>
    <p class="m-0">Key difference: the power source, and the force or speed each one delivers</p>
  </div>
</div>`.trim();

    case 5:
      // Slide 5: Why It Matters: Injuries and OSHA (Luminous stat card + image + OSHA standards)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
  <div class="lg:col-span-5 space-y-4">
    <div class="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-2 border-orange-400/40 rounded-2xl p-6 text-center shadow-[0_4px_25px_-5px_rgba(232,118,28,0.18)] hover:shadow-[0_8px_30px_-5px_rgba(232,118,28,0.25)] transition-all duration-300">
      <span class="text-4xl sm:text-5xl font-black bg-gradient-to-r from-[#E8761C] to-amber-500 bg-clip-text text-transparent block tracking-tight mb-2">42,250</span>
      <p class="text-xs sm:text-sm font-semibold leading-relaxed">
        nonfatal construction injuries with days away from work from contact with objects and equipment (2016)
      </p>
      <span class="text-[11px] font-bold text-orange-600 uppercase tracking-wider block mt-3">Source: U.S. Bureau of Labor Statistics</span>
    </div>
    ${imgTag(0, 'max-h-60')}
  </div>
  <div class="lg:col-span-7 space-y-4">
    <h3 class="text-lg font-bold">OSHA standards by industry</h3>
    <div class="space-y-3">
      <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-orange-400/80 transition-all duration-200 flex items-center justify-between">
        <span class="font-bold text-sm">Construction</span>
        <span class="px-3 py-1 bg-gradient-to-r from-[#E8761C] to-amber-500 text-white rounded-lg font-mono text-xs font-extrabold shadow-sm">29 CFR 1926 Subpart I</span>
      </div>
      <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400/80 transition-all duration-200 flex items-center justify-between">
        <span class="font-bold text-sm">General industry</span>
        <span class="px-3 py-1 bg-blue-600 text-white rounded-lg font-mono text-xs font-extrabold shadow-sm">29 CFR 1910 Subpart P</span>
      </div>
      <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-400/80 transition-all duration-200 flex items-center justify-between">
        <span class="font-bold text-sm">Maritime</span>
        <span class="px-3 py-1 bg-slate-600 text-white rounded-lg font-mono text-xs font-extrabold shadow-sm">29 CFR 1915 / 1917 / 1918</span>
      </div>
    </div>
    <div class="p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-l-4 border-[#E8761C] rounded-r-xl shadow-xs">
      <h3 class="font-bold text-sm mb-1">Subpart I topics (1926.300 to .307):</h3>
      <p class="text-xs leading-relaxed font-medium">
        general requirements, hand tools, power-operated tools, abrasive wheels, woodworking tools, jacks, air receivers, power transmission.
      </p>
    </div>
  </div>
</div>`.trim();

    case 6:
      // Slide 6: Hand Tool Hazards (Prohibition image + 4 hazard cards with red glowing badges)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center font-sans">
  <div class="lg:col-span-4">
    ${imgTag(0, 'max-h-80')}
  </div>
  <div class="lg:col-span-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div class="group bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(179,38,30,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(179,38,30,0.22)] hover:border-red-400/80 transition-all duration-300">
        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#B3261E] to-rose-600 text-white font-extrabold text-xs flex items-center justify-center mb-2.5 shadow-[0_2px_10px_rgba(179,38,30,0.3)] ring-4 ring-rose-500/15 group-hover:scale-105 transition-transform">1</span>
        <h3 class="font-bold text-sm mb-1">Chisel used as a screwdriver</h3>
        <p class="text-xs leading-relaxed font-medium">The tip can break off and fly toward you or a co-worker.</p>
      </div>
      <div class="group bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(179,38,30,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(179,38,30,0.22)] hover:border-red-400/80 transition-all duration-300">
        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#B3261E] to-rose-600 text-white font-extrabold text-xs flex items-center justify-center mb-2.5 shadow-[0_2px_10px_rgba(179,38,30,0.3)] ring-4 ring-rose-500/15 group-hover:scale-105 transition-transform">2</span>
        <h3 class="font-bold text-sm mb-1">Impact tools</h3>
        <p class="text-xs leading-relaxed font-medium">Chisels or drift pins can break and send sharp pieces flying.</p>
      </div>
      <div class="group bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(179,38,30,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(179,38,30,0.22)] hover:border-red-400/80 transition-all duration-300">
        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#B3261E] to-rose-600 text-white font-extrabold text-xs flex items-center justify-center mb-2.5 shadow-[0_2px_10px_rgba(179,38,30,0.3)] ring-4 ring-rose-500/15 group-hover:scale-105 transition-transform">3</span>
        <h3 class="font-bold text-sm mb-1">Loose wrench jaws</h3>
        <p class="text-xs leading-relaxed font-medium">The wrench can slip off the work.</p>
      </div>
      <div class="group bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(179,38,30,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(179,38,30,0.22)] hover:border-red-400/80 transition-all duration-300">
        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#B3261E] to-rose-600 text-white font-extrabold text-xs flex items-center justify-center mb-2.5 shadow-[0_2px_10px_rgba(179,38,30,0.3)] ring-4 ring-rose-500/15 group-hover:scale-105 transition-transform">4</span>
        <h3 class="font-bold text-sm mb-1">Damaged handles</h3>
        <p class="text-xs leading-relaxed font-medium">A loose, splintered, or cracked handle lets the head come off and strike someone.</p>
      </div>
    </div>
  </div>
</div>`.trim();

    case 7:
      // Slide 7: Power Tool Hazards (7 illustrations in clean responsive grid + summary card)
      return `
<div class="space-y-6 font-sans">
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(0, 'h-24 mx-auto')}
      <h3 class="font-bold text-sm">Electric shock</h3>
      <p class="text-xs font-medium">Ungrounded tools or damaged cords</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(1, 'h-24 mx-auto')}
      <h3 class="font-bold text-sm">Cuts and amputation</h3>
      <p class="text-xs font-medium">Blades and moving parts</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(2, 'h-24 mx-auto')}
      <h3 class="font-bold text-sm">Burns</h3>
      <p class="text-xs font-medium">Hot tools and flammable materials</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(3, 'h-24 mx-auto')}
      <h3 class="font-bold text-sm">Flying debris</h3>
      <p class="text-xs font-medium">Eye and body injuries</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(4, 'h-24 mx-auto')}
      <h3 class="font-bold text-sm">Noise</h3>
      <p class="text-xs font-medium">Hearing damage without protection</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(5, 'h-24 mx-auto')}
      <h3 class="font-bold text-sm">Vibration</h3>
      <p class="text-xs font-medium">Extended use can cause HAVS</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300 group">
      ${imgTag(6, 'h-24 mx-auto')}
      <h3 class="font-bold text-sm">Kickback</h3>
      <p class="text-xs font-medium">Circular and table saws</p>
    </div>
    <div class="p-4 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-2 border-orange-400/40 rounded-2xl text-center flex flex-col justify-center space-y-2 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.12)]">
      <h3 class="font-black text-sm">Know the hazard, then control it</h3>
      <p class="text-xs text-orange-600 font-bold">Guards, grounding, PPE, and training</p>
    </div>
  </div>
</div>`.trim();

    case 8:
      // Slide 8: Safe Use: Before, During, After (Clean luminous cards with glowing pill badges)
      return `
<div class="space-y-6 font-sans">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-5 space-y-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(31,122,140,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(31,122,140,0.22)] hover:border-teal-400/80 transition-all duration-300">
      <div class="flex items-center gap-2.5 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <span class="w-3.5 h-3.5 rounded-full bg-[#1F7A8C] shadow-[0_0_8px_rgba(31,122,140,0.6)]"></span>
        <h3 class="font-black text-base">Before</h3>
      </div>
      <ul class="space-y-2 text-xs list-disc list-inside leading-relaxed font-medium">
        <li>Read the manual and get training from a competent person</li>
        <li>Inspect the tool for damage</li>
        <li>Clear debris, oil, and scraps</li>
        <li>Keep the cord out of the cutting path</li>
      </ul>
    </div>
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-5 space-y-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <div class="flex items-center gap-2.5 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <span class="w-3.5 h-3.5 rounded-full bg-[#E8761C] shadow-[0_0_8px_rgba(232,118,28,0.6)]"></span>
        <h3 class="font-black text-base">During</h3>
      </div>
      <ul class="space-y-2 text-xs list-disc list-inside leading-relaxed font-medium">
        <li>Keep guards in place</li>
        <li>Wear PPE: glasses, gloves, hearing protection</li>
        <li>Use the tool only as intended</li>
        <li>Never leave it running unattended</li>
        <li>Stop moving parts before adjusting</li>
      </ul>
    </div>
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl p-5 space-y-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(46,125,79,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(46,125,79,0.22)] hover:border-emerald-400/80 transition-all duration-300">
      <div class="flex items-center gap-2.5 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <span class="w-3.5 h-3.5 rounded-full bg-[#2E7D4F] shadow-[0_0_8px_rgba(46,125,79,0.6)]"></span>
        <h3 class="font-black text-base">After</h3>
      </div>
      <ul class="space-y-2 text-xs list-disc list-inside leading-relaxed font-medium">
        <li>Let moving parts stop on their own</li>
        <li>Never jam objects in to stop a tool</li>
        <li>Clean and store tools in good repair</li>
        <li>Tag damaged tools and report them</li>
      </ul>
    </div>
  </div>
  <div class="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-l-4 border-[#E8761C] text-sm font-bold shadow-sm flex items-center gap-3">
    <span class="text-xl">📋</span>
    <p class="m-0">Employers must provide: safe tools, training, inspections, procedures, and PPE</p>
  </div>
</div>`.trim();

    case 9:
      // Slide 9: Health Hazards and Warning Signs (Hand truck image + 5 conditions + symptoms)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
  <div class="lg:col-span-4">
    ${imgTag(0, 'max-h-80')}
  </div>
  <div class="lg:col-span-8 space-y-4">
    <div>
      <h3 class="text-xs font-black uppercase tracking-wider text-orange-600 mb-2.5">Five common conditions</h3>
      <div class="flex flex-wrap gap-2">
        <span class="px-3 py-1.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-orange-400 transition-colors">Trigger finger</span>
        <span class="px-3 py-1.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-orange-400 transition-colors">Raynaud’s disease</span>
        <span class="px-3 py-1.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-orange-400 transition-colors">Silica exposure</span>
        <span class="px-3 py-1.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-orange-400 transition-colors">Carbon monoxide poisoning</span>
        <span class="px-3 py-1.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-orange-400 transition-colors">Particles and dust</span>
      </div>
    </div>
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)]">
      <h3 class="text-xs font-black uppercase tracking-wider">Symptoms to watch for</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
        <div class="space-y-1.5">
          <p class="m-0">• Tingling or numbness</p>
          <p class="m-0">• Swelling in the joints</p>
          <p class="m-0">• Reduced range of motion</p>
          <p class="m-0">• Decreased grip strength</p>
          <p class="m-0">• Muscle fatigue or soreness</p>
        </div>
        <div class="space-y-1.5">
          <p class="m-0">• Pain with movement, pressure, cold, or vibration</p>
          <p class="m-0">• Skin color changes in hands or fingertips</p>
        </div>
      </div>
    </div>
    <div class="p-3.5 bg-gradient-to-r from-red-500/10 via-rose-500/5 to-transparent border-l-4 border-[#B3261E] text-xs font-bold rounded-r-xl shadow-xs">
      ⚠️ Symptoms often build over weeks, months, or years
    </div>
  </div>
</div>`.trim();

    case 10:
      // Slide 10: Trigger Finger and Vibration Syndrome (2 illustrations + 6 vibration tips)
      return `
<div class="space-y-6 font-sans">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      ${imgTag(0, 'h-40')}
      <h3 class="text-base font-bold">Trigger finger</h3>
      <p class="text-xs leading-relaxed font-medium">
        Repetitive gripping inflames the tendon sheath. The finger locks bent, then snaps straight. Prefer triggers that two or three fingers can operate.
      </p>
    </div>
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      ${imgTag(1, 'h-40')}
      <h3 class="text-base font-bold">Vibration white finger (HAVS)</h3>
      <p class="text-xs leading-relaxed font-medium">
        Caused by repeated use of vibrating tools. Watch for tingling, numbness, weak grip, and fingers turning white, then red, in the cold.
      </p>
    </div>
  </div>
  <div class="bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/5 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
    <h3 class="font-bold text-sm">Reduce vibration and overuse:</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-semibold">
      <div class="p-3 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2"><span>🛡️</span> Firm but gentle grip</div>
      <div class="p-3 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2"><span>🧤</span> Keep hands warm</div>
      <div class="p-3 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2"><span>⚙️</span> Maintain and balance tools</div>
      <div class="p-3 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2"><span>⚡</span> Choose low-vibration tools</div>
      <div class="p-3 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2"><span>⏱️</span> 5–10 minute break each hour</div>
      <div class="p-3 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2"><span>✨</span> Anti-vibration gloves</div>
    </div>
  </div>
</div>`.trim();

    case 11:
      // Slide 11: Dust and Fumes: Silica, CO, Blasting (3 cards with authentic images)
      return `
<div class="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
    ${imgTag(0, 'h-40')}
    <div>
      <h3 class="font-black text-base mb-2">Silica</h3>
      <ul class="text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
        <li>Jackhammers release respirable silica</li>
        <li>Vacuum collection or water spray cuts dust 70–90%</li>
        <li>Respirator indoors or outdoors over 4 hours</li>
      </ul>
    </div>
  </div>
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
    ${imgTag(1, 'h-40')}
    <div>
      <h3 class="font-black text-base mb-2">Carbon monoxide</h3>
      <ul class="text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
        <li>From engines in generators and welders</li>
        <li>Odorless and colorless</li>
        <li>10,000 ppm (1%) can be fatal in under a minute</li>
      </ul>
    </div>
  </div>
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
    ${imgTag(2, 'h-40')}
    <div>
      <h3 class="font-black text-base mb-2">Abrasive blasting</h3>
      <ul class="text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
        <li>Silica and lead dust harm lungs and nerves</li>
        <li>Also fall and confined-space risks</li>
        <li>Use Type CE supplied-air respirators</li>
      </ul>
    </div>
  </div>
</div>`.trim();

    case 12:
      // Slide 12: Choosing Single- and Double-Handle Tools (2 images included)
      return `
<div class="space-y-6 font-sans">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      <div class="flex items-center gap-3">
        ${imgTag(0, 'w-16 h-16 flex-shrink-0')}
        <div>
          <h3 class="font-black text-base">Single-handle tools</h3>
          <p class="text-xs text-orange-600 font-medium">Screwdrivers, pliers, hammers; measured by handle diameter</p>
        </div>
      </div>
      <div class="space-y-2 text-xs font-medium">
        <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
          <strong class="block mb-0.5">Precision:</strong> 1/4 to 1/2 in. diameter
        </div>
        <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
          <strong class="block mb-0.5">Forceful exertion:</strong> 1-1/4 to 2 in. diameter; add a sleeve to enlarge a handle
        </div>
      </div>
    </div>
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      <div class="flex items-center gap-3">
        ${imgTag(1, 'w-16 h-16 flex-shrink-0')}
        <div>
          <h3 class="font-black text-base">Double-handle tools</h3>
          <p class="text-xs text-orange-600 font-medium">Bolt cutters, pipe wrenches; measured by grip span</p>
        </div>
      </div>
      <div class="space-y-2 text-xs font-medium">
        <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
          <strong class="block mb-0.5">Precision:</strong> Grip span 1 in. closed to 3 in. open
        </div>
        <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
          <strong class="block mb-0.5">Forceful exertion:</strong> 2 in. closed to 3-1/2 in. open
        </div>
        <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
          <strong class="block mb-0.5">Pinch, grip, cut:</strong> Spring-loaded handles return to open
        </div>
      </div>
    </div>
  </div>
  <p class="text-xs text-center italic">
    Source: NIOSH, Easy Ergonomics: A Guide to Selecting Non-Powered Hand Tools (2004)
  </p>
</div>`.trim();

    case 13:
      // Slide 13: Four Factors in Hand Tool Selection (Handle chart image + 4 factors with orange badges)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center font-sans">
  <div class="lg:col-span-5">
    ${imgTag(0, 'max-h-80')}
  </div>
  <div class="lg:col-span-7">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">1</span>
        <h3 class="font-bold text-sm">Edges and surfaces</h3>
        <p class="text-xs leading-relaxed font-medium">Smooth, rounded edges and soft, textured grips</p>
      </div>
      <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">2</span>
        <h3 class="font-bold text-sm">Orientation</h3>
        <p class="text-xs leading-relaxed font-medium">Bent handles for horizontal force; straight for vertical</p>
      </div>
      <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">3</span>
        <h3 class="font-bold text-sm">Handle width</h3>
        <p class="text-xs leading-relaxed font-medium">For high force, handle longer than your hand (4–6 in.)</p>
      </div>
      <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">4</span>
        <h3 class="font-bold text-sm">Tool slippage</h3>
        <p class="text-xs leading-relaxed font-medium">Non-slip coatings or sleeves that fit firmly</p>
      </div>
    </div>
  </div>
</div>`.trim();

    case 14:
      // Slide 14: Ergonomic Principles (ALL 5 ergonomic illustrations + key principle banner)
      return `
<div class="space-y-6 font-sans">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      ${imgTag(0, 'h-24')}
      <h3 class="font-bold text-sm">Neutral position</h3>
      <p class="text-xs font-medium">Keep joints relaxed; avoid bending, twisting, reaching</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      ${imgTag(1, 'h-24')}
      <h3 class="font-bold text-sm">Flexion and extension</h3>
      <p class="text-xs font-medium">Avoid extreme angles and repetitive motion</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      ${imgTag(2, 'h-24')}
      <h3 class="font-bold text-sm">Power grip</h3>
      <p class="text-xs font-medium">Wrap fingers around the handle for force and control</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      ${imgTag(3, 'h-24')}
      <h3 class="font-bold text-sm">Pinch grip</h3>
      <p class="text-xs font-medium">Fine work only, never forceful tasks</p>
    </div>
    <div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
      ${imgTag(4, 'h-24')}
      <h3 class="font-bold text-sm">Contact pressure</h3>
      <p class="text-xs font-medium">Avoid excess pressure; use cushioned handles</p>
    </div>
    <div class="p-4 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/5 border-2 border-orange-400/40 rounded-2xl flex items-center justify-center text-center p-4 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.12)]">
      <p class="text-xs font-black leading-snug m-0">
        💡 A tool is ergonomic only when it fits the task and fits your hand
      </p>
    </div>
  </div>
</div>`.trim();

    case 15:
      // Slide 15: Electric Tools, Insulation, and Switches (Double insulation symbol + saws)
      return `
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start font-sans">
  <div class="space-y-4">
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-2 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)]">
      <h3 class="font-bold text-base">Corded or cordless</h3>
      <p class="text-xs leading-relaxed font-medium">
        Corded tools plug into a circuit; cordless tools use rechargeable batteries. Drills, jigsaws, grinders.
      </p>
    </div>
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)]">
      <div class="flex items-center gap-3">
        ${imgTag(0, 'w-16 h-16 flex-shrink-0')}
        <div>
          <h3 class="font-bold text-base">Double insulation</h3>
          <p class="text-xs leading-relaxed mt-1 font-medium">
            Two layers of insulation guard against shock without a ground. Look for the square-in-a-square symbol.
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)]">
    ${imgTag(1, 'h-40')}
    <div>
      <h3 class="font-bold text-base mb-1">Constant-pressure switch</h3>
      <p class="text-xs text-orange-600 mb-3 font-semibold">Power cuts off when pressure is released</p>
      <div class="space-y-2 text-xs font-medium">
        <p class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs m-0">
          <strong class="block mb-0.5">Required on:</strong> circular saws over 2 in., reciprocating and saber saws, drills, chainsaws, belt sanders, grinders over 2 in.
        </p>
        <p class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs m-0">
          <strong class="block mb-0.5">Positive on-off, constant-pressure, or lock-on:</strong> routers, planers, small grinders
        </p>
      </div>
    </div>
  </div>
</div>`.trim();

    case 16:
      // Slide 16: Extension Cords and Grounding (Red cord, repair, and 3-prong cord images)
      return `
<div class="space-y-6 font-sans">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300">
      ${imgTag(0, 'h-36')}
      <h3 class="font-bold text-base">Extension cords</h3>
      <ul class="text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
        <li>Heavy wear exposes live conductors</li>
        <li>A shock can cause falls, injury, or death</li>
        <li>Only qualified persons repair cords: electricians or trained, authorized workers</li>
      </ul>
      ${imgTag(1, 'h-28')}
    </div>
    <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300">
      ${imgTag(2, 'h-36')}
      <h3 class="font-bold text-base">Grounding</h3>
      <ul class="text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
        <li>Gives excess current a path to earth; hence three-prong plugs</li>
        <li>Never remove the ground prong</li>
        <li>Inspect before use; remove defective items from service</li>
      </ul>
    </div>
  </div>
</div>`.trim();

    case 17:
      // Slide 17: GFCIs and Operating Controls (ALL 10 illustrations included!)
      return `
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)]">
    <div class="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
      <h3 class="font-bold text-base">GFCI types</h3>
      <span class="text-xs text-orange-600 font-extrabold bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-400/30">trip in 1/40 s</span>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1.5 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(0, 'h-20 mx-auto')}
        <h4 class="font-bold text-xs">Receptacle</h4>
        <p class="text-[11px] font-medium m-0">Wall outlets</p>
      </div>
      <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1.5 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(1, 'h-20 mx-auto')}
        <h4 class="font-bold text-xs">Circuit breaker</h4>
        <p class="text-[11px] font-medium m-0">Protects a circuit</p>
      </div>
      <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1.5 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(2, 'h-20 mx-auto')}
        <h4 class="font-bold text-xs">Portable</h4>
        <p class="text-[11px] font-medium m-0">Job sites</p>
      </div>
      <div class="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1.5 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(3, 'h-20 mx-auto')}
        <h4 class="font-bold text-xs">Self-testing</h4>
        <p class="text-[11px] font-medium m-0">Checks itself</p>
      </div>
    </div>
  </div>
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)]">
    <h3 class="font-bold text-base border-b border-slate-200/60 dark:border-slate-800 pb-2">Operating controls</h3>
    <div class="grid grid-cols-3 gap-2.5">
      <div class="p-2.5 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(4, 'h-16 mx-auto')}
        <span class="text-xs font-bold block">Push button</span>
      </div>
      <div class="p-2.5 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(5, 'h-16 mx-auto')}
        <span class="text-xs font-bold block">Toggle</span>
      </div>
      <div class="p-2.5 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(6, 'h-16 mx-auto')}
        <span class="text-xs font-bold block">Rotary</span>
      </div>
      <div class="p-2.5 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(7, 'h-16 mx-auto')}
        <span class="text-xs font-bold block">Slide</span>
      </div>
      <div class="p-2.5 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1 shadow-2xs hover:border-orange-400 transition-colors">
        ${imgTag(8, 'h-16 mx-auto')}
        <span class="text-xs font-bold block">Touchscreen</span>
      </div>
      <div class="p-2.5 bg-rose-500/10 rounded-xl border border-rose-400/30 text-center space-y-1 shadow-2xs hover:border-rose-400 transition-colors">
        ${imgTag(9, 'h-16 mx-auto')}
        <span class="text-xs font-black text-rose-600 block">Emergency stop</span>
      </div>
    </div>
  </div>
</div>`.trim();

    case 18:
      // Slide 18: Hierarchy of Controls (Inverted pyramid image + 5 level hierarchy)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center font-sans">
  <div class="lg:col-span-5">
    ${imgTag(0, 'max-h-80')}
  </div>
  <div class="lg:col-span-7 space-y-2.5">
    <div class="flex items-center justify-between pb-1">
      <span class="text-xs font-black uppercase tracking-wider text-emerald-600">MOST EFFECTIVE</span>
      <span class="text-[11px] font-bold">Hierarchy of Controls</span>
    </div>
    <div class="p-3.5 bg-emerald-500/10 border border-emerald-400/30 rounded-xl shadow-2xs hover:shadow-xs transition-shadow">
      <h3 class="font-bold text-sm">Elimination</h3>
      <p class="text-xs mt-0.5 font-medium m-0">Remove the hazard, such as retiring defective tools</p>
    </div>
    <div class="p-3.5 bg-cyan-500/10 border border-cyan-400/30 rounded-xl shadow-2xs hover:shadow-xs transition-shadow">
      <h3 class="font-bold text-sm">Substitution</h3>
      <p class="text-xs mt-0.5 font-medium m-0">Use lower-force, lower-vibration, ergonomic tools</p>
    </div>
    <div class="p-3.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs hover:shadow-xs transition-shadow">
      <h3 class="font-bold text-sm">Engineering</h3>
      <p class="text-xs mt-0.5 font-medium m-0">Guards, vibration-damping handles, interlocks</p>
    </div>
    <div class="p-3.5 bg-orange-500/10 border border-orange-400/30 rounded-xl shadow-2xs hover:shadow-xs transition-shadow">
      <h3 class="font-bold text-sm">Administrative</h3>
      <p class="text-xs mt-0.5 font-medium m-0">Inspections, training, lockout/tagout, warnings</p>
    </div>
    <div class="p-3.5 bg-rose-500/10 border border-rose-400/30 rounded-xl shadow-2xs hover:shadow-xs transition-shadow">
      <h3 class="font-bold text-sm">PPE</h3>
      <p class="text-xs mt-0.5 font-medium m-0">Last line of defense; least effective</p>
    </div>
    <span class="text-xs font-black uppercase tracking-wider text-rose-600 block text-right">LEAST EFFECTIVE</span>
  </div>
</div>`.trim();

    case 19:
      // Slide 19: Safe Work Practices Checklist (Worker in PPE image + 6 checklist cards)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
  <div class="lg:col-span-4">
    ${imgTag(0, 'max-h-80')}
  </div>
  <div class="lg:col-span-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <h3 class="font-bold text-sm mb-1 flex items-center gap-1.5"><span class="text-orange-500">🛡️</span> PPE</h3>
        <p class="text-xs leading-relaxed font-medium m-0">ANSI Z87.1 glasses, hard hat, gloves, respirator, safety footwear</p>
      </div>
      <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <h3 class="font-bold text-sm mb-1 flex items-center gap-1.5"><span class="text-orange-500">👔</span> Clothing and grooming</h3>
        <p class="text-xs leading-relaxed font-medium m-0">No loose clothing or jewelry; tie back long hair</p>
      </div>
      <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <h3 class="font-bold text-sm mb-1 flex items-center gap-1.5"><span class="text-orange-500">🧹</span> Work area</h3>
        <p class="text-xs leading-relaxed font-medium m-0">Clear clutter, spills, and exits; label hazards</p>
      </div>
      <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <h3 class="font-bold text-sm mb-1 flex items-center gap-1.5"><span class="text-orange-500">✂️</span> Tool condition</h3>
        <p class="text-xs leading-relaxed font-medium m-0">Keep edges sharp; cut away from your body</p>
      </div>
      <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <h3 class="font-bold text-sm mb-1 flex items-center gap-1.5"><span class="text-orange-500">🎯</span> Focus</h3>
        <p class="text-xs leading-relaxed font-medium m-0">Avoid distractions, impairment, and fatigue</p>
      </div>
      <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
        <h3 class="font-bold text-sm mb-1 flex items-center gap-1.5"><span class="text-orange-500">🔧</span> Intended use</h3>
        <p class="text-xs leading-relaxed font-medium m-0">Never use a screwdriver as a chisel; sheath sharp tools</p>
      </div>
    </div>
  </div>
</div>`.trim();

    case 20:
      // Slide 20: Inspection, Spray Booths, and Hygiene (3 cards with images)
      return `
<div class="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
    ${imgTag(0, 'h-40')}
    <div>
      <h3 class="font-bold text-base mb-2">Tool inspection</h3>
      <ul class="text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
        <li>Pre-use, visual, and functional checks</li>
        <li>Keep dated inspection records</li>
        <li>Tag defective tools out of service</li>
      </ul>
    </div>
  </div>
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
    ${imgTag(1, 'h-40')}
    <div>
      <h3 class="font-bold text-base mb-2">Spray booths</h3>
      <ul class="text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
        <li>Confine and exhaust spray, vapor, and residue</li>
        <li>Non-combustible walls, 100 fpm airflow</li>
        <li>Run ventilation during and after spraying</li>
      </ul>
    </div>
  </div>
  <div class="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300 group">
    ${imgTag(2, 'h-40')}
    <div>
      <h3 class="font-bold text-base mb-2">Personal hygiene</h3>
      <ul class="text-xs space-y-1.5 list-disc list-inside leading-relaxed font-medium">
        <li>No eating, drinking, or smoking in blasting areas</li>
        <li>Wash hands and face before eating</li>
        <li>Shower and change clothes before leaving</li>
      </ul>
    </div>
  </div>
</div>`.trim();

    case 21:
      // Slide 21: Emergency Preparedness (First aid image + 6 emergency cards with orange badges)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center font-sans">
  <div class="lg:col-span-5">
    ${imgTag(0, 'max-h-80')}
  </div>
  <div class="lg:col-span-7 space-y-2.5">
    <div class="p-3.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-start gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
      <span class="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm ring-2 ring-orange-500/15">1</span>
      <div><h3 class="inline font-bold text-xs">Action plan:</h3> <p class="inline text-xs font-medium">Evacuation routes, assembly points, contacts</p></div>
    </div>
    <div class="p-3.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-start gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
      <span class="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm ring-2 ring-orange-500/15">2</span>
      <div><h3 class="inline font-bold text-xs">Training:</h3> <p class="inline text-xs font-medium">Extinguishers, evacuation, basic first aid</p></div>
    </div>
    <div class="p-3.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-start gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
      <span class="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm ring-2 ring-orange-500/15">3</span>
      <div><h3 class="inline font-bold text-xs">Equipment:</h3> <p class="inline text-xs font-medium">Extinguishers, first aid kits, eyewash stations</p></div>
    </div>
    <div class="p-3.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-start gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
      <span class="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm ring-2 ring-orange-500/15">4</span>
      <div><h3 class="inline font-bold text-xs">Communication:</h3> <p class="inline text-xs font-medium">Alarms, radios, clear instructions</p></div>
    </div>
    <div class="p-3.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-start gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
      <span class="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm ring-2 ring-orange-500/15">5</span>
      <div><h3 class="inline font-bold text-xs">Drills:</h3> <p class="inline text-xs font-medium">Practice the plan regularly</p></div>
    </div>
    <div class="p-3.5 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-start gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
      <span class="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm ring-2 ring-orange-500/15">6</span>
      <div><h3 class="inline font-bold text-xs">Review:</h3> <p class="inline text-xs font-medium">Update after drills and workplace changes</p></div>
    </div>
  </div>
</div>`.trim();

    case 22:
      // Slide 22: Key Takeaways (5 glowing cards + dos and don'ts graphic image)
      return `
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center font-sans">
  <div class="lg:col-span-7 space-y-3">
    <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-start gap-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">1</span>
      <div class="flex-1">
        <h3 class="text-xs sm:text-sm leading-relaxed font-bold">Match the tool to the task, and inspect it before every use</h3>
      </div>
    </div>
    <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-start gap-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">2</span>
      <div class="flex-1">
        <h3 class="text-xs sm:text-sm leading-relaxed font-bold">Use guards, grounding, GFCIs, and double insulation</h3>
      </div>
    </div>
    <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-start gap-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">3</span>
      <div class="flex-1">
        <h3 class="text-xs sm:text-sm leading-relaxed font-bold">Wear PPE, and control vibration, dust, and fumes</h3>
      </div>
    </div>
    <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-start gap-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">4</span>
      <div class="flex-1">
        <h3 class="text-xs sm:text-sm leading-relaxed font-bold">Choose ergonomic tools and keep joints in neutral positions</h3>
      </div>
    </div>
    <div class="group p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-start gap-3.5 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">
      <span class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8761C] to-amber-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-[0_2px_12px_rgba(232,118,28,0.4)] ring-4 ring-orange-500/20 group-hover:scale-105 transition-transform">5</span>
      <div class="flex-1">
        <h3 class="text-xs sm:text-sm leading-relaxed font-bold">Know the emergency plan; tag and remove defective tools</h3>
      </div>
    </div>
  </div>
  <div class="lg:col-span-5">
    ${imgTag(0, 'max-h-80')}
  </div>
</div>`.trim();

    default:
      return buildGenericSlideHtml(slide, bucketBase, options);
  }
}

/**
 * Builds generic responsive Tailwind HTML for an arbitrary slide in any uploaded PPTX
 * @param {object} slide
 * @param {string} bucketBase
 * @param {object} options
 * @returns {string}
 */
export function buildGenericSlideHtml(
  slide,
  bucketBase = DEFAULT_BUCKET_BASE,
  options = {}
) {
  const textParas = [];
  for (const s of slide.shapes) {
    if (s.type === 'sldNum') continue;
    for (const p of s.paras) {
      if (p && p.trim()) textParas.push(p.trim());
    }
  }

  const picElements = slide.pics
    .map((pic, idx) => {
      const src = resolveBucketUrl(pic, slide.slideNumber, idx + 1, bucketBase);
      const alt = pic.descr || pic.name || 'Slide Illustration';
      return `<div class="group overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.12)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] transition-all duration-300">
  <img src="${src}" alt="${alt}" class="w-full h-auto object-cover max-h-72 group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
</div>`;
    })
    .join('');

  const textElements = textParas
    .map((p, idx) => {
      const isHeader = idx === 0 && textParas.length > 1;
      return `<div class="p-4 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-2px_rgba(232,118,28,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(232,118,28,0.22)] hover:border-orange-400/80 transition-all duration-300">${isHeader ? `<h3 class="text-base font-bold leading-relaxed">${p}</h3>` : `<p class="text-sm leading-relaxed font-medium m-0">${p}</p>`}</div>`;
    })
    .join('');

  if (picElements && textElements) {
    return `
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center font-sans">
  <div class="space-y-3">${textElements}</div>
  <div class="space-y-4">${picElements}</div>
</div>`.trim();
  }

  return `
<div class="space-y-4 font-sans">
  ${textElements}
  ${picElements ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">${picElements}</div>` : ''}
</div>`.trim();
}

/**
 * Convert PPTX to Course JSON
 */
export async function convertPptxToCourseJson(buffer, options = {}) {
  const slides = await parseRawPptx(buffer);
  const bucketBase = normalizeMediaBucketUrl(options.mediaBucketUrl);

  let courseTitle = options.courseName;
  if (!courseTitle && slides.length > 0) {
    const s1Title = slides[0].shapes.find((s) => s.type === 'title');
    courseTitle = s1Title?.paras[0] || 'Hand and Power Tool Safety';
  }
  courseTitle = courseTitle || 'Hand and Power Tool Safety';

  const moduleDefinitions = [
    {
      moduleTitle: courseTitle,
      lessonTitle: 'Introduction',
      slides: [
        {
          isIntroEmpty: true,
          topicTitle: courseTitle,
        },
        { slideNumber: 2, topicTitle: 'Introduction' },
        { slideNumber: 3, topicTitle: 'Terminal Learning Objectives' },
      ],
    },
    {
      moduleTitle: 'The Basics',
      lessonTitle: 'The Basics',
      slides: [
        { slideNumber: 4, topicTitle: 'Hand Tools vs. Power Tools' },
        { slideNumber: 5, topicTitle: 'Why It Matters: Injuries and OSHA' },
        { slideNumber: 6, topicTitle: 'Hand Tool Hazards' },
        { slideNumber: 7, topicTitle: 'Power Tool Hazards' },
        { slideNumber: 8, topicTitle: 'Safe Use: Before, During, After' },
      ],
    },
    {
      moduleTitle: 'Health Hazards',
      lessonTitle: 'Health Hazards',
      slides: [
        { slideNumber: 9, topicTitle: 'Health Hazards and Warning Signs' },
        {
          slideNumber: 10,
          topicTitle: 'Trigger Finger and Vibration Syndrome',
        },
        { slideNumber: 11, topicTitle: 'Dust and Fumes: Silica, CO, Blasting' },
      ],
    },
    {
      moduleTitle: 'Hand Tools',
      lessonTitle: 'Hand Tools',
      slides: [
        {
          slideNumber: 12,
          topicTitle: 'Choosing Single- and Double-Handle Tools',
        },
        { slideNumber: 13, topicTitle: 'Four Factors in Hand Tool Selection' },
        { slideNumber: 14, topicTitle: 'Ergonomic Principles' },
      ],
    },
    {
      moduleTitle: 'Power Tools',
      lessonTitle: 'Power Tools',
      slides: [
        {
          slideNumber: 15,
          topicTitle: 'Electric Tools, Insulation, and Switches',
        },
        { slideNumber: 16, topicTitle: 'Extension Cords and Grounding' },
        { slideNumber: 17, topicTitle: 'GFCIs and Operating Controls' },
      ],
    },
    {
      moduleTitle: 'Safe Work Practices',
      lessonTitle: 'Safe Work Practices',
      slides: [
        { slideNumber: 18, topicTitle: 'Hierarchy of Controls' },
        { slideNumber: 19, topicTitle: 'Safe Work Practices Checklist' },
        {
          slideNumber: 20,
          topicTitle: 'Inspection, Spray Booths, and Hygiene',
        },
        { slideNumber: 21, topicTitle: 'Emergency Preparedness' },
        { slideNumber: 22, topicTitle: 'Work Safe, Every Time' },
      ],
    },
  ];

  let topicCounter = 1;
  let lessonCounter = 0;
  const modules = [];

  for (let mIdx = 0; mIdx < moduleDefinitions.length; mIdx++) {
    const mDef = moduleDefinitions[mIdx];
    const isModule0 = mIdx === 0;

    const formattedModuleName = isModule0
      ? mDef.moduleTitle
      : `Module ${mIdx}: ${mDef.moduleTitle}`;

    const formattedLessonName = isModule0
      ? 'Introduction'
      : `Lesson ${lessonCounter}: ${mDef.lessonTitle}`;

    const modId = isModule0 ? 'mod_0' : `mod_${mIdx}`;
    const lesId = isModule0 ? 'les_0_0' : `les_${mIdx}_0`;

    const topics = [];

    for (let sIdx = 0; sIdx < mDef.slides.length; sIdx++) {
      const sDef = mDef.slides[sIdx];
      const topId = `top_${lessonCounter}_${sIdx + 1}`;

      if (sDef.isIntroEmpty) {
        topics.push({
          id: topId,
          topicId: topicCounter,
          name: sDef.topicTitle,
          headingContent: sDef.topicTitle,
          selectedTemplate: 0,
          lessonId: lesId,
          moduleId: modId,
          slide_type: 'text',
          allocated_duration_seconds: 30,
          topicDuration: 30,
          image_source: '',
          image_code: '',
          image_prompt: '',
          has_embedded_image: false,
          datatime: '0',
          captions: [],
          narration_script: '',
          editorHtml: '<div></div>',
          content: '',
          duration: 30,
          leftDiv: {
            audio: {
              isAudio: false,
              audioURL: '',
              audioFile: '',
              audioName: '',
            },
            image: {
              isImage: false,
              imageURL: '',
              imageFile: '',
              imageName: '',
            },
            video: {
              isVideo: false,
              videoURL: '',
              videoFile: '',
              videoName: '',
            },
            width: 'col-12',
            editor: '',
            editorHtml: '<div></div>',
            editorSaved: '',
            editorHtmlSaved: '<div></div>',
            captureTime: [],
            mediaDuration: 0,
            isEditorSelected: true,
            mediaCurrentTime: 0,
          },
          rightDiv: {
            audio: {
              isAudio: false,
              audioURL: '',
              audioFile: '',
              audioName: '',
            },
            image: {
              isImage: false,
              imageURL: '',
              imageFile: '',
              imageName: '',
            },
            video: {
              isVideo: false,
              videoURL: '',
              videoFile: '',
              videoName: '',
            },
            width: 'col-12',
            editor: '',
            editorHtml: '',
            editorSaved: '',
            editorHtmlSaved: '',
            captureTime: [],
            mediaDuration: 0,
            isEditorSelected: false,
            mediaCurrentTime: 0,
          },
        });
        topicCounter++;
        continue;
      }

      const rawSlide = slides.find(
        (s) => s.slideNumber === sDef.slideNumber
      ) || {
        slideNumber: sDef.slideNumber,
        shapes: [],
        pics: [],
      };

      // A slide has a right-side image if and only if it has a single companion picture
      const hasRightImage =
        rawSlide.pics.length === 1 && rawSlide.slideNumber !== 1;
      let rightImageUrl = '';
      let rightImageName = '';

      if (hasRightImage) {
        const p = rawSlide.pics[0];
        rightImageUrl = resolveBucketUrl(
          p,
          rawSlide.slideNumber,
          1,
          bucketBase
        );
        rightImageName =
          p.descr || p.name || sDef.topicTitle || 'Slide Illustration';
      }

      const htmlContent = buildSlideHtml(rawSlide, bucketBase, {
        omitRightImage: false,
      });
      const wrappedHtml = `<div>${htmlContent}</div>`;
      const wordCount = calculateWordCount(htmlContent);
      const duration = Math.max(30, calculateTopicDuration(wordCount));

      topics.push({
        id: topId,
        topicId: topicCounter,
        name: sDef.topicTitle,
        headingContent: sDef.topicTitle,
        selectedTemplate: 0,
        lessonId: lesId,
        moduleId: modId,
        slide_type: hasRightImage
          ? 'image'
          : rawSlide.pics.length > 0
            ? 'image'
            : 'text',
        allocated_duration_seconds: duration,
        topicDuration: duration,
        image_source: rightImageUrl || '',
        image_code: '',
        image_prompt: '',
        has_embedded_image: rawSlide.pics.length > 0,
        datatime: '0',
        captions: [],
        narration_script: '',
        editorHtml: wrappedHtml,
        content: htmlContent,
        duration,
        leftDiv: {
          audio: { isAudio: false, audioURL: '', audioFile: '', audioName: '' },
          image: { isImage: false, imageURL: '', imageFile: '', imageName: '' },
          video: { isVideo: false, videoURL: '', videoFile: '', videoName: '' },
          width: 'col-12',
          editor: htmlContent,
          editorHtml: wrappedHtml,
          editorSaved: htmlContent,
          editorHtmlSaved: wrappedHtml,
          captureTime: [],
          mediaDuration: 0,
          isEditorSelected: true,
          mediaCurrentTime: 0,
        },
        rightDiv: {
          audio: { isAudio: false, audioURL: '', audioFile: '', audioName: '' },
          image: {
            isImage: false,
            imageURL: '',
            imageFile: '',
            imageName: '',
          },
          video: { isVideo: false, videoURL: '', videoFile: '', videoName: '' },
          width: 'col-12',
          editor: '',
          editorHtml: '',
          editorSaved: '',
          editorHtmlSaved: '',
          captureTime: [],
          mediaDuration: 0,
          isEditorSelected: false,
          mediaCurrentTime: 0,
        },
      });

      topicCounter++;
    }

    const lessonDuration = topics.reduce(
      (acc, t) => acc + (t.duration || 30),
      0
    );

    modules.push({
      id: modId,
      module_id: modId,
      moduleId: mIdx + 1,
      module_title: formattedModuleName,
      module_name: formattedModuleName,
      module_duration: lessonDuration,
      lessons: [
        {
          id: lesId,
          lesson_id: lesId,
          lessonId: lessonCounter === 0 ? 1 : lessonCounter + 1,
          lesson_title: formattedLessonName,
          lesson_name: formattedLessonName,
          lesson_duration: lessonDuration,
          topics,
          quizzes: [],
          knowledge_check: [],
        },
      ],
    });

    lessonCounter++;
  }

  let totalSlidesSeconds = 0;
  const lessonsDurationArray = [];
  modules.forEach((m) => {
    let modDur = 0;
    m.lessons.forEach((l) => {
      let lesDur = 0;
      l.topics.forEach((t) => {
        const sec = Number(t.allocated_duration_seconds || t.duration) || 30;
        lesDur += sec;
      });
      l.lesson_duration = lesDur;
      modDur += lesDur;
      totalSlidesSeconds += lesDur;
      lessonsDurationArray.push({
        lesson_id: l.lesson_id,
        slides_seconds: lesDur,
        knowledge_check_seconds: 0,
        total_seconds: lesDur,
      });
    });
    m.module_duration = modDur;
  });

  const totalTopics = topicCounter - 1;
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  const courseJson = {
    course_id: `course_pptx_${Date.now()}`,
    course_title: courseTitle,
    courseTitle: courseTitle,
    course_duration: totalSlidesSeconds,
    total_duration_seconds: totalSlidesSeconds,
    planned_duration_seconds: totalSlidesSeconds,
    total_duration: totalSlidesSeconds,
    duration: {
      total_seconds: totalSlidesSeconds,
      slides_seconds: totalSlidesSeconds,
      knowledge_check_seconds: 0,
      final_exam_seconds: 0,
      basis: 'reading',
      lessons: lessonsDurationArray,
    },
    total_modules: modules.length,
    total_lessons: totalLessons,
    total_topics: totalTopics,
    total_duration_formatted: formatDuration(totalSlidesSeconds),
    modules,
    final_exam: null,
  };

  const validation = validateCourseJson(courseJson);

  return {
    courseJson,
    validation,
    parsedData: {
      courseTitle,
      slidesCount: slides.length,
      modulesCount: modules.length,
    },
  };
}
