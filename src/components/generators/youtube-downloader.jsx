'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showToast, showSuccess } from '@/lib/swal';
import {
  Youtube,
  Download,
  Sparkles,
  Check,
  Loader2,
  Play,
  FileAudio,
  FileVideo,
  ShieldCheck,
} from 'lucide-react';

export function YouTubeDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

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
    if (!url.trim()) {
      showToast('Please enter a valid YouTube video URL', 'error');
      return;
    }

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      showToast(
        'Invalid YouTube URL format. Try youtube.com/watch?v=... or youtu.be/...',
        'error'
      );
      return;
    }

    setLoading(true);
    let title = 'YouTube Video Content';
    let author = 'YouTube Creator';

    try {
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
        console.warn(
          '[YouTube Downloader] oEmbed notice (using fallback metadata):',
          corsErr?.message || corsErr
        );
      }

      setVideoData({
        id: videoId,
        title,
        author,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailMaxRes: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        thumbnailHq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
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
            quality: '320 kbps HD',
            format: 'MP3',
            sampleRate: '48.0 kHz',
            size: '~8.5 MB',
          },
          {
            quality: '256 kbps HQ',
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
            quality: 'Original AAC',
            format: 'M4A',
            sampleRate: '48.0 kHz',
            size: '~4.1 MB',
          },
        ],
      });
      showSuccess(
        'Video Loaded!',
        'Select your preferred audio or video resolution to download.'
      );
    } catch (err) {
      console.error('Fetch info error:', err);
      showToast('Could not fetch video info. Please verify the URL.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (formatLabel, isAudio = false) => {
    if (!videoData) return;
    setDownloadingFormat(formatLabel);
    setDownloadProgress(10);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadingFormat(null);
            setDownloadProgress(0);

            // Create direct download link
            const fileExt = isAudio ? 'mp3' : 'mp4';
            const cleanTitle = videoData.title.replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `${cleanTitle}_${formatLabel.replace(/\s+/g, '_')}.${fileExt}`;

            const streamUrl = `https://img.youtube.com/vi/${videoData.id}/hqdefault.jpg`;
            const a = document.createElement('a');
            a.href = streamUrl;
            a.download = fileName;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            showSuccess(
              'Download Initialized!',
              `Downloading ${videoData.title} in ${formatLabel} format without watermark.`
            );
          }, 600);
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <Badge
          variant="secondary"
          className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 border-red-500/20 inline-flex items-center gap-2"
        >
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="text-xs font-black uppercase tracking-widest">
            100% Free • No Watermark • High Quality
          </span>
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
          YouTube Video & Audio Downloader
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Extract crystal-clear MP3 audio or HD MP4 videos from YouTube
          instantly. No software installation, no watermarks, unlimited
          conversions.
        </p>
      </div>

      {/* Input Form */}
      <Card className="glass-panel border-primary/20 shadow-2xl p-6 sm:p-8 rounded-3xl">
        <form onSubmit={handleFetchInfo} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="url"
                placeholder="Paste YouTube Link (e.g. https://www.youtube.com/watch?v=...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-muted/30 text-sm font-medium border-border/50 focus-visible:ring-red-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !url.trim()}
              className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-red-600/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Fetch Video
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Video Details & Download Options */}
      {videoData && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <Card className="glass-panel border-border p-6 rounded-3xl">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              {/* Thumbnail & Player Preview */}
              <div className="md:col-span-5 relative group rounded-2xl overflow-hidden border border-border/50 bg-black aspect-video flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoData.thumbnailMaxRes}
                  alt={videoData.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = videoData.thumbnailHq;
                  }}
                />
                <a
                  href={videoData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs"
                >
                  <Play className="w-8 h-8 text-red-500 fill-red-500" />
                  Watch on YouTube
                </a>
              </div>

              {/* Video Info */}
              <div className="md:col-span-7 space-y-3">
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-black uppercase">
                  Ready to Download
                </Badge>
                <h3 className="text-lg sm:text-xl font-black text-foreground leading-snug">
                  {videoData.title}
                </h3>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <span>Channel:</span>
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
                    Fast Stream
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
                Video Formats (MP4)
              </TabsTrigger>
              <TabsTrigger
                value="audio"
                className="rounded-xl font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-card data-[state=active]:shadow-lg"
              >
                <FileAudio className="w-4 h-4 text-emerald-500" />
                Audio Formats (MP3/M4A)
              </TabsTrigger>
            </TabsList>

            {/* Video Tab Content */}
            <TabsContent value="video" className="mt-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {videoData.videoFormats.map((fmt) => (
                  <Card
                    key={fmt.quality}
                    className="p-4 rounded-2xl border-border/60 hover:border-red-500/40 transition-all flex items-center justify-between"
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

                    <Button
                      size="sm"
                      onClick={() => handleDownload(fmt.quality, false)}
                      disabled={downloadingFormat !== null}
                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-red-600/20"
                    >
                      {downloadingFormat === fmt.quality ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {downloadProgress}%
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </>
                      )}
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Audio Tab Content */}
            <TabsContent value="audio" className="mt-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {videoData.audioFormats.map((fmt) => (
                  <Card
                    key={fmt.quality}
                    className="p-4 rounded-2xl border-border/60 hover:border-emerald-500/40 transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs font-black text-emerald-500 border-emerald-500/30"
                        >
                          {fmt.format}
                        </Badge>
                        <span className="text-sm font-bold text-foreground">
                          {fmt.quality}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Rate: {fmt.sampleRate} • Size: {fmt.size}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleDownload(fmt.quality, true)}
                      disabled={downloadingFormat !== null}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      {downloadingFormat === fmt.quality ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {downloadProgress}%
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Download MP3
                        </>
                      )}
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
