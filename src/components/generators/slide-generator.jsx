'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Trash2,
  Lock,
} from 'lucide-react';
import { showToast, showConfirm } from '@/lib/swal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

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

// Format With AI text with first word colored with exact theme color matching user skeleton
function formatFirstWordHtml(text, color) {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').trim();
  const spaceIdx = clean.indexOf(' ');
  if (spaceIdx > 0) {
    const firstWord = clean.slice(0, spaceIdx);
    const rest = clean.slice(spaceIdx + 1);
    return `<span class="text-[${color}] font-bold">${firstWord}</span> ${rest}`;
  }
  return `<span class="text-[${color}] font-bold">${clean}</span>`;
}

// Exact user code skeleton for Slide 1 (Challenge & AI Help)
const DEFAULT_CHALLENGE_SKELETON = `<div class="flex flex-wrap gap-[22px] w-full box-border justify-center">
    <div class="group relative flex-[1_1_520px] min-w-[480px] max-[997px]:min-w-full box-border rounded-[22px] bg-gradient-to-br from-white to-[#e8f4fd] border border-[rgba(32,95,153,0.16)] border-t-[6px] border-t-[#205f99] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#205f99] shadow-[0_10px_28px_rgba(1,51,93,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-[border-color,box-shadow] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(1,51,93,0.14)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.1s]">
        <div class="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(32,95,153,0.055)] border-b border-[rgba(32,95,153,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] min-[1500px]:basis-[205px] min-[1500px]:min-w-[205px] min-[1728px]:basis-[230px] min-[1728px]:min-w-[230px] min-[2400px]:basis-[270px] min-[2400px]:min-w-[270px] transition-all duration-500 group-hover:bg-[rgba(32,95,153,0.09)]">
            <div class="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(32,95,153,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(32,95,153,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-auto min-[998px]:bottom-[-170px] min-[998px]:translate-y-0 min-[998px]:w-[190px] min-[998px]:h-[190px] min-[1400px]:w-[205px] min-[1400px]:h-[205px] min-[1500px]:w-[225px] min-[1500px]:h-[225px] min-[1728px]:w-[250px] min-[1728px]:h-[250px] min-[2400px]:w-[285px] min-[2400px]:h-[285px] min-[1400px]:group-hover:scale-[1.35]"></div>
            <div class="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.82)] flex items-center justify-center shadow-[0_0_0_8px_rgba(32,95,153,0.06),0_10px_22px_rgba(32,95,153,0.12)] z-[2] min-[1400px]:w-[155px] min-[1400px]:h-[155px] min-[1500px]:w-[170px] min-[1500px]:h-[170px] min-[1728px]:w-[190px] min-[1728px]:h-[190px] min-[2400px]:w-[220px] min-[2400px]:h-[220px]">
                <div class="absolute border-2 border-[#205f99eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] min-[1400px]:h-[126px] min-[1400px]:w-[126px] min-[1500px]:h-[140px] min-[1500px]:w-[140px] min-[1728px]:h-[156px] min-[1728px]:w-[156px] min-[2400px]:h-[180px] min-[2400px]:w-[180px] rounded-full transition-all w-[118px]"></div>
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/the-challange.webp" alt="" class="max-w-[112px] max-h-[112px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(32,95,153,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(32,95,153,0.42)] min-[1400px]:max-w-[120px] min-[1400px]:max-h-[120px] min-[1500px]:max-w-[132px] min-[1500px]:max-h-[132px] min-[1728px]:max-w-[148px] min-[1728px]:max-h-[148px] min-[2400px]:max-w-[172px] min-[2400px]:max-h-[172px]">
            </div>
        </div>
        <div class="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">
            <div class="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#205f99] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(32,95,153,0.10)]"></div>
            <h3 class="m-0 mb-3 text-[#205f99] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#174f82]">
                The Challenge
            </h3>
            <p class="leading-[1.65] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
                Customers expect confirmation that their inventory request was received and that action is being taken. As request volumes increase, repeatedly reviewing messages and drafting similar replies can take time away from Donna's other operational responsibilities.
            </p>
            <div class="!mx-auto bg-[#205f99] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]"></div>
        </div>
    </div>
    <div class="group relative flex-[1_1_520px] min-w-[480px] max-[997px]:min-w-full box-border rounded-[22px] bg-gradient-to-br from-white to-[#e5faec] border border-[rgba(16,185,129,0.16)] border-t-[6px] border-t-[#10b981] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#10b981] shadow-[0_10px_28px_rgba(16,185,129,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-[border-color,box-shadow] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(16,185,129,0.14)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.2s]">
        <div class="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(16,185,129,0.055)] border-b border-[rgba(16,185,129,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] min-[1500px]:basis-[205px] min-[1500px]:min-w-[205px] min-[1728px]:basis-[230px] min-[1728px]:min-w-[230px] min-[2400px]:basis-[270px] min-[2400px]:min-w-[270px] transition-all duration-500 group-hover:bg-[rgba(16,185,129,0.09)]">
            <div class="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(16,185,129,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(16,185,129,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-[-170px] min-[998px]:bottom-auto min-[998px]:translate-y-0 min-[998px]:w-[190px] min-[998px]:h-[190px] min-[1400px]:w-[205px] min-[1400px]:h-[205px] min-[1500px]:w-[225px] min-[1500px]:h-[225px] min-[1728px]:w-[250px] min-[1728px]:h-[250px] min-[2400px]:w-[285px] min-[2400px]:h-[285px] min-[1400px]:group-hover:scale-[1.35]"></div>
            <div class="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.84)] flex items-center justify-center shadow-[0_0_0_8px_rgba(16,185,129,0.06),0_10px_22px_rgba(16,185,129,0.12)] z-[2] min-[1400px]:w-[155px] min-[1400px]:h-[155px] min-[1500px]:w-[170px] min-[1500px]:h-[170px] min-[1728px]:w-[190px] min-[1728px]:h-[190px] min-[2400px]:w-[220px] min-[2400px]:h-[220px]">
                <div class="absolute border-2 border-[#209967eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] min-[1400px]:h-[126px] min-[1400px]:w-[126px] min-[1500px]:h-[140px] min-[1500px]:w-[140px] min-[1728px]:h-[156px] min-[1728px]:w-[156px] min-[2400px]:h-[180px] min-[2400px]:w-[180px] rounded-full transition-all w-[118px]"></div>
                <img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/how-ai-can-help.webp" alt="" class="max-w-[115px] max-h-[108px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(16,185,129,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(16,185,129,0.45)] min-[1400px]:max-w-[123px] min-[1400px]:max-h-[116px] min-[1500px]:max-w-[135px] min-[1500px]:max-h-[128px] min-[1728px]:max-w-[151px] min-[1728px]:max-h-[143px] min-[2400px]:max-w-[176px] min-[2400px]:max-h-[166px]">
            </div>
        </div>
        <div class="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">
            <div class="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#10b981] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(16,185,129,0.10)]"></div>
            <h3 class="m-0 mb-3 text-[#079669] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#087e5a]">
                How AI Can Help
            </h3>
            <p class="leading-[1.65] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
                AI can review an incoming inventory request and generate a draft reply that confirms receipt, outlines appropriate next steps, and uses a professional tone. Donna can review and adjust the draft before sending it.
            </p>
            <div class="!mx-auto bg-[#10b981] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]"></div>
        </div>
    </div>
</div>
<div class="group/message relative z-[2] mt-[14px] overflow-hidden rounded-[19px] border border-[#b9dfd8] bg-gradient-to-br from-[#f5fbff] via-[#f7fcfb] to-[#effbf4] px-[24px] py-[19px] backdrop-blur-[4px] transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-[4px] hover:border-[#78cfc0] hover:from-[#eef9ff] hover:via-[#f5fdf9] hover:to-[#e6faef] hover:shadow-[0_12px_28px_rgba(32,95,153,0.12)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.3s]">
    <div class="pointer-events-none absolute -right-[55px] -top-[55px] h-[130px] w-[130px] rounded-full bg-[#68e5ab]/10 blur-[28px] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:opacity-100 group-hover/message:scale-125"></div>
    <div class="pointer-events-none absolute -bottom-[60px] -left-[50px] h-[130px] w-[130px] rounded-full bg-[#38b5e4]/10 blur-[30px] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:opacity-100 group-hover/message:scale-125"></div>
    <div class="pointer-events-none absolute left-0 top-0 h-[50px] w-[5px] -translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#38b5e4] via-[#68e5ab] to-[#38b5e4] opacity-20 transition-all duration-700 group-hover/message:w-[130px] group-hover/message:opacity-70"></div>
    <div class="pointer-events-none absolute right-0 top-0 h-[50px] w-[5px] translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#38b5e4] via-[#68e5ab] to-[#38b5e4] opacity-20 transition-all duration-700 group-hover/message:w-[130px] group-hover/message:opacity-70"></div>
    <p class="relative z-[2] m-0 text-center text-[14px] font-medium leading-[1.7] text-[#40515d] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:text-[#263f46] min-[1400px]:text-[15px]">
        The employee remains responsible for verifying customer-specific details and ensuring that the draft accurately reflects current organizational information.
    </p>
    <div class="pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[#68e5ab] to-transparent opacity-0 transition-all duration-700 group-hover/message:w-[45%] group-hover/message:opacity-80"></div>
</div>`;

