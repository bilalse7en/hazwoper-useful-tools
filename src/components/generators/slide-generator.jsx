'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Copy,
  Check,
  Eye,
  Code2,
  Sparkles,
  Plus,
  X,
  FileText,
  Wand2,
  Presentation,
  CheckCircle2,
  Save,
  RotateCcw,
  SlidersHorizontal,
  BookmarkCheck,
  FolderArchive,
  Layers,
} from 'lucide-react';
import { showToast } from '@/lib/swal';

// Helper to strip HTML comments (Zero Comments requirement)
function stripHtmlComments(html) {
  if (!html) return '';
  return html.replace(/<!--[\s\S]*?-->/g, '').trim();
}

// Item configurations for With-AI points (Index 0 to 4)
const WITH_AI_CONFIGS = [
  {
    color: '#30b6e5',
    barBg: 'bg-[#30b6e5]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(48,182,229,0.35)]',
    cardBorderHover:
      'hover:via-[#30b6e5]/30 hover:shadow-[0_14px_26px_rgba(48,182,229,0.18)]',
    glowGradient: 'from-white/50 via-transparent to-[#30b6e5]/20',
    iconBoxAnimation:
      'group-hover/pt:scale-[1.18] group-hover/pt:rotate-[360deg] group-hover/pt:rounded-[50%] group-hover/pt:bg-gradient-to-br group-hover/pt:from-[#30b6e5] group-hover/pt:to-white group-hover/pt:border-[#30b6e5] group-hover/pt:shadow-[0_0_16px_rgba(48,182,229,0.30)]',
    iconImgAnimation: 'group-hover/pt:scale-90 group-hover/pt:-rotate-[360deg]',
    iconUrl:
      'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---1.webp',
  },
  {
    color: '#24abb3',
    barBg: 'bg-[#24abb3]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(36,171,179,0.35)]',
    cardBorderHover:
      'hover:via-[#24abb3]/30 hover:shadow-[0_14px_26px_rgba(36,171,179,0.18)]',
    glowGradient: 'from-white/50 via-transparent to-[#24abb3]/20',
    iconBoxAnimation:
      'group-hover/pt:-translate-y-2 group-hover/pt:scale-[1.15] group-hover/pt:bg-[#d9f4ed] group-hover/pt:border-[#24abb3] group-hover/pt:shadow-[0_10px_16px_-4px_rgba(36,171,179,0.25)]',
    iconImgAnimation: 'group-hover/pt:scale-110',
    iconUrl:
      'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---2.webp',
  },
  {
    color: '#19aa9f',
    barBg: 'bg-[#19aa9f]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(25,170,159,0.35)]',
    cardBorderHover:
      'hover:via-[#19aa9f]/30 hover:shadow-[0_14px_26px_rgba(25,170,159,0.18)]',
    glowGradient: 'from-white/50 via-transparent to-[#19aa9f]/20',
    iconBoxAnimation:
      'group-hover/pt:scale-[1.15] group-hover/pt:rounded-[10px] group-hover/pt:-rotate-6 group-hover/pt:bg-[#d9f4ed] group-hover/pt:border-[#19aa9f] group-hover/pt:shadow-[0_0_16px_rgba(25,170,159,0.25)]',
    iconImgAnimation: 'group-hover/pt:rotate-6',
    iconUrl:
      'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785078099/With-AI---3.webp',
  },
  {
    color: '#2ebe78',
    barBg: 'bg-[#2ebe78]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(46,190,120,0.35)]',
    cardBorderHover:
      'hover:via-[#2ebe78]/30 hover:shadow-[0_14px_26px_rgba(46,190,120,0.18)]',
    glowGradient: 'from-white/50 via-transparent to-[#2ebe78]/20',
    iconBoxAnimation:
      'group-hover/pt:scale-[1.18] group-hover/pt:-rotate-[18deg] group-hover/pt:bg-gradient-to-tr group-hover/pt:from-[#2ebe78] group-hover/pt:to-white group-hover/pt:border-[#2ebe78] group-hover/pt:shadow-[0_0_18px_rgba(46,190,120,0.28)]',
    iconImgAnimation: 'group-hover/pt:scale-90 group-hover/pt:rotate-[18deg]',
    iconUrl:
      'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/With-AI---4.webp',
  },
  {
    color: '#10b981',
    barBg: 'bg-[#10b981]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_12px_rgba(16,185,129,0.40)]',
    cardBorderHover:
      'hover:via-[#10b981]/30 hover:shadow-[0_14px_26px_rgba(16,185,129,0.22)]',
    glowGradient: 'from-white/50 via-transparent to-[#10b981]/20',
    iconBoxAnimation:
      'group-hover/pt:scale-[1.20] group-hover/pt:rotate-[15deg] group-hover/pt:rounded-[22px] group-hover/pt:bg-gradient-to-br group-hover/pt:from-[#10b981] group-hover/pt:via-[#34d399] group-hover/pt:to-white group-hover/pt:border-[#10b981] group-hover/pt:shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    iconImgAnimation: 'group-hover/pt:scale-95 group-hover/pt:-rotate-[15deg]',
    iconUrl:
      'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---5.webp',
  },
];

const BEFORE_ICONS = [
  'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/Before-Ai--1.webp',
  'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--2.webp',
  'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--3.webp',
  'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai---4.webp',
  'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--5.webp',
];

// Format With AI text with first word colored with exact theme color
function formatFirstWordHtml(text, color) {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').trim();
  const spaceIdx = clean.indexOf(' ');
  if (spaceIdx > 0) {
    const firstWord = clean.slice(0, spaceIdx);
    const rest = clean.slice(spaceIdx + 1);
    return `<span style="color: ${color};" class="font-bold text-[${color}]">${firstWord}</span> ${rest}`;
  }
  return `<span style="color: ${color};" class="font-bold text-[${color}]">${clean}</span>`;
}

