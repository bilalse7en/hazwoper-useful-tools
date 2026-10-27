'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  AlertCircle,
  Key,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Upload,
  FileText,
  ListOrdered,
  BookOpen,
  Filter,
  CheckCircle2,
  Layers,
  Sliders,
  Camera,
  Palette,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  parseCourseTOC,
  extractDocxHeaderMetadata,
} from '@/lib/adobe-stock/toc-parser';
import { cn } from '@/lib/utils';

export function AdobeStockImageFinder({
  className,
  initialTitle = '',
  onSelectImage = null,
}) {
  // Navigation / Mode state: 'single' (one-title) | 'toc' (course TOC upload)
  const [activeTab, setActiveTab] = useState('single');

  // Single Search State
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [results, setResults] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [configInfo, setConfigInfo] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [previewModalItem, setPreviewModalItem] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchMode, setSearchMode] = useState('public-catalog');

  // TOC / Word Document State
  const [tocData, setTocData] = useState(null);
  const [activeTopicIndex, setActiveTopicIndex] = useState(-1);
  const [tocSearchQuery, setTocSearchQuery] = useState('');
  const [visitedTopics, setVisitedTopics] = useState(new Set());
  const [pastingText, setPastingText] = useState('');
  const [parsingDoc, setParsingDoc] = useState(false);
  const [showTocDrawer, setShowTocDrawer] = useState(false);
  const fileInputRef = useRef(null);
  const topicsTrackRef = useRef(null);

  // Style Filter State: Real Life (Photos) vs Cartoonic (Vectors & Illustrations)
  // By default, BOTH are checked!
  const [styleFilter, setStyleFilter] = useState({
    photo: true,
    illustration: true,
  });

  // App / Provider Filter State: 'all' | 'unsplash' | 'adobe'
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);

  // Interactive 3-Tier Curriculum Context State
  const [courseName, setCourseName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [lessonName, setLessonName] = useState('');
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showTopicAiPrompt, setShowTopicAiPrompt] = useState(false);

  // Stale request guard
  const abortControllerRef = useRef(null);
  const searchIdRef = useRef(0);
  // Topic search results cache: Map<string, { results, totalFound, offset, hasMore, analysis, mode }>
  const topicCacheRef = useRef(new Map());

  // Sync if initialTitle changes
  useEffect(() => {
    if (initialTitle && initialTitle !== title) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  const handleDownloadUnsplash = async (item, e) => {
    if (e) e.stopPropagation();
    if (!item) return;
    setDownloadingId(item.assetId);

    try {
      // Notify Unsplash download endpoint if present (API guideline compliance)
      if (item.downloadApiUrl) {
        fetch(item.downloadApiUrl).catch(() => {});
      }

      const downloadUrl =
        item.downloadUrl || item.largePreviewUrl || item.previewUrl;
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `unsplash-${item.assetId || 'photo'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: Open original image in new tab for direct browser save
      window.open(item.downloadUrl || item.previewUrl, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSetStyle = (mode) => {
    let nextStyle;
    if (mode === 'all') {
      nextStyle = { photo: true, illustration: true };
    } else if (mode === 'photo') {
      nextStyle = { photo: true, illustration: false };
    } else if (mode === 'illustration') {
      nextStyle = { photo: false, illustration: true };
    } else {
      nextStyle = { photo: true, illustration: true };
    }
    setStyleFilter(nextStyle);

    if (title.trim()) {
      const activeTopic =
        activeTopicIndex >= 0 && tocData?.topics
          ? tocData.topics[activeTopicIndex]
          : null;
      const context = {
        course: courseName || activeTopic?.course || tocData?.courseTitle,
        module: moduleName || activeTopic?.module || tocData?.moduleTitle,
        lesson: lessonName || activeTopic?.lesson || tocData?.lessonTitle,
        parentSection: activeTopic?.parentSection,
      };
      executeSearch(title, true, context, nextStyle, selectedProvider);
    }
  };

  const handleSetProvider = (provider) => {
    setSelectedProvider(provider);

    if (title.trim()) {
      const activeTopic =
        activeTopicIndex >= 0 && tocData?.topics
          ? tocData.topics[activeTopicIndex]
          : null;
      const context = {
        course: courseName || activeTopic?.course || tocData?.courseTitle,
        module: moduleName || activeTopic?.module || tocData?.moduleTitle,
        lesson: lessonName || activeTopic?.lesson || tocData?.lessonTitle,
        parentSection: activeTopic?.parentSection,
      };
      executeSearch(title, true, context, styleFilter, provider);
    }
  };

  const toggleStyle = (type) => {
    let nextFilter;
    setStyleFilter((prev) => {
      const next = { ...prev, [type]: !prev[type] };
      // Prevent unchecking both: at least one must remain active
      if (!next.photo && !next.illustration) {
        return prev;
      }
      nextFilter = next;
      return next;
    });

    if (title.trim()) {
      const activeTopic =
        activeTopicIndex >= 0 && tocData?.topics
          ? tocData.topics[activeTopicIndex]
          : null;
      const context = {
        course: courseName || activeTopic?.course || tocData?.courseTitle,
        module: moduleName || activeTopic?.module || tocData?.moduleTitle,
        lesson: lessonName || activeTopic?.lesson || tocData?.lessonTitle,
        parentSection: activeTopic?.parentSection,
      };
      executeSearch(
        title,
        true,
        context,
        nextFilter || styleFilter,
        selectedProvider
      );
    }
  };

  const executeSearch = async (
    searchQuery,
    forceRefresh = false,
    context = {},
    activeStyle = styleFilter,
    activeProvider = selectedProvider
  ) => {
    const cleanTitle = (searchQuery || '').trim();
    if (!cleanTitle) return;

    const effectiveContext = {
      course: (context.course || courseName || '').trim(),
      module: (context.module || moduleName || '').trim(),
      lesson: (context.lesson || lessonName || '').trim(),
      parentSection: context.parentSection,
    };

    // Cache key incorporates course, lesson, style filter, active provider, and parentSection
    const styleKey = `${activeStyle.photo ? 'p' : ''}_${activeStyle.illustration ? 'i' : ''}_${activeProvider}`;
    const cacheKey =
      `${effectiveContext.course}::${effectiveContext.lesson}::${effectiveContext.parentSection || ''}::${styleKey}::${cleanTitle}`.toLowerCase();

    // 1-Time Search: If this topic has already been searched and forceRefresh is false,
    // immediately restore cached results with zero network re-request and zero reload delay.
    if (!forceRefresh && topicCacheRef.current.has(cacheKey)) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const cached = topicCacheRef.current.get(cacheKey);
      setResults(cached.results || []);
      setTotalFound(cached.totalFound || 0);
      setOffset(cached.offset || 0);
      setHasMore(cached.hasMore || false);
      setAnalysis(cached.analysis || null);
      if (cached.mode) setSearchMode(cached.mode);
      setError(null);
      setConfigInfo(null);
      setLoading(false);
      setLoadingStage('');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentSearchId = ++searchIdRef.current;

    setLoading(true);
    setError(null);
    setConfigInfo(null);
    setResults([]);
    setTotalFound(0);
    setOffset(0);
    setHasMore(false);

    setLoadingStage('Analyzing curriculum context & technical subject...');
    const timer1 = setTimeout(() => {
      if (searchIdRef.current === currentSearchId) {
        setLoadingStage(
          'Synthesizing lesson & topic specific queries with 3-tier context...'
        );
      }
    }, 450);

    const timer2 = setTimeout(() => {
      if (searchIdRef.current === currentSearchId) {
        setLoadingStage(
          activeProvider === 'unsplash'
            ? 'Searching Unsplash for free high-resolution photos...'
            : activeProvider === 'adobe'
              ? 'Searching Adobe Stock catalog for verified assets...'
              : 'Searching Unsplash and Adobe Stock catalogs in parallel...'
        );
      }
    }, 900);

    const timer3 = setTimeout(() => {
      if (searchIdRef.current === currentSearchId) {
        setLoadingStage(
          'Ranking semantic relevance and excluding duplicate concepts...'
        );
      }
    }, 1400);

    try {
      const response = await fetch('/api/adobe-stock/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          context: effectiveContext,
          styleFilter: activeStyle,
          provider: activeProvider,
          offset: 0,
          limit: 12,
          threshold: 45,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (searchIdRef.current !== currentSearchId) return;

      if (!response.ok) {
        if (data.configured === false || response.status === 401) {
          setConfigInfo(data);
          setAnalysis(data.analysis || null);
        } else {
          setError(data.message || 'An error occurred while finding images.');
        }
        return;
      }

      const freshResults = data.results || [];
      const freshTotalFound = data.totalFound || 0;
      const freshHasMore = Boolean(data.hasMore);
      const freshOffset = data.offset || 0;
      const freshAnalysis = data.analysis || null;
      const freshMode = data.mode || 'public-catalog';

      setResults(freshResults);
      setTotalFound(freshTotalFound);
      setHasMore(freshHasMore);
      setOffset(freshOffset);
      setAnalysis(freshAnalysis);
      if (data.mode) setSearchMode(freshMode);

      // Persist in client-side topic cache for instantaneous navigation
      topicCacheRef.current.set(cacheKey, {
        results: freshResults,
        totalFound: freshTotalFound,
        hasMore: freshHasMore,
        offset: freshOffset,
        analysis: freshAnalysis,
        mode: freshMode,
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (searchIdRef.current === currentSearchId) {
        console.error('Search request error:', err);
        setError(
          'Network error: Unable to reach search service. Please try again.'
        );
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (searchIdRef.current === currentSearchId) {
        setLoading(false);
        setLoadingStage('');
      }
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    executeSearch(title, true);
  };

  const handleShowMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextOffset = results.length;
    setLoadingMore(true);

    const activeTopic =
      activeTopicIndex >= 0 && tocData?.topics
        ? tocData.topics[activeTopicIndex]
        : null;
    const effectiveContext = {
      course: (
        courseName ||
        activeTopic?.course ||
        tocData?.courseTitle ||
        ''
      ).trim(),
      module: (
        moduleName ||
        activeTopic?.module ||
        tocData?.moduleTitle ||
        ''
      ).trim(),
      lesson: (
        lessonName ||
        activeTopic?.lesson ||
        tocData?.lessonTitle ||
        ''
      ).trim(),
      parentSection: activeTopic?.parentSection,
    };

    try {
      const response = await fetch('/api/adobe-stock/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          context: effectiveContext,
          styleFilter,
          provider: selectedProvider,
          offset: nextOffset,
          limit: 12,
          threshold: 45,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.results)) {
        const existingIds = new Set(results.map((i) => i.assetId));
        const fresh = data.results.filter((i) => !existingIds.has(i.assetId));
        const merged = [...results, ...fresh];
        const nextHasMore = Boolean(data.hasMore);

        setResults(merged);
        setHasMore(nextHasMore);
        setOffset(nextOffset);

        // Update the cached results for this topic so returning to it retains the expanded list
        const styleKey = `${styleFilter.photo ? 'p' : ''}_${styleFilter.illustration ? 'i' : ''}_${selectedProvider}`;
        const cacheKey =
          `${effectiveContext.course}::${effectiveContext.lesson}::${effectiveContext.parentSection || ''}::${styleKey}::${title.trim()}`.toLowerCase();
        const prevCached = topicCacheRef.current.get(cacheKey) || {};
        topicCacheRef.current.set(cacheKey, {
          ...prevCached,
          results: merged,
          offset: nextOffset,
          hasMore: nextHasMore,
          totalFound: data.totalFound ?? prevCached.totalFound ?? merged.length,
        });
      }
    } catch (err) {
      console.error('Error loading more images:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Word / DOCX or Text File Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingDoc(true);
    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const headerMeta = await extractDocxHeaderMetadata(arrayBuffer);
        const mammoth = await import('mammoth');
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
        const parsed = parseCourseTOC(html, true, headerMeta);
        applyParsedTOC(parsed);
      } else {
        const text = await file.text();
        const parsed = parseCourseTOC(text, false);
        applyParsedTOC(parsed);
      }
    } catch (err) {
      console.error('DOCX parsing error:', err);
      setError(`Failed to parse file "${file.name}": ${err.message}`);
    } finally {
      setParsingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Paste Text parser
  const handleParsePastedText = () => {
    if (!pastingText.trim()) return;
    const parsed = parseCourseTOC(pastingText, false);
    applyParsedTOC(parsed);
    setPastingText('');
  };

  const applyParsedTOC = (parsed) => {
    if (!parsed.topics || parsed.topics.length === 0) {
      setError(
        'No topics found in the uploaded content. Quizzes and boilerplate were excluded.'
      );
      return;
    }
    topicCacheRef.current.clear();
    setTocData(parsed);

    const detectedCourse = parsed.courseTitle || courseName || '';
    const detectedModule = parsed.moduleTitle || moduleName || '';
    const detectedLesson = parsed.lessonTitle || lessonName || '';

    setCourseName(detectedCourse);
    setModuleName(detectedModule);
    setLessonName(detectedLesson);

    if (!detectedCourse || !detectedLesson) {
      setShowContextEditor(true);
    }

    setError(null);
    setActiveTab('toc');
    setActiveTopicIndex(0);
    const firstTopic = parsed.topics[0];
    setTitle(firstTopic.title);
    setVisitedTopics(new Set([firstTopic.id]));

    const context = {
      course: detectedCourse,
      module: detectedModule,
      lesson: detectedLesson,
      parentSection: firstTopic.parentSection,
    };
    executeSearch(firstTopic.title, false, context);
  };

  const selectTopic = (topic, index) => {
    setActiveTopicIndex(index);
    setTitle(topic.title);
    setVisitedTopics((prev) => new Set([...prev, topic.id]));

    const context = {
      course: courseName || topic.course || tocData?.courseTitle,
      module: moduleName || topic.module || tocData?.moduleTitle,
      lesson: lessonName || topic.lesson || tocData?.lessonTitle,
      parentSection: topic.parentSection,
    };
    executeSearch(topic.title, false, context);
  };

  const goToPrevTopic = () => {
    if (!tocData?.topics || activeTopicIndex <= 0) return;
    const prevIdx = activeTopicIndex - 1;
    selectTopic(tocData.topics[prevIdx], prevIdx);
  };

  const goToNextTopic = () => {
    if (!tocData?.topics || activeTopicIndex >= tocData.topics.length - 1)
      return;
    const nextIdx = activeTopicIndex + 1;
    selectTopic(tocData.topics[nextIdx], nextIdx);
  };

  const scrollTopicsTrack = (direction) => {
    if (!topicsTrackRef.current) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    topicsTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Auto-center active topic pill in bottom dock whenever activeTopicIndex changes
  useEffect(() => {
    if (!topicsTrackRef.current || activeTopicIndex < 0) return;
    const activeEl = topicsTrackRef.current.querySelector(
      `[data-topic-idx="${activeTopicIndex}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTopicIndex]);

  const handleCopyId = (assetId, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(assetId);
    setCopiedId(assetId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLink = (url, assetId, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedLink(assetId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleCopyAiPrompt = (promptText, e) => {
    if (e) e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    }
  };

  const generateAiPromptForTopic = (topicTitle) => {
    const clean = (topicTitle || title || '').trim();
    const isSummary = /^(summary|lesson\s+summary|course\s+summary)$/i.test(
      clean
    );
    const cName =
      courseName ||
      tocData?.courseTitle ||
      'Power Systems & Electrical Fundamentals';
    const lName =
      lessonName ||
      tocData?.lessonTitle ||
      'Utility Power Entry and Service Configuration';

    if (isSummary) {
      return `Vertical 9:16 portrait orientation professional architectural photograph of a modern high-voltage electrical power distribution facility and substation for ${cName}. In the background through reinforced structural glass, high-voltage utility transmission lines and large step-down power transformers with ribbed cooling radiators and ceramic insulator bushings stand under a dramatic twilight sky. In the foreground interior, pristine rows of industrial metal-clad switchgear cabinets, main service disconnect enclosures, heavy-gauge copper busbars, and cable raceways gleam under clean architectural downlighting with subtle ambient industrial blue and amber indicator reflections. Ultra-realistic, photorealistic commercial engineering photography, shot on Sony A7R V with 35mm f/2.8 lens, natural depth of field, sharp textures of brushed galvanized steel and copper conduits, rich contrast, documentary realism. Absolutely NO text, NO words, NO letters, NO numbers, NO labels, NO logos, NO signs, NO watermarks, NO people. Pure industrial infrastructure.`;
    }

    return `Vertical 9:16 portrait orientation professional documentary industrial photograph illustrating "${clean}" in the context of ${cName} (${lName}). High-detail workplace setting showing authentic industrial electrical components, enclosures, and utility distribution hardware in crisp focus, realistic lighting, commercial industrial photography, shot on Sony A7R V with 35mm f/2.8 lens. Absolutely NO text, NO words, NO letters, NO numbers, NO labels, NO logos, NO signs, NO watermarks, NO overlays. Clean educational visual.`;
  };

  // Filtered topics for large lists (10 to 2000 items)
  const filteredTopics = useMemo(() => {
    if (!tocData?.topics) return [];
    if (!tocSearchQuery.trim()) return tocData.topics;
    const q = tocSearchQuery.toLowerCase();
    return tocData.topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.lesson && t.lesson.toLowerCase().includes(q)) ||
        (t.module && t.module.toLowerCase().includes(q))
    );
  }, [tocData, tocSearchQuery]);

  return (
    <div className={cn('w-full max-w-7xl mx-auto space-y-6', className)}>
      {/* Header & Title Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              AI Adobe Stock Image Finder
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20"
              >
                {searchMode === 'official-api'
                  ? 'Enterprise API'
                  : 'Real Adobe Stock Direct'}
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Paste a slide title or upload a course Word document (.docx). AI
              automatically analyzes each topic, filters out quizzes, and finds
              matching Adobe Stock images.
            </p>
          </div>
        </div>

        {/* Tab Switcher: Single Title vs Course TOC Mode */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/80 border border-border/60 shrink-0">
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'single' ? 'default' : 'ghost'}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer',
              activeTab === 'single' && 'shadow-xs'
            )}
            onClick={() => setActiveTab('single')}
          >
            <Search className="h-3.5 w-3.5" />
            Single Title
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'toc' ? 'default' : 'ghost'}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer',
              activeTab === 'toc' && 'shadow-xs'
            )}
            onClick={() => setActiveTab('toc')}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            Course TOC Mode
            {tocData?.totalTopics > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/20 text-[10px] font-black">
                {tocData.totalTopics}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Global Filter Bar: Style (Real Life vs Cartoonic) & 3-Tier Curriculum Context */}
      <Card className="border border-border/70 shadow-xs bg-card/70 backdrop-blur-xs">
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          {/* Top Row: Style Filter Pills & Context Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-2.5">
            {/* Style Filter: Real Life vs Cartoonic */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 mr-1">
                <Palette className="h-3.5 w-3.5 text-primary" />
                Image Style:
              </span>
              <button
                type="button"
                onClick={() => toggleStyle('photo')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer',
                  styleFilter.photo
                    ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted'
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Real Life (Photos)</span>
                {styleFilter.photo && (
                  <Check className="h-3 w-3 text-blue-600 dark:text-blue-400 stroke-[3]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleStyle('illustration')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer',
                  styleFilter.illustration
                    ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted'
                )}
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Cartoonic (Vectors & Illustrations)</span>
                {styleFilter.illustration && (
                  <Check className="h-3 w-3 text-purple-600 dark:text-purple-400 stroke-[3]" />
                )}
              </button>
              <span className="text-[10px] text-muted-foreground hidden md:inline ml-1">
                (By default both are selected)
              </span>
            </div>

            {/* Context Status Badge & Toggle */}
            <div className="flex items-center gap-2">
              {courseName && lessonName && moduleName ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  ✨ 3-Tier Context Active
                </Badge>
              ) : courseName && lessonName ? (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">
                  ✓ 2-Tier Context Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold"
                >
                  ⚠️ Context Missing
                </Badge>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowContextEditor(!showContextEditor)}
                className="h-7 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 px-2"
              >
                <Sliders className="h-3 w-3" />
                {showContextEditor
                  ? 'Hide Curriculum Info'
                  : 'Edit Curriculum Info'}
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform',
                    showContextEditor && 'rotate-180'
                  )}
                />
              </Button>
            </div>
          </div>

          {/* 3-Tier Curriculum Context Editor */}
          {(showContextEditor || (!courseName && !lessonName)) && (
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>
                  Course, Module & Lesson Alignment (Ensures 100% relevant
                  equipment & hazard images):
                </span>
                {(!courseName || !lessonName) && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Please provide Course & Lesson name below
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    1. Course Name
                  </label>
                  <Input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Power Systems & Electrical Fundamentals"
                    className="h-8 text-xs mt-0.5 bg-background"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    2. Module Name (Optional)
                  </label>
                  <Input
                    type="text"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. Module 1: Utility Interconnection & Distribution"
                    className="h-8 text-xs mt-0.5 bg-background"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    3. Lesson Name
                  </label>
                  <Input
                    type="text"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="e.g. Lesson 1: Utility Power Entry and Service Configuration"
                    className="h-8 text-xs mt-0.5 bg-background"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODE 1: Single Slide Title Search */}
      {activeTab === 'single' && (
        <Card className="border border-border/70 shadow-sm bg-card/60 backdrop-blur-xs">
          <CardContent className="p-4 sm:p-6">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Paste your slide title (e.g., Utility Power Entry and Service Configuration)"
                  className="pl-10 h-12 text-sm sm:text-base bg-background/80 border-border/80 focus-visible:ring-primary shadow-xs rounded-xl"
                  disabled={loading}
                />
                {title && (
                  <button
                    type="button"
                    onClick={() => setTitle('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !title.trim()}
                className="h-12 px-6 rounded-xl font-semibold gap-2 shadow-sm transition-all duration-200 cursor-pointer text-sm sm:text-base shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Find Best Images
                  </>
                )}
              </Button>
            </form>

            {/* Quick Technical Suggestions */}
            {!results.length && !loading && !configInfo && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  Try technical examples:
                </span>
                {[
                  'Utility Power Entry and Service Configuration',
                  'General Industry Hand Protection',
                  'Hazardous Energy Lockout/Tagout Isolation',
                  'Confined Space Tripod and Air Monitoring',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setTitle(sample);
                      executeSearch(sample);
                    }}
                    className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-medium text-foreground/80 transition-colors border border-border/50 cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODE 2: Course TOC & Word Document Upload / Navigator */}
      {activeTab === 'toc' && (
        <div className="space-y-4">
          {/* Document Ingestion Zone */}
          <Card className="border border-border/80 bg-card/60 shadow-xs">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Import Course Table of Contents (Word .docx or Text)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload your Word file or paste content. Course and lesson
                    titles are extracted automatically, and all
                    quizzes/questions are safely ignored.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".docx,.txt"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={parsingDoc}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 text-xs h-9 rounded-xl border-dashed border-border/90 cursor-pointer hover:bg-muted/70"
                  >
                    {parsingDoc ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Extracting Headings...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 text-primary" />
                        Upload Word (.docx)
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Paste or Sample Text Collapsible Area */}
              {!tocData && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <textarea
                    value={pastingText}
                    onChange={(e) => setPastingText(e.target.value)}
                    placeholder="Or paste your course outline / lesson text here..."
                    className="w-full h-24 p-3 text-xs font-mono bg-background/80 rounded-xl border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleParsePastedText}
                      disabled={!pastingText.trim()}
                      className="h-8 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                      Parse Topics & Build TOC
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course TOC Mode: Full-Width Card Experience (Zero Squeeze) */}
          {tocData && (
            <div className="w-full space-y-5">
              {/* Active Topic Banner Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-card border border-border/70 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20"
                    >
                      Topic {activeTopicIndex + 1} of {tocData.totalTopics}
                    </Badge>
                    {tocData.courseTitle && (
                      <>
                        <span>•</span>
                        <span
                          className="text-primary font-bold truncate max-w-[220px]"
                          title={tocData.courseTitle}
                        >
                          {tocData.courseTitle}
                        </span>
                      </>
                    )}
                    {tocData.moduleTitle && (
                      <>
                        <span>•</span>
                        <span
                          className="truncate max-w-[200px]"
                          title={tocData.moduleTitle}
                        >
                          {tocData.moduleTitle}
                        </span>
                      </>
                    )}
                    {tocData.lessonTitle && (
                      <>
                        <span>•</span>
                        <span
                          className="truncate max-w-[220px]"
                          title={tocData.lessonTitle}
                        >
                          {tocData.lessonTitle}
                        </span>
                      </>
                    )}
                  </div>

                  <div>
                    {tocData.topics[activeTopicIndex]?.parentSection && (
                      <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                        <span>
                          {tocData.topics[activeTopicIndex].parentSection}
                        </span>
                        <span className="text-primary/70">›</span>
                      </div>
                    )}
                    <h2 className="text-base sm:text-lg font-extrabold text-foreground truncate">
                      {title}
                    </h2>
                  </div>
                </div>

                {/* Navigation Controls & Drawer Trigger */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTocDrawer(true)}
                    className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-border/80 cursor-pointer hover:bg-muted"
                  >
                    <ListOrdered className="h-3.5 w-3.5 text-primary" />
                    <span>View All Topics</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4.5 px-1 font-mono"
                    >
                      {visitedTopics.size}/{tocData.totalTopics}
                    </Badge>
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={activeTopicIndex <= 0 || loading}
                      onClick={goToPrevTopic}
                      className="h-8 text-xs gap-1 rounded-lg cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        activeTopicIndex >= tocData.topics.length - 1 || loading
                      }
                      onClick={goToNextTopic}
                      className="h-8 text-xs gap-1 rounded-lg cursor-pointer"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const activeTopic =
                        activeTopicIndex >= 0 && tocData?.topics
                          ? tocData.topics[activeTopicIndex]
                          : null;
                      const context = activeTopic
                        ? {
                            course: activeTopic.course || tocData?.courseTitle,
                            module: activeTopic.module || tocData?.moduleTitle,
                            lesson: activeTopic.lesson || tocData?.lessonTitle,
                            parentSection: activeTopic.parentSection,
                          }
                        : {};
                      executeSearch(
                        title,
                        true,
                        context,
                        styleFilter,
                        selectedProvider
                      );
                    }}
                    disabled={loading}
                    className="h-8 text-xs font-semibold gap-1 rounded-lg cursor-pointer"
                  >
                    <RefreshCw
                      className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
                    />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Render Full-Width Gallery Content */}
              {renderSharedContent()}

              {/* Sticky Bottom Topic Navigator Dock with Hover Tooltip Names & Responsive Track */}
              <div className="sticky bottom-3 z-40 w-full max-w-5xl mx-auto px-2 pointer-events-none mt-8">
                <div className="pointer-events-auto backdrop-blur-xl bg-card/95 border border-border/80 shadow-2xl rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-1.5 sm:gap-2.5 text-xs">
                  {/* Left Stepper & Drawer button */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={activeTopicIndex <= 0 || loading}
                      onClick={goToPrevTopic}
                      className="h-8 px-2 sm:px-2.5 text-xs gap-1 rounded-xl cursor-pointer"
                      title="Previous Topic"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTocDrawer(true)}
                      className="h-8 px-2 sm:px-2.5 text-xs gap-1 rounded-xl border-border/80 font-semibold cursor-pointer"
                      title="Open All Topics Drawer"
                    >
                      <ListOrdered className="h-3.5 w-3.5 text-primary" />
                      <span className="hidden md:inline">Topics</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {activeTopicIndex + 1}/{tocData.totalTopics}
                      </span>
                    </Button>
                  </div>

                  {/* Direct Jump Selector (shown when course has many topics) */}
                  {tocData.totalTopics > 10 && (
                    <div className="flex items-center shrink-0">
                      <select
                        value={activeTopicIndex}
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          if (tocData.topics[idx]) {
                            selectTopic(tocData.topics[idx], idx);
                          }
                        }}
                        className="h-8 px-2 text-xs rounded-xl bg-muted/60 border border-border/80 text-foreground font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer max-w-[110px] sm:max-w-[140px] truncate"
                        aria-label="Quick jump to topic"
                        title="Jump to specific topic"
                      >
                        {tocData.topics.map((t, idx) => (
                          <option key={t.id} value={idx}>
                            #{idx + 1}: {t.title.slice(0, 22)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Center Numbered Topic Pills with Track Controls */}
                  <TooltipProvider delayDuration={50}>
                    {/* Desktop / Tablet Sliding Track with Left/Right Glide Controls */}
                    <div className="hidden sm:flex flex-1 min-w-0 items-center gap-1 overflow-hidden px-1">
                      {tocData.totalTopics > 8 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => scrollTopicsTrack('left')}
                          className="h-7 w-7 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                          title="Scroll left"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      <div
                        ref={topicsTrackRef}
                        className="flex-1 min-w-0 overflow-x-auto py-1 px-1 scrollbar-none flex items-center justify-start gap-1.5 scroll-smooth"
                      >
                        {tocData.topics.map((t, idx) => {
                          const isSelected = idx === activeTopicIndex;
                          const isVisited = visitedTopics.has(t.id);

                          return (
                            <Tooltip key={t.id}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  data-topic-idx={idx}
                                  onClick={() => selectTopic(t, idx)}
                                  className={cn(
                                    'relative h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0',
                                    isSelected
                                      ? 'bg-primary text-primary-foreground shadow-md scale-110 ring-2 ring-primary/40 font-black'
                                      : isVisited
                                        ? 'bg-muted/80 text-foreground hover:bg-primary/20 border border-emerald-500/40'
                                        : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                                  )}
                                >
                                  <span>{idx + 1}</span>
                                  {isVisited && !isSelected && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-xs text-xs p-2.5 space-y-1 shadow-xl bg-popover text-popover-foreground border-border"
                              >
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                                  <span>
                                    Topic #{idx + 1} of {tocData.totalTopics}
                                  </span>
                                  {isVisited && (
                                    <span className="text-emerald-500 font-bold">
                                      ✓ Viewed
                                    </span>
                                  )}
                                </div>
                                {t.parentSection && (
                                  <div className="text-[10px] text-primary font-bold uppercase truncate">
                                    {t.parentSection}
                                  </div>
                                )}
                                <div className="font-bold text-foreground leading-snug">
                                  {t.title}
                                </div>
                                <div className="text-[10px] text-muted-foreground italic pt-0.5">
                                  Click to view matching stock images
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>

                      {tocData.totalTopics > 8 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => scrollTopicsTrack('right')}
                          className="h-7 w-7 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                          title="Scroll right"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Mobile Compact Neighborhood Pills (Never Cuts Off on Mobile) */}
                    <div className="flex sm:hidden items-center gap-1 shrink-0">
                      {activeTopicIndex > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            selectTopic(
                              tocData.topics[activeTopicIndex - 1],
                              activeTopicIndex - 1
                            )
                          }
                          className="h-7 min-w-[26px] px-1 rounded-lg text-[11px] font-bold bg-muted/40 text-muted-foreground cursor-pointer"
                        >
                          {activeTopicIndex}
                        </button>
                      )}
                      <button
                        type="button"
                        className="h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-black bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40 cursor-default"
                      >
                        {activeTopicIndex + 1}
                      </button>
                      {activeTopicIndex < tocData.topics.length - 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            selectTopic(
                              tocData.topics[activeTopicIndex + 1],
                              activeTopicIndex + 1
                            )
                          }
                          className="h-7 min-w-[26px] px-1 rounded-lg text-[11px] font-bold bg-muted/40 text-muted-foreground cursor-pointer"
                        >
                          {activeTopicIndex + 2}
                        </button>
                      )}
                    </div>
                  </TooltipProvider>

                  {/* Right Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={
                        activeTopicIndex >= tocData.topics.length - 1 || loading
                      }
                      onClick={goToNextTopic}
                      className="h-8 px-2 sm:px-2.5 text-xs gap-1 rounded-xl cursor-pointer"
                      title="Next Topic"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Slide-Out Drawer for Full Hierarchical TOC */}
              <Sheet open={showTocDrawer} onOpenChange={setShowTocDrawer}>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card"
                >
                  <SheetHeader className="p-4 border-b border-border/60 shrink-0">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-sm font-bold flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Course Curriculum Topics
                      </SheetTitle>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono"
                      >
                        {visitedTopics.size} / {tocData.totalTopics} viewed
                      </Badge>
                    </div>
                    <div className="relative pt-2">
                      <Filter className="absolute left-2.5 top-[calc(50%+4px)] -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        value={tocSearchQuery}
                        onChange={(e) => setTocSearchQuery(e.target.value)}
                        placeholder="Filter curriculum topics..."
                        className="h-8 pl-8 text-xs bg-background rounded-lg border-border/70"
                      />
                      {tocSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setTocSearchQuery('')}
                          className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2">
                    {filteredTopics.map((topic, idx) => {
                      const isSelected =
                        activeTopicIndex !== -1 &&
                        tocData.topics[activeTopicIndex]?.id === topic.id;
                      const isVisited = visitedTopics.has(topic.id);

                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => {
                            const originalIdx = tocData.topics.findIndex(
                              (t) => t.id === topic.id
                            );
                            selectTopic(topic, originalIdx);
                            setShowTocDrawer(false);
                          }}
                          className={cn(
                            'w-full text-left p-3 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer',
                            isSelected
                              ? 'bg-primary/10 text-primary font-bold border border-primary/25 shadow-xs'
                              : 'hover:bg-muted/60 text-foreground/90'
                          )}
                        >
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <div className="flex-1 min-w-0">
                            {topic.parentSection && (
                              <div className="text-[10px] text-muted-foreground/80 truncate font-semibold uppercase tracking-wider mb-0.5">
                                {topic.parentSection}
                              </div>
                            )}
                            <span className="line-clamp-2 leading-tight">
                              {topic.title}
                            </span>
                          </div>
                          {isVisited && !isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          {isSelected && (
                            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5 animate-pulse" />
                          )}
                        </button>
                      );
                    })}

                    {filteredTopics.length === 0 && (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No topics match &quot;{tocSearchQuery}&quot;
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setShowTocDrawer(false)}
                      className="h-7 text-xs cursor-pointer"
                    >
                      Close Drawer
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setTocData(null);
                        setResults([]);
                        topicCacheRef.current.clear();
                        setShowTocDrawer(false);
                      }}
                      className="h-7 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      Clear TOC
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      )}

      {/* Shared Results Content when in Single Mode */}
      {activeTab === 'single' && renderSharedContent()}

      {/* Detailed Image Lightbox Modal */}
      {previewModalItem && (
        <Dialog
          open={Boolean(previewModalItem)}
          onOpenChange={() => setPreviewModalItem(null)}
        >
          <DialogContent className="max-w-3xl p-6 overflow-hidden">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {previewModalItem.provider === 'unsplash' ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    ✨ Unsplash • Free Commercial License
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 border-red-500/30"
                  >
                    🅰️ Adobe Stock #{previewModalItem.assetId}
                  </Badge>
                )}
                {previewModalItem.relevanceScore && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold"
                  >
                    {previewModalItem.relevanceScore}% Match •{' '}
                    {previewModalItem.relevanceTier}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold leading-snug">
                {previewModalItem.title}
              </DialogTitle>
            </DialogHeader>

            <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-zinc-950 my-2">
              <img
                src={
                  previewModalItem.largePreviewUrl ||
                  previewModalItem.previewUrl
                }
                alt={previewModalItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                <span>
                  Contributor:{' '}
                  {previewModalItem.provider === 'unsplash' &&
                  previewModalItem.creatorUrl ? (
                    <a
                      href={previewModalItem.creatorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground font-semibold underline hover:text-primary"
                    >
                      {previewModalItem.creator}
                    </a>
                  ) : (
                    <strong className="text-foreground">
                      {previewModalItem.creator}
                    </strong>
                  )}
                </span>
                <span>
                  Category:{' '}
                  <strong className="text-foreground">
                    {previewModalItem.category}
                  </strong>
                </span>
                <span>
                  Dimensions:{' '}
                  <strong className="text-foreground">
                    {previewModalItem.width} × {previewModalItem.height} px
                  </strong>
                </span>
              </div>

              {previewModalItem.provider === 'unsplash' && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      <strong>100% Free under Unsplash License</strong> • Zero
                      copyright tension • Safe for commercial & educational
                      slides
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    No purchase required
                  </span>
                </div>
              )}

              {previewModalItem.keywords &&
                previewModalItem.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1">
                    {previewModalItem.keywords.slice(0, 16).map((k, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}

              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {previewModalItem.provider === 'unsplash' ? (
                    <Button
                      size="sm"
                      className="gap-1.5 h-8 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      disabled={downloadingId === previewModalItem.assetId}
                      onClick={(e) =>
                        handleDownloadUnsplash(previewModalItem, e)
                      }
                    >
                      {downloadingId === previewModalItem.assetId ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Download High-Res
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs cursor-pointer"
                      onClick={() => handleCopyId(previewModalItem.assetId)}
                    >
                      {copiedId === previewModalItem.assetId ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">
                            ID Copied
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          Copy Asset ID
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs cursor-pointer"
                    onClick={() =>
                      handleCopyLink(
                        previewModalItem.stockUrl,
                        previewModalItem.assetId
                      )
                    }
                  >
                    {copiedLink === previewModalItem.assetId ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">
                          Link Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 h-8 text-xs cursor-pointer ml-auto"
                  asChild
                >
                  <a
                    href={previewModalItem.stockUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {previewModalItem.provider === 'unsplash'
                      ? 'Open on Unsplash'
                      : 'Open on Adobe Stock'}
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // Helper renderer for image grid and states
  function renderSharedContent() {
    const isSummaryTopic =
      /^(summary|lesson\s+summary|course\s+summary)$/i.test(
        (title || '').trim()
      );
    const activeAiPrompt = generateAiPromptForTopic(title);
    const shouldShowPrompt = isSummaryTopic || showTopicAiPrompt;

    return (
      <div className="space-y-5">
        {/* Compact Loading Indicator */}
        {loading && (
          <Card className="border border-primary/20 bg-primary/5 shadow-xs animate-in fade-in-0 duration-200">
            <CardContent className="p-4 flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-primary animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  AI Search Pipeline Running
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {loadingStage}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-xs sm:text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Outsource AI Image Generation Prompt Card (Prominently on Summary, or toggled on normal slides) */}
        {shouldShowPrompt && title.trim() && !loading && (
          <Card className="border border-primary/25 bg-gradient-to-r from-card via-background to-primary/5 shadow-xs rounded-xl overflow-hidden">
            <div className="p-3.5 sm:p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    {isSummaryTopic
                      ? 'Universal Course Summary Slide AI Prompt'
                      : 'AI Image Generator Prompt'}
                  </span>
                  {isSummaryTopic && (
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                      ⭐ 1 Universal Image For All Lessons
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-muted-foreground"
                  >
                    9:16 Portrait • Zero Text
                  </Badge>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={copiedPrompt ? 'default' : 'outline'}
                  onClick={(e) => handleCopyAiPrompt(activeAiPrompt, e)}
                  className="h-7 text-xs font-bold gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span>Prompt Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Prompt for AI</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <pre className="p-3 rounded-lg bg-muted/50 border border-border/70 text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed select-all max-h-36 overflow-y-auto">
                  {activeAiPrompt}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground/80">
                    Paste directly into:
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-muted font-medium text-[10px]">
                    ChatGPT (DALL-E 3)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-muted font-medium text-[10px]">
                    Google Gemini
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-muted font-medium text-[10px]">
                    Kimi / Moonshot
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-muted font-medium text-[10px]">
                    Midjourney
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/80 italic">
                  Generates 100% photorealistic vertical slide image with zero
                  text
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Free Unsplash Commercial License Assurance Banner (User Request) */}
        {title.trim() && (
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-3 sm:p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      <span>
                        ✨ 100% Free Downloads & Commercial License with
                        Unsplash
                      </span>
                    </h4>
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                      Zero Copyright Tension • No Purchase Required
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                    You{' '}
                    <strong>do not need to purchase or license images</strong>{' '}
                    when choosing Unsplash. Every Unsplash photo can be freely
                    downloaded in original high resolution and safely used for
                    commercial slides, training modules, and web publishing with{' '}
                    <strong>zero copyright tension</strong> under the official
                    Unsplash License.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {selectedProvider !== 'unsplash' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetProvider('unsplash')}
                    className="h-8 text-xs font-semibold cursor-pointer border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  >
                    ✨ Show Unsplash Only
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Two-Sided Filter Bar (Directly Above Recommended Images Gallery) */}
        {/* LEFT: Image Style Filter | RIGHT: App / Provider Filter */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
          {/* LEFT: Image Style Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 mr-1">
              <Palette className="h-3.5 w-3.5 text-primary" />
              Image Style:
            </span>
            <Button
              type="button"
              size="sm"
              variant={
                styleFilter.photo && styleFilter.illustration
                  ? 'default'
                  : 'outline'
              }
              onClick={() => handleSetStyle('all')}
              className="h-7 text-xs font-semibold px-2.5 cursor-pointer rounded-lg"
            >
              All Styles
            </Button>
            <Button
              type="button"
              size="sm"
              variant={
                styleFilter.photo && !styleFilter.illustration
                  ? 'default'
                  : 'outline'
              }
              onClick={() => handleSetStyle('photo')}
              className="h-7 text-xs font-semibold px-2.5 cursor-pointer rounded-lg gap-1"
            >
              <Camera className="h-3 w-3" />
              Photos (Real Life)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={
                !styleFilter.photo && styleFilter.illustration
                  ? 'default'
                  : 'outline'
              }
              onClick={() => handleSetStyle('illustration')}
              className="h-7 text-xs font-semibold px-2.5 cursor-pointer rounded-lg gap-1"
            >
              <Palette className="h-3 w-3" />
              Illustrations / Vectors
            </Button>
          </div>

          {/* RIGHT: App / Provider Filter */}
          <div className="flex items-center gap-1.5 flex-wrap justify-start md:justify-end">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5 mr-1">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              Provider:
            </span>
            <Button
              type="button"
              size="sm"
              variant={selectedProvider === 'all' ? 'default' : 'outline'}
              onClick={() => handleSetProvider('all')}
              className="h-7 text-xs font-semibold px-2.5 cursor-pointer rounded-lg"
            >
              🌐 All Providers
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedProvider === 'unsplash' ? 'default' : 'outline'}
              onClick={() => handleSetProvider('unsplash')}
              className={cn(
                'h-7 text-xs font-semibold px-2.5 cursor-pointer rounded-lg gap-1',
                selectedProvider === 'unsplash'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              )}
            >
              <Sparkles className="h-3 w-3" />✨ Unsplash (Free)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={selectedProvider === 'adobe' ? 'default' : 'outline'}
              onClick={() => handleSetProvider('adobe')}
              className={cn(
                'h-7 text-xs font-semibold px-2.5 cursor-pointer rounded-lg gap-1',
                selectedProvider === 'adobe'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10'
              )}
            >
              🅰️ Adobe Stock
            </Button>
          </div>
        </div>

        {/* Results Header (Count & Actions) */}
        {results.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {results.length} {results.length === 1 ? 'image' : 'images'}{' '}
                displayed
              </span>
              {totalFound > results.length && (
                <span className="text-xs text-muted-foreground">
                  ({totalFound} qualifying matches found)
                </span>
              )}
              {analysis?.domain && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold"
                >
                  {analysis.domain}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isSummaryTopic && (
                <Button
                  type="button"
                  size="sm"
                  variant={showTopicAiPrompt ? 'secondary' : 'outline'}
                  onClick={() => setShowTopicAiPrompt(!showTopicAiPrompt)}
                  className="h-7 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {showTopicAiPrompt
                    ? 'Hide AI Prompt'
                    : '✨ AI Prompt for Outsource'}
                </Button>
              )}
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Ranked by AI semantic relevance • Genuine High-Res Assets
              </span>
            </div>
          </div>
        )}

        {/* Image Cards Grid with Razor-Sharp Dark Blurred Percentage Badge & Provider Badges */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((item) => {
              const isIdCopied = copiedId === item.assetId;
              const isLinkCopied = copiedLink === item.assetId;
              const isUnsplash = item.provider === 'unsplash';

              return (
                <Card
                  key={`${item.provider || 'stock'}_${item.assetId}`}
                  className="group overflow-hidden border border-border/70 hover:border-primary/40 transition-all duration-200 bg-card/70 flex flex-col shadow-xs hover:shadow-md"
                >
                  {/* Visual Preview Container */}
                  <div
                    className="relative aspect-16/10 bg-muted overflow-hidden cursor-pointer"
                    onClick={() => setPreviewModalItem(item)}
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        if (
                          e.target.src !== item.thumbnailUrl &&
                          item.thumbnailUrl
                        ) {
                          e.target.src = item.thumbnailUrl;
                        }
                      }}
                    />

                    {/* High-Contrast Dark Blur Percentage Badge */}
                    {item.relevanceScore && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-black backdrop-blur-md shadow-lg flex items-center gap-1.5 border',
                            'bg-black/85 text-white border-white/25'
                          )}
                        >
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0',
                              item.relevanceScore >= 80
                                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                                : item.relevanceScore >= 65
                                  ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
                                  : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                            )}
                          />
                          <span className="font-extrabold tracking-wide text-white">
                            {item.relevanceScore}%
                          </span>
                          <span className="text-[10px] text-zinc-300 font-semibold uppercase">
                            Match
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Provider Tag (Top Right) */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {isUnsplash ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-md shadow-md bg-emerald-600/90 text-white border border-emerald-400/40 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Unsplash • Free
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-md shadow-md bg-red-600/90 text-white border border-red-400/40 flex items-center gap-1">
                          🅰️ Adobe Stock
                        </span>
                      )}
                    </div>

                    {/* Click to Enlarge Hover Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-lg bg-background/90 text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-md">
                        <Maximize2 className="h-3.5 w-3.5" />
                        Preview
                      </span>
                    </div>
                  </div>

                  {/* Asset Metadata & Action Footer */}
                  <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3
                        className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => setPreviewModalItem(item)}
                        title={item.title}
                      >
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                        {isUnsplash ? (
                          <>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Free Commercial Use
                            </span>
                            {item.creator && (
                              <>
                                <span>•</span>
                                <span>
                                  By{' '}
                                  {item.creatorUrl ? (
                                    <a
                                      href={item.creatorUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-medium text-foreground/90 hover:underline"
                                    >
                                      {item.creator}
                                    </a>
                                  ) : (
                                    item.creator
                                  )}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-mono font-medium text-foreground/80">
                              ID: {item.assetId}
                            </span>
                            {item.creator && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">
                                  {item.creator}
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-1.5">
                      {isUnsplash ? (
                        <>
                          <Button
                            size="xs"
                            className="h-7 text-[11px] px-2.5 gap-1.5 rounded-md cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            disabled={downloadingId === item.assetId}
                            onClick={(e) => handleDownloadUnsplash(item, e)}
                          >
                            {downloadingId === item.assetId ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3" />
                                <span>⬇️ Free Download</span>
                              </>
                            )}
                          </Button>

                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 text-[11px] px-2 gap-1 rounded-md cursor-pointer hover:bg-muted"
                            onClick={(e) =>
                              handleCopyLink(
                                item.downloadUrl || item.stockUrl,
                                item.assetId,
                                e
                              )
                            }
                          >
                            {isLinkCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">
                                  Copied
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-muted-foreground" />
                                <span>Copy URL</span>
                              </>
                            )}
                          </Button>

                          <Button
                            size="xs"
                            variant="secondary"
                            className="h-7 text-[11px] px-2 gap-1 rounded-md ml-auto cursor-pointer"
                            asChild
                          >
                            <a
                              href={item.stockUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Unsplash</span>
                            </a>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 text-[11px] px-2 gap-1 rounded-md cursor-pointer hover:bg-muted"
                            onClick={(e) => handleCopyId(item.assetId, e)}
                          >
                            {isIdCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">
                                  Copied
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-muted-foreground" />
                                <span>Copy ID</span>
                              </>
                            )}
                          </Button>

                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 text-[11px] px-2 gap-1 rounded-md cursor-pointer hover:bg-muted"
                            onClick={(e) =>
                              handleCopyLink(item.stockUrl, item.assetId, e)
                            }
                          >
                            {isLinkCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">
                                  Copied
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-muted-foreground" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </Button>

                          <Button
                            size="xs"
                            variant="secondary"
                            className="h-7 text-[11px] px-2 gap-1 rounded-md ml-auto cursor-pointer"
                            asChild
                          >
                            <a
                              href={item.stockUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Open Stock</span>
                            </a>
                          </Button>
                        </>
                      )}

                      {onSelectImage && (
                        <Button
                          size="xs"
                          className="w-full mt-1 h-7 text-[11px]"
                          onClick={() => onSelectImage(item)}
                        >
                          Insert into Slide
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Show More Button */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleShowMore}
              disabled={loadingMore}
              variant="outline"
              className="h-10 px-8 rounded-xl font-semibold gap-2 border-border/80 shadow-xs cursor-pointer hover:bg-accent"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading Next Batch...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show More Results ({totalFound - results.length} remaining)
                </>
              )}
            </Button>
          </div>
        )}

        {/* Clean, Provider-Aware Empty State with Instant Action Suggestions */}
        {!loading && title.trim() && results.length === 0 && !error && (
          <div className="space-y-4">
            <Card className="border border-border/60 bg-card/40 text-center p-6 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {selectedProvider === 'unsplash'
                  ? 'No Unsplash Photos Found for "' + title + '"'
                  : selectedProvider === 'adobe'
                    ? 'No Adobe Stock Assets Found for "' + title + '"'
                    : 'No Matching Images Found for "' + title + '"'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Try searching with broader safety terms or click one of the
                quick suggestions below:
              </p>

              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {selectedProvider !== 'all' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() => handleSetProvider('all')}
                    className="h-7 text-xs rounded-lg cursor-pointer font-bold shadow-xs"
                  >
                    ✨ Switch to All Providers (Unsplash + Adobe)
                  </Button>
                )}
                {[
                  'Personal Protective Equipment',
                  'Electrical Safety & Switchgear',
                  'Hazard Warning Signs',
                  'Workplace Safety Inspection',
                  'Fire Extinguisher',
                ].map((sample) => (
                  <Button
                    key={sample}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTitle(sample);
                      executeSearch(sample, true);
                    }}
                    className="h-7 text-xs rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary"
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Optional Collapsible Adobe Enterprise Key Note (Collapsed by Default) */}
            {selectedProvider === 'adobe' && (
              <details className="p-3 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground group">
                <summary className="font-semibold text-foreground/80 cursor-pointer select-none list-none flex items-center justify-between">
                  <span>
                    Optional: How to connect paid Adobe Stock Enterprise API on
                    Vercel
                  </span>
                  <span className="text-[10px] text-primary underline">
                    Toggle setup guide
                  </span>
                </summary>
                <div className="pt-3 space-y-2 text-[11px] border-t border-border/40 mt-2">
                  <p>
                    If your team has an Adobe Stock paid account, you can add{' '}
                    <strong>ADOBE_STOCK_API_KEY</strong> in Vercel Environment
                    Variables. Zero-key public Adobe catalog and 100% free
                    Unsplash image search remain active automatically.
                  </p>
                </div>
              </details>
            )}

            {/* AI Image Generation Prompt as Instant Alternative */}
            <Card className="border border-primary/25 bg-gradient-to-r from-card via-background to-primary/5 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Instant Alternative: Copy AI Prompt for DALL-E / Gemini /
                  Midjourney:
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleCopyAiPrompt(activeAiPrompt, e)}
                  className="h-6 text-[10px] font-bold gap-1 cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  Copy Prompt
                </Button>
              </div>
              <pre className="p-2.5 rounded bg-muted/60 text-[11px] font-mono whitespace-pre-wrap select-all">
                {activeAiPrompt}
              </pre>
            </Card>
          </div>
        )}
      </div>
    );
  }
}

export default AdobeStockImageFinder;
