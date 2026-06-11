'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Sparkles,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Loader2,
  FileText,
  Zap,
  Layout,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toolInfo } from '@/lib/seo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TOOL_SUMMARY = Object.entries(toolInfo)
  .map(([slug, info]) => `- ${info.name}: ${info.description}`)
  .join('\n');

const SYSTEM_PROMPT = `You are the Puter AI "Autopilot Ultimate" for "HAZWOPER Useful Tools".
Your mission is to generate an exhaustive, world-class blog post of exactly 5000 words.
This content must be the absolute authority on the topic provided.

Core Directive:
- Target length: 5000 words.
- Format: Professional HTML (h2, h3, p, strong, ul, li).
- Required Designs:
  - At least 2 comparative <table> elements with technical data.
  - At least 3 detailed <blockquote> blocks for expert perspective.
  - Deep-dive analysis of professional utility tools (Image Converters, HTML Cleaners, Document Extractors).
- SEO: Automatic title synthesis and human-readable slugs.

Ecosystem Intelligence:
- Web Content Generator: Extract Course Content, Syllabus, FAQs, and Resources from DOCX.
- Blog Generator: AI-powered blog post creator from technical documents.
- Glossary Generator: Automated term extraction and alphabetized list creation.
- Resource Generator: Intelligent citation and reference organizer.
- HTML Cleaner: Sanitizes messy regulatory code into pristine HTML5.
- Image Converter: Professional batch conversion to WebP, PNG, JPG (privacy-first).
- Video/Audio Converters: High-fidelity browser-side re-encoding via FFmpeg WASM.
- Video Compressor: Large-scale size reduction while preserving visual clarity.
- OCR (Image to Text): Multi-language extraction from scans and whiteboard captures.
- Word to HTML: Optimized migration of legacy Word content with structural integrity.

Return result as a JSON array of 3 concepts, each with:
- "title": (Auto-generated authority title)
- "summary": (Exhaustive SEO-driven description)
- "slug": (Auto-generated path)
- "suggested_content": (The 5000-word HTML body)
- "category": "Industrial Excellence"
Only output raw JSON. No conversational text.`;

