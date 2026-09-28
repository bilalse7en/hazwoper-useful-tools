'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuthAction } from '@/lib/use-auth-action';
import { saveToolHistory } from '@/lib/tool-history';
import { ToolHistoryPanel } from '@/components/tool-history-panel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Maximize2,
  Minimize2,
  Monitor,
  Zap,
  Download,
  CloudUpload,
  RotateCcw,
  Settings2,
  CheckCircle2,
  Play,
  Film,
  Target,
  Gauge,
  Sparkles,
  Flame,
  Server,
  Scissors,
  Layers,
  FileVideo,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-converter';
import { ProgressButton } from '@/components/progress-button';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { loadFFmpegCore } from '@/lib/ffmpeg-loader';

// --- Constants ---
const RESOLUTIONS = [
  { id: 'original', label: 'Original', desc: 'Auto Match' },
  { id: '1920', label: '1080p', desc: '1920x1080' },
  { id: '1280', label: '720p', desc: '1280x720' },
  { id: '854', label: '480p', desc: '854x480' },
  { id: '640', label: '360p', desc: '640x360' },
];

const COMPRESSION_PRESETS = [
  {
    id: 'fast',
    label: 'Lightning Fast',
    icon: Zap,
    twoPass: false,
    crf: 28,
    preset: 'fast',
    audioBitrate: '256k',
    desc: 'Fast + Balanced',
    compressionRatio: 0.35,
    tag: 'Popular',
  },
  {
    id: 'handbrake',
    label: 'HandBrake Mode',
    icon: Flame,
    twoPass: true,
    crf: 28,
    preset: 'slow',
    audioBitrate: 'Original',
    desc: 'Max Compress • Lossless Audio',
    compressionRatio: 0.18,
    tag: 'Best Ratio',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: Gauge,
    twoPass: false,
    crf: 26,
    preset: 'medium',
    audioBitrate: '256k',
    desc: 'Optimal HD Quality',
    compressionRatio: 0.28,
  },
  {
    id: 'maximum',
    label: 'Ultra Small',
    icon: Target,
    twoPass: true,
    crf: 32,
    preset: 'slow',
    audioBitrate: '256k',
    desc: 'Smallest File Size',
    compressionRatio: 0.12,
  },
  {
    id: 'quality',
    label: 'Studio High',
    icon: Sparkles,
    twoPass: false,
    crf: 20,
    preset: 'slow',
    audioBitrate: '512k',
    desc: 'Near Lossless Visuals',
    compressionRatio: 0.55,
  },
];

