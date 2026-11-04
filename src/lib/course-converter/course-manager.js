/**
 * course-manager.js
 *
 * Provides operations for:
 * 1. Merging & parsing final exams into existing courses.
 * 2. Adding additional lessons to existing courses with position selection.
 * 3. Dragging / reordering lessons with automatic sequential renumbering (e.g. Lesson 1 -> Lesson 6).
 * 4. Editing quizzes and final exam questions, including selecting the correct answer.
 */

import { parseQuizFromHtml } from './quiz-extractor.js';
import { ensureLessonNumberPrefix } from './folder-converter.js';
import { validateCourseJson } from './validator.js';

/**
 * Recalculates total slide seconds, knowledge check seconds, final exam seconds, and durations.
 *
 * @param {object} course - Master Course JSON object (mutates or cloned)
 * @returns {object} Updated course object
 */
export function recalculateCourseDurations(course) {
  if (!course || !Array.isArray(course.modules)) return course;

  let totalSlidesSeconds = 0;
  let totalKcSeconds = 0;
  const lessonsDurationArray = [];
  let totalTopics = 0;

  course.modules.forEach((mod) => {
    (mod.lessons || []).forEach((les) => {
      let lesSlideSec = 0;
      (les.topics || []).forEach((top) => {
        totalTopics += 1;
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

  const finalExamSeconds = (course.final_exam?.questions?.length || 0) * 60;
  const grandTotal = totalSlidesSeconds + totalKcSeconds + finalExamSeconds;

  course.total_modules = course.modules.length;
  course.total_topics = totalTopics;
  course.total_duration_seconds = grandTotal;
  course.planned_duration_seconds = grandTotal;

  if (!course.duration) {
    course.duration = {};
  }
  course.duration.total_seconds = grandTotal;
  course.duration.slides_seconds = totalSlidesSeconds;
  course.duration.knowledge_check_seconds = totalKcSeconds;
  course.duration.final_exam_seconds = finalExamSeconds;
  course.duration.basis = 'reading';
  course.duration.lessons = lessonsDurationArray;

  return course;
}

/**
 * Parses raw text or HTML into a structured Course Final Exam object.
 * Supports patterns like:
 * Final Exam
 * Question 1
 * Which of the following is ...
 * A. Intentionally submitting false claims (correct)
 * B. Occasionally missing documentation
 * Explanation: ...
 *
 * @param {string} textOrHtml - Raw text or Mammoth HTML
 * @param {object} [options={}] - Optional metadata (title, passingScore, timeLimit)
 * @returns {object} Structured Final Exam object
 */
export function parseFinalExamFromTextOrHtml(textOrHtml, options = {}) {
  if (!textOrHtml || typeof textOrHtml !== 'string') {
    throw new Error(
      'Valid text or HTML content is required to parse Final Exam.'
    );
  }

  // Detect and extract title if present in text
  let detectedTitle = options.title || '';
  const firstLine = textOrHtml
    .split('\n')[0]
    .replace(/<[^>]*>/g, '')
    .trim();
  if (
    !detectedTitle &&
    /(?:final\s*exam|comprehensive\s*exam)/i.test(firstLine)
  ) {
    detectedTitle = firstLine;
  }

  const questions = parseQuizFromHtml(textOrHtml, 'fe_q');

  if (questions.length === 0) {
    throw new Error(
      'No exam questions could be parsed from the provided document/text.'
    );
  }

  return {
    id: options.id || 'final_exam',
    title: detectedTitle || 'Comprehensive Final Exam',
    passingScore: Number(options.passingScore) || 80,
    timeLimit:
      Number(options.timeLimit) || Math.max(1800, questions.length * 120),
    questionCount: questions.length,
    questions,
  };
}

/**
 * Merges a final exam object into an existing Course JSON.
 *
 * @param {object} courseJson - Current Course JSON
 * @param {object} finalExamObj - Structured Final Exam object
 * @returns {{ courseJson: object, validation: object }}
 */
export function mergeFinalExamIntoCourse(courseJson, finalExamObj) {
  if (!courseJson) {
    throw new Error('Course JSON is required to merge Final Exam.');
  }
  if (!finalExamObj || !Array.isArray(finalExamObj.questions)) {
    throw new Error('Valid Final Exam object with questions is required.');
  }

  const updated = JSON.parse(JSON.stringify(courseJson));
  updated.final_exam = {
    id: finalExamObj.id || 'final_exam',
    title: finalExamObj.title || 'Comprehensive Final Exam',
    passingScore: Number(finalExamObj.passingScore) || 80,
    timeLimit:
      Number(finalExamObj.timeLimit) ||
      Math.max(1800, finalExamObj.questions.length * 120),
    questionCount: finalExamObj.questions.length,
    questions: finalExamObj.questions,
  };

  recalculateCourseDurations(updated);
  const validation = validateCourseJson(updated);

  return { courseJson: updated, validation };
}

/**
 * Sequentially renumbers all lessons across a module or course:
 * - Updates lesson titles (e.g. Lesson 1: ..., Lesson 2: ..., Lesson 6: ...)
 * - Updates lesson IDs (`les_{modNum}_{lesNum}`)
 * - Updates topic IDs (`top_{modNum}_{lesNum}_{tNum}`) and topic lessonIds
 * - Updates knowledge check question IDs
 *
 * @param {object} courseJson
 * @returns {object} Updated courseJson
 */
export function renumberAllLessons(courseJson) {
  if (!courseJson || !Array.isArray(courseJson.modules)) return courseJson;

  let globalLessonCounter = 1;

  courseJson.modules.forEach((mod, mIdx) => {
    const isMod0 =
      mod.module_id === 'mod_0' || /^module\s*0\b/i.test(mod.module_title);
    const modNum = isMod0
      ? 0
      : mIdx + (courseJson.modules[0]?.module_id === 'mod_0' ? 0 : 1);

    (mod.lessons || []).forEach((les, lIdx) => {
      const isLes0 = isMod0 && lIdx === 0;
      const currentLesNum = isLes0 ? 0 : globalLessonCounter++;

      les.lesson_title = isLes0
        ? 'Introduction'
        : ensureLessonNumberPrefix(les.lesson_title, currentLesNum);

      const newLessonId = `les_${modNum}_${currentLesNum}`;
      les.lesson_id = newLessonId;

      (les.topics || []).forEach((top, tIdx) => {
        top.lessonId = newLessonId;
        top.moduleId = mod.module_id;
        top.id = `top_${modNum}_${currentLesNum}_${tIdx + 1}`;
        if (!top.headingContent)
          top.headingContent = top.name || `Topic ${tIdx + 1}`;
        if (!top.name) top.name = top.headingContent;
        if (!top.selectedTemplate) top.selectedTemplate = 1;
        if (!top.slide_type) top.slide_type = 'content';
        if (!top.leftDiv) top.leftDiv = {};
        if (!top.leftDiv.editorHtml && top.leftDiv.editor)
          top.leftDiv.editorHtml = top.leftDiv.editor;
        if (!top.leftDiv.editor && top.leftDiv.editorHtml)
          top.leftDiv.editor = top.leftDiv.editorHtml;
        if (!top.rightDiv) {
          top.rightDiv = {
            audio: {
              isAudio: false,
              audioURL: '',
              audioFile: '',
              audioName: '',
            },
            image: {
              isImage: false,
              imageURL: '',
              imageFile: '',
              imageName: '',
            },
            video: {
              isVideo: false,
              videoURL: '',
              videoFile: '',
              videoName: '',
            },
            width: 'col-12',
            editor: '',
            editorHtml: '',
            editorSaved: '',
            editorHtmlSaved: '',
            captureTime: [],
            mediaDuration: 0,
            isEditorSelected: false,
            mediaCurrentTime: 0,
          };
        }
      });

      (les.knowledge_check || []).forEach((q, qIdx) => {
        q.question_id = `q_${modNum}_${currentLesNum}_${qIdx + 1}`;
      });
    });
  });

  recalculateCourseDurations(courseJson);
  return courseJson;
}

/**
 * Reorders lessons within a module, or moves a lesson from one index to another,
 * and automatically updates all lesson numbering (e.g., Lesson 1 -> Lesson 6).
 *
 * @param {object} courseJson
 * @param {string} moduleId - Target module ID (or null for first module)
 * @param {number} fromIndex - Original index of the lesson
 * @param {number} toIndex - Destination index of the lesson
 * @returns {{ courseJson: object, validation: object }}
 */
export function reorderLessonsInCourse(
  courseJson,
  moduleId,
  fromIndex,
  toIndex
) {
  if (!courseJson || !Array.isArray(courseJson.modules)) {
    throw new Error('Course JSON with modules is required.');
  }

  const updated = JSON.parse(JSON.stringify(courseJson));
  const targetModule = moduleId
    ? updated.modules.find((m) => m.module_id === moduleId)
    : updated.modules[0];

  if (!targetModule || !Array.isArray(targetModule.lessons)) {
    throw new Error(`Module ${moduleId || '0'} not found or has no lessons.`);
  }

  const lessons = targetModule.lessons;
  if (
    fromIndex < 0 ||
    fromIndex >= lessons.length ||
    toIndex < 0 ||
    toIndex >= lessons.length
  ) {
    throw new Error(
      `Invalid lesson indices: from ${fromIndex} to ${toIndex}. Total lessons: ${lessons.length}`
    );
  }

  // Move the lesson
  const [movedLesson] = lessons.splice(fromIndex, 1);
  lessons.splice(toIndex, 0, movedLesson);

  // Sequentially renumber all lessons
  renumberAllLessons(updated);
  const validation = validateCourseJson(updated);

  return { courseJson: updated, validation };
}

/**
 * Adds a new lesson to an existing course at a specific position:
 * - 'end': placed at the end of the module
 * - 'start': placed at the beginning of the module (as Lesson 1)
 * - 'before': placed before a specific lesson index
 * - 'after': placed after a specific lesson index
 *
 * Automatically renumbers all subsequent lessons and updates IDs and durations.
 *
 * @param {object} courseJson
 * @param {object} newLesson - Raw or parsed lesson object with { lesson_title, topics, knowledge_check }
 * @param {object} [options={}] - { targetModuleId, position: 'end'|'start'|'before'|'after', targetLessonIndex }
 * @returns {{ courseJson: object, validation: object, insertedIndex: number }}
 */
export function addLessonToCourse(courseJson, newLesson, options = {}) {
  if (
    !courseJson ||
    !Array.isArray(courseJson.modules) ||
    courseJson.modules.length === 0
  ) {
    throw new Error(
      'Course JSON must have at least one module to add a lesson.'
    );
  }
  if (!newLesson) {
    throw new Error('New lesson data is required.');
  }

  const updated = JSON.parse(JSON.stringify(courseJson));
  const targetModuleId = options.targetModuleId || updated.modules[0].module_id;
  let targetModule = updated.modules.find(
    (m) => m.module_id === targetModuleId
  );

  if (!targetModule) {
    targetModule = updated.modules[0];
  }
  if (!Array.isArray(targetModule.lessons)) {
    targetModule.lessons = [];
  }

  // Normalize new lesson format
  const formattedLesson = {
    lesson_id: newLesson.lesson_id || `les_temp_${Date.now()}`,
    lesson_title: newLesson.lesson_title || 'New Lesson',
    has_assessment_after: Boolean(newLesson.knowledge_check?.length > 0),
    knowledge_check: Array.isArray(newLesson.knowledge_check)
      ? newLesson.knowledge_check
      : [],
    topics: Array.isArray(newLesson.topics) ? newLesson.topics : [],
  };

  const position = options.position || 'end';
  const targetIndex = Number(options.targetLessonIndex) || 0;
  let insertAt = targetModule.lessons.length;

  if (position === 'start') {
    insertAt = 0;
  } else if (position === 'before') {
    insertAt = Math.max(0, Math.min(targetIndex, targetModule.lessons.length));
  } else if (position === 'after') {
    insertAt = Math.max(
      0,
      Math.min(targetIndex + 1, targetModule.lessons.length)
    );
  } else {
    // 'end'
    insertAt = targetModule.lessons.length;
  }

  targetModule.lessons.splice(insertAt, 0, formattedLesson);

  // Auto-renumber all lessons sequentially
  renumberAllLessons(updated);
  const validation = validateCourseJson(updated);

  return { courseJson: updated, validation, insertedIndex: insertAt };
}

/**
 * Removes a lesson from a course and renumbers remaining lessons.
 *
 * @param {object} courseJson
 * @param {string} lessonId
 * @returns {{ courseJson: object, validation: object }}
 */
export function removeLessonFromCourse(courseJson, lessonId) {
  if (!courseJson || !Array.isArray(courseJson.modules))
    return { courseJson, validation: null };

  const updated = JSON.parse(JSON.stringify(courseJson));
  updated.modules.forEach((mod) => {
    if (Array.isArray(mod.lessons)) {
      mod.lessons = mod.lessons.filter((l) => l.lesson_id !== lessonId);
    }
  });

  renumberAllLessons(updated);
  const validation = validateCourseJson(updated);

  return { courseJson: updated, validation };
}

/**
 * Updates a question (quiz or final exam) in the course:
 * - Select / change correct answer (e.g. 'A', 'B', 'C', 'D')
 * - Edit question stem
 * - Edit options
 * - Edit explanation
 *
 * @param {object} courseJson
 * @param {string} questionId - ID of question to update
 * @param {object} updates - Fields to update: { correct_answer, question, options, explanation }
 * @param {object} [options={}] - { isFinalExam: boolean }
 * @returns {{ courseJson: object, validation: object }}
 */
export function updateQuestionInCourse(
  courseJson,
  questionId,
  updates,
  options = {}
) {
  if (!courseJson) throw new Error('Course JSON is required.');
  const updated = JSON.parse(JSON.stringify(courseJson));
  let found = false;

  const applyUpdates = (q) => {
    if (updates.correct_answer !== undefined) {
      q.correct_answer = String(updates.correct_answer).toUpperCase();
      if (Array.isArray(q.options)) {
        q.options.forEach((opt) => {
          opt.is_correct = opt.value === q.correct_answer;
        });
      }
    }
    if (updates.question !== undefined) {
      q.question = updates.question;
      q.question_text = updates.question;
    }
    if (updates.options !== undefined) {
      q.options = updates.options;
    }
    if (updates.explanation !== undefined) {
      q.explanation = updates.explanation;
    }
    found = true;
  };

  if (
    options.isFinalExam &&
    updated.final_exam &&
    Array.isArray(updated.final_exam.questions)
  ) {
    const q = updated.final_exam.questions.find(
      (x) => x.question_id === questionId || x.id === questionId
    );
    if (q) {
      applyUpdates(q);
    }
  } else {
    // Search in lesson quizzes
    for (const mod of updated.modules || []) {
      for (const les of mod.lessons || []) {
        if (Array.isArray(les.knowledge_check)) {
          const q = les.knowledge_check.find(
            (x) => x.question_id === questionId || x.id === questionId
          );
          if (q) {
            applyUpdates(q);
            break;
          }
        }
      }
      if (found) break;
    }
  }

  recalculateCourseDurations(updated);
  const validation = validateCourseJson(updated);

  return { courseJson: updated, validation, found };
}

/**
 * Deletes a question from quiz or final exam.
 *
 * @param {object} courseJson
 * @param {string} questionId
 * @param {object} [options={}] - { isFinalExam: boolean }
 * @returns {{ courseJson: object, validation: object }}
 */
export function deleteQuestionFromCourse(courseJson, questionId, options = {}) {
  if (!courseJson) throw new Error('Course JSON is required.');
  const updated = JSON.parse(JSON.stringify(courseJson));

  if (
    options.isFinalExam &&
    updated.final_exam &&
    Array.isArray(updated.final_exam.questions)
  ) {
    updated.final_exam.questions = updated.final_exam.questions.filter(
      (q) => q.question_id !== questionId && q.id !== questionId
    );
    updated.final_exam.questionCount = updated.final_exam.questions.length;
  } else {
    for (const mod of updated.modules || []) {
      for (const les of mod.lessons || []) {
        if (Array.isArray(les.knowledge_check)) {
          les.knowledge_check = les.knowledge_check.filter(
            (q) => q.question_id !== questionId && q.id !== questionId
          );
          les.has_assessment_after = les.knowledge_check.length > 0;
        }
      }
    }
  }

  recalculateCourseDurations(updated);
  const validation = validateCourseJson(updated);

  return { courseJson: updated, validation };
}
