'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Wand2,
  Code2,
  Eye,
  Copy,
  Check,
  Save,
  Globe,
  Trash2,
  History,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Zap,
  ShieldCheck,
  Lock,
  Send,
  Download,
  FileCode,
  Layers,
  LayoutGrid,
  Columns,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Search,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  MoreVertical,
  SlidersHorizontal,
  Layers2,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth-provider';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import {
  detectStyleAttributes,
  convertInlineStylesToTailwind,
  applyHoverAnimationsAndCornerGlow,
  applyCustomPromptToHtml,
  enhanceHtmlWithFreeAi,
  injectQuickTextIntoDesign,
  DESIGN_CATALOG,
  isExistingCardDesign,
  autoSelectBestDesign,
  injectContentIntoDesignSlots,
  extractAndConvertIconsFromHtml,
  extractAndConvertAssetsFromHtml,
  syncIconsToMediaHub,
  syncAssetsToMediaHub,
} from '@/lib/html-design-enhancer-engine';
import { ensurePuterLoaded } from '@/lib/se7en-ai';

/**
 * Isolated Live Preview Frame with True Responsive Viewport Emulation
 * Guarantees mobile/tablet media queries (e.g. grid-cols-1 md:grid-cols-2)
 * evaluate accurately against the simulated screen width rather than the desktop browser window.
 */
function HtmlLivePreview({
  html,
  viewport = 'desktop',
  isDark = false,
  emptyMessage = 'No HTML content provided.',
  className = '',
}) {
  const iframeRef = React.useRef(null);

  const srcDoc = useMemo(() => {
    const raw = (html || '').trim();
    const content =
      raw ||
      `<div style="padding: 32px; text-align: center; font-size: 13px; color: ${
        isDark ? '#94a3b8' : '#64748b'
      }; font-style: italic;">${emptyMessage}</div>`;

    return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: '${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}',
            background: '${isDark ? '#090d16' : '#ffffff'}',
            foreground: '${isDark ? '#f8fafc' : '#0f172a'}',
            card: '${isDark ? '#0f172a' : '#ffffff'}',
            'card-foreground': '${isDark ? '#f8fafc' : '#0f172a'}',
            muted: '${isDark ? '#1e293b' : '#f1f5f9'}',
            'muted-foreground': '${isDark ? '#94a3b8' : '#64748b'}',
            primary: {
              DEFAULT: '#2563eb',
              foreground: '#ffffff',
            }
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0', transform: 'translateY(8px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
            },
          },
          animation: {
            fadeIn: 'fadeIn .6s ease forwards',
          },
        }
      }
    };
  </script>
  <style>
    * { box-sizing: border-box; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      background: transparent;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body {
      padding: 12px;
      color: ${isDark ? '#f8fafc' : '#0f172a'};
      overflow-x: hidden;
    }
    img {
      max-width: 100%;
      height: auto;
      object-fit: contain;
    }
    /* Smooth Scrollbar */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.7); }
  </style>
</head>
<body class="${isDark ? 'dark text-slate-100' : 'text-slate-900'}">
  <div class="w-full flex justify-center">
    ${content}
  </div>
</body>
</html>`;
  }, [html, isDark, emptyMessage]);

  const viewportWidthStyle =
    viewport === 'mobile'
      ? 'w-[375px] max-w-full'
      : viewport === 'tablet'
        ? 'w-[768px] max-w-full'
        : 'w-full';

  return (
    <div
      className={`w-full h-full flex items-start justify-center overflow-auto p-2 sm:p-3 transition-all duration-300 ${className}`}
    >
      <div
        className={`transition-all duration-300 shadow-sm rounded-2xl overflow-hidden border border-border/80 bg-background ${viewportWidthStyle} h-full min-h-[480px] flex flex-col`}
      >
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title="HTML Live Responsive Preview"
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full min-h-[480px] flex-1 border-0 bg-transparent block"
        />
      </div>
    </div>
  );
}

/**
 * Isolated Responsive Frame for Catalog and Gallery Previews
 * Features:
 * - Isolated sandboxed iframe with Tailwind CSS CDN
 * - Viewport Switcher (Desktop 100%, Tablet 768px, Mobile 375px)
 * - Shimmer skeleton state until iframe completes initial load
 * - True media-query execution against container width
 */
function CatalogDesignPreviewFrame({
  html,
  isDark = false,
  title = '',
  height = '380px',
  allowViewportSwitch = true,
  defaultViewport = 'desktop',
}) {
  const [viewport, setViewport] = useState(defaultViewport);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = React.useRef(null);

  useEffect(() => {
    setIsLoading(true);
  }, [html, isDark, viewport]);

  const srcDoc = useMemo(() => {
    const raw = (html || '').trim();
    const content =
      raw ||
      `<div style="padding: 32px; text-align: center; font-size: 13px; color: ${
        isDark ? '#94a3b8' : '#64748b'
      }; font-style: italic;">Preview not available.</div>`;

    return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: '${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}',
            background: '${isDark ? '#090d16' : '#ffffff'}',
            foreground: '${isDark ? '#f8fafc' : '#0f172a'}',
            card: '${isDark ? '#0f172a' : '#ffffff'}',
            'card-foreground': '${isDark ? '#f8fafc' : '#0f172a'}',
            muted: '${isDark ? '#1e293b' : '#f1f5f9'}',
            'muted-foreground': '${isDark ? '#94a3b8' : '#64748b'}',
            primary: {
              DEFAULT: '#2563eb',
              foreground: '#ffffff',
            }
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0', transform: 'translateY(8px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
            },
          },
          animation: {
            fadeIn: 'fadeIn .6s ease forwards',
          },
        }
      }
    };
  </script>
  <style>
    * { box-sizing: border-box; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      background: transparent;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    body {
      padding: 14px;
      color: ${isDark ? '#f8fafc' : '#0f172a'};
      overflow-x: hidden;
    }
    img {
      max-width: 100%;
      height: auto;
      object-fit: contain;
    }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 9999px; }
  </style>
</head>
<body class="${isDark ? 'dark text-slate-100' : 'text-slate-900'}">
  <div class="w-full flex justify-center">
    ${content}
  </div>
</body>
</html>`;
  }, [html, isDark]);

  const viewportWidthClass =
    viewport === 'mobile'
      ? 'w-[375px] max-w-full'
      : viewport === 'tablet'
        ? 'w-[768px] max-w-full'
        : 'w-full';

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-slate-100/90 dark:bg-slate-900/90 overflow-hidden shadow-inner flex flex-col">
      {/* Top Device Switcher Bar */}
      {allowViewportSwitch && (
        <div className="px-3 py-1.5 bg-muted/40 border-b border-border/50 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Responsive Frame
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/70">
              (
              {viewport === 'mobile'
                ? '375px'
                : viewport === 'tablet'
                  ? '768px'
                  : '100%'}
              )
            </span>
          </div>

          <div className="flex items-center gap-1 bg-background border rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`p-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                viewport === 'desktop'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Desktop View (Full Width)"
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`p-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                viewport === 'tablet'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`p-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                viewport === 'mobile'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Frame Container with Skeleton Shimmer */}
      <div
        className="w-full flex items-center justify-center p-2 sm:p-3 overflow-x-auto relative"
        style={{ minHeight: height, height }}
      >
        {/* Pulsing Skeleton Loader until iframe loads */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col p-6 bg-card/70 backdrop-blur-xs space-y-3 animate-pulse justify-center items-center">
            <div className="w-3/4 h-5 bg-muted rounded-xl"></div>
            <div className="w-1/2 h-3.5 bg-muted/80 rounded-lg"></div>
            <div className="w-full max-w-sm grid grid-cols-2 gap-3 mt-3">
              <div className="h-20 bg-muted/70 rounded-xl"></div>
              <div className="h-20 bg-muted/70 rounded-xl"></div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mt-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Rendering Responsive Design Frame...</span>
            </div>
          </div>
        )}

        {/* The Viewport-Constrained Container */}
        <div
          className={`transition-all duration-300 rounded-xl overflow-hidden border border-border/60 bg-background ${viewportWidthClass} h-full shadow-xs flex flex-col`}
        >
          <iframe
            ref={iframeRef}
            srcDoc={srcDoc}
            title={title || 'Catalog Design Preview'}
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setIsLoading(false)}
            className="w-full h-full border-0 bg-transparent block flex-1"
          />
        </div>
      </div>
    </div>
  );
}

