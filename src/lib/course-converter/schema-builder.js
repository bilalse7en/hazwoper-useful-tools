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
  hasIntroLesson,
} from './folder-converter.js';
import {
  normalizeQuizQuestion,
  normalizeFinalExam,
  isFinalExamHeading,
} from './quiz-extractor.js';
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
/**
 * Ensures that the first topic of an Introduction lesson (Lesson 0)
 * is an empty title slide named strictly after the course title.
 *
 * @param {Array<object>} topics - Array of topic objects
 * @param {string} courseTitle - Name of the course
 * @param {string} [modId='mod_0'] - Module ID
 * @param {string} [lesId='les_0_0'] - Lesson ID
 * @returns {Array<object>} Topics array with empty course title topic at index 0
 */
export function ensureEmptyCourseTitleTopic(
  topics = [],
  courseTitle = '',
  modId = 'mod_0',
  lesId = 'les_0_0'
) {
  const cleanCourse = (courseTitle || '').trim();
  if (!cleanCourse) return topics;

  // Check if first topic is already the empty course title slide
  const first = topics[0];
  const firstHtml = (
    first?.leftDiv?.editorHtml ||
    first?.leftDiv?.editor ||
    first?.leftDiv?.editorSaved ||
    ''
  )
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  const isFirstAlreadyEmptyCourseTitle =
    first &&
    (first.name === cleanCourse || first.headingContent === cleanCourse) &&
    firstHtml === '';

  if (isFirstAlreadyEmptyCourseTitle) {
    first.name = cleanCourse;
    first.headingContent = cleanCourse;
    if (!first.leftDiv) first.leftDiv = {};
    first.leftDiv.editor = '';
    first.leftDiv.editorHtml = '';
    first.leftDiv.editorSaved = '';
    first.leftDiv.editorHtmlSaved = '';
    first.allocated_duration_seconds = 30;
    first.topicDuration = 30;
    return topics;
  }

  const emptyTopic = {
    id: `${lesId}_1`.replace(/^les_/, 'top_'),
    name: cleanCourse,
    headingContent: cleanCourse,
    selectedTemplate: 0,
    lessonId: lesId,
    moduleId: modId,
    slide_type: 'text',
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
      editor: '',
      editorHtml: '',
      editorSaved: '',
      editorHtmlSaved: '',
      captureTime: [],
      mediaDuration: 0,
      isEditorSelected: true,
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

  const newTopics = [emptyTopic, ...topics];

  // Renumber topic IDs in this lesson
  newTopics.forEach((top, idx) => {
    top.id = `${lesId}_${idx + 1}`.replace(/^les_/, 'top_');
    top.lessonId = lesId;
    top.moduleId = modId;
  });

  return newTopics;
}

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

  const totalLessonsInAllModules = rawModules.reduce(
    (sum, m) => sum + (m.lessons || []).length,
    0
  );
  const shouldFilterExamLessons = totalLessonsInAllModules > 1;

  const normalized = [];

  // Check if there is an introductory / course name module
  const hasModule0 =
    introIndex !== -1 ||
    rawModules[0].module_id === 'mod_0' ||
    rawModules[0].moduleIndex === 0 ||
    isIntroductoryModule(rawModules[0].module_title, cleanCourse) ||
    hasIntroLesson(rawModules[0].lessons);

  if (hasModule0) {
    if (introIndex === -1) {
      introIndex = 0;
    }
    const introMod = rawModules[introIndex];
    const restModules = rawModules.filter((_, idx) => idx !== introIndex);

    // Build Module 0: Strictly the course name / clean title without module numbering prefix
    const rawIntroTitle = (introMod.module_title || '').trim();
    const cleanIntroTitle = rawIntroTitle
      .replace(/^(?:module|unit|section)\s*\d*[:\s_-]*/i, '')
      .trim();
    const mod0Title =
      cleanCourse && cleanIntroTitle.toLowerCase().includes(lowerCourse)
        ? cleanIntroTitle
        : cleanCourse || cleanIntroTitle || 'Introduction';

    const hasIntro = hasIntroLesson(introMod.lessons);

    let globalLessonNumber = 1;

    // Module 0 is mod_0, lessons are les_0_0 (Introduction), etc.
    const mod0Id = 'mod_0';
    const mod0Num = 0;

    const mod0Lessons = (introMod.lessons || [])
      .filter(
        (les) =>
          !shouldFilterExamLessons || !isFinalExamHeading(les.lesson_title)
      )
      .map((les, lIdx) => {
        const isLes0 = hasIntro && lIdx === 0;
        const lesNum = isLes0 ? 0 : globalLessonNumber++;
        const lesId = `les_${mod0Num}_${lesNum}`;
        const lesTitle = isLes0
          ? 'Introduction'
          : ensureLessonNumberPrefix(les.lesson_title, lesNum);

        let formattedTopics = (les.topics || []).map((top, tIdx) => ({
          ...top,
          id: `top_${mod0Num}_${lesNum}_${tIdx + 1}`,
          lessonId: lesId,
          moduleId: mod0Id,
        }));

        if (isLes0) {
          formattedTopics = ensureEmptyCourseTitleTopic(
            formattedTopics,
            cleanCourse || mod0Title,
            mod0Id,
            lesId
          );
        }

        return {
          ...les,
          lesson_id: lesId,
          lesson_title: lesTitle,
          topics: formattedTopics,
        };
      });

    if (mod0Lessons.length === 0) {
      const emptyTopics = ensureEmptyCourseTitleTopic(
        [],
        cleanCourse || mod0Title,
        mod0Id,
        `les_${mod0Num}_0`
      );
      mod0Lessons.push({
        lesson_id: `les_${mod0Num}_0`,
        lesson_title: 'Introduction',
        has_assessment_after: false,
        knowledge_check: [],
        topics: emptyTopics,
      });
    }

    normalized.push({
      ...introMod,
      module_id: mod0Id,
      module_title: mod0Title,
      lessons: mod0Lessons,
    });

    // Number remaining modules starting from Module 1, with CONTINUOUS lesson numbering across modules
    restModules.forEach((mod, idx) => {
      const modNum = idx + 1;
      const modId = `mod_${modNum}`;
      const modTitle = ensureModuleNumberPrefix(
        mod.module_title,
        modNum,
        cleanCourse
      );

      const filteredLessons = (mod.lessons || []).filter(
        (les) =>
          !shouldFilterExamLessons || !isFinalExamHeading(les.lesson_title)
      );
      const hasIntroMod = hasIntroLesson(filteredLessons);

      const modLessons = filteredLessons.map((les, lIdx) => {
        const isLes0 = hasIntroMod && lIdx === 0;
        const lesNum = isLes0 ? 0 : globalLessonNumber++;
        const lesId = `les_${modNum}_${lesNum}`;
        const lesTitle = isLes0
          ? 'Introduction'
          : ensureLessonNumberPrefix(les.lesson_title, lesNum);
        let formattedTopics = (les.topics || []).map((top, tIdx) => ({
          ...top,
          id: `top_${modNum}_${lesNum}_${tIdx + 1}`,
          lessonId: lesId,
          moduleId: modId,
        }));

        if (isLes0) {
          formattedTopics = ensureEmptyCourseTitleTopic(
            formattedTopics,
            cleanCourse || modTitle,
            modId,
            lesId
          );
        }

        return {
          ...les,
          lesson_id: lesId,
          lesson_title: lesTitle,
          topics: formattedTopics,
        };
      });

      if (modLessons.length > 0) {
        normalized.push({
          ...mod,
          module_id: modId,
          module_title: modTitle,
          lessons: modLessons,
        });
      }
    });
  } else {
    // Normal modules starting from Module 1 with continuous lesson numbering across modules
    let globalLessonNumber = 1;

    rawModules.forEach((mod, idx) => {
      const isOnlyOneModule = rawModules.length === 1;
      const modNum = idx + 1;
      const modId = `mod_${modNum}`;

      let modTitle;
      if (isOnlyOneModule) {
        // Single module represents entire course -> title is strictly course name without "Module 1:" prefix
        const rawModTitle = (mod.module_title || '').trim();
        const cleanModTitle = rawModTitle
          .replace(/^(?:module|unit|section)\s*\d*[:\s_-]*/i, '')
          .trim();
        modTitle = cleanCourse || cleanModTitle || 'Untitled Course';
      } else {
        modTitle = ensureModuleNumberPrefix(
          mod.module_title,
          modNum,
          cleanCourse
        );
      }

      const filteredLessons = (mod.lessons || []).filter(
        (les) =>
          !shouldFilterExamLessons || !isFinalExamHeading(les.lesson_title)
      );
      const hasIntroMod = hasIntroLesson(filteredLessons);

      const modLessons = filteredLessons.map((les, lIdx) => {
        const isLes0 = hasIntroMod && lIdx === 0;
        const lesNum = isLes0 ? 0 : globalLessonNumber++;
        const lesId = `les_${modNum}_${lesNum}`;
        const lesTitle = isLes0
          ? 'Introduction'
          : ensureLessonNumberPrefix(les.lesson_title, lesNum);
        let formattedTopics = (les.topics || []).map((top, tIdx) => ({
          ...top,
          id: `top_${modNum}_${lesNum}_${tIdx + 1}`,
          lessonId: lesId,
          moduleId: modId,
        }));

        if (isLes0) {
          formattedTopics = ensureEmptyCourseTitleTopic(
            formattedTopics,
            cleanCourse || modTitle,
            modId,
            lesId
          );
        }

        return {
          ...les,
          lesson_id: lesId,
          lesson_title: lesTitle,
          topics: formattedTopics,
        };
      });

      if (modLessons.length > 0) {
        normalized.push({
          ...mod,
          module_id: modId,
          module_title: modTitle,
          lessons: modLessons,
        });
      }
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
  if (!topic.leftDiv) topic.leftDiv = {};
  if (!topic.leftDiv.width) topic.leftDiv.width = 'col-12';
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

  const rawHtml =
    topic.leftDiv?.editorHtml ||
    topic.leftDiv?.editor ||
    topic.leftDiv?.editorSaved ||
    '';

  // If the slide already has an embedded image in its HTML layout, select 1st frame (template 0)
  // and do NOT create an empty right-side image slot in LMS
  if (rawHtml.includes('<img') || topic.has_embedded_image) {
    topic.selectedTemplate = 0;
    if (topic.rightDiv) {
      topic.rightDiv.image = {
        isImage: false,
        imageURL: '',
        imageFile: '',
        imageName: '',
      };
      topic.rightDiv.isEditorSelected = false;
    }
  } else if (
    topic.rightDiv?.image?.isImage &&
    topic.rightDiv?.image?.imageURL
  ) {
    topic.selectedTemplate = topic.selectedTemplate || 1;
    topic.rightDiv.isEditorSelected = false;
  } else if (topic.leftDiv?.image?.isImage && topic.leftDiv?.image?.imageURL) {
    topic.selectedTemplate =
      topic.selectedTemplate !== undefined ? topic.selectedTemplate : 0;
  } else {
    topic.selectedTemplate =
      topic.selectedTemplate !== undefined ? topic.selectedTemplate : 0;
    if (topic.rightDiv) {
      topic.rightDiv.isEditorSelected = false;
    }
  }

  // Only preserve Tailwind if explicitly requested by caller (options.preserveTailwind === true)
  // Otherwise default to strict LMS sanitation (purging random classes & styles, preserving mb-0, mt-0, and table classes)
  const shouldPreserveTailwind = options.preserveTailwind === true;

  const cleanInner = normalizeHtmlContent(rawHtml, {
    stripImages,
    preserveTailwind: shouldPreserveTailwind,
    topicTitle: topic.name || topic.headingContent,
  });
  const wrapped = wrapInLmsContainer(cleanInner, {
    stripImages,
    preserveTailwind: shouldPreserveTailwind,
  });

  // Preserve audio duration and media duration if topic has audio
  const hasAudio =
    (topic.leftDiv?.audio?.isAudio &&
      Number(topic.leftDiv?.mediaDuration || topic.topicDuration) > 0) ||
    Number(topic.leftDiv?.mediaDuration) > 0;

  if (
    !hasAudio &&
    (!topic.allocated_duration_seconds ||
      topic.allocated_duration_seconds === 30 ||
      options.recalculateDuration)
  ) {
    const duration = calculateTopicDuration(cleanInner);
    topic.allocated_duration_seconds = duration;
    topic.topicDuration = duration;
  } else if (!topic.allocated_duration_seconds && hasAudio) {
    const audDur = Math.round(
      Number(topic.leftDiv?.mediaDuration || topic.topicDuration) * 1.1
    );
    topic.allocated_duration_seconds = audDur;
  }

  if (!topic.leftDiv) topic.leftDiv = {};
  topic.leftDiv.editor = wrapped;
  topic.leftDiv.editorHtml = wrapped;
  topic.leftDiv.editorSaved = wrapped;
  topic.leftDiv.editorHtmlSaved = wrapped;

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

  // Normalize quiz questions in every lesson
  modules.forEach((mod) => {
    (mod.lessons || []).forEach((les) => {
      if (options.includeQuizzes === false) {
        les.knowledge_check = [];
        les.has_assessment_after = false;
      } else if (Array.isArray(les.knowledge_check)) {
        les.knowledge_check = les.knowledge_check.map((q, qIdx) =>
          normalizeQuizQuestion(
            q,
            `q_${les.lesson_id ? les.lesson_id.replace(/^les_/, '') : '1'}_${qIdx + 1}`
          )
        );
        les.has_assessment_after = les.knowledge_check.length > 0;
      }
    });
  });

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
    options.includeQuizzes !== false
      ? normalizeFinalExam(parsedData.final_exam)
      : null;
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
  const preserveTailwind = options.preserveTailwind === true;

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
      preserveTailwind,
      purgeRandomClasses: true,
    }
  );

  const validation = validateCourseJson(enhanced);

  return {
    success: true,
    courseJson: enhanced,
    validation,
  };
}
