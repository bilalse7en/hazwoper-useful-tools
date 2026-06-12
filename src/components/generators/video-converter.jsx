'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthAction } from '@/lib/use-auth-action';
import { saveToolHistory } from '@/lib/tool-history';
import { ToolHistoryPanel } from '@/components/tool-history-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  CloudUpload,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Film,
  Flame,
  ChevronDown,
  Zap,
  X,
  LayoutGrid,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-converter';
import { ProgressButton } from '@/components/progress-button';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { showToast, showSuccess } from '@/lib/swal';

const OUTPUT_FORMATS = [
  { value: 'mp4', label: 'MP4 (H.264)', mime: 'video/mp4', ext: 'mp4' },
  { value: 'webm', label: 'WebM (VP9)', mime: 'video/webm', ext: 'webm' },
  {
    value: 'mov',
    label: 'MOV (QuickTime)',
    mime: 'video/quicktime',
    ext: 'mov',
  },
  { value: 'avi', label: 'AVI (Classic)', mime: 'video/x-msvideo', ext: 'avi' },
  { value: 'gif', label: 'GIF (Animated)', mime: 'image/gif', ext: 'gif' },
];

const QUALITY_PRESETS = [
  { id: 'high', label: 'High Quality', crf: 18, desc: 'Best visual fidelity' },
  { id: 'balanced', label: 'Balanced', crf: 23, desc: 'Good quality & size' },
  { id: 'compact', label: 'Compact', crf: 28, desc: 'Smaller file size' },
  { id: 'tiny', label: 'Tiny', crf: 35, desc: 'Minimum size' },
];

