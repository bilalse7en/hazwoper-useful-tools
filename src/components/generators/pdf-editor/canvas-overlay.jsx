'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RotateCcw, Move, Trash2, Copy, Eye, EyeOff } from 'lucide-react';

export function CanvasOverlay({
  pageWidth,
  pageHeight,
  scale = 1,
  activeTool,
  overlays = [],
  selectedOverlayId,
  onSelectOverlay,
  onUpdateOverlay,
  onAddOverlay,
  onDeleteOverlay,
  penColor = '#0f172a',
  penWidth = 3,
}) {
  const drawingCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragState, setDragState] = useState(null); // { overlayId, startX, startY, origX, origY, origW, origH, handle }
  const [editingTextId, setEditingTextId] = useState(null);

  // Drawing Canvas setup for Pen / Highlighter / Eraser
  useEffect(() => {
    if (
      (activeTool === 'pen' ||
        activeTool === 'highlighter' ||
        activeTool === 'eraser') &&
      drawingCanvasRef.current
    ) {
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeTool]);

  // Handle freehand drawing start
  const handleDrawingMouseDown = (e) => {
    if (
      activeTool !== 'pen' &&
      activeTool !== 'highlighter' &&
      activeTool !== 'eraser'
    ) {
      return;
    }

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x * scale, y * scale);

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penWidth * 4 * scale;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle =
        activeTool === 'highlighter' ? `${penColor}80` : penColor;
      ctx.lineWidth =
        (activeTool === 'highlighter' ? penWidth * 4 : penWidth) * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    setIsDrawing(true);
  };

  const handleDrawingMouseMove = (e) => {
    if (!isDrawing || !drawingCanvasRef.current) return;
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x * scale, y * scale);
    ctx.stroke();
  };

  const handleDrawingMouseUp = () => {
    if (!isDrawing || !drawingCanvasRef.current) return;
    setIsDrawing(false);

    const canvas = drawingCanvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');

    // Add drawing overlay
    onAddOverlay({
      type: 'drawing',
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      src: dataUrl,
    });

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Click on background overlay to deselect or add new elements
  const handleContainerClick = (e) => {
    if (
      e.target.dataset.role === 'overlay-container' &&
      activeTool === 'select'
    ) {
      onSelectOverlay(null);
      setEditingTextId(null);
    }
  };

  // Dragging and Resizing logic for elements
  const startDrag = (e, overlay, handle = 'move') => {
    e.stopPropagation();
    onSelectOverlay(overlay.id);

    setDragState({
      overlayId: overlay.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: overlay.x,
      origY: overlay.y,
      origW: overlay.width || 100,
      origH: overlay.height || 50,
      handle,
    });
  };

  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (!dragState) return;

      const dx = (e.clientX - dragState.startX) / scale;
      const dy = (e.clientY - dragState.startY) / scale;

      const overlay = overlays.find((o) => o.id === dragState.overlayId);
      if (!overlay) return;

      if (dragState.handle === 'move') {
        const newX = Math.max(
          0,
          Math.min(pageWidth - overlay.width, dragState.origX + dx)
        );
        const newY = Math.max(
          0,
          Math.min(pageHeight - overlay.height, dragState.origY + dy)
        );
        onUpdateOverlay(overlay.id, { x: newX, y: newY });
      } else if (dragState.handle === 'se') {
        // South-East resize
        const newW = Math.max(20, dragState.origW + dx);
        const newH = Math.max(15, dragState.origH + dy);
        onUpdateOverlay(overlay.id, { width: newW, height: newH });
      } else if (dragState.handle === 'e') {
        const newW = Math.max(20, dragState.origW + dx);
        onUpdateOverlay(overlay.id, { width: newW });
      } else if (dragState.handle === 's') {
        const newH = Math.max(15, dragState.origH + dy);
        onUpdateOverlay(overlay.id, { height: newH });
      }
    };

    const handleWindowMouseUp = () => {
      if (dragState) {
        setDragState(null);
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, scale, pageWidth, pageHeight, overlays, onUpdateOverlay]);

  return (
    <div
      data-role="overlay-container"
      onClick={handleContainerClick}
      className="absolute top-0 left-0 w-full h-full overflow-hidden select-none pointer-events-auto"
      style={{
        width: `${pageWidth * scale}px`,
        height: `${pageHeight * scale}px`,
      }}
    >
      {/* Freehand Drawing Canvas */}
      <canvas
        ref={drawingCanvasRef}
        width={pageWidth * scale}
        height={pageHeight * scale}
        onMouseDown={handleDrawingMouseDown}
        onMouseMove={handleDrawingMouseMove}
        onMouseUp={handleDrawingMouseUp}
        className={cn(
          'absolute inset-0 z-20 pointer-events-auto',
          activeTool === 'pen' ||
            activeTool === 'highlighter' ||
            activeTool === 'eraser'
            ? 'cursor-crosshair'
            : 'pointer-events-none'
        )}
      />

      {/* Rendered Overlay Items */}
      {overlays.map((item) => {
        const isSelected = item.id === selectedOverlayId;
        const left = item.x * scale;
        const top = item.y * scale;
        const width = (item.width || 100) * scale;
        const height = (item.height || 40) * scale;

        return (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectOverlay(item.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (item.type === 'text') {
                setEditingTextId(item.id);
              }
            }}
            onMouseDown={(e) => startDrag(e, item, 'move')}
            className={cn(
              'absolute cursor-move transition-shadow z-10',
              isSelected
                ? 'ring-2 ring-primary ring-offset-1 z-30 shadow-lg'
                : 'hover:ring-1 hover:ring-primary/50'
            )}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
              transform: `rotate(${item.rotation || 0}deg)`,
              opacity: item.opacity !== undefined ? item.opacity : 1,
            }}
          >
            {/* 1. TEXT ITEM */}
            {item.type === 'text' && (
              <div
                className="w-full h-full p-1 border border-transparent rounded flex items-center"
                style={{
                  backgroundColor: item.bgColor || 'transparent',
                  color: item.color || '#000000',
                  fontSize: `${(item.fontSize || 16) * scale}px`,
                  fontFamily: item.fontFamily || 'Helvetica, sans-serif',
                  fontWeight: item.fontWeight || 'normal',
                  fontStyle: item.fontStyle || 'normal',
                  textAlign: item.textAlign || 'left',
                }}
              >
                {editingTextId === item.id ? (
                  <textarea
                    autoFocus
                    value={item.text}
                    onChange={(e) =>
                      onUpdateOverlay(item.id, { text: e.target.value })
                    }
                    onBlur={() => setEditingTextId(null)}
                    className="w-full h-full bg-background/90 text-foreground p-1 resize-none border border-primary outline-none text-xs rounded"
                    style={{
                      fontSize: `${(item.fontSize || 16) * scale}px`,
                    }}
                  />
                ) : (
                  <span className="w-full whitespace-pre-wrap break-words leading-tight">
                    {item.text || 'Click to edit text'}
                  </span>
                )}
              </div>
            )}

            {/* 2. WHITEOUT / REDACT ITEM */}
            {(item.type === 'whiteout' || item.type === 'redact') && (
              <div
                className="w-full h-full flex items-center justify-center text-[10px] font-mono text-muted-foreground/70 uppercase border border-dashed border-muted-foreground/40"
                style={{
                  backgroundColor:
                    item.type === 'redact'
                      ? '#000000'
                      : item.color || '#ffffff',
                }}
              >
                {isSelected && (item.type === 'redact' ? 'REDACTED' : '')}
              </div>
            )}

            {/* 3. SHAPE ITEM */}
            {item.type === 'shape' && (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: item.fillColor || 'transparent',
                  borderColor: item.strokeColor || '#000000',
                  borderWidth: `${(item.borderWidth || 2) * scale}px`,
                  borderStyle: 'solid',
                  borderRadius:
                    item.shapeType === 'circle'
                      ? '9999px'
                      : item.shapeType === 'rounded'
                        ? '8px'
                        : '0px',
                }}
              />
            )}

            {/* 4. IMAGE / STAMP / SIGNATURE / DRAWING ITEM */}
            {(item.type === 'image' ||
              item.type === 'stamp' ||
              item.type === 'signature' ||
              item.type === 'drawing') &&
              item.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.src}
                  alt={item.type}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              )}

            {/* 5. CHECKBOX ITEM */}
            {item.type === 'checkbox' && (
              <div
                className="w-full h-full flex items-center justify-center cursor-pointer border-2 border-slate-700 bg-white rounded text-slate-900 font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateOverlay(item.id, { checked: !item.checked });
                }}
              >
                {item.checked ? '✓' : ''}
              </div>
            )}

            {/* Resize Handles when Selected */}
            {isSelected && (
              <>
                <div
                  onMouseDown={(e) => startDrag(e, item, 'se')}
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full cursor-se-resize z-40"
                />
                <div
                  onMouseDown={(e) => startDrag(e, item, 'e')}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-e-resize z-40"
                />
                <div
                  onMouseDown={(e) => startDrag(e, item, 's')}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-s-resize z-40"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
