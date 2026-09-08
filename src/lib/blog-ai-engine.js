/**
 * @file blog-ai-engine.js
 * Master AI Blog Generation Engine for "All Useful Tools" (HAZWOPER Useful Tools).
 * Built with full website ecosystem intelligence, Claude-style editorial design,
 * comparative tables, styled quote cards, and interactive matching games.
 */

import { toolInfo, toolIdToSlug } from '@/lib/seo';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// 1. Comprehensive Website Ecosystem Knowledge Base
// ---------------------------------------------------------------------------
export const ECOSYSTEM_KNOWLEDGE = {
  brandName: 'All Useful Tools (HAZWOPER Useful Tools)',
  tagline:
    'High-Performance Privacy-First Digital Tools & LMS Intelligence Suite',
  overview:
    'All Useful Tools is an enterprise-grade web utility platform providing 21+ browser-first, privacy-respecting tools for document extraction, media re-encoding, curriculum engineering, and compliance automation. All operations execute locally in the browser sandbox (via WebAssembly and Web Workers) or through collaborative neural multi-agent systems without third-party data tracking.',
  categories: {
    'Course & Curriculum Creation': [
      'ai-course-creator',
      'web-content',
      'lesson-quiz-builder',
      'glossary-generator',
      'resource-generator',
    ],
    'Document & Content Optimization': [
      'blog-generator',
      'document-extractor',
      'word-to-html',
      'html-cleaner',
      'image-to-text',
      'pdf-editor',
    ],
    'Media Processing & Converters': [
      'image-converter',
      'video-compressor',
      'video-converter',
      'audio-converter',
      'audio-editor',
      'video-to-gif',
      'youtube-downloader',
      'watermark-remover',
      'bg-remover',
    ],
    'AI Multi-Modal Assistant': ['ai-assistant'],
  },
  tools: {
    'ai-course-creator': {
      name: 'AI Course Creator (PRO)',
      slug: 'ai-course-creator',
      category: 'Course & Curriculum Creation',
      tagline: 'Multi-Agent AI Curriculum Engineering & LMS SCORM Builder',
      coreFeatures: [
        'Collaborative Multi-Agent AI (Curriculum Architect, Content Specialist, Assessment Evaluator, Voice Synthesizer)',
        '8K Photorealistic Canvas Visuals with custom brand watermarks',
        'Humanized Natural English TTS Narration with 0.3s breath pauses and phonetic dictionaries',
        '15 Interactive Quiz Engines: hazard spotter, drag & drop sequence, inspection checklist, scenarios',
        'Full SCORM 1.2 / 2004, JSON, and printable compliance bundle export',
        'Aligned with OSHA 29 CFR, EPA, and ANSI benchmarks',
      ],
      keyTerms: [
        {
          term: 'SCORM 2004',
          def: 'Standardized LMS packaging specification enabling cross-platform course scoring and tracking.',
        },
        {
          term: 'Multi-Agent AI',
          def: 'Collaborative AI personas working concurrently on curriculum structure, assessment, and narration.',
        },
        {
          term: '8K Safety Canvas',
          def: 'High-resolution visual slide builder illustrating industrial hazard controls and PPE gear.',
        },
      ],
    },
    'web-content': {
      name: 'Web Content Generator',
      slug: 'web-content',
      category: 'Course & Curriculum Creation',
      tagline: 'DOCX Content Extractor for Course Syllabus, Overview & FAQs',
      coreFeatures: [
        'Extracts structured Overview, Syllabus, FAQs, Glossaries, and Resources from DOCX',
        'Converts unstructured enterprise training manuals into clean, responsive HTML',
        'Zero cloud upload—client-side WebAssembly document processing',
      ],
      keyTerms: [
        {
          term: 'DOCX Parsing',
          def: 'Automated decomposition of OpenXML document hierarchies into structured digital sections.',
        },
        {
          term: 'Syllabus Extractor',
          def: 'Smart module-and-lesson boundary detection for training curriculum.',
        },
      ],
    },
    'blog-generator': {
      name: 'Blog Generator',
      slug: 'blog-generator',
      category: 'Document & Content Optimization',
      tagline:
        'AI-Powered Technical Blog Creator with Step-by-Step Visual Review',
      coreFeatures: [
        'Converts technical documents and notes into SEO-optimized, highly structured blog articles',
        'Automatic table formatting (top vs left headings), FAQ extraction, and image placement',
        'Built-in rich text editor with undo/redo, visual block inspector, and instant HTML export',
      ],
      keyTerms: [
        {
          term: 'Visual Reviewer',
          def: 'Interactive step-by-step block inspection panel allowing micro-edits before publishing.',
        },
        {
          term: 'Table Sanitization',
          def: 'Automated conversion of Word tables into responsive HTML data structures.',
        },
      ],
    },
    'glossary-generator': {
      name: 'Glossary Generator',
      slug: 'glossary-generator',
      category: 'Course & Curriculum Creation',
      tagline:
        'Automated Terminology Extractor & Alphabetized Definition Cards',
      coreFeatures: [
        'Extracts regulatory acronyms, industry jargon, and definitions from training files',
        'Automatic A-Z alphabetization, letter jump navigation, and search indexing',
        'Instant export to clean HTML glossary cards and JSON arrays',
      ],
      keyTerms: [
        {
          term: 'A-Z Indexing',
          def: 'Dynamic sorting and grouping of technical definitions for fast user navigation.',
        },
        {
          term: 'Acronym Detection',
          def: 'Smart regex pattern recognition identifying capital-letter regulatory acronyms.',
        },
      ],
    },
    'resource-generator': {
      name: 'Resource Generator',
      slug: 'resource-generator',
      category: 'Course & Curriculum Creation',
      tagline: 'Intelligent Citation, Reference & External Link Organizer',
      coreFeatures: [
        'Extracts hyperlinks, footnotes, regulatory references, and bibliography entries',
        'Categorizes links by domain, standard, or authority with metadata previews',
        'Exports clean HTML reference sections for courses and knowledge bases',
      ],
      keyTerms: [
        {
          term: 'Citation Normalizer',
          def: 'Standardizes disparate URL and document citation formats into unified reference cards.',
        },
      ],
    },
    'html-cleaner': {
      name: 'HTML Cleaner',
      slug: 'html-cleaner',
      category: 'Document & Content Optimization',
      tagline: 'Sanitizes Messy Word & CMS Code into Pristine Semantic HTML5',
      coreFeatures: [
        'Removes bloated inline CSS (`MsoNormal`), empty spans, proprietary XML tags, and tracking scripts',
        'Preserves semantic structure (`<h1>-<h6>`, `<p>`, `<ul>`, `<ol>`, `<table>`, `<blockquote>`)',
        'Instant code minification, prettification, and one-click copy',
      ],
      keyTerms: [
        {
          term: 'MsoNormal Bloat',
          def: 'Proprietary Microsoft Word inline styling attributes that degrade web performance.',
        },
        {
          term: 'Semantic HTML5',
          def: 'Clean, tag-based markup enhancing accessibility and SEO visibility.',
        },
      ],
    },
    'image-converter': {
      name: 'Image Converter',
      slug: 'image-converter',
      category: 'Media Processing & Converters',
      tagline: 'Privacy-First Batch Image Converter (WebP, PNG, JPG, AVIF)',
      coreFeatures: [
        'Batch conversion between WebP, PNG, JPG, AVIF, BMP, and SVG',
        'Client-side Canvas & WebAssembly execution—images never leave your computer',
        'Granular quality sliders, dimensions resizing, and bulk ZIP download',
      ],
      keyTerms: [
        {
          term: 'WebP Format',
          def: 'Next-gen image container offering 25-35% size reduction over JPEG with transparency support.',
        },
        {
          term: 'Local Canvas Processing',
          def: 'Executing image re-encoding directly in browser RAM without server transfers.',
        },
      ],
    },
    'video-compressor': {
      name: 'Video Compressor',
      slug: 'video-compressor',
      category: 'Media Processing & Converters',
      tagline: 'Browser-Side High-Fidelity Video Size Reducer via FFmpeg WASM',
      coreFeatures: [
        'Reduces video file size up to 80% while preserving sharp 1080p/720p visual fidelity',
        'Supports MP4, MOV, AVI, WebM with custom bitrate and CRF target controls',
        '100% private client-side processing using multi-threaded WebAssembly FFmpeg',
      ],
      keyTerms: [
        {
          term: 'CRF (Constant Rate Factor)',
          def: 'Intelligent encoding mode allocating higher bitrates to complex motion frames.',
        },
        {
          term: 'FFmpeg WASM',
          def: 'Compiled C-libraries running full video transcoding inside browser sandboxes.',
        },
      ],
    },
    'ai-assistant': {
      name: 'AI Assistant / Se7eN AI Pro',
      slug: 'ai-assistant',
      category: 'AI Multi-Modal Assistant',
      tagline:
        'Multi-Modal Super-Intelligence for Web Scraping, OCR & Code Generation',
      coreFeatures: [
        'Live Web Scraping & URL mining into structured JSON, XML, CSV, and YAML',
        'Multi-modal document and image inspection with OCR and adaptive canvas sharpening',
        'Integrated Claude 3.7 Sonnet, GPT-4o, DeepSeek R1, and Gemini 1.5 Flash models',
      ],
      keyTerms: [
        {
          term: 'Multi-Modal Vision',
          def: 'Direct visual interpretation of diagrams, safety signage, and handwritten notes.',
        },
        {
          term: 'Web Scraper AI',
          def: 'Extracting live DOM structures into clean machine-readable data feeds.',
        },
      ],
    },
    'image-to-text': {
      name: 'Image to Text OCR',
      slug: 'image-to-text',
      category: 'Document & Content Optimization',
      tagline:
        'Multi-Language Optical Character Recognition from Scans & Photos',
      coreFeatures: [
        'Extracts selectable text from scanned receipts, whiteboard drawings, and PDFs',
        'Multi-language OCR engine with automatic contrast normalization',
        'One-click export to TXT, JSON, or formatted Markdown',
      ],
      keyTerms: [
        {
          term: 'OCR (Optical Character Recognition)',
          def: 'Translating raster pixel patterns of glyphs into digital Unicode text.',
        },
      ],
    },
    'document-extractor': {
      name: 'Document Extractor',
      slug: 'document-extractor',
      category: 'Document & Content Optimization',
      tagline: 'Deep Structure Document Parser & Section Segmenter',
      coreFeatures: [
        'Deconstructs complex Word documents into atomic chapters, tables, lists, and images',
        'Identifies heading hierarchy, metadata headers, and embedded media assets',
      ],
      keyTerms: [
        {
          term: 'Document AST',
          def: 'Abstract syntax tree representing document hierarchy for lossless data extraction.',
        },
      ],
    },
    'video-converter': {
      name: 'Video Converter',
      slug: 'video-converter',
      category: 'Media Processing & Converters',
      tagline: 'Fast Browser-Based Format Conversion (MP4, WebM, MOV, AVI)',
      coreFeatures: [
        'Converts video files without uploading to external cloud storage',
        'Optimized presets for web distribution, mobile playback, and LMS embeds',
      ],
      keyTerms: [
        {
          term: 'H.264 / AAC',
          def: 'The universal codec standard compatible with 99.9% of web browsers and mobile devices.',
        },
      ],
    },
    'audio-converter': {
      name: 'Audio Converter',
      slug: 'audio-converter',
      category: 'Media Processing & Converters',
      tagline:
        'High-Fidelity Client-Side Audio Converter (MP3, WAV, AAC, OGG, M4A)',
      coreFeatures: [
        'Transcodes audio files at variable bitrates (128kbps, 192kbps, 320kbps)',
        'Sample rate adjustments (44.1kHz / 48kHz) for crystal-clear narration and podcasts',
      ],
      keyTerms: [
        {
          term: 'Lossless Audio (WAV)',
          def: 'Uncompressed audio waveform data preserving 100% original dynamic range.',
        },
      ],
    },
    'audio-editor': {
      name: 'Audio Editor',
      slug: 'audio-editor',
      category: 'Media Processing & Converters',
      tagline:
        'Interactive Waveform Visualizer, Trimmer, Pitch & Volume Gain Editor',
      coreFeatures: [
        'Interactive real-time audio waveform canvas with drag-to-crop markers',
        'Fade-in, fade-out, reverse playback, speed manipulation, and decibel amplification',
      ],
      keyTerms: [
        {
          term: 'Audio Waveform',
          def: 'Visual amplitude-over-time representation for frame-accurate audio trimming.',
        },
      ],
    },
    'video-to-gif': {
      name: 'Video to GIF Converter',
      slug: 'video-to-gif',
      category: 'Media Processing & Converters',
      tagline: 'High-Quality Animated GIF Maker with Custom Framerate & Scale',
      coreFeatures: [
        'Creates compact looping animated GIFs from video clips under 10 seconds',
        'Custom FPS (10-30), resolution downscaling, and color palette optimization',
      ],
      keyTerms: [
        {
          term: 'Color Quantization',
          def: 'Reducing video color palettes to 256 colors for minimal GIF file weight.',
        },
      ],
    },
    'word-to-html': {
      name: 'Word to HTML Converter',
      slug: 'word-to-html',
      category: 'Document & Content Optimization',
      tagline: 'Clean Word Content for Web Publishing without Layout Breaks',
      coreFeatures: [
        'Converts legacy DOCX documents into clean web code with preserved tables and lists',
        'Eliminates proprietary Office styling artifacts for seamless CMS pasting',
      ],
      keyTerms: [
        {
          term: 'Clean Web Migration',
          def: 'Transforming desktop-formatted Word files into responsive, mobile-first web pages.',
        },
      ],
    },
    'lesson-quiz-builder': {
      name: 'Lesson Quiz Builder',
      slug: 'lesson-quiz-builder',
      category: 'Course & Curriculum Creation',
      tagline: 'Automated Assessment & Multiple Choice Question Extractor',
      coreFeatures: [
        'Parses questions, options (A-D), and answer keys from DOCX curriculum files',
        'Exports ready-to-use LMS quiz JSON, interactive web cards, and grading sheets',
      ],
      keyTerms: [
        {
          term: 'Formative Assessment',
          def: 'In-lesson quizzes designed to reinforce knowledge retention during training.',
        },
      ],
    },
    'youtube-downloader': {
      name: 'Universal Media Downloader',
      slug: 'youtube-downloader',
      category: 'Media Processing & Converters',
      tagline:
        'High-Res Video & Audio Downloader for Research & Training Media',
      coreFeatures: [
        'Extracts high-resolution video streams and 320kbps MP3 audio from public URLs',
        'Clean metadata tagging and watermark-free media archiving for safety presentations',
      ],
      keyTerms: [
        {
          term: 'Direct Stream Rip',
          def: 'Lossless extraction of raw media streams from content distribution networks.',
        },
      ],
    },
    'watermark-remover': {
      name: 'AI Watermark Remover',
      slug: 'watermark-remover',
      category: 'Media Processing & Converters',
      tagline:
        'AI Content-Aware Inpainting for Watermarks, Date Stamps & Logos',
      coreFeatures: [
        'Interactive brush canvas to highlight watermarks, date stamps, and unwanted elements',
        'Neural patch inpainting blends texture and background seamlessly',
      ],
      keyTerms: [
        {
          term: 'Content-Aware Inpainting',
          def: 'Algorithmic reconstruction of masked image pixels using surrounding textures.',
        },
      ],
    },
    'bg-remover': {
      name: 'AI Background Remover',
      slug: 'bg-remover',
      category: 'Media Processing & Converters',
      tagline: 'Instant Client-Side AI Background Removal for Transparent PNGs',
      coreFeatures: [
        'Isolates human subjects, safety equipment, and products in under 3 seconds',
        'Zero cloud latency with local neural segmentation model running in WebAssembly',
      ],
      keyTerms: [
        {
          term: 'Neural Alpha Matte',
          def: 'Pixel-level segmentation mask separating foreground subjects from background scenes.',
        },
      ],
    },
    'pdf-editor': {
      name: 'Free Online PDF Editor',
      slug: 'pdf-editor',
      category: 'Document & Content Optimization',
      tagline:
        'Comprehensive Browser-Based PDF Annotator, Page Manager & Signer',
      coreFeatures: [
        'Add blank pages, reorder sheets with drag-and-drop, and delete unwanted pages',
        'Freehand draw, text annotations, rubber stamps, whiteout redactions, and signatures',
        'Exports crisp vector PDFs with 100% device privacy',
      ],
      keyTerms: [
        {
          term: 'Vector Annotation',
          def: 'High-resolution lossless digital markup rendered on top of existing PDF layers.',
        },
        {
          term: 'Document Redaction',
          def: 'Permanent whiteout of confidential PII or proprietary data prior to export.',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// 2. Master System Prompt Engineering (Claude AI Style)
// ---------------------------------------------------------------------------
export function buildMasterSystemPrompt({
  selectedToolSlug = null,
  targetWordCount = '1500',
  tone = 'Technical Authority',
} = {}) {
  const toolsContext = Object.values(ECOSYSTEM_KNOWLEDGE.tools)
    .map(
      (t) =>
        `- **${t.name}** (/tools/${t.slug}): ${t.tagline}. Core capabilities: ${t.coreFeatures.slice(0, 3).join('; ')}`
    )
    .join('\n');

  const focusedTool = selectedToolSlug
    ? ECOSYSTEM_KNOWLEDGE.tools[selectedToolSlug]
    : null;

  return `You are "Se7eN Bot Autopilot", the Chief Technical Editor & AI Architect for "${ECOSYSTEM_KNOWLEDGE.brandName}".
You write with the analytical depth, precision, structural elegance, and zero-fluff authority of Claude 3.7 Sonnet.

OBJECTIVE:
Generate an exhaustive, highly engaging, beautifully formatted blog post that provides immense practical value to engineers, compliance managers, course creators, and productivity professionals.

PRIMARY ECOSYSTEM CONTEXT:
${toolsContext}

${
  focusedTool
    ? `FOCUS TOOL FOR THIS ARTICLE:
- Name: ${focusedTool.name} (/tools/${focusedTool.slug})
- Category: ${focusedTool.category}
- Mission: ${focusedTool.tagline}
- Detailed Features: ${focusedTool.coreFeatures.join(' | ')}
`
    : `FOCUS: Multi-tool workflow integration across the All Useful Tools platform.`
}

EDITORIAL & DESIGN STANDARDS (MANDATORY):
1. **Tone & Style**: ${tone}, objective, authoritative, deeply practical. Never use generic AI filler phrases (like "In today's fast-paced digital world", "Look no further", "In conclusion").
2. **Structure**:
   - Compelling Hook & Problem Statement (<p>).
   - Core Architecture & Technical Foundations (<h2>, <h3>).
   - Step-by-Step Practical Implementation Guide.
   - Real-World Case Study / Enterprise Workflow.
   - **At Least 2 Comparative/Technical Tables** (<div class="table-container"><table class="data-table">...</table></div>).
   - **At Least 2-3 Stylized Quote Callouts** (<blockquote class="pro-quote"><p>“...”</p><cite>— Name, Title</cite></blockquote>).
   - **At Least 2 Pro-Tip Highlight Boxes** (<div class="callout-card tip"><div class="card-title">⚡ Pro-Tip / Key Standard</div><p>...</p></div>).
3. **MANDATORY INTERACTIVE GAME SECTION AT THE END**:
   In the final section of the article, you MUST include:
   - An <h2> heading: "Interactive Knowledge Lab: Test Your Mastery"
   - A dedicated interactive matching game component embedded with this EXACT data attribute:
     <div class="interactive-matching-game" data-game='{"title": "Match the Technical Terms", "pairs": [{"term": "Term 1", "match": "Definition 1"}, {"term": "Term 2", "match": "Definition 2"}, {"term": "Term 3", "match": "Definition 3"}, {"term": "Term 4", "match": "Definition 4"}, {"term": "Term 5", "match": "Definition 5"}]}'></div>
   - A quick interactive quiz block:
     <div class="interactive-quiz-card" data-quiz='{"question": "Technical scenario question?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": 1, "explanation": "Why Option B is correct based on the article."}'></div>

OUTPUT FORMAT SPECIFICATION:
You must output a strictly valid JSON object (or JSON array with 1 item) with these keys:
{
  "title": "Clear, Punchy, Authority Title (e.g. 'Mastering Client-Side Document Processing: A Complete Technical Guide')",
  "summary": "150-200 character rich SEO summary explaining exactly what the reader will learn.",
  "slug": "url-friendly-kebab-case-slug",
  "category": "${focusedTool ? focusedTool.category : 'Industrial Excellence'}",
  "read_time": "8 min read",
  "content": "The complete, pristine HTML body containing all headings, paragraphs, styled blockquotes, data tables, callout cards, and the interactive game embeds."
}

DO NOT output markdown code fences, backticks, or conversational text. Output raw JSON only.`;
}

// ---------------------------------------------------------------------------
// 3. Puter AI Caller with Multi-Model Fallback Chain
// ---------------------------------------------------------------------------
export async function callPuterAiBlogEngine(prompt, systemPrompt) {
  if (typeof window === 'undefined' || !window.puter?.ai?.chat) {
    throw new Error(
      'Puter AI Engine is initializing. Please ensure Puter.js is loaded.'
    );
  }

  const modelChain = [
    'claude-3-7-sonnet',
    'gpt-4o',
    'gpt-4o-mini',
    'deepseek-chat',
    'gemini-1.5-flash',
  ];
  let lastError = null;

  for (const model of modelChain) {
    try {
      console.log(`[Blog AI Engine] Attempting generation with ${model}...`);
      const response = await window.puter.ai.chat(prompt, {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      });

      const text =
        typeof response === 'string'
          ? response
          : response?.message?.content ||
            response?.text ||
            response?.toString();

      if (text && text.trim().length > 100) {
        return { text, modelUsed: model };
      }
    } catch (err) {
      console.warn(
        `[Blog AI Engine] Model ${model} failed:`,
        err?.message || err
      );
      lastError = err;
    }
  }

  throw (
    lastError ||
    new Error('All neural models in the fallback chain were unreachable.')
  );
}

// ---------------------------------------------------------------------------
// 4. Robust JSON Parsing & Truncation Repair
// ---------------------------------------------------------------------------
export function parseAndRepairJson(rawText) {
  if (!rawText) return null;

  let cleanText = rawText.trim();
  // Strip markdown code fences
  cleanText = cleanText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // Try direct parse first
  try {
    const direct = JSON.parse(cleanText);
    return Array.isArray(direct) ? direct[0] : direct;
  } catch {
    // Continue to repair
  }

  // Find boundaries
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');

  if (firstBrace !== -1) {
    let candidate = cleanText.substring(
      firstBrace,
      lastBrace !== -1 ? lastBrace + 1 : undefined
    );

    // Repair open quotes/brackets
    let inString = false;
    let escape = false;
    const stack = [];

    for (let i = 0; i < candidate.length; i++) {
      const char = candidate[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length && stack[stack.length - 1] === '{') stack.pop();
      } else if (char === ']') {
        if (stack.length && stack[stack.length - 1] === '[') stack.pop();
      }
    }

    if (inString) candidate += '"';

    while (stack.length > 0) {
      const last = stack.pop();
      candidate = candidate.trim().replace(/,\s*$/, '');
      if (last === '{') candidate += '}';
      else if (last === '[') candidate += ']';
    }

    try {
      const repaired = JSON.parse(candidate);
      return Array.isArray(repaired) ? repaired[0] : repaired;
    } catch (err) {
      console.warn(
        '[Blog AI Engine] JSON Repair could not resolve syntax:',
        err
      );
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 5. High-Authority Client-Side Synthesizer Fallback
// ---------------------------------------------------------------------------
export function generateLocalFallbackBlog(toolSlug = 'pdf-editor') {
  const tool =
    ECOSYSTEM_KNOWLEDGE.tools[toolSlug] ||
    ECOSYSTEM_KNOWLEDGE.tools['pdf-editor'];

  const title = `The Definitive Engineering Guide to ${tool.name}: Architecture, Privacy & Modern Workflows`;
  const summary = `Explore the technical underpinnings of ${tool.name}. Learn how local-first WebAssembly sandboxing, zero-latency processing, and automated document formatting elevate enterprise productivity.`;
  const slug = `${tool.slug}-engineering-guide-${Date.now().toString(36).slice(-4)}`;

  const pairs =
    tool.keyTerms && tool.keyTerms.length >= 3
      ? tool.keyTerms.map((k) => ({ term: k.term, match: k.def }))
      : [
          {
            term: 'Local-First Execution',
            match:
              'Processing operations purely inside client memory using WebAssembly sandboxing.',
          },
          {
            term: 'Zero Cloud Latency',
            match:
              'Eliminating file upload/download roundtrips to remote cloud server clusters.',
          },
          {
            term: 'Semantic Integrity',
            match:
              'Preserving valid hierarchical HTML structures without inline proprietary styles.',
          },
          {
            term: 'Client Sandboxing',
            match:
              'Isolating document memory from external network snooping and telemetry.',
          },
          {
            term: 'Deterministic Export',
            match:
              'Generating pixel-perfect vector and data assets reproducible across any OS.',
          },
        ];

  const content = `
<h2>1. Architectural Shift: Why Local-First Digital Utilities Matter</h2>
<p>Modern enterprise workflows require tools that operate at the intersection of <strong>absolute privacy</strong>, <strong>instant execution speed</strong>, and <strong>seamless usability</strong>. Traditional cloud-based file processors upload confidential contracts, internal training blueprints, and proprietary media to remote third-party servers—introducing compliance vulnerabilities, latency bottlenecks, and bandwidth caps.</p>

<blockquote class="pro-quote">
  <p>“Data privacy is not a feature you bolt on after the fact; it is a fundamental architectural commitment. Processing confidential records directly within the user’s browser sandbox establishes absolute data sovereignty.”</p>
  <cite>— Chief Systems Architect, All Useful Tools Engineering Group</cite>
</blockquote>

<p>With <strong>${tool.name}</strong>, processing executes entirely inside your browser's dedicated WebAssembly sandbox. Your raw files, images, and documents never touch external infrastructure, ensuring compliance with strict GDPR, HIPAA, and internal enterprise security protocols.</p>

<div class="callout-card tip">
  <div class="card-title">⚡ Architectural Standard: Client-Side Memory Isolation</div>
  <p>By leveraging WebAssembly (WASM) alongside Web Workers, computation happens multi-threaded in background worker threads—preventing main-thread UI stutters even while processing massive multi-megabyte documents.</p>
</div>

<h2>2. Comparative Technical Benchmark: Cloud vs. Browser Sandbox</h2>
<p>The table below highlights the performance and compliance benefits of browser-first execution compared to traditional server-upload models:</p>

<div class="table-container">
  <table class="data-table">
    <thead>
      <tr>
        <th>Operational Parameter</th>
        <th>Traditional Cloud Converter</th>
        <th>All Useful Tools Sandbox</th>
        <th>Strategic Advantage</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Data Exposure Vector</strong></td>
        <td>Remote Server Transmission</td>
        <td><span class="badge-success">0% (Local Memory Only)</span></td>
        <td>Guaranteed Compliance &amp; Privacy</td>
      </tr>
      <tr>
        <td><strong>100MB File Processing Time</strong></td>
        <td>45 - 90 Seconds (Network Bound)</td>
        <td><span class="badge-success">&lt; 1.5 Seconds (CPU Bound)</span></td>
        <td>Up to 30x Faster Workflow</td>
      </tr>
      <tr>
        <td><strong>Server Downtime Vulnerability</strong></td>
        <td>High (Requires Server Uptime)</td>
        <td><span class="badge-success">Zero (Works 100% Offline)</span></td>
        <td>Continuous Business Operations</td>
      </tr>
      <tr>
        <td><strong>Bandwidth &amp; Upload Quotas</strong></td>
        <td>Restricted by Tier/Subscription</td>
        <td><span class="badge-success">Unlimited Local Throughput</span></td>
        <td>Zero Operational Cost Overhead</td>
      </tr>
    </tbody>
  </table>
</div>

<h2>3. Step-by-Step Implementation Workflow with ${tool.name}</h2>
<p>Integrating <strong>${tool.name}</strong> into your daily operations requires zero software installation. Follow this validated three-stage workflow to maximize efficiency:</p>

<div class="step-card">
  <div class="step-badge">Phase 1</div>
  <div class="step-body">
    <h4>Source Ingestion &amp; Local Verification</h4>
    <p>Select or drag-and-drop your target files into the workspace. The engine instantly computes cryptographic hashes and validates format integrity directly inside browser memory.</p>
  </div>
</div>

<div class="step-card">
  <div class="step-badge">Phase 2</div>
  <div class="step-body">
    <h4>Real-Time Parameter Configuration &amp; Canvas Editing</h4>
    <p>Utilize the interactive control panel to customize outputs—whether annotating vector PDF sheets, tuning video compression CRF factors, or stripping messy Office inline bloat.</p>
  </div>
</div>

<div class="step-card">
  <div class="step-badge">Phase 3</div>
  <div class="step-body">
    <h4>Deterministic High-Fidelity Rendering &amp; Export</h4>
    <p>Click export to render clean, standards-compliant digital assets with preserved typography and verified color calibration ready for instant production deployment.</p>
  </div>
</div>

<blockquote class="pro-quote">
  <p>“Automating the translation of raw technical assets into structured, production-ready deliverables eliminates transcription errors and empowers distributed teams to move with speed.”</p>
  <cite>— Director of Digital Operations</cite>
</blockquote>

<h2>4. Interactive Knowledge Lab: Test Your Mastery</h2>
<p>Solidify your understanding of these core architectural concepts. Complete the interactive terminology matching challenge and test your knowledge below:</p>

<div class="interactive-matching-game" data-game='${JSON.stringify({
    title: `Terminology Matcher: ${tool.name}`,
    pairs: pairs.slice(0, 5),
  })}'></div>

<div class="interactive-quiz-card" data-quiz='${JSON.stringify({
    question: `What is the primary operational advantage of processing files with ${tool.name} compared to traditional cloud tools?`,
    options: [
      'Files are uploaded to remote clusters for cloud processing',
      'Operations execute locally in browser memory with zero data transmission and instant speed',
      'Requires installing heavy background desktop service daemons',
      'Limits document operations to 5-minute maximum durations',
    ],
    answer: 1,
    explanation: `${tool.name} leverages WebAssembly and client-side sandboxing, executing computations entirely inside local device memory for maximum privacy and zero latency.`,
  })}'></div>
`;

  return {
    title,
    summary,
    slug,
    category: tool.category,
    read_time: '7 min read',
    content,
    author: 'Se7eN Bot Autopilot',
    date: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

// ---------------------------------------------------------------------------
// 6. Complete End-to-End Blog Generation Controller
// ---------------------------------------------------------------------------
export async function generateMasterBlog({
  toolSlug = null,
  targetWordCount = '1500',
  tone = 'Technical Authority',
  customTopic = '',
} = {}) {
  const systemPrompt = buildMasterSystemPrompt({
    selectedToolSlug: toolSlug,
    targetWordCount,
    tone,
  });

  const userPrompt = customTopic
    ? `Write a comprehensive, world-class blog post focusing on "${customTopic}". Target length: ~${targetWordCount} words. Include at least 2 comparison tables, 2 styled blockquotes, callout cards, and the final Interactive Knowledge Lab with drag-and-drop matching game data and quick quiz. Output raw JSON only.`
    : `Generate an authoritative, exhaustive deep-dive blog post for the tool "${toolSlug || 'pdf-editor'}". Target length: ~${targetWordCount} words. Include comparative benchmark tables, pro-quotes, practical step-by-step guides, and the final interactive matching game lab. Output raw JSON only.`;

  try {
    const { text, modelUsed } = await callPuterAiBlogEngine(
      userPrompt,
      systemPrompt
    );
    const parsed = parseAndRepairJson(text);

    if (
      parsed &&
      parsed.title &&
      (parsed.content || parsed.suggested_content)
    ) {
      const blog = {
        title: parsed.title,
        summary:
          parsed.summary || parsed.description || 'Weekly technical insight.',
        slug:
          (parsed.slug || 'technical-guide') +
          '-' +
          Math.random().toString(36).substring(2, 6),
        category:
          parsed.category ||
          (toolSlug
            ? ECOSYSTEM_KNOWLEDGE.tools[toolSlug]?.category
            : 'Industrial Excellence'),
        read_time: parsed.read_time || parsed.readTime || '8 min read',
        content: parsed.content || parsed.suggested_content,
        author: 'Se7eN Bot Autopilot',
        date: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        modelUsed,
      };

      // Ensure interactive game block exists in output
      if (!blog.content.includes('interactive-matching-game')) {
        const fallbackPairs = [
          {
            term: 'Client-Side WASM',
            match:
              'Near-native browser execution for heavy transcoding and PDF operations.',
          },
          {
            term: 'Local-First Privacy',
            match:
              'Guaranteeing confidential documents never traverse remote network hops.',
          },
          {
            term: 'Semantic HTML5',
            match:
              'Clean web standards avoiding proprietary legacy styling bloat.',
          },
          {
            term: 'Deterministic Export',
            match:
              'Exact visual reproduction across all modern desktop and mobile browsers.',
          },
        ];
        blog.content += `
<h2>Interactive Knowledge Lab: Test Your Mastery</h2>
<div class="interactive-matching-game" data-game='${JSON.stringify({
          title: 'Technical Concepts Matching Challenge',
          pairs: fallbackPairs,
        })}'></div>
`;
      }

      // Save to Local History
      saveToLocalHistory(blog);
      return blog;
    }
  } catch (err) {
    console.warn(
      '[Blog AI Engine] Primary AI generation fell back to high-authority local synthesizer:',
      err?.message || err
    );
  }

  // High-authority local fallback
  const fallbackBlog = generateLocalFallbackBlog(toolSlug || 'pdf-editor');
  saveToLocalHistory(fallbackBlog);
  return fallbackBlog;
}

// ---------------------------------------------------------------------------
// 7. Generation History Persistence (Local & Supabase)
// ---------------------------------------------------------------------------
const LOCAL_HISTORY_KEY = 'hazwoper_ai_blog_history_v1';

export function getLocalBlogHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToLocalHistory(blog) {
  if (typeof window === 'undefined' || !blog) return;
  try {
    const history = getLocalBlogHistory();
    const newEntry = {
      id: `blog-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...blog,
    };
    const updated = [
      newEntry,
      ...history.filter((h) => h.slug !== blog.slug),
    ].slice(0, 30);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Blog AI Engine] Failed to save local blog history:', err);
  }
}

export function deleteFromLocalHistory(id) {
  if (typeof window === 'undefined') return [];
  try {
    const history = getLocalBlogHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAllLocalBlogHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_HISTORY_KEY);
}
