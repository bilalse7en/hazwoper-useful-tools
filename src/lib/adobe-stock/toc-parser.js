/**
 * Course Table of Contents (TOC) & Word Document (.docx) Parser
 *
 * Extracts hierarchical Course, Module, Lesson, and Topic structures.
 * Strictly excludes:
 * - Introduction, Learning Objectives, combined "Introduction / Learning Objectives"
 * - Summary, Lesson Summary, Course Summary
 * - Lesson Quizzes, Quizzes, Knowledge Checks, Tests, and Assessments
 * - Questions, Options (A, B, C, D), and Explanations
 *
 * Supports both:
 * 1. .docx files via JSZip header extraction + mammoth HTML conversion.
 * 2. Raw pasted text from Word or course builders.
 */

export const QUIZ_BLOCK_REGEX =
  /^(lesson\s+quiz|quiz|quizzes|knowledge\s+check|assessment|exam|test|questions?(\s+\d+)?|question:)/i;

export const QUIZ_OPTION_OR_ANSWER_REGEX =
  /^([a-d]\.|\(?\d+\)?\s*[a-d]\.|explanation:|\(?correct\)?)/i;

/**
 * Strict regex for non-instructional boilerplate headings to skip.
 * Skips:
 * - "Introduction"
 * - "Learning Objectives" or "Learning Objective"
 * - Combined "Introduction / Learning Objectives", "Introduction & Learning Objectives"
 * - "Table of Contents", "References", "Glossary"
 * Note: "Summary" / "Lesson Summary" is deliberately INCLUDED so learners can find summary slide imagery.
 */
export const BOILERPLATE_REGEX =
  /^(introduction(\s*[\/&,]\s*|\s+(and|&)\s+)learning\s*objectives?|introduction|learning\s*objectives?|table\s+of\s+contents|references|glossary)$/i;

/**
 * Checks whether a heading text should be excluded from image finding topics.
 */
export function isExcludedTopicHeading(headingText) {
  if (!headingText || typeof headingText !== 'string') return true;
  const clean = headingText
    .replace(/^(\d+[\.\)]\s*)+/i, '')
    .replace(/^topic\s*\d*[: -]*/i, '')
    .trim();

  return (
    BOILERPLATE_REGEX.test(clean) ||
    QUIZ_BLOCK_REGEX.test(clean) ||
    QUIZ_OPTION_OR_ANSWER_REGEX.test(clean)
  );
}

/**
 * Parses header text lines to extract Course Name, Module Name, and Lesson Name.
 */
export function parseHeaderText(headerText) {
  if (!headerText) return { courseTitle: '', moduleTitle: '', lessonTitle: '' };
  let courseTitle = '';
  let moduleTitle = '';
  let lessonTitle = '';

  const lines = headerText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/^course(\s+name)?[:\s-]/i.test(line)) {
      courseTitle = line.replace(/^course(\s+name)?[:\s-]+/i, '').trim();
    } else if (/^module(\s+\d+)?[:\s-]/i.test(line)) {
      moduleTitle = line.trim();
    } else if (/^lesson(\s+\d+[:\s-]?|[:#-])/i.test(line)) {
      lessonTitle = line.trim();
    }
  }

  return { courseTitle, moduleTitle, lessonTitle };
}

/**
 * Extracts header XML (<w:t>) directly from a .docx file's zip structure.
 */