// Sample presentation card with raw inline styles to demonstrate 100% conversion
const SAMPLE_SLIDE_HTML = `<div style="display: flex; flex-wrap: wrap; gap: 24px; width: 100%; justify-content: center; padding: 24px; background-color: #f8fafc; border-radius: 20px;">
  <!-- Card 1 -->
  <div style="flex: 1 1 450px; min-width: 320px; background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%); border: 1px solid rgba(37,99,235,0.18); border-left: 6px solid #2563eb; border-radius: 20px; box-shadow: 0 10px 25px rgba(37,99,235,0.08); padding: 24px;">
    <div style="font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Phase 01: Traditional Analysis</div>
    <h3 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Manual Inspection Workflow</h3>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
      Teams manually inspect data tables and document checklists, leading to substantial verification overhead.
    </p>
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <span style="background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">High Latency</span>
      <span style="background-color: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">Manual Review</span>
    </div>
  </div>

  <!-- Card 2 -->
  <div style="flex: 1 1 450px; min-width: 320px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border: 1px solid rgba(22,163,74,0.18); border-left: 6px solid #16a34a; border-radius: 20px; box-shadow: 0 10px 25px rgba(22,163,74,0.08); padding: 24px;">
    <div style="font-size: 14px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Phase 02: AI-Powered Execution</div>
    <h3 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Autonomous Verification</h3>
    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
      Generative intelligence parses documents instantly, flags variances in milliseconds, and suggests remediation.
    </p>
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <span style="background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">Real-Time</span>
      <span style="background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px;">Zero Overhead</span>
    </div>
  </div>
</div>`;

// Fallback published community designs if database is initial
const SEED_PUBLISHED_DESIGNS = [
  ...DESIGN_CATALOG.slice(0, 8).map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    enhanced_html: d.enhanced_html,
    published_by: 'Super Admin',
    created_at: new Date().toISOString(),
    is_saved: true,
    is_published: true,
  })),
  {
    id: 'seed-design-1',
    title: 'Dual 3D Comparative Cards (Ocean Blue)',
    description:
      'Clean Before vs AI comparison cards with 3D elevation and floating corner circles.',
    enhanced_html: `<div class="flex flex-wrap gap-[22px] w-full box-border justify-center p-[20px]">
  <div class="faded-corner-circle pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl bg-[#205f99]/15 group-hover:bg-[#205f99]/25 transition-all duration-1000 ease-out group-hover:scale-125 group-hover:-translate-y-2 group-hover:translate-x-2"></div>
  <div class="faded-corner-circle pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-sky-400/15 group-hover:bg-sky-400/25 transition-all duration-1000 ease-out group-hover:scale-125 group-hover:translate-y-2 group-hover:-translate-x-2"></div>
  <div class="group relative flex-[1_1_480px] min-w-[320px] rounded-[22px] bg-gradient-to-br from-white to-[#eff6ff] border border-[rgba(32,95,153,0.16)] border-t-[6px] border-t-[#205f99] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#205f99] shadow-[0_10px_28px_rgba(1,51,93,0.10)] overflow-hidden p-[24px] transition-all duration-700 hover:shadow-[0_15px_36px_rgba(1,51,93,0.14)] hover:-translate-y-1">
    <div class="text-[13px] font-bold uppercase tracking-wider text-[#205f99] mb-2">Before AI Approach</div>
    <h3 class="text-[20px] font-black text-slate-900 mb-2">Manual Task Orchestration</h3>
    <p class="text-[14px] text-slate-600 leading-relaxed mb-4">Operations required full manual coordination, resulting in hours spent on formatting and reconciliation.</p>
    <div class="flex gap-2">
      <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Slow Execution</span>
    </div>
  </div>
  <div class="group relative flex-[1_1_480px] min-w-[320px] rounded-[22px] bg-gradient-to-br from-white to-[#f0fdf4] border border-[rgba(22,163,74,0.16)] border-t-[6px] border-t-[#16a34a] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#16a34a] shadow-[0_10px_28px_rgba(22,163,74,0.10)] overflow-hidden p-[24px] transition-all duration-700 hover:shadow-[0_15px_36px_rgba(22,163,74,0.14)] hover:-translate-y-1">
    <div class="text-[13px] font-bold uppercase tracking-wider text-[#16a34a] mb-2">With AI Copilot</div>
    <h3 class="text-[20px] font-black text-slate-900 mb-2">Autonomous Synthesis</h3>
    <p class="text-[14px] text-slate-600 leading-relaxed mb-4">Tasks are synthesized in real-time, instantly converting raw content into presentation-ready visuals.</p>
    <div class="flex gap-2">
      <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">10x Speedup</span>
    </div>
  </div>
</div>`,
    published_by: 'Super Admin',
    created_at: new Date().toISOString(),
    is_saved: true,
    is_published: true,
  },
  {
    id: 'seed-design-2',
    title: 'Executive Cyber Grid (Purple Neon)',
    description:
      'Dark-mode glassmorphic 3-column feature cards with purple glow transitions.',
    enhanced_html: `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-6 bg-slate-950 rounded-3xl">
  <div class="group relative rounded-2xl bg-slate-900/80 border border-purple-500/20 p-6 overflow-hidden transition-all duration-700 hover:border-purple-500/60 hover:-translate-y-1 hover:shadow-2xl">
    <div class="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-purple-600/20 group-hover:scale-125 transition-all duration-1000"></div>
    <h4 class="text-lg font-bold text-white mb-2">1. Real-Time Detection</h4>
    <p class="text-xs text-slate-400 leading-relaxed">Instant parsing of document trees and multi-format text structures.</p>
  </div>
  <div class="group relative rounded-2xl bg-slate-900/80 border border-purple-500/20 p-6 overflow-hidden transition-all duration-700 hover:border-purple-500/60 hover:-translate-y-1 hover:shadow-2xl">
    <div class="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-purple-600/20 group-hover:scale-125 transition-all duration-1000"></div>
    <h4 class="text-lg font-bold text-white mb-2">2. Zero Style Tags</h4>
    <p class="text-xs text-slate-400 leading-relaxed">Guaranteed 100% pure Tailwind utilities with no raw CSS bloat.</p>
  </div>
  <div class="group relative rounded-2xl bg-slate-900/80 border border-purple-500/20 p-6 overflow-hidden transition-all duration-700 hover:border-purple-500/60 hover:-translate-y-1 hover:shadow-2xl">
    <div class="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl bg-purple-600/20 group-hover:scale-125 transition-all duration-1000"></div>
    <h4 class="text-lg font-bold text-white mb-2">3. Dynamic Transitions</h4>
    <p class="text-xs text-slate-400 leading-relaxed">Fluid corner ambient blur effects that animate on user interaction.</p>
  </div>
</div>`,
    published_by: 'Super Admin',
    created_at: new Date().toISOString(),
    is_saved: true,
    is_published: true,
  },
];

