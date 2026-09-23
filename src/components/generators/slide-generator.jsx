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
  FileCode,
  Save,
  RotateCcw,
  SlidersHorizontal,
  BookmarkCheck,
  FolderArchive,
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

// Generate default Summary Slide HTML (zero comments)
function generateDefaultSummaryHtml(slide) {
  const title = slide.summaryTitle || 'Summary & Key Takeaways';
  const points = slide.summaryPoints || [
    'Donna retains final verification on all AI-assisted inventory messages.',
    'Routine email turnaround drops from 20 minutes to under 2 minutes.',
    'Consistent, high-quality professional tone across all communications.',
  ];

  return `<div class="w-full box-border my-[25px]">
\t<div class="relative w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-[#f7fafc] to-[#eef7f6] border border-[#205f99]/20 p-6 sm:p-8 lg:p-10 shadow-[0_10px_30px_rgba(32,95,153,0.08)]">
\t\t<div class="text-center mb-8">
\t\t\t<span class="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider text-[#205f99] bg-[#205f99]/10 rounded-full mb-2">Key Takeaways</span>
\t\t\t<h2 class="m-0 text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">${title}</h2>
\t\t\t<div class="w-16 h-1 bg-gradient-to-r from-[#205f99] via-[#19aa9f] to-[#10b981] rounded-full mx-auto mt-3"></div>
\t\t</div>
\t\t<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#30b6e5]/25 p-5 shadow-[0_4px_16px_rgba(48,182,229,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(48,182,229,0.18)] hover:border-[#30b6e5]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#30b6e5]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#30b6e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5"><span style="color: #30b6e5;" class="font-bold text-[#30b6e5]">Efficiency</span> Boost</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">${points[0] || ''}</p>
\t\t\t</div>
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#19aa9f]/25 p-5 shadow-[0_4px_16px_rgba(25,170,159,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(25,170,159,0.18)] hover:border-[#19aa9f]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#19aa9f]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#19aa9f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5"><span style="color: #19aa9f;" class="font-bold text-[#19aa9f]">Employee</span> Oversight</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">${points[1] || ''}</p>
\t\t\t</div>
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#10b981]/25 p-5 shadow-[0_4px_16px_rgba(16,185,129,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(16,185,129,0.18)] hover:border-[#10b981]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#10b981]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5"><span style="color: #10b981;" class="font-bold text-[#10b981]">Consistent</span> Quality</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">${points[2] || ''}</p>
\t\t\t</div>
\t\t</div>
\t</div>
</div>`;
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

  // Add a new slide to the deck with custom code & quick text support
  const handleAddNewSlide = () => {
    const newIndex = savedSlides.length + 1;
    const samplePoints = [
      'Donna retains final verification on all AI-assisted inventory messages.',
      'Routine email turnaround drops from 20 minutes to under 2 minutes.',
      'Consistent, high-quality professional tone across all communications.',
    ];
    const defaultCode = generateDefaultSummaryHtml({
      summaryTitle: `Slide ${newIndex}: Key Takeaways`,
      summaryPoints: samplePoints,
    });

    const newSlide = {
      id: `slide-${Date.now()}`,
      type: 'custom',
      title: `Slide ${newIndex}: Summary`,
      summaryTitle: `Slide ${newIndex}: Key Takeaways`,
      summaryPoints: samplePoints,
      customHtml: defaultCode,
    };

    setSavedSlides((prev) => [...prev, newSlide]);
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    showToast(
      `Added ${newSlide.title} to tabs and saved in All Slides list!`,
      'success'
    );
  };

  // Close tab (Does NOT delete permanently; stays in All Slides list)
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

  // Click on a slide in the All Slides List: Re-opens in tabs if not open, or switches to it
  const handleRestoreOrSelectSlide = (targetSlide) => {
    const existingIndex = slides.findIndex((s) => s.id === targetSlide.id);
    if (existingIndex !== -1) {
      // Already in tabs, switch to it
      setActiveSlideIndex(existingIndex);
      showToast(`Switched to "${targetSlide.title}".`, 'success');
    } else {
      // Not in tabs, re-open it
      setSlides((prev) => [...prev, targetSlide]);
      setActiveSlideIndex(slides.length);
      showToast(`Re-opened "${targetSlide.title}" in tabs!`, 'success');
    }
  };

  // Save current slide feedback
  const handleSaveCurrentSlide = () => {
    showToast(`Saved "${currentSlide.title}" successfully!`, 'success');
  };

  // ==========================================
  // SMART 1-BOX QUICK TEXT PARSER
  // ==========================================
  const handleSmartAutoPaste = () => {
    const raw = singlePasteText.trim();
    if (!raw) {
      showToast('Please paste your content into the quick box first.', 'error');
      return;
    }

    if (currentSlide.type === 'custom' || currentSlide.type === 'summary') {
      const lines = raw
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(Boolean);

      let newTitle =
        currentSlide.summaryTitle ||
        currentSlide.title ||
        'Summary & Key Takeaways';
      let pointsToUse = lines;

      if (
        lines.length > 1 &&
        (lines[0].toLowerCase().startsWith('summary') ||
          lines[0].toLowerCase().startsWith('takeaway') ||
          lines[0].toLowerCase().startsWith('key takeaway') ||
          lines[0].length < 40)
      ) {
        newTitle = lines[0].replace(/^(title|summary|takeaways?):\s*/i, '');
        pointsToUse = lines.slice(1);
      }

      let updatedHtml = currentSlide.customHtml || '';
      if (updatedHtml) {
        let replacedAnyPlaceholder = false;
        pointsToUse.forEach((pt, idx) => {
          const ph = new RegExp(`\\{POINT_${idx + 1}\\}`, 'gi');
          if (ph.test(updatedHtml)) {
            updatedHtml = updatedHtml.replace(ph, pt);
            replacedAnyPlaceholder = true;
          }
        });

        if (!replacedAnyPlaceholder && typeof window !== 'undefined') {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(updatedHtml, 'text/html');
            const paragraphs = Array.from(doc.body.querySelectorAll('p, li'));
            if (paragraphs.length > 0) {
              pointsToUse.forEach((pt, idx) => {
                if (paragraphs[idx]) {
                  paragraphs[idx].textContent = pt;
                }
              });
              const h2 = doc.body.querySelector('h2, h3, h1');
              if (h2 && newTitle) {
                h2.textContent = newTitle;
              }
              updatedHtml = doc.body.innerHTML;
            }
          } catch {
            // Keep updatedHtml
          }
        }
      } else {
        updatedHtml = generateDefaultSummaryHtml({
          summaryTitle: newTitle,
          summaryPoints: pointsToUse,
        });
      }

      updateActiveSlide({
        summaryTitle: newTitle,
        summaryPoints: pointsToUse,
        customHtml: stripHtmlComments(updatedHtml),
      });

      showToast(`Quick text applied to ${currentSlide.title}!`, 'success');
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
        showToast('Challenge and AI content auto-populated!', 'success');
      } else {
        const paragraphs = raw
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (paragraphs.length >= 2) {
          updateActiveSlide({
            challengeText: paragraphs[0],
            aiHelpText: paragraphs.slice(1).join('\n\n'),
          });
        } else {
          updateActiveSlide({
            challengeText: raw,
          });
        }
        showToast('Content applied to Challenge slide!', 'success');
      }
    } else {
      // Before vs With AI Slide
      const withAiRegex = /(?:with\s*ai|after\s*ai|with\s*ai:|after:)/i;
      const sections = raw.split(withAiRegex);

      let beforeLines = [];
      let withLines = [];

      if (sections.length >= 2) {
        beforeLines = sections[0]
          .replace(/^(?:before\s*ai|before:)/i, '')
          .split('\n')
          .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
          .filter(Boolean);

        withLines = sections[1]
          .split('\n')
          .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
          .filter(Boolean);
      } else {
        const allLines = raw
          .split('\n')
          .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
          .filter(Boolean);

        const half = Math.ceil(allLines.length / 2);
        beforeLines = allLines.slice(0, half);
        withLines = allLines.slice(half);
      }

      const newBefore = [...(currentSlide.beforePoints || [])];
      const newWith = [...(currentSlide.withPoints || [])];

      beforeLines.forEach((line, idx) => {
        if (idx < 5) newBefore[idx] = line;
      });
      withLines.forEach((line, idx) => {
        if (idx < 5) newWith[idx] = line;
      });

      const detectedCount = Math.max(
        beforeLines.length,
        withLines.length,
        currentSlide.pointCount || 4
      );
      const finalCount = Math.min(Math.max(detectedCount, 4), 5);

      updateActiveSlide({
        beforePoints: newBefore,
        withPoints: newWith,
        pointCount: finalCount,
      });

      showToast(
        `Auto-assigned points to Before & With AI (${finalCount} points)!`,
        'success'
      );
    }

    setSinglePasteText('');
  };

  // Generate Clean HTML string for a specific slide (Zero Comments)
  const generateSlideHtml = (slide) => {
    if (!slide) return '';

    if (slide.type === 'custom' || slide.type === 'summary') {
      if (slide.customHtml && slide.customHtml.trim()) {
        return stripHtmlComments(slide.customHtml.trim());
      }
      return generateDefaultSummaryHtml(slide);
    }

    if (slide.type === 'challenge') {
      const bottomBanner = slide.showBottomNote
        ? `\n\n<div class="group/message relative z-[2] mt-[14px] overflow-hidden rounded-[19px] border border-[#b9dfd8] bg-gradient-to-br from-[#f5fbff] via-[#f7fcfb] to-[#effbf4] px-[24px] py-[19px] backdrop-blur-[4px] transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-[4px] hover:border-[#78cfc0] hover:from-[#eef9ff] hover:via-[#f5fdf9] hover:to-[#e6faef] hover:shadow-[0_12px_28px_rgba(32,95,153,0.12)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.3s]">
    <div class="pointer-events-none absolute -right-[55px] -top-[55px] h-[130px] w-[130px] rounded-full bg-[#68e5ab]/10 blur-[28px] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:opacity-100 group-hover/message:scale-125"></div>
    <div class="pointer-events-none absolute -bottom-[60px] -left-[50px] h-[130px] w-[130px] rounded-full bg-[#38b5e4]/10 blur-[30px] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:opacity-100 group-hover/message:scale-125"></div>
    <div class="pointer-events-none absolute left-0 top-0 h-[50px] w-[5px] -translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#38b5e4] via-[#68e5ab] to-[#38b5e4] opacity-20 transition-all duration-700 group-hover/message:w-[130px] group-hover/message:opacity-70"></div>
    <div class="pointer-events-none absolute right-0 top-0 h-[50px] w-[5px] translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#38b5e4] via-[#68e5ab] to-[#38b5e4] opacity-20 transition-all duration-700 group-hover/message:w-[130px] group-hover/message:opacity-70"></div>
    <p class="relative z-[2] m-0 text-center text-[14px] font-medium leading-[1.7] text-[#40515d] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:text-[#263f46] min-[1400px]:text-[15px]">
        ${slide.disclaimer}
    </p>
    <div class="pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[#68e5ab] to-transparent opacity-0 transition-all duration-700 group-hover/message:w-[45%] group-hover/message:opacity-80"></div>
</div>`
        : '';

      return `<style>@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}</style>
<div class="flex flex-wrap gap-[22px] w-full box-border justify-center">
    <div class="group relative flex-[1_1_520px] min-w-[480px] max-[997px]:min-w-full box-border rounded-[22px] bg-gradient-to-br from-white to-[#e8f4fd] border border-[rgba(32,95,153,0.16)] border-t-[6px] border-t-[#205f99] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#205f99] shadow-[0_10px_28px_rgba(1,51,93,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-[border-color,box-shadow] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(1,51,93,0.14)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.1s]">
        <div class="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(32,95,153,0.055)] border-b border-[rgba(32,95,153,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] min-[1500px]:basis-[205px] min-[1500px]:min-w-[205px] min-[1728px]:basis-[230px] min-[1728px]:min-w-[230px] min-[2400px]:basis-[270px] min-[2400px]:min-w-[270px] transition-all duration-500 group-hover:bg-[rgba(32,95,153,0.09)]">
            <div class="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(32,95,153,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(32,95,153,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-auto min-[998px]:bottom-[-170px] min-[998px]:translate-y-0 min-[998px]:w-[190px] min-[998px]:h-[190px] min-[1400px]:w-[205px] min-[1400px]:h-[205px] min-[1500px]:w-[225px] min-[1500px]:h-[225px] min-[1728px]:w-[250px] min-[1728px]:h-[250px] min-[2400px]:w-[285px] min-[2400px]:h-[285px] min-[1400px]:group-hover:scale-[1.35]"></div>
            <div class="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.82)] flex items-center justify-center shadow-[0_0_0_8px_rgba(32,95,153,0.06),0_10px_22px_rgba(32,95,153,0.12)] z-[2] min-[1400px]:w-[155px] min-[1400px]:h-[155px] min-[1500px]:w-[170px] min-[1500px]:h-[170px] min-[1728px]:w-[190px] min-[1728px]:h-[190px] min-[2400px]:w-[220px] min-[2400px]:h-[220px]">
                <div class="absolute border-2 border-[#205f99eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] min-[1400px]:h-[126px] min-[1400px]:w-[126px] min-[1500px]:h-[140px] min-[1500px]:w-[140px] min-[1728px]:h-[156px] min-[1728px]:w-[156px] min-[2400px]:h-[180px] min-[2400px]:w-[180px] rounded-full transition-all w-[118px]"></div>
                <img src="${slide.challengeImage}" alt="${slide.challengeTitle}" class="max-w-[112px] max-h-[112px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(32,95,153,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(32,95,153,0.42)] min-[1400px]:max-w-[120px] min-[1400px]:max-h-[120px] min-[1500px]:max-w-[132px] min-[1500px]:max-h-[132px] min-[1728px]:max-w-[148px] min-[1728px]:max-h-[148px] min-[2400px]:max-w-[172px] min-[2400px]:max-h-[172px]">
            </div>
        </div>
        <div class="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">
            <div class="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#205f99] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(32,95,153,0.10)]"></div>
            <h3 class="m-0 mb-3 text-[#205f99] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#174f82]">
                ${slide.challengeTitle}
            </h3>
            <p class="leading-[1.65] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
                ${slide.challengeText}
            </p>
            <div class="!mx-auto bg-[#205f99] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]"></div>
        </div>
    </div>

    <div class="group relative flex-[1_1_520px] min-w-[480px] max-[997px]:min-w-full box-border rounded-[22px] bg-gradient-to-br from-white to-[#e5faec] border border-[rgba(16,185,129,0.16)] border-t-[6px] border-t-[#10b981] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#10b981] shadow-[0_10px_28px_rgba(16,185,129,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-[border-color,box-shadow] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(16,185,129,0.14)] animate-[fadeIn_.6s_ease_forwards] [animation-delay:.2s]">
        <div class="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(16,185,129,0.055)] border-b border-[rgba(16,185,129,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] min-[1500px]:basis-[205px] min-[1500px]:min-w-[205px] min-[1728px]:basis-[230px] min-[1728px]:min-w-[230px] min-[2400px]:basis-[270px] min-[2400px]:min-w-[270px] transition-all duration-500 group-hover:bg-[rgba(16,185,129,0.09)]">
            <div class="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(16,185,129,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(16,185,129,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-[-170px] min-[998px]:bottom-auto min-[998px]:translate-y-0 min-[998px]:w-[190px] min-[998px]:h-[190px] min-[1400px]:w-[205px] min-[1400px]:h-[205px] min-[1500px]:w-[225px] min-[1500px]:h-[225px] min-[1728px]:w-[250px] min-[1728px]:h-[250px] min-[2400px]:w-[285px] min-[2400px]:h-[285px] min-[1400px]:group-hover:scale-[1.35]"></div>
            <div class="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.84)] flex items-center justify-center shadow-[0_0_0_8px_rgba(16,185,129,0.06),0_10px_22px_rgba(16,185,129,0.12)] z-[2] min-[1400px]:w-[155px] min-[1400px]:h-[155px] min-[1500px]:w-[170px] min-[1500px]:h-[170px] min-[1728px]:w-[190px] min-[1728px]:h-[190px] min-[2400px]:w-[220px] min-[2400px]:h-[220px]">
                <div class="absolute border-2 border-[#209967eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] min-[1400px]:h-[126px] min-[1400px]:w-[126px] min-[1500px]:h-[140px] min-[1500px]:w-[140px] min-[1728px]:h-[156px] min-[1728px]:w-[156px] min-[2400px]:h-[180px] min-[2400px]:w-[180px] rounded-full transition-all w-[118px]"></div>
                <img src="${slide.aiHelpImage}" alt="${slide.aiHelpTitle}" class="max-w-[115px] max-h-[108px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(16,185,129,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(16,185,129,0.45)] min-[1400px]:max-w-[123px] min-[1400px]:max-h-[116px] min-[1500px]:max-w-[135px] min-[1500px]:max-h-[128px] min-[1728px]:max-w-[151px] min-[1728px]:max-h-[143px] min-[2400px]:max-w-[176px] min-[2400px]:max-h-[166px]">
            </div>
        </div>
        <div class="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">
            <div class="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#10b981] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(16,185,129,0.10)]"></div>
            <h3 class="m-0 mb-3 text-[#079669] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#087e5a]">
                ${slide.aiHelpTitle}
            </h3>
            <p class="leading-[1.65] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
                ${slide.aiHelpText}
            </p>
            <div class="!mx-auto bg-[#10b981] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]"></div>
        </div>
    </div>
</div>${bottomBanner}`;
    }

    // Before vs With AI Slide
    const count = Math.min(Math.max(slide.pointCount || 4, 1), 5);

    const beforeHtmlRows = (slide.beforePoints || [])
      .slice(0, count)
      .map((text, idx) => {
        const icon = BEFORE_ICONS[idx] || BEFORE_ICONS[BEFORE_ICONS.length - 1];
        return `\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
\t\t\t\t\t\t\t\t<img src="${icon}" class="w-[42px] h-[42px] object-contain" alt="Before AI ${idx + 1}">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">${text}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>`;
      })
      .join('\n');

    const withHtmlRows = (slide.withPoints || [])
      .slice(0, count)
      .map((text, idx) => {
        const config = WITH_AI_CONFIGS[idx % WITH_AI_CONFIGS.length];
        const formattedContent = formatFirstWordHtml(text, config.color);

        return `\t\t\t\t\t<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 ${config.cardBorderHover} hover:to-white/70 hover:-translate-y-2">
\t\t\t\t\t\t<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br ${config.glowGradient} rounded-[18px]"></div>
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] ${config.barBg} transition-all duration-500 ease-out ${config.barHover}"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out ${config.iconBoxAnimation}">
\t\t\t\t\t\t\t\t<img src="${config.iconUrl}" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out ${config.iconImgAnimation}" alt="With AI ${idx + 1}">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">${formattedContent}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>`;
      })
      .join('\n');

    return `<div class="w-full box-border my-[25px]">
\t<div class="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-7 w-full items-stretch">
\t\t<div class="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#777777] via-[#d0d0d0] to-[#777777] p-[2px] transition-all duration-700 ease-out hover:from-[#4d4d4d] hover:via-[#eaeaea] hover:to-[#7a7a7a] hover:shadow-[0_0_24px_rgba(130,130,130,0.28)]">
\t\t\t<div class="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f1f1f1] via-[#e7e7e7] to-[#d6d6d6] p-5 sm:p-7 lg:p-[30px] box-border">
\t\t\t\t<div class="absolute bg-gradient-to-r duration-700 ease-out from-[#777777] group-hover:h-[11px] group-hover:shadow-[0_0_14px_rgba(130,130,130,0.35)] h-[7px] left-0 to-[#c8c8c8] top-0 transition-all via-[#a7a7a7] w-full z-30"></div>
\t\t\t\t<div class="absolute -top-20 -right-20 w-[190px] h-[190px] rounded-full bg-white/40 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.5] group-hover:bg-white/60 group-hover:translate-x-2 group-hover:-translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/25 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/45 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="relative z-10 text-center mb-[26px] pt-1">
\t\t\t\t\t<h2 class="m-0 text-[#222222] text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">${slide.beforeTitle || 'Before AI'}</h2>
\t\t\t\t\t<div class="w-[55px] h-1 bg-[#777777] rounded-full mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20 group-hover:bg-[#555555]"></div>
\t\t\t\t</div>
\t\t\t\t<div class="relative z-10 flex flex-col gap-[13px]">
${beforeHtmlRows}
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>

\t\t<div class="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] p-[2px] transition-all duration-700 ease-out hover:from-[#30b6e5] hover:via-[#68e5ab] hover:to-[#087443] hover:shadow-[0_0_26px_rgba(48,182,229,0.28)]">
\t\t\t<div class="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#edf9f4] via-[#e4f6ee] to-[#d7eee4] p-5 sm:p-7 lg:p-[30px] box-border">
\t\t\t\t<div class="absolute bg-gradient-to-r duration-700 ease-out from-[#087443] group-hover:h-[11px] group-hover:shadow-[0_0_16px_rgba(48,182,229,0.35)] h-[7px] left-0 to-[#19aa9f] top-0 transition-all via-[#30b6e5] w-full z-30"></div>
\t\t\t\t<div class="-right-20 -top-20 absolute backdrop-blur-sm bg-white/35 duration-700 ease-out group-hover:-translate-y-2 group-hover:bg-white/68 group-hover:scale-[1.5] group-hover:translate-x-2 h-[190px] pointer-events-none rounded-full transition-all w-[190px]"></div>
\t\t\t\t<div class="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/35 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/35 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="relative z-10 text-center mb-[26px] pt-1">
\t\t\t\t\t<h2 class="m-0 bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] bg-clip-text text-transparent text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">${slide.withTitle || 'With AI'}</h2>
\t\t\t\t\t<div class="w-[55px] h-1 rounded-full bg-gradient-to-r from-[#30b6e5] to-[#087443] mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20"></div>
\t\t\t\t</div>
\t\t\t\t<div class="relative z-10 flex flex-col gap-[13px]">
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

  // Combined code for all open slides
  const allSlidesCombinedCode = useMemo(() => {
    return slides.map((s) => generateSlideHtml(s)).join('\n\n');
  }, [slides]);

  // Copy Clean Code Handler
  const handleCopyCode = async (copyAll = false) => {
    try {
      const codeToCopy = copyAll ? allSlidesCombinedCode : generatedCode;
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      showToast(
        copyAll
          ? `Copied all ${slides.length} slides to clipboard!`
          : 'Clean slide code copied to clipboard!',
        'success'
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy code. Please copy manually.', 'error');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 md:p-8">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Presentation className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Dynamic Slide Generator
            </h1>
            <Badge variant="outline" className="ml-2 font-mono text-xs">
              {slides.length} Open in Deck / {savedSlides.length} Saved in List
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Fast 1-box auto-paste, slide vault library, instant live preview,
            and clean zero-comment HTML export.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('preview')}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" /> Live Preview
          </Button>
          <Button
            variant={viewMode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('code')}
            className="gap-1.5"
          >
            <Code2 className="w-4 h-4" /> Clean Code
          </Button>
          <Button
            size="sm"
            onClick={() => handleCopyCode(false)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Copied Slide!' : 'Copy Current Slide'}
          </Button>
          {slides.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyCode(true)}
              className="gap-1.5 border-emerald-600/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Copy className="w-4 h-4" />
              Copy All Slides ({slides.length})
            </Button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MULTI-SLIDE DECK NAVIGATION TABS & SINGLE ADD SLIDE BUTTON */}
      {/* ======================================================== */}
      <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Slide List Tabs */}
        <div className="flex items-center flex-wrap gap-2">
          {slides.map((slide, idx) => {
            const isActive = idx === activeSlideIndex;
            let badgeText = 'Comparison';
            let badgeClass =
              'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
            if (slide.type === 'challenge') {
              badgeText = 'Challenge';
              badgeClass = 'bg-blue-500/15 text-blue-700 dark:text-blue-300';
            } else if (slide.type === 'custom' || slide.type === 'summary') {
              badgeText = 'Custom Slide';
              badgeClass =
                'bg-purple-500/15 text-purple-700 dark:text-purple-300';
            }

            return (
              <div
                key={slide.id}
                className={`group/tab relative flex items-center rounded-xl border transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:bg-accent/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  className="px-3.5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{slide.title || `Slide ${idx + 1}`}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : badgeClass
                    }`}
                  >
                    {badgeText}
                  </span>
                </button>

                {/* Close slide tab button (never deleted permanently, kept in All Slides list) */}
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

        {/* Single Add Slide Button + Slide Library Toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSlideLibrary(!showSlideLibrary)}
            className="h-8 gap-1.5 text-xs font-semibold"
            title="View all saved slides. Click any slide to re-open it in tabs."
          >
            <FolderArchive className="w-3.5 h-3.5 text-primary" />
            <span>All Slides List</span>
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
              {savedSlides.length}
            </Badge>
          </Button>

          <Button
            size="sm"
            onClick={handleAddNewSlide}
            className="h-8 gap-1.5 px-3.5 text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-95"
            title="Add a new slide with its own custom code and quick text to generate"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Slide</span>
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ALL SLIDES LIST (PERMANENT VAULT - CLICK TO RE-OPEN IN TABS) */}
      {/* ======================================================== */}
      {showSlideLibrary && (
        <Card className="border border-primary/20 bg-primary/[0.015] shadow-2xs">
          <CardHeader className="py-2.5 px-4 border-b border-primary/10 flex flex-row items-center justify-between">
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
      {/* 1-BOX QUICK TEXT TO GENERATE (ONLY QUICK BOX SHOWN BY DEFAULT) */}
      {/* ======================================================== */}
      <Card className="border border-primary/30 bg-primary/[0.02] shadow-xs">
        <CardHeader className="py-3 px-5 border-b border-primary/20 bg-primary/[0.04]">
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
            {currentSlide?.type === 'custom' || currentSlide?.type === 'summary'
              ? 'Paste your bullet points or text here to generate this slide. The content will be injected directly into the slide.'
              : currentSlide?.type === 'challenge'
                ? 'Paste your Challenge and AI Solution text here to generate the cards automatically.'
                : 'Paste your bullet points here. The tool separates "Before AI" and "With AI", assigns points, and colors the first bold words.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <Textarea
              rows={3}
              placeholder={
                currentSlide?.type === 'custom' ||
                currentSlide?.type === 'summary'
                  ? 'Paste bullet points or content text to generate this slide (e.g.,\n- Donna retains final verification on all AI replies\n- Routine response time cut by 85%\n- Consistent high quality across shifts)...'
                  : currentSlide?.type === 'challenge'
                    ? 'Paste Challenge text and How AI Can Help text here...'
                    : 'Paste Before AI points and With AI points here...'
              }
              value={singlePasteText}
              onChange={(e) => setSinglePasteText(e.target.value)}
              className="text-xs font-mono bg-background resize-y"
            />
            <Button
              onClick={handleSmartAutoPaste}
              className="sm:w-44 shrink-0 flex flex-col items-center justify-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs h-auto py-3 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Slide</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* CONTROLS BAR: POINTS TOGGLE & CUSTOMIZE SWITCH */}
      {/* ======================================================== */}
      <div className="p-3 px-4 rounded-xl border border-border/80 bg-card flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" />
            {currentSlide?.title || 'Slide'}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] uppercase font-mono ${
              currentSlide?.type === 'challenge'
                ? 'border-blue-300 text-blue-700 bg-blue-50/50'
                : currentSlide?.type === 'custom' ||
                    currentSlide?.type === 'summary'
                  ? 'border-purple-300 text-purple-700 bg-purple-50/50'
                  : 'border-emerald-300 text-emerald-700 bg-emerald-50/50'
            }`}
          >
            {currentSlide?.type === 'challenge'
              ? 'Challenge Design'
              : currentSlide?.type === 'custom' ||
                  currentSlide?.type === 'summary'
                ? 'Custom / Summary Code'
                : 'Before vs AI Design'}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
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
                className="h-7 px-2.5 text-xs"
              >
                4 Points
              </Button>
              <Button
                size="sm"
                variant={currentSlide.pointCount === 5 ? 'default' : 'outline'}
                onClick={() => updateActiveSlide({ pointCount: 5 })}
                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                5 Points (5th Animated)
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
            className="h-7 gap-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
          >
            <Save className="w-3 h-3" /> Save Slide
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DETAILED CUSTOMIZATION BOXES (SHOWN ONLY WHEN TOGGLE IS ON) */}
      {/* ======================================================== */}
      {showCustomize && currentSlide && (
        <Card className="border border-border/80 shadow-xs animate-in fade-in-50 duration-300">
          <CardHeader className="py-3 px-5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Customize Slide & Code — {currentSlide.title}
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
            {/* SLIDE LABEL IN DECK (CAN RENAME DIRECTLY) */}
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
              {currentSlide.type === 'before-after' ? (
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
              ) : currentSlide.type === 'custom' ||
                currentSlide.type === 'summary' ? (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Slide Header / Headline
                  </Label>
                  <Input
                    value={
                      currentSlide.summaryTitle || 'Summary & Key Takeaways'
                    }
                    onChange={(e) =>
                      updateActiveSlide({ summaryTitle: e.target.value })
                    }
                    className="mt-1 text-xs font-semibold text-purple-700 dark:text-purple-400"
                    placeholder="e.g. Summary & Key Takeaways"
                  />
                </div>
              ) : null}
            </div>

            {/* CUSTOM / SUMMARY SLIDE FORM (PASTE CODE DIRECTLY & QUICK PASTE) */}
            {currentSlide.type === 'custom' ||
            currentSlide.type === 'summary' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-purple-200/60 bg-purple-50/20 dark:bg-purple-950/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-purple-600" />
                      <Label className="font-bold text-sm text-foreground">
                        Slide Custom HTML Code (Paste Any Slide Code Directly)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const defaultCode = generateDefaultSummaryHtml({
                            summaryTitle:
                              currentSlide.summaryTitle ||
                              'Summary & Key Takeaways',
                            summaryPoints: currentSlide.summaryPoints || [],
                          });
                          updateActiveSlide({ customHtml: defaultCode });
                          showToast(
                            'Loaded Clean Summary Slide Template!',
                            'success'
                          );
                        }}
                        className="h-7 text-xs gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <RotateCcw className="w-3 h-3" /> Load Summary Template
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (currentSlide.customHtml) {
                            const cleaned = stripHtmlComments(
                              currentSlide.customHtml
                            );
                            updateActiveSlide({ customHtml: cleaned });
                            showToast(
                              'HTML comments stripped and cleaned!',
                              'success'
                            );
                          }
                        }}
                        className="h-7 text-xs"
                      >
                        Strip Comments
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paste your custom HTML / Tailwind code for this slide
                    directly below. Any comments will be automatically stripped
                    out.
                  </p>

                  <Textarea
                    rows={10}
                    value={currentSlide.customHtml || ''}
                    onChange={(e) =>
                      updateActiveSlide({ customHtml: e.target.value })
                    }
                    placeholder="Paste your slide HTML / Tailwind code here..."
                    className="font-mono text-xs leading-relaxed bg-background resize-y"
                  />
                </div>

                {/* Quick editable summary cards if using summary layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[0, 1, 2].map((idx) => {
                    const pt = currentSlide.summaryPoints?.[idx] || '';
                    const colors = ['#30b6e5', '#19aa9f', '#10b981'];
                    const labels = [
                      'Key Takeaway 1',
                      'Key Takeaway 2',
                      'Key Takeaway 3',
                    ];

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border bg-card space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: colors[idx] }}
                            />
                            {labels[idx]}
                          </Label>
                        </div>
                        <Textarea
                          rows={2}
                          value={pt}
                          onChange={(e) => {
                            const updated = [
                              ...(currentSlide.summaryPoints || []),
                            ];
                            updated[idx] = e.target.value;
                            const updatedHtml = generateDefaultSummaryHtml({
                              summaryTitle: currentSlide.summaryTitle,
                              summaryPoints: updated,
                            });
                            updateActiveSlide({
                              summaryPoints: updated,
                              customHtml: updatedHtml,
                            });
                          }}
                          placeholder={`Point ${idx + 1}...`}
                          className="text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : currentSlide.type === 'challenge' ? (
              /* CHALLENGE SLIDE FORM */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Challenge */}
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

                {/* Right: How AI Can Help */}
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
                      className="mt-1 text-sm font-semibold text-emerald-700"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      AI Solution Description
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
                        {/* Before Point */}
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

                        {/* With AI Point */}
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
      {/* OUTPUT VIEW: LIVE PREVIEW VS CLEAN CODE */}
      {/* ======================================================== */}
      {viewMode === 'preview' ? (
        <Card className="border border-border/80 shadow-md overflow-hidden">
          <CardHeader className="py-3 px-5 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                Live Interactive Preview — {currentSlide?.title || 'Slide'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMode('code')}
                className="gap-1.5 h-8 text-xs cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-600" /> View Code
              </Button>
              <Button
                size="sm"
                onClick={() => handleCopyCode(false)}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              {slides.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCode(true)}
                  className="gap-1.5 h-8 text-xs border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy All ({slides.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-slate-50/50">
            <div
              className="w-full"
              dangerouslySetInnerHTML={{ __html: generatedCode }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/80 shadow-md">
          <CardHeader className="py-3 px-5 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold">
                Clean Formatted HTML (Zero Comments) —{' '}
                {currentSlide?.title || 'Slide'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMode('preview')}
                className="gap-1.5 h-8 text-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-primary" /> Live Preview
              </Button>
              <Button
                size="sm"
                onClick={() => handleCopyCode(false)}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              {slides.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyCode(true)}
                  className="gap-1.5 h-8 text-xs border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy All ({slides.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              <pre className="p-4 sm:p-6 text-xs font-mono leading-relaxed bg-[#1e2430] text-[#e2e8f0] overflow-x-auto max-h-[500px] select-all rounded-b-xl">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SlideGenerator;
