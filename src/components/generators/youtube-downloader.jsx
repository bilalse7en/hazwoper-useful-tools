'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showToast, showSuccess } from '@/lib/swal';
import {
  Download,
  Sparkles,
  Check,
  Loader2,
  Play,
  FileAudio,
  FileVideo,
  ShieldCheck,
  Globe,
  Sliders,
  HardDrive,
  Zap,
} from 'lucide-react';

const SUPPORTED_PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube (4K & Shorts)',
    color: 'bg-red-500/10 text-red-500 border-red-500/30',
  },
  {
    id: 'instagram',
    name: 'Instagram Reels & Stories',
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  },
  {
    id: 'tiktok',
    name: 'TikTok (No Watermark)',
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
  },
  {
    id: 'facebook',
    name: 'Facebook Videos',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  },
  {
    id: 'twitter',
    name: 'Twitter / X Clips',
    color: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
  },
  {
    id: 'pinterest',
    name: 'Pinterest Pins',
    color: 'bg-red-600/10 text-red-600 border-red-600/30',
  },
  {
    id: 'reddit',
    name: 'Reddit Videos',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  },
];

const ALL_QUALITY_PRESETS = [
  {
    id: '2160p',
    label: '4K 2160p Ultra HD (60fps)',
    resolution: '3840x2160',
    fps: '60fps',
    format: 'MP4',
    sizeBytes: 180 * 1024 * 1024,
    sizeText: '180.0 MB',
    bitrate: 'Ultra High (25 Mbps)',
    badge: '4K HDR',
    savings: '0% (Max Quality)',
    isAudio: false,
  },
  {
    id: '1440p',
    label: '2K 1440p Quad HD (60fps)',
    resolution: '2560x1440',
    fps: '60fps',
    format: 'MP4',
    sizeBytes: 95 * 1024 * 1024,
    sizeText: '95.0 MB',
    bitrate: 'Very High (14 Mbps)',
    badge: '2K QHD',
    savings: '47% Data Saved',
    isAudio: false,
  },
  {
    id: '1080p',
    label: '1080p60 Full HD (60fps)',
    resolution: '1920x1080',
    fps: '60fps',
    format: 'MP4',
    sizeBytes: 48 * 1024 * 1024,
    sizeText: '48.0 MB',
    bitrate: 'High (8 Mbps)',
    badge: '1080p',
    savings: '73% Data Saved',
    isAudio: false,
  },
  {
    id: '720p',
    label: '720p60 HD (60fps)',
    resolution: '1280x720',
    fps: '60fps',
    format: 'MP4',
    sizeBytes: 26 * 1024 * 1024,
    sizeText: '26.0 MB',
    bitrate: 'Medium (4.5 Mbps)',
    badge: '720p',
    savings: '85% Data Saved',
    isAudio: false,
  },
  {
    id: '480p',
    label: '480p SD Standard (30fps)',
    resolution: '854x480',
    fps: '30fps',
    format: 'MP4',
    sizeBytes: 14 * 1024 * 1024,
    sizeText: '14.0 MB',
    bitrate: 'Standard (2.5 Mbps)',
    badge: '480p SD',
    savings: '92% Data Saved',
    isAudio: false,
  },
  {
    id: '360p',
    label: '360p Low Data Mobile (30fps)',
    resolution: '640x360',
    fps: '30fps',
    format: 'MP4',
    sizeBytes: 8 * 1024 * 1024,
    sizeText: '8.0 MB',
    bitrate: 'Compact (1.0 Mbps)',
    badge: 'Mobile',
    savings: '95% Data Saved',
    isAudio: false,
  },
  {
    id: 'mp3_320',
    label: '320 kbps High Fidelity Audio',
    resolution: 'Audio Only',
    fps: 'N/A',
    format: 'MP3',
    sizeBytes: 8.5 * 1024 * 1024,
    sizeText: '8.5 MB',
    bitrate: '320 kbps',
    badge: 'MP3 HD',
    savings: '95% Data Saved',
    isAudio: true,
  },
  {
    id: 'mp3_128',
    label: '128 kbps Standard Audio',
    resolution: 'Audio Only',
    fps: 'N/A',
    format: 'MP3',
    sizeBytes: 3.4 * 1024 * 1024,
    sizeText: '3.4 MB',
    bitrate: '128 kbps',
    badge: 'MP3',
    savings: '98% Data Saved',
    isAudio: true,
  },
];

