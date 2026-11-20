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
  X,
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
  convertPptxToCourseJson,
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
  const [showSourceColumn, setShowSourceColumn] = useState(false);
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

  // Course, Module, Lesson Rename States
  const [isEditingCourseTitle, setIsEditingCourseTitle] = useState(false);
  const [editedCourseTitle, setEditedCourseTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editedModuleTitle, setEditedModuleTitle] = useState('');
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editedLessonTitle, setEditedLessonTitle] = useState('');
  const [showStructureModal, setShowStructureModal] = useState(false);

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

      if (res.validation?.duplicateSlideAlerts?.length > 0) {
        setActiveTab('hierarchy');
        const firstDup = res.validation.duplicateSlideAlerts[0];
        const flatTops = (res.courseJson.modules || []).flatMap((m) =>
          (m.lessons || []).flatMap((l) => l.topics || [])
        );
        const dupIdx = flatTops.findIndex(
          (t) =>
            t.id === firstDup.topicId ||
            (t.name?.trim().toLowerCase() ===
              firstDup.topicName?.trim().toLowerCase() &&
              t.lessonId === firstDup.lessonId)
        );
        setSelectedTopicIndex(dupIdx >= 0 ? dupIdx : 0);
      } else {
        setSelectedTopicIndex(0);
      }
      setProcessStep('Whole course conversion completed!');

      // Detect separate Introduction and Learning Objectives slides across all numbered lessons
      const separateCandidates = detectSeparateIntroAndObjectives(
        res.courseJson
      );
      if (separateCandidates.length > 0) {
        setPendingMergeCandidates(separateCandidates);
        setPendingMergeCourse(res.courseJson);
        setShowMergeIntroModal(true);
      }
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

          if (res.validation?.duplicateSlideAlerts?.length > 0) {
            setActiveTab('hierarchy');
            const firstDup = res.validation.duplicateSlideAlerts[0];
            const flatTops = (res.courseJson.modules || []).flatMap((m) =>
              (m.lessons || []).flatMap((l) => l.topics || [])
            );
            const dupIdx = flatTops.findIndex(
              (t) =>
                t.id === firstDup.topicId ||
                (t.name?.trim().toLowerCase() ===
                  firstDup.topicName?.trim().toLowerCase() &&
                  t.lessonId === firstDup.lessonId)
            );
            setSelectedTopicIndex(dupIdx >= 0 ? dupIdx : 0);
          } else {
            setSelectedTopicIndex(0);
          }
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

      if (res.validation?.duplicateSlideAlerts?.length > 0) {
        setActiveTab('hierarchy');
        const firstDup = res.validation.duplicateSlideAlerts[0];
        const flatTops = (res.courseJson.modules || []).flatMap((m) =>
          (m.lessons || []).flatMap((l) => l.topics || [])
        );
        const dupIdx = flatTops.findIndex(
          (t) =>
            t.id === firstDup.topicId ||
            (t.name?.trim().toLowerCase() ===
              firstDup.topicName?.trim().toLowerCase() &&
              t.lessonId === firstDup.lessonId)
        );
        setSelectedTopicIndex(dupIdx >= 0 ? dupIdx : 0);
      } else {
        setSelectedTopicIndex(0);
      }
      setProcessStep('Conversion completed!');

      // Detect separate Introduction and Learning Objectives slides in numbered lessons
      const separateCandidates = detectSeparateIntroAndObjectives(
        res.courseJson
      );
      if (separateCandidates.length > 0) {
        setPendingMergeCandidates(separateCandidates);
        setPendingMergeCourse(res.courseJson);
        setShowMergeIntroModal(true);
      }
    } catch (err) {
      console.error('Course JSON conversion error:', err);
      setError(
        err.message || 'Failed to parse document and generate course JSON.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Rename Course Title
  const handleUpdateCourseTitle = (newTitle) => {
    if (!courseJson) return;
    const clean = (newTitle || '').trim();
    if (!clean) return;

    const updated = JSON.parse(JSON.stringify(courseJson));
    const oldTitle = updated.course_title;
    updated.course_title = clean;

    if (updated.modules && updated.modules.length > 0) {
      const firstMod = updated.modules[0];
      if (
        firstMod.module_id === 'mod_0' ||
        firstMod.module_title === oldTitle ||
        updated.modules.length === 1
      ) {
        firstMod.module_title = clean;
      }
      const firstLesson = firstMod.lessons?.[0];
      if (firstLesson && firstLesson.topics?.length > 0) {
        const firstTopic = firstLesson.topics[0];
        if (
          firstTopic.name === oldTitle ||
          !firstTopic.leftDiv?.editorHtml?.replace(/<[^>]*>/g, '').trim()
        ) {
          firstTopic.name = clean;
          firstTopic.headingContent = clean;
        }
      }
    }

    setCourseTitleOverride(clean);
    setCourseJson(updated);
    setIsEditingCourseTitle(false);
    showToast(`Course renamed to "${clean}"`);
  };

  // Rename Module Title
  const handleUpdateModuleTitle = (moduleId, newTitle) => {
    if (!courseJson) return;
    const clean = (newTitle || '').trim();
    if (!clean) return;

    const updated = JSON.parse(JSON.stringify(courseJson));
    const mod = (updated.modules || []).find((m) => m.module_id === moduleId);
    if (!mod) return;

    mod.module_title = clean;
    setCourseJson(updated);
    setEditingModuleId(null);
    setEditedModuleTitle('');
    showToast(`Module updated to "${clean}"`);
  };

  // Rename Lesson Title
  const handleUpdateLessonTitle = (lessonId, newTitle) => {
    if (!courseJson) return;
    const clean = (newTitle || '').trim();
    if (!clean) return;

    const updated = JSON.parse(JSON.stringify(courseJson));
    let found = false;
    for (const mod of updated.modules || []) {
      for (const les of mod.lessons || []) {
        if (les.lesson_id === lessonId) {
          les.lesson_title = clean;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      setCourseJson(updated);
      setEditingLessonId(null);
      setEditedLessonTitle('');
      showToast(`Lesson renamed to "${clean}"`);
    }
  };

  // State & handlers for comprehensive Structure & Titles Modal
  const [structureModalData, setStructureModalData] = useState(null);

  const handleOpenStructureModal = () => {
    if (!courseJson) return;
    setStructureModalData({
      courseTitle: courseJson.course_title || '',
      modules: (courseJson.modules || []).map((m) => ({
        module_id: m.module_id,
        module_title: m.module_title,
        lessons: (m.lessons || []).map((l) => ({
          lesson_id: l.lesson_id,
          lesson_title: l.lesson_title,
        })),
      })),
    });
    setShowStructureModal(true);
  };

  const handleSaveAllStructure = (newCourseTitle, updatedModules) => {
    if (!courseJson) return;
    const cleanCourse =
      (newCourseTitle || '').trim() || courseJson.course_title;
    const updated = JSON.parse(JSON.stringify(courseJson));
    const oldTitle = updated.course_title;
    updated.course_title = cleanCourse;

    if (Array.isArray(updatedModules)) {
      updatedModules.forEach((modEdit) => {
        const targetMod = (updated.modules || []).find(
          (m) => m.module_id === modEdit.module_id
        );
        if (targetMod) {
          if (modEdit.module_title) {
            targetMod.module_title = modEdit.module_title.trim();
          }
          if (Array.isArray(modEdit.lessons)) {
            modEdit.lessons.forEach((lesEdit) => {
              const targetLes = (targetMod.lessons || []).find(
                (l) => l.lesson_id === lesEdit.lesson_id
              );
              if (targetLes && lesEdit.lesson_title) {
                targetLes.lesson_title = lesEdit.lesson_title.trim();
              }
            });
          }
        }
      });
    }

    // Synchronize Module 0 and Lesson 0 title slide
    if (updated.modules && updated.modules.length > 0) {
      const firstMod = updated.modules[0];
      if (
        firstMod.module_id === 'mod_0' ||
        firstMod.module_title === oldTitle ||
        updated.modules.length === 1
      ) {
        firstMod.module_title = cleanCourse;
      }
      const firstLesson = firstMod.lessons?.[0];
      if (firstLesson && firstLesson.topics?.length > 0) {
        const firstTopic = firstLesson.topics[0];
        if (
          firstTopic.name === oldTitle ||
          !firstTopic.leftDiv?.editorHtml?.replace(/<[^>]*>/g, '').trim()
        ) {
          firstTopic.name = cleanCourse;
          firstTopic.headingContent = cleanCourse;
        }
      }
    }

    const val = validateCourseJson(updated);
    setCourseJson(updated);
    setValidation(val);
    setCourseTitleOverride(cleanCourse);
    setShowStructureModal(false);
    showToast('Course structure & titles successfully updated!');
  };

  // State & Handlers for Manual Add Slide & Delete Slide
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [addSlideTargetTopicIndex, setAddSlideTargetTopicIndex] = useState(0);
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlidePosition, setNewSlidePosition] = useState('after'); // 'after' | 'before' | 'end'
  const [newSlideContent, setNewSlideContent] = useState('');

  const handleOpenAddSlideModal = (targetIndex) => {
    setAddSlideTargetTopicIndex(targetIndex ?? selectedTopicIndex);
    setNewSlideTitle('');
    setNewSlidePosition('after');
    setNewSlideContent('');
    setShowAddSlideModal(true);
  };

  const handleDeleteTopic = (targetTopicIndex) => {
    if (!courseJson) return;
    const topicToDelete = allTopics[targetTopicIndex];
    if (!topicToDelete) return;

    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Are you sure you want to delete slide "${topicToDelete.name}"? This will renumber subsequent slides and update course duration.`
      )
    ) {
      return;
    }

    const updated = JSON.parse(JSON.stringify(courseJson));
    let found = false;

    for (const mod of updated.modules || []) {
      for (const les of mod.lessons || []) {
        const tIdx = (les.topics || []).findIndex(
          (t) => t.id === topicToDelete.id
        );
        if (tIdx >= 0) {
          les.topics.splice(tIdx, 1);
          // Re-sequence topic IDs in this lesson
          les.topics.forEach((top, idx) => {
            top.id = `${les.lesson_id}_${idx + 1}`.replace(/^les_/, 'top_');
            top.lessonId = les.lesson_id;
            top.moduleId = mod.module_id;
          });
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      // Recalculate duration
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

      const val = validateCourseJson(updated);
      setCourseJson(updated);
      setValidation(val);
      setSelectedTopicIndex((prev) =>
        Math.max(0, Math.min(prev, allTopics.length - 2))
      );
      showToast(`Deleted slide "${topicToDelete.name}" successfully.`);
    }
  };

  const handleExecuteAddSlide = () => {
    if (!courseJson) return;
    const cleanTitle = (newSlideTitle || '').trim() || 'New Topic';
    const referenceTopic = allTopics[addSlideTargetTopicIndex] || allTopics[0];
    if (!referenceTopic) return;

    const updated = JSON.parse(JSON.stringify(courseJson));
    let foundLesson = null;
    let foundMod = null;
    let foundTIdx = -1;

    for (const mod of updated.modules || []) {
      for (const les of mod.lessons || []) {
        const idx = (les.topics || []).findIndex(
          (t) => t.id === referenceTopic.id
        );
        if (idx >= 0) {
          foundLesson = les;
          foundMod = mod;
          foundTIdx = idx;
          break;
        }
      }
      if (foundLesson) break;
    }

    if (!foundLesson) return;

    const formattedContent = newSlideContent.trim()
      ? wrapInLmsContainer(newSlideContent.trim())
      : '<div class="lms-content"><p>' + cleanTitle + ' content...</p></div>';

    const newTopic = {
      id: `${foundLesson.lesson_id}_new`,
      name: cleanTitle,
      headingContent: cleanTitle,
      selectedTemplate: 1,
      lessonId: foundLesson.lesson_id,
      moduleId: foundMod.module_id,
      slide_type: 'content',
      allocated_duration_seconds: 30,
      topicDuration: 30,
      image_source: '',
      image_code: '',
      image_prompt: '',
      has_embedded_image: false,
      datatime: '0',
      captions: [],
      narration_script: '',
      leftDiv: {
        audio: { isAudio: false, audioURL: '', audioFile: '', audioName: '' },
        image: { isImage: false, imageURL: '', imageFile: '', imageName: '' },
        video: { isVideo: false, videoURL: '', videoFile: '', videoName: '' },
        width: 'col-12',
        editor: formattedContent,
        editorHtml: formattedContent,
        editorSaved: formattedContent,
        editorHtmlSaved: formattedContent,
        captureTime: [],
        mediaDuration: 0,
        isEditorSelected: false,
        mediaCurrentTime: 0,
      },
      rightDiv: {
        audio: { isAudio: false, audioURL: '', audioFile: '', audioName: '' },
        image: { isImage: false, imageURL: '', imageFile: '', imageName: '' },
        video: { isVideo: false, videoURL: '', videoFile: '', videoName: '' },
        width: 'col-12',
        editor: '',
        editorHtml: '',
        editorSaved: '',
        editorHtmlSaved: '',
        captureTime: [],
        mediaDuration: 0,
        isEditorSelected: false,
        mediaCurrentTime: 0,
      },
    };

    if (newSlidePosition === 'before') {
      foundLesson.topics.splice(foundTIdx, 0, newTopic);
    } else if (newSlidePosition === 'end') {
      foundLesson.topics.push(newTopic);
    } else {
      // 'after'
      foundLesson.topics.splice(foundTIdx + 1, 0, newTopic);
    }

    // Re-sequence topic IDs in lesson
    foundLesson.topics.forEach((top, idx) => {
      top.id = `${foundLesson.lesson_id}_${idx + 1}`.replace(/^les_/, 'top_');
      top.lessonId = foundLesson.lesson_id;
      top.moduleId = foundMod.module_id;
    });

    // Recalculate duration
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

    const val = validateCourseJson(updated);
    setCourseJson(updated);
    setValidation(val);
    setShowAddSlideModal(false);

    // Find the new global index of the inserted topic
    const newAllTopics = (updated.modules || []).flatMap((m) =>
      (m.lessons || []).flatMap((l) => l.topics || [])
    );
    const newIdx = newAllTopics.findIndex((t) => t.name === cleanTitle);
    if (newIdx >= 0) setSelectedTopicIndex(newIdx);

    showToast(`Added new slide "${cleanTitle}" successfully!`);
  };

  const handleRenameSlide = (targetTopicIndex, newName) => {
    if (!courseJson) return;
    const clean = (newName || '').trim();
    if (!clean) return;
    const targetTopic = allTopics[targetTopicIndex];
    if (!targetTopic) return;

    const updated = JSON.parse(JSON.stringify(courseJson));
    let found = false;
    for (const mod of updated.modules || []) {
      for (const les of mod.lessons || []) {
        const top = (les.topics || []).find((t) => t.id === targetTopic.id);
        if (top) {
          top.name = clean;
          top.headingContent = clean;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      const val = validateCourseJson(updated);
      setCourseJson(updated);
      setValidation(val);
      showToast(`Slide renamed to "${clean}"`);
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

  const isCurrentTopicDuplicate = useMemo(() => {
    if (!validation?.duplicateSlideAlerts || !activeTopic) return false;
    return validation.duplicateSlideAlerts.some(
      (d) =>
        d.topicId === activeTopic.id ||
        (d.topicName?.toLowerCase() === activeTopic.name?.toLowerCase() &&
          d.lessonId === activeTopic.lessonId)
    );
  }, [validation?.duplicateSlideAlerts, activeTopic]);

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
    const hasTailwind =
      baseHtml.includes('bg-[') ||
      baseHtml.includes('text-[') ||
      baseHtml.includes('grid') ||
      baseHtml.includes('flex') ||
      baseHtml.includes('rounded-') ||
      baseHtml.includes('bg-') ||
      baseHtml.includes('#EEF1F4') ||
      baseHtml.includes('#E8761C') ||
      baseHtml.includes('pptx-') ||
      baseHtml.includes('style=');

    if (!includeImages) {
      return wrapInLmsContainer(baseHtml, {
        stripImages: true,
        preserveTailwind: hasTailwind,
      });
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

    const hasTailwind =
      editedTopicHtml.includes('bg-[') ||
      editedTopicHtml.includes('text-[') ||
      editedTopicHtml.includes('grid') ||
      editedTopicHtml.includes('flex') ||
      editedTopicHtml.includes('rounded-') ||
      editedTopicHtml.includes('bg-');

    const sanitizedHtml = wrapInLmsContainer(editedTopicHtml, {
      stripImages: !includeImages,
      preserveTailwind: hasTailwind,
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
        if (res.validation?.duplicateSlideAlerts?.length > 0) {
          setActiveTab('hierarchy');
          const firstDup = res.validation.duplicateSlideAlerts[0];
          const flatTops = (res.courseJson.modules || []).flatMap((m) =>
            (m.lessons || []).flatMap((l) => l.topics || [])
          );
          const dupIdx = flatTops.findIndex(
            (t) =>
              t.id === firstDup.topicId ||
              (t.name?.trim().toLowerCase() ===
                firstDup.topicName?.trim().toLowerCase() &&
                t.lessonId === firstDup.lessonId)
          );
          setSelectedTopicIndex(dupIdx >= 0 ? dupIdx : 0);
        } else {
          setSelectedTopicIndex(0);
        }
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

    // Direct JSON and PPT upload always loads via handleSingleFileUpload
    if (/\.(json|pptx|ppt)$/i.test(selectedFile.name)) {
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

      // Detect separate Introduction and Learning Objectives slides in numbered lessons
      const separateCandidates = detectSeparateIntroAndObjectives(
        res.courseJson
      );
      if (separateCandidates.length > 0) {
        setPendingMergeCandidates(separateCandidates);
        setPendingMergeCourse(res.courseJson);
        setShowMergeIntroModal(true);
      }
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
    <div className="w-full max-w-[1600px] mx-auto space-y-6 py-6 px-4 sm:px-6 lg:px-8">
      {/* Hidden file inputs available globally across full-width studio */}
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
        accept=".docx,.doc,.pdf,.json,.pptx,.ppt"
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
        accept=".docx,.doc,.pdf,.pptx,.ppt"
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
        accept=".docx,.doc,.pdf,.pptx,.ppt"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files[0]) handleSmartFileUpload(files[0]);
          e.target.value = '';
        }}
      />

      {/* Header & Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          {courseJson ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileCode className="h-6 w-6" />
                </span>

                {isEditingCourseTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedCourseTitle}
                      onChange={(e) => setEditedCourseTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.isComposing || e.keyCode === 229) return;
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUpdateCourseTitle(editedCourseTitle);
                        } else if (e.key === 'Escape') {
                          setIsEditingCourseTitle(false);
                        }
                      }}
                      className="h-9 text-lg sm:text-xl font-bold w-64 sm:w-96"
                      placeholder="Enter course name..."
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-9 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      onClick={() => handleUpdateCourseTitle(editedCourseTitle)}
                      title="Save Course Name"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-2 text-slate-500"
                      onClick={() => setIsEditingCourseTitle(false)}
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="group flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      setEditedCourseTitle(courseJson.course_title || '');
                      setIsEditingCourseTitle(true);
                    }}
                    title="Click to rename course"
                  >
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {courseJson.course_title || 'Untitled Course'}
                    </h1>
                    <span className="p-1 rounded-md text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </span>
                  </div>
                )}

                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-mono"
                >
                  {courseJson.course_id || 'course_1'}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                <span>{courseJson.modules?.length || 0} Modules</span>
                <span>•</span>
                <span>{allLessons.length} Total Lessons</span>
                <span>•</span>
                <span>{allTopics.length} Slides</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">
                  100% Valid LMS Schema
                </span>
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileCode className="h-6 w-6" />
                </span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  LMS Course Studio &amp; Normalizer
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  Production Ready
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Batch convert full course folders, standalone lessons (.docx /
                .pdf), or sanitize raw JSON into verified LMS schemas with
                14-point audit validation.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {courseJson && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenStructureModal}
              className="gap-1.5 text-xs font-semibold border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 shadow-2xs"
              title="Edit Course Name, Module Names, and Lesson Names in one place"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Structure &amp; Titles
            </Button>
          )}

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
                onClick={handleCopy}
                className="gap-1.5 text-xs font-semibold"
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
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
              >
                <Download className="h-4 w-4" />
                Download Complete JSON
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                title="Reset workspace and convert another course"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Course
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

      {/* Launchpad: When no course is loaded yet */}
      {!courseJson && (
        <div className="w-full space-y-6">
          {/* Pre-flight Configuration & Hero Strip */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/50 dark:from-slate-900/90 dark:via-slate-900 dark:to-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />{' '}
                  Professional Course Studio &amp; LMS Normalizer
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Import or Generate Full Course JSON
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  Select a multi-module folder, Word / PDF syllabus documents,
                  or paste existing course JSON. Everything is sanitized into
                  single parent &lt;div&gt; containers, auto-sequenced, and
                  validated with 100% schema compliance.
                </p>
              </div>

              {/* Pre-flight Switch Controls (Images & Quizzes) */}
              <div className="flex flex-wrap items-center gap-3 bg-white/80 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                {/* Images Toggle */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Images &amp; Media
                  </span>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleImages(false)}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all font-semibold',
                        !includeImages
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      🚫 Images OFF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleImages(true)}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all font-semibold',
                        includeImages
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      🖼️ Images ON
                    </button>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                {/* Quizzes Toggle */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Assessments
                  </span>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleQuizzes(true)}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all font-semibold',
                        includeQuizzes
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      📝 Quizzes ON
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleQuizzes(false)}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all font-semibold',
                        !includeQuizzes
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      🚫 Quizzes OFF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Modern Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Course Folder */}
            <Card
              onClick={() => folderInputRef.current?.click()}
              className="border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 cursor-pointer transition-all shadow-2xs group relative overflow-hidden"
            >
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      Upload Course Folder
                      <ChevronRight className="h-4 w-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Select a root course directory containing Module folders
                      and Lesson files (.docx, .pdf). Maintains sequential
                      lesson numbering across modules.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                >
                  <FolderOpen className="h-4 w-4 mr-1.5" />
                  Select Folder
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: Single / Full Document */}
            <Card
              onClick={() => fileInputRef.current?.click()}
              className="border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 cursor-pointer transition-all shadow-2xs group relative overflow-hidden"
            >
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      PowerPoint / Word / PDF
                      <ChevronRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Upload a PowerPoint presentation (.pptx), Word lesson
                      (.docx), or PDF. Generates responsive Tailwind layouts,
                      organizes modules & lessons, and extracts assessments.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Select Document
                </Button>
              </CardContent>
            </Card>

            {/* Card 3: Enhance & Clean Course JSON */}
            <Card
              onClick={() => setShowEnhanceModal(true)}
              className="border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20 cursor-pointer transition-all shadow-2xs group relative overflow-hidden"
            >
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      Paste or Upload JSON
                      <ChevronRight className="h-4 w-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Paste raw LMS course JSON or upload a .json file. Formats
                      Module 0, enforces continuous lesson sequences, validates
                      duplicate titles, and checks HTML cleanliness.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-colors"
                >
                  <Code className="h-4 w-4 mr-1.5" />
                  Paste / Upload JSON
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Full-Width Universal Drag-and-Drop Dropzone */}
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
                (scanned.length === 1 && scanned[0].relativePath.includes('/'))
              ) {
                await handleFolderUpload(scanned);
              } else if (scanned.length === 1) {
                if (mode === 'folder' && !courseJson) {
                  setMode('A');
                }
                await handleSmartFileUpload(scanned[0].file);
              }
            }}
            className={cn(
              'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 select-none',
              isDragging
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-blue-500/20 scale-[1.005]'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                <Upload className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Drag and drop your Course Folder, PowerPoint (.pptx), Word
                  (.docx), PDF, or JSON here
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports PowerPoint presentations with responsive Tailwind
                  layouts, folder drops for batch conversion, Word docs, and LMS
                  JSON files.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                  }}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 shadow-xs"
                >
                  <Folder className="h-3.5 w-3.5" />
                  Upload Course Folder
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Upload Document
                </Button>
              </div>
            </div>
          </div>

          {/* Progress State when processing from launchpad */}
          {isProcessing && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
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

          {/* Error Message when on launchpad */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Full-Width Course Studio: Active when a course is loaded */}
      {courseJson && (
        <div className="w-full space-y-6">
          {/* Dashboard Metrics */}
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
                    {validation?.summary?.passed ?? 15}/
                    {validation?.summary?.total ?? 15} Checks Pass
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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
                    'px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 relative',
                    activeTab === 'hierarchy'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Topics ({allTopics.length})
                  {validation?.duplicateSlideAlerts?.length > 0 && (
                    <span
                      className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse shadow-xs"
                      title={`${validation.duplicateSlideAlerts.length} duplicate slide title(s) detected`}
                    >
                      {validation.duplicateSlideAlerts.length}
                    </span>
                  )}
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
                  Validation ({validation?.summary?.passed ?? 15}/
                  {validation?.summary?.total ?? 15})
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

            {/* Tab 0: Modules & Lessons Hierarchy Manager */}
            {activeTab === 'lessons' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <ListOrdered className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Course Modules &amp; Sequential Lessons</span>
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          {allLessons.length} Total Lessons
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
                        >
                          {courseJson.modules?.length || 0} Modules
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Edit Course Name, Module Names, and Lesson Names
                        directly below or use the Structure Manager. Drag and
                        drop lessons to re-sequence.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenStructureModal}
                      variant="outline"
                      className="h-8 text-xs font-semibold gap-1.5 border-blue-300 text-blue-700 dark:text-blue-300 bg-blue-50/50 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Structure &amp; Titles
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => lessonAddInputRef.current?.click()}
                      className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    >
                      <FilePlus className="h-3.5 w-3.5" />
                      Add Another Lesson
                    </Button>
                  </div>
                </div>

                {/* Modules Grouped Deck */}
                <div className="space-y-4">
                  {(courseJson.modules || []).map((mod, mIdx) => {
                    const isEditingThisMod = editingModuleId === mod.module_id;
                    return (
                      <div
                        key={mod.module_id || mIdx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-2xs"
                      >
                        {/* Module Header Bar */}
                        <div className="p-3.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <Badge
                              variant="outline"
                              className="text-xs font-bold font-mono bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 shrink-0"
                            >
                              {mod.module_id}
                            </Badge>

                            {isEditingThisMod ? (
                              <div className="flex items-center gap-1.5 flex-1 max-w-md">
                                <Input
                                  value={editedModuleTitle}
                                  onChange={(e) =>
                                    setEditedModuleTitle(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.isComposing || e.keyCode === 229)
                                      return;
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleUpdateModuleTitle(
                                        mod.module_id,
                                        editedModuleTitle
                                      );
                                    } else if (e.key === 'Escape') {
                                      setEditingModuleId(null);
                                    }
                                  }}
                                  className="h-8 text-xs font-bold"
                                  placeholder="Enter module name..."
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                  onClick={() =>
                                    handleUpdateModuleTitle(
                                      mod.module_id,
                                      editedModuleTitle
                                    )
                                  }
                                  title="Save Module Name"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-slate-500 shrink-0"
                                  onClick={() => setEditingModuleId(null)}
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {mod.module_title}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingModuleId(mod.module_id);
                                    setEditedModuleTitle(mod.module_title);
                                  }}
                                  className="h-6 px-1.5 text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 gap-1 rounded"
                                  title="Rename this module"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span className="text-[11px]">Rename</span>
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                            <span>{(mod.lessons || []).length} Lessons</span>
                            <span>•</span>
                            <span>
                              {mod.lessons?.reduce(
                                (acc, l) => acc + (l.topics?.length || 0),
                                0
                              )}{' '}
                              Topics
                            </span>
                          </div>
                        </div>

                        {/* Lessons in this Module */}
                        <div className="p-3 space-y-2">
                          {(mod.lessons || []).map((les) => {
                            const globalIdx = allLessons.findIndex(
                              (l) => l.lesson_id === les.lesson_id
                            );
                            const isEditingThisLesson =
                              editingLessonId === les.lesson_id;
                            return (
                              <div
                                key={les.lesson_id || globalIdx}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    'text/plain',
                                    String(globalIdx)
                                  );
                                  setDraggedLessonIndex(globalIdx);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDragOverLessonIndex(globalIdx);
                                }}
                                onDragLeave={() => {
                                  if (dragOverLessonIndex === globalIdx)
                                    setDragOverLessonIndex(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (
                                    draggedLessonIndex !== null &&
                                    draggedLessonIndex !== globalIdx
                                  ) {
                                    handleReorderLesson(
                                      draggedLessonIndex,
                                      globalIdx
                                    );
                                  }
                                  setDraggedLessonIndex(null);
                                  setDragOverLessonIndex(null);
                                }}
                                className={cn(
                                  'p-3 rounded-xl border transition-all flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40 shadow-2xs',
                                  dragOverLessonIndex === globalIdx
                                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/30 scale-[1.01]'
                                    : 'border-slate-200 dark:border-slate-800'
                                )}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>

                                  <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                                    {les.lesson_title
                                      .toLowerCase()
                                      .includes('introduction')
                                      ? '0'
                                      : globalIdx >= 0
                                        ? globalIdx + 1
                                        : '•'}
                                  </span>

                                  {isEditingThisLesson ? (
                                    <div className="flex items-center gap-1.5 flex-1 max-w-md">
                                      <Input
                                        value={editedLessonTitle}
                                        onChange={(e) =>
                                          setEditedLessonTitle(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                          if (
                                            e.isComposing ||
                                            e.keyCode === 229
                                          )
                                            return;
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleUpdateLessonTitle(
                                              les.lesson_id,
                                              editedLessonTitle
                                            );
                                          } else if (e.key === 'Escape') {
                                            setEditingLessonId(null);
                                          }
                                        }}
                                        className="h-7 text-xs font-medium"
                                        placeholder="Enter lesson title..."
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                        onClick={() =>
                                          handleUpdateLessonTitle(
                                            les.lesson_id,
                                            editedLessonTitle
                                          )
                                        }
                                        title="Save Lesson Title"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-slate-500 shrink-0"
                                        onClick={() => setEditingLessonId(null)}
                                        title="Cancel"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                          {les.lesson_title}
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingLessonId(les.lesson_id);
                                            setEditedLessonTitle(
                                              les.lesson_title
                                            );
                                          }}
                                          className="h-5 w-5 p-0 text-slate-400 hover:text-blue-600 rounded opacity-60 hover:opacity-100"
                                          title="Rename lesson"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                                        <span>
                                          {les.topics?.length || 0} Topics
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {les.knowledge_check?.length || 0}{' '}
                                          Quiz Questions
                                        </span>
                                        <span>•</span>
                                        <span className="font-mono">
                                          ID: {les.lesson_id}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const firstTopicId = les.topics?.[0]?.id;
                                      if (firstTopicId) {
                                        const foundIndex = allTopics.findIndex(
                                          (t) => t.id === firstTopicId
                                        );
                                        if (foundIndex >= 0)
                                          setSelectedTopicIndex(foundIndex);
                                      }
                                      setActiveTab('hierarchy');
                                    }}
                                    className="h-7 px-2 text-[11px] font-medium text-slate-600 hover:text-blue-600 border-slate-200 dark:border-slate-800 gap-1 rounded-md"
                                    title="Inspect Topics & Slides for this Lesson"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span className="hidden sm:inline">
                                      Slides
                                    </span>
                                  </Button>

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={globalIdx <= 0}
                                    onClick={() =>
                                      handleMoveLessonUp(globalIdx)
                                    }
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                                    title="Move Up"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={
                                      globalIdx >= allLessons.length - 1
                                    }
                                    onClick={() =>
                                      handleMoveLessonDown(globalIdx)
                                    }
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                                    title="Move Down"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleDeleteLesson(les.lesson_id)
                                    }
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                                    title="Remove Lesson"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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
                          {group.topics.map((t) => {
                            const isDup =
                              validation?.duplicateSlideAlerts?.some(
                                (d) =>
                                  d.topicId === t.id ||
                                  (d.lessonId === t.lessonId &&
                                    d.topicIndex === t.topicIndex)
                              );
                            return (
                              <option
                                key={t.id || t.globalIndex}
                                value={t.globalIndex}
                                className={
                                  isDup ? 'text-red-600 font-bold' : ''
                                }
                              >
                                {isDup ? '⚠️ ' : ''}Topic {t.globalIndex + 1}:{' '}
                                {t.name}
                                {isDup ? ' [Duplicate Title]' : ''}
                              </option>
                            );
                          })}
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
                      disabled={selectedTopicIndex >= filteredTopics.length - 1}
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

                    {/* Add Slide Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleOpenAddSlideModal(selectedTopicIndex)
                      }
                      className="h-7 text-xs font-semibold gap-1 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      title="Add a new slide anywhere in this lesson"
                    >
                      <Plus className="h-3.5 w-3.5 text-blue-600" />
                      Add Slide
                    </Button>

                    {/* Delete Slide Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTopic(selectedTopicIndex)}
                      className="h-7 text-xs font-semibold gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-800"
                      title="Delete this slide from the course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Slide
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
                          {/* Add Slide Button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleOpenAddSlideModal(selectedTopicIndex)
                            }
                            className="h-7 text-xs font-semibold gap-1 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Add a new slide anywhere in this lesson"
                          >
                            <Plus className="h-3.5 w-3.5 text-blue-600" />
                            Add Slide
                          </Button>

                          {/* Delete Slide Button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeleteTopic(selectedTopicIndex)
                            }
                            className="h-7 text-xs font-semibold gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-800"
                            title="Delete this slide from the course"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Slide
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

                      {/* Duplicate Slide Warning Banner */}
                      {isCurrentTopicDuplicate && (
                        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900 dark:text-red-200 mb-3 animate-in fade-in">
                          <div className="flex items-center gap-2.5">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                            <div>
                              <div className="font-bold">
                                Duplicate Slide Title Detected: &ldquo;
                                {activeTopic.name}&rdquo;
                              </div>
                              <div className="text-[11px] text-red-700 dark:text-red-300 mt-0.5">
                                This slide shares the exact same name with
                                another slide in this lesson. You can rename it
                                or delete this duplicate.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsEditingTopic(true);
                                setEditedTopicName(activeTopic.name || '');
                                setEditedTopicHtml(
                                  activeTopic.leftDiv?.editorHtml || ''
                                );
                              }}
                              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Rename Slide
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                handleDeleteTopic(selectedTopicIndex)
                              }
                              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete Duplicate Slide
                            </Button>
                          </div>
                        </div>
                      )}

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
                                Updates name &amp; headingContent in Course JSON
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
                          {includeImages &&
                          !displayedTopicHtml.includes('<img') &&
                          activeTopic?.selectedTemplate === 1 &&
                          activeTopic?.rightDiv?.image?.isImage ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                              <div
                                className={cn(
                                  'max-w-none text-slate-700 dark:text-slate-300',
                                  !displayedTopicHtml.includes('bg-[') &&
                                    !displayedTopicHtml.includes('grid') &&
                                    !displayedTopicHtml.includes('#EEF1F4') &&
                                    !displayedTopicHtml.includes('pptx-') &&
                                    !displayedTopicHtml.includes('style=') &&
                                    'prose prose-sm dark:prose-invert'
                                )}
                                dangerouslySetInnerHTML={{
                                  __html: displayedTopicHtml,
                                }}
                              />
                              <div
                                className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-[#EEF1F4] dark:bg-slate-800 shadow-xs flex items-center justify-center p-2"
                                style={{ backgroundColor: '#EEF1F4' }}
                              >
                                <img
                                  src={activeTopic.rightDiv.image.imageURL}
                                  alt={
                                    activeTopic.rightDiv.image.imageName ||
                                    'Slide Illustration'
                                  }
                                  className="w-full h-auto object-cover max-h-80 rounded-xl"
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                'max-w-none text-slate-700 dark:text-slate-300',
                                !displayedTopicHtml.includes('bg-[') &&
                                  !displayedTopicHtml.includes('grid') &&
                                  !displayedTopicHtml.includes('#EEF1F4') &&
                                  !displayedTopicHtml.includes('pptx-') &&
                                  !displayedTopicHtml.includes('style=') &&
                                  'prose prose-sm dark:prose-invert'
                              )}
                              dangerouslySetInnerHTML={{
                                __html: displayedTopicHtml,
                              }}
                            />
                          )}
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
                              {courseJson.final_exam.questions.length} Questions
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
                            Edit to modify questions, options, or explanations.
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
                                onClick={() => handleOpenEditQuestion(q, true)}
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
                          Upload your Word document (.docx) or PDF, or paste the
                          exam questions directly. It will be seamlessly merged
                          into this course!
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
                    Full LMS Course Payload ({JSON.stringify(courseJson).length}{' '}
                    bytes)
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
        </div>
      )}

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

      {/* Modal: Comprehensive Course Structure & Titles Editor */}
      <Dialog open={showStructureModal} onOpenChange={setShowStructureModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Edit Course Structure &amp; Titles
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
            {/* Course Title Field */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
              <label className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                Course Title
              </label>
              <Input
                value={structureModalData?.courseTitle || ''}
                onChange={(e) =>
                  setStructureModalData((prev) => ({
                    ...prev,
                    courseTitle: e.target.value,
                  }))
                }
                className="bg-white dark:bg-slate-900 font-semibold text-sm"
                placeholder="Course title..."
              />
              <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                Renaming the course also updates Module 0 and Lesson 0&apos;s
                empty title slide automatically.
              </p>
            </div>

            {/* Modules & Lessons Hierarchy */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Modules &amp; Lessons</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {structureModalData?.modules?.length || 0} Modules
                </span>
              </div>

              {structureModalData?.modules?.map((mod, mIdx) => (
                <div
                  key={mod.module_id || mIdx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      Module {mIdx}:
                    </span>
                    <Input
                      value={mod.module_title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStructureModalData((prev) => {
                          const newMods = [...prev.modules];
                          newMods[mIdx].module_title = val;
                          return { ...prev, modules: newMods };
                        });
                      }}
                      className="h-8 text-xs font-medium"
                      placeholder="Module title..."
                    />
                  </div>

                  <div className="space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                    {mod.lessons?.map((les, lIdx) => (
                      <div
                        key={les.lesson_id || lIdx}
                        className="flex items-center gap-2"
                      >
                        <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-400">
                          L{lIdx}
                        </span>
                        <Input
                          value={les.lesson_title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStructureModalData((prev) => {
                              const newMods = [...prev.modules];
                              newMods[mIdx].lessons[lIdx].lesson_title = val;
                              return { ...prev, modules: newMods };
                            });
                          }}
                          className="h-7 text-xs"
                          placeholder="Lesson title..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowStructureModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!structureModalData) return;
                handleSaveAllStructure(
                  structureModalData.courseTitle,
                  structureModalData.modules
                );
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
            >
              <Save className="h-4 w-4" />
              Save All Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Slide Dialog */}
      <Dialog open={showAddSlideModal} onOpenChange={setShowAddSlideModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Slide to Lesson
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Reference Topic Info */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
              <div className="font-semibold text-blue-950 dark:text-blue-100">
                Target Lesson:{' '}
                {allTopics[addSlideTargetTopicIndex]?.lessonTitle ||
                  'Current Lesson'}
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-300">
                Current Reference Slide: Topic {addSlideTargetTopicIndex + 1}:
                &ldquo;{allTopics[addSlideTargetTopicIndex]?.name}&rdquo;
              </div>
            </div>

            {/* Slide Title */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Slide Title / Heading:
              </label>
              <Input
                value={newSlideTitle}
                onChange={(e) => setNewSlideTitle(e.target.value)}
                placeholder="e.g. System Configuration & Safety Procedures"
                className="h-8 text-xs"
                autoFocus
              />
            </div>

            {/* Placement Position */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Placement:
              </label>
              <select
                value={newSlidePosition}
                onChange={(e) => setNewSlidePosition(e.target.value)}
                className="w-full h-8 text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 bg-background text-foreground"
              >
                <option value="after">
                  After current slide (as Slide {addSlideTargetTopicIndex + 2})
                </option>
                <option value="before">
                  Before current slide (as Slide {addSlideTargetTopicIndex + 1})
                </option>
                <option value="end">At the end of this lesson</option>
              </select>
            </div>

            {/* Slide Content */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Slide Content (HTML or plain text paragraph):
              </label>
              <Textarea
                rows={4}
                value={newSlideContent}
                onChange={(e) => setNewSlideContent(e.target.value)}
                placeholder="Enter slide instructional content, bullet points, or instructions..."
                className="text-xs"
              />
              <span className="text-[10px] text-slate-500">
                Auto-wrapped into standard LMS single parent container. Leave
                blank for default template content.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddSlideModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteAddSlide}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Slide
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
