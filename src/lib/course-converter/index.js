/**
 * index.js
 *
 * Consolidated entrypoint for the CourseJsonConverter engine.
 */

export * from './html-normalizer.js';
export * from './quiz-extractor.js';
export * from './doc-parser.js';
export * from './schema-builder.js';
export * from './validator.js';
export * from './folder-converter.js';

import { parseDocxDocument, parsePdfDocument } from './doc-parser.js';
import { buildCourseJson } from './schema-builder.js';
import { validateCourseJson } from './validator.js';

/**
 * End-to-end conversion from file buffer to validated LMS Course JSON
 *
 * @param {ArrayBuffer|Buffer} buffer - File buffer
 * @param {object} options - { fileName, mode: 'A'|'B', overrides: {...}, pdfjsLib }
 * @returns {Promise<object>} { courseJson, validation, parsedData }
 */
export async function convertDocumentToCourseJson(buffer, options = {}) {
  const fileName = options.fileName || 'document.docx';
  const isPdf = /\.pdf$/i.test(fileName);
  const mode = options.mode || 'A';

  let parsedData;
  if (isPdf) {
    parsedData = await parsePdfDocument(buffer, { ...options, mode });
  } else {
    parsedData = await parseDocxDocument(buffer, { ...options, mode });
  }

  const courseJson = buildCourseJson(parsedData, {
    ...(options.overrides || {}),
    includeQuizzes: options.includeQuizzes,
  });
  const validation = validateCourseJson(courseJson);

  return {
    courseJson,
    validation,
    parsedData,
  };
}
