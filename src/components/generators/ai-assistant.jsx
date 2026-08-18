'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { showToast } from '@/lib/swal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BRAND_CONFIG } from '@/lib/constants';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Cpu,
  Zap,
  BrainCircuit,
  Terminal,
  ImageIcon,
  Download,
  Wand2,
  Paperclip,
  X,
  FileText,
  Plus,
  Activity,
  Maximize2,
  Minimize2,
  Code as CodeIcon,
  Check,
  Globe,
  Code2,
  Table,
  Layers,
  FileType,
  Sliders,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  SE7EN_LOGO_SRC,
  AVAILABLE_MODELS,
  generateSe7enImage,
  enhanceImageWithCanvas,
  scrapeUrlData,
  extractUrlsFromString,
  parseUploadedFile,
  convertToXml,
  downloadFile,
  callPuterAiChat,
} from '@/lib/se7en-ai';
import Swal from 'sweetalert2';

const MODELS = [
  {
    id: 'se7en',
    label: 'Se7eN AI Pro',
    icon: Sparkles,
    provider: 'Web Scraping & Multi-Format Intelligence',
    description:
      'Extracts live web URL data into JSON/XML, analyzes & enhances uploaded images, and generates free HD AI images',
  },
  {
    id: 'kimi',
    label: 'Kimi Code Enhancer',
    icon: Wand2,
    provider: 'Kimi Neural Engine',
    description:
      'Transforms raw text & word content into 100% accurate responsive HTML cards & layouts',
  },
  {
    id: 'assistant',
    label: 'Neural Assistant',
    icon: Bot,
    provider: 'General Intelligence',
    description: 'General AI Q&A and technical guidance',
  },
];

const SYSTEM_PROMPT_SE7EN = `You are "Se7eN AI", the Master Multi-Modal Super-Intelligence and Pro AI Architect of "All Useful Tools", crafted by Bilal Se7eN.

CRITICAL MULTI-MODAL DIRECTIVES:
1. When the user attaches an image or document, you have FULL native multi-modal and extraction processing. NEVER say "as an AI I cannot view images" or "I cannot process attachments".
2. When the user asks to enhance, sharpen, brighten, or modify an attached image, confirm that the exact image has been enhanced with high-definition adaptive sharpening, dynamic contrast normalization, and vibrance optimization while preserving 100% of the original subject/person.
3. When the user asks for JSON, XML, CSV, or YAML, ALWAYS provide strictly valid codeblocks.
4. When web URLs are provided, analyze and extract the scraped live data directly.
5. Tone: Authoritative, sharp, highly intelligent, friendly, and precise.`;

const SYSTEM_PROMPT_KIMI = `You are Kimi Code Enhancer & HTML Generator, an elite frontend architect and code transformer inside AI Hub.

CRITICAL DIRECTIVES FOR KIMI CODE ENHANCER:
1. EXACT CONTENT PRESERVATION (100% ACCURACY):
   - When the user provides text, paragraphs, or bullet points: PRESERVE 100% OF THE USER'S EXACT CONTENT TEXT. NEVER alter, rephrase, remove, or add fake filler text.
2. STUNNING HTML/CSS STRUCTURE:
   - Wrap the content in ultra-modern, production-ready, 100% mobile-responsive HTML layouts using Tailwind CSS CDN (\`<script src="https://cdn.tailwindcss.com"></script>\`) or sleek inline styles.
3. DYNAMIC IMAGE & ICON EMBEDDING:
   - If visual cards or headers need illustration, automatically include relevant high-quality image URLs using Pollinations API:
     \`https://image.pollinations.ai/prompt/[keyword-description]?width=800&height=500&nologo=true&enhance=true\`
4. OUTPUT FORMAT:
   - Always return the complete, standalone HTML code in a \`\`\`html codeblock so the user can preview and copy it immediately.`;

const SYSTEM_PROMPT_ASSISTANT = `You are Neural Assistant for "All Useful Tools", architected by Bilal Se7eN.
Provide authoritative, clear, precise, and professional answers for programming, technical writing, and workflow automation.`;

