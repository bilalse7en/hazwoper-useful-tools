/**
 * schema-builder.js
 *
 * Constructs the exact LMS-compatible JSON payload matching
 * the reference schema (Utility_Power_Service_Course_JSON.json).
 */

import {
  normalizeHtmlContent,
  wrapInLmsContainer,
  calculateTopicDuration,
} from './html-normalizer.js';
import {
  ensureLessonNumberPrefix,
  ensureModuleNumberPrefix,
  isIntroductoryModule,
} from './folder-converter.js';
import { validateCourseJson } from './validator.js';

/**
 * Normalizes course modules and lessons according to LMS hierarchy rules:
 * - If any module matches the course name or is Module 0 / Introduction, it becomes Module 0 on top.
 * - Inside Module 0, Lesson 0 is strictly named "Introduction" (instead of "Lesson 0").
 * - Regular modules start from Module 1:, Module 2:, ...
 * - Inside regular modules, lessons are consistently numbered:
 *   Lesson 1: <name of lesson 1>
 *   Lesson 2: <name of lesson 2>
 *   Lesson 3: <name of lesson 3>
 */
export function normalizeCourseHierarchy(
  rawModules = [],
  courseTitle = '',
  options = {}
) {
  if (!Array.isArray(rawModules) || rawModules.length === 0) return [];

  const cleanCourse = (courseTitle || '').trim();
  const lowerCourse = cleanCourse.toLowerCase();

  // Find if there is an introductory module or a module matching the course title
  let introIndex = -1;

  for (let i = 0; i < rawModules.length; i++) {
    const mod = rawModules[i];
    const modTitle = (mod.module_title || '').trim();
    const lowerMod = modTitle.toLowerCase();

    // Check 1: Explicit Module 0 or Introduction / Overview / Course Overview anywhere in title
    if (
      mod.module_id === 'mod_0' ||
      /\b(?:module\s*0\b|intro(?:duction)?\b|course\s*overview\b|overview\b|welcome\b|syllabus\b)/i.test(
        lowerMod
      )
    ) {
      introIndex = i;
      break;
    }

    // Check 2: Module title matches or contains the course title or its main subject
    if (lowerCourse && lowerCourse.length > 3) {
      const modWithoutPrefix = lowerMod
        .replace(/^(?:module|unit|section)\s*\d*[:\s_-]*/i, '')
        .trim();
      const courseMainSubject = lowerCourse
        .replace(/^(?:course[:\s_-]*)/i, '')
        .trim();

      if (
        modWithoutPrefix &&
        (modWithoutPrefix === courseMainSubject ||
          modWithoutPrefix.includes(courseMainSubject) ||
          courseMainSubject.includes(modWithoutPrefix))
      ) {
        introIndex = i;
        break;
      }
    }
  }

  const normalized = [];

  // If introductory / course name module found, place on top as Module 0
  if (introIndex !== -1) {
    const introMod = rawModules[introIndex];
    const restModules = rawModules.filter((_, idx) => idx !== introIndex);

    // Build Module 0
    const rawIntroTitle = (introMod.module_title || '').trim();
    let mod0Title = rawIntroTitle;
    if (!/^module\s*0\b/i.test(mod0Title)) {
      const cleanName = mod0Title
        .replace(/^(?:module|unit|section)\s*\d*[:\s_-]*/i, '')
        .trim();
      mod0Title = `Module 0: ${cleanName || cleanCourse || 'Introduction'}`;
    }

    const mod0Lessons = (introMod.lessons || []).map((les, lIdx) => {
      const lesId = `les_0_${lIdx}`;
      // In Lesson 0: name MUST be strictly "Introduction" instead of "Lesson 0"
      const lesTitle =
        lIdx === 0
          ? 'Introduction'
          : ensureLessonNumberPrefix(les.lesson_title, lIdx);

      const formattedTopics = (les.topics || []).map((top, tIdx) => ({
        ...top,
        id: `top_0_${lIdx}_${tIdx + 1}`,
        lessonId: lesId,
        moduleId: 'mod_0',
      }));

      return {
        ...les,
        lesson_id: lesId,
        lesson_title: lesTitle,
        topics: formattedTopics,
      };
    });

    if (mod0Lessons.length === 0) {
      mod0Lessons.push({
        lesson_id: 'les_0_0',
        lesson_title: 'Introduction',
        has_assessment_after: false,
        knowledge_check: [],
        topics: [],
      });
    }

    normalized.push({
      ...introMod,
      module_id: 'mod_0',
      module_title: mod0Title,
      lessons: mod0Lessons,
    });

    // Number remaining modules starting from Module 1
    restModules.forEach((mod, idx) => {
      const modNum = idx + 1;
      const modId = `mod_${modNum}`;
      const modTitle = ensureModuleNumberPrefix(mod.module_title, modNum);

      const modLessons = (mod.lessons || []).map((les, lIdx) => {
        const lesNum = lIdx + 1;
        const lesId = `les_${modNum}_${lesNum}`;
        const lesTitle = ensureLessonNumberPrefix(les.lesson_title, lesNum);
        const formattedTopics = (les.topics || []).map((top, tIdx) => ({
          ...top,
          id: `top_${modNum}_${lesNum}_${tIdx + 1}`,
          lessonId: lesId,
          moduleId: modId,
        }));

        return {
          ...les,
          lesson_id: lesId,
          lesson_title: lesTitle,
          topics: formattedTopics,
        };
      });

      normalized.push({
        ...mod,
        module_id: modId,
        module_title: modTitle,
        lessons: modLessons,
      });
    });
  } else {
    // No introductory module -> Modules start from Module 1
    rawModules.forEach((mod, idx) => {
      const modNum = idx + 1;
      const modId = `mod_${modNum}`;
      const modTitle = ensureModuleNumberPrefix(mod.module_title, modNum);

      const modLessons = (mod.lessons || []).map((les, lIdx) => {
        const lesNum = lIdx + 1;
        const lesId = `les_${modNum}_${lesNum}`;
        const lesTitle = ensureLessonNumberPrefix(les.lesson_title, lesNum);
        const formattedTopics = (les.topics || []).map((top, tIdx) => ({
          ...top,
          id: `top_${modNum}_${lesNum}_${tIdx + 1}`,
          lessonId: lesId,
          moduleId: modId,
        }));

        return {
          ...les,
          lesson_id: lesId,
          lesson_title: lesTitle,
          topics: formattedTopics,
        };
      });

      normalized.push({
        ...mod,
        module_id: modId,
        module_title: modTitle,
        lessons: modLessons,
      });
    });
  }

  return normalized;
}

