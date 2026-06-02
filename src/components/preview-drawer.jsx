'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import {
  Eye,
  Copy,
  X,
  Check,
  Code as CodeIcon,
  Layout,
  Sparkles,
} from 'lucide-react';

export function PreviewDrawer({
  open,
  onOpenChange,
  title,
  content: initialContent,
  onCopy,
  data,
  code: initialCode, // Add support for 'code' prop from HTMLCleaner
}) {
  const [copied, setCopied] = useState(false);
  const [copiedMap, setCopiedMap] = useState({});
  const [viewMode, setViewMode] = useState('visual'); // visual, code
  const [localContent, setLocalContent] = useState(
    initialCode || initialContent || ''
  );
  const [localFaqData, setLocalFaqData] = useState(
    Array.isArray(data) ? [...data] : []
  );

  // Sync state when props change (React-recommended pattern for prop-to-state sync)
  const [prevInitial, setPrevInitial] = useState(
    initialCode || initialContent || ''
  );
  const [prevData, setPrevData] = useState(data);

  if ((initialCode || initialContent || '') !== prevInitial) {
    setPrevInitial(initialCode || initialContent || '');
    setLocalContent(initialCode || initialContent || '');
  }

  if (data !== prevData) {
    setLocalFaqData(Array.isArray(data) ? [...data] : []);
    setPrevData(data);
  }

  const updateFaq = (index, field, value) => {
    setLocalFaqData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleCopy = async () => {
    if (localContent) {
      await navigator.clipboard.writeText(localContent);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Process HTML to add SEO attributes
  const processSEO = (html) => {
    if (!html || typeof html !== 'string') return html;
    let processed = html.replace(
      /\<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1([^>]*)\>/gi,
      (match, p1, p2, p3) => {
        let cleanP3 = p3
          .replace(/\s+(target|rel)=["'][^"']*?["']/gi, '')
          .trim();
        const isInternalLink = p2.toLowerCase().includes('hazwoper-osha.com');
        let newTag = '<a href="' + p2 + '" target="_blank"';
        if (!isInternalLink) newTag += ' rel="noopener noreferrer"';
        if (cleanP3) newTag += ' ' + cleanP3;
        newTag += '>';
        return newTag;
      }
    );
    return processed.replace(/&nbsp;/g, ' ');
  };

  const copyText = async (text, key) => {
    await navigator.clipboard.writeText(processSEO(text));
    if (key) {
      setCopiedMap((prev) => ({ ...prev, [key]: true }));
      // Removed timeout to make the highlight permanent per user request
    }
  };

  const isFaqView =
    title?.toLowerCase().includes('faq') &&
    Array.isArray(data) &&
    data.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[90vw] p-0 border-l shadow-2xl flex flex-col h-full bg-background overflow-hidden"
        data-hide-default-close="true"
      >
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border p-4 bg-muted/10 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <SheetTitle className="text-xl font-black tracking-tight">
                {title} <span className="text-primary">Editor</span>
              </SheetTitle>
            </div>

            {!isFaqView && (
              <div className="flex bg-muted p-1 rounded-xl border border-border/50">
                <Button
                  variant={viewMode === 'visual' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-lg gap-2 h-8 text-[11px] font-bold uppercase tracking-wider"
                  onClick={() => setViewMode('visual')}
                >
                  <Layout className="h-3.5 w-3.5" />
                  Visual
                </Button>
                <Button
                  variant={viewMode === 'code' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-lg gap-2 h-8 text-[11px] font-bold uppercase tracking-wider"
                  onClick={() => setViewMode('code')}
                >
                  <CodeIcon className="h-3.5 w-3.5" />
                  Code
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pr-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className={`gap-2 h-10 px-5 transition-all duration-500 rounded-xl font-bold border-2 ${copied ? 'border-green-500 text-green-500 bg-green-50/10' : 'hover:border-primary/50'}`}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied Content!' : 'Copy All'}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 rounded-xl hover:bg-destructive hover:text-white transition-all duration-300 shadow-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {isFaqView ? (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-4 rounded-2xl mb-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="h-12 w-12 text-primary rotate-12" />
                  </div>
                  <h4 className="font-bold text-primary text-sm mb-1 flex items-center gap-2 uppercase tracking-tight">
                    <Sparkles className="h-4 w-4" /> FAQ Workbench
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-snug max-w-2xl">
                    Refine and copy FAQs.{' '}
                    <span className="text-green-600 font-bold">Green</span>{' '}
                    indicates copied to clipboard.
                  </p>
                </div>

                <div className="space-y-3">
                  {localFaqData.map((faq, idx) => {
                    const qKey = `q-${idx}`;
                    const aKey = `a-${idx}`;
                    const isQCopied = copiedMap[qKey];
                    const isACopied = copiedMap[aKey];

                    return (
                      <div
                        key={idx}
                        className={`group border rounded-2xl overflow-hidden transition-all duration-500 p-4 relative ${
                          isQCopied && isACopied
                            ? 'bg-green-50/5 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.05)]'
                            : 'bg-card border-border/50 hover:border-primary/20'
                        }`}
                      >
                        {/* Status Indicator */}
                        {isQCopied && isACopied && (
                          <div className="absolute top-2 right-[50%] flex items-center gap-1 text-green-600 text-[9px] font-bold uppercase tracking-widest">
                            <Check className="h-2.5 w-2.5" /> Copied
                          </div>
                        )}

                        {/* Question Header */}
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <span
                              className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs shrink-0 shadow-sm transition-all duration-500 ${
                                isQCopied && isACopied
                                  ? 'bg-green-500 text-white'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="flex flex-col gap-0.5 flex-1">
                              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                Question
                              </span>
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                className={`font-bold text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/20 rounded-md p-1 transition-all min-h-[1.2em] w-full ${
                                  isQCopied ? 'bg-green-500/5' : ''
                                }`}
                                onBlur={(e) => {
                                  updateFaq(
                                    idx,
                                    'question',
                                    e.target.innerText
                                  );
                                }}
                              >
                                {faq.question}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 shrink-0 rounded-lg transition-all duration-300 gap-1.5 px-2 ${
                              isQCopied
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-background hover:border-primary/50 opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={() => copyText(faq.question, qKey)}
                          >
                            {isQCopied ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span className="text-[10px] font-bold uppercase">
                              {isQCopied ? 'Copied' : 'Copy'}
                            </span>
                          </Button>
                        </div>

                        {/* Condensed Divider */}
                        <div
                          className={`h-px transition-all duration-700 ${
                            isQCopied || isACopied
                              ? 'bg-green-100'
                              : 'bg-border/30'
                          } my-2`}
                        />

                        {/* Answer Body */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 pl-10">
                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1 block">
                              Answer
                            </span>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              className={`prose prose-xs dark:prose-invert max-w-none text-muted-foreground text-xs leading-normal outline-none focus:ring-1 focus:ring-primary/20 rounded-lg p-3 transition-all duration-500 ${
                                isACopied
                                  ? 'bg-green-500/5 text-green-900 dark:text-green-100'
                                  : 'bg-muted/20'
                              }`}
                              onBlur={(e) => {
                                updateFaq(idx, 'answer', e.target.innerHTML);
                              }}
                              dangerouslySetInnerHTML={{
                                __html: processSEO(faq.answer),
                              }}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 shrink-0 rounded-lg transition-all duration-300 gap-1.5 px-2 mt-4 ${
                              isACopied
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-background hover:border-primary/50 opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={() => copyText(faq.answer, aKey)}
                          >
                            {isACopied ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span className="text-[10px] font-bold uppercase">
                              {isACopied ? 'Copied' : 'Copy'}
                            </span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                {viewMode === 'visual' ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="preview-container prose prose-sm dark:prose-invert max-w-none rounded-lg border border-border p-6 bg-card outline-none focus:ring-1 focus:ring-primary/20"
                    onBlur={(e) => setLocalContent(e.target.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: localContent }}
                  />
                ) : (
                  <div className="relative flex flex-col h-[75vh]">
                    <textarea
                      className="flex-1 w-full bg-muted/30 border rounded-md p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/20"
                      value={localContent}
                      onChange={(e) => setLocalContent(e.target.value)}
                      spellCheck="false"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #888;
          font-style: italic;
        }
        .preview-container table {
          width: 100% !important;
          border-collapse: separate;
          border-spacing: 0;
          margin: 2rem 0;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(128, 128, 128, 0.1);
        }
        .preview-container table th,
        .preview-container table td {
          border: 1px solid rgba(128, 128, 128, 0.1) !important;
          padding: 16px !important;
        }
        .preview-container table th {
          background: rgba(128, 128, 128, 0.05);
          font-weight: 900;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
      `}</style>
    </Sheet>
  );
}
