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
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { processResourceFile } from '@/lib/excel-processor';
import { PreviewDrawer } from '@/components/preview-drawer';
import { ProgressButton } from '@/components/progress-button';

import { toast } from 'sonner';
import { saveGeneratorState } from '@/lib/tool-history';
import { HistoryList } from '@/components/history-list';
import { useAuthAction } from '@/lib/use-auth-action';

export function ResourceGenerator() {
  const [file, setFile] = useState(null);
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
        file?.name ||
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
    if (type === 'error') toast.error(message);
    else if (type === 'warning' || type === 'info') toast.info(message);
    else toast.success(message);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      showNotification(`Selected: ${e.target.files[0].name}`, 'info');
    }
  };

  const handleGenerate = async () => {
    if (!file)
      return showNotification('Please select a file to upload.', 'warning');

    setIsProcessing(true);
    setProgress(10);
    setProgressText('Reading Excel file...');

    try {
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const { html, count } = await processResourceFile(file, glossaryLink);

      clearInterval(interval);
      setProgress(100);
      setProgressText('Resources generated successfully!');
      setResourceCode(html);

      showNotification(`Generated HTML for ${count} resources!`, 'success');
      persistState({ resourceCode: html, glossaryLink });

      try {
        const { recordMediaUpload } = await import('@/lib/media-hub');
        await recordMediaUpload({
          fileName: file.name,
          fileType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileSize: file.size,
        });
      } catch (e) {}

      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setProgressText('');
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      showNotification('Error processing file: ' + error.message, 'error');
    }
  };

  const downloadDemoFile = () => {
    const link = document.createElement('a');
    link.href =
      'https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354092/Resource_Sample_File.xlsx';
    link.download = 'Resource_Sample_File.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    toast.success('Resource session synchronized');
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
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Upload an Excel file (.xlsx) with columns for Module, Title,
                  PDFs, and Links.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={downloadDemoFile}
                  className="h-auto p-0 text-primary hover:text-primary/80 font-bold mb-2"
                >
                  <Upload className="mr-1 h-3 w-3" />
                  Download Demo File
                </Button>
              </div>

              <div className="space-y-4">
                <div
                  className="file-upload-area p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload Excel file
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
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
                    If provided, this will be used for the "Glossary" button
                    link. Defaults to #.
                  </p>
                </div>

                <div className="pt-2">
                  <ProgressButton
                    onClick={handleGenerate}
                    disabled={!file || isProcessing}
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
