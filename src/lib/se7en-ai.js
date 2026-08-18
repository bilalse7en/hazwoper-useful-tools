'use client';

import { toolInfo } from '@/lib/seo';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export const SE7EN_LOGO_SRC =
  'https://gyglsbmpxopaoeljoofp.supabase.co/storage/v1/object/public/media/library/1779796669800-Hi.gif';

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', tag: 'Fast & Versatile', pro: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Ultra Fast', pro: false },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    tag: 'Deep Reasoning',
    pro: true,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek R1 / V3',
    tag: 'Coding & Logic',
    pro: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    tag: 'High Speed',
    pro: false,
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    tag: 'Technical',
    pro: false,
  },
];

/**
 * Robust Puter.js AI caller with automatic fallback models
 */
export async function callPuterAiChat(prompt, requestedModel = 'gpt-4o') {
  if (typeof window === 'undefined' || !window.puter?.ai?.chat) {
    throw new Error('Puter AI Engine is initializing. Please wait a moment.');
  }

  const fallbackChain = [
    requestedModel,
    'gpt-4o',
    'gpt-4o-mini',
    'claude-3-7-sonnet',
    'deepseek-chat',
  ];

  let lastError = null;

  for (const model of fallbackChain) {
    try {
      const response = await window.puter.ai.chat(prompt, { model });
      if (typeof response === 'string') return response;
      if (response?.message?.content) return response.message.content;
      if (response?.text) return response.text;
      if (response) return JSON.stringify(response, null, 2);
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed, trying fallback...`, err?.message);
    }
  }

  throw lastError || new Error('All AI models failed to respond.');
}

const TOOL_CATALOG = Object.entries(toolInfo)
  .map(
    ([slug, info]) => `- **${info.name}** (/tools/${slug}): ${info.description}`
  )
  .join('\n');

export const SE7EN_SYSTEM_PROMPT = `You are "Se7eN AI", the Master Super-Intelligence and Pro AI Architect of "All Useful Tools", crafted by Bilal Se7eN.

YOUR IDENTITY & CAPABILITIES:
- Name: Se7eN AI
- Master Creator: Bilal Se7eN
- Core Superpowers:
  1. Live Web Scraping & URL Data Mining: Extract and convert content from any external web URL into clean JSON, XML, CSV, Markdown, or YAML.
  2. Exact Image & Document Enhancement: When a user gives an image to enhance or modify, PRESERVE the exact person, subject, and composition, applying sharpness, clarity, lighting, and requested adjustments to THAT SAME image.
  3. Multi-Modal Document Intelligence: Analyze uploaded images (OCR/Vision), PDFs, Word DOCX files, and Excel spreadsheets.
  4. Free HD AI Image Generation: Generate new artistic and realistic images when explicitly asked to create a new concept.
  5. Format Chameleon: Always output clean codeblocks when asked for JSON, XML, CSV, or YAML.`;

/**
 * Enhanced Client-Side Image Processing
 * Modifies & enhances the user's EXACT uploaded image without altering faces or people!
 */
export async function enhanceImageWithCanvas(
  dataUrl,
  { brightness = 1.1, contrast = 1.15, sharpness = 1.2, saturation = 1.1 } = {}
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // 1. Color and Brightness / Contrast adjustments
      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
      ctx.drawImage(img, 0, 0);

      // 2. Convolution Sharpening Kernel
      if (sharpness > 1) {
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const w = canvas.width;
          const h = canvas.height;
          const buff = new Uint8ClampedArray(data);

          // 3x3 Sharpen Kernel: [ 0, -1, 0, -1, 5, -1, 0, -1, 0 ]
          const kCenter = 4 * (sharpness - 1) + 1;
          const kSide = -(sharpness - 1);

          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              for (let c = 0; c < 3; c++) {
                const val =
                  buff[idx + c] * kCenter +
                  (buff[idx - 4 + c] +
                    buff[idx + 4 + c] +
                    buff[idx - w * 4 + c] +
                    buff[idx + w * 4 + c]) *
                    kSide;
                data[idx + c] = Math.min(Math.max(val, 0), 255);
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
        } catch {
          // Fallback if cross-origin restricts pixel access
        }
      }

      resolve(canvas.toDataURL('image/png', 0.95));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Generates free AI images with Pollinations.ai (Flux / SDXL high quality)
 */
export function generateSe7enImage(prompt) {
  const cleanPrompt = encodeURIComponent(prompt.trim());
  const seed = Math.floor(Math.random() * 9999999);
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&enhance=true&model=flux&seed=${seed}`;
}

/**
 * Scrapes any URL and returns structured JSON and XML
 */
export async function scrapeUrlData(url, format = 'json') {
  try {
    const res = await fetch('/api/scrape-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP Error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    throw new Error(`Failed to scrape URL: ${err.message}`);
  }
}

/**
 * Detects if a string contains a URL
 */
export function extractUrlsFromString(str) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = str.match(urlRegex);
  return matches || [];
}

/**
 * Parses user-uploaded files into readable text / data for Se7eN AI
 */
export async function parseUploadedFile(file) {
  const name = file.name.toLowerCase();
  const type = file.type;

  // 1. Text & Code files
  if (
    type.startsWith('text/') ||
    name.endsWith('.json') ||
    name.endsWith('.xml') ||
    name.endsWith('.csv') ||
    name.endsWith('.md') ||
    name.endsWith('.js') ||
    name.endsWith('.html') ||
    name.endsWith('.py') ||
    name.endsWith('.css')
  ) {
    const text = await file.text();
    return {
      type: 'text',
      name: file.name,
      content: text,
      preview: text.slice(0, 500) + (text.length > 500 ? '...' : ''),
    };
  }

  // 2. Excel spreadsheets (.xlsx, .xls)
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetData = {};
    workbook.SheetNames.forEach((sheetName) => {
      sheetData[sheetName] = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName],
        { defval: '' }
      );
    });
    const jsonString = JSON.stringify(sheetData, null, 2);
    return {
      type: 'excel',
      name: file.name,
      content: jsonString,
      preview: `Excel Spreadsheet (${workbook.SheetNames.length} sheet(s)): ${workbook.SheetNames.join(', ')}`,
      data: sheetData,
    };
  }

  // 3. Word Document (.docx)
  if (name.endsWith('.docx')) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return {
      type: 'docx',
      name: file.name,
      content: result.value,
      preview: result.value.slice(0, 500) + '...',
    };
  }

  // 4. Image (.png, .jpg, .jpeg, .webp, .gif)
  if (type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          type: 'image',
          name: file.name,
          dataUrl: reader.result,
          content: `[Attached Image: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`,
          preview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // 5. Default binary
  return {
    type: 'binary',
    name: file.name,
    content: `[Attached File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`,
    preview: file.name,
  };
}

/**
 * Converts generic JavaScript object / string data to formatted XML
 */
export function convertToXml(data, rootName = 'Se7eNData') {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n  <content>${escapeXml(data)}</content>\n</${rootName}>`;
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;

  function build(obj, indent = '  ') {
    let out = '';
    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        out += `${indent}<item>\n${build(item, indent + '  ')}${indent}</item>\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, val]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (typeof val === 'object' && val !== null) {
          out += `${indent}<${safeKey}>\n${build(val, indent + '  ')}${indent}</${safeKey}>\n`;
        } else {
          out += `${indent}<${safeKey}>${escapeXml(String(val ?? ''))}</${safeKey}>\n`;
        }
      });
    } else {
      out += `${indent}${escapeXml(String(obj ?? ''))}\n`;
    }
    return out;
  }

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  xml += build(data);
  xml += `</${rootName}>`;
  return xml;
}

/**
 * Downloads arbitrary text/blob file
 */
export function downloadFile(content, fileName, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
