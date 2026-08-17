'use client';

import React, { useState } from 'react';
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
import { Stamp, Check } from 'lucide-react';

const PRESET_STAMPS = [
  { id: 'APPROVED', text: 'APPROVED', color: '#16a34a' },
  { id: 'CONFIDENTIAL', text: 'CONFIDENTIAL', color: '#dc2626' },
  { id: 'DRAFT', text: 'DRAFT', color: '#6b7280' },
  { id: 'FINAL', text: 'FINAL', color: '#2563eb' },
  { id: 'PAID', text: 'PAID', color: '#059669' },
  { id: 'REJECTED', text: 'REJECTED', color: '#b91c1c' },
  { id: 'VOID', text: 'VOID', color: '#991b1b' },
  { id: 'URGENT', text: 'URGENT', color: '#ea580c' },
];

export function StampPickerModal({ isOpen, onClose, onSelectStamp }) {
  const [customText, setCustomText] = useState('');
  const [customColor, setCustomColor] = useState('#2563eb');

  const generateStampDataUrl = (text, color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 110;
    const ctx = canvas.getContext('2d');

    // Draw double border
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.roundRect(8, 8, 304, 94, 12);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.roundRect(14, 14, 292, 82, 8);
    ctx.stroke();

    // Draw bold stamp text
    ctx.fillStyle = color;
    ctx.font = 'black 36px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    ctx.fillText(text.toUpperCase(), 160, 55);

    return canvas.toDataURL('image/png');
  };

  const handleSelectPreset = (stamp) => {
    const dataUrl = generateStampDataUrl(stamp.text, stamp.color);
    onSelectStamp({
      src: dataUrl,
      width: 180,
      height: 60,
      title: stamp.text,
    });
    onClose();
  };

  const handleCustomStamp = () => {
    if (!customText.trim()) return;
    const dataUrl = generateStampDataUrl(customText.trim(), customColor);
    onSelectStamp({
      src: dataUrl,
      width: 180,
      height: 60,
      title: customText.trim().toUpperCase(),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Stamp className="w-5 h-5 text-primary" /> Select Document Stamp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset Stamps Grid */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              Official Preset Stamps
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_STAMPS.map((stamp) => (
                <button
                  key={stamp.id}
                  type="button"
                  onClick={() => handleSelectPreset(stamp)}
                  className="border-2 rounded-lg p-2.5 flex items-center justify-center font-black tracking-widest text-sm hover:scale-105 transition-transform bg-background"
                  style={{
                    borderColor: stamp.color,
                    color: stamp.color,
                  }}
                >
                  {stamp.text}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            <Label className="text-xs font-semibold">Custom Rubber Stamp</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Custom stamp text..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="bg-background text-xs"
              />
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-10 h-10 rounded border border-border cursor-pointer p-0 bg-transparent"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleCustomStamp}
            disabled={!customText.trim()}
            className="text-xs font-bold bg-primary text-primary-foreground gap-1.5"
          >
            <Check className="w-4 h-4" /> Add Custom Stamp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
