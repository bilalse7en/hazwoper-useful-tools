/**
 * folder-converter.js
 *
 * Handles folder-based multi-module, multi-lesson course ingestion and sequential conversion.
 * Enables users to upload or drag an entire course directory (or multiple files) containing:
 * - Module subfolders (e.g. "Module 1_Utility Interconnection", "Module 2_Transformers & Switchgear")
 * - Lesson documents (e.g. "Lesson 1_Utility Power Entry.docx", "Lesson 2_Main Distribution.docx")
 *
 * Automatically sequences modules and lessons numerically, parses every lesson's
 * topics and quizzes, normalizes HTML into 1 clean parent div, and builds a unified,
 * validated LMS Course JSON with total duration calculations.
 */

import { parseDocxDocument, parsePdfDocument } from './doc-parser.js';
import { buildCourseJson } from './schema-builder.js';
import { validateCourseJson } from './validator.js';

/**
 * Ensures a lesson title starts with the exact, properly formatted "Lesson {number}: " prefix
 * e.g. "Utility Power Entry" -> "Lesson 1: Utility Power Entry"
 * e.g. "Lesson 1_Utility Power Entry" -> "Lesson 1: Utility Power Entry"
 * e.g. "Lesson 2: Transformers" -> "Lesson 2: Transformers"
 * When lessonNumber is 0, strictly returns "Introduction" (never "Lesson 0")
 */
export function ensureLessonNumberPrefix(title, lessonNumber) {
  if (lessonNumber === 0) {
    return 'Introduction';
  }
  if (!title) return `Lesson ${lessonNumber}`;
  const clean = title.trim();
  const match = clean.match(/^(?:Lesson|Chapter)\s*\d+[\s_:-]+(.*)$/i);
  if (match) {
    const rest = match[1].trim().replace(/^[-_:\s]+/, '');
    return `Lesson ${lessonNumber}: ${rest}`;
  }
  return `Lesson ${lessonNumber}: ${clean}`;
}

/**
 * Ensures a module title starts with the exact, properly formatted "Module {number}: " prefix
 * e.g. "Utility Interconnection" -> "Module 1: Utility Interconnection"
 * When moduleNumber is 0, formats as "Module 0: {title}" or "Module 0: Introduction"
 */
export function ensureModuleNumberPrefix(title, moduleNumber) {
  if (moduleNumber === 0) {
    if (!title) return 'Module 0: Introduction';
    const clean = title.trim();
    if (/^module\s*0\b/i.test(clean)) return clean;
    const rest = clean
      .replace(/^(?:Module|Unit|Section)\s*\d*[\s_:-]*/i, '')
      .trim();
    return `Module 0: ${rest || 'Introduction'}`;
  }
  if (!title) return `Module ${moduleNumber}`;
  const clean = title.trim();
  const match = clean.match(/^(?:Module|Unit|Section)\s*\d+[\s_:-]+(.*)$/i);
  if (match) {
    const rest = match[1].trim().replace(/^[-_:\s]+/, '');
    return `Module ${moduleNumber}: ${rest}`;
  }
  return `Module ${moduleNumber}: ${clean}`;
}

/**
 * Checks if a module is an introductory module or matches the course title
 */