// Starter templates for custom slides
const STARTER_TEMPLATES = [
  {
    id: 'summary-3',
    name: '3-Card Summary',
    description: 'Header with 3 modern takeaway cards',
    skeleton: `<div class="w-full box-border my-[25px]">
\t<div class="relative w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-[#f7fafc] to-[#eef7f6] border border-[#205f99]/20 p-6 sm:p-8 lg:p-10 shadow-[0_10px_30px_rgba(32,95,153,0.08)]">
\t\t<div class="text-center mb-8">
\t\t\t<span class="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider text-[#205f99] bg-[#205f99]/10 rounded-full mb-2">Key Takeaways</span>
\t\t\t<h2 class="m-0 text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">Summary & Key Takeaways</h2>
\t\t\t<div class="w-16 h-1 bg-gradient-to-r from-[#205f99] via-[#19aa9f] to-[#10b981] rounded-full mx-auto mt-3"></div>
\t\t</div>
\t\t<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#30b6e5]/25 p-5 shadow-[0_4px_16px_rgba(48,182,229,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(48,182,229,0.18)] hover:border-[#30b6e5]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#30b6e5]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#30b6e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Efficiency Boost</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">Turnaround drops from 20 minutes to under 2 minutes.</p>
\t\t\t</div>
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#19aa9f]/25 p-5 shadow-[0_4px_16px_rgba(25,170,159,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(25,170,159,0.18)] hover:border-[#19aa9f]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#19aa9f]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#19aa9f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Employee Oversight</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">Staff retains final verification and oversight on all messages.</p>
\t\t\t</div>
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#10b981]/25 p-5 shadow-[0_4px_16px_rgba(16,185,129,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(16,185,129,0.18)] hover:border-[#10b981]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#10b981]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Consistent Quality</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">Tone and policy compliance remain consistent across shifts.</p>
\t\t\t</div>
\t\t</div>
\t</div>
</div>`,
  },
  {
    id: 'workflow-3',
    name: '3-Step Process',
    description: 'Numbered steps in sequential workflow',
    skeleton: `<div class="w-full box-border my-[25px]">
\t<div class="relative w-full overflow-hidden rounded-[26px] bg-white border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
\t\t<div class="text-center mb-8">
\t\t\t<span class="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider text-[#24abb3] bg-[#24abb3]/10 rounded-full mb-2">Workflow</span>
\t\t\t<h2 class="m-0 text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">Step-by-Step Implementation</h2>
\t\t\t<div class="w-16 h-1 bg-[#24abb3] rounded-full mx-auto mt-3"></div>
\t\t</div>
\t\t<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
\t\t\t<div class="relative rounded-[20px] bg-slate-50 border border-slate-200 p-5">
\t\t\t\t<div class="w-8 h-8 rounded-full bg-[#24abb3] text-white flex items-center justify-center font-bold text-sm mb-3">1</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Ingest & Review</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">System ingests incoming inventory requests and drafts reply.</p>
\t\t\t</div>
\t\t\t<div class="relative rounded-[20px] bg-slate-50 border border-slate-200 p-5">
\t\t\t\t<div class="w-8 h-8 rounded-full bg-[#24abb3] text-white flex items-center justify-center font-bold text-sm mb-3">2</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Operator Approval</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">Staff verifies draft against organization data and confirms.</p>
\t\t\t</div>
\t\t\t<div class="relative rounded-[20px] bg-slate-50 border border-slate-200 p-5">
\t\t\t\t<div class="w-8 h-8 rounded-full bg-[#24abb3] text-white flex items-center justify-center font-bold text-sm mb-3">3</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Dispatch & Record</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">Message sent instantly with automated logging in records.</p>
\t\t\t</div>
\t\t</div>
\t</div>
</div>`,
  },
  {
    id: 'cards-2',
    name: '2-Column Highlights',
    description: 'Side-by-side key feature highlight cards',
    skeleton: `<div class="w-full box-border my-[25px]">
\t<div class="relative w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-white to-slate-50 border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
\t\t<div class="text-center mb-8">
\t\t\t<h2 class="m-0 text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">Core Capabilities & Impact</h2>
\t\t\t<div class="w-16 h-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full mx-auto mt-3"></div>
\t\t</div>
\t\t<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
\t\t\t<div class="rounded-[20px] bg-white border border-blue-100 p-6 shadow-sm">
\t\t\t\t<h3 class="text-lg font-bold text-blue-900 mb-2">Automated Data Synthesis</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">Consolidates records across warehouse, operations, and fulfillment.</p>
\t\t\t</div>
\t\t\t<div class="rounded-[20px] bg-white border border-emerald-100 p-6 shadow-sm">
\t\t\t\t<h3 class="text-lg font-bold text-emerald-900 mb-2">Continuous Verification</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">Guarantees compliance rules and protocols are strictly adhered to.</p>
\t\t\t</div>
\t\t</div>
\t</div>
</div>`,
  },
  {
    id: 'custom-blank',
    name: 'Custom / Blank',
    description: 'Paste your own custom HTML skeleton',
    skeleton: '',
  },
];

// Intelligent field extraction from HTML skeleton
function extractFieldsFromSkeleton(skeletonHtml) {
  if (!skeletonHtml) return [];
  const fields = [];

  // 1. Explicit placeholders: {{fieldName}} or {POINT_1}
  const placeholderRegex = /\{\{?([a-zA-Z0-9_\-\s]+)\}?\}/g;
  let match;
  const seenPlaceholders = new Set();
  while ((match = placeholderRegex.exec(skeletonHtml)) !== null) {
    const rawTag = match[1].trim();
    const lower = rawTag.toLowerCase();
    if (!seenPlaceholders.has(lower)) {
      seenPlaceholders.add(lower);
      const isImg = lower.includes('image') || lower.includes('img');
      const isHead = lower.includes('title') || lower.includes('heading');
      fields.push({
        id: `ph_${lower.replace(/[^a-z0-9]/g, '_')}`,
        type: isImg ? 'image' : isHead ? 'heading' : 'text',
        placeholder: match[0],
        label: rawTag
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        defaultValue: '',
        value: '',
      });
    }
  }

  if (fields.length > 0) {
    return fields;
  }

  // 2. DOM extraction in browser
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(skeletonHtml, 'text/html');

      // Headings (H1, H2, H3, H4)
      const headings = Array.from(doc.body.querySelectorAll('h1, h2, h3, h4'));
      headings.forEach((h, idx) => {
        const text = h.textContent.trim();
        if (text) {
          fields.push({
            id: `heading_${idx}`,
            elementIndex: idx,
            type: 'heading',
            label:
              idx === 0 ? 'Main Slide Title' : `Section Heading ${idx + 1}`,
            defaultValue: text,
            value: text,
          });
        }
      });

      // Paragraphs and list items
      const textElements = Array.from(doc.body.querySelectorAll('p, li'));
      textElements.forEach((el, idx) => {
        const text = el.textContent.trim();
        if (text && text.length > 2) {
          fields.push({
            id: `text_${idx}`,
            elementIndex: idx,
            type: 'text',
            label: `Content Point / Text ${idx + 1}`,
            defaultValue: text,
            value: text,
          });
        }
      });

      // Images
      const images = Array.from(doc.body.querySelectorAll('img'));
      images.forEach((img, idx) => {
        const src = img.getAttribute('src') || '';
        if (src) {
          fields.push({
            id: `img_${idx}`,
            elementIndex: idx,
            type: 'image',
            label: `Image ${idx + 1} URL`,
            defaultValue: src,
            value: src,
          });
        }
      });
    } catch {
      // fallback
    }
  }

  // 3. Fallback regex if DOMParser unavailable or found nothing
  if (fields.length === 0) {
    const hMatches = [
      ...skeletonHtml.matchAll(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/gi),
    ];
    hMatches.forEach((m, idx) => {
      const text = m[1].replace(/<[^>]*>/g, '').trim();
      if (text) {
        fields.push({
          id: `heading_${idx}`,
          elementIndex: idx,
          type: 'heading',
          label: idx === 0 ? 'Main Slide Title' : `Section Heading ${idx + 1}`,
          defaultValue: text,
          value: text,
        });
      }
    });

    const pMatches = [...skeletonHtml.matchAll(/<p[^>]*>(.*?)<\/p>/gi)];
    pMatches.forEach((m, idx) => {
      const text = m[1].replace(/<[^>]*>/g, '').trim();
      if (text) {
        fields.push({
          id: `text_${idx}`,
          elementIndex: idx,
          type: 'text',
          label: `Content Point / Text ${idx + 1}`,
          defaultValue: text,
          value: text,
        });
      }
    });
  }

  // 4. Default fallback if still empty
  if (fields.length === 0) {
    fields.push(
      {
        id: 'heading_0',
        type: 'heading',
        label: 'Main Slide Title',
        defaultValue: 'Slide Title',
        value: 'Slide Title',
      },
      {
        id: 'text_0',
        type: 'text',
        label: 'Point 1',
        defaultValue: 'Key detail 1',
        value: 'Key detail 1',
      },
      {
        id: 'text_1',
        type: 'text',
        label: 'Point 2',
        defaultValue: 'Key detail 2',
        value: 'Key detail 2',
      },
      {
        id: 'text_2',
        type: 'text',
        label: 'Point 3',
        defaultValue: 'Key detail 3',
        value: 'Key detail 3',
      }
    );
  }

  return fields;
}

