/**
 * schema-builder.js
 *
 * Constructs the exact LMS-compatible JSON payload matching
 * the reference schema (Utility_Power_Service_Course_JSON.json).
 */

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

  // If quizzes are explicitly excluded, strip them from all lessons
  if (options.includeQuizzes === false) {
    modules.forEach((mod) => {
      (mod.lessons || []).forEach((les) => {
        les.knowledge_check = [];
        les.has_assessment_after = false;
      });
    });
  }

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

  // Sanitize topics: ensure raw_body_content is deleted from all topics
  // so base64 strings and unstripped markers never pollute the exported LMS JSON payload
  modules.forEach((mod) => {
    (mod.lessons || []).forEach((les) => {
      (les.topics || []).forEach((top) => {
        if ('raw_body_content' in top) {
          delete top.raw_body_content;
        }
      });
    });
  });

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
