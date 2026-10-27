/**
 * doc-parser.js
 *
 * Core document ingestion and structural segmentation engine.
 * Supports:
 * - Word documents (.docx, .doc) via Mammoth + JSZip header metadata
 * - PDF documents (.pdf) via PDF.js text layer extraction
 * - Raw HTML / Text input
 *
 * Supports two conversion modes:
 * - Mode A: Lesson-wise (Single lesson -> topics + knowledge_check)
 * - Mode B: Course-wise (Full course -> modules -> lessons -> topics + lesson quizzes + final exam)
 */

import mammoth from 'mammoth';
import { extractDocxHeaderMetadata } from '../adobe-stock/toc-parser.js';
import {
  normalizeHtmlContent,
  wrapInLmsContainer,
  calculateTopicDuration,
  calculateWordCount,
  extractImageMetadata,
} from './html-normalizer.js';
import {
  isQuizHeading,
  isFinalExamHeading,
  parseQuizFromHtml,
} from './quiz-extractor.js';

/**
 * Clean plain text title
 */
function cleanTitle(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Segments Mammoth-generated HTML into topics and quizzes for Lesson-wise Mode (Mode A)
 *
 * @param {string} html - Raw HTML from Mammoth
 * @param {object} metadata - { courseTitle, moduleTitle, lessonTitle }
 * @returns {object} { courseTitle, moduleTitle, lessonTitle, topics, knowledge_check }
 */
export function segmentLessonWiseHtml(html, metadata = {}, options = {}) {
  let courseTitle = metadata.courseTitle || '';
  let moduleTitle = metadata.moduleTitle || 'Module 1: General Knowledge';
  let lessonTitle = metadata.lessonTitle || '';

  // Split HTML into blocks by <h1> tags
  const rawParts = html.split(/(?=<h1[^>]*>)/i).filter(Boolean);

  const topics = [];
  let knowledge_check = [];

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i].trim();
    if (!part) continue;

    // Check if this part starts with <h1>
    const h1Match = part.match(/<h1[^>]*>([\s\S]*?)<\/h1>([\s\S]*)/i);

    if (!h1Match) {
      // Preamble before the first <h1>
      // Check if it contains a title
      const text = part.replace(/<[^>]*>/g, '').trim();
      if (text && !lessonTitle) {
        lessonTitle = text;
      }
      continue;
    }

    const headingText = cleanTitle(h1Match[1]);
    const bodyContent = h1Match[2] || '';

    // Check if this section is a Lesson Quiz / Knowledge Check
    if (isQuizHeading(headingText)) {
      const parsedQuestions = parseQuizFromHtml(bodyContent || part, 'q');
      if (parsedQuestions.length > 0) {
        knowledge_check = parsedQuestions;
      }
      continue;
    }

    // Check if this section is a Final Exam
    if (isFinalExamHeading(headingText)) {
      // In lesson-wise mode, if someone included a quiz labeled "exam", treat as quiz
      const parsedQuestions = parseQuizFromHtml(bodyContent || part, 'q');
      if (parsedQuestions.length > 0 && knowledge_check.length === 0) {
        knowledge_check = parsedQuestions;
      }
      continue;
    }

    // Normal topic
    const imgMeta = extractImageMetadata(bodyContent);
    const stripImages = options.stripImages !== false;
    const innerCleanHtml = normalizeHtmlContent(bodyContent, { stripImages });
    const editorHtml = wrapInLmsContainer(innerCleanHtml, { stripImages });
    const duration = calculateTopicDuration(innerCleanHtml);

    // If images are OFF (stripImages = true), skip image codes, prompts, and set slide_type to content
    const imageCode = stripImages ? '' : imgMeta.primaryImageCode || '';
    const imagePrompt = stripImages ? '' : imgMeta.primaryPrompt || '';
    const hasEmbeddedImage = stripImages ? false : imgMeta.hasImages;
    const isImageSlide =
      !stripImages && Boolean(imgMeta.primaryImageCode || imgMeta.hasImages);

    topics.push({
      id: `top_1_1_${topics.length + 1}`,
      name: headingText,
      headingContent: headingText,
      selectedTemplate: 1,
      lessonId: 'les_1_1',
      moduleId: 'mod_1',
      slide_type: 'image',
      allocated_duration_seconds: duration,
      topicDuration: duration,
      image_source: imageCode,
      image_code: imageCode,
      image_prompt: imagePrompt,
      has_embedded_image: hasEmbeddedImage,
      raw_body_content: bodyContent,
      datatime: '0',
      captions: [],
      narration_script: '',
      leftDiv: {
        audio: { isAudio: false, audioURL: '', audioFile: '', audioName: '' },
        image: {
          isImage: isImageSlide,
          imageURL: imageCode,
          imageFile: '',
          imageName: imageCode,
        },
        video: { isVideo: false, videoURL: '', videoFile: '', videoName: '' },
        width: 'col-12',
        editor: editorHtml,
        editorHtml: editorHtml,
        editorSaved: editorHtml,
        editorHtmlSaved: editorHtml,
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
    });
  }

  // Fallbacks if titles are still missing
  if (!lessonTitle && topics.length > 0) {
    lessonTitle = topics[0].name;
  }
  if (!courseTitle) {
    courseTitle = lessonTitle || 'Untitled Course';
  }

  return {
    courseTitle,
    moduleTitle,
    lessonTitle,
    topics,
    knowledge_check,
  };
}

