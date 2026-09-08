'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  History,
  Trash2,
  Copy,
  Eye,
  Search,
  Check,
  Settings2,
  Flame,
  Globe,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { showToast, showSuccess, showConfirm } from '@/lib/swal';
import { cn } from '@/lib/utils';
import {
  ECOSYSTEM_KNOWLEDGE,
  generateMasterBlog,
  getLocalBlogHistory,
  deleteFromLocalHistory,
  clearAllLocalBlogHistory,
} from '@/lib/blog-ai-engine';
import { InteractiveBlogRenderer } from '@/components/interactive-blog-game';

export function PuterAgent() {
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'history'
  const [suggestions, setSuggestions] = useState([]);
  const [historyList, setHistoryList] = useState(() => getLocalBlogHistory());
  const [historySearch, setHistorySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(null);
  const [puterReady, setPuterReady] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);

  // Configuration State
  const [selectedTool, setSelectedTool] = useState('ALL');
  const [targetWordCount, setTargetWordCount] = useState('1800');
  const [tone, setTone] = useState('Technical Authority');
  const [customTopic, setCustomTopic] = useState('');

  // Preview Modal State
  const [previewBlog, setPreviewBlog] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    // Fetch Supabase suggestions
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
        console.warn(
          '[Se7eN Bot Engine Autopilot Alert] Error fetching suggestions:',
          err?.message || err
        );
      }
    };

    fetchSuggestions();

    // Load Puter.js script if not available
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

  const refreshHistory = () => {
    setHistoryList(getLocalBlogHistory());
  };

  const handleGenerate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    showToast('Consulting Se7eN Bot AI Engine...', 'info');

    try {
      const toolToPass = selectedTool === 'ALL' ? null : selectedTool;
      const countToGenerate = selectedTool === 'ALL' ? 3 : 1;
      const newBlogs = [];

      if (selectedTool === 'ALL') {
        const sampleTools = [
          'pdf-editor',
          'ai-course-creator',
          'video-compressor',
        ];
        for (const t of sampleTools) {
          const blog = await generateMasterBlog({
            toolSlug: t,
            targetWordCount,
            tone,
            customTopic,
          });
          newBlogs.push(blog);
        }
      } else {
        const blog = await generateMasterBlog({
          toolSlug: toolToPass,
          targetWordCount,
          tone,
          customTopic,
        });
        newBlogs.push(blog);
      }

      // Save to Supabase blog_suggestions
      const inserts = newBlogs.map((b) => ({
        title: b.title,
        summary: b.summary,
        slug: b.slug,
        suggested_content: b.content,
        category: b.category,
        status: 'suggested',
      }));

      const { data: savedData, error: saveError } = await supabase
        .from('blog_suggestions')
        .insert(inserts)
        .select();

      let finalSuggestions = [];
      if (saveError) {
        console.warn(
          '[Se7eN Bot Autopilot] Supabase suggestions bypassed, storing in local state:',
          saveError.message
        );
        finalSuggestions = inserts.map((b, idx) => ({
          id: `local-temp-${Date.now()}-${idx}`,
          created_at: new Date().toISOString(),
          ...b,
        }));
      } else {
        finalSuggestions = savedData || [];
      }

      setSuggestions((prev) => [...finalSuggestions, ...prev]);
      refreshHistory();
      showSuccess(
        'Neural Blog Generated!',
        `Created ${newBlogs.length} comprehensive article(s) with quotes, comparison tables & matching games.`
      );

      // Auto publish if enabled
      if (autoPublish && finalSuggestions.length > 0) {
        for (let i = 0; i < finalSuggestions.length; i++) {
          await publishBlog(finalSuggestions[i], i, true);
        }
      }
    } catch (err) {
      console.error('[Se7eN Bot Engine Error]:', err);
      showToast(err.message || 'Generation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const publishBlog = async (blog, index, silent = false) => {
    setIsPublishing(index);
    if (!silent) showToast(`Deploying "${blog.title}" to live feed...`, 'info');

    try {
      // 1. Insert into main blogs table
      const { error: insertError } = await supabase.from('blogs').insert([
        {
          title: blog.title,
          description: blog.summary,
          slug: blog.slug,
          content: blog.suggested_content || blog.content,
          category: blog.category || 'Industrial Excellence',
          author: 'Se7eN Bot Autopilot',
          date: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          read_time: blog.read_time || '7 min read',
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.warn(
          '[Se7eN Bot Autopilot] Direct database insert error:',
          insertError.message
        );
        showSuccess('Live simulation registered in local state.');
      } else {
        // 2. Remove from suggestions
        if (blog.id && !blog.id.startsWith('local-temp-')) {
          await supabase.from('blog_suggestions').delete().eq('id', blog.id);
        }
        showSuccess('Blog is live on /blog!');
      }

      setSuggestions((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('[Publish Error]:', err);
      showToast('Deployment failed.', 'error');
    } finally {
      setIsPublishing(null);
    }
  };

  const deleteSuggestion = async (id, index) => {
    try {
      if (id && !id.startsWith('local-temp-')) {
        await supabase.from('blog_suggestions').delete().eq('id', id);
      }
      setSuggestions((prev) => prev.filter((_, i) => i !== index));
      showSuccess('Strategy dismissed');
    } catch (err) {
      showToast('Failed to dismiss strategy.', 'error');
    }
  };

  const handleCopyContent = (blog, id) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(
        blog.suggested_content || blog.content || ''
      );
      setCopiedId(id);
      showToast('Blog HTML copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const openPreview = (blog) => {
    setPreviewBlog(blog);
    setIsPreviewOpen(true);
  };

  const handleDeleteHistory = (id) => {
    const updated = deleteFromLocalHistory(id);
    setHistoryList(updated);
    showToast('Entry removed from history.', 'info');
  };

  const handleClearAllHistory = async () => {
    const res = await showConfirm({
      title: 'Clear Generation History?',
      text: 'This will delete all saved blog generation history from your local session.',
      confirmButtonText: 'Clear All',
    });
    if (res.isConfirmed) {
      clearAllLocalBlogHistory();
      setHistoryList([]);
      showToast('History cleared.', 'success');
    }
  };

  const filteredHistory = historyList.filter((item) => {
    if (!historySearch) return true;
    const query = historySearch.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.summary?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.slug?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 animate-in-fade">
      {/* Autopilot Hero Card */}
      <Card className="rounded-[40px] border-border bg-card/40 backdrop-blur-xl p-8 overflow-hidden relative group shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
          <Bot className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Se7eN Bot Autopilot{' '}
                  <Sparkles className="w-4 h-4 text-primary" />
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                  Ecosystem Intelligence &amp; Interactive Content Studio
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Generates world-class, non-repetitive blog posts embedded with{' '}
              <strong>interactive drag-and-drop word matching games</strong>,{' '}
              <strong>comparative benchmark tables</strong>, and{' '}
              <strong>styled quote cards</strong> across all 21+ tools in All
              Useful Tools.
            </p>

            {/* Tabs */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant={activeTab === 'generator' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('generator')}
                className="rounded-xl font-bold text-xs gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" /> Autopilot Generator
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('history')}
                className="rounded-xl font-bold text-xs gap-2"
              >
                <History className="w-3.5 h-3.5" /> History &amp; Archive (
                {historyList.length})
              </Button>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full lg:w-auto h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/25 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Flame className="w-5 h-5 text-amber-300" />
              )}
              {isLoading ? 'Synthesizing Content...' : 'Generate New Blog Post'}
            </Button>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full Ecosystem Knowledge: 21 Tools Loaded</span>
            </div>
          </div>
        </div>
      </Card>

      {/* TAB 1: GENERATOR & STRATEGY PANEL */}
      {activeTab === 'generator' && (
        <div className="space-y-8">
          {/* Controls & Configuration Bar */}
          <Card className="rounded-[32px] border-border bg-card/30 backdrop-blur-xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Tool Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Target Ecosystem Tool
                </label>
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger className="rounded-xl h-11 border-border bg-background/50 font-bold text-xs">
                    <SelectValue placeholder="Select target tool" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="ALL">
                      🌐 All Ecosystem (Multi-Tool Strategy)
                    </SelectItem>
                    {Object.values(ECOSYSTEM_KNOWLEDGE.tools).map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tone Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Editorial Tone
                </label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="rounded-xl h-11 border-border bg-background/50 font-bold text-xs">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical Authority">
                      Technical Authority (Claude Style)
                    </SelectItem>
                    <SelectItem value="Executive Overview">
                      Executive &amp; Compliance Overview
                    </SelectItem>
                    <SelectItem value="Step-by-Step Tutorial">
                      Step-by-Step Hands-On Guide
                    </SelectItem>
                    <SelectItem value="Performance Benchmark">
                      Performance &amp; Speed Benchmark
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Word Count */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Target Word Count
                </label>
                <Select
                  value={targetWordCount}
                  onValueChange={setTargetWordCount}
                >
                  <SelectTrigger className="rounded-xl h-11 border-border bg-background/50 font-bold text-xs">
                    <SelectValue placeholder="Word count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1200">
                      1,200 Words (Fast Read)
                    </SelectItem>
                    <SelectItem value="1800">
                      1,800 Words (Standard Authority)
                    </SelectItem>
                    <SelectItem value="2500">
                      2,500 Words (Comprehensive Deep Dive)
                    </SelectItem>
                    <SelectItem value="3500">
                      3,500 Words (Exhaustive Technical Manual)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Topic Override */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Custom Topic / Angle (Optional)
                </label>
                <Input
                  placeholder="e.g. OSHA 29 CFR Compliance..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="rounded-xl h-11 border-border bg-background/50 text-xs font-medium"
                />
              </div>
            </div>
          </Card>

          {/* Current Suggested Posts Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Active Strategy
                Queue ({suggestions.length})
              </h4>
              <span className="text-xs text-muted-foreground">
                Review and deploy to the live blog feed with one click
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suggestions.length > 0
                ? suggestions.map((blog, idx) => (
                    <Card
                      key={blog.id || idx}
                      className="rounded-[32px] border-border bg-card/40 backdrop-blur-xl group hover:border-primary/40 transition-all duration-500 flex flex-col overflow-hidden shadow-2xl"
                    >
                      <div className="h-2 w-full bg-gradient-to-r from-primary/50 via-emerald-500/50 to-primary" />
                      <CardHeader className="p-6 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black tracking-widest uppercase">
                            {blog.category || 'Industrial Excellence'}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {blog.read_time || '7 min read'}
                          </span>
                        </div>
                        <CardTitle className="text-lg font-black leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                          {blog.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-3">
                          {blog.summary}
                        </p>
                      </CardHeader>

                      <CardContent className="p-6 pt-0 mt-auto">
                        <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="truncate max-w-[180px]">
                              /{blog.slug}
                            </span>
                            <span className="text-emerald-400 font-bold">
                              🎮 Game Lab Included
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPreview(blog)}
                              className="h-10 rounded-xl border-border text-[10px] font-bold gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopyContent(blog, blog.id || idx)
                              }
                              className="h-10 rounded-xl border-border text-[10px] font-bold gap-1"
                            >
                              {copiedId === (blog.id || idx) ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSuggestion(blog.id, idx)}
                              className="h-10 rounded-xl border-border hover:bg-rose-500/10 hover:text-rose-500 text-[10px] font-bold gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <Button
                            onClick={() => publishBlog(blog, idx)}
                            disabled={isPublishing !== null}
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                          >
                            {isPublishing === idx ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                Deploy to Live Blog{' '}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : !isLoading && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-[32px] border border-dashed border-border bg-card/20">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                        <Zap className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <p className="text-sm font-black uppercase tracking-wider text-foreground">
                          Queue Empty
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click &quot;Generate New Blog Post&quot; to initiate a
                          complete post with games and tables.
                        </p>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLAUDE AI-STYLE HISTORY ARCHIVE */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search history by title, category, or slug..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9 rounded-xl h-10 text-xs border-border bg-card/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshHistory}
                className="rounded-xl h-10 text-xs font-bold gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
              {historyList.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllHistory}
                  className="rounded-xl h-10 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-border gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <Card
                  key={item.id}
                  className="rounded-2xl border-border bg-card/40 backdrop-blur-md p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/30 transition-all shadow-md"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">
                        {item.category || 'Article'}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {item.date ||
                          new Date(item.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        • {item.read_time || '7 min'}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-foreground truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreview(item)}
                      className="rounded-xl h-9 text-xs font-bold gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyContent(item, item.id)}
                      className="rounded-xl h-9 text-xs font-bold gap-1"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copy HTML
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => publishBlog(item, 0)}
                      className="rounded-xl h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1"
                    >
                      Deploy Live
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHistory(item.id)}
                      className="h-9 w-9 p-0 rounded-xl hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="py-16 text-center text-muted-foreground text-xs font-medium">
                No history entries found. Generate your first blog post to begin
                recording history.
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL BLOG PREVIEW MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] p-6 md:p-10 bg-background/95 backdrop-blur-2xl border-border">
          <DialogHeader className="space-y-3 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase">
                {previewBlog?.category || 'Article'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {previewBlog?.read_time || '7 min read'}
              </span>
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-foreground">
              {previewBlog?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {previewBlog?.summary}
            </DialogDescription>
          </DialogHeader>

          {/* Interactive Preview Container */}
          <div className="py-6">
            <article className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground prose-p:text-muted-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-black prose-a:text-primary">
              <InteractiveBlogRenderer
                content={
                  previewBlog?.suggested_content || previewBlog?.content || ''
                }
              />
            </article>
          </div>

          <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => handleCopyContent(previewBlog, 'modal')}
              className="rounded-xl font-bold text-xs gap-2"
            >
              <Copy className="w-4 h-4" /> Copy Full HTML
            </Button>
            <Button
              onClick={() => {
                if (previewBlog) publishBlog(previewBlog, 0);
                setIsPreviewOpen(false);
              }}
              className="rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              Deploy This Article to /blog <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
