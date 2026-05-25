'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  Code,
  Copy,
  Eye,
  Book,
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
import {
  processGlossaryFile,
  generateGlossaryCode,
} from '@/lib/docx-processor';
import { PreviewDrawer } from '@/components/preview-drawer';
import { ProgressButton } from '@/components/progress-button';
import { toast } from 'sonner';
import { saveGeneratorState } from '@/lib/tool-history';
import { HistoryList } from '@/components/history-list';
import { useAuthAction } from '@/lib/use-auth-action';

export function GlossaryGenerator() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [glossaryData, setGlossaryData] = useState(null);
  const [glossaryCode, setGlossaryCode] = useState('');
  const [restoredFileName, setRestoredFileName] = useState('');
  const { performAction } = useAuthAction();

  const fileInputRef = useRef(null);

  // Preview Drawer State
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile);
    } else {
      toast.error('Invalid file type. Please upload a .docx file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setProgressText('Reading file...');

    try {
      // Record to media hub
      const { recordMediaUpload } = await import('@/lib/media-hub');
      await recordMediaUpload({
        fileName: file.name,
        fileType:
          file.type ||
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: file.size,
      });
      const data = await processGlossaryFile(file, (p) => {
        setProgress(10 + p * 0.8);
      });

      setGlossaryData(data);
      setProgress(90);
      setProgressText('File processed successfully!');

      // Auto generate code
      const code = generateGlossaryCode(data);
      setGlossaryCode(code);

      setProgress(95);
      setProgressText('Saving session...');

      try {
        await saveGeneratorState(
          'glossary_generator',
          {
            glossaryData: data,
            glossaryCode: code,
            fileName: file.name,
          },
          `Glossary - ${file.name}`
        );
      } catch (saveErr) {
        console.error('Error saving generator state:', saveErr);
        // Non-blocking: code was generated successfully, just log the save error
      }

      setProgress(100);
      setProgressText('Complete!');
      toast.success('Glossary generated successfully!');

      // Brief pause so user sees 100% before reset
      await new Promise((r) => setTimeout(r, 800));
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file: ' + error.message);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressText('');
    }
  };

  const copyToClipboard = () => {
    performAction(
      () => {
        navigator.clipboard.writeText(glossaryCode);
      },
      { type: 'copy', name: 'Glossary Code' }
    );
  };

  const handleRestore = (state) => {
    if (!state) return;
    setGlossaryData(state.glossaryData || null);
    setGlossaryCode(state.glossaryCode || '');
    setRestoredFileName(state.fileName || '');
    toast.success('Glossary session synchronized');
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
              toolType="glossary_generator"
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
                <Book className="h-5 w-5 text-primary" />
                Glossary Extraction
              </CardTitle>
            </CardHeader>
            <CardContent className="card-body space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a Word document containing glossary terms and
                  definitions to generate sanitized website HTML.
                </p>
              </div>

              <div className="space-y-4">
                <div
                  className="file-upload-area p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload DOCX glossary
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
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

                <div className="pt-2">
                  <ProgressButton
                    onClick={handleUpload}
                    disabled={!file || isProcessing}
                    isLoading={isProcessing}
                    progress={progress}
                    label="Extract and Generate Glossary"
                    loadingLabel={progressText || 'Processing'}
                    className="w-full h-11 rounded-xl text-sm font-medium shadow-md"
                    variant="default"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Output */}
        <div className="space-y-6">
          <div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col overflow-hidden">
            {glossaryCode ? (
              <div className="flex-1 p-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Generated HTML Code
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewOpen(true)}
                    >
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </Button>
                    <Button size="sm" onClick={copyToClipboard}>
                      <Copy className="h-3 w-3 mr-1" /> Copy Code
                    </Button>
                  </div>
                </div>

                <textarea
                  className="flex-1 w-full bg-muted/50 border rounded-md p-4 font-mono text-xs resize-none focus:outline-ring code-editor"
                  value={glossaryCode}
                  onChange={(e) => setGlossaryCode(e.target.value)}
                  placeholder="Code will appear here..."
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
                <Book className="h-12 w-12 mb-4 opacity-20" />
                <h4 className="text-xl font-medium mb-2">
                  No Code Generated Yet
                </h4>
                <p className="text-sm text-center max-w-xs">
                  Upload a file and process it to see the glossary code here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Glossary Preview"
        content={glossaryCode}
      />
    </div>
  );
}
