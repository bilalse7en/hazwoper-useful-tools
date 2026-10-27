'use client';

import { useState, useId, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  GraduationCap,
  PenTool,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Target,
  Presentation,
  Wand2,
  Code,
  ImageIcon,
  ScanText,
  Search,
  Video,
  Scissors,
  Globe,
  Repeat,
  Music,
  AudioWaveform,
  FileType,
  BrainCircuit,
  FileCode,
  X,
  ExternalLink,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const TOOLS_DIRECTORY = [
  {
    id: 'course-generators',
    title: 'Generators & Course Tools',
    icon: Sparkles,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    tools: [
      {
        id: 'ai-course-creator',
        name: 'AI Course Creator',
        href: '/tools/ai-course-creator',
        description: 'Full LMS course builder with modules, scripts & quizzes',
        icon: Sparkles,
        badge: 'PRO',
      },
      {
        id: 'lesson-quiz-builder',
        name: 'Lesson Quiz Builder',
        href: '/tools/lesson-quiz-builder',
        description: 'Auto-extract quizzes & assessments from DOCX documents',
        icon: Target,
        badge: 'HOT',
      },
      {
        id: 'slide-generator',
        name: 'Slide Generator',
        href: '/tools/slide-generator',
        description:
          'Interactive Before vs With AI comparison presentation slides',
        icon: Presentation,
        badge: 'NEW',
      },
      {
        id: 'html-design-enhancer',
        name: 'HTML Design Enhancer',
        href: '/tools/html-design-enhancer',
        description: 'Convert inline style attributes to modern Tailwind CSS',
        icon: Wand2,
        badge: 'AI',
      },
      {
        id: 'web-content',
        name: 'Web Content Generator',
        href: '/tools/web-content',
        description: 'Structured web training modules and course outlines',
        icon: GraduationCap,
      },
      {
        id: 'blog-generator',
        name: 'Blog Generator',
        href: '/tools/blog-generator',
        description: 'SEO-ready articles and technical blog posts',
        icon: PenTool,
      },
      {
        id: 'glossary-generator',
        name: 'Glossary Generator',
        href: '/tools/glossary-generator',
        description: 'Alphabetical course glossaries and terminology tables',
        icon: BookOpen,
      },
      {
        id: 'resource-generator',
        name: 'Resource Generator',
        href: '/tools/resource-generator',
        description: 'Curated checklists, tables and reference study sheets',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    id: 'converters-extractors',
    title: 'Converters & Documents',
    icon: FileCode,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    tools: [
      {
        id: 'course-json-converter',
        name: 'LMS JSON Converter',
        href: '/tools/course-json-converter',
        description: 'Convert DOCX to clean hierarchical LMS course JSON',
        icon: FileCode,
        badge: 'NEW',
      },
      {
        id: 'word-to-html',
        name: 'Word to HTML',
        href: '/tools/word-to-html',
        description: 'Transform DOCX documents to clean, semantic HTML',
        icon: FileType,
      },
      {
        id: 'document-extractor',
        name: 'Document Extractor',
        href: '/tools/document-extractor',
        description: 'Extract raw text, headings and tables from documents',
        icon: FileText,
      },
      {
        id: 'pdf-editor',
        name: 'Free PDF Editor',
        href: '/tools/pdf-editor',
        description: 'Add pages, annotations, signatures and reorder PDFs',
        icon: FileText,
        badge: 'FREE',
      },
      {
        id: 'html-cleaner',
        name: 'HTML Cleaner',
        href: '/tools/html-cleaner',
        description: 'Sanitize markup, remove junk styles & format code',
        icon: Code,
      },
    ],
  },
  {
    id: 'media-video',
    title: 'Media & Stock Studio',
    icon: Video,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    tools: [
      {
        id: 'adobe-stock-finder',
        name: 'AI Adobe Stock Finder',
        href: '/tools/adobe-stock-finder',
        description:
          'Smart search for Adobe Stock assets + free Unsplash images',
        icon: Search,
        badge: 'SMART AI',
      },
      {
        id: 'short-generator-2',
        name: 'Short Generator 2.0',
        href: '/tools/short-generator-2',
        description:
          'AI Cloud video shorts with authentic Urdu & Roman captions',
        icon: Sparkles,
        badge: 'v2.0',
      },
      {
        id: 'ai-video-shorts',
        name: 'AI Video to Shorts',
        href: '/tools/ai-video-shorts',
        description:
          'Smart 9:16 portrait framing & multi-track timeline studio',
        icon: Scissors,
        badge: 'STUDIO',
      },
      {
        id: 'youtube-downloader',
        name: 'Social Video Downloader',
        href: '/tools/youtube-downloader',
        description: 'Download YouTube, TikTok, Reels in 4K & MP3 audio',
        icon: Globe,
        badge: '4K',
      },
      {
        id: 'video-compressor',
        name: 'Video Compressor',
        href: '/tools/video-compressor',
        description: 'Compress video files locally without quality loss',
        icon: Video,
      },
      {
        id: 'video-converter',
        name: 'Video Converter',
        href: '/tools/video-converter',
        description: 'Convert between MP4, WebM, AVI and MKV formats',
        icon: Repeat,
      },
      {
        id: 'video-to-gif',
        name: 'Video to GIF',
        href: '/tools/video-to-gif',
        description: 'Generate high-FPS animated GIFs from video clips',
        icon: Video,
      },
    ],
  },
  {
    id: 'image-audio-ai',
    title: 'Image, Audio & AI Hub',
    icon: Wand2,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    tools: [
      {
        id: 'watermark-remover',
        name: 'Watermark Remover',
        href: '/tools/watermark-remover',
        description: 'AI content-aware removal of stamps, watermarks & logos',
        icon: Wand2,
        badge: 'AI',
      },
      {
        id: 'bg-remover',
        name: 'Background Remover',
        href: '/tools/bg-remover',
        description: 'Instant 1-click transparent PNG cutouts',
        icon: Wand2,
        badge: 'AI',
      },
      {
        id: 'image-to-text',
        name: 'Image to Text (OCR)',
        href: '/tools/image-to-text',
        description: 'Extract editable text and tables from images',
        icon: ScanText,
      },
      {
        id: 'image-converter',
        name: 'Image Converter',
        href: '/tools/image-converter',
        description: 'Convert between PNG, JPG, WebP, AVIF & SVG',
        icon: ImageIcon,
      },
      {
        id: 'audio-converter',
        name: 'Audio Converter',
        href: '/tools/audio-converter',
        description: 'Convert MP3, WAV, AAC, M4A, OGG & FLAC',
        icon: Music,
      },
      {
        id: 'audio-editor',
        name: 'Audio Editor',
        href: '/tools/audio-editor',
        description: 'Trim, cut, normalize loudness & merge audio',
        icon: AudioWaveform,
      },
      {
        id: 'ai-assistant',
        name: 'AI Assistant Hub',
        href: '/tools/ai-assistant',
        description: 'Multi-modal AI assistant & custom prompt workspaces',
        icon: BrainCircuit,
        badge: 'CHAT',
      },
    ],
  },
];

export function ToolsMegaMenu({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS_DIRECTORY;
    const q = searchQuery.toLowerCase().trim();

    return TOOLS_DIRECTORY.map((category) => {
      const matchingTools = category.tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.badge?.toLowerCase().includes(q)
      );
      return {
        ...category,
        tools: matchingTools,
      };
    }).filter((category) => category.tools.length > 0);
  }, [searchQuery]);

  const totalMatchingTools = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.tools.length, 0);
  }, [filteredCategories]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-50 cursor-pointer"
          />

          {/* Mega Menu Dropdown Container */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-50 max-h-[calc(100vh-80px)] overflow-y-auto bg-card/98 backdrop-blur-2xl border-b border-border shadow-2xl pb-6"
          >
            <div className="container mx-auto px-4 py-4 max-w-7xl">
              {/* Header with Search and Close */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border/70">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                      All Useful Tools Mega Menu
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      27+ Free Browser-Based Tools • 100% Private • Local-First
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tools (e.g., Stock, Quiz, Video, Word, PDF)..."
                      className="h-9 pl-9 pr-8 text-xs bg-muted/40 border-border/80 focus-visible:ring-primary rounded-xl"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-9 w-9 p-0 rounded-xl cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
                    aria-label="Close tools menu"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tools Categories Grid */}
              {filteredCategories.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-bold text-muted-foreground">
                    No tools found matching &quot;{searchQuery}&quot;
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="text-xs rounded-xl"
                  >
                    Clear Filter
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {filteredCategories.map((category) => {
                    const CatIcon = category.icon;
                    return (
                      <div
                        key={category.id}
                        className="flex flex-col space-y-2.5 bg-muted/20 dark:bg-zinc-900/40 p-3 rounded-2xl border border-border/40"
                      >
                        {/* Category Heading */}
                        <div className="flex items-center gap-2 px-1 py-1">
                          <div
                            className={cn(
                              'h-6 w-6 rounded-md flex items-center justify-center border',
                              category.color
                            )}
                          >
                            <CatIcon className="h-3 w-3" />
                          </div>
                          <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                            {category.title}
                          </h3>
                        </div>

                        {/* Category Tools List */}
                        <div className="flex flex-col space-y-1">
                          {category.tools.map((tool) => {
                            const ToolIcon = tool.icon;
                            return (
                              <Link
                                key={tool.id}
                                href={tool.href}
                                onClick={onClose}
                                className="group p-2 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/15 transition-all flex items-start gap-2.5 cursor-pointer border border-transparent hover:border-primary/20"
                              >
                                <div className="h-7 w-7 rounded-lg bg-card border border-border/80 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                  <ToolIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                      {tool.name}
                                    </span>
                                    {tool.badge && (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'text-[9px] px-1 py-0 h-3.5 font-bold uppercase tracking-wider',
                                          tool.badge === 'PRO' ||
                                            tool.badge === 'v2.0'
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                            : tool.badge === 'SMART AI' ||
                                                tool.badge === 'AI'
                                              ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
                                              : tool.badge === 'HOT'
                                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                        )}
                                      >
                                        {tool.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1">
                                    {tool.description}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Quick Bar */}
              <div className="mt-5 pt-3 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {totalMatchingTools} tools available
                  </span>
                  <span>•</span>
                  <span>Free & No Signup Required</span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/tools"
                    onClick={onClose}
                    className="font-bold text-primary hover:underline flex items-center gap-1 group"
                  >
                    <span>View Complete Tools Directory</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-7 text-xs px-2.5 rounded-lg text-muted-foreground"
                  >
                    Press ESC to close
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
