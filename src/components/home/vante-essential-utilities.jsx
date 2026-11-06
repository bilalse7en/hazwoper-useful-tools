'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { setupSafeWebGLCanvas } from '@/lib/webgl-utils';

// 14 Real, Production Essential Tools with clean metadata & descriptions
// Unified 1-color animated luxury theme (Electric Sky Cyan #38bdf8)
const THEME_ACCENT_HEX = '#38bdf8';
const THEME_ACCENT_RGB = [0.22, 0.74, 0.97];

export const ESSENTIAL_TOOLS = [
  {
    id: 'html-cleaner',
    slug: 'html-cleaner',
    name: 'HTML Cleaner',
    category: 'CODE UTILITY',
    desc: 'Clean, sanitize, and format messy HTML markup.',
    features: ['HTML5 Standard', 'Minify & Beautify', 'Live Preview'],
    iconType: 'code',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'image-converter',
    slug: 'image-converter',
    name: 'Image Converter',
    category: 'IMAGE UTILITY',
    desc: 'Convert raster & vector images across modern web formats.',
    features: ['WebP • PNG • JPG • AVIF', 'Lossless Quality', 'Batch Mode'],
    iconType: 'image',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'video-compressor',
    slug: 'video-compressor',
    name: 'Video Compressor',
    category: 'MEDIA OPTIMIZER',
    desc: 'Shrink video size dramatically while keeping high clarity.',
    features: ['H.264 / MP4 / WebM', 'Smart Bitrate', 'Up to 80% Reduction'],
    iconType: 'video',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'ai-assistant',
    slug: 'ai-assistant',
    name: 'AI Assistant',
    category: 'INTELLIGENCE SUITE',
    desc: 'Smart writing, content polishing, and instant summaries.',
    features: ['Context Analysis', 'Structured Output', 'High Accuracy'],
    iconType: 'ai',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'image-to-text',
    slug: 'image-to-text',
    name: 'Image to Text OCR',
    category: 'DOCUMENT OCR',
    desc: 'Extract editable text and tables from images and receipts.',
    features: ['Multi-Language OCR', 'Table Extraction', 'One-Click Copy'],
    iconType: 'ocr',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'video-converter',
    slug: 'video-converter',
    name: 'Video Converter',
    category: 'VIDEO ENCODER',
    desc: 'Transcode video clips seamlessly across modern containers.',
    features: ['MP4 • WebM • MKV', 'Multi-Stream', 'Lossless Audio'],
    iconType: 'repeat',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'audio-converter',
    slug: 'audio-converter',
    name: 'Audio Converter',
    category: 'AUDIO ENCODER',
    desc: 'Convert audio tracks between high-fidelity formats.',
    features: ['MP3 • WAV • AAC • FLAC', 'High Bitrate', 'Metadata Safe'],
    iconType: 'music',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'audio-editor',
    slug: 'audio-editor',
    name: 'Audio Editor',
    category: 'AUDIO STUDIO',
    desc: 'Trim, slice, amplify, and sculpt audio waveforms visually.',
    features: ['Waveform Scrubbing', 'Volume Normalizer', 'Direct Export'],
    iconType: 'waveform',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'video-to-gif',
    slug: 'video-to-gif',
    name: 'Video to GIF',
    category: 'ANIMATION STUDIO',
    desc: 'Create smooth, lightweight animated GIFs from video clips.',
    features: ['Smooth 30 FPS', 'Adaptive Palette', 'Custom Scaling'],
    iconType: 'gif',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'word-to-html',
    slug: 'word-to-html',
    name: 'Word to HTML',
    category: 'DOCUMENT PARSER',
    desc: 'Transform Word DOCX documents into clean, semantic HTML.',
    features: ['Semantic Headings', 'Table Conversion', 'Zero Style Bloat'],
    iconType: 'docx',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'youtube-downloader',
    slug: 'youtube-downloader',
    name: 'Social Video Downloader',
    category: 'MEDIA HARVESTER',
    desc: 'Download high-definition public videos directly via web links.',
    features: ['Full HD Resolution', 'Audio Extraction', 'Direct Stream'],
    iconType: 'download',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'watermark-remover',
    slug: 'watermark-remover',
    name: 'Watermark Remover',
    category: 'AI RETOUCH',
    desc: 'Erase unwanted logos, stamps, and objects seamlessly.',
    features: ['Smart Inpainting', 'Edge Preservation', 'High-Res Output'],
    iconType: 'wand',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'bg-remover',
    slug: 'bg-remover',
    name: 'Background Remover',
    category: 'ALPHA MATTING',
    desc: 'Isolate subjects with precise edge detection and export PNG.',
    features: ['AI Alpha Matting', 'Hair-Fine Precision', 'Transparent PNG'],
    iconType: 'scissors',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
  {
    id: 'ai-video-shorts',
    slug: 'ai-video-shorts',
    name: 'AI Video to Shorts',
    category: 'CREATOR STUDIO',
    desc: 'Convert landscape footage into 9:16 vertical short clips.',
    features: ['9:16 Portrait Framing', 'Auto Captions', 'Audio Normalizer'],
    iconType: 'shorts',
    color: THEME_ACCENT_HEX,
    rgb: THEME_ACCENT_RGB,
  },
];

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const out = (t) => 1 - Math.pow(1 - t, 3);
const span = (p, a, b) => clamp((p - a) / (b - a));

// Draw crisp, professional vector line art on canvas (NO cheap emojis)
function drawToolVectorIcon(ctx, iconType, cx, cy, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (iconType) {
    case 'code':
      // < / >
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 12);
      ctx.lineTo(cx - 18, cy);
      ctx.lineTo(cx - 8, cy + 12);
      ctx.moveTo(cx + 8, cy - 12);
      ctx.lineTo(cx + 18, cy);
      ctx.lineTo(cx + 8, cy + 12);
      ctx.moveTo(cx + 5, cy - 14);
      ctx.lineTo(cx - 5, cy + 14);
      ctx.stroke();
      break;

    case 'image':
      // Frame with mountain and sun
      ctx.beginPath();
      ctx.roundRect(cx - 18, cy - 14, 36, 28, [5]);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 10);
      ctx.lineTo(cx - 4, cy);
      ctx.lineTo(cx + 5, cy + 7);
      ctx.lineTo(cx + 11, cy + 2);
      ctx.lineTo(cx + 14, cy + 10);
      ctx.stroke();
      break;

    case 'video':
      // Video camera
      ctx.beginPath();
      ctx.roundRect(cx - 18, cy - 12, 24, 24, [5]);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 9, cy - 7);
      ctx.lineTo(cx + 19, cy - 11);
      ctx.lineTo(cx + 19, cy + 11);
      ctx.lineTo(cx + 9, cy + 7);
      ctx.closePath();
      ctx.fill();
      break;

    case 'ai':
      // 4-point sparkle star
      ctx.beginPath();
      ctx.moveTo(cx, cy - 18);
      ctx.quadraticCurveTo(cx, cy, cx + 18, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + 18);
      ctx.quadraticCurveTo(cx, cy, cx - 18, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - 18);
      ctx.closePath();
      ctx.fill();
      break;

    case 'ocr':
      // Text document
      ctx.beginPath();
      ctx.roundRect(cx - 14, cy - 18, 28, 36, [4]);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 8);
      ctx.lineTo(cx + 8, cy - 8);
      ctx.moveTo(cx - 8, cy);
      ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx - 8, cy + 8);
      ctx.lineTo(cx + 2, cy + 8);
      ctx.stroke();
      break;

    case 'repeat':
      // Cycle arrows
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0.3, Math.PI * 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 13, cy - 5);
      ctx.lineTo(cx + 13, cy + 2);
      ctx.lineTo(cx + 6, cy + 2);
      ctx.stroke();
      break;

    case 'music':
      // Music note
      ctx.beginPath();
      ctx.arc(cx - 7, cy + 7, 5, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy + 7);
      ctx.lineTo(cx - 2, cy - 12);
      ctx.lineTo(cx + 13, cy - 15);
      ctx.lineTo(cx + 13, cy + 4);
      ctx.stroke();
      break;

    case 'waveform':
      // Audio bars
      [-12, -5, 2, 9, 16].forEach((xOff, idx) => {
        const barH = [12, 24, 30, 20, 14][idx];
        ctx.beginPath();
        ctx.roundRect(cx + xOff - 4, cy - barH / 2, 3.5, barH, [2]);
        ctx.fill();
      });
      break;

    case 'gif':
      // GIF letters badge
      ctx.beginPath();
      ctx.roundRect(cx - 18, cy - 13, 36, 26, [5]);
      ctx.stroke();
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GIF', cx, cy + 1);
      break;

    case 'docx':
      // Document with DOC tag
      ctx.beginPath();
      ctx.roundRect(cx - 14, cy - 18, 28, 36, [4]);
      ctx.stroke();
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DOC', cx, cy + 1);
      break;

    case 'download':
      // Download arrow into tray
      ctx.beginPath();
      ctx.moveTo(cx, cy - 12);
      ctx.lineTo(cx, cy + 6);
      ctx.moveTo(cx - 7, cy);
      ctx.lineTo(cx, cy + 7);
      ctx.lineTo(cx + 7, cy);
      ctx.moveTo(cx - 14, cy + 13);
      ctx.lineTo(cx + 14, cy + 13);
      ctx.stroke();
      break;

    case 'wand':
      // Magic wand with spark
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 12);
      ctx.lineTo(cx + 8, cy - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 14, cy - 14, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'scissors':
      // Cutting scissors
      ctx.beginPath();
      ctx.arc(cx - 8, cy + 8, 4.5, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy + 8, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 4);
      ctx.lineTo(cx + 10, cy - 12);
      ctx.moveTo(cx + 4, cy + 4);
      ctx.lineTo(cx - 10, cy - 12);
      ctx.stroke();
      break;

    case 'shorts':
      // 9:16 portrait frame
      ctx.beginPath();
      ctx.roundRect(cx - 11, cy - 17, 22, 34, [4]);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 4);
      ctx.lineTo(cx + 4, cy);
      ctx.lineTo(cx - 3, cy + 4);
      ctx.closePath();
      ctx.fill();
      break;

    default:
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.stroke();
  }
  ctx.restore();
}