// Render dynamic custom skeleton HTML with updated field values
function renderCustomSkeletonHtml(skeletonHtml, fields) {
  if (!skeletonHtml) return '';
  let output = skeletonHtml;

  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return stripHtmlComments(output);
  }

  // 1. Explicit placeholders replacement
  const hasPlaceholders = fields.some((f) => f.placeholder);
  if (hasPlaceholders) {
    fields.forEach((f) => {
      if (f.placeholder) {
        const val =
          f.value !== undefined && f.value !== ''
            ? f.value
            : f.defaultValue || '';
        const escaped = f.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        output = output.replace(new RegExp(escaped, 'g'), val);
      }
    });
    return stripHtmlComments(output);
  }

  // 2. DOM-based replacement in browser
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(output, 'text/html');

      const headings = Array.from(doc.body.querySelectorAll('h1, h2, h3, h4'));
      const textElements = Array.from(doc.body.querySelectorAll('p, li'));
      const images = Array.from(doc.body.querySelectorAll('img'));

      fields.forEach((f) => {
        const val =
          f.value !== undefined && f.value !== ''
            ? f.value
            : f.defaultValue || '';
        if (f.type === 'heading' && headings[f.elementIndex]) {
          headings[f.elementIndex].textContent = val;
        } else if (f.type === 'text' && textElements[f.elementIndex]) {
          textElements[f.elementIndex].textContent = val;
        } else if (f.type === 'image' && images[f.elementIndex]) {
          images[f.elementIndex].setAttribute('src', val);
        }
      });

      return stripHtmlComments(doc.body.innerHTML);
    } catch {
      // fallback
    }
  }

  return stripHtmlComments(output);
}

// Initial default slides in the library
const DEFAULT_SAVED_SLIDES = [
  {
    id: 'slide-1',
    type: 'challenge',
    title: 'Slide 1: Challenge & AI Help',
    challengeTitle: 'The Challenge',
    challengeText:
      "Customers expect confirmation that their inventory request was received and that action is being taken. As request volumes increase, repeatedly reviewing messages and drafting similar replies can take time away from Donna's other operational responsibilities.",
    challengeImage:
      'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/the-challange.webp',
    aiHelpTitle: 'How AI Can Help',
    aiHelpText:
      'AI can review an incoming inventory request and generate a draft reply that confirms receipt, outlines appropriate next steps, and uses a professional tone. Donna can review and adjust the draft before sending it.',
    aiHelpImage:
      'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/how-ai-can-help.webp',
    showBottomNote: false, // Off by default per requirement
    disclaimer:
      'The employee remains responsible for verifying customer-specific details and ensuring that the draft accurately reflects current organizational information.',
  },
  {
    id: 'slide-2',
    type: 'before-after',
    title: 'Slide 2: Before vs With AI',
    beforeTitle: 'Before AI',
    withTitle: 'With AI',
    pointCount: 4,
    beforePoints: [
      'Searching through old emails for a piece of information',
      'Rewriting the same type of message over and over',
      'Starting reports from scratch every time',
      'Organizing notes manually after a meeting',
      'Manually tracking inventory records across multiple systems',
    ],
    withPoints: [
      'Faster searching, summarizing, and writing first drafts',
      'Automating templated messages',
      'Instant summaries of long documents',
      'Organized action items from meetings',
      'Seamless real-time inventory tracking and customer notifications',
    ],
  },
];

