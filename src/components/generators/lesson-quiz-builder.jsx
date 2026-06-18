'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Upload,
  Code,
  Eye,
  Copy,
  CheckCircle2,
  AlertCircle,
  History,
  Target,
  Trophy,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { processQuizFile, generateLessonQuizCode } from '@/lib/docx-processor';
import { PreviewDrawer } from '@/components/preview-drawer';
import { ProgressButton } from '@/components/progress-button';
import { HistoryList } from '@/components/history-list';
import { useAuthAction } from '@/lib/use-auth-action';
import { showToast, showSuccess } from '@/lib/swal';
import { saveGeneratorState } from '@/lib/tool-history';
import { cn } from '@/lib/utils';

export default function LessonQuizBuilder() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedItems, setCopiedItems] = useState(new Set());
  const { performAction } = useAuthAction();

  const fileInputRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Auto-save helper
  const persistState = async (updates = {}) => {
    const currentState = {
      questions,
      generatedCode,
      fileName: updates.fileName || file?.name || 'Lesson Quiz',
      ...updates,
    };
    await saveGeneratorState(
      'lesson_quiz_builder',
      currentState,
      currentState.fileName
    );
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setQuestions([]);
      setGeneratedCode('');
      setCopiedItems(new Set());
      showToast(`Selected: ${e.target.files[0].name}`, 'info');
    }
  };

  const handleUpload = async () => {
    if (!file) return showToast('Please select a file first.', 'warning');

    setIsProcessing(true);
    setProgress(10);
    setProgressText('Analyzing document structure...');

    try {
      const data = await processQuizFile(file);

      if (!data || data.length === 0) {
        throw new Error(
          'No "Lesson Quiz" section found in the document. Please ensure the file has an H1 heading titled "Lesson Quiz".'
        );
      }

      setProgress(100);
      setProgressText('Extraction complete!');
      setQuestions(data);

      const code = generateLessonQuizCode(data);
      setGeneratedCode(code);

      showSuccess(
        'Quiz Extracted',
        `Successfully identified ${data.length} questions.`
      );
      persistState({ questions: data, generatedCode: code });

      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      setIsProcessing(false);
      showToast(error.message, 'error');
    }
  };

  const copyQuestion = (q) => {
    const optionsText = q.options
      .map(
        (opt) =>
          `${opt.text}${opt.letter === q.correctAnswer ? ' (CORRECT)' : ''}`
      )
      .join('\n');
    const fullText = `${q.question}\n\n${optionsText}`;

    performAction(
      () => {
        navigator.clipboard.writeText(fullText);
        const newCopied = new Set(copiedItems);
        newCopied.add(q.id);
        setCopiedItems(newCopied);
        showSuccess('Copied', 'Quiz data copied to clipboard.');
      },
      { type: 'copy', name: `Quiz Block ${q.number}` }
    );
  };

  const copyOnlyQuestion = (q) => {
    performAction(
      () => {
        navigator.clipboard.writeText(`${q.question}`);
        showSuccess('Copied', 'Question text copied.');
      },
      { type: 'copy', name: `Question Only ${q.number}` }
    );
  };

  const copyOption = (letter, text) => {
    performAction(
      () => {
        navigator.clipboard.writeText(`${text}`);
        showSuccess('Copied', `Option text copied.`);
      },
      { type: 'copy', name: `Option ${letter}` }
    );
  };

  const copyAllCode = () => {
    performAction(
      () => {
        navigator.clipboard.writeText(generatedCode);
        showSuccess('Success', 'Full HTML code copied to clipboard.');
      },
      { type: 'copy', name: 'Full Quiz HTML' }
    );
  };

  const handleRestore = (state) => {
    if (!state) return;
    setQuestions(state.questions || []);
    setGeneratedCode(state.generatedCode || '');
    setCopiedItems(new Set());
    showSuccess('Neural Sync', 'Session data restored successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card/30 backdrop-blur-md p-4 rounded-2xl border border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight">
              Lesson Quiz Builder
            </h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
              Professional Extraction Unit
            </p>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-10 rounded-xl font-black uppercase tracking-widest text-[9px] gap-2 border-primary/20 hover:bg-primary/5 transition-all"
            >
              <History className="h-3.5 w-3.5 text-primary" /> Neural Sync
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:max-w-[400px] p-0 glass-panel border-l border-border z-[200]"
          >
            <SheetHeader className="p-6 border-b border-border/50">
              <SheetTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-tight">
                <History className="h-4 w-4 text-primary" />
                Sync History
              </SheetTitle>
            </SheetHeader>
            <HistoryList
              toolType="lesson_quiz_builder"
              onRestore={handleRestore}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Input Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card overflow-hidden border-primary/10">
            <CardHeader className="p-6 bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Input Source
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div
                className="group relative border-2 border-dashed border-border/50 rounded-2xl p-10 text-center hover:border-primary/50 transition-all cursor-pointer bg-muted/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mb-4 inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <FileText className="h-8 w-8 text-primary/40 group-hover:text-primary/60" />
                </div>
                <h4 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">
                  Load Training Data
                </h4>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mb-4">
                  DOCX format required
                </p>
                <div className="flex justify-center">
                  <div className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                    Select File
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {file && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                        Ready for signal extraction
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <ProgressButton
                onClick={handleUpload}
                isLoading={isProcessing}
                progress={progress}
                disabled={!file}
                label="EXTRACT QUIZ DATA"
                loadingLabel={progressText || 'EXTRACTING'}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              />
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <Card className="card border-emerald-500/20 bg-emerald-500/5 overflow-hidden animate-in slide-in-from-left duration-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                      Extraction Success
                    </h3>
                    <p className="text-xs font-medium text-emerald-600/70">
                      {questions.length} questions identified and formatted.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Output Column */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="card h-full flex flex-col border-primary/10 overflow-hidden min-h-[600px]">
            <CardHeader className="p-6 bg-card border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                Protocol Output
              </CardTitle>
              {questions.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 bg-primary/5 hover:bg-primary/10 transition-all"
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all"
                    onClick={copyAllCode}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy All HTML
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              {questions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
                  <Target className="h-16 w-16 mb-4" />
                  <h4 className="text-xl font-black uppercase tracking-tighter italic">
                    Awaiting Signal
                  </h4>
                  <p className="text-xs font-bold uppercase tracking-widest max-w-[200px]">
                    Synchronize a training file to initialize extraction logic
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className={cn(
                          'group relative p-5 rounded-2xl border transition-all duration-300',
                          copiedItems.has(q.id)
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-card border-border/50 hover:border-primary/30'
                        )}
                      >
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                              Question {idx + 1}
                            </span>
                            <div className="flex items-start gap-2">
                              <h4 className="text-sm font-bold text-foreground leading-snug">
                                {q.question}
                              </h4>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 rounded-md hover:bg-primary/10 flex-shrink-0"
                                onClick={() => copyOnlyQuestion(q)}
                                title="Copy Question Text"
                              >
                                <Copy className="h-3 w-3 opacity-60" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          {q.options.map((opt) => (
                            <div
                              key={opt.letter}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border text-xs transition-all relative group/opt',
                                opt.letter === q.correctAnswer
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-100 font-bold shadow-sm shadow-amber-500/5 ring-1 ring-amber-500/20'
                                  : 'bg-muted/30 border-border/40 text-muted-foreground'
                              )}
                            >
                              <div
                                className={cn(
                                  'h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0',
                                  opt.letter === q.correctAnswer
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-muted text-foreground/40 border border-border'
                                )}
                              >
                                {opt.letter}
                              </div>
                              <span className="flex-1">{opt.text}</span>

                              <div className="flex items-center gap-2">
                                {opt.letter === q.correctAnswer && (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-600/80 mr-1">
                                    Correct Answer
                                  </span>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 rounded-md hover:bg-primary/20 flex"
                                  onClick={() =>
                                    copyOption(opt.letter, opt.text)
                                  }
                                  title={`Copy Option Text`}
                                >
                                  <Copy className="h-3 w-3 opacity-60" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Lesson Quiz Preview"
        content={generatedCode}
      />
    </div>
  );
}
