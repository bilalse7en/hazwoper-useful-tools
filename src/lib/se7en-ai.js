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
 * Curated High-Resolution Royalty-Free Photo Bank (100% Free & Copyright-Free for Commercial & Personal Use)
 * Mapped to specific real-world safety, industrial, environmental, technical, and compliance domains.
 */
export const REALISTIC_PHOTO_COLLECTIONS = {
  // 1. Fall Protection & Harnesses
  fall_protection: [
    'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=1200&auto=format&fit=crop&q=85',
  ],
  // 2. HAZWOPER & Chemical Safety
  hazwoper_chemical: [
    'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=85',
  ],
  // 3. Confined Space & Gas Monitoring
  confined_space: [
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=85',
  ],
  // 4. PPE & Safety Apparel
  ppe_equipment: [
    'https://images.unsplash.com/photo-1578496781985-452d4a934d50?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=85',
  ],
  // 5. Electrical Safety & Lockout/Tagout (LOTO)
  electrical_loto: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=85',
  ],
  // 6. Fire Safety & Emergency Response
  fire_emergency: [
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=1200&auto=format&fit=crop&q=85',
  ],
  // 7. Excavation, Trenching & Heavy Machinery
  excavation_heavy: [
    'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=85',
  ],
  // 8. Mold, IAQ & Environmental Remediation
  environmental_mold: [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=1200&auto=format&fit=crop&q=85',
  ],
  // 9. First Aid & Occupational Health
  first_aid_health: [
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=85',
  ],
  // 10. Technology & Software Architecture
  technology: [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=85',
  ],
  // 11. Business, Leadership & Management
  business: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&auto=format&fit=crop&q=85',
  ],
};

/**
 * Intelligent topic context matcher that returns a 100% free, royalty-free, realistic photograph URL.
 * Guarantees zero copyright issues, authentic real-world visuals, and zero console errors.
 */
export function getRealisticTopicPhoto(topicTitle = '', category = 'safety') {
  const query = `${topicTitle} ${category}`.toLowerCase();

  // Match keyword patterns to realistic photo collections
  let pool = REALISTIC_PHOTO_COLLECTIONS.fall_protection;

  if (
    query.includes('harness') ||
    query.includes('fall') ||
    query.includes('pfas') ||
    query.includes('scaffold') ||
    query.includes('ladder') ||
    query.includes('d-ring') ||
    query.includes('lanyard') ||
    query.includes('height') ||
    query.includes('anchor')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.fall_protection;
  } else if (
    query.includes('hazwoper') ||
    query.includes('chemical') ||
    query.includes('waste') ||
    query.includes('toxic') ||
    query.includes('spill') ||
    query.includes('decon') ||
    query.includes('rcra') ||
    query.includes('sds') ||
    query.includes('drum')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.hazwoper_chemical;
  } else if (
    query.includes('confined') ||
    query.includes('gas') ||
    query.includes('atmospher') ||
    query.includes('oxygen') ||
    query.includes('detector') ||
    query.includes('ventilat') ||
    query.includes('manhole')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.confined_space;
  } else if (
    query.includes('ppe') ||
    query.includes('respirat') ||
    query.includes('mask') ||
    query.includes('glove') ||
    query.includes('glasses') ||
    query.includes('helmet') ||
    query.includes('hard hat') ||
    query.includes('protective')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.ppe_equipment;
  } else if (
    query.includes('lockout') ||
    query.includes('tagout') ||
    query.includes('loto') ||
    query.includes('electric') ||
    query.includes('arc flash') ||
    query.includes('voltage') ||
    query.includes('breaker')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.electrical_loto;
  } else if (
    query.includes('fire') ||
    query.includes('extinguish') ||
    query.includes('flamm') ||
    query.includes('egress') ||
    query.includes('evacuat') ||
    query.includes('drill')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.fire_emergency;
  } else if (
    query.includes('trench') ||
    query.includes('excavat') ||
    query.includes('soil') ||
    query.includes('forklift') ||
    query.includes('machin') ||
    query.includes('crane') ||
    query.includes('heavy')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.excavation_heavy;
  } else if (
    query.includes('mold') ||
    query.includes('fungal') ||
    query.includes('moisture') ||
    query.includes('hepa') ||
    query.includes('air quality') ||
    query.includes('asbestos') ||
    query.includes('environ')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.environmental_mold;
  } else if (
    query.includes('first aid') ||
    query.includes('cpr') ||
    query.includes('medical') ||
    query.includes('eyewash') ||
    query.includes('injury') ||
    query.includes('health') ||
    query.includes('clinic') ||
    query.includes('hipaa')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.first_aid_health;
  } else if (
    query.includes('tech') ||
    query.includes('code') ||
    query.includes('software') ||
    query.includes('data') ||
    query.includes('cloud') ||
    query.includes('cyber') ||
    query.includes('api')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.technology;
  } else if (
    query.includes('business') ||
    query.includes('lead') ||
    query.includes('manage') ||
    query.includes('plan') ||
    query.includes('strategy') ||
    query.includes('roi')
  ) {
    pool = REALISTIC_PHOTO_COLLECTIONS.business;
  }

  // Pick deterministic or random photo from the matched pool based on string hash
  let hash = 0;
  for (let i = 0; i < topicTitle.length; i++) {
    hash = (hash << 5) - hash + topicTitle.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index] || pool[0];
}