/**
 * Cleans a topic's HTML and properties when images are OFF:
 * - Purges <img>, base64 data, and FILE #: <number> codes
 * - Purges slide titles from content body
 * - Sets slide_type to 'content', clears image_source, image_code, image_prompt, has_embedded_image: false
 * - Re-wraps in clean single parent <div> with all styles/classes stripped
 */
export function cleanTopicSlideContent(topic, options = {}) {
  const stripImages = options.stripImages !== false;

  if (!topic.headingContent)
    topic.headingContent = topic.name || 'Topic Content';
  if (!topic.name) topic.name = topic.headingContent;
  if (!topic.selectedTemplate) topic.selectedTemplate = 1;
  if (!topic.leftDiv) topic.leftDiv = {};
  if (!topic.leftDiv.width) topic.leftDiv.width = 'col-12';
  if (topic.leftDiv.isEditorSelected === undefined)
    topic.leftDiv.isEditorSelected = true;

  if (!topic.rightDiv) {
    topic.rightDiv = {
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
    };
  }

  if (stripImages) {
    topic.slide_type = 'content';
    topic.image_source = '';
    topic.image_code = '';
    topic.image_prompt = '';
    topic.has_embedded_image = false;

    if (!topic.leftDiv.image) {
      topic.leftDiv.image = {
        isImage: false,
        imageURL: '',
        imageFile: '',
        imageName: '',
      };
    } else {
      topic.leftDiv.image.isImage = false;
      topic.leftDiv.image.imageURL = '';
      topic.leftDiv.image.imageFile = '';
      topic.leftDiv.image.imageName = '';
    }

    const rawHtml =
      topic.leftDiv.editorHtml ||
      topic.leftDiv.editor ||
      topic.leftDiv.editorSaved ||
      '';

    const cleanInner = normalizeHtmlContent(rawHtml, {
      stripImages: true,
      topicTitle: topic.name || topic.headingContent,
    });
    const wrapped = wrapInLmsContainer(cleanInner, { stripImages: true });
    const duration = calculateTopicDuration(cleanInner);

    topic.allocated_duration_seconds = duration;
    topic.topicDuration = duration;
    topic.leftDiv.editor = wrapped;
    topic.leftDiv.editorHtml = wrapped;
    topic.leftDiv.editorSaved = wrapped;
    topic.leftDiv.editorHtmlSaved = wrapped;
  } else {
    if (!topic.slide_type) topic.slide_type = 'image';
  }

  if ('raw_body_content' in topic) {
    delete topic.raw_body_content;
  }

  return topic;
}

