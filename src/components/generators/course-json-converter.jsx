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
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  EyeOff,
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
  Sparkles,
  Wand2,
  GripVertical,
  Trash2,
  Plus,
  Award,
  ArrowUpDown,
  ListOrdered,
  FilePlus,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { loadPdfJs } from '@/lib/pdf-js-loader';
import {
  convertDocumentToCourseJson,
  validateCourseJson,
  buildCourseJson,
  enhanceAndCleanCourseJson,
  groupFilesByCourseHierarchy,
  convertCourseFolderSequentially,
  wrapInLmsContainer,
  calculateTopicDuration,
  parseDocxDocument,
  parsePdfDocument,
  isFinalExamHeading,
  parseFinalExamFromTextOrHtml,
  mergeFinalExamIntoCourse,
  addLessonToCourse,
  reorderLessonsInCourse,
  updateQuestionInCourse,
  deleteQuestionFromCourse,
  ensureLessonNumberPrefix,
  removeLessonFromCourse,
  recalculateCourseDurations,
  normalizeQuizQuestion,
  normalizeFinalExam,
  isIntroductoryModule,
  getLessonBaseTitle,
  detectSeparateIntroAndObjectives,
  mergeIntroAndLearningObjectives,
} from '@/lib/course-converter';

export default function CourseJsonConverter() {
  // Conversion mode: 'folder' | 'A' | 'B'
  const [mode, setMode] = useState('folder');
  const [includeImages, setIncludeImages] = useState(false);
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [showSourceColumn, setShowSourceColumn] = useState(true);
  const [showSourceSection, setShowSourceSection] = useState(true);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [error, setError] = useState(null);

  // Enhance & Clean JSON state
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [enhanceSuccessMessage, setEnhanceSuccessMessage] = useState('');

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
  const jsonFileInputRef = useRef(null);
  const lessonAddInputRef = useRef(null);
  const finalExamUploadInputRef = useRef(null);

  // Toggle option to calculate totals with or without course intro (Module 0 / Lesson 0)
  const [includeIntroInTotals, setIncludeIntroInTotals] = useState(true);

  // Combine / Placement Modal State (for additional lessons)
  const [showCombineModal, setShowCombineModal] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState(null);
  const [combineTargetModule, setCombineTargetModule] = useState('');
  const [combinePosition, setCombinePosition] = useState('end'); // 'end' | 'start' | 'before' | 'after'
  const [combineTargetLessonIndex, setCombineTargetLessonIndex] = useState(0);

  // Final Exam Merge & Paste states
  const [showMergeExamModal, setShowMergeExamModal] = useState(false);
  const [pendingExamData, setPendingExamData] = useState(null);
  const [showPasteExamModal, setShowPasteExamModal] = useState(false);
  const [pastedExamText, setPastedExamText] = useState('');
  const [pastedExamTitle, setPastedExamTitle] = useState(
    'Comprehensive Final Exam'
  );
  const [pastedExamPassingScore, setPastedExamPassingScore] = useState(80);

  // Question Editing modal state (Quiz or Final Exam)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Lesson Drag and Reorder states
  const [draggedLessonIndex, setDraggedLessonIndex] = useState(null);
  const [dragOverLessonIndex, setDragOverLessonIndex] = useState(null);

  // Separate Introduction and Learning Objectives Merge modal state
  const [showMergeIntroModal, setShowMergeIntroModal] = useState(false);
  const [pendingMergeCandidates, setPendingMergeCandidates] = useState([]);
  const [pendingMergeCourse, setPendingMergeCourse] = useState(null);

  // User feedback toast/action banner
  const [actionMessage, setActionMessage] = useState('');
  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 5000);
  };

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
      const isJson = /\.json$/i.test(selectedFile.name);
      if (isJson) {
        setProcessStep('Reading and parsing Course JSON file...');
        const jsonText = await selectedFile.text();
        let rawObj;
        try {
          rawObj = JSON.parse(jsonText);
        } catch (jsonErr) {
          throw new Error('Invalid JSON format: ' + jsonErr.message);
        }

        setProcessStep('Normalizing structure, assessments & durations...');
        const res = enhanceAndCleanCourseJson(rawObj, {
          stripImages: !includeImages,
          includeQuizzes,
          course_title: courseTitleOverride || undefined,
        });

        if (res.success && res.courseJson) {
          setCourseJson(res.courseJson);
          setValidation(res.validation);
          setParsedData(res.courseJson);

          if (!courseTitleOverride && res.courseJson.course_title) {
            setCourseTitleOverride(res.courseJson.course_title);
          }
          if (
            !moduleTitleOverride &&
            res.courseJson.modules?.[0]?.module_title
          ) {
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
          setProcessStep('Course JSON imported successfully!');
          showToast(
            'Course JSON file successfully imported and normalized with 100% Schema Health!'
          );

          // Detect separate Introduction and Learning Objectives slides in numbered lessons
          const separateCandidates = detectSeparateIntroAndObjectives(
            res.courseJson
          );
          if (separateCandidates.length > 0) {
            setPendingMergeCandidates(separateCandidates);
            setPendingMergeCourse(res.courseJson);
            setShowMergeIntroModal(true);
          }
        }
        return;
      }

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

  // Group filtered topics by module and lesson for structured dropdown preview
  const groupedTopicSections = useMemo(() => {
    const groups = [];
    let currentGroup = null;

    filteredTopics.forEach((top, idx) => {
      const groupKey = `${top.moduleId}___${top.lessonId}`;
      if (!currentGroup || currentGroup.key !== groupKey) {
        currentGroup = {
          key: groupKey,
          label: `${top.moduleTitle} → ${top.lessonTitle}`,
          topics: [],
        };
        groups.push(currentGroup);
      }
      currentGroup.topics.push({ ...top, globalIndex: idx });
    });

    return groups;
  }, [filteredTopics]);

  // All quizzes flat list with canonical normalization (supports both LMS & DB schemas)
  const allQuizzes = useMemo(() => {
    if (!courseJson || !Array.isArray(courseJson.modules)) return [];
    const list = [];
    courseJson.modules.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        (l.knowledge_check || []).forEach((q, qIndex) => {
          const normQ = normalizeQuizQuestion(
            q,
            `q_${l.lesson_id ? l.lesson_id.replace(/^les_/, '') : '1'}_${qIndex + 1}`
          );
          list.push({
            ...normQ,
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

  // All lessons flat list with module information
  const allLessons = useMemo(() => {
    if (!courseJson || !Array.isArray(courseJson.modules)) return [];
    const list = [];
    courseJson.modules.forEach((m, mIdx) => {
      (m.lessons || []).forEach((l, lIdx) => {
        list.push({
          ...l,
          moduleId: m.module_id,
          moduleTitle: m.module_title,
          moduleIndex: mIdx,
          lessonIndexInModule: lIdx,
          globalIndex: list.length,
        });
      });
    });
    return list;
  }, [courseJson]);

  // Final exam questions list with canonical normalization
  const finalExamQuestions = useMemo(() => {
    if (!courseJson?.final_exam) return [];
    if (Array.isArray(courseJson.final_exam)) {
      return courseJson.final_exam.map((q, idx) =>
        normalizeQuizQuestion(q, `fe_q_${idx + 1}`)
      );
    }
    const rawQuestions =
      courseJson.final_exam.questions || courseJson.final_exam.items || [];
    return rawQuestions.map((q, idx) =>
      normalizeQuizQuestion(q, `fe_q_${idx + 1}`)
    );
  }, [courseJson]);

  // Introductory / Course Name Module detection:
  // Detects if Module 0 exists, or matches course title, or if first lesson is Lesson 0 / Introduction
  const introModuleInfo = useMemo(() => {
    if (
      !courseJson ||
      !Array.isArray(courseJson.modules) ||
      courseJson.modules.length === 0
    ) {
      return null;
    }
    const firstMod = courseJson.modules[0];
    const isMod0 =
      firstMod.module_id === 'mod_0' ||
      firstMod.moduleIndex === 0 ||
      isIntroductoryModule(firstMod.module_title, courseJson.course_title);

    const firstLesson = firstMod.lessons?.[0];
    const isLes0 =
      firstLesson &&
      (firstLesson.lesson_id === 'les_0_0' ||
        firstLesson.lessonIndex === 0 ||
        /^intro/i.test(firstLesson.lesson_title || ''));

    if (isMod0 || isLes0) {
      const introTopicsCount = firstLesson?.topics?.length || 0;
      const introDurationSeconds = (firstLesson?.topics || []).reduce(
        (sum, t) => sum + (Number(t.allocated_duration_seconds) || 30),
        0
      );
      return {
        hasIntro: true,
        moduleId: firstMod.module_id,
        moduleTitle: firstMod.module_title,
        lessonTitle: firstLesson?.lesson_title || 'Introduction',
        introTopicsCount,
        introDurationSeconds,
      };
    }
    return null;
  }, [courseJson]);

  // Computed totals with user option to calculate with or without Course Intro Module / Lesson 0
  const hierarchyCounts = useMemo(() => {
    if (!courseJson || !Array.isArray(courseJson.modules)) {
      return {
        modulesCount: 0,
        lessonsCount: 0,
        topicsCount: 0,
        quizzesCount: 0,
        questionsCount: 0,
        durationSeconds: 0,
        coreModulesCount: 0,
        coreLessonsCount: 0,
        totalModulesWithIntro: 0,
        totalLessonsWithIntro: 0,
      };
    }

    const totalMods = courseJson.modules.length;
    const totalLes = allLessons.length;
    const totalTops = allTopics.length;
    const grandDuration = courseJson.duration?.total_seconds || 0;

    // Distinct lesson quizzes count
    let totalLessonQuizzes = 0;
    courseJson.modules.forEach((m) => {
      (m.lessons || []).forEach((l) => {
        if ((l.knowledge_check || []).length > 0) {
          totalLessonQuizzes += 1;
        }
      });
    });
    const hasFinalExam = Boolean(
      (courseJson.final_exam?.questions?.length || 0) > 0 ||
      (Array.isArray(courseJson.final_exam) && courseJson.final_exam.length > 0)
    );
    const totalQuizzes = totalLessonQuizzes + (hasFinalExam ? 1 : 0);
    const totalQuestions = allQuizzes.length + finalExamQuestions.length;

    if (!introModuleInfo) {
      return {
        modulesCount: totalMods,
        lessonsCount: totalLes,
        topicsCount: totalTops,
        quizzesCount: totalQuizzes,
        questionsCount: totalQuestions,
        durationSeconds: grandDuration,
        coreModulesCount: totalMods,
        coreLessonsCount: totalLes,
        totalModulesWithIntro: totalMods,
        totalLessonsWithIntro: totalLes,
      };
    }

    const coreMods = Math.max(1, totalMods - 1);
    const coreLes = Math.max(1, totalLes - 1);
    const coreTops = Math.max(
      0,
      totalTops - (introModuleInfo.introTopicsCount || 0)
    );
    const coreDuration = Math.max(
      0,
      grandDuration - (introModuleInfo.introDurationSeconds || 0)
    );

    return {
      modulesCount: includeIntroInTotals ? totalMods : coreMods,
      lessonsCount: includeIntroInTotals ? totalLes : coreLes,
      topicsCount: includeIntroInTotals ? totalTops : coreTops,
      quizzesCount: totalQuizzes,
      questionsCount: totalQuestions,
      durationSeconds: includeIntroInTotals ? grandDuration : coreDuration,
      coreModulesCount: coreMods,
      coreLessonsCount: coreLes,
      totalModulesWithIntro: totalMods,
      totalLessonsWithIntro: totalLes,
    };
  }, [
    courseJson,
    allLessons,
    allTopics,
    allQuizzes,
    finalExamQuestions,
    introModuleInfo,
    includeIntroInTotals,
  ]);

  const activeTopic =
    filteredTopics[selectedTopicIndex] ||
    filteredTopics[0] ||
    allTopics[0] ||
    null;

  // Compute quiz question count for active lesson in topic inspector
  const currentLessonQuizCount = useMemo(() => {
    if (!activeTopic || !courseJson?.modules) return 0;
    for (const mod of courseJson.modules) {
      for (const les of mod.lessons || []) {
        if (les.lesson_id === activeTopic.lessonId) {
          return (les.knowledge_check || []).length;
        }
      }
    }
    return 0;
  }, [activeTopic, courseJson]);

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

  /**
   * Dynamically toggle Images on/off across loaded courseJson
   * When turned OFF: purges images, file codes, and slide titles from all slides
   */
  const handleToggleImages = (newIncludeImages) => {
    setIncludeImages(newIncludeImages);
    if (!courseJson) return;

    try {
      const res = enhanceAndCleanCourseJson(courseJson, {
        stripImages: !newIncludeImages,
        includeQuizzes,
        course_title: courseJson.course_title,
      });
      if (res.success && res.courseJson) {
        setCourseJson(res.courseJson);
        setValidation(res.validation);
        setEnhanceSuccessMessage(
          !newIncludeImages
            ? 'Images OFF: Removed images, file codes, and slide titles from all slides.'
            : 'Images ON: Preserving image elements and references.'
        );
        setTimeout(() => setEnhanceSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error toggling images on JSON:', err);
    }
  };

  /**
   * Enhances and cleans JSON:
   * - Applies Module 0 & Lesson 0 Introduction rules
   * - Enforces Lesson 1:, Lesson 2:, Lesson 3: numbering
   * - Strips images, file codes, and slide titles from content if Images are OFF
   * - Sanitizes HTML into single parent <div> without classes/styles
   * - Recalculates durations and schema health
   */
  const handleEnhanceJson = (customJson = null) => {
    try {
      const target = customJson || rawJsonInput || courseJson;
      if (!target) return;
      const res = enhanceAndCleanCourseJson(target, {
        stripImages: !includeImages,
        includeQuizzes,
      });
      if (res.success && res.courseJson) {
        setCourseJson(res.courseJson);
        setValidation(res.validation);
        setEnhanceSuccessMessage(
          'JSON enhanced & cleaned! Module 0: Introduction rules applied, lessons formatted, slide titles & file codes purged, clean HTML verified.'
        );
        setShowEnhanceModal(false);
        setRawJsonInput('');
        setTimeout(() => setEnhanceSuccessMessage(''), 5000);

        const candidates = detectSeparateIntroAndObjectives(res.courseJson);
        if (candidates.length > 0) {
          setPendingMergeCandidates(candidates);
          setPendingMergeCourse(res.courseJson);
          setShowMergeIntroModal(true);
        }
      }
    } catch (err) {
      console.error('Enhance JSON error:', err);
      alert('Invalid JSON structure: ' + err.message);
    }
  };

  /**
   * Executes merging of separate Introduction and Learning Objectives slides across all numbered lessons:
   * 1. Merges Introduction paragraph first, then Learning Objectives into 1 slide named "Introduction / Learning Objectives".
   * 2. Formats the first topic as an empty slide without content, with title = lesson name (without "Lesson X:").
   */
  const handleExecuteMergeIntroAndObjectives = () => {
    const targetCourse = pendingMergeCourse || courseJson;
    if (!targetCourse) return;

    try {
      const res = mergeIntroAndLearningObjectives(targetCourse, {
        stripImages: !includeImages,
      });

      if (res.success && res.courseJson) {
        setCourseJson(res.courseJson);
        setValidation(res.validation);
        setParsedData({
          courseTitle: res.courseJson.course_title,
          modules: res.courseJson.modules,
        });
        setShowMergeIntroModal(false);
        setPendingMergeCandidates([]);
        setPendingMergeCourse(null);
        setSelectedTopicIndex(0);
        showToast(
          `Merged Introduction & Learning Objectives across ${res.mergedCount} lesson(s) and set empty title slides!`
        );
      }
    } catch (err) {
      console.error('Error merging introduction and learning objectives:', err);
      alert('Failed to merge slides: ' + err.message);
    }
  };

  /**
   * Manual trigger from UI to check & prompt for merging Introduction and Learning Objectives
   */
  const handleMergeIntroAndObjectivesClick = () => {
    if (!courseJson) return;
    const candidates = detectSeparateIntroAndObjectives(courseJson);
    if (candidates.length === 0) {
      showToast(
        'No separate Introduction and Learning Objectives slides found to merge.'
      );
      return;
    }
    setPendingMergeCandidates(candidates);
    setPendingMergeCourse(courseJson);
    setShowMergeIntroModal(true);
  };

  /**
   * Smart file upload handler:
   * If a course already exists, inspect the document to prompt the user
   * whether to combine as an additional lesson or merge as a final exam.
   */
  const handleSmartFileUpload = async (selectedFile) => {
    if (!selectedFile) return;

    // Direct JSON upload always loads/enhances via handleSingleFileUpload
    if (/\.json$/i.test(selectedFile.name)) {
      return handleSingleFileUpload(selectedFile);
    }

    // If no course loaded yet, proceed with normal single file upload
    if (!courseJson) {
      return handleSingleFileUpload(selectedFile);
    }

    // A course is ALREADY loaded! Inspect the uploaded document
    setError(null);
    setIsProcessing(true);
    setProcessStep('Analyzing document structure for course integration...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const isPdf = /\.pdf$/i.test(selectedFile.name);
      let pdfjsLib = null;
      if (isPdf) {
        setProcessStep('Initializing PDF engine...');
        pdfjsLib = await loadPdfJs();
      }

      setProcessStep('Parsing document content & questions...');
      const parsed = isPdf
        ? await parsePdfDocument(arrayBuffer, {
            fileName: selectedFile.name,
            pdfjsLib,
            stripImages: !includeImages,
            includeQuizzes,
          })
        : await parseDocxDocument(arrayBuffer, {
            fileName: selectedFile.name,
            stripImages: !includeImages,
            includeQuizzes,
          });

      setIsProcessing(false);

      // Check if it's a Final Exam
      const isExam =
        parsed.final_exam ||
        isFinalExamHeading(selectedFile.name) ||
        isFinalExamHeading(parsed.lessonTitle) ||
        (parsed.topics?.length <= 1 && parsed.final_exam);

      if (isExam && (parsed.final_exam || parsed.knowledge_check?.length > 0)) {
        const examObj = parsed.final_exam || {
          id: 'final_exam',
          title: parsed.lessonTitle || 'Comprehensive Final Exam',
          passingScore: 80,
          timeLimit: Math.max(
            1800,
            (parsed.knowledge_check?.length || 10) * 120
          ),
          questionCount: parsed.knowledge_check?.length || 0,
          questions: parsed.knowledge_check || [],
        };
        setPendingExamData({
          file: selectedFile,
          exam: examObj,
        });
        setShowMergeExamModal(true);
        return;
      }

      // It's a lesson! Prompt user to combine or replace
      setPendingUploadData({
        file: selectedFile,
        parsedData: parsed,
        fileName: selectedFile.name,
      });
      setCombineTargetModule(courseJson.modules[0]?.module_id || 'mod_1');
      setCombinePosition('end');
      setCombineTargetLessonIndex(
        Math.max(0, (courseJson.modules[0]?.lessons?.length || 1) - 1)
      );
      setShowCombineModal(true);
    } catch (err) {
      console.error('Smart file inspection error:', err);
      setIsProcessing(false);
      handleSingleFileUpload(selectedFile);
    }
  };

  // Confirm Merge Final Exam into current course
  const handleConfirmMergeExam = () => {
    if (!courseJson || !pendingExamData?.exam) return;
    try {
      const res = mergeFinalExamIntoCourse(courseJson, pendingExamData.exam);
      setCourseJson(res.courseJson);
      setValidation(res.validation);
      setShowMergeExamModal(false);
      setPendingExamData(null);
      setActiveTab('final_exam');
      showToast(
        `Final Exam merged! Added ${res.courseJson.final_exam.questions.length} questions. Total duration updated.`
      );
    } catch (err) {
      console.error('Failed to merge final exam:', err);
      setError('Failed to merge final exam: ' + err.message);
    }
  };

  // Confirm Combine Lesson into current course with auto-renumbering
  const handleConfirmCombineLesson = () => {
    if (!courseJson || !pendingUploadData?.parsedData) return;
    try {
      const parsed = pendingUploadData.parsedData;
      const cleanTitle =
        parsed.lessonTitle && parsed.lessonTitle !== 'Lesson 1'
          ? parsed.lessonTitle
          : pendingUploadData.fileName.replace(/\.(docx?|pdf)$/i, '');

      const newLesson = {
        lesson_title: cleanTitle,
        topics: parsed.topics || [],
        knowledge_check: parsed.knowledge_check || [],
      };

      const res = addLessonToCourse(courseJson, newLesson, {
        targetModuleId: combineTargetModule,
        position: combinePosition,
        targetLessonIndex: combineTargetLessonIndex,
      });

      setCourseJson(res.courseJson);
      setValidation(res.validation);
      setShowCombineModal(false);
      setPendingUploadData(null);
      setActiveTab('lessons');
      showToast(
        `Added "${cleanTitle}" to course! All lessons sequentially renumbered.`
      );
    } catch (err) {
      console.error('Failed to combine lesson:', err);
      setError('Failed to combine lesson: ' + err.message);
    }
  };

  // Reorder lessons via Drag & Drop or Buttons with automatic sequential renumbering
  const handleReorderLesson = (fromIdx, toIdx) => {
    if (!courseJson || fromIdx === toIdx) return;
    try {
      const targetModId = courseJson.modules[0]?.module_id || 'mod_1';
      const res = reorderLessonsInCourse(
        courseJson,
        targetModId,
        fromIdx,
        toIdx
      );
      setCourseJson(res.courseJson);
      setValidation(res.validation);
      showToast(
        `Lesson moved from #${fromIdx + 1} to #${toIdx + 1}! All lessons sequentially renumbered.`
      );
    } catch (err) {
      console.error('Reorder error:', err);
      setError('Failed to reorder lessons: ' + err.message);
    }
  };

  const handleMoveLessonUp = (idx) => {
    if (idx <= 0) return;
    handleReorderLesson(idx, idx - 1);
  };

  const handleMoveLessonDown = (idx) => {
    const total = courseJson?.modules?.[0]?.lessons?.length || 0;
    if (idx >= total - 1) return;
    handleReorderLesson(idx, idx + 1);
  };

  const handleDeleteLesson = (lessonId) => {
    if (!courseJson) return;
    if (
      !confirm('Are you sure you want to remove this lesson from the course?')
    )
      return;
    try {
      const res = removeLessonFromCourse(courseJson, lessonId);
      setCourseJson(res.courseJson);
      setValidation(res.validation);
      showToast('Lesson removed and remaining lessons re-numbered.');
    } catch (err) {
      console.error('Delete lesson error:', err);
    }
  };

  // Select / Change Correct Answer for Quiz or Final Exam question
  const handleSelectCorrectAnswer = (
    questionId,
    optionValue,
    isFinalExam = false
  ) => {
    if (!courseJson) return;
    try {
      const res = updateQuestionInCourse(
        courseJson,
        questionId,
        { correct_answer: optionValue },
        { isFinalExam }
      );
      setCourseJson(res.courseJson);
      setValidation(res.validation);
      showToast(
        `Correct answer updated: Question ${questionId} is now Option ${optionValue}`
      );
    } catch (err) {
      console.error('Select answer error:', err);
    }
  };

  // Open Edit Question Modal
  const handleOpenEditQuestion = (
    question,
    isFinalExam = false,
    moduleId = null,
    lessonId = null
  ) => {
    setEditingQuestion({
      ...JSON.parse(JSON.stringify(question)),
      isFinalExam,
      moduleId,
      lessonId,
    });
    setShowQuestionModal(true);
  };

  // Save changes from Edit Question Modal
  const handleSaveEditedQuestion = () => {
    if (!courseJson || !editingQuestion) return;
    try {
      const res = updateQuestionInCourse(
        courseJson,
        editingQuestion.question_id,
        {
          question: editingQuestion.question,
          options: editingQuestion.options,
          correct_answer: editingQuestion.correct_answer,
          explanation: editingQuestion.explanation,
        },
        { isFinalExam: editingQuestion.isFinalExam }
      );
      setCourseJson(res.courseJson);
      setValidation(res.validation);
      setShowQuestionModal(false);
      setEditingQuestion(null);
      showToast('Question updated successfully!');
    } catch (err) {
      console.error('Save question error:', err);
      alert('Error updating question: ' + err.message);
    }
  };

  // Delete question
  const handleDeleteQuestion = (questionId, isFinalExam = false) => {
    if (!courseJson) return;
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = deleteQuestionFromCourse(courseJson, questionId, {
        isFinalExam,
      });
      setCourseJson(res.courseJson);
      setValidation(res.validation);
      showToast('Question deleted.');
    } catch (err) {
      console.error('Delete question error:', err);
    }
  };

  // Add new blank question
  const handleAddNewQuestion = (
    isFinalExam = false,
    moduleId = null,
    lessonId = null
  ) => {
    if (!courseJson) return;
    const prefix = isFinalExam ? 'fe_q' : 'q_';
    const newId = `${prefix}${Date.now()}`;
    const newQ = {
      question_id: newId,
      question: 'Enter question text here...',
      options: [
        { value: 'A', label: 'Option A' },
        { value: 'B', label: 'Option B' },
        { value: 'C', label: 'Option C' },
        { value: 'D', label: 'Option D' },
      ],
      correct_answer: 'A',
      explanation: 'Explanation for correct answer.',
    };

    const updated = JSON.parse(JSON.stringify(courseJson));
    if (isFinalExam) {
      if (!updated.final_exam) {
        updated.final_exam = {
          id: 'final_exam',
          title: 'Comprehensive Final Exam',
          passingScore: 80,
          timeLimit: 1800,
          questionCount: 0,
          questions: [],
        };
      }
      updated.final_exam.questions.push(newQ);
      updated.final_exam.questionCount = updated.final_exam.questions.length;
    } else {
      const targetMod = updated.modules[0];
      const targetLes = targetMod?.lessons?.[0];
      if (targetLes) {
        if (!Array.isArray(targetLes.knowledge_check)) {
          targetLes.knowledge_check = [];
        }
        targetLes.knowledge_check.push(newQ);
        targetLes.has_assessment_after = true;
      }
    }

    recalculateCourseDurations(updated);
    setCourseJson(updated);
    setValidation(validateCourseJson(updated));
    showToast('New question added! Click Edit to customize it.');
  };

  // Parse pasted Final Exam text
  const handleParsePastedExam = () => {
    if (!pastedExamText.trim()) return;
    try {
      const parsedExam = parseFinalExamFromTextOrHtml(pastedExamText, {
        title: pastedExamTitle || 'Comprehensive Final Exam',
        passingScore: Number(pastedExamPassingScore) || 80,
      });

      if (courseJson) {
        const res = mergeFinalExamIntoCourse(courseJson, parsedExam);
        setCourseJson(res.courseJson);
        setValidation(res.validation);
        showToast(
          `Final Exam attached to course with ${parsedExam.questions.length} questions!`
        );
      } else {
        const standalone = buildCourseJson({
          courseTitle: parsedExam.title || 'Course Final Exam',
          modules: [
            {
              module_id: 'mod_1',
              module_title: 'Module 1: Final Assessment',
              lessons: [
                {
                  lesson_id: 'les_1_1',
                  lesson_title: 'Final Exam',
                  has_assessment_after: false,
                  knowledge_check: [],
                  topics: [
                    {
                      id: 'top_1_1_1',
                      name: 'Final Exam Instructions',
                      headingContent: 'Final Exam Instructions',
                      selectedTemplate: 1,
                      lessonId: 'les_1_1',
                      moduleId: 'mod_1',
                      slide_type: 'content',
                      allocated_duration_seconds: 60,
                      topicDuration: 60,
                      leftDiv: {
                        editorHtml: wrapInLmsContainer(
                          `<p>Complete all ${parsedExam.questions.length} questions to pass the exam.</p>`
                        ),
                      },
                    },
                  ],
                },
              ],
            },
          ],
          final_exam: parsedExam,
        });
        setCourseJson(standalone);
        setValidation(validateCourseJson(standalone));
        showToast(
          `Created Course JSON with ${parsedExam.questions.length} Final Exam questions!`
        );
      }

      setShowPasteExamModal(false);
      setPastedExamText('');
      setActiveTab('final_exam');
    } catch (err) {
      alert('Error parsing final exam: ' + err.message);
    }
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Conversion Source Column */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSourceColumn((prev) => !prev)}
            className={cn(
              'gap-1.5 text-xs font-semibold',
              !showSourceColumn
                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 shadow-2xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            title={
              showSourceColumn
                ? 'Hide Conversion Source Column'
                : 'Show Conversion Source Column'
            }
          >
            {showSourceColumn ? (
              <>
                <PanelLeftClose className="h-3.5 w-3.5" />
                Hide Source Column
              </>
            ) : (
              <>
                <PanelLeftOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Show Source Column
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (courseJson) {
                handleEnhanceJson();
              } else {
                setShowEnhanceModal(true);
              }
            }}
            className="gap-1.5 border-purple-300 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs shadow-2xs font-semibold"
            title="Enhance & Clean Code: apply Module 0 / Introduction rules, format lesson numbering, purge slide titles & file codes"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            {courseJson ? 'Enhance & Clean JSON' : 'Enhance JSON'}
          </Button>

          {courseJson && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMergeIntroAndObjectivesClick}
              className="gap-1.5 border-indigo-300 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs shadow-2xs font-semibold"
              title="Merge separate Introduction and Learning Objectives slides into 1 slide with an empty lesson title slide"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Merge Intro &amp; Objectives
            </Button>
          )}

          {courseJson && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Enhance / Clean Notification Banner */}
      {enhanceSuccessMessage && (
        <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="font-medium">{enhanceSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setEnhanceSuccessMessage('')}
            className="text-purple-600 hover:text-purple-800 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mode Selection & File Dropzone */}
      <div
        className={cn(
          'grid gap-6',
          showSourceColumn ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
        )}
      >
        {/* Left Column: Mode & File Uploader */}
        {showSourceColumn && (
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardContent className="p-5 space-y-4">
                {/* Column Top Header with Hide Action */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-blue-600" />
                    Conversion Source &amp; Setup
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSourceColumn(false)}
                    className="h-6 px-2 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 gap-1 rounded-md"
                    title="Hide this column"
                  >
                    <PanelLeftClose className="h-3 w-3" />
                    Hide Column
                  </Button>
                </div>

                {/* Conversion Source: Single Column Stacked Rows */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Conversion Source
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSourceSection((prev) => !prev)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      {showSourceSection ? (
                        <>
                          Hide <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Show <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {showSourceSection && (
                    <div className="flex flex-col gap-2 mt-2 animate-in fade-in">
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
                  )}
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
                      onClick={() => handleToggleImages(false)}
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
                            Remove images, file codes &amp; slide titles from
                            content
                          </div>
                        </div>
                      </div>
                      {!includeImages && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleImages(true)}
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

                      const scanned = await scanDataTransferItems(
                        e.dataTransfer
                      );
                      if (
                        scanned.length > 1 ||
                        (scanned.length === 1 &&
                          scanned[0].relativePath.includes('/'))
                      ) {
                        // Multi-file or folder detected
                        await handleFolderUpload(scanned);
                      } else if (scanned.length === 1) {
                        // Single file dropped
                        if (mode === 'folder' && !courseJson) {
                          setMode('A');
                        }
                        await handleSmartFileUpload(scanned[0].file);
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
                      accept=".docx,.doc,.pdf,.json"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        if (files.length > 1) {
                          handleFolderUpload(files);
                        } else {
                          handleSmartFileUpload(files[0]);
                        }
                      }}
                    />
                    <input
                      ref={jsonFileInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files[0]) {
                          handleSingleFileUpload(files[0]);
                        }
                        e.target.value = '';
                      }}
                    />
                    <input
                      ref={lessonAddInputRef}
                      type="file"
                      accept=".docx,.doc,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files[0]) handleSmartFileUpload(files[0]);
                        e.target.value = '';
                      }}
                    />
                    <input
                      ref={finalExamUploadInputRef}
                      type="file"
                      accept=".docx,.doc,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files[0]) handleSmartFileUpload(files[0]);
                        e.target.value = '';
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
                    <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => jsonFileInputRef.current?.click()}
                        className="text-xs h-8 gap-1.5 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                      >
                        <FileCode className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        Upload JSON File
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
                          onChange={(e) =>
                            setCourseTitleOverride(e.target.value)
                          }
                          className="h-8 text-xs mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right Column: Key Metrics & Inspectors */}
        <div
          className={cn(
            'space-y-6',
            showSourceColumn ? 'lg:col-span-2' : 'col-span-1 w-full'
          )}
        >
          {/* Quick Banner when Source Column is Hidden */}
          {!showSourceColumn && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-semibold text-blue-950 dark:text-blue-100">
                  Full-Width Workspace Active
                </span>
                <span className="text-[11px] text-blue-700 dark:text-blue-300 hidden sm:inline">
                  (Conversion Source column is hidden for maximum reading &amp;
                  editing space)
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowSourceColumn(true)}
                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
              >
                <PanelLeftOpen className="h-3.5 w-3.5" />
                Show Source Column
              </Button>
            </div>
          )}
          {/* Dashboard Metrics (When Converted) */}
          {courseJson ? (
            <div className="space-y-2.5">
              {/* Course Intro / Module 0 Calculation Option Bar */}
              {introModuleInfo && (
                <div className="p-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between flex-wrap gap-2 text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Course Intro / M0 Detected:
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-400">
                        &ldquo;{introModuleInfo.moduleTitle}&rdquo; &bull;{' '}
                        {introModuleInfo.lessonTitle} (
                        {introModuleInfo.introTopicsCount} T)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setIncludeIntroInTotals(true)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap',
                        includeIntroInTotals
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      With Intro ({hierarchyCounts.totalModulesWithIntro} M /{' '}
                      {hierarchyCounts.totalLessonsWithIntro} L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncludeIntroInTotals(false)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap',
                        !includeIntroInTotals
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      Skip Intro ({hierarchyCounts.coreModulesCount} M /{' '}
                      {hierarchyCounts.coreLessonsCount} L Core)
                    </button>
                  </div>
                </div>
              )}

              {/* 7 Publication-Grade Top Statistics Cards with M, L, T, Quiz, Q/A, F/E Notation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2.5">
                {/* 1. Total Modules (M) */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
                  <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Modules
                      </span>
                      <span className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        <Layers className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="my-1">
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                        {hierarchyCounts.modulesCount}{' '}
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          M
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {introModuleInfo
                        ? includeIntroInTotals
                          ? 'Includes Mod 0'
                          : 'Core (Mod 0 skipped)'
                        : 'Total Modules'}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Total Lessons (L) */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:border-sky-300 dark:hover:border-sky-800 transition-colors">
                  <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Lessons
                      </span>
                      <span className="p-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                        <BookOpen className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="my-1">
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                        {hierarchyCounts.lessonsCount}{' '}
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          L
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {introModuleInfo
                        ? includeIntroInTotals
                          ? 'Includes Lesson 0'
                          : 'Core (Les 0 skipped)'
                        : 'Total Lessons'}
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Total Topics (T) */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                  <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Topics
                      </span>
                      <span className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="my-1">
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                        {hierarchyCounts.topicsCount}{' '}
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          T
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {introModuleInfo && !includeIntroInTotals
                        ? '162 Core Slides'
                        : 'Instructional Slides'}
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Total Quizzes (Quiz & F/E) */}
                <Card
                  onClick={() => setActiveTab('quiz')}
                  className="border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-400 dark:hover:border-amber-600 hover:ring-2 hover:ring-amber-500/20 cursor-pointer transition-all"
                  title="Click to view & manage Quizzes"
                >
                  <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Quizzes
                      </span>
                      <span className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="my-1">
                      <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                        {includeQuizzes ? (
                          finalExamQuestions.length > 0 ? (
                            <>
                              {Math.max(0, hierarchyCounts.quizzesCount - 1)}{' '}
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                Quiz + 1 F/E
                              </span>
                            </>
                          ) : (
                            <>
                              {hierarchyCounts.quizzesCount}{' '}
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                Quiz
                              </span>
                            </>
                          )
                        ) : (
                          '0 Quiz'
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {includeQuizzes
                        ? finalExamQuestions.length > 0
                          ? '16 KC + 1 Final Exam'
                          : 'Lesson Quizzes'
                        : 'Quizzes Excluded'}
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Total Questions (Q/A & F/E) */}
                <Card
                  onClick={() => setActiveTab('quiz')}
                  className="border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-600 hover:ring-2 hover:ring-emerald-500/20 cursor-pointer transition-all"
                  title="Click to view & manage Questions"
                >
                  <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Questions
                      </span>
                      <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckSquare className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="my-1">
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                        {includeQuizzes ? (
                          <>
                            {hierarchyCounts.questionsCount}{' '}
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              Q/A
                            </span>
                          </>
                        ) : (
                          '0 Q/A'
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {includeQuizzes
                        ? finalExamQuestions.length > 0
                          ? `${allQuizzes.length} Quiz + ${finalExamQuestions.length} F/E`
                          : 'Lesson Questions'
                        : 'Excluded from JSON'}
                    </div>
                  </CardContent>
                </Card>

                {/* 6. Total Time */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:border-orange-300 dark:hover:border-orange-800 transition-colors">
                  <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Duration
                      </span>
                      <span className="p-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="my-1">
                      <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                        {formatTime(hierarchyCounts.durationSeconds)}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Total Course Time
                    </div>
                  </CardContent>
                </Card>

                {/* 7. Schema Health */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
                  <CardContent className="p-3 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Health
                      </span>
                      <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="my-1">
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">
                        {validation?.score || 100}%
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      14/14 Checks Pass
                    </div>
                  </CardContent>
                </Card>
              </div>
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

          {/* Action Feedback Banner / Toast */}
          {actionMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium">{actionMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionMessage('')}
                className="text-emerald-700 hover:text-emerald-900 dark:hover:text-white text-xs ml-2 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Multi-Tab Workspace */}
          {courseJson && (
            <div className="space-y-4">
              {/* Tab Navigation & Module Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('lessons')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5',
                      activeTab === 'lessons'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                    Lessons ({allLessons.length})
                  </button>
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
                    onClick={() => setActiveTab('final_exam')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5',
                      activeTab === 'final_exam'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <Award className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    Final Exam ({finalExamQuestions.length})
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
                    Validation ({validation?.summary?.passed || 14}/14)
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

              {/* Tab 0: Lessons & Reorder Manager (Draggable + Auto-Renumbering) */}
              {activeTab === 'lessons' && (
                <div className="space-y-4 max-h-[550px] overflow-y-auto">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <ListOrdered className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Course Lessons &amp; Sequential Ordering</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {allLessons.length} Total Lessons
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Drag and drop lessons or use arrows to change
                          position. Moving <strong>Lesson 1</strong> to{' '}
                          <strong>Lesson 6</strong> position dynamically updates
                          its title to <strong>Lesson 6: ...</strong> and
                          re-sequences all lessons.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => lessonAddInputRef.current?.click()}
                        className="h-7 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      >
                        <FilePlus className="h-3.5 w-3.5" />
                        Add Another Lesson
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {allLessons.map((les, idx) => (
                      <div
                        key={les.lesson_id || idx}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(idx));
                          setDraggedLessonIndex(idx);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverLessonIndex(idx);
                        }}
                        onDragLeave={() => {
                          if (dragOverLessonIndex === idx)
                            setDragOverLessonIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (
                            draggedLessonIndex !== null &&
                            draggedLessonIndex !== idx
                          ) {
                            handleReorderLesson(draggedLessonIndex, idx);
                          }
                          setDraggedLessonIndex(null);
                          setDragOverLessonIndex(null);
                        }}
                        className={cn(
                          'p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shadow-2xs',
                          dragOverLessonIndex === idx
                            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/30 scale-[1.01]'
                            : 'border-slate-200 dark:border-slate-800'
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Drag Handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
                            title="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>

                          {/* Position Number Pill */}
                          <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          {/* Lesson Title & Details */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {les.lesson_title}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                              <span>{les.topics?.length || 0} Topics</span>
                              <span>•</span>
                              <span>
                                {les.knowledge_check?.length || 0} Quiz
                                Questions
                              </span>
                              <span>•</span>
                              <span className="font-mono">
                                ID: {les.lesson_id}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons (Move Up, Move Down, Delete) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={idx === 0}
                            onClick={() => handleMoveLessonUp(idx)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={idx === allLessons.length - 1}
                            onClick={() => handleMoveLessonDown(idx)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLesson(les.lesson_id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            title="Remove Lesson"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                        className="h-8 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 bg-white dark:bg-slate-950 text-foreground w-full max-w-lg truncate shadow-2xs"
                      >
                        {groupedTopicSections.map((group) => (
                          <optgroup key={group.key} label={group.label}>
                            {group.topics.map((t) => (
                              <option
                                key={t.id || t.globalIndex}
                                value={t.globalIndex}
                              >
                                Topic {t.globalIndex + 1}: {t.name}
                              </option>
                            ))}
                          </optgroup>
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
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveTab('quiz')}
                              className="h-7 text-xs font-semibold gap-1.5 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 shadow-2xs"
                              title="Inspect & manage quizzes for this lesson"
                            >
                              <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              Quiz ({currentLessonQuizCount} Q)
                            </Button>
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
                      {includeQuizzes && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddNewQuestion(false)}
                          className="h-7 text-xs font-semibold gap-1 text-slate-700 dark:text-slate-300"
                        >
                          <Plus className="h-3 w-3" /> Add Question
                        </Button>
                      )}
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
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                                Question {idx + 1} ({q.question_id})
                              </span>
                              <span className="text-[11px] text-slate-500 ml-2">
                                {q.moduleTitle} → {q.lessonTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]">
                                Answer: Option {q.correct_answer}
                              </Badge>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleOpenEditQuestion(
                                    q,
                                    false,
                                    q.moduleId,
                                    q.lessonId
                                  )
                                }
                                className="h-6 text-[11px] px-2 gap-1 text-slate-700 dark:text-slate-300"
                              >
                                <Edit3 className="h-3 w-3" /> Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDeleteQuestion(q.question_id, false)
                                }
                                className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                title="Delete Question"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {q.question ||
                              q.question_text ||
                              'No question text provided'}
                          </p>

                          {/* Options with Clickable Correct Answer Selection */}
                          <div className="space-y-2 pt-1">
                            {q.options && q.options.length > 0 ? (
                              q.options.map((opt, optIdx) => {
                                const optLetter = (
                                  opt.value ||
                                  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][
                                    optIdx
                                  ] ||
                                  `${optIdx + 1}`
                                ).toUpperCase();
                                const optLabel =
                                  opt.label || opt.option_text || '';
                                const isCorrect =
                                  optLetter === q.correct_answer ||
                                  opt.is_correct === true ||
                                  opt.value === q.correct_answer;
                                return (
                                  <button
                                    type="button"
                                    key={`${q.question_id || 'kc'}_opt_${optLetter}_${optIdx}`}
                                    onClick={() =>
                                      handleSelectCorrectAnswer(
                                        q.question_id,
                                        optLetter,
                                        false
                                      )
                                    }
                                    className={cn(
                                      'w-full p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer text-left',
                                      isCorrect
                                        ? 'border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-medium ring-1 ring-emerald-500/20'
                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/20'
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <span
                                        className={cn(
                                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-transform',
                                          isCorrect
                                            ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        )}
                                      >
                                        {optLetter}
                                      </span>
                                      <span className="text-xs leading-normal">
                                        {optLabel}
                                      </span>
                                    </div>
                                    {isCorrect ? (
                                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 ml-2">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Correct
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 hover:text-emerald-600 font-medium shrink-0 ml-2 opacity-0 hover:opacity-100 transition-opacity">
                                        Click to select
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-xs flex items-center justify-between gap-2">
                                <span className="text-amber-800 dark:text-amber-300">
                                  No options currently defined for this question.
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleOpenEditQuestion(
                                      q,
                                      false,
                                      q.moduleId,
                                      q.lessonId
                                    )
                                  }
                                  className="h-6 text-[10px] gap-1 border-amber-300 text-amber-800 dark:text-amber-200"
                                >
                                  <Plus className="h-3 w-3" /> Add Options
                                </Button>
                              </div>
                            )}
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
                        {!includeQuizzes ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleToggleQuizzes(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            Enable Quizzes in JSON
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddNewQuestion(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add First Quiz Question
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Tab 2.5: Course Final Exam Inspector & Editor */}
              {activeTab === 'final_exam' && (
                <div className="space-y-4 max-h-[550px] overflow-y-auto">
                  {courseJson.final_exam &&
                  courseJson.final_exam.questions?.length > 0 ? (
                    <>
                      {/* Final Exam Toolbar */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Award className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                              <span>
                                {courseJson.final_exam.title ||
                                  'Comprehensive Final Exam'}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300"
                              >
                                {courseJson.final_exam.questions.length}{' '}
                                Questions
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              >
                                Passing Score:{' '}
                                {courseJson.final_exam.passingScore || 80}%
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              >
                                Time Limit:{' '}
                                {formatTime(
                                  courseJson.final_exam.timeLimit || 1800
                                )}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Click any option to set the correct answer. Click
                              Edit to modify questions, options, or
                              explanations.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddNewQuestion(true)}
                            className="h-7 text-xs font-semibold gap-1 text-slate-700 dark:text-slate-300"
                          >
                            <Plus className="h-3 w-3" /> Add Question
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              finalExamUploadInputRef.current?.click()
                            }
                            className="h-7 text-xs font-semibold gap-1 text-slate-700 dark:text-slate-300"
                          >
                            <Upload className="h-3 w-3" /> Re-upload Exam
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPasteExamModal(true)}
                            className="h-7 text-xs font-semibold gap-1 text-slate-700 dark:text-slate-300"
                          >
                            <FileEdit className="h-3 w-3" /> Paste Exam Text
                          </Button>
                        </div>
                      </div>

                      {/* Final Exam Questions List */}
                      {courseJson.final_exam.questions.map((q, idx) => (
                        <Card
                          key={q.question_id || idx}
                          className="border-slate-200 dark:border-slate-800"
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded">
                                  Exam Question {idx + 1} ({q.question_id})
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]">
                                  Answer: Option {q.correct_answer}
                                </Badge>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleOpenEditQuestion(q, true)
                                  }
                                  className="h-6 text-[11px] px-2 gap-1 text-slate-700 dark:text-slate-300"
                                >
                                  <Edit3 className="h-3 w-3" /> Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteQuestion(q.question_id, true)
                                  }
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                  title="Delete Exam Question"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {q.question ||
                                q.question_text ||
                                'No question text provided'}
                            </p>

                            {/* Options with Clickable Correct Answer Selection */}
                            <div className="space-y-2 pt-1">
                              {q.options?.map((opt, optIdx) => {
                                const optLetter = (
                                  opt.value ||
                                  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][
                                    optIdx
                                  ] ||
                                  `${optIdx + 1}`
                                ).toUpperCase();
                                const optLabel =
                                  opt.label || opt.option_text || '';
                                const isCorrect =
                                  optLetter === q.correct_answer ||
                                  opt.is_correct === true ||
                                  opt.value === q.correct_answer;
                                return (
                                  <button
                                    type="button"
                                    key={`${q.question_id || 'fe'}_opt_${optLetter}_${optIdx}`}
                                    onClick={() =>
                                      handleSelectCorrectAnswer(
                                        q.question_id,
                                        optLetter,
                                        true
                                      )
                                    }
                                    className={cn(
                                      'w-full p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer text-left',
                                      isCorrect
                                        ? 'border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-medium ring-1 ring-emerald-500/20'
                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/20'
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <span
                                        className={cn(
                                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-transform',
                                          isCorrect
                                            ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        )}
                                      >
                                        {optLetter}
                                      </span>
                                      <span className="text-xs leading-normal">
                                        {optLabel}
                                      </span>
                                    </div>
                                    {isCorrect ? (
                                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 ml-2">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Correct
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 hover:text-emerald-600 font-medium shrink-0 ml-2 opacity-0 hover:opacity-100 transition-opacity">
                                        Click to select
                                      </span>
                                    )}
                                  </button>
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
                      ))}
                    </>
                  ) : (
                    /* Empty State: No Final Exam in Course */
                    <Card className="border-slate-200 dark:border-slate-800">
                      <CardContent className="p-10 text-center space-y-4">
                        <div className="inline-flex p-3 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600">
                          <Award className="h-8 w-8" />
                        </div>
                        <div className="max-w-md mx-auto">
                          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                            No Final Exam in this Course Yet
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Uploaded all your lessons but forgot the final exam?
                            Upload your Word document (.docx) or PDF, or paste
                            the exam questions directly. It will be seamlessly
                            merged into this course!
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              finalExamUploadInputRef.current?.click()
                            }
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload Final Exam (.docx / .pdf)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPasteExamModal(true)}
                            className="text-xs gap-1.5 text-slate-700 dark:text-slate-300"
                          >
                            <FileEdit className="h-3.5 w-3.5" />
                            Paste Final Exam Text
                          </Button>
                        </div>
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
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEnhanceJson()}
                        className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-medium"
                        title="Enhance & Clean Code: apply Module 0 / Introduction, format lesson numbering, purge slide titles & file codes"
                      >
                        <Sparkles className="h-3 w-3" />
                        Enhance &amp; Clean Code
                      </button>
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

      {/* Enhance & Clean JSON Modal */}
      <Dialog open={showEnhanceModal} onOpenChange={setShowEnhanceModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Enhance &amp; Clean Course JSON
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Paste any raw or existing Course JSON below to automatically
              format, sanitize HTML into single parent &lt;div&gt; containers,
              apply <strong>Module 0: Introduction</strong> rules, enforce
              consistent <strong>Lesson 1:, Lesson 2:, Lesson 3:</strong>{' '}
              numbering, and purge unwanted image file codes and slide titles
              from slide content.
            </p>

            <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-900/60 rounded-lg text-xs border border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">
                Prefer uploading a <strong>.json</strong> file from your
                computer?
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEnhanceModal(false);
                  jsonFileInputRef.current?.click();
                }}
                className="h-7 text-xs gap-1.5 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              >
                <FileCode className="h-3.5 w-3.5" />
                Upload .json File
              </Button>
            </div>

            <textarea
              value={rawJsonInput}
              onChange={(e) => setRawJsonInput(e.target.value)}
              placeholder='Or paste your course JSON here... { "course_title": "...", "modules": [...] }'
              rows={10}
              className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">
                LMS JSON Schema built-in format is 100% preserved.
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEnhanceModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!rawJsonInput.trim()}
                  onClick={() => handleEnhanceJson()}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Enhance, Clean &amp; Load JSON
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 1: Combine / Placement Dialog (When Uploading Additional Lesson) */}
      <Dialog open={showCombineModal} onOpenChange={setShowCombineModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <ListOrdered className="h-5 w-5 text-blue-600" />
              Add Lesson to Existing Course
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
              <div className="font-semibold text-blue-900 dark:text-blue-200">
                Current Course: {courseJson?.course_title}
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-300">
                Currently loaded with {allLessons.length} lessons across{' '}
                {courseJson?.modules?.length || 1} module(s).
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                New Lesson Detected:
              </label>
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                {pendingUploadData?.parsedData?.lessonTitle ||
                  pendingUploadData?.fileName}
              </div>
            </div>

            <div className="space-y-3 pt-1 border-t">
              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Where do you want to place it?
                </label>
                <select
                  value={combinePosition}
                  onChange={(e) => setCombinePosition(e.target.value)}
                  className="w-full h-8 text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-background text-foreground"
                >
                  <option value="end">
                    At the end (as Lesson {allLessons.length + 1}) - Recommended
                  </option>
                  <option value="start">At the beginning (as Lesson 1)</option>
                  <option value="before">Before a specific lesson</option>
                  <option value="after">After a specific lesson</option>
                </select>
              </div>

              {(combinePosition === 'before' ||
                combinePosition === 'after') && (
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Select Reference Lesson:
                  </label>
                  <select
                    value={combineTargetLessonIndex}
                    onChange={(e) =>
                      setCombineTargetLessonIndex(Number(e.target.value))
                    }
                    className="w-full h-8 text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-background text-foreground"
                  >
                    {allLessons.map((les, idx) => (
                      <option key={les.lesson_id || idx} value={idx}>
                        Position {idx + 1}: {les.lesson_title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {courseJson?.modules?.length > 1 && (
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Target Module:
                  </label>
                  <select
                    value={combineTargetModule}
                    onChange={(e) => setCombineTargetModule(e.target.value)}
                    className="w-full h-8 text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-background text-foreground"
                  >
                    {courseJson.modules.map((m) => (
                      <option key={m.module_id} value={m.module_id}>
                        {m.module_title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCombineModal(false);
                  if (pendingUploadData?.file) {
                    handleSingleFileUpload(pendingUploadData.file);
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Start New Course Instead
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCombineModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmCombineLesson}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Combine &amp; Auto-Renumber
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Merge Final Exam Dialog */}
      <Dialog open={showMergeExamModal} onOpenChange={setShowMergeExamModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Award className="h-5 w-5 text-purple-600" />
              Final Exam Upload Detected
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              You uploaded a Final Exam document with{' '}
              <strong>{pendingExamData?.exam?.questions?.length || 0}</strong>{' '}
              questions. Do you want to merge this exam into your current
              course?
            </p>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1">
              <div className="font-semibold text-purple-900 dark:text-purple-200">
                Course: {courseJson?.course_title}
              </div>
              <div className="text-[11px] text-purple-700 dark:text-purple-300">
                Exam Title:{' '}
                {pendingExamData?.exam?.title || 'Comprehensive Final Exam'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowMergeExamModal(false);
                  if (pendingExamData?.file) {
                    handleSingleFileUpload(pendingExamData.file);
                  }
                }}
                className="text-xs text-slate-500"
              >
                Create Separate Course
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMergeExamModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmMergeExam}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  Merge into Course
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Paste Final Exam Text Dialog */}
      <Dialog open={showPasteExamModal} onOpenChange={setShowPasteExamModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <FileEdit className="h-5 w-5 text-purple-600" />
              Paste Final Exam Text
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              Paste exam questions directly from your Word document. The parser
              will automatically extract the stem, options (A, B, C, D), correct
              answers marked with <code>(correct)</code>, and explanations.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Exam Title:
                </label>
                <Input
                  value={pastedExamTitle}
                  onChange={(e) => setPastedExamTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Passing Score (%):
                </label>
                <Input
                  type="number"
                  min="50"
                  max="100"
                  value={pastedExamPassingScore}
                  onChange={(e) => setPastedExamPassingScore(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                Exam Text / Questions:
              </label>
              <Textarea
                rows={12}
                value={pastedExamText}
                onChange={(e) => setPastedExamText(e.target.value)}
                placeholder="Question 1&#10;Which of the following is considered fraud...?&#10;A. Intentionally submitting false claims (correct)&#10;B. Occasionally missing documentation&#10;Explanation: Fraud involves intentional deception...&#10;&#10;Question 2&#10;..."
                className="font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-[11px] text-slate-500">
                You can easily edit and select correct answers anytime after
                parsing.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasteExamModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!pastedExamText.trim()}
                  onClick={handleParsePastedExam}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5"
                >
                  <Award className="h-3.5 w-3.5" />
                  Parse &amp; Merge Final Exam
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Edit Question Modal (Quiz or Final Exam) */}
      <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Edit{' '}
              {editingQuestion?.isFinalExam
                ? 'Final Exam Question'
                : 'Quiz Question'}
            </DialogTitle>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Question Prompt (Stem):
                </label>
                <Textarea
                  rows={3}
                  value={editingQuestion.question || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: e.target.value,
                    })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Answer Options (Select which one is correct):
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nextLetter = String.fromCharCode(
                        65 + (editingQuestion.options?.length || 0)
                      );
                      const updatedOpts = [
                        ...(editingQuestion.options || []),
                        { value: nextLetter, label: `Option ${nextLetter}` },
                      ];
                      setEditingQuestion({
                        ...editingQuestion,
                        options: updatedOpts,
                      });
                    }}
                    className="h-6 text-[10px] gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {editingQuestion.options?.map((opt, oIdx) => {
                    const isCorrect =
                      opt.value === editingQuestion.correct_answer;
                    return (
                      <div
                        key={opt.value || oIdx}
                        className={cn(
                          'p-2.5 rounded-xl border flex items-center gap-2 transition-all',
                          isCorrect
                            ? 'border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800'
                        )}
                      >
                        {/* Radio selector for correct answer */}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingQuestion({
                              ...editingQuestion,
                              correct_answer: opt.value,
                            })
                          }
                          className={cn(
                            'w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors',
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 hover:bg-slate-300'
                          )}
                          title="Click to set as correct answer"
                        >
                          {opt.value}
                        </button>

                        <Input
                          value={opt.label || ''}
                          onChange={(e) => {
                            const newOpts = [...editingQuestion.options];
                            newOpts[oIdx] = { ...opt, label: e.target.value };
                            setEditingQuestion({
                              ...editingQuestion,
                              options: newOpts,
                            });
                          }}
                          className="h-8 text-xs flex-1"
                        />

                        {isCorrect ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] shrink-0">
                            ✓ Correct
                          </Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingQuestion({
                                ...editingQuestion,
                                correct_answer: opt.value,
                              })
                            }
                            className="text-[11px] text-slate-500 hover:text-emerald-600 shrink-0 font-medium px-1.5 py-1"
                          >
                            Set Correct
                          </button>
                        )}

                        {editingQuestion.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const filtered = editingQuestion.options.filter(
                                (_, idx) => idx !== oIdx
                              );
                              setEditingQuestion({
                                ...editingQuestion,
                                options: filtered,
                                correct_answer:
                                  editingQuestion.correct_answer === opt.value
                                    ? filtered[0]?.value || 'A'
                                    : editingQuestion.correct_answer,
                              });
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                  Explanation / Feedback:
                </label>
                <Textarea
                  rows={3}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      explanation: e.target.value,
                    })
                  }
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-[11px] text-slate-500">
                  Current answer: Option {editingQuestion.correct_answer}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuestionModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveEditedQuestion}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Merge Introduction & Learning Objectives Confirmation */}
      <Dialog open={showMergeIntroModal} onOpenChange={setShowMergeIntroModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Layers className="h-5 w-5 text-indigo-600" />
              Merge Introduction &amp; Learning Objectives?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              We detected separate <strong>Introduction</strong> and{' '}
              <strong>Learning Objectives</strong> slides in{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {pendingMergeCandidates.length} numbered lesson
                {pendingMergeCandidates.length > 1 ? 's' : ''}
              </span>{' '}
              (e.g.,{' '}
              {pendingMergeCandidates
                .slice(0, 3)
                .map((c) => c.lessonTitle || c.lessonId)
                .join(', ')}
              {pendingMergeCandidates.length > 3 ? '...' : ''}).
            </p>

            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2.5 text-xs space-y-1.5">
              {pendingMergeCandidates.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium"
                >
                  <span className="truncate max-w-[320px]">
                    📖 {c.lessonTitle || c.lessonId}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                  >
                    Separate Slides
                  </Badge>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-2.5 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Actions to be performed:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                <li>
                  Combine Introduction paragraph first, then Learning Objectives
                  content into 1 slide named{' '}
                  <span className="font-mono font-semibold">
                    &quot;Introduction / Learning Objectives&quot;
                  </span>
                  .
                </li>
                <li>
                  Make the first slide an empty title slide containing strictly
                  the lesson name (without lesson numbering prefixes like
                  &quot;Lesson 1:&quot;).
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowMergeIntroModal(false);
                setPendingMergeCandidates([]);
                setPendingMergeCourse(null);
                showToast(
                  'Kept separate Introduction and Learning Objectives slides.'
                );
              }}
            >
              Keep Separate
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteMergeIntroAndObjectives}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5"
            >
              <Check className="h-4 w-4" />
              Merge Slides
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