export async function extractDocxHeaderMetadata(arrayBuffer) {
  if (!arrayBuffer) return null;
  try {
    const jszipModule = await import('jszip');
    const JSZip = jszipModule.default || jszipModule;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const headerFiles = Object.keys(zip.files).filter((k) =>
      /^word\/header\d+\.xml$/i.test(k)
    );

    let headerText = '';
    for (const hf of headerFiles) {
      const xml = await zip.file(hf).async('text');
      const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
      if (matches) {
        headerText +=
          '\n' +
          matches
            .map((m) => m.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'))
            .join('\n');
      }
    }
    return parseHeaderText(headerText);
  } catch (err) {
    console.warn('[TOC Parser] Could not extract docx header:', err);
    return null;
  }
}

/**
 * Parses raw text or HTML into a clean structured list of topics.
 */
export function parseCourseTOC(input, isHtml = false, headerMetadata = null) {
  if (!input) {
    return {
      courseTitle: '',
      moduleTitle: '',
      lessonTitle: '',
      topics: [],
      totalTopics: 0,
    };
  }

  if (isHtml) {
    return parseHtmlTOC(input, headerMetadata);
  }

  return parseTextTOC(input, headerMetadata);
}

/**
 * Parses raw pasted text line-by-line.
 */
function parseTextTOC(rawText, headerMetadata = null) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let courseTitle = headerMetadata?.courseTitle || '';
  let moduleTitle = headerMetadata?.moduleTitle || '';
  let lessonTitle = headerMetadata?.lessonTitle || '';
  let currentParentSection = '';
  const topics = [];
  const seenTitles = new Set();
  let inQuizSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect quiz start — once hit, stop adding topics from this quiz block
    if (QUIZ_BLOCK_REGEX.test(line)) {
      inQuizSection = true;
      continue;
    }

    // Skip quiz options and explanations
    if (QUIZ_OPTION_OR_ANSWER_REGEX.test(line)) {
      continue;
    }

    // Check if a new Lesson or Module resets the quiz section
    if (
      /^(lesson\s+\d+|module\s+\d+|unit\s+\d+|chapter\s+\d+)/i.test(line) &&
      !QUIZ_BLOCK_REGEX.test(line)
    ) {
      inQuizSection = false;
    }

    if (inQuizSection) {
      continue;
    }

    // Header detection
    if (/^course(\s+name)?[:\s-]/i.test(line)) {
      courseTitle = line.replace(/^course(\s+name)?[:\s-]+/i, '').trim();
      continue;
    }
    if (/^module(\s+\d+)?[:\s-]/i.test(line)) {
      moduleTitle = line.trim();
      continue;
    }
    if (/^lesson(\s+\d+[:\s-]?|[:#-])/i.test(line)) {
      lessonTitle = line.trim();
      currentParentSection = '';
      continue;
    }

    // If first line has no special prefix and lessonTitle not established, check if it's a valid lesson name
    if (
      !lessonTitle &&
      i === 0 &&
      line.length < 100 &&
      !isExcludedTopicHeading(line)
    ) {
      lessonTitle = line;
      continue;
    }

    // Skip non-instructional boilerplate: Introduction, Learning Objectives, Summary, Quizzes
    if (isExcludedTopicHeading(line)) {
      continue;
    }

    // Heading / Topic detection heuristic
    const isTopicCandidate =
      line.length >= 3 && line.length <= 85 && !/[.;,]$/.test(line);

    if (isTopicCandidate) {
      const cleanTitle = line
        .replace(/^(\d+[\.\)]\s*)+/i, '')
        .replace(/^topic\s*\d*[: -]*/i, '')
        .trim();

      const lowerKey = `${lessonTitle || 'L1'}::${cleanTitle.toLowerCase()}`;
      if (cleanTitle.length > 2 && !seenTitles.has(lowerKey)) {
        seenTitles.add(lowerKey);

        const isMainHeading =
          cleanTitle.length > 20 ||
          /fundamentals|equipment|configuration|requirements|distribution|characteristics/i.test(
            cleanTitle
          );
        if (isMainHeading && !currentParentSection) {
          currentParentSection = cleanTitle;
        }

        topics.push({
          id: `topic-${topics.length + 1}`,
          index: topics.length + 1,
          title: cleanTitle,
          parentSection: isMainHeading
            ? undefined
            : currentParentSection || undefined,
          module: moduleTitle || undefined,
          lesson: lessonTitle || 'Lesson 1',
          course: courseTitle || undefined,
        });
      }
    }
  }

  return {
    courseTitle,
    moduleTitle,
    lessonTitle: lessonTitle || courseTitle || '',
    topics,
    totalTopics: topics.length,
  };
}

/**
 * Parses HTML generated by mammoth from a Word (.docx) document.
 * Strictly extracts the primary heading level (H1) for instructional topics.
 * Sub-headings (H2/H3/paragraphs) are intentionally ignored so that sub-sections
 * and question items do not pollute the Table of Contents.
 */
