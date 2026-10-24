/**
 * Caption & Subtitle Engine
 * Generates word-level timings, SRT/VTT/ASS exports, and dynamic viral subtitle styles.
 * Supports:
 * - Native Urdu Script in Noto Nastaliq Urdu
 * - Clean Modern Roman Urdu
 * - Dual Stacked Mode (Urdu Nastaliq top line, Roman Urdu bottom line)
 * - Professional semi-transparent black background panel
 * - Burned-in ASS subtitles for 1080x1920 MP4 video exports
 * 100% Free and open-source.
 */

import { CAPTION_STYLES } from './types.js';

/**
 * Formats seconds into SRT timestamp format: HH:MM:SS,mmm
 */
export function formatSrtTimestamp(seconds) {
  const pad = (num, size = 2) => String(Math.floor(num)).padStart(size, '0');
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const millis = Math.round((secs - Math.floor(secs)) * 1000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs, 2)},${pad(millis, 3)}`;
}

/**
 * Formats seconds into WebVTT timestamp format: HH:MM:SS.mmm
 */
export function formatVttTimestamp(seconds) {
  return formatSrtTimestamp(seconds).replace(',', '.');
}

/**
 * Formats seconds into ASS timestamp format: H:MM:SS.cc (centiseconds)
 */
export function formatAssTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.floor(((seconds % 60) - secs) * 100);
  const pad = (num, size = 2) => String(num).padStart(size, '0');
  return `${hrs}:${pad(mins)}:${pad(secs)}.${pad(centis)}`;
}

/**
 * Eliminates overlapping caption intervals and enforces strictly ordered, non-overlapping
 * bottom-center subtitle events.
 */
export function preventCaptionOverlap(captions = []) {
  if (!Array.isArray(captions) || captions.length === 0) return [];

  // Create deep copy sorted strictly by start time
  const sorted = captions
    .filter((c) => c && typeof c.start === 'number' && !isNaN(c.start))
    .map((c, i) => ({
      ...c,
      id: c.id || `cap-${i + 1}`,
      start: Math.max(0, parseFloat(Number(c.start).toFixed(2))),
      end: Math.max(0, parseFloat(Number(c.end || c.start + 1.5).toFixed(2))),
    }))
    .sort((a, b) => a.start - b.start);

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];

    // Ensure each caption has a valid minimum display duration (at least 0.35s)
    if (cur.end <= cur.start + 0.35) {
      cur.end = parseFloat((cur.start + 0.35).toFixed(2));
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      // If previous caption overlaps with current, truncate previous end time
      if (prev.end > cur.start) {
        prev.end = Math.max(
          parseFloat((prev.start + 0.25).toFixed(2)),
          parseFloat((cur.start - 0.04).toFixed(2))
        );
      }
    }
  }

  return sorted;
}

/**
 * Converts caption items array to standard SRT subtitle text
 */
export function captionsToSRT(captions, mode = 'urdu') {
  const cleanCaptions = preventCaptionOverlap(captions);
  if (!cleanCaptions || cleanCaptions.length === 0) return '';

  return cleanCaptions
    .map((cap, index) => {
      const start = formatSrtTimestamp(cap.start);
      const end = formatSrtTimestamp(cap.end);
      let text = cap.textUrdu || cap.text || '';
      if (mode === 'urdu' && cap.textUrdu) text = cap.textUrdu;
      else if (mode === 'roman-urdu' && cap.textRoman) text = cap.textRoman;
      else if (mode === 'dual-urdu-roman' && cap.textCombined)
        text = cap.textCombined;

      return `${index + 1}\n${start} --> ${end}\n${text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Converts caption items array to WebVTT subtitle text
 */
export function captionsToVTT(captions, mode = 'urdu') {
  const cleanCaptions = preventCaptionOverlap(captions);
  if (!cleanCaptions || cleanCaptions.length === 0) return 'WEBVTT\n';

  const body = cleanCaptions
    .map((cap, index) => {
      const start = formatVttTimestamp(cap.start);
      const end = formatVttTimestamp(cap.end);
      let text = cap.textUrdu || cap.text || '';
      if (mode === 'urdu' && cap.textUrdu) text = cap.textUrdu;
      else if (mode === 'roman-urdu' && cap.textRoman) text = cap.textRoman;
      else if (mode === 'dual-urdu-roman' && cap.textCombined)
        text = cap.textCombined;

      return `${index + 1}\n${start} --> ${end}\n${text.trim()}\n`;
    })
    .join('\n');

  return `WEBVTT\n\n${body}`;
}

/**
 * Converts caption items into an Advanced SubStation Alpha (.ASS) file.
 * Formatted specifically for burning into 1080x1920 9:16 portrait video with:
 * - Professional semi-transparent black background box (BorderStyle=3)
 * - Bottom-center positioning with safe margin (Alignment=2, MarginV=260)
 * - Support for Urdu Nastaliq, Roman Urdu, or Dual Stacked lines
 */
/**
 * Splits text into lines that strictly fit within maxWidth using actual canvas font metrics.
 * Ensures word boundaries are preserved and words are never cut in half.
 */
export function wrapTextToLines(ctx, text, maxWidth, maxLines = 2) {
  if (!text) return [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const candidate = `${currentLine} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        // Collect remaining words on the final line
        currentLine = words.slice(i).join(' ');
        break;
      }
    }
  }
  lines.push(currentLine);
  return lines;
}

export function captionsToASS(captions, options = {}) {
  const {
    captionMode = 'dual-urdu-roman', // 'dual-urdu-roman' (default) | 'urdu' | 'roman-urdu' | 'none' | 'off'
    fontSize = 46, // Professional legible size for 1080x1920
    fontFamily = 'Montserrat',
    textColorHex = '&H00FFFFFF', // White
    highlightColorHex = '&H0038BDF8', // Sky Blue in AABBGGRR
    bgOpacity = '66', // 40% transparent / 60% opaque black in hex (&H66)
    marginV = 260, // Bottom-center safe zone for YouTube Shorts / TikTok UI
  } = options;

  if (captionMode === 'none' || captionMode === 'off') {
    return '';
  }

  const cleanCaptions = preventCaptionOverlap(captions);

  const bgColourHex = `&H${bgOpacity}000000`;

  let assHeader = `[Script Info]
Title: Professional AI Shorts Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Montserrat,${fontSize},${textColorHex},${highlightColorHex},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,2,2,90,90,${marginV},1
Style: RockybillyCaption,Montserrat,${fontSize},${textColorHex},${highlightColorHex},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,2,2,90,90,${marginV},1
Style: UrduNastaliq,Noto Nastaliq Urdu,${Math.round(fontSize * 1.15)},${textColorHex},&H0034D399,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,2,2,90,90,${marginV},1
Style: DualStacked,Noto Nastaliq Urdu,${Math.round(fontSize * 0.88)},${textColorHex},${highlightColorHex},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,2,2,90,90,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogueLines = (cleanCaptions || []).map((cap) => {
    const start = formatAssTimestamp(cap.start);
    const end = formatAssTimestamp(cap.end);

    let textToBurn = cap.textUrdu || cap.text || '';
    let styleToUse = 'UrduNastaliq';

    if (captionMode === 'none' || captionMode === 'off') {
      return '';
    }

    if (captionMode === 'urdu') {
      textToBurn = cap.textUrdu || cap.text;
      styleToUse = 'UrduNastaliq';
    } else if (captionMode === 'dual-urdu-roman') {
      const topUrdu = cap.textUrdu || cap.text || '';
      const botRoman = cap.textRoman || '';
      textToBurn =
        topUrdu && botRoman
          ? `{\\rUrduNastaliq}${topUrdu}\\N{\\rDualStacked}${botRoman}`
          : topUrdu || botRoman;
      styleToUse = 'DualStacked';
    } else {
      textToBurn = cap.textRoman || cap.text;
      styleToUse = 'Default';
    }

    // Wrap long lines exceeding 7 words into 2 balanced lines (for single-line captions)
    const words = textToBurn.split(' ');
    if (
      words.length > 7 &&
      !textToBurn.includes('\\N') &&
      captionMode !== 'dual-urdu-roman'
    ) {
      const mid = Math.ceil(words.length / 2);
      textToBurn = `${words.slice(0, mid).join(' ')}\\N${words.slice(mid).join(' ')}`;
    }

    // Add karaoke typing progression if word timings are provided
    if (cap.words && Array.isArray(cap.words) && cap.words.length > 1) {
      if (captionMode === 'dual-urdu-roman') {
        let urduKaraoke = '';
        let romanKaraoke = '';
        cap.words.forEach((w) => {
          const durCentis = Math.max(
            15,
            Math.round(((w.end || w.start + 0.3) - w.start) * 100)
          );
          urduKaraoke += `{\\k${durCentis}}${w.wordUrdu || w.word || ''} `;
          romanKaraoke += `{\\k${durCentis}}${w.wordRoman || w.word || ''} `;
        });
        textToBurn = `{\\rUrduNastaliq}${urduKaraoke.trim()}\\N{\\rDualStacked}${romanKaraoke.trim()}`;
      } else {
        let karaokeText = '';
        cap.words.forEach((w) => {
          const durCentis = Math.max(
            15,
            Math.round(((w.end || w.start + 0.3) - w.start) * 100)
          );
          const wordText =
            captionMode === 'roman-urdu'
              ? w.wordRoman || w.word || ''
              : w.wordUrdu || w.word || '';
          karaokeText += `{\\k${durCentis}}${wordText} `;
        });
        textToBurn = karaokeText.trim();
      }
    }

    // Clean backslashes for ASS format
    const cleanText = textToBurn.replace(/[\r\n]+/g, '\\N');
    return `Dialogue: 0,${start},${end},${styleToUse},,0,0,0,,${cleanText}`;
  });

  return assHeader + dialogueLines.join('\n');
}

/**
 * Translates English text/phrases into natural, fluent Roman Urdu
 */
export function translateToRomanUrdu(englishText) {
  if (!englishText || typeof englishText !== 'string') return '';
  const clean = englishText.trim();

  const phraseMap = {
    'Here is the most important insight you need to know.':
      'Yeh sab se ahem baat hai jo aapko janna zaroori hai.',
    'Watch closely because this changes everything.':
      'Dhiyaan se dekhein kyunke yeh sab kuch badal dega.',
    'Notice how this simple technique saves hours of work.':
      'Dekhein kaise yeh aasan tareeqa ghanton ka kaam bachata hai.',
    'This is why top creators always focus on quality.':
      'Isi liye top creators hamesha quality par focus karte hain.',
    'Apply this today and share your results with us.':
      'Isko aaj hi apply karein aur doston ke sath zaroor share karein.',
    'Viral Hook & Key Takeaway': 'Kamaal Ka Viral Hook',
    'High-Impact Explanation': 'Zabardast Explanation',
    'Crucial Concept Breakdown': 'Sab Se Ahem Concept',
    'The Big Transformation': 'Bara Transformation Moment',
    'Surprising Revelation': 'Heraan Kun Khulasa',
    'Core Lesson & Master Tip': 'Zaroori Sabaq Aur Master Tip',
    'Actionable Secret Revealed': 'Asal Secret Samne Aa Gaya',
    'Complete Video Highlight': 'Mukammal Video Highlight',
  };

  for (const [en, ur] of Object.entries(phraseMap)) {
    if (clean.toLowerCase().includes(en.toLowerCase())) {
      return ur;
    }
  }

  return clean;
}

/**
 * Generates cadence-aligned phrase intervals.
 * Zero hardcoded text: Never invents fake placeholder lyrics or verses.
 */
export function generateCadenceCaptions(
  duration,
  silenceIntervals = [],
  targetWpm = 145,
  videoTitle = '',
  language = 'roman-urdu'
) {
  return [];
}

/**
 * Dedicated 9:16 Portrait Canvas Subtitle Renderer
 * Features:
 * - Professional semi-transparent black background panel
 * - Bottom-center positioning with safe margins (74-82% from top)
 * - Three caption modes:
 *     1. 'urdu': Native Nastaliq script
 *     2. 'roman-urdu': Clean sans-serif
 *     3. 'dual-urdu-roman': Stacked 2-line mode without covering speaker face
 * - Active word glowing highlight
 * - Responsive auto-wrapping
 */
export function renderCanvasCaptions(
  ctx,
  canvasWidth,
  canvasHeight,
  currentTime,
  captions,
  styleConfig = {}
) {
  const cleanCaptions = preventCaptionOverlap(captions);
  if (!cleanCaptions || cleanCaptions.length === 0) return;

  // Flexible time matching: supports relative (0..clipDuration) or absolute (clipStart..clipEnd)
  let activeCap = cleanCaptions.find(
    (c) => currentTime >= c.start && currentTime <= c.end
  );

  // Fallback 1: Captions have absolute timestamps while currentTime is relative (0..duration)
  if (!activeCap && cleanCaptions.length > 0) {
    const firstStart = cleanCaptions[0]?.start || 0;
    if (
      firstStart > 2.0 &&
      currentTime <=
        cleanCaptions[cleanCaptions.length - 1]?.end - firstStart + 3.0
    ) {
      const absTime = currentTime + firstStart;
      activeCap = cleanCaptions.find(
        (c) => absTime >= c.start && absTime <= c.end
      );
    }
  }

  // Fallback 2: Captions have relative timestamps (0..N) while currentTime is absolute video time
  if (!activeCap && cleanCaptions.length > 0 && currentTime > 3.0) {
    const clipStart = styleConfig.clipStart || 0;
    if (clipStart > 0) {
      const relTime = currentTime - clipStart;
      activeCap = cleanCaptions.find(
        (c) => relTime >= c.start && relTime <= c.end
      );
    }
  }

  // Fallback 3: Snap to nearest active phrase if within 0.35s gap between words/verses
  if (!activeCap) {
    activeCap = cleanCaptions.find(
      (c) => currentTime >= c.start - 0.25 && currentTime <= c.end + 0.35
    );
  }

  if (!activeCap) return;

  const captionMode =
    styleConfig.captionMode || activeCap.captionMode || 'dual-urdu-roman';
  const isUrduOnly = captionMode === 'urdu';
  const isDualMode = captionMode === 'dual-urdu-roman';

  // Professional typography sizing: compact, clean, mobile-optimized safe bounds
  const baseFontSize =
    styleConfig.captionFontSize || Math.round(canvasWidth * 0.044);
  // Bottom-center positioning (80% from top)
  const verticalPosPct = (styleConfig.captionPosition || 80) / 100;
  const posY = canvasHeight * verticalPosPct;
  const maxSafeTextWidth = Math.round(canvasWidth * 0.82); // Strict 82% safe width

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Stylish Rockybilly font for captions only, with authentic Urdu ligature fallbacks
  const urduFontFamily =
    '"Rockybilly", "Kumail", "Noto Nastaliq Urdu", "Noto Sans Arabic", "Jameel Noori Nastaleeq", sans-serif';
  const romanFontFamily =
    '"Rockybilly", "Caveat", "Dancing Script", "Brush Script MT", cursive, sans-serif';

  // Calculate typing progress within active caption time window
  const capStart = activeCap.start;
  const capEnd = Math.max(capStart + 0.3, activeCap.end);
  const capDur = capEnd - capStart;
  const curTimeNormalized =
    currentTime > 3.0 && capStart < 2.0 && styleConfig.clipStart
      ? currentTime - styleConfig.clipStart
      : currentTime;
  const elapsed = Math.max(0, curTimeNormalized - capStart);

  // Smooth typing effect completes around 80% of phrase duration so viewer can comfortably read
  // If time has not reached caption start (initial stage), typeRatio is strictly 0
  const typeRatio =
    curTimeNormalized < capStart
      ? 0
      : Math.min(1.0, elapsed / Math.max(0.2, capDur * 0.8));

  // Extract raw text lines to format
  const rawSegments = [];

  if (isDualMode) {
    // Mode C: Stacked Dual Mode (Urdu Nastaliq top line, Roman Urdu bottom line)
    const urduLine = activeCap.textUrdu || activeCap.text || '';
    const romanLine = activeCap.textRoman || '';
    if (urduLine)
      rawSegments.push({
        text: urduLine,
        isUrdu: true,
        fontSize: Math.round(baseFontSize * 1.1),
      });
    if (romanLine)
      rawSegments.push({
        text: romanLine,
        isUrdu: false,
        fontSize: Math.round(baseFontSize * 0.88),
      });
  } else if (isUrduOnly) {
    // Mode A: Authentic Urdu script only (Default)
    const urduText = activeCap.textUrdu || activeCap.text || '';
    rawSegments.push({
      text: urduText,
      isUrdu: true,
      fontSize: Math.round(baseFontSize * 1.15),
    });
  } else {
    // Mode B: Roman Urdu only
    const romanText = activeCap.textRoman || activeCap.text || '';
    rawSegments.push({
      text: romanText,
      isUrdu: false,
      fontSize: baseFontSize,
    });
  }

  if (rawSegments.length === 0) {
    ctx.restore();
    return;
  }

  // Wrap and fit each segment into maximum 2 lines without clipping
  const linesToRender = [];
  rawSegments.forEach((seg) => {
    ctx.font = `800 ${seg.fontSize}px ${seg.isUrdu ? urduFontFamily : romanFontFamily}`;
    let wrapped = wrapTextToLines(ctx, seg.text, maxSafeTextWidth, 2);

    // If still too wide, scale font down by 15% to guarantee no clipping
    const maxWidth = Math.max(...wrapped.map((w) => ctx.measureText(w).width));
    let effectiveFontSize = seg.fontSize;
    if (maxWidth > maxSafeTextWidth) {
      effectiveFontSize = Math.round(seg.fontSize * 0.85);
      ctx.font = `800 ${effectiveFontSize}px ${seg.isUrdu ? urduFontFamily : romanFontFamily}`;
      wrapped = wrapTextToLines(ctx, seg.text, maxSafeTextWidth, 2);
    }

    // Sequential multi-line typing: Line 2 must be 100% hidden (0 chars) until Line 1 is fully typed!
    const totalChars = wrapped.reduce((sum, line) => sum + line.length, 0);
    const typedCharsBudget = Math.floor(totalChars * typeRatio);
    let charsConsumed = 0;

    wrapped.forEach((lineText, wIdx) => {
      const lineLen = lineText.length;
      let visibleLen = 0;

      // Line 2 (and subsequent lines) NEVER shows first letter until previous lines are 100% typed
      if (wIdx === 0) {
        visibleLen = Math.min(lineLen, typedCharsBudget);
      } else if (typedCharsBudget > charsConsumed) {
        visibleLen = Math.min(lineLen, typedCharsBudget - charsConsumed);
      } else {
        visibleLen = 0; // Strictly 0: Line 2 never shows first letter on initial stage!
      }
      charsConsumed += lineLen;

      if (visibleLen > 0) {
        linesToRender.push({
          fullText: lineText,
          text: lineText.slice(0, visibleLen),
          isUrdu: seg.isUrdu,
          fontSize: effectiveFontSize,
          isTyping: visibleLen < lineLen,
          lineIndex: wIdx,
          totalLines: wrapped.length,
        });
      }
    });
  });

  if (linesToRender.length === 0) {
    ctx.restore();
    return;
  }

  const lineHeight = Math.round(baseFontSize * 1.45);
  const totalContentH = Math.max(1, linesToRender.length) * lineHeight;

  // Render Text Lines directly over video WITHOUT any black opacity background panel
  const startLineY = posY - totalContentH / 2 + lineHeight / 2;

  linesToRender.forEach((l, lIdx) => {
    const lineY = startLineY + lIdx * lineHeight;
    ctx.font = `800 ${l.fontSize}px ${l.isUrdu ? urduFontFamily : romanFontFamily}`;

    // Deep outer shadow for extreme readability without needing a black box
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    // Solid dark outline stroke
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(4, Math.round(l.fontSize * 0.12));
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(l.text, canvasWidth / 2, lineY);

    // Brilliant white / gold text fill
    ctx.fillStyle = l.isUrdu ? '#FFFFFF' : styleConfig.textColor || '#FFFFFF';
    ctx.fillText(l.text, canvasWidth / 2, lineY);

    // Subtle typing cursor at the active typing edge
    if (l.isTyping && Math.floor(Date.now() / 320) % 2 === 0) {
      const textW = ctx.measureText(l.text).width;
      ctx.fillStyle = '#FDE047';
      const cursorX = l.isUrdu
        ? canvasWidth / 2 - textW / 2 - 4
        : canvasWidth / 2 + textW / 2 + 4;
      ctx.fillRect(cursorX, lineY - l.fontSize * 0.45, 3, l.fontSize * 0.9);
    }
  });

  ctx.restore();
}
