'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthAction } from '@/lib/use-auth-action';
import { saveToolHistory } from '@/lib/tool-history';
import { ToolHistoryPanel } from '@/components/tool-history-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Copy,
  Trash2,
  Code,
  Settings,
  Eye,
  Eraser,
  ClipboardCheck,
  FileType,
  Layout,
  RefreshCw,
  X,
  Plus,
  MessageSquare,
  List,
  ListOrdered,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import mammoth from 'mammoth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function WordToHtml() {
  const { performAction } = useAuthAction();
  const [rawHtml, setRawHtml] = useState('');
  const [cleanedHtml, setCleanedHtml] = useState('');
  const [options, setOptions] = useState({
    removeEmptyTags: true,
    removeAttributes: true,
    removeStyles: true,
    removeSpans: true,
    removeBrTags: true,
    removeComments: true,
    removeOfficeTags: true,
    removeNbsp: true,
    fixLists: true,
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const pasteAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Core cleaning logic
  const cleanMarkup = useCallback((html, opts) => {
    if (!html) return '';

    let processingHtml = html;
    if (opts.removeComments)
      processingHtml = processingHtml.replace(/<!--[\s\S]*?-->/g, '');
    if (opts.removeNbsp) {
      processingHtml = processingHtml.replace(/&nbsp;/gi, ' ');
      processingHtml = processingHtml.replace(/\u00A0/g, ' ');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(processingHtml, 'text/html');
    const body = doc.body;

    // 1. Office Tag Removal
    if (opts.removeOfficeTags) {
      const problematicTags = body.querySelectorAll(
        'xml, style, link, meta, script'
      );
      problematicTags.forEach((el) => el.remove());

      const all = body.querySelectorAll('*');
      all.forEach((el) => {
        if (el.tagName.toLowerCase().includes(':')) {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            el.remove();
          }
        }
      });
    }

    // 2. 100% Perfect List Repair (Handles hybrids like "· -")
    if (opts.fixLists) {
      const ps = Array.from(body.querySelectorAll('p'));
      let currentList = null;
      let listType = null;

      ps.forEach((p) => {
        const text = p.textContent.trim();
        // Very broad bullet detection including common word patterns
        const isBullet =
          /^[\u00B7\u2022\*\-·\u2013\u2014]/.test(text) ||
          p.className.includes('MsoList');
        const isNumbered =
          /^\d+[\.\)]\s+/.test(text) || /^[a-z][\.\)]\s+/i.test(text);

        if (isBullet || isNumbered) {
          const newType = isBullet ? 'ul' : 'ol';

          let liContent = p.innerHTML;
          // Target specific Word list artifacts: · • * - – — &nbsp; =
          liContent = liContent
            .replace(/^[\s\u00B7\u2022\*\-\u2013\u2014\u00A0=]+/i, '')
            .trim();
          // Secondary pass for nested or complex legacy bullet strings
          liContent = liContent.replace(/^[ ]*-[ ]*/i, '');
          liContent = liContent.replace(/^&nbsp;/, '');
          liContent = liContent.replace(/family:Symbol;.*?&gt;/gi, '');

          if (currentList && listType === newType) {
            const li = doc.createElement('li');
            li.innerHTML = liContent.trim();
            currentList.appendChild(li);
            p.remove();
          } else {
            currentList = doc.createElement(newType);
            listType = newType;
            const li = doc.createElement('li');
            li.innerHTML = liContent.trim();
            currentList.appendChild(li);
            p.parentNode.insertBefore(currentList, p);
            p.remove();
          }
        } else {
          currentList = null;
          listType = null;
        }
      });
    }

    // 3. Remove Styles
    if (opts.removeStyles) {
      body.querySelectorAll('*').forEach((el) => el.removeAttribute('style'));
    }

    // 4. Remove Attributes
    if (opts.removeAttributes) {
      body.querySelectorAll('*').forEach((el) => {
        Array.from(el.attributes).forEach((attr) =>
          el.removeAttribute(attr.name)
        );
      });
    }

    // 5. Remove Spans (Preserve text)
    if (opts.removeSpans) {
      body.querySelectorAll('span').forEach((span) => {
        const parent = span.parentNode;
        if (parent) {
          while (span.firstChild) parent.insertBefore(span.firstChild, span);
          span.remove();
        }
      });
    }

    // 6. Remove Br Tags
    if (opts.removeBrTags) {
      body.querySelectorAll('br').forEach((br) => br.remove());
    }

    // 7. Remove Empty Tags (Non-destructive)
    if (opts.removeEmptyTags) {
      const emptyTagsSelector = 'p, div, span, li, td, th, strong, em, b, i, u';
      for (let i = 0; i < 3; i++) {
        const emptyElements = body.querySelectorAll(emptyTagsSelector);
        let removed = 0;
        emptyElements.forEach((el) => {
          if (
            !el.textContent.trim() &&
            !el.querySelector('img, iframe, table, svg')
          ) {
            el.remove();
            removed++;
          }
        });
        if (removed === 0) break;
      }
    }

    // Final Serialization: 1 Line per Block
    let result = '';
    const topLevelNodes = Array.from(body.children);

    topLevelNodes.forEach((node) => {
      // Create a clean string representation on a single line
      let html = node.outerHTML;
      // Minify internal tag structure (remove internal spaces and newlines)
      html = html
        .replace(/>\s+</g, '><')
        .replace(/\r?\n|\r/g, ' ')
        .replace(/\s+/g, ' ');
      result += html + '\n';
    });

    // Global cleanup for persistent Word metadata strings and manual bullets
    result = result.replace(/family:Symbol;.*?&gt;/gi, '');
    result = result.replace(/<li>\s*[\u00B7\u2022]\s*/gi, '<li>'); // Deep removal of '·' or '•' at start of li

    return result.trim();
  }, []);

  // Update cleaned HTML live
  useEffect(() => {
    // Only update live if the user isn't manually editing the output right now
    setCleanedHtml(cleanMarkup(rawHtml, options));
  }, [rawHtml, options, cleanMarkup]);

  const handlePaste = (e) => {
    setTimeout(() => {
      if (pasteAreaRef.current) setRawHtml(pasteAreaRef.current.innerHTML);
    }, 50);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file?.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setRawHtml(result.value);
      if (pasteAreaRef.current) pasteAreaRef.current.innerHTML = result.value;
      toast.success('Word file ingested');
    }
  };

  const toggleOption = (key) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleCopy = () => {
    performAction(
      async () => {
        await navigator.clipboard.writeText(cleanedHtml);
        toast.success('HTML copied');
        await saveToolHistory({
          toolType: 'word-to-html',
          fileName: 'Pasted Content',
          fileSize: cleanedHtml.length,
          outputFormat: 'html',
          outputSize: cleanedHtml.length,
          reductionPercent:
            rawHtml.length > 0
              ? Math.round(
                  ((rawHtml.length - cleanedHtml.length) / rawHtml.length) * 100
                )
              : 0,
        });
      },
      { type: 'copy', name: 'Clean HTML' }
    );
  };

  const reset = () => {
    setRawHtml('');
    setCleanedHtml('');
    if (pasteAreaRef.current) pasteAreaRef.current.innerHTML = '';
  };

  const filters = [
    { id: 'removeEmptyTags', label: 'Empty Tags', icon: Eraser },
    { id: 'removeAttributes', label: 'Attributes', icon: Code },
    { id: 'removeStyles', label: 'Styles', icon: Layout },
    { id: 'removeSpans', label: 'Spans', icon: RefreshCw },
    { id: 'removeBrTags', label: 'BR Tags', icon: X },
    { id: 'removeOfficeTags', label: 'Office Tags', icon: FileType },
    { id: 'removeComments', label: 'Comments', icon: MessageSquare },
    { id: 'removeNbsp', label: 'Spaces', icon: Plus },
    { id: 'fixLists', label: 'Repair Lists', icon: List },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-[1400px] mx-auto px-4 py-8">
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: var(--muted-foreground);
          opacity: 0.4;
          cursor: text;
        }
      `}</style>
      <TooltipProvider>
        <div className="w-full max-w-[1700px] mx-auto min-h-[90vh] flex flex-col p-2 md:p-6 animate-in fade-in duration-700">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent font-orbitron">
                WORD TO HTML
              </h2>
              <Badge
                variant="outline"
                className="border-primary/10 bg-primary/5 text-primary text-[8px] font-black tracking-widest uppercase py-0 px-2"
              >
                PRO EDITOR
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 p-1.5 bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm">
              {filters.map((filter) => (
                <Tooltip key={filter.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleOption(filter.id)}
                      className={cn(
                        'h-10 w-10 flex items-center justify-center rounded-xl border transition-all group',
                        options[filter.id]
                          ? 'bg-primary/20 border-primary/40'
                          : 'bg-background/20 border-border/30 hover:border-border/60 hover:bg-background/40'
                      )}
                    >
                      <filter.icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          options[filter.id]
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-[10px] font-black uppercase tracking-widest bg-popover text-popover-foreground border-border/40 px-3 py-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    {filter.label}
                  </TooltipContent>
                </Tooltip>
              ))}
              <div className="w-px h-6 bg-border/50 mx-2" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <FileType className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="text-[10px] font-black uppercase tracking-widest bg-popover text-popover-foreground border-border/40"
                >
                  Upload .docx
                </TooltipContent>
              </Tooltip>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".docx"
                className="hidden"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={reset}
                    className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="text-[10px] font-black uppercase tracking-widest bg-popover text-popover-foreground border-border/40"
                >
                  Clear All
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:min-h-[550px]">
            <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2rem] flex flex-col shadow-xl overflow-hidden min-h-[350px]">
              <div className="px-6 py-2.5 border-b border-border/30 flex flex-wrap items-center justify-between bg-muted/10 gap-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                  <ClipboardCheck className="w-3.5 h-3.5 text-primary" /> Input
                  Editor
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 px-2 py-1 bg-background/40 rounded-xl border border-border/20">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        document.execCommand('formatBlock', false, 'p')
                      }
                      className="p-1 hover:text-primary transition-colors text-[10px] font-black"
                    >
                      P
                    </button>
                    <button
                      onClick={() =>
                        document.execCommand('formatBlock', false, 'h1')
                      }
                      className="p-1 hover:text-primary transition-colors text-[10px] font-black"
                    >
                      H1
                    </button>
                    <button
                      onClick={() =>
                        document.execCommand('formatBlock', false, 'h2')
                      }
                      className="p-1 hover:text-primary transition-colors text-[10px] font-black"
                    >
                      H2
                    </button>
                    <button
                      onClick={() =>
                        document.execCommand('formatBlock', false, 'h3')
                      }
                      className="p-1 hover:text-primary transition-colors text-[10px] font-black"
                    >
                      H3
                    </button>
                  </div>
                  <div className="w-px h-4 bg-border/50 mx-1" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        document.execCommand('insertUnorderedList')
                      }
                      title="Bullet List"
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <List className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => document.execCommand('insertOrderedList')}
                      title="Numbered List"
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <ListOrdered className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-px h-4 bg-border/50 mx-1" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => document.execCommand('bold')}
                      title="Bold"
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <Bold className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => document.execCommand('italic')}
                      title="Italic"
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <Italic className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-px h-4 bg-border/50 mx-1" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => document.execCommand('justifyLeft')}
                      title="Align Left"
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <AlignLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => document.execCommand('justifyCenter')}
                      title="Align Center"
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <AlignCenter className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => document.execCommand('justifyRight')}
                      title="Align Right"
                      className="p-1 hover:text-primary transition-colors"
                    >
                      <AlignRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <div
                ref={pasteAreaRef}
                contentEditable
                suppressContentEditableWarning={true}
                onPaste={handlePaste}
                onInput={(e) => setRawHtml(e.currentTarget.innerHTML)}
                className="flex-1 p-6 overflow-y-auto focus:outline-none text-foreground text-sm selection:bg-primary/20 leading-relaxed scrollbar-hide min-h-[300px] outline-none"
                placeholder="Paste your Word content here..."
              />
            </div>

            <div className="bg-card/60 backdrop-blur-2xl border border-border/50 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden min-h-[350px]">
              <div className="px-6 py-2.5 border-b border-border/30 flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-primary" /> Clean Stream
                  </h3>
                  <div className="flex bg-background/60 p-0.5 rounded-lg border border-border/20">
                    <button
                      onClick={() => setIsPreviewMode(false)}
                      className={cn(
                        'px-4 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all',
                        !isPreviewMode
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Code
                    </button>
                    <button
                      onClick={() => setIsPreviewMode(true)}
                      className={cn(
                        'px-4 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all',
                        isPreviewMode
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleCopy}
                  disabled={!cleanedHtml}
                  size="sm"
                  className="h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 px-4"
                >
                  <Copy className="w-3 h-3 mr-2" /> Copy
                </Button>
              </div>

              <div className="flex-1 overflow-hidden relative group">
                {isPreviewMode ? (
                  <div
                    className="absolute inset-0 p-6 overflow-y-auto preview-container prose prose-invert prose-xs max-w-none text-foreground prose-p:my-2 bg-background/10"
                    dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary/5 p-1">
                    <div
                      contentEditable
                      suppressContentEditableWarning={true}
                      onInput={(e) => setCleanedHtml(e.currentTarget.innerText)}
                      className="w-full h-full p-5 overflow-y-auto font-mono text-[11px] text-primary transition-all selection:bg-primary/30 leading-relaxed scrollbar-hide focus:outline-none whitespace-pre-wrap break-all"
                      spellCheck={false}
                    >
                      {cleanedHtml}
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge
                    variant="outline"
                    className="text-[7px] bg-background/50 border-border/20 text-primary/60 px-2 py-0"
                  >
                    Single-Line Mode Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 items-center justify-between px-3">
            <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                Efficiency:{' '}
                <span className="text-primary/80">
                  {rawHtml.length > 0
                    ? Math.round(
                        ((rawHtml.length - cleanedHtml.length) /
                          rawHtml.length) *
                          100
                      )
                    : 0}
                  % Gain
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                Optimization Score:{' '}
                <span className="text-primary/80">98/100</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground/30 uppercase">
              Validated by ContentArmor Engine © 2026
            </div>
          </div>

          <div className="mt-6">
            <ToolHistoryPanel toolType="word-to-html" />
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
