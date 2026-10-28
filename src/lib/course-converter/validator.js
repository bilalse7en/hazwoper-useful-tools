/**
 * validator.js
 *
 * 14-Point Comprehensive Validation Suite for LMS Course JSON.
 * Guarantees structural integrity, zero content leakage, schema compliance,
 * duration math consistency, and clean HTML before export.
 */

/**
 * Validates a generated LMS Course JSON object against all 14 criteria
 * @param {object} courseJson - The complete LMS course JSON
 * @returns {object} { isValid: boolean, score: number, checks: Array<object>, summary: object }
 */
export function validateCourseJson(courseJson) {
  const checks = [];

  function addCheck(id, name, passed, level, message) {
    checks.push({
      id,
      name,
      passed: Boolean(passed),
      level, // 'error' | 'warning' | 'info'
      message,
    });
  }

  if (!courseJson || typeof courseJson !== 'object') {
    return {
      isValid: false,
      score: 0,
      checks: [
        {
          id: 'CHECK_1_JSON_FORMAT',
          name: 'Valid JSON Format',
          passed: false,
          level: 'error',
          message: 'The course payload is not a valid object.',
        },
      ],
      summary: { total: 1, passed: 0, failed: 1, warnings: 0 },
    };
  }

  // Check 1: Valid JSON structure & root object
  addCheck(
    'CHECK_1_JSON_FORMAT',
    'Valid JSON Object Structure',
    true,
    'info',
    'Root document is a well-formed JSON object.'
  );

  // Check 2: Course-level metadata
  const hasCourseId = Boolean(
    courseJson.course_id && typeof courseJson.course_id === 'string'
  );
  const hasCourseTitle = Boolean(
    courseJson.course_title && typeof courseJson.course_title === 'string'
  );
  const hasTotalModules =
    typeof courseJson.total_modules === 'number' &&
    courseJson.total_modules > 0;
  const hasTotalTopics =
    typeof courseJson.total_topics === 'number' && courseJson.total_topics > 0;
  const passedMeta =
    hasCourseId && hasCourseTitle && hasTotalModules && hasTotalTopics;
  addCheck(
    'CHECK_2_COURSE_METADATA',
    'Course Metadata & Counters',
    passedMeta,
    passedMeta ? 'info' : 'error',
    passedMeta
      ? `Course ID: "${courseJson.course_id}", Title: "${courseJson.course_title}", Modules: ${courseJson.total_modules}, Topics: ${courseJson.total_topics}`
      : 'Missing required course-level metadata (course_id, course_title, total_modules, total_topics).'
  );

  // Check 3: At least one module with module_id & module_title
  const modules = Array.isArray(courseJson.modules) ? courseJson.modules : [];
  const validModules =
    modules.length > 0 && modules.every((m) => m.module_id && m.module_title);
  addCheck(
    'CHECK_3_MODULES_EXIST',
    'Module Structure & Titles',
    validModules,
    validModules ? 'info' : 'error',
    validModules
      ? `${modules.length} valid module(s) found with required IDs and titles.`
      : 'No valid modules found or some modules are missing module_id or module_title.'
  );

  // Check 4: At least one lesson per module
  let allLessonsValid = modules.length > 0;
  let totalLessons = 0;
  for (const m of modules) {
    if (!Array.isArray(m.lessons) || m.lessons.length === 0) {
      allLessonsValid = false;
      break;
    }
    for (const l of m.lessons) {
      totalLessons += 1;
      if (!l.lesson_id || !l.lesson_title) {
        allLessonsValid = false;
        break;
      }
    }
  }
  addCheck(
    'CHECK_4_LESSONS_EXIST',
    'Lesson Hierarchy & Integrity',
    allLessonsValid,
    allLessonsValid ? 'info' : 'error',
    allLessonsValid
      ? `${totalLessons} lesson(s) verified across all modules.`
      : 'At least one module lacks lessons, or a lesson lacks lesson_id/lesson_title.'
  );

  // Check 5: At least one topic per lesson with id, name, headingContent
  let allTopicsValid = totalLessons > 0;
  let allTopics = [];
  for (const m of modules) {
    for (const l of m.lessons || []) {
      if (!Array.isArray(l.topics) || l.topics.length === 0) {
        allTopicsValid = false;
        break;
      }
      for (const t of l.topics) {
        allTopics.push(t);
        if (!t.id || !t.name || !t.headingContent) {
          allTopicsValid = false;
          break;
        }
      }
    }
  }
  addCheck(
    'CHECK_5_TOPICS_EXIST',
    'Topic Headers & Identity',
    allTopicsValid,
    allTopicsValid ? 'info' : 'error',
    allTopicsValid
      ? `${allTopics.length} topic(s) validated with id, name, and headingContent.`
      : 'At least one lesson has no topics or topics missing id/name/headingContent.'
  );

  // Check 6: Topics have leftDiv.editorHtml populated
  let emptyEditors = 0;
  for (const t of allTopics) {
    const html = t.leftDiv?.editorHtml;
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      emptyEditors += 1;
    }
  }
  const passedEditors = emptyEditors === 0 && allTopics.length > 0;
  addCheck(
    'CHECK_6_TOPIC_CONTENT',
    'Topic Content Non-Emptiness',
    passedEditors,
    passedEditors ? 'info' : 'error',
    passedEditors
      ? `All ${allTopics.length} topics have populated leftDiv.editorHtml content.`
      : `${emptyEditors} topic(s) have empty leftDiv.editorHtml.`
  );

  // Check 7: Clean HTML check (No MsoNormal, no raw Word artifacts, no mso- styles)
  let wordArtifactsFound = 0;
  for (const t of allTopics) {
    const html = t.leftDiv?.editorHtml || '';
    if (
      /MsoNormal/i.test(html) ||
      /mso-/i.test(html) ||
      /<\/?o:p/i.test(html) ||
      /<\/?w:/i.test(html)
    ) {
      wordArtifactsFound += 1;
    }
  }
  const passedCleanHtml = wordArtifactsFound === 0;
  addCheck(
    'CHECK_7_CLEAN_HTML',
    'Sanitized Semantic HTML',
    passedCleanHtml,
    passedCleanHtml ? 'info' : 'warning',
    passedCleanHtml
      ? 'Clean HTML: Zero Word artifacts (MsoNormal, mso- styles, Office XML) detected.'
      : `${wordArtifactsFound} topic(s) contain uncleaned Word classes or styles.`
  );

  // Check 8: Duration calculations consistency
  const durObj = courseJson.duration || {};
  let calculatedSlidesSec = 0;
  allTopics.forEach((t) => {
    calculatedSlidesSec += Number(t.allocated_duration_seconds) || 0;
  });

  let calculatedKcSec = 0;
  modules.forEach((m) => {
    (m.lessons || []).forEach((l) => {
      calculatedKcSec += (l.knowledge_check || []).length * 60;
    });
  });

  const finalExamSec = (courseJson.final_exam?.questions?.length || 0) * 60;
  const calculatedGrandTotal =
    calculatedSlidesSec + calculatedKcSec + finalExamSec;

  const slidesMatch = durObj.slides_seconds === calculatedSlidesSec;
  const totalMatch =
    durObj.total_seconds === calculatedGrandTotal &&
    courseJson.total_duration_seconds === calculatedGrandTotal;
  const durPassed = slidesMatch && totalMatch && calculatedGrandTotal > 0;

  addCheck(
    'CHECK_8_DURATION_CONSISTENCY',
    'Duration Mathematical Consistency',
    durPassed,
    durPassed ? 'info' : 'warning',
    durPassed
      ? `Total duration: ${calculatedGrandTotal}s (Slides: ${calculatedSlidesSec}s, Quizzes: ${calculatedKcSec}s, Exam: ${finalExamSec}s). All duration sums reconcile.`
      : `Duration mismatch: reported total ${durObj.total_seconds}s vs calculated ${calculatedGrandTotal}s.`
  );

  // Check 9: Lesson quiz questions completeness
  let totalKcQuestions = 0;
  let invalidKcQuestions = 0;
  modules.forEach((m) => {
    (m.lessons || []).forEach((l) => {
      (l.knowledge_check || []).forEach((q) => {
        totalKcQuestions += 1;
        if (
          !q.question ||
          !Array.isArray(q.options) ||
          q.options.length < 2 ||
          !q.correct_answer ||
          !q.options.some((o) => o.value === q.correct_answer)
        ) {
          invalidKcQuestions += 1;
        }
      });
    });
  });
  const passedKc = invalidKcQuestions === 0;
  addCheck(
    'CHECK_9_QUIZ_COMPLETENESS',
    'Lesson Quiz Structure & Answers',
    passedKc,
    passedKc ? 'info' : 'error',
    passedKc
      ? totalKcQuestions > 0
        ? `${totalKcQuestions} quiz question(s) verified with question stems, options, and matching correct answers.`
        : 'No quiz questions in this course (Quizzes excluded or not present in source document).'
      : `${invalidKcQuestions} quiz question(s) lack required options, stems, or matching correct answers.`
  );

  // Check 10: Final exam validation (if present)
  let passedExam = true;
  let examMsg =
    'No final exam in this course (Lesson-wise mode or course without comprehensive exam).';
  if (courseJson.final_exam) {
    const fe = courseJson.final_exam;
    const qCount = fe.questions?.length || 0;
    if (qCount === 0 || !fe.id || !fe.title) {
      passedExam = false;
      examMsg = 'Final exam object is missing ID, title, or questions.';
    } else {
      examMsg = `Final exam verified with ${qCount} questions, passing score ${fe.passingScore}%, and time limit ${fe.timeLimit}s.`;
    }
  }
  addCheck(
    'CHECK_10_FINAL_EXAM',
    'Course Final Exam Specification',
    passedExam,
    passedExam ? 'info' : 'warning',
    examMsg
  );

  // Check 11: Zero quiz content leakage into topics
  let leakCount = 0;
  for (const t of allTopics) {
    const html = t.leftDiv?.editorHtml || '';
    if (
      /<h1>\s*Lesson\s*Quiz/i.test(html) ||
      /<h3>\s*Question\s*\d+/i.test(html) ||
      /<p>[A-D]\.\s+.*\(correct\)/i.test(html)
    ) {
      leakCount += 1;
    }
  }
  const passedLeak = leakCount === 0;
  addCheck(
    'CHECK_11_ZERO_QUIZ_LEAKAGE',
    'Topic Assessment Isolation',
    passedLeak,
    passedLeak ? 'info' : 'error',
    passedLeak
      ? 'Zero quiz questions leaked into instructional topic slides.'
      : `${leakCount} topic(s) contain quiz questions or answer keys inside instructional slides.`
  );

  // Check 12: Unique IDs across all entities
  const idSet = new Set();
  let duplicateIds = 0;
  function trackId(id) {
    if (!id) return;
    if (idSet.has(id)) duplicateIds += 1;
    idSet.add(id);
  }
  trackId(courseJson.course_id);
  modules.forEach((m) => {
    trackId(m.module_id);
    (m.lessons || []).forEach((l) => {
      trackId(l.lesson_id);
      (l.topics || []).forEach((t) => trackId(t.id));
      (l.knowledge_check || []).forEach((q) => trackId(q.question_id));
    });
  });
  if (courseJson.final_exam) {
    trackId(courseJson.final_exam.id);
    (courseJson.final_exam.questions || []).forEach((q) => trackId(q.id));
  }
  const passedUniqueIds = duplicateIds === 0;
  addCheck(
    'CHECK_12_UNIQUE_IDS',
    'Unique Identifiers Verification',
    passedUniqueIds,
    passedUniqueIds ? 'info' : 'error',
    passedUniqueIds
      ? `All ${idSet.size} entity IDs are globally unique.`
      : `${duplicateIds} duplicate ID(s) detected across modules, lessons, topics, or questions.`
  );

  // Check 13: Template & slide_type defaults
  let invalidDefaults = 0;
  for (const t of allTopics) {
    if (
      t.selectedTemplate !== 1 ||
      (t.slide_type !== 'image' && t.slide_type !== 'content') ||
      t.leftDiv?.width !== 'col-12'
    ) {
      invalidDefaults += 1;
    }
  }
  const passedDefaults = invalidDefaults === 0;
  addCheck(
    'CHECK_13_SLIDE_DEFAULTS',
    'LMS Template & Slide Defaults',
    passedDefaults,
    passedDefaults ? 'info' : 'warning',
    passedDefaults
      ? 'All topics correctly configured with selectedTemplate: 1, valid slide_type ("image" or "content"), width: "col-12".'
      : `${invalidDefaults} topic(s) deviate from required LMS slide defaults.`
  );

  // Check 14: RightDiv properly initialized
  let invalidRightDivs = 0;
  for (const t of allTopics) {
    if (
      !t.rightDiv ||
      t.rightDiv.isEditorSelected !== false ||
      t.rightDiv.editor !== '' ||
      t.rightDiv.editorHtml !== ''
    ) {
      invalidRightDivs += 1;
    }
  }
  const passedRightDivs = invalidRightDivs === 0;
  addCheck(
    'CHECK_14_RIGHT_DIV_INITIALIZED',
    'RightDiv Empty State Specification',
    passedRightDivs,
    passedRightDivs ? 'info' : 'warning',
    passedRightDivs
      ? 'RightDiv properly initialized with empty editor state across all topics.'
      : `${invalidRightDivs} topic(s) have uninitialized or non-standard rightDiv.`
  );

  const errorChecks = checks.filter((c) => !c.passed && c.level === 'error');
  const warningChecks = checks.filter(
    (c) => !c.passed && c.level === 'warning'
  );
  const passedCount = checks.filter((c) => c.passed).length;

  const isValid = errorChecks.length === 0;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    isValid,
    score,
    checks,
    summary: {
      total: checks.length,
      passed: passedCount,
      errors: errorChecks.length,
      warnings: warningChecks.length,
    },
  };
}
