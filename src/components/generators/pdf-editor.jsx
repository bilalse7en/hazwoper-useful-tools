'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadPdfJs } from '@/lib/pdf-js-loader';
import { createBlankPdf, exportModifiedPdf } from '@/lib/pdf-editor-engine';
import { PageThumbnailSidebar } from './pdf-editor/page-thumbnail-sidebar';
import { CanvasOverlay } from './pdf-editor/canvas-overlay';
import { SignatureModal } from './pdf-editor/signature-modal';
import { InsertPageModal } from './pdf-editor/insert-page-modal';
import { StampPickerModal } from './pdf-editor/stamp-picker-modal';
import { generateCoverPagePdf } from '@/lib/cover-page-engine';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileUp,
  FilePlus,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Type,
  ImageIcon,
  PenTool,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Slash,
  EyeOff,
  Pen,
  Stamp,
  CheckSquare,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

export function PDFEditor() {
  const [pdfJs, setPdfJs] = useState(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState(null);
  const [fileName, setFileName] = useState('document.pdf');
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [overlaysMap, setOverlaysMap] = useState({});
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);

  const [activeTool, setActiveTool] = useState('select');
  const [scale, setScale] = useState(1.0);

  // Pen settings
  const [penColor, setPenColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(3);

  // Modals
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);

  // Rendered preview cache map: pageId -> dataUrl
  const [pagePreviews, setPagePreviews] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // History stack for Undo / Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pdfViewportCanvasRef = useRef(null);
  const viewportContainerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomInputText, setZoomInputText] = useState('100');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoomInputText(String(Math.round(scale * 100)));
  }, [scale]);

  const handleApplyZoomInput = () => {
    const parsed = parseInt(zoomInputText.replace('%', ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(25, Math.min(400, parsed));
      setScale(clamped / 100);
      setZoomInputText(String(clamped));
    } else {
      setZoomInputText(String(Math.round(scale * 100)));
    }
  };

  const activePage = pages[activePageIndex];

  const handleFitPage = useCallback(() => {
    if (!activePage || !viewportContainerRef.current) return;
    const containerW = viewportContainerRef.current.clientWidth - 80;
    const containerH = viewportContainerRef.current.clientHeight - 80;
    const pageW = activePage.width || 612;
    const pageH = activePage.height || 792;

    const scaleW = containerW / pageW;
    const scaleH = containerH / pageH;
    const fitScale = Math.min(2.0, Math.max(0.35, Math.min(scaleW, scaleH)));
    setScale(fitScale);
  }, [activePage]);

  const handleFitWidth = useCallback(() => {
    if (!activePage || !viewportContainerRef.current) return;
    const containerW = viewportContainerRef.current.clientWidth - 80;
    const pageW = activePage.width || 612;
    const fitScale = Math.min(2.0, Math.max(0.35, containerW / pageW));
    setScale(fitScale);
  }, [activePage]);

  // Save snapshot to history stack
  const recordHistorySnapshot = useCallback(
    (newPages, newOverlaysMap) => {
      const snapshot = {
        pages: JSON.parse(JSON.stringify(newPages)),
        overlaysMap: JSON.parse(JSON.stringify(newOverlaysMap)),
      };
      setHistory((prev) => {
        const nextHistory = prev.slice(0, historyIndex + 1);
        nextHistory.push(snapshot);
        return nextHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Create default new blank PDF
  const handleCreateNewDoc = useCallback(async (options = {}) => {
    setIsProcessing(true);
    try {
      const blankBuffer = await createBlankPdf(options);
      setPdfArrayBuffer(blankBuffer);
      setFileName('new_document.pdf');

      const initialPages = [
        {
          id: `page_${Date.now()}_0`,
          originalPageIndex: 0,
          isNew: true,
          rotation: 0,
          width: 612,
          height: 792,
          bgColor: options.bgColor || '#ffffff',
        },
      ];
      const initialOverlays = { [initialPages[0].id]: [] };

      setPages(initialPages);
      setActivePageIndex(0);
      setOverlaysMap(initialOverlays);

      setHistory([{ pages: initialPages, overlaysMap: initialOverlays }]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Error creating blank PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Load PDF.js on mount
  useEffect(() => {
    loadPdfJs()
      .then((lib) => {
        setPdfJs(lib);
        // Create initial blank document
        handleCreateNewDoc();
      })
      .catch((err) => {
        console.error('Failed to load PDF.js engine:', err);
      });
  }, [handleCreateNewDoc]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const snapshot = history[targetIndex];
      setPages(JSON.parse(JSON.stringify(snapshot.pages)));
      setOverlaysMap(JSON.parse(JSON.stringify(snapshot.overlaysMap)));
      setHistoryIndex(targetIndex);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const snapshot = history[targetIndex];
      setPages(JSON.parse(JSON.stringify(snapshot.pages)));
      setOverlaysMap(JSON.parse(JSON.stringify(snapshot.overlaysMap)));
      setHistoryIndex(targetIndex);
    }
  }, [historyIndex, history]);

  const handleDeleteOverlay = useCallback(
    (overlayId) => {
      const activePage = pages[activePageIndex];
      if (!activePage) return;

      const activeOverlays = overlaysMap[activePage.id] || [];
      const updatedOverlays = activeOverlays.filter((o) => o.id !== overlayId);

      const updatedMap = {
        ...overlaysMap,
        [activePage.id]: updatedOverlays,
      };

      setOverlaysMap(updatedMap);
      if (selectedOverlayId === overlayId) {
        setSelectedOverlayId(null);
      }
      recordHistorySnapshot(pages, updatedMap);
    },
    [
      activePageIndex,
      overlaysMap,
      pages,
      recordHistorySnapshot,
      selectedOverlayId,
    ]
  );

  // Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        }
        if (scale !== 1.0) {
          handleFitPage();
        }
        if (selectedOverlayId) {
          setSelectedOverlayId(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedOverlayId
      ) {
        handleDeleteOverlay(selectedOverlayId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDeleteOverlay,
    selectedOverlayId,
    isFullscreen,
    scale,
    handleFitPage,
  ]);

  // Upload external PDF file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pdfJs) return;

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      setPdfArrayBuffer(buffer);
      setFileName(file.name);

      const bufferCopy = buffer.slice(0);
      const loadingTask = pdfJs.getDocument({ data: bufferCopy });
      const doc = await loadingTask.promise;
      const numPages = doc.numPages;

      const newPages = [];
      const newOverlaysMap = {};
      const previewsMap = {};

      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d');

      for (let i = 0; i < numPages; i++) {
        const pdfPage = await doc.getPage(i + 1);
        const viewport = pdfPage.getViewport({ scale: 1.0 });

        const pageObj = {
          id: `page_${Date.now()}_${i}`,
          originalPageIndex: i,
          isNew: false,
          rotation: 0,
          width: viewport.width,
          height: viewport.height,
        };
        newPages.push(pageObj);
        newOverlaysMap[pageObj.id] = [];

        // Generate sidebar thumbnail for each page
        const thumbViewport = pdfPage.getViewport({ scale: 0.3 });
        offscreenCanvas.width = thumbViewport.width;
        offscreenCanvas.height = thumbViewport.height;
        offscreenCtx.fillStyle = '#ffffff';
        offscreenCtx.fillRect(0, 0, thumbViewport.width, thumbViewport.height);

        await pdfPage.render({
          canvasContext: offscreenCtx,
          viewport: thumbViewport,
        }).promise;

        previewsMap[pageObj.id] = offscreenCanvas.toDataURL('image/png');
      }

      setPages(newPages);
      setActivePageIndex(0);
      setOverlaysMap(newOverlaysMap);
      setPagePreviews(previewsMap);

      setHistory([{ pages: newPages, overlaysMap: newOverlaysMap }]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Error loading uploaded PDF:', err);
      Swal.fire({
        icon: 'error',
        title: 'Failed to load PDF',
        text: 'Please make sure the file is a valid PDF document.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Render current active page background canvas using PDF.js
  const renderActivePageBackground = useCallback(async () => {
    if (
      !pdfJs ||
      !pdfArrayBuffer ||
      pages.length === 0 ||
      !pages[activePageIndex]
    ) {
      return;
    }

    const pageConfig = pages[activePageIndex];
    const canvas = pdfViewportCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // If page is a new blank page
    if (pageConfig.isNew) {
      canvas.width = pageConfig.width * scale;
      canvas.height = pageConfig.height * scale;
      ctx.fillStyle = pageConfig.bgColor || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/png');
      setPagePreviews((prev) => ({ ...prev, [pageConfig.id]: dataUrl }));
      return;
    }

    // Cancel any active render task on the canvas before starting a new one
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (cancelErr) {
        // Ignore cancellation error
      }
      renderTaskRef.current = null;
    }

    // Original page render with PDF.js
    try {
      const bufferCopy = pdfArrayBuffer.slice(0);
      const loadingTask = pdfJs.getDocument({ data: bufferCopy });
      const doc = await loadingTask.promise;
      const pdfPage = await doc.getPage(pageConfig.originalPageIndex + 1);

      const viewport = pdfPage.getViewport({
        scale: scale,
        rotation: pageConfig.rotation || 0,
      });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Fill solid white paper background before rendering PDF elements
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const renderTask = pdfPage.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;

      const dataUrl = canvas.toDataURL('image/png');
      setPagePreviews((prev) => ({ ...prev, [pageConfig.id]: dataUrl }));
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page preview:', err);
      }
    } finally {
      renderTaskRef.current = null;
    }
  }, [pdfJs, pdfArrayBuffer, pages, activePageIndex, scale]);

  useEffect(() => {
    renderActivePageBackground();
  }, [renderActivePageBackground]);

  // Overlay operations
  const activeOverlays = activePage ? overlaysMap[activePage.id] || [] : [];

  const handleAddOverlay = (item) => {
    if (!activePage) return;
    const newId = `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newOverlay = { id: newId, ...item };

    const updatedMap = {
      ...overlaysMap,
      [activePage.id]: [...activeOverlays, newOverlay],
    };

    setOverlaysMap(updatedMap);
    setSelectedOverlayId(newId);
    recordHistorySnapshot(pages, updatedMap);
  };

  const handleUpdateOverlay = (overlayId, updates) => {
    if (!activePage) return;
    const updatedOverlays = activeOverlays.map((o) =>
      o.id === overlayId ? { ...o, ...updates } : o
    );

    const updatedMap = {
      ...overlaysMap,
      [activePage.id]: updatedOverlays,
    };

    setOverlaysMap(updatedMap);
    recordHistorySnapshot(pages, updatedMap);
  };

  const handleDuplicateOverlay = (overlayId) => {
    const target = activeOverlays.find((o) => o.id === overlayId);
    if (!target) return;

    handleAddOverlay({
      ...target,
      x: target.x + 20,
      y: target.y + 20,
    });
  };

  // Add specific tools
  const handleAddText = () => {
    handleAddOverlay({
      type: 'text',
      x: 50,
      y: 50,
      width: 220,
      height: 40,
      text: 'Type your text here...',
      fontSize: 18,
      color: '#000000',
      fontFamily: 'Helvetica, sans-serif',
      fontWeight: 'normal',
      textAlign: 'left',
    });
  };

  const handleAddImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const img = new Image();
        img.onload = () => {
          const aspect = img.height / img.width;
          const w = Math.min(300, img.width);
          const h = w * aspect;
          handleAddOverlay({
            type: 'image',
            x: 100,
            y: 100,
            width: w,
            height: h,
            src: dataUrl,
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddWhiteout = (type = 'whiteout') => {
    handleAddOverlay({
      type,
      x: 100,
      y: 100,
      width: 180,
      height: 40,
      color: type === 'redact' ? '#000000' : '#ffffff',
    });
  };

  const handleAddShape = (shapeType) => {
    handleAddOverlay({
      type: 'shape',
      shapeType,
      x: 120,
      y: 120,
      width: shapeType === 'line' || shapeType === 'arrow' ? 150 : 120,
      height: shapeType === 'line' || shapeType === 'arrow' ? 10 : 80,
      fillColor:
        shapeType === 'line' || shapeType === 'arrow'
          ? 'transparent'
          : '#3b82f620',
      strokeColor: '#2563eb',
      borderWidth: 2,
    });
  };

  const handleAddCheckbox = () => {
    handleAddOverlay({
      type: 'checkbox',
      x: 100,
      y: 100,
      width: 24,
      height: 24,
      checked: false,
    });
  };

  // ── Add branded cover page as first page ──
  const handleAddCoverPage = async () => {
    if (!pdfJs) return;
    setIsProcessing(true);
    try {
      const coverBuffer = await generateCoverPagePdf();
      const bufferCopy = coverBuffer.slice(0);
      const loadingTask = pdfJs.getDocument({ data: bufferCopy });
      const doc = await loadingTask.promise;
      const pdfPage = await doc.getPage(1);
      const viewport = pdfPage.getViewport({ scale: 1.0 });

      const coverPageObj = {
        id: `page_${Date.now()}_cover`,
        originalPageIndex: 0,
        isNew: false,
        isCoverPage: true,
        rotation: 0,
        width: viewport.width,
        height: viewport.height,
        _coverBuffer: coverBuffer,
      };

      // Generate thumbnail
      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d');
      const thumbViewport = pdfPage.getViewport({ scale: 0.3 });
      offscreenCanvas.width = thumbViewport.width;
      offscreenCanvas.height = thumbViewport.height;
      offscreenCtx.fillStyle = '#ffffff';
      offscreenCtx.fillRect(0, 0, thumbViewport.width, thumbViewport.height);
      await pdfPage.render({
        canvasContext: offscreenCtx,
        viewport: thumbViewport,
      }).promise;
      const thumbDataUrl = offscreenCanvas.toDataURL('image/png');

      // Insert as first page
      const newPages = [coverPageObj, ...pages];
      const newOverlaysMap = { [coverPageObj.id]: [], ...overlaysMap };

      // We need to store the cover buffer separately for export
      // We'll use a ref-like approach: stash it on the page config
      setPages(newPages);
      setActivePageIndex(0);
      setOverlaysMap(newOverlaysMap);
      setPagePreviews((prev) => ({ ...prev, [coverPageObj.id]: thumbDataUrl }));

      // For rendering the cover page background, we need to update the pdfArrayBuffer
      // We'll create a merged document
      const { PDFDocument } = await import('pdf-lib');
      const coverDoc = await PDFDocument.load(coverBuffer);
      let mergedDoc;

      if (pdfArrayBuffer) {
        const existingDoc = await PDFDocument.load(pdfArrayBuffer.slice(0), { ignoreEncryption: true });
        mergedDoc = await PDFDocument.create();
        
        // Copy cover page first
        const [coverPage] = await mergedDoc.copyPages(coverDoc, [0]);
        mergedDoc.addPage(coverPage);
        
        // Copy all existing pages
        const existingPageCount = existingDoc.getPageCount();
        for (let i = 0; i < existingPageCount; i++) {
          const [existingPage] = await mergedDoc.copyPages(existingDoc, [i]);
          mergedDoc.addPage(existingPage);
        }
      } else {
        mergedDoc = coverDoc;
      }

      const mergedBytes = await mergedDoc.save();
      const mergedBuffer = mergedBytes.buffer;
      setPdfArrayBuffer(mergedBuffer);

      // Update originalPageIndex for all pages since we prepended
      const updatedPages = newPages.map((p, idx) => ({
        ...p,
        originalPageIndex: idx,
        isNew: false,
      }));
      setPages(updatedPages);

      setHistory([{ pages: updatedPages, overlaysMap: newOverlaysMap }]);
      setHistoryIndex(0);

      Swal.fire({
        icon: 'success',
        title: 'Cover Page Added!',
        text: 'Branded HAZWOPER-OSHA cover page has been inserted as page 1.',
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Error adding cover page:', err);
      Swal.fire({
        icon: 'error',
        title: 'Failed to add cover page',
        text: 'An error occurred while generating the cover page.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Page management operations
  const handleInsertPage = (pageOpts) => {
    const newPageObj = {
      id: `page_${Date.now()}_new`,
      isNew: true,
      rotation: 0,
      width: pageOpts.width,
      height: pageOpts.height,
      bgColor: pageOpts.bgColor,
    };

    const newPages = [...pages];
    newPages.splice(pageOpts.targetIndex, 0, newPageObj);
    const newOverlaysMap = { ...overlaysMap, [newPageObj.id]: [] };

    setPages(newPages);
    setActivePageIndex(pageOpts.targetIndex);
    setOverlaysMap(newOverlaysMap);

    recordHistorySnapshot(newPages, newOverlaysMap);
  };

  const handleDuplicatePage = (pageIdx) => {
    const sourcePage = pages[pageIdx];
    const newPageObj = {
      ...sourcePage,
      id: `page_${Date.now()}_dup`,
    };

    const sourceOverlays = overlaysMap[sourcePage.id] || [];
    const duplicatedOverlays = sourceOverlays.map((o) => ({
      ...o,
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    }));

    const newPages = [...pages];
    newPages.splice(pageIdx + 1, 0, newPageObj);
    const newOverlaysMap = {
      ...overlaysMap,
      [newPageObj.id]: duplicatedOverlays,
    };

    setPages(newPages);
    setActivePageIndex(pageIdx + 1);
    setOverlaysMap(newOverlaysMap);

    recordHistorySnapshot(newPages, newOverlaysMap);
  };

  const handleMovePage = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= pages.length) return;
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIdx, 1);
    newPages.splice(toIdx, 0, moved);

    setPages(newPages);
    setActivePageIndex(toIdx);
    recordHistorySnapshot(newPages, overlaysMap);
  };

  const handleRotatePage = (pageIdx) => {
    const newPages = pages.map((p, i) =>
      i === pageIdx ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p
    );
    setPages(newPages);
    recordHistorySnapshot(newPages, overlaysMap);
  };

  const handleDeletePage = (pageIdx) => {
    if (pages.length <= 1) return;
    const deletedPageId = pages[pageIdx].id;
    const newPages = pages.filter((_, i) => i !== pageIdx);

    const newOverlaysMap = { ...overlaysMap };
    delete newOverlaysMap[deletedPageId];

    const nextActive = Math.min(pageIdx, newPages.length - 1);

    setPages(newPages);
    setActivePageIndex(nextActive);
    setOverlaysMap(newOverlaysMap);
    recordHistorySnapshot(newPages, newOverlaysMap);
  };

  // Export modified PDF
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const outputBuffer = await exportModifiedPdf({
        originalArrayBuffer: pdfArrayBuffer,
        pagesConfig: pages,
        overlaysMap: overlaysMap,
      });

      const blob = new Blob([outputBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.pdf')
        ? fileName.replace('.pdf', '_edited.pdf')
        : `${fileName}_edited.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'PDF Export Complete!',
        text: 'Your edited PDF document has been downloaded.',
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Export failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'An error occurred while generating the PDF document.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedOverlay = activeOverlays.find(
    (o) => o.id === selectedOverlayId
  );

  return (
    <div
      className={cn(
        'flex flex-col border border-border/80 rounded-2xl bg-card overflow-hidden shadow-2xl transition-all',
        isFullscreen
          ? 'fixed inset-2 z-50 h-[calc(100vh-1rem)]'
          : 'h-[calc(100vh-9rem)] min-h-[720px]'
      )}
    >
      {/* 1. TOP HEADER TOOLBAR */}
      <div className="bg-card border-b border-border p-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Left: Document Source controls */}
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="pdf-main-upload"
          />
          <Label htmlFor="pdf-main-upload">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold cursor-pointer gap-1.5"
            >
              <span>
                <FileUp className="w-4 h-4 text-primary" /> Open PDF
              </span>
            </Button>
          </Label>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateNewDoc()}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <FilePlus className="w-4 h-4 text-emerald-500" /> New Blank
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCoverPage}
            disabled={isProcessing}
            className="h-8 text-xs font-bold gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
            title="Add branded HAZWOPER-OSHA cover page as first page"
          >
            <BookOpen className="w-4 h-4" />
            {isProcessing ? 'Adding...' : 'Cover Page'}
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <span className="text-xs font-bold truncate max-w-[160px] text-muted-foreground">
            {fileName}
          </span>
        </div>

        {/* Center: History & Navigation */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={historyIndex <= 0}
            onClick={handleUndo}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={historyIndex >= history.length - 1}
            onClick={handleRedo}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Zoom controls */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setScale((s) => Math.max(0.25, s - 0.15))}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-0.5 bg-background border border-border rounded-md px-1.5 py-0.5">
            <Input
              type="text"
              value={zoomInputText}
              onChange={(e) => setZoomInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApplyZoomInput();
                }
              }}
              onBlur={handleApplyZoomInput}
              className="h-6 w-10 text-xs font-mono font-bold text-center p-0 border-0 focus-visible:ring-0 bg-transparent"
              title="Type zoom percentage and press Enter"
            />
            <span className="text-[11px] font-mono font-bold text-muted-foreground select-none">
              %
            </span>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setScale((s) => Math.min(3.0, s + 0.15))}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleFitPage}
            className="h-7 text-[11px] px-2 font-semibold"
          >
            Fit Page
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleFitWidth}
            className="h-7 text-[11px] px-2 font-semibold"
          >
            Fit Width
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale(1.0)}
            className="h-7 text-[11px] px-2 font-semibold"
          >
            100%
          </Button>
        </div>

        {/* Right: Export & Download */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isExporting || pages.length === 0}
            className="h-8 text-xs font-bold bg-primary text-primary-foreground gap-1.5 shadow"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* 2. SECONDARY EDITING TOOLBAR */}
      <div className="bg-muted/40 border-b border-border p-2 flex flex-wrap items-center justify-between gap-2 select-none overflow-x-auto">
        <div className="flex items-center gap-1">
          {/* Select Tool */}
          <Button
            size="sm"
            variant={activeTool === 'select' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('select')}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <Pen className="w-3.5 h-3.5" /> Select
          </Button>

          {/* Add Text */}
          <Button
            size="sm"
            variant={activeTool === 'text' ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTool('text');
              handleAddText();
            }}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <Type className="w-3.5 h-3.5 text-blue-500" /> Text
          </Button>

          {/* Add Image */}
          <Input
            type="file"
            accept="image/*"
            onChange={handleAddImageUpload}
            className="hidden"
            id="pdf-image-upload"
          />
          <Label htmlFor="pdf-image-upload">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 font-semibold cursor-pointer"
            >
              <span>
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Image
              </span>
            </Button>
          </Label>

          {/* Freehand Pen & Highlighter */}
          <Button
            size="sm"
            variant={activeTool === 'pen' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('pen')}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <PenTool className="w-3.5 h-3.5 text-purple-500" /> Pen
          </Button>
          <Button
            size="sm"
            variant={activeTool === 'highlighter' ? 'default' : 'ghost'}
            onClick={() => setActiveTool('highlighter')}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <Highlighter className="w-3.5 h-3.5 text-yellow-500" /> Highlight
          </Button>

          {/* Whiteout / Redact */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddWhiteout('whiteout')}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <Square className="w-3.5 h-3.5 text-white fill-white border border-slate-400" />{' '}
            Whiteout
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddWhiteout('redact')}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-900" /> Redact
          </Button>

          {/* Shapes dropdown / quick buttons */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddShape('rectangle')}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <Square className="w-3.5 h-3.5 text-indigo-500" /> Rectangle
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddShape('circle')}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <Circle className="w-3.5 h-3.5 text-indigo-500" /> Circle
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddShape('arrow')}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <Slash className="w-3.5 h-3.5 text-indigo-500" /> Arrow
          </Button>

          {/* Signature */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSignatureModalOpen(true)}
            className="h-7 text-xs gap-1 font-semibold text-sky-600"
          >
            <Pen className="w-3.5 h-3.5" /> Signature
          </Button>

          {/* Stamps */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsStampModalOpen(true)}
            className="h-7 text-xs gap-1 font-semibold text-rose-600"
          >
            <Stamp className="w-3.5 h-3.5" /> Stamp
          </Button>

          {/* Checkbox */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddCheckbox}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <CheckSquare className="w-3.5 h-3.5 text-teal-600" /> Checkbox
          </Button>
        </div>

        {/* Color picker for Pen / Tools */}
        {(activeTool === 'pen' || activeTool === 'highlighter') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              Color:
            </span>
            {['#0f172a', '#2563eb', '#dc2626', '#16a34a', '#eab308'].map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPenColor(c)}
                  className={cn(
                    'w-4 h-4 rounded-full border border-border',
                    penColor === c ? 'ring-2 ring-primary ring-offset-1' : ''
                  )}
                  style={{ backgroundColor: c }}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* 3. FLOATING FORMATTING BAR FOR SELECTED ITEM */}
      {selectedOverlay && (
        <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between gap-4 text-xs select-none">
          <div className="flex items-center gap-3">
            <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
              {selectedOverlay.type} Options
            </span>

            {/* Text options */}
            {selectedOverlay.type === 'text' && (
              <>
                <Select
                  value={selectedOverlay.fontFamily || 'Helvetica, sans-serif'}
                  onValueChange={(val) =>
                    handleUpdateOverlay(selectedOverlay.id, {
                      fontFamily: val,
                    })
                  }
                >
                  <SelectTrigger className="h-7 text-xs w-36 bg-background">
                    <SelectValue placeholder="Font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Helvetica, sans-serif">
                      Helvetica
                    </SelectItem>
                    <SelectItem value="Times New Roman, serif">
                      Times Roman
                    </SelectItem>
                    <SelectItem value="Courier New, monospace">
                      Courier
                    </SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Impact, sans-serif">Impact</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Size:</span>
                  <Input
                    type="number"
                    min="8"
                    max="120"
                    value={selectedOverlay.fontSize || 16}
                    onChange={(e) =>
                      handleUpdateOverlay(selectedOverlay.id, {
                        fontSize: Number(e.target.value),
                      })
                    }
                    className="h-7 w-16 text-xs bg-background"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Color:</span>
                  <input
                    type="color"
                    value={selectedOverlay.color || '#000000'}
                    onChange={(e) =>
                      handleUpdateOverlay(selectedOverlay.id, {
                        color: e.target.value,
                      })
                    }
                    className="w-6 h-6 rounded border border-border cursor-pointer p-0 bg-transparent"
                  />
                </div>
              </>
            )}

            {/* Shape options */}
            {selectedOverlay.type === 'shape' && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Stroke:</span>
                  <input
                    type="color"
                    value={selectedOverlay.strokeColor || '#2563eb'}
                    onChange={(e) =>
                      handleUpdateOverlay(selectedOverlay.id, {
                        strokeColor: e.target.value,
                      })
                    }
                    className="w-6 h-6 rounded border border-border cursor-pointer p-0 bg-transparent"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Fill:</span>
                  <input
                    type="color"
                    value={
                      selectedOverlay.fillColor === 'transparent'
                        ? '#ffffff'
                        : selectedOverlay.fillColor || '#ffffff'
                    }
                    onChange={(e) =>
                      handleUpdateOverlay(selectedOverlay.id, {
                        fillColor: e.target.value,
                      })
                    }
                    className="w-6 h-6 rounded border border-border cursor-pointer p-0 bg-transparent"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDuplicateOverlay(selectedOverlay.id)}
              className="h-7 text-xs gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteOverlay(selectedOverlay.id)}
              className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* 4. MAIN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Page Thumbnails Sidebar */}
        <PageThumbnailSidebar
          pages={pages}
          activePageIndex={activePageIndex}
          onSelectPage={setActivePageIndex}
          onMovePage={handleMovePage}
          onRotatePage={handleRotatePage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onOpenInsertModal={() => setIsInsertModalOpen(true)}
          thumbnailsMap={pagePreviews}
        />

        {/* Center PDF Viewport Canvas */}
        <div
          ref={viewportContainerRef}
          className="flex-1 bg-slate-100 dark:bg-slate-950/90 overflow-auto p-6 md:p-8 flex flex-col items-center justify-start relative select-none"
        >
          {/* Floating Quick Reset Zoom & Esc Helper */}
          {(scale !== 1.0 || isFullscreen) && (
            <div className="sticky top-2 z-40 mb-4 flex items-center gap-2 bg-background/95 backdrop-blur border border-border shadow-lg px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className="text-muted-foreground">
                Zoom:{' '}
                <strong className="text-foreground">
                  {Math.round(scale * 100)}%
                </strong>
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleFitPage}
                className="h-6 text-[10px] px-2.5 font-bold rounded-full gap-1"
              >
                Reset / Fit Page (Esc)
              </Button>
            </div>
          )}
          {pages.length > 0 && activePage ? (
            <div
              className="relative bg-white shadow-2xl transition-transform"
              style={{
                width: `${(activePage.width || 612) * scale}px`,
                height: `${(activePage.height || 792) * scale}px`,
              }}
            >
              {/* PDF Background Canvas rendered by PDF.js */}
              <canvas
                ref={pdfViewportCanvasRef}
                className="w-full h-full block pointer-events-none"
              />

              {/* Interactive HTML Link Overlay for Cover Page in Select Mode */}
              {Boolean(activePage?.isCoverPage || activePage?.id?.includes('cover')) && activeTool === 'select' && (
                <div className="absolute inset-0 z-20 pointer-events-auto">
                  {/* Phone */}
                  <a
                    href="tel:1-866-429-6742"
                    title="Call 1-866-429-6742"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '68%', top: '1.2%', width: '29%', height: '3.0%' }}
                  />
                  {/* Email */}
                  <a
                    href="mailto:info@hazwoper-osha.com"
                    title="Email info@hazwoper-osha.com"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '66%', top: '4.0%', width: '31%', height: '3.0%' }}
                  />
                  {/* Website Header */}
                  <a
                    href="https://hazwoper-osha.com"
                    target="_blank"
                    rel="noreferrer"
                    title="Visit www.hazwoper-osha.com"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '66%', top: '6.8%', width: '31%', height: '3.0%' }}
                  />
                  {/* Logo Header */}
                  <a
                    href="https://hazwoper-osha.com"
                    target="_blank"
                    rel="noreferrer"
                    title="HAZWOPER-OSHA Homepage"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '2.5%', top: '1.2%', width: '42%', height: '8.5%' }}
                  />
                  {/* QR Code Footer */}
                  <a
                    href="https://hazwoper-osha.com"
                    target="_blank"
                    rel="noreferrer"
                    title="Scan/Visit HAZWOPER-OSHA"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '2.3%', top: '85.5%', width: '13.5%', height: '10.5%' }}
                  />
                  {/* Services Column 1 */}
                  <a
                    href="https://hazwoper-osha.com/online-courses"
                    target="_blank"
                    rel="noreferrer"
                    title="Browse All OSHA & HAZWOPER Training Courses"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '18.5%', top: '84.0%', width: '28.0%', height: '12.0%' }}
                  />
                  {/* Services Column 2 */}
                  <a
                    href="https://hazwoper-osha.com/online-courses"
                    target="_blank"
                    rel="noreferrer"
                    title="Browse Safety Programs & Training"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '49.0%', top: '84.0%', width: '26.5%', height: '12.0%' }}
                  />
                  {/* Address Block */}
                  <a
                    href="https://hazwoper-osha.com/contact-us"
                    target="_blank"
                    rel="noreferrer"
                    title="HAZWOPER-OSHA Los Angeles Office - Contact Us"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '77.0%', top: '83.5%', width: '21.0%', height: '7.8%' }}
                  />
                  {/* Social: LinkedIn */}
                  <a
                    href="https://www.linkedin.com/company/hazwoper-osha/"
                    target="_blank"
                    rel="noreferrer"
                    title="HAZWOPER-OSHA LinkedIn"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '76.8%', top: '92.4%', width: '3.4%', height: '2.8%' }}
                  />
                  {/* Social: Facebook */}
                  <a
                    href="https://www.facebook.com/HazwoperOsha"
                    target="_blank"
                    rel="noreferrer"
                    title="HAZWOPER-OSHA Facebook"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '80.5%', top: '92.4%', width: '3.4%', height: '2.8%' }}
                  />
                  {/* Social: YouTube */}
                  <a
                    href="https://www.youtube.com/@hazwoper-osha"
                    target="_blank"
                    rel="noreferrer"
                    title="HAZWOPER-OSHA YouTube Channel"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '84.1%', top: '92.4%', width: '3.4%', height: '2.8%' }}
                  />
                  {/* Social: Instagram */}
                  <a
                    href="https://www.instagram.com/hazwoper_osha_training/"
                    target="_blank"
                    rel="noreferrer"
                    title="HAZWOPER-OSHA Instagram"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '87.7%', top: '92.4%', width: '3.4%', height: '2.8%' }}
                  />
                  {/* Social: Twitter / X */}
                  <a
                    href="https://twitter.com/HazwoperOsha/"
                    target="_blank"
                    rel="noreferrer"
                    title="HAZWOPER-OSHA Twitter / X"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '91.3%', top: '92.4%', width: '3.4%', height: '2.8%' }}
                  />
                  {/* Social: Pinterest */}
                  <a
                    href="https://www.pinterest.com/HazwoperOsha/"
                    target="_blank"
                    rel="noreferrer"
                    title="HAZWOPER-OSHA Pinterest"
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '94.9%', top: '92.4%', width: '3.4%', height: '2.8%' }}
                  />
                  {/* Tagline Footer */}
                  <a
                    href="https://www.hazwoper-osha.com"
                    target="_blank"
                    rel="noreferrer"
                    title="Train Today. Work Safely. Return Home."
                    className="absolute cursor-pointer block focus:outline-none"
                    style={{ left: '24.5%', top: '97.0%', width: '51.0%', height: '3.0%' }}
                  />
                </div>
              )}

              {/* Canvas Overlay for adding/editing elements */}
              <CanvasOverlay
                pageWidth={activePage.width || 612}
                pageHeight={activePage.height || 792}
                scale={scale}
                activeTool={activeTool}
                overlays={activeOverlays}
                selectedOverlayId={selectedOverlayId}
                onSelectOverlay={setSelectedOverlayId}
                onUpdateOverlay={handleUpdateOverlay}
                onAddOverlay={handleAddOverlay}
                onDeleteOverlay={handleDeleteOverlay}
                penColor={penColor}
                penWidth={penWidth}
              />
            </div>
          ) : (
            <div className="text-center space-y-3">
              <Sparkles className="w-10 h-10 text-primary mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-muted-foreground">
                No page active. Upload a PDF or create a new document.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(dataUrl) => {
          handleAddOverlay({
            type: 'signature',
            x: 100,
            y: 100,
            width: 200,
            height: 75,
            src: dataUrl,
          });
        }}
      />

      <InsertPageModal
        isOpen={isInsertModalOpen}
        onClose={() => setIsInsertModalOpen(false)}
        onInsert={handleInsertPage}
        activePageIndex={activePageIndex}
        totalPages={pages.length}
      />

      <StampPickerModal
        isOpen={isStampModalOpen}
        onClose={() => setIsStampModalOpen(false)}
        onSelectStamp={(stamp) => {
          handleAddOverlay({
            type: 'stamp',
            x: 150,
            y: 150,
            width: stamp.width,
            height: stamp.height,
            src: stamp.src,
          });
        }}
      />
    </div>
  );
}