/**
 * Segments Mammoth-generated HTML into Course -> Modules -> Lessons -> Topics -> Quizzes -> Final Exam (Mode B)
 *
 * @param {string} html - Raw HTML from Mammoth
 * @param {object} metadata - { courseTitle, moduleTitle, lessonTitle }
 * @returns {object} { courseTitle, modules: [...], final_exam: {...} }
 */
export function segmentCourseWiseHtml(html, metadata = {}, options = {}) {
  let courseTitle = metadata.courseTitle || '';
  const rawParts = html.split(/(?=<h[1-2][^>]*>)/i).filter(Boolean);

  const modules = [];
  let currentModule = null;
  let currentLesson = null;
  let final_exam_questions = [];

  const modRegex =
    /^(?:Module\s*(\d+)[:\s-]*|(?:Section|Unit)\s*(\d+)[:\s-]*)(.*)/i;
  const lesRegex = /^(?:Lesson\s*(\d+)[:\s-]*|Chapter\s*(\d+)[:\s-]*)(.*)/i;

  function ensureModule(title = '') {
    if (!currentModule) {
      const modIndex = modules.length + 1;
      currentModule = {
        module_id: `mod_${modIndex}`,
        module_title:
          title ||
          metadata.moduleTitle ||
          `Module ${modIndex}: Core Curriculum`,
        lessons: [],
      };
      modules.push(currentModule);
    }
    return currentModule;
  }

  function ensureLesson(title = '') {
    ensureModule();
    if (!currentLesson) {
      const modIndex = modules.length;
      const lesIndex = currentModule.lessons.length + 1;
      currentLesson = {
        lesson_id: `les_${modIndex}_${lesIndex}`,
        lesson_title: title || metadata.lessonTitle || `Lesson ${lesIndex}`,
        has_assessment_after: true,
        knowledge_check: [],
        topics: [],
      };
      currentModule.lessons.push(currentLesson);
    }
    return currentLesson;
  }

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i].trim();
    if (!part) continue;

    const hMatch = part.match(/<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>([\s\S]*)/i);
    if (!hMatch) {
      const text = part.replace(/<[^>]*>/g, '').trim();
      if (text && !courseTitle) {
        courseTitle = text;
      }
      continue;
    }

    const headingText = cleanTitle(hMatch[1]);
    const bodyContent = hMatch[2] || '';

    // Check if Course Title
    if (/^Course[:\s-]+(.*)/i.test(headingText)) {
      courseTitle = headingText.replace(/^Course[:\s-]+/i, '').trim();
      continue;
    }

    // Check if Final Exam
    if (isFinalExamHeading(headingText)) {
      const questions = parseQuizFromHtml(bodyContent || part, 'fe_q');
      final_exam_questions.push(...questions);
      continue;
    }

    // Check if Lesson Quiz / Knowledge Check
    if (isQuizHeading(headingText)) {
      ensureLesson();
      const modIndex = modules.length;
      const lesIndex = currentModule.lessons.length;
      const questions = parseQuizFromHtml(
        bodyContent || part,
        `q_${modIndex}_${lesIndex}_`
      );
      if (questions.length > 0) {
        currentLesson.knowledge_check.push(...questions);
      }
      continue;
    }

    // Check if Module Header
    const modMatch = headingText.match(modRegex);
    if (modMatch) {
      const modIndex = modules.length + 1;
      const title = headingText;
      currentModule = {
        module_id: `mod_${modIndex}`,
        module_title: title,
        lessons: [],
      };
      modules.push(currentModule);
      currentLesson = null; // reset lesson for new module
      continue;
    }

    // Check if Lesson Header
    const lesMatch = headingText.match(lesRegex);
    if (lesMatch) {
      ensureModule();
      const modIndex = modules.length;
      const lesIndex = currentModule.lessons.length + 1;
      currentLesson = {
        lesson_id: `les_${modIndex}_${lesIndex}`,
        lesson_title: headingText,
        has_assessment_after: true,
        knowledge_check: [],
        topics: [],
      };
      currentModule.lessons.push(currentLesson);
      continue;
    }

    // Otherwise, this is a topic under the current lesson
    ensureLesson();
    const modIndex = modules.length;
    const lesIndex = currentModule.lessons.length;
    const topIndex = currentLesson.topics.length + 1;

    const imgMeta = extractImageMetadata(bodyContent);
    const stripImages = options.stripImages !== false;
    const innerCleanHtml = normalizeHtmlContent(bodyContent, { stripImages });
    const editorHtml = wrapInLmsContainer(innerCleanHtml, { stripImages });
    const duration = calculateTopicDuration(innerCleanHtml);

    // If images are OFF (stripImages = true), skip image codes, prompts, and set slide_type to content
    const imageCode = stripImages ? '' : imgMeta.primaryImageCode || '';
    const imagePrompt = stripImages ? '' : imgMeta.primaryPrompt || '';
    const hasEmbeddedImage = stripImages ? false : imgMeta.hasImages;
    const isImageSlide =
      !stripImages && Boolean(imgMeta.primaryImageCode || imgMeta.hasImages);

    currentLesson.topics.push({
      id: `top_${modIndex}_${lesIndex}_${topIndex}`,
      name: headingText,
      headingContent: headingText,
      selectedTemplate: 1,
      lessonId: currentLesson.lesson_id,
      moduleId: currentModule.module_id,
      slide_type: 'image',
      allocated_duration_seconds: duration,
      topicDuration: duration,
      image_source: imageCode,
      image_code: imageCode,
      image_prompt: imagePrompt,
      has_embedded_image: hasEmbeddedImage,
      raw_body_content: bodyContent,
      datatime: '0',
      captions: [],
      narration_script: '',
      leftDiv: {
        audio: { isAudio: false, audioURL: '', audioFile: '', audioName: '' },
        image: {
          isImage: isImageSlide,
          imageURL: imageCode,
          imageFile: '',
          imageName: imageCode,
        },
        video: { isVideo: false, videoURL: '', videoFile: '', videoName: '' },
        width: 'col-12',
        editor: editorHtml,
        editorHtml: editorHtml,
        editorSaved: editorHtml,
        editorHtmlSaved: editorHtml,
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
    });
  }

  if (!courseTitle) {
    courseTitle = metadata.courseTitle || 'Master Course Curriculum';
  }

  let final_exam = null;
  if (final_exam_questions.length > 0) {
    final_exam = {
      id: 'fe_1',
      title: 'Comprehensive Final Exam',
      description: 'Course-level comprehensive evaluation',
      passingScore: 70,
      isCompulsory: true,
      timeLimit: Math.max(1800, final_exam_questions.length * 120),
      questionCount: final_exam_questions.length,
      questions: final_exam_questions,
    };
  }

  return {
    courseTitle,
    modules,
    final_exam,
  };
}

