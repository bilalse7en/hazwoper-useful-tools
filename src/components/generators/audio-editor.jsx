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
  Sliders,
  Volume2,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  VolumeX,
  RotateCcw,
  Sparkles,
  HelpCircle,
  FileAudio,
  SlidersHorizontal,
  CheckCircle2,
  X,
  Mic,
  Plus,
  Wand2,
  FilePlus,
  Gauge,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/image-converter';
import { showToast, showSuccess } from '@/lib/swal';

export function AudioEditor() {
  const { performAction } = useAuthAction();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Audio Context & Buffers
  const audioCtxRef = useRef(null);
  const playSourceRef = useRef(null);
  const analyserRef = useRef(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const audioBufferRef = useRef(null);
  useEffect(() => {
    audioBufferRef.current = audioBuffer;
  }, [audioBuffer]);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  useEffect(() => {
    undoStackRef.current = undoStack;
  }, [undoStack]);
  useEffect(() => {
    redoStackRef.current = redoStack;
  }, [redoStack]);
  const [clipboardBuffer, setClipboardBuffer] = useState(null);
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Playback & Selection State
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(false);
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const selectionStartRef = useRef(0);
  const selectionEndRef = useRef(0);
  useEffect(() => {
    selectionStartRef.current = selectionStart;
    selectionEndRef.current = selectionEnd;
  }, [selectionStart, selectionEnd]);

  const [playheadTime, setPlayheadTime] = useState(0);
  const playheadTimeRef = useRef(0);

  const animFrameRef = useRef(null);
  const playbackStartTimeRef = useRef(0);
  const elapsedOffsetRef = useRef(0);

  // Zoom Controls
  const [zoomH, setZoomH] = useState(1); // 1x to 10x
  const [zoomV, setZoomV] = useState(1); // 0.5x to 4x
  const zoomHRef = useRef(1);
  const zoomVRef = useRef(1);
  useEffect(() => {
    zoomHRef.current = zoomH;
    zoomVRef.current = zoomV;
  }, [zoomH, zoomV]);

  // Realtime VU Meter
  const [vuLevel, setVuLevel] = useState(0);

  // Menus & Modals
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  // Pending Import File/Buffer for Modal Confirmation
  const [pendingImport, setPendingImport] = useState(null);

  // Microphone Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recChunksRef = useRef([]);
  const recTimerRef = useRef(null);

  // Effect Controls
  const [gainDb, setGainDb] = useState(0);
  const [fadeInSec, setFadeInSec] = useState(2);
  const [fadeOutSec, setFadeOutSec] = useState(2);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [exportFormat, setExportFormat] = useState('mp3');
  const [exportScope, setExportScope] = useState('full');

  // Result output details
  const [result, setResult] = useState(null);

  // Canvas and Container Interaction Refs
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const isSelectingRef = useRef(false);
  const isDraggingStartRef = useRef(false);
  const isDraggingEndRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Audio Context Initializer
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Decode File to AudioBuffer
  const decodeAudioFile = async (audioFile) => {
    try {
      const ctx = getAudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      return decoded;
    } catch (e) {
      console.error('Error decoding audio:', e);
      throw new Error('Failed to parse audio file format.');
    }
  };

  // ── HIGH-PERFORMANCE CANVAS WAVEFORM & PLAYHEAD RENDERER ──
  const renderCanvas = useCallback((overrideTime = null) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const buf = audioBufferRef.current;
    if (!canvas || !buf) return;

    const ctx = canvas.getContext('2d');
    const baseWidth = container ? container.clientWidth : 1400;
    const zH = zoomHRef.current;
    const zV = zoomVRef.current;
    const targetWidth = Math.max(baseWidth, Math.floor(baseWidth * zH));

    if (canvas.width !== targetWidth) {
      canvas.width = targetWidth;
      canvas.style.width = `${targetWidth}px`;
    }

    const width = canvas.width;
    const height = canvas.height;
    const dur = durationRef.current || buf.duration || 1;
    const currentPlayTime =
      overrideTime !== null ? overrideTime : playheadTimeRef.current;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;

    // 1. Dark Background
    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, width, height);

    // 2. Time Ruler Top Bar (24px high) with dynamic ticks
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, 24);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(width, 24);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';

    const pixelsPerSecond = width / dur;
    let tickInterval = 1;
    if (pixelsPerSecond > 200) tickInterval = 0.1;
    else if (pixelsPerSecond > 100) tickInterval = 0.25;
    else if (pixelsPerSecond > 40) tickInterval = 0.5;
    else if (pixelsPerSecond > 20) tickInterval = 1;
    else if (pixelsPerSecond > 10) tickInterval = 2;
    else if (pixelsPerSecond > 5) tickInterval = 5;
    else tickInterval = 10;

    for (let t = 0; t <= dur; t += tickInterval) {
      const x = (t / dur) * width;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, 24);
      ctx.stroke();

      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60);
      const ms = Math.floor((t % 1) * 100);

      let label = '';
      if (tickInterval < 1) {
        label =
          mins > 0
            ? `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
            : `${secs}.${String(ms).padStart(2, '0')}s`;
      } else {
        label =
          mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
      }

      ctx.fillText(label, Math.max(2, Math.min(width - 35, x + 3)), 14);
    }

    // 3. Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 24);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 4. Draw Channels & Waveforms
    const numChannels = buf.numberOfChannels;
    const waveAreaHeight = (height - 24) / numChannels;

    for (let c = 0; c < numChannels; c++) {
      const channelData = buf.getChannelData(c);
      const topY = 24 + c * waveAreaHeight;
      const midY = topY + waveAreaHeight / 2;

      // Channel Baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Label L / R
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(c === 0 ? 'L' : 'R', 8, midY - 6);

      // Render Waveform Vertical Peaks
      const totalSamples = channelData.length;
      const samplesPerPixel = Math.max(1, Math.floor(totalSamples / width));
      ctx.strokeStyle = c === 0 ? '#00f0ff' : '#38bdf8';
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

        const yMin = midY + min * (waveAreaHeight / 2) * zV;
        const yMax = midY + max * (waveAreaHeight / 2) * zV;

        ctx.beginPath();
        ctx.moveTo(x, yMin);
        ctx.lineTo(x, yMax);
        ctx.stroke();
      }
    }

    // 5. Selection Overlay & Handles
    if (selEnd > selStart) {
      const selX1 = (selStart / dur) * width;
      const selX2 = (selEnd / dur) * width;
      const selWidth = Math.max(2, selX2 - selX1);

      // Purple Translucent Glow Fill
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.fillRect(selX1, 24, selWidth, height - 24);

      // Selection Border
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(selX1, 24, selWidth, height - 24);

      // Left & Right Handle Bars
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(selX1 - 3, 24, 6, 18);
      ctx.fillRect(selX2 - 3, 24, 6, 18);
    }

    // 6. Playhead Indicator (Red Laser)
    const playX = Math.max(0, Math.min(width, (currentPlayTime / dur) * width));

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, height);
    ctx.stroke();

    // Playhead Top Handle Marker
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(playX - 6, 0);
    ctx.lineTo(playX + 6, 0);
    ctx.lineTo(playX, 10);
    ctx.closePath();
    ctx.fill();

    // Current Time Tooltip
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(
      `${currentPlayTime.toFixed(2)}s`,
      Math.max(2, Math.min(width - 40, playX - 16)),
      20
    );
  }, []);

  // Sync Canvas when state changes
  useEffect(() => {
    renderCanvas();
  }, [audioBuffer, selectionStart, selectionEnd, zoomH, zoomV, renderCanvas]);

  // Sync Canvas Resolution on Resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (canvas && container) {
        renderCanvas();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // ── LOAD / INSERT AUDIO FILE LOGIC ──
  const handleFile = useCallback(async (newFile) => {
    if (!newFile) return;
    try {
      const decoded = await decodeAudioFile(newFile);
      const fileMeta = {
        buffer: decoded,
        fileName: newFile.name,
        duration: decoded.duration,
      };

      if (audioBufferRef.current) {
        stopAudio();
        setPendingImport(fileMeta);
        setActiveModal('import');
      } else {
        setFile(newFile);
        setAudioBuffer(decoded);
        audioBufferRef.current = decoded;
        setUndoStack([decoded]);
        setRedoStack([]);
        setDuration(decoded.duration);
        durationRef.current = decoded.duration;
        setSelectionStart(0);
        selectionStartRef.current = 0;
        setSelectionEnd(decoded.duration);
        selectionEndRef.current = decoded.duration;
        setPlayheadTime(0);
        playheadTimeRef.current = 0;
        showSuccess(`Loaded: ${newFile.name}`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, []);

  // Helper to Combine / Insert Buffer into Audio
  const insertAudioBuffer = (existingBuffer, newBuffer, insertTime) => {
    const ctx = getAudioContext();
    const targetRate = existingBuffer.sampleRate;
    const insertSample = Math.max(
      0,
      Math.min(existingBuffer.length, Math.floor(insertTime * targetRate))
    );
    const numChannels = Math.max(
      existingBuffer.numberOfChannels,
      newBuffer.numberOfChannels
    );
    const totalLength = existingBuffer.length + newBuffer.length;

    const combinedBuffer = ctx.createBuffer(
      numChannels,
      totalLength,
      targetRate
    );

    for (let c = 0; c < numChannels; c++) {
      const existingData =
        c < existingBuffer.numberOfChannels
          ? existingBuffer.getChannelData(c)
          : new Float32Array(existingBuffer.length);
      const newData =
        c < newBuffer.numberOfChannels
          ? newBuffer.getChannelData(c)
          : new Float32Array(newBuffer.length);

      const dest = combinedBuffer.getChannelData(c);

      dest.set(existingData.subarray(0, insertSample), 0);
      dest.set(newData, insertSample);
      dest.set(
        existingData.subarray(insertSample),
        insertSample + newBuffer.length
      );
    }

    return combinedBuffer;
  };

  // Modal Action 1: Insert into Existing File at Playhead
  const confirmInsertAtPlayhead = () => {
    if (!pendingImport || !audioBuffer) return;
    stopAudio();
    const insertPos = playheadTimeRef.current;
    const combined = insertAudioBuffer(
      audioBuffer,
      pendingImport.buffer,
      insertPos
    );
    const insertedDur = pendingImport.duration;

    updateBuffer(
      combined,
      `Inserted "${pendingImport.fileName}" at ${insertPos.toFixed(2)}s`,
      {
        playhead: insertPos,
        selStart: insertPos,
        selEnd: insertPos + insertedDur,
      }
    );

    setPendingImport(null);
    setActiveModal(null);
  };

  // Modal Action 2: Append at End of Existing File
  const confirmAppendAtEnd = () => {
    if (!pendingImport || !audioBuffer) return;
    stopAudio();
    const appendPos = durationRef.current;
    const combined = insertAudioBuffer(
      audioBuffer,
      pendingImport.buffer,
      appendPos
    );
    const insertedDur = pendingImport.duration;

    updateBuffer(combined, `Appended "${pendingImport.fileName}" to end`, {
      playhead: appendPos,
      selStart: appendPos,
      selEnd: appendPos + insertedDur,
    });

    setPendingImport(null);
    setActiveModal(null);
  };

  // Modal Action 3: Open as New Track (Replace Existing)
  const confirmReplaceTrack = () => {
    if (!pendingImport) return;
    stopAudio();
    const newBuf = pendingImport.buffer;
    setAudioBuffer(newBuf);
    audioBufferRef.current = newBuf;
    setUndoStack([newBuf]);
    setRedoStack([]);
    setDuration(newBuf.duration);
    durationRef.current = newBuf.duration;
    setSelectionStart(0);
    selectionStartRef.current = 0;
    setSelectionEnd(newBuf.duration);
    selectionEndRef.current = newBuf.duration;
    setPlayheadTime(0);
    playheadTimeRef.current = 0;

    showSuccess(`Opened "${pendingImport.fileName}" as new file track.`);
    setPendingImport(null);
    setActiveModal(null);
  };

  // Load Sample Synthesizer Track
  const loadSampleAudio = async () => {
    try {
      stopAudio();
      const ctx = getAudioContext();
      const sampleRate = ctx.sampleRate;
      const sampleDuration = 5.0;
      const buffer = ctx.createBuffer(
        2,
        sampleRate * sampleDuration,
        sampleRate
      );
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const freq = 220 + Math.sin(t * 5) * 110;
        const envelope = Math.exp(-t * 0.4) * (1 - Math.exp(-t * 8));
        left[i] = Math.sin(2 * Math.PI * freq * t) * 0.4 * envelope;
        right[i] = Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.4 * envelope;
      }

      if (audioBufferRef.current) {
        setPendingImport({
          buffer,
          fileName: 'Sample_Synth.wav',
          duration: sampleDuration,
        });
        setActiveModal('import');
      } else {
        setAudioBuffer(buffer);
        audioBufferRef.current = buffer;
        setUndoStack([buffer]);
        setRedoStack([]);
        setDuration(buffer.duration);
        durationRef.current = buffer.duration;
        setSelectionStart(0);
        selectionStartRef.current = 0;
        setSelectionEnd(buffer.duration);
        selectionEndRef.current = buffer.duration;
        setPlayheadTime(0);
        playheadTimeRef.current = 0;
        setFile(new File([], 'sample_synth.wav', { type: 'audio/wav' }));
        showSuccess('Sample audio loaded!');
      }
    } catch (e) {
      showToast('Could not load sample audio.', 'error');
    }
  };

  // Microphone Recording
  const startRecording = async () => {
    try {
      stopAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunksRef.current, { type: 'audio/webm' });
        const arrayBuf = await blob.arrayBuffer();
        const ctx = getAudioContext();
        const decoded = await ctx.decodeAudioData(arrayBuf);

        const recMeta = {
          buffer: decoded,
          fileName: `Recording_${new Date().toLocaleTimeString().replace(/:/g, '-')}.wav`,
          duration: decoded.duration,
        };

        if (audioBufferRef.current) {
          setPendingImport(recMeta);
          setActiveModal('import');
        } else {
          setAudioBuffer(decoded);
          audioBufferRef.current = decoded;
          setUndoStack([decoded]);
          setRedoStack([]);
          setDuration(decoded.duration);
          durationRef.current = decoded.duration;
          setSelectionStart(0);
          selectionStartRef.current = 0;
          setSelectionEnd(decoded.duration);
          selectionEndRef.current = decoded.duration;
          setPlayheadTime(0);
          playheadTimeRef.current = 0;
          showSuccess('Microphone recording saved to track!');
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      recTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      showSuccess('Microphone recording started!');
    } catch (err) {
      showToast('Could not access microphone: ' + err.message, 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    }
  };

  // ── 100% RELIABLE 60FPS PLAYBACK CONTROL & ANIMATION LOOP ──
  const startAudio = () => {
    const buf = audioBufferRef.current;
    if (!buf) return;

    if (isPlayingRef.current) {
      stopAudio();
      return;
    }

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = isLoopingRef.current;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;

    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;
    const pTime = playheadTimeRef.current;

    const startOffset = pTime >= selEnd || pTime < selStart ? selStart : pTime;
    const playLength = selEnd - startOffset;

    source.start(0, startOffset, isLoopingRef.current ? undefined : playLength);
    playSourceRef.current = source;

    isPlayingRef.current = true;
    setIsPlaying(true);
    playbackStartTimeRef.current = ctx.currentTime;
    elapsedOffsetRef.current = startOffset;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLoop = () => {
      if (!isPlayingRef.current || !playSourceRef.current) return;

      const elapsed = ctx.currentTime - playbackStartTimeRef.current;
      const currentPos = elapsedOffsetRef.current + elapsed;

      if (!isLoopingRef.current && currentPos >= selEnd) {
        stopAudio();
        setPlayheadTime(selStart);
        playheadTimeRef.current = selStart;
        renderCanvas(selStart);
        setVuLevel(0);
        return;
      }

      const pos = isLoopingRef.current
        ? selStart + ((currentPos - selStart) % (selEnd - selStart))
        : currentPos;
      setPlayheadTime(pos);
      playheadTimeRef.current = pos;

      renderCanvas(pos);

      // Auto scroll viewport if playhead moves outside visible window
      const container = containerRef.current;
      if (container) {
        const baseWidth = container.clientWidth || 1400;
        const targetWidth = Math.max(
          baseWidth,
          Math.floor(baseWidth * zoomHRef.current)
        );
        const playX = (pos / durationRef.current) * targetWidth;
        const visibleWidth = container.clientWidth;
        const scrollLeft = container.scrollLeft;

        if (playX > scrollLeft + visibleWidth - 50 || playX < scrollLeft) {
          container.scrollLeft = Math.max(0, playX - visibleWidth / 2);
        }
      }

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setVuLevel(Math.min(100, Math.round((avg / 128) * 100)));
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    source.onended = () => {
      if (
        !isLoopingRef.current &&
        ctx.currentTime - playbackStartTimeRef.current >= playLength
      ) {
        stopAudio();
        setPlayheadTime(selStart);
        playheadTimeRef.current = selStart;
        renderCanvas(selStart);
        setVuLevel(0);
      }
    };
  };

  function stopAudio() {
    isPlayingRef.current = false;
    setIsPlaying(false);

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
    setVuLevel(0);
    renderCanvas(playheadTimeRef.current);
  }

  // ── UPDATE BUFFER & PRESERVE PLAYHEAD / SELECTION ──
  const updateBuffer = (
    newBuffer,
    msg = 'Audio modified',
    newPosOptions = null
  ) => {
    stopAudio();
    setUndoStack((prev) => [...prev, newBuffer]);
    setRedoStack([]);
    setAudioBuffer(newBuffer);
    audioBufferRef.current = newBuffer;
    setDuration(newBuffer.duration);
    durationRef.current = newBuffer.duration;

    if (newPosOptions) {
      const { playhead, selStart, selEnd } = newPosOptions;
      const validPlayhead = Math.max(0, Math.min(newBuffer.duration, playhead));
      const validSelStart = Math.max(0, Math.min(newBuffer.duration, selStart));
      const validSelEnd = Math.max(
        validSelStart,
        Math.min(newBuffer.duration, selEnd)
      );

      setPlayheadTime(validPlayhead);
      playheadTimeRef.current = validPlayhead;
      setSelectionStart(validSelStart);
      selectionStartRef.current = validSelStart;
      setSelectionEnd(validSelEnd);
      selectionEndRef.current = validSelEnd;
    } else {
      const currPTime = Math.max(
        0,
        Math.min(newBuffer.duration, playheadTimeRef.current)
      );
      const currStart = Math.max(
        0,
        Math.min(newBuffer.duration, selectionStartRef.current)
      );
      const currEnd = Math.max(
        currStart,
        Math.min(newBuffer.duration, selectionEndRef.current)
      );

      setPlayheadTime(currPTime);
      playheadTimeRef.current = currPTime;
      setSelectionStart(currStart);
      selectionStartRef.current = currStart;
      setSelectionEnd(currEnd);
      selectionEndRef.current = currEnd;
    }
    showSuccess(msg);
  };

  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length <= 1) {
      showToast('Already at oldest version.', 'info');
      return;
    }
    stopAudio();
    const current = stack[stack.length - 1];
    const prev = stack[stack.length - 2];
    setUndoStack(stack.slice(0, -1));
    setRedoStack((r) => [...r, current]);
    setAudioBuffer(prev);
    audioBufferRef.current = prev;
    setDuration(prev.duration);
    durationRef.current = prev.duration;

    const validPTime = Math.max(
      0,
      Math.min(prev.duration, playheadTimeRef.current)
    );
    const validStart = Math.max(
      0,
      Math.min(prev.duration, selectionStartRef.current)
    );
    const validEnd = Math.max(
      validStart,
      Math.min(prev.duration, selectionEndRef.current)
    );

    setPlayheadTime(validPTime);
    playheadTimeRef.current = validPTime;
    setSelectionStart(validStart);
    selectionStartRef.current = validStart;
    setSelectionEnd(validEnd);
    selectionEndRef.current = validEnd;
    showToast('Undo completed', 'info');
  }, []);

  const handleRedo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) {
      showToast('Nothing to redo.', 'info');
      return;
    }
    stopAudio();
    const next = stack[stack.length - 1];
    setRedoStack(stack.slice(0, -1));
    setUndoStack((u) => [...u, next]);
    setAudioBuffer(next);
    audioBufferRef.current = next;
    setDuration(next.duration);
    durationRef.current = next.duration;

    const validPTime = Math.max(
      0,
      Math.min(next.duration, playheadTimeRef.current)
    );
    const validStart = Math.max(
      0,
      Math.min(next.duration, selectionStartRef.current)
    );
    const validEnd = Math.max(
      validStart,
      Math.min(next.duration, selectionEndRef.current)
    );

    setPlayheadTime(validPTime);
    playheadTimeRef.current = validPTime;
    setSelectionStart(validStart);
    selectionStartRef.current = validStart;
    setSelectionEnd(validEnd);
    selectionEndRef.current = validEnd;
    showToast('Redo completed', 'info');
  }, []);

  // ── CLIPBOARD & EDITING OPERATIONS ──
  const handleCopy = useCallback(() => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const rate = buf.sampleRate;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;
    const startSample = Math.floor(selStart * rate);
    const endSample = Math.floor(selEnd * rate);
    const frameCount = endSample - startSample;
    if (frameCount <= 0) {
      showToast(
        'No selection to copy. Select a waveform region first.',
        'info'
      );
      return;
    }

    const copyBuf = ctx.createBuffer(buf.numberOfChannels, frameCount, rate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const origData = buf.getChannelData(c);
      const copyData = copyBuf.getChannelData(c);
      for (let i = 0; i < frameCount; i++) {
        copyData[i] = origData[startSample + i];
      }
    }
    setClipboardBuffer(copyBuf);
    showSuccess(`Copied ${(selEnd - selStart).toFixed(2)}s to clipboard`);
  }, []);

  const handleDeleteRange = useCallback(() => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const rate = buf.sampleRate;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;
    const startSample = Math.floor(selStart * rate);
    const endSample = Math.floor(selEnd * rate);
    const deleteCount = endSample - startSample;
    if (deleteCount <= 0) return;

    const newLength = buf.length - deleteCount;
    const newBuf = ctx.createBuffer(buf.numberOfChannels, newLength, rate);

    for (let c = 0; c < buf.numberOfChannels; c++) {
      const origData = buf.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData.subarray(0, startSample), 0);
      newData.set(origData.subarray(endSample), startSample);
    }
    updateBuffer(newBuf, 'Cut selection from audio', {
      playhead: selStart,
      selStart: selStart,
      selEnd: selStart,
    });
  }, []);

  const handleCut = useCallback(() => {
    if (!audioBufferRef.current) return;
    handleCopy();
    handleDeleteRange();
  }, [handleCopy, handleDeleteRange]);

  const handlePaste = useCallback(() => {
    if (!clipboardBuffer || !audioBufferRef.current) {
      showToast('Clipboard is empty. Copy or cut a selection first.', 'info');
      return;
    }
    const buf = audioBufferRef.current;
    const insertPos = playheadTimeRef.current;
    const combined = insertAudioBuffer(buf, clipboardBuffer, insertPos);
    const pastedDur = clipboardBuffer.duration;

    updateBuffer(combined, `Pasted ${pastedDur.toFixed(2)}s audio snippet`, {
      playhead: insertPos,
      selStart: insertPos,
      selEnd: insertPos + pastedDur,
    });
  }, [clipboardBuffer]);

  const handleSilence = () => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const rate = buf.sampleRate;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;
    const startSample = Math.floor(selStart * rate);
    const endSample = Math.floor(selEnd * rate);

    const newBuf = ctx.createBuffer(buf.numberOfChannels, buf.length, rate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const origData = buf.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData);
      for (let i = startSample; i < endSample; i++) {
        newData[i] = 0;
      }
    }
    updateBuffer(newBuf, 'Selection silenced', {
      playhead: playheadTimeRef.current,
      selStart,
      selEnd,
    });
  };

  const handleTrim = () => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const rate = buf.sampleRate;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;
    const startSample = Math.floor(selStart * rate);
    const endSample = Math.floor(selEnd * rate);
    const frameCount = endSample - startSample;
    if (frameCount <= 0) return;

    const newBuf = ctx.createBuffer(buf.numberOfChannels, frameCount, rate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const origData = buf.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      for (let i = 0; i < frameCount; i++) {
        newData[i] = origData[startSample + i];
      }
    }
    updateBuffer(newBuf, 'Trimmed outside selection', {
      playhead: 0,
      selStart: 0,
      selEnd: newBuf.duration,
    });
  };

  const handleNormalize = () => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const rate = buf.sampleRate;
    let maxAmp = 0;

    for (let c = 0; c < buf.numberOfChannels; c++) {
      const data = buf.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i]);
        if (abs > maxAmp) maxAmp = abs;
      }
    }

    if (maxAmp === 0) return;
    const mult = 0.98 / maxAmp;

    const newBuf = ctx.createBuffer(buf.numberOfChannels, buf.length, rate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const origData = buf.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      for (let i = 0; i < origData.length; i++) {
        newData[i] = origData[i] * mult;
      }
    }
    updateBuffer(newBuf, 'Normalized audio to 0 dB peak', {
      playhead: playheadTimeRef.current,
      selStart: selectionStartRef.current,
      selEnd: selectionEndRef.current,
    });
  };

  const handleApplyGain = () => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const mult = Math.pow(10, gainDb / 20);
    const rate = buf.sampleRate;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;
    const startSample = Math.floor(selStart * rate);
    const endSample = Math.floor(selEnd * rate);

    const newBuf = ctx.createBuffer(buf.numberOfChannels, buf.length, rate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const origData = buf.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData);
      for (let i = startSample; i < endSample; i++) {
        newData[i] = Math.max(-1, Math.min(1, origData[i] * mult));
      }
    }
    updateBuffer(newBuf, `Applied ${gainDb > 0 ? '+' : ''}${gainDb}dB Gain`, {
      playhead: playheadTimeRef.current,
      selStart,
      selEnd,
    });
    setActiveModal(null);
  };

  const handleApplyFade = (type) => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const rate = buf.sampleRate;
    const fadeSec = type === 'in' ? fadeInSec : fadeOutSec;
    const fadeSamples = Math.floor(fadeSec * rate);

    const newBuf = ctx.createBuffer(buf.numberOfChannels, buf.length, rate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const origData = buf.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData);

      if (type === 'in') {
        const startSample = Math.floor(selectionStartRef.current * rate);
        const endSample = Math.min(buf.length, startSample + fadeSamples);
        for (let i = startSample; i < endSample; i++) {
          const factor = (i - startSample) / (endSample - startSample);
          newData[i] *= factor;
        }
      } else {
        const endSample = Math.floor(selectionEndRef.current * rate);
        const startSample = Math.max(0, endSample - fadeSamples);
        for (let i = startSample; i < endSample; i++) {
          const factor = 1 - (i - startSample) / (endSample - startSample);
          newData[i] *= factor;
        }
      }
    }
    updateBuffer(newBuf, `Applied Fade ${type === 'in' ? 'In' : 'Out'}`, {
      playhead: playheadTimeRef.current,
      selStart: selectionStartRef.current,
      selEnd: selectionEndRef.current,
    });
    setActiveModal(null);
  };

  const handleApplyReverse = () => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const rate = buf.sampleRate;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;
    const startSample = Math.floor(selStart * rate);
    const endSample = Math.floor(selEnd * rate);

    const newBuf = ctx.createBuffer(buf.numberOfChannels, buf.length, rate);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const origData = buf.getChannelData(c);
      const newData = newBuf.getChannelData(c);
      newData.set(origData);
      const sub = origData.subarray(startSample, endSample);
      for (let i = 0; i < sub.length; i++) {
        newData[startSample + i] = sub[sub.length - 1 - i];
      }
    }
    updateBuffer(newBuf, 'Reversed audio selection', {
      playhead: playheadTimeRef.current,
      selStart,
      selEnd,
    });
  };

  const handleApplySpeed = () => {
    if (!audioBufferRef.current) return;
    const buf = audioBufferRef.current;
    const ctx = getAudioContext();
    const rate = buf.sampleRate;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;
    const startSample = Math.floor(selStart * rate);
    const endSample = Math.floor(selEnd * rate);
    const oldRangeLen = endSample - startSample;
    if (oldRangeLen <= 0) return;

    const mult = speedMultiplier;
    const newRangeLen = Math.floor(oldRangeLen / mult);
    const newTotalLength = buf.length - oldRangeLen + newRangeLen;
    const numChannels = buf.numberOfChannels;

    const newBuf = ctx.createBuffer(numChannels, newTotalLength, rate);

    for (let c = 0; c < numChannels; c++) {
      const origData = buf.getChannelData(c);
      const newData = newBuf.getChannelData(c);

      newData.set(origData.subarray(0, startSample), 0);

      for (let i = 0; i < newRangeLen; i++) {
        const origIdx = startSample + Math.floor(i * mult);
        newData[startSample + i] =
          origData[Math.min(endSample - 1, origIdx)] || 0;
      }

      newData.set(origData.subarray(endSample), startSample + newRangeLen);
    }

    updateBuffer(newBuf, `Applied ${mult}x Speed Adjustment`, {
      playhead: selStart,
      selStart: selStart,
      selEnd: selStart + newRangeLen / rate,
    });
    setActiveModal(null);
  };

  // Keyboard Shortcuts Handler
  const handleKeyDown = useCallback(
    (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isCmdOrCtrl && key === 'a') {
        e.preventDefault();
        setSelectionStart(0);
        selectionStartRef.current = 0;
        setSelectionEnd(durationRef.current);
        selectionEndRef.current = durationRef.current;
        renderCanvas();
        showToast('Selected all audio', 'info');
      } else if (isCmdOrCtrl && key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (isCmdOrCtrl && key === 'x') {
        e.preventDefault();
        handleCut();
      } else if (isCmdOrCtrl && key === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (isCmdOrCtrl && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (isCmdOrCtrl && key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteRange();
      } else if (e.key === 'Escape') {
        const pTime = playheadTimeRef.current;
        setSelectionStart(pTime);
        selectionStartRef.current = pTime;
        setSelectionEnd(pTime);
        selectionEndRef.current = pTime;
        renderCanvas();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isPlayingRef.current) stopAudio();
        else startAudio();
      }
    },
    [
      handleCopy,
      handleCut,
      handleDeleteRange,
      handlePaste,
      handleUndo,
      handleRedo,
      renderCanvas,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── MOUSE INTERACTION & HANDLE DRAGGING ON WAVEFORM CANVAS ──
  const handleCanvasMouseDown = (e) => {
    if (!audioBufferRef.current || !canvasRef.current) return;
    stopAudio();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dur = durationRef.current;
    const clickedTime = Math.max(0, Math.min((x / rect.width) * dur, dur));

    const selX1 = (selectionStartRef.current / dur) * rect.width;
    const selX2 = (selectionEndRef.current / dur) * rect.width;

    if (Math.abs(x - selX1) < 8) {
      isDraggingStartRef.current = true;
      return;
    }
    if (Math.abs(x - selX2) < 8) {
      isDraggingEndRef.current = true;
      return;
    }

    isSelectingRef.current = true;
    setSelectionStart(clickedTime);
    selectionStartRef.current = clickedTime;
    setSelectionEnd(clickedTime);
    selectionEndRef.current = clickedTime;
    setPlayheadTime(clickedTime);
    playheadTimeRef.current = clickedTime;
    renderCanvas(clickedTime);
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBufferRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dur = durationRef.current;
    const hoverTime = Math.max(0, Math.min((x / rect.width) * dur, dur));

    const selX1 = (selectionStartRef.current / dur) * rect.width;
    const selX2 = (selectionEndRef.current / dur) * rect.width;
    if (Math.abs(x - selX1) < 8 || Math.abs(x - selX2) < 8) {
      canvas.style.cursor = 'col-resize';
    } else {
      canvas.style.cursor = 'crosshair';
    }

    if (isDraggingStartRef.current) {
      const newStart = Math.min(hoverTime, selectionEndRef.current);
      setSelectionStart(newStart);
      selectionStartRef.current = newStart;
      renderCanvas();
    } else if (isDraggingEndRef.current) {
      const newEnd = Math.max(hoverTime, selectionStartRef.current);
      setSelectionEnd(newEnd);
      selectionEndRef.current = newEnd;
      renderCanvas();
    } else if (isSelectingRef.current) {
      const start = selectionStartRef.current;
      if (hoverTime < start) {
        setSelectionStart(hoverTime);
        selectionStartRef.current = hoverTime;
      } else {
        setSelectionEnd(hoverTime);
        selectionEndRef.current = hoverTime;
      }
      renderCanvas();
    }
  };

  const handleCanvasMouseUp = () => {
    isSelectingRef.current = false;
    isDraggingStartRef.current = false;
    isDraggingEndRef.current = false;
  };

  const handleDoubleClick = () => {
    setSelectionStart(0);
    selectionStartRef.current = 0;
    setSelectionEnd(durationRef.current);
    selectionEndRef.current = durationRef.current;
    renderCanvas();
    showToast('Selected full track', 'info');
  };

  // Helper WAV Encoder
  const bufferToWav = (buffer, isSelectionOnly = false) => {
    const rate = buffer.sampleRate;
    const numOfChan = buffer.numberOfChannels;
    const selStart = selectionStartRef.current;
    const selEnd = selectionEndRef.current;

    const startFrame = isSelectionOnly ? Math.floor(selStart * rate) : 0;
    const endFrame = isSelectionOnly
      ? Math.floor(selEnd * rate)
      : buffer.length;
    const frameCount = endFrame - startFrame;

    const length = frameCount * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
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
    setUint32(rate);
    setUint32(rate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    const channels = [];
    for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));

    let offset = startFrame;
    while (pos < length && offset < endFrame) {
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

  // Export File Handler
  const handleExport = async () => {
    if (!audioBufferRef.current) return;
    setIsProcessing(true);
    setProgress(15);
    try {
      const isSel =
        exportScope === 'selection' && selectionEnd > selectionStart;
      const wavBytes = bufferToWav(audioBufferRef.current, isSel);
      const outputMime = exportFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
      const outputExt = exportFormat;
      const outBlob = new Blob([wavBytes], { type: outputMime });
      const outUrl = URL.createObjectURL(outBlob);
      const baseName = file?.name
        ? file.name.replace(/\.[^.]+$/, '')
        : 'audiomass_edit';
      const fileName = `${baseName}_${isSel ? 'selection' : 'full'}.${outputExt}`;

      setResult({ url: outUrl, fileName, size: outBlob.size });
      saveToolHistory('audio-editor', {
        name: fileName,
        format: outputExt,
        size: formatFileSize(outBlob.size),
        duration: formatDigitalTime(duration),
      });
      setHistoryRefresh((prev) => prev + 1);
      setProgress(100);
      showSuccess(`Exported as ${outputExt.toUpperCase()}`);
      setActiveModal(null);
    } catch (e) {
      showToast('Export failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format Digital Time Readout
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
              <div className="absolute left-0 top-full mt-1 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <FileAudio className="w-3.5 h-3.5 text-cyan-400" /> Open /
                  Import Audio...
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
                <button
                  onClick={() => {
                    if (isRecording) stopRecording();
                    else startRecording();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2 text-rose-400"
                >
                  <Mic className="w-3.5 h-3.5" /> Record Microphone
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    setActiveModal('export');
                    setActiveMenu(null);
                  }}
                  disabled={!audioBuffer}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 disabled:opacity-40 flex items-center gap-2 text-emerald-400 font-bold"
                >
                  <Download className="w-3.5 h-3.5" /> Export / Download
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
              <div className="absolute left-0 top-full mt-1 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    handleUndo();
                    setActiveMenu(null);
                  }}
                  disabled={undoStack.length <= 1}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 disabled:opacity-40 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Undo2 className="w-3.5 h-3.5 text-cyan-400" /> Undo
                  </span>
                  <span className="text-[10px] text-slate-500">Ctrl+Z</span>
                </button>
                <button
                  onClick={() => {
                    handleRedo();
                    setActiveMenu(null);
                  }}
                  disabled={redoStack.length === 0}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 disabled:opacity-40 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Redo2 className="w-3.5 h-3.5 text-cyan-400" /> Redo
                  </span>
                  <span className="text-[10px] text-slate-500">Ctrl+Y</span>
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    handleCopy();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-cyan-400" /> Copy
                    Selection
                  </span>
                  <span className="text-[10px] text-slate-500">Ctrl+C</span>
                </button>
                <button
                  onClick={() => {
                    handleCut();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-cyan-400" /> Cut
                    Selection
                  </span>
                  <span className="text-[10px] text-slate-500">Ctrl+X</span>
                </button>
                <button
                  onClick={() => {
                    handlePaste();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center justify-between text-emerald-400 font-bold"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardPaste className="w-3.5 h-3.5" /> Paste at Playhead
                  </span>
                  <span className="text-[10px] text-slate-500">Ctrl+V</span>
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    handleSilence();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" /> Silence
                  Selection
                </button>
                <button
                  onClick={() => {
                    handleTrim();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />{' '}
                  Trim Outside Selection
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
              <div className="absolute left-0 top-full mt-1 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    handleNormalize();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Wand2 className="w-3.5 h-3.5 text-cyan-400" /> Peak Normalize
                  (0dB)
                </button>
                <button
                  onClick={() => {
                    setActiveModal('gain');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Gain /
                  Amplification
                </button>
                <button
                  onClick={() => {
                    setActiveModal('fade');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Fade In /
                  Out
                </button>
                <button
                  onClick={() => {
                    handleApplyReverse();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Reverse
                  Audio
                </button>
                <button
                  onClick={() => {
                    setActiveModal('speed');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-900/40 hover:text-cyan-300 flex items-center gap-2"
                >
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Speed / Pitch
                  Change
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
          {isRecording && (
            <Badge
              variant="outline"
              className="border-rose-500/50 bg-rose-500/20 text-rose-400 text-[10px] font-bold animate-pulse flex items-center gap-1"
            >
              <Mic className="w-3 h-3" /> REC {formatDigitalTime(recordingTime)}
            </Badge>
          )}
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
        <div className="flex items-center gap-3 bg-black/80 px-4 py-2 rounded-lg border border-slate-800">
          <div className="text-xl font-bold tracking-widest text-cyan-400 font-mono">
            {formatDigitalTime(playheadTime)}
          </div>
          <div className="text-[10px] text-slate-500 flex flex-col font-mono leading-none border-l border-slate-800 pl-3">
            <span>TOTAL: {formatDigitalTime(duration)}</span>
            <span className="text-cyan-500/80">
              RATE: {audioBuffer?.sampleRate || 44100} Hz
            </span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              stopAudio();
              setPlayheadTime(0);
              playheadTimeRef.current = 0;
              renderCanvas(0);
            }}
            className="p-2 hover:bg-slate-800 rounded text-slate-300 transition-colors"
            title="Stop & Reset to Start"
          >
            <Square className="w-4 h-4 fill-slate-300" />
          </button>
          <button
            onClick={startAudio}
            className={cn(
              'p-2 rounded transition-colors',
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            )}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
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
            title="Loop Selected Region"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              'p-2 rounded transition-colors flex items-center gap-1',
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'hover:bg-slate-800 text-rose-400'
            )}
            title={isRecording ? 'Stop Recording' : 'Record Mic'}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-cyan-400"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-cyan-400"
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 my-auto mx-0.5" />
          <button
            onClick={handleCopy}
            disabled={!audioBuffer}
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
            title="Copy Selection (Ctrl+C)"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleCut}
            disabled={!audioBuffer}
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300"
            title="Cut Selection (Ctrl+X)"
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
            className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded text-amber-400"
            title="Silence Selection"
          >
            <VolumeX className="w-4 h-4" />
          </button>
        </div>

        {/* Selection Readout */}
        <div className="flex items-center gap-3 bg-black/60 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px]">
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
              selectionStartRef.current = 0;
              setSelectionEnd(duration);
              selectionEndRef.current = duration;
              renderCanvas();
            }}
            className="ml-2 text-[10px] text-slate-400 hover:text-slate-200 underline"
          >
            Select All
          </button>
        </div>
      </div>

      {/* ── 3. MAIN WORKSPACE / WAVEFORM CANVAS WITH HORIZONTAL SCROLL ── */}
      <div
        className={cn(
          'relative bg-[#07090e] p-2 min-h-[300px]',
          dragActive && 'ring-2 ring-cyan-500 bg-cyan-950/20'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
        }}
      >
        {!audioBuffer ? (
          <div className="flex flex-col items-center justify-center h-[280px] border-2 border-dashed border-slate-800 rounded-xl gap-4 bg-slate-950/40">
            <Music className="w-12 h-12 text-cyan-500 animate-pulse" />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">
                Drag & Drop an Audio File here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports MP3, WAV, FLAC, AAC, OGG, M4A
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                <FileAudio className="w-3.5 h-3.5 mr-1" /> Open Audio File
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
          <div
            ref={containerRef}
            tabIndex={0}
            className="w-full overflow-x-auto relative rounded border border-slate-800 shadow-inner scrollbar-thin scrollbar-thumb-slate-800 outline-none focus:ring-1 focus:ring-cyan-500/40"
          >
            <canvas
              ref={canvasRef}
              height={280}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onDoubleClick={handleDoubleClick}
              className="block cursor-crosshair"
            />
          </div>
        )}

        {/* Zoom Controls */}
        {audioBuffer && (
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <ZoomIn className="w-3.5 h-3.5 text-cyan-400" /> TIMELINE ZOOM:
              </span>
              <button
                onClick={() => {
                  const val = Math.max(1, zoomH - 0.5);
                  setZoomH(val);
                  zoomHRef.current = val;
                  renderCanvas();
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center gap-1"
                title="Zoom Out Timeline"
              >
                <ZoomOut className="w-3 h-3" /> -
              </button>
              <span className="font-bold text-cyan-400">{zoomH}x</span>
              <button
                onClick={() => {
                  const val = Math.min(10, zoomH + 0.5);
                  setZoomH(val);
                  zoomHRef.current = val;
                  renderCanvas();
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center gap-1"
                title="Zoom In Timeline"
              >
                <ZoomIn className="w-3 h-3" /> +
              </button>
              <button
                onClick={() => {
                  setZoomH(1);
                  zoomHRef.current = 1;
                  renderCanvas();
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold"
              >
                RESET (1x)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>VERTICAL AMPLITUDE:</span>
              <button
                onClick={() => {
                  const val = Math.max(0.5, zoomV - 0.25);
                  setZoomV(val);
                  zoomVRef.current = val;
                  renderCanvas();
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                ↕-
              </button>
              <span className="font-bold text-slate-200">
                {zoomV.toFixed(2)}x
              </span>
              <button
                onClick={() => {
                  const val = Math.min(4, zoomV + 0.25);
                  setZoomV(val);
                  zoomVRef.current = val;
                  renderCanvas();
                }}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
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
                {formatFileSize(result.size)} • Rendered successfully
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

      {/* Import / Add Audio Prompt Modal */}
      {activeModal === 'import' && pendingImport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-cyan-400" /> Add Audio Options
              </h3>
              <button
                onClick={() => {
                  setPendingImport(null);
                  setActiveModal(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <p className="text-xs text-slate-300 font-bold flex items-center gap-1.5 truncate">
                <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />{' '}
                {pendingImport.fileName}
              </p>
              <p className="text-[10px] text-slate-500">
                Duration:{' '}
                <span className="text-cyan-400">
                  {formatDigitalTime(pendingImport.duration)}
                </span>{' '}
                • Rate: {pendingImport.buffer.sampleRate}Hz
              </p>
            </div>

            <p className="text-xs text-slate-300">
              An audio file is currently active. How would you like to process
              the new audio?
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={confirmInsertAtPlayhead}
                className="w-full text-left p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/50 transition-all flex items-start gap-3 group"
              >
                <Plus className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    Insert in Existing File (at Playhead)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Inserts audio at {playheadTime.toFixed(2)}s and{' '}
                    <strong className="text-purple-300">
                      selects the inserted region
                    </strong>{' '}
                    on the waveform canvas.
                  </div>
                </div>
              </button>

              <button
                onClick={confirmAppendAtEnd}
                className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800/80 transition-all flex items-start gap-3 group"
              >
                <SlidersHorizontal className="w-5 h-5 text-purple-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Append to End of Current Track
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Adds new audio at {duration.toFixed(2)}s and selects the
                    appended waveform region.
                  </div>
                </div>
              </button>

              <button
                onClick={confirmReplaceTrack}
                className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800/80 transition-all flex items-start gap-3 group"
              >
                <RefreshCw className="w-5 h-5 text-amber-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Open as New File (Replace Existing)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Discards current audio track and opens this file as a fresh
                    new project.
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  setPendingImport(null);
                  setActiveModal(null);
                }}
                variant="outline"
                className="border-slate-700 text-xs text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {activeModal === 'export' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  Export Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportScope('full')}
                    className={cn(
                      'p-2 rounded border text-center font-bold',
                      exportScope === 'full'
                        ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                        : 'border-slate-800 bg-slate-950'
                    )}
                  >
                    Entire File ({duration.toFixed(2)}s)
                  </button>
                  <button
                    onClick={() => setExportScope('selection')}
                    className={cn(
                      'p-2 rounded border text-center font-bold',
                      exportScope === 'selection'
                        ? 'border-purple-500 bg-purple-950 text-purple-300'
                        : 'border-slate-800 bg-slate-950'
                    )}
                  >
                    Selection Only ({(selectionEnd - selectionStart).toFixed(2)}
                    s)
                  </button>
                </div>
              </div>

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
                    MP3 Audio
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
                className="bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-bold"
              >
                {isProcessing ? 'Encoding...' : 'Export Audio'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gain Modal */}
      {activeModal === 'gain' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                <span>Amplification</span>
                <span className="text-cyan-400 font-bold">
                  {gainDb > 0 ? '+' : ''}
                  {gainDb} dB
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                  className="w-full mt-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold"
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
                  className="w-full mt-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold"
                >
                  Apply Fade Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Speed / Pitch Change Modal */}
      {activeModal === 'speed' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" /> Speed / Pitch Change
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
                <span>Playback Speed Factor</span>
                <span className="text-cyan-400 font-bold">
                  {speedMultiplier}x
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSpeedMultiplier(spd)}
                    className={cn(
                      'py-1.5 rounded border text-center font-bold text-xs',
                      speedMultiplier === spd
                        ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    )}
                  >
                    {spd}x
                  </button>
                ))}
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
                onClick={handleApplySpeed}
                className="bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-bold"
              >
                Apply Speed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" /> AudioMass Quick
                Help
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
                • <strong>Timeline Zoom:</strong> Use Zoom + / - buttons to
                expand timeline horizontally. Scroll horizontally to inspect
                precise milliseconds in the top seconds ruler.
              </p>
              <p>
                • <strong>Waveform Selection:</strong> Click and drag to select
                audio regions. Double-click to select full track.
              </p>
              <p>
                • <strong>Editing Preserves Position:</strong> Cut, copy, paste,
                delete, and silence operations preserve your playhead position
                and highlight newly pasted audio without resetting.
              </p>
              <p>
                • <strong>Keyboard Shortcuts:</strong> Space (Play/Pause),
                Ctrl+A (Select All), Ctrl+C (Copy), Ctrl+X (Cut), Ctrl+V (Paste
                at playhead), Delete (Delete selection), Ctrl+Z (Undo), Ctrl+Y
                (Redo).
              </p>
            </div>
            <Button
              onClick={() => setActiveModal(null)}
              className="w-full bg-cyan-600 text-white text-xs font-bold"
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
