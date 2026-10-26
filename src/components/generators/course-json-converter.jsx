'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Code,
  ShieldCheck,
  HelpCircle,
  Clock,
  BookOpen,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  Sliders,
  FileCode,
  CheckCircle,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { loadPdfJs } from '@/lib/pdf-js-loader';
import {
  convertDocumentToCourseJson,
  validateCourseJson,
  buildCourseJson,
  segmentLessonWiseHtml,
  segmentCourseWiseHtml,
} from '@/lib/course-converter';

export default function CourseJsonConverter() {
  // Conversion state
  const [mode, setMode] = useState('A'); // 'A' = Lesson-wise, 'B' = Course-wise
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [error, setError] = useState(null);

  // Result state
  const [courseJson, setCourseJson] = useState(null);
  const [validation, setValidation] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  // Active inspectors
  const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy' | 'quiz' | 'html' | 'validation' | 'json'
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Manual Metadata Overrides
  const [courseTitleOverride, setCourseTitleOverride] = useState('');
  const [moduleTitleOverride, setModuleTitleOverride] = useState('');
  const [lessonTitleOverride, setLessonTitleOverride] = useState('');

  const fileInputRef = useRef(null);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Handle document upload and conversion
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setError(null);
    setFile(selectedFile);
    setIsProcessing(true);
    setProcessStep('Reading file bytes...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const isPdf = /\.pdf$/i.test(selectedFile.name);

      let pdfjsLib = null;
      if (isPdf) {
        setProcessStep('Initializing PDF parser...');
        pdfjsLib = await loadPdfJs();
      }

      setProcessStep('Extracting structure and headings...');
      const options = {
        fileName: selectedFile.name,
        mode,
        pdfjsLib,
        overrides: {
          course_title: courseTitleOverride || undefined,
          module_title: moduleTitleOverride || undefined,
          lesson_title: lessonTitleOverride || undefined,
        },
      };

      setProcessStep('Sanitizing HTML & isolating assessments...');
      const res = await convertDocumentToCourseJson(arrayBuffer, options);

      setCourseJson(res.courseJson);
      setValidation(res.validation);
      setParsedData(res.parsedData);

      // Pre-fill override inputs from detected metadata if not already customized
      if (!courseTitleOverride && res.courseJson.course_title) {
        setCourseTitleOverride(res.courseJson.course_title);
      }
      if (!moduleTitleOverride && res.courseJson.modules?.[0]?.module_title) {
        setModuleTitleOverride(res.courseJson.modules[0].module_title);
      }
      if (
        !lessonTitleOverride &&
        res.courseJson.modules?.[0]?.lessons?.[0]?.lesson_title
      ) {
        setLessonTitleOverride(
          res.courseJson.modules[0].lessons[0].lesson_title
        );
      }

      setSelectedTopicIndex(0);
      setProcessStep('Conversion completed!');
    } catch (err) {
      console.error('Course JSON conversion error:', err);
      setError(
        err.message || 'Failed to parse document and generate course JSON.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-apply overrides if the user updates them
  const handleApplyOverrides = () => {
    if (!parsedData) return;
    const updated = buildCourseJson(parsedData, {
      course_title: courseTitleOverride,
      module_title: moduleTitleOverride,
      lesson_title: lessonTitleOverride,
    });
    const val = validateCourseJson(updated);
    setCourseJson(updated);
    setValidation(val);
  };

  // Download Course JSON
  const handleDownload = () => {
    if (!courseJson) return;
    const filename = `${(courseJson.course_title || 'course')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')}_lms.json`;
    const jsonString = JSON.stringify(courseJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy JSON to clipboard
  const handleCopy = async () => {
    if (!courseJson) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(courseJson, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // All topics flat list for easy preview navigation
  const allTopics = useMemo(() => {
    if (!courseJson || !Array.isArray(courseJson.modules)) return [];
    const list = [];
    courseJson.modules.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        (l.topics || []).forEach((t) => {
          list.push({
            ...t,
            moduleTitle: m.module_title,
            lessonTitle: l.lesson_title,
          });
        });
      });
    });
    return list;
  }, [courseJson]);

  // All quizzes flat list
  const allQuizzes = useMemo(() => {
    if (!courseJson || !Array.isArray(courseJson.modules)) return [];
    const list = [];
    courseJson.modules.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        (l.knowledge_check || []).forEach((q, qIndex) => {
          list.push({
            ...q,
            moduleTitle: m.module_title,
            lessonTitle: l.lesson_title,
            index: qIndex + 1,
          });
        });
      });
    });
    return list;
  }, [courseJson]);

  const activeTopic = allTopics[selectedTopicIndex] || allTopics[0] || null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileCode className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              LMS Course JSON Converter
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
            >
              Production Standard
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Transform Word (.docx) and PDF course documents into exact LMS
            schema specifications with clean HTML, duration calculations, and
            isolated quizzes.
          </p>
        </div>

        {courseJson && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        )}
      </div>

      {/* Mode Selection & File Dropzone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Mode & File Uploader */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Conversion Mode
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setMode('A')}
                    className={cn(
                      'flex flex-col p-3 rounded-lg border text-left transition-all text-xs',
                      mode === 'A'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-medium'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <span className="font-semibold text-sm">Mode A</span>
                    <span className="mt-0.5 text-[11px] opacity-80">
                      Lesson-wise (.docx / .pdf)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('B')}
                    className={cn(
                      'flex flex-col p-3 rounded-lg border text-left transition-all text-xs',
                      mode === 'B'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-medium'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <span className="font-semibold text-sm">Mode B</span>
                    <span className="mt-0.5 text-[11px] opacity-80">
                      Course-wise (Full Syllabus)
                    </span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Source Document
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    const droppedFile = e.dataTransfer?.files?.[0];
                    if (droppedFile) {
                      handleFileUpload(droppedFile);
                    }
                  }}
                  className={cn(
                    'mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none',
                    isDragging
                      ? 'border-blue-500 bg-blue-100/40 dark:bg-blue-950/40 ring-4 ring-blue-500/20 scale-[1.01]'
                      : file
                        ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                  <div
                    className={cn(
                      'p-3 rounded-full transition-colors',
                      isDragging
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {isDragging
                        ? 'Drop your Word or PDF file here'
                        : file
                          ? file.name
                          : 'Upload Word or PDF'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isDragging
                        ? 'Release to start conversion immediately'
                        : file
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : 'Click to browse or drag & drop file here'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress State */}
              {isProcessing && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    {processStep}
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Metadata Overrides */}
              {courseJson && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-slate-500" />
                      Metadata Review
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyOverrides}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      Update
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-500">
                        Course Title
                      </span>
                      <Input
                        value={courseTitleOverride}
                        onChange={(e) => setCourseTitleOverride(e.target.value)}
                        className="h-8 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">
                        Module Title
                      </span>
                      <Input
                        value={moduleTitleOverride}
                        onChange={(e) => setModuleTitleOverride(e.target.value)}
                        className="h-8 text-xs mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">
                        Lesson Title
                      </span>
                      <Input
                        value={lessonTitleOverride}
                        onChange={(e) => setLessonTitleOverride(e.target.value)}
                        className="h-8 text-xs mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Key Metrics & Inspectors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dashboard Metrics (When Converted) */}
          {courseJson ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Layers className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {courseJson.total_modules} Mod / {allTopics.length} Top
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hierarchy Depth
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {allQuizzes.length} Questions
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Lesson Quizzes
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatTime(courseJson.duration?.total_seconds)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Total Duration
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {validation?.score || 100}%
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Schema Health
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <CardContent className="p-8 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    Ready to Convert LMS Course
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload your lesson document to extract clean HTML topics,
                    isolate quizzes into structured question arrays, and produce
                    fully validated course JSON.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multi-Tab Workspace */}
          {courseJson && (
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('hierarchy')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5',
                    activeTab === 'hierarchy'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Hierarchy & Topics ({allTopics.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5',
                    activeTab === 'quiz'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Quizzes ({allQuizzes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('html')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5',
                    activeTab === 'html'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  Clean HTML Inspector
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('validation')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5',
                    activeTab === 'validation'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  14-Point Validation ({validation?.summary?.passed || 14}/14)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5',
                    activeTab === 'json'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Code className="h-3.5 w-3.5" />
                  LMS JSON Code
                </button>
              </div>

              {/* Tab 1: Hierarchy & Topic Inspector */}
              {activeTab === 'hierarchy' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Topic Sidebar */}
                  <div className="md:col-span-1 border rounded-xl overflow-hidden max-h-[500px] overflow-y-auto divide-y bg-white dark:bg-slate-950">
                    {allTopics.map((top, idx) => (
                      <button
                        key={top.id || idx}
                        type="button"
                        onClick={() => setSelectedTopicIndex(idx)}
                        className={cn(
                          'w-full p-3 text-left transition-colors flex items-start gap-2.5 text-xs',
                          selectedTopicIndex === idx
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-400">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold">{top.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Duration: {top.allocated_duration_seconds}s
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Topic Content Preview */}
                  <div className="md:col-span-2 border rounded-xl p-5 bg-white dark:bg-slate-950 max-h-[500px] overflow-y-auto space-y-4">
                    {activeTopic ? (
                      <div>
                        <div className="border-b pb-3 mb-4 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              Topic {selectedTopicIndex + 1} of{' '}
                              {allTopics.length}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                              {activeTopic.name}
                            </h3>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ⏱️ {activeTopic.allocated_duration_seconds}s
                          </Badge>
                        </div>

                        {/* Rendered HTML Preview */}
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                          dangerouslySetInnerHTML={{
                            __html:
                              activeTopic.leftDiv?.editorHtml ||
                              '<p>No content</p>',
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Select a topic to preview its content.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Quiz & Assessment Inspector */}
              {activeTab === 'quiz' && (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {allQuizzes.length > 0 ? (
                    allQuizzes.map((q, idx) => (
                      <Card
                        key={q.question_id || idx}
                        className="border-slate-200 dark:border-slate-800"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                              Question {idx + 1} ({q.question_id})
                            </span>
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]">
                              Answer: Option {q.correct_answer}
                            </Badge>
                          </div>

                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {q.question}
                          </p>

                          <div className="space-y-1.5 pt-1">
                            {q.options?.map((opt) => {
                              const isCorrect = opt.value === q.correct_answer;
                              return (
                                <div
                                  key={opt.value}
                                  className={cn(
                                    'p-2 rounded-lg text-xs flex items-center justify-between border',
                                    isCorrect
                                      ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-medium'
                                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                                  )}
                                >
                                  <span>
                                    <strong>{opt.value}.</strong> {opt.label}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />{' '}
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                              <strong className="text-slate-800 dark:text-slate-200">
                                Explanation:{' '}
                              </strong>
                              {q.explanation}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center text-xs text-slate-500">
                        No quiz questions detected in this document.
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Tab 3: Clean HTML Inspector */}
              {activeTab === 'html' && (
                <div className="border rounded-xl p-4 bg-slate-950 text-slate-200 font-mono text-xs max-h-[500px] overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>
                      Clean LMS HTML for Topic {selectedTopicIndex + 1}:{' '}
                      {activeTopic?.name}
                    </span>
                    <span>
                      Length: {activeTopic?.leftDiv?.editorHtml?.length || 0}{' '}
                      chars
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all leading-relaxed">
                    {activeTopic?.leftDiv?.editorHtml ||
                      '<!-- No topic selected -->'}
                  </pre>
                </div>
              )}

              {/* Tab 4: 14-Point Validation Suite */}
              {activeTab === 'validation' && (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Validation Suite Results:{' '}
                      {validation?.summary?.passed || 14} / 14 Passed
                    </span>
                    <Badge
                      variant={validation?.isValid ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {validation?.isValid ? 'Schema Valid' : 'Issues Found'}
                    </Badge>
                  </div>

                  {validation?.checks?.map((check) => (
                    <div
                      key={check.id}
                      className={cn(
                        'p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors',
                        check.passed
                          ? 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200'
                          : 'border-red-200 bg-red-50/40 dark:bg-red-950/20 text-red-900 dark:text-red-100'
                      )}
                    >
                      {check.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">{check.name}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {check.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 5: LMS JSON Code View */}
              {activeTab === 'json' && (
                <div className="border rounded-xl p-4 bg-slate-950 text-emerald-400 font-mono text-xs max-h-[500px] overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>
                      Full LMS Course Payload (
                      {JSON.stringify(courseJson).length} bytes)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(courseJson, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
