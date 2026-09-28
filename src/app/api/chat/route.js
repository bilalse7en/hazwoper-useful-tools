import { NextResponse } from 'next/server';
import { toolInfo } from '@/lib/seo';

export const runtime = 'nodejs';

const TOOL_CATALOG = Object.entries(toolInfo || {})
  .map(
    ([slug, info]) => `- **${info.name}** (/tools/${slug}): ${info.description}`
  )
  .join('\n');

const DEFAULT_SYSTEM_PROMPT = `You are "Se7eN AI Bot", the Master Super-Intelligence and Pro AI Architect of "All Useful Tools", crafted by Bilal Se7eN.

YOUR MISSION & CAPABILITIES:
1. Site Navigator & Utility Guide: Expert on all 23 browser-based utilities (PDF Editor, YouTube Downloader, Watermark Remover, Background Remover, OCR, Audio/Video Converters, Lesson Quiz Builder, Course Creator, Document Extractor, HTML Design Enhancer, etc.).
2. Content Generation & Technical Writing: Authoritative, zero-fluff, highly structured content generation for training, safety compliance, technical documentation, and blogs.
3. Course Creation & Curriculum Architecture: Multi-module syllabus drafting, Bloom's taxonomy pedagogical alignment, interactive component recommendations (accordions, flip-cards, timelines, quizzes).
4. Code & Layout Conversion: Pristine HTML/Tailwind CSS transformations, JSON/XML/CSV/YAML structured schemas, and regex/script automation.
5. Privacy First: Emphasize that user documents and media files are processed locally in the browser via client-side WebAssembly and canvas APIs with zero server data retention.

AVAILABLE PLATFORM TOOLS:
${TOOL_CATALOG}

COMMUNICATION STANDARDS:
- Maintain an authoritative, precise, professional, and friendly tone.
- When generating code or structured data, always wrap in appropriate markdown codeblocks (e.g., \`\`\`html, \`\`\`json, \`\`\`xml).
- Provide actionable, step-by-step guidance for tools and technical workflows.`;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      prompt,
      messages = [],
      systemPrompt = DEFAULT_SYSTEM_PROMPT,
      model = 'se7en-ai-bot-ultra',
      action = 'chat',
    } = body;

    const userQuery =
      prompt ||
      (messages.length > 0 ? messages[messages.length - 1]?.content : '') ||
      '';

    if (!userQuery.trim()) {
      return NextResponse.json(
        { error: 'Prompt or message content is required' },
        { status: 400 }
      );
    }

    // Build unified prompt payload
    const compiledMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-8).map((m) => ({
        role: m.role || (m.sender_id === 'se7en-bot' ? 'assistant' : 'user'),
        content: m.content || m.text || '',
      })),
    ];

    if (!messages.some((m) => (m.content || m.text) === userQuery)) {
      compiledMessages.push({ role: 'user', content: userQuery });
    }

    return NextResponse.json({
      success: true,
      bot: 'Se7eN AI Bot',
      version: '2.0.0',
      action,
      model: model || 'Se7eN AI Bot Ultra',
      systemPrompt,
      query: userQuery,
      status: 'active',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Se7eN AI Bot API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Se7eN AI Bot cluster transmission failure',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    bot: 'Se7eN AI Bot',
    creator: 'Bilal Se7eN',
    capabilities: [
      'Site queries & tool navigation',
      'Content generation & technical writing',
      'Curriculum & course architecture',
      'HTML/Tailwind code conversion & JSON/XML formatting',
      'Multi-modal document & image intelligence',
    ],
    timestamp: new Date().toISOString(),
  });
}
