/**
 * quiz-extractor.js
 *
 * Extracts and parses quiz questions, answer options, correct answer markers,
 * and explanations from HTML or raw text extracted from Word or PDF documents.
 */

/**
 * Regex patterns to detect quiz or assessment sections
 */
export const QUIZ_HEADER_REGEX =
  /(?:lesson\s*quiz|knowledge\s*check|quiz\s*questions|self[- ]assessment|practice\s*quiz|module\s*quiz)/i;
export const FINAL_EXAM_HEADER_REGEX =
  /(?:final\s*exam|comprehensive\s*(?:final\s*)?exam|course\s*(?:final\s*)?assessment|certification\s*exam)/i;

/**
 * Check if a title or heading indicates a quiz or exam
 */
export function isQuizHeading(title) {
  if (!title) return false;
  return QUIZ_HEADER_REGEX.test(title);
}

export function isFinalExamHeading(title) {
  if (!title) return false;
  return FINAL_EXAM_HEADER_REGEX.test(title);
}

/**
 * Parses quiz content HTML into structured question objects:
 * [{
 *   question_id: "q1",
 *   question: "When power factor drops...",
 *   options: [
 *     { value: "A", label: "..." },
 *     { value: "B", label: "..." }
 *   ],
 *   correct_answer: "A",
 *   explanation: "..."
 * }]
 *
 * @param {string} quizHtml - HTML content containing the quiz questions
 * @param {string} [idPrefix='q'] - Prefix for question IDs (e.g. 'q' or 'fe_q')
 * @returns {Array<object>} - Array of structured question objects
 */
export function parseQuizFromHtml(quizHtml, idPrefix = 'q') {
  if (!quizHtml || typeof quizHtml !== 'string') return [];

  // Break HTML into paragraphs/headings or clean blocks
  // First convert <br> to newline and remove outer wrappers
  const clean = quizHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n');

  // Strip remaining HTML tags to work with text lines, while preserving line breaks
  const rawLines = clean
    .split('\n')
    .map((l) => l.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean);

  const questions = [];
  let currentQ = null;

  // Patterns
  const qStartRegex = /^(?:Question\s*(\d+)[:.]?|(\d+)[.:]\s+)(.*)/i;
  const optRegex = /^([A-Ea-e])[.:)]\s+(.*)/i;
  const correctMarkerRegex =
    /\((?:correct|answer|✓|true)\)|\[(?:correct|answer|x|✓)\]|\*(?:correct)?/i;
  const separateAnswerRegex =
    /^(?:Correct\s*Answer|Answer|Correct\s*Option|Key)[:\s]+(?:Option\s*)?([A-Ea-e])/i;
  const explanationRegex =
    /^(?:Explanation|Rationale|Feedback|Note)[:\s]+(.*)/i;

  function finalizeQuestion(q) {
    if (!q || !q.question) return;
    // If no correct answer was marked, check if an option had a marker
    if (!q.correct_answer && q.detectedCorrect) {
      q.correct_answer = q.detectedCorrect;
    }
    // Default fallback if still missing: choose 'A' with a flag
    if (!q.correct_answer && q.options.length > 0) {
      q.correct_answer = q.options[0].value;
    }

    questions.push({
      question_id: `${idPrefix}${questions.length + 1}`,
      question: q.question.trim(),
      options: q.options,
      correct_answer: (q.correct_answer || 'A').toUpperCase(),
      explanation: (q.explanation || '').trim(),
    });
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Check if line is a question header like "Question 1" or "Question 1: What is..." or "1. What is..."
    const qMatch = line.match(qStartRegex);
    if (qMatch) {
      // If we already had a question in progress, finalize it
      if (currentQ) {
        finalizeQuestion(currentQ);
      }

      const qNum = qMatch[1] || qMatch[2];
      let qText = qMatch[3] || '';

      // If the line was just "Question 1", the actual question text is on subsequent line(s)
      currentQ = {
        questionNumber: qNum,
        question: qText,
        options: [],
        correct_answer: '',
        explanation: '',
        detectedCorrect: '',
      };
      continue;
    }

    // If no question is active yet, skip introductory lines (e.g., "Lesson Quiz", "Answer each question")
    if (!currentQ) {
      continue;
    }

    // Check if line is an Option: "A. Current...", "B) ...", "C. ... (correct)"
    const optMatch = line.match(optRegex);
    if (optMatch) {
      const optLetter = optMatch[1].toUpperCase();
      let optText = optMatch[2].trim();

      // Check for inline correct marker
      if (correctMarkerRegex.test(optText)) {
        currentQ.detectedCorrect = optLetter;
        currentQ.correct_answer = optLetter;
        optText = optText.replace(correctMarkerRegex, '').trim();
      }

      currentQ.options.push({
        value: optLetter,
        label: optText,
      });
      continue;
    }

    // Check for separate "Correct Answer: B" line
    const ansMatch = line.match(separateAnswerRegex);
    if (ansMatch) {
      currentQ.correct_answer = ansMatch[1].toUpperCase();
      continue;
    }

    // Check for "Explanation: ..." line
    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      currentQ.explanation = expMatch[1].trim();
      continue;
    }

    // If we already have options, any trailing text might be continuation of explanation
    if (currentQ.options.length > 0) {
      if (currentQ.explanation) {
        currentQ.explanation += ' ' + line;
      } else if (/^why[:\s]+/i.test(line)) {
        currentQ.explanation = line.replace(/^why[:\s]+/i, '').trim();
      }
      continue;
    }

    // If we haven't encountered options yet, this line is part of the question text
    if (currentQ.options.length === 0) {
      if (!currentQ.question) {
        currentQ.question = line;
      } else {
        currentQ.question += ' ' + line;
      }
    }
  }

  // Finalize the last question
  if (currentQ) {
    finalizeQuestion(currentQ);
  }

  return questions;
}