export function isIntroductoryModule(moduleTitle = '', courseTitle = '') {
  if (!moduleTitle) return false;
  const cleanMod = moduleTitle.toLowerCase().trim();
  const cleanCourse = (courseTitle || '').toLowerCase().trim();

  if (
    /\b(?:module\s*0\b|intro(?:duction)?\b|overview\b|course\s*overview\b|syllabus\b)/i.test(
      cleanMod
    )
  ) {
    return true;
  }
  if (cleanCourse && cleanCourse.length > 3) {
    const modWithoutPrefix = cleanMod
      .replace(/^(?:module|unit|section)\s*\d*[:\s_-]*/i, '')
      .trim();
    if (
      modWithoutPrefix &&
      (modWithoutPrefix === cleanCourse ||
        modWithoutPrefix.includes(cleanCourse) ||
        cleanCourse.includes(modWithoutPrefix))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Normalizes title string by replacing underscores, repeated spaces, and formatting prefixes
 * e.g. "Module 1_Utility Interconnection & Distribution" -> "Module 1: Utility Interconnection & Distribution"
 * e.g. "Lesson 1_Utility Power Entry and Service Configuration.docx" -> "Lesson 1: Utility Power Entry and Service Configuration"
 */
export function formatHierarchyTitle(rawName, type = 'lesson') {
  if (!rawName) return '';

  // Remove file extensions (.docx, .doc, .pdf)
  let clean = rawName.replace(/\.(docx?|pdf)$/i, '').trim();

  // Normalize Unicode punctuation and clean weird characters
  clean = clean.replace(/[\u2010-\u2015]/g, '-').replace(/\^J\s*/g, ', ');

  if (type === 'module') {
    // Check for "Module 1_Title" or "Module 1 - Title" or "Module 1 Title"
    const modMatch = clean.match(
      /^(Module|Unit|Section)\s*(\d+)[\s_:-]+(.*)$/i
    );
    if (modMatch) {
      const label =
        modMatch[1].charAt(0).toUpperCase() +
        modMatch[1].slice(1).toLowerCase();
      const num = modMatch[2];
      const rest = modMatch[3].trim().replace(/^[-_:\s]+/, '');
      return `${label} ${num}: ${rest}`;
    }
  }

  if (type === 'lesson') {
    // Check for "Lesson 1_Title" or "Lesson 1 - Title" or "Lesson 1 Title"
    const lesMatch = clean.match(/^(Lesson|Chapter)\s*(\d+)[\s_:-]+(.*)$/i);
    if (lesMatch) {
      const label =
        lesMatch[1].charAt(0).toUpperCase() +
        lesMatch[1].slice(1).toLowerCase();
      const num = lesMatch[2];
      const rest = lesMatch[3].trim().replace(/^[-_:\s]+/, '');
      return `${label} ${num}: ${rest}`;
    }
  }

  // Fallback: replace underscores with spaces
  return clean.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extracts a numeric sort key from a title or path
 * e.g. "Module 2_..." -> 2
 * e.g. "Lesson 10_..." -> 10
 */
export function extractSortNumber(str, defaultNum = 999) {
  if (!str) return defaultNum;
  const match = str.match(/(?:module|lesson|unit|section|chapter)\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  const anyNum = str.match(/(\d+)/);
  if (anyNum) {
    return parseInt(anyNum[1], 10);
  }
  return defaultNum;
}

/**
 * Analyzes an array of uploaded file objects and organizes them into a sequenced Course -> Module -> Lesson tree.
 *
 * @param {Array<{ file: File|object, relativePath: string, name?: string }>} fileItems
 * @returns {object} Sequenced Course Hierarchy
 */
export function groupFilesByCourseHierarchy(fileItems = []) {
  // Filter for valid document files only
  const validFiles = fileItems.filter((item) => {
    const name = item.name || item.file?.name || item.relativePath || '';
    if (
      !name ||
      name.startsWith('.') ||
      name.startsWith('~$') ||
      name.includes('__MACOSX')
    ) {
      return false;
    }
    return /\.(docx?|pdf)$/i.test(name);
  });

  if (validFiles.length === 0) {
    return {
      courseTitle: 'Untitled Course',
      totalFiles: 0,
      modules: [],
    };
  }

  let detectedCourseTitle = '';
  const modulesMap = new Map();

  for (const item of validFiles) {
    const rawPath = (
      item.relativePath ||
      item.file?.webkitRelativePath ||
      item.name ||
      item.file?.name ||
      ''
    ).replace(/\\/g, '/');

    const pathSegments = rawPath.split('/').filter(Boolean);

    let moduleKey = '';
    let moduleDisplayTitle = '';

    if (pathSegments.length >= 3) {
      // Path: "Course Name / Module Folder / Lesson File.docx"
      if (!detectedCourseTitle) {
        detectedCourseTitle = formatHierarchyTitle(pathSegments[0], 'course');
      }
      moduleKey = pathSegments[1];
      moduleDisplayTitle = formatHierarchyTitle(moduleKey, 'module');
    } else if (pathSegments.length === 2) {
      // Path: "Module Folder / Lesson File.docx"
      moduleKey = pathSegments[0];
      moduleDisplayTitle = formatHierarchyTitle(moduleKey, 'module');
    } else {
      // Path: "Lesson File.docx" (flat upload)
      // Attempt to extract module from filename if present
      const modMatch = (item.name || item.file?.name || '').match(
        /(?:Module|Unit|Section)\s*(\d+)/i
      );
      if (modMatch) {
        moduleKey = `Module ${modMatch[1]}`;
        moduleDisplayTitle = `Module ${modMatch[1]}: Core Topics`;
      } else {
        moduleKey = 'Module 1: General Curriculum';
        moduleDisplayTitle = 'Module 1: General Curriculum';
      }
    }

    const lessonRawName =
      pathSegments[pathSegments.length - 1] ||
      item.name ||
      item.file?.name ||
      '';
    const lessonDisplayTitle = formatHierarchyTitle(lessonRawName, 'lesson');
    const lessonNumber = extractSortNumber(lessonRawName, 999);
    const moduleNumber = extractSortNumber(moduleKey, 999);

    if (!modulesMap.has(moduleKey)) {
      modulesMap.set(moduleKey, {
        moduleFolder: moduleKey,
        moduleNumber,
        moduleTitle: moduleDisplayTitle,
        lessons: [],
      });
    }

    const modEntry = modulesMap.get(moduleKey);
    modEntry.lessons.push({
      fileName: lessonRawName,
      lessonNumber,
      lessonTitle: lessonDisplayTitle,
      file: item.file || item,
      relativePath: rawPath,
    });
  }

  // Sort modules numerically by moduleNumber
  const sortedModules = Array.from(modulesMap.values()).sort((a, b) => {
    if (a.moduleNumber !== b.moduleNumber) {
      return a.moduleNumber - b.moduleNumber;
    }
    return a.moduleTitle.localeCompare(b.moduleTitle, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  // Check if any module is an introductory module matching the course title or titled "Module 0" / "Introduction"
  const introIndex = sortedModules.findIndex(
    (m) =>
      m.moduleNumber === 0 ||
      isIntroductoryModule(m.moduleTitle, detectedCourseTitle)
  );

  if (introIndex > 0) {
    const [introMod] = sortedModules.splice(introIndex, 1);
    sortedModules.unshift(introMod);
  }

  const hasModule0 =
    sortedModules.length > 0 &&
    (sortedModules[0].moduleNumber === 0 ||
      isIntroductoryModule(sortedModules[0].moduleTitle, detectedCourseTitle));

  // Sort lessons inside each module numerically by lessonNumber and sequence IDs
  sortedModules.forEach((mod, mIdx) => {
    if (hasModule0 && mIdx === 0) {
      mod.moduleIndex = 0;
      mod.moduleId = 'mod_0';
      mod.moduleTitle = ensureModuleNumberPrefix(mod.moduleTitle, 0);
      mod.lessons.sort((a, b) => {
        if (a.lessonNumber !== b.lessonNumber) {
          return a.lessonNumber - b.lessonNumber;
        }
        return a.lessonTitle.localeCompare(b.lessonTitle, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });
      mod.lessons.forEach((les, lIdx) => {
        les.lessonIndex = lIdx;
        les.lessonId = `les_0_${lIdx}`;
        // Lesson 0 is strictly named "Introduction" instead of "Lesson 0"
        les.lessonTitle =
          lIdx === 0
            ? 'Introduction'
            : ensureLessonNumberPrefix(les.lessonTitle, lIdx);
      });
    } else {
      const realModNum = hasModule0 ? mIdx : mIdx + 1;
      mod.moduleIndex = realModNum;
      mod.moduleId = `mod_${realModNum}`;
      mod.moduleTitle = ensureModuleNumberPrefix(mod.moduleTitle, realModNum);
      mod.lessons.sort((a, b) => {
        if (a.lessonNumber !== b.lessonNumber) {
          return a.lessonNumber - b.lessonNumber;
        }
        return a.lessonTitle.localeCompare(b.lessonTitle, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });
      mod.lessons.forEach((les, lIdx) => {
        const realLesNum = lIdx + 1;
        les.lessonIndex = realLesNum;
        les.lessonId = `les_${realModNum}_${realLesNum}`;
        les.lessonTitle = ensureLessonNumberPrefix(les.lessonTitle, realLesNum);
      });
    }
  });

  return {
    courseTitle: detectedCourseTitle || 'Untitled Course',
    totalFiles: validFiles.length,
    modules: sortedModules,
  };
}

/**
 * Sequentially converts a structured course hierarchy into a single, comprehensive LMS Course JSON.
 *
 * @param {object} hierarchy - Output of groupFilesByCourseHierarchy
 * @param {object} [options={}] - Optional configuration and overrides
 * @param {Function} [onProgress] - Optional callback for live progress reporting: (progressInfo) => void
 * @returns {Promise<{ courseJson: object, validation: object, hierarchy: object }>}
 */
export async function convertCourseFolderSequentially(
  hierarchy,
  options = {},
  onProgress = () => {}
) {
  const modules = hierarchy.modules || [];
  let totalLessonsCount = 0;
  modules.forEach((m) => {
    totalLessonsCount += (m.lessons || []).length;
  });

  if (totalLessonsCount === 0) {
    throw new Error(
      'No valid .docx or .pdf lesson documents found in the selected folder.'
    );
  }

  let processedCount = 0;
  let detectedHeaderCourseTitle = '';
  const constructedModules = [];

  const hasModule0 =
    modules.length > 0 &&
    (modules[0].moduleId === 'mod_0' ||
      modules[0].moduleIndex === 0 ||
      isIntroductoryModule(modules[0].moduleTitle, hierarchy.courseTitle));

  for (let mIdx = 0; mIdx < modules.length; mIdx++) {
    const modConfig = modules[mIdx];
    const isMod0 = hasModule0 && mIdx === 0;
    const modNum = isMod0 ? 0 : hasModule0 ? mIdx : mIdx + 1;
    const moduleId = `mod_${modNum}`;
    const moduleTitle =
      modConfig.moduleTitle ||
      ensureModuleNumberPrefix(modConfig.moduleTitle, modNum);

    const moduleLessons = [];

    for (let lIdx = 0; lIdx < modConfig.lessons.length; lIdx++) {
      const lesConfig = modConfig.lessons[lIdx];
      const isLes0 = isMod0 && lIdx === 0;
      const lesNum = isLes0 ? 0 : isMod0 ? lIdx : lIdx + 1;
      const lessonId = `les_${modNum}_${lesNum}`;
      processedCount += 1;

      // Report sequential progress
      const percent = Math.round((processedCount / totalLessonsCount) * 100);
      onProgress({
        current: processedCount,
        total: totalLessonsCount,
        percent,
        currentModule: moduleTitle,
        currentLesson: lesConfig.lessonTitle,
        status: `Converting ${moduleTitle} → ${lesConfig.lessonTitle} (${processedCount}/${totalLessonsCount})...`,
      });

      // Obtain ArrayBuffer / Buffer from file
      let buffer;
      if (typeof lesConfig.file?.arrayBuffer === 'function') {
        buffer = await lesConfig.file.arrayBuffer();
      } else if (lesConfig.file?.buffer) {
        buffer = lesConfig.file.buffer;
      } else {
        buffer = lesConfig.file;
      }

      const isPdf = /\.pdf$/i.test(
        lesConfig.fileName || lesConfig.file?.name || ''
      );
      let parsedData;

      if (isPdf) {
        parsedData = await parsePdfDocument(buffer, {
          mode: 'A',
          fileName: lesConfig.fileName,
          pdfjsLib: options.pdfjsLib,
          stripImages: options.stripImages,
          includeQuizzes: options.includeQuizzes,
        });
      } else {
        parsedData = await parseDocxDocument(buffer, {
          mode: 'A',
          fileName: lesConfig.fileName,
          stripImages: options.stripImages,
          includeQuizzes: options.includeQuizzes,
        });
      }

      // Check if docx headers identify an explicit course title (not just fallback lesson title)
      if (
        !detectedHeaderCourseTitle &&
        parsedData.courseTitle &&
        parsedData.courseTitle !== 'Untitled Course' &&
        parsedData.courseTitle !== parsedData.lessonTitle &&
        parsedData.courseTitle !== lesConfig.lessonTitle
      ) {
        detectedHeaderCourseTitle = parsedData.courseTitle;
      }

      // Use docx lesson title if detected, otherwise fallback to filename-derived title
      const rawLessonTitle =
        parsedData.lessonTitle && parsedData.lessonTitle !== 'Lesson 1'
          ? parsedData.lessonTitle
          : lesConfig.lessonTitle;

      // Strictly ensure every lesson title: if Lesson 0 -> "Introduction", else "Lesson {number}: ..."
      const effectiveLessonTitle = isLes0
        ? 'Introduction'
        : ensureLessonNumberPrefix(rawLessonTitle, lesNum);

      // Format topics with exact module and lesson bindings
      const formattedTopics = (parsedData.topics || []).map((top, tIdx) => {
        const topId = `top_${modNum}_${lesNum}_${tIdx + 1}`;
        return {
          ...top,
          id: topId,
          lessonId,
          moduleId,
        };
      });

      // Format knowledge check with unique sequential question IDs scoped to module and lesson
      const includeQuizzes = options.includeQuizzes !== false;
      const formattedKc = includeQuizzes
        ? (parsedData.knowledge_check || []).map((q, qIdx) => {
            return {
              ...q,
              question_id: `q_${modNum}_${lesNum}_${qIdx + 1}`,
            };
          })
        : [];

      moduleLessons.push({
        lesson_id: lessonId,
        lesson_title: effectiveLessonTitle,
        has_assessment_after: includeQuizzes && formattedKc.length > 0,
        knowledge_check: formattedKc,
        topics: formattedTopics,
      });
    }

    constructedModules.push({
      module_id: moduleId,
      module_title: moduleTitle,
      lessons: moduleLessons,
    });
  }

  // Determine final Course Title (Priority: manual override > non-generic folder title > explicit header title > fallback)
  const finalCourseTitle =
    options.course_title ||
    (hierarchy.courseTitle && hierarchy.courseTitle !== 'Untitled Course'
      ? hierarchy.courseTitle
      : detectedHeaderCourseTitle || 'Power Systems & Electrical Fundamentals');

  // Build master Course JSON
  const courseJson = buildCourseJson(
    {
      courseTitle: finalCourseTitle,
      modules: constructedModules,
    },
    {
      course_id: options.course_id || 'course_1',
      course_title: finalCourseTitle,
      created_by_name: options.created_by_name || '',
      includeQuizzes: options.includeQuizzes,
    }
  );

  // Run 14-point schema validation
  const validation = validateCourseJson(courseJson);

  return {
    courseJson,
    validation,
    hierarchy,
  };
}
