'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
  Zap,
  Sparkles,
  Play,
  X,
  LayoutGrid,
  Video,
  ChevronDown,
  Monitor,
  Minimize2,
  FileVideo,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-converter';
import { ProgressButton } from '@/components/progress-button';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { loadFFmpegCore } from '@/lib/ffmpeg-loader';
import { showToast, showSuccess } from '@/lib/swal';

// --- CONFIGURATION CONSTANTS ---
const COMPRESSION_PRESETS = [
  {
    id: 'fast',
    label: 'Lightning Fast',
    preset: 'fast',
    crf: 28,
    audioBitrate: '256k',
    desc: '⚡ Balanced Speed & Quality',
  },
  {
    id: 'standard',
    label: 'Standard Pack',
    preset: 'medium',
    crf: 23,
    audioBitrate: '320k',
    desc: '📦 High Compatibility',
  },
  {
    id: 'quality',
    label: 'High Quality',
    preset: 'slow',
    crf: 20,
    audioBitrate: '512k',
    desc: '✨ Best Visual Presentation',
  },
];

const RESOLUTION_PRESETS = [
  { id: 'original', label: 'Original Resolution', desc: 'No scale down' },
  { id: '1920', label: '1080p FHD', desc: '1920x1080' },
  { id: '1280', label: '720p HD', desc: '1280x720' },
  { id: '854', label: '480p SD', desc: '854x480' },
  { id: '640', label: '360p Mobile', desc: '640x360' },
];

const CONV_OUTPUT_FORMATS = [
  { value: 'mp4', label: 'MP4 (H.264 / AAC)', mime: 'video/mp4', ext: 'mp4' },
  {
    value: 'webm',
    label: 'WebM (VP9 / Opus)',
    mime: 'video/webm',
    ext: 'webm',
  },
  {
    value: 'mov',
    label: 'MOV (QuickTime)',
    mime: 'video/quicktime',
    ext: 'mov',
  },
  {
    value: 'avi',
    label: 'AVI (Classic Video)',
    mime: 'video/x-msvideo',
    ext: 'avi',
  },
];

const CONV_QUALITY_PRESETS = [
  { id: 'high', label: 'High Quality', crf: 18, desc: 'Best visual fidelity' },
  { id: 'balanced', label: 'Balanced', crf: 23, desc: 'Good quality & size' },
  { id: 'compact', label: 'Compact', crf: 28, desc: 'Smaller file size' },
];