/**
 * High-level parser for Word documents (.docx, .doc)
 * @param {ArrayBuffer|Buffer} buffer
 * @param {object} options - { mode: 'A'|'B', overrides: {...} }
 */
export async function parseDocxDocument(buffer, options = {}) {
  const mode = options.mode || 'A';
  let headerMeta = {};

  try {
    headerMeta = await extractDocxHeaderMetadata(buffer);
  } catch (err) {
    console.warn('Docx header metadata extraction skipped or failed:', err);
  }

  const mergedMeta = {
    courseTitle: options.courseTitle || headerMeta.courseTitle || '',
    moduleTitle: options.moduleTitle || headerMeta.moduleTitle || '',
    lessonTitle: options.lessonTitle || headerMeta.lessonTitle || '',
  };

  // Convert buffer to HTML with Mammoth
  const mammothInput = Buffer.isBuffer(buffer)
    ? { buffer }
    : { arrayBuffer: buffer };
  const mammothResult = await mammoth.convertToHtml(mammothInput);
  const rawHtml = mammothResult.value;

  if (mode === 'B') {
    return segmentCourseWiseHtml(rawHtml, mergedMeta, options);
  } else {
    return segmentLessonWiseHtml(rawHtml, mergedMeta, options);
  }
}

/**
 * High-level parser for PDF documents (.pdf)
 * Extracts text and constructs structural HTML blocks, then segments.
 * @param {ArrayBuffer} arrayBuffer
 * @param {object} options - { mode: 'A'|'B', pdfjsLib, overrides: {...} }
 */
