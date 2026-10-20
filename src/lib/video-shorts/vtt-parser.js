/**
 * WebVTT Subtitle Parser
 * Parses YouTube auto-generated VTT subtitle files into structured caption segments.
 * 100% Free, no external dependencies.
 */

/**
 * Parses a VTT timestamp string into seconds.
 * Supports "HH:MM:SS.mmm" and "MM:SS.mmm" formats.
 * @param {string} ts - VTT timestamp like "00:01:23.456"
 * @returns {number} Time in seconds
 */
function parseVttTimestamp(ts) {
  if (!ts || typeof ts !== 'string') return 0;
  const parts = ts.trim().split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return parseFloat(m) * 60 + parseFloat(s);
  }
  return parseFloat(ts) || 0;
}

/**
 * Strips VTT formatting tags like <c>, </c>, <00:01:02.345>, etc.
 * @param {string} text
 * @returns {string} Clean text
 */
function stripVttTags(text) {
  if (!text) return '';
  return text
    .replace(/<\/?c[^>]*>/g, '') // <c> </c> color/class tags
    .replace(/<\d{2}:\d{2}[^>]*>/g, '') // inline timestamps like <00:01:02.345>
    .replace(/<[^>]+>/g, '') // any remaining HTML-like tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses a WebVTT file string into an array of caption segments.
 * Handles YouTube auto-generated VTT with word-level timestamps.
 *
 * @param {string} vttContent - Raw VTT file content
 * @returns {Array<{ id: string, start: number, end: number, text: string, words: Array<{ word: string, start: number, end: number }> }>}
 */
export function parseVttFile(vttContent) {
  if (!vttContent || typeof vttContent !== 'string') return [];

  const lines = vttContent.split(/\r?\n/);
  const captions = [];
  let i = 0;

  // Skip header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for timestamp line: "00:00:01.234 --> 00:00:04.567"
    if (line.includes('-->')) {
      const [startStr, rest] = line.split('-->');
      const endStr = rest?.split(/\s+/)[0] || rest;
      const start = parseVttTimestamp(startStr);
      const end = parseVttTimestamp(endStr);

      // Collect all text lines until next empty line or next timestamp
      const textLines = [];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].includes('-->')
      ) {
        textLines.push(lines[i]);
        i++;
      }

      const rawText = textLines.join(' ');
      const cleanText = stripVttTags(rawText);

      if (cleanText && cleanText.length > 0) {
        // Try to extract word-level timestamps from YouTube's inline <c> tags
        const words = extractWordTimings(textLines.join(' '), start, end);

        captions.push({
          id: `vtt-${captions.length + 1}`,
          start: parseFloat(start.toFixed(3)),
          end: parseFloat(end.toFixed(3)),
          text: cleanText,
          words,
        });
      }
    } else {
      i++;
    }
  }

  // Deduplicate consecutive identical lines (YouTube VTT often repeats lines)
  const deduped = [];
  for (const cap of captions) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.text === cap.text) {
      // Extend previous segment's end time
      prev.end = Math.max(prev.end, cap.end);
      continue;
    }
    deduped.push({ ...cap });
  }

  // Re-assign IDs after dedup
  return deduped.map((cap, idx) => ({
    ...cap,
    id: `cap-${idx + 1}`,
  }));
}

/**
 * Extracts word-level timing from YouTube VTT inline timestamp tags.
 * YouTube format: "<00:00:01.234><c> word1</c><00:00:01.567><c> word2</c>"
 *
 * @param {string} rawLine - Raw VTT line with inline tags
 * @param {number} lineStart - Start time of the line
 * @param {number} lineEnd - End time of the line
 * @returns {Array<{ word: string, start: number, end: number }>}
 */
function extractWordTimings(rawLine, lineStart, lineEnd) {
  if (!rawLine) return [];

  // Match patterns like <00:00:01.234><c> word</c>
  const wordPattern = /<(\d{2}:\d{2}[^>]*)><c>\s*([^<]+)<\/c>/g;
  const words = [];
  let match;

  while ((match = wordPattern.exec(rawLine)) !== null) {
    const timestamp = parseVttTimestamp(match[1]);
    const word = match[2].trim();
    if (word) {
      words.push({ word, start: timestamp, end: 0 }); // end filled below
    }
  }

  // If no inline timestamps found, split text evenly across the duration
  if (words.length === 0) {
    const cleanText = stripVttTags(rawLine);
    const wordList = cleanText.split(/\s+/).filter(Boolean);
    const step =
      wordList.length > 0 ? (lineEnd - lineStart) / wordList.length : 0;
    return wordList.map((word, idx) => ({
      word,
      start: parseFloat((lineStart + idx * step).toFixed(3)),
      end: parseFloat((lineStart + (idx + 1) * step).toFixed(3)),
    }));
  }

  // Fill in end times: each word ends when the next word starts
  for (let i = 0; i < words.length - 1; i++) {
    words[i].end = words[i + 1].start;
  }
  if (words.length > 0) {
    words[words.length - 1].end = lineEnd;
  }

  return words;
}

/**
 * Merges short VTT segments into natural sentence-length phrases.
 * YouTube auto-captions often produce 1-3 word segments.
 * This merges them into ~4-8 word phrases respecting pause boundaries.
 *
 * @param {Array} captions - Parsed VTT captions
 * @param {number} maxPhraseWords - Max words per merged phrase (default 10)
 * @param {number} pauseThreshold - Seconds of gap to force a new phrase (default 0.8)
 * @returns {Array<{ id: string, start: number, end: number, text: string, words: Array }>}
 */
export function mergeIntoPhraseCaptions(
  captions,
  maxPhraseWords = 10,
  pauseThreshold = 0.8
) {
  if (!captions || captions.length === 0) return [];

  const merged = [];
  let currentGroup = { ...captions[0], words: [...(captions[0].words || [])] };

  for (let i = 1; i < captions.length; i++) {
    const cap = captions[i];
    const gap = cap.start - currentGroup.end;
    const currentWordCount = currentGroup.text.split(/\s+/).length;

    // Merge if gap is small and combined word count is reasonable
    if (gap < pauseThreshold && currentWordCount < maxPhraseWords) {
      currentGroup.end = cap.end;
      currentGroup.text = `${currentGroup.text} ${cap.text}`;
      currentGroup.words = [...currentGroup.words, ...(cap.words || [])];
    } else {
      merged.push(currentGroup);
      currentGroup = { ...cap, words: [...(cap.words || [])] };
    }
  }
  merged.push(currentGroup);

  return merged.map((m, idx) => ({
    ...m,
    id: `cap-${idx + 1}`,
  }));
}
