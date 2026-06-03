'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthAction } from '@/lib/use-auth-action';
import { saveToolHistory } from '@/lib/tool-history';
import { ToolHistoryPanel } from '@/components/tool-history-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  CloudUpload,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Video,
  Zap,
  X,
  LayoutGrid,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-converter';
import { ProgressButton } from '@/components/progress-button';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { toast } from 'sonner';
import Image from 'next/image';

export function VideoToGif() {
  const { performAction } = useAuthAction();
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFile, setConvertedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fps, setFps] = useState('12');
  const [scale, setScale] = useState('480');
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);

  // Load FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      ffmpeg.on('progress', ({ progress: prog }) => {
        const pct = Math.round(prog * 100);
        if (pct > 0) setProgress(pct);
      });

      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            'text/javascript'
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            'application/wasm'
          ),
        });
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        toast.error('Failed to load engine. Please refresh.');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFile = useCallback((newFile) => {
    if (newFile && newFile.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        setVideoDuration(video.duration);
        if (video.duration > 10.5) {
          toast.warning(
            'Videos over 10 seconds may result in very large GIF files. Recommended: < 10s.'
          );
        }
      };
      video.src = URL.createObjectURL(newFile);

      setFile(newFile);
      setConvertedFile(null);
      setProgress(0);
    } else {
      toast.error('Please select a valid video file');
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const convertToGif = async () => {
    if (!file || !ffmpegLoaded) return;

    setIsConverting(true);
    setProgress(0);
    const ffmpeg = ffmpegRef.current;

    try {
      const inputName = `input.${file.name.split('.').pop()}`;
      const outputName = 'output.gif';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Two-pass palette generation for high quality
      // Pass 1: Generate palette
      await ffmpeg.exec([
        '-i',
        inputName,
        '-vf',
        `fps=${fps},scale=${scale}:-1:flags=lanczos,palettegen`,
        'palette.png',
      ]);

      // Pass 2: Use palette to generate GIF
      await ffmpeg.exec([
        '-i',
        inputName,
        '-i',
        'palette.png',
        '-filter_complex',
        `fps=${fps},scale=${scale}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: 'image/gif' });
      const outputFileName = file.name.replace(/\.[^.]+$/, '') + '.gif';

      setConvertedFile({
        fileName: outputFileName,
        size: blob.size,
        url: URL.createObjectURL(blob),
        blob,
      });

      await saveToolHistory({
        toolType: 'video-to-gif',
        fileName: file.name,
        fileSize: file.size,
        outputFormat: 'gif',
        outputSize: blob.size,
        reductionPercent: 0, // Not really reduction
      });

      toast.success('GIF generated successfully!');
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Error creating GIF. Try a shorter video.');
    } finally {
      setIsConverting(false);
    }
  };

  const downloadGif = () => {
    if (!convertedFile) return;
    performAction(
      () => {
        const a = document.createElement('a');
        a.href = convertedFile.url;
        a.download = convertedFile.fileName;
        a.click();
      },
      { type: 'download', name: 'GIF' }
    );
  };

  if (!file && !convertedFile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4 mb-12">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black tracking-[0.4em] uppercase"
          >
            {ffmpegLoaded ? 'GIF Engine Ready' : 'Initializing Engine...'}
          </Badge>
          <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
            VIDEO TO GIF
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
            Professional Looping Clips • Optimized for Training
          </p>
        </div>

        <div
          className={cn(
            'w-full max-w-4xl h-[400px] rounded-[3rem] p-1 transition-all duration-500 shadow-2xl',
            dragActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div
            className={cn(
              'relative w-full h-full bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-border/50 overflow-hidden flex flex-col items-center justify-center gap-8 transition-all duration-500 group cursor-pointer',
              dragActive
                ? 'bg-primary/5 border-primary/50'
                : 'hover:bg-card/60 hover:border-primary/30',
              !ffmpegLoaded && 'opacity-50 cursor-wait'
            )}
            onClick={() => ffmpegLoaded && fileInputRef.current?.click()}
          >
            <div className="relative z-10 p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 shadow-lg group-hover:scale-110 transition-all duration-500">
              <Video className="w-16 h-16 text-primary" />
            </div>
            <div className="relative z-10 text-center space-y-3">
              <h2 className="text-3xl md:text-5xl font-black italic text-foreground tracking-tighter font-orbitron text-center">
                UPLOAD VIDEO
              </h2>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Best quality: under 10 seconds
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  MP4 • MOV • WebM
                </span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
              disabled={!ffmpegLoaded}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in slide-in-from-bottom-8 duration-700">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-6 shadow-2xl relative overflow-hidden">
        {/* Source info */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative z-10">
          <div className="relative w-full rounded-[2.5rem] bg-card/30 border border-border/50 p-6 flex flex-col gap-6">
            <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
              <LayoutGrid className="w-4 h-4 text-primary" /> Source Asset
            </h3>

            <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-card/40 border border-border/50">
              <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Video className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black truncate text-foreground uppercase tracking-tight mb-1">
                  {file?.name || 'Asset Loaded'}
                </p>
                <div className="flex gap-4">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black border-border/50 bg-background/50"
                  >
                    {formatFileSize(file?.size || 0)}
                  </Badge>
                  <Badge
                    variant={videoDuration > 10 ? 'destructive' : 'outline'}
                    className="text-[9px] font-black"
                  >
                    {videoDuration.toFixed(1)}s DURATION
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFile(null);
                  setConvertedFile(null);
                }}
                className="rounded-full hover:bg-red-500/10 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {convertedFile && (
              <div className="mt-4 p-8 rounded-[2rem] bg-primary/5 border border-primary/20 flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                <Image
                  src={convertedFile.url}
                  width={400}
                  height={300}
                  className="max-h-[300px] w-auto h-auto rounded-xl shadow-2xl border border-white/10"
                  alt="Preview"
                  unoptimized
                />
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">
                    Conversion Successful
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    {formatFileSize(convertedFile.size)} GIF
                  </p>
                </div>
                <Button
                  onClick={downloadGif}
                  className="h-14 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                >
                  <Download className="w-5 h-5 mr-3" /> Download GIF
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative z-10">
          <div className="p-8 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl space-y-8">
            <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
              <Settings className="w-4 h-4 text-primary" /> Parameters
            </h3>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                Motion Density (FPS)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['8', '12', '16'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setFps(val)}
                    className={cn(
                      'py-3 rounded-xl border text-[10px] font-black transition-all',
                      fps === val
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                        : 'bg-background/20 border-border/50 text-muted-foreground'
                    )}
                  >
                    {val} FPS
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                Spatial Scale (Width)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['320', '480', '640'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setScale(val)}
                    className={cn(
                      'py-3 rounded-xl border text-[10px] font-black transition-all',
                      scale === val
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                        : 'bg-background/20 border-border/50 text-muted-foreground'
                    )}
                  >
                    {val}PX
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-amber-500/80">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-[10px] font-bold leading-relaxed">
                  High-fidelity GIFs require significant memory. For durations
                  &gt; 10s, consider using Video Compressor.
                </p>
              </div>
              <ProgressButton
                onClick={convertToGif}
                disabled={!file || isConverting || !ffmpegLoaded}
                isLoading={isConverting}
                progress={progress}
                label="Generate Industrial GIF"
                loadingLabel="Neural Encoding..."
                className="h-16 w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/10"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setConvertedFile(null);
            }}
            className="h-14 rounded-2xl border-2 border-border/50 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Start Over
          </Button>
        </div>
      </div>

      <div className="w-full mt-12 pb-12">
        <ToolHistoryPanel toolType="video-to-gif" />
      </div>
    </div>
  );
}
