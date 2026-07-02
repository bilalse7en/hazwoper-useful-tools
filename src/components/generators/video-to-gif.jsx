'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthAction } from '@/lib/use-auth-action';
import { saveToolHistory } from '@/lib/tool-history';
import { ToolHistoryPanel } from '@/components/tool-history-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Settings,
  RefreshCw,
  AlertCircle,
  Video,
  X,
  LayoutGrid,
  Scissors,
  Repeat,
  FileImage,
  Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-converter';
import { ProgressButton } from '@/components/progress-button';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { loadFFmpegCore } from '@/lib/ffmpeg-loader';
import { showToast, showSuccess } from '@/lib/swal';
import Image from 'next/image';

export function VideoToGif() {
  const { performAction } = useAuthAction();
  const [mode, setMode] = useState('video-to-gif'); // video-to-gif or gif-to-video
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedFile, setConvertedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Video to GIF Settings
  const [fps, setFps] = useState('12');
  const [scale, setScale] = useState('480');

  // GIF to Video Settings
  const [outputFormat, setOutputFormat] = useState('mp4'); // mp4 or webm
  const [videoFps, setVideoFps] = useState('24');

  // Trimming Settings
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);

  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);
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
        await loadFFmpegCore(ffmpeg);
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        showToast('Failed to load engine. Please refresh.', 'error');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFile = useCallback(
    (newFile) => {
      if (!newFile) return;

      if (mode === 'video-to-gif') {
        if (newFile.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            setVideoDuration(video.duration);
            setStartTime(0);
            setEndTime(Math.min(video.duration, 10));
            if (video.duration > 10.5) {
              showToast(
                'Videos over 10 seconds may result in very large GIF files. Recommended: < 10s.',
                'warning'
              );
            }
          };
          video.src = URL.createObjectURL(newFile);

          setFile(newFile);
          setConvertedFile(null);
          setProgress(0);
          setTrimEnabled(false);
        } else {
          showToast(
            'Please select a valid video file in Video to GIF mode',
            'error'
          );
        }
      } else {
        // gif-to-video mode
        if (newFile.type === 'image/gif' || newFile.name.endsWith('.gif')) {
          setFile(newFile);
          setVideoDuration(0);
          setConvertedFile(null);
          setProgress(0);
          setTrimEnabled(false);
        } else {
          showToast(
            'Please select a valid GIF file in GIF to Video mode',
            'error'
          );
        }
      }
    },
    [mode]
  );

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

  const convertFile = async () => {
    if (!file || !ffmpegLoaded) return;

    setIsConverting(true);
    setProgress(0);
    const ffmpeg = ffmpegRef.current;

    try {
      const fileExt = file.name.split('.').pop();
      const inputName = `input.${fileExt}`;

      // Record input to media hub
      try {
        const { recordMediaUpload } = await import('@/lib/media-hub');
        await recordMediaUpload({
          fileName: file.name,
          fileType:
            file.type || (mode === 'video-to-gif' ? 'video/mp4' : 'image/gif'),
          fileSize: file.size,
        });
      } catch (err) {
        console.error('[MediaHub] Input upload log skipped:', err);
      }

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      if (mode === 'video-to-gif') {
        const outputName = 'output.gif';
        const trimArgs = trimEnabled
          ? ['-ss', String(startTime), '-to', String(endTime)]
          : [];

        // Pass 1: Generate palette
        await ffmpeg.exec([
          ...trimArgs,
          '-i',
          inputName,
          '-vf',
          `fps=${fps},scale=${scale}:-1:flags=lanczos,palettegen`,
          'palette.png',
        ]);

        // Pass 2: Use palette to generate GIF
        await ffmpeg.exec([
          ...trimArgs,
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
        const outputUrl = URL.createObjectURL(blob);

        setConvertedFile({
          fileName: outputFileName,
          size: blob.size,
          url: outputUrl,
          blob,
        });

        // Record output to media hub
        try {
          const { recordMediaUpload } = await import('@/lib/media-hub');
          await recordMediaUpload({
            fileName: outputFileName,
            fileType: 'image/gif',
            fileSize: blob.size,
            download_url: outputUrl,
          });
        } catch (err) {
          console.error('[MediaHub] Output upload log skipped:', err);
        }

        await saveToolHistory({
          toolType: 'video-to-gif',
          fileName: file.name,
          fileSize: file.size,
          outputFormat: 'gif',
          outputSize: blob.size,
          reductionPercent: 0,
        });

        // Clean up FFmpeg files
        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile('palette.png');
          await ffmpeg.deleteFile(outputName);
        } catch (e) {}
      } else {
        // GIF to Video converter
        const outputExt = outputFormat;
        const outputName = `output.${outputExt}`;
        const outputMime = outputFormat === 'mp4' ? 'video/mp4' : 'video/webm';

        // FFmpeg GIF to Video argument setup
        // We use libx264 for MP4, libvpx-vp9/libvpx for WebM.
        const outputArgs =
          outputExt === 'mp4'
            ? [
                '-c:v',
                'libx264',
                '-pix_fmt',
                'yuv420p',
                '-movflags',
                '+faststart',
                '-vf',
                'scale=trunc(iw/2)*2:trunc(ih/2)*2', // MP4 width/height must be divisible by 2
              ]
            : [
                '-c:v',
                'libvpx-vp9',
                '-pix_fmt',
                'yuv420p',
                '-b:v',
                '0',
                '-crf',
                '30',
                '-vf',
                'scale=trunc(iw/2)*2:trunc(ih/2)*2',
              ];

        const trimArgs = trimEnabled
          ? ['-ss', String(startTime), '-to', String(endTime)]
          : [];

        await ffmpeg.exec([
          ...trimArgs,
          '-i',
          inputName,
          ...outputArgs,
          '-r',
          videoFps,
          outputName,
        ]);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data.buffer], { type: outputMime });
        const outputFileName =
          file.name.replace(/\.[^.]+$/, '') + `.${outputExt}`;
        const outputUrl = URL.createObjectURL(blob);

        setConvertedFile({
          fileName: outputFileName,
          size: blob.size,
          url: outputUrl,
          blob,
        });

        // Record output to media hub
        try {
          const { recordMediaUpload } = await import('@/lib/media-hub');
          await recordMediaUpload({
            fileName: outputFileName,
            fileType: outputMime,
            fileSize: blob.size,
            download_url: outputUrl,
          });
        } catch (err) {
          console.error('[MediaHub] Output upload log skipped:', err);
        }

        await saveToolHistory({
          toolType: 'video-to-gif',
          fileName: file.name,
          fileSize: file.size,
          outputFormat: outputFormat.toUpperCase(),
          outputSize: blob.size,
          reductionPercent: 0,
        });

        // Clean up FFmpeg files
        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(outputName);
        } catch (e) {}
      }

      setHistoryRefresh((prev) => prev + 1);
      showSuccess('Conversion complete!');
    } catch (error) {
      console.error('Conversion error:', error);
      showToast(
        'Error converting file. Please check settings or try another file.',
        'error'
      );
    } finally {
      setIsConverting(false);
    }
  };

  const downloadResult = () => {
    if (!convertedFile) return;
    performAction(
      () => {
        const a = document.createElement('a');
        a.href = convertedFile.url;
        a.download = convertedFile.fileName;
        a.click();
      },
      { type: 'download', name: mode === 'video-to-gif' ? 'GIF' : 'Video' }
    );
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setFile(null);
    setConvertedFile(null);
    setProgress(0);
    setVideoDuration(0);
    setTrimEnabled(false);
  };

  if (!file && !convertedFile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4 mb-4">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black tracking-[0.4em] uppercase"
          >
            {ffmpegLoaded ? 'Engine Ready' : 'Initializing Engine...'}
          </Badge>
          <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
            {mode === 'video-to-gif' ? 'VIDEO TO GIF' : 'GIF TO VIDEO'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
            {mode === 'video-to-gif'
              ? 'High-Fidelity Looping Clips • Perfect for Demos'
              : 'Re-Encode Animated GIF as Premium HTML5 Video'}
          </p>
        </div>

        {/* Mode Selector Switch */}
        <div className="flex bg-muted/40 p-1.5 rounded-2xl border border-border mb-12 relative z-10">
          <button
            onClick={() => handleModeChange('video-to-gif')}
            className={cn(
              'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300',
              mode === 'video-to-gif'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Video to GIF
          </button>
          <button
            onClick={() => handleModeChange('gif-to-video')}
            className={cn(
              'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300',
              mode === 'gif-to-video'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            GIF to Video
          </button>
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
              {mode === 'video-to-gif' ? (
                <Video className="w-16 h-16 text-primary" />
              ) : (
                <FileImage className="w-16 h-16 text-primary" />
              )}
            </div>
            <div className="relative z-10 text-center space-y-3">
              <h2 className="text-3xl md:text-5xl font-black italic text-foreground tracking-tighter font-orbitron text-center uppercase">
                {mode === 'video-to-gif' ? 'UPLOAD VIDEO' : 'UPLOAD GIF'}
              </h2>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {mode === 'video-to-gif'
                    ? 'Best quality: under 10 seconds'
                    : 'Compile frame arrays directly into MP4/WebM'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  {mode === 'video-to-gif' ? 'MP4 • MOV • WebM' : 'GIF'}
                </span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={mode === 'video-to-gif' ? 'video/*' : 'image/gif'}
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
                {mode === 'video-to-gif' ? (
                  <Video className="w-8 h-8" />
                ) : (
                  <FileImage className="w-8 h-8" />
                )}
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
                  {videoDuration > 0 && (
                    <Badge
                      variant={videoDuration > 10 ? 'destructive' : 'outline'}
                      className="text-[9px] font-black"
                    >
                      {videoDuration.toFixed(1)}s DURATION
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black uppercase border-primary/20 bg-primary/5 text-primary"
                  >
                    {mode === 'video-to-gif' ? 'Video Input' : 'GIF Input'}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setConvertedFile(null);
                  setProgress(0);
                  setVideoDuration(0);
                  setTrimEnabled(false);
                }}
                className="p-2 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {convertedFile && (
              <div className="mt-4 p-8 rounded-[2rem] bg-primary/5 border border-primary/20 flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                {mode === 'video-to-gif' ? (
                  <Image
                    src={convertedFile.url}
                    width={400}
                    height={300}
                    className="max-h-[300px] w-auto h-auto rounded-xl shadow-2xl border border-white/10"
                    alt="Preview"
                    unoptimized
                  />
                ) : (
                  <video
                    src={convertedFile.url}
                    controls
                    className="max-h-[300px] w-full rounded-xl shadow-2xl border border-white/10"
                  />
                )}
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">
                    Conversion Successful
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    {formatFileSize(convertedFile.size)}{' '}
                    {mode === 'video-to-gif'
                      ? 'GIF'
                      : outputFormat.toUpperCase()}
                  </p>
                </div>
                <Button
                  onClick={downloadResult}
                  className="h-14 px-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                >
                  <Download className="w-5 h-5 mr-3" /> Download Output
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative z-10 font-sans">
          <div className="p-8 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl space-y-8">
            <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
              <Settings className="w-4 h-4 text-primary" /> Parameters
            </h3>

            {/* Video-to-GIF Specific Settings */}
            {mode === 'video-to-gif' && (
              <>
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
              </>
            )}

            {/* GIF-to-Video Specific Settings */}
            {mode === 'gif-to-video' && (
              <>
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                    Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'mp4', label: 'MP4 (Universal)' },
                      { value: 'webm', label: 'WebM (Web Audio)' },
                    ].map((fmt) => (
                      <button
                        key={fmt.value}
                        onClick={() => setOutputFormat(fmt.value)}
                        className={cn(
                          'py-3 rounded-xl border text-[10px] font-black transition-all',
                          outputFormat === fmt.value
                            ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                            : 'bg-background/20 border-border/50 text-muted-foreground'
                        )}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                    Video Frame Rate
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['12', '24', '30'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setVideoFps(val)}
                        className={cn(
                          'py-3 rounded-xl border text-[10px] font-black transition-all',
                          videoFps === val
                            ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                            : 'bg-background/20 border-border/50 text-muted-foreground'
                        )}
                      >
                        {val} FPS
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Trimming Control */}
            <div className="space-y-4 p-4 rounded-2xl bg-muted/40 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Trimming Editor
                  </span>
                </div>
                <button
                  onClick={() => setTrimEnabled(!trimEnabled)}
                  className={cn(
                    'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-all',
                    trimEnabled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background/40 text-muted-foreground border border-border'
                  )}
                >
                  {trimEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {trimEnabled && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                      Start Time (s)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={endTime}
                      step={0.5}
                      value={startTime}
                      onChange={(e) =>
                        setStartTime(
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      className="w-full bg-background/50 border border-border rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                      End Time (s)
                    </label>
                    <input
                      type="number"
                      min={startTime}
                      max={videoDuration > 0 ? videoDuration : 9999}
                      step={0.5}
                      value={endTime}
                      onChange={(e) =>
                        setEndTime(
                          Math.max(startTime, parseFloat(e.target.value) || 1)
                        )
                      }
                      className="w-full bg-background/50 border border-border rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-foreground outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 space-y-4">
              {mode === 'video-to-gif' && (
                <div className="flex items-center gap-3 text-amber-500/80">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-[10px] font-bold leading-relaxed">
                    High-quality GIFs require significant memory. For clips
                    longer than 10 seconds, consider using Video Compressor.
                  </p>
                </div>
              )}
              <ProgressButton
                onClick={convertFile}
                disabled={!file || isConverting || !ffmpegLoaded}
                isLoading={isConverting}
                progress={progress}
                label={
                  mode === 'video-to-gif'
                    ? 'Generate Looping GIF'
                    : 'Compile to Video'
                }
                loadingLabel="Engine Processing..."
                className="h-16 w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/10"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setConvertedFile(null);
              setProgress(0);
              setVideoDuration(0);
              setTrimEnabled(false);
            }}
            className="h-14 rounded-2xl border-2 border-border/50 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Start Over
          </Button>
        </div>
      </div>

      <div className="w-full mt-12 pb-12">
        <ToolHistoryPanel
          toolType="video-to-gif"
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}