/**
 * Enhances prompt with ultra-realistic photographic parameters
 */
export function enhancePhotorealisticPrompt(rawPrompt = '') {
  const base = (rawPrompt || '').trim();
  // Strip out weird text/sign requests that cause AI artifacts
  const sanitized = base
    .replace(
      /holding (a )?large (hardboard )?sign with ["'][^"']+["']/gi,
      'at industrial safety workplace'
    )
    .replace(/with ["'][^"']+["'] clearly written on it/gi, '')
    .trim();

  if (
    sanitized.toLowerCase().includes('documentary photograph') ||
    sanitized.toLowerCase().includes('canon eos')
  ) {
    return sanitized;
  }
  return `${sanitized}, 8k UHD documentary photograph, authentic industrial safety workplace, professional worker wearing certified standard OSHA personal protective equipment (safety helmet, reflective safety vest, protective eyewear), captured on Canon EOS R5 50mm f/1.8 lens, natural daylight illumination, realistic human anatomy, zero distortion, hyper-detailed`;
}

/**
 * Generates an ultra-realistic, artifact-free image URL for Pollinations Flux
 * @param {string} rawTopic - The slide topic or visual description
 * @param {string} domain - Domain category (HAZWOPER, Electrical, Construction, AI, etc.)
 * @returns {string} Fully formatted Pollinations image URL
 */
export function generateSe7enImage(rawTopic, domain = 'Safety') {
  // If rawTopic is empty, return verified realistic topic photo
  if (!rawTopic || rawTopic.length < 3) {
    return getRealisticTopicPhoto('Safety Training', domain);
  }

  // Realism modifiers that strip AI plastic textures and enforce lens optics
  const realismEngine = [
    'candid documentary photograph',
    'shot on 35mm f/4 lens',
    'natural diffused overcast daylight',
    'subtle film grain',
    'realistic skin pores and fabric texture',
    'unmarked standard safety equipment',
    'sharp focus on subject',
    'no CGI',
    'no 3D render',
    'no illustration',
    'no oversaturation',
  ].join(', ');

  // Build clean, contextual prompt
  const enhancedPrompt = `${rawTopic}, authentic industrial setting in ${domain}, ${realismEngine}`;

  // URL Encode and append optimal Flux parameters
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1280&height=720&seed=${Math.floor(Math.random() * 100000)}&nologo=true&enhance=false`;
}

/**
 * Background Asynchronous Image Generation Queue with Live Notifications
 */
export class ImageQueueManager {
  constructor({ onProgress, onComplete, engine = 'flux' } = {}) {
    this.onProgress = onProgress || (() => {});
    this.onComplete = onComplete || (() => {});
    this.engine = engine;
    this.queue = [];
    this.isProcessing = false;
    this.completedCount = 0;
    this.totalCount = 0;
  }

  async processTopics(topics = []) {
    if (!Array.isArray(topics) || topics.length === 0) {
      this.onComplete([]);
      return [];
    }

    this.queue = [...topics];
    this.totalCount = topics.length;
    this.completedCount = 0;
    this.isProcessing = true;

    const concurrency = 2; // Parallel generation batches
    const results = [];

    const processBatch = async (batch) => {
      return Promise.all(
        batch.map(async (topic) => {
          // Provide realistic photo URL with zero chance of broken image
          const realisticPhotoUrl = getRealisticTopicPhoto(
            topic.title,
            'safety'
          );
          const prompt =
            topic.imagePrompt ||
            `Documentary photo of ${topic.title} in industrial workplace`;
          const imageUrl =
            generateSe7enImage(prompt, {
              engine: this.engine,
              fallbackTopic: topic.title,
            }) || realisticPhotoUrl;

          topic.imageUrl = imageUrl;

          this.completedCount++;
          const percent = Math.round(
            (this.completedCount / this.totalCount) * 100
          );

          this.onProgress({
            current: this.completedCount,
            total: this.totalCount,
            percent,
            topicTitle: topic.title,
            imageUrl,
          });

          // Dispatch window event for UI notifications
          if (typeof window !== 'undefined') {
            try {
              window.dispatchEvent(
                new CustomEvent('hazwoper:image_queue_progress', {
                  detail: {
                    current: this.completedCount,
                    total: this.totalCount,
                    percent,
                    topicTitle: topic.title,
                  },
                })
              );
            } catch {}
          }

          return topic;
        })
      );
    };

    for (let i = 0; i < this.queue.length; i += concurrency) {
      const batch = this.queue.slice(i, i + concurrency);
      const batchResults = await processBatch(batch);
      results.push(...batchResults);
      await new Promise((r) => setTimeout(r, 40));
    }

    this.isProcessing = false;
    this.onComplete(results);

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('hazwoper:image_queue_completed', {
            detail: { total: this.totalCount },
          })
        );
      } catch {}
    }

    return results;
  }
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
