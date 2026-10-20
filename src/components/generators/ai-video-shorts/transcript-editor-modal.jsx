'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Check,
  Languages,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  Clock,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TRANSLITERATION_STYLES } from '@/lib/video-shorts/types';
import {
  transliterateUrduSentence,
  transliterateUrduCaptions,
} from '@/lib/video-shorts/urdu-transliterator';
import { cn } from '@/lib/utils';

export function TranscriptEditorModal({
  isOpen,
  onClose,
  clip,
  onSaveCaptions,
}) {
  const [captions, setCaptions] = useState(clip?.captions || []);
  const [selectedStyle, setSelectedStyle] = useState('conversational');

  useEffect(() => {
    if (isOpen && clip?.captions) {
      setCaptions(clip.captions);
    }
  }, [isOpen, clip?.captions]);

  if (!isOpen || !clip) return null;

  const handleUpdateLine = (index, field, value) => {
    setCaptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // If user edited Urdu text, auto-transliterate Roman Urdu if empty or requested
      if (field === 'textUrdu') {
        updated[index].textRoman = transliterateUrduSentence(
          value,
          selectedStyle
        );
        updated[index].text = updated[index].textRoman;
        updated[index].textCombined = `${value}\n${updated[index].textRoman}`;
      } else if (field === 'textRoman') {
        updated[index].text = value;
        if (updated[index].textUrdu) {
          updated[index].textCombined = `${updated[index].textUrdu}\n${value}`;
        }
      }

      return updated;
    });
  };

  const handleApplyTransliterationStyle = (styleId) => {
    setSelectedStyle(styleId);
    setCaptions((prev) =>
      prev.map((cap) => {
        const roman = cap.textUrdu
          ? transliterateUrduSentence(cap.textUrdu, styleId)
          : cap.textRoman || cap.text;
        return {
          ...cap,
          textRoman: roman,
          text: roman,
          textCombined:
            cap.textUrdu && roman ? `${cap.textUrdu}\n${roman}` : roman,
        };
      })
    );
  };

  const handleAddLine = () => {
    const lastCap = captions[captions.length - 1];
    const newStart = lastCap ? lastCap.end : 0;
    const newEnd = Math.min(clip.duration, newStart + 3.0);

    setCaptions((prev) => [
      ...prev,
      {
        id: `cap-${prev.length + 1}`,
        start: parseFloat(newStart.toFixed(2)),
        end: parseFloat(newEnd.toFixed(2)),
        textUrdu: '',
        textRoman: '',
        text: '',
        words: [],
      },
    ]);
  };

  const handleDeleteLine = (index) => {
    setCaptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    onSaveCaptions(captions);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9990] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <span>Review &amp; Edit Spoken Script</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] border-primary/40 text-primary"
                >
                  Short #{clip.index}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Edit Urdu Nastaliq script and Roman Urdu lines with 100%
                synchronized word timestamps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spelling Style Switcher */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-primary" />
            <span>Roman Urdu Spelling Style:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {TRANSLITERATION_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleApplyTransliterationStyle(st.id)}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                  selectedStyle === st.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                )}
                title={st.example}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Caption Lines List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {captions.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-muted-foreground">
                No caption lines found for this clip.
              </p>
              <Button onClick={handleAddLine} size="sm" className="rounded-xl">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add First Line</span>
              </Button>
            </div>
          ) : (
            captions.map((cap, idx) => (
              <div
                key={cap.id || idx}
                className="p-4 rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-primary">
                      Line #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>
                        {cap.start}s - {cap.end}s
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteLine(idx)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors cursor-pointer"
                    title="Delete line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Urdu Nastaliq Script Input (RTL) */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                      <span>Urdu Script (اردو رسم الخط)</span>
                      <span className="text-[10px] font-mono opacity-70">
                        Right-to-Left
                      </span>
                    </Label>
                    <Input
                      dir="rtl"
                      value={cap.textUrdu || ''}
                      onChange={(e) =>
                        handleUpdateLine(idx, 'textUrdu', e.target.value)
                      }
                      placeholder="اردو کلام یا الفاظ درج کریں..."
                      className="font-serif text-right text-base leading-relaxed bg-muted/20 border-border/60 focus:border-primary rounded-xl"
                    />
                  </div>

                  {/* Roman Urdu Transliteration Input (LTR) */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                      <span>Roman Urdu Line</span>
                      <span className="text-[10px] font-mono opacity-70">
                        Synchronized
                      </span>
                    </Label>
                    <Input
                      dir="ltr"
                      value={cap.textRoman || cap.text || ''}
                      onChange={(e) =>
                        handleUpdateLine(idx, 'textRoman', e.target.value)
                      }
                      placeholder="e.g. Kabhi To Sabz Gumbad Ka Ujala Hum Bhi Dekhenge"
                      className="font-mono text-xs text-foreground bg-muted/20 border-border/60 focus:border-primary rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLine}
            className="w-full rounded-2xl border-dashed border-border/80 hover:border-primary text-xs font-bold text-primary cursor-pointer py-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Add New Synchronized Line</span>
          </Button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-border/60 bg-card flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 px-6 shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Save &amp; Update Subtitles</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