// Exact user code skeleton for Slide 2 (Before vs With AI - 5 Points with 5th Animation)
const DEFAULT_BEFORE_AFTER_SKELETON = `<div class="w-full box-border my-[25px]">
\t<div class="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-7 w-full items-stretch">
\t\t<div class="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#777777] via-[#d0d0d0] to-[#777777] p-[2px] transition-all duration-700 ease-out hover:from-[#4d4d4d] hover:via-[#eaeaea] hover:to-[#7a7a7a] hover:shadow-[0_0_24px_rgba(130,130,130,0.28)]">
\t\t\t<div class="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f1f1f1] via-[#e7e7e7] to-[#d6d6d6] p-5 sm:p-7 lg:p-[30px] box-border">
\t\t\t\t<div class="absolute bg-gradient-to-r duration-700 ease-out from-[#777777] group-hover:h-[11px] group-hover:shadow-[0_0_14px_rgba(130,130,130,0.35)] h-[7px] left-0 to-[#c8c8c8] top-0 transition-all via-[#a7a7a7] w-full z-30"></div>
\t\t\t\t<div class="absolute -top-20 -right-20 w-[190px] h-[190px] rounded-full bg-white/40 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.5] group-hover:bg-white/60 group-hover:translate-x-2 group-hover:-translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/25 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/45 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="relative z-10 text-center mb-[26px] pt-1">
\t\t\t\t\t<h2 class="m-0 text-[#222222] text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">Before AI</h2>
\t\t\t\t\t<div class="w-[55px] h-1 bg-[#777777] rounded-full mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20 group-hover:bg-[#555555]"></div>
\t\t\t\t</div>
\t\t\t\t<div class="relative z-10 flex flex-col gap-[13px]">
\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/Before-Ai--1.webp" class="w-[42px] h-[42px] object-contain" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Searching through old emails for a piece of information</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--2.webp" class="w-[42px] h-[42px] object-contain" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Rewriting the same type of message over and over</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--3.webp" class="w-[42px] h-[42px] object-contain" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Starting reports from scratch every time</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai---4.webp" class="w-[42px] h-[42px] object-contain" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Organizing notes manually after a meeting</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--5.webp" onerror="this.src='https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai---4.webp'" class="w-[42px] h-[42px] object-contain" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">Manually tracking inventory records across multiple systems</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t\t<div class="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] p-[2px] transition-all duration-700 ease-out hover:from-[#30b6e5] hover:via-[#68e5ab] hover:to-[#087443] hover:shadow-[0_0_26px_rgba(48,182,229,0.28)]">
\t\t\t<div class="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#edf9f4] via-[#e4f6ee] to-[#d7eee4] p-5 sm:p-7 lg:p-[30px] box-border">
\t\t\t\t<div class="absolute bg-gradient-to-r duration-700 ease-out from-[#087443] group-hover:h-[11px] group-hover:shadow-[0_0_16px_rgba(48,182,229,0.35)] h-[7px] left-0 to-[#19aa9f] top-0 transition-all via-[#30b6e5] w-full z-30"></div>
\t\t\t\t<div class="-right-20 -top-20 absolute backdrop-blur-sm bg-white/35 duration-700 ease-out group-hover:-translate-y-2 group-hover:bg-white/68 group-hover:scale-[1.5] group-hover:translate-x-2 h-[190px] pointer-events-none rounded-full transition-all w-[190px]"></div>
\t\t\t\t<div class="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/35 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/35 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="relative z-10 text-center mb-[26px] pt-1">
\t\t\t\t\t<h2 class="m-0 bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] bg-clip-text text-transparent text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">With AI</h2>
\t\t\t\t\t<div class="w-[55px] h-1 rounded-full bg-gradient-to-r from-[#30b6e5] to-[#087443] mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20"></div>
\t\t\t\t</div>
\t\t\t\t<div class="relative z-10 flex flex-col gap-[13px]">
\t\t\t\t\t<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#30b6e5]/30 hover:to-white/70 hover:-translate-y-2">
\t\t\t\t\t\t<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#30b6e5]/20 rounded-[18px]"></div>
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#30b6e5] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(48,182,229,0.35)]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out group-hover/pt:scale-[1.18] group-hover/pt:rotate-[360deg] group-hover/pt:rounded-[50%] group-hover/pt:bg-gradient-to-br group-hover/pt:from-[#30b6e5] group-hover/pt:to-white group-hover/pt:border-[#30b6e5] group-hover/pt:shadow-[0_0_16px_rgba(48,182,229,0.30)]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---1.webp" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out group-hover/pt:scale-90 group-hover/pt:-rotate-[360deg]" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#30b6e5] font-bold">Faster</span> searching, summarizing, and writing first drafts</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#24abb3]/30 hover:to-white/70 hover:-translate-y-2">
\t\t\t\t\t\t<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#24abb3]/20 rounded-[18px]"></div>
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#24abb3] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(36,171,179,0.35)]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-500 ease-out group-hover/pt:-translate-y-2 group-hover/pt:scale-[1.15] group-hover/pt:bg-[#d9f4ed] group-hover/pt:border-[#24abb3] group-hover/pt:shadow-[0_10px_16px_-4px_rgba(36,171,179,0.25)]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---2.webp" class="w-[42px] h-[42px] object-contain transition-transform duration-500 ease-out group-hover/pt:scale-110" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#24abb3] font-bold">Automating</span> templated messages</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#19aa9f]/30 hover:to-white/70 hover:-translate-y-2">
\t\t\t\t\t\t<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#19aa9f]/20 rounded-[18px]"></div>
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#19aa9f] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(25,170,159,0.35)]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out group-hover/pt:scale-[1.15] group-hover/pt:rounded-[10px] group-hover/pt:-rotate-6 group-hover/pt:bg-[#d9f4ed] group-hover/pt:border-[#19aa9f] group-hover/pt:shadow-[0_0_16px_rgba(25,170,159,0.25)]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785078099/With-AI---3.webp" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out group-hover/pt:rotate-6" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#19aa9f] font-bold">Instant</span> summaries of long documents</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#2ebe78]/30 hover:to-white/70 hover:-translate-y-2">
\t\t\t\t\t\t<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#2ebe78]/20 rounded-[18px]"></div>
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#2ebe78] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(46,190,120,0.35)]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out group-hover/pt:scale-[1.18] group-hover/pt:-rotate-[18deg] group-hover/pt:bg-gradient-to-tr group-hover/pt:from-[#2ebe78] group-hover/pt:to-white group-hover/pt:border-[#2ebe78] group-hover/pt:shadow-[0_0_18px_rgba(46,190,120,0.28)]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/With-AI---4.webp" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out group-hover/pt:scale-90 group-hover/pt:rotate-[18deg]" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#2ebe78] font-bold">Organized</span> action items from meetings</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#10b981]/30 hover:to-white/70 hover:-translate-y-2">
\t\t\t\t\t\t<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#10b981]/20 rounded-[18px]"></div>
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#10b981] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_12px_rgba(16,185,129,0.40)]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out group-hover/pt:scale-[1.20] group-hover/pt:rotate-[15deg] group-hover/pt:rounded-[22px] group-hover/pt:bg-gradient-to-br group-hover/pt:from-[#10b981] group-hover/pt:via-[#34d399] group-hover/pt:to-white group-hover/pt:border-[#10b981] group-hover/pt:shadow-[0_0_20px_rgba(16,185,129,0.35)]">
\t\t\t\t\t\t\t\t<img src="https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---5.webp" onerror="this.src='https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/With-AI---4.webp'" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out group-hover/pt:scale-95 group-hover/pt:-rotate-[15deg]" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words"><span class="text-[#10b981] font-bold">Seamless</span> real-time inventory tracking and customer notifications</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>
</div>`;