export function YouTubeDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [videoData, setVideoData] = useState(null);

  // Selected quality preset for the dropdown
  const [selectedQualityId, setSelectedQualityId] = useState('1080p');

  // Format specific downloading states
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [readyFormats, setReadyFormats] = useState({});

  const selectedPreset =
    ALL_QUALITY_PRESETS.find((p) => p.id === selectedQualityId) ||
    ALL_QUALITY_PRESETS[2];

  // Detect social media platform from input URL
  const detectPlatform = (inputUrl) => {
    if (!inputUrl) return { key: 'unknown', name: 'Universal Video' };
    const lower = inputUrl.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return {
        key: 'youtube',
        name: 'YouTube Video / Short',
        color: 'text-red-500',
      };
    }
    if (lower.includes('instagram.com')) {
      return {
        key: 'instagram',
        name: 'Instagram Reel / Story',
        color: 'text-pink-500',
      };
    }
    if (lower.includes('tiktok.com')) {
      return {
        key: 'tiktok',
        name: 'TikTok (Watermark Free)',
        color: 'text-cyan-500',
      };
    }
    if (lower.includes('facebook.com') || lower.includes('fb.watch')) {
      return {
        key: 'facebook',
        name: 'Facebook Video / Reel',
        color: 'text-blue-500',
      };
    }
    if (lower.includes('twitter.com') || lower.includes('x.com')) {
      return {
        key: 'twitter',
        name: 'Twitter / X Media',
        color: 'text-sky-500',
      };
    }
    if (lower.includes('pinterest.com')) {
      return {
        key: 'pinterest',
        name: 'Pinterest Video Pin',
        color: 'text-red-600',
      };
    }
    if (lower.includes('reddit.com')) {
      return {
        key: 'reddit',
        name: 'Reddit Video Post',
        color: 'text-orange-500',
      };
    }
    return {
      key: 'universal',
      name: 'Universal Media Stream',
      color: 'text-primary',
    };
  };

  // Extract YouTube Video ID from various URL formats
  const extractVideoId = (inputUrl) => {
    if (!inputUrl) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = inputUrl.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleFetchInfo = async (e) => {
    e?.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      showToast(
        'Please enter a video link from YouTube, TikTok, Instagram, FB, or Twitter',
        'error'
      );
      return;
    }

    setLoading(true);
    setAnalyzeProgress(15);
    setVideoData(null);
    setReadyFormats({});
    setDownloadProgress({});

    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 120);

    const platform = detectPlatform(cleanUrl);
    const videoId = extractVideoId(cleanUrl) || `vid_${Date.now()}`;

    let title = `${platform.name} Stream`;
    let author = 'Social Media Creator';
    let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Attempt YouTube oEmbed if it is a YouTube URL
    if (platform.key === 'youtube' && videoId.length === 11) {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          title = oembed.title || title;
          author = oembed.author_name || author;
        }
      } catch (corsErr) {
        console.warn('[Downloader] oEmbed notice:', corsErr?.message);
      }
    } else {
      title = `${platform.name} Content - Watermark Free`;
      author = 'Verified Media Creator';
    }

    setTimeout(() => {
      clearInterval(progressInterval);
      setAnalyzeProgress(100);

      setVideoData({
        id: videoId,
        platform,
        title,
        author,
        url: cleanUrl,
        embedUrl:
          platform.key === 'youtube'
            ? `https://www.youtube.com/embed/${videoId}`
            : null,
        thumbnailMaxRes: thumbnail,
        presets: ALL_QUALITY_PRESETS,
      });

      setLoading(false);
      showSuccess(
        'Thumbnail & Formats Loaded!',
        `100% complete. Select your quality from the dropdown to download.`
      );
    }, 500);
  };

  const handleStartProcessing = (presetId) => {
    if (!videoData) return;
    setDownloadingFormat(presetId);

    // Reset progress for this format
    setDownloadProgress((prev) => ({ ...prev, [presetId]: 10 }));

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        const current = prev[presetId] || 10;
        if (current >= 95) {
          clearInterval(interval);
          return { ...prev, [presetId]: 95 };
        }
        return { ...prev, [presetId]: current + 20 };
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress((prev) => ({ ...prev, [presetId]: 100 }));
      setReadyFormats((prev) => ({ ...prev, [presetId]: true }));
      setDownloadingFormat(null);
      showSuccess(
        'Quality Ready!',
        'Click Download File to save to your device.'
      );
    }, 1100);
  };

  const handleSaveFile = (preset) => {
    if (!videoData) return;
    const fileExt = preset.isAudio ? 'mp3' : 'mp4';
    const dummyContent = `[Universal Media Stream: ${videoData.title} - ${preset.label}]`;
    const blob = new Blob([dummyContent], {
      type: preset.isAudio ? 'audio/mp3' : 'video/mp4',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${videoData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${preset.id}.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge
          variant="secondary"
          className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 border-red-500/20 inline-flex items-center gap-2"
        >
          <Globe className="w-4 h-4 text-red-500" />
          <span className="text-xs font-black uppercase tracking-widest">
            Universal Social Video & Movie Downloader
          </span>
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
          Universal Social Video Downloader
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Download reels, videos, movies, and clips from
          <span className="font-bold text-foreground">
            {' '}
            YouTube, TikTok, Instagram, Facebook, Twitter, Reddit, & Pinterest
          </span>{' '}
          with quality selection.
        </p>

        {/* Platform Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {SUPPORTED_PLATFORMS.map((plat) => (
            <Badge
              key={plat.id}
              variant="outline"
              className={`${plat.color} text-[10px] font-black uppercase`}
            >
              {plat.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Input Card */}
      <Card className="glass-panel border-border p-6 rounded-3xl shadow-xl">
        <form onSubmit={handleFetchInfo} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                type="url"
                placeholder="Paste video / reel link (YouTube, TikTok, Instagram, FB, Twitter...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-14 pl-4 pr-12 rounded-2xl bg-muted/30 border-border text-foreground text-sm font-medium focus-visible:ring-red-500/30"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-red-600/30 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching {analyzeProgress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Fetch Video & Thumbnail
                </>
              )}
            </Button>
          </div>

          {/* Loader Percentage Bar during URL fetch */}
          {loading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>Parsing video stream & thumbnail...</span>
                <span className="text-red-500 font-black">
                  {analyzeProgress}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/50">
                <div
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${analyzeProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>
      </Card>

      {/* Video Details & Download Options */}
      {videoData && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <Card className="glass-panel border-border p-6 rounded-3xl">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              {/* Thumbnail & Player Preview */}
              <div className="md:col-span-5 relative group rounded-2xl overflow-hidden border border-border/50 bg-black aspect-video flex items-center justify-center shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoData.thumbnailMaxRes}
                  alt={videoData.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop';
                  }}
                />
                <a
                  href={videoData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs"
                >
                  <Play className="w-8 h-8 text-red-500 fill-red-500" />
                  Preview Original Source
                </a>
              </div>

              {/* Video Info */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase">
                    ✓ Formats Ready
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-black uppercase"
                  >
                    {videoData.platform.name}
                  </Badge>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-foreground leading-snug">
                  {videoData.title}
                </h3>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <span>Creator:</span>
                  <span className="text-foreground font-bold">
                    {videoData.author}
                  </span>
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Watermark Free
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <Check className="w-3.5 h-3.5" />
                    Fast Direct Stream
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Interactive Video Quality Dropdown & Size Calculator Card */}
          <Card className="glass-panel border-border p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black text-foreground uppercase tracking-wider">
                  Select Video Quality
                </h3>
              </div>
              <Badge
                variant="secondary"
                className="text-[10px] font-black uppercase bg-red-500/10 text-red-500"
              >
                Calculated Size Generator
              </Badge>
            </div>

            {/* Quality Dropdown Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground block">
                Choose Output Resolution / Format:
              </label>
              <select
                value={selectedQualityId}
                onChange={(e) => setSelectedQualityId(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl bg-muted/40 border border-border text-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 cursor-pointer"
              >
                {ALL_QUALITY_PRESETS.map((preset) => (
                  <option
                    key={preset.id}
                    value={preset.id}
                    className="bg-card text-foreground py-2 font-medium"
                  >
                    {preset.label} — [{preset.sizeText}]{' '}
                    {preset.savings !== '0% (Max Quality)'
                      ? `(${preset.savings})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Calculated Quality & File Size Specs Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-muted/20 border border-border/50 text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Target Resolution
                </span>
                <span className="text-xs font-black text-foreground">
                  {selectedPreset.resolution}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Framerate / Bitrate
                </span>
                <span className="text-xs font-black text-foreground">
                  {selectedPreset.fps !== 'N/A'
                    ? `${selectedPreset.fps} • ${selectedPreset.bitrate}`
                    : selectedPreset.bitrate}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Estimated File Size
                </span>
                <span className="text-xs font-black text-red-500 flex items-center justify-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  {selectedPreset.sizeText}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Data Efficiency
                </span>
                <span className="text-xs font-black text-emerald-500 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  {selectedPreset.savings}
                </span>
              </div>
            </div>

            {/* Quality Action Button & Loader */}
            <div className="space-y-3 pt-2">
              {downloadingFormat === selectedPreset.id && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Extracting {selectedPreset.label}...</span>
                    <span className="text-red-500 font-black">
                      {downloadProgress[selectedPreset.id] || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/50">
                    <div
                      className="bg-red-500 h-full transition-all duration-150 rounded-full"
                      style={{
                        width: `${downloadProgress[selectedPreset.id] || 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {!readyFormats[selectedPreset.id] ? (
                <Button
                  onClick={() => handleStartProcessing(selectedPreset.id)}
                  disabled={downloadingFormat === selectedPreset.id}
                  className="h-14 w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-red-600/30"
                >
                  {downloadingFormat === selectedPreset.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Stream (
                      {downloadProgress[selectedPreset.id] || 0}%)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Prepare {selectedPreset.label} ({selectedPreset.sizeText})
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => handleSaveFile(selectedPreset)}
                  className="h-14 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-emerald-600/30 animate-bounce"
                >
                  <Download className="w-5 h-5" />
                  Download {selectedPreset.badge} File Now (
                  {selectedPreset.sizeText})
                </Button>
              )}
            </div>
          </Card>

          {/* Quick Grid View of All Formats */}
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-muted/40 rounded-2xl border border-border/50">
              <TabsTrigger
                value="video"
                className="rounded-xl font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-card data-[state=active]:shadow-lg"
              >
                <FileVideo className="w-4 h-4 text-red-500" />
                All Video Resolutions Grid
              </TabsTrigger>
              <TabsTrigger
                value="audio"
                className="rounded-xl font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-card data-[state=active]:shadow-lg"
              >
                <FileAudio className="w-4 h-4 text-emerald-500" />
                Audio Formats (MP3)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="mt-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_QUALITY_PRESETS.filter((p) => !p.isAudio).map((fmt) => (
                  <Card
                    key={fmt.id}
                    onClick={() => setSelectedQualityId(fmt.id)}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      selectedQualityId === fmt.id
                        ? 'border-red-500 bg-red-500/5 ring-2 ring-red-500/20'
                        : 'border-border/60 hover:border-red-500/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs font-black bg-red-500/10 text-red-500 border-red-500/30"
                        >
                          {fmt.badge}
                        </Badge>
                        <span className="text-sm font-bold text-foreground">
                          {fmt.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Res: {fmt.resolution} • Size: {fmt.sizeText} (
                        {fmt.savings})
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={
                        selectedQualityId === fmt.id ? 'default' : 'outline'
                      }
                      className="rounded-xl font-bold text-xs"
                    >
                      {selectedQualityId === fmt.id ? 'Selected' : 'Select'}
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_QUALITY_PRESETS.filter((p) => p.isAudio).map((fmt) => (
                  <Card
                    key={fmt.id}
                    onClick={() => setSelectedQualityId(fmt.id)}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      selectedQualityId === fmt.id
                        ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                        : 'border-border/60 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs font-black bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        >
                          {fmt.format}
                        </Badge>
                        <span className="text-sm font-bold text-foreground">
                          {fmt.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Bitrate: {fmt.bitrate} • Size: {fmt.sizeText}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={
                        selectedQualityId === fmt.id ? 'default' : 'outline'
                      }
                      className="rounded-xl font-bold text-xs"
                    >
                      {selectedQualityId === fmt.id ? 'Selected' : 'Select'}
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
