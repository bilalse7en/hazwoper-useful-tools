'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenTool, Type, Upload, Eraser, Check } from 'lucide-react';

export function SignatureModal({ isOpen, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [penColor, setPenColor] = useState('#0f172a');
  const [activeTab, setActiveTab] = useState('draw');

  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen, activeTab, penColor]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateTypedSignatureDataUrl = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = penColor;
    ctx.font = `italic 42px ${selectedFont === 'cursive' ? 'Brush Script MT, cursive' : selectedFont === 'serif' ? 'Georgia, serif' : 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Your Signature', 250, 75);
    return canvas.toDataURL('image/png');
  };

  const handleSaveSignature = () => {
    let dataUrl = null;
    if (activeTab === 'draw' && canvasRef.current) {
      dataUrl = canvasRef.current.toDataURL('image/png');
    } else if (activeTab === 'type') {
      if (!typedName.trim()) return;
      dataUrl = generateTypedSignatureDataUrl();
    } else if (activeTab === 'upload') {
      if (!uploadedImage) return;
      dataUrl = uploadedImage;
    }

    if (dataUrl) {
      onSave(dataUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary" /> Create Digital
            Signature
          </DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="draw"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-3 w-full bg-muted">
            <TabsTrigger value="draw" className="text-xs font-bold">
              <PenTool className="w-3.5 h-3.5 mr-1" /> Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="text-xs font-bold">
              <Type className="w-3.5 h-3.5 mr-1" /> Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs font-bold">
              <Upload className="w-3.5 h-3.5 mr-1" /> Upload
            </TabsTrigger>
          </TabsList>

          <div className="py-4">
            <TabsContent value="draw" className="m-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Draw signature below
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Ink:</span>
                  {['#0f172a', '#1e40af', '#b91c1c', '#047857'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPenColor(color)}
                      className={`w-5 h-5 rounded-full border border-border ${penColor === color ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCanvas}
                    className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                  >
                    <Eraser className="w-3.5 h-3.5 mr-1" /> Clear
                  </Button>
                </div>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg bg-background overflow-hidden relative">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={160}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="cursor-crosshair w-full h-[160px] touch-none"
                />
                <div className="absolute bottom-2 left-4 right-4 border-b border-muted-foreground/30 pointer-events-none" />
              </div>
            </TabsContent>

            <TabsContent value="type" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Your Full Name</Label>
                <Input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Font Style</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cursive', label: 'Cursive' },
                    { id: 'serif', label: 'Serif' },
                    { id: 'sans', label: 'Modern' },
                  ].map((font) => (
                    <Button
                      key={font.id}
                      type="button"
                      variant={selectedFont === font.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFont(font.id)}
                      className="text-xs"
                    >
                      {font.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-background text-center min-h-[100px] flex items-center justify-center">
                <span
                  style={{
                    color: penColor,
                    fontSize: '32px',
                    fontFamily:
                      selectedFont === 'cursive'
                        ? 'Brush Script MT, cursive'
                        : selectedFont === 'serif'
                          ? 'Georgia, serif'
                          : 'sans-serif',
                    fontStyle: 'italic',
                  }}
                >
                  {typedName || 'Signature Preview'}
                </span>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="m-0 space-y-4">
              <Label className="text-xs font-semibold text-muted-foreground">
                Upload image file of signature (PNG or JPG with light/clean
                background)
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-background space-y-3">
                {uploadedImage ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImage}
                      alt="Uploaded Signature"
                      className="max-h-32 max-w-full mx-auto object-contain"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedImage(null)}
                      className="text-xs"
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="signature-file-upload"
                    />
                    <Label
                      htmlFor="signature-file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-primary animate-bounce" />
                      <span className="text-xs font-semibold text-primary">
                        Click to select signature image
                      </span>
                    </Label>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleSaveSignature}
              className="text-xs font-bold bg-primary text-primary-foreground gap-1.5"
            >
              <Check className="w-4 h-4" /> Add Signature
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
