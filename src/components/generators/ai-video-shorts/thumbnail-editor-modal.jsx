'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Check,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Smartphone,
  Laptop,
  Type,
  Sliders,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { showToast } from '@/lib/swal';

function drawFallbackGradient(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(0.5, '#1E1B4B');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function ThumbnailEditorModal({
  isOpen,
  onClose,
  initialFrameUrl = null,
  candidateFrames = [],
  clipTitle = 'فاصلوں کو تکلف ہے ہم سے اگر',
  clipSubline = 'قاری شاہد محمود',
  onSaveThumbnail,
}) {
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '9:16' | '16:9'
  const [selectedFrame, setSelectedFrame] = useState(
    initialFrameUrl || candidateFrames[0]?.publicUrl || null
  );
  const [customImage, setCustomImage] = useState(null);
  const [badgeText, setBadgeText] = useState(
    '🕌 NAAT SHARIF • HIGH VIRAL HOOK'
  );
  const [naatName, setNaatName] = useState(
    clipTitle || 'فاصلوں کو تکلف ہے ہم سے اگر'
  );
  const [reciterName, setReciterName] = useState(
    clipSubline || 'قاری شاہد محمود'
  );
  const [textColor, setTextColor] = useState('#FBBF24'); // Radiant Gold
  const [vignetteOpacity, setVignetteOpacity] = useState(85);
  const [logoImage, setLogoImage] = useState(null);
  const [logoPosition, setLogoPosition] = useState('top-right'); // 'top-left' | 'top-right'

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (initialFrameUrl) setSelectedFrame(initialFrameUrl);
    else if (candidateFrames.length > 0 && !selectedFrame) {
      setSelectedFrame(candidateFrames[0].publicUrl);
    }
  }, [initialFrameUrl, candidateFrames]);

  useEffect(() => {
    if (clipTitle) setNaatName(clipTitle);
    if (clipSubline) setReciterName(clipSubline);
  }, [clipTitle, clipSubline]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = aspectRatio === '9:16' ? 1080 : 1280;
    const height = aspectRatio === '9:16' ? 1920 : 720;
    canvas.width = width;
    canvas.height = height;

    const bgImageSrc = customImage || selectedFrame;
    const kumailFont =
      "'Kumail', 'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Jameel Noori Nastaleeq', Arial, sans-serif";

    const drawTextAndOverlays = () => {
      // 2. Channel Logo
      if (logoImage) {
        try {
          const logoSize = aspectRatio === '9:16' ? 110 : 80;
          const logoX =
            logoPosition === 'top-left' ? 40 : width - logoSize - 40;
          const logoY = 40;
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        } catch (e) {
          /* ignore */
        }
      }

      // 3. Top Category Badge
      if (badgeText.trim()) {
        ctx.save();
        const badgeY = aspectRatio === '9:16' ? 130 : 40;
        const fontSize = aspectRatio === '9:16' ? 28 : 20;
        ctx.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`;
        const textW = ctx.measureText(badgeText).width + 50;
        const badgeH = fontSize + 28;
        const badgeX = (width - textW) / 2;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.strokeStyle = '#EAB308';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, textW, badgeH, 24);
        else ctx.rect(badgeX, badgeY, textW, badgeH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FDE047';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, width / 2, badgeY + badgeH / 2);
        ctx.restore();
      }

      // 4. What's on Top: Naat Name in Kumail Font (Urdu)
      if (naatName.trim()) {
        ctx.save();
        const headY = aspectRatio === '9:16' ? 230 : 100;
        const isUrduScript =
          /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
            naatName
          );
        const headFontSize =
          aspectRatio === '9:16'
            ? isUrduScript
              ? 72
              : 62
            : isUrduScript
              ? 52
              : 44;

        ctx.font = isUrduScript
          ? `900 ${headFontSize}px ${kumailFont}`
          : `900 ${headFontSize}px Impact, Arial Black, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Words wrapping if too wide
        const cleanTitle = naatName.replace(/\([^)]*\)/g, '').trim();
        const words = cleanTitle.split(' ');
        let l1 = cleanTitle;
        let l2 = '';
        if (words.length > 4) {
          const mid = Math.ceil(words.length / 2);
          l1 = words.slice(0, mid).join(' ');
          l2 = words.slice(mid).join(' ');
        }

        const renderLine = (txt, yPos, color) => {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
          ctx.shadowBlur = 20;
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 14;
          ctx.lineJoin = 'miter';
          ctx.strokeText(txt, width / 2, yPos);
          ctx.fillStyle = color;
          ctx.fillText(txt, width / 2, yPos);
        };

        renderLine(l1, headY, textColor);
        if (l2) renderLine(l2, headY + headFontSize * 1.15, '#FFFFFF');
        ctx.restore();
      }

      // 5. What's on Bottom Center: Naat Reciter Name in Kumail Font (Urdu)
      if (reciterName.trim()) {
        ctx.save();
        const isUrduReciter =
          /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
            reciterName
          );
        const subY = aspectRatio === '9:16' ? height - 260 : height - 90;
        const subFontSize =
          aspectRatio === '9:16'
            ? isUrduReciter
              ? 50
              : 36
            : isUrduReciter
              ? 36
              : 24;

        ctx.font = isUrduReciter
          ? `800 ${subFontSize}px ${kumailFont}`
          : `800 ${subFontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const quoteStr = isUrduReciter
          ? reciterName.slice(0, 50)
          : `“${reciterName.slice(0, 50)}”`;

        // Render directly over thumbnail without dark black background box
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 12;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;
        ctx.strokeText(quoteStr, width / 2, subY);

        ctx.fillStyle = '#FDE047'; // Soft radiant gold
        ctx.fillText(quoteStr, width / 2, subY);
        ctx.restore();
      }
    };

    if (bgImageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw centered cover
        const iw = img.naturalWidth || width;
        const ih = img.naturalHeight || height;
        const scale = Math.max(width / iw, height / ih);
        const sw = width / scale;
        const sh = height / scale;
        const sx = (iw - sw) / 2;
        const sy = (ih - sh) / 2;

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
        drawTextAndOverlays();
      };
      img.onerror = () => {
        drawFallbackGradient(ctx, width, height);
        drawTextAndOverlays();
      };
      img.src = bgImageSrc;
    } else {
      drawFallbackGradient(ctx, width, height);
      drawTextAndOverlays();
    }
  }, [
    aspectRatio,
    selectedFrame,
    customImage,
    badgeText,
    naatName,
    reciterName,
    textColor,
    vignetteOpacity,
    logoImage,
    logoPosition,
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(renderCanvas, 50);
    }
  }, [isOpen, renderCanvas]);

  const handleCustomImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCustomImage(evt.target.result);
      setSelectedFrame(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => setLogoImage(img);
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `thumbnail_${aspectRatio.replace(':', '_')}.jpg`;
    link.href = dataUrl;
    link.click();
    showToast('Thumbnail downloaded in high resolution!', 'success');
  };

  const handleSaveToShort = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (onSaveThumbnail) {
      onSaveThumbnail(dataUrl);
    }
    showToast('Thumbnail successfully applied to this Short!', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-foreground">
                High-Retention Thumbnail &amp; Cover Editor
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Select real extracted frames, add viral typography, or attach
                your channel logo.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl w-8 h-8 p-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Canvas Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  aspectRatio === '9:16'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Portrait</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  aspectRatio === '16:9'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>16:9 Landscape</span>
              </button>
            </div>

            <div
              className={cn(
                'relative rounded-2xl overflow-hidden shadow-2xl border border-border/60 bg-black flex items-center justify-center',
                aspectRatio === '9:16'
                  ? 'w-[230px] h-[408px]'
                  : 'w-[320px] h-[180px]'
              )}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-2 w-full max-w-[320px]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1 rounded-xl text-xs font-bold cursor-pointer gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Download JPG</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSaveToShort}
                className="flex-1 rounded-xl text-xs font-bold cursor-pointer gap-1.5 bg-primary text-primary-foreground"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Short</span>
              </Button>
            </div>
          </div>

          {/* Right: Controls & Candidate Frame Gallery */}
          <div className="md:col-span-7 space-y-4">
            {/* Candidate Frame Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Real Video Candidate Frames
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 text-[11px] font-bold text-primary gap-1 px-2"
                >
                  <Upload className="w-3 h-3" /> Upload Custom Frame
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCustomImageUpload}
                  className="hidden"
                />
              </div>

              {candidateFrames.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {candidateFrames.map((frame, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedFrame(frame.publicUrl);
                        setCustomImage(null);
                      }}
                      className={cn(
                        'aspect-[9/16] rounded-xl overflow-hidden border-2 relative group cursor-pointer transition-all',
                        selectedFrame === frame.publicUrl && !customImage
                          ? 'border-primary ring-2 ring-primary/30 scale-[1.03]'
                          : 'border-border/60 hover:border-border'
                      )}
                    >
                      <img
                        src={frame.publicUrl}
                        alt="frame"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-white">
                        {frame.timeSec}s
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center text-xs text-muted-foreground">
                  Using default primary video poster frame. You can also upload
                  any custom image.
                </div>
              )}
            </div>

            {/* 2. Top & Bottom Center Urdu Typography in Kumail Font */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. Urdu &quot;Kumail Font&quot; Viral Thumbnails</span>
                </Label>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-primary/10 text-primary border-primary/30"
                >
                  Kumail Calligraphy
                </Badge>
              </div>

              {/* What's on Top: Naat Name */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>What&apos;s on Top (Naat Name)</span>
                    <span className="text-[11px] text-primary font-urdu">
                      نعت کا نام
                    </span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Top Center • Kumail Font
                  </span>
                </div>
                <Input
                  value={naatName}
                  onChange={(e) => setNaatName(e.target.value)}
                  dir="rtl"
                  className="text-sm font-kumail h-9 bg-background text-right"
                  placeholder="مثلاً: فاصلوں کو تکلف ہے ہم سے اگر"
                />
              </div>

              {/* What's on Bottom Center: Naat Reciter Name */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>What&apos;s on Bottom Center (Reciter Name)</span>
                    <span className="text-[11px] text-primary font-urdu">
                      نعت خواں کا نام
                    </span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Bottom Center • Kumail Font
                  </span>
                </div>
                <Input
                  value={reciterName}
                  onChange={(e) => setReciterName(e.target.value)}
                  dir="rtl"
                  className="text-sm font-kumail h-9 bg-background text-right"
                  placeholder="مثلاً: قاری شاہد محمود / اویس رضا قادری"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">
                    Category Badge
                  </Label>
                  <Input
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="text-xs h-8"
                    placeholder="e.g. 🕌 NAAT SHARIF • VIRAL HOOK"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">
                    Highlight Color
                  </Label>
                  <div className="flex gap-2 items-center h-8">
                    {[
                      '#FBBF24',
                      '#38BDF8',
                      '#34D399',
                      '#F43F5E',
                      '#FFFFFF',
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTextColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-md border-2 cursor-pointer transition-all',
                          textColor === color
                            ? 'border-primary scale-110 shadow-md'
                            : 'border-border/50'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Logo Upload */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  3. Channel Logo Overlay (Optional)
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="h-7 text-xs rounded-xl font-bold gap-1"
                >
                  <Upload className="w-3 h-3" />{' '}
                  {logoImage ? 'Change Logo' : 'Upload Logo PNG'}
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              {logoImage && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Logo attached. Position:</span>
                  <button
                    type="button"
                    onClick={() => setLogoPosition('top-left')}
                    className={cn(
                      'px-2 py-0.5 rounded border text-[10px] font-bold',
                      logoPosition === 'top-left'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border'
                    )}
                  >
                    Top Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoPosition('top-right')}
                    className={cn(
                      'px-2 py-0.5 rounded border text-[10px] font-bold',
                      logoPosition === 'top-right'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border'
                    )}
                  >
                    Top Right
                  </button>
                </div>
              )}
            </div>

            {/* Vignette Shadow Slider */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <div className="flex justify-between text-xs">
                <Label className="text-[11px] font-semibold">
                  Cinematic Contrast Shadows
                </Label>
                <span className="font-mono text-primary text-[11px]">
                  {vignetteOpacity}%
                </span>
              </div>
              <Slider
                value={[vignetteOpacity]}
                onValueChange={(vals) => setVignetteOpacity(vals[0])}
                min={20}
                max={100}
                step={5}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
