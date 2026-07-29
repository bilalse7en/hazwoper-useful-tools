'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthAction } from '@/lib/use-auth-action';
import { saveToolHistory } from '@/lib/tool-history';
import { ToolHistoryPanel } from '@/components/tool-history-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Download,
  RefreshCw,
  Play,
  Pause,
  Square,
  Scissors,
  Music,
  Sliders,
  Volume2,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  VolumeX,
  RotateCcw,
  Zap,
  Radio,
  Sparkles,
  HelpCircle,
  FileAudio,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  X,
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

  // Audio Context and Buffers
  const audioCtxRef = useRef(null);
  const playSourceRef = useRef(null);
  const analyserRef = useRef(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [clipboardBuffer, setClipboardBuffer] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Playback & Selection State
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [playheadTime, setPlayheadTime] = useState(0);
  const playheadIntervalRef = useRef(null);
  const playbackStartTimeRef = useRef(0);
  const elapsedOffsetRef = useRef(0);

  // Zoom & Display Controls
  const [zoomH, setZoomH] = useState(1); // 1 to 5x
  const [zoomV, setZoomV] = useState(1); // 0.5 to 3x

  // Realtime Volume VU Meter State
  const [vuLevel, setVuLevel] = useState(0); // 0 to 100
  const animFrameRef = useRef(null);

  // Menus & Modals
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'export', 'gain', 'fade', 'speed', 'help', 'url'

  // Effect Controls
  const [gainDb, setGainDb] = useState(0); // -20 to +20 dB
  const [fadeInSec, setFadeInSec] = useState(2);
  const [fadeOutSec, setFadeOutSec] = useState(2);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [exportFormat, setExportFormat] = useState('mp3');
  const [exportBitrate, setExportBitrate] = useState('192');
  const [urlInput, setUrlInput] = useState('');

  // Output details
  const [result, setResult] = useState(null);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);
  const isSelectingRef = useRef(false);

  // Load FFmpeg
  useEffect(() => {
    const loadEngine = async () => {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }) =>
        console.log('[FFmpeg AudioMass]', message)
      );
      ffmpeg.on('progress', ({ progress: prog }) => {
        setProgress(Math.round(prog * 100));
      });
      try {
        await loadFFmpegCore(ffmpeg);
        setFfmpegLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg engine:', err);
        showToast('Engine loading fallback mode ready.', 'info');
      }
    };
    loadEngine();
    return () => {
      stopAudio();
    };
  }, []);
  // Helper to decode Audio File
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
      console.error('Error decoding audio:', e);
      throw new Error('Failed to parse audio file format.');
    }
  };

  const handleFile = useCallback(async (newFile) => {
    if (!newFile) return;
    setFile(newFile);
    setResult(null);
    stopAudio();
    try {
      const decoded = await decodeAudioFile(newFile);
      setAudioBuffer(decoded);
      setUndoStack([decoded]);
      setRedoStack([]);
      setDuration(decoded.duration);
      setSelectionStart(0);
      setSelectionEnd(decoded.duration);
      setPlayheadTime(0);
      showSuccess(`Loaded: ${newFile.name}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, []);

  // Load Built-In Sample Audio
  const loadSampleAudio = async () => {
    try {
      stopAudio();
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      const sampleRate = ctx.sampleRate;
      const sampleDuration = 4.0;
      const buffer = ctx.createBuffer(
        2,
        sampleRate * sampleDuration,
        sampleRate
      );
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const freq = 220 + Math.sin(t * 4) * 110;
        const envelope = Math.exp(-t * 0.5) * (1 - Math.exp(-t * 10));
        left[i] = Math.sin(2 * Math.PI * freq * t) * 0.4 * envelope;
        right[i] = Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.4 * envelope;
      }

      setAudioBuffer(buffer);
      setUndoStack([buffer]);
      setRedoStack([]);
      setDuration(buffer.duration);
      setSelectionStart(0);
      setSelectionEnd(buffer.duration);
      setPlayheadTime(0);
      setFile(new File([], 'sample_synth.wav', { type: 'audio/wav' }));
      showSuccess('Sample audio synthesizer loaded!');
    } catch (e) {
      showToast('Could not load sample audio.', 'error');
    }
  };

  // Playback Control
  function startAudio() {
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
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = isLooping;

    // Create Analyser for Realtime VU meter
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;

    const startOffset =
      playheadTime >= selectionEnd || playheadTime < selectionStart
        ? selectionStart
        : playheadTime;
    const playLength = selectionEnd - startOffset;

    source.start(0, startOffset, isLooping ? undefined : playLength);
    playSourceRef.current = source;
    setIsPlaying(true);
    playbackStartTimeRef.current = ctx.currentTime;
    elapsedOffsetRef.current = startOffset;

    // Update playhead & VU meter loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateLoop = () => {
      if (!isPlaying && !playSourceRef.current) return;

      const elapsed = ctx.currentTime - playbackStartTimeRef.current;
      const currentPos = elapsedOffsetRef.current + elapsed;

      if (!isLooping && currentPos >= selectionEnd) {
        stopAudio();
        setPlayheadTime(selectionStart);
        setVuLevel(0);
        return;
      } else {
        setPlayheadTime(
          isLooping
            ? selectionStart + (currentPos % (selectionEnd - selectionStart))
            : currentPos
        );
      }

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setVuLevel(Math.min(100, Math.round((avg / 128) * 100)));
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    source.onended = () => {
      if (
        !isLooping &&
        ctx.currentTime - playbackStartTimeRef.current >= playLength
      ) {
        stopAudio();
        setPlayheadTime(selectionStart);
        setVuLevel(0);
      }
    };
  }

  function stopAudio() {
    if (playSourceRef.current) {
      try {
        playSourceRef.current.stop();
      } catch (e) {}
      playSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
    setVuLevel(0);
  }

  // Push new buffer to Undo stack
  const updateBuffer = (newBuffer, msg = 'Audio modified') => {
    stopAudio();
    setUndoStack((prev) => [...prev, newBuffer]);
    setRedoStack([]);
    setAudioBuffer(newBuffer);
    setDuration(newBuffer.duration);
    setSelectionStart(0);
    setSelectionEnd(newBuffer.duration);
    setPlayheadTime(0);
    showSuccess(msg);
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) {
      showToast('Already at oldest version.', 'info');
      return;
    }
    stopAudio();
    const current = undoStack[undoStack.length - 1];
    const prev = undoStack[undoStack.length - 2];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack((r) => [...r, current]);
    setAudioBuffer(prev);
    setDuration(prev.duration);
    setSelectionStart(0);
    setSelectionEnd(prev.duration);
    setPlayheadTime(0);
    showToast('Undo completed', 'info');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    stopAudio();
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, next]);
    setAudioBuffer(next);
    setDuration(next.duration);
    setSelectionStart(0);
    setSelectionEnd(next.duration);
    setPlayheadTime(0);
    showToast('Redo completed', 'info');
  };

  // Clipboard & Editing Operations
  const handleCopy = () => {
    if (!audioBuffer) return;
    const ctx =
      audioCtxRef.current ||
      new (window.AudioContext || window.webkitAudioContext)();
    const rate = audioBuffer.sampleRate;
    const startSample = Math.floor(selectionStart * rate);
    const endSample = Math.floor(selectionEnd * rate);
    const frameCount = endSample - startSample;
    if (frameCount <= 0) return;

    const copyBuf = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      frameCount,
      rate
    );
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const origData = audioBuffer.getChannelData(c);
      const copyData = copyBuf.getChannelData(c);
      for (let i = 0; i < frameCount; i++) {
        copyData[i] = origData[startSample + i];
      }
    }
    setClipboardBuffer(copyBuf);
    showSuccess(
      `Copied ${(selectionEnd - selectionStart).toFixed(2)}s to clipboard`
    );
  };

  const handleDeleteRange = () => {
    if (!audioBuffer) return;
    const ctx =
      audioCtxRef.current ||
      new (window.AudioContext || window.webkitAudioContext)();
    const rate = audioBuffer.sampleRate;
    const startSample = Math.floor(selectionStart * rate);
    const endSample = Math.floor(selectionEnd * rate);
    const deleteCount = endSample - startSample;
    if (deleteCount <= 0) return;

    const newLength = audioBuffer.length - deleteCount;
    const newBuf = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      rate
    );

    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const origData = audioBuffer.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData.subarray(0, startSample), 0);
      newData.set(origData.subarray(endSample), startSample);
    }
    updateBuffer(newBuf, 'Cut selection from audio');
  };

  const handleCut = () => {
    if (!audioBuffer) return;
    handleCopy();
    handleDeleteRange();
  };

  const handlePaste = () => {
    if (!clipboardBuffer || !audioBuffer) {
      showToast('Clipboard is empty. Copy or cut a selection first.', 'info');
      return;
    }
    const ctx =
      audioCtxRef.current ||
      new (window.AudioContext || window.webkitAudioContext)();
    const rate = audioBuffer.sampleRate;
    const insertSample = Math.floor(playheadTime * rate);
    const newTotalLength = audioBuffer.length + clipboardBuffer.length;
    const numChannels = Math.max(
      audioBuffer.numberOfChannels,
      clipboardBuffer.numberOfChannels
    );

    const newBuf = ctx.createBuffer(numChannels, newTotalLength, rate);
    for (let c = 0; c < numChannels; c++) {
      const origData =
        c < audioBuffer.numberOfChannels
          ? audioBuffer.getChannelData(c)
          : new Float32Array(audioBuffer.length);
      const clipData =
        c < clipboardBuffer.numberOfChannels
          ? clipboardBuffer.getChannelData(c)
          : new Float32Array(clipboardBuffer.length);
      const newData = newBuf.getChannelData(c);

      newData.set(origData.subarray(0, insertSample), 0);
      newData.set(clipData, insertSample);
      newData.set(
        origData.subarray(insertSample),
        insertSample + clipData.length
      );
    }
    updateBuffer(
      newBuf,
      `Pasted ${clipboardBuffer.duration.toFixed(2)}s audio snippet at ${playheadTime.toFixed(2)}s`
    );
  };

  const handleSilence = () => {
    if (!audioBuffer) return;
    const ctx =
      audioCtxRef.current ||
      new (window.AudioContext || window.webkitAudioContext)();
    const rate = audioBuffer.sampleRate;
    const startSample = Math.floor(selectionStart * rate);
    const endSample = Math.floor(selectionEnd * rate);

    const newBuf = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      rate
    );
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const origData = audioBuffer.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData);
      for (let i = startSample; i < endSample; i++) {
        newData[i] = 0;
      }
    }
    updateBuffer(newBuf, 'Selection silenced');
  };

  const handleTrim = () => {
    if (!audioBuffer) return;
    const ctx =
      audioCtxRef.current ||
      new (window.AudioContext || window.webkitAudioContext)();
    const rate = audioBuffer.sampleRate;
    const startSample = Math.floor(selectionStart * rate);
    const endSample = Math.floor(selectionEnd * rate);
    const frameCount = endSample - startSample;
    if (frameCount <= 0) return;

    const newBuf = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      frameCount,
      rate
    );
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const origData = audioBuffer.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      for (let i = 0; i < frameCount; i++) {
        newData[i] = origData[startSample + i];
      }
    }
    updateBuffer(newBuf, 'Trimmed to selection');
  };

  const handleApplyGain = () => {
    if (!audioBuffer) return;
    const ctx =
      audioCtxRef.current ||
      new (window.AudioContext || window.webkitAudioContext)();
    const mult = Math.pow(10, gainDb / 20);
    const rate = audioBuffer.sampleRate;
    const startSample = Math.floor(selectionStart * rate);
    const endSample = Math.floor(selectionEnd * rate);

    const newBuf = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      rate
    );
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const origData = audioBuffer.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData);
      for (let i = startSample; i < endSample; i++) {
        newData[i] = Math.max(-1, Math.min(1, origData[i] * mult));
      }
    }
    updateBuffer(newBuf, `Applied ${gainDb > 0 ? '+' : ''}${gainDb}dB Gain`);
    setActiveModal(null);
  };

  const handleApplyFade = (type) => {
    if (!audioBuffer) return;
    const ctx =
      audioCtxRef.current ||
      new (window.AudioContext || window.webkitAudioContext)();
    const rate = audioBuffer.sampleRate;
    const fadeSec = type === 'in' ? fadeInSec : fadeOutSec;
    const fadeSamples = Math.floor(fadeSec * rate);

    const newBuf = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      rate
    );
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const origData = audioBuffer.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData);

      if (type === 'in') {
        const startSample = Math.floor(selectionStart * rate);
        const endSample = Math.min(
          audioBuffer.length,
          startSample + fadeSamples
        );
        for (let i = startSample; i < endSample; i++) {
          const factor = (i - startSample) / (endSample - startSample);
          newData[i] *= factor;
        }
      } else {
        const endSample = Math.floor(selectionEnd * rate);
        const startSample = Math.max(0, endSample - fadeSamples);
        for (let i = startSample; i < endSample; i++) {
          const factor = 1 - (i - startSample) / (endSample - startSample);
          newData[i] *= factor;
        }
      }
    }
    updateBuffer(newBuf, `Applied Fade ${type === 'in' ? 'In' : 'Out'}`);
    setActiveModal(null);
  };

  const handleApplyReverse = () => {
    if (!audioBuffer) return;
    const ctx =
      audioCtxRef.current ||
      new (window.AudioContext || window.webkitAudioContext)();
    const rate = audioBuffer.sampleRate;
    const startSample = Math.floor(selectionStart * rate);
    const endSample = Math.floor(selectionEnd * rate);

    const newBuf = ctx.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      rate
    );
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const origData = audioBuffer.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData);
      const sub = origData.subarray(startSample, endSample);
      for (let i = 0; i < sub.length; i++) {
        newData[startSample + i] = sub[sub.length - 1 - i];
      }
    }
    updateBuffer(newBuf, 'Reversed audio selection');
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isPlaying) stopAudio();
        else startAudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    audioBuffer,
    clipboardBuffer,
    playheadTime,
    selectionStart,
    selectionEnd,
    isPlaying,
    undoStack,
    redoStack,
  ]);

  // Render Canvas (AudioMass Style Dark Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Pitch-black dark background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // Time Ruler (top 20px)
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, 20);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(width, 20);
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px monospace';
    const numTicks = 10;
    for (let i = 0; i <= numTicks; i++) {
      const x = (i / numTicks) * width;
      const t = (i / numTicks) * duration;
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.lineTo(x, 20);
      ctx.stroke();
      ctx.fillText(`${t.toFixed(1)}s`, Math.min(x + 2, width - 25), 12);
    }

    // Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const numChannels = audioBuffer.numberOfChannels;
    const waveAreaHeight = (height - 20) / numChannels;

    for (let c = 0; c < numChannels; c++) {
      const channelData = audioBuffer.getChannelData(c);
      const topY = 20 + c * waveAreaHeight;
      const midY = topY + waveAreaHeight / 2;

      // Channel Baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Channel Label (L / R)
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(c === 0 ? 'L' : 'R', 8, midY - 6);

      // Draw Waveform Bars
      const samplesPerPixel = Math.ceil(channelData.length / (width * zoomH));
      ctx.strokeStyle = c === 0 ? '#22d3ee' : '#38bdf8'; // AudioMass Cyan/Teal
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x++) {
        const startSample = Math.floor(x * samplesPerPixel);
        let min = 1.0;
        let max = -1.0;

        for (let j = 0; j < samplesPerPixel; j++) {
          const val = channelData[startSample + j] || 0;
          if (val < min) min = val;
          if (val > max) max = val;
        }

        const yMin = midY + min * (waveAreaHeight / 2) * zoomV;
        const yMax = midY + max * (waveAreaHeight / 2) * zoomV;

        ctx.beginPath();
        ctx.moveTo(x, yMin);
        ctx.lineTo(x, yMax);
        ctx.stroke();
      }
    }

    // Selection Overlay (Purple Glow)
    if (selectionEnd > selectionStart) {
      const selX1 = (selectionStart / duration) * width;
      const selX2 = (selectionEnd / duration) * width;
      ctx.fillStyle = 'rgba(147, 51, 234, 0.35)';
      ctx.fillRect(selX1, 20, selX2 - selX1, height - 20);

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(selX1, 20, selX2 - selX1, height - 20);
    }

    // Playhead Laser Cursor
    const playX = (playheadTime / duration) * width;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, height);
    ctx.stroke();

    // Playhead Handle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(playX, 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [
    audioBuffer,
    selectionStart,
    selectionEnd,
    playheadTime,
    duration,
    zoomH,
    zoomV,
  ]);

  // Canvas Mouse Selection Handling
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

  // Helper WAV buffer builder
  const bufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let pos = 0;

    const setUint16 = (d) => {
      view.setUint16(pos, d, true);
      pos += 2;
    };
    const setUint32 = (d) => {
      view.setUint32(pos, d, true);
      pos += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));

    let offset = 0;
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return bufferArr;
  };

  // Export File handler
  const handleExport = async () => {
    if (!audioBuffer) return;
    setIsProcessing(true);
    setProgress(10);
    try {
      const wavBytes = bufferToWav(audioBuffer);
      const outputMime = exportFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
      const outputExt = exportFormat;
      const outBlob = new Blob([wavBytes], { type: outputMime });
      const outUrl = URL.createObjectURL(outBlob);
      const fileName =
        (file?.name ? file.name.replace(/\.[^.]+$/, '') : 'audiomass_edit') +
        `.${outputExt}`;

      setResult({ url: outUrl, fileName, size: outBlob.size });
      setProgress(100);
      showSuccess(`Exported as ${outputExt.toUpperCase()}`);
      setActiveModal(null);
    } catch (e) {
      showToast('Export failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format digital time
  const formatDigitalTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ms).padStart(3, '0')}`;
  };

  return (
    <div className="w-full max-w-[1450px] mx-auto bg-[#07090e] text-slate-200 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs select-none">
      {/* ── 1. AUDIOMASS TOP HEADER MENU BAR ── */}
      <div className="bg-[#0f172a] border-b border-slate-800 px-3 py-1.5 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-1">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() =>
                setActiveMenu(activeMenu === 'file' ? null : 'file')
              }
              className={cn(
                'px-2.5 py-1 rounded text-xs font-semibold transition-colors hover:bg-slate-800',
                activeMenu === 'file' && 'bg-cyan-950 text-cyan-400'
              )}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setActiveModal('export');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Export / Download
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <FileAudio className="w-3.5 h-3.5" /> Load from Computer
                </button>
                <button
                  onClick={() => {
                    loadSampleAudio();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Load
                  Sample Audio
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() =>
                setActiveMenu(activeMenu === 'edit' ? null : 'edit')
              }
              className={cn(
                'px-2.5 py-1 rounded text-xs font-semibold transition-colors hover:bg-slate-800',
                activeMenu === 'edit' && 'bg-cyan-950 text-cyan-400'
              )}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    handleUndo();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Undo
                </button>
                <button
                  onClick={() => {
                    handleRedo();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Redo2 className="w-3.5 h-3.5" /> Redo
                </button>
                <button
                  onClick={() => {
                    handleCopy();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Selection
                </button>
                <button
                  onClick={() => {
                    handleCut();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Scissors className="w-3.5 h-3.5" /> Cut Selection
                </button>
                <button
                  onClick={() => {
                    handlePaste();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2 text-emerald-400 font-bold"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" /> Paste (Insert at
                  Playhead)
                </button>
                <button
                  onClick={() => {
                    handleSilence();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <VolumeX className="w-3.5 h-3.5" /> Silence Selection
                </button>
                <button
                  onClick={() => {
                    handleTrim();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Trim Outside
                  Selection
                </button>
              </div>
            )}
          </div>

          {/* Effects Menu */}
          <div className="relative">
            <button
              onClick={() =>
                setActiveMenu(activeMenu === 'effects' ? null : 'effects')
              }
              className={cn(
                'px-2.5 py-1 rounded text-xs font-semibold transition-colors hover:bg-slate-800',
                activeMenu === 'effects' && 'bg-cyan-950 text-cyan-400'
              )}
            >
              Effects
            </button>
            {activeMenu === 'effects' && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setActiveModal('gain');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Gain / Amplification
                </button>
                <button
                  onClick={() => {
                    setActiveModal('fade');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5" /> Fade In / Out
                </button>
                <button
                  onClick={() => {
                    handleApplyReverse();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reverse Audio
                </button>
              </div>
            )}
          </div>

          {/* Help */}
          <button
            onClick={() => setActiveModal('help')}
            className="px-2.5 py-1 rounded text-xs font-semibold transition-colors hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            Help
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold tracking-widest uppercase"
          >
            AudioMass Studio Engine
          </Badge>
          <Badge
            variant="outline"
            className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] font-bold tracking-wider"
          >
            MultiTrack BETA
          </Badge>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />

      {/* ── 2. AUDIOMASS CONTROL TOOLBAR ── */}
      <div className="bg-[#0b101d] border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-4">
        {/* Digital Time Readout */}
        <div className="flex items-center gap-3 bg-black/80 px-4 py-2 rounded border border-slate-800">
          <div className="text-xl font-bold tracking-widest text-cyan-400 font-mono">
            {formatDigitalTime(playheadTime)}
          </div>
          <div className="text-[10px] text-slate-500 flex flex-col font-mono leading-none border-l border-slate-800 pl-3">
            <span>TOTAL: {formatDigitalTime(duration)}</span>
            <span className="text-cyan-500/80">
              SAMPLE: {audioBuffer?.sampleRate || 44100}Hz
            </span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              stopAudio();
              setPlayheadTime(0);
            }}
            className="p-2 hover:bg-slate-800 rounded text-slate-300 transition-colors"
            title="Stop"
          >
            <Square className="w-4 h-4 fill-slate-300" />
          </button>
          <button
            onClick={startAudio}
            className={cn(
              'p-2 rounded transition-colors',
              isPlaying
                ? 'bg-red-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            )}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={cn(
              'p-2 rounded transition-colors',
              isLooping
                ? 'bg-purple-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
            )}
            title="Loop Region"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={handleCopy}
            disabled={!audioBuffer}
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
            title="Copy (Ctrl+C)"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleCut}
            disabled={!audioBuffer}
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
            title="Cut (Ctrl+X)"
          >
            <Scissors className="w-4 h-4" />
          </button>
          <button
            onClick={handlePaste}
            disabled={!clipboardBuffer || !audioBuffer}
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-emerald-400 font-bold relative"
            title="Paste at Playhead (Ctrl+V)"
          >
            <ClipboardPaste className="w-4 h-4" />
            {clipboardBuffer && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            )}
          </button>
          <button
            onClick={handleSilence}
            disabled={!audioBuffer}
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
            title="Silence"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        </div>

        {/* Selection Readout */}
        <div className="flex items-center gap-3 bg-black/60 px-3 py-1.5 rounded border border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-500">START:</span>{' '}
            <span className="text-purple-400 font-bold">
              {selectionStart.toFixed(3)}s
            </span>
          </div>
          <div>
            <span className="text-slate-500">END:</span>{' '}
            <span className="text-purple-400 font-bold">
              {selectionEnd.toFixed(3)}s
            </span>
          </div>
          <div>
            <span className="text-slate-500">LEN:</span>{' '}
            <span className="text-cyan-400 font-bold">
              {(selectionEnd - selectionStart).toFixed(3)}s
            </span>
          </div>
          <button
            onClick={() => {
              setSelectionStart(0);
              setSelectionEnd(duration);
            }}
            className="ml-2 text-[10px] text-slate-400 hover:text-slate-200 underline"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE / WAVEFORM CANVAS ── */}
      <div className="relative bg-[#07090e] p-2 min-h-[300px]">
        {!audioBuffer ? (
          <div className="flex flex-col items-center justify-center h-[280px] border-2 border-dashed border-slate-800 rounded-xl gap-4 bg-slate-950/40">
            <Music className="w-12 h-12 text-cyan-500 animate-pulse" />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">
                Drag & Drop an Audio File here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                or use the option below to get started
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
              >
                Select Audio File
              </Button>
              <Button
                onClick={loadSampleAudio}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" /> Use
                Sample Audio
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={1400}
              height={260}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="w-full h-[260px] rounded cursor-col-resize block border border-slate-800/80 shadow-inner"
            />
          </div>
        )}

        {/* Zoom Controls */}
        {audioBuffer && (
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>H-ZOOM:</span>
              <button
                onClick={() => setZoomH(Math.max(1, zoomH - 0.5))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
              >
                -
              </button>
              <span className="font-bold text-slate-200">{zoomH}x</span>
              <button
                onClick={() => setZoomH(Math.min(5, zoomH + 0.5))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
              >
                +
              </button>
              <button
                onClick={() => setZoomH(1)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
              >
                RESET
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>V-AMP:</span>
              <button
                onClick={() => setZoomV(Math.max(0.5, zoomV - 0.25))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
              >
                ↕-
              </button>
              <span className="font-bold text-slate-200">
                {zoomV.toFixed(2)}x
              </span>
              <button
                onClick={() => setZoomV(Math.min(3, zoomV + 0.25))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
              >
                ↕+
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. AUDIOMASS BOTTOM LEVEL ANALYZER / VU METER ── */}
      <div className="bg-[#05070a] border-t border-slate-800 p-2 flex items-center gap-3">
        <span className="text-[10px] text-slate-500 font-bold">
          dB ANALYZER
        </span>
        <div className="flex-1 h-3 bg-slate-900 rounded overflow-hidden relative border border-slate-800 flex items-center">
          <div
            className="h-full transition-all duration-75 bg-gradient-to-r from-cyan-500 via-emerald-400 to-red-500"
            style={{ width: `${vuLevel}%` }}
          />
          <div className="absolute inset-0 flex justify-between px-2 text-[8px] text-slate-400 pointer-events-none">
            <span>-Inf</span>
            <span>-40</span>
            <span>-20</span>
            <span>-10</span>
            <span>-6</span>
            <span>-3</span>
            <span>0 dB</span>
          </div>
        </div>
      </div>

      {/* Render Output Export Details */}
      {result && (
        <div className="p-4 bg-emerald-950/30 border-t border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-emerald-300">
                {result.fileName}
              </p>
              <p className="text-[10px] text-slate-400">
                {formatFileSize(result.size)} • Encoded successfully
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <audio src={result.url} controls className="h-8 w-60" />
            <a
              href={result.url}
              download={result.fileName}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {/* Export Modal */}
      {activeModal === 'export' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" /> Export Audio
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportFormat('mp3')}
                    className={cn(
                      'p-2 rounded border text-center font-bold',
                      exportFormat === 'mp3'
                        ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                        : 'border-slate-800 bg-slate-950'
                    )}
                  >
                    MP3
                  </button>
                  <button
                    onClick={() => setExportFormat('wav')}
                    className={cn(
                      'p-2 rounded border text-center font-bold',
                      exportFormat === 'wav'
                        ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                        : 'border-slate-800 bg-slate-950'
                    )}
                  >
                    WAV Lossless
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => setActiveModal(null)}
                variant="outline"
                className="border-slate-700 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isProcessing}
                className="bg-cyan-600 hover:bg-cyan-500 text-xs text-white"
              >
                {isProcessing ? 'Encoding...' : 'Export Audio'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gain Modal */}
      {activeModal === 'gain' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" /> Gain Adjustment
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span>Gain (dB)</span>
                <span className="text-cyan-400 font-bold">{gainDb} dB</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                value={gainDb}
                onChange={(e) => setGainDb(parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => setActiveModal(null)}
                variant="outline"
                className="border-slate-700 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyGain}
                className="bg-cyan-600 hover:bg-cyan-500 text-xs text-white"
              >
                Apply Gain
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fade Modal */}
      {activeModal === 'fade' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Fade Effects
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Fade In Duration</span>
                  <span className="text-cyan-400 font-bold">{fadeInSec}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={fadeInSec}
                  onChange={(e) => setFadeInSec(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <Button
                  onClick={() => handleApplyFade('in')}
                  className="w-full mt-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs"
                >
                  Apply Fade In
                </Button>
              </div>
              <div className="border-t border-slate-800 pt-3">
                <div className="flex justify-between mb-1">
                  <span>Fade Out Duration</span>
                  <span className="text-cyan-400 font-bold">{fadeOutSec}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={fadeOutSec}
                  onChange={(e) => setFadeOutSec(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <Button
                  onClick={() => handleApplyFade('out')}
                  className="w-full mt-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs"
                >
                  Apply Fade Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" /> AudioMass Quick
                Start
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-slate-300">
              <p>
                • <strong>Selection:</strong> Click and drag on the waveform
                canvas to select audio ranges.
              </p>
              <p>
                • <strong>Playback:</strong> Use Play/Pause buttons or press{' '}
                <kbd className="bg-slate-800 px-1.5 py-0.5 rounded">Space</kbd>.
              </p>
              <p>
                • <strong>Edits:</strong> Copy, Cut, Silence, Gain, or Fade
                selected regions directly.
              </p>
              <p>
                • <strong>Sample:</strong> Click &quot;Use Sample Audio&quot; in
                the File menu to test instantly!
              </p>
            </div>
            <Button
              onClick={() => setActiveModal(null)}
              className="w-full bg-cyan-600 text-white text-xs"
            >
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Tool History Footer */}
      <div className="p-4 bg-[#090d16] border-t border-slate-800">
        <ToolHistoryPanel
          toolType="audio-editor"
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}