export function PuterAgent() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(null);
  const [puterReady, setPuterReady] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [targetWordCount, setTargetWordCount] = useState('5000');

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_suggestions')
          .select('*')
          .eq('status', 'suggested')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSuggestions(data || []);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    };

    fetchSuggestions();
    if (typeof window !== 'undefined' && !window.puter) {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => setPuterReady(true);
      document.head.appendChild(script);
    } else if (window.puter) {
      queueMicrotask(() => setPuterReady(true));
    }
  }, []);

  const generateSuggestions = async () => {
    if (!puterReady || isLoading) return;
    setIsLoading(true);
    const toastId = toast.loading('Consulting Puter AI Engine...');

    try {
      const response = await window.puter.ai.chat(
        `Generate 3 professional 100% automated blog suggestions for our ecosystem. Target word count: ${targetWordCount}.`,
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Initiate Friday Autopilot sequence. Synchronize 3 authority posts. Target: ${targetWordCount} words each. Output raw JSON array only.`,
            },
          ],
        }
      );

      const text =
        typeof response === 'string'
          ? response
          : response?.message?.content || response?.toString();

      let jsonStr = '';
      const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);

      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      } else {
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          jsonStr = text.substring(firstBracket, lastBracket + 1);
        }
      }

      if (!jsonStr) throw new Error('Neural extraction failed');

      const rawData = JSON.parse(jsonStr);

      // Save to database for persistence
      const inserts = rawData.map((blog) => ({
        title: blog.title,
        summary: blog.summary,
        slug: blog.slug + '-' + Math.random().toString(36).substring(2, 6),
        suggested_content: blog.suggested_content,
        category: blog.category || 'Industrial Excellence',
        status: 'suggested',
      }));

      const { data: savedData, error: saveError } = await supabase
        .from('blog_suggestions')
        .insert(inserts)
        .select();

      if (saveError) throw saveError;

      setSuggestions(savedData);
      toast.success('Neural Strategy Synchronized and Saved.', { id: toastId });

      if (autoPublish && savedData.length > 0) {
        toast.info('Auto-Live sequence initiated...');
        for (let i = 0; i < savedData.length; i++) {
          await publishBlog(savedData[i], i, true);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Neural cluster timeout.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSuggestion = async (id, index) => {
    try {
      const { error } = await supabase
        .from('blog_suggestions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
      toast.success('Strategy dismissed.');
    } catch (err) {
      toast.error('Failed to dismiss strategy.');
    }
  };

  const publishBlog = async (blog, index, silent = false) => {
    setIsPublishing(index);
    const toastId = silent
      ? null
      : toast.loading(`Deploying "${blog.title}"...`);

    try {
      // 1. Move to main blogs table
      const { error: insertError } = await supabase.from('blogs').insert([
        {
          title: blog.title,
          summary: blog.summary,
          slug: blog.slug,
          content: blog.suggested_content || blog.content,
          category: blog.category || 'Professional Suite',
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // 2. Remove from suggestions (or update status)
      await supabase.from('blog_suggestions').delete().eq('id', blog.id);

      toast.success('Sequence live on main feed.', { id: toastId });
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error(err);
      toast.error('Deployment failed.', { id: toastId });
    } finally {
      setIsPublishing(null);
    }
  };

  return (
    <div className="space-y-8 animate-in-fade">
      {/* Header Info */}
      <Card className="rounded-[40px] border-border bg-card/40 backdrop-blur-xl p-8 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
          <Bot className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                Puter AI Autopilot
              </h3>
            </div>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Our neural agent monitors the ecosystem and generates professional
              blog content every Friday. Review the weekly strategy suggestions
              and deploy them to the main feed with a single click.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-publish"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="w-4 h-4 rounded-md border-primary/20 bg-primary/5 text-primary focus:ring-primary/40 cursor-pointer"
                />
                <label
                  htmlFor="auto-publish"
                  className="text-[10px] font-black uppercase tracking-widest text-primary/80 cursor-pointer"
                >
                  Auto-Live Mode
                </label>
              </div>

              <div className="flex items-center gap-2 border-l border-border pl-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Target Words:
                </span>
                <input
                  type="number"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(e.target.value)}
                  className="w-16 h-8 bg-transparent border-0 border-b border-border text-[11px] font-bold focus:ring-0 focus:border-primary text-center px-0 py-0"
                />
              </div>

              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 font-black text-[9px] px-3 py-1"
              >
                <Calendar className="w-3 h-3 mr-1.5" /> EVERY FRIDAY: 09:00 AM
              </Badge>
            </div>
          </div>
          <Button
            onClick={generateSuggestions}
            disabled={isLoading || !puterReady}
            className="h-16 px-10 rounded-[28px] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {autoPublish ? 'Launch Autonomous Run' : 'Initialize Engine'}
          </Button>
        </div>
      </Card>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {suggestions.length > 0
          ? suggestions.map((blog, idx) => (
              <Card
                key={idx}
                className="rounded-[36px] border-border bg-card/40 backdrop-blur-xl group hover:border-primary/40 transition-all duration-500 flex flex-col overflow-hidden shadow-2xl"
              >
                <div className="h-2 w-full bg-gradient-to-r from-primary/50 to-primary shadow-sm" />
                <CardHeader className="p-8 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className="bg-primary/10 text-primary border-none shadow-none text-[8px] font-black tracking-widest uppercase">
                      {blog.category}
                    </Badge>
                    <FileText className="w-4 h-4 text-muted-foreground opacity-30" />
                  </div>
                  <CardTitle className="text-xl font-black leading-tight tracking-tight group-hover:text-primary transition-colors">
                    {blog.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-3">
                    {blog.summary}
                  </p>
                </CardHeader>
                <CardContent className="p-8 pt-0 mt-auto">
                  <div className="pt-6 border-t border-border/50 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tracking-tighter overflow-hidden">
                      <Layout className="w-3 h-3 shrink-0" />
                      <span className="truncate">/{blog.slug}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => deleteSuggestion(blog.id, idx)}
                        className="flex-1 h-12 rounded-xl border-border hover:bg-red-500/10 hover:text-red-500 font-black uppercase tracking-widest text-[10px]"
                      >
                        Dismiss Strategy
                      </Button>
                      <Button
                        onClick={() => publishBlog(blog, idx)}
                        disabled={isPublishing !== null}
                        className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                      >
                        {isPublishing === idx ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Deploy Sequence <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : !isLoading && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                <div className="w-24 h-24 rounded-[40px] bg-muted flex items-center justify-center">
                  <Zap className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-black uppercase tracking-widest">
                    No Active Strategy
                  </p>
                  <p className="text-xs font-medium">
                    Trigger the Puter AI agent to generate the weekly strategy.
                  </p>
                </div>
              </div>
            )}
      </div>
    </div>
  );
}