// Generate ultra-crisp, enterprise-grade, high-contrast 1-color animated card textures
// Compact, streamlined layout with large category heading, zero bloat, and tight padding
function createCardCanvas(tool, isDark) {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 560; // Sleek 1.78 aspect ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const radius = 34;

  ctx.clearRect(0, 0, w, h);

  // Rounded card base path
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, [radius]);
  ctx.clip();

  // Premium layered frosted glass background (Pristine, clean — NO inside glow!)
  if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0c1322');
    bgGrad.addColorStop(1, '#040711');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Refined frosted border perimeter
  ctx.lineWidth = 3;
  ctx.strokeStyle = isDark
    ? 'rgba(255, 255, 255, 0.16)'
    : 'rgba(15, 23, 42, 0.12)';
  ctx.stroke();

  // Top specular glass edge reflection in cyan
  ctx.beginPath();
  ctx.moveTo(radius, 2.5);
  ctx.lineTo(w - radius, 2.5);
  ctx.lineWidth = 2.5;
  const topSheen = ctx.createLinearGradient(0, 0, w, 0);
  topSheen.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  topSheen.addColorStop(
    0.3,
    isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.95)'
  );
  topSheen.addColorStop(0.7, 'rgba(56, 189, 248, 0.7)');
  topSheen.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.strokeStyle = topSheen;
  ctx.stroke();

  // 1. Icon Box (72x72) with less top space
  const iconX = 46;
  const iconY = 32;
  const iconSize = 72;
  const iconR = 20;

  ctx.beginPath();
  ctx.roundRect(iconX, iconY, iconSize, iconSize, [iconR]);
  ctx.fillStyle = isDark
    ? 'rgba(56, 189, 248, 0.1)'
    : 'rgba(14, 165, 233, 0.08)';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = isDark
    ? 'rgba(56, 189, 248, 0.35)'
    : 'rgba(14, 165, 233, 0.3)';
  ctx.stroke();

  // Draw clean vector icon in unified cyan
  const accentIconColor = isDark ? '#38bdf8' : '#0284c7';
  drawToolVectorIcon(
    ctx,
    tool.iconType,
    iconX + iconSize / 2,
    iconY + iconSize / 2,
    accentIconColor
  );

  // 2. Large Category Heading (Bigger, bold, centered with icon - ONLINE MODULE REMOVED!)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font =
    "900 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.fillText(
    tool.category.toUpperCase(),
    iconX + iconSize + 22,
    iconY + iconSize * 0.5
  );

  // 3. Top-Right Action Pill (↗)
  const arrowCx = w - 54;
  const arrowCy = iconY + iconSize * 0.5;
  const arrowR = 26;

  ctx.beginPath();
  ctx.arc(arrowCx, arrowCy, arrowR, 0, Math.PI * 2);
  ctx.fillStyle = isDark
    ? 'rgba(255, 255, 255, 0.07)'
    : 'rgba(15, 23, 42, 0.05)';
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = isDark
    ? 'rgba(255, 255, 255, 0.18)'
    : 'rgba(15, 23, 42, 0.14)';
  ctx.stroke();

  // Diagonal arrow ↗
  ctx.beginPath();
  ctx.moveTo(arrowCx - 7, arrowCy + 7);
  ctx.lineTo(arrowCx + 6, arrowCy - 6);
  ctx.moveTo(arrowCx - 1, arrowCy - 6);
  ctx.lineTo(arrowCx + 6, arrowCy - 6);
  ctx.lineTo(arrowCx + 6, arrowCy + 1);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isDark ? '#f8fafc' : '#0f172a';
  ctx.stroke();

  // 4. Tool Title (Bold, crisp, positioned with less space above)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font =
    "900 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  const displayTitle =
    tool.name.length > 24 ? tool.name.slice(0, 22) + '...' : tool.name;
  ctx.fillText(displayTitle, 46, 160);

  // 5. Tool Description (High-contrast, 30px medium)
  ctx.font =
    "500 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
  ctx.fillText(tool.desc, 46, 218);

  // 6. Bottom Action Button (Tightly positioned with less space there)
  const btnW = 230;
  const btnH = 62;
  const btnX = w - 46 - btnW;
  const btnY = h - 34 - btnH;

  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, [16]);
  ctx.fillStyle = isDark
    ? 'rgba(56, 189, 248, 0.14)'
    : 'rgba(14, 165, 233, 0.12)';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = isDark
    ? 'rgba(56, 189, 248, 0.5)'
    : 'rgba(14, 165, 233, 0.45)';
  ctx.stroke();

  ctx.font =
    "800 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.fillText('Launch Tool →', btnX + 34, btnY + 40);

  return canvas;
}