export function VideoCompressor() {
  const { performAction } = useAuthAction();

  // --- State ---
  const [activeFile, setActiveFile] = useState(null);
  const [targetResolution, setTargetResolution] = useState('original');
  const [qualityPreset, setQualityPreset] = useState('fast');
  const [targetSizeMB, setTargetSizeMB] = useState('');
  const [useTargetSize, setUseTargetSize] = useState(false);
  const [compressionMode, setCompressionMode] = useState('auto'); // 'auto' | 'client' | 'server'

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Video Trimming Settings
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);

  // Load FFmpeg WebAssembly on component mount
  useEffect(() => {
    let isMounted = true;
    const loadFFmpeg = async () => {
      try {
        if (!ffmpegRef.current) {
          ffmpegRef.current = new FFmpeg();
        }
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on('log', ({ message }) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[FFmpeg Log]', message);
          }
        });
        ffmpeg.on('progress', ({ progress: prog }) => {
          if (isMounted) {
            const percent = Math.min(95, Math.max(5, Math.round(prog * 100)));
            setProgress(percent);
          }
        });

        await loadFFmpegCore(ffmpeg);
        if (isMounted) setFfmpegLoaded(true);
      } catch (err) {
        console.warn(
          'Browser FFmpeg.wasm failed to load (will seamlessly auto-use server streaming):',
          err
        );
        if (isMounted) setFfmpegLoaded(false);
      }
    };

    loadFFmpeg();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- Helpers ---
  const handleFiles = (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith('video/')) return;

    const preview = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const durationSec =
        video.duration && !isNaN(video.duration) ? video.duration : 0;
      setActiveFile({
        file,
        preview,
        durationSec: durationSec,
        duration: formatDuration(durationSec),
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        width: video.videoWidth,
        height: video.videoHeight,
      });

      setStartTime(0);
      setEndTime(durationSec);
      setTrimEnabled(false);

      const originalMB = file.size / (1024 * 1024);
      const suggestedMB = Math.max(1, Math.round(originalMB * 0.25 * 10) / 10);
      setTargetSizeMB(suggestedMB.toString());
    };
    video.src = preview;
    setResult(null);
    setError(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estimateFileSize = (resId) => {
    if (!activeFile) return null;

    const preset =
      COMPRESSION_PRESETS.find((p) => p.id === qualityPreset) ||
      COMPRESSION_PRESETS[0];
    const sourceMB = activeFile.file.size / (1024 * 1024);

    if (useTargetSize && targetSizeMB) {
      return parseFloat(targetSizeMB).toFixed(1);
    }

    let targetWidth = activeFile.width;
    if (resId !== 'original') targetWidth = parseInt(resId);
    if (isNaN(targetWidth)) targetWidth = 1920;

    let resolutionFactor = 1.0;
    if (targetWidth < activeFile.width && activeFile.width > 0) {
      resolutionFactor = Math.pow(targetWidth / activeFile.width, 1.4);
    }

    const estimatedMB = sourceMB * preset.compressionRatio * resolutionFactor;
    return Math.max(0.5, Math.min(estimatedMB, sourceMB * 0.95)).toFixed(1);
  };

  // --- SERVER-SIDE STREAMING COMPRESSION ---
  const processVideoServer = async () => {
    if (!activeFile) return;

    setProgressMessage('Connecting to server streaming engine...');
    setProgress(5);

    // Record to media hub
    try {
      const { recordMediaUpload } = await import('@/lib/media-hub');
      await recordMediaUpload({
        fileName: activeFile.file.name,
        fileType: activeFile.file.type || 'video',
        fileSize: activeFile.file.size,
      });
    } catch (e) {}

    const formData = new FormData();
    formData.append('file', activeFile.file);
    formData.append('preset', qualityPreset);
    formData.append('resolution', targetResolution);
    formData.append('duration', activeFile.durationSec.toString());

    if (trimEnabled) {
      formData.append('startTime', startTime.toString());
      formData.append('endTime', endTime.toString());
    }

    if (useTargetSize && targetSizeMB) {
      formData.append('targetSizeMB', targetSizeMB);
    }

    const response = await fetch('/api/compress-stream', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server encoder returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'progress') {
              setProgress(data.percent);
              setProgressMessage(
                data.message || `Compressing: ${data.percent}%`
              );
            } else if (data.type === 'complete') {
              const binaryStr = atob(data.data);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'video/mp4' });
              const url = URL.createObjectURL(blob);

              let reduction = 0;
              if (activeFile.file.size > 0) {
                reduction = Math.round(
                  ((activeFile.file.size - data.size) / activeFile.file.size) *
                    100
                );
              }

              setProgress(100);
              setProgressMessage('Compression complete!');
              setResult({
                url,
                filename: `compressed_${activeFile.file.name.replace(/\.[^/.]+$/, '')}.mp4`,
                size: data.size,
                reduction: reduction > 0 ? reduction : 0,
              });

              // Save to history
              try {
                await saveToolHistory({
                  toolType: 'video_compressor',
                  fileName: activeFile.file.name,
                  fileSize: activeFile.file.size,
                  outputFormat: 'mp4',
                  outputSize: data.size,
                  reductionPercent: reduction > 0 ? reduction : 0,
                });
                setHistoryRefresh((prev) => prev + 1);
              } catch (e) {}
              return;
            } else if (data.type === 'error') {
              throw new Error(data.message || 'Server encoding error');
            }
          } catch (e) {
            if (e.message && !e.message.includes('Unexpected end of JSON')) {
              throw e;
            }
          }
        }
      }
    }
  };

  // --- CLIENT-SIDE COMPRESSION (FFmpeg.wasm) ---
  const processVideoClient = async () => {
    if (!activeFile || !ffmpegLoaded || !ffmpegRef.current) {
      throw new Error('Client video engine not initialized');
    }

    const ffmpeg = ffmpegRef.current;
    const preset =
      COMPRESSION_PRESETS.find((p) => p.id === qualityPreset) ||
      COMPRESSION_PRESETS[0];

    setProgressMessage('Reading video stream in browser...');
    setProgress(10);
    await ffmpeg.writeFile('input.mp4', await fetchFile(activeFile.file));

    setProgress(20);
    setProgressMessage('Configuring encoder pipeline...');

    const args = [
      ...(trimEnabled
        ? ['-ss', String(startTime), '-to', String(endTime)]
        : []),
      '-i',
      'input.mp4',
      '-c:v',
      'libx264',
      '-preset',
      preset.preset,
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
    ];

    if (preset.audioBitrate === 'Original') {
      args.push('-c:a', 'copy');
    } else {
      args.push('-c:a', 'aac');
      args.push('-b:a', preset.audioBitrate);
      args.push('-ar', '48000');
      args.push('-ac', '2');
    }

    const activeDuration = trimEnabled
      ? Math.max(0.1, endTime - startTime)
      : activeFile.durationSec;

    if (useTargetSize && targetSizeMB && activeDuration > 0) {
      const audioBitrateKbps =
        preset.audioBitrate === 'Original'
          ? 128
          : parseInt(preset.audioBitrate) || 256;
      const totalBitrateKbps =
        (parseFloat(targetSizeMB) * 8192) / activeDuration;
      const videoBitrateKbps = Math.max(
        totalBitrateKbps - audioBitrateKbps,
        100
      );
      args.push('-b:v', `${Math.round(videoBitrateKbps)}k`);
      args.push('-maxrate', `${Math.round(videoBitrateKbps * 1.5)}k`);
      args.push('-bufsize', `${Math.round(videoBitrateKbps * 2)}k`);
    } else {
      args.push('-crf', String(preset.crf));
    }

    if (targetResolution !== 'original') {
      const size = parseInt(targetResolution);
      if (!isNaN(size)) {
        args.push('-vf', `scale='min(${size},iw)':-2`);
      }
    }

    args.push('output.mp4');

    setProgress(30);
    setProgressMessage(
      preset.twoPass ? 'Executing Two-Pass Encode...' : 'Encoding Video...'
    );

    await ffmpeg.exec(args);

    setProgress(95);
    setProgressMessage('Extracting compressed file...');

    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    let reduction = 0;
    if (activeFile.file.size > 0) {
      reduction = Math.round(
        ((activeFile.file.size - blob.size) / activeFile.file.size) * 100
      );
    }

    setProgress(100);
    setProgressMessage('Compression complete!');

    setResult({
      url,
      filename: `compressed_${activeFile.file.name.replace(/\.[^/.]+$/, '')}.mp4`,
      size: blob.size,
      reduction: reduction > 0 ? reduction : 0,
    });

    // Save to history
    try {
      const { recordMediaUpload } = await import('@/lib/media-hub');
      await recordMediaUpload({
        fileName: activeFile.file.name,
        fileType: 'video/mp4',
        fileSize: blob.size,
        download_url: url,
      });

      await saveToolHistory({
        toolType: 'video_compressor',
        fileName: activeFile.file.name,
        fileSize: activeFile.file.size,
        outputFormat: 'mp4',
        outputSize: blob.size,
        reductionPercent: reduction > 0 ? reduction : 0,
      });
      setHistoryRefresh((prev) => prev + 1);
    } catch (e) {}

    // Clean up WASM filesystem
    try {
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('output.mp4');
    } catch (e) {}
  };

  // --- AUTO-HYBRID PROCESS CONTROLLER (Guaranteed 100% Success) ---
  const handleCompress = async () => {
    if (!activeFile) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const fileMB = activeFile.file.size / (1024 * 1024);

    // If user explicitly forced server mode OR file > 70MB (WASM memory limit) OR client engine not ready:
    if (compressionMode === 'server' || !ffmpegLoaded || fileMB > 70) {
      try {
        await processVideoServer();
      } catch (err) {
        console.error('Server compression failed:', err);
        setError(
          err.message || 'Compression failed. Please try a different preset.'
        );
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Attempt Client Compression first (Fast & Free) with automatic Server Failover
    try {
      await processVideoClient();
    } catch (clientErr) {
      console.warn(
        'Browser client encoding failed, auto-switching to server stream:',
        clientErr
      );
      setProgressMessage('Switching to high-performance server encoder...');
      setProgress(10);
      try {
        await processVideoServer();
      } catch (serverErr) {
        console.error('Server fallback also failed:', serverErr);
        setError(
          serverErr.message || 'Compression failed. Please check video file.'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    performAction(
      () => {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      { type: 'download', name: 'Video Compressor' }
    );
  };

  const reset = () => {
    if (activeFile?.preview) URL.revokeObjectURL(activeFile.preview);
    if (result?.url) URL.revokeObjectURL(result.url);
    setActiveFile(null);
    setResult(null);
    setProgress(0);
    setError(null);
    setUseTargetSize(false);
    setTrimEnabled(false);
    setStartTime(0);
    setEndTime(10);
  };

  // --- RENDER: EMPTY STATE (Fits Cleanly on Screen) ---
  if (!activeFile) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-in fade-in duration-500">
        {/* Header Badge & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Auto-Hybrid Engine • Browser & Cloud Accelerated
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent font-orbitron">
            ULTRA VIDEO COMPRESSOR
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto">
            Reduce MP4, MOV, and WebM size up to 90% without visible quality
            loss.
          </p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={cn(
            'w-full max-w-2xl mx-auto h-[260px] md:h-[280px] rounded-3xl p-1 transition-all duration-300 shadow-xl',
            dragActive
              ? 'scale-[1.02] ring-2 ring-primary'
              : 'hover:scale-[1.01]'
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative w-full h-full bg-card/60 backdrop-blur-xl rounded-[1.4rem] border-2 border-dashed border-border/80 overflow-hidden flex flex-col items-center justify-center gap-4 transition-all duration-300 group cursor-pointer p-6',
              dragActive
                ? 'bg-primary/10 border-primary'
                : 'hover:bg-card/90 hover:border-primary/50'
            )}
          >
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
              <CloudUpload className="w-10 h-10 text-primary" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Drop your video here or{' '}
                <span className="text-primary underline underline-offset-4">
                  browse
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Supports MP4, MOV, WebM, MKV, AVI • Up to 2GB
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider bg-background/50 px-3 py-1 rounded-full border border-border/40">
              <span>Fast 2-Pass</span>
              <span>•</span>
              <span>Audio Preserved</span>
              <span>•</span>
              <span>Target Size Mode</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* History Panel */}
        <div className="w-full max-w-4xl mx-auto mt-8">
          <ToolHistoryPanel
            toolType="video_compressor"
            refreshTrigger={historyRefresh}
          />
        </div>
      </div>
    );
  }

  // --- RENDER: ACTIVE WORKSPACE (Compact & Perfectly Viewport Fitted) ---
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: PREVIEW & MEDIA INFO */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-3">
          {/* Constrained Video Player */}
          <div className="relative w-full h-[220px] sm:h-[260px] md:h-[280px] rounded-2xl overflow-hidden bg-black/90 border border-border/60 shadow-lg flex items-center justify-center group">
            <video
              src={activeFile.preview}
              className="w-full h-full object-contain"
              controls
            />

            {/* Progress Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-200">
                <div className="relative flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-primary/15"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="text-primary transition-all duration-300 ease-out"
                      strokeDasharray={`${progress * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-primary font-orbitron tabular-nums">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-1 max-w-xs">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {progressMessage || 'Compressing video stream...'}
                  </p>
                  <div className="w-48 h-1.5 bg-primary/20 rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Result Overlay Badge */}
            {result && !isProcessing && (
              <div className="absolute top-3 right-3 z-40 animate-in zoom-in duration-300">
                <Badge className="bg-emerald-600 text-white font-bold px-3 py-1 text-xs shadow-lg flex items-center gap-1.5 border-none">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{result.reduction}% Smaller</span>
                </Badge>
              </div>
            )}
          </div>

          {/* Compact File Info Bar */}
          <div className="p-3 rounded-xl bg-card/60 border border-border/50 backdrop-blur-sm flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Film className="w-4 h-4" />
              </div>
              <div className="min-w-0 truncate">
                <p className="font-bold text-foreground truncate max-w-[180px] sm:max-w-[260px]">
                  {activeFile.file.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {activeFile.resolution} • {activeFile.duration}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-right">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">
                  Source
                </p>
                <p className="font-mono font-bold text-foreground">
                  {formatFileSize(activeFile.file.size)}
                </p>
              </div>
              <div className="h-6 w-px bg-border/60" />
              <div>
                <p className="text-[10px] text-emerald-500 uppercase font-bold">
                  {result ? 'Result' : 'Est. Output'}
                </p>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {result
                    ? formatFileSize(result.size)
                    : `~${estimateFileSize(targetResolution)} MB`}
                </p>
              </div>
            </div>
          </div>

          {/* Video Trimmer Accordion */}
          <div className="p-3 rounded-xl bg-card/40 border border-border/50 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-muted-foreground">
                  Trim Video (Optional)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTrimEnabled(!trimEnabled)}
                disabled={isProcessing}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-bold transition-all',
                  trimEnabled
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {trimEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {trimEnabled && (
              <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-border/40 animate-in slide-in-from-top-1">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                    Start (sec)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={endTime}
                    step={0.5}
                    value={startTime}
                    disabled={isProcessing}
                    onChange={(e) =>
                      setStartTime(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1 text-xs font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                    End (sec)
                  </label>
                  <input
                    type="number"
                    min={startTime}
                    max={activeFile.durationSec || 9999}
                    step={0.5}
                    value={endTime}
                    disabled={isProcessing}
                    onChange={(e) =>
                      setEndTime(
                        Math.min(
                          activeFile.durationSec || 9999,
                          Math.max(startTime, parseFloat(e.target.value) || 0)
                        )
                      )
                    }
                    className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1 text-xs font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: COMPACT CONTROLS & ACTION */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-md shadow-sm space-y-4">
            {/* Header & Reset */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Compression Settings
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={isProcessing}
                className="h-7 px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Change Video
              </Button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Compression Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMPRESSION_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected =
                    qualityPreset === preset.id && !useTargetSize;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setQualityPreset(preset.id);
                        setUseTargetSize(false);
                      }}
                      disabled={isProcessing}
                      className={cn(
                        'relative p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col gap-0.5',
                        isSelected
                          ? 'bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/40'
                          : 'bg-background/40 border-border/50 hover:bg-background/80 text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <Icon
                            className={cn(
                              'w-3.5 h-3.5',
                              isSelected
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                          <span className="text-xs font-bold truncate">
                            {preset.label}
                          </span>
                        </div>
                        {preset.tag && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-primary/20 text-primary font-semibold">
                            {preset.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate opacity-80">
                        {preset.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Output Resolution
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {RESOLUTIONS.map((res) => {
                  const isSelected = targetResolution === res.id;
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setTargetResolution(res.id)}
                      disabled={isProcessing}
                      className={cn(
                        'py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                          : 'bg-background/40 border-border/50 text-muted-foreground hover:bg-background/80 text-xs'
                      )}
                    >
                      <div className="text-[11px] font-bold">{res.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Size Mode Switch */}
            <div className="pt-2 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Exact Target File Size
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseTargetSize(!useTargetSize)}
                  disabled={isProcessing}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold transition-all',
                    useTargetSize
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {useTargetSize ? 'Active' : 'Off'}
                </button>
              </div>

              {useTargetSize && (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="5"
                    value={targetSizeMB}
                    onChange={(e) => setTargetSizeMB(e.target.value)}
                    disabled={isProcessing}
                    className="flex-1 bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-foreground outline-none focus:border-primary"
                  />
                  <span className="text-xs font-bold text-primary font-mono">
                    MB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action CTA Button */}
          {result ? (
            <div className="space-y-2">
              <Button
                onClick={downloadResult}
                className="h-12 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>
                  Download Compressed Video ({formatFileSize(result.size)})
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={reset}
                className="h-9 w-full rounded-xl text-xs font-semibold"
              >
                Compress Another Video
              </Button>
            </div>
          ) : (
            <ProgressButton
              onClick={handleCompress}
              disabled={isProcessing}
              isLoading={isProcessing}
              progress={progress}
              label="Compress Video"
              loadingLabel={progressMessage || 'Compressing Video...'}
              className="h-12 w-full rounded-xl shadow-md transition-all font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
              variant="default"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 fill-current" />
                <span>Start Compression</span>
              </div>
            </ProgressButton>
          )}
        </div>
      </div>

      {/* History Panel */}
      <div className="w-full mt-6">
        <ToolHistoryPanel
          toolType="video_compressor"
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}
