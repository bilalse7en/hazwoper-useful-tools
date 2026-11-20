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
  Gamepad2,
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
  GAMING_CAPTION_MODES,
  MUSIC_CAPTION_MODES,
  TRANSLITERATION_STYLES,
  OPENING_STYLES,
  CONTENT_TYPES,
  VISUAL_SOURCES,
} from '@/lib/video-shorts/types';
import { isValidYouTubeUrl } from '@/lib/video-shorts/source-parser';
import { MediaHubDrawer } from './media-hub-drawer';
import { YouTubeCookieButton } from './youtube-cookie-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  onSelectGenre,
  isProcessing,
  processingStatus,
  queueStatus,
  uploadProgress = 0,
  youtubeIssue,
  onClearYoutubeIssue,
}) {
  const handleProfileClick = (genre, defaults) => {
    if (onSelectGenre) {
      onSelectGenre(genre, defaults);
    } else {
      onUpdateSettings({ contentType: genre, ...defaults });
    }
  };
  const [isMediaHubOpen, setIsMediaHubOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [downloadQuality, setDownloadQuality] = useState('4k'); // '4k' | '2k' | '1080p' | '720p' | 'highest'
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

    onAnalyzeUrl(youtubeUrl.trim(), downloadQuality);
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
          <span>ALL USEFUL TOOLS AI Video Shorts Studio 2.0</span>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-mono font-bold">
            v2.0 4K
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
          Turn Long Videos into Viral 4K Shorts
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

          {/* Unified Ingestion Container */}
          <div className="space-y-5">
            {/* Step 0: Select Content Profile Upfront */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>1. Select Video Genre & AI Profile</span>
                </Label>
                <span className="text-[11px] font-mono font-bold text-primary">
                  {settings.contentType === 'gaming-gta'
                    ? '🎮 GTA 6 / Gaming Action'
                    : settings.contentType === 'music-songs'
                      ? '🎵 Songs & Vocal Hooks'
                      : '🕌 Islamic Naat / Tilawat'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. GAMING */}
                <button
                  type="button"
                  onClick={() =>
                    handleProfileClick('gaming-gta', {
                      captionLanguage: 'en',
                      captionMode: 'english',
                      captionStyle: 'beast-bold',
                      framingMode: 'action-tracking',
                      exportQuality: '4k',
                      targetDuration: 30,
                    })
                  }
                  className={cn(
                    'p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left shadow-xs',
                    settings.contentType === 'gaming-gta'
                      ? 'border-purple-500 bg-purple-500/15 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/30'
                      : 'border-border/70 bg-card hover:border-purple-500/40'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
                      🎮
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[9px] font-mono font-bold">
                      4K ACTION
                    </Badge>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      GTA 6 & Gaming Action
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                      Action scene cuts • Vehicle & stunt tracking • Bold
                      English punchlines
                    </p>
                  </div>
                </button>

                {/* 2. NAAT & RECITATION */}
                <button
                  type="button"
                  onClick={() =>
                    handleProfileClick('naat-recitation', {
                      captionLanguage: 'urdu',
                      captionMode: 'dual-urdu-roman',
                      captionStyle: 'beast-bold',
                      framingMode: 'trending-ai-speaker',
                      exportQuality: '4k',
                      targetDuration: 35,
                    })
                  }
                  className={cn(
                    'p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left shadow-xs',
                    (settings.contentType || 'naat-recitation') ===
                      'naat-recitation'
                      ? 'border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                      : 'border-border/70 bg-card hover:border-emerald-500/40'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                      🕌
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-mono font-bold">
                      SACRED VERSE
                    </Badge>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      Islamic Naat & Tilawat
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                      Urdu Nastaliq & Roman • Couplet phrase snapping • Sacred
                      B-Roll
                    </p>
                  </div>
                </button>

                {/* 3. SONGS & MUSIC */}
                <button
                  type="button"
                  onClick={() =>
                    handleProfileClick('music-songs', {
                      captionLanguage: 'en',
                      captionMode: 'karaoke-glow',
                      captionStyle: 'karaoke-glow',
                      framingMode: 'rhythm-framing',
                      exportQuality: '4k',
                      targetDuration: 30,
                    })
                  }
                  className={cn(
                    'p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left shadow-xs',
                    settings.contentType === 'music-songs'
                      ? 'border-pink-500 bg-pink-500/15 shadow-md shadow-pink-500/10 ring-2 ring-pink-500/30'
                      : 'border-border/70 bg-card hover:border-pink-500/40'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-lg shrink-0">
                      🎵
                    </div>
                    <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-[9px] font-mono font-bold">
                      VIRAL CHORUS
                    </Badge>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      Songs & Music Tracks
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-1">
                      Beat-drop hooks • Karaoke neon glow lyrics • Rhythm-synced
                      cuts
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Direct YouTube Link Input */}
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
                    4K Ultra HD Master Quality
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

                  {/* Quality Priority Dropdown */}
                  <div className="w-full sm:w-[190px] shrink-0">
                    <Select
                      value={downloadQuality}
                      onValueChange={setDownloadQuality}
                      disabled={isProcessing}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-background border-border font-bold text-xs text-foreground shadow-xs">
                        <SelectValue placeholder="Target Quality" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border-border">
                        <SelectItem value="4k" className="font-bold text-xs">
                          ⚡ 4K UHD (2160p First)
                        </SelectItem>
                        <SelectItem value="2k" className="font-bold text-xs">
                          ✨ 2K QHD (1440p)
                        </SelectItem>
                        <SelectItem value="1080p" className="font-bold text-xs">
                          🎬 Full HD (1080p)
                        </SelectItem>
                        <SelectItem value="720p" className="font-bold text-xs">
                          📱 HD (720p)
                        </SelectItem>
                        <SelectItem
                          value="highest"
                          className="font-bold text-xs"
                        >
                          🚀 Best Available
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing || !youtubeUrl.trim()}
                    className="h-12 px-6 rounded-xl font-bold cursor-pointer shrink-0 bg-gradient-to-r from-amber-500 via-primary to-primary text-white hover:opacity-95 shadow-lg shadow-primary/25 transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>
                      {settings.contentType === 'gaming-gta'
                        ? '⚡ Ingest 4K Gaming Video'
                        : '⚡ Ingest 4K Video'}
                    </span>
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 4K
                    Ultra HD (2160p 60fps)
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{' '}
                    {settings.contentType === 'gaming-gta'
                      ? 'Multi-View Action Camera Tracking'
                      : 'Audio-Onset Lead-In (-1.0s)'}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{' '}
                    {settings.contentType === 'gaming-gta'
                      ? 'Creative English Captions'
                      : 'Urdu & Roman Typing Subtitles'}
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

          {/* ALL USEFUL TOOLS Generation Progress */}
          {isProcessing && (
            <div className="p-6 rounded-3xl border border-primary/30 bg-primary/5 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Wand2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      ALL USEFUL TOOLS AI Shorts Engine Active
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
                  {videoSource.resolution && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-mono font-bold flex items-center gap-1',
                        videoSource.resolution.includes('3840') ||
                          videoSource.resolution.includes('2160')
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : videoSource.resolution.includes('1920') ||
                              videoSource.resolution.includes('1080')
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      )}
                    >
                      {videoSource.resolution.includes('3840') ||
                      videoSource.resolution.includes('2160')
                        ? `⚡ 4K UHD (${videoSource.resolution})`
                        : videoSource.resolution.includes('1920') ||
                            videoSource.resolution.includes('1080')
                          ? `🎬 1080p FHD (${videoSource.resolution})`
                          : `📱 ${videoSource.resolution}`}
                    </Badge>
                  )}
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

          {/* STEP 2: CONFIGURE & GENERATE SHORTS (Clean, Compact, Responsive) */}
          <Card className="p-4 sm:p-6 md:p-8 rounded-3xl border-primary/40 shadow-2xl bg-gradient-to-b from-card via-card to-primary/5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground font-black text-xs uppercase px-2.5 py-0.5 rounded-full">
                    Step 2: Ready to Generate
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    Highest Quality 4K / 1080p FHD
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Choose Profile &amp; Launch
                </h2>
              </div>

              {/* Compact Mode Pill Selector */}
              <div className="inline-flex p-1 rounded-2xl bg-muted/60 border border-border/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      contentType: 'gaming-gta',
                      captionLanguage: 'en',
                      captionMode: 'english',
                      captionStyle: 'beast-bold',
                      framingMode: 'action-tracking',
                      exportQuality: '4k',
                      targetDuration: 30,
                    })
                  }
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    settings.contentType === 'gaming-gta'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>🎮</span>
                  <span>Gaming (4K Action)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      contentType: 'naat-recitation',
                      captionLanguage: 'urdu',
                      captionMode: 'dual-urdu-roman',
                      captionStyle: 'beast-bold',
                      framingMode: 'trending-ai-speaker',
                      exportQuality: '4k',
                      targetDuration: 35,
                    })
                  }
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    (settings.contentType || 'naat-recitation') ===
                      'naat-recitation'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>🕌</span>
                  <span>Islamic Naat (Urdu)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      contentType: 'music-songs',
                      captionLanguage: 'en',
                      captionMode: 'karaoke-glow',
                      captionStyle: 'karaoke-glow',
                      framingMode: 'rhythm-framing',
                      exportQuality: '4k',
                      targetDuration: 30,
                    })
                  }
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    settings.contentType === 'music-songs'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>🎵</span>
                  <span>Songs &amp; Music (Beat Drop)</span>
                </button>
              </div>
            </div>

            {/* Quick Profile Summary & Duration Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-card border border-border/70 space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Target Short Duration
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ targetDuration: 30 })}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                      (settings.targetDuration || 30) <= 30
                        ? 'bg-primary/15 border-primary text-primary font-black shadow-xs'
                        : 'border-border/70 bg-muted/40 hover:bg-muted text-muted-foreground'
                    )}
                  >
                    ⚡ 15s - 30s (Ultra Viral)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ targetDuration: 60 })}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center',
                      (settings.targetDuration || 30) > 30
                        ? 'bg-primary/15 border-primary text-primary font-black shadow-xs'
                        : 'border-border/70 bg-muted/40 hover:bg-muted text-muted-foreground'
                    )}
                  >
                    ⏱️ 30s - 60s (Extended)
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border/70 space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Captions &amp; Framing Mode
                </span>
                <p className="text-xs text-foreground font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  {settings.contentType === 'gaming-gta'
                    ? 'English Creative Dialogue • Vehicle & Stunt Action Tracking'
                    : settings.contentType === 'music-songs'
                      ? 'Karaoke Neon Glow Lyrics • Rhythm & Beat-Drop Framing'
                      : 'Urdu Nastaliq & Roman Urdu • Couplet Boundary Snapping'}
                </p>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground space-y-0.5">
                <span className="font-bold text-foreground block">
                  Highest Quality Standard: 4K Master Source &bull; Zero
                  Watermarks
                </span>
                <span>
                  Audio normalized with smooth fade-in and fade-out transitions.
                </span>
              </div>

              <Button
                size="lg"
                onClick={onStartGeneration}
                disabled={isProcessing}
                className={cn(
                  'w-full sm:w-auto px-8 h-12 rounded-2xl font-black text-sm cursor-pointer shadow-xl text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shrink-0',
                  settings.contentType === 'gaming-gta'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-purple-500/20'
                    : settings.contentType === 'music-songs'
                      ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:opacity-95 shadow-pink-500/20'
                      : 'bg-gradient-to-r from-emerald-600 via-primary to-emerald-600 hover:opacity-95 shadow-emerald-500/20'
                )}
              >
                {isProcessing ? (
                  <>
                    <Wand2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing &amp; Generating Shorts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      {settings.contentType === 'gaming-gta'
                        ? 'GENERATE GTA 6 SHORTS (4K)'
                        : settings.contentType === 'music-songs'
                          ? 'GENERATE MUSIC SHORTS (4K)'
                          : 'GENERATE ISLAMIC SHORTS (4K)'}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Collapsible Advanced Toggle */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Subtitles, camera framing, and audio can be refined anytime in
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

              {/* Profile-Specific Studio Mode Switcher */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Choose Studio Customization Mode</span>
                  </Label>
                  <span className="text-[11px] font-mono font-bold text-primary">
                    {settings.contentType === 'gaming-gta'
                      ? '🎮 Gaming Studio'
                      : settings.contentType === 'music-songs'
                        ? '🎵 Songs Studio'
                        : '🕌 Naat Studio'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleProfileClick('gaming-gta', {
                        captionLanguage: 'en',
                        captionMode: 'english',
                        captionStyle: 'beast-bold',
                        framingMode: 'action-tracking',
                        exportQuality: '4k',
                        targetDuration: 30,
                      })
                    }
                    className={cn(
                      'p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3',
                      settings.contentType === 'gaming-gta'
                        ? 'border-purple-500 bg-purple-500/15 shadow-md shadow-purple-500/10'
                        : 'border-border/60 hover:border-purple-500/40 bg-card'
                    )}
                  >
                    <span className="text-2xl">🎮</span>
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        Gaming Action Studio
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Action cuts • Drift • English
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleProfileClick('naat-recitation', {
                        captionLanguage: 'urdu',
                        captionMode: 'dual-urdu-roman',
                        captionStyle: 'beast-bold',
                        framingMode: 'trending-ai-speaker',
                        exportQuality: '4k',
                        targetDuration: 35,
                      })
                    }
                    className={cn(
                      'p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3',
                      (settings.contentType || 'naat-recitation') ===
                        'naat-recitation'
                        ? 'border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                        : 'border-border/60 hover:border-emerald-500/40 bg-card'
                    )}
                  >
                    <span className="text-2xl">🕌</span>
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        Islamic Naat Studio
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Nastaliq • Couplets • B-Roll
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleProfileClick('music-songs', {
                        captionLanguage: 'en',
                        captionMode: 'karaoke-glow',
                        captionStyle: 'karaoke-glow',
                        framingMode: 'rhythm-framing',
                        exportQuality: '4k',
                        targetDuration: 30,
                      })
                    }
                    className={cn(
                      'p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3',
                      settings.contentType === 'music-songs'
                        ? 'border-pink-500 bg-pink-500/15 shadow-md shadow-pink-500/10'
                        : 'border-border/60 hover:border-pink-500/40 bg-card'
                    )}
                  >
                    <span className="text-2xl">🎵</span>
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        Songs & Music Studio
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Beat drop • Karaoke • Hooks
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* MODE 1: GAMING & ACTION CUSTOMIZATION PANEL */}
              {/* ========================================================================= */}
              {settings.contentType === 'gaming-gta' && (
                <div className="space-y-6 pt-2 border-t border-purple-500/30">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-purple-400" />
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          🎮 Gaming Action Shorts Settings
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Tailored for GTA 6, high-speed car chases, explosions,
                          stunts, and FPS gameplay
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-mono text-[10px]">
                      4K 60FPS ENGINE
                    </Badge>
                  </div>

                  {/* 1. Gaming Framing Mode */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        1. Gameplay Framing &amp; 9:16 Portrait Tracking
                      </span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'action-tracking',
                          title: 'Action Tracking & Stunt Camera',
                          desc: 'Smart motion vector tracking keeps vehicles & explosions dynamically centered in 9:16.',
                          badge: 'RECOMMENDED',
                        },
                        {
                          id: 'gameplay-blur-bg',
                          title: 'Full 16:9 Landscape + Ambient Blur',
                          desc: 'Preserves the entire wide gameplay field-of-view with full HUD & mini-map visible.',
                          badge: 'NO CROP',
                        },
                        {
                          id: 'center-crop',
                          title: 'Fixed Static Center Crop',
                          desc: 'Locked center crop for traditional cutscenes, driving scenes, or story dialogues.',
                          badge: 'STATIC',
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({ framingMode: item.id })
                          }
                          className={cn(
                            'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5',
                            settings.framingMode === item.id
                              ? 'border-purple-500 bg-purple-500/15 text-foreground shadow-xs'
                              : 'border-border/60 hover:border-purple-500/30 text-muted-foreground bg-muted/20'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">
                              {item.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono border-purple-500/30 text-purple-400"
                            >
                              {item.badge}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {item.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Gaming Subtitle & Font Options */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-purple-400" />
                      <span>2. Gaming Subtitle &amp; Punchline Style</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {GAMING_CAPTION_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({
                              captionMode: mode.id,
                              captionLanguage: 'en',
                            })
                          }
                          className={cn(
                            'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5',
                            (settings.captionMode || 'english') === mode.id
                              ? 'border-purple-500 bg-purple-500/15 text-foreground shadow-xs'
                              : 'border-border/60 hover:border-purple-500/30 text-muted-foreground bg-muted/20'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">
                              {mode.label}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono border-purple-500/30 text-purple-400"
                            >
                              {mode.badge}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {mode.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Gaming Duration & Clip Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>3. Target Action Burst Duration</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings({
                              targetDuration: 30,
                              durationPreset: 'standard',
                            })
                          }
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                            (settings.targetDuration || 30) <= 30
                              ? 'border-purple-500 bg-purple-500/15 text-purple-300 font-bold'
                              : 'border-border/60 hover:border-border text-muted-foreground'
                          )}
                        >
                          <div className="text-xs font-bold">⚡ 15s - 30s</div>
                          <div className="text-[10px] text-muted-foreground">
                            High-Speed Viral Burst
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings({
                              targetDuration: 45,
                              durationPreset: 'extended',
                            })
                          }
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                            (settings.targetDuration || 30) > 30
                              ? 'border-purple-500 bg-purple-500/15 text-purple-300 font-bold'
                              : 'border-border/60 hover:border-border text-muted-foreground'
                          )}
                        >
                          <div className="text-xs font-bold">⏱️ 30s - 45s</div>
                          <div className="text-[10px] text-muted-foreground">
                            Full Chase Sequence
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span>4. How Many Action Shorts?</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 4, 5].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => onUpdateSettings({ clipCount: cnt })}
                            className={cn(
                              'p-3 rounded-2xl border text-center transition-all cursor-pointer font-bold text-xs',
                              (settings.clipCount || 4) === cnt
                                ? 'border-purple-500 bg-purple-500/15 text-purple-300'
                                : 'border-border/60 hover:border-border text-muted-foreground'
                            )}
                          >
                            <span>{cnt} Shorts</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE 2: ISLAMIC NAAT & TILAWAT SACRED CUSTOMIZATION PANEL */}
              {/* ========================================================================= */}
              {(settings.contentType || 'naat-recitation') ===
                'naat-recitation' && (
                <div className="space-y-6 pt-2 border-t border-emerald-500/30">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          🕌 Islamic Naat &amp; Tilawat Studio Settings
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Authentic Urdu Nastaliq (`Kumail`), Roman Urdu
                          phonetics, complete verse boundaries, sacred B-roll
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-mono text-[10px]">
                      SACRED VERSE
                    </Badge>
                  </div>

                  {/* 1. Visual Source Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-emerald-400" />
                      <span>1. Visual Source Mode</span>
                    </Label>
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
                              'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5',
                              active
                                ? 'border-emerald-500 bg-emerald-500/15 text-foreground shadow-xs'
                                : 'border-border/60 hover:border-emerald-500/30 text-muted-foreground bg-muted/20'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">
                                {vs.label}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono border-emerald-500/30 text-emerald-400"
                              >
                                {vs.badge}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {vs.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Subtitles Mode: Urdu Nastaliq / Dual / Roman */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-emerald-400" />
                      <span>2. Subtitles Script &amp; Typography</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {CAPTION_MODES.filter(
                        (m) => m.id !== 'english' && m.id !== 'english-clean'
                      ).map((mode) => {
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
                              'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5',
                              active
                                ? 'border-emerald-500 bg-emerald-500/15 text-foreground shadow-xs'
                                : 'border-border/60 hover:border-emerald-500/30 text-muted-foreground bg-muted/20'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">
                                {mode.label}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono border-emerald-500/30 text-emerald-400"
                              >
                                {mode.badge}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {mode.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Roman Urdu Transliteration Style */}
                  {(settings.captionMode || 'dual-urdu-roman') !== 'urdu' && (
                    <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Roman Urdu Phonetics &amp; Spelling</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Active:{' '}
                          <strong className="text-emerald-400">
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
                                onUpdateSettings({
                                  transliterationStyle: st.id,
                                })
                              }
                              className={cn(
                                'p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1',
                                active
                                  ? 'border-emerald-500 bg-emerald-500/15 text-foreground'
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

                  {/* 4. Couplet Snapping & Optional Reference Stanzas */}
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowLyricsPanel(!showLyricsPanel)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Music className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Reference Lyrics &amp; Naat Stanzas (Optional)
                        </span>
                        {showLyricsPanel ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono text-emerald-400 border-emerald-500/30"
                      >
                        VERSE-SNAPPING
                      </Badge>
                    </div>

                    {showLyricsPanel && (
                      <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Paste authentic Urdu poetry or recitation lyrics. The
                          ALL USEFUL TOOLS AI engine snaps clip cuts strictly to
                          complete couplets and never truncates sacred verses in
                          half.
                        </p>
                        <Textarea
                          value={settings.referenceLyrics || ''}
                          onChange={(e) =>
                            onUpdateSettings({
                              referenceLyrics: e.target.value,
                            })
                          }
                          placeholder={`کبھی تو سبز گنبد کا اجالا ہم بھی دیکھیں گے\nکبھی تو اپنے آنگن میں سویرا ہم بھی دیکھیں گے\n\nہم اپنی آنکھ سے روضہ خدا کے پاک پیارے کا\nنہ جانے کس دن آقا کا مدینہ ہم بھی دیکھیں گے`}
                          dir="rtl"
                          className="min-h-[110px] font-urdu text-sm leading-relaxed border-border/50 bg-background/50 focus:border-emerald-500 resize-y text-right"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE 3: SONGS, MUSIC & VIRAL HOOKS CUSTOMIZATION PANEL */}
              {/* ========================================================================= */}
              {settings.contentType === 'music-songs' && (
                <div className="space-y-6 pt-2 border-t border-pink-500/30">
                  <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-pink-400" />
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          🎵 Songs &amp; Music Studio Settings
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Beat-drop alignment, karaoke neon word glow, kinetic
                          typography, and chorus hook prioritization
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 font-mono text-[10px]">
                      VIRAL CHORUS
                    </Badge>
                  </div>

                  {/* 1. Music Framing & Dynamics */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-pink-400" />
                      <span>1. Rhythm Framing &amp; Dynamic Visuals</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'rhythm-framing',
                          title: 'Dynamic Rhythm & Beat Framing',
                          desc: 'Dynamically scales and subtle-punches on beat drops and vocal climaxes for music video energy.',
                          badge: 'RECOMMENDED',
                        },
                        {
                          id: 'blurred-bg',
                          title: 'Full Screen + Ambient Blurred Fill',
                          desc: 'Keeps full video width centered with a glowing ambient blurred background behind.',
                          badge: 'AMBIENT GLOW',
                        },
                        {
                          id: 'center-crop',
                          title: 'Cinematic Center Crop',
                          desc: 'Centered vertical crop focusing directly on the performing singer or music artist.',
                          badge: 'CINEMATIC',
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({ framingMode: item.id })
                          }
                          className={cn(
                            'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5',
                            (settings.framingMode || 'rhythm-framing') ===
                              item.id
                              ? 'border-pink-500 bg-pink-500/15 text-foreground shadow-xs'
                              : 'border-border/60 hover:border-pink-500/30 text-muted-foreground bg-muted/20'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">
                              {item.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono border-pink-500/30 text-pink-400"
                            >
                              {item.badge}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {item.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Music Lyrics & Karaoke Modes */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-pink-400" />
                      <span>2. Song Lyrics &amp; Karaoke Word-Glow</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {MUSIC_CAPTION_MODES.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({
                              captionMode: mode.id,
                              captionLanguage: 'en',
                              captionStyle:
                                mode.id === 'karaoke-glow'
                                  ? 'karaoke-glow'
                                  : 'beast-bold',
                            })
                          }
                          className={cn(
                            'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5',
                            (settings.captionMode || 'karaoke-glow') === mode.id
                              ? 'border-pink-500 bg-pink-500/15 text-foreground shadow-xs'
                              : 'border-border/60 hover:border-pink-500/30 text-muted-foreground bg-muted/20'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">
                              {mode.label}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono border-pink-500/30 text-pink-400"
                            >
                              {mode.badge}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {mode.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Chorus Duration & Clips Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-pink-400" />
                        <span>3. Target Chorus / Hook Duration</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings({
                              targetDuration: 30,
                              durationPreset: 'standard',
                            })
                          }
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                            (settings.targetDuration || 30) <= 30
                              ? 'border-pink-500 bg-pink-500/15 text-pink-300 font-bold'
                              : 'border-border/60 hover:border-border text-muted-foreground'
                          )}
                        >
                          <div className="text-xs font-bold">⚡ 20s - 35s</div>
                          <div className="text-[10px] text-muted-foreground">
                            Viral Chorus Hook
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSettings({
                              targetDuration: 45,
                              durationPreset: 'extended',
                            })
                          }
                          className={cn(
                            'p-3 rounded-2xl border text-left transition-all cursor-pointer',
                            (settings.targetDuration || 30) > 30
                              ? 'border-pink-500 bg-pink-500/15 text-pink-300 font-bold'
                              : 'border-border/60 hover:border-border text-muted-foreground'
                          )}
                        >
                          <div className="text-xs font-bold">⏱️ 35s - 50s</div>
                          <div className="text-[10px] text-muted-foreground">
                            Verse + Chorus Drop
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-pink-400" />
                        <span>4. How Many Music Shorts?</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 4, 5].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => onUpdateSettings({ clipCount: cnt })}
                            className={cn(
                              'p-3 rounded-2xl border text-center transition-all cursor-pointer font-bold text-xs',
                              (settings.clipCount || 4) === cnt
                                ? 'border-pink-500 bg-pink-500/15 text-pink-300'
                                : 'border-border/60 hover:border-border text-muted-foreground'
                            )}
                          >
                            <span>{cnt} Shorts</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 5. Optional Reference Song Lyrics */}
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowLyricsPanel(!showLyricsPanel)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground hover:text-pink-400 transition-colors cursor-pointer"
                      >
                        <Music className="w-3.5 h-3.5 text-pink-400" />
                        <span>
                          Song Lyrics &amp; Chorus Keywords (Optional)
                        </span>
                        {showLyricsPanel ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono text-pink-400 border-pink-500/30"
                      >
                        HOOK-FINDER
                      </Badge>
                    </div>

                    {showLyricsPanel && (
                      <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Paste English, Hindi, or Roman lyrics. The AI engine
                          identifies chorus lines, hooks, and vocal climaxes to
                          center the short around the song&apos;s most catchy
                          moment.
                        </p>
                        <Textarea
                          value={settings.referenceLyrics || ''}
                          onChange={(e) =>
                            onUpdateSettings({
                              referenceLyrics: e.target.value,
                            })
                          }
                          placeholder="Paste chorus lines, vocal hook phrases, or song lyrics here..."
                          className="min-h-[110px] text-xs leading-relaxed border-border/50 bg-background/50 focus:border-pink-500 resize-y"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Big Primary Action Button: Generate Complete Short with AI */}
              <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  Targeting{' '}
                  <strong className="text-foreground">
                    {settings.clipCount || 4}{' '}
                    {settings.contentType === 'gaming-gta'
                      ? '4K Action Shorts'
                      : settings.contentType === 'music-songs'
                        ? 'Viral Music Shorts'
                        : 'Complete Naat Shorts'}
                  </strong>{' '}
                  •{' '}
                  {settings.contentType === 'gaming-gta'
                    ? 'Action Cuts • English Punchlines • 9:16 Portrait'
                    : settings.contentType === 'music-songs'
                      ? 'Beat-Drop Snapping • Karaoke Glow • 9:16'
                      : 'Complete Verses • Urdu Nastaliq • Centered 9:16'}
                </div>

                <Button
                  size="lg"
                  onClick={onStartGeneration}
                  disabled={isProcessing}
                  className={cn(
                    'w-full sm:w-auto px-8 h-14 rounded-2xl font-black text-base cursor-pointer shadow-xl text-white hover:opacity-95 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01]',
                    settings.contentType === 'gaming-gta'
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 shadow-purple-500/20'
                      : settings.contentType === 'music-songs'
                        ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 shadow-pink-500/20'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-500/20'
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Wand2 className="w-5 h-5 animate-spin" />
                      <span>Generating Shorts with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>
                        {settings.contentType === 'gaming-gta'
                          ? 'GENERATE GAMING ACTION SHORTS (4K)'
                          : settings.contentType === 'music-songs'
                            ? 'GENERATE MUSIC & SONG SHORTS (4K)'
                            : 'GENERATE ISLAMIC NAAT SHORTS (4K)'}
                      </span>
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