function generateUniqueId(prefix = 'hist') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function HtmlDesignEnhancer({
  initialHtml = '',
  onApplyToSlide = null,
  embeddedMode = false,
}) {
  const { user } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || theme === 'dark';
  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    (user?.email || '').toLowerCase() === 'bilalghaffar46@gmail.com';

  // Navigation tab
  const [activeTab, setActiveTab] = useState('studio');

  // Input & Output state
  const [inputHtml, setInputHtml] = useState(initialHtml || SAMPLE_SLIDE_HTML);
  const [enhancedHtml, setEnhancedHtml] = useState('');
  const [designTitle, setDesignTitle] = useState('My Enhanced Design');
  const [isSourcePanelOpen, setIsSourcePanelOpen] = useState(true); // Open/Close toggle for Source HTML input

  // Enhancement options
  const [animateOnHover, setAnimateOnHover] = useState(true);
  const [themeColor, setThemeColor] = useState('ocean');
  const [previewViewport, setPreviewViewport] = useState('desktop');
  const [previewTab, setPreviewTab] = useState('split'); // 'split' | 'after' | 'before' | 'code'

  // Custom Prompt state
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customPromptTarget, setCustomPromptTarget] = useState('last'); // 'last' (incremental on last made design) | 'source' (re-synthesize from source HTML)

  // 80% Sidebar / Drawer State for Design Selection
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogGridCols, setCatalogGridCols] = useState(2); // 1 = 1 design in 1 row, 2 = 2 designs in 1 row
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [drawerSlotSelections, setDrawerSlotSelections] = useState({});

  // Processing & Toast state
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAiAction, setActiveAiAction] = useState(null); // 'auto' | 'enhance' | 'custom' | null
  const [processingStatus, setProcessingStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Published Templates & User History state
  const [publishedDesigns, setPublishedDesigns] = useState(
    SEED_PUBLISHED_DESIGNS
  );
  const [userHistory, setUserHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'saved' | 'unsaved'

  // Quick Text Generation Modal state
  const [selectedTemplateForQuickText, setSelectedTemplateForQuickText] =
    useState(null);
  const [quickTextInput, setQuickTextInput] = useState('');
  const [isQuickTextGenerating, setIsQuickTextGenerating] = useState(false);

  // Publishing confirmation dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [designToPublish, setDesignToPublish] = useState(null);

  // Detected Icons & Media Bucket Asset Manager
  const [detectedIcons, setDetectedIcons] = useState([]);
  const [isIconsModalOpen, setIsIconsModalOpen] = useState(false);
  const [iconFormat, setIconFormat] = useState('webp'); // 'webp' | 'png' | 'svg'
  const [assetFilterTab, setAssetFilterTab] = useState('all'); // 'all' | 'icons' | 'images'

  const showToast = useCallback((msg, type = 'info') => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 3800);
  }, []);

  // Filtered Assets based on Active Tab
  const filteredAssets = useMemo(() => {
    if (assetFilterTab === 'icons') {
      return detectedIcons.filter((a) => a.type === 'icon');
    }
    if (assetFilterTab === 'images') {
      return detectedIcons.filter((a) => a.type === 'image');
    }
    return detectedIcons;
  }, [detectedIcons, assetFilterTab]);

  const vectorIconsCount = useMemo(
    () => detectedIcons.filter((a) => a.type === 'icon').length,
    [detectedIcons]
  );
  const imagesCount = useMemo(
    () => detectedIcons.filter((a) => a.type === 'image').length,
    [detectedIcons]
  );

  // Auto-extract and sync icons and card images whenever enhanced HTML changes
  useEffect(() => {
    const targetHtml = enhancedHtml || inputHtml;
    if (!targetHtml) {
      setDetectedIcons([]);
      return;
    }
    let isCancelled = false;
    extractAndConvertAssetsFromHtml(targetHtml, iconFormat).then((assets) => {
      if (!isCancelled && assets) {
        setDetectedIcons(assets);
        if (assets.length > 0) {
          syncAssetsToMediaHub(assets);
        }
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [enhancedHtml, inputHtml, iconFormat]);

  // 1-Click Instant Batch Download for all detected icons & images
  const handleDownloadAllIcons = async (chosenFormat = 'webp') => {
    const targetAssets =
      filteredAssets.length > 0 ? filteredAssets : detectedIcons;
    if (targetAssets.length === 0) {
      showToast(
        'No assets detected in the current design to download.',
        'info'
      );
      return;
    }

    try {
      showToast(
        `Preparing 1-click batch download (${chosenFormat.toUpperCase()})...`,
        'info'
      );
      const targetHtml = enhancedHtml || inputHtml;
      const assetsToDownload =
        chosenFormat === iconFormat
          ? targetAssets
          : await extractAndConvertAssetsFromHtml(targetHtml, chosenFormat);

      for (let i = 0; i < assetsToDownload.length; i++) {
        const asset = assetsToDownload[i];
        const a = document.createElement('a');
        const baseName = (asset.name || `asset-${i + 1}`).replace(
          /\.[^/.]+$/,
          ''
        );
        if (chosenFormat === 'svg' && asset.type === 'icon' && asset.svgCode) {
          a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svgCode)}`;
          a.download = `${baseName}.svg`;
        } else {
          a.href = asset.dataUrl || asset.originalSrc;
          a.download = `${baseName}.${chosenFormat}`;
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise((r) => setTimeout(r, 140));
      }

      showToast(
        `Downloaded ${assetsToDownload.length} asset(s) as ${chosenFormat.toUpperCase()}! Auto-saved in Media Bucket 📦`,
        'success'
      );
    } catch (err) {
      console.warn('Error downloading assets:', err);
      showToast('Could not download all assets simultaneously.', 'error');
    }
  };

  // Download a single asset in chosen format
  const handleDownloadSingleAsset = async (asset, format = 'webp') => {
    try {
      if (format === 'svg' && asset.type === 'icon' && asset.svgCode) {
        const blob = new Blob([asset.svgCode], {
          type: 'image/svg+xml;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const baseName = (asset.name || 'vector-icon').replace(/\.[^/.]+$/, '');
        a.download = `${baseName}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${baseName}.svg!`, 'success');
        return;
      }

      const baseName = (asset.name || 'asset').replace(/\.[^/.]+$/, '');
      const downloadFilename = `${baseName}.${format}`;
      let downloadUrl = asset.dataUrl || asset.originalSrc;

      // If requested format differs or asset is an SVG icon, re-render through canvas
      if (asset.type === 'icon' && asset.svgCode && format !== asset.format) {
        const converted = await extractAndConvertAssetsFromHtml(
          `<svg>${asset.svgCode}</svg>`,
          format
        );
        if (converted?.[0]?.dataUrl) {
          downloadUrl = converted[0].dataUrl;
        }
      }

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Downloaded ${downloadFilename}!`, 'success');
    } catch (err) {
      console.warn('Error downloading asset:', err);
      showToast('Could not download asset.', 'error');
    }
  };

  // Copy Data URL or URL for quick bucket upload
  const handleCopyAssetUrl = (asset) => {
    const toCopy = asset.dataUrl || asset.originalSrc || asset.svgCode || '';
    if (!toCopy) {
      showToast('No URL available to copy.', 'error');
      return;
    }
    navigator.clipboard.writeText(toCopy);
    showToast(
      `Copied ${asset.name} Data URL to clipboard! Ready to upload to your bucket 📦`,
      'success'
    );
  };

  // Analysis metrics for current input
  const styleAnalysis = useMemo(() => {
    return detectStyleAttributes(inputHtml);
  }, [inputHtml]);

  // Load user history & published designs from Supabase on mount
  const loadDatabaseData = useCallback(async () => {
    try {
      // 1. Load published templates
      const { data: pubData, error: pubErr } = await supabase
        .from('html_designs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!pubErr && pubData && pubData.length > 0) {
        setPublishedDesigns(pubData);
      }

      // 2. Load user history (if logged in)
      if (user) {
        const { data: histData, error: histErr } = await supabase
          .from('html_designs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!histErr && histData) {
          const now = Date.now();
          const oneDayMs = 24 * 60 * 60 * 1000;
          const validHistory = histData.filter((item) => {
            if (item.is_saved) return true;
            const age = now - new Date(item.created_at).getTime();
            return age < oneDayMs;
          });
          setUserHistory(validHistory);
        }
      } else {
        const local = localStorage.getItem('html_enhancer_local_history');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const valid = parsed.filter((item) => {
              if (item.is_saved) return true;
              return now - new Date(item.created_at).getTime() < oneDayMs;
            });
            setUserHistory(valid);
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn('Could not load designs from cloud:', e);
    }
  }, [user]);

  useEffect(() => {
    loadDatabaseData();
    ensurePuterLoaded();
  }, [loadDatabaseData]);

  // Auto-run deterministic enhancement when component first receives initialHtml
  useEffect(() => {
    if (initialHtml) {
      setInputHtml(initialHtml);
      const converted = convertInlineStylesToTailwind(initialHtml);
      const withAnim = applyHoverAnimationsAndCornerGlow(converted, {
        animateOnHover,
        themeColor,
      });
      setEnhancedHtml(withAnim);
    } else {
      const converted = convertInlineStylesToTailwind(SAMPLE_SLIDE_HTML);
      const withAnim = applyHoverAnimationsAndCornerGlow(converted, {
        animateOnHover,
        themeColor,
      });
      setEnhancedHtml(withAnim);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml]);

  // 1. Instant Deterministic Tailwind Transform
  const handleInstantTransform = () => {
    if (!inputHtml.trim()) {
      showToast('Please provide HTML input first.', 'error');
      return;
    }

    const converted = convertInlineStylesToTailwind(inputHtml);
    const finalized = applyHoverAnimationsAndCornerGlow(converted, {
      animateOnHover,
      themeColor,
    });

    setEnhancedHtml(finalized);
    recordGenerationToHistory(finalized, false);

    showToast(
      `Instant Transform Complete! Cleaned ${styleAnalysis.count} style attributes. 100% Verbatim content preserved.`,
      'success'
    );
  };

  // 2. Free AI Master Enhancement via Puter.js with Custom Prompt & Verbatim Guarantee
  const handleFreeAiEnhance = async (
    overridePrompt = '',
    forceSource = false
  ) => {
    const hasEnhanced = Boolean(enhancedHtml && enhancedHtml.trim());
    const promptToUse = overridePrompt !== '' ? overridePrompt : customPrompt;
    const isIncremental =
      !forceSource &&
      hasEnhanced &&
      customPromptTarget === 'last' &&
      Boolean(promptToUse && promptToUse.trim());
    const baseHtml = isIncremental ? enhancedHtml : inputHtml;

    if (!baseHtml.trim()) {
      showToast('Please provide HTML input first.', 'error');
      return;
    }

    setIsProcessing(true);
    setActiveAiAction(promptToUse ? 'custom' : 'enhance');
    setProcessingStatus(
      isIncremental
        ? 'Applying surgical adjustment to last made design while strictly preserving cards & text...'
        : 'Se7eN AI Bot is synthesizing layout, slow animations & Tailwind styling...'
    );

    try {
      const result = await enhanceHtmlWithFreeAi(baseHtml, {
        animateOnHover,
        themeColor,
        requestedModel: 'gpt-4o-mini',
        customPrompt: promptToUse,
        isIncremental,
      });

      if (result) {
        setEnhancedHtml(result);
        recordGenerationToHistory(result, false);
        showToast(
          isIncremental
            ? 'Updated last made design! 100% of cards and text preserved.'
            : promptToUse
              ? 'Enhanced with custom AI prompt! 100% of your content preserved verbatim.'
              : 'Enhanced with Free AI Master & Tailwind CSS successfully!',
          'success'
        );
      } else {
        throw new Error('Empty response from AI engine');
      }
    } catch (err) {
      console.warn(
        'AI Enhance error, falling back to prompt-aware engine:',
        err
      );
      const fallback = applyCustomPromptToHtml(baseHtml, promptToUse, {
        animateOnHover,
        themeColor,
        isIncremental,
      });
      setEnhancedHtml(fallback);
      recordGenerationToHistory(fallback, false);
      showToast(
        isIncremental
          ? 'Design updated incrementally!'
          : promptToUse
            ? 'Layout enhanced with custom prompt!'
            : 'Completed with Instant Tailwind Engine',
        'info'
      );
    } finally {
      setIsProcessing(false);
      setActiveAiAction(null);
      setProcessingStatus('');
    }
  };

  // 3. Auto Design Mode (Smart Content-Aware Matching)
  const handleAutoDesign = async () => {
    if (!inputHtml.trim()) {
      showToast(
        'Please provide your content or HTML in the Source Input first.',
        'error'
      );
      return;
    }

    setIsProcessing(true);
    setActiveAiAction('auto');
    setProcessingStatus(
      'Analyzing content architecture & selecting optimal card design...'
    );

    // Small micro-delay for smooth AI feel
    await new Promise((r) => setTimeout(r, 450));

    try {
      const { template, reason } = autoSelectBestDesign(inputHtml);
      const populated = injectContentIntoDesignSlots(
        template.enhanced_html,
        inputHtml,
        'all'
      );

      setEnhancedHtml(populated);
      setInputHtml(populated);
      setDesignTitle(`Auto: ${template.title}`);
      recordGenerationToHistory(populated, false);

      showToast(
        `Auto-Design Matched: ${template.title}! (${reason})`,
        'success'
      );
    } catch (err) {
      console.warn('Auto Design error:', err);
      showToast(
        'Auto-Design encountered an issue. Using standard layout.',
        'error'
      );
    } finally {
      setIsProcessing(false);
      setActiveAiAction(null);
      setProcessingStatus('');
    }
  };

  // 4. Apply selected template from catalog to input/enhanced with specific slot targeting
  const handleApplyTemplateWithSlot = (template, targetSlot = 'all') => {
    const rawContent = inputHtml.trim();
    const hasUserContent =
      rawContent &&
      rawContent !== SAMPLE_SLIDE_HTML &&
      !isExistingCardDesign(rawContent);

    const populated = hasUserContent
      ? injectContentIntoDesignSlots(
          template.enhanced_html,
          rawContent,
          targetSlot
        )
      : template.enhanced_html;

    setEnhancedHtml(populated);
    setInputHtml(populated);
    setDesignTitle(
      `${template.title} (Slot: ${targetSlot === 'all' ? 'All' : `Card ${parseInt(targetSlot, 10) + 1}`})`
    );
    setIsCatalogOpen(false);
    setActiveTab('studio');
    recordGenerationToHistory(populated, false);

    showToast(
      hasUserContent
        ? targetSlot === 'all'
          ? `Applied "${template.title}" with your content! 100% verbatim text preserved.`
          : `Injected content into Card ${parseInt(targetSlot, 10) + 1} of "${template.title}"!`
        : `Loaded "${template.title}" presentation template!`,
      'success'
    );
  };

  // Record generation to history
  const recordGenerationToHistory = async (htmlCode, isPermanent = false) => {
    const entry = {
      id: generateUniqueId('hist'),
      title: designTitle || 'Enhanced Tailwind Design',
      original_html: inputHtml,
      enhanced_html: htmlCode,
      is_saved: isPermanent,
      is_published: false,
      user_id: user?.id || null,
      created_by_name: user?.name || user?.username || 'User',
      options: { animateOnHover, themeColor },
      created_at: new Date().toISOString(),
    };

    setUserHistory((prev) => [entry, ...prev.slice(0, 49)]);

    if (user?.id) {
      try {
        await supabase.from('html_designs').insert([entry]);
      } catch (e) {
        console.warn('Could not record history in DB:', e);
      }
    } else {
      try {
        const local = JSON.parse(
          localStorage.getItem('html_enhancer_local_history') || '[]'
        );
        const updated = [entry, ...local.slice(0, 25)];
        localStorage.setItem(
          'html_enhancer_local_history',
          JSON.stringify(updated)
        );
      } catch {
        // ignore
      }
    }
  };

  // Save Design Permanently to Vault
  const handleSaveDesignPermanently = async (item = null) => {
    const targetHtml = item ? item.enhanced_html : enhancedHtml;
    const targetTitle = item ? item.title : designTitle;
    const targetId = item ? item.id : null;

    if (!targetHtml) {
      showToast(
        'No enhanced design to save. Please run enhancement first.',
        'error'
      );
      return;
    }

    setUserHistory((prev) =>
      prev.map((entry) => {
        if (targetId && entry.id === targetId) {
          return { ...entry, is_saved: true, title: targetTitle };
        }
        if (!targetId && entry.enhanced_html === targetHtml) {
          return { ...entry, is_saved: true };
        }
        return entry;
      })
    );

    if (user?.id) {
      try {
        if (targetId) {
          await supabase
            .from('html_designs')
            .update({
              is_saved: true,
              title: targetTitle,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetId);
        } else {
          await supabase.from('html_designs').insert([
            {
              title: targetTitle,
              original_html: inputHtml,
              enhanced_html: targetHtml,
              is_saved: true,
              is_published: false,
              user_id: user.id,
              created_by_name: user.name || user.username || 'User',
              options: { animateOnHover, themeColor },
            },
          ]);
        }
      } catch (e) {
        console.warn('DB error while saving design:', e);
      }
    }

    showToast(
      'Saved permanently to your vault! It will never expire.',
      'success'
    );
  };

  // Admin Publish to Community Gallery
  const handleConfirmPublish = async () => {
    if (!isAdmin) {
      showToast(
        'Publishing to the community gallery requires Admin permissions.',
        'error'
      );
      setPublishDialogOpen(false);
      return;
    }

    const item = designToPublish;
    if (!item) return;

    try {
      const pubEntry = {
        ...item,
        is_saved: true,
        is_published: true,
        published_by: user?.name || user?.username || 'Admin',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('html_designs')
        .upsert(pubEntry, { onConflict: 'id' });

      if (error && error.code === '42P10') {
        await supabase
          .from('html_designs')
          .update(pubEntry)
          .eq('id', pubEntry.id);
      }

      setPublishedDesigns((prev) => [
        pubEntry,
        ...prev.filter((p) => p.id !== pubEntry.id),
      ]);
      showToast(
        `Published "${item.title}" to Community Gallery for all users!`,
        'success'
      );
    } catch (e) {
      console.warn('Could not publish design:', e);
      showToast('Could not publish design to cloud.', 'error');
    } finally {
      setPublishDialogOpen(false);
      setDesignToPublish(null);
    }
  };

  // Delete from history
  const handleDeleteHistoryItem = async (id) => {
    setUserHistory((prev) => prev.filter((item) => item.id !== id));
    if (user?.id) {
      try {
        await supabase.from('html_designs').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
    showToast('Deleted from history.', 'info');
  };

  // Quick Text to Generate into selected Published Template
  const handleGenerateQuickTextIntoTemplate = async () => {
    if (!selectedTemplateForQuickText || !quickTextInput.trim()) {
      showToast('Please enter your quick text first.', 'error');
      return;
    }

    setIsQuickTextGenerating(true);
    try {
      const populatedHtml = await injectQuickTextIntoDesign(
        selectedTemplateForQuickText.enhanced_html,
        quickTextInput
      );

      setInputHtml(selectedTemplateForQuickText.enhanced_html);
      setEnhancedHtml(populatedHtml);
      setDesignTitle(`Custom - ${selectedTemplateForQuickText.title}`);
      setActiveTab('studio');
      setSelectedTemplateForQuickText(null);
      setQuickTextInput('');

      recordGenerationToHistory(populatedHtml, false);
      showToast(
        'Generated your content into the published design template perfectly!',
        'success'
      );
    } catch (e) {
      console.warn('Quick text generation error:', e);
      showToast('Generation encountered an issue, check input.', 'error');
    } finally {
      setIsQuickTextGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopyCode = () => {
    if (!enhancedHtml) return;
    navigator.clipboard.writeText(enhancedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Clean Tailwind HTML copied to clipboard!', 'success');
  };

  // Filtered history list
  const filteredHistory = useMemo(() => {
    if (historyFilter === 'saved') return userHistory.filter((i) => i.is_saved);
    if (historyFilter === 'unsaved')
      return userHistory.filter((i) => !i.is_saved);
    return userHistory;
  }, [userHistory, historyFilter]);

  // Combined Catalog of All Built-in Designs + Published Designs
  const allCatalogDesigns = useMemo(() => {
    const builtInIds = new Set(DESIGN_CATALOG.map((d) => d.id));
    const customPubs = publishedDesigns
      .filter((p) => !builtInIds.has(p.id))
      .map((p) => ({
        id: p.id,
        title: p.title,
        category: 'Community',
        description:
          p.description || 'Community published presentation design.',
        slotsCount: 2,
        slotNames: ['Card 1', 'Card 2'],
        badge: 'Community',
        enhanced_html: p.enhanced_html,
      }));

    return [...DESIGN_CATALOG, ...customPubs];
  }, [publishedDesigns]);

  // Filtered Catalog by Search & Category
  const filteredCatalog = useMemo(() => {
    return allCatalogDesigns.filter((item) => {
      const matchesSearch =
        !catalogSearch ||
        item.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCategory =
        catalogCategory === 'all' ||
        item.category.toLowerCase().includes(catalogCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [allCatalogDesigns, catalogSearch, catalogCategory]);

  return (
    <div className="w-full space-y-4">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toastMsg.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : toastMsg.type === 'error' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP STREAMLINED HEADER CARD */}
      {/* ======================================================== */}
      <Card className="border border-border/70 bg-card/70 backdrop-blur-md shadow-xs">
        <CardHeader className="py-3 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  HTML Design Enhancer
                </CardTitle>
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[9px] px-2 py-0 border-0">
                  AI STUDIO
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-bold"
                >
                  100% Free AI
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10 font-bold flex items-center gap-1"
                >
                  <Lock className="w-2.5 h-2.5" /> Verbatim Guard
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Converts inline styles to pure Tailwind, prevents oversized
                desktop images, and injects slow ambient glow animations.
              </p>
            </div>
          </div>

          {/* Primary Action Cluster (Controlled, Clean & Elegant) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 80% Catalog Drawer Button */}
            <Button
              size="sm"
              onClick={() => setIsCatalogOpen(true)}
              className="h-8 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm transition-all duration-300"
              title="Open the 80% width Design Catalog drawer"
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
              <span>Browse Catalog</span>
              <Badge className="ml-0.5 bg-white/20 text-white hover:bg-white/30 text-[10px] px-1.5 py-0">
                {allCatalogDesigns.length}
              </Badge>
            </Button>

            {/* Optional Apply to Slide Button */}
            {onApplyToSlide && (
              <Button
                size="sm"
                onClick={() => onApplyToSlide(enhancedHtml || inputHtml)}
                className="h-8 gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Slide</span>
              </Button>
            )}

            {/* Consolidated Quick Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs font-bold gap-1 cursor-pointer"
                  title="More actions"
                >
                  <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={() => {
                    setInputHtml(SAMPLE_SLIDE_HTML);
                    showToast(
                      'Loaded sample slide HTML with inline styles!',
                      'info'
                    );
                  }}
                  className="text-xs cursor-pointer gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Reset to Sample HTML</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSaveDesignPermanently()}
                  className="text-xs cursor-pointer gap-2"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Save Design to Vault</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => {
                      setDesignToPublish({
                        id: generateUniqueId('pub'),
                        title: designTitle,
                        enhanced_html: enhancedHtml,
                        options: { animateOnHover, themeColor },
                      });
                      setPublishDialogOpen(true);
                    }}
                    className="text-xs cursor-pointer gap-2 text-indigo-600 dark:text-indigo-400"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Publish (Admin)</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setInputHtml('');
                    setEnhancedHtml('');
                    showToast('Workspace cleared.', 'info');
                  }}
                  className="text-xs cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Workspace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-2 pb-0 border-b border-border/40 bg-muted/15 flex items-center justify-between">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="bg-transparent h-9 p-0 gap-4 border-b-0">
              <TabsTrigger
                value="studio"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-2 font-bold text-xs gap-1.5 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                <span>Enhancer Studio</span>
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-2 font-bold text-xs gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>Published Templates ({publishedDesigns.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-2 font-bold text-xs gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-amber-500" />
                <span>My History ({userHistory.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* TAB 1: STUDIO (EDITOR & BEFORE/AFTER LIVE PREVIEW) */}
      {/* ======================================================== */}
      {activeTab === 'studio' && (
        <div className="space-y-4">
          {/* Streamlined Studio Action Center */}
          <Card className="border border-border/60 bg-muted/20 p-3 sm:p-4 shadow-xs">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              {/* Distinct AI Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 1. Auto Design (Smart Content-Aware Match) */}
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleAutoDesign}
                  className="h-9 px-3.5 gap-2 text-xs font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white cursor-pointer shadow-md shadow-purple-500/20 border-0 transition-all duration-300"
                  title="Analyzes content structure & selects matching presentation card layout (Image, Icon, Comparative, Roadmap, Metrics)"
                >
                  {isProcessing && activeAiAction === 'auto' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-300" />
                  )}
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span>
                      {isProcessing && activeAiAction === 'auto'
                        ? 'Matching Layout...'
                        : 'Auto-Design Match'}
                    </span>
                    <span className="text-[9px] font-normal opacity-85">
                      Smart Layout Selector
                    </span>
                  </div>
                </Button>

                {/* 2. Free AI Master Enhancer */}
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleFreeAiEnhance('', true)}
                  className="h-9 px-3.5 gap-2 text-xs font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white cursor-pointer shadow-md shadow-indigo-500/20 border-0 transition-all duration-300"
                  title="Refines full styling to Tailwind with slow ambient glow & custom prompt execution"
                >
                  {isProcessing && activeAiAction === 'enhance' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                  )}
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span>
                      {isProcessing && activeAiAction === 'enhance'
                        ? 'Enhancing Styles...'
                        : 'AI Master Enhancer'}
                    </span>
                    <span className="text-[9px] font-normal opacity-85">
                      Style & Polish Engine
                    </span>
                  </div>
                </Button>

                {/* 3. Instant Convert (Deterministic) */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={handleInstantTransform}
                  className="h-9 px-3 gap-1.5 text-xs font-bold cursor-pointer bg-background hover:bg-muted"
                  title="Instant deterministic conversion to Tailwind (0 API calls)"
                >
                  <Wand2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Instant Convert</span>
                </Button>
              </div>

              {/* Settings & Toggle Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Slow Animations Toggle & Glow Color */}
                <div className="flex items-center gap-2 bg-background/80 border rounded-xl px-3 py-1.5">
                  <Switch
                    id="animate-hover-toggle"
                    checked={animateOnHover}
                    onCheckedChange={setAnimateOnHover}
                  />
                  <Label
                    htmlFor="animate-hover-toggle"
                    className="text-xs font-bold cursor-pointer select-none"
                    title="Slow, smooth ambient animations (700ms - 1000ms duration)"
                  >
                    Slow Animations
                  </Label>

                  {animateOnHover && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-border/60 ml-1">
                      {['ocean', 'purple', 'emerald', 'rose', 'amber'].map(
                        (thm) => (
                          <button
                            key={thm}
                            type="button"
                            onClick={() => setThemeColor(thm)}
                            className={`w-3.5 h-3.5 rounded-full transition-transform duration-300 cursor-pointer ${
                              thm === 'ocean'
                                ? 'bg-blue-500'
                                : thm === 'purple'
                                  ? 'bg-purple-500'
                                  : thm === 'emerald'
                                    ? 'bg-emerald-500'
                                    : thm === 'rose'
                                      ? 'bg-rose-500'
                                      : 'bg-amber-500'
                            } ${themeColor === thm ? 'scale-125 ring-2 ring-primary ring-offset-1 ring-offset-background' : 'opacity-60 hover:opacity-100'}`}
                            title={`Select ${thm} glow`}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Custom Prompt Toggle */}
                <Button
                  size="sm"
                  variant={showCustomPrompt ? 'secondary' : 'outline'}
                  onClick={() => setShowCustomPrompt((prev) => !prev)}
                  className={`h-8 gap-1.5 text-xs font-bold cursor-pointer ${
                    showCustomPrompt
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : ''
                  }`}
                  title="Write custom design directions"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
                  <span>Custom Prompt</span>
                  {customPrompt.trim() && (
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  )}
                </Button>

                {/* Source Input Open/Close Toggle */}
                <Button
                  size="sm"
                  variant={isSourcePanelOpen ? 'secondary' : 'outline'}
                  onClick={() => setIsSourcePanelOpen((prev) => !prev)}
                  className={`h-8 gap-1.5 text-xs font-bold cursor-pointer ${
                    !isSourcePanelOpen
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : ''
                  }`}
                  title={
                    isSourcePanelOpen
                      ? 'Hide Source HTML Input'
                      : 'Show Source HTML Input'
                  }
                >
                  {isSourcePanelOpen ? (
                    <PanelLeftClose className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                  <span>
                    {isSourcePanelOpen ? 'Hide Source' : 'Show Source'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Expandable Custom AI Prompt Bar */}
            {showCustomPrompt && (
              <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    Custom Design Prompt (Modifies only requested attributes
                    while preserving 100% text):
                  </Label>

                  <div className="flex items-center gap-2">
                    {enhancedHtml && (
                      <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
                        <span className="text-[10px] font-semibold text-muted-foreground px-1.5">
                          Target:
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomPromptTarget('last')}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            customPromptTarget === 'last'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="Incremental mode: Modifies only requested attributes (border, background, layout) on your last made design"
                        >
                          ⚡ Last Made Design (Incremental)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomPromptTarget('source')}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            customPromptTarget === 'source'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="Full synthesis mode: Builds brand new card layout from Source Input HTML"
                        >
                          📄 Source HTML
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Verbatim Text Guard: Active 🔒
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={
                      customPromptTarget === 'last' && enhancedHtml
                        ? 'e.g., Change border color to amber, make background dark, or add rotating dashed rings...'
                        : 'e.g., Make these cards 1 row 2 column on desktop and responsive on mobile...'
                    }
                    className="h-8 text-xs bg-background border-border/60"
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        customPrompt.trim() &&
                        !isProcessing
                      ) {
                        handleFreeAiEnhance(customPrompt);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={isProcessing || !customPrompt.trim()}
                    onClick={() => handleFreeAiEnhance(customPrompt)}
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer shrink-0"
                  >
                    {isProcessing && activeAiAction === 'custom' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <Send className="w-3 h-3 mr-1" />
                    )}
                    <span>
                      {customPromptTarget === 'last' && enhancedHtml
                        ? 'Update Last Design'
                        : 'Apply Prompt'}
                    </span>
                  </Button>
                </div>

                {/* Quick Prompt Suggestion Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {customPromptTarget === 'last' && enhancedHtml
                      ? 'Quick Incremental Edits:'
                      : 'Quick Prompts:'}
                  </span>
                  {(customPromptTarget === 'last' && enhancedHtml
                    ? [
                        'Change border color to amber',
                        'Change border color to emerald',
                        'Change border color to ocean blue',
                        'Change border color to purple',
                        'Change border color to rose red',
                        'Add a card for Quality Assurance',
                        'Add rotating dashed rings & circles',
                        'Switch to dark cyber mode',
                        'Switch to clean light mode',
                        'Make 1 row 2 column on desktop',
                        'Make 3-column grid',
                      ]
                    : [
                        'Challenge vs AI Solution split cards',
                        'Executive compliance & legal advisory shield card',
                        'Reference citation & source link card',
                        'Before AI vs With AI transformation matrix',
                        'AI-powered 5-column capability showcase grid',
                        '3-pillar numbered core principles (01, 02, 03)',
                        '6-role capability executive grid',
                        'Executive multi-color 5-stage feature rows',
                        'Make 1 row 2 column on desktop and responsive on mobile',
                        '3-column feature cards with slow hover animations',
                        'Left image and right structured content with bounded desktop size',
                        'Left icon badge emblem with right heading and text',
                        'Dark cyber glassmorphic with neon borders',
                        'Ocean blue 3D cards with ambient glow',
                      ]
                  ).map((presetPrompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setCustomPrompt(presetPrompt);
                        handleFreeAiEnhance(presetPrompt);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 transition-all cursor-pointer font-medium"
                    >
                      {presetPrompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostics & Title Bar */}
            <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-mono">
                  {styleAnalysis.count > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />{' '}
                      {styleAnalysis.count} inline styles found
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 100% Clean Tailwind (0
                      inline styles)
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Zero &lt;style&gt; or
                  &lt;script&gt; tags
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Desktop Images Bounded
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Design Title:</span>
                <Input
                  value={designTitle}
                  onChange={(e) => setDesignTitle(e.target.value)}
                  className="h-6 text-xs w-44 bg-background border-border/60"
                  placeholder="Design title..."
                />
              </div>
            </div>
          </Card>

          {/* Dual Split Panes with Animated Blur Overlay on AI Processing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative">
            {/* Left Pane: HTML Source Input (Collapsible: 5 cols on lg when open, hidden when closed) */}
            {isSourcePanelOpen && (
              <Card className="border border-border/70 flex flex-col min-h-[700px] h-[700px] lg:h-[740px] lg:col-span-5 animate-in fade-in-50 duration-200">
                <CardHeader className="py-2.5 px-4 border-b border-border/50 flex flex-row items-center justify-between shrink-0 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Source HTML Input
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setInputHtml('')}
                      className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsSourcePanelOpen(false)}
                      className="h-6 text-[11px] px-1.5 text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                      title="Hide / Close Source HTML Input"
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                  <Textarea
                    value={inputHtml}
                    onChange={(e) => setInputHtml(e.target.value)}
                    className="flex-1 w-full rounded-none border-0 font-mono text-xs bg-slate-950 text-slate-100 p-3 leading-relaxed resize-none focus-visible:ring-0"
                    placeholder="Paste your HTML here with inline styles, card images, or raw text..."
                  />
                </CardContent>
              </Card>
            )}

            {/* Right Pane: Before & After Live Preview & Tailwind Code (7 cols if source open, 12 cols if source closed) */}
            <Card
              className={`border border-border/70 flex flex-col min-h-[700px] h-[700px] lg:h-[740px] transition-all duration-300 relative overflow-hidden ${
                isSourcePanelOpen ? 'lg:col-span-7' : 'lg:col-span-12'
              }`}
            >
              {/* AI Enhancing Backdrop Blur Overlay with Animated Loader */}
              {isProcessing && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/70 backdrop-blur-md transition-all duration-500 animate-in fade-in-50">
                  <div className="p-6 rounded-3xl bg-card/90 border border-border/80 shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="relative flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 animate-spin blur-md opacity-70"></div>
                      <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center absolute shadow-inner">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-black text-foreground">
                        {activeAiAction === 'auto'
                          ? 'Auto-Matching Layout...'
                          : 'AI Master Enhancer in Progress'}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {processingStatus ||
                          'Synthesizing Tailwind Architecture & Verbatim Guard...'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                      <Lock className="w-3 h-3" />
                      <span>100% Verbatim Content Guard</span>
                    </div>
                  </div>
                </div>
              )}

              <CardHeader className="py-2.5 px-3 sm:px-4 border-b border-border/50 flex flex-row items-center justify-between shrink-0 bg-muted/20 gap-2 flex-wrap">
                {/* View Selector & Open Source Button */}
                <div className="flex items-center gap-2 flex-wrap">
                  {!isSourcePanelOpen && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsSourcePanelOpen(true)}
                      className="h-7 text-xs px-2.5 gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold cursor-pointer hover:bg-indigo-500/20"
                      title="Open Source HTML Input"
                    >
                      <PanelLeftOpen className="w-3.5 h-3.5" />
                      <span>Open Source HTML</span>
                    </Button>
                  )}

                  <div className="flex items-center gap-1 bg-background border rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('split')}
                      className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        previewTab === 'split'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Side-by-side Before & After comparison"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Split (Before/After)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('after')}
                      className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        previewTab === 'after'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>After (Enhanced)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('before')}
                      className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        previewTab === 'before'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Before (Original)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('code')}
                      className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        previewTab === 'code'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Code2 className="w-3 h-3" />
                      <span>Code</span>
                    </button>
                  </div>
                </div>

                {/* Viewport switch & Copy Button */}
                <div className="flex items-center gap-2">
                  {previewTab !== 'code' && (
                    <div className="flex items-center gap-1 bg-background border rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setPreviewViewport('desktop')}
                        className={`p-1 rounded cursor-pointer ${previewViewport === 'desktop' ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                        title="Desktop view"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport('tablet')}
                        className={`p-1 rounded cursor-pointer ${previewViewport === 'tablet' ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                        title="Tablet view"
                      >
                        <Tablet className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport('mobile')}
                        className={`p-1 rounded cursor-pointer ${previewViewport === 'mobile' ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                        title="Mobile view"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {detectedIcons.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setIsIconsModalOpen(true)}
                      className="h-7 text-xs px-2.5 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                      title="Download detected icons & images in WebP, PNG, SVG (Auto-saved to Media Bucket)"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        Icons &amp; Images
                      </span>{' '}
                      ({detectedIcons.length})
                      <Badge className="bg-white/20 text-white text-[9px] px-1 py-0 border-0">
                        Export
                      </Badge>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handleCopyCode}
                    className="h-7 text-xs px-2.5 gap-1.5 bg-primary text-primary-foreground font-bold cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col min-h-0 bg-background overflow-hidden relative">
                {/* 1. SPLIT VIEW: BEFORE vs AFTER */}
                {previewTab === 'split' && (
                  <div className="w-full h-full overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-100 dark:bg-slate-900/60">
                    {/* Before Card */}
                    <div className="flex flex-col border border-border/80 rounded-2xl bg-card overflow-hidden shadow-xs">
                      <div className="py-2 px-3 bg-muted/40 border-b border-border/50 flex items-center justify-between shrink-0">
                        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-amber-500" />{' '}
                          BEFORE: Original HTML
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10"
                        >
                          Raw Styles
                        </Badge>
                      </div>
                      <div className="flex-1 overflow-hidden min-h-[460px]">
                        <HtmlLivePreview
                          html={inputHtml}
                          viewport={previewViewport}
                          isDark={isDarkMode}
                          emptyMessage="No input HTML provided."
                        />
                      </div>
                    </div>

                    {/* After Card */}
                    <div className="flex flex-col border border-emerald-500/40 rounded-2xl bg-card overflow-hidden shadow-md">
                      <div className="py-2 px-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />{' '}
                          AFTER: 100% Tailwind
                        </span>
                        <Badge className="bg-emerald-600 text-white font-bold text-[9px]">
                          Clean &amp; Animated
                        </Badge>
                      </div>
                      <div className="flex-1 overflow-hidden min-h-[460px]">
                        <HtmlLivePreview
                          html={enhancedHtml}
                          viewport={previewViewport}
                          isDark={isDarkMode}
                          emptyMessage="Run Instant Convert or Free AI to preview enhanced design."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AFTER PREVIEW (FULL) */}
                {previewTab === 'after' && (
                  <div className="w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900/60">
                    <HtmlLivePreview
                      html={enhancedHtml}
                      viewport={previewViewport}
                      isDark={isDarkMode}
                      emptyMessage="Run Instant Convert or Free AI to preview enhanced design."
                    />
                  </div>
                )}

                {/* 3. BEFORE PREVIEW (FULL) */}
                {previewTab === 'before' && (
                  <div className="w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900/60">
                    <HtmlLivePreview
                      html={inputHtml}
                      viewport={previewViewport}
                      isDark={isDarkMode}
                      emptyMessage="No input HTML provided."
                    />
                  </div>
                )}

                {/* 4. TAILWIND CODE VIEW */}
                {previewTab === 'code' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {detectedIcons.length > 0 && (
                      <div className="p-2.5 bg-purple-500/10 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>
                            <strong>{detectedIcons.length} Asset(s)</strong>{' '}
                            detected &amp; auto-saved in your Media Bucket 📦
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleDownloadAllIcons('webp')}
                            className="h-6 text-[11px] bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1 px-2 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download (WebP)</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadAllIcons('png')}
                            className="h-6 text-[11px] border-purple-500/30 text-purple-600 dark:text-purple-300 font-bold gap-1 px-2 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>PNG</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsIconsModalOpen(true)}
                            className="h-6 text-[11px] text-purple-600 dark:text-purple-300 font-bold px-2 cursor-pointer"
                          >
                            View All Assets
                          </Button>
                        </div>
                      </div>
                    )}
                    <Textarea
                      readOnly
                      value={enhancedHtml}
                      className="flex-1 w-full rounded-none border-0 font-mono text-xs bg-slate-950 text-slate-100 p-3 leading-relaxed resize-none focus-visible:ring-0"
                      placeholder="Enhanced 100% Tailwind HTML will appear here..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 80% WIDTH DESIGN CATALOG DRAWER / SLIDE-OVER */}
      {/* ======================================================== */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-50">
          <div className="w-full sm:w-[85vw] lg:w-[80vw] max-w-[1400px] h-full bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="py-3 px-5 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    Design Catalog &amp; Presentation Card Selector
                    <Badge className="bg-indigo-600 text-white text-[10px] font-bold">
                      {allCatalogDesigns.length} Designs
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Featuring Image Left/Right cards, Icon Header cards,
                    3-Pillars, Roadmaps, and Metrics with 100% verbatim content
                    protection.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCatalogOpen(false)}
                className="h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Filter & Grid Layout Controls */}
            <div className="p-4 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="h-8 pl-8 text-xs bg-background border-border/60"
                  />
                </div>

                {/* Category selector */}
                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="h-8 text-xs rounded-md border border-border/60 bg-background px-2 text-foreground focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  <option value="comparison">Comparison &amp; Split</option>
                  <option value="features">Features &amp; Rows</option>
                  <option value="showcase">Showcase Grid</option>
                  <option value="media">Media / Image Cards</option>
                  <option value="icon">Icon Headers</option>
                  <option value="process">Process / Roadmap</option>
                  <option value="metrics">Metrics &amp; Stats</option>
                  <option value="community">Community</option>
                </select>
              </div>

              {/* Grid Toggle: 2 in 1 Row vs 1 in 1 Row */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs font-semibold text-muted-foreground">
                  Grid View:
                </span>
                <div className="flex items-center bg-card border rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setCatalogGridCols(2)}
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      catalogGridCols === 2
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Show 2 designs per row"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>2 in 1 Row</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogGridCols(1)}
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      catalogGridCols === 1
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Show 1 design per row (Full Width)"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>1 in 1 Row</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Designs List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <div
                className={`grid gap-6 ${
                  catalogGridCols === 2
                    ? 'grid-cols-1 xl:grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {filteredCatalog.map((tmpl) => {
                  const currentSelectedSlot =
                    drawerSlotSelections[tmpl.id] || 'all';

                  return (
                    <Card
                      key={tmpl.id}
                      className="border border-border/80 bg-card overflow-hidden flex flex-col hover:border-indigo-500/60 transition-all shadow-sm"
                    >
                      {/* Card Header */}
                      <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/40 flex flex-row items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">
                              {tmpl.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold"
                            >
                              {tmpl.badge || tmpl.category}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {tmpl.description}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        {/* Live Rendered Responsive Preview Frame with Skeletons */}
                        <CatalogDesignPreviewFrame
                          html={tmpl.enhanced_html}
                          isDark={isDarkMode}
                          title={tmpl.title}
                          height="420px"
                          allowViewportSwitch={true}
                          defaultViewport="desktop"
                        />

                        {/* Card Slot Selection Control */}
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                              Target Card Slot to Insert Your Content:
                            </Label>
                            <span className="text-[10px] text-muted-foreground">
                              Choose a single card or distribute your content
                              across all cards
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button
                              size="sm"
                              variant={
                                currentSelectedSlot === 'all'
                                  ? 'default'
                                  : 'outline'
                              }
                              onClick={() =>
                                setDrawerSlotSelections((prev) => ({
                                  ...prev,
                                  [tmpl.id]: 'all',
                                }))
                              }
                              className="h-7 text-[11px] px-2.5 cursor-pointer font-bold"
                            >
                              All Cards
                            </Button>

                            {Array.from({ length: tmpl.slotsCount || 1 }).map(
                              (_, idx) => (
                                <Button
                                  key={idx}
                                  size="sm"
                                  variant={
                                    currentSelectedSlot === String(idx)
                                      ? 'default'
                                      : 'outline'
                                  }
                                  onClick={() =>
                                    setDrawerSlotSelections((prev) => ({
                                      ...prev,
                                      [tmpl.id]: String(idx),
                                    }))
                                  }
                                  className="h-7 text-[11px] px-2.5 cursor-pointer font-bold"
                                >
                                  {tmpl.slotNames?.[idx] || `Card ${idx + 1}`}
                                </Button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setInputHtml(tmpl.enhanced_html);
                              setEnhancedHtml(tmpl.enhanced_html);
                              setDesignTitle(tmpl.title);
                              setIsCatalogOpen(false);
                              setActiveTab('studio');
                              showToast(
                                `Loaded "${tmpl.title}" template into studio!`,
                                'info'
                              );
                            }}
                            className="h-8 text-xs cursor-pointer gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Load Template As-Is</span>
                          </Button>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTemplateForQuickText(tmpl);
                                setIsCatalogOpen(false);
                              }}
                              className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer gap-1.5 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Free AI Populate</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() =>
                                handleApplyTemplateWithSlot(
                                  tmpl,
                                  currentSelectedSlot
                                )
                              }
                              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer gap-1.5 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Apply My Content Verbatim</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PUBLISHED TEMPLATES & QUICK TEXT GENERATE */}
      {/* ======================================================== */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <Card className="border border-border/70 bg-muted/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  Published Community Design Templates
                </h3>
                <p className="text-xs text-muted-foreground">
                  Finalized designs published by admins. Select any template and
                  use <strong>Quick Text to Generate</strong> to populate your
                  content with zero text alteration.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsCatalogOpen(true)}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer gap-1.5 shrink-0"
              >
                <PanelRightOpen className="w-3.5 h-3.5" />
                <span>Open 80% Catalog View</span>
              </Button>
            </div>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedDesigns.map((tmpl) => (
              <Card
                key={tmpl.id}
                className="border border-border/70 overflow-hidden flex flex-col hover:border-primary/50 transition-all shadow-xs"
              >
                <CardHeader className="py-2.5 px-4 bg-muted/30 border-b border-border/40 flex flex-row items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {tmpl.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      By {tmpl.published_by || 'Admin'} •{' '}
                      {new Date(tmpl.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold"
                  >
                    Published
                  </Badge>
                </CardHeader>
                <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
                  <CatalogDesignPreviewFrame
                    html={tmpl.enhanced_html}
                    isDark={isDarkMode}
                    title={tmpl.title}
                    height="420px"
                    allowViewportSwitch={true}
                    defaultViewport="desktop"
                  />

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setInputHtml(tmpl.enhanced_html);
                        setEnhancedHtml(tmpl.enhanced_html);
                        setDesignTitle(tmpl.title);
                        setActiveTab('studio');
                        showToast(
                          `Loaded "${tmpl.title}" into Enhancer Studio!`,
                          'info'
                        );
                      }}
                      className="h-7 text-xs cursor-pointer gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Edit in Studio</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setSelectedTemplateForQuickText(tmpl)}
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Free AI Populate</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: USER DESIGN HISTORY & 24-HOUR NOTICE */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">
                Notice Regarding Generation History:
              </span>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Unsaved designs in your generation history will automatically
                expire and be removed after 24 hours. Click{' '}
                <strong>&quot;Save Permanently&quot;</strong> on any design to
                preserve it forever in your personal vault.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={historyFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setHistoryFilter('all')}
                className="h-7 text-xs cursor-pointer"
              >
                All ({userHistory.length})
              </Button>
              <Button
                size="sm"
                variant={historyFilter === 'saved' ? 'default' : 'outline'}
                onClick={() => setHistoryFilter('saved')}
                className="h-7 text-xs cursor-pointer gap-1"
              >
                <Save className="w-3 h-3 text-emerald-500" />
                <span>
                  Saved Permanently (
                  {userHistory.filter((i) => i.is_saved).length})
                </span>
              </Button>
              <Button
                size="sm"
                variant={historyFilter === 'unsaved' ? 'default' : 'outline'}
                onClick={() => setHistoryFilter('unsaved')}
                className="h-7 text-xs cursor-pointer gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>
                  Expires in 24h (
                  {userHistory.filter((i) => !i.is_saved).length})
                </span>
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={loadDatabaseData}
              className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>

          {/* History List */}
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-2xl italic">
              No design history records found. Convert or enhance HTML in the
              studio to populate your history.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <Card
                  key={item.id}
                  className={`border transition-all ${
                    item.is_saved
                      ? 'border-emerald-500/30 bg-emerald-500/[0.015]'
                      : 'border-amber-500/20 bg-amber-500/[0.01]'
                  }`}
                >
                  <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.is_saved ? (
                        <Badge className="bg-emerald-600 text-white font-bold text-[9px] px-2 py-0 border-0">
                          Saved (Permanent)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 text-[9px] px-2 py-0 font-bold"
                        >
                          Expires in 24h (Unsaved)
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-muted-foreground font-mono truncate max-w-md">
                      Length: {item.enhanced_html?.length || 0} chars •{' '}
                      {item.options?.animateOnHover
                        ? 'Animated on Hover'
                        : 'Static Tailwind'}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!item.is_saved && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveDesignPermanently(item)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save Permanently</span>
                        </Button>
                      )}

                      {isAdmin && !item.is_published && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDesignToPublish(item);
                            setPublishDialogOpen(true);
                          }}
                          className="h-7 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-500/30 cursor-pointer"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Publish
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setInputHtml(
                            item.original_html || item.enhanced_html
                          );
                          setEnhancedHtml(item.enhanced_html);
                          setDesignTitle(item.title);
                          setActiveTab('studio');
                          showToast('Loaded design into studio!', 'success');
                        }}
                        className="h-7 text-xs cursor-pointer gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Load</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 cursor-pointer px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* QUICK TEXT TO GENERATE DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={!!selectedTemplateForQuickText}
        onOpenChange={(open) => !open && setSelectedTemplateForQuickText(null)}
      >
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Quick Text to Generate into &quot;
              {selectedTemplateForQuickText?.title}&quot;
            </DialogTitle>
            <DialogDescription className="text-xs">
              Paste your headings or bullet points below. The Free AI engine
              will populate your text directly into this template while keeping
              100% of its Tailwind styles, animations, and corner glow effects
              with <strong>zero text modifications</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold text-foreground">
              Your Content / Bullets:
            </Label>
            <Textarea
              rows={8}
              value={quickTextInput}
              onChange={(e) => setQuickTextInput(e.target.value)}
              className="font-mono text-xs bg-muted/30 border-border"
              placeholder={`Example:\n• Before AI: Manual data entry across multiple spreadsheets took 4 hours.\n• With AI: Generative ingestion parses invoices and syncs to ERP in seconds.\n• Benefit: 90% reduction in cycle time with zero human error.`}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTemplateForQuickText(null)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isQuickTextGenerating}
              onClick={handleGenerateQuickTextIntoTemplate}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 cursor-pointer shadow-sm"
            >
              {isQuickTextGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {isQuickTextGenerating
                  ? 'Synthesizing...'
                  : 'Generate Content with Free AI'}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* ADMIN CONFIRM PUBLISH DIALOG */}
      {/* ======================================================== */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              Publish Design to Community Gallery
            </DialogTitle>
            <DialogDescription className="text-xs">
              Publishing will make this design template visible to all users of
              the platform. Users will be able to select it and populate their
              own content into it.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="p-3 rounded-lg border bg-muted/30 text-xs space-y-1">
              <span className="font-semibold text-foreground">
                Design Title:
              </span>
              <p className="text-muted-foreground">{designToPublish?.title}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishDialogOpen(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPublish}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Confirm &amp; Publish for Everyone</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* ICON & IMAGE ASSET MANAGER & 1-CLICK DOWNLOAD DIALOG */}
      {/* ======================================================== */}
      <Dialog open={isIconsModalOpen} onOpenChange={setIsIconsModalOpen}>
        <DialogContent className="max-w-3xl bg-card border-border max-h-[88vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Asset Manager: Icons &amp; AI Artwork
              </DialogTitle>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                Auto-Saved in Media Bucket 📦
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              All vector icons and card images (AI artwork, webp/png) extracted
              and converted. 1-click batch download in WebP or PNG format, ready
              to upload to your own storage bucket.
            </DialogDescription>
          </DialogHeader>

          {/* Quick 1-Click Batch Download Header */}
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-purple-700 dark:text-purple-300">
              <strong>{detectedIcons.length} Total Asset(s)</strong>
              <span className="text-[11px] opacity-80 ml-1">
                ({vectorIconsCount} vector icons, {imagesCount} images)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => handleDownloadAllIcons('webp')}
                className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 shadow-xs cursor-pointer"
                title="1-Click Download all assets in WebP format"
              >
                <Download className="w-3.5 h-3.5" />
                <span>1-Click Download (WebP)</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadAllIcons('png')}
                className="h-7 text-xs border-purple-500/30 text-purple-600 dark:text-purple-300 font-bold gap-1.5 cursor-pointer hover:bg-purple-500/10"
                title="Download all assets in PNG format"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download (PNG)</span>
              </Button>
              {vectorIconsCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadAllIcons('svg')}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground font-bold gap-1 cursor-pointer"
                  title="Download vector icons as SVG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG</span>
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs: All Assets, Vector Icons, Images & AI Artwork */}
          <div className="flex items-center gap-1.5 pt-1 border-b border-border/50 pb-2">
            <Button
              size="sm"
              variant={assetFilterTab === 'all' ? 'default' : 'ghost'}
              onClick={() => setAssetFilterTab('all')}
              className="h-7 text-xs font-bold cursor-pointer"
            >
              All Assets ({detectedIcons.length})
            </Button>
            <Button
              size="sm"
              variant={assetFilterTab === 'icons' ? 'default' : 'ghost'}
              onClick={() => setAssetFilterTab('icons')}
              className="h-7 text-xs font-bold cursor-pointer gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>Vector Icons ({vectorIconsCount})</span>
            </Button>
            <Button
              size="sm"
              variant={assetFilterTab === 'images' ? 'default' : 'ghost'}
              onClick={() => setAssetFilterTab('images')}
              className="h-7 text-xs font-bold cursor-pointer gap-1.5"
            >
              <ImageIcon className="w-3 h-3 text-sky-500" />
              <span>Images &amp; AI Artwork ({imagesCount})</span>
            </Button>
          </div>

          {/* Asset List Grid */}
          <div className="flex-1 overflow-y-auto py-2 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[180px]">
            {filteredAssets.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-muted-foreground italic border border-dashed rounded-xl">
                No assets matching this filter.
              </div>
            ) : (
              filteredAssets.map((asset, idx) => (
                <div
                  key={asset.id || idx}
                  className="p-3 rounded-xl border border-border/70 bg-background/80 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-900 border border-border/80 flex items-center justify-center p-1.5 text-white shrink-0 overflow-hidden shadow-xs relative">
                      {asset.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.previewUrl}
                          alt={asset.name}
                          className="w-full h-full object-contain"
                        />
                      ) : asset.svgCode ? (
                        <div
                          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-current"
                          dangerouslySetInnerHTML={{ __html: asset.svgCode }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground truncate max-w-[140px]">
                          {asset.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 font-bold shrink-0 ${
                            asset.type === 'icon'
                              ? 'border-purple-500/30 text-purple-600 dark:text-purple-300 bg-purple-500/10'
                              : 'border-sky-500/30 text-sky-600 dark:text-sky-300 bg-sky-500/10'
                          }`}
                        >
                          {asset.type === 'icon' ? 'Icon' : 'Image'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                        {asset.title || asset.size || 'High-Res Asset'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadSingleAsset(asset, 'webp')}
                        className="h-7 text-[11px] px-2 text-purple-600 dark:text-purple-300 hover:text-purple-700 font-bold cursor-pointer"
                        title="Download as WebP"
                      >
                        WebP
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadSingleAsset(asset, 'png')}
                        className="h-7 text-[11px] px-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 font-bold cursor-pointer"
                        title="Download as PNG"
                      >
                        PNG
                      </Button>
                      {asset.type === 'icon' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleDownloadSingleAsset(asset, 'svg')
                          }
                          className="h-7 text-[11px] px-1.5 text-muted-foreground hover:text-foreground font-bold cursor-pointer"
                          title="Download as SVG"
                        >
                          SVG
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyAssetUrl(asset)}
                      className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                      title="Copy Image URL or Data URL to clipboard (easy bucket upload)"
                    >
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px] hidden sm:inline">
                        Copy URL
                      </span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="border-t border-border/50 pt-2 flex items-center justify-between sm:justify-between w-full">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Auto-Synchronized with Media Hub • Ready for Bucket Upload
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsIconsModalOpen(false)}
              className="h-7 text-xs cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HtmlDesignEnhancer;