export async function parsePdfDocument(arrayBuffer, options = {}) {
  let pdfjsLib = options.pdfjsLib;

  // If in Node.js environment and pdfjsLib not passed
  if (!pdfjsLib && typeof window === 'undefined') {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
  }

  if (!pdfjsLib) {
    throw new Error('PDF.js library is required to parse PDF documents.');
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  let fullHtml = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items;

    let pageLines = [];
    let currentLine = '';
    let lastY = null;
    let maxFontSize = 0;

    for (const item of items) {
      const text = item.str;
      if (!text) continue;

      const y = item.transform ? Math.round(item.transform[5]) : 0;
      const fontSize = item.transform
        ? Math.abs(Math.round(item.transform[0]))
        : 12;
      if (fontSize > maxFontSize) maxFontSize = fontSize;

      if (lastY === null || Math.abs(y - lastY) < 4) {
        currentLine += (currentLine ? ' ' : '') + text;
      } else {
        if (currentLine.trim()) {
          pageLines.push({ text: currentLine.trim(), fontSize });
        }
        currentLine = text;
      }
      lastY = y;
    }
    if (currentLine.trim()) {
      pageLines.push({ text: currentLine.trim(), fontSize: maxFontSize });
    }

    // Convert page lines to HTML
    for (const line of pageLines) {
      const t = line.text;
      // Heuristic for headings in PDF: all caps, short line, or larger font
      if (
        line.fontSize >= 15 ||
        /^(?:introduction|learning objectives|summary|lesson quiz|final exam)/i.test(
          t
        ) ||
        (/^[A-Z0-9\s:,-]{5,60}$/.test(t) &&
          !/[.!?]$/.test(t) &&
          t.split(' ').length < 9)
      ) {
        fullHtml += `<h1>${t}</h1>\n`;
      } else if (/^question\s*\d+/i.test(t)) {
        fullHtml += `<h3>${t}</h3>\n`;
      } else if (/^[A-E][.)]\s+/i.test(t)) {
        fullHtml += `<p>${t}</p>\n`;
      } else {
        fullHtml += `<p>${t}</p>\n`;
      }
    }
  }

  const mergedMeta = {
    courseTitle: options.courseTitle || '',
    moduleTitle: options.moduleTitle || '',
    lessonTitle: options.lessonTitle || '',
  };

  const mode = options.mode || 'A';
  if (mode === 'B') {
    return segmentCourseWiseHtml(fullHtml, mergedMeta, options);
  } else {
    return segmentLessonWiseHtml(fullHtml, mergedMeta, options);
  }
}