// Generate interactive 3D flipped card back texture (Reveals on hover)
function createCardBackCanvas(tool, isDark) {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const radius = 34;

  ctx.clearRect(0, 0, w, h);

  // Rounded card base path
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, [radius]);
  ctx.clip();

  // Premium clean frosted glass background (NO inside glow!)
  if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0c1322');
    bgGrad.addColorStop(1, '#040711');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Refined frosted border perimeter
  ctx.lineWidth = 3;
  ctx.strokeStyle = isDark
    ? 'rgba(56, 189, 248, 0.4)'
    : 'rgba(14, 165, 233, 0.35)';
  ctx.stroke();

  // Top specular glass edge reflection
  ctx.beginPath();
  ctx.moveTo(radius, 2.5);
  ctx.lineTo(w - radius, 2.5);
  ctx.lineWidth = 2.5;
  const topSheen = ctx.createLinearGradient(0, 0, w, 0);
  topSheen.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  topSheen.addColorStop(
    0.5,
    isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(14, 165, 233, 0.6)'
  );
  topSheen.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.strokeStyle = topSheen;
  ctx.stroke();

  // 1. Centered Icon Box
  const iconSize = 88;
  const iconX = w / 2 - iconSize / 2;
  const iconY = 80;
  const iconR = 24;

  ctx.beginPath();
  ctx.roundRect(iconX, iconY, iconSize, iconSize, [iconR]);
  ctx.fillStyle = isDark
    ? 'rgba(56, 189, 248, 0.12)'
    : 'rgba(14, 165, 233, 0.08)';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = isDark
    ? 'rgba(56, 189, 248, 0.45)'
    : 'rgba(14, 165, 233, 0.35)';
  ctx.stroke();

  const accentIconColor = isDark ? '#38bdf8' : '#0284c7';
  drawToolVectorIcon(
    ctx,
    tool.iconType,
    w / 2,
    iconY + iconSize / 2,
    accentIconColor
  );

  // 2. Category Tag
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font =
    "800 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.fillText(tool.category.toUpperCase(), w / 2, 225);

  // 3. Tool Title (Bold & prominent!)
  ctx.font =
    "900 54px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  const displayTitle =
    tool.name.length > 24 ? tool.name.slice(0, 22) + '...' : tool.name;
  ctx.fillText(displayTitle, w / 2, 305);

  // 4. Centered Interactive Action Pill: "Click to Open ↗"
  const pillW = 320;
  const pillH = 72;
  const pillX = w / 2 - pillW / 2;
  const pillY = 380;
  const pillR = 22;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, [pillR]);
  ctx.fillStyle = isDark
    ? 'rgba(56, 189, 248, 0.18)'
    : 'rgba(14, 165, 233, 0.14)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.stroke();

  ctx.font =
    "900 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.textBaseline = 'middle';
  ctx.fillText('Click to Open ↗', w / 2, pillY + pillH / 2);

  return canvas;
}