export function VideoHub({ initialMode = 'compressor' }) {
  const { performAction } = useAuthAction();
  const [activeTab, setActiveTab] = useState(initialMode); // 'compressor', 'converter', 'gif'

  // FFmpeg State (shared!)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef(null);

  // Initialize unified FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Video Hub]', message);
      });

      try {
        await loadFFmpegCore(ffmpeg);
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg in Video Hub:', err);
        showToast('Failed to load video engine. Please refresh.', 'error');
      }
    };

    loadFFmpeg();
  }, []);

  // --- GENERAL STATE ---
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // --- 1. VIDEO COMPRESSOR SUB-STATE ---
  const [compFile, setCompFile] = useState(null);
  const [compDurationSec, setCompDurationSec] = useState(0);
  const [compPreset, setCompPreset] = useState('standard');
  const [compResolution, setCompResolution] = useState('original');
  const [compUseTargetSize, setCompUseTargetSize] = useState(false);
  const [compTargetSizeMB, setCompTargetSizeMB] = useState('25');
  const [compIsProcessing, setCompIsProcessing] = useState(false);
  const [compProgress, setCompProgress] = useState(0);
  const [compProgressMsg, setCompProgressMsg] = useState('');
  const [compResult, setCompResult] = useState(null);
  const [compDragActive, setCompDragActive] = useState(false);
  const compFileInputRef = useRef(null);

  // Compressor File loading helper
  const handleCompFileChange = (newFile) => {
    if (!newFile || !newFile.type.startsWith('video/')) {
      showToast('Please upload a valid videofile for compression', 'error');
      return;
    }
    setCompFile(newFile);
    setCompResult(null);
    setCompProgress(0);

    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      setCompDurationSec(videoEl.duration);
    };
    videoEl.src = URL.createObjectURL(newFile);
  };

  const processVideoCompress = async () => {
    if (!compFile || !ffmpegLoaded) return;

    setCompIsProcessing(true);
    setCompProgress(0);
    setCompProgressMsg('Starting...');

    const ffmpeg = ffmpegRef.current;
    const progressHandler = ({ progress: prog }) => {
      const pct = Math.round(prog * 100);
      setCompProgress(pct);
    };
    ffmpeg.on('progress', progressHandler);

    try {
      setCompProgressMsg('Reading video source...');
      await ffmpeg.writeFile('input.mp4', await fetchFile(compFile));

      setCompProgress(5);
      setCompProgressMsg('Setting parameters...');

      const presetObj =
        COMPRESSION_PRESETS.find((p) => p.id === compPreset) ||
        COMPRESSION_PRESETS[1];
      const args = [
        '-i',
        'input.mp4',
        '-c:v',
        'libx264',
        '-preset',
        presetObj.preset,
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
      ];

      // Audio configs
      args.push(
        '-c:a',
        'aac',
        '-b:a',
        presetObj.audioBitrate,
        '-ar',
        '48000',
        '-ac',
        '2'
      );

      // Target File Size Calculations
      if (compUseTargetSize && compTargetSizeMB && compDurationSec > 0) {
        const audioBitrateKbps = parseInt(presetObj.audioBitrate);
        const totalBitrateKbps =
          (parseFloat(compTargetSizeMB) * 8192) / compDurationSec;
        const videoBitrateKbps = Math.max(
          totalBitrateKbps - audioBitrateKbps,
          150
        );
        args.push('-b:v', `${Math.round(videoBitrateKbps)}k`);
        args.push('-maxrate', `${Math.round(videoBitrateKbps * 1.5)}k`);
        args.push('-bufsize', `${Math.round(videoBitrateKbps * 2)}k`);
      } else {
        args.push('-crf', String(presetObj.crf));
      }

      // Resolution scaling
      if (compResolution !== 'original') {
        const size = parseInt(compResolution);
        if (!isNaN(size)) {
          args.push('-vf', `scale='min(${size},iw)':-2`);
        }
      }

      args.push('output.mp4');

      setCompProgress(10);
      setCompProgressMsg('Encoding video stream...');
      await ffmpeg.exec(args);

      setCompProgress(95);
      setCompProgressMsg('Saving file...');

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      let reduction = 0;
      if (compFile.size > 0) {
        reduction = Math.round(
          ((compFile.size - blob.size) / compFile.size) * 100
        );
      }

      setCompProgress(100);
      setCompProgressMsg('Completed');
      const outName = `compressed_${compFile.name}`;

      setCompResult({
        url,
        filename: outName,
        size: blob.size,
        reduction: reduction > 0 ? reduction : 0,
      });

      // Try file registry log
      try {
        const { recordMediaUpload } = await import('@/lib/media-hub');
        await recordMediaUpload({
          fileName: outName,
          fileType: 'video/mp4',
          fileSize: blob.size,
          download_url: url,
        });
      } catch (e) {}

      await saveToolHistory({
        toolType: 'video_compressor',
        fileName: compFile.name,
        fileSize: compFile.size,
        outputFormat: 'mp4',
        outputSize: blob.size,
        reductionPercent: reduction > 0 ? reduction : 0,
      });
      setHistoryRefresh((prev) => prev + 1);

      // cleanup
      try {
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('output.mp4');
      } catch (e) {}

      showSuccess('Video compressed successfully!');
    } catch (err) {
      console.error(err);
      showToast('Encoding failure. Try adjusting parameters.', 'error');
    } finally {
      ffmpeg.off('progress', progressHandler);
      setCompIsProcessing(false);
      setCompProgressMsg('');
    }
  };

  const downloadCompResult = () => {
    if (!compResult) return;
    performAction(
      () => {
        const a = document.createElement('a');
        a.href = compResult.url;
        a.download = compResult.filename;
        a.click();
      },
      { type: 'download', name: 'Compressed Video' }
    );
  };

  // --- 2. VIDEO CONVERTER SUB-STATE ---
  const [convFiles, setConvFiles] = useState([]);
  const [convToFormat, setConvToFormat] = useState('mp4');
  const [convQuality, setConvQuality] = useState('balanced');
  const [convIsConverting, setConvIsConverting] = useState(false);
  const [convProgress, setConvProgress] = useState(0);
  const [convCurrentFile, setConvCurrentFile] = useState('');
  const [convConvertedFiles, setConvConvertedFiles] = useState([]);
  const [convDragActive, setConvDragActive] = useState(false);
  const convFileInputRef = useRef(null);

  const handleConvFiles = (newFiles) => {
    const valid = Array.from(newFiles)
      .filter(
        (f) =>
          f.type.startsWith('video/') ||
          f.name.match(/\.(mp4|mkv|mov|avi|webm|flv|wmv)$/i)
      )
      .slice(0, 5);

    if (valid.length > 0) {
      setConvFiles((prev) => [...prev, ...valid].slice(0, 10));
      showSuccess(`Added ${valid.length} video(s)`);
    } else {
      showToast('Select valid video files', 'error');
    }
  };

  const getConvOutputArgs = (format, preset) => {
    const qObj =
      CONV_QUALITY_PRESETS.find((p) => p.id === preset) ||
      CONV_QUALITY_PRESETS[1];
    switch (format) {
      case 'mp4':
        return [
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-crf',
          String(qObj.crf),
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
          String(qObj.crf),
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
          String(qObj.crf),
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
          String(qObj.crf),
          '-c:a',
          'aac',
          '-b:a',
          '192k',
        ];
      default:
        return ['-c:v', 'libx264', '-crf', String(qObj.crf), '-c:a', 'aac'];
    }
  };

  const runVideoConversion = async () => {
    if (convFiles.length === 0 || !ffmpegLoaded) return;

    setConvIsConverting(true);
    setConvConvertedFiles([]);
    setConvProgress(0);

    const ffmpeg = ffmpegRef.current;
    const progressHandler = ({ progress: prog }) => {
      const pct = Math.round(prog * 100);
      if (pct > 0) setConvProgress((prev) => Math.max(prev, pct));
    };
    ffmpeg.on('progress', progressHandler);

    const results = [];

    for (let i = 0; i < convFiles.length; i++) {
      const file = convFiles[i];
      setConvCurrentFile(file.name);
      setConvProgress(Math.round(((i + 0.1) / convFiles.length) * 100));

      try {
        const inputName = `input_${i}.${file.name.split('.').pop()}`;
        const outputExt =
          CONV_OUTPUT_FORMATS.find((f) => f.value === convToFormat)?.ext ||
          'mp4';
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const outputName = `output_${i}.${outputExt}`;
        const outputFileName = `${baseName}.${outputExt}`;

        await ffmpeg.writeFile(inputName, await fetchFile(file));

        const args = [
          '-i',
          inputName,
          ...getConvOutputArgs(convToFormat, convQuality),
          outputName,
        ];
        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const mime =
          CONV_OUTPUT_FORMATS.find((f) => f.value === convToFormat)?.mime ||
          'video/mp4';
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
        console.error(error);
        results.push({ originalName: file.name, success: false });
      }
      setConvProgress(Math.round(((i + 1) / convFiles.length) * 100));
    }

    ffmpeg.off('progress', progressHandler);
    setConvConvertedFiles(results);
    setConvIsConverting(false);
    setConvCurrentFile('');
    showSuccess('Batch video re-encoding complete');

    // save history
    for (const res of results.filter((r) => r.success)) {
      try {
        await saveToolHistory({
          toolType: 'video_converter',
          fileName: res.originalName,
          fileSize: res.originalSize,
          outputFormat: convToFormat,
          outputSize: res.convertedSize,
          reductionPercent: Math.round(
            ((res.originalSize - res.convertedSize) / res.originalSize) * 100
          ),
        });
      } catch (e) {}
    }
    setHistoryRefresh((prev) => prev + 1);
  };

  const downloadAllConv = () => {
    performAction(
      () => {
        convConvertedFiles
          .filter((f) => f.success)
          .forEach((file) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(file.blob);
            a.download = file.fileName;
            a.click();
          });
      },
      { type: 'download', name: 'Batch Video Hub' }
    );
  };

  // --- 3. VIDEO-TO-GIF / GIF-TO-VIDEO SUB-STATE ---
  const [gifMode, setGifMode] = useState('video-to-gif'); // or 'gif-to-video'
  const [gifFile, setGifFile] = useState(null);
  const [gifDuration, setGifDuration] = useState(0);
  const [gifStartTime, setGifStartTime] = useState(0);
  const [gifEndTime, setGifEndTime] = useState(5);
  const [gifFps, setGifFps] = useState(10);
  const [gifScale, setGifScale] = useState(320);
  const [gifTrimEnabled, setGifTrimEnabled] = useState(false);

  // gif-to-video configs
  const [gifVideoFps, setGifVideoFps] = useState(24);
  const [gifOutputFormat, setGifOutputFormat] = useState('mp4');

  const [gifIsConverting, setGifIsConverting] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [gifResult, setGifResult] = useState(null);
  const [gifDragActive, setGifDragActive] = useState(false);
  const gifFileInputRef = useRef(null);

  const handleGifFile = (newFile) => {
    if (gifMode === 'video-to-gif') {
      if (!newFile.type.startsWith('video/')) {
        showToast(
          'Please select a valid video file in Video to GIF mode',
          'error'
        );
        return;
      }
      setGifFile(newFile);
      setGifResult(null);
      setGifProgress(0);

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setGifDuration(video.duration);
        setGifStartTime(0);
        setGifEndTime(Math.min(video.duration, 10));
        if (video.duration > 10.5) {
          showToast(
            'Videos over 10 seconds may result in large GIFs.',
            'warning'
          );
        }
      };
      video.src = URL.createObjectURL(newFile);
    } else {
      if (newFile.type !== 'image/gif' && !newFile.name.endsWith('.gif')) {
        showToast(
          'Please select a valid GIF file in GIF to Video mode',
          'error'
        );
        return;
      }
      setGifFile(newFile);
      setGifResult(null);
      setGifProgress(0);
    }
  };

  const runVideoGifCycle = async () => {
    if (!gifFile || !ffmpegLoaded) return;

    setGifIsConverting(true);
    setGifProgress(0);

    const ffmpeg = ffmpegRef.current;
    const progressHandler = ({ progress: prog }) => {
      const pct = Math.round(prog * 100);
      setGifProgress(pct);
    };
    ffmpeg.on('progress', progressHandler);

    try {
      const fileExt = gifFile.name.split('.').pop();
      const inputName = `input.${fileExt}`;

      await ffmpeg.writeFile(inputName, await fetchFile(gifFile));

      if (gifMode === 'video-to-gif') {
        const outputName = 'output.gif';
        const trimArgs = gifTrimEnabled
          ? ['-ss', String(gifStartTime), '-to', String(gifEndTime)]
          : [];

        // palettegen pass
        await ffmpeg.exec([
          ...trimArgs,
          '-i',
          inputName,
          '-vf',
          `fps=${gifFps},scale=${gifScale}:-1:flags=lanczos,palettegen`,
          'palette.png',
        ]);

        // render paletteuse pass
        await ffmpeg.exec([
          ...trimArgs,
          '-i',
          inputName,
          '-i',
          'palette.png',
          '-filter_complex',
          `fps=${gifFps},scale=${gifScale}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
          outputName,
        ]);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data.buffer], { type: 'image/gif' });
        const outputFileName = gifFile.name.replace(/\.[^.]+$/, '') + '.gif';
        const outputUrl = URL.createObjectURL(blob);

        setGifResult({
          filename: outputFileName,
          size: blob.size,
          url: outputUrl,
          blob,
        });

        // Registry Log
        try {
          const { recordMediaUpload } = await import('@/lib/media-hub');
          await recordMediaUpload({
            fileName: outputFileName,
            fileType: 'image/gif',
            fileSize: blob.size,
            download_url: outputUrl,
          });
        } catch (e) {}

        await saveToolHistory({
          toolType: 'video-to-gif',
          fileName: gifFile.name,
          fileSize: gifFile.size,
          outputFormat: 'gif',
          outputSize: blob.size,
          reductionPercent: 0,
        });

        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile('palette.png');
          await ffmpeg.deleteFile(outputName);
        } catch (e) {}
      } else {
        // gif-to-video converter
        const outputExt = gifOutputFormat;
        const outputName = `output.${outputExt}`;
        const outputMime = outputExt === 'mp4' ? 'video/mp4' : 'video/webm';

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
                'scale=trunc(iw/2)*2:trunc(ih/2)*2',
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

        await ffmpeg.exec([
          '-i',
          inputName,
          ...outputArgs,
          '-r',
          String(gifVideoFps),
          outputName,
        ]);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data.buffer], { type: outputMime });
        const outputFileName =
          gifFile.name.replace(/\.[^.]+$/, '') + `.${outputExt}`;
        const outputUrl = URL.createObjectURL(blob);

        setGifResult({
          filename: outputFileName,
          size: blob.size,
          url: outputUrl,
          blob,
        });

        await saveToolHistory({
          toolType: 'gif-to-video',
          fileName: gifFile.name,
          fileSize: gifFile.size,
          outputFormat: outputExt,
          outputSize: blob.size,
          reductionPercent: 0,
        });

        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(outputName);
        } catch (e) {}
      }

      setHistoryRefresh((prev) => prev + 1);
      showSuccess('Process successful!');
    } catch (error) {
      console.error(error);
      showToast('Failed to perform operations', 'error');
    } finally {
      ffmpeg.off('progress', progressHandler);
      setGifIsConverting(false);
    }
  };

  const downloadGifResult = () => {
    if (!gifResult) return;
    performAction(
      () => {
        const a = document.createElement('a');
        a.href = gifResult.url;
        a.download = gifResult.filename;
        a.click();
      },
      { type: 'download', name: 'GIF suites export' }
    );
  };

  return (
    <div className="w-full flex flex-col items-center select-none animate-in fade-in duration-700 font-sans">
      {/* premium hub tabs selection */}
      <div className="flex gap-2 p-1 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-md mb-8 max-w-2xl w-full">
        {['compressor', 'converter', 'gif'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer',
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-md font-bold'
                : 'text-muted-foreground hover:bg-muted/40'
            )}
          >
            {tab === 'compressor' && <Minimize2 className="w-3.5 h-3.5" />}
            {tab === 'converter' && <Video className="w-3.5 h-3.5" />}
            {tab === 'gif' && <ImageIcon className="w-3.5 h-3.5" />}
            {tab === 'compressor' && 'Compression'}
            {tab === 'converter' && 'Converting'}
            {tab === 'gif' && 'GIF Laboratory'}
          </button>
        ))}
      </div>

      {activeTab === 'compressor' &&
        // COMPRESSOR MODE
        (!compFile ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] w-full p-4">
            <div className="text-center space-y-4 mb-8">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black uppercase tracking-widest"
              >
                {ffmpegLoaded
                  ? 'Video Engine Ready'
                  : 'Initializing WebAssembly...'}
              </Badge>
              <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
                VIDEO COMPRESSOR
              </h2>
              <p className="text-muted-foreground text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
                Compress with strict size constraints • Low Loss
              </p>
            </div>

            <div
              className="w-full max-w-4xl h-[320px] rounded-[3rem] p-1 transition-all duration-500 shadow-2xl border border-border/50 hover:border-primary/30 group bg-card/45 cursor-pointer flex flex-col items-center justify-center gap-8"
              onClick={() => ffmpegLoaded && compFileInputRef.current?.click()}
            >
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 group-hover:scale-110 transition-all duration-500">
                <FileVideo className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter font-orbitron text-center uppercase">
                LOAD INSTANCE
              </h2>
              <input
                ref={compFileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => handleCompFileChange(e.target.files[0])}
                className="hidden"
                disabled={!ffmpegLoaded}
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-6 shadow-2xl relative overflow-hidden">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="rounded-[2.5rem] bg-card/30 border border-border/50 p-6 flex flex-col gap-6">
                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                  <LayoutGrid className="w-4 h-4 text-primary" /> Compression
                  Source
                </h3>
                <div className="p-4 rounded-2xl bg-background/50 border border-border/40 flex items-center justify-between font-sans">
                  <div className="flex items-center gap-3 min-w-0">
                    <Video className="w-8 h-8 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-black truncate text-foreground max-w-[300px]">
                        {compFile.name}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">
                        {formatFileSize(compFile.size)} •{' '}
                        {compDurationSec.toFixed(1)}s
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCompFile(null)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {compResult && (
                  <div className="mt-8 p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 text-center flex flex-col items-center gap-4 animate-in zoom-in duration-500 font-sans">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                        {compResult.filename}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Size: {formatFileSize(compResult.size)} (
                        <span className="text-emerald-500 font-black">
                          -{compResult.reduction}%
                        </span>
                        )
                      </p>
                    </div>
                    <video
                      src={compResult.url}
                      controls
                      className="w-full max-w-md rounded-xl mt-2 outline-none border border-emerald-500/10"
                    />
                    <Button
                      onClick={downloadCompResult}
                      className="h-12 w-full max-w-sm rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Video
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="p-6 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl space-y-6">
                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                  <Settings className="w-4 h-4" /> Parameters
                </h3>

                <div className="space-y-3 font-sans">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Target Resolution
                  </label>
                  <Select
                    value={compResolution}
                    onValueChange={setCompResolution}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-border/50 text-foreground font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOLUTION_PRESETS.map((res) => (
                        <SelectItem
                          key={res.id}
                          value={res.id}
                          className="font-bold"
                        >
                          {res.label} ({res.desc})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 font-sans">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Performance Preset
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {COMPRESSION_PRESETS.map((pr) => (
                      <button
                        key={pr.id}
                        onClick={() => setCompPreset(pr.id)}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer',
                          compPreset === pr.id
                            ? 'bg-primary/10 border-primary/50 shadow-inner'
                            : 'bg-background/25 border-border/40 hover:bg-background/40'
                        )}
                      >
                        <div>
                          <p
                            className={cn(
                              'text-[10px] font-black uppercase tracking-wider',
                              compPreset === pr.id
                                ? 'text-primary'
                                : 'text-foreground'
                            )}
                          >
                            {pr.label}
                          </p>
                          <p className="text-[8px] text-muted-foreground">
                            {pr.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between leading-none font-sans">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Set Specific File Target Size
                    </span>
                    <button
                      type="button"
                      onClick={() => setCompUseTargetSize(!compUseTargetSize)}
                      className={cn(
                        'text-[9px] font-black uppercase px-2 py-1 rounded transition-all cursor-pointer',
                        compUseTargetSize
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background'
                      )}
                    >
                      {compUseTargetSize ? 'On' : 'Off'}
                    </button>
                  </div>
                  {compUseTargetSize && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={compTargetSizeMB}
                        onChange={(e) => setCompTargetSizeMB(e.target.value)}
                        className="bg-card w-full h-11 px-3 border border-border/50 rounded-xl text-xs font-bold focus:outline-none"
                        placeholder="e.g. 25"
                      />
                      <span className="text-[10px] font-black text-muted-foreground">
                        MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <ProgressButton
                onClick={processVideoCompress}
                disabled={compIsProcessing || !ffmpegLoaded}
                isLoading={compIsProcessing}
                progress={compProgress}
                label="Compress Video"
                loadingLabel={compProgressMsg || 'Encoding...'}
                className="h-14 w-full rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-widest cursor-pointer"
              />
            </div>
          </div>
        ))}

      {activeTab === 'converter' &&
        // CONVERTER MODE
        (convFiles.length === 0 && convConvertedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] w-full p-4">
            <div className="text-center space-y-4 mb-8">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black uppercase tracking-widest"
              >
                {ffmpegLoaded ? 'Audio Engine Active' : 'Loading Engine...'}
              </Badge>
              <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
                VIDEO BATCH CONVERTER
              </h2>
              <p className="text-muted-foreground text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
                Bulk format re-encoding • WebAssembly GPU-safe
              </p>
            </div>

            <div
              className="w-full max-w-4xl h-[320px] rounded-[3rem] p-1 transition-all duration-500 shadow-2xl border border-border/50 hover:border-primary/30 group bg-card/45 cursor-pointer flex flex-col items-center justify-center gap-8"
              onClick={() => ffmpegLoaded && convFileInputRef.current?.click()}
            >
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 group-hover:scale-110 transition-all duration-500">
                <FileCode className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter font-orbitron text-center uppercase">
                DROP VIDEO BATCH
              </h2>
              <input
                ref={convFileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => handleConvFiles(e.target.files)}
                className="hidden"
                disabled={!ffmpegLoaded}
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-6 shadow-2xl relative overflow-hidden">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="rounded-[2.5rem] bg-card/30 border border-border/50 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                    <LayoutGrid className="w-4 h-4 text-primary" /> Batch
                    Converter Queue
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConvFiles([])}
                    className="text-red-500 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Clear Queue
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-2">
                  {convFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-background/45 border border-border/40 flex items-center justify-between font-sans"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Video className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <p className="text-xs font-bold truncate text-foreground max-w-[200px]">
                            {file.name}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setConvFiles((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-full cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/40">
                  <Button
                    variant="outline"
                    onClick={() => convFileInputRef.current?.click()}
                    className="w-full h-11 rounded-xl border-dashed border-2 border-border/50 text-muted-foreground hover:text-primary text-[10px] font-black uppercase tracking-widest"
                  >
                    Add Video files
                  </Button>
                </div>
              </div>

              {convConvertedFiles.length > 0 && (
                <div className="rounded-[2rem] bg-card/30 border border-border/50 p-6 animate-in zoom-in">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={downloadAllConv}
                      className="h-12 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-[9px] cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setConvFiles([]);
                        setConvConvertedFiles([]);
                      }}
                      className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                    >
                      Reset Hub
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="p-6 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl space-y-6">
                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                  <Settings className="w-4 h-4" /> Properties
                </h3>

                <div className="space-y-3 font-sans">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    To Video Format
                  </label>
                  <Select value={convToFormat} onValueChange={setConvToFormat}>
                    <SelectTrigger className="h-12 rounded-xl border-border/55 text-primary font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONV_OUTPUT_FORMATS.map((f) => (
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

                <div className="space-y-3 font-sans">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Bitrate Preservation Quality
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {CONV_QUALITY_PRESETS.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => setConvQuality(q.id)}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer',
                          convQuality === q.id
                            ? 'bg-primary/10 border-primary/50 shadow-inner'
                            : 'bg-background/25 border-border/40 hover:bg-background/40'
                        )}
                      >
                        <div>
                          <p
                            className={cn(
                              'text-[10px] font-black uppercase tracking-wider',
                              convQuality === q.id
                                ? 'text-primary'
                                : 'text-foreground'
                            )}
                          >
                            {q.label}
                          </p>
                          <p className="text-[8px] text-muted-foreground">
                            {q.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <ProgressButton
                onClick={runVideoConversion}
                disabled={
                  convIsConverting || convFiles.length === 0 || !ffmpegLoaded
                }
                isLoading={convIsConverting}
                progress={convProgress}
                label="Re-encode batch"
                loadingLabel={convCurrentFile || 'Encoding...'}
                className="h-14 w-full rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-widest cursor-pointer"
              />
            </div>
          </div>
        ))}

      {activeTab === 'gif' &&
        // GIF LAB MODE
        (!gifFile ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] w-full p-4 bg-transparent font-sans">
            <div className="text-center space-y-4 mb-8">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black uppercase tracking-widest"
              >
                {ffmpegLoaded
                  ? 'GIF Palette Engine Active'
                  : 'Loading Palette Engine...'}
              </Badge>
              <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
                GIF LABORATORY
              </h2>
              <p className="text-muted-foreground text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
                High fidelity lanczos conversion • Video To GIF & reverse
              </p>
            </div>

            <div className="flex gap-4 mb-6">
              <Button
                variant={gifMode === 'video-to-gif' ? 'default' : 'outline'}
                onClick={() => {
                  setGifMode('video-to-gif');
                  setGifFile(null);
                  setGifResult(null);
                }}
                className="rounded-xl cursor-pointer"
              >
                Video to GIF
              </Button>
              <Button
                variant={gifMode === 'gif-to-video' ? 'default' : 'outline'}
                onClick={() => {
                  setGifMode('gif-to-video');
                  setGifFile(null);
                  setGifResult(null);
                }}
                className="rounded-xl cursor-pointer"
              >
                GIF to Video
              </Button>
            </div>

            <div
              className="w-full max-w-4xl h-[280px] rounded-[3rem] p-1 transition-all duration-500 shadow-2xl border border-border/50 hover:border-primary/30 group bg-card/45 cursor-pointer flex flex-col items-center justify-center gap-6"
              onClick={() => ffmpegLoaded && gifFileInputRef.current?.click()}
            >
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 group-hover:scale-110 transition-all duration-500">
                <ImageIcon className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-black tracking-tighter font-orbitron uppercase">
                {gifMode === 'video-to-gif'
                  ? 'Upload video file'
                  : 'Upload GIF file'}
              </h2>
              <input
                ref={gifFileInputRef}
                type="file"
                accept={gifMode === 'video-to-gif' ? 'video/*' : 'image/gif'}
                onChange={(e) => handleGifFile(e.target.files[0])}
                className="hidden"
                disabled={!ffmpegLoaded}
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-6 shadow-2xl relative overflow-hidden">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="rounded-[2.5rem] bg-card/30 border border-border/50 p-6 flex flex-col gap-4 font-sans">
                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                  <LayoutGrid className="w-4 h-4 text-primary" /> Active Item
                </h3>

                <div className="p-4 rounded-xl bg-background/55 border border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {gifMode === 'video-to-gif' ? (
                      <Video className="w-8 h-8 text-primary" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-primary" />
                    )}
                    <div>
                      <p className="text-xs font-bold truncate text-foreground max-w-[200px]">
                        {gifFile.name}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground">
                        {formatFileSize(gifFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setGifFile(null)}
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {gifResult && (
                  <div className="mt-8 p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 text-center flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                        {gifResult.filename}
                      </h4>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        Size: {formatFileSize(gifResult.size)}
                      </p>
                    </div>

                    {gifMode === 'video-to-gif' ? (
                      <div className="relative max-w-sm w-full h-[240px] rounded-xl overflow-hidden border border-border/50 bg-black">
                        <Image
                          src={gifResult.url}
                          alt="GIF Output"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <video
                        src={gifResult.url}
                        controls
                        className="w-full max-w-md rounded-xl"
                      />
                    )}

                    <Button
                      onClick={downloadGifResult}
                      className="h-12 w-full max-w-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Package
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="p-6 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl space-y-6">
                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                  <Settings className="w-4 h-4" /> GIF Customizations
                </h3>

                {gifMode === 'video-to-gif' ? (
                  // Video-to-Gif details
                  <div className="space-y-4 font-sans">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Scale Target Width
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="160"
                          max="800"
                          step="10"
                          value={gifScale}
                          onChange={(e) =>
                            setGifScale(parseInt(e.target.value))
                          }
                          className="w-full accent-primary appearance-none h-2 bg-muted rounded-lg cursor-pointer"
                        />
                        <span className="text-xs font-bold text-primary shrink-0">
                          {gifScale}px
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        FPS (High frames = big size)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="5"
                          max="25"
                          step="1"
                          value={gifFps}
                          onChange={(e) => setGifFps(parseInt(e.target.value))}
                          className="w-full accent-primary appearance-none h-2 bg-muted rounded-lg cursor-pointer"
                        />
                        <span className="text-xs font-bold text-primary shrink-0">
                          {gifFps} fps
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/40 font-sans">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground leading-none">
                        Trim Video Section
                      </span>
                      <button
                        type="button"
                        onClick={() => setGifTrimEnabled(!gifTrimEnabled)}
                        className={cn(
                          'text-[9px] font-black uppercase px-2 py-1 rounded transition-all cursor-pointer',
                          gifTrimEnabled
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background'
                        )}
                      >
                        {gifTrimEnabled ? 'On' : 'Off'}
                      </button>
                    </div>

                    {gifTrimEnabled && (
                      <div className="grid grid-cols-2 gap-3 pt-2 font-sans">
                        <div>
                          <label className="text-[8px] font-bold text-muted-foreground uppercase">
                            Start (s)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={gifStartTime}
                            onChange={(e) =>
                              setGifStartTime(parseFloat(e.target.value))
                            }
                            className="bg-card w-full h-10 px-3 border border-border/50 rounded-xl text-xs font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-muted-foreground uppercase">
                            End (s)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={gifEndTime}
                            onChange={(e) =>
                              setGifEndTime(parseFloat(e.target.value))
                            }
                            className="bg-card w-full h-10 px-3 border border-border/50 rounded-xl text-xs font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Gif-to-Video parameters
                  <div className="space-y-4 font-sans">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Output Format
                      </label>
                      <Select
                        value={gifOutputFormat}
                        onValueChange={setGifOutputFormat}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-border/55 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mp4" className="font-bold">
                            MP4 Format
                          </SelectItem>
                          <SelectItem value="webm" className="font-bold">
                            WebM Format
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Playback Video FPS
                      </label>
                      <div className="flex items-center gap-2 font-bold text-primary">
                        <input
                          type="range"
                          min="12"
                          max="60"
                          value={gifVideoFps}
                          onChange={(e) =>
                            setGifVideoFps(parseInt(e.target.value))
                          }
                          className="w-full accent-primary appearance-none h-2 bg-muted rounded-lg cursor-pointer"
                        />
                        <span className="text-xs font-bold shrink-0">
                          {gifVideoFps} fps
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <ProgressButton
                onClick={runVideoGifCycle}
                disabled={gifIsConverting || !ffmpegLoaded}
                isLoading={gifIsConverting}
                progress={gifProgress}
                label="Launch Rendering"
                loadingLabel="Processing..."
                className="h-14 w-full rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-widest cursor-pointer"
              />
            </div>
          </div>
        ))}

      {/* Shared history panel for active suite type */}
      <div className="w-full mt-12 pb-12">
        <ToolHistoryPanel
          toolType={
            activeTab === 'compressor'
              ? 'video_compressor'
              : activeTab === 'converter'
                ? 'video_converter'
                : gifMode === 'video-to-gif'
                  ? 'video-to-gif'
                  : 'gif-to-video'
          }
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}