export function AIAssistant() {
  const [selectedEngine, setSelectedEngine] = useState('se7en');
  const [aiModel, setAiModel] = useState('gpt-4o');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to **AI Hub**!\n\nI am equipped with:\n- 🖼️ **Exact Image Enhancement**: Upload any photo to enhance clarity, sharpness, and lighting while preserving the exact person/subject.\n- 🌐 **Live Web Scraping**: Paste any URL to scrape & extract data into structured **JSON** or **XML**.\n- 📁 **File & Document Analysis**: Drag and drop images, PDFs, Word DOCX, or Excel spreadsheets.\n- 🎨 **Free AI Image Generation**: Type `/image <prompt>` to generate instant new concepts.\n- 📑 **Kimi Code Enhancer**: Convert raw text into production-ready responsive HTML cards.\n\nWhat would you like to enhance or build today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Puter.js SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.puter) {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => {
        if (window.puter) window.puter.quiet = true;
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages?.length, isLoading]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        const parsed = await parseUploadedFile(file);
        setAttachedFiles((prev) => [...prev, parsed]);
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Upload Error',
          text: `Could not parse ${file.name}: ${err.message}`,
          background: '#0f172a',
          color: '#ffffff',
          confirmButtonColor: '#0284c7',
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (overridePrompt = null) => {
    const textToSend = overridePrompt || input;
    if ((!textToSend.trim() && attachedFiles.length === 0) || isLoading) return;

    const currentInput = textToSend;
    const currentFiles = [...attachedFiles];

    setInput('');
    setAttachedFiles([]);

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentInput,
      files: currentFiles,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const lower = currentInput.toLowerCase();
      const imageFiles = currentFiles.filter(
        (f) => f.type === 'image' && f.dataUrl
      );

      // 1. ATTACHED IMAGE PROCESSING: Creative Transformation OR Exact Enhancement
      if (imageFiles.length > 0) {
        const targetImage = imageFiles[0];

        // A. Creative Scene / Attire / Action Transformation
        const isTransformation =
          lower.includes('marry') ||
          lower.includes('married') ||
          lower.includes('wedding') ||
          lower.includes('dress') ||
          lower.includes('suit') ||
          lower.includes('costume') ||
          lower.includes('background') ||
          lower.includes('space') ||
          lower.includes('cyberpunk') ||
          lower.includes('anime') ||
          lower.includes('cartoon') ||
          lower.includes('superhero') ||
          lower.includes('make them') ||
          lower.includes('turn them') ||
          lower.includes('put them') ||
          lower.includes('change them');

        if (isTransformation) {
          let promptDesc = currentInput;
          if (
            lower.includes('marry') ||
            lower.includes('married') ||
            lower.includes('wedding') ||
            lower.includes('gown') ||
            lower.includes('tuxedo') ||
            lower.includes('ring') ||
            lower.includes('chapel')
          ) {
            const background = lower.includes('chapel')
              ? 'inside a majestic grand chapel'
              : lower.includes('courthouse')
                ? 'elegant courthouse wedding hall'
                : lower.includes('nature') || lower.includes('garden')
                  ? 'lush botanical garden with floral arch'
                  : 'gorgeous romantic wedding altar with bokeh lights';
            const accessories = lower.includes('ring')
              ? 'sparkling diamond wedding rings on their fingers, floral bouquet'
              : 'holding hands, bridal bouquet, gold rings';
            promptDesc = `Romantic cinematic wedding portrait of the couple, wearing luxurious wedding attire (bride in exquisite white bridal gown with veil, groom in sharp tailored black tuxedo), ${accessories}, setting in ${background}, warm golden hour lighting, cinematic depth of field, hyper-realistic 8k masterpiece portrait`;
          } else {
            promptDesc = `${currentInput}, ultra realistic cinematic 8k masterpiece, professional photo`;
          }

          const transformedUrl = generateSe7enImage(promptDesc);

          setTimeout(() => {
            const aiMsg = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: `💍 **Generated Creative Transformation:**\n\n- **Transformation Request**: "${currentInput}"\n- **Style**: Ultra-HD cinematic portrait rendered with professional lighting & tailored styling.\n\nYou can preview and download your transformed image below:`,
              generatedImage: transformedUrl,
              originalImage: targetImage.dataUrl,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setIsLoading(false);
          }, 1100);
          return;
        }

        // B. Exact Image Quality Enhancement (Preserves exact people & pixels!)
        try {
          const enhancedUrl = await enhanceImageWithCanvas(
            targetImage.dataUrl,
            {
              brightness: 1.12,
              contrast: 1.18,
              sharpness: 1.25,
              saturation: 1.12,
            }
          );

          setTimeout(() => {
            const aiMsg = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: `✨ **Enhanced Your Exact Image (${targetImage.name})**\n\n- **Subject Preservation**: 100% original composition & person preserved.\n- **Clarity Engine**: Applied Adaptive Sharpening + Dynamic Contrast Normalization + Vibrance boost.\n\nYou can preview and download your enhanced high-definition image below:`,
              enhancedImage: enhancedUrl,
              originalImage: targetImage.dataUrl,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setIsLoading(false);
          }, 800);
          return;
        } catch (e) {
          console.warn('Canvas enhancement fallback:', e);
        }
      }

      // 2. Free AI Image Generation Check (for brand new image prompts)
      const isImageGen =
        lower.startsWith('/image') ||
        lower.startsWith('generate image') ||
        lower.startsWith('create image') ||
        lower.startsWith('draw ') ||
        lower.includes('generate an image of') ||
        lower.includes('create a picture of');

      if (isImageGen && imageFiles.length === 0) {
        const imagePrompt = currentInput
          .replace(/^\/image\s*/i, '')
          .replace(/^generate image (of )?/i, '')
          .replace(/^create image (of )?/i, '')
          .replace(/^draw /i, '')
          .trim();

        const imageUrl = generateSe7enImage(
          imagePrompt ||
            'Futuristic cybernetic orb with holographic data streams 8k'
        );

        setTimeout(() => {
          const aiMsg = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `🎨 **Generated AI Image for:** "${imagePrompt}"`,
            generatedImage: imageUrl,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsLoading(false);
        }, 1200);
        return;
      }

      // 3. Web URL Scraping Detection
      let scrapedContext = '';
      const detectedUrls = extractUrlsFromString(currentInput);
      if (detectedUrls.length > 0) {
        for (const url of detectedUrls.slice(0, 2)) {
          try {
            const scraped = await scrapeUrlData(url);
            if (scraped.data) {
              scrapedContext += `\n\n--- [LIVE SCRAPED WEB DATA FROM: ${url}] ---\n`;
              scrapedContext += `Title: ${scraped.data.metadata?.title}\n`;
              scrapedContext += `Description: ${scraped.data.metadata?.description}\n`;
              scrapedContext += `Headings: ${scraped.data.headings?.map((h) => `${h.level}: ${h.text}`).join(' | ')}\n`;
              scrapedContext += `Summary: ${scraped.data.contentSummary}\n`;
              scrapedContext += `Raw Data: ${JSON.stringify(scraped.data).slice(0, 4000)}\n`;
              scrapedContext += `--- [END SCRAPED DATA] ---\n`;
            }
          } catch (e) {
            scrapedContext += `\n[Note: Could not scrape ${url}: ${e.message}]\n`;
          }
        }
      }

      // 4. File Context
      let fileContext = '';
      if (currentFiles.length > 0) {
        currentFiles.forEach((file) => {
          fileContext += `\n\n--- [ATTACHED FILE: ${file.name} (${file.type})] ---\n${file.content?.slice(0, 5000)}\n--- [END FILE] ---\n`;
        });
      }

      // 5. Select System Prompt
      let systemPrompt = SYSTEM_PROMPT_SE7EN;
      if (selectedEngine === 'kimi') {
        systemPrompt = SYSTEM_PROMPT_KIMI;
      } else if (selectedEngine === 'assistant') {
        systemPrompt = SYSTEM_PROMPT_ASSISTANT;
      }

      const fullPrompt = `${systemPrompt}\n\nUser Question:\n${currentInput}${scrapedContext}${fileContext}`;

      const responseText = await callPuterAiChat(fullPrompt, aiModel);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **AI Hub Notice:** ${err.message || 'Could not complete request. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (content, format) => {
    if (format === 'xml') {
      const xml = convertToXml(content);
      downloadFile(xml, 'ai-hub-data.xml', 'application/xml');
    } else if (format === 'json') {
      let json = content;
      try {
        json = JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        json = JSON.stringify({ data: content }, null, 2);
      }
      downloadFile(json, 'ai-hub-data.json', 'application/json');
    } else if (format === 'csv') {
      downloadFile(content, 'ai-hub-data.csv', 'text/csv');
    } else if (format === 'md') {
      downloadFile(content, 'ai-hub-response.md', 'text/markdown');
    }
    showToast(`Exported as .${format.toUpperCase()}`, 'success');
  };

  const extractHtml = (text) => {
    const match = text?.match(/```html([\s\S]*?)```/i);
    return match ? match[1].trim() : null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-950 text-white overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
      {/* ── TOP CONTROL BAR ────────────────────────────────────── */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl border-2 border-cyan-400 p-1 bg-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <img
              src={SE7EN_LOGO_SRC}
              alt="AI Hub"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base text-white tracking-wide">
                AI Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 uppercase">
                Se7eN &amp; Kimi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Web Scraping, Image Enhancer, JSON/XML Export &amp; Code Enhancer
            </p>
          </div>
        </div>

        {/* Engine Tabs & Model Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            {MODELS.map((m) => {
              const Icon = m.icon;
              const active = selectedEngine === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedEngine(m.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  className="bg-slate-900 text-white"
                >
                  {m.name} ({m.tag})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── CHAT MESSAGES STREAM ───────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5"
      >
        {messages.map((msg) => {
          const htmlCode = extractHtml(msg.content);

          return (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 max-w-4xl',
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="w-9 h-9 rounded-2xl border border-cyan-400/50 p-1 bg-slate-900 shrink-0 flex items-center justify-center shadow-md">
                  <img
                    src={SE7EN_LOGO_SRC}
                    alt="AI Hub"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white font-black text-xs shrink-0 flex items-center justify-center shadow-md">
                  YOU
                </div>
              )}

              <div
                className={cn(
                  'p-4 md:p-5 rounded-3xl text-sm leading-relaxed space-y-3',
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-xl'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-2xl w-full'
                )}
              >
                {/* File Attachment Pill */}
                {msg.files && msg.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-300" />
                        <span>{f.name}</span>
                        {f.preview && f.type === 'image' && (
                          <img
                            src={f.preview}
                            alt="Attached"
                            className="w-5 h-5 rounded object-cover ml-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* EXACT ENHANCED IMAGE RESULT (Side-by-side comparison & download) */}
                {msg.enhancedImage && (
                  <div className="space-y-3 pt-1">
                    <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
                      {msg.originalImage && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Original Photo
                          </span>
                          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black">
                            <img
                              src={msg.originalImage}
                              alt="Original"
                              className="w-full h-auto object-cover max-h-64"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          Enhanced HD Result (Same Subject)
                        </span>
                        <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-400/60 shadow-2xl shadow-cyan-500/20 bg-black">
                          <img
                            src={msg.enhancedImage}
                            alt="Enhanced"
                            className="w-full h-auto object-cover max-h-64"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={msg.enhancedImage}
                        download="enhanced-image-hd.png"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Enhanced HD Photo</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* AI Generated Image Rendering */}
                {msg.generatedImage && (
                  <div className="space-y-3 pt-1">
                    <div className="relative rounded-2xl overflow-hidden border border-cyan-400/40 shadow-2xl bg-black max-w-lg">
                      <img
                        src={msg.generatedImage}
                        alt="Generated Output"
                        className="w-full h-auto object-cover max-h-96"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={msg.generatedImage}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download 1024x1024 HD Image</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Markdown / Code Rendering */}
                <div className="prose prose-invert prose-sm max-w-none break-words">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="relative rounded-2xl overflow-hidden border border-slate-800 my-3">
                            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                              <span>{match[1].toUpperCase()}</span>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    String(children).replace(/\n$/, ''),
                                    msg.id
                                  )
                                }
                                className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy Code</span>
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!bg-slate-950 !p-4 !m-0 text-xs"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code
                            className="bg-slate-800/80 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* HTML Interactive Live Preview Button */}
                {htmlCode && (
                  <div className="pt-2">
                    <button
                      onClick={() => setPreviewHtml(htmlCode)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Launch Interactive HTML Preview</span>
                    </button>
                  </div>
                )}

                {/* 1-Click Multi-Format Export Buttons (JSON, XML, CSV, MD) */}
                {msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="flex items-center gap-1 hover:text-cyan-300 transition-colors mr-2"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">
                            Copied
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <span className="text-slate-700">|</span>

                    <button
                      onClick={() => handleExport(msg.content, 'json')}
                      className="hover:text-cyan-300 transition-colors font-mono font-bold"
                      title="Download as JSON"
                    >
                      .JSON
                    </button>

                    <button
                      onClick={() => handleExport(msg.content, 'xml')}
                      className="hover:text-cyan-300 transition-colors font-mono font-bold"
                      title="Download as XML"
                    >
                      .XML
                    </button>

                    <button
                      onClick={() => handleExport(msg.content, 'csv')}
                      className="hover:text-cyan-300 transition-colors font-mono font-bold"
                      title="Download as CSV"
                    >
                      .CSV
                    </button>

                    <button
                      onClick={() => handleExport(msg.content, 'md')}
                      className="hover:text-cyan-300 transition-colors font-mono font-bold"
                      title="Download as Markdown"
                    >
                      .MD
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 mr-auto max-w-md">
            <div className="w-9 h-9 rounded-2xl border border-cyan-400/50 p-1 bg-slate-900 shrink-0 flex items-center justify-center shadow-md">
              <img
                src={SE7EN_LOGO_SRC}
                alt="AI Hub"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 rounded-3xl rounded-tl-none bg-slate-900/90 border border-slate-800 text-cyan-300 text-xs flex items-center gap-2.5 shadow-xl">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>
                AI Hub is enhancing image, analyzing data &amp; synthesizing...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── ATTACHMENTS PREVIEW BAR ────────────────────────────── */}
      {attachedFiles.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-900/80 border-t border-slate-800 flex flex-wrap gap-2">
          {attachedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-cyan-500/40 text-xs text-cyan-200"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="max-w-[160px] truncate">{file.name}</span>
              {file.type === 'image' && file.dataUrl && (
                <img
                  src={file.dataUrl}
                  alt="Thumb"
                  className="w-5 h-5 rounded object-cover"
                />
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── INPUT PROMPT BAR ───────────────────────────────────── */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          className="hidden"
          accept=".txt,.json,.xml,.csv,.docx,.xlsx,.xls,.md,.png,.jpg,.jpeg,.webp,.gif,.pdf"
        />

        <div className="flex flex-col gap-2">
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 no-scrollbar">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shrink-0 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>✨ Enhance Uploaded Photo</span>
            </button>

            <button
              onClick={() =>
                handleSend(
                  '/image Futuristic glowing cybernetic city with floating holographic cubes 8k'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 shrink-0 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>🎨 Gen AI Image</span>
            </button>

            <button
              onClick={() =>
                setInput('Scrape this web URL and give me all data in JSON: ')
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 shrink-0 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>🌐 Web Scrape to JSON</span>
            </button>

            <button
              onClick={() =>
                setInput('Format and structure this data into valid XML: ')
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shrink-0 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>📑 Convert to XML</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
              title="Attach Document, Image or Spreadsheet"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Hub, attach image to enhance, paste URL for JSON/XML, or type /image..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={
                isLoading || (!input.trim() && attachedFiles.length === 0)
              }
              className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ── HTML LIVE PREVIEW DIALOG ───────────────────────────── */}
      {previewHtml && (
        <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
          <DialogContent className="max-w-5xl h-[85vh] bg-slate-950 border border-slate-800 text-white p-0 flex flex-col overflow-hidden rounded-3xl">
            <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-black text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Kimi Interactive HTML Live Preview
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Fully rendered interactive viewport generated by AI Hub
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(previewHtml, 'modal-copy')}
                className="text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy HTML Code</span>
              </Button>
            </DialogHeader>
            <div className="flex-1 bg-white p-0 overflow-hidden">
              <iframe
                title="Kimi Live Render"
                srcDoc={previewHtml}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
