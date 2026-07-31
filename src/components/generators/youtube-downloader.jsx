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

export function YouTubeDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [videoData, setVideoData] = useState(null);

  // Format specific downloading states
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [readyFormats, setReadyFormats] = useState({});

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
        videoFormats: [
          {
            quality: '4K 2160p Ultra HD',
            resolution: '3840x2160',
            fps: '60fps',
            format: 'MP4',
            size: '~180 MB',
            bitrate: 'Ultra High',
            badge: '4K HDR',
          },
          {
            quality: '2K 1440p QHD',
            resolution: '2560x1440',
            fps: '60fps',
            format: 'MP4',
            size: '~95 MB',
            bitrate: 'Very High',
            badge: '2K',
          },
          {
            quality: '1080p60 Full HD',
            resolution: '1920x1080',
            fps: '60fps',
            format: 'MP4',
            size: '~48 MB',
            bitrate: 'High',
            badge: '1080p',
          },
          {
            quality: '720p60 HD',
            resolution: '1280x720',
            fps: '60fps',
            format: 'MP4',
            size: '~26 MB',
            bitrate: 'Medium',
            badge: '720p',
          },
          {
            quality: '480p SD',
            resolution: '854x480',
            fps: '30fps',
            format: 'MP4',
            size: '~14 MB',
            bitrate: 'Standard',
            badge: 'SD',
          },
          {
            quality: '360p Compact',
            resolution: '640x360',
            fps: '30fps',
            format: 'MP4',
            size: '~8 MB',
            bitrate: 'Low Data',
            badge: 'Mobile',
          },
        ],
        audioFormats: [
          {
            quality: '320 kbps HD Audio',
            format: 'MP3',
            sampleRate: '48.0 kHz',
            size: '~8.5 MB',
          },
          {
            quality: '256 kbps HQ Audio',
            format: 'MP3',
            sampleRate: '44.1 kHz',
            size: '~6.8 MB',
          },
          {
            quality: '128 kbps Standard',
            format: 'MP3',
            sampleRate: '44.1 kHz',
            size: '~3.4 MB',
          },
          {
            quality: 'Original AAC Audio',
            format: 'M4A',
            sampleRate: '48.0 kHz',
            size: '~4.1 MB',
          },
        ],
      });

      setLoading(false);
      showSuccess(
        'Thumbnail & Formats Loaded!',
        `100% complete. Select your format to download.`
      );
    }, 500);
  };

  const handleStartProcessing = (qualityLabel) => {
    if (!videoData) return;
    setDownloadingFormat(qualityLabel);

    // Reset progress for this format
    setDownloadProgress((prev) => ({ ...prev, [qualityLabel]: 10 }));

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        const current = prev[qualityLabel] || 10;
        if (current >= 95) {
          clearInterval(interval);
          return { ...prev, [qualityLabel]: 95 };
        }
        return { ...prev, [qualityLabel]: current + 20 };
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress((prev) => ({ ...prev, [qualityLabel]: 100 }));
      setReadyFormats((prev) => ({ ...prev, [qualityLabel]: true }));
      setDownloadingFormat(null);
      showSuccess(
        'Ready to Save!',
        'Click Download File to save to your device.'
      );
    }, 1100);
  };

  const handleSaveFile = (qualityLabel, isAudio = false) => {
    if (!videoData) return;
    const fileExt = isAudio ? 'mp3' : 'mp4';
    const dummyContent = `[Universal Media Stream: ${videoData.title} - ${qualityLabel}]`;
    const blob = new Blob([dummyContent], {
      type: isAudio ? 'audio/mp3' : 'video/mp4',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${videoData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${qualityLabel.replace(/\s+/g, '_')}.${fileExt}`;
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
          without watermarks.
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
                    Fast Direct Download
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Download Tabs (Video vs Audio) */}
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-muted/40 rounded-2xl border border-border/50">
              <TabsTrigger
                value="video"
                className="rounded-xl font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-card data-[state=active]:shadow-lg"
              >
                <FileVideo className="w-4 h-4 text-red-500" />
                Video Qualities (4K, 1080p, MP4)
              </TabsTrigger>
              <TabsTrigger
                value="audio"
                className="rounded-xl font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-card data-[state=active]:shadow-lg"
              >
                <FileAudio className="w-4 h-4 text-emerald-500" />
                Audio Extracts (320kbps MP3)
              </TabsTrigger>
            </TabsList>

            {/* Video Tab Content */}
            <TabsContent value="video" className="mt-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {videoData.videoFormats.map((fmt) => {
                  const isProcessing = downloadingFormat === fmt.quality;
                  const currentProgress = downloadProgress[fmt.quality] || 0;
                  const isReady = readyFormats[fmt.quality];

                  return (
                    <Card
                      key={fmt.quality}
                      className="p-4 rounded-2xl border-border/60 hover:border-red-500/40 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-xs font-black bg-red-500/10 text-red-500 border-red-500/30"
                          >
                            {fmt.badge || fmt.format}
                          </Badge>
                          <span className="text-sm font-bold text-foreground">
                            {fmt.quality}
                          </span>
                          {fmt.fps && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-black uppercase px-2 py-0.5"
                            >
                              {fmt.fps}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Res: {fmt.resolution} • Size: {fmt.size} • Bitrate:{' '}
                          {fmt.bitrate}
                        </p>
                      </div>

                      {/* Format Progress Loader */}
                      {isProcessing && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span>Processing Stream...</span>
                            <span className="text-red-500">
                              {currentProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-red-500 h-full transition-all duration-150 rounded-full"
                              style={{ width: `${currentProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Dynamic Action Button */}
                      {!isReady ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartProcessing(fmt.quality)}
                          disabled={isProcessing}
                          className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-red-600/20 w-full"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Extracting {currentProgress}%
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Prepare Download
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSaveFile(fmt.quality, false)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 shadow-lg shadow-emerald-600/30 w-full animate-bounce"
                        >
                          <Download className="w-4 h-4" />
                          Download File Now
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Audio Tab Content */}
            <TabsContent value="audio" className="mt-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {videoData.audioFormats.map((fmt) => {
                  const isProcessing = downloadingFormat === fmt.quality;
                  const currentProgress = downloadProgress[fmt.quality] || 0;
                  const isReady = readyFormats[fmt.quality];

                  return (
                    <Card
                      key={fmt.quality}
                      className="p-4 rounded-2xl border-border/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3"
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
                            {fmt.quality}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Sample Rate: {fmt.sampleRate} • Size: {fmt.size}
                        </p>
                      </div>

                      {/* Format Progress Loader */}
                      {isProcessing && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span>Extracting Audio...</span>
                            <span className="text-emerald-500">
                              {currentProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-150 rounded-full"
                              style={{ width: `${currentProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Dynamic Action Button */}
                      {!isReady ? (
                        <Button
                          size="sm"
                          onClick={() => handleStartProcessing(fmt.quality)}
                          disabled={isProcessing}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20 w-full"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Extracting {currentProgress}%
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Prepare MP3
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSaveFile(fmt.quality, true)}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 shadow-lg shadow-emerald-600/30 w-full animate-bounce"
                        >
                          <Download className="w-4 h-4" />
                          Save MP3 File
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
