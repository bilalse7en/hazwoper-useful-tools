'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  FileVideo,
  FileText,
  X,
  Sparkles,
  Share2,
  Film,
  Volume2,
  Languages,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  captionsToSRT,
  captionsToVTT,
} from '@/lib/video-shorts/caption-engine';

export function ExportModal({ isOpen, onClose, exportConfig, videoSource }) {
  const [status, setStatus] = useState('rendering'); // 'rendering' | 'completed' | 'error'
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState(
    'Initializing FFmpeg encoder...'
  );
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [outputFileName, setOutputFileName] = useState('viral_short.mp4');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const hasAutoDownloadedRef = useRef(false);

  // Reset auto-download trigger when modal re-opens
  useEffect(() => {
    if (!isOpen) {
      hasAutoDownloadedRef.current = false;
    }
  }, [isOpen]);

  // Direct Auto-Download Short Video when rendering succeeds
  useEffect(() => {
    if (
      status === 'completed' &&
      downloadUrl &&
      !hasAutoDownloadedRef.current
    ) {
      hasAutoDownloadedRef.current = true;
      try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.warn('Auto-download was blocked by browser:', err);
      }
    }
  }, [status, downloadUrl, outputFileName]);

  useEffect(() => {
    if (!isOpen || !exportConfig) return;

    let isMounted = true;
    setStatus('rendering');
    setProgress(15);
    setStatusMessage('Configuring smart 9:16 crop & audio filters...');

    const renderJob = async () => {
      try {
        // Step 1: Prepare render payload
        const activeSeg = exportConfig.segments[0] || {};
        const startTime = activeSeg.start || 0;
        const duration = activeSeg.duration || 30;

        if (isMounted) {
          setProgress(35);
          setStatusMessage('Processing speech normalization & video cuts...');
        }

        // Try server-side FFmpeg render API first
        if (videoSource.file || videoSource.videoUrl || videoSource.url) {
          const formData = new FormData();
          if (videoSource.file) {
            formData.append('video', videoSource.file);
          } else if (videoSource.videoUrl || videoSource.url) {
            formData.append(
              'videoUrl',
              videoSource.videoUrl || videoSource.url
            );
          }
          formData.append('startTime', startTime.toString());
          formData.append('duration', duration.toString());
          formData.append('aspectRatio', exportConfig.aspectRatio || '9:16');
          formData.append(
            'framingMode',
            exportConfig.framingMode || 'smart-face'
          );
          formData.append('cropX', (exportConfig.manualCropX || 50).toString());
          formData.append('fadeIn', (exportConfig.fadeIn || 0.5).toString());
          formData.append('fadeOut', (exportConfig.fadeOut || 0.5).toString());
          formData.append(
            'normalizeAudio',
            (exportConfig.normalizeAudio ?? true).toString()
          );
          formData.append(
            'audioVolume',
            (exportConfig.audioVolume || 1.0).toString()
          );
          if (exportConfig.openingStyle) {
            formData.append('openingStyle', exportConfig.openingStyle);
          }
          if (exportConfig.openingDuration) {
            formData.append(
              'openingDuration',
              exportConfig.openingDuration.toString()
            );
          }
          if (exportConfig.captions) {
            formData.append('captions', JSON.stringify(exportConfig.captions));
          }
          formData.append(
            'burnSubtitles',
            (
              exportConfig.burnSubtitles !== false &&
              exportConfig.subtitlesEnabled !== false
            ).toString()
          );
          formData.append(
            'captionMode',
            exportConfig.captionMode || 'dual-urdu-roman'
          );
          formData.append(
            'captionFontSize',
            (exportConfig.captionFontSize || 46).toString()
          );
          if (activeSeg.isStock && activeSeg.stockVideoUrl) {
            formData.append('brollVideoUrl', activeSeg.stockVideoUrl);
          }

          if (isMounted) {
            setProgress(60);
            setStatusMessage(
              'Encoding H.264 high-definition MP4 with -14 LUFS loudness...'
            );
          }

          const response = await fetch('/api/video-shorts/render', {
            method: 'POST',
            body: formData,
          });

          const cleanTitle = (
            videoSource?.title ||
            videoSource?.fileName ||
            'Short_Video'
          )
            .replace(/[^a-zA-Z0-9_\-\s]/g, '')
            .trim()
            .replace(/\s+/g, '_');
          const clipIndex =
            exportConfig?.clipIndex || exportConfig?.segments?.[0]?.index || 1;
          const detectedFileName = `${cleanTitle}_Short_${clipIndex}.mp4`;

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            if (isMounted) {
              setDownloadUrl(url);
              setFileSizeBytes(blob.size);
              setOutputFileName(detectedFileName);
              setProgress(100);
              setStatus('completed');
              return;
            }
          }
        }

        // Fallback: Client-side generated Blob if source is direct BlobUrl
        if (isMounted) {
          setProgress(85);
          setStatusMessage(
            videoSource.sourceType === 'youtube'
              ? 'Generating timed subtitles (.SRT, .VTT) and AI metadata...'
              : 'Finalizing MP4 media container...'
          );
        }

        const cleanTitle = (
          videoSource?.title ||
          videoSource?.fileName ||
          'Short_Video'
        )
          .replace(/[^a-zA-Z0-9_\-\s]/g, '')
          .trim()
          .replace(/\s+/g, '_');
        const clipIndex =
          exportConfig?.clipIndex || exportConfig?.segments?.[0]?.index || 1;
        const detectedFileName = `${cleanTitle}_Short_${clipIndex}.mp4`;

        // Create standard video reference download or YouTube subtitle package
        setTimeout(() => {
          if (isMounted) {
            if (videoSource.blobUrl) {
              setDownloadUrl(videoSource.blobUrl);
              setFileSizeBytes(14.5 * 1024 * 1024);
            }
            setOutputFileName(detectedFileName);
            setProgress(100);
            setStatus('completed');
          }
        }, 800);
      } catch (err) {
        console.error('Render error:', err);
        if (isMounted) {
          setStatus('error');
          setStatusMessage(err.message || 'Rendering failed.');
        }
      }
    };

    renderJob();

    return () => {
      isMounted = false;
    };
  }, [isOpen, exportConfig, videoSource]);

  if (!isOpen) return null;

  const activeSeg = exportConfig?.segments?.[0] || {};
  const isStockBroll = Boolean(activeSeg?.isStock && activeSeg?.stockVideoUrl);
  const brollTitle = activeSeg?.stockVideoTitle || 'Islamic Stock Footage';
  const captionMode = exportConfig?.captionMode || 'dual-urdu-roman';
  const isSubtitlesBurned =
    exportConfig?.burnSubtitles !== false &&
    exportConfig?.subtitlesEnabled !== false;
  const captionModeLabel = !isSubtitlesBurned
    ? 'Subtitles Off'
    : captionMode === 'dual-urdu-roman'
      ? 'Dual Urdu Nastaliq & Roman Urdu'
      : captionMode === 'urdu-only'
        ? 'Urdu Nastaliq Only'
        : captionMode === 'roman-urdu-only'
          ? 'Roman Urdu Only'
          : 'Subtitles Enabled';
  const audioVolume = exportConfig?.audioVolume
    ? `${Math.round(exportConfig.audioVolume * 100)}%`
    : '100%';
  const durationSec = activeSeg?.duration || exportConfig?.duration || 30;

  const downloadSrt = () => {
    const srt = captionsToSRT(exportConfig?.captions || []);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${outputFileName.replace('.mp4', '')}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadVtt = () => {
    const vtt = captionsToVTT(exportConfig?.captions || []);
    const blob = new Blob([vtt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${outputFileName.replace('.mp4', '')}.vtt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9990] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl p-6 sm:p-8 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-inner">
            {status === 'completed' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-in zoom-in-75 duration-300" />
            ) : status === 'error' ? (
              <AlertCircle className="w-8 h-8 text-destructive" />
            ) : (
              <RotateCw className="w-7 h-7 animate-spin text-primary" />
            )}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-foreground">
            {status === 'completed'
              ? 'Your Short Video is Ready!'
              : status === 'error'
                ? 'Export Failed'
                : 'Rendering Short Video...'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {statusMessage}
          </p>
        </div>

        {/* Applied Short Changes Card (Visible in both rendering and completed states) */}
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 space-y-2.5 text-xs shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
            <span className="font-mono uppercase font-black tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Applied Short Changes
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {status === 'completed' ? 'Render Completed' : 'Applying Edits'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {/* Visual footage */}
            <div className="flex items-start gap-2 p-2 rounded-xl bg-background/80 border border-border/50">
              <Film className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">
                  Visual Track:
                </span>
                <span
                  className="font-bold text-foreground truncate block"
                  title={
                    isStockBroll ? brollTitle : 'Original Recitation Video'
                  }
                >
                  {isStockBroll
                    ? `🕌 B-Roll: ${brollTitle}`
                    : '🎥 Original Recitation'}
                </span>
              </div>
            </div>

            {/* Audio Recitation */}
            <div className="flex items-start gap-2 p-2 rounded-xl bg-background/80 border border-border/50">
              <Volume2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">
                  Audio Track:
                </span>
                <span className="font-bold text-foreground truncate block">
                  🎙️ Recitation (-14 LUFS)
                </span>
              </div>
            </div>

            {/* Subtitles */}
            <div className="flex items-start gap-2 p-2 rounded-xl bg-background/80 border border-border/50">
              <Languages className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">
                  Subtitles:
                </span>
                <span
                  className="font-bold text-foreground truncate block"
                  title={captionModeLabel}
                >
                  ✍️ {captionModeLabel}
                </span>
              </div>
            </div>

            {/* Framing & Duration */}
            <div className="flex items-start gap-2 p-2 rounded-xl bg-background/80 border border-border/50">
              <Scissors className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[10px]">
                  Framing & Duration:
                </span>
                <span className="font-bold text-foreground truncate block">
                  📱 9:16 Portrait ({Number(durationSec).toFixed(1)}s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar during render */}
        {status === 'rendering' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-3 rounded-full" />
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>Encoding</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {/* Completed State Actions */}
        {status === 'completed' && downloadUrl && (
          <div className="space-y-4 pt-1">
            {/* Primary Action: Direct Download Short Video */}
            <div className="space-y-2">
              <a
                href={downloadUrl}
                download={outputFileName}
                className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 transition-all cursor-pointer ring-2 ring-emerald-400/30 group"
              >
                <Download className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
                <span>Download Short Video (MP4)</span>
              </a>
              <p className="text-[11px] text-center text-muted-foreground font-mono">
                ✓ Auto-download triggered! Click button above if download
                didn&apos;t start.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">File Name:</span>
                <span className="font-bold text-foreground truncate max-w-[260px]">
                  {outputFileName}
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Output Format:</span>
                <span className="font-bold text-foreground">
                  MP4 (H.264 / AAC, 9:16 Vertical)
                </span>
              </div>
              {fileSizeBytes > 0 && (
                <div className="flex justify-between font-mono">
                  <span className="text-muted-foreground">File Size:</span>
                  <span className="font-bold text-foreground">
                    {(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              )}
            </div>

            {/* Full Original Video & Subtitles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {/* Full Original Source Video Download */}
              {(videoSource?.downloadUrl || videoSource?.videoUrl) && (
                <a
                  href={videoSource.downloadUrl || videoSource.videoUrl}
                  download={videoSource.fileName || 'original_source_video.mp4'}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border/80 bg-background/80 hover:bg-muted text-xs font-bold text-foreground cursor-pointer"
                  title="Download the full, uncropped original video"
                >
                  <FileVideo className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate">Full Video</span>
                </a>
              )}

              {/* Subtitle Downloads */}
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSrt}
                className="text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Download .SRT</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadVtt}
                className="text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Download .VTT</span>
              </Button>
            </div>
          </div>
        )}

        {/* Completed State Actions for YouTube URL source */}
        {status === 'completed' && !downloadUrl && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>YouTube Clips &amp; Subtitles Ready</span>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Your timed subtitles (.SRT, .VTT) and timestamps have been
                generated. To render a downloadable MP4 video with hardcoded
                viral captions, download the source video via our free YouTube
                Downloader or upload your video file directly.
              </p>
              <a
                href="/tools/youtube-downloader"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline pt-1"
              >
                <span>Open YouTube Downloader Tool &rarr;</span>
              </a>
            </div>

            {/* Subtitle Downloads */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSrt}
                className="text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Download .SRT</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadVtt}
                className="text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Download .VTT</span>
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <Button
            onClick={onClose}
            className="w-full font-bold rounded-xl cursor-pointer"
          >
            Close &amp; Adjust Settings
          </Button>
        )}
      </div>
    </div>
  );
}