/**
 * Builds the complete LMS Course JSON structure from segmented data
 *
 * @param {object} parsedData - Output from segmentLessonWiseHtml or segmentCourseWiseHtml
 * @param {object} [options={}] - Optional overrides (course_id, created_by_name, etc.)
 * @returns {object} - Valid LMS JSON matching the reference specification
 */
export function buildCourseJson(parsedData, options = {}) {
  const course_id = options.course_id || parsedData.course_id || 'course_1';
  const course_title =
    options.course_title || parsedData.courseTitle || 'Untitled Course';
  const created_by_name = options.created_by_name || '';

  let modules = [];

  // Determine if input is Lesson-wise (Mode A) or Course-wise (Mode B)
  if (parsedData.modules && Array.isArray(parsedData.modules)) {
    // Mode B: Course-wise
    modules = parsedData.modules;
  } else {
    // Mode A: Lesson-wise -> Wrap in single module with single lesson
    const moduleId = options.module_id || 'mod_1';
    const moduleTitle =
      options.module_title ||
      parsedData.moduleTitle ||
      'Module 1: General Knowledge';
    const lessonId = options.lesson_id || 'les_1_1';
    const lessonTitle =
      options.lesson_title || parsedData.lessonTitle || 'Lesson 1';

    const topics = (parsedData.topics || []).map((t, index) => {
      const topId = t.id || `top_1_1_${index + 1}`;
      return {
        ...t,
        id: topId,
        lessonId,
        moduleId,
      };
    });

    const includeQuizzes = options.includeQuizzes !== false;
    modules = [
      {
        module_id: moduleId,
        module_title: moduleTitle,
        lessons: [
          {
            lesson_id: lessonId,
            lesson_title: lessonTitle,
            has_assessment_after:
              includeQuizzes && (parsedData.knowledge_check?.length || 0) > 0,
            knowledge_check: includeQuizzes
              ? parsedData.knowledge_check || []
              : [],
            topics,
          },
        ],
      },
    ];
  }

  // Apply Module 0 & Lesson 0 Introduction rules and consistent lesson numbering
  modules = normalizeCourseHierarchy(modules, course_title, options);

  // If quizzes are explicitly excluded, strip them from all lessons
  if (options.includeQuizzes === false) {
    modules.forEach((mod) => {
      (mod.lessons || []).forEach((les) => {
        les.knowledge_check = [];
        les.has_assessment_after = false;
      });
    });
  }

  // Sanitize topics and strip images / slide titles if stripImages is enabled
  const stripImages = options.stripImages !== false;
  modules.forEach((mod) => {
    (mod.lessons || []).forEach((les) => {
      (les.topics || []).forEach((top) => {
        cleanTopicSlideContent(top, { stripImages });
      });
    });
  });

  // Calculate durations across all modules and lessons
  let totalTopics = 0;
  let totalSlidesSeconds = 0;
  let totalKcSeconds = 0;
  const lessonsDurationArray = [];

  modules.forEach((mod) => {
    (mod.lessons || []).forEach((les) => {
      let lessonSlidesSeconds = 0;
      (les.topics || []).forEach((top) => {
        totalTopics += 1;
        const dur = Number(top.allocated_duration_seconds) || 30;
        lessonSlidesSeconds += dur;
      });

      // 60 seconds per knowledge check question
      const kcQuestions = les.knowledge_check || [];
      const lessonKcSeconds = kcQuestions.length * 60;
      const lessonTotalSeconds = lessonSlidesSeconds + lessonKcSeconds;

      totalSlidesSeconds += lessonSlidesSeconds;
      totalKcSeconds += lessonKcSeconds;

      lessonsDurationArray.push({
        lesson_id: les.lesson_id,
        slides_seconds: lessonSlidesSeconds,
        knowledge_check_seconds: lessonKcSeconds,
        total_seconds: lessonTotalSeconds,
      });
    });
  });

  // Final Exam calculations (if present and quizzes included)
  let finalExamSeconds = 0;
  let finalExamObj =
    options.includeQuizzes !== false ? parsedData.final_exam || null : null;
  if (
    finalExamObj &&
    finalExamObj.questions &&
    finalExamObj.questions.length > 0
  ) {
    finalExamSeconds = finalExamObj.questions.length * 60;
  }

  const grandTotalSeconds =
    totalSlidesSeconds + totalKcSeconds + finalExamSeconds;

  const result = {
    course_id,
    course_title,
    created_by_name,
    total_modules: modules.length,
    total_topics: totalTopics,
    total_duration_seconds: grandTotalSeconds,
    planned_duration_seconds: grandTotalSeconds,
    duration: {
      total_seconds: grandTotalSeconds,
      slides_seconds: totalSlidesSeconds,
      knowledge_check_seconds: totalKcSeconds,
      final_exam_seconds: finalExamSeconds,
      basis: 'reading',
      lessons: lessonsDurationArray,
    },
    modules,
  };

  if (finalExamObj) {
    result.final_exam = finalExamObj;
  }

  return result;
}

