'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  AlertCircle,
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
  Video,
  Play,
  Film,
  Trash2,
  Archive,
  Plus,
  ArrowRight,
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

  // Search Query & Results
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [results, setResults] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [mediaType, setMediaType] = useState('all'); // 'all' | 'photo' | 'video' | 'illustration'
  const [orientation, setOrientation] = useState('all'); // 'all' | 'landscape' | 'portrait'
  const [selectedProvider, setSelectedProvider] = useState('all'); // 'all' | 'adobe' | 'pixabay' | 'unsplash' | 'pexels' | 'wikimedia'
  const [styleFilter, setStyleFilter] = useState({
    photo: true,
    illustration: true,
  });

  // Course Media Bin: Tracks assets assigned/downloaded per course to eliminate duplicates
  const [usedAssets, setUsedAssets] = useState([]);
  const [hideUsedAssets, setHideUsedAssets] = useState(true);
  const [showMediaBinDrawer, setShowMediaBinDrawer] = useState(false);

  // Modals & Drawers
  const [previewModalItem, setPreviewModalItem] = useState(null);
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [showTocDrawer, setShowTocDrawer] = useState(false);

  // Interactive 3-Tier Curriculum Context
  const [courseName, setCourseName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [lessonName, setLessonName] = useState('');
  const [showContextEditor, setShowContextEditor] = useState(false);

  // TOC / Word Document State
  const [tocData, setTocData] = useState(null);
  const [activeTopicIndex, setActiveTopicIndex] = useState(-1);
  const [tocSearchQuery, setTocSearchQuery] = useState('');
  const [visitedTopics, setVisitedTopics] = useState(new Set());
  const [pastingText, setPastingText] = useState('');
  const [parsingDoc, setParsingDoc] = useState(false);

  // Interaction feedback states
  const [downloadingId, setDownloadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const topicsTrackRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchIdRef = useRef(0);
  const topicCacheRef = useRef(new Map());

  // Storage key based on course name
  const storageKey = useMemo(() => {
    const raw = courseName || tocData?.courseTitle || 'default_course';
    return `hazwoper_used_media_${raw.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
  }, [courseName, tocData?.courseTitle]);

  // Load assigned assets from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUsedAssets(parsed);
        }
      } else {
        setUsedAssets([]);
      }
    } catch {
      setUsedAssets([]);
    }
  }, [storageKey]);

  // Persist assigned assets to localStorage
  const persistUsedAssets = (nextAssets) => {
    setUsedAssets(nextAssets);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextAssets));
      } catch (err) {
        console.warn('Failed to save used assets:', err);
      }
    }
  };

  // Sync if initialTitle changes
  useEffect(() => {
    if (initialTitle && initialTitle !== title) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  // Set of assigned asset IDs for fast lookup
  const usedAssetIds = useMemo(() => {
    return new Set(usedAssets.map((a) => String(a.assetId)));
  }, [usedAssets]);

  // Filtered results: hides already assigned items if hideUsedAssets is active
  const displayedResults = useMemo(() => {
    if (!hideUsedAssets) return results;
    return results.filter((item) => !usedAssetIds.has(String(item.assetId)));
  }, [results, hideUsedAssets, usedAssetIds]);

  // Assign an asset to the current course topic
  const handleAssignAsset = useCallback(
    (item, e) => {
      if (e) e.stopPropagation();
      if (!item) return;

      const activeTopic =
        activeTopicIndex >= 0 && tocData?.topics
          ? tocData.topics[activeTopicIndex]
          : null;

      const assignment = {
        assetId: String(item.assetId || item.id),
        title: item.title,
        previewUrl: item.previewUrl,
        largePreviewUrl: item.largePreviewUrl || item.previewUrl,
        downloadUrl: item.downloadUrl,
        videoUrl: item.videoUrl,
        provider: item.provider || 'stock',
        mediaType: item.mediaType || (item.videoUrl ? 'video' : 'photo'),
        orientation: item.orientation || 'landscape',
        course:
          courseName || activeTopic?.course || tocData?.courseTitle || 'General Course',
        module: moduleName || activeTopic?.module || tocData?.moduleTitle || '',
        lesson:
          lessonName || activeTopic?.lesson || tocData?.lessonTitle || 'General Lesson',
        topicTitle: activeTopic?.title || title || 'Current Slide',
        topicIndex: activeTopicIndex,
        assignedAt: Date.now(),
      };

      const exists = usedAssets.some((u) => u.assetId === assignment.assetId);
      const next = exists
        ? usedAssets.map((u) => (u.assetId === assignment.assetId ? assignment : u))
        : [assignment, ...usedAssets];

      persistUsedAssets(next);
      if (onSelectImage) onSelectImage(item);
    },
    [activeTopicIndex, tocData, courseName, moduleName, lessonName, title, usedAssets, onSelectImage]
  );

  // Release an asset from the Course Media Bin back to the gallery
  const handleReleaseAsset = (assetId, e) => {
    if (e) e.stopPropagation();
    const next = usedAssets.filter((u) => u.assetId !== String(assetId));
    persistUsedAssets(next);
  };

  // Clear all assigned assets for this course
  const handleClearAllUsedAssets = () => {
    if (window.confirm('Release all assigned assets back to the recommendation gallery?')) {
      persistUsedAssets([]);
    }
  };

  // Download an asset via server-side proxy and mark as assigned
  const handleDownloadFreeImage = async (item, e) => {
    if (e) e.stopPropagation();
    if (!item) return;
    setDownloadingId(item.assetId);

    // Automatically assign to this lesson so it never repeats
    handleAssignAsset(item);

    try {
      if (item.downloadApiUrl) {
        fetch(item.downloadApiUrl).catch(() => {});
      }

      const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
      const rawUrl =
        item.downloadUrl || item.videoUrl || item.largePreviewUrl || item.previewUrl;
      const ext = isVideo ? 'mp4' : 'jpg';
      const prov = item.provider || 'stock';
      const safeAssetId = String(item.assetId || item.id || 'media').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${prov}-${safeAssetId}.${ext}`;

      const proxyUrl = `/api/adobe-stock/download?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(filename)}`;
      const a = document.createElement('a');
      a.href = proxyUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      window.open(item.downloadUrl || item.videoUrl || item.previewUrl, '_blank');
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  // Batch download all items in the Media Bin
  const handleBatchDownloadUsedAssets = async () => {
    if (usedAssets.length === 0) return;
    for (const item of usedAssets) {
      try {
        const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
        const rawUrl = item.downloadUrl || item.videoUrl || item.previewUrl;
        const ext = isVideo ? 'mp4' : 'jpg';
        const filename = `${item.provider || 'stock'}-${item.assetId}.${ext}`;
        const proxyUrl = `/api/adobe-stock/download?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(filename)}`;
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        console.warn('Batch download item error:', err);
      }
    }
  };

  // Search Execution Engine
  const executeSearch = async (
    searchQuery,
    forceRefresh = false,
    context = {},
    activeStyle = styleFilter,
    activeProvider = selectedProvider,
    activeMediaType = mediaType,
    activeOrientation = orientation
  ) => {
    const cleanTitle = (searchQuery || '').trim();
    if (!cleanTitle) return;

    const effectiveContext = {
      course: (context.course || courseName || '').trim(),
      module: (context.module || moduleName || '').trim(),
      lesson: (context.lesson || lessonName || '').trim(),
      parentSection: context.parentSection,
    };

    // Cache key incorporates course, lesson, style, provider, mediaType, orientation, and topic
    const styleKey = `${activeStyle.photo ? 'p' : ''}_${activeStyle.illustration ? 'i' : ''}_${activeProvider}_${activeMediaType}_${activeOrientation}`;
    const cacheKey =
      `${effectiveContext.course}::${effectiveContext.lesson}::${effectiveContext.parentSection || ''}::${styleKey}::${cleanTitle}`.toLowerCase();

    if (!forceRefresh && topicCacheRef.current.has(cacheKey)) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const cached = topicCacheRef.current.get(cacheKey);
      setResults(cached.results || []);
      setTotalFound(cached.totalFound || 0);
      setOffset(cached.offset || 0);
      setHasMore(cached.hasMore || false);
      setAnalysis(cached.analysis || null);
      setError(null);
      setLoading(false);
      setLoadingStage('');
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentSearchId = ++searchIdRef.current;
    setLoading(true);
    setError(null);
    setResults([]);
    setTotalFound(0);
    setOffset(0);
    setHasMore(false);

    setLoadingStage('Analyzing curriculum subject...');
    const timer1 = setTimeout(() => {
      if (searchIdRef.current === currentSearchId) {
        setLoadingStage('Searching multi-provider stock catalogs...');
      }
    }, 400);

    const timer2 = setTimeout(() => {
      if (searchIdRef.current === currentSearchId) {
        setLoadingStage('Evaluating relevance and removing duplicates...');
      }
    }, 900);

    try {
      const response = await fetch('/api/adobe-stock/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          context: effectiveContext,
          styleFilter: activeStyle,
          provider: activeProvider,
          mediaType: activeMediaType,
          orientation: activeOrientation,
          excludeIds: hideUsedAssets ? usedAssets.map((a) => a.assetId) : [],
          offset: 0,
          limit: 24,
          threshold: 45,
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (searchIdRef.current !== currentSearchId) return;

      if (!response.ok) {
        setError(data.message || 'An error occurred while finding media.');
        return;
      }

      const freshResults = data.results || [];
      const freshTotalFound = data.totalFound || 0;
      const freshHasMore = Boolean(data.hasMore);
      const freshOffset = data.offset || 0;
      const freshAnalysis = data.analysis || null;

      setResults(freshResults);
      setTotalFound(freshTotalFound);
      setHasMore(freshHasMore);
      setOffset(freshOffset);
      setAnalysis(freshAnalysis);

      topicCacheRef.current.set(cacheKey, {
        results: freshResults,
        totalFound: freshTotalFound,
        hasMore: freshHasMore,
        offset: freshOffset,
        analysis: freshAnalysis,
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (searchIdRef.current === currentSearchId) {
        console.error('Search request error:', err);
        setError('Network error: Unable to reach search service. Please try again.');
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
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
      course: (courseName || activeTopic?.course || tocData?.courseTitle || '').trim(),
      module: (moduleName || activeTopic?.module || tocData?.moduleTitle || '').trim(),
      lesson: (lessonName || activeTopic?.lesson || tocData?.lessonTitle || '').trim(),
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
          mediaType,
          orientation,
          excludeIds: hideUsedAssets ? usedAssets.map((a) => a.assetId) : [],
          offset: nextOffset,
          limit: 24,
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

        const styleKey = `${styleFilter.photo ? 'p' : ''}_${styleFilter.illustration ? 'i' : ''}_${selectedProvider}_${mediaType}_${orientation}`;
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

  // Filter setters with auto-search
  const handleSetMediaType = (type) => {
    setMediaType(type);
    let nextStyle = styleFilter;
    if (type === 'all') nextStyle = { photo: true, illustration: true };
    else if (type === 'photo') nextStyle = { photo: true, illustration: false };
    else if (type === 'illustration') nextStyle = { photo: false, illustration: true };
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
      executeSearch(title, true, context, nextStyle, selectedProvider, type, orientation);
    }
  };

  const handleSetOrientation = (orient) => {
    setOrientation(orient);
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
      executeSearch(title, true, context, styleFilter, selectedProvider, mediaType, orient);
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
      executeSearch(title, true, context, styleFilter, provider, mediaType, orientation);
    }
  };

  // Word / DOCX file upload handler
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

  const handleParsePastedText = () => {
    if (!pastingText.trim()) return;
    const parsed = parseCourseTOC(pastingText, false);
    applyParsedTOC(parsed);
    setPastingText('');
  };

  const applyParsedTOC = (parsed) => {
    if (!parsed.topics || parsed.topics.length === 0) {
      setError('No lesson topics found in the document.');
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
    if (!tocData?.topics || activeTopicIndex >= tocData.topics.length - 1) return;
    const nextIdx = activeTopicIndex + 1;
    selectTopic(tocData.topics[nextIdx], nextIdx);
  };

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
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const generateAiPromptForTopic = (topicTitle) => {
    const clean = (topicTitle || title || '').trim();
    const cName = courseName || tocData?.courseTitle || 'Industrial Workplace Safety';
    const lName = lessonName || tocData?.lessonTitle || 'Equipment & Hazard Mitigation';

    return `Vertical 9:16 portrait orientation professional documentary industrial photograph illustrating "${clean}" in the context of ${cName} (${lName}). High-detail workplace setting showing authentic industrial safety components and enclosures in crisp focus, realistic lighting, commercial industrial photography, shot on Sony A7R V with 35mm f/2.8 lens. Absolutely NO text, NO words, NO letters, NO numbers, NO labels, NO watermarks. Clean educational visual.`;
  };

  // Filtered topics for search in TOC drawer
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
    <div className={cn('w-full max-w-7xl mx-auto space-y-4 sm:space-y-5', className)}>
      {/* 1. Header: Clean, modern, uncluttered */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Global Stock Finder
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-border/80"
            >
              Curriculum Aligned
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Discover commercial photos and videos matched to your training slides with 95%+ precision.
          </p>
        </div>

        {/* Action Controls: Mode Switcher & Media Bin Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center p-0.5 rounded-lg bg-muted border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'single'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Single Search
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('toc')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'toc'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Course Document
              {tocData?.totalTopics > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                  {tocData.totalTopics}
                </span>
              )}
            </button>
          </div>

          {/* Used Media Bin Trigger */}
          <Button
            type="button"
            variant={usedAssets.length > 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMediaBinDrawer(true)}
            className="h-8 text-xs font-bold gap-1.5 rounded-lg cursor-pointer shrink-0"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Used Media Bin</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                usedAssets.length > 0
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {usedAssets.length}
            </span>
          </Button>
        </div>
      </div>

      {/* 2. Curriculum Context Alignment Bar (Compact & Sleek) */}
      <div className="px-3.5 py-2 rounded-lg bg-card/80 border border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Curriculum:
          </span>
          {courseName || lessonName ? (
            <span className="font-semibold text-foreground truncate max-w-md">
              {courseName && <span className="text-primary font-bold">{courseName}</span>}
              {courseName && lessonName && <span className="text-muted-foreground mx-1">›</span>}
              {lessonName && <span>{lessonName}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground italic">
              Set Course & Lesson below to ensure 95%+ precision.
            </span>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowContextEditor(!showContextEditor)}
          className="h-6 text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
        >
          <Sliders className="h-3 w-3" />
          {showContextEditor ? 'Hide Details' : 'Edit Course Info'}
          <ChevronDown
            className={cn('h-3 w-3 transition-transform', showContextEditor && 'rotate-180')}
          />
        </Button>

        {showContextEditor && (
          <div className="w-full pt-2.5 mt-1 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Course Name
              </label>
              <Input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Electrical Safety & Arc Flash"
                className="h-8 text-xs mt-0.5 bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Module Name (Optional)
              </label>
              <Input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g. Module 1: Hazard Assessment"
                className="h-8 text-xs mt-0.5 bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Lesson Name
              </label>
              <Input
                type="text"
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
                placeholder="e.g. Lesson 2: LOTO & Isolation"
                className="h-8 text-xs mt-0.5 bg-background"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Input Zone: Single Search OR Course Document Ingestion */}
      {activeTab === 'single' ? (
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Paste or type slide title (e.g. Utility Power Entry and Service Configuration)..."
              className="pl-10 h-10 text-xs sm:text-sm bg-background border-border/80 focus-visible:ring-primary rounded-lg shadow-2xs"
              disabled={loading}
            />
            {title && (
              <button
                type="button"
                onClick={() => setTitle('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !title.trim()}
            className="h-10 px-5 rounded-lg text-xs font-bold gap-2 cursor-pointer shadow-2xs"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Find Media</span>
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-3">
          {/* Document Upload Bar */}
          {!tocData ? (
            <div className="p-5 rounded-xl border border-dashed border-border/90 bg-card/60 text-center space-y-3">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Upload Course Table of Contents (Word .docx or Text)
                </h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Upload your course Word file. Headings and lesson topics are parsed automatically, and quizzes are excluded.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".docx,.txt"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={parsingDoc}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 h-9 text-xs font-bold rounded-lg cursor-pointer"
                >
                  {parsingDoc ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Extracting Headings...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Select Word File (.docx)
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-2 border-t border-border/50 max-w-lg mx-auto space-y-2">
                <textarea
                  value={pastingText}
                  onChange={(e) => setPastingText(e.target.value)}
                  placeholder="Or paste your course outline / lesson headings here..."
                  className="w-full h-20 p-2.5 text-xs font-mono bg-background rounded-lg border border-border/80 focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleParsePastedText}
                  disabled={!pastingText.trim()}
                  className="h-7 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer"
                >
                  <ListOrdered className="h-3 w-3" />
                  Parse Pasted Outline
                </Button>
              </div>
            </div>
          ) : (
            /* Active Topic Navigation Bar */
            <div className="p-3 rounded-xl bg-card border border-border/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground flex-wrap">
                  <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0.2">
                    Topic {activeTopicIndex + 1} / {tocData.totalTopics}
                  </Badge>
                  {tocData.topics[activeTopicIndex]?.parentSection && (
                    <span className="text-muted-foreground/80 font-medium">
                      {tocData.topics[activeTopicIndex].parentSection} ›
                    </span>
                  )}
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-foreground truncate">
                  {title}
                </h2>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={activeTopicIndex <= 0 || loading}
                  onClick={goToPrevTopic}
                  className="h-8 px-2.5 text-xs gap-1 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={activeTopicIndex >= tocData.topics.length - 1 || loading}
                  onClick={goToNextTopic}
                  className="h-8 px-2.5 text-xs gap-1 rounded-lg cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowTocDrawer(true)}
                  className="h-8 px-2.5 text-xs gap-1.5 rounded-lg cursor-pointer font-bold"
                >
                  <ListOrdered className="h-3.5 w-3.5 text-primary" />
                  All Topics
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Unified Clean Filter Toolbar (Format, Ratio, Source, Deduplication Toggle) */}
      <div className="p-2.5 sm:p-3 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs space-y-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
          {/* Left: Media Format & Aspect Ratio */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Format:
            </span>
            <Button
              type="button"
              size="xs"
              variant={mediaType === 'all' ? 'default' : 'outline'}
              onClick={() => handleSetMediaType('all')}
              className="h-7 text-xs font-semibold px-2 rounded-md cursor-pointer"
            >
              All Media
            </Button>
            <Button
              type="button"
              size="xs"
              variant={mediaType === 'photo' ? 'default' : 'outline'}
              onClick={() => handleSetMediaType('photo')}
              className="h-7 text-xs font-semibold px-2 rounded-md cursor-pointer gap-1"
            >
              <Camera className="h-3 w-3" />
              Photos
            </Button>
            <Button
              type="button"
              size="xs"
              variant={mediaType === 'video' ? 'default' : 'outline'}
              onClick={() => handleSetMediaType('video')}
              className={cn(
                'h-7 text-xs font-semibold px-2 rounded-md cursor-pointer gap-1',
                mediaType === 'video'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'border-purple-500/40 text-purple-600 dark:text-purple-400'
              )}
            >
              <Video className="h-3 w-3" />
              Videos
            </Button>
            <Button
              type="button"
              size="xs"
              variant={mediaType === 'illustration' ? 'default' : 'outline'}
              onClick={() => handleSetMediaType('illustration')}
              className="h-7 text-xs font-semibold px-2 rounded-md cursor-pointer gap-1"
            >
              <Palette className="h-3 w-3" />
              Vectors
            </Button>

            <span className="text-border mx-1 hidden sm:inline">|</span>

            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Ratio:
            </span>
            <Button
              type="button"
              size="xs"
              variant={orientation === 'all' ? 'default' : 'outline'}
              onClick={() => handleSetOrientation('all')}
              className="h-7 text-xs font-semibold px-2 rounded-md cursor-pointer"
            >
              All Ratios
            </Button>
            <Button
              type="button"
              size="xs"
              variant={orientation === 'landscape' ? 'default' : 'outline'}
              onClick={() => handleSetOrientation('landscape')}
              className="h-7 text-xs font-semibold px-2 rounded-md cursor-pointer"
            >
              16:9
            </Button>
            <Button
              type="button"
              size="xs"
              variant={orientation === 'portrait' ? 'default' : 'outline'}
              onClick={() => handleSetOrientation('portrait')}
              className="h-7 text-xs font-semibold px-2 rounded-md cursor-pointer"
            >
              9:16
            </Button>
          </div>

          {/* Right: Deduplication Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHideUsedAssets(!hideUsedAssets)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border',
                hideUsedAssets
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted/50 border-border/80 text-muted-foreground hover:bg-muted'
              )}
            >
              {hideUsedAssets ? (
                <Check className="h-3 w-3 stroke-[3]" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              <span>Hide Already Assigned ({usedAssets.length})</span>
            </button>
          </div>
        </div>

        {/* Catalog Selector Strip */}
        <div className="pt-2 border-t border-border/50 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Source:
          </span>
          <Button
            type="button"
            size="xs"
            variant={selectedProvider === 'all' ? 'default' : 'outline'}
            onClick={() => handleSetProvider('all')}
            className="h-6 text-[11px] px-2 rounded-md cursor-pointer"
          >
            All Sources
          </Button>
          <Button
            type="button"
            size="xs"
            variant={selectedProvider === 'adobe' ? 'default' : 'outline'}
            onClick={() => handleSetProvider('adobe')}
            className={cn(
              'h-6 text-[11px] px-2 rounded-md cursor-pointer',
              selectedProvider === 'adobe' && 'bg-red-600 hover:bg-red-700 text-white'
            )}
          >
            🅰️ Adobe Stock
          </Button>
          <Button
            type="button"
            size="xs"
            variant={selectedProvider === 'pixabay' ? 'default' : 'outline'}
            onClick={() => handleSetProvider('pixabay')}
            className={cn(
              'h-6 text-[11px] px-2 rounded-md cursor-pointer',
              selectedProvider === 'pixabay' && 'bg-indigo-600 hover:bg-indigo-700 text-white'
            )}
          >
            🖼️ Pixabay (Photos & Videos)
          </Button>
          <Button
            type="button"
            size="xs"
            variant={selectedProvider === 'unsplash' ? 'default' : 'outline'}
            onClick={() => handleSetProvider('unsplash')}
            className={cn(
              'h-6 text-[11px] px-2 rounded-md cursor-pointer',
              selectedProvider === 'unsplash' && 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            ✨ Unsplash
          </Button>
          <Button
            type="button"
            size="xs"
            variant={selectedProvider === 'pexels' ? 'default' : 'outline'}
            onClick={() => handleSetProvider('pexels')}
            className={cn(
              'h-6 text-[11px] px-2 rounded-md cursor-pointer',
              selectedProvider === 'pexels' && 'bg-teal-600 hover:bg-teal-700 text-white'
            )}
          >
            📸 Pexels
          </Button>
          <Button
            type="button"
            size="xs"
            variant={selectedProvider === 'wikimedia' ? 'default' : 'outline'}
            onClick={() => handleSetProvider('wikimedia')}
            className={cn(
              'h-6 text-[11px] px-2 rounded-md cursor-pointer',
              selectedProvider === 'wikimedia' && 'bg-amber-600 hover:bg-amber-700 text-white'
            )}
          >
            🏛️ Wikimedia
          </Button>
        </div>
      </div>

      {/* 5. Results Status Bar & AI Prompt Modal Trigger */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-primary font-semibold flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {loadingStage || 'Searching catalog...'}
            </span>
          ) : displayedResults.length > 0 ? (
            <span className="font-bold text-foreground">
              {displayedResults.length} {displayedResults.length === 1 ? 'asset' : 'assets'} available
              {hideUsedAssets && usedAssets.length > 0 && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({usedAssets.length} assigned hidden)
                </span>
              )}
            </span>
          ) : title.trim() ? (
            <span className="text-muted-foreground">No matching images found.</span>
          ) : null}
        </div>

        {title.trim() && !loading && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowAiPromptModal(true)}
            className="h-7 text-xs font-bold text-amber-600 dark:text-amber-400 gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Image Prompt
          </Button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6. Media Cards Gallery Grid */}
      {displayedResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedResults.map((item) => {
            const isAssigned = usedAssetIds.has(String(item.assetId));
            const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
            const isPortrait = item.orientation === 'portrait';

            return (
              <Card
                key={`${item.provider || 'stock'}_${item.assetId}`}
                className={cn(
                  'group overflow-hidden border border-border/70 hover:border-primary/40 transition-all duration-200 bg-card/70 flex flex-col shadow-2xs hover:shadow-sm',
                  isAssigned && 'ring-2 ring-emerald-500/40 opacity-75'
                )}
              >
                {/* Media Viewport */}
                <div
                  className={cn(
                    'relative bg-muted overflow-hidden cursor-pointer',
                    isPortrait ? 'aspect-9/16 max-h-[360px] w-full' : 'aspect-16/10'
                  )}
                  onClick={() => setPreviewModalItem(item)}
                >
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const currentSrc = e.target.src;
                      if (item.thumbnailUrl && currentSrc !== item.thumbnailUrl) {
                        e.target.src = item.thumbnailUrl;
                      } else if (item.largePreviewUrl && currentSrc !== item.largePreviewUrl) {
                        e.target.src = item.largePreviewUrl;
                      } else if (item.downloadUrl && currentSrc !== item.downloadUrl) {
                        e.target.src = item.downloadUrl;
                      } else if (!currentSrc.includes('/api/proxy-image')) {
                        e.target.src = `/api/proxy-image?url=${encodeURIComponent(item.previewUrl || item.downloadUrl || '')}`;
                      }
                    }}
                  />

                  {/* Top-Left: Relevance Percentage Badge */}
                  {item.relevanceScore && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black backdrop-blur-md shadow-md bg-black/85 text-white border border-white/20 flex items-center gap-1">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            item.relevanceScore >= 80 ? 'bg-emerald-400' : 'bg-cyan-400'
                          )}
                        />
                        {item.relevanceScore}%
                      </span>
                    </div>
                  )}

                  {/* Bottom-Left: Video Badge */}
                  {isVideo && (
                    <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                      <Play className="h-2.5 w-2.5 fill-white text-white" />
                      <span>{item.duration ? `${item.duration}s` : 'Video'}</span>
                      <span className="text-zinc-300">• {isPortrait ? '9:16' : '16:9'}</span>
                    </div>
                  )}

                  {/* Top-Right: Provider Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-black backdrop-blur-md shadow-md text-white border',
                        item.provider === 'adobe'
                          ? 'bg-red-600/90 border-red-400/30'
                          : item.provider === 'pixabay'
                            ? 'bg-indigo-600/90 border-indigo-400/30'
                            : item.provider === 'unsplash'
                              ? 'bg-emerald-600/90 border-emerald-400/30'
                              : item.provider === 'pexels'
                                ? 'bg-teal-600/90 border-teal-400/30'
                                : 'bg-amber-600/90 border-amber-400/30'
                      )}
                    >
                      {item.provider === 'adobe'
                        ? '🅰️ Adobe'
                        : `${item.provider.toUpperCase()} • Free`}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1 rounded-md bg-background/90 text-foreground text-xs font-bold flex items-center gap-1 shadow-md">
                      {isVideo ? <Play className="h-3 w-3 fill-current" /> : <Maximize2 className="h-3 w-3" />}
                      {isVideo ? 'Play Video' : 'Preview'}
                    </span>
                  </div>
                </div>

                {/* Metadata & Actions */}
                <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1">
                    <h3
                      className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => setPreviewModalItem(item)}
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.creator ? `By ${item.creator}` : 'High Resolution'}
                    </p>
                  </div>

                  {/* Primary Action Button */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-1.5">
                    {item.isFreeDownload ? (
                      <Button
                        size="xs"
                        className={cn(
                          'h-7 text-[11px] px-2.5 gap-1.5 rounded-md cursor-pointer font-bold flex-1',
                          isAssigned
                            ? 'bg-muted text-foreground hover:bg-muted/80'
                            : item.provider === 'pixabay'
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : item.provider === 'pexels'
                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                : item.provider === 'wikimedia'
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        )}
                        disabled={downloadingId === item.assetId}
                        onClick={(e) => handleDownloadFreeImage(item, e)}
                      >
                        {downloadingId === item.assetId ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : isAssigned ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <span>In Use (Assigned)</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3" />
                            <span>{isVideo ? 'Download MP4 & Assign' : 'Download & Assign'}</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        className="h-7 text-[11px] px-2.5 gap-1.5 rounded-md cursor-pointer flex-1 font-bold"
                        onClick={(e) => {
                          handleAssignAsset(item, e);
                          handleCopyId(item.assetId, e);
                        }}
                      >
                        {copiedId === item.assetId ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>ID Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-muted-foreground" />
                            <span>Copy ID & Assign</span>
                          </>
                        )}
                      </Button>
                    )}

                    {/* Secondary Actions: Quick Link / Release */}
                    {isAssigned ? (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-7 px-2 text-[11px] text-destructive hover:text-destructive cursor-pointer"
                        onClick={(e) => handleReleaseAsset(item.assetId, e)}
                        title="Release back to gallery"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        className="h-7 px-2 text-[11px] cursor-pointer"
                        onClick={(e) =>
                          handleCopyLink(item.downloadUrl || item.stockUrl, item.assetId, e)
                        }
                        title="Copy direct URL"
                      >
                        {copiedLink === item.assetId ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Show More Pagination Button */}
      {hasMore && displayedResults.length > 0 && (
        <div className="pt-2 text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={handleShowMore}
            className="h-8 text-xs font-bold px-6 rounded-lg cursor-pointer"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading More...
              </>
            ) : (
              'Load More Media'
            )}
          </Button>
        </div>
      )}

      {/* 7. Course Media Bin Drawer (Used Assets Sidebar) */}
      <Sheet open={showMediaBinDrawer} onOpenChange={setShowMediaBinDrawer}>
        <SheetContent side="right" className="w-full sm:max-w-md p-4 sm:p-5 flex flex-col">
          <SheetHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base font-bold flex items-center gap-2">
                  <Archive className="h-4 w-4 text-primary" />
                  Course Media Bin
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {usedAssets.length} assets assigned to{' '}
                  <span className="font-semibold text-foreground">
                    {courseName || 'this course'}
                  </span>
                </p>
              </div>

              {usedAssets.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleBatchDownloadUsedAssets}
                    className="h-7 text-[11px] gap-1 cursor-pointer font-bold"
                    title="Download all assigned assets"
                  >
                    <Download className="h-3 w-3" />
                    Download All
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleClearAllUsedAssets}
                    className="h-7 text-[11px] text-destructive hover:text-destructive cursor-pointer"
                    title="Release all back to gallery"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {usedAssets.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="p-3 rounded-full bg-muted w-10 h-10 mx-auto flex items-center justify-center text-muted-foreground">
                  <Archive className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-foreground">No Media Assigned Yet</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  When you download or assign an asset for a lesson slide, it will appear here and
                  automatically disappear from the recommendation gallery to prevent repeating images.
                </p>
              </div>
            ) : (
              usedAssets.map((asset) => (
                <div
                  key={asset.assetId}
                  className="p-2.5 rounded-lg border border-border/70 bg-card flex items-center gap-3 text-xs"
                >
                  <img
                    src={asset.previewUrl || asset.thumbnailUrl}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 rounded-md object-cover shrink-0 bg-muted"
                    onError={(e) => {
                      if (!e.target.src.includes('/api/proxy-image')) {
                        e.target.src = `/api/proxy-image?url=${encodeURIComponent(asset.previewUrl || asset.thumbnailUrl || '')}`;
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-foreground truncate" title={asset.title}>
                      {asset.title}
                    </h5>
                    <div className="text-[10px] text-muted-foreground truncate">
                      📍 {asset.lesson ? `${asset.lesson} › ` : ''}
                      {asset.topicTitle || 'Slide'}
                    </div>
                    <div className="text-[10px] font-semibold text-primary uppercase mt-0.5">
                      {asset.provider} • {asset.mediaType === 'video' ? 'Video' : 'Photo'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="xs"
                      variant="outline"
                      className="h-7 px-2 cursor-pointer"
                      onClick={() => handleDownloadFreeImage(asset)}
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-7 px-2 text-destructive hover:text-destructive cursor-pointer"
                      onClick={(e) => handleReleaseAsset(asset.assetId, e)}
                      title="Release back to gallery"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 8. All Topics Drawer (Course TOC) */}
      <Sheet open={showTocDrawer} onOpenChange={setShowTocDrawer}>
        <SheetContent side="left" className="w-full sm:max-w-md p-4 flex flex-col">
          <SheetHeader className="pb-3 border-b border-border/60">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-primary" />
              Course Curriculum Topics
            </SheetTitle>
            <Input
              type="text"
              value={tocSearchQuery}
              onChange={(e) => setTocSearchQuery(e.target.value)}
              placeholder="Filter topics..."
              className="h-8 text-xs mt-2"
            />
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-2 space-y-1">
            {filteredTopics.map((topic, idx) => {
              const isSelected = activeTopicIndex === idx;
              return (
                <button
                  key={topic.id || idx}
                  type="button"
                  onClick={() => {
                    selectTopic(topic, idx);
                    setShowTocDrawer(false);
                  }}
                  className={cn(
                    'w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2 cursor-pointer',
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted/60 text-foreground/90'
                  )}
                >
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    {topic.parentSection && (
                      <div className="text-[10px] text-muted-foreground/80 uppercase font-semibold">
                        {topic.parentSection}
                      </div>
                    )}
                    <span className="line-clamp-2 leading-tight">{topic.title}</span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* 9. Lightbox Preview Modal */}
      {previewModalItem && (
        <Dialog open={Boolean(previewModalItem)} onOpenChange={() => setPreviewModalItem(null)}>
          <DialogContent className="max-w-3xl p-5 overflow-hidden">
            <DialogHeader className="space-y-1 pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                  {previewModalItem.provider} •{' '}
                  {previewModalItem.isFreeDownload ? 'Free Commercial' : 'Adobe Stock'}
                </Badge>
                {previewModalItem.relevanceScore && (
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    {previewModalItem.relevanceScore}% Match
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-bold leading-snug">
                {previewModalItem.title}
              </DialogTitle>
            </DialogHeader>

            <div
              className={cn(
                'relative rounded-xl overflow-hidden bg-zinc-950 my-2 flex items-center justify-center',
                previewModalItem.orientation === 'portrait'
                  ? 'aspect-9/16 max-h-[480px] mx-auto'
                  : 'aspect-16/10'
              )}
            >
              {previewModalItem.mediaType === 'video' || previewModalItem.videoUrl ? (
                <video
                  src={previewModalItem.videoUrl || previewModalItem.downloadUrl}
                  poster={previewModalItem.previewUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewModalItem.largePreviewUrl || previewModalItem.previewUrl}
                  alt={previewModalItem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const currentSrc = e.target.src;
                    if (previewModalItem.previewUrl && currentSrc !== previewModalItem.previewUrl) {
                      e.target.src = previewModalItem.previewUrl;
                    } else if (previewModalItem.downloadUrl && currentSrc !== previewModalItem.downloadUrl) {
                      e.target.src = previewModalItem.downloadUrl;
                    } else if (!currentSrc.includes('/api/proxy-image')) {
                      e.target.src = `/api/proxy-image?url=${encodeURIComponent(previewModalItem.largePreviewUrl || previewModalItem.previewUrl || '')}`;
                    }
                  }}
                />
              )}
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {previewModalItem.creator && <span>By {previewModalItem.creator}</span>}
              </div>

              <div className="flex items-center gap-2">
                {previewModalItem.isFreeDownload ? (
                  <Button
                    size="sm"
                    className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
                    onClick={() => handleDownloadFreeImage(previewModalItem)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download & Assign
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
                    onClick={() => handleCopyId(previewModalItem.assetId)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Asset ID
                  </Button>
                )}

                <Button size="sm" variant="secondary" className="h-8 text-xs cursor-pointer" asChild>
                  <a href={previewModalItem.stockUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Source
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 10. AI Prompt Dialog (Clean & Isolated) */}
      <Dialog open={showAiPromptModal} onOpenChange={setShowAiPromptModal}>
        <DialogContent className="max-w-xl p-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Image Generator Prompt
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Copy this prompt into ChatGPT (DALL-E 3), Midjourney, or Gemini for a custom vertical slide visual.
            </p>
          </DialogHeader>

          <div className="my-2 p-3 rounded-lg bg-muted text-xs font-mono leading-relaxed select-all max-h-48 overflow-y-auto">
            {generateAiPromptForTopic(title)}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground italic">9:16 Portrait • Zero Text</span>
            <Button
              size="sm"
              onClick={(e) => handleCopyAiPrompt(generateAiPromptForTopic(title), e)}
              className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
            >
              {copiedPrompt ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedPrompt ? 'Copied to Clipboard!' : 'Copy Prompt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdobeStockImageFinder;
