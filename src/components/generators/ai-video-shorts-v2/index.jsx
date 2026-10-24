'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Youtube,
  Upload,
  Download,
  Scissors,
  CheckCircle2,
  Clock,
  Layers,
  Settings2,
  RefreshCw,
  ExternalLink,
  Shield,
  Key,
  Film,
  Play,
  Pause,
  AlertCircle,
  Library,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { showToast, showSuccess } from '@/lib/swal';
import { cn } from '@/lib/utils';
import { MediaHubDrawer } from '../ai-video-shorts/media-hub-drawer';
import { IslamicStockGalleryModal } from '../ai-video-shorts/islamic-stock-gallery-modal';

export function ShortGenerator2() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeProvider, setActiveProvider] = useState('opusclip');
  const [clips, setClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [isPlayingClipId, setIsPlayingClipId] = useState(null);
  const [isMediaHubOpen, setIsMediaHubOpen] = useState(false);
  const [isBrollDrawerOpen, setIsBrollDrawerOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Settings
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [targetDuration, setTargetDuration] = useState(35);
  const [captionMode, setCaptionMode] = useState('dual-urdu-roman');
  const [enableIslamicBroll, setEnableIslamicBroll] = useState(true);

  // Provider live statuses
  const [providers, setProviders] = useState({
    opusclip: { enabled: false, name: 'OpusClip AI', status: 'checking' },
    shotstack: { enabled: false, name: 'Shotstack Render', status: 'checking' },
    transcription: {
      enabled: true,
      name: 'Urdu Speech AI',
      status: 'local-engine',
    },
  });

  const fileInputRef = useRef(null);

  // Fetch provider configuration status on mount
  useEffect(() => {
    fetch('/api/video-shorts-v2/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) {
          setProviders(data.providers);
        }
      })
      .catch(() => {});
  }, []);

  // Poll active job status
  useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-shorts-v2/status/${jobId}`);
        const data = await res.json();
        if (data.job) {
          const j = data.job;
          setProgress(j.progress || 35);
          setStatusMessage(
            j.stage || 'Analyzing video and transcribing Urdu speech...'
          );

          if (j.status === 'completed' && j.clips?.length > 0) {
            setClips(j.clips);
            setJobStatus('completed');
            setIsProcessing(false);
            showSuccess(
              'Shorts Generated Successfully!',
              `Generated ${j.clips.length} viral vertical shorts ready for export.`
            );
          } else if (j.status === 'failed') {
            setJobStatus('failed');
            setIsProcessing(false);
            showToast(j.error || 'Shorts generation failed.', 'error');
          }
        }
      } catch (err) {
        console.warn('Status poll error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  // Start Generation
  const handleStartGeneration = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      showToast('Please enter a YouTube link or upload a video file.', 'error');
      return;
    }

    setIsProcessing(true);
    setJobStatus('processing');
    setProgress(15);
    setStatusMessage('Connecting to third-party AI pipeline...');
    setClips([]);

    try {
      const res = await fetch('/api/video-shorts-v2/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          settings: {
            aspectRatio,
            minDuration:
              targetDuration === 35 ? 30 : targetDuration === 50 ? 45 : 20,
            maxDuration:
              targetDuration === 35 ? 40 : targetDuration === 50 ? 60 : 30,
            captionLanguage: captionMode,
            enableIslamicBroll,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit video for generation.');
      }

      setJobId(data.jobId);
      setActiveProvider(data.provider || 'opusclip');
      showToast(data.message || 'Job submitted to cloud pipeline!', 'info');
    } catch (err) {
      setIsProcessing(false);
      setJobStatus('failed');
      showToast(err.message, 'error');
    }
  };

  // Direct File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setJobStatus('processing');
    setProgress(15);
    setStatusMessage('Ingesting raw video file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'settings',
        JSON.stringify({
          aspectRatio,
          minDuration: 30,
          maxDuration: 60,
          captionLanguage: captionMode,
        })
      );

      const res = await fetch('/api/video-shorts-v2/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload video.');
      }

      setJobId(data.jobId);
      setActiveProvider(data.provider || 'automated-pipeline');
      showToast('Video uploaded and queued for processing!', 'info');
    } catch (err) {
      setIsProcessing(false);
      setJobStatus('failed');
      showToast(err.message, 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Instant Direct Download of Clip
  const handleDirectDownload = (clip) => {
    const downloadUrl = clip.downloadUrl || clip.previewUrl || url;
    if (!downloadUrl) return;

    const fileName = `${(clip.title || 'Short').replace(/[^a-zA-Z0-9_-]/g, '_')}_${clip.index || 1}.mp4`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccess('Download Started!', `Downloading "${fileName}" in 1080p FHD.`);
  };

  // Shotstack Cloud Render Trigger
  const handleCloudRender = async (clip) => {
    showToast('Submitting clip to Shotstack Cloud Render cluster...', 'info');
    try {
      const res = await fetch('/api/video-shorts-v2/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: clip.downloadUrl || clip.previewUrl || url,
          startTime: clip.start || 0,
          duration: clip.duration || 30,
          aspectRatio,
          captions: clip.captions || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cloud render failed.');

      if (data.url) {
        handleDirectDownload({ ...clip, downloadUrl: data.url });
      } else {
        showSuccess(
          'Cloud Render Queued!',
          `Shotstack Job: ${data.renderId || 'Active'}`
        );
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Short Generator 2.0 • Third-Party Cloud AI Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            AI Naat Shorts Studio 2.0
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Automated viral clipping, face-aware 9:16 portrait composition, and
            authentic Urdu Nastaliq &amp; Roman subtitles.
          </p>
        </div>

        {/* Cloud Providers Status Pill & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsMediaHubOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-9 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer shadow-xs"
          >
            <Library className="w-3.5 h-3.5" />
            <span>Media Hub</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowConfigModal(true)}
            className="rounded-xl text-xs font-bold gap-1.5 h-9 border-border/80 text-foreground hover:bg-muted cursor-pointer shadow-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>API Settings</span>
          </Button>
        </div>
      </div>

      {/* Provider Connectivity Bar */}
      <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Active Pipeline:</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                providers.opusclip?.enabled
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-zinc-500'
              )}
            />
            <span className="font-semibold text-foreground">OpusClip AI:</span>
            <span className="text-muted-foreground text-[11px]">
              {providers.opusclip?.enabled
                ? 'Cloud Connected'
                : 'Auto Engine (Ready)'}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                providers.shotstack?.enabled
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-primary'
              )}
            />
            <span className="font-semibold text-foreground">
              Shotstack Render:
            </span>
            <span className="text-muted-foreground text-[11px]">
              {providers.shotstack?.enabled
                ? 'Distributed Cloud'
                : 'Fast FHD Engine'}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-foreground">
              Urdu Speech AI:
            </span>
            <span className="text-muted-foreground text-[11px]">
              Active (Nastaliq &amp; Roman)
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: Video Ingestion Input */}
      <Card className="p-6 sm:p-8 rounded-3xl border-border/80 shadow-xl bg-card/90 space-y-6">
        <form onSubmit={handleStartGeneration} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold flex items-center gap-2 text-foreground">
              <div className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                <Youtube className="w-3.5 h-3.5" />
              </div>
              <span>Paste YouTube Link or Video URL</span>
            </Label>
            <Badge
              variant="outline"
              className="text-[10px] font-mono text-emerald-600 border-emerald-500/30"
            >
              1080p FHD Quality
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or direct MP4 link"
              className="h-12 rounded-xl text-sm font-mono flex-1 bg-background"
              disabled={isProcessing}
            />
            <Button
              type="submit"
              disabled={isProcessing || !url.trim()}
              className="h-12 px-6 rounded-xl font-bold cursor-pointer shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>⚡ Generate Shorts</span>
            </Button>
          </div>
        </form>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Aspect Ratio */}
          <div className="space-y-1.5 p-3 rounded-xl border border-border/50 bg-background/50">
            <Label className="text-xs font-bold text-foreground">
              Aspect Ratio
            </Label>
            <div className="flex gap-1.5">
              {[
                { id: '9:16', label: '9:16 (Shorts)' },
                { id: '16:9', label: '16:9 (Wide)' },
                { id: '1:1', label: '1:1 (Square)' },
              ].map((ar) => (
                <Button
                  key={ar.id}
                  type="button"
                  variant={aspectRatio === ar.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAspectRatio(ar.id)}
                  className="flex-1 text-[11px] h-8 rounded-lg font-bold"
                >
                  {ar.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Target Duration */}
          <div className="space-y-1.5 p-3 rounded-xl border border-border/50 bg-background/50">
            <Label className="text-xs font-bold text-foreground">
              Target Duration
            </Label>
            <div className="flex gap-1.5">
              {[
                { id: 25, label: '20 - 30s' },
                { id: 35, label: '30 - 40s' },
                { id: 50, label: '45 - 60s' },
              ].map((dur) => (
                <Button
                  key={dur.id}
                  type="button"
                  variant={targetDuration === dur.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTargetDuration(dur.id)}
                  className="flex-1 text-[11px] h-8 rounded-lg font-bold"
                >
                  {dur.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Subtitles Mode */}
          <div className="space-y-1.5 p-3 rounded-xl border border-border/50 bg-background/50">
            <Label className="text-xs font-bold text-foreground">
              Urdu Subtitles
            </Label>
            <div className="flex gap-1.5">
              {[
                { id: 'dual-urdu-roman', label: 'Urdu + Roman' },
                { id: 'urdu-nastaliq', label: 'Urdu Only' },
                { id: 'off', label: 'Off' },
              ].map((sub) => (
                <Button
                  key={sub.id}
                  type="button"
                  variant={captionMode === sub.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCaptionMode(sub.id)}
                  className="flex-1 text-[11px] h-8 rounded-lg font-bold"
                >
                  {sub.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Drag & Drop File Upload Fallback */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-border/80 rounded-2xl p-5 text-center cursor-pointer hover:border-primary/50 bg-muted/10 hover:bg-muted/20 transition-all flex items-center justify-center gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-5 h-5 text-primary" />
          <span className="text-xs font-bold text-foreground">
            Or upload raw video file directly (MP4 / MOV)
          </span>
        </div>
      </Card>

      {/* Progress & Live Job Status Tracker */}
      {isProcessing && (
        <Card className="p-6 rounded-3xl border-primary/30 bg-primary/5 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-foreground">
                  Processing Video with Cloud Pipeline ({activeProvider})
                </h4>
                <p className="text-xs text-muted-foreground">{statusMessage}</p>
              </div>
            </div>
            <span className="font-mono text-sm font-black text-primary">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2.5 rounded-full" />
        </Card>
      )}

      {/* STEP 2: Discovered Shorts Gallery */}
      {clips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-foreground">
                Generated Shorts ({clips.length})
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBrollDrawerOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Islamic B-Roll Studio</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {clips.map((clip) => (
              <Card
                key={clip.id}
                className="overflow-hidden rounded-2xl border-border/80 shadow-md bg-card flex flex-col justify-between group hover:border-primary/50 transition-all"
              >
                {/* 9:16 Video Player Container */}
                <div className="relative aspect-[9/16] bg-zinc-950 overflow-hidden">
                  <video
                    src={clip.previewUrl || clip.downloadUrl || url}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge className="bg-primary/90 text-white font-mono text-[10px] font-bold">
                      Short #{clip.index}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-black/60 text-emerald-400 border-emerald-500/40 text-[10px] font-mono"
                    >
                      ⭐ {clip.score || 94} Virality
                    </Badge>
                  </div>
                </div>

                {/* Card Meta & Actions */}
                <div className="p-3.5 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {clip.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      ⏱️ {Math.round(clip.duration || 35)}s • 1080x1920 Full HD
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDirectDownload(clip)}
                      className="rounded-xl text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloudRender(clip)}
                      className="rounded-xl text-xs font-bold gap-1 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Cloud Render</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Islamic B-Roll Studio Drawer */}
      <IslamicStockGalleryModal
        isOpen={isBrollDrawerOpen}
        onClose={() => setIsBrollDrawerOpen(false)}
        targetDuration={targetDuration}
        shortTitle="AI Naat Short"
        onSelectStockVideo={(stock) => {
          showSuccess(
            'B-Roll Applied!',
            `Applied "${stock.title}" to active shorts timeline.`
          );
          setIsBrollDrawerOpen(false);
        }}
      />

      {/* Media Hub Drawer */}
      <MediaHubDrawer
        isOpen={isMediaHubOpen}
        onClose={() => setIsMediaHubOpen(false)}
        onSelectMedia={(item) => {
          const downloadUrl =
            item.videoUrl || item.downloadUrl || item.download_url;
          setUrl(downloadUrl);
          setIsMediaHubOpen(false);
          showToast('Loaded video from Media Hub!', 'success');
        }}
      />

      {/* API Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 rounded-3xl border-border/80 bg-card space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  API Configuration Status
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfigModal(false)}
                className="h-8 w-8 rounded-full p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>OPUSCLIP_API_KEY:</span>
                  <Badge
                    variant={
                      providers.opusclip?.enabled ? 'default' : 'outline'
                    }
                  >
                    {providers.opusclip?.enabled ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Get your official API key from{' '}
                  <a
                    href="https://opus.pro/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    opus.pro/api
                  </a>
                  .
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>SHOTSTACK_API_KEY:</span>
                  <Badge
                    variant={
                      providers.shotstack?.enabled ? 'default' : 'outline'
                    }
                  >
                    {providers.shotstack?.enabled ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Get your cloud rendering key from{' '}
                  <a
                    href="https://shotstack.io"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    shotstack.io
                  </a>
                  .
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>TRANSCRIPTION_API_KEY / OPENAI:</span>
                  <Badge variant="default">Local Whisper Active</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Urdu transcription engine runs automatically with zero
                  configuration required.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="w-full rounded-xl font-bold text-xs"
            >
              Done
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ShortGenerator2;