/**
 * Enhances, cleans, and sanitizes an existing Course JSON payload:
 * - Fixes Module 0 & Lesson 0 Introduction hierarchy rules
 * - Fixes Lesson 1:, Lesson 2:, Lesson 3: numbering
 * - Cleans HTML in all topics (purges classes, styles, unneeded wrappers)
 * - If stripImages is true, purges images, file codes, and slide titles
 * - Recalculates all duration objects and ensures 100% LMS schema compliance
 *
 * @param {object|string} rawJson - Raw Course JSON object or JSON string
 * @param {object} [options={}] - { stripImages, includeQuizzes }
 * @returns {{ success: boolean, courseJson: object, validation: object }}
 */
export function enhanceAndCleanCourseJson(rawJson, options = {}) {
  let parsed;
  if (typeof rawJson === 'string') {
    parsed = JSON.parse(rawJson);
  } else {
    parsed = JSON.parse(JSON.stringify(rawJson));
  }

  const courseTitle =
    options.course_title || parsed.course_title || 'Untitled Course';
  const stripImages = options.stripImages !== false;
  const includeQuizzes = options.includeQuizzes !== false;

  const enhanced = buildCourseJson(
    {
      course_id: parsed.course_id || 'course_1',
      courseTitle,
      created_by_name: parsed.created_by_name || '',
      modules: parsed.modules || [],
      final_exam: parsed.final_exam || null,
    },
    {
      course_id: parsed.course_id,
      course_title: courseTitle,
      stripImages,
      includeQuizzes,
    }
  );

  const validation = validateCourseJson(enhanced);

  return {
    success: true,
    courseJson: enhanced,
    validation,
  };
}
