'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  FileSpreadsheet,
  Upload,
  Code,
  Copy,
  Eye,
  CheckCircle2,
  AlertCircle,
  History,
  FileText,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  processResourceFile,
  processResourceText,
} from '@/lib/excel-processor';
import { PreviewDrawer } from '@/components/preview-drawer';
import { ProgressButton } from '@/components/progress-button';

import { showToast, showSuccess } from '@/lib/swal';
import { saveGeneratorState } from '@/lib/tool-history';
import { HistoryList } from '@/components/history-list';
import { useAuthAction } from '@/lib/use-auth-action';

export function ResourceGenerator() {
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'paste'
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [resourceCode, setResourceCode] = useState('');
  const [glossaryLink, setGlossaryLink] = useState('');
  const [restoredFileName, setRestoredFileName] = useState('');
  const { performAction } = useAuthAction();

  const fileInputRef = useRef(null);

  // Preview Drawer State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // Auto-save helper
  const persistState = async (updates = {}) => {
    const currentState = {
      resourceCode,
      glossaryLink,
      fileName:
        updates.fileName ||
        (inputMode === 'file' ? file?.name : 'Pasted_TOC_Resources') ||
        restoredFileName ||
        'Resource Content',
      ...updates,
    };
    await saveGeneratorState(
      'resource_generator',
      currentState,
      currentState.fileName
    );
  };

  const showNotification = (message, type = 'success') => {
    showToast(message, type);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Reset generated states for new file context
      setResourceCode('');
      showNotification(`Selected: ${e.target.files[0].name}`, 'info');
    }
  };

  const handleGenerate = async () => {
    if (inputMode === 'file' && !file)
      return showNotification('Please select a file to upload.', 'warning');
    if (inputMode === 'paste' && !pastedText.trim())
      return showNotification(
        'Please paste TOC or spreadsheet text.',
        'warning'
      );

    setIsProcessing(true);
    setProgress(10);
    setProgressText(
      inputMode === 'file'
        ? 'Reading spreadsheet file...'
        : 'Parsing spreadsheet formulas & citations...'
    );

    try {
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const { html, count } =
        inputMode === 'file'
          ? await processResourceFile(file, glossaryLink)
          : await processResourceText(pastedText, glossaryLink);

      clearInterval(interval);
      setProgress(100);
      setProgressText('Resources generated successfully!');
      setResourceCode(html);

      showNotification(`Generated HTML for ${count} resources!`, 'success');
      persistState({
        resourceCode: html,
        glossaryLink,
        fileName: inputMode === 'file' ? file?.name : 'Pasted_TOC_Resources',
      });

      if (inputMode === 'file' && file) {
        try {
          const { recordMediaUpload } = await import('@/lib/media-hub');
          await recordMediaUpload({
            fileName: file.name,
            fileType:
              file.type ||
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            fileSize: file.size,
          });
        } catch (e) {}
      }

      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setProgressText('');
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      showNotification('Error processing resources: ' + error.message, 'error');
    }
  };

  const downloadDemoFile = () => {
    performAction(
      () => {
        const link = document.createElement('a');
        link.href =
          'https://gyglsbmpxopaoeljoofp.supabase.co/storage/v1/object/public/media/library/1782908167835-resources_sample.xlsx';
        link.download = 'resources_sample.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      { type: 'download', name: 'Demo Resources File' }
    );
  };

  const openPreview = () => {
    setPreviewContent(resourceCode);
    setPreviewOpen(true);
  };

  const copyToClipboard = () => {
    performAction(
      () => {
        navigator.clipboard.writeText(resourceCode);
      },
      { type: 'copy', name: 'Resource Code' }
    );
  };

  const handleRestore = (state) => {
    if (!state) return;
    setResourceCode(state.resourceCode || '');
    setGlossaryLink(state.glossaryLink || '');
    setRestoredFileName(state.fileName || '');
    showSuccess('Resource session synchronized');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-primary/20 hover:bg-primary/5 transition-all shadow-sm"
            >
              <History className="h-4 w-4 text-primary" /> Neural Sync History
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-[50%] p-0 glass-panel-deep border-l border-border animate-in slide-in-from-right duration-500 z-[200]"
          >
            <SheetHeader className="p-8 border-b border-border/50 bg-muted/20">
              <SheetTitle className="flex items-center gap-3 text-sm font-black">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <History className="h-5 w-5 text-primary" />
                </div>
                Neural Sync Hub
              </SheetTitle>
            </SheetHeader>
            <HistoryList
              toolType="resource_generator"
              onRestore={handleRestore}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Controls */}

        <div className="space-y-6">
          <Card className="card">
            <CardHeader className="card-header">
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-warning" />
                Upload Resource File
              </CardTitle>
            </CardHeader>
            <CardContent className="card-body space-y-4">
              <div className="space-y-2 border-b border-border pb-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  Download our demo file to check the required structure. Create
                  your resources file following the same format, then upload for
                  easy website content code generation.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadDemoFile}
                  className="btn"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Download Demo Resources File
                </Button>
              </div>

              <div className="flex rounded-lg bg-muted p-1 gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    inputMode === 'file'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload File (.xlsx, .csv)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    inputMode === 'paste'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Paste Spreadsheet / TOC Text
                </button>
              </div>

              <div className="space-y-4">
                {inputMode === 'file' ? (
                  <>
                    <div
                      className="file-upload-area p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Click to upload Excel or CSV file (.xlsx, .xls, .csv)
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">
                        Full support for `=HYPERLINK(...)` formulas, Cal/OSHA &
                        OSHA citations
                      </p>
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv, .txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="text-xs text-muted-foreground mt-1 text-center font-medium italic">
                      {file
                        ? `Selected: ${file.name}`
                        : restoredFileName
                          ? `Identity Restored: ${restoredFileName}`
                          : 'No file selected'}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Paste TOC or Spreadsheet Data</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Supports CSV, TSV, or copied spreadsheet rows
                      </span>
                    </label>
                    <textarea
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Paste your course TOC rows with Lesson No., Title, Resources: Links (=HYPERLINK(...)) or citations here..."
                      className="w-full bg-muted/40 border border-input rounded-lg p-3 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Glossary Link Input */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground pl-1">
                      Glossary Anchor Link (Optional)
                    </label>
                  </div>
                  <Input
                    placeholder="Paste glossary page URL or anchor here..."
                    value={glossaryLink}
                    onChange={(e) => setGlossaryLink(e.target.value)}
                    className="form-control text-xs"
                  />
                  <p className="text-[9px] text-muted-foreground italic pl-1">
                    If provided, this will be used for the &quot;Glossary&quot;
                    button link.
                  </p>
                </div>

                <div className="pt-2">
                  <ProgressButton
                    onClick={handleGenerate}
                    disabled={
                      isProcessing ||
                      (inputMode === 'file' ? !file : !pastedText.trim())
                    }
                    isLoading={isProcessing}
                    progress={progress}
                    label="Process and Generate Resources"
                    loadingLabel={progressText || 'Processing'}
                    className="btn w-full h-11 rounded-xl text-sm font-medium shadow-md"
                    variant="default"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Output */}
        <div className="space-y-6">
          <div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col">
            {!resourceCode ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
                <Code className="h-12 w-12 mb-4 opacity-20" />
                <h4 className="text-xl font-medium mb-2">
                  No Code Generated Yet
                </h4>
                <p className="text-sm text-center max-w-xs">
                  Upload a file and generate content to see the code here
                </p>
              </div>
            ) : (
              <div className="flex-1 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4" /> Resource HTML Code
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openPreview}
                      className="preview-icon-btn"
                    >
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={copyToClipboard}
                      className="copy-btn"
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>

                <textarea
                  className="flex-1 w-full bg-muted/50 border rounded-md p-4 font-mono text-xs resize-none focus:outline-ring code-editor"
                  value={resourceCode}
                  onChange={(e) => setResourceCode(e.target.value)}
                  placeholder="Code will appear here..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <PreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Resource Preview"
        content={previewContent}
      />
    </div>
  );
}
