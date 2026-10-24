'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Youtube,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  FileVideo,
  Smartphone,
  Laptop,
  Square,
  Wand2,
  Clock,
  Type,
  Shield,
  Languages,
  Layers,
  Music,
  ChevronDown,
  ChevronUp,
  Moon,
  Mic,
  GraduationCap,
  Flame,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Library,
  Cookie,
  Film,
} from 'lucide-react';
import { showToast, showSuccess } from '@/lib/swal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  ASPECT_RATIOS,
  DURATION_PRESETS,
  CLIP_COUNT_PRESETS,
  FRAMING_MODES,
  CAPTION_STYLES,
  CAPTION_LANGUAGES,
  CAPTION_MODES,
  TRANSLITERATION_STYLES,
  OPENING_STYLES,
  CONTENT_TYPES,
  VISUAL_SOURCES,
} from '@/lib/video-shorts/types';
import { isValidYouTubeUrl } from '@/lib/video-shorts/source-parser';
import { MediaHubDrawer } from './media-hub-drawer';
import { YouTubeCookieButton } from './youtube-cookie-button';
import { cn } from '@/lib/utils';

export function VideoInputSection({
  videoSource,
  onVideoSelected,
  onAnalyzeUrl,
  onSelectFromMediaHub,
  onStartGeneration,
  onResetVideo,
  settings,
  onUpdateSettings,
  isProcessing,
  processingStatus,
  queueStatus,
  uploadProgress = 0,
  youtubeIssue,
  onClearYoutubeIssue,
}) {
  const [isMediaHubOpen, setIsMediaHubOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showLyricsPanel, setShowLyricsPanel] = useState(false);
  const [isUploadingCookies, setIsUploadingCookies] = useState(false);
  const [cookieInfo, setCookieInfo] = useState({
    checked: false,
    hasCookies: false,
    size: 0,
    updatedAt: null,
  });
  const [isCookieStepSkipped, setIsCookieStepSkipped] = useState(false);
  const [isReplacingCookie, setIsReplacingCookie] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const fileInputRef = useRef(null);
  const cookieInputRef = useRef(null);

  const fetchCookieStatus = async () => {
    try {
      const res = await fetch('/api/video-shorts/cookies');
      const data = await res.json();
      setCookieInfo({
        checked: true,
        hasCookies: !!data.hasCookies,
        size: data.size || 0,
        updatedAt: data.updatedAt || null,
      });
    } catch {
      setCookieInfo((prev) => ({ ...prev, checked: true }));
    }
  };

  useEffect(() => {
    fetchCookieStatus();
  }, []);

  const handleCookieFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCookies(true);
    try {
      const text = await file.text();
      const res = await fetch('/api/video-shorts/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookiesContent: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save cookies.');
      showSuccess(
        'YouTube cookies verified & saved!',
        '1080p FHD download unlocked. Now paste your YouTube URL below.'
      );
      setIsReplacingCookie(false);
      setIsCookieStepSkipped(false);
      await fetchCookieStatus();
      if (onClearYoutubeIssue) onClearYoutubeIssue();
    } catch (err) {
      showToast(err.message || 'Failed to upload cookies.', 'error');
    } finally {
      setIsUploadingCookies(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onVideoSelected(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onVideoSelected(files[0]);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    setUrlError('');

    if (!youtubeUrl.trim()) {
      setUrlError('Please enter a YouTube video URL.');
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setUrlError(
        'Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or /shorts/...).'
      );
      return;
    }

    onAnalyzeUrl(youtubeUrl.trim());
  };

  const formatSeconds = (sec) => {
    if (!sec) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>OpusClip-Style Intelligent AI Shorts Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
          Turn Long Videos into Viral Shorts
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Upload any video or YouTube link. The AI detects true speech onsets,
          keeps active speakers in 9:16 portrait, auto-removes watermarks, and
          generates animated subtitles.
        </p>
      </div>

      {/* STEP 1: VIDEO INGESTION (Only if no video loaded yet) */}
      {!videoSource && (
        <Card className="p-4 sm:p-6 md:p-8 rounded-3xl border-border/70 shadow-xl bg-card/80 backdrop-blur-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Create Short Videos with AI in 1 Click
                </h2>
                <p className="text-xs text-muted-foreground">
                  Paste any YouTube URL or drop your raw video file
                </p>
              </div>
            </div>

            {/* Quick Actions: Direct Media Hub Button & Optional Cookie Settings */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMediaHubOpen(true)}
                className="rounded-xl text-xs font-bold gap-1.5 h-8 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer shadow-xs"
              >
                <Library className="w-3.5 h-3.5 text-primary" />
                <span>Media Hub Library</span>
              </Button>
              <YouTubeCookieButton
                initialUrl={youtubeUrl || youtubeIssue?.url || ''}
                onAnalyzeUrl={(url) => {
                  setYoutubeUrl(url);
                  onAnalyzeUrl(url);
                }}
                onUpdated={onClearYoutubeIssue}
              />
            </div>
          </div>

          {/* Unified Klap-Style Ingestion Container */}
          <div className="space-y-5">
            {/* Direct YouTube Link Input (1-Click Primary Action) */}
            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <div className="p-4 sm:p-6 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <div className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                      <Youtube className="w-3.5 h-3.5" />
                    </div>
                    <span>YouTube Video or Shorts Link</span>
                  </Label>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  >
                    1080p FHD Quality
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      if (urlError) setUrlError('');
                    }}
                    placeholder="Paste YouTube Link: https://www.youtube.com/watch?v=... or shorts/..."
                    className="h-12 rounded-xl text-sm font-mono flex-1 bg-background shadow-xs"
                    disabled={isProcessing}
                  />
                  <Button
                    type="submit"
                    disabled={isProcessing || !youtubeUrl.trim()}
                    className="h-12 px-6 rounded-xl font-bold cursor-pointer shrink-0 bg-gradient-to-r from-amber-500 via-primary to-primary text-white hover:opacity-95 shadow-lg shadow-primary/25 transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>⚡ Generate Shorts</span>
                  </Button>
                </div>

                {urlError && (
                  <div className="flex items-center gap-2 text-xs text-destructive font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{urlError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{' '}
                    1080p Full HD
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{' '}
                    Audio-Onset Lead-In (-1.0s)
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{' '}
                    Urdu &amp; Roman Typing Subtitles
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{' '}
                    100% Free
                  </span>
                </div>
              </div>

              {/* YouTube Bot Challenge Recovery Card if triggered */}
              {youtubeIssue && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm space-y-3 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                        <Cookie className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">
                          YouTube Session Challenge Encountered
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Upload a fresh{' '}
                          <code className="font-mono text-primary font-bold">
                            cookies.txt
                          </code>{' '}
                          via the Cookies button above, or upload the video file
                          directly below.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          fileInputRef.current?.click();
                          if (onClearYoutubeIssue) onClearYoutubeIssue();
                        }}
                        className="rounded-xl text-xs font-bold gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File Instead</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          onAnalyzeUrl(youtubeIssue.url || youtubeUrl)
                        }
                        className="rounded-xl text-xs font-bold gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Subtle Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
                <span className="bg-card px-3 text-muted-foreground">
                  OR DROP A VIDEO FILE
                </span>
              </div>
            </div>

            {/* Compact Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center space-y-2',
                isDragging
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">
                  Drop your raw video file here, or{' '}
                  <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, MOV, WebM up to 1.5 GB • Ingests directly to Media Assets
                </p>
              </div>
            </div>
          </div>

          {/* 3-Phase Klap Loading Screen */}
          {isProcessing && (
            <div className="p-6 rounded-3xl border border-primary/30 bg-primary/5 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Wand2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Klap AI Shorts Engine Active
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {processingStatus ||
                        'Generating viral shorts from recitation audio...'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-primary font-black text-base">
                  {Math.round(uploadProgress || 0)}%
                </span>
              </div>

              {/* Dynamic 3-Phase Stepper */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div
                  className={cn(
                    'p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all',
                    uploadProgress >= 5 && uploadProgress < 40
                      ? 'border-primary bg-primary/10 text-foreground'
                      : uploadProgress >= 40
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border/50 text-muted-foreground opacity-60'
                  )}
                >
                  {uploadProgress >= 40 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  )}
                  <span>1. Ingest 1080p Stream</span>
                </div>

                <div
                  className={cn(
                    'p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all',
                    uploadProgress >= 40 && uploadProgress < 75
                      ? 'border-primary bg-primary/10 text-foreground'
                      : uploadProgress >= 75
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border/50 text-muted-foreground opacity-60'
                  )}
                >
                  {uploadProgress >= 75 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : uploadProgress >= 40 ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 shrink-0" />
                  )}
                  <span>2. Transcribe &amp; Sync Words</span>
                </div>

                <div
                  className={cn(
                    'p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all',
                    uploadProgress >= 75
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/50 text-muted-foreground opacity-60'
                  )}
                >
                  {uploadProgress >= 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : uploadProgress >= 75 ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 shrink-0" />
                  )}
                  <span>3. Elastic Verse Clipping</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-primary to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                  style={{
                    width: `${Math.min(100, Math.max(5, uploadProgress || 0))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 2: VIDEO CONFIRMED -> STEP-BY-STEP SHORTS CONFIGURATION */}
      {videoSource && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Verified Video Summary Card */}
          <Card className="p-4 sm:p-5 rounded-3xl border-border/70 shadow-lg bg-card/90 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
              {/* Video Thumbnail */}
              <div className="w-24 h-16 sm:w-28 sm:h-18 rounded-2xl bg-black overflow-hidden relative shrink-0 shadow-md border border-border">
                {videoSource.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      videoSource.thumbnailMaxRes || videoSource.thumbnailUrl
                    }
                    alt={videoSource.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary">
                    <FileVideo className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold">
                  {formatSeconds(videoSource.duration)}
                </div>
              </div>

              {/* Title and metadata */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Saved to Media Assets</span>
                  </Badge>
                  {videoSource.transcript && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-primary/10 text-primary border-primary/30 font-bold"
                    >
                      Real Subtitles Active
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate max-w-lg">
                  {videoSource.title ||
                    videoSource.fileName ||
                    'Loaded Source Video'}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {videoSource.author ? `By ${videoSource.author} • ` : ''}
                  Duration: {formatSeconds(videoSource.duration)} • Format: 9:16
                  Portrait Ready
                </p>
              </div>
            </div>

            {/* Change video button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onResetVideo}
              disabled={isProcessing}
              className="rounded-xl shrink-0 font-bold cursor-pointer text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change Video</span>
            </Button>
          </Card>

          {/* 1-Click Fast Generation Hero Card */}
          <Card className="p-6 sm:p-8 rounded-3xl border-primary/40 shadow-2xl bg-gradient-to-b from-card via-card to-primary/5 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase px-2.5 py-0.5">
                    1-Click Auto Mode
                  </Badge>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All Pro Settings
                    Auto-Selected
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Auto-Generate 9:16 Shorts with Typing Subtitles
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  AI will auto-center the reciter, transcribe Urdu &amp; Roman
                  Urdu, add 1.0s audio pre-roll, and detect complete verses.
                </p>
              </div>

              <Button
                size="lg"
                onClick={onStartGeneration}
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 h-14 rounded-2xl font-black text-base cursor-pointer shadow-xl bg-gradient-to-r from-primary via-emerald-600 to-primary text-primary-foreground hover:opacity-95 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] shrink-0"
              >
                {isProcessing ? (
                  <>
                    <Wand2 className="w-5 h-5 animate-spin" />
                    <span>Auto-Generating Shorts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>AUTO-GENERATE SHORTS (1080p FHD)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Smart Feature Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                Active Defaults:
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-medium"
              >
                1080p FHD Ingestion
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/40 text-primary bg-primary/10 font-medium"
              >
                Smart Face &amp; Torso Centering
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium"
              >
                Urdu &rarr; Roman Urdu Typing Subtitles
              </Badge>
              <Badge
                variant="outline"
                className="border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/10 font-medium"
              >
                1.0s Audio Onset Pre-roll
              </Badge>
              <Badge
                variant="outline"
                className="border-violet-500/40 text-violet-600 dark:text-violet-400 bg-violet-500/10 font-medium"
              >
                Complete Ash&apos;aar (Never Cut Mid-Verse)
              </Badge>
            </div>

            {/* Collapsible Advanced Toggle */}
            <div className="pt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                You can edit subtitles, trim, and adjust framing anytime in the
                Studio Editor.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer gap-1"
              >
                <span>
                  {showAdvancedOptions
                    ? 'Hide Advanced Settings'
                    : 'Customize Settings (Optional)'}
                </span>
                {showAdvancedOptions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Optional Advanced Settings Accordion */}
          {showAdvancedOptions && (
            <Card className="p-6 sm:p-8 rounded-3xl border-border/70 shadow-xl bg-card space-y-8 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-primary/20 text-primary font-black text-xs flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Advanced Customization (Optional)
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Fine-tune duration presets, lyrics, or subtitle styles
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 1: SHORTS CONTENT TYPE */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>
                    1. What type of video shorts do you want to create?
                  </span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {CONTENT_TYPES.map((type) => {
                    const active =
                      (settings.contentType || 'naat-recitation') === type.id;
                    const Icon =
                      type.id === 'naat-recitation'
                        ? Moon
                        : type.id === 'podcast-interview'
                          ? Mic
                          : type.id === 'educational-lecture'
                            ? GraduationCap
                            : Flame;

                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ contentType: type.id })
                        }
                        className={cn(
                          'p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative group hover:scale-[1.01]',
                          active
                            ? 'border-primary bg-primary/10 shadow-md text-foreground'
                            : 'border-border/60 hover:border-border text-muted-foreground bg-muted/20'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center shadow-xs',
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] font-mono font-bold',
                              active
                                ? 'border-primary/50 text-primary'
                                : 'text-muted-foreground'
                            )}
                          >
                            {type.badge}
                          </Badge>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs sm:text-sm text-foreground">
                            {type.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                            {type.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: VISUAL SOURCE SELECTION */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-primary" />
                    <span>2. Visual Source Mode</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Active:{' '}
                    <strong className="text-primary">
                      {VISUAL_SOURCES.find(
                        (v) =>
                          v.id === (settings.visualSourceMode || 'ai-choice')
                      )?.label || 'AI Choose Best Option'}
                    </strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {VISUAL_SOURCES.map((vs) => {
                    const active =
                      (settings.visualSourceMode || 'ai-choice') === vs.id;
                    return (
                      <button
                        key={vs.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ visualSourceMode: vs.id })
                        }
                        className={cn(
                          'p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative group hover:scale-[1.01]',
                          active
                            ? 'border-primary bg-primary/10 shadow-md text-foreground ring-1 ring-primary/40'
                            : 'border-border/60 hover:border-border text-muted-foreground bg-muted/20'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-foreground">
                            {vs.label}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] font-mono font-bold',
                              active
                                ? 'border-primary/50 text-primary bg-primary/10'
                                : 'text-muted-foreground'
                            )}
                          >
                            {vs.badge}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">
                          {vs.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: DURATION & MOMENTS COUNT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Duration Preset */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>3. Shorts Duration (Strict 30s Minimum)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {DURATION_PRESETS.filter((p) => p.id !== 'custom').map(
                      (preset) => {
                        const active = settings.durationPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() =>
                              onUpdateSettings({ durationPreset: preset.id })
                            }
                            className={cn(
                              'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                              active
                                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                                : 'border-border/60 hover:border-border text-muted-foreground bg-muted/20'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase">
                                {preset.label}
                              </span>
                              <span className="text-[10px] font-mono font-bold">
                                Target {preset.target}s
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-1">
                              {preset.description}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Number of Clips */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>3. How Many Shorts to Generate?</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {CLIP_COUNT_PRESETS.map((cp) => {
                      const active = settings.clipCount === cp.count;
                      return (
                        <button
                          key={cp.count}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({ clipCount: cp.count })
                          }
                          className={cn(
                            'p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1',
                            active
                              ? 'border-primary bg-primary/10 text-primary shadow-xs font-bold'
                              : 'border-border/60 hover:border-border text-muted-foreground bg-muted/20'
                          )}
                        >
                          <span className="text-sm font-black">
                            {cp.count} Shorts
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {cp.count === 5 ? 'Recommended' : 'Highlights'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: SUBTITLES & FRAMING */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Aspect & Watermarks */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-primary" />
                      <span>Portrait &amp; Framing</span>
                    </Label>
                    <div className="p-3 rounded-2xl border border-primary/30 bg-primary/5 space-y-1">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>9:16 Vertical Portrait</span>
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Auto-crops horizontal space + audio-visual speaker lip
                        tracking.
                      </p>
                    </div>
                  </div>

                  {/* Subtitles Mode (Urdu, Roman, Dual Stacked) */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-primary" />
                      <span>AI Caption Mode</span>
                    </Label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {CAPTION_MODES.map((mode) => {
                        const active =
                          (settings.captionMode || 'dual-urdu-roman') ===
                          mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() =>
                              onUpdateSettings({
                                captionMode: mode.id,
                                captionLanguage:
                                  mode.id === 'urdu' ? 'urdu' : 'roman-urdu',
                              })
                            }
                            className={cn(
                              'p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2',
                              active
                                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                                : 'border-border/60 hover:border-border text-muted-foreground'
                            )}
                          >
                            <span className="text-xs font-bold truncate">
                              {mode.label}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-muted/60 uppercase font-semibold">
                              {mode.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtitles Animation Style */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-primary" />
                      <span>Subtitle Preset</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CAPTION_STYLES.slice(0, 4).map((style) => {
                        const active = settings.captionStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() =>
                              onUpdateSettings({ captionStyle: style.id })
                            }
                            className={cn(
                              'p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold truncate',
                              active
                                ? 'border-primary bg-primary/10 text-primary shadow-xs'
                                : 'border-border/60 hover:border-border text-muted-foreground'
                            )}
                          >
                            {style.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Roman Urdu Spelling Style (when Roman or Dual mode is active) */}
                {(settings.captionMode || 'dual-urdu-roman') !== 'urdu' && (
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Roman Urdu Spelling Style</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Selected:{' '}
                        <strong className="text-primary">
                          {settings.transliterationStyle || 'conversational'}
                        </strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {TRANSLITERATION_STYLES.map((st) => {
                        const active =
                          (settings.transliterationStyle ||
                            'conversational') === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() =>
                              onUpdateSettings({ transliterationStyle: st.id })
                            }
                            className={cn(
                              'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1',
                              active
                                ? 'border-primary bg-primary/10 shadow-xs text-foreground'
                                : 'border-border/60 hover:border-border text-muted-foreground'
                            )}
                          >
                            <span className="text-xs font-bold text-foreground">
                              {st.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground italic font-serif truncate">
                              &ldquo;{st.example}&rdquo;
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: OPENING STYLE & RECITER BRANDING */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>4. Opening Style &amp; Visual Intro</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Duration:{' '}
                    <strong className="text-primary">
                      {settings.openingDuration ?? 1.5}s
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {OPENING_STYLES.map((op) => {
                    const active =
                      (settings.openingStyle || 'face-speaker') === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ openingStyle: op.id })
                        }
                        className={cn(
                          'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1',
                          active
                            ? 'border-primary bg-primary/10 shadow-xs text-foreground'
                            : 'border-border/60 hover:border-border text-muted-foreground bg-muted/20'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground leading-tight">
                            {op.name}
                          </span>
                          <span className="text-[8px] font-mono opacity-80 uppercase font-semibold">
                            {op.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                          {op.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Opening Duration Slider & Inputs when not none */}
                {(settings.openingStyle || 'face-speaker') !== 'none' && (
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <Label className="text-[11px] font-semibold">
                          Opening Duration
                        </Label>
                        <span className="font-mono text-primary text-[11px]">
                          {settings.openingDuration ?? 1.5} seconds
                        </span>
                      </div>
                      <Slider
                        value={[settings.openingDuration ?? 1.5]}
                        onValueChange={(vals) =>
                          onUpdateSettings({ openingDuration: vals[0] })
                        }
                        min={0.5}
                        max={3.0}
                        step={0.5}
                        className="cursor-pointer"
                      />
                    </div>

                    {(settings.openingStyle === 'channel-logo' ||
                      settings.openingStyle === 'title-card') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">
                            Reciter / Speaker Name (Optional)
                          </Label>
                          <Input
                            value={settings.reciterName || ''}
                            onChange={(e) =>
                              onUpdateSettings({ reciterName: e.target.value })
                            }
                            placeholder="e.g. Qari Waheed Zafar Qasmi"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold">
                            Channel Logo URL or PNG
                          </Label>
                          <Input
                            value={settings.channelLogoUrl || ''}
                            onChange={(e) =>
                              onUpdateSettings({
                                channelLogoUrl: e.target.value,
                              })
                            }
                            placeholder="https://.../logo.png"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Optional Reference Lyrics Accordion */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowLyricsPanel(!showLyricsPanel)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <Music className="w-3.5 h-3.5 text-primary" />
                    <span>Reference Lyrics & Naat Stanzas (Optional)</span>
                    {showLyricsPanel ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {showLyricsPanel && (
                  <div className="space-y-2 pt-3 animate-in fade-in duration-200">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Paste reference poetry or recitation lyrics. The OpusClip
                      AI engine aligns full stanzas and joins consecutive short
                      verses into 35–45s shorts without ever cutting lyrics in
                      half.
                    </p>
                    <Textarea
                      value={settings.referenceLyrics || ''}
                      onChange={(e) =>
                        onUpdateSettings({ referenceLyrics: e.target.value })
                      }
                      placeholder={`کبھی تو سبز گنبد کا اجالا ہم بھی دیکھیں گے\nکبھی تو اپنے آنگن میں سویرا ہم بھی دیکھیں گے\n\nہم اپنی آنکھ سے روضہ خدا کے پاک پیارے کا\nنہ جانے کس دن آقا کا مدینہ ہم بھی دیکھیں گے\n\n(اختیاری: نعت کے اصل اشعار یہاں پیسٹ کریں)`}
                      dir="rtl"
                      className="min-h-[120px] font-urdu text-sm leading-relaxed border-border/50 bg-background/50 focus:border-primary resize-y text-right"
                    />
                  </div>
                )}
              </div>

              {/* Big Primary Action Button: Generate Complete Short with AI */}
              <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  Targeting{' '}
                  <strong className="text-foreground">
                    {settings.clipCount || 4} Complete Shorts
                  </strong>{' '}
                  • Complete Verses • Urdu Script • Centered 9:16
                </div>

                <Button
                  size="lg"
                  onClick={onStartGeneration}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 h-14 rounded-2xl font-black text-base cursor-pointer shadow-xl bg-gradient-to-r from-primary via-emerald-500 to-primary text-primary-foreground hover:opacity-95 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01]"
                >
                  {isProcessing ? (
                    <>
                      <Wand2 className="w-5 h-5 animate-spin" />
                      <span>Generating Complete Short with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>GENERATE COMPLETE SHORT WITH AI</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Generation Progress Bar */}
              {isProcessing && (
                <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary animate-spin" />
                      <span>
                        {processingStatus ||
                          'Analyzing vocal speech cadence and generating viral moments...'}
                      </span>
                    </span>
                    <span className="font-mono text-primary font-black text-sm">
                      {Math.round(uploadProgress || 0)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border/50">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-emerald-400 to-sky-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                      style={{
                        width: `${Math.min(100, Math.max(5, uploadProgress || 0))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Media Hub Asset Drawer */}
      <MediaHubDrawer
        isOpen={isMediaHubOpen}
        onClose={() => setIsMediaHubOpen(false)}
        onAnalyzeUrl={(url) => {
          setIsMediaHubOpen(false);
          setYoutubeUrl(url);
          onAnalyzeUrl(url);
        }}
        onSelectMedia={(mediaItem) => {
          if (onSelectFromMediaHub) {
            onSelectFromMediaHub(mediaItem);
          }
        }}
      />
    </div>
  );
}