// Starter templates for custom slides
const STARTER_TEMPLATES = [
  {
    id: 'challenge',
    name: 'Challenge & AI Help',
    description: 'Dynamic 2-card Challenge & AI Help layout',
    type: 'challenge',
    skeleton: DEFAULT_CHALLENGE_SKELETON,
  },
  {
    id: 'before-with-ai',
    name: 'Before AI vs With AI',
    description: '5-point comparison with 3D pop effect & color themes',
    type: 'before-after',
    skeleton: DEFAULT_BEFORE_AFTER_SKELETON,
  },
  {
    id: 'before-after-ai',
    name: 'Before AI vs After AI',
    description: '5-point comparison with "After AI" branding',
    type: 'before-after',
    skeleton: DEFAULT_BEFORE_AFTER_SKELETON,
  },
  {
    id: 'summary-3',
    name: '3-Card Summary',
    description: 'Header with 3 modern takeaway cards',
    type: 'custom',
    skeleton: `<div class="w-full box-border my-[25px]">
\t<div class="relative w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-[#f7fafc] to-[#eef7f6] border border-[#205f99]/20 p-6 sm:p-8 lg:p-10 shadow-[0_10px_30px_rgba(32,95,153,0.08)]">
\t\t<div class="text-center mb-8">
\t\t\t<span class="inline-block px-3 py-1 text-xs font-black uppercase tracking-wider text-[#205f99] bg-[#205f99]/10 rounded-full mb-2">Key Takeaways</span>
\t\t\t<h2 class="m-0 text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">[Slide Headline / Key Takeaways]</h2>
\t\t\t<div class="w-16 h-1 bg-gradient-to-r from-[#205f99] via-[#19aa9f] to-[#10b981] rounded-full mx-auto mt-3"></div>
\t\t</div>
\t\t<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#30b6e5]/25 p-5 shadow-[0_4px_16px_rgba(48,182,229,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(48,182,229,0.18)] hover:border-[#30b6e5]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#30b6e5]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#30b6e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Efficiency Boost</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">[Enter first key summary or productivity metric here]</p>
\t\t\t</div>
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#19aa9f]/25 p-5 shadow-[0_4px_16px_rgba(25,170,159,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(25,170,159,0.18)] hover:border-[#19aa9f]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#19aa9f]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#19aa9f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Human Oversight</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">[Enter second key summary or policy review detail here]</p>
\t\t\t</div>
\t\t\t<div class="group relative rounded-[20px] bg-white border border-[#10b981]/25 p-5 shadow-[0_4px_16px_rgba(16,185,129,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_24px_rgba(16,185,129,0.18)] hover:border-[#10b981]/60">
\t\t\t\t<div class="w-10 h-10 rounded-[12px] bg-[#10b981]/15 flex items-center justify-center mb-3.5 transition-transform duration-500 group-hover:scale-110">
\t\t\t\t\t<svg class="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
\t\t\t\t</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Consistent Quality</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">[Enter third key summary or output standard here]</p>
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
\t\t\t<h2 class="m-0 text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">[Workflow: Step-by-Step Implementation]</h2>
\t\t\t<div class="w-16 h-1 bg-[#24abb3] rounded-full mx-auto mt-3"></div>
\t\t</div>
\t\t<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
\t\t\t<div class="relative rounded-[20px] bg-slate-50 border border-slate-200 p-5">
\t\t\t\t<div class="w-8 h-8 rounded-full bg-[#24abb3] text-white flex items-center justify-center font-bold text-sm mb-3">1</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Step 1 Title</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">[Describe initial step, data ingestion, or trigger action]</p>
\t\t\t</div>
\t\t\t<div class="relative rounded-[20px] bg-slate-50 border border-slate-200 p-5">
\t\t\t\t<div class="w-8 h-8 rounded-full bg-[#24abb3] text-white flex items-center justify-center font-bold text-sm mb-3">2</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Step 2 Title</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">[Describe verification, review protocol, or processing step]</p>
\t\t\t</div>
\t\t\t<div class="relative rounded-[20px] bg-slate-50 border border-slate-200 p-5">
\t\t\t\t<div class="w-8 h-8 rounded-full bg-[#24abb3] text-white flex items-center justify-center font-bold text-sm mb-3">3</div>
\t\t\t\t<h3 class="text-base font-bold text-[#1e293b] mb-1.5">Step 3 Title</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">[Describe dispatch, final delivery, or audit trail]</p>
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
\t\t\t<h2 class="m-0 text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">[Core Capabilities & Impact]</h2>
\t\t\t<div class="w-16 h-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full mx-auto mt-3"></div>
\t\t</div>
\t\t<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
\t\t\t<div class="rounded-[20px] bg-white border border-blue-100 p-6 shadow-sm">
\t\t\t\t<h3 class="text-lg font-bold text-blue-900 mb-2">Capability 1</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">[Describe first core capability, record consolidation, or system feature]</p>
\t\t\t</div>
\t\t\t<div class="rounded-[20px] bg-white border border-emerald-100 p-6 shadow-sm">
\t\t\t\t<h3 class="text-lg font-bold text-emerald-900 mb-2">Capability 2</h3>
\t\t\t\t<p class="text-sm text-[#475569] leading-relaxed m-0">[Describe second core capability, compliance protocol, or safeguard]</p>
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

// Safe DOM node updater that preserves user markup, tags, classes, and styles
function updateElementPreservingMarkup(el, newText) {
  if (!el || newText === undefined || newText === null) return;
  const trimmed = String(newText).trim();

  // If newText contains HTML tags, assign innerHTML directly so user markup works
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    el.innerHTML = trimmed;
    return;
  }

  // If element has a child tag (e.g. <span style="...">Word</span> Rest), preserve markup
  const child = el.firstElementChild;
  if (child && el.children.length === 1) {
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx > 0) {
      child.textContent = trimmed.slice(0, spaceIdx);
      const rest = ' ' + trimmed.slice(spaceIdx + 1);

      let found = false;
      for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === 3 && node !== child) {
          node.textContent = rest;
          found = true;
          break;
        }
      }
      if (!found) {
        el.appendChild(document.createTextNode(rest));
      }
      return;
    }
  }

  el.textContent = trimmed;
}

// Render dynamic custom skeleton HTML with updated field values
function renderCustomSkeletonHtml(skeletonHtml, fields) {
  if (!skeletonHtml) return '';
  let output = skeletonHtml;

  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return stripHtmlComments(output);
  }

  // 1. Explicit placeholders replacement (leaves 100% of user code intact!)
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
          updateElementPreservingMarkup(headings[f.elementIndex], val);
        } else if (f.type === 'text' && textElements[f.elementIndex]) {
          updateElementPreservingMarkup(textElements[f.elementIndex], val);
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

const SLIDES_STORAGE_KEY = 'hazwoper_saved_slides_deck_v3';

// Initial default slides in the library matching user's exact skeletons and content
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
    showBottomNote: true,
    disclaimer:
      'The employee remains responsible for verifying customer-specific details and ensuring that the draft accurately reflects current organizational information.',
    skeletonHtml: DEFAULT_CHALLENGE_SKELETON,
  },
  {
    id: 'slide-2',
    type: 'before-after',
    title: 'Slide 2: Before vs With AI',
    beforeTitle: 'Before AI',
    withTitle: 'With AI',
    pointCount: 5,
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
    skeletonHtml: DEFAULT_BEFORE_AFTER_SKELETON,
  },
];

// Helper to initialize slides cleanly from localStorage or defaults
function getInitialSavedSlides() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SLIDES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return DEFAULT_SAVED_SLIDES;
}

// Database mapping helpers
function slideToRow(s, currentUser) {
  return {
    id: s.id,
    title: s.title || 'Untitled Slide',
    type: s.type || 'before-after',
    skeleton_html: s.skeletonHtml || '',
    is_custom_edited: Boolean(s.isCustomEdited),
    slide_data: {
      challengeTitle: s.challengeTitle,
      challengeText: s.challengeText,
      challengeImage: s.challengeImage,
      aiHelpTitle: s.aiHelpTitle,
      aiHelpText: s.aiHelpText,
      aiHelpImage: s.aiHelpImage,
      disclaimer: s.disclaimer,
      showBottomNote: s.showBottomNote,
      beforeTitle: s.beforeTitle,
      withTitle: s.withTitle,
      pointCount: s.pointCount,
      beforePoints: s.beforePoints,
      withPoints: s.withPoints,
      fields: s.fields,
    },
    created_by: s.created_by || currentUser?.id || null,
    created_by_email: s.created_by_email || currentUser?.email || '',
    created_by_name:
      s.created_by_name ||
      currentUser?.name ||
      currentUser?.full_name ||
      (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
      'Creator',
    updated_at: new Date().toISOString(),
  };
}

function rowToSlide(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    skeletonHtml: row.skeleton_html,
    isCustomEdited: row.is_custom_edited,
    created_by: row.created_by,
    created_by_email: row.created_by_email,
    created_by_name: row.created_by_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ...(row.slide_data || {}),
  };
}

export function SlideGenerator() {
  const { user } = useAuth();

  // All slides ever saved in library
  const [savedSlides, setSavedSlides] = useState(() => getInitialSavedSlides());

  // Active slides currently open in tabs
  const [slides, setSlides] = useState(() => {
    const initial = getInitialSavedSlides();
    return initial.slice(0, 2);
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState('code'); // 'preview' | 'code'
  const [copied, setCopied] = useState(false);
  const [singlePasteText, setSinglePasteText] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showSlideLibrary, setShowSlideLibrary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedSlideIds, setUnsavedSlideIds] = useState(() => new Set());

  // Add Slide Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSkeleton, setModalSkeleton] = useState(
    STARTER_TEMPLATES[0].skeleton
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState('challenge');

  // Edit Any Slide Skeleton Modal State
  const [editingSkeletonSlide, setEditingSkeletonSlide] = useState(null);
  const [tempSkeletonCode, setTempSkeletonCode] = useState('');

  // Master Admin resolution
  const isMasterAdmin = useMemo(() => {
    if (!user) return false;
    const email = (user.email || '').toLowerCase();
    return (
      user.role === 'admin' ||
      user.role === 'superadmin' ||
      email === 'bilalghaffar46@gmail.com' ||
      email.includes('admin')
    );
  }, [user]);

  // Active slide
  const currentSlide = slides[activeSlideIndex] || slides[0] || savedSlides[0];

  // Access control for editing active slide skeleton
  const canEditCurrentSkeleton = useMemo(() => {
    if (!currentSlide) return false;
    if (isMasterAdmin) return true;
    if (!currentSlide.created_by) return isMasterAdmin;
    return user && currentSlide.created_by === user.id;
  }, [currentSlide, isMasterAdmin, user]);

  // Load slides from Supabase on mount
  useEffect(() => {
    let mounted = true;
    const loadCloudSlides = async () => {
      try {
        const { data, error } = await supabase
          .from('slides')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0 && mounted) {
          const cloudSlides = data.map(rowToSlide);
          setSavedSlides((prevLocal) => {
            const map = new Map();
            // Default system slides first, then cloud slides override/append
            prevLocal.forEach((s) => map.set(s.id, s));
            cloudSlides.forEach((s) => map.set(s.id, s));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // ignore
            }
            return merged;
          });
        }
      } catch {
        // Fall back gracefully to localStorage
      }
    };

    loadCloudSlides();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync savedSlides to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(savedSlides));
      } catch {
        // ignore
      }
    }
  }, [savedSlides]);

  // Open Edit Skeleton modal for any slide (Strictly Creator or Master Admin)
  const handleOpenEditSkeleton = (targetSlide = currentSlide) => {
    if (!targetSlide) return;
    const isCreator =
      user && targetSlide.created_by && targetSlide.created_by === user.id;
    const canEdit =
      isCreator || isMasterAdmin || (!targetSlide.created_by && isMasterAdmin);

    if (!canEdit) {
      showToast(
        `Only the creator (${targetSlide.created_by_name || 'author'}) or a master admin can edit this slide's skeleton.`,
        'warning'
      );
      return;
    }

    setEditingSkeletonSlide(targetSlide);
    const code = targetSlide.isCustomEdited
      ? targetSlide.skeletonHtml || ''
      : targetSlide.skeletonHtml || generateSlideHtml(targetSlide);
    setTempSkeletonCode(code);
  };

  // Save changes from Edit Skeleton modal
  const handleSaveSkeletonModal = async () => {
    if (!editingSkeletonSlide) return;
    const cleaned = stripHtmlComments(tempSkeletonCode);
    const updatedSlide = {
      ...editingSkeletonSlide,
      skeletonHtml: cleaned,
      isCustomEdited: true,
      created_by: editingSkeletonSlide.created_by || user?.id || null,
      created_by_name:
        editingSkeletonSlide.created_by_name ||
        user?.name ||
        user?.full_name ||
        (user?.email ? user.email.split('@')[0] : '') ||
        'Creator',
      created_by_email:
        editingSkeletonSlide.created_by_email || user?.email || '',
    };
    if (editingSkeletonSlide.type === 'custom') {
      updatedSlide.fields = extractFieldsFromSkeleton(cleaned);
    }
    setSlides((prev) =>
      prev.map((s) => (s.id === updatedSlide.id ? updatedSlide : s))
    );
    setSavedSlides((prev) =>
      prev.map((s) => (s.id === updatedSlide.id ? updatedSlide : s))
    );
    // Mark as unsaved until explicitly saved or sync now
    setUnsavedSlideIds((prev) => new Set(prev).add(updatedSlide.id));
    setEditingSkeletonSlide(null);

    // Sync to Supabase in background
    try {
      const row = slideToRow(updatedSlide, user);
      await supabase.from('slides').upsert(row, { onConflict: 'id' });
    } catch {
      // ignore
    }

    showToast(`Saved skeleton code for "${updatedSlide.title}"!`, 'success');
  };

  // Helper to update active slide properties and keep slides state reactive
  const updateActiveSlide = (updates) => {
    const contentFieldKeys = [
      'challengeTitle',
      'challengeText',
      'challengeImage',
      'aiHelpTitle',
      'aiHelpText',
      'aiHelpImage',
      'showBottomNote',
      'disclaimer',
      'beforeTitle',
      'withTitle',
      'pointCount',
      'beforePoints',
      'withPoints',
      'fields',
    ];
    const isChangingContentFields = contentFieldKeys.some((k) =>
      Object.prototype.hasOwnProperty.call(updates, k)
    );

    const updatedSlide = {
      ...currentSlide,
      ...(isChangingContentFields && updates.isCustomEdited === undefined
        ? { isCustomEdited: false }
        : {}),
      ...updates,
    };

    setSlides((prev) => {
      const next = [...prev];
      if (next[activeSlideIndex]) {
        next[activeSlideIndex] = updatedSlide;
      }
      return next;
    });

    // Mark current slide as having unsaved changes
    setUnsavedSlideIds((prev) => new Set(prev).add(updatedSlide.id));
  };

  // Open Add Slide Modal
  const handleOpenAddSlideModal = () => {
    const nextNum = savedSlides.length + 1;
    setModalTitle(`Slide ${nextNum}: Key Takeaways`);
    setModalSkeleton(STARTER_TEMPLATES[0].skeleton);
    setSelectedTemplateId(STARTER_TEMPLATES[0].id);
    setIsAddModalOpen(true);
  };

  // Detect fields preview for the modal skeleton
  const detectedModalFields = useMemo(() => {
    return extractFieldsFromSkeleton(modalSkeleton);
  }, [modalSkeleton]);

  // Confirm Add Slide with Dynamic Templates & Custom Code Skeleton
  const handleConfirmAddSlide = async () => {
    const skeleton = modalSkeleton.trim();
    if (!skeleton) {
      showToast('Please provide an HTML code skeleton.', 'error');
      return;
    }

    const slideTitle = modalTitle.trim() || `Slide ${savedSlides.length + 1}`;
    const baseMeta = {
      id: `slide-${Date.now()}`,
      title: slideTitle,
      created_by: user?.id || null,
      created_by_name:
        user?.name ||
        user?.full_name ||
        (user?.email ? user.email.split('@')[0] : '') ||
        'User',
      created_by_email: user?.email || '',
    };

    let newSlide;

    if (selectedTemplateId === 'challenge') {
      newSlide = {
        ...baseMeta,
        type: 'challenge',
        challengeTitle: 'The Challenge',
        challengeText:
          'Customers expect confirmation that their inventory request was received and that action is being taken.',
        challengeImage:
          'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/the-challange.webp',
        aiHelpTitle: 'How AI Can Help',
        aiHelpText:
          'Extract action items automatically and communicate follow-up actions faster.',
        aiHelpImage:
          'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/how-ai-can-help.webp',
        disclaimer:
          'The employee remains responsible for verifying customer-specific details and ensuring accuracy.',
        showBottomNote: true,
        skeletonHtml: DEFAULT_CHALLENGE_SKELETON,
      };
    } else if (
      selectedTemplateId === 'before-with-ai' ||
      selectedTemplateId === 'before-after-ai'
    ) {
      const isAfterAi = selectedTemplateId === 'before-after-ai';
      newSlide = {
        ...baseMeta,
        type: 'before-after',
        beforeTitle: 'Before AI',
        withTitle: isAfterAi ? 'After AI' : 'With AI',
        pointCount: 5,
        beforePoints: [
          'Review meeting notes manually',
          'Identify action items individually',
          'Create reminder emails for each participant',
          'Spend time organizing follow-up activities',
          'Risk missing assigned tasks',
        ],
        withPoints: [
          'Extract action items automatically',
          'Generate personalized reminders',
          'Improve accountability',
          'Reduce administrative effort',
          'Communicate follow-up actions faster',
        ],
        skeletonHtml: DEFAULT_BEFORE_AFTER_SKELETON,
      };
    } else {
      const fields = extractFieldsFromSkeleton(skeleton);
      newSlide = {
        ...baseMeta,
        type: 'custom',
        skeletonHtml: stripHtmlComments(skeleton),
        fields: fields,
      };
    }

    setSavedSlides((prev) => [...prev, newSlide]);
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    setIsAddModalOpen(false);

    // Sync to Supabase
    try {
      const row = slideToRow(newSlide, user);
      await supabase.from('slides').insert(row);
    } catch (e) {
      console.warn('Could not insert slide into cloud:', e);
    }

    showToast(`Created "${newSlide.title}" successfully!`, 'success');
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

  // Delete slide permanently (Strictly Creator or Master Admin)
  const handleDeleteSlideFromList = async (slideToDelete) => {
    if (savedSlides.length <= 1) {
      showToast('You must keep at least 1 slide in the library.', 'warning');
      return;
    }

    // Access control: only creator or master admin
    const isCreator =
      user && slideToDelete.created_by && slideToDelete.created_by === user.id;
    const canDelete =
      isCreator ||
      isMasterAdmin ||
      (!slideToDelete.created_by && isMasterAdmin);

    if (!canDelete) {
      showToast(
        `Only the creator (${slideToDelete.created_by_name || 'author'}) or a master admin can delete this slide.`,
        'error'
      );
      return;
    }

    const res = await showConfirm({
      title: 'Delete from Slide List?',
      text: `Are you sure you want to permanently delete "${slideToDelete.title}"? This will remove it from the slide library.`,
      icon: 'warning',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!res?.isConfirmed) return;

    // Remove from savedSlides
    const nextSaved = savedSlides.filter((s) => s.id !== slideToDelete.id);
    setSavedSlides(nextSaved);

    // If it's also open in active tabs, remove it
    if (slides.some((s) => s.id === slideToDelete.id)) {
      const nextOpen = slides.filter((s) => s.id !== slideToDelete.id);
      if (nextOpen.length > 0) {
        setSlides(nextOpen);
        setActiveSlideIndex((prev) =>
          prev >= nextOpen.length ? nextOpen.length - 1 : prev
        );
      } else {
        setSlides([nextSaved[0]]);
        setActiveSlideIndex(0);
      }
    }

    // Clear from unsaved tracking
    setUnsavedSlideIds((prev) => {
      const next = new Set(prev);
      next.delete(slideToDelete.id);
      return next;
    });

    // Delete from Supabase
    try {
      await supabase.from('slides').delete().eq('id', slideToDelete.id);
    } catch (e) {
      console.warn('Could not delete slide from cloud:', e);
    }

    showToast(`Deleted "${slideToDelete.title}" from list!`, 'success');
  };

  // Save current slide permanently to state, localStorage, and Supabase
  const handleSaveCurrentSlide = async () => {
    if (!currentSlide) return;
    setIsSaving(true);

    const slideToSave = {
      ...currentSlide,
      created_by: currentSlide.created_by || user?.id || null,
      created_by_name:
        currentSlide.created_by_name ||
        user?.name ||
        user?.full_name ||
        (user?.email ? user.email.split('@')[0] : '') ||
        'Creator',
      created_by_email: currentSlide.created_by_email || user?.email || '',
    };

    // Update locally
    setSlides((prev) =>
      prev.map((s) => (s.id === slideToSave.id ? slideToSave : s))
    );
    setSavedSlides((prev) => {
      const exists = prev.some((s) => s.id === slideToSave.id);
      return exists
        ? prev.map((s) => (s.id === slideToSave.id ? slideToSave : s))
        : [...prev, slideToSave];
    });

    // Clear dirty state
    setUnsavedSlideIds((prev) => {
      const next = new Set(prev);
      next.delete(slideToSave.id);
      return next;
    });

    // Persist to Supabase
    try {
      const row = slideToRow(slideToSave, user);
      const { error } = await supabase
        .from('slides')
        .upsert(row, { onConflict: 'id' });
      if (error && error.code === '42P10') {
        await supabase.from('slides').update(row).eq('id', row.id);
      }
    } catch (e) {
      console.warn('Could not sync slide to cloud:', e);
    } finally {
      setIsSaving(false);
    }

    showToast(`Saved "${slideToSave.title}" successfully!`, 'success');
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

      updateActiveSlide({ fields: updatedFields, isCustomEdited: false });
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
          isCustomEdited: false,
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
          isCustomEdited: false,
        });
        showToast('Distributed content across Challenge & AI Help!', 'info');
      }
      setSinglePasteText('');
    } else {
      // Before vs With AI Slide
      // Heading detection: filter out any column labels / title lines from bullet points
      const isComparisonHeading = (line) =>
        /^(?:before\s*ai|without\s*ai|before|with\s*ai|after\s*ai|with\s*copilot|ai\s*solution|after|traditional|manual|points?)\s*:?$/i.test(
          line.trim()
        );

      const cleanLineItem = (line) =>
        line
          .trim()
          .replace(/^[-*•\d.]+\s*/, '')
          .trim();

      // Check for With AI separator with or without colon, on its own line or within text
      const withAiSeparatorRegex =
        /(?:^|\n)\s*(?:with\s*ai|after\s*ai|ai\s*solution|with\s*copilot|after)\s*:?\s*(?:\n|$)/i;

      let beforeLines = [];
      let withLines = [];

      if (withAiSeparatorRegex.test(raw)) {
        const match = raw.match(withAiSeparatorRegex);
        const matchIndex = match.index;
        const beforeChunk = raw.slice(0, matchIndex);
        const withChunk = raw.slice(matchIndex + match[0].length);

        beforeLines = beforeChunk
          .split('\n')
          .map(cleanLineItem)
          .filter((line) => line.length > 0 && !isComparisonHeading(line));

        withLines = withChunk
          .split('\n')
          .map(cleanLineItem)
          .filter((line) => line.length > 0 && !isComparisonHeading(line));
      } else {
        // Fallback: strip headings, then split evenly
        const allClean = raw
          .split('\n')
          .map(cleanLineItem)
          .filter((line) => line.length > 0 && !isComparisonHeading(line));

        const half = Math.ceil(allClean.length / 2);
        beforeLines = allClean.slice(0, half);
        withLines = allClean.slice(half);
      }

      const targetCount = Math.min(
        Math.max(beforeLines.length, withLines.length, 4),
        5
      );

      // If user provided points, ensure all provided points are used
      const finalBefore = beforeLines.slice(0, 5);
      const finalWith = withLines.slice(0, 5);

      // Pad with existing points only if fewer than targetCount
      while (finalBefore.length < targetCount) {
        const existing = currentSlide.beforePoints?.[finalBefore.length];
        if (existing) finalBefore.push(existing);
        else break;
      }
      while (finalWith.length < targetCount) {
        const existing = currentSlide.withPoints?.[finalWith.length];
        if (existing) finalWith.push(existing);
        else break;
      }

      updateActiveSlide({
        pointCount: targetCount,
        beforePoints: finalBefore,
        withPoints: finalWith,
        isCustomEdited: false,
      });

      showToast(
        `Applied ${beforeLines.length} Before AI & ${withLines.length} With AI points perfectly!`,
        'success'
      );
      setSinglePasteText('');
    }
  };

  // Generate HTML for any slide (Challenge, Before-After, or Custom Skeleton)
  const generateSlideHtml = (slide) => {
    if (!slide) return '';

    // If slide has custom skeleton code edited directly by the user in Customize
    if (slide.isCustomEdited && slide.skeletonHtml) {
      return stripHtmlComments(slide.skeletonHtml);
    }

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
      const showBottom = slide.showBottomNote !== false;

      return `<div class="flex flex-wrap gap-[22px] w-full box-border justify-center">
    <div class="group relative flex-[1_1_520px] min-w-[480px] max-[997px]:min-w-full box-border rounded-[22px] bg-gradient-to-br from-white to-[#e8f4fd] border border-[rgba(32,95,153,0.16)] border-t-[6px] border-t-[#205f99] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#205f99] shadow-[0_10px_28px_rgba(1,51,93,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-[border-color,box-shadow] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(1,51,93,0.14)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.1s]">
        <div class="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(32,95,153,0.055)] border-b border-[rgba(32,95,153,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] min-[1500px]:basis-[205px] min-[1500px]:min-w-[205px] min-[1728px]:basis-[230px] min-[1728px]:min-w-[230px] min-[2400px]:basis-[270px] min-[2400px]:min-w-[270px] transition-all duration-500 group-hover:bg-[rgba(32,95,153,0.09)]">
            <div class="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(32,95,153,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(32,95,153,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-auto min-[998px]:bottom-[-170px] min-[998px]:translate-y-0 min-[998px]:w-[190px] min-[998px]:h-[190px] min-[1400px]:w-[205px] min-[1400px]:h-[205px] min-[1500px]:w-[225px] min-[1500px]:h-[225px] min-[1728px]:w-[250px] min-[1728px]:h-[250px] min-[2400px]:w-[285px] min-[2400px]:h-[285px] min-[1400px]:group-hover:scale-[1.35]"></div>
            <div class="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.82)] flex items-center justify-center shadow-[0_0_0_8px_rgba(32,95,153,0.06),0_10px_22px_rgba(32,95,153,0.12)] z-[2] min-[1400px]:w-[155px] min-[1400px]:h-[155px] min-[1500px]:w-[170px] min-[1500px]:h-[170px] min-[1728px]:w-[190px] min-[1728px]:h-[190px] min-[2400px]:w-[220px] min-[2400px]:h-[220px]">
                <div class="absolute border-2 border-[#205f99eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] min-[1400px]:h-[126px] min-[1400px]:w-[126px] min-[1500px]:h-[140px] min-[1500px]:w-[140px] min-[1728px]:h-[156px] min-[1728px]:w-[156px] min-[2400px]:h-[180px] min-[2400px]:w-[180px] rounded-full transition-all w-[118px]"></div>
                <img src="${challengeImg}" alt="" class="max-w-[112px] max-h-[112px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(32,95,153,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(32,95,153,0.42)] min-[1400px]:max-w-[120px] min-[1400px]:max-h-[120px] min-[1500px]:max-w-[132px] min-[1500px]:max-h-[132px] min-[1728px]:max-w-[148px] min-[1728px]:max-h-[148px] min-[2400px]:max-w-[172px] min-[2400px]:max-h-[172px]">
            </div>
        </div>
        <div class="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">
            <div class="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#205f99] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(32,95,153,0.10)]"></div>
            <h3 class="m-0 mb-3 text-[#205f99] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#174f82]">
                ${challengeTitle}
            </h3>
            <p class="leading-[1.65] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
                ${challengeText}
            </p>
            <div class="!mx-auto bg-[#205f99] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]"></div>
        </div>
    </div>
    <div class="group relative flex-[1_1_520px] min-w-[480px] max-[997px]:min-w-full box-border rounded-[22px] bg-gradient-to-br from-white to-[#e5faec] border border-[rgba(16,185,129,0.16)] border-t-[6px] border-t-[#10b981] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#10b981] shadow-[0_10px_28px_rgba(16,185,129,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-[border-color,box-shadow] duration-500 ease-out hover:shadow-[0_15px_36px_rgba(16,185,129,0.14)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.2s]">
        <div class="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(16,185,129,0.055)] border-b border-[rgba(16,185,129,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] min-[1500px]:basis-[205px] min-[1500px]:min-w-[205px] min-[1728px]:basis-[230px] min-[1728px]:min-w-[230px] min-[2400px]:basis-[270px] min-[2400px]:min-w-[270px] transition-all duration-500 group-hover:bg-[rgba(16,185,129,0.09)]">
            <div class="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(16,185,129,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(16,185,129,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-[-170px] min-[998px]:bottom-auto min-[998px]:translate-y-0 min-[998px]:w-[190px] min-[998px]:h-[190px] min-[1400px]:w-[205px] min-[1400px]:h-[205px] min-[1500px]:w-[225px] min-[1500px]:h-[225px] min-[1728px]:w-[250px] min-[1728px]:h-[250px] min-[2400px]:w-[285px] min-[2400px]:h-[285px] min-[1400px]:group-hover:scale-[1.35]"></div>
            <div class="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.84)] flex items-center justify-center shadow-[0_0_0_8px_rgba(16,185,129,0.06),0_10px_22px_rgba(16,185,129,0.12)] z-[2] min-[1400px]:w-[155px] min-[1400px]:h-[155px] min-[1500px]:w-[170px] min-[1500px]:h-[170px] min-[1728px]:w-[190px] min-[1728px]:h-[190px] min-[2400px]:w-[220px] min-[2400px]:h-[220px]">
                <div class="absolute border-2 border-[#209967eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] min-[1400px]:h-[126px] min-[1400px]:w-[126px] min-[1500px]:h-[140px] min-[1500px]:w-[140px] min-[1728px]:h-[156px] min-[1728px]:w-[156px] min-[2400px]:h-[180px] min-[2400px]:w-[180px] rounded-full transition-all w-[118px]"></div>
                <img src="${aiHelpImg}" alt="" class="max-w-[115px] max-h-[108px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(16,185,129,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(16,185,129,0.45)] min-[1400px]:max-w-[123px] min-[1400px]:max-h-[116px] min-[1500px]:max-w-[135px] min-[1500px]:max-h-[128px] min-[1728px]:max-w-[151px] min-[1728px]:max-h-[143px] min-[2400px]:max-w-[176px] min-[2400px]:max-h-[166px]">
            </div>
        </div>
        <div class="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">
            <div class="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#10b981] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(16,185,129,0.10)]"></div>
            <h3 class="m-0 mb-3 text-[#079669] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#087e5a]">
                ${aiHelpTitle}
            </h3>
            <p class="leading-[1.65] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
                ${aiHelpText}
            </p>
            <div class="!mx-auto bg-[#10b981] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]"></div>
        </div>
    </div>
</div>${
        showBottom
          ? `
<div class="group/message relative z-[2] mt-[14px] overflow-hidden rounded-[19px] border border-[#b9dfd8] bg-gradient-to-br from-[#f5fbff] via-[#f7fcfb] to-[#effbf4] px-[24px] py-[19px] backdrop-blur-[4px] transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-[4px] hover:border-[#78cfc0] hover:from-[#eef9ff] hover:via-[#f5fdf9] hover:to-[#e6faef] hover:shadow-[0_12px_28px_rgba(32,95,153,0.12)] opacity-0 animate-[fadeIn_.6s_ease_forwards] [animation-delay:.3s]">
    <div class="pointer-events-none absolute -right-[55px] -top-[55px] h-[130px] w-[130px] rounded-full bg-[#68e5ab]/10 blur-[28px] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:opacity-100 group-hover/message:scale-125"></div>
    <div class="pointer-events-none absolute -bottom-[60px] -left-[50px] h-[130px] w-[130px] rounded-full bg-[#38b5e4]/10 blur-[30px] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:opacity-100 group-hover/message:scale-125"></div>
    <div class="pointer-events-none absolute left-0 top-0 h-[50px] w-[5px] -translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#38b5e4] via-[#68e5ab] to-[#38b5e4] opacity-20 transition-all duration-700 group-hover/message:w-[130px] group-hover/message:opacity-70"></div>
    <div class="pointer-events-none absolute right-0 top-0 h-[50px] w-[5px] translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#38b5e4] via-[#68e5ab] to-[#38b5e4] opacity-20 transition-all duration-700 group-hover/message:w-[130px] group-hover/message:opacity-70"></div>
    <p class="relative z-[2] m-0 text-center text-[14px] font-medium leading-[1.7] text-[#40515d] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:text-[#263f46] min-[1400px]:text-[15px]">
        ${disclaimer}
    </p>
    <div class="pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[#68e5ab] to-transparent opacity-0 transition-all duration-700 group-hover/message:w-[45%] group-hover/message:opacity-80"></div>
</div>`
          : ''
      }`;
    }

    // Before vs With AI Slide
    const count = slide.pointCount || 5;
    const beforeTitle = slide.beforeTitle || 'Before AI';
    const withTitle = slide.withTitle || 'With AI';

    let beforeHtmlRows = '';
    for (let i = 0; i < count; i++) {
      const point = slide.beforePoints?.[i] || '';
      const iconUrl = BEFORE_ICONS[i % BEFORE_ICONS.length];
      const is5th = i === 4;

      beforeHtmlRows += `\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
\t\t\t\t\t\t\t\t<img src="${iconUrl}" ${is5th ? `onerror="this.src='https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai---4.webp'"` : ''} class="w-[42px] h-[42px] object-contain" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">${point}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>\n`;
    }

    let withHtmlRows = '';
    for (let i = 0; i < count; i++) {
      const cfg = WITH_AI_CONFIGS[i % WITH_AI_CONFIGS.length];
      const point = slide.withPoints?.[i] || '';
      const is5th = i === 4;
      const formattedText = formatFirstWordHtml(point, cfg.color);

      if (is5th) {
        withHtmlRows += `\t\t\t\t\t<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[#10b981]/30 hover:to-white/70 hover:-translate-y-2">
\t\t\t\t\t\t<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[#10b981]/20 rounded-[18px]"></div>
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#10b981] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_12px_rgba(16,185,129,0.40)]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out group-hover/pt:scale-[1.20] group-hover/pt:rotate-[15deg] group-hover/pt:rounded-[22px] group-hover/pt:bg-gradient-to-br group-hover/pt:from-[#10b981] group-hover/pt:via-[#34d399] group-hover/pt:to-white group-hover/pt:border-[#10b981] group-hover/pt:shadow-[0_0_20px_rgba(16,185,129,0.35)]">
\t\t\t\t\t\t\t\t<img src="${cfg.iconUrl}" onerror="this.src='https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/With-AI---4.webp'" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out group-hover/pt:scale-95 group-hover/pt:-rotate-[15deg]" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">${formattedText}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>\n`;
      } else {
        withHtmlRows += `\t\t\t\t\t<div class="group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 hover:via-[${cfg.color}]/30 hover:to-white/70 hover:-translate-y-2">
\t\t\t\t\t\t<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br from-white/50 via-transparent to-[${cfg.color}]/20 rounded-[18px]"></div>
\t\t\t\t\t\t<div class="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
\t\t\t\t\t\t\t<div class="shrink-0 w-2 h-[46px] rounded-[10px] bg-[${cfg.color}] transition-all duration-500 ease-out group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(48,182,229,0.35)]"></div>
\t\t\t\t\t\t\t<div class="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out ${cfg.iconBoxAnimation}">
\t\t\t\t\t\t\t\t<img src="${cfg.iconUrl}" class="w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out ${cfg.iconImgAnimation}" alt="">
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t<div class="flex-1 min-w-0">
\t\t\t\t\t\t\t\t<p class="m-0 text-[#333333] text-base leading-relaxed break-words">${formattedText}</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>\n`;
      }
    }

    return `<div class="w-full box-border my-[25px]">
\t<div class="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-7 w-full items-stretch">
\t\t<div class="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#777777] via-[#d0d0d0] to-[#777777] p-[2px] transition-all duration-700 ease-out hover:from-[#4d4d4d] hover:via-[#eaeaea] hover:to-[#7a7a7a] hover:shadow-[0_0_24px_rgba(130,130,130,0.28)]">
\t\t\t<div class="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f1f1f1] via-[#e7e7e7] to-[#d6d6d6] p-5 sm:p-7 lg:p-[30px] box-border">
\t\t\t\t<div class="absolute bg-gradient-to-r duration-700 ease-out from-[#777777] group-hover:h-[11px] group-hover:shadow-[0_0_14px_rgba(130,130,130,0.35)] h-[7px] left-0 to-[#c8c8c8] top-0 transition-all via-[#a7a7a7] w-full z-30"></div>
\t\t\t\t<div class="absolute -top-20 -right-20 w-[190px] h-[190px] rounded-full bg-white/40 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.5] group-hover:bg-white/60 group-hover:translate-x-2 group-hover:-translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/25 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/45 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="relative z-10 text-center mb-[26px] pt-1">
\t\t\t\t\t<h2 class="m-0 text-[#222222] text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">${beforeTitle}</h2>
\t\t\t\t\t<div class="w-[55px] h-1 bg-[#777777] rounded-full mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20 group-hover:bg-[#555555]"></div>
\t\t\t\t</div>
\t\t\t\t<div class="relative z-10 flex flex-col gap-[13px]">
${beforeHtmlRows}\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t\t<div class="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] p-[2px] transition-all duration-700 ease-out hover:from-[#30b6e5] hover:via-[#68e5ab] hover:to-[#087443] hover:shadow-[0_0_26px_rgba(48,182,229,0.28)]">
\t\t\t<div class="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#edf9f4] via-[#e4f6ee] to-[#d7eee4] p-5 sm:p-7 lg:p-[30px] box-border">
\t\t\t\t<div class="absolute bg-gradient-to-r duration-700 ease-out from-[#087443] group-hover:h-[11px] group-hover:shadow-[0_0_16px_rgba(48,182,229,0.35)] h-[7px] left-0 to-[#19aa9f] top-0 transition-all via-[#30b6e5] w-full z-30"></div>
\t\t\t\t<div class="-right-20 -top-20 absolute backdrop-blur-sm bg-white/35 duration-700 ease-out group-hover:-translate-y-2 group-hover:bg-white/68 group-hover:scale-[1.5] group-hover:translate-x-2 h-[190px] pointer-events-none rounded-full transition-all w-[190px]"></div>
\t\t\t\t<div class="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/35 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/35 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none"></div>
\t\t\t\t<div class="relative z-10 text-center mb-[26px] pt-1">
\t\t\t\t\t<h2 class="m-0 bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] bg-clip-text text-transparent text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">${withTitle}</h2>
\t\t\t\t\t<div class="w-[55px] h-1 rounded-full bg-gradient-to-r from-[#30b6e5] to-[#087443] mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20"></div>
\t\t\t\t</div>
\t\t\t\t<div class="relative z-10 flex flex-col gap-[13px]">
${withHtmlRows}\t\t\t\t</div>
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
    <div className="w-full max-w-full space-y-4 sm:space-y-5 px-2 sm:px-3 md:px-4 min-w-0 overflow-x-hidden transition-all duration-300">
      {/* ======================================================== */}
      {/* 1. TOP HEADER */}
      {/* ======================================================== */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
      <div className="p-3 sm:p-3.5 rounded-2xl border bg-muted/20 flex flex-col gap-2.5 min-w-0 transition-all duration-300 border-border/80">
        {/* Slide Tabs: scroll horizontally so they never push action buttons off */}
        <div className="flex items-center gap-2 overflow-x-auto min-w-0 w-full no-scrollbar pb-0.5">
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
                  <span className="truncate max-w-[90px] sm:max-w-[160px] lg:max-w-[220px]">
                    {slide.title}
                  </span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
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
                    className={`px-2 py-2 hover:opacity-100 opacity-60 transition-opacity cursor-pointer shrink-0 ${
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

        {/* Action Buttons Row: always visible, wraps on small screens */}
        <div className="flex items-center gap-2 min-w-0 w-full justify-between flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSlideLibrary(!showSlideLibrary)}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
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
            className="h-8 gap-1.5 px-3.5 text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer shrink-0"
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
              Click any slide to open in tabs, or delete it from the list.
            </span>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex items-center flex-wrap gap-2">
              {savedSlides.map((s) => {
                const isOpenInTabs = slides.some(
                  (active) => active.id === s.id
                );
                const isCreator =
                  user && s.created_by && s.created_by === user.id;
                const canEditSkeleton =
                  isCreator ||
                  isMasterAdmin ||
                  (!s.created_by && isMasterAdmin);
                const canDelete =
                  isCreator ||
                  isMasterAdmin ||
                  (!s.created_by && isMasterAdmin);

                return (
                  <div
                    key={s.id}
                    className={`group/item rounded-xl text-xs font-bold flex items-center border transition-all shadow-2xs overflow-hidden ${
                      isOpenInTabs
                        ? 'bg-card border-border hover:border-primary/50 text-foreground'
                        : 'bg-primary/5 border-dashed border-primary/40 text-primary hover:bg-primary/10 hover:border-primary'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleRestoreOrSelectSlide(s)}
                      className="px-3 py-1.5 flex items-center gap-2 cursor-pointer select-none text-left"
                      title={
                        isOpenInTabs
                          ? `Switch to "${s.title}"`
                          : `Re-open "${s.title}" in tabs`
                      }
                    >
                      <span className="truncate max-w-[130px] sm:max-w-[180px]">
                        {s.title}
                      </span>
                      {s.created_by_name && (
                        <span className="text-[8px] font-normal text-muted-foreground opacity-75 max-w-[70px] truncate hidden md:inline">
                          by {s.created_by_name}
                        </span>
                      )}
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                          isOpenInTabs
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {isOpenInTabs ? 'In Tabs' : '+ Re-open'}
                      </span>
                    </button>
                    {canEditSkeleton ? (
                      <button
                        type="button"
                        title={`Edit skeleton code for "${s.title}"`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditSkeleton(s);
                        }}
                        className="px-2 py-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer border-l border-border/40 shrink-0"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span
                        title={`Skeleton locked (Only ${s.created_by_name || 'creator'} or master admin can edit)`}
                        className="px-2 py-1.5 text-muted-foreground/30 border-l border-border/40 shrink-0 cursor-not-allowed"
                      >
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        title={`Delete "${s.title}" from list`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlideFromList(s);
                        }}
                        className="px-2 py-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border-l border-border/40 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 4. 1-BOX QUICK TEXT TO GENERATE (ONLY QUICK BOX SHOWN BY DEFAULT) */}
      {/* ======================================================== */}
      <Card className="border bg-primary/[0.02] shadow-xs transition-all duration-300 border-primary/30">
        <CardHeader className="py-3 px-4 sm:px-5 border-b border-primary/20 bg-primary/[0.04]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Wand2 className="w-4 h-4" />
              Quick Text to Generate ({currentSlide?.title || 'Slide'})
            </CardTitle>
            <Badge
              variant="outline"
              className="text-primary border-primary/40 text-[11px] truncate max-w-[180px] sm:max-w-[240px]"
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
          <div className="relative w-full min-w-0">
            <Textarea
              rows={3}
              placeholder={quickPlaceholder}
              value={singlePasteText}
              onChange={(e) => setSinglePasteText(e.target.value)}
              className="text-xs font-mono bg-background resize-y w-full min-w-0 pr-[140px] sm:pr-[160px]"
            />
            {/* Floating Generate Button — always visible, vertically centered */}
            <div className="absolute right-2 top-2 bottom-2 flex items-center">
              <Button
                onClick={handleSmartAutoPaste}
                className="flex flex-col items-center justify-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs w-[120px] sm:w-[140px] h-full min-h-[56px] shadow-lg cursor-pointer rounded-lg hover:opacity-95 transition-opacity"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="leading-tight text-center">
                  Generate Slide
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 5. CONTROLS BAR: META & CUSTOMIZE SWITCH */}
      {/* ======================================================== */}
      <div className="p-3 px-4 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-all duration-300 border-border/80">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-start w-full sm:w-auto">
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

        <div className="flex items-center gap-x-2 gap-y-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {/* If Before vs AI: 4 vs 5 points selector */}
          {currentSlide?.type === 'before-after' && (
            <div className="flex items-center gap-1.5 flex-wrap">
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

          {/* Direct Button: Edit Skeleton Code for Active Slide */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenEditSkeleton(currentSlide)}
            disabled={!canEditCurrentSkeleton}
            className={`h-7 gap-1.5 px-2.5 text-xs font-bold border-primary/40 text-primary shadow-2xs shrink-0 transition-opacity ${
              canEditCurrentSkeleton
                ? 'cursor-pointer hover:bg-primary/10'
                : 'opacity-50 cursor-not-allowed'
            }`}
            title={
              canEditCurrentSkeleton
                ? 'Edit HTML code skeleton of this slide'
                : `Skeleton locked (Only ${currentSlide.created_by_name || 'creator'} or master admin can edit)`
            }
          >
            {canEditCurrentSkeleton ? (
              <Code2 className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5 opacity-70" />
            )}
            <span>Edit Skeleton</span>
          </Button>

          {/* UNIQUE PILL TOGGLE FOR CUSTOMIZE — always visible, click to expand/collapse */}
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            title={
              showCustomize
                ? 'Hide customize panel'
                : 'Show customize panel to edit fields'
            }
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
              showCustomize
                ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30 scale-[1.02]'
                : 'bg-background border-primary/50 text-primary hover:border-primary hover:bg-primary/5 hover:shadow-sm'
            }`}
          >
            <SlidersHorizontal
              className={`w-3.5 h-3.5 transition-transform duration-300 ${showCustomize ? 'rotate-90' : ''}`}
            />
            <span>Customize</span>
            <span
              className={`ml-0.5 text-[9px] font-black font-mono px-1 py-0.5 rounded ${
                showCustomize
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {showCustomize ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Save Slide Button: Active when dirty, Disabled green 'Saved ✓' when clean */}
          {unsavedSlideIds.has(currentSlide.id) ? (
            <Button
              size="sm"
              onClick={handleSaveCurrentSlide}
              disabled={isSaving}
              className="h-7 gap-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer shrink-0 animate-in fade-in transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Slide'}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              disabled
              className="h-7 gap-1.5 px-3 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 opacity-90 cursor-default shrink-0 pointer-events-none font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </Button>
          )}
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
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        Right Column Title
                      </Label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveSlide({ withTitle: 'With AI' })
                          }
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            (currentSlide.withTitle || 'With AI') === 'With AI'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          With AI
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveSlide({ withTitle: 'After AI' })
                          }
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            currentSlide.withTitle === 'After AI'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          After AI
                        </button>
                      </div>
                    </div>
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
                    <button
                      type="button"
                      id="toggle-bottom-note"
                      onClick={() =>
                        updateActiveSlide({
                          showBottomNote: !currentSlide.showBottomNote,
                        })
                      }
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                        currentSlide.showBottomNote
                          ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <span>{currentSlide.showBottomNote ? 'ON' : 'OFF'}</span>
                    </button>
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

            {/* ======================================================== */}
            {/* UNIVERSAL: EDIT SLIDE CODE SKELETON (FOR ALL SLIDE TYPES) */}
            {/* ======================================================== */}
            <div className="p-4 rounded-xl border border-primary/30 bg-muted/20 space-y-3 pt-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-primary" />
                    Edit Slide Code Skeleton ({currentSlide.title})
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Inspect or modify the exact HTML skeleton of this slide.
                    Edits here update the Live Preview and Clean Code export in
                    real time.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {currentSlide.type === 'custom' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const raw = currentSlide.isCustomEdited
                          ? currentSlide.skeletonHtml || ''
                          : currentSlide.skeletonHtml ||
                            generateSlideHtml(currentSlide);
                        const reExtracted = extractFieldsFromSkeleton(raw);
                        updateActiveSlide({
                          skeletonHtml: raw,
                          fields: reExtracted,
                          isCustomEdited: false,
                        });
                        showToast(
                          `Re-detected ${reExtracted.length} fields from skeleton!`,
                          'success'
                        );
                      }}
                      className="h-7 text-xs px-2.5 gap-1 cursor-pointer"
                      title="Re-detect editable fields from this skeleton"
                    >
                      <RotateCcw className="w-3 h-3" /> Re-detect Fields
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      let resetSkel = '';
                      if (currentSlide.type === 'challenge') {
                        resetSkel = DEFAULT_CHALLENGE_SKELETON;
                      } else if (currentSlide.type === 'before-after') {
                        resetSkel = DEFAULT_BEFORE_AFTER_SKELETON;
                      } else {
                        resetSkel = currentSlide.skeletonHtml || '';
                      }
                      updateActiveSlide({
                        skeletonHtml: resetSkel,
                        isCustomEdited: false,
                      });
                      showToast(
                        `Reset skeleton to default for "${currentSlide.title}"!`,
                        'info'
                      );
                    }}
                    className="h-7 text-xs px-2.5 gap-1 cursor-pointer"
                    title="Reset to default skeleton template"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Skeleton
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const curVal = currentSlide.isCustomEdited
                        ? currentSlide.skeletonHtml || ''
                        : generateSlideHtml(currentSlide);
                      const cleaned = stripHtmlComments(curVal);
                      updateActiveSlide({
                        skeletonHtml: cleaned,
                        isCustomEdited: true,
                      });
                      showToast('Comments stripped from skeleton!', 'success');
                    }}
                    className="h-7 text-xs px-2.5 cursor-pointer"
                    title="Remove any HTML comments"
                  >
                    Strip Comments
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!currentSlide.isCustomEdited) {
                        updateActiveSlide({
                          skeletonHtml: generateSlideHtml(currentSlide),
                          isCustomEdited: true,
                        });
                      }
                      showToast(
                        'Slide skeleton saved successfully!',
                        'success'
                      );
                    }}
                    className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer shadow-2xs"
                  >
                    <Save className="w-3 h-3" /> Save Skeleton
                  </Button>
                </div>
              </div>
              <Textarea
                rows={10}
                value={
                  currentSlide.isCustomEdited
                    ? currentSlide.skeletonHtml || ''
                    : generateSlideHtml(currentSlide)
                }
                onChange={(e) =>
                  updateActiveSlide({
                    skeletonHtml: e.target.value,
                    isCustomEdited: true,
                  })
                }
                className="font-mono text-xs bg-background leading-relaxed resize-y border-border"
                placeholder="HTML code skeleton for this slide..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 7. UNIFIED OUTPUT SECTION: LIVE PREVIEW & CLEAN CODE */}
      {/* ======================================================== */}
      <Card className="border shadow-md overflow-hidden transition-all duration-300 border-border/80">
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

        <CardContent className="p-0 w-full max-w-full min-w-0 overflow-hidden">
          {viewMode === 'preview' ? (
            <div className="p-2 sm:p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto w-full max-w-full min-w-0">
              <div
                className="w-full min-w-0 max-w-full overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: generatedCode }}
              />
            </div>
          ) : (
            <div className="relative w-full max-w-full overflow-hidden min-w-0">
              <pre
                className="p-3 sm:p-5 text-xs font-mono leading-relaxed bg-[#1e2430] text-[#e2e8f0] overflow-x-auto max-h-[550px] select-all rounded-b-xl w-full max-w-full min-w-0 block whitespace-pre-wrap break-words break-all"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                <code
                  className="block w-full whitespace-pre-wrap break-words break-all"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {generatedCode}
                </code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 9. ADD SLIDE MODAL (ASKS FOR CODE SKELETON & BUILDS FIELDS) */}
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

      {/* ======================================================== */}
      {/* 9. EDIT ANY SLIDE SKELETON CODE MODAL */}
      {/* ======================================================== */}
      <Dialog
        open={Boolean(editingSkeletonSlide)}
        onOpenChange={(open) => {
          if (!open) setEditingSkeletonSlide(null);
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Code2 className="w-5 h-5" />
              </span>
              <DialogTitle className="text-lg font-black text-foreground">
                Edit Skeleton Code &bull; {editingSkeletonSlide?.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Inspect or modify the raw HTML skeleton code for this slide. Your
              edits will be saved directly and displayed in both Live Preview
              and Clean Code export.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Slide Type:{' '}
                <strong className="text-foreground uppercase font-mono">
                  {editingSkeletonSlide?.type === 'challenge'
                    ? 'Challenge & AI Help'
                    : editingSkeletonSlide?.type === 'custom'
                      ? 'Custom Slide'
                      : 'Before vs With AI'}
                </strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    let defaultSkel = '';
                    if (editingSkeletonSlide.type === 'challenge') {
                      defaultSkel = DEFAULT_CHALLENGE_SKELETON;
                    } else if (editingSkeletonSlide.type === 'before-after') {
                      defaultSkel = DEFAULT_BEFORE_AFTER_SKELETON;
                    } else {
                      defaultSkel = editingSkeletonSlide.skeletonHtml || '';
                    }
                    setTempSkeletonCode(defaultSkel);
                    showToast('Reset code to default template!', 'info');
                  }}
                  className="h-7 text-xs px-2.5 gap-1 cursor-pointer"
                  title="Reset to default skeleton template"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Template
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTempSkeletonCode(stripHtmlComments(tempSkeletonCode));
                    showToast('Stripped comments from code!', 'info');
                  }}
                  className="h-7 text-xs px-2.5 cursor-pointer"
                  title="Remove any HTML comments"
                >
                  Strip Comments
                </Button>
              </div>
            </div>

            <Textarea
              rows={14}
              value={tempSkeletonCode}
              onChange={(e) => setTempSkeletonCode(e.target.value)}
              className="font-mono text-xs bg-slate-950 text-slate-100 p-3 leading-relaxed resize-y border-border"
              placeholder="Paste or edit HTML skeleton code here..."
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50 flex-col sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSkeletonSlide(null)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSkeletonModal}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save &amp; Apply Skeleton</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SlideGenerator;
