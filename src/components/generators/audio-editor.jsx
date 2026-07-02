'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthAction } from '@/lib/use-auth-action';
import { saveToolHistory } from '@/lib/tool-history';
import { ToolHistoryPanel } from '@/components/tool-history-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  RefreshCw,
  Play,
  Pause,
  Square,
  Scissors,
  Music,
  LayoutGrid,
  Sliders,
  Volume2,
  Undo2,
  Disc,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-converter';
import { ProgressButton } from '@/components/progress-button';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { loadFFmpegCore } from '@/lib/ffmpeg-loader';
import { showToast, showSuccess } from '@/lib/swal';

export function AudioEditor() {
  const { performAction } = useAuthAction();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

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
  const [outputFormat, setOutputFormat] = useState('mp3'); // mp3 or wav
  const [volumeGain, setVolumeGain] = useState(1.0); // multiplicative
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // speed factor
  const [fadeInDuration, setFadeInDuration] = useState(0); // seconds
  const [fadeOutDuration, setFadeOutDuration] = useState(0); // seconds
  const [reverseAudio, setReverseAudio] = useState(false);

  // Canvas Refs
  const canvasRef = useRef(null);
  const isSelectingRef = useRef(false);

  // Converted output file
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);

  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Audio]', message);
      });

      ffmpeg.on('progress', ({ progress: prog }) => {
        const pct = Math.round(prog * 100);
        setProgress(pct);
      });

      try {
        await loadFFmpegCore(ffmpeg);
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        showToast('Failed to load FFmpeg engine.', 'error');
      }
    };

    loadFFmpeg();

    return () => {
      stopAudio();
    };
  }, []);

  // Helper to decode Audio File to AudioBuffer
  const decodeAudioFile = async (audioFile) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }
      const arrayBuffer = await audioFile.arrayBuffer();
      const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      return decoded;
    } catch (e) {
      console.error('Error decoding audio context data:', e);
      throw new Error('Failed to parse audio file format.');
    }
  };

  const handleFile = useCallback(async (newFile) => {
    if (!newFile || !newFile.type.startsWith('audio/')) {
      showToast('Please select a valid audio file.', 'error');
      return;
    }

    setFile(newFile);
    setResult(null);
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
      setFile(null);
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
    if (!canvas || !audioBuffer) return;

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
      // Wavebar scale offset
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
  }, [audioBuffer, selectionStart, selectionEnd, playheadTime, duration]);

  // Canvas Mouse Actions for Selecting region
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

  // Undo edit action
  const handleUndo = () => {
    if (historyBuffers.length <= 1) {
      showToast('Already at oldest version.', 'info');
      return;
    }
    stopAudio();
    const prevHistory = [...historyBuffers];
    prevHistory.pop(); // Remove current buffer
    const prevBuffer = prevHistory[prevHistory.length - 1];

    setAudioBuffer(prevBuffer);
    setHistoryBuffers(prevHistory);
    setDuration(prevBuffer.duration);
    setSelectionStart(0);
    setSelectionEnd(prevBuffer.duration);
    setPlayheadTime(0);
    setResult(null);
    showToast('Changes Undone!', 'success');
  };

  // Convert/Apply Effects using FFmpeg
  const applyAudioEffects = async (onlyTrim = false) => {
    if (!file || !ffmpegLoaded || !audioBuffer) return;

    stopAudio();
    setIsProcessing(true);
    setProgress(0);

    const ffmpeg = ffmpegRef.current;

    try {
      // Re-read current audio context array buffer
      // In order to process edits dynamically on top of current local edits,
      // we encode the current audioBuffer as a temporary wave file, write it,
      // let ffmpeg process it, and convert/decode the result back!

      // Let's create an offline audio context to render the current selection / modifications into a WAV buffer
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // We will export the audio buffer into FFmpeg as a raw file or process via custom node mapping.
      // Easiest browser compatibility is direct WAV header generator!
      const wavBytes = bufferToWav(audioBuffer);
      await ffmpeg.writeFile('input.wav', new Uint8Array(wavBytes));

      setProgress(15);

      const filterComplex = [];
      const args = [];

      // 1. Trim / Split command details
      // If we are trimming, we can use fast -ss and -to seek flags!
      if (onlyTrim) {
        args.push('-ss', String(selectionStart), '-to', String(selectionEnd));
      }

      args.push('-i', 'input.wav');

      // Add other professional DSP filters if they are configured
      if (!onlyTrim) {
        const audioFilters = [];

        // Volume Gain filter
        if (volumeGain !== 1.0) {
          audioFilters.push(`volume=${volumeGain}`);
        }

        // Speed adjustment filter (using atempo)
        if (playbackSpeed !== 1.0) {
          // atempo must compile in sections if speed > 2.0 or speed < 0.5
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

        // Reverse Audio command mapping
        if (reverseAudio) {
          audioFilters.push('areverse');
        }

        // Fade in
        if (fadeInDuration > 0) {
          audioFilters.push(`afade=t=in:ss=0:d=${fadeInDuration}`);
        }

        // Fade out
        if (fadeOutDuration > 0) {
          const fadeStart = Math.max(0, duration - fadeOutDuration);
          audioFilters.push(`afade=t=out:st=${fadeStart}:d=${fadeOutDuration}`);
        }

        if (audioFilters.length > 0) {
          args.push('-af', audioFilters.join(','));
        }
      }

      const outputExt = outputFormat;
      const outputName = `output.${outputExt}`;
      const outputMime = outputExt === 'mp3' ? 'audio/mp3' : 'audio/wav';

      args.push(outputName);

      setProgress(40);
      await ffmpeg.exec(args);
      setProgress(85);

      // Read output
      const resultData = await ffmpeg.readFile(outputName);
      const outBlob = new Blob([resultData.buffer], { type: outputMime });
      const outUrl = URL.createObjectURL(outBlob);

      // Decode the output WAV/MP3 back into AudioBuffer to support stacking actions and updates
      const decodedBuffer = await decodeAudioFile(outBlob);
      setAudioBuffer(decodedBuffer);
      setHistoryBuffers((prev) => [...prev, decodedBuffer]);
      setDuration(decodedBuffer.duration);
      setSelectionStart(0);
      setSelectionEnd(decodedBuffer.duration);
      setPlayheadTime(0);

      // Save complete output details
      const outputFileName =
        file.name.replace(/\.[^.]+$/, '') + `_edited.${outputExt}`;
      setResult({
        url: outUrl,
        fileName: outputFileName,
        size: outBlob.size,
        blob: outBlob,
      });

      // Record download to MediaHub
      try {
        const { recordMediaUpload } = await import('@/lib/media-hub');
        await recordMediaUpload({
          fileName: outputFileName,
          fileType: outputMime,
          fileSize: outBlob.size,
          download_url: outUrl,
        });
      } catch (err) {}

      // Save to tool history
      await saveToolHistory({
        toolType: 'audio-editor',
        fileName: file.name,
        fileSize: file.size,
        outputFormat: outputFormat.toUpperCase(),
        outputSize: outBlob.size,
        reductionPercent: 0,
      });
      setHistoryRefresh((prev) => prev + 1);

      // Cleanup
      try {
        await ffmpeg.deleteFile('input.wav');
        await ffmpeg.deleteFile(outputName);
      } catch (e) {}

      setProgress(100);
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
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    performAction(
      () => {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.fileName;
        a.click();
      },
      { type: 'download', name: 'Audio Editor Output' }
    );
  };

  // WAV file exporter helper (generate PCM raw headers in client)
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

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // chunk length
    setUint16(1); // sample format (raw PCM)
    setUint16(numOfChan); // channel count
    setUint32(buffer.sampleRate); // sample rate
    setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate (sample rate * block align)
    setUint16(numOfChan * 2); // block align (channel count * bytes per sample)
    setUint16(16); // bits per sample (16-bit)

    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        // clamp sample values
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        // convert to 16-bit signed integer
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

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4 mb-12">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black tracking-[0.4em] uppercase"
          >
            {ffmpegLoaded ? 'Audio Studio Ready' : 'Spawning Native Engine...'}
          </Badge>
          <h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
            AUDIO LAB & EDITOR
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
            Professional Multi-Filter Waveform Studio • Private & High-Fidelity
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
              <Music className="w-16 h-16 text-primary animate-pulse" />
            </div>
            <div className="relative z-10 text-center space-y-3">
              <h2 className="text-3xl md:text-5xl font-black italic text-foreground tracking-tighter font-orbitron text-center uppercase">
                LOAD AUDIOMASS
              </h2>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Interactive Waveform Editing
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  MP3 • WAV • OGG • AAC • FLAC
                </span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
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
    <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in slide-in-from-bottom-8 duration-700 font-sans">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-6 shadow-2xl relative overflow-hidden">
        {/* Left Column: Waveform Editor & Workspace */}
        <div className="lg:col-span-7 flex flex-col gap-6 relative z-10">
          <div className="relative w-full rounded-[2.5rem] bg-card/30 border border-border/50 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
                <LayoutGrid className="w-4 h-4 text-primary" /> Waveform
                Workspace
              </h3>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="text-[9px] font-black border-border/50 bg-background/50 uppercase"
                >
                  {duration.toFixed(2)}s Duration
                </Badge>
                {historyBuffers.length > 1 && (
                  <button
                    onClick={handleUndo}
                    className="p-1 px-3 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/20"
                  >
                    <Undo2 className="w-3 h-3" /> Undo (
                    {historyBuffers.length - 1})
                  </button>
                )}
              </div>
            </div>

            {/* WAVEFORM CANVAS */}
            <div className="relative bg-background/80 rounded-[2rem] border border-border/50 p-4 shadow-inner overflow-hidden select-none hover:shadow-indigo-500/5 hover:border-violet-500/25 transition-all">
              <div className="absolute top-2 left-4 text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                Right-click or drag mouse cursors to select trim zones
              </div>
              <canvas
                ref={canvasRef}
                width={700}
                height={200}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="w-full h-[200px] cursor-col-resize block"
              />
            </div>

            {/* Waveform Controls */}
            <div className="flex items-center justify-between p-4 rounded-[2rem] bg-card/40 border border-border/50 shadow-inner">
              <div className="flex gap-2">
                <Button
                  onClick={startAudio}
                  className="rounded-xl h-10 w-24 bg-primary text-primary-foreground font-black text-[10px] tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Play
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    stopAudio();
                    setPlayheadTime(selectionStart);
                  }}
                  variant="outline"
                  className="rounded-xl h-10 w-24 border-border/50 text-[10px] font-black tracking-wider uppercase flex items-center justify-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop
                </Button>
              </div>

              {/* Selection readout */}
              <div className="text-right">
                <p className="text-[7px] uppercase tracking-widest text-muted-foreground font-black">
                  Selection Area
                </p>
                <p className="text-[10px] font-mono font-black text-foreground/80 mt-0.5">
                  {selectionStart.toFixed(2)}s - {selectionEnd.toFixed(2)}s (
                  {(selectionEnd - selectionStart).toFixed(2)}s)
                </p>
              </div>
            </div>

            {/* Quick Trim Action */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => applyAudioEffects(true)}
                disabled={isProcessing || selectionEnd - selectionStart < 0.1}
                className="h-12 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 border-t border-white/20 shadow-md transition-all active:scale-95"
              >
                <Scissors className="w-4 h-4" /> Trim Selected Section
              </Button>
              <Button
                onClick={() => {
                  setSelectionStart(0);
                  setSelectionEnd(duration);
                  setPlayheadTime(0);
                }}
                variant="outline"
                className="h-12 rounded-xl border-2 border-border/50 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Reset Selection
              </Button>
            </div>

            {/* Rendered output area */}
            {result && (
              <div className="mt-4 p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Disc className="w-8 h-8 text-emerald-500 animate-spin-slow" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-1">
                    Export Output Rendered
                  </p>
                  <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                    {result.fileName} • {formatFileSize(result.size)}
                  </p>
                </div>
                <audio src={result.url} controls className="w-full max-w-md" />
                <Button
                  onClick={handleDownload}
                  className="h-14 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 border-t border-white/20"
                >
                  <Download className="w-5 h-5 mr-3" /> Download Encoded Audio
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: DSP Sliders & Settings */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative z-10">
          <div className="p-8 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl space-y-7">
            <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground bg-black/10 p-3 rounded-xl border border-white/5">
              <Sliders className="w-4 h-4 text-primary" /> Audiomass Processors
            </h3>

            {/* Volume Gain Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground pl-1">
                <span>Amplification Gain</span>
                <span className="text-primary font-mono">
                  {volumeGain.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={volumeGain}
                onChange={(e) => setVolumeGain(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer focus:outline-none"
              />
            </div>

            {/* Playback Speed Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground pl-1">
                <span>Speed Pitch Ratio</span>
                <span className="text-primary font-mono">
                  {playbackSpeed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer focus:outline-none"
              />
            </div>

            {/* Fade In Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground pl-1">
                <span>Fade In Duration</span>
                <span className="text-primary font-mono">
                  {fadeInDuration.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.min(10, duration / 2)}
                step="0.5"
                value={fadeInDuration}
                onChange={(e) => setFadeInDuration(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer focus:outline-none font-mono"
              />
            </div>

            {/* Fade Out Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground pl-1">
                <span>Fade Out Duration</span>
                <span className="text-primary font-mono">
                  {fadeOutDuration.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.min(10, duration / 2)}
                step="0.5"
                value={fadeOutDuration}
                onChange={(e) => setFadeOutDuration(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer focus:outline-none"
              />
            </div>

            {/* Reverse toggler */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground leading-none">
                  Reverse Audio Effect
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReverseAudio(!reverseAudio)}
                className={cn(
                  'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-all leading-none focus:outline-none',
                  reverseAudio
                    ? 'bg-orange-500 text-white'
                    : 'bg-background/20 text-muted-foreground border border-border/50 hover:bg-background/40'
                )}
              >
                {reverseAudio ? 'Active' : 'Disabled'}
              </button>
            </div>

            {/* Export format selects */}
            <div className="space-y-3 border-t border-border pt-5">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                Export Encoded Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'mp3', label: 'MP3 Output' },
                  { value: 'wav', label: 'WAV Studio Lossless' },
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

            {/* Processing actions */}
            <div className="pt-4 space-y-4">
              <ProgressButton
                onClick={() => applyAudioEffects(false)}
                disabled={isProcessing || !ffmpegLoaded}
                isLoading={isProcessing}
                progress={progress}
                label="Apply Audio Filters"
                loadingLabel="Rendering Waveform..."
                className="h-16 w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/10"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setAudioBuffer(null);
              setHistoryBuffers([]);
              setDuration(0);
              setSelectionStart(0);
              setSelectionEnd(0);
              setPlayheadTime(0);
              setResult(null);
              setVolumeGain(1.0);
              setPlaybackSpeed(1.0);
              setFadeInDuration(0);
              setFadeOutDuration(0);
              setReverseAudio(false);
            }}
            className="h-14 rounded-2xl border-2 border-border/50 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Start Over
          </Button>
        </div>
      </div>

      <div className="w-full mt-12 pb-12">
        <ToolHistoryPanel
          toolType="audio-editor"
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}
