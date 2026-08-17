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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilePlus, Check } from 'lucide-react';
import { PAGE_SIZES } from '@/lib/pdf-editor-engine';

export function InsertPageModal({
  isOpen,
  onClose,
  onInsert,
  activePageIndex,
  totalPages,
}) {
  const [pageSize, setPageSize] = useState('letter');
  const [orientation, setOrientation] = useState('portrait');
  const [position, setPosition] = useState('after'); // 'before', 'after', 'end'
  const [bgColor, setBgColor] = useState('#ffffff');

  const handleInsert = () => {
    const baseSize = PAGE_SIZES[pageSize] || PAGE_SIZES.letter;
    const width =
      orientation === 'landscape' ? baseSize.height : baseSize.width;
    const height =
      orientation === 'landscape' ? baseSize.width : baseSize.height;

    let targetIndex = activePageIndex;
    if (position === 'after') {
      targetIndex = activePageIndex + 1;
    } else if (position === 'end') {
      targetIndex = totalPages;
    }

    onInsert({
      targetIndex,
      width,
      height,
      bgColor,
      pageSize,
      orientation,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-primary" /> Insert New Page
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Page Size */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Page Size</Label>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letter">Letter (8.5 in x 11 in)</SelectItem>
                <SelectItem value="a4">A4 (210mm x 297mm)</SelectItem>
                <SelectItem value="legal">Legal (8.5 in x 14 in)</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orientation */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Orientation</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={orientation === 'portrait' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrientation('portrait')}
                className="text-xs"
              >
                📄 Portrait
              </Button>
              <Button
                type="button"
                variant={orientation === 'landscape' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrientation('landscape')}
                className="text-xs"
              >
                🖼️ Landscape
              </Button>
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="after">
                  After Page {activePageIndex + 1}
                </SelectItem>
                <SelectItem value="before">
                  Before Page {activePageIndex + 1}
                </SelectItem>
                <SelectItem value="end">At End of Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Background Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent"
              />
              <span className="text-xs font-mono text-muted-foreground">
                {bgColor}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            className="text-xs font-bold bg-primary text-primary-foreground gap-1.5"
          >
            <Check className="w-4 h-4" /> Insert Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
