'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sliders,
  FileCode,
  XCircle,
  Folder,
  FolderOpen,
  Files,
  Play,
  RotateCcw,
  Edit3,
  Save,
  FileEdit,
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
  groupFilesByCourseHierarchy,
  convertCourseFolderSequentially,
  wrapInLmsContainer,
  calculateTopicDuration,
} from '@/lib/course-converter';

export default function CourseJsonConverter() {
  // Conversion mode: 'folder' | 'A' | 'B'
  const [mode, setMode] = useState('folder');
  const [includeImages, setIncludeImages] = useState(false);
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [error, setError] = useState(null);

  // Folder & Multi-File state
  const [folderHierarchy, setFolderHierarchy] = useState(null);
  const [progressInfo, setProgressInfo] = useState({
    current: 0,
    total: 0,
    percent: 0,
    currentModule: '',
    currentLesson: '',
    status: '',
  });

  // Result state
  const [courseJson, setCourseJson] = useState(null);
  const [validation, setValidation] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  // Active inspectors & navigation
  const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy' | 'quiz' | 'html' | 'validation' | 'json'
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  // Topic editing state
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editedTopicName, setEditedTopicName] = useState('');
  const [editedTopicHtml, setEditedTopicHtml] = useState('');
  const [topicSaveSuccess, setTopicSaveSuccess] = useState(false);

  // Manual Metadata Overrides
  const [courseTitleOverride, setCourseTitleOverride] = useState('');
  const [moduleTitleOverride, setModuleTitleOverride] = useState('');
  const [lessonTitleOverride, setLessonTitleOverride] = useState('');

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

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

  /**
   * Recursively extracts file items with relative paths from drag-and-drop DataTransfer
   */
  const scanDataTransferItems = async (dataTransfer) => {
    const fileItems = [];
    const items = dataTransfer.items;

    if (items && items.length > 0 && items[0].webkitGetAsEntry) {
      const queue = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) queue.push(entry);
      }

      const traverse = async (entry, pathSoFar = '') => {
        if (entry.isFile) {
          await new Promise((resolve) => {
            entry.file((fileObj) => {
              const relPath = pathSoFar
                ? `${pathSoFar}/${fileObj.name}`
                : fileObj.name;
              fileItems.push({
                file: fileObj,
                relativePath: relPath,
                name: fileObj.name,
              });
              resolve();
            });
          });
        } else if (entry.isDirectory) {
          const dirPath = pathSoFar ? `${pathSoFar}/${entry.name}` : entry.name;
          const dirReader = entry.createReader();

          const readAllEntries = () => {
            return new Promise((resolve) => {
              dirReader.readEntries((entries) => resolve(entries));
            });
          };

          let batch = await readAllEntries();
          while (batch.length > 0) {
            for (const child of batch) {
              await traverse(child, dirPath);
            }
            batch = await readAllEntries();
          }
        }
      };

      for (const topEntry of queue) {
        await traverse(topEntry, '');
      }
    }

    if (
      fileItems.length === 0 &&
      dataTransfer.files &&
      dataTransfer.files.length > 0
    ) {
      for (let i = 0; i < dataTransfer.files.length; i++) {
        const f = dataTransfer.files[i];
        fileItems.push({
          file: f,
          relativePath: f.webkitRelativePath || f.name,
          name: f.name,
        });
      }
    }

    return fileItems;
  };

  /**
   * Handle Folder Selection via webkitdirectory input or folder drag-and-drop
   */
  const handleFolderUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const items = Array.from(fileList).map((f) => ({
      file: f,
      relativePath: f.webkitRelativePath || f.name,
      name: f.name,
    }));

    const hierarchy = groupFilesByCourseHierarchy(items);

    if (hierarchy.totalFiles === 0) {
      setError(
        'No valid Word (.docx) or PDF course documents found in the selected folder.'
      );
      return;
    }

    setFolderHierarchy(hierarchy);
    setMode('folder');
    setFile({
      name: `${hierarchy.courseTitle} (${hierarchy.totalFiles} documents)`,
    });

    // Automatically begin sequential conversion
    await startSequentialFolderConversion(hierarchy);
  };

  /**
   * Start sequential conversion across all modules and lessons
   */
  const startSequentialFolderConversion = async (
    hierarchyToConvert = folderHierarchy
  ) => {
    if (!hierarchyToConvert) return;
    setError(null);
    setIsProcessing(true);
    setProgressInfo({
      current: 0,
      total: hierarchyToConvert.totalFiles,
      percent: 0,
      currentModule: '',
      currentLesson: '',
      status: 'Analyzing course folder structure...',
    });

    try {
      const options = {
        course_title: courseTitleOverride || undefined,
        course_id: 'course_1',
        stripImages: !includeImages,
        includeQuizzes,
      };

      const res = await convertCourseFolderSequentially(
        hierarchyToConvert,
        options,
        (progress) => {
          setProgressInfo(progress);
          setProcessStep(progress.status);
        }
      );

      setCourseJson(res.courseJson);
      setValidation(res.validation);
      setParsedData({
        courseTitle: res.courseJson.course_title,
        modules: res.courseJson.modules,
      });

      if (!courseTitleOverride && res.courseJson.course_title) {
        setCourseTitleOverride(res.courseJson.course_title);
      }

      setSelectedTopicIndex(0);
      setProcessStep('Whole course conversion completed!');
    } catch (err) {
      console.error('Folder conversion error:', err);
      setError(err.message || 'Failed to convert course folder.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle single file upload and conversion (Mode A or Mode B)
   */
  const handleSingleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setError(null);
    setFile(selectedFile);
    setFolderHierarchy(null);
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
      const targetMode = mode === 'folder' ? 'A' : mode;

      const options = {
        fileName: selectedFile.name,
        mode: targetMode,
        pdfjsLib,
        stripImages: !includeImages,
        includeQuizzes,
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

  // Reset conversion state
  const handleReset = () => {
    setFile(null);
    setCourseJson(null);
    setValidation(null);
    setParsedData(null);
    setFolderHierarchy(null);
    setError(null);
    setSelectedTopicIndex(0);
    setCourseTitleOverride('');
    setModuleTitleOverride('');
    setLessonTitleOverride('');
  };

  // All topics flat list for easy preview navigation
  const allTopics = useMemo(() => {
    if (!courseJson || !Array.isArray(courseJson.modules)) return [];
    const list = [];
    courseJson.modules.forEach((m, mIdx) => {
      (m.lessons || []).forEach((l, lIdx) => {
        (l.topics || []).forEach((t) => {
          list.push({
            ...t,
            moduleId: m.module_id,
            moduleTitle: m.module_title,
            moduleIndex: mIdx + 1,
            lessonId: l.lesson_id,
            lessonTitle: l.lesson_title,
            lessonIndex: lIdx + 1,
          });
        });
      });
    });
    return list;
  }, [courseJson]);

  // Filtered topics based on module dropdown
  const filteredTopics = useMemo(() => {
    if (selectedModuleFilter === 'all') return allTopics;
    return allTopics.filter((t) => t.moduleId === selectedModuleFilter);
  }, [allTopics, selectedModuleFilter]);

  // All quizzes flat list
  const allQuizzes = useMemo(() => {
    if (!courseJson || !Array.isArray(courseJson.modules)) return [];
    const list = [];
    courseJson.modules.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        (l.knowledge_check || []).forEach((q, qIndex) => {
          list.push({
            ...q,
            moduleId: m.module_id,
            moduleTitle: m.module_title,
            lessonId: l.lesson_id,
            lessonTitle: l.lesson_title,
            index: qIndex + 1,
          });
        });
      });
    });
    return list;
  }, [courseJson]);

  const activeTopic =
    filteredTopics[selectedTopicIndex] ||
    filteredTopics[0] ||
    allTopics[0] ||
    null;

  // Dynamically compute HTML based on image toggle switch
  const displayedTopicHtml = useMemo(() => {
    if (!activeTopic) return '<p>No content</p>';
    const baseHtml = activeTopic.leftDiv?.editorHtml || '<p>No content</p>';
    if (!includeImages) {
      return wrapInLmsContainer(baseHtml, { stripImages: true });
    }
    return baseHtml;
  }, [activeTopic, includeImages]);

  // Keep topic editor fields synchronized when activeTopic changes
  useEffect(() => {
    if (activeTopic) {
      setEditedTopicName(activeTopic.name || '');
      setEditedTopicHtml(activeTopic.leftDiv?.editorHtml || '');
      setIsEditingTopic(false);
      setTopicSaveSuccess(false);
    }
  }, [activeTopic?.id]);

  // Save changes to active topic and update entire courseJson payload
  const handleSaveTopicChanges = () => {
    if (!courseJson || !activeTopic) return;

    const sanitizedHtml = wrapInLmsContainer(editedTopicHtml, {
      stripImages: !includeImages,
    });
    const newDuration = calculateTopicDuration(sanitizedHtml);
    const newName = (editedTopicName || '').trim() || activeTopic.name;

    const updated = JSON.parse(JSON.stringify(courseJson));
    let topicFound = false;

    (updated.modules || []).forEach((mod) => {
      (mod.lessons || []).forEach((les) => {
        (les.topics || []).forEach((top) => {
          if (top.id === activeTopic.id) {
            top.name = newName;
            top.headingContent = newName;
            top.allocated_duration_seconds = newDuration;
            top.topicDuration = newDuration;

            if (!top.leftDiv) top.leftDiv = {};
            top.leftDiv.editor = sanitizedHtml;
            top.leftDiv.editorHtml = sanitizedHtml;
            top.leftDiv.editorSaved = sanitizedHtml;
            top.leftDiv.editorHtmlSaved = sanitizedHtml;
            delete top.raw_body_content;

            topicFound = true;
          }
        });
      });
    });

    if (topicFound) {
      let totalSlidesSeconds = 0;
      let totalKcSeconds = 0;
      const lessonsDurationArray = [];

      (updated.modules || []).forEach((mod) => {
        (mod.lessons || []).forEach((les) => {
          let lesSlideSec = 0;
          (les.topics || []).forEach((top) => {
            lesSlideSec += Number(top.allocated_duration_seconds) || 30;
          });
          const kcSec = (les.knowledge_check || []).length * 60;
          totalSlidesSeconds += lesSlideSec;
          totalKcSeconds += kcSec;

          lessonsDurationArray.push({
            lesson_id: les.lesson_id,
            slides_seconds: lesSlideSec,
            knowledge_check_seconds: kcSec,
            total_seconds: lesSlideSec + kcSec,
          });
        });
      });

      const finalExamSeconds =
        (updated.final_exam?.questions?.length || 0) * 60;
      const grandTotal = totalSlidesSeconds + totalKcSeconds + finalExamSeconds;

      updated.total_duration_seconds = grandTotal;
      updated.planned_duration_seconds = grandTotal;
      if (updated.duration) {
        updated.duration.total_seconds = grandTotal;
        updated.duration.slides_seconds = totalSlidesSeconds;
        updated.duration.knowledge_check_seconds = totalKcSeconds;
        updated.duration.final_exam_seconds = finalExamSeconds;
        updated.duration.lessons = lessonsDurationArray;
      }

      setCourseJson(updated);
      const val = validateCourseJson(updated);
      setValidation(val);
      setTopicSaveSuccess(true);
      setTimeout(() => setTopicSaveSuccess(false), 3000);
      setIsEditingTopic(false);
    }
  };

  /**
   * Dynamically toggle Quizzes on/off across loaded courseJson or pending uploads
   */
  const handleToggleQuizzes = (newIncludeQuizzes) => {
    setIncludeQuizzes(newIncludeQuizzes);
    if (!courseJson) return;

    const updated = JSON.parse(JSON.stringify(courseJson));
    if (!newIncludeQuizzes) {
      // Cache original quizzes and strip them
      (updated.modules || []).forEach((m) => {
        (m.lessons || []).forEach((l) => {
          if (
            !l._cached_quizzes &&
            Array.isArray(l.knowledge_check) &&
            l.knowledge_check.length > 0
          ) {
            l._cached_quizzes = l.knowledge_check;
          }
          l.knowledge_check = [];
          l.has_assessment_after = false;
        });
      });
      if (updated.final_exam) {
        if (!updated._cached_final_exam) {
          updated._cached_final_exam = updated.final_exam;
        }
        updated.final_exam = null;
      }
    } else {
      // Restore quizzes from cache
      (updated.modules || []).forEach((m) => {
        (m.lessons || []).forEach((l) => {
          if (l._cached_quizzes && l._cached_quizzes.length > 0) {
            l.knowledge_check = l._cached_quizzes;
            l.has_assessment_after = true;
          }
        });
      });
      if (updated._cached_final_exam) {
        updated.final_exam = updated._cached_final_exam;
      }
    }

    // Recalculate duration and validation
    let totalSlidesSeconds = 0;
    let totalKcSeconds = 0;
    const lessonsDurationArray = [];
    (updated.modules || []).forEach((mod) => {
      (mod.lessons || []).forEach((les) => {
        let lesSlideSec = 0;
        (les.topics || []).forEach((top) => {
          lesSlideSec += Number(top.allocated_duration_seconds) || 30;
        });
        const kcSec = (les.knowledge_check || []).length * 60;
        totalSlidesSeconds += lesSlideSec;
        totalKcSeconds += kcSec;
        lessonsDurationArray.push({
          lesson_id: les.lesson_id,
          slides_seconds: lesSlideSec,
          knowledge_check_seconds: kcSec,
          total_seconds: lesSlideSec + kcSec,
        });
      });
    });

    const finalExamSeconds = (updated.final_exam?.questions?.length || 0) * 60;
    const grandTotal = totalSlidesSeconds + totalKcSeconds + finalExamSeconds;
    updated.total_duration_seconds = grandTotal;
    updated.planned_duration_seconds = grandTotal;
    if (updated.duration) {
      updated.duration.total_seconds = grandTotal;
      updated.duration.slides_seconds = totalSlidesSeconds;
      updated.duration.knowledge_check_seconds = totalKcSeconds;
      updated.duration.final_exam_seconds = finalExamSeconds;
      updated.duration.lessons = lessonsDurationArray;
    }

    setCourseJson(updated);
    const val = validateCourseJson(updated);
    setValidation(val);
  };

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
              Multi-Module & Folder Ready
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Convert an entire course folder with multiple modules & lessons (or
            single files) into the exact LMS schema. Automatic sequencing, clean
            HTML sanitization, assessment isolation, and 14-point validation.
          </p>
        </div>

        {courseJson && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Convert Another
            </Button>
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
              Download Complete JSON
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
              {/* Conversion Source: Single Column Stacked Rows */}
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Conversion Source
                </label>
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setMode('folder')}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between',
                      mode === 'folder'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        <Folder className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Course Folder
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Automated sequential modules &amp; lessons
                        </div>
                      </div>
                    </div>
                    {mode === 'folder' && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('A')}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between',
                      mode === 'A'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Single Lesson Document
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Mode A: 1 Document with topics &amp; quiz
                        </div>
                      </div>
                    </div>
                    {mode === 'A' && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('B')}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between',
                      mode === 'B'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Full Course Document
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Mode B: Full syllabus with modules &amp; exam
                        </div>
                      </div>
                    </div>
                    {mode === 'B' && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Image & Asset Content Toggle: Single Column Stacked */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Images &amp; Media Content
                  </label>
                  <Badge variant="outline" className="text-[10px]">
                    {includeImages ? 'Images ON' : 'Images OFF (Clean)'}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIncludeImages(false)}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between',
                      !includeImages
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🚫</span>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Skip Images (OFF)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Extract codes, clean pure body HTML
                        </div>
                      </div>
                    </div>
                    {!includeImages && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeImages(true)}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between',
                      includeImages
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🖼️</span>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Include Images (ON)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Preserve &lt;img&gt; &amp; image callouts
                        </div>
                      </div>
                    </div>
                    {includeImages && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quizzes & Assessments Toggle: Single Column Stacked */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Quizzes &amp; Assessments
                  </label>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      includeQuizzes
                        ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-300 text-slate-500'
                    )}
                  >
                    {includeQuizzes ? 'Quizzes ON' : 'Quizzes OFF (Excluded)'}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleQuizzes(true)}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between',
                      includeQuizzes
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📝</span>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Include Quizzes (ON)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Parse question stems, options, and answer keys
                        </div>
                      </div>
                    </div>
                    {includeQuizzes && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleQuizzes(false)}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between',
                      !includeQuizzes
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-medium ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🚫</span>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Exclude Quizzes (OFF)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Pure instructional topics only, 0 quizzes in JSON
                        </div>
                      </div>
                    </div>
                    {!includeQuizzes && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>
                    {mode === 'folder'
                      ? 'Upload Course Directory'
                      : 'Source Document'}
                  </span>
                  {mode === 'folder' && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                      Drag folder or click below
                    </span>
                  )}
                </label>

                {/* Drop Area */}
                <div
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
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);

                    const scanned = await scanDataTransferItems(e.dataTransfer);
                    if (
                      scanned.length > 1 ||
                      (scanned.length === 1 &&
                        scanned[0].relativePath.includes('/'))
                    ) {
                      // Multi-file or folder detected
                      await handleFolderUpload(scanned);
                    } else if (scanned.length === 1) {
                      // Single file dropped
                      if (mode === 'folder') {
                        setMode('A');
                      }
                      await handleSingleFileUpload(scanned[0].file);
                    }
                  }}
                  className={cn(
                    'mt-2 border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2 select-none',
                    isDragging
                      ? 'border-blue-500 bg-blue-100/40 dark:bg-blue-950/40 ring-4 ring-blue-500/20 scale-[1.01]'
                      : file
                        ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                  )}
                >
                  {/* Hidden inputs */}
                  <input
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFolderUpload(e.target.files)}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      if (files.length > 1) {
                        handleFolderUpload(files);
                      } else {
                        handleSingleFileUpload(files[0]);
                      }
                    }}
                  />

                  <div
                    className={cn(
                      'p-3 rounded-full transition-colors',
                      isDragging
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {mode === 'folder' ? (
                      <FolderOpen className="h-6 w-6" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>

                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isDragging
                        ? 'Drop folder or files here'
                        : file
                          ? file.name
                          : mode === 'folder'
                            ? 'Drop Course Folder Here'
                            : 'Upload Word or PDF'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isDragging
                        ? 'Release to begin sequential processing'
                        : mode === 'folder'
                          ? 'Contains Module folders with Lesson .docx files'
                          : 'Single .docx or .pdf lesson document'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => folderInputRef.current?.click()}
                      className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    >
                      <Folder className="h-3.5 w-3.5" />
                      Upload Course Folder
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Files className="h-3.5 w-3.5" />
                      Select File(s)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progress State */}
              {isProcessing && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-100">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                      {progressInfo.status || processStep}
                    </span>
                    {progressInfo.total > 0 && (
                      <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300">
                        {progressInfo.percent}% ({progressInfo.current}/
                        {progressInfo.total})
                      </span>
                    )}
                  </div>
                  {progressInfo.total > 0 && (
                    <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressInfo.percent}%` }}
                      />
                    </div>
                  )}
                  {progressInfo.currentLesson && (
                    <div className="text-[11px] text-blue-800/80 dark:text-blue-200/80 truncate">
                      <strong>Current:</strong> {progressInfo.currentLesson}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Detected Course Folder Structure (Pre-Flight Hierarchy Card) */}
              {folderHierarchy && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5 text-blue-600" />
                      Detected Course Hierarchy
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {folderHierarchy.modules.length} Modules •{' '}
                      {folderHierarchy.totalFiles} Lessons
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {folderHierarchy.modules.map((mod) => (
                      <div
                        key={mod.moduleId || mod.moduleFolder}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs space-y-1.5"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span className="truncate">{mod.moduleTitle}</span>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                            {mod.lessons.length} lessons
                          </span>
                        </div>
                        <div className="space-y-1 pl-2 border-l-2 border-blue-400/50">
                          {mod.lessons.map((les) => (
                            <div
                              key={les.fileName}
                              className="text-[11px] text-slate-600 dark:text-slate-400 truncate flex items-center gap-1.5"
                            >
                              <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {les.lessonTitle}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!courseJson && !isProcessing && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => startSequentialFolderConversion()}
                      className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Convert Whole Course Sequentially
                    </Button>
                  )}
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
                      {includeQuizzes
                        ? `${allQuizzes.length} Questions`
                        : '0 (Quizzes OFF)'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {includeQuizzes ? 'Lesson Quizzes' : 'Excluded from JSON'}
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
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    Upload Course Directory or Lessons
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload your course folder with Module 1, Module 2, Module 3
                    subfolders to automatically sequence every lesson, sanitize
                    HTML into clean parent divs, isolate quizzes, and output
                    valid LMS JSON.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multi-Tab Workspace */}
          {courseJson && (
            <div className="space-y-4">
              {/* Tab Navigation & Module Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
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
                    Topics ({allTopics.length})
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
                    Clean HTML
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
                    JSON Code
                  </button>
                </div>

                {/* Module Selector Filter */}
                {courseJson.modules?.length > 1 && (
                  <select
                    value={selectedModuleFilter}
                    onChange={(e) => {
                      setSelectedModuleFilter(e.target.value);
                      setSelectedTopicIndex(0);
                    }}
                    className="h-7 text-xs border rounded-md px-2 bg-background text-foreground"
                  >
                    <option value="all">
                      All Modules ({courseJson.modules.length})
                    </option>
                    {courseJson.modules.map((m) => (
                      <option key={m.module_id} value={m.module_id}>
                        {m.module_title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tab 1: Hierarchy & Topic Inspector - Single Column Full-Width View */}
              {activeTab === 'hierarchy' && (
                <div className="space-y-4">
                  {/* Topic Navigation & Stepper Toolbar */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    {/* Topic Selector Dropdown */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-500 shrink-0">
                        Topic:
                      </span>
                      <select
                        value={selectedTopicIndex}
                        onChange={(e) =>
                          setSelectedTopicIndex(Number(e.target.value))
                        }
                        className="h-8 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 bg-white dark:bg-slate-950 text-foreground w-full max-w-md truncate shadow-2xs"
                      >
                        {filteredTopics.map((top, idx) => (
                          <option key={top.id || idx} value={idx}>
                            Topic {idx + 1} of {filteredTopics.length}:{' '}
                            {top.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step Navigation & Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={selectedTopicIndex <= 0}
                        onClick={() =>
                          setSelectedTopicIndex((prev) => Math.max(0, prev - 1))
                        }
                        className="h-7 text-xs px-2.5 gap-1"
                        title="Previous Topic"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Prev
                      </Button>
                      <span className="text-xs text-slate-500 font-mono px-1">
                        {selectedTopicIndex + 1} / {filteredTopics.length}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          selectedTopicIndex >= filteredTopics.length - 1
                        }
                        onClick={() =>
                          setSelectedTopicIndex((prev) =>
                            Math.min(filteredTopics.length - 1, prev + 1)
                          )
                        }
                        className="h-7 text-xs px-2.5 gap-1"
                        title="Next Topic"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </Button>

                      <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

                      {/* Toggle Topic Editor */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const next = !isEditingTopic;
                          setIsEditingTopic(next);
                          if (next && activeTopic) {
                            setEditedTopicName(activeTopic.name || '');
                            setEditedTopicHtml(
                              activeTopic.leftDiv?.editorHtml || ''
                            );
                          }
                        }}
                        className={cn(
                          'h-7 text-xs font-semibold gap-1.5',
                          isEditingTopic
                            ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-sm'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {isEditingTopic ? 'View Preview' : 'Edit Topic'}
                      </Button>
                    </div>
                  </div>

                  {/* Topic Content Card (Full Width 1 Column) */}
                  <div className="w-full border rounded-xl p-5 bg-white dark:bg-slate-950 min-h-[450px] space-y-4 shadow-2xs">
                    {activeTopic ? (
                      <div>
                        <div className="border-b pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                              {activeTopic.moduleTitle} →{' '}
                              {activeTopic.lessonTitle}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                              {activeTopic.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Toggle Topic Editor */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const next = !isEditingTopic;
                                setIsEditingTopic(next);
                                if (next && activeTopic) {
                                  setEditedTopicName(activeTopic.name || '');
                                  setEditedTopicHtml(
                                    activeTopic.leftDiv?.editorHtml || ''
                                  );
                                }
                              }}
                              className={cn(
                                'h-7 text-xs font-semibold gap-1.5',
                                isEditingTopic
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-sm'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              )}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              {isEditingTopic ? 'View Preview' : 'Edit Topic'}
                            </Button>

                            {/* Live Inspection Image Toggle */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-[11px]">
                              <button
                                type="button"
                                onClick={() => setIncludeImages(false)}
                                className={cn(
                                  'px-2 py-0.5 rounded-md transition-all font-medium',
                                  !includeImages
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                )}
                                title="Hide images and image codes, showing pure clean instructional text"
                              >
                                🚫 Images OFF
                              </button>
                              <button
                                type="button"
                                onClick={() => setIncludeImages(true)}
                                className={cn(
                                  'px-2 py-0.5 rounded-md transition-all font-medium',
                                  includeImages
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                )}
                                title="Show images and media callouts"
                              >
                                🖼️ Images ON
                              </button>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              ⏱️ {activeTopic.allocated_duration_seconds}s
                            </Badge>
                          </div>
                        </div>

                        {/* Topic Save Success Notification */}
                        {topicSaveSuccess && (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-100 font-medium mb-3 animate-in fade-in">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            Topic saved successfully! Course JSON and duration
                            calculations have been updated.
                          </div>
                        )}

                        {isEditingTopic ? (
                          <div className="space-y-4 pt-1 animate-in fade-in">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                <span>Topic Heading / Title</span>
                                <span className="text-[10px] font-normal text-slate-500">
                                  Updates name &amp; headingContent in Course
                                  JSON
                                </span>
                              </label>
                              <Input
                                value={editedTopicName}
                                onChange={(e) =>
                                  setEditedTopicName(e.target.value)
                                }
                                className="text-xs h-9 font-medium bg-slate-50 dark:bg-slate-900"
                                placeholder="Topic title..."
                              />
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  Instructional Topic HTML (editorHtml)
                                </label>
                                <span className="text-[10px] text-slate-500">
                                  Wrapped in 1 parent &lt;div&gt; with zero
                                  classes
                                </span>
                              </div>
                              <textarea
                                value={editedTopicHtml}
                                onChange={(e) =>
                                  setEditedTopicHtml(e.target.value)
                                }
                                rows={14}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="<div><p>Instructional reading content...</p></div>"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveTopicChanges}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold px-4 shadow-sm"
                              >
                                <Save className="h-3.5 w-3.5" />
                                Save Changes &amp; Update JSON
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingTopic(false)}
                                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {/* Image Asset Code Banner (Shown strictly when Images are ON) */}
                            {includeImages && activeTopic.image_code && (
                              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-xs mb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                                    🖼️ Image Asset Code:
                                  </span>
                                  <code className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded text-amber-900 dark:text-amber-100 font-mono font-bold text-xs">
                                    {activeTopic.image_code}
                                  </code>
                                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                                    (Visible in HTML)
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      activeTopic.image_code.replace(/^#/, '')
                                    );
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                  }}
                                  className="h-6 text-[10px] border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 shrink-0 ml-2"
                                >
                                  Copy Code
                                </Button>
                              </div>
                            )}

                            {/* AI Image Generation Prompt Banner (Shown strictly when Images are ON) */}
                            {includeImages && activeTopic.image_prompt && (
                              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg space-y-1 text-xs mb-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1">
                                    ✨ AI Visual Generation Prompt
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        activeTopic.image_prompt
                                      );
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="h-6 text-[10px] border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-100"
                                  >
                                    Copy Prompt
                                  </Button>
                                </div>
                                <p className="text-[11px] text-purple-800 dark:text-purple-300 italic">
                                  &ldquo;{activeTopic.image_prompt}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* Rendered HTML Preview */}
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                              dangerouslySetInnerHTML={{
                                __html: displayedTopicHtml,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Select a topic to preview its content.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Quiz & Assessment Inspector - Single Column Spacious View */}
              {activeTab === 'quiz' && (
                <div className="space-y-4 max-h-[550px] overflow-y-auto">
                  {/* Top Quiz Header / Toggle Toolbar */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <HelpCircle className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Quizzes &amp; Knowledge Checks</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              includeQuizzes && allQuizzes.length > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 border-slate-300'
                            )}
                          >
                            {includeQuizzes
                              ? `${allQuizzes.length} Questions`
                              : 'Excluded from JSON'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {includeQuizzes
                            ? 'Every question is verified with stem, options, and answer keys.'
                            : 'Quizzes are toggled OFF and excluded from the exported course JSON.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant={includeQuizzes ? 'outline' : 'default'}
                        onClick={() => handleToggleQuizzes(!includeQuizzes)}
                        className={cn(
                          'h-7 text-xs font-semibold gap-1.5',
                          !includeQuizzes
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {includeQuizzes
                          ? '🚫 Exclude Quizzes'
                          : '📝 Enable Quizzes'}
                      </Button>
                    </div>
                  </div>

                  {includeQuizzes && allQuizzes.length > 0 ? (
                    allQuizzes.map((q, idx) => (
                      <Card
                        key={q.question_id || idx}
                        className="border-slate-200 dark:border-slate-800"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                                Question {idx + 1} ({q.question_id})
                              </span>
                              <span className="text-[11px] text-slate-500 ml-2">
                                {q.moduleTitle} → {q.lessonTitle}
                              </span>
                            </div>
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]">
                              Answer: Option {q.correct_answer}
                            </Badge>
                          </div>

                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {q.question}
                          </p>

                          {/* Options: 1 Row 1 Column Each */}
                          <div className="space-y-2 pt-1">
                            {q.options?.map((opt) => {
                              const isCorrect = opt.value === q.correct_answer;
                              return (
                                <div
                                  key={opt.value}
                                  className={cn(
                                    'w-full p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all',
                                    isCorrect
                                      ? 'border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-medium ring-1 ring-emerald-500/20'
                                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                                  )}
                                >
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <span
                                      className={cn(
                                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                                        isCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      )}
                                    >
                                      {opt.value}
                                    </span>
                                    <span className="text-xs leading-normal">
                                      {opt.label}
                                    </span>
                                  </div>
                                  {isCorrect && (
                                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 ml-2">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
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
                    <Card className="border-slate-200 dark:border-slate-800">
                      <CardContent className="p-10 text-center space-y-3">
                        <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <HelpCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {!includeQuizzes
                              ? 'Quizzes Are Excluded'
                              : 'No Quiz Questions Detected'}
                          </h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                            {!includeQuizzes
                              ? 'Quizzes are currently turned OFF. Your exported LMS JSON contains zero quiz questions and zero quiz duration.'
                              : 'No assessment questions were found in the uploaded document or folder.'}
                          </p>
                        </div>
                        {!includeQuizzes && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleToggleQuizzes(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            Enable Quizzes in JSON
                          </Button>
                        )}
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
                    <div className="flex items-center gap-3">
                      <span>
                        Length: {activeTopic?.leftDiv?.editorHtml?.length || 0}{' '}
                        chars
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveTab('hierarchy');
                          setIsEditingTopic(true);
                          if (activeTopic) {
                            setEditedTopicName(activeTopic.name || '');
                            setEditedTopicHtml(
                              activeTopic.leftDiv?.editorHtml || ''
                            );
                          }
                        }}
                        className="h-6 text-[10px] bg-slate-900 border-slate-700 text-blue-400 hover:text-white"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit HTML
                      </Button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap break-all leading-relaxed">
                    {displayedTopicHtml}
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
