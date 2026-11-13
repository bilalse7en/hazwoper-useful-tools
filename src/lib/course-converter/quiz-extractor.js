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
  /(?:(?:lesson|module|chapter|section|unit)?\s*\d*[:.\s-]*\s*(?:quiz|knowledge\s*check|self[- ]assessment|practice\s*quiz|assessment|review\s*questions|review\s*quiz|check\s*your\s*understanding|practice\s*questions)|^(?:quiz|assessment|knowledge\s*check)\b)/i;
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
 * Safely strips leading list bullets, dashes, checkboxes, and whitespace
 * WITHOUT eating legitimate words starting with 'O' or other English letters (e.g. "On", "Only", "One", "Operating").
 */
export function stripLeadingBulletsAndSymbols(str) {
  if (!str || typeof str !== 'string') return '';
  let res = str.trim();
  let prev = '';
  while (res !== prev) {
    prev = res;
    res = res
      .replace(
        /^[\s\u00a0•\-\*\u2022\u25cf\u25cb\u25ef\u25e6\u29bf\u25aa\u25ab\u25a0\u00b7\u2013\u2014_]+/,
        ''
      )
      .replace(/^(?:\[\s*[xX✓\s]?\s*\]|\(\s*[xX✓\s]?\s*\))\s*/, '')
      .replace(/^[oO]\s+/, '')
      .trim();
  }
  return res;
}

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
  let questionStem = (
    q.question ||
    q.question_text ||
    q.stem ||
    q.text ||
    q.title ||
    ''
  ).trim();

  // Detect and extract trailing correct answer marker attached to question stem, e.g. "(A)", "(B)", "(C)", "(D)"
  let attachedQuestionAnswer = '';
  const qAnsMatch = questionStem.match(
    /(?:[\s\-_:–—]*[\(\[]\s*(?:(?:correct\s*)?ans(?:wer)?[:\s]*)?([A-Ha-h])\s*[\)\]][\s.:;?!]*)$/i
  );
  if (qAnsMatch) {
    attachedQuestionAnswer = qAnsMatch[1].toUpperCase();
    const strippedStem = questionStem.slice(0, qAnsMatch.index).trim();
    if (/\?[\s.:;?!]*$/.test(questionStem) && !strippedStem.endsWith('?')) {
      questionStem = strippedStem + '?';
    } else {
      questionStem = strippedStem;
    }
  }

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
        (attachedQuestionAnswer && attachedQuestionAnswer === letter) ||
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
    attachedQuestionAnswer ||
    q.correct_answer ||
    q.correctAnswer ||
    q.answer ||
    detectedCorrect ||
    (normalizedOptions[0] ? normalizedOptions[0].value : 'A')
  )
    .toString()
    .trim()
    .toUpperCase();

  // Keep is_correct flags in options strictly in sync with correctAnswer (only the correct option is true)
  normalizedOptions.forEach((opt) => {
    opt.is_correct = opt.value === correctAnswer;
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

  // Pre-process tables, ordered lists, and unordered lists so options are cleanly preserved with letters
  let preprocessed = quizHtml;

  // 1. Convert table rows where cell 1 is an option letter or Question header
  preprocessed = preprocessed.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (m, row) => {
    const cells = [];
    row.replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi, (_, text) => {
      cells.push(text.replace(/<[^>]*>/g, '').trim());
    });
    if (cells.length >= 2) {
      const col1 = cells[0];
      const col2 = cells.slice(1).join(' ').trim();
      if (/^[A-H]$/i.test(col1)) {
        return `<p>${col1.toUpperCase()}. ${col2}</p>`;
      } else if (/^(?:Question|Q\.?)\s*\d+/i.test(col1)) {
        return `<p>${col1}: ${col2}</p>`;
      } else if (/^(?:Answer|Correct|Ans|Key)/i.test(col1)) {
        return `<p>Answer: ${col2}</p>`;
      } else if (/^(?:Explanation|Rationale|Feedback)/i.test(col1)) {
        return `<p>Explanation: ${col2}</p>`;
      }
    }
    return m;
  });

  // 2. Convert list items inside <ol> or <ul> into <p>A. ...</p>
  preprocessed = preprocessed.replace(/<(ol|ul)[^>]*>([\s\S]*?)<\/\1>/gi, (match, tag, content) => {
    let optIndex = 0;
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, liText) => {
      const cleanLi = liText.trim();
      const strippedText = cleanLi.replace(/<[^>]*>/g, '').trim();
      if (!strippedText) return '';
      // Strip leading bullets, checkboxes, symbols WITHOUT eating words starting with 'O' or other letters
      const textWithoutBullets = stripLeadingBulletsAndSymbols(strippedText);
      // Check if it already has a letter like A. or B)
      const hasLetter = /^(?:\(?([A-Ha-h0-9])\)?[.:\-–—]|(?:Option\s*([A-Ha-h0-9]))[:.\-–—]?)/i.test(textWithoutBullets);
      if (hasLetter) {
        return `<p>${textWithoutBullets}</p>`;
      }
      const letter = OPTION_LETTERS[optIndex++] || String(optIndex);
      return `<p>${letter}. ${textWithoutBullets}</p>`;
    });
  });

  // Break HTML into paragraphs/headings/table cells or clean blocks
  const clean = preprocessed
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
    /^(?:\(?([A-Ha-h0-9])\)?[.:\-–—]|\(?([A-Ha-h0-9])\)|(?:Option\s*([A-Ha-h0-9]))[:.\-–—]?)\s*(.*)/i;
  const correctMarkerRegex =
    /\((?:correct|answer|key|✓|true)\)|\[(?:correct|answer|key|x|✓)\]|\*(?:correct)?/i;
  const separateAnswerRegex =
    /^(?:Correct\s*Answer|Answer\s*Key|Answer|Correct\s*Option|Key|Correct|Ans)[:\s=]+(?:Option\s*)?\(?([A-Ha-h0-9]|True|False)\)?/i;
  const explanationRegex =
    /^(?:Explanation|Rationale|Feedback|Note)[:\s]+(.*)/i;

  function finalizeQuestion(q) {
    if (!q || (!q.question && q.options.length === 0)) return;

    // Check if question stem has attached correct answer (e.g. (A), (B), (C), (D))
    if (q.question) {
      const qAnsMatch = q.question.match(
        /(?:[\s\-_:–—]*[\(\[]\s*(?:(?:correct\s*)?ans(?:wer)?[:\s]*)?([A-Ha-h])\s*[\)\]][\s.:;?!]*)$/i
      );
      if (qAnsMatch) {
        const attachedLetter = qAnsMatch[1].toUpperCase();
        q.correct_answer = attachedLetter;
        q.detectedCorrect = attachedLetter;
        const stripped = q.question.slice(0, qAnsMatch.index).trim();
        q.question =
          /\?[\s.:;?!]*$/.test(q.question) && !stripped.endsWith('?')
            ? stripped + '?'
            : stripped;
      }
    }

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

    // Strip leading bullets, checkboxes, symbols before matching options WITHOUT eating words starting with 'O'
    const cleanOptLine = stripLeadingBulletsAndSymbols(line);

    // Check if line is an Option: "A. Current...", "B) ...", "C. ... (correct)"
    const optMatch = cleanOptLine.match(optRegex);
    if (optMatch) {
      const optLetter = (
        optMatch[1] ||
        optMatch[2] ||
        optMatch[3]
      ).toUpperCase();
      let optText = (optMatch[4] || '').trim();

      // If option letter was on its own line and next line has option text
      if (
        !optText &&
        i + 1 < rawLines.length &&
        !rawLines[i + 1].match(qStartRegex) &&
        !rawLines[i + 1].match(optRegex)
      ) {
        i++;
        optText = rawLines[i].trim();
      }

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
      const rawAns = ansMatch[1].toUpperCase();
      currentQ.correct_answer =
        rawAns === 'TRUE' ? 'A' : rawAns === 'FALSE' ? 'B' : rawAns;
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
