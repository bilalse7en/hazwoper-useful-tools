/**
 * quiz-extractor.js
 *
 * Extracts and parses quiz questions, answer options, correct answer markers,
 * and explanations from HTML or raw text extracted from Word or PDF documents.
 * Also provides canonical question normalization between LMS JSON and DB schemas.
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

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Canonical quiz question normalizer:
 * Bridges LMS schema ({ question, options: [{ value, label }], correct_answer, explanation })
 * and Supabase / DB schema ({ question_text, options: [{ option_text, is_correct }], explanation }).
 * Ensures BOTH sets of keys are always populated and in sync.
 *
 * @param {object} q - Raw question object
 * @param {string} [fallbackId='q1'] - Default question ID if missing
 * @returns {object} Fully normalized question object
 */
export function normalizeQuizQuestion(q, fallbackId = 'q1') {
  if (!q || typeof q !== 'object') {
    return {
      question_id: fallbackId,
      question: '',
      question_text: '',
      options: [],
      correct_answer: 'A',
      explanation: '',
    };
  }

  // Question stem extraction
  const questionStem = (
    q.question ||
    q.question_text ||
    q.stem ||
    q.text ||
    q.title ||
    ''
  ).trim();

  let rawOptions = Array.isArray(q.options) ? q.options : [];
  let detectedCorrect = '';

  const normalizedOptions = rawOptions.map((opt, idx) => {
    let letter = OPTION_LETTERS[idx] || `${idx + 1}`;
    let label = '';
    let isCorrect = false;

    if (typeof opt === 'string') {
      label = opt.trim();
    } else if (opt && typeof opt === 'object') {
      letter = (opt.value || OPTION_LETTERS[idx] || `${idx + 1}`)
        .toString()
        .trim()
        .toUpperCase();
      label = (
        opt.label ||
        opt.option_text ||
        opt.text ||
        opt.title ||
        ''
      ).trim();
      isCorrect = Boolean(
        opt.is_correct === true ||
        opt.isCorrect === true ||
        (q.correct_answer &&
          q.correct_answer.toString().trim().toUpperCase() === letter) ||
        (q.correctAnswer &&
          q.correctAnswer.toString().trim().toUpperCase() === letter) ||
        (q.answer && q.answer.toString().trim().toUpperCase() === letter)
      );
    }

    if (isCorrect && !detectedCorrect) {
      detectedCorrect = letter;
    }

    return {
      value: letter,
      label,
      option_text: label,
      is_correct: isCorrect,
    };
  });

  // Determine correct answer
  let correctAnswer = (
    q.correct_answer ||
    q.correctAnswer ||
    q.answer ||
    detectedCorrect ||
    (normalizedOptions[0] ? normalizedOptions[0].value : 'A')
  )
    .toString()
    .trim()
    .toUpperCase();

  // Keep is_correct flags in options in sync with correctAnswer
  normalizedOptions.forEach((opt) => {
    if (opt.value === correctAnswer) {
      opt.is_correct = true;
    }
  });

  const explanation = (
    q.explanation ||
    q.rationale ||
    q.feedback ||
    q.note ||
    ''
  ).trim();

  return {
    ...q,
    question_id: q.question_id || q.id || fallbackId,
    question: questionStem,
    question_text: questionStem,
    options: normalizedOptions,
    correct_answer: correctAnswer,
    explanation,
  };
}

/**
 * Normalizes course final exam object or questions array into
 * the standard LMS final_exam specification.
 *
 * @param {object|Array} finalExam - Final exam object or array of questions
 * @param {string} [idPrefix='fe_q'] - Question ID prefix
 * @returns {object|null} Standardized final_exam object or null
 */
export function normalizeFinalExam(finalExam, idPrefix = 'fe_q') {
  if (!finalExam) return null;

  // Case 1: Array of question objects
  if (Array.isArray(finalExam)) {
    if (finalExam.length === 0) return null;
    const questions = finalExam.map((q, idx) =>
      normalizeQuizQuestion(q, `${idPrefix}_${idx + 1}`)
    );
    return {
      id: 'final_exam',
      title: 'Comprehensive Final Exam',
      description: 'Course-level comprehensive evaluation',
      passingScore: 80,
      timeLimit: Math.max(1800, questions.length * 120),
      questionCount: questions.length,
      questions,
    };
  }

  // Case 2: Standard object
  if (typeof finalExam === 'object') {
    const rawQuestions = Array.isArray(finalExam.questions)
      ? finalExam.questions
      : Array.isArray(finalExam.items)
        ? finalExam.items
        : [];
    const questions = rawQuestions.map((q, idx) =>
      normalizeQuizQuestion(q, `${idPrefix}_${idx + 1}`)
    );
    return {
      id: finalExam.id || 'final_exam',
      title: finalExam.title || 'Comprehensive Final Exam',
      description:
        finalExam.description || 'Course-level comprehensive evaluation',
      passingScore: Number(finalExam.passingScore) || 80,
      timeLimit:
        Number(finalExam.timeLimit) || Math.max(1800, questions.length * 120),
      questionCount: questions.length,
      questions,
    };
  }

  return null;
}