function parseHtmlTOC(htmlContent, headerMetadata = null) {
  let courseTitle = headerMetadata?.courseTitle || '';
  let moduleTitle = headerMetadata?.moduleTitle || '';
  let lessonTitle = headerMetadata?.lessonTitle || '';
  const topics = [];
  const seenTitles = new Set();

  // Helper to discover candidate topics at a specific heading level
  const getCandidateHeadings = (tag) => {
    const re = new RegExp(
      '<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>',
      'gi'
    );
    return [...htmlContent.matchAll(re)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(
        (t) =>
          !isExcludedTopicHeading(t) &&
          !/^(course|module|lesson)\s*\d*[:\s-]/i.test(t)
      );
  };

  const h1Candidates = getCandidateHeadings('h1');
  const h2Candidates = getCandidateHeadings('h2');
  const h3Candidates = getCandidateHeadings('h3');

  // Strictly prioritize H1: if H1 headings exist, they are the canonical topic names
  let targetHeadingTag = null;
  if (h1Candidates.length > 1) {
    targetHeadingTag = 'h1';
  } else if (h1Candidates.length === 1) {
    // If only 1 H1 candidate and multiple H2s, the single H1 is the document title
    targetHeadingTag = h2Candidates.length >= 2 ? 'h2' : 'h1';
  } else if (h2Candidates.length > 0) {
    targetHeadingTag = 'h2';
  } else if (h3Candidates.length > 0) {
    targetHeadingTag = 'h3';
  }

  // If lessonTitle not established from header, detect from H1 (if H2 is target) or leading paragraph before H1
  if (!lessonTitle) {
    if (h1Candidates.length === 1 && targetHeadingTag !== 'h1') {
      lessonTitle = h1Candidates[0];
    } else {
      // Check if a title paragraph appears before the first H1
      const beforeH1 = htmlContent.split(/<h1(?:\s[^>]*)?>/i)[0];
      const pMatch = beforeH1
        ? beforeH1.match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i)
        : null;
      if (pMatch) {
        const candidate = pMatch[1].replace(/<[^>]+>/g, '').trim();
        if (
          candidate.length > 3 &&
          candidate.length < 100 &&
          !isExcludedTopicHeading(candidate) &&
          !/^(course|module)[:\s-]/i.test(candidate)
        ) {
          lessonTitle = candidate;
        }
      }
    }
  }

  // Match all heading and paragraph tags
  const tagRegex = /<(h[1-6]|p|li)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match;
  let inQuizSection = false;

  while ((match = tagRegex.exec(htmlContent)) !== null) {
    const tagName = match[1].toLowerCase();
    const rawInner = match[2];

    // Strip inner HTML tags to get plain text
    const text = rawInner.replace(/<[^>]+>/g, '').trim();
    if (!text) continue;

    // Detect quiz start
    if (QUIZ_BLOCK_REGEX.test(text)) {
      inQuizSection = true;
      continue;
    }

    if (QUIZ_OPTION_OR_ANSWER_REGEX.test(text)) {
      continue;
    }

    // Reset quiz flag if a new lesson/module header appears
    if (/^(lesson|module|chapter|unit)\s*\d+/i.test(text)) {
      inQuizSection = false;
    }

    if (inQuizSection) continue;

    // Check for Course / Module / Lesson headers if in text
    if (!courseTitle && /^course(\s+name)?[:\s-]/i.test(text)) {
      courseTitle = text.replace(/^course(\s+name)?[:\s-]+/i, '').trim();
      continue;
    }
    if (/^module(\s+\d+)?[:\s-]/i.test(text)) {
      moduleTitle = text.trim();
      continue;
    }
    if (/^lesson(\s+\d+[:\s-]?|[:#-])/i.test(text)) {
      lessonTitle = text.trim();
      continue;
    }

    // Skip non-instructional boilerplate: Introduction, Learning Objectives, Summary, Quizzes
    if (isExcludedTopicHeading(text)) {
      continue;
    }

    // If H1 is the overall lesson title while targetHeadingTag is H2, capture it as lessonTitle
    if (!lessonTitle && tagName === 'h1' && targetHeadingTag !== 'h1') {
      lessonTitle = text;
      continue;
    }

    // Strictly enforce the target heading tag (e.g. h1 only)
    if (targetHeadingTag && tagName !== targetHeadingTag) {
      continue;
    }

    // If an explicit "Lesson X: ..." heading appears at this level, treat it as lessonTitle
    if (!lessonTitle && /^lesson(\s+\d+)?[:\s-]/i.test(text)) {
      lessonTitle = text;
      continue;
    }

    const cleanTitle = text
      .replace(/^(\d+[\.\)]\s*)+/i, '')
      .replace(/^topic\s*\d*[: -]*/i, '')
      .trim();

    const lowerKey = `${lessonTitle || 'L1'}::${cleanTitle.toLowerCase()}`;
    if (cleanTitle.length > 2 && !seenTitles.has(lowerKey)) {
      seenTitles.add(lowerKey);
      topics.push({
        id: `topic-${topics.length + 1}`,
        index: topics.length + 1,
        title: cleanTitle,
        module: moduleTitle || undefined,
        lesson: lessonTitle || 'Lesson 1',
        course: courseTitle || undefined,
      });
    }
  }

  // Fallback to text parsing if HTML had minimal heading tags
  if (topics.length === 0) {
    const plainText = htmlContent.replace(/<[^>]+>/g, '\n');
    return parseTextTOC(plainText, headerMetadata);
  }

  return {
    courseTitle,
    moduleTitle,
    lessonTitle: lessonTitle || courseTitle || '',
    topics,
    totalTopics: topics.length,
  };
}

/**
 * Extracts and parses a .docx File object in browser environment using mammoth and JSZip.
 */
export async function parseDocxFile(file) {
  if (typeof window === 'undefined') {
    throw new Error('parseDocxFile must be run in the browser.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const headerMetadata = await extractDocxHeaderMetadata(arrayBuffer);

  const mammoth = await import('mammoth');
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  return parseCourseTOC(html, true, headerMetadata);
}