export function SlideGenerator() {
  // All slides ever saved in library
  const [savedSlides, setSavedSlides] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hazwoper_saved_slides_deck');
        if (stored) return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    return DEFAULT_SAVED_SLIDES;
  });

  // Active slides currently open in tabs
  const [slides, setSlides] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hazwoper_saved_slides_deck');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0)
            return parsed.slice(0, 2);
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_SAVED_SLIDES.slice(0, 2);
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState('code'); // 'preview' | 'code'
  const [copied, setCopied] = useState(false);
  const [singlePasteText, setSinglePasteText] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showSlideLibrary, setShowSlideLibrary] = useState(true);

  // Add Slide Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSkeleton, setModalSkeleton] = useState(
    STARTER_TEMPLATES[0].skeleton
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState('summary-3');

  // Sync savedSlides to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'hazwoper_saved_slides_deck',
          JSON.stringify(savedSlides)
        );
      } catch {
        // ignore
      }
    }
  }, [savedSlides]);

  // Active slide
  const currentSlide = slides[activeSlideIndex] || slides[0] || savedSlides[0];

  // Helper to update active slide properties and keep savedSlides in sync
  const updateActiveSlide = (updates) => {
    const updatedSlide = {
      ...currentSlide,
      ...updates,
    };

    setSlides((prev) => {
      const next = [...prev];
      if (next[activeSlideIndex]) {
        next[activeSlideIndex] = updatedSlide;
      }
      return next;
    });

    setSavedSlides((prev) => {
      const exists = prev.some((s) => s.id === updatedSlide.id);
      if (exists) {
        return prev.map((s) => (s.id === updatedSlide.id ? updatedSlide : s));
      }
      return [...prev, updatedSlide];
    });
  };

  // Open Add Slide Modal
  const handleOpenAddSlideModal = () => {
    const nextNum = savedSlides.length + 1;
    setModalTitle(`Slide ${nextNum}: Key Takeaways`);
    setModalSkeleton(STARTER_TEMPLATES[0].skeleton);
    setSelectedTemplateId('summary-3');
    setIsAddModalOpen(true);
  };

  // Detect fields preview for the modal skeleton
  const detectedModalFields = useMemo(() => {
    return extractFieldsFromSkeleton(modalSkeleton);
  }, [modalSkeleton]);

  // Confirm Add Slide with Code Skeleton
  const handleConfirmAddSlide = () => {
    const skeleton = modalSkeleton.trim();
    if (!skeleton) {
      showToast('Please provide an HTML code skeleton.', 'error');
      return;
    }

    const fields = extractFieldsFromSkeleton(skeleton);
    const slideTitle =
      modalTitle.trim() || `Slide ${savedSlides.length + 1}: Custom Slide`;

    const newSlide = {
      id: `slide-${Date.now()}`,
      type: 'custom',
      title: slideTitle,
      skeletonHtml: stripHtmlComments(skeleton),
      fields: fields,
    };

    setSavedSlides((prev) => [...prev, newSlide]);
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    setIsAddModalOpen(false);

    showToast(
      `Created "${newSlide.title}" with ${fields.length} dynamic fields!`,
      'success'
    );
  };

  // Close tab (Kept permanently in All Slides list)
  const handleCloseTab = (indexToClose) => {
    if (slides.length <= 1) {
      showToast('You must keep at least 1 slide open in tabs.', 'info');
      return;
    }
    const closingSlide = slides[indexToClose];
    const newSlides = slides.filter((_, i) => i !== indexToClose);
    setSlides(newSlides);
    setActiveSlideIndex((prev) =>
      prev >= newSlides.length ? newSlides.length - 1 : prev
    );
    showToast(
      `Closed "${closingSlide.title}" from tabs. It is saved in your All Slides list.`,
      'info'
    );
  };

  // Click on a slide in the All Slides List: Re-opens in tabs or switches to it
  const handleRestoreOrSelectSlide = (targetSlide) => {
    const existingIndex = slides.findIndex((s) => s.id === targetSlide.id);
    if (existingIndex !== -1) {
      setActiveSlideIndex(existingIndex);
      showToast(`Switched to "${targetSlide.title}".`, 'success');
    } else {
      setSlides((prev) => [...prev, targetSlide]);
      setActiveSlideIndex(slides.length);
      showToast(`Re-opened "${targetSlide.title}" in tabs!`, 'success');
    }
  };

  // Save current slide feedback
  const handleSaveCurrentSlide = () => {
    showToast(`Saved "${currentSlide.title}" successfully!`, 'success');
  };

  // 1-Box Quick Text Parser & Generator
  const handleSmartAutoPaste = () => {
    const raw = singlePasteText.trim();
    if (!raw) {
      showToast('Please paste your content into the quick box first.', 'error');
      return;
    }

    if (currentSlide.type === 'custom') {
      const lines = raw
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(Boolean);

      if (lines.length === 0) {
        showToast('Please provide at least one line of content.', 'warning');
        return;
      }

      const currentFields =
        currentSlide.fields && currentSlide.fields.length > 0
          ? currentSlide.fields
          : extractFieldsFromSkeleton(currentSlide.skeletonHtml || '');

      const updatedFields = [...currentFields];
      const headingIndices = [];
      const textIndices = [];
      const imageIndices = [];

      updatedFields.forEach((f, idx) => {
        if (f.type === 'heading') headingIndices.push(idx);
        else if (f.type === 'image') imageIndices.push(idx);
        else textIndices.push(idx);
      });

      let lineIdx = 0;
      // 1. Assign headings if provided
      if (headingIndices.length > 0 && lines.length > 0) {
        headingIndices.forEach((hIdx) => {
          if (lineIdx < lines.length) {
            updatedFields[hIdx] = {
              ...updatedFields[hIdx],
              value: lines[lineIdx],
            };
            lineIdx++;
          }
        });
      }

      // 2. Assign text points
      textIndices.forEach((tIdx) => {
        if (lineIdx < lines.length) {
          updatedFields[tIdx] = {
            ...updatedFields[tIdx],
            value: lines[lineIdx],
          };
          lineIdx++;
        }
      });

      // 3. Assign images if any URL line remaining
      imageIndices.forEach((iIdx) => {
        if (lineIdx < lines.length) {
          updatedFields[iIdx] = {
            ...updatedFields[iIdx],
            value: lines[lineIdx],
          };
          lineIdx++;
        }
      });

      updateActiveSlide({ fields: updatedFields });
      showToast(
        `Applied quick text to ${lines.length} fields on "${currentSlide.title}"!`,
        'success'
      );
      setSinglePasteText('');
    } else if (currentSlide.type === 'challenge') {
      const splitRegex =
        /(?:how\s*ai\s*can\s*help|ai\s*solution|ai\s*can\s*help|solution:)/i;
      const parts = raw.split(splitRegex);

      if (parts.length >= 2) {
        let challengePart = parts[0]
          .replace(/^(?:the\s*challenge|challenge:)/i, '')
          .trim();
        let aiPart = parts[1].trim();

        const noteMatch = aiPart.match(
          /(?:note|disclaimer|responsible|responsibility):\s*(.*)$/i
        );
        let noteText = '';
        let hasNote = false;
        if (noteMatch) {
          hasNote = true;
          noteText = noteMatch[1].trim();
          aiPart = aiPart.replace(noteMatch[0], '').trim();
        }

        updateActiveSlide({
          challengeText: challengePart,
          aiHelpText: aiPart,
          ...(hasNote ? { showBottomNote: true, disclaimer: noteText } : {}),
        });
        showToast('Parsed Challenge and AI Help content perfectly!', 'success');
      } else {
        const lines = raw
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const mid = Math.ceil(lines.length / 2);
        updateActiveSlide({
          challengeText: lines.slice(0, mid).join(' '),
          aiHelpText: lines.slice(mid).join(' '),
        });
        showToast('Distributed content across Challenge & AI Help!', 'info');
      }
      setSinglePasteText('');
    } else {
      // Before vs With AI Slide
      const splitRegex = /(?:with\s*ai|after\s*ai|ai\s*points?):/i;
      let beforeRaw = '';
      let withRaw = '';

      if (splitRegex.test(raw)) {
        const parts = raw.split(splitRegex);
        beforeRaw = parts[0].replace(/^(?:before\s*ai):/i, '').trim();
        withRaw = parts[1] ? parts[1].trim() : '';
      } else {
        const allLines = raw
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const half = Math.ceil(allLines.length / 2);
        beforeRaw = allLines.slice(0, half).join('\n');
        withRaw = allLines.slice(half).join('\n');
      }

      const parseLines = (text) =>
        text
          .split('\n')
          .map((line) => line.trim().replace(/^[-*•\d.]+\s*/, ''))
          .filter(Boolean);

      const beforePoints = parseLines(beforeRaw);
      const withPoints = parseLines(withRaw);
      const targetCount = Math.min(
        Math.max(beforePoints.length, withPoints.length, 4),
        5
      );

      updateActiveSlide({
        pointCount: targetCount,
        beforePoints: [
          ...beforePoints,
          ...(currentSlide.beforePoints || []).slice(beforePoints.length),
        ].slice(0, 5),
        withPoints: [
          ...withPoints,
          ...(currentSlide.withPoints || []).slice(withPoints.length),
        ].slice(0, 5),
      });

      showToast(
        `Applied points to Before AI & With AI with theme colors!`,
        'success'
      );
      setSinglePasteText('');
    }
  };

  // Generate HTML for any slide (Challenge, Before-After, or Custom Skeleton)
  const generateSlideHtml = (slide) => {
    if (!slide) return '';

    if (slide.type === 'custom') {
      return renderCustomSkeletonHtml(
        slide.skeletonHtml,
        slide.fields || extractFieldsFromSkeleton(slide.skeletonHtml || '')
      );
    }

    if (slide.type === 'challenge') {
      const challengeTitle = slide.challengeTitle || 'The Challenge';
      const challengeText = slide.challengeText || '';
      const challengeImg =
        slide.challengeImage ||
        'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/the-challange.webp';
      const aiHelpTitle = slide.aiHelpTitle || 'How AI Can Help';
      const aiHelpText = slide.aiHelpText || '';
      const aiHelpImg =
        slide.aiHelpImage ||
        'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/how-ai-can-help.webp';
      const disclaimer =
        slide.disclaimer ||
        'The employee remains responsible for verifying customer-specific details and ensuring that the draft accurately reflects current organizational information.';
      const showBottom = slide.showBottomNote || false;

      return `<style>@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}</style>
<div class="w-full box-border my-[25px]">
\t<div class="relative w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-[#f7fafc] to-[#eef7f6] border border-[#205f99]/20 p-5 sm:p-7 lg:p-9 shadow-[0_10px_30px_rgba(32,95,153,0.08)]">
\t\t<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
\t\t\t<div class="group relative flex flex-col rounded-[22px] bg-gradient-to-b from-white to-[#f8fbff] border border-[#205f99]/25 p-5 sm:p-6 shadow-[0_4px_18px_rgba(32,95,153,0.07)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(32,95,153,0.15)] hover:border-[#205f99]/60">
\t\t\t\t<div class="flex items-center gap-3.5 mb-4">
\t\t\t\t\t<div class="w-11 h-11 rounded-[14px] bg-[#205f99]/12 border border-[#205f99]/30 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t\t<img src="${challengeImg}" alt="Challenge" class="w-6 h-6 object-contain" />
\t\t\t\t\t</div>
\t\t\t\t\t<div>
\t\t\t\t\t\t<span class="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#205f99] bg-[#205f99]/10 rounded-full mb-1">Current Problem</span>
\t\t\t\t\t\t<h3 class="m-0 text-lg sm:text-xl font-extrabold text-[#1e293b] tracking-tight">${challengeTitle}</h3>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<div class="w-full h-1 bg-gradient-to-r from-[#205f99] to-[#30b6e5] rounded-full mb-4"></div>
\t\t\t\t<p class="text-sm sm:text-base text-[#475569] leading-relaxed m-0 flex-grow">${challengeText}</p>
\t\t\t</div>
\t\t\t<div class="group relative flex flex-col rounded-[22px] bg-gradient-to-b from-white to-[#f4fbf8] border border-[#10b981]/25 p-5 sm:p-6 shadow-[0_4px_18px_rgba(16,185,129,0.07)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(16,185,129,0.15)] hover:border-[#10b981]/60">
\t\t\t\t<div class="flex items-center gap-3.5 mb-4">
\t\t\t\t\t<div class="w-11 h-11 rounded-[14px] bg-[#10b981]/12 border border-[#10b981]/30 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t\t<img src="${aiHelpImg}" alt="How AI Can Help" class="w-6 h-6 object-contain" />
\t\t\t\t\t</div>
\t\t\t\t\t<div>
\t\t\t\t\t\t<span class="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#10b981] bg-[#10b981]/10 rounded-full mb-1">AI Solution</span>
\t\t\t\t\t\t<h3 class="m-0 text-lg sm:text-xl font-extrabold text-[#1e293b] tracking-tight">${aiHelpTitle}</h3>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t\t<div class="w-full h-1 bg-gradient-to-r from-[#19aa9f] to-[#10b981] rounded-full mb-4"></div>
\t\t\t\t<p class="text-sm sm:text-base text-[#475569] leading-relaxed m-0 flex-grow">${aiHelpText}</p>
\t\t\t</div>
\t\t</div>${
        showBottom
          ? `
\t\t<div class="mt-5 p-4 rounded-[16px] bg-gradient-to-r from-[#205f99]/10 via-[#19aa9f]/10 to-[#10b981]/10 border border-[#205f99]/20 flex items-center gap-3.5 shadow-sm">
\t\t\t<div class="w-8 h-8 rounded-full bg-[#205f99] text-white flex items-center justify-center shrink-0 font-bold text-sm shadow">i</div>
\t\t\t<p class="m-0 text-xs sm:text-sm text-[#1e293b] font-medium leading-relaxed">${disclaimer}</p>
\t\t</div>`
          : ''
      }
\t</div>
</div>`;
    }

    // Before vs With AI Slide
    const count = slide.pointCount || 4;
    const beforeTitle = slide.beforeTitle || 'Before AI';
    const withTitle = slide.withTitle || 'With AI';

    let beforeHtmlRows = '';
    for (let i = 0; i < count; i++) {
      const point = slide.beforePoints?.[i] || '';
      const iconUrl = BEFORE_ICONS[i % BEFORE_ICONS.length];
      const is5th = i === 4;

      beforeHtmlRows += `\t\t\t\t\t<div class="group/bpt relative rounded-[15px] p-2.5 transition-all duration-300 hover:bg-slate-100/90 hover:translate-x-1 flex items-center gap-3.5 ${
        is5th ? 'rounded-[16px]' : ''
      }">
\t\t\t\t\t\t<div class="w-9 h-9 min-w-[36px] rounded-[10px] bg-slate-200/90 border border-slate-300/80 flex items-center justify-center transition-transform duration-300 group-hover/bpt:rotate-[8deg] group-hover/bpt:scale-105 shadow-2xs">
\t\t\t\t\t\t\t<img src="${iconUrl}" alt="Before Icon" class="w-5 h-5 object-contain" />
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<p class="m-0 text-sm font-medium text-slate-700 leading-snug">${point}</p>
\t\t\t\t\t</div>\n`;
    }

    let withHtmlRows = '';
    for (let i = 0; i < count; i++) {
      const cfg = WITH_AI_CONFIGS[i % WITH_AI_CONFIGS.length];
      const point = slide.withPoints?.[i] || '';
      const is5th = i === 4;
      const formattedText = formatFirstWordHtml(point, cfg.color);

      if (is5th) {
        withHtmlRows += `\t\t\t\t\t<div class="group/pt relative flex items-center gap-3.5 p-2 rounded-[16px] border border-[#10b981]/50 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/30 transition-all duration-500 hover:translate-x-1.5 hover:shadow-[0_12px_24px_rgba(16,185,129,0.22)]">
\t\t\t\t\t\t<div class="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full transition-all duration-500 ${cfg.barBg} ${cfg.barHover}"></div>
\t\t\t\t\t\t<div class="w-9 h-9 min-w-[36px] rounded-[11px] bg-white border border-[#10b981]/40 flex items-center justify-center transition-all duration-500 shadow-sm ${cfg.iconBoxAnimation}">
\t\t\t\t\t\t\t<img src="${cfg.iconUrl}" alt="With AI Icon" class="w-5 h-5 object-contain transition-all duration-500 ${cfg.iconImgAnimation}" />
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<p class="m-0 text-sm font-semibold text-slate-900 leading-snug flex-grow">${formattedText}</p>
\t\t\t\t\t</div>\n`;
      } else {
        withHtmlRows += `\t\t\t\t\t<div class="group/pt relative flex items-center gap-3.5 p-2 rounded-[14px] border border-transparent transition-all duration-300 hover:translate-x-1.5 hover:bg-white/80 ${cfg.cardBorderHover}">
\t\t\t\t\t\t<div class="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full transition-all duration-300 ${cfg.barBg} ${cfg.barHover}"></div>
\t\t\t\t\t\t<div class="w-9 h-9 min-w-[36px] rounded-[10px] bg-white border border-slate-200/90 flex items-center justify-center transition-all duration-300 shadow-2xs ${cfg.iconBoxAnimation}">
\t\t\t\t\t\t\t<img src="${cfg.iconUrl}" alt="With AI Icon" class="w-5 h-5 object-contain transition-all duration-300 ${cfg.iconImgAnimation}" />
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<p class="m-0 text-sm font-semibold text-slate-800 leading-snug flex-grow">${formattedText}</p>
\t\t\t\t\t</div>\n`;
      }
    }

    return `<div class="w-full box-border my-[25px]">
\t<div class="relative w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-slate-50 to-[#edf7f5] border border-slate-200 p-5 sm:p-7 lg:p-9 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
\t\t<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
\t\t\t<div class="rounded-[22px] bg-slate-50/80 border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
\t\t\t\t<div class="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-200/80">
\t\t\t\t\t<span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
\t\t\t\t\t<h3 class="m-0 text-base sm:text-lg font-bold text-slate-700 tracking-tight">${beforeTitle}</h3>
\t\t\t\t</div>
\t\t\t\t<div class="space-y-2 flex-grow flex flex-col justify-around">
${beforeHtmlRows}
\t\t\t\t</div>
\t\t\t</div>
\t\t\t<div class="rounded-[22px] bg-gradient-to-b from-white via-[#fafffd] to-[#f0faf7] border border-[#19aa9f]/30 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
\t\t\t\t<div class="flex items-center gap-2.5 pb-3 mb-3 border-b border-[#19aa9f]/25">
\t\t\t\t\t<span class="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
\t\t\t\t\t<h3 class="m-0 text-base sm:text-lg font-extrabold text-[#1e293b] tracking-tight">${withTitle}</h3>
\t\t\t\t</div>
\t\t\t\t<div class="space-y-2 flex-grow flex flex-col justify-around">
${withHtmlRows}
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>
</div>`;
  };

  // Currently generated code for the active slide
  const generatedCode = useMemo(() => {
    return generateSlideHtml(currentSlide);
  }, [currentSlide]);

  // Per-Slide Copy Handler
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      showToast(
        `Copied "${currentSlide?.title || 'Slide'}" code to clipboard!`,
        'success'
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy code. Please copy manually.', 'error');
    }
  };

  // Quick Text box placeholder description
  const quickPlaceholder = useMemo(() => {
    if (currentSlide?.type === 'custom') {
      const detected =
        currentSlide.fields && currentSlide.fields.length > 0
          ? currentSlide.fields
          : extractFieldsFromSkeleton(currentSlide.skeletonHtml || '');
      const hints = detected
        .slice(0, 4)
        .map(
          (f, i) =>
            `Line ${i + 1}: ${f.label}${f.defaultValue ? ` (e.g. ${f.defaultValue.slice(0, 30)}...)` : ''}`
        )
        .join('\n');
      return `Paste text here to quickly fill the ${detected.length} auto-detected fields:\n${hints}\n...`;
    }
    if (currentSlide?.type === 'challenge') {
      return 'Paste Challenge text and How AI Can Help text here...';
    }
    return 'Paste Before AI points and With AI points here...';
  }, [currentSlide]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 px-3 py-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden">
      {/* ======================================================== */}
      {/* 1. TOP HEADER (CLEAN BRANDING - NO ACTION BUTTONS) */}
      {/* ======================================================== */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Presentation className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Dynamic Slide Generator
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-[11px] px-2 py-0.5"
              >
                {slides.length} Open in Deck &bull; {savedSlides.length} Saved
                in Vault
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Fast 1-box auto-paste, code skeleton builder, slide vault library,
              and zero-comment HTML export.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MULTI-SLIDE DECK NAVIGATION TABS & SINGLE ADD SLIDE BUTTON */}
      {/* ======================================================== */}
      <div className="p-3 sm:p-3.5 rounded-2xl border border-border/80 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
        {/* Slide List Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar flex-nowrap sm:flex-wrap">
          {slides.map((slide, idx) => {
            const isActive = idx === activeSlideIndex;
            let badgeText = 'Comparison';
            let badgeClass =
              'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
            if (slide.type === 'challenge') {
              badgeText = 'Challenge';
              badgeClass = 'bg-blue-500/15 text-blue-700 dark:text-blue-300';
            } else if (slide.type === 'custom') {
              badgeText = 'Custom Slide';
              badgeClass =
                'bg-purple-500/15 text-purple-700 dark:text-purple-300';
            }

            return (
              <div
                key={slide.id}
                className={`group/tab relative flex items-center rounded-xl border transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border hover:border-primary/50 text-foreground'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer select-none"
                >
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {slide.title}
                  </span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                      isActive
                        ? 'bg-primary-foreground/20 text-white'
                        : badgeClass
                    }`}
                  >
                    {badgeText}
                  </span>
                </button>
                {slides.length > 1 && (
                  <button
                    type="button"
                    title="Close tab (Kept in All Slides list)"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(idx);
                    }}
                    className={`px-2 py-2 hover:opacity-100 opacity-60 transition-opacity cursor-pointer ${
                      isActive
                        ? 'hover:text-red-200 text-white'
                        : 'hover:text-red-600 text-muted-foreground'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Side: All Slides List Toggle + Single Add Slide Button */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSlideLibrary(!showSlideLibrary)}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            title="View all saved slides. Click any slide to re-open it in tabs."
          >
            <FolderArchive className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">All Slides List</span>
            <span className="sm:hidden">Vault</span>
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
              {savedSlides.length}
            </Badge>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddSlideModal}
            className="h-8 gap-1.5 px-3.5 text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer"
            title="Add a new slide by providing a code skeleton"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Slide</span>
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. ALL SLIDES LIST (PERMANENT VAULT - CLICK TO RE-OPEN) */}
      {/* ======================================================== */}
      {showSlideLibrary && (
        <Card className="border border-primary/20 bg-primary/[0.015] shadow-2xs">
          <CardHeader className="py-2.5 px-4 border-b border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                All Slides List ({savedSlides.length} Slides Saved)
              </CardTitle>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Slides are never lost. Click any slide name to open it in your
              tabs.
            </span>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex items-center flex-wrap gap-2">
              {savedSlides.map((s) => {
                const isOpenInTabs = slides.some(
                  (active) => active.id === s.id
                );
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleRestoreOrSelectSlide(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow-2xs ${
                      isOpenInTabs
                        ? 'bg-card border-border hover:border-primary/50 text-foreground'
                        : 'bg-primary/5 border-dashed border-primary/40 text-primary hover:bg-primary/10 hover:border-primary'
                    }`}
                  >
                    <span>{s.title}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                        isOpenInTabs
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {isOpenInTabs ? 'In Tabs' : '+ Re-open'}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 4. 1-BOX QUICK TEXT TO GENERATE (ONLY QUICK BOX SHOWN BY DEFAULT) */}
      {/* ======================================================== */}
      <Card className="border border-primary/30 bg-primary/[0.02] shadow-xs">
        <CardHeader className="py-3 px-4 sm:px-5 border-b border-primary/20 bg-primary/[0.04]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Wand2 className="w-4 h-4" />
              Quick Text to Generate ({currentSlide?.title || 'Slide'})
            </CardTitle>
            <Badge
              variant="outline"
              className="text-primary border-primary/40 text-[11px]"
            >
              Active: {currentSlide?.title || 'Slide'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentSlide?.type === 'custom'
              ? `Paste lines of text below. They will automatically map into your slide's auto-detected fields.`
              : currentSlide?.type === 'challenge'
                ? 'Paste Challenge text and How AI Can Help text here to generate the cards automatically.'
                : 'Paste bullet points here. The tool separates "Before AI" and "With AI", assigns points, and colors the first bold words.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <Textarea
              rows={3}
              placeholder={quickPlaceholder}
              value={singlePasteText}
              onChange={(e) => setSinglePasteText(e.target.value)}
              className="text-xs font-mono bg-background resize-y"
            />
            <Button
              onClick={handleSmartAutoPaste}
              className="sm:w-44 shrink-0 flex flex-col items-center justify-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs h-auto py-3 shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Slide</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 5. CONTROLS BAR: META & CUSTOMIZE SWITCH */}
      {/* ======================================================== */}
      <div className="p-3 px-4 rounded-xl border border-border/80 bg-card flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" />
            {currentSlide?.title || 'Slide'}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] uppercase font-mono ${
              currentSlide?.type === 'challenge'
                ? 'border-blue-300 text-blue-700 bg-blue-50/50'
                : currentSlide?.type === 'custom'
                  ? 'border-purple-300 text-purple-700 bg-purple-50/50'
                  : 'border-emerald-300 text-emerald-700 bg-emerald-50/50'
            }`}
          >
            {currentSlide?.type === 'challenge'
              ? 'Challenge Design'
              : currentSlide?.type === 'custom'
                ? 'Custom Skeleton'
                : 'Before vs AI Design'}
          </Badge>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* If Before vs AI: 4 vs 5 points selector */}
          {currentSlide?.type === 'before-after' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Points:
              </span>
              <Button
                size="sm"
                variant={currentSlide.pointCount === 4 ? 'default' : 'outline'}
                onClick={() => updateActiveSlide({ pointCount: 4 })}
                className="h-7 px-2.5 text-xs cursor-pointer"
              >
                4 Points
              </Button>
              <Button
                size="sm"
                variant={currentSlide.pointCount === 5 ? 'default' : 'outline'}
                onClick={() => updateActiveSlide({ pointCount: 5 })}
                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                5 Points (3D Pop)
              </Button>
            </div>
          )}

          {/* TOGGLE FOR CUSTOMIZE (SHOW / HIDE DETAILED BOXES) */}
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <Label
              htmlFor="toggle-customize-view"
              className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize</span>
            </Label>
            <Switch
              id="toggle-customize-view"
              checked={showCustomize}
              onCheckedChange={setShowCustomize}
            />
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                showCustomize
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {showCustomize ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Save Slide Button */}
          <Button
            size="sm"
            onClick={handleSaveCurrentSlide}
            className="h-7 gap-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
          >
            <Save className="w-3 h-3" /> Save Slide
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. DETAILED CUSTOMIZATION PANEL (SHOWN ONLY WHEN TOGGLE IS ON) */}
      {/* ======================================================== */}
      {showCustomize && currentSlide && (
        <Card className="border border-border/80 shadow-xs animate-in fade-in-50 duration-300">
          <CardHeader className="py-3 px-4 sm:px-5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Customize Slide Fields — {currentSlide.title}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground font-mono"
              >
                Customize Mode ON
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Slide Title in Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-border/40">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Slide Title in Deck
                </Label>
                <Input
                  value={currentSlide.title || ''}
                  onChange={(e) => updateActiveSlide({ title: e.target.value })}
                  className="mt-1 text-xs font-bold"
                  placeholder="e.g. Slide 3: Summary"
                />
              </div>

              {currentSlide.type === 'before-after' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Left Column Title
                    </Label>
                    <Input
                      value={currentSlide.beforeTitle || 'Before AI'}
                      onChange={(e) =>
                        updateActiveSlide({ beforeTitle: e.target.value })
                      }
                      className="mt-1 text-xs font-semibold"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Right Column Title
                    </Label>
                    <Input
                      value={currentSlide.withTitle || 'With AI'}
                      onChange={(e) =>
                        updateActiveSlide({ withTitle: e.target.value })
                      }
                      className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC FIELDS FOR CUSTOM SLIDE */}
            {currentSlide.type === 'custom' ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/[0.02] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Auto-Generated Customization Fields (
                      {currentSlide.fields?.length || 0} Detected)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      These fields were automatically generated from your slide
                      skeleton. Edit any field below to update the slide in real
                      time.
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-primary border-primary/30"
                  >
                    Dynamic Fields
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(currentSlide.fields || []).map((field, fIdx) => {
                    const isHeading = field.type === 'heading';
                    const isImage = field.type === 'image';
                    const val =
                      field.value !== undefined
                        ? field.value
                        : field.defaultValue || '';

                    return (
                      <div
                        key={field.id || fIdx}
                        className={`p-3.5 rounded-xl border bg-card transition-all ${
                          isHeading
                            ? 'md:col-span-2 border-primary/30 bg-primary/[0.01]'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span>{field.label || `Field ${fIdx + 1}`}</span>
                          </Label>
                          <Badge
                            variant="secondary"
                            className={`text-[9px] uppercase font-mono px-1.5 py-0.5 ${
                              isHeading
                                ? 'bg-primary/15 text-primary'
                                : isImage
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {field.type}
                          </Badge>
                        </div>

                        {isHeading || isImage || val.length < 80 ? (
                          <Input
                            value={val}
                            onChange={(e) => {
                              const nextFields = [
                                ...(currentSlide.fields || []),
                              ];
                              nextFields[fIdx] = {
                                ...nextFields[fIdx],
                                value: e.target.value,
                              };
                              updateActiveSlide({ fields: nextFields });
                            }}
                            placeholder={`Enter ${field.label}...`}
                            className="text-xs"
                          />
                        ) : (
                          <Textarea
                            rows={3}
                            value={val}
                            onChange={(e) => {
                              const nextFields = [
                                ...(currentSlide.fields || []),
                              ];
                              nextFields[fIdx] = {
                                ...nextFields[fIdx],
                                value: e.target.value,
                              };
                              updateActiveSlide({ fields: nextFields });
                            }}
                            placeholder={`Enter ${field.label}...`}
                            className="text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Collapsible Section for HTML Skeleton Code */}
                <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      Slide HTML Code Skeleton
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const raw = currentSlide.skeletonHtml || '';
                          const reExtracted = extractFieldsFromSkeleton(raw);
                          updateActiveSlide({ fields: reExtracted });
                          showToast(
                            `Re-detected ${reExtracted.length} fields from skeleton!`,
                            'success'
                          );
                        }}
                        className="h-6 text-[11px] px-2 gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Re-detect Fields
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const cleaned = stripHtmlComments(
                            currentSlide.skeletonHtml || ''
                          );
                          updateActiveSlide({ skeletonHtml: cleaned });
                          showToast(
                            'Comments stripped from skeleton!',
                            'success'
                          );
                        }}
                        className="h-6 text-[11px] px-2 cursor-pointer"
                      >
                        Strip Comments
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    rows={6}
                    value={currentSlide.skeletonHtml || ''}
                    onChange={(e) =>
                      updateActiveSlide({ skeletonHtml: e.target.value })
                    }
                    className="font-mono text-[11px] bg-background"
                    placeholder="HTML code skeleton..."
                  />
                </div>
              </div>
            ) : currentSlide.type === 'challenge' ? (
              /* CHALLENGE SLIDE FORM */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-blue-200/50 bg-blue-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-blue-900">
                      Left Card: Challenge
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-blue-700 border-blue-300"
                    >
                      Blue Header
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Title
                    </Label>
                    <Input
                      value={currentSlide.challengeTitle || 'The Challenge'}
                      onChange={(e) =>
                        updateActiveSlide({ challengeTitle: e.target.value })
                      }
                      className="mt-1 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Challenge Description
                    </Label>
                    <Textarea
                      rows={4}
                      value={currentSlide.challengeText || ''}
                      onChange={(e) =>
                        updateActiveSlide({ challengeText: e.target.value })
                      }
                      className="mt-1 text-sm leading-relaxed"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200/50 bg-emerald-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-emerald-900">
                      Right Card: AI Help
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-emerald-700 border-emerald-300"
                    >
                      Emerald Header
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Title
                    </Label>
                    <Input
                      value={currentSlide.aiHelpTitle || 'How AI Can Help'}
                      onChange={(e) =>
                        updateActiveSlide({ aiHelpTitle: e.target.value })
                      }
                      className="mt-1 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      AI Help Description
                    </Label>
                    <Textarea
                      rows={4}
                      value={currentSlide.aiHelpText || ''}
                      onChange={(e) =>
                        updateActiveSlide({ aiHelpText: e.target.value })
                      }
                      className="mt-1 text-sm leading-relaxed"
                    />
                  </div>
                </div>

                {/* Bottom Disclaimer Toggle (OFF BY DEFAULT) */}
                <div className="md:col-span-2 p-3.5 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="toggle-bottom-note"
                        className="text-sm font-bold text-foreground cursor-pointer"
                      >
                        Bottom Note / Employee Responsibility Banner
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Off by default. Turn ON if you want the bottom
                        disclaimer banner to show on this slide.
                      </p>
                    </div>
                    <Switch
                      id="toggle-bottom-note"
                      checked={currentSlide.showBottomNote || false}
                      onCheckedChange={(checked) =>
                        updateActiveSlide({ showBottomNote: checked })
                      }
                    />
                  </div>

                  {currentSlide.showBottomNote && (
                    <div className="pt-2 border-t border-border/50">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Banner Text
                      </Label>
                      <Input
                        value={currentSlide.disclaimer || ''}
                        onChange={(e) =>
                          updateActiveSlide({ disclaimer: e.target.value })
                        }
                        className="text-sm mt-1"
                        placeholder="Enter employee responsibility disclaimer..."
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* BEFORE VS WITH AI SLIDE FORM */
              <div className="space-y-3">
                {Array.from({ length: currentSlide.pointCount || 4 }).map(
                  (_, idx) => {
                    const cfg = WITH_AI_CONFIGS[idx % WITH_AI_CONFIGS.length];
                    const beforeVal = currentSlide.beforePoints?.[idx] || '';
                    const withVal = currentSlide.withPoints?.[idx] || '';

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-card/60 items-center hover:border-primary/30 transition-colors"
                      >
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
                            Before Point {idx + 1}
                          </Label>
                          <Input
                            value={beforeVal}
                            onChange={(e) => {
                              const updated = [
                                ...(currentSlide.beforePoints || []),
                              ];
                              updated[idx] = e.target.value;
                              updateActiveSlide({ beforePoints: updated });
                            }}
                            placeholder={`Before point ${idx + 1}...`}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                              With AI Point {idx + 1}
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: cfg.color }}
                              />
                            </Label>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
                              style={{
                                backgroundColor: `${cfg.color}18`,
                                color: cfg.color,
                              }}
                            >
                              {idx === 4
                                ? '5th 3D Pop (+15°)'
                                : `Theme Color ${cfg.color}`}
                            </span>
                          </div>
                          <Input
                            value={withVal}
                            onChange={(e) => {
                              const updated = [
                                ...(currentSlide.withPoints || []),
                              ];
                              updated[idx] = e.target.value;
                              updateActiveSlide({ withPoints: updated });
                            }}
                            placeholder={`With AI point ${idx + 1}...`}
                            className="text-sm font-medium"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <CheckCircle2
                              className="w-3 h-3"
                              style={{ color: cfg.color }}
                            />
                            First bold word auto-colored in{' '}
                            <strong style={{ color: cfg.color }}>
                              {cfg.color}
                            </strong>
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 7. UNIFIED OUTPUT SECTION: LIVE PREVIEW & CLEAN CODE */}
      {/* ======================================================== */}
      <Card className="border border-border/80 shadow-md overflow-hidden">
        <CardHeader className="py-3 px-4 sm:px-5 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: View Mode Segmented Switcher + Active Slide Title */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center p-1 bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Live Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'code'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Clean Code</span>
              </button>
            </div>

            <span className="text-xs font-semibold text-muted-foreground hidden md:inline-block">
              {currentSlide?.title || 'Slide'}
            </span>
          </div>

          {/* Right: Exactly ONE Copy Code Button (Per-Slide Only) */}
          <Button
            size="sm"
            onClick={handleCopyCode}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs cursor-pointer shadow-2xs shrink-0 self-end sm:self-auto"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied Slide Code!' : 'Copy Code'}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {viewMode === 'preview' ? (
            <div className="p-3 sm:p-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto min-w-0">
              <div
                className="w-full min-w-0"
                dangerouslySetInnerHTML={{ __html: generatedCode }}
              />
            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 sm:p-6 text-xs font-mono leading-relaxed bg-[#1e2430] text-[#e2e8f0] overflow-x-auto max-h-[550px] select-all rounded-b-xl min-w-0">
                <code>{generatedCode}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 8. ADD SLIDE MODAL (ASKS FOR CODE SKELETON & BUILDS FIELDS) */}
      {/* ======================================================== */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              Add New Slide with Code Skeleton
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide your HTML code skeleton. The generator will automatically
              detect customizable fields and create a quick text box for it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Slide Title */}
            <div>
              <Label className="text-xs font-bold text-foreground">
                Slide Title / Name
              </Label>
              <Input
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                placeholder={`e.g. Slide ${savedSlides.length + 1}: Key Takeaways`}
                className="mt-1 text-xs font-medium"
              />
            </div>

            {/* Starter Templates */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Choose a Starter Skeleton or Paste Your Own
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Click template to populate
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STARTER_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setModalSkeleton(tmpl.skeleton);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTemplateId === tmpl.id
                        ? 'border-primary bg-primary/10 text-primary shadow-2xs font-bold'
                        : 'border-border bg-card hover:border-border/80 text-foreground'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">
                      {tmpl.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {tmpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Skeleton Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-purple-600" />
                  HTML Code Skeleton
                </Label>
                {detectedModalFields.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-emerald-600 border-emerald-300 bg-emerald-50/50"
                  >
                    ✨ {detectedModalFields.length} Customizable Fields Detected
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Paste any HTML / Tailwind code here. You can use standard HTML
                elements (&lt;h2&gt;, &lt;p&gt;, &lt;img&gt;) or explicit
                placeholders like &#123;&#123;title&#125;&#125;,
                &#123;&#123;point_1&#125;&#125;.
              </p>
              <Textarea
                rows={9}
                value={modalSkeleton}
                onChange={(e) => {
                  setModalSkeleton(e.target.value);
                  setSelectedTemplateId('custom-blank');
                }}
                placeholder="Paste your HTML code skeleton here..."
                className="font-mono text-xs leading-relaxed bg-background resize-y"
              />
            </div>

            {/* Detected Fields Preview */}
            {detectedModalFields.length > 0 && (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                  Auto-Detected Fields:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detectedModalFields.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-background border border-border text-foreground flex items-center gap-1"
                    >
                      <span className="font-bold text-primary">{i + 1}.</span>{' '}
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="w-full sm:w-auto text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAddSlide}
              className="w-full sm:w-auto text-xs font-bold bg-primary text-primary-foreground gap-1.5 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create Slide &amp; Build Fields
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SlideGenerator;