/**
 * Parses quiz content HTML into structured question objects:
 * [{
 *   question_id: "q1",
 *   question: "When power factor drops...",
 *   options: [
 *     { value: "A", label: "...", option_text: "...", is_correct: true },
 *     { value: "B", label: "...", option_text: "...", is_correct: false }
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

  // Break HTML into paragraphs/headings/table cells or clean blocks
  const clean = quizHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '\n')
    .replace(/<\/tr>/gi, '\n');

  // Strip remaining HTML tags to work with text lines, while preserving line breaks
  const rawLines = clean
    .split('\n')
    .map((l) => l.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean);

  const questions = [];
  let currentQ = null;

  // Comprehensive Regex Patterns
  const qStartRegex =
    /^(?:(?:Question|Quiz\s*Question|Q|Q\.)\s*(\d+)[:.\s-]*|(\d+)[.:)\-]\s+)(.*)/i;
  const optRegex =
    /^(?:\(?([A-Ha-h0-9])\)?[.:\-–—]|\(?([A-Ha-h0-9])\)|(?:Option\s*([A-Ha-h0-9]))[:.\-–—]?)\s+(.*)/i;
  const correctMarkerRegex =
    /\((?:correct|answer|✓|true)\)|\[(?:correct|answer|x|✓)\]|\*(?:correct)?/i;
  const separateAnswerRegex =
    /^(?:Correct\s*Answer|Answer|Correct\s*Option|Answer\s*Key|Key|Correct|Ans)[:\s=]+(?:Option\s*)?\(?([A-Ha-h0-9])\)?/i;
  const explanationRegex =
    /^(?:Explanation|Rationale|Feedback|Note)[:\s]+(.*)/i;

  function finalizeQuestion(q) {
    if (!q || (!q.question && q.options.length === 0)) return;

    // Normalize option letters if options were numbered 1, 2, 3, 4
    if (q.options.length > 0 && /^\d+$/.test(q.options[0].value)) {
      q.options.forEach((opt, idx) => {
        const letter = OPTION_LETTERS[idx] || opt.value;
        if (q.correct_answer === opt.value) {
          q.correct_answer = letter;
        }
        opt.value = letter;
      });
    }

    if (!q.correct_answer && q.detectedCorrect) {
      q.correct_answer = q.detectedCorrect;
    }
    if (!q.correct_answer && q.options.length > 0) {
      q.correct_answer = q.options[0].value;
    }

    const fallbackId = `${idPrefix}${questions.length + 1}`;
    const normalized = normalizeQuizQuestion(
      {
        question_id: fallbackId,
        question: (q.question || '').trim(),
        options: q.options,
        correct_answer: (q.correct_answer || 'A').toUpperCase(),
        explanation: (q.explanation || '').trim(),
      },
      fallbackId
    );

    questions.push(normalized);
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Check if line is a question header like "Question 1" or "Question 1: What is..." or "1. What is..."
    const qMatch = line.match(qStartRegex);
    if (qMatch) {
      if (currentQ) {
        finalizeQuestion(currentQ);
      }

      const qNum = qMatch[1] || qMatch[2];
      let qText = qMatch[3] || '';

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

    // If no question is active yet, skip introductory lines
    if (!currentQ) {
      continue;
    }

    // Check if line is an Option: "A. Current...", "B) ...", "C. ... (correct)"
    const optMatch = line.match(optRegex);
    if (optMatch) {
      const optLetter = (
        optMatch[1] ||
        optMatch[2] ||
        optMatch[3]
      ).toUpperCase();
      let optText = optMatch[4].trim();

      // Check for inline correct marker
      if (correctMarkerRegex.test(optText)) {
        currentQ.detectedCorrect = optLetter;
        currentQ.correct_answer = optLetter;
        optText = optText.replace(correctMarkerRegex, '').trim();
      }

      currentQ.options.push({
        value: optLetter,
        label: optText,
        option_text: optText,
        is_correct: currentQ.detectedCorrect === optLetter,
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

    // If we haven't encountered options yet, this line is part of the question stem
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