export function VideoConverter() {
  const { performAction } = useAuthAction();
  const [files, setFiles] = useState([]);
  const [toFormat, setToFormat] = useState('mp4');
  const [qualityPreset, setQualityPreset] = useState('balanced');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
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
        if (pct > 0) setProgress((prev) => Math.max(prev, pct));
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
        showToast('Failed to load video engine. Please refresh.', 'error');
      }
    };

    loadFFmpeg();
  }, []);

  const showNotification = (message, type = 'success') => {
    if (type === 'error') showToast(message, 'error');
    else showSuccess(message);
  };

  const handleFiles = useCallback((newFiles) => {
    const validFiles = Array.from(newFiles)
      .filter(
        (f) =>
          f.type.startsWith('video/') ||
          f.name.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i)
      )
      .slice(0, 5);

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
      showNotification(`Added ${validFiles.length} video(s)`);
    } else {
      showNotification('Please select valid video files', 'error');
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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setFiles([]);
    setConvertedFiles([]);
    showNotification('Queue cleared');
  };

  const getOutputArgs = (format, preset) => {
    const q =
      QUALITY_PRESETS.find((p) => p.id === preset) || QUALITY_PRESETS[1];

    switch (format) {
      case 'mp4':
        return [
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-crf',
          String(q.crf),
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-movflags',
          '+faststart',
          '-pix_fmt',
          'yuv420p',
        ];
      case 'webm':
        return [
          '-c:v',
          'libvpx-vp9',
          '-crf',
          String(q.crf),
          '-b:v',
          '0',
          '-c:a',
          'libopus',
          '-b:a',
          '128k',
        ];
      case 'mov':
        return [
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-crf',
          String(q.crf),
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-pix_fmt',
          'yuv420p',
        ];
      case 'avi':
        return [
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-crf',
          String(q.crf),
          '-c:a',
          'aac',
          '-b:a',
          '192k',
        ];
      case 'gif':
        return ['-vf', 'fps=12,scale=480:-1:flags=lanczos', '-loop', '0'];
      default:
        return ['-c:v', 'libx264', '-crf', String(q.crf), '-c:a', 'aac'];
    }
  };

  const convertAll = async () => {
    if (files.length === 0 || !ffmpegLoaded) {
      showNotification(
        ffmpegLoaded ? 'Add files first' : 'Engine loading...',
        'error'
      );
      return;
    }

    setIsConverting(true);
    setConvertedFiles([]);
    setProgress(0);
    const results = [];
    const ffmpeg = ffmpegRef.current;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);
      setProgress(Math.round(((i + 0.1) / files.length) * 100));

      try {
        const inputName = `input_${i}.${file.name.split('.').pop()}`;
        const outputExt =
          OUTPUT_FORMATS.find((f) => f.value === toFormat)?.ext || 'mp4';
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const outputName = `output_${i}.${outputExt}`;
        const outputFileName = `${baseName}.${outputExt}`;

        await ffmpeg.writeFile(inputName, await fetchFile(file));

        const args = [
          '-i',
          inputName,
          ...getOutputArgs(toFormat, qualityPreset),
          outputName,
        ];

        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const mime =
          OUTPUT_FORMATS.find((f) => f.value === toFormat)?.mime || 'video/mp4';
        const blob = new Blob([data.buffer], { type: mime });

        results.push({
          fileName: outputFileName,
          originalName: file.name,
          originalSize: file.size,
          convertedSize: blob.size,
          blob,
          success: true,
        });

        // Cleanup
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch (error) {
        console.error('Conversion error for', file.name, error);
        results.push({
          originalName: file.name,
          success: false,
          error: error.message,
        });
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setConvertedFiles(results);
    setIsConverting(false);
    setCurrentFile('');
    const successCount = results.filter((r) => r.success).length;
    showNotification(`Converted ${successCount}/${files.length} videos`);

    // Save to history
    for (const result of results.filter((r) => r.success)) {
      try {
        await saveToolHistory({
          toolType: 'video_converter',
          fileName: result.originalName || result.fileName,
          fileSize: result.originalSize || 0,
          outputFormat: toFormat,
          outputSize: result.convertedSize || 0,
          reductionPercent:
            result.originalSize > 0
              ? Math.round(
                  ((result.originalSize - result.convertedSize) /
                    result.originalSize) *
                    100
                )
              : 0,
        });
      } catch (e) {
        /* silently fail for non-logged users */
      }
    }
    setHistoryRefresh((prev) => prev + 1);
  };

  const downloadSingle = (file) => {
    performAction(
      () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file.blob);
        a.download = file.fileName;
        a.click();
      },
      { type: 'download', name: file.fileName }
    );
  };

  const downloadAll = () => {
    performAction(
      () => {
        convertedFiles
          .filter((f) => f.success)
          .forEach((file) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(file.blob);
            a.download = file.fileName;
            a.click();
          });
      },
      { type: 'download', name: 'Batch Videos' }
    );
  };

  const reset = () => {
    setFiles([]);
    setConvertedFiles([]);
    setProgress(0);
    setCurrentFile('');
  };

  // --- EMPTY STATE ---
  if (files.length === 0 && convertedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4 mb-12">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black tracking-[0.4em] uppercase"
          >
            {ffmpegLoaded ? 'FFmpeg Engine Ready' : 'Loading Engine...'}
          </Badge>
          <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
            VIDEO CONVERTER
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
            Format Conversion • MP4 → WebM → MOV → AVI → GIF
          </p>
        </div>

        <div
          className={cn(
            'w-full max-w-4xl h-[450px] rounded-[3rem] p-1 transition-all duration-500 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1),inset_0_20px_60px_rgba(var(--glass-shadow-color),0.3)]',
            dragActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div
            className={cn(
              'relative w-full h-full bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-border/50 overflow-hidden flex flex-col items-center justify-center gap-8 transition-all duration-500 group cursor-pointer shadow-[inset_0_4px_20px_rgba(var(--glass-shadow-color),0.15)]',
              dragActive
                ? 'bg-primary/5 border-primary/50'
                : 'hover:bg-card/60 hover:border-primary/30',
              !ffmpegLoaded && 'opacity-50 cursor-wait'
            )}
            onClick={() => ffmpegLoaded && fileInputRef.current?.click()}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="relative z-10 p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 shadow-[inset_0_2px_10px_rgba(var(--glass-shadow-color),0.08)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <CloudUpload className="w-16 h-16 text-primary" />
            </div>

            <div className="relative z-10 text-center space-y-3">
              <h2 className="text-3xl md:text-5xl font-black italic text-foreground tracking-tighter font-orbitron drop-shadow-sm">
                {ffmpegLoaded ? 'DROP VIDEOS' : 'LOADING...'}
              </h2>
              <div className="inline-flex gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                <span>MP4</span>
                <span>MOV</span>
                <span>AVI</span>
                <span>MKV</span>
                <span>WebM</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,.mkv,.avi,.mov,.flv,.wmv"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={!ffmpegLoaded}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- WORKSPACE ---
  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in slide-in-from-bottom-8 duration-700">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-4 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_50px_100px_rgba(var(--glass-shadow-color),0.12)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

        {/* --- LEFT COLUMN: FILE QUEUE --- */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative z-10 h-full">
          <div className="relative w-full min-h-[300px] rounded-[2.5rem] overflow-hidden bg-card/30 border border-border/50 shadow-[inset_0_0_50px_rgba(var(--glass-shadow-color),0.08)] group ring-1 ring-border/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                <LayoutGrid className="w-4 h-4 text-primary" /> Active Queue
                <Badge
                  variant="outline"
                  className="ml-2 text-[8px] border-primary/30 text-primary"
                >
                  {files.length} FILES
                </Badge>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearQueue}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/10 hover:border-red-500/30 shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.08)]"
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/50 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_4px_12px_rgba(var(--glass-shadow-color),0.04)] group/item animate-in slide-in-from-left-4 transition-all duration-500 hover:border-primary/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center justify-center shrink-0 shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.08)]">
                      <Film className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-xs font-black truncate text-foreground uppercase tracking-tight max-w-[120px] md:max-w-[180px]">
                        {file.name}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 rounded-xl border-dashed border-2 border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <CloudUpload className="w-4 h-4 mr-2" /> Add More Videos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mkv,.avi,.mov,.flv,.wmv"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Results Panel */}
          {convertedFiles.length > 0 && (
            <div className="rounded-[2rem] bg-card/30 border border-border/50 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_10px_30px_rgba(var(--glass-shadow-color),0.08)] p-6 animate-in zoom-in duration-500">
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {convertedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all',
                      file.success
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-destructive/20 bg-destructive/5'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={
                          file.success ? 'text-green-500' : 'text-destructive'
                        }
                      >
                        {file.success ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black truncate text-foreground uppercase tracking-wider max-w-[150px]">
                          {file.fileName || file.originalName}
                        </p>
                        {file.success && (
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                            {formatFileSize(file.originalSize)} →{' '}
                            {formatFileSize(file.convertedSize)}
                          </p>
                        )}
                      </div>
                    </div>
                    {file.success && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadSingle(file)}
                        className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg transition-all shrink-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  onClick={downloadAll}
                  className="h-12 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.2)] text-[9px] font-black uppercase tracking-widest"
                >
                  <Download className="w-4 h-4 mr-2" /> Download All
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="h-12 rounded-xl border-border/50 text-muted-foreground hover:text-foreground text-[9px] font-black uppercase tracking-widest shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.08)]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: CONTROLS --- */}
        <div className="lg:col-span-5 flex flex-col h-full gap-5 relative z-10">
          <div className="flex-1 flex flex-col gap-5 p-6 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl relative overflow-hidden shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_20px_50px_rgba(var(--glass-shadow-color),0.08)]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />

            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                <Settings className="w-4 h-4" /> Conversion Settings
              </h3>
            </div>

            {/* Output Format */}
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">
                Output Format
              </label>
              <Select value={toFormat} onValueChange={setToFormat}>
                <SelectTrigger className="w-full h-14 rounded-xl border-primary/50 bg-card/40 font-black text-sm text-primary shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1),inset_0_4px_12px_rgba(var(--primary-rgb),0.05),0_0_20px_rgba(var(--primary-rgb),0.1)] hover:border-primary transition-all">
                  <SelectValue placeholder="Select target format" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/30 bg-card/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(var(--glass-shadow-color),0.3),0_0_30px_rgba(var(--primary-rgb),0.1)]">
                  {OUTPUT_FORMATS.map((format) => (
                    <SelectItem
                      key={format.value}
                      value={format.value}
                      className="rounded-lg font-bold text-sm hover:bg-primary/10 focus:bg-primary/10"
                    >
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[8px] font-medium text-muted-foreground/60 pl-1">
                Accepts: MP4, MOV, AVI, MKV, WebM, FLV, WMV, M4V
              </p>
            </div>

            {/* Quality Preset */}
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">
                Quality Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUALITY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setQualityPreset(preset.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all duration-300',
                      qualityPreset === preset.id
                        ? 'bg-primary/10 border-primary/50 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1)]'
                        : 'bg-background/20 border-border/50 hover:bg-background/40 hover:border-border'
                    )}
                  >
                    <p
                      className={cn(
                        'text-[10px] font-black uppercase tracking-wider',
                        qualityPreset === preset.id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {preset.label}
                    </p>
                    <p className="text-[8px] text-muted-foreground/60 font-medium mt-0.5">
                      {preset.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                'w-full p-4 rounded-xl border transition-all duration-300 text-left outline-none flex items-center justify-between',
                showAdvanced
                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/50'
                  : 'bg-background/20 border-border/50 hover:bg-background/40'
              )}
            >
              <div className="flex items-center gap-3">
                <Zap
                  className={cn(
                    'w-4 h-4',
                    showAdvanced ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div>
                  <p
                    className={cn(
                      'text-[10px] font-black uppercase tracking-wider',
                      showAdvanced ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    Tips & Info
                  </p>
                  <p className="text-[8px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                    Format compatibility notes
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  showAdvanced
                    ? 'rotate-180 text-primary'
                    : 'text-muted-foreground'
                )}
              />
            </button>

            {showAdvanced && (
              <div className="space-y-3 p-4 rounded-xl bg-card/30 border border-border/50 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2 text-[10px] text-muted-foreground font-medium leading-relaxed">
                  <p>
                    <strong className="text-foreground">MP4</strong> — Most
                    compatible format. Works everywhere: browsers, phones,
                    social media, and professional editing software.
                  </p>
                  <p>
                    <strong className="text-foreground">WebM</strong> —
                    Optimized for web. Smaller file sizes with great quality.
                    Best for website embeds and HTML5 video elements.
                  </p>
                  <p>
                    <strong className="text-foreground">MOV</strong> —
                    Apple&apos;s native format. Ideal for Final Cut Pro, iMovie,
                    and macOS workflows.
                  </p>
                  <p>
                    <strong className="text-foreground">AVI</strong> — Legacy
                    format with wide compatibility on older systems and Windows
                    applications.
                  </p>
                  <p>
                    <strong className="text-foreground">GIF</strong> — Creates
                    animated GIFs from video. Best for short clips under 15
                    seconds.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <ProgressButton
            onClick={convertAll}
            disabled={
              files.length === 0 || !toFormat || isConverting || !ffmpegLoaded
            }
            isLoading={isConverting}
            progress={progress}
            label="Convert Videos"
            loadingLabel={currentFile || 'Processing...'}
            className={cn(
              'h-14 w-full rounded-2xl shadow-md transition-all active:scale-[0.98]',
              isConverting
                ? 'bg-muted shadow-none'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            )}
            variant="default"
          >
            {!isConverting && (
              <div className="flex flex-col items-center justify-center -space-y-0.5">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  <span className="text-base font-semibold">
                    Convert Videos
                  </span>
                </div>
                <span className="text-[10px] font-medium opacity-70">
                  {files.length} {files.length === 1 ? 'file' : 'files'} →{' '}
                  {toFormat.toUpperCase()}
                </span>
              </div>
            )}
          </ProgressButton>
        </div>
      </div>

      {/* History Panel */}
      <div className="w-full max-w-[1600px] mx-auto mt-8 px-4">
        <ToolHistoryPanel
          toolType="video_converter"
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}