export function VanteEssentialUtilities({ user, isGuest }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'nebula';

  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const ruleRef = useRef(null);
  const crossRef = useRef(null);
  const l1Ref = useRef(null);
  const l2Ref = useRef(null);
  const capRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!canvas || !stage || !track) return;

    // Three.js Setup
    setupSafeWebGLCanvas(canvas);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.debug.checkShaderErrors = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0, 0); // Transparent so sky stars drift through
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const FOV = 35;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    // Ribbon spline trajectory from Vante
    let path;
    let PATH_L = 1;
    const SAMPLES = 1200;
    const pathP = [];
    const pathT = [];
    const PH0 = -1.5;
    const PH1 = Math.PI * 2 + 1.35;

    function buildPath() {
      const pts = [];
      for (let i = 0; i <= 160; i++) {
        const t = i / 160;
        const ph = mix(PH0, PH1, t);
        const cs = Math.cos(ph);
        const u = 2 * t - 1;
        const depth = cs > 0 ? 7.6 + 16.4 * Math.pow(cs, 0.9) : 7.6 + 2.2 * cs;
        const edge =
          0.84 + 0.5 * span(0.14 - t, 0, 0.14) + 0.8 * span(t, 0.84, 1);
        pts.push(
          new THREE.Vector3(
            edge * Math.sin(ph) * depth * 0.561,
            0.5 * Math.sign(u) * Math.pow(Math.abs(u), 1.4) * depth * 0.63,
            -depth
          )
        );
      }
      path = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      path.arcLengthDivisions = 1500;
      PATH_L = path.getLength();
      pathP.length = 0;
      pathT.length = 0;
      for (let i = 0; i <= SAMPLES; i++) {
        const u = i / SAMPLES;
        pathP.push(path.getPointAt(u));
        pathT.push(path.getTangentAt(u));
      }
    }

    const at = (s, op, ot) => {
      const f = clamp(s / PATH_L) * SAMPLES;
      const i = Math.min(SAMPLES - 1, Math.floor(f));
      const k = f - i;
      if (!pathP[i] || !pathP[i + 1]) return;
      op.lerpVectors(pathP[i], pathP[i + 1], k);
      ot.lerpVectors(pathT[i], pathT[i + 1], k).normalize();
    };

    // Card dimensions & geometry (Proportional 1.78 aspect ratio)
    const CARD_W = 1.95;
    const CARD_H = 1.09;
    const GAP = 0.025;
    const STEP = CARD_W + GAP;
    const NX = 28;
    const NY = 3;

    const vs = `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Clean, crisp, high-contrast frosted glass shader with dual-sided hover flip
    const fs = `
      uniform sampler2D mapFront;
      uniform sampler2D mapBack;
      uniform vec2 cover;
      uniform float aspect, ready, radius;
      uniform vec3 accentColor;
      uniform float isDark;
      uniform float time;
      varying vec2 vUv;

      void main(){
        // Exact rounded card field
        vec2 q = (abs(vUv - 0.5) - 0.5) * vec2(aspect, 1.0) + radius;
        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
        float px = fwidth(d), a = 1.0 - smoothstep(-px, px, d);
        if(a < 0.01) discard;

        vec2 uv = vUv;
        vec3 texCol;
        if (gl_FrontFacing) {
          texCol = texture2D(mapFront, (uv - 0.5) * cover + 0.5).rgb;
        } else {
          // Un-mirror horizontally so card back text & icons are perfectly legible!
          uv.x = 1.0 - uv.x;
          texCol = texture2D(mapBack, (uv - 0.5) * cover + 0.5).rgb;
        }

        // Clean frosted glass border perimeter (NO inside glow/caustic wash!)
        float edge = smoothstep(-0.016 - px, -0.016, d);
        float pulse = 0.85 + 0.15 * sin(time * 1.5 + uv.x * 3.14159);
        vec3 rim = accentColor * pulse;

        vec3 finalColor = mix(texCol, rim, edge * 0.45);

        gl_FragColor = vec4(finalColor, a);
      }
    `;

    // Initialize cards with high-definition anisotropic textures
    const maxAniso = renderer.capabilities
      ? renderer.capabilities.getMaxAnisotropy()
      : 8;

    const cards = ESSENTIAL_TOOLS.map((tool, i) => {
      const frontCanvas = createCardCanvas(tool, isDark);
      const backCanvas = createCardBackCanvas(tool, isDark);

      const texFront = new THREE.CanvasTexture(frontCanvas);
      texFront.colorSpace = THREE.SRGBColorSpace;
      texFront.generateMipmaps = true;
      texFront.minFilter = THREE.LinearMipmapLinearFilter;
      texFront.magFilter = THREE.LinearFilter;
      texFront.anisotropy = Math.min(maxAniso, 16);

      const texBack = new THREE.CanvasTexture(backCanvas);
      texBack.colorSpace = THREE.SRGBColorSpace;
      texBack.generateMipmaps = true;
      texBack.minFilter = THREE.LinearMipmapLinearFilter;
      texBack.magFilter = THREE.LinearFilter;
      texBack.anisotropy = Math.min(maxAniso, 16);

      const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
      const mat = new THREE.ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          mapFront: { value: texFront },
          mapBack: { value: texBack },
          cover: { value: new THREE.Vector2(1, 1) },
          aspect: { value: CARD_W / CARD_H },
          ready: { value: 1.0 },
          radius: { value: 0.018 },
          accentColor: { value: new THREE.Vector3(...tool.rgb) },
          isDark: { value: isDark ? 1.0 : 0.0 },
          time: { value: 0.0 },
        },
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);

      return {
        i,
        tool,
        title: tool.name,
        slug: tool.slug,
        texFront,
        texBack,
        geo,
        mat,
        mesh,
        rect: null,
        flip: 0,
        targetFlip: 0,
        lift: 0,
        targetLift: 0,
        idlePhase: i * 0.73 + (i % 3) * 1.1,
        idleSpeed: 0.65 + (i % 4) * 0.15,
      };
    });

    // Responsive layout calculations
    const GZ = 8;
    let W = 1;
    let H = 1;
    let asp = 1;
    let cols = 5;
    let rows = 3;
    let tanH = 0.3153;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      asp = W / H;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(W, H, false);

      camera.aspect = asp;
      camera.fov =
        asp < 16 / 9 ? (Math.atan(0.561 / asp) * 360) / Math.PI : FOV;
      camera.updateProjectionMatrix();

      tanH = Math.tan((camera.fov * Math.PI) / 360);
      cols = asp < 0.85 ? 2 : asp < 1.25 ? 3 : 5;
      rows = Math.ceil(cards.length / cols);
    }

    window.addEventListener('resize', resize);
    resize();
    buildPath();

    function grid(i) {
      const vh = 2 * GZ * tanH;
      const vw = vh * asp;

      // Safe bounds budget: max 90% width, max 68% height to guarantee zero vertical cutoff on 1920x1080 and laptops
      const maxW = vw * (cols >= 5 ? 0.9 : 0.86);
      const maxH = vh * 0.68;

      const targetAspect = CARD_W / CARD_H; // 1.788
      const gapRatio = 0.01;

      // Calculate candidate card size from width budget
      let cw = maxW / (cols + gapRatio * (cols - 1));
      let ch = cw / targetAspect;
      let gap = cw * gapRatio;

      // If resulting grid height exceeds maxH, scale down cw & ch to fit viewport height perfectly!
      const totalH = ch * rows + gap * (rows - 1);
      if (totalH > maxH) {
        const factor = maxH / totalH;
        cw *= factor;
        ch *= factor;
        gap *= factor;
      }

      const gw = cw * cols + gap * (cols - 1);
      const gh = ch * rows + gap * (rows - 1);

      const c = i % cols;
      const r = Math.floor(i / cols);

      return {
        x: -gw / 2 + cw / 2 + c * (cw + gap),
        y: gh / 2 - ch / 2 - r * (ch + gap) - 0.03,
        w: cw,
        h: ch,
        vw,
        vh,
        c,
        r,
      };
    }

    // Scroll reading loop
    let target = 0;
    let p = 0;

    const readScroll = () => {
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const maxScroll = rect.height - window.innerHeight;
      if (maxScroll <= 0) return;
      target = clamp(-rect.top / maxScroll, 0, 1);
    };

    window.addEventListener('scroll', readScroll, { passive: true });
    readScroll();

    // Spline pose math
    const op = new THREE.Vector3();
    const ot = new THREE.Vector3();
    const up = new THREE.Vector3();
    const Y = new THREE.Vector3(0, 1, 0);
    const vp = new THREE.Vector3();

    function poseRibbon(c, head) {
      const pos = c.geo.attributes.position;
      const centre = head - c.i * STEP;
      for (let iy = 0; iy <= NY; iy++) {
        for (let ix = 0; ix <= NX; ix++) {
          const k = iy * (NX + 1) + ix;
          const lu = ix / NX - 0.5;
          const lv = 0.5 - iy / NY;
          at(centre + lu * CARD_W, op, ot);
          up.copy(Y).addScaledVector(ot, -Y.dot(ot)).normalize();
          vp.copy(op).addScaledVector(up, lv * CARD_H);
          pos.setXYZ(k, vp.x, vp.y, vp.z);
        }
      }
      pos.needsUpdate = true;
    }

    function poseGrid(c, q, tNow = 0) {
      const g = grid(c.i);
      const pos = c.geo.attributes.position;
      const dx = (g.c - (cols - 1) / 2) * 1.2;
      const dy = g.r < rows / 2 ? 1 : -1;
      const ox = dx * g.vw * 0.62 * (1 - q);
      const oy = dy * g.vh * (g.c === 1 ? 0.95 : 0.34) * (1 - q);
      const tilt = (1 - q) * 0.22 * (g.c - 1 || 0.5) * dy;

      const cs = Math.cos(tilt);
      const sn = Math.sin(tilt);

      // Gentle, non-disruptive idle micro-floating and harmonic tilt when settled in grid
      const idleZ = q * Math.sin(tNow * c.idleSpeed + c.idlePhase) * 0.035;
      const idleRotX =
        q * Math.sin(tNow * (c.idleSpeed * 0.8) + c.idlePhase + 1.0) * 0.022;
      const idleRotY =
        q * Math.cos(tNow * (c.idleSpeed * 0.9) + c.idlePhase) * 0.028;

      // 3D Euler flip rotation around Y-axis + hover lift
      const rotY = idleRotY + c.flip;
      const rotX = idleRotX;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      for (let iy = 0; iy <= NY; iy++) {
        for (let ix = 0; ix <= NX; ix++) {
          const k = iy * (NX + 1) + ix;
          const lx = (ix / NX - 0.5) * g.w;
          const ly = (0.5 - iy / NY) * g.h;
          const lz = 0;

          // Rotate X
          const y1 = ly * cosX - lz * sinX;
          const z1 = ly * sinX + lz * cosX;

          // Rotate Y (Flip)
          const x2 = lx * cosY + z1 * sinY;
          const z2 = -lx * sinY + z1 * cosY;

          const curlZ = -(1 - q) * 0.6 * Math.sin((ix / NX) * Math.PI);
          const finalZ = -GZ + c.lift + idleZ + z2 + curlZ;
          const finalX = g.x + ox + x2 * cs - y1 * sn;
          const finalY = g.y + oy + x2 * sn + y1 * cs;

          pos.setXYZ(k, finalX, finalY, finalZ);
        }
      }
      pos.needsUpdate = true;
      c.rect = g;
    }

    const RIB_A = 0.14;
    const RIB_B = 0.63;

    function render(tNow = 0) {
      const pp = p;

      // Kinetic typography: headline slides across from opposite directions
      const rise = 1 - out(span(pp, 0, 0.12));
      const run = mix(-52, 74, span(pp, 0, 0.58));

      // KEEP FULLY VISIBLE & READABLE while scrolling, and smoothly release when cards settle into grid!
      const headlineOpacity = 1 - span(pp, 0.48, 0.6);
      const isHeadlineVisible = headlineOpacity > 0.001;

      if (l1Ref.current) {
        l1Ref.current.style.transform = `translate3d(${run}vw, ${rise * 34}vh, 0)`;
        l1Ref.current.style.opacity = headlineOpacity;
        l1Ref.current.style.visibility = isHeadlineVisible
          ? 'visible'
          : 'hidden';
        l1Ref.current.style.display = isHeadlineVisible ? 'block' : 'none';
      }
      if (l2Ref.current) {
        l2Ref.current.style.transform = `translate3d(${-run}vw, ${rise * 34}vh, 0)`;
        l2Ref.current.style.opacity = headlineOpacity;
        l2Ref.current.style.visibility = isHeadlineVisible
          ? 'visible'
          : 'hidden';
        l2Ref.current.style.display = isHeadlineVisible ? 'block' : 'none';
      }

      // Middle Subtitle: stays readable, fading out smoothly between 0.48 and 0.58
      if (capRef.current) {
        const capA = 1 - span(pp, 0.48, 0.58);
        const isCapVisible = capA > 0.001;
        capRef.current.style.opacity = capA;
        capRef.current.style.transform = `translate(-50%, calc(-50% + ${rise * 34}vh))`;
        capRef.current.style.visibility = isCapVisible ? 'visible' : 'hidden';
        capRef.current.style.display = isCapVisible ? 'block' : 'none';
      }

      // Expanding rule line & crosshair
      if (ruleRef.current) {
        ruleRef.current.style.transform = `scaleX(${ease(span(pp, 0.72, 0.86))})`;
      }
      if (crossRef.current) {
        crossRef.current.style.opacity = ease(span(pp, 0.7, 0.85));
      }

      // 3D Ribbon and Grid Transitions
      const pr = span(pp, RIB_A, RIB_B);
      const head = mix(0, PATH_L + cards.length * STEP, pr);

      for (const c of cards) {
        const s = head - c.i * STEP;
        const end = PATH_L - CARD_W;

        if (s < end) {
          c.mesh.visible = s > CARD_W;
          c.rect = null;
          if (c.mesh.visible) poseRibbon(c, head);
        } else if (c.i < cards.length) {
          const st = mix(
            RIB_A,
            RIB_B,
            (end + c.i * STEP) / (PATH_L + cards.length * STEP)
          );
          const q = out(span(pp, st, st + 0.13));
          c.mesh.visible = q > 0.001;
          if (c.mesh.visible) poseGrid(c, q, tNow);
        } else {
          c.mesh.visible = false;
          c.rect = null;
        }
      }

      renderer.render(scene, camera);
    }

    // Pointer move for card hover, 3D flip trigger, & tooltip
    const handlePointerMove = (e) => {
      let hit = null;
      if (p > 0.85) {
        const nx = e.clientX / W - 0.5;
        const ny = 0.5 - e.clientY / H;
        for (const c of cards) {
          const g = c.rect;
          if (!g) continue;
          const x = nx * g.vw;
          const y = ny * g.vh;
          if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) {
            hit = c;
            break;
          }
        }
      }

      // 3D Flip targeted card to back face on hover
      for (const c of cards) {
        if (c === hit) {
          c.targetFlip = Math.PI; // Flip 180° around Y
          c.targetLift = 0.42; // Lift forward towards camera
        } else {
          c.targetFlip = 0.0;
          c.targetLift = 0.0;
        }
      }

      stage.style.cursor = hit ? 'pointer' : 'default';
    };

    // Pointer leave: smoothly flip all cards back to front
    const handlePointerLeave = () => {
      for (const c of cards) {
        c.targetFlip = 0.0;
        c.targetLift = 0.0;
      }
      stage.style.cursor = 'default';
    };

    // Click handler to open tool
    const handleClick = (e) => {
      if (p > 0.85) {
        const nx = e.clientX / W - 0.5;
        const ny = 0.5 - e.clientY / H;
        for (const c of cards) {
          const g = c.rect;
          if (!g) continue;
          const x = nx * g.vw;
          const y = ny * g.vh;
          if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) {
            router.push(`/tools/${c.slug}`);
            break;
          }
        }
      }
    };

    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerleave', handlePointerLeave);
    stage.addEventListener('click', handleClick);

    // 60FPS RAF Momentum Loop with Viewport Visibility Optimization
    let animId = null;
    let isVisible = true;

    const startLoop = () => {
      if (!animId && isVisible) {
        animId = requestAnimationFrame(loop);
      }
    };

    const stopLoop = () => {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          startLoop();
        } else if (!isVisible && wasVisible) {
          stopLoop();
        }
      },
      { rootMargin: '350px' }
    );
    observer.observe(track);

    function loop() {
      if (!isVisible) {
        animId = null;
        return;
      }
      animId = requestAnimationFrame(loop);

      p += (target - p) * 0.09;
      if (Math.abs(target - p) < 0.00005) p = target;

      const tNow = performance.now() * 0.001;
      for (const c of cards) {
        if (c.mat && c.mat.uniforms && c.mat.uniforms.time) {
          c.mat.uniforms.time.value = tNow;
        }
        // Smoothly interpolate 3D flip angle & camera lift
        c.flip += (c.targetFlip - c.flip) * 0.12;
        c.lift += (c.targetLift - c.lift) * 0.12;
      }

      render(tNow);
    }
    loop();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', readScroll);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', handlePointerLeave);
      stage.removeEventListener('click', handleClick);
      if (animId) cancelAnimationFrame(animId);
      renderer.dispose();
      cards.forEach((c) => {
        c.geo.dispose();
        c.mat.dispose();
        if (c.texFront) c.texFront.dispose();
        if (c.texBack) c.texBack.dispose();
      });
    };
  }, [isDark, router]);

  return (
    <div
      id={isGuest ? 'free-tools' : 'all-tools'}
      ref={trackRef}
      className="relative w-full"
      style={{ height: '650vh' }}
    >
      <style>{`
        .vante-hl {
          position: absolute;
          left: 0;
          right: 0;
          font-weight: 900;
          font-size: clamp(52px, 8.8vw, 140px);
          line-height: 1;
          letter-spacing: -0.055em;
          white-space: nowrap;
          text-align: center;
          will-change: transform, opacity;
          pointer-events: none;
          z-index: 1;
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }
        #vante-l1 {
          top: calc(50% - 0.98em);
        }
        #vante-l2 {
          top: calc(50% + 0.03em);
        }
        #vante-l1 span {
          margin-right: 15vw;
          display: inline-block;
        }
        #vante-l2 span {
          margin-left: 15vw;
          display: inline-block;
        }
        #vante-cap {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: auto;
          max-width: 95vw;
          white-space: nowrap;
          text-align: center;
          font-size: clamp(10px, 0.85vw, 13.5px);
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          pointer-events: none;
          z-index: 1;
          will-change: transform, opacity;
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }
      `}</style>

      {/* Pinned Viewport Stage: Background freezes while page scroll drives animation */}
      <main
        ref={stageRef}
        className="sticky top-0 h-screen w-full overflow-hidden select-none"
        style={{
          background: 'transparent',
        }}
      >
        {/* Kinetic Headline: Slides in opposite directions as in Vante (Behind Canvas at z-1) */}
        <h1 aria-label="Essential Utilities">
          <div
            ref={l1Ref}
            id="vante-l1"
            className="vante-hl text-foreground drop-shadow-md"
            aria-hidden="true"
          >
            <span>{isGuest ? 'FREE' : 'ESSENTIAL'}</span>
          </div>
          <div
            ref={l2Ref}
            id="vante-l2"
            className="vante-hl text-primary bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 drop-shadow-md"
            aria-hidden="true"
          >
            <span>{isGuest ? 'ONLINE TOOLS' : 'UTILITIES'}</span>
          </div>
        </h1>

        {/* Center Subtitle: Placed strictly BEHIND the 3D animated cards (z-1) */}
        <div
          ref={capRef}
          id="vante-cap"
          className="text-foreground/90 font-mono tracking-wider drop-shadow-xs"
        >
          {isGuest
            ? 'Powerful browser-based tools — zero installation required.'
            : 'Universal tools available for all registered identity profiles.'}
        </div>

        {/* Vante Ambient Glow Header Gradient */}
        <div
          className="absolute left-0 right-0 top-0 h-[40%] pointer-events-none z-0"
          style={{
            background:
              'linear-gradient(rgba(56, 189, 248, 0.08), rgba(56, 189, 248, 0))',
          }}
        />

        {/* Vante Expanding Horizontal Rule */}
        <div
          ref={ruleRef}
          className="absolute left-[3.5vw] right-[3.5vw] top-1/2 h-px bg-border/80 pointer-events-none z-[1] transition-transform origin-left"
          style={{ transform: 'scaleX(0)' }}
        />

        {/* Vante Central Crosshair */}
        <div
          ref={crossRef}
          className="absolute left-[3.5vw] right-[3.5vw] top-[37.5%] h-px bg-border/60 pointer-events-none z-[1] opacity-0"
        >
          <i className="absolute left-1/2 -top-[0.62em] -ml-[0.3em] font-mono text-xs text-muted-foreground bg-background px-1 not-italic">
            +
          </i>
        </div>

        {/* Three.js WebGL Canvas for 3D Ribbon & Grid Engine (Elevated at z-10 so cards are always in front of text!) */}
        <canvas
          ref={canvasRef}
          id="gl"
          className="absolute inset-0 w-full h-full block z-10 pointer-events-auto"
          style={{ zIndex: 10 }}
        />

        {/* Top Ornamentation Bar from Vante */}
        <header className="absolute left-6 right-6 top-6 sm:left-10 sm:right-10 flex items-center justify-between text-xs font-mono tracking-wider z-30 pointer-events-none">
          <div className="flex items-center gap-2 font-bold tracking-widest text-foreground">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span>ALL USEFUL TOOLS</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-muted-foreground">
              ONLINE PRODUCTIVITY SUITE
            </span>
            <Badge
              variant="outline"
              className="bg-background/80 backdrop-blur-md border-border font-mono text-[10px]"
            >
              14 TOOLS
            </Badge>
          </div>
        </header>
      </main>
    </div>
  );
}
