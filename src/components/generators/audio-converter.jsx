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
  Music,
  Zap,
  X,
  LayoutGrid,
  Mic2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-converter';
import { ProgressButton } from '@/components/progress-button';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { loadFFmpegCore } from '@/lib/ffmpeg-loader';
import { showToast, showSuccess } from '@/lib/swal';

const OUTPUT_FORMATS = [
  { value: 'mp3', label: 'MP3 (Universal)', mime: 'audio/mpeg', ext: 'mp3' },
  { value: 'wav', label: 'WAV (Lossless)', mime: 'audio/wav', ext: 'wav' },
  { value: 'aac', label: 'AAC (M4A)', mime: 'audio/aac', ext: 'aac' },
  { value: 'ogg', label: 'OGG (Vorbis)', mime: 'audio/ogg', ext: 'ogg' },
];

const BITRATE_PRESETS = [
  { id: '320', label: '320kbps (HD)', desc: 'Highest quality' },
  { id: '192', label: '192kbps (Balanced)', desc: 'Standard quality' },
  { id: '128', label: '128kbps (Mobile)', desc: 'Small file size' },
  { id: '64', label: '64kbps (Mono)', desc: 'Voice/Speech only' },
];

export function AudioConverter() {
  const { performAction } = useAuthAction();
  const [files, setFiles] = useState([]);
  const [toFormat, setToFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState('192');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [convertedFiles, setConvertedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showTips, setShowTips] = useState(false);
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
        await loadFFmpegCore(ffmpeg);
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        showToast('Failed to load audio engine. Please refresh.', 'error');
      }
    };

    loadFFmpeg();
  }, []);

  const handleFiles = useCallback((newFiles) => {
    const validFiles = Array.from(newFiles)
      .filter(
        (f) =>
          f.type.startsWith('audio/') ||
          f.type.startsWith('video/') ||
          f.name.match(/\.(mp3|wav|aac|ogg|m4a|flac|wma|opus)$/i)
      )
      .slice(0, 10);

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles].slice(0, 20));
      showSuccess(`Added ${validFiles.length} file(s)`);
    } else {
      showToast('Please select valid audio files', 'error');
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

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getOutputArgs = (format, br) => {
    switch (format) {
      case 'mp3':
        return ['-c:a', 'libmp3lame', '-b:a', `${br}k`];
      case 'wav':
        return ['-c:a', 'pcm_s16le'];
      case 'aac':
        return ['-c:a', 'aac', '-b:a', `${br}k`];
      case 'ogg':
        return ['-c:a', 'libvorbis', '-b:a', `${br}k`];
      default:
        return ['-b:a', `${br}k`];
    }
  };

  const convertAll = async () => {
    if (files.length === 0 || !ffmpegLoaded) return;

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
        const inputName = `audio_in_${i}.${file.name.split('.').pop()}`;
        const outputExt =
          OUTPUT_FORMATS.find((f) => f.value === toFormat)?.ext || 'mp3';
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const outputName = `audio_out_${i}.${outputExt}`;
        const outputFileName = `${baseName}.${outputExt}`;

        await ffmpeg.writeFile(inputName, await fetchFile(file));

        const args = [
          '-i',
          inputName,
          ...getOutputArgs(toFormat, bitrate),
          outputName,
        ];
        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const mime =
          OUTPUT_FORMATS.find((f) => f.value === toFormat)?.mime ||
          'audio/mpeg';
        const blob = new Blob([data.buffer], { type: mime });

        results.push({
          fileName: outputFileName,
          originalName: file.name,
          originalSize: file.size,
          convertedSize: blob.size,
          blob,
          success: true,
        });

        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch (error) {
        results.push({ originalName: file.name, success: false });
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setConvertedFiles(results);
    setIsConverting(false);
    setCurrentFile('');
    showSuccess('Batch processing complete');

    // Save to history
    for (const res of results.filter((r) => r.success)) {
      try {
        await saveToolHistory({
          toolType: 'audio_converter',
          fileName: res.originalName,
          fileSize: res.originalSize,
          outputFormat: toFormat,
          outputSize: res.convertedSize,
          reductionPercent: Math.round(
            ((res.originalSize - res.convertedSize) / res.originalSize) * 100
          ),
        });
      } catch (e) {}
    }
    setHistoryRefresh((prev) => prev + 1);
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
      { type: 'download', name: 'Batch Audio' }
    );
  };

  if (files.length === 0 && convertedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4 mb-12">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black tracking-[0.4em] uppercase"
          >
            {ffmpegLoaded ? 'Audio Engine Active' : 'Loading Engine...'}
          </Badge>
          <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
            AUDIO CONVERTER
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
            Professional Re-Encoding • High Fidelity Output
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
              <Music className="w-16 h-16 text-primary" />
            </div>
            <div className="relative z-10 text-center space-y-3">
              <h2 className="text-3xl md:text-5xl font-black italic text-foreground tracking-tighter font-orbitron">
                DROP AUDIO
              </h2>
              <div className="inline-flex gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                <span>MP3</span>
                <span>WAV</span>
                <span>AAC</span>
                <span>M4A</span>
                <span>OGG</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              disabled={!ffmpegLoaded}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in slide-in-from-bottom-8 duration-700">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Queue */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative z-10">
          <div className="relative w-full min-h-[400px] rounded-[2.5rem] bg-card/30 border border-border/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                <LayoutGrid className="w-4 h-4 text-primary" /> Audio Queue
                <Badge
                  variant="outline"
                  className="ml-2 text-[8px] border-primary/30 text-primary"
                >
                  {files.length} ITEMS
                </Badge>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                className="text-red-500 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-widest"
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[450px] overflow-y-auto pr-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/50 group/item hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mic2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate text-foreground uppercase tracking-tight max-w-[200px]">
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
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-full"
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
                className="w-full h-12 rounded-xl border-dashed border-2 border-border/50 text-muted-foreground hover:text-primary text-[10px] font-black uppercase tracking-widest"
              >
                <CloudUpload className="w-4 h-4 mr-2" /> Add More Audio
              </Button>
            </div>
          </div>

          {convertedFiles.length > 0 && (
            <div className="rounded-[2rem] bg-card/30 border border-border/50 p-6 animate-in zoom-in">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={downloadAll}
                  className="h-12 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-[9px]"
                >
                  <Download className="w-4 h-4 mr-2" /> Download All
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiles([]);
                    setConvertedFiles([]);
                  }}
                  className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset Hub
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative z-10">
          <div className="p-6 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl space-y-6">
            <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
              <Settings className="w-4 h-4" /> Parameters
            </h3>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Format Selection
              </label>
              <Select value={toFormat} onValueChange={setToFormat}>
                <SelectTrigger className="h-12 rounded-xl border-primary/50 text-primary font-black shadow-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {OUTPUT_FORMATS.map((f) => (
                    <SelectItem
                      key={f.value}
                      value={f.value}
                      className="font-bold"
                    >
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Bitrate (kbps)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BITRATE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setBitrate(p.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      bitrate === p.id
                        ? 'bg-primary/10 border-primary/50 shadow-inner'
                        : 'bg-background/20 border-border/50 hover:bg-background/40'
                    )}
                  >
                    <p
                      className={cn(
                        'text-[10px] font-black uppercase tracking-wider',
                        bitrate === p.id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {p.label}
                    </p>
                    <p className="text-[8px] text-muted-foreground/60 font-medium">
                      {p.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full p-4 rounded-xl border border-border/50 text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Acoustic Insights
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-all',
                  showTips && 'rotate-180'
                )}
              />
            </button>
            {showTips && (
              <div className="p-4 rounded-xl bg-card/30 border border-border/50 text-[10px] text-muted-foreground leading-relaxed animate-in slide-in-from-top-2">
                <p>
                  <strong>MP3</strong> is best for maximum compatibility with
                  all players.
                </p>
                <p className="mt-2">
                  <strong>WAV</strong> provides uncompressed, lossless quality
                  but large file sizes.
                </p>
                <p className="mt-2">
                  Use <strong>320kbps</strong> for music and{' '}
                  <strong>64kbps</strong> for simple voice training modules.
                </p>
              </div>
            )}
          </div>

          <ProgressButton
            onClick={convertAll}
            disabled={files.length === 0 || isConverting || !ffmpegLoaded}
            isLoading={isConverting}
            progress={progress}
            label="Convert Audio"
            loadingLabel={currentFile || 'Converting...'}
            className="h-14 w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase"
          />
        </div>
      </div>

      <div className="w-full max-w-[1600px] mt-8">
        <ToolHistoryPanel
          toolType="audio_converter"
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}
