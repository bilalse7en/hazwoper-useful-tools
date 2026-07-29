'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioEditor } from './audio-editor';
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
  Play,
  Pause,
  Square,
  Scissors,
  Sliders,
  Volume2,
  Undo2,
  Disc,
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

export function AudioHub({ initialMode = 'converter' }) {
  const { performAction } = useAuthAction();
  const [activeTab, setActiveTab] = useState(initialMode); // 'converter' or 'editor'

  // FFmpeg State (Shared!)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef(null);

  // Initialize unified FFmpeg instance
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Audio Hub]', message);
      });

      try {
        await loadFFmpegCore(ffmpeg);
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg in Hub:', err);
        showToast('Failed to load audio engine. Please refresh.', 'error');
      }
    };

    loadFFmpeg();

    return () => {
      // stop any playing audio from editor if unmounting
      stopAudio();
    };
  }, []);

  // --- AUDIO CONVERTER SUB-STATE & HANDLERS ---
  const [convFiles, setConvFiles] = useState([]);
  const [convToFormat, setConvToFormat] = useState('mp3');
  const [convBitrate, setConvBitrate] = useState('192');
  const [convIsConverting, setConvIsConverting] = useState(false);
  const [convProgress, setConvProgress] = useState(0);
  const [convCurrentFile, setConvCurrentFile] = useState('');
  const [convConvertedFiles, setConvConvertedFiles] = useState([]);
  const [convDragActive, setConvDragActive] = useState(false);
  const [convShowTips, setConvShowTips] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const convFileInputRef = useRef(null);

  const handleConvFiles = useCallback((newFiles) => {
    const validFiles = Array.from(newFiles)
      .filter(
        (f) =>
          f.type.startsWith('audio/') ||
          f.type.startsWith('video/') ||
          f.name.match(/\.(mp3|wav|aac|ogg|m4a|flac|wma|opus)$/i)
      )
      .slice(0, 10);

    if (validFiles.length > 0) {
      setConvFiles((prev) => [...prev, ...validFiles].slice(0, 20));
      showSuccess(`Added ${validFiles.length} file(s)`);
    } else {
      showToast('Please select valid audio files', 'error');
    }
  }, []);

  const handleConvDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setConvDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleConvDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setConvDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleConvFiles(e.dataTransfer.files);
      }
    },
    [handleConvFiles]
  );

  const removeConvFile = (index) => {
    setConvFiles((prev) => prev.filter((_, i) => i !== index));
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
    if (convFiles.length === 0 || !ffmpegLoaded) return;

    setConvIsConverting(true);
    setConvConvertedFiles([]);
    setConvProgress(0);
    const results = [];
    const ffmpeg = ffmpegRef.current;

    // Attach progress listener specifically for conversion loop
    const progressHandler = ({ progress: prog }) => {
      const pct = Math.round(prog * 100);
      if (pct > 0) setConvProgress((prev) => Math.max(prev, pct));
    };
    ffmpeg.on('progress', progressHandler);

    for (let i = 0; i < convFiles.length; i++) {
      const file = convFiles[i];
      setConvCurrentFile(file.name);
      setConvProgress(Math.round(((i + 0.1) / convFiles.length) * 100));

      try {
        const inputName = `audio_in_${i}.${file.name.split('.').pop()}`;
        const outputExt =
          OUTPUT_FORMATS.find((f) => f.value === convToFormat)?.ext || 'mp3';
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const outputName = `audio_out_${i}.${outputExt}`;
        const outputFileName = `${baseName}.${outputExt}`;

        await ffmpeg.writeFile(inputName, await fetchFile(file));

        const args = [
          '-i',
          inputName,
          ...getOutputArgs(convToFormat, convBitrate),
          outputName,
        ];
        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const mime =
          OUTPUT_FORMATS.find((f) => f.value === convToFormat)?.mime ||
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
        console.error(error);
        results.push({ originalName: file.name, success: false });
      }
      setConvProgress(Math.round(((i + 1) / convFiles.length) * 100));
    }

    // cleanup listener
    ffmpeg.off('progress', progressHandler);

    setConvConvertedFiles(results);
    setConvIsConverting(false);
    setConvCurrentFile('');
    showSuccess('Batch processing complete');

    // Save to history
    for (const res of results.filter((r) => r.success)) {
      try {
        await saveToolHistory({
          toolType: 'audio_converter',
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
      { type: 'download', name: 'Batch Audio' }
    );
  };

  // --- AUDIO EDITOR SUB-STATE & HANDLERS ---
  const [editFile, setEditFile] = useState(null);
  const [editIsProcessing, setEditIsProcessing] = useState(false);
  const [editProgress, setEditProgress] = useState(0);
  const [editDragActive, setEditDragActive] = useState(false);

  // Audio Context and Buffers (for Waveform & Playback)
  const audioCtxRef = useRef(null);
  const playSourceRef = useRef(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [historyBuffers, setHistoryBuffers] = useState([]); // Undo stack
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback & Selection State
  const [selectionStart, setSelectionStart] = useState(0); // in seconds
  const [selectionEnd, setSelectionEnd] = useState(0); // in seconds
  const [playheadTime, setPlayheadTime] = useState(0); // in seconds
  const playheadIntervalRef = useRef(null);
  const playbackStartTimeRef = useRef(0);
  const elapsedOffsetRef = useRef(0);

  // Settings
  const [editOutputFormat, setEditOutputFormat] = useState('mp3'); // mp3 or wav
  const [volumeGain, setVolumeGain] = useState(1.0); // multiplicative
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // speed factor
  const [fadeInDuration, setFadeInDuration] = useState(0); // seconds
  const [fadeOutDuration, setFadeOutDuration] = useState(0); // seconds
  const [reverseAudio, setReverseAudio] = useState(false);

  // Canvas Refs
  const canvasRef = useRef(null);
  const isSelectingRef = useRef(false);

  // Converted output file
  const [editResult, setEditResult] = useState(null);
  const editFileInputRef = useRef(null);

  // Helper to decode Audio File to AudioBuffer
  const decodeAudioFile = async (fileToDecode) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }
      const arrayBuffer = await fileToDecode.arrayBuffer();
      const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      return decoded;
    } catch (e) {
      console.error('Error decoding audio context data:', e);
      throw new Error('Failed to parse audio file format.');
    }
  };

  const handleEditFile = useCallback(async (newFile) => {
    if (!newFile || !newFile.type.startsWith('audio/')) {
      showToast('Please select a valid audio file.', 'error');
      return;
    }

    setEditFile(newFile);
    setEditResult(null);
    stopAudio();

    try {
      const decoded = await decodeAudioFile(newFile);
      setAudioBuffer(decoded);
      setHistoryBuffers([decoded]);
      setDuration(decoded.duration);
      setSelectionStart(0);
      setSelectionEnd(decoded.duration);
      setPlayheadTime(0);
    } catch (err) {
      showToast(err.message, 'error');
      setEditFile(null);
    }
  }, []);

  const handleEditDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleEditDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setEditDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleEditFile(e.dataTransfer.files[0]);
      }
    },
    [handleEditFile]
  );

  // Playback Control
  const startAudio = () => {
    if (!audioBuffer) return;
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    const ctx = audioCtxRef.current;

    // Resumes context if suspended (browser security policies)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const startOffset =
      playheadTime >= selectionEnd || playheadTime < selectionStart
        ? selectionStart
        : playheadTime;
    const playLength = selectionEnd - startOffset;

    source.start(0, startOffset, playLength);
    playSourceRef.current = source;
    setIsPlaying(true);
    playbackStartTimeRef.current = ctx.currentTime;
    elapsedOffsetRef.current = startOffset;

    // Update playhead on animation loop or interval
    playheadIntervalRef.current = setInterval(() => {
      const elapsed = ctx.currentTime - playbackStartTimeRef.current;
      const currentPos = elapsedOffsetRef.current + elapsed;

      if (currentPos >= selectionEnd) {
        stopAudio();
        setPlayheadTime(selectionStart);
      } else {
        setPlayheadTime(currentPos);
      }
    }, 50);

    source.onended = () => {
      // Re-verify after natural file end
      if (ctx.currentTime - playbackStartTimeRef.current >= playLength) {
        stopAudio();
        setPlayheadTime(selectionStart);
      }
    };
  };

  const stopAudio = () => {
    if (playSourceRef.current) {
      try {
        playSourceRef.current.stop();
      } catch (e) {}
      playSourceRef.current = null;
    }
    if (playheadIntervalRef.current) {
      clearInterval(playheadIntervalRef.current);
      playheadIntervalRef.current = null;
    }
    setIsPlaying(false);
  };

  // Redraw Canvas on Buffer or head state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer || activeTab !== 'editor') return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Background clearing
    ctx.clearRect(0, 0, width, height);

    // Get channel data
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    // Grid details
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Drawing wave bars
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const currentTime = (i / width) * duration;
      const isSelected =
        currentTime >= selectionStart && currentTime <= selectionEnd;

      // Color selection styles
      if (isSelected) {
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.85)'; // Primary light violet/purple
      } else {
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)'; // Muted light grey
      }

      ctx.beginPath();
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
      ctx.stroke();
    }

    // Drawing Playhead
    const playheadPos = (playheadTime / duration) * width;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'; // Red playhead laser
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadPos, 0);
    ctx.lineTo(playheadPos, height);
    ctx.stroke();

    // Small laser playhead dot
    ctx.fillStyle = 'rgba(239, 68, 68, 1)';
    ctx.beginPath();
    ctx.arc(playheadPos, 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [
    audioBuffer,
    selectionStart,
    selectionEnd,
    playheadTime,
    duration,
    activeTab,
  ]);

  const handleCanvasMouseDown = (e) => {
    if (!audioBuffer) return;
    stopAudio();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;

    isSelectingRef.current = true;
    setSelectionStart(time);
    setSelectionEnd(time);
    setPlayheadTime(time);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isSelectingRef.current || !audioBuffer) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min((x / rect.width) * duration, duration));

    if (time < selectionStart) {
      setSelectionStart(time);
    } else {
      setSelectionEnd(time);
    }
  };

  const handleCanvasMouseUp = () => {
    isSelectingRef.current = false;
  };

  const handleUndo = () => {
    if (historyBuffers.length <= 1) {
      showToast('Already at oldest version.', 'info');
      return;
    }
    stopAudio();
    const prevHistory = [...historyBuffers];
    prevHistory.pop();
    const prevBuffer = prevHistory[prevHistory.length - 1];

    setAudioBuffer(prevBuffer);
    setHistoryBuffers(prevHistory);
    setDuration(prevBuffer.duration);
    setSelectionStart(0);
    setSelectionEnd(prevBuffer.duration);
    setPlayheadTime(0);
    setEditResult(null);
    showToast('Changes Undone!', 'success');
  };

  const applyAudioEffects = async (onlyTrim = false) => {
    if (!editFile || !ffmpegLoaded || !audioBuffer) return;

    stopAudio();
    setEditIsProcessing(true);
    setEditProgress(0);

    const ffmpeg = ffmpegRef.current;

    // Attach progress listener specifically for editor
    const progressHandler = ({ progress: prog }) => {
      const pct = Math.round(prog * 100);
      setEditProgress(pct);
    };
    ffmpeg.on('progress', progressHandler);

    try {
      const wavBytes = bufferToWav(audioBuffer);
      await ffmpeg.writeFile('input.wav', new Uint8Array(wavBytes));
      setEditProgress(15);

      const args = [];

      if (onlyTrim) {
        args.push('-ss', String(selectionStart), '-to', String(selectionEnd));
      }

      args.push('-i', 'input.wav');

      if (!onlyTrim) {
        const audioFilters = [];

        if (volumeGain !== 1.0) {
          audioFilters.push(`volume=${volumeGain}`);
        }

        if (playbackSpeed !== 1.0) {
          let speedVal = playbackSpeed;
          while (speedVal > 2.0) {
            audioFilters.push('atempo=2.0');
            speedVal /= 2.0;
          }
          while (speedVal < 0.5) {
            audioFilters.push('atempo=0.5');
            speedVal /= 0.5;
          }
          audioFilters.push(`atempo=${speedVal.toFixed(2)}`);
        }

        if (reverseAudio) {
          audioFilters.push('areverse');
        }

        if (fadeInDuration > 0) {
          audioFilters.push(`afade=t=in:ss=0:d=${fadeInDuration}`);
        }

        if (fadeOutDuration > 0) {
          const fadeStart = Math.max(0, duration - fadeOutDuration);
          audioFilters.push(`afade=t=out:st=${fadeStart}:d=${fadeOutDuration}`);
        }

        if (audioFilters.length > 0) {
          args.push('-af', audioFilters.join(','));
        }
      }

      const outputExt = editOutputFormat;
      const outputName = `output.${outputExt}`;
      const outputMime = outputExt === 'mp3' ? 'audio/mp3' : 'audio/wav';

      args.push(outputName);

      setEditProgress(40);
      await ffmpeg.exec(args);
      setEditProgress(85);

      const resultData = await ffmpeg.readFile(outputName);
      const outBlob = new Blob([resultData.buffer], { type: outputMime });
      const outUrl = URL.createObjectURL(outBlob);

      const decodedBuffer = await decodeAudioFile(outBlob);
      setAudioBuffer(decodedBuffer);
      setHistoryBuffers((prev) => [...prev, decodedBuffer]);
      setDuration(decodedBuffer.duration);
      setSelectionStart(0);
      setSelectionEnd(decodedBuffer.duration);
      setPlayheadTime(0);

      const outputFileName =
        editFile.name.replace(/\.[^.]+$/, '') + `_edited.${outputExt}`;
      setEditResult({
        url: outUrl,
        fileName: outputFileName,
        size: outBlob.size,
        blob: outBlob,
      });

      // Try to register in media library
      try {
        const { recordMediaUpload } = await import('@/lib/media-hub');
        await recordMediaUpload({
          fileName: outputFileName,
          fileType: outputMime,
          fileSize: outBlob.size,
          download_url: outUrl,
        });
      } catch (err) {}

      await saveToolHistory({
        toolType: 'audio-editor',
        fileName: editFile.name,
        fileSize: editFile.size,
        outputFormat: editOutputFormat.toUpperCase(),
        outputSize: outBlob.size,
        reductionPercent: 0,
      });
      setHistoryRefresh((prev) => prev + 1);

      try {
        await ffmpeg.deleteFile('input.wav');
        await ffmpeg.deleteFile(outputName);
      } catch (e) {}

      setEditProgress(100);
      showSuccess(
        onlyTrim ? 'Trimmed successfully!' : 'Filters applied successfully!'
      );
    } catch (error) {
      console.error(error);
      showToast(
        'Failed to apply audio effects. Ensure durations match sample bounds.',
        'error'
      );
    } finally {
      ffmpeg.off('progress', progressHandler);
      setEditIsProcessing(false);
    }
  };

  const handleDownloadEdit = () => {
    if (!editResult) return;
    performAction(
      () => {
        const a = document.createElement('a');
        a.href = editResult.url;
        a.download = editResult.fileName;
        a.click();
      },
      { type: 'download', name: 'Audio Editor Output' }
    );
  };

  const bufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);

    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return bufferArr;

    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none animate-in fade-in duration-700">
      {/* Premium Header Mode Toggles */}
      <div className="flex gap-4 p-1 rounded-2xl bg-card/60 border border-border/50 backdrop-blur-md mb-8 max-w-lg w-full">
        <button
          onClick={() => {
            stopAudio();
            setActiveTab('converter');
          }}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'converter'
              ? 'bg-primary text-primary-foreground shadow-md font-bold'
              : 'text-muted-foreground hover:bg-muted/40'
          )}
        >
          <Music className="w-4 h-4" /> Converting Options
        </button>
        <button
          onClick={() => {
            setActiveTab('editor');
          }}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'editor'
              ? 'bg-primary text-primary-foreground shadow-md font-bold'
              : 'text-muted-foreground hover:bg-muted/40'
          )}
        >
          <Sliders className="w-4 h-4" /> Editing Options
        </button>
      </div>

      {activeTab === 'converter' ? (
        // --- CONVERTER WORKSPACE ---
        convFiles.length === 0 && convConvertedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] w-full p-4">
            <div className="text-center space-y-4 mb-8">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black tracking-[0.4em] uppercase"
              >
                {ffmpegLoaded ? 'Audio Engine Active' : 'Loading Engine...'}
              </Badge>
              <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
                BATCH CONVERTER
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
                Bulk Audio Output • High-Speed WebAssembly
              </p>
            </div>

            <div
              className={cn(
                'w-full max-w-4xl h-[320px] rounded-[3rem] p-1 transition-all duration-500 shadow-2xl',
                convDragActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'
              )}
              onDragEnter={handleConvDrag}
              onDragLeave={handleConvDrag}
              onDragOver={handleConvDrag}
              onDrop={handleConvDrop}
            >
              <div
                className={cn(
                  'relative w-full h-full bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-border/50 overflow-hidden flex flex-col items-center justify-center gap-8 transition-all duration-500 group cursor-pointer',
                  convDragActive
                    ? 'bg-primary/5 border-primary/50'
                    : 'hover:bg-card/60 hover:border-primary/30',
                  !ffmpegLoaded && 'opacity-50 cursor-wait'
                )}
                onClick={() =>
                  ffmpegLoaded && convFileInputRef.current?.click()
                }
              >
                <div className="relative z-10 p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 shadow-lg group-hover:scale-110 transition-all duration-500">
                  <Music className="w-12 h-12 text-primary" />
                </div>
                <div className="relative z-10 text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black italic text-foreground tracking-tighter font-orbitron">
                    DROP FILES
                  </h2>
                  <div className="inline-flex gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    <span>MP3</span>
                    <span>WAV</span>
                    <span>AAC</span>
                    <span>M4A</span>
                    <span>OGG</span>
                  </div>
                </div>
                <input
                  ref={convFileInputRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => handleConvFiles(e.target.files)}
                  className="hidden"
                  disabled={!ffmpegLoaded}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Converter: Left Queue */}
            <div className="lg:col-span-7 flex flex-col gap-6 relative z-10">
              <div className="relative w-full min-h-[400px] rounded-[2.5rem] bg-card/30 border border-border/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                    <LayoutGrid className="w-4 h-4 text-primary" /> Converter
                    Queue
                    <Badge
                      variant="outline"
                      className="ml-2 text-[8px] border-primary/30 text-primary"
                    >
                      {convFiles.length} ITEMS
                    </Badge>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConvFiles([])}
                    className="text-red-500 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-widest"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-2">
                  {convFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/50 group/item hover:border-primary/30 transition-all font-sans"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Mic2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 font-sans">
                          <p className="text-xs font-black truncate text-foreground uppercase tracking-tight max-w-[240px]">
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
                        onClick={() => removeConvFile(index)}
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
                    onClick={() => convFileInputRef.current?.click()}
                    className="w-full h-12 rounded-xl border-dashed border-2 border-border/50 text-muted-foreground hover:text-primary text-[10px] font-black uppercase tracking-widest"
                  >
                    <CloudUpload className="w-4 h-4 mr-2" /> Add More Audio
                  </Button>
                </div>
              </div>

              {convConvertedFiles.length > 0 && (
                <div className="rounded-[2rem] bg-card/30 border border-border/50 p-6 animate-in zoom-in">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={downloadAllConv}
                      className="h-12 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-[9px]"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download All
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setConvFiles([]);
                        setConvConvertedFiles([]);
                      }}
                      className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Reset Hub
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Converter: Right Controls */}
            <div className="lg:col-span-5 flex flex-col gap-6 relative z-10">
              <div className="p-6 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl space-y-6">
                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                  <Settings className="w-4 h-4 font-bold" /> Parameters
                </h3>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    Format Selection
                  </label>
                  <Select value={convToFormat} onValueChange={setConvToFormat}>
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
                    BitratePresets Settings
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {BITRATE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setConvBitrate(p.id)}
                        className={cn(
                          'p-3 rounded-xl border text-left transition-all cursor-pointer',
                          convBitrate === p.id
                            ? 'bg-primary/10 border-primary/50 shadow-inner'
                            : 'bg-background/20 border-border/50 hover:bg-background/40'
                        )}
                      >
                        <p
                          className={cn(
                            'text-[10px] font-black uppercase tracking-wider',
                            convBitrate === p.id
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
                  type="button"
                  onClick={() => setConvShowTips(!convShowTips)}
                  className="w-full p-4 rounded-xl border border-border/50 text-left flex items-center justify-between cursor-pointer"
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
                      convShowTips && 'rotate-180'
                    )}
                  />
                </button>
                {convShowTips && (
                  <div className="p-4 rounded-xl bg-card/30 border border-border/50 text-[10px] text-muted-foreground leading-relaxed animate-in slide-in-from-top-2">
                    <p>
                      <strong>MP3</strong> is best for maximum compatibility
                      with all players.
                    </p>
                    <p className="mt-2">
                      <strong>WAV</strong> provides uncompressed, lossless
                      quality but large file sizes.
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
                disabled={
                  convFiles.length === 0 || convIsConverting || !ffmpegLoaded
                }
                isLoading={convIsConverting}
                progress={convProgress}
                label="Convert Audio"
                loadingLabel={convCurrentFile || 'Converting...'}
                className="h-14 w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase cursor-pointer"
              />
            </div>
          </div>
        )
      ) : (
        <AudioEditor />
      )}

      {/* Shared History Panel */}
      <div className="w-full mt-12 pb-12">
        <ToolHistoryPanel
          toolType={
            activeTab === 'converter' ? 'audio_converter' : 'audio-editor'
          }
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}
