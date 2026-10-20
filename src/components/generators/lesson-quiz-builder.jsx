'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Upload,
  Code,
  Copy,
  CheckCircle2,
  History,
  Target,
  Trophy,
  Sparkles,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  processQuizFile,
  generateLessonQuizCode,
  parseQuizFromText,
} from '@/lib/docx-processor';
import { ProgressButton } from '@/components/progress-button';
import { HistoryList } from '@/components/history-list';
import { useAuthAction } from '@/lib/use-auth-action';
import { showToast, showSuccess } from '@/lib/swal';
import { saveGeneratorState } from '@/lib/tool-history';
import { cn } from '@/lib/utils';

export default function LessonQuizBuilder() {
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'paste'
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [detectedType, setDetectedType] = useState('lesson-quiz'); // 'lesson-quiz' | 'final-exam'
  const [detectedHeading, setDetectedHeading] = useState('Lesson Quiz');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedTracker, setCopiedTracker] = useState({});
  const { performAction } = useAuthAction();

  const downloadDemoFile = () => {
    performAction(
      () => {
        const link = document.createElement('a');
        link.href =
          'https://gyglsbmpxopaoeljoofp.supabase.co/storage/v1/object/public/media/library/1782908200666-lesson_quiz_sample.docx';
        link.download = 'lesson_quiz_sample.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      { type: 'download', name: 'Demo Lesson Quiz File' }
    );
  };

  const fileInputRef = useRef(null);

  // Auto-save helper
  const persistState = async (updates = {}) => {
    const currentState = {
      questions,
      generatedCode,
      detectedType,
      detectedHeading,
      fileName:
        updates.fileName || file?.name || detectedHeading || 'Lesson Quiz',
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
      setCopiedTracker({});
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
          'No "Lesson Quiz" or "Final Exam" section found in the document. Please ensure the file has an H1 heading titled "Lesson Quiz" or "Final Exam".'
        );
      }

      setProgress(100);
      setProgressText('Extraction complete!');
      setQuestions(data);

      const detected = data.detectedType || 'lesson-quiz';
      const heading =
        data.detectedHeading ||
        (detected === 'final-exam' ? 'Final Exam' : 'Lesson Quiz');
      setDetectedType(detected);
      setDetectedHeading(heading);

      const code = generateLessonQuizCode(data, heading);
      setGeneratedCode(code);
      setCopiedTracker({});

      showSuccess(
        `${detected === 'final-exam' ? 'Final Exam' : 'Lesson Quiz'} Extracted`,
        `Successfully identified ${data.length} questions from ${heading}.`
      );
      persistState({
        questions: data,
        generatedCode: code,
        detectedType: detected,
        detectedHeading: heading,
        fileName: file.name,
      });

      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      setIsProcessing(false);
      showToast(error.message, 'error');
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      return showToast(
        'Please paste quiz or final exam text first.',
        'warning'
      );
    }

    setIsProcessing(true);
    setProgress(30);
    setProgressText('Parsing questions and answer keys...');

    try {
      const data = parseQuizFromText(pastedText);

      if (!data || data.length === 0) {
        throw new Error(
          'No valid questions found in pasted text. Make sure questions have a number (e.g. "1. Question text") and options labeled A., B., C., D.'
        );
      }

      setProgress(100);
      setProgressText('Parsing complete!');
      setQuestions(data);

      const detected = data.detectedType || 'lesson-quiz';
      const heading =
        data.detectedHeading ||
        (detected === 'final-exam' ? 'Final Exam' : 'Lesson Quiz');
      setDetectedType(detected);
      setDetectedHeading(heading);

      const code = generateLessonQuizCode(data, heading);
      setGeneratedCode(code);
      setCopiedTracker({});

      showSuccess(
        `${detected === 'final-exam' ? 'Final Exam' : 'Lesson Quiz'} Parsed`,
        `Successfully extracted ${data.length} questions from pasted text.`
      );
      persistState({
        questions: data,
        generatedCode: code,
        detectedType: detected,
        detectedHeading: heading,
        fileName: `${heading} (Pasted)`,
      });

      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 800);
    } catch (error) {
      setIsProcessing(false);
      showToast(error.message, 'error');
    }
  };

  const loadSampleFinalExam = () => {
    const sample = `# Final Exam

1. What is the primary purpose of OSHA 29 CFR 1910.120 HAZWOPER regulations?
A. Regulate offshore maritime cargo tariffs
B. Protect workers involved in hazardous waste operations and emergency response
C. Standardize residential building electrical wiring codes
D. Supervise federal income tax filings
Correct Answer: B

2. Which level of personal protective equipment (PPE) provides the highest level of respiratory and skin protection?
A. Level A
B. Level B
C. Level C
D. Level D
Answer: A

3. An immediately dangerous to life or health (IDLH) atmosphere requires which type of respirator?
A. Dust mask
B. Half-face air-purifying respirator
C. Positive-pressure self-contained breathing apparatus (SCBA)
D. Surgical mask
Answer Key: C

4. What is the minimum training requirement for an on-site hazardous waste worker engaged in operations with potential health hazards?
A. 8 hours initial training
B. 24 hours initial training
C. 40 hours initial training plus 3 days field experience
D. No training required
Answer: C`;
    setPastedText(sample);
    showToast('Loaded sample Final Exam text.', 'info');
  };

  const copyLmsFormat = () => {
    if (!questions.length) return;
    const lmsText = questions
      .map((q, idx) => {
        const optionsText = q.options
          .map(
            (opt) =>
              `${opt.letter}. ${opt.text}${opt.letter === q.correctAnswer ? ' (CORRECT)' : ''}`
          )
          .join('\n');
        return `${idx + 1}. ${q.question}\n${optionsText}`;
      })
      .join('\n\n');

    performAction(
      () => {
        navigator.clipboard.writeText(lmsText);
        showSuccess('Copied', 'All questions copied in LMS plain text format.');
      },
      { type: 'copy', name: 'All Questions LMS Text' }
    );
  };

  const copyOnlyQuestion = (q, idx) => {
    performAction(
      () => {
        navigator.clipboard.writeText(`${q.question}`);
        setCopiedTracker((prev) => ({
          ...prev,
          [q.id]: {
            ...prev[q.id],
            question: true,
          },
        }));
        showSuccess('Copied', 'Question text copied.');
      },
      { type: 'copy', name: `Question Only ${q.number}` }
    );
  };

  const copyOption = (q, letter, text) => {
    performAction(
      () => {
        navigator.clipboard.writeText(`${text}`);
        setCopiedTracker((prev) => ({
          ...prev,
          [q.id]: {
            ...prev[q.id],
            [letter]: true,
          },
        }));
        showSuccess('Copied', `Option text copied.`);
      },
      { type: 'copy', name: `Option ${letter}` }
    );
  };

  const copyFullBlock = (q, idx) => {
    const optionsText = q.options
      .map(
        (opt) =>
          `${opt.letter}. ${opt.text}${opt.letter === q.correctAnswer ? ' (CORRECT)' : ''}`
      )
      .join('\n');
    const fullText = `${q.question}\n\n${optionsText}`;

    performAction(
      () => {
        navigator.clipboard.writeText(fullText);
        setCopiedTracker((prev) => ({
          ...prev,
          [q.id]: {
            question: true,
            A: true,
            B: true,
            C: true,
            D: true,
          },
        }));
        showSuccess('Success', `Full quiz item ${idx + 1} copied.`);
      },
      { type: 'copy', name: `Quiz Block ${q.number}` }
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
    if (state.detectedType) setDetectedType(state.detectedType);
    if (state.detectedHeading) setDetectedHeading(state.detectedHeading);
    setCopiedTracker({});
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
              {/* Input Mode Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/20 border border-border/40 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={cn(
                    'py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all',
                    inputMode === 'upload'
                      ? 'bg-background text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload DOCX
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={cn(
                    'py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all',
                    inputMode === 'paste'
                      ? 'bg-background text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <FileText className="h-3.5 w-3.5" /> Paste Text
                </button>
              </div>

              {inputMode === 'upload' ? (
                <>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Download our demo file to check the required structure.
                      Works for both
                      <strong> Lesson Quiz</strong> and{' '}
                      <strong>Final Exam</strong> documents.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadDemoFile}
                      className="btn text-xs"
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      Download Demo File
                    </Button>
                  </div>

                  <div
                    className="group relative border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/50 transition-all cursor-pointer bg-muted/5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="mb-3 inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                      <FileText className="h-7 w-7 text-primary/40 group-hover:text-primary/60" />
                    </div>
                    <h4 className="text-sm font-black text-foreground uppercase tracking-tight mb-1">
                      Load Training Document
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mb-3">
                      DOCX format with &quot;Lesson Quiz&quot; or &quot;Final
                      Exam&quot;
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
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in zoom-in duration-300">
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
                    label="EXTRACT QUIZ / EXAM"
                    loadingLabel={progressText || 'EXTRACTING'}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Paste question items with options (A-D) and answers:
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadSampleFinalExam}
                        className="h-7 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/10 gap-1 px-2"
                      >
                        <Sparkles className="h-3 w-3" /> Sample Final Exam
                      </Button>
                    </div>

                    <Textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={`# Final Exam\n\n1. What is the primary purpose of OSHA 29 CFR 1910.120?\nA. Maritime shipping codes\nB. Protect hazardous waste workers\nC. Residential electrical codes\nD. Commercial tax filings\nCorrect Answer: B\n\n2. Which PPE level provides maximum respiratory protection?\nA. Level A\nB. Level B\nC. Level C\nD. Level D\nAnswer: A`}
                      className="min-h-[220px] font-mono text-xs leading-relaxed border-border/50 bg-background/50 focus:border-primary resize-y"
                    />
                  </div>

                  <ProgressButton
                    onClick={handleParsePastedText}
                    isLoading={isProcessing}
                    progress={progress}
                    disabled={!pastedText.trim()}
                    label="PARSE QUESTIONS"
                    loadingLabel={progressText || 'PARSING'}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  />
                </>
              )}
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <Card className="card border-emerald-500/20 bg-emerald-500/5 overflow-hidden animate-in slide-in-from-left duration-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg',
                      detectedType === 'final-exam'
                        ? 'bg-purple-600 text-white shadow-purple-600/30'
                        : 'bg-emerald-500 text-white shadow-emerald-500/30'
                    )}
                  >
                    {detectedType === 'final-exam' ? (
                      <Trophy className="h-6 w-6" />
                    ) : (
                      <Target className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                      {detectedHeading ||
                        (detectedType === 'final-exam'
                          ? 'Final Exam'
                          : 'Lesson Quiz')}{' '}
                      Extracted
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">
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
            <CardHeader className="p-5 bg-card border-b border-border/50 flex flex-row items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  QUIZ WORKBENCH
                </CardTitle>
                {questions.length > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-black uppercase tracking-wider text-[9px] gap-1 px-2 py-0.5',
                      detectedType === 'final-exam'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    )}
                  >
                    {detectedType === 'final-exam' ? (
                      <Trophy className="h-3 w-3" />
                    ) : (
                      <Target className="h-3 w-3" />
                    )}
                    {detectedHeading ||
                      (detectedType === 'final-exam'
                        ? 'Final Exam'
                        : 'Lesson Quiz')}
                  </Badge>
                )}
              </div>

              {questions.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest gap-1.5 border-border/60 hover:bg-muted"
                    onClick={copyLmsFormat}
                    title="Copy all questions as clean plain text formatted for LMS platforms"
                  >
                    <FileText className="h-3 w-3 text-primary" /> Copy LMS Text
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all"
                    onClick={copyAllCode}
                  >
                    <Copy className="h-3 w-3" /> Copy HTML
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              {questions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                  <Target className="h-16 w-16 mb-4" />
                  <h4 className="text-xl font-black uppercase tracking-tighter italic">
                    Awaiting Signal
                  </h4>
                  <p className="text-xs font-bold uppercase tracking-widest max-w-[260px] mt-1">
                    Upload a DOCX file or paste exam text to initialize
                    extraction logic
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-border/30 bg-muted/5">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent border border-emerald-500/10">
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">
                          {detectedHeading}
                        </h4>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                          Refine and copy individual questions or full blocks
                          for LMS.{' '}
                          <span className="text-emerald-500 dark:text-emerald-400">
                            Green
                          </span>{' '}
                          indicates fully copied to clipboard.
                        </p>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                      {questions.map((q, idx) => {
                        const isQuestionCopied =
                          !!copiedTracker[q.id]?.question;
                        const isAllOptionsCopied = q.options.every(
                          (opt) => !!copiedTracker[q.id]?.[opt.letter]
                        );
                        const isFullyCopied =
                          isQuestionCopied && isAllOptionsCopied;

                        return (
                          <div
                            key={q.id}
                            className={cn(
                              'group relative p-4 rounded-2xl border transition-all duration-300 space-y-3',
                              isFullyCopied
                                ? 'bg-emerald-500/[0.02] border-emerald-500/50 dark:border-emerald-500/30 shadow-md shadow-emerald-500/[0.02]'
                                : 'bg-card border-border/50 hover:border-primary/20'
                            )}
                          >
                            {/* Card Top Details Header */}
                            <div className="flex items-center justify-between border-b border-border/30 pb-2.5 flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300',
                                    isFullyCopied
                                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                      : 'bg-muted text-foreground/50 border border-border'
                                  )}
                                >
                                  {idx + 1}
                                </div>
                                <span className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest">
                                  QUESTION BLOCK
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isFullyCopied && (
                                  <span className="text-emerald-500 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest animate-in fade-in duration-300">
                                    ✓ COPIED
                                  </span>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[8px] font-black uppercase tracking-widest gap-1 border-primary/20 hover:bg-primary/10 text-foreground"
                                  onClick={() => copyFullBlock(q, idx)}
                                  title="Copy question stem and all options for LMS"
                                >
                                  <Copy className="h-3 w-3 text-primary" /> Copy
                                  Full Block
                                </Button>
                              </div>
                            </div>

                            {/* Question Container Block */}
                            <div className="bg-muted/10 border border-border/20 p-3 rounded-xl flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="mb-0.5">
                                  <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest">
                                    QUESTION
                                  </span>
                                </div>
                                <p className="text-xs text-foreground font-semibold leading-relaxed">
                                  {q.question}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-7 w-7 rounded-lg transition-all shrink-0 mt-0.5',
                                  isQuestionCopied
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'hover:bg-muted text-muted-foreground/60 hover:text-foreground'
                                )}
                                onClick={() => copyOnlyQuestion(q, idx)}
                                title={
                                  isQuestionCopied
                                    ? 'Copied'
                                    : 'Copy Question Only'
                                }
                              >
                                {isQuestionCopied ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>

                            {/* Options Container Block */}
                            <div className="grid gap-2">
                              {q.options.map((opt) => {
                                const isOptCopied =
                                  !!copiedTracker[q.id]?.[opt.letter];
                                const isCorrect =
                                  opt.letter === q.correctAnswer;

                                return (
                                  <div
                                    key={opt.letter}
                                    className={cn(
                                      'flex items-center justify-between gap-4 p-2 rounded-xl border text-xs transition-all relative',
                                      isCorrect
                                        ? 'bg-amber-500/[0.02] border-amber-500/25'
                                        : 'bg-muted/5 border-border/30'
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <div
                                        className={cn(
                                          'h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 transition-colors',
                                          isCorrect
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-muted text-foreground/45 border border-border'
                                        )}
                                      >
                                        {opt.letter}
                                      </div>
                                      <p
                                        className={cn(
                                          'text-xs flex-1 leading-normal',
                                          isCorrect
                                            ? 'font-bold text-foreground'
                                            : 'text-muted-foreground font-medium'
                                        )}
                                      >
                                        {opt.text}
                                      </p>
                                      {isCorrect && (
                                        <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                                          CORRECT
                                        </span>
                                      )}
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        'h-7 w-7 rounded-lg transition-all shrink-0',
                                        isOptCopied
                                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                          : 'hover:bg-muted text-muted-foreground/60 hover:text-foreground'
                                      )}
                                      onClick={() =>
                                        copyOption(q, opt.letter, opt.text)
                                      }
                                      title={isOptCopied ? 'Copied' : 'Copy'}
                                    >
                                      {isOptCopied ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
