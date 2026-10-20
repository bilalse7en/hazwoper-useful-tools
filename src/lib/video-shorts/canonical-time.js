/**
 * Canonical Time & Timestamp Conversion Module for AI Video Shorts
 *
 * Strict Single Source of Truth for Source Video vs. Clip Timestamps.
 * Standard fields:
 *  - sourceStartSeconds: absolute start time in original video
 *  - sourceEndSeconds: absolute end time in original video
 *  - clipDurationSeconds: sourceEndSeconds - sourceStartSeconds
 *  - clipRelativeStartSeconds: always 0 for the beginning of the clip
 *  - clipRelativeEndSeconds: clipDurationSeconds
 */

/**
 * Normalizes any clip or segment timing into the canonical time model
 * @param {Object} timing
 * @returns {{
 *   sourceStartSeconds: number,
 *   sourceEndSeconds: number,
 *   clipDurationSeconds: number,
 *   clipRelativeStartSeconds: number,
 *   clipRelativeEndSeconds: number,
 *   start: number,
 *   end: number,
 *   duration: number
 * }}
 */
export function normalizeCanonicalTiming(timing = {}) {
  const rawStart =
    timing.sourceStartSeconds !== undefined
      ? Number(timing.sourceStartSeconds)
      : timing.start !== undefined
        ? Number(timing.start)
        : 0;

  const rawEnd =
    timing.sourceEndSeconds !== undefined
      ? Number(timing.sourceEndSeconds)
      : timing.end !== undefined
        ? Number(timing.end)
        : timing.duration !== undefined
          ? rawStart + Number(timing.duration)
          : rawStart + 30;

  const sourceStartSeconds = Math.max(0, parseFloat(rawStart.toFixed(3)));
  const sourceEndSeconds = Math.max(
    sourceStartSeconds + 0.1,
    parseFloat(rawEnd.toFixed(3))
  );
  const clipDurationSeconds = parseFloat(
    (sourceEndSeconds - sourceStartSeconds).toFixed(3)
  );

  return {
    sourceStartSeconds,
    sourceEndSeconds,
    clipDurationSeconds,
    clipRelativeStartSeconds: 0,
    clipRelativeEndSeconds: clipDurationSeconds,
    // Aliases for seamless backward compatibility
    start: sourceStartSeconds,
    end: sourceEndSeconds,
    duration: clipDurationSeconds,
  };
}

/**
 * Converts an absolute source timestamp to clip-relative seconds
 * Accepts either:
 *   sourceToRelativeSeconds(sourceTime, sourceStartSeconds, sourceEndSeconds)
 * OR:
 *   sourceToRelativeSeconds(sourceTime, timingObj)
 * @param {number} sourceTime - Time in source video seconds
 * @param {number|Object} startOrTiming - Clip start or canonical timing object
 * @param {number} [maybeEnd] - Clip end in source video
 * @returns {number} Time relative to clip beginning (0 .. clipDuration)
 */
export function sourceToRelativeSeconds(sourceTime, startOrTiming, maybeEnd) {
  let start = 0;
  let end = Infinity;
  if (startOrTiming && typeof startOrTiming === 'object') {
    start = startOrTiming.sourceStartSeconds ?? startOrTiming.start ?? 0;
    end =
      startOrTiming.sourceEndSeconds ??
      startOrTiming.end ??
      start + (startOrTiming.duration || 30);
  } else {
    start = Number(startOrTiming) || 0;
    end = maybeEnd !== undefined ? Number(maybeEnd) : Infinity;
  }
  const rel = sourceTime - start;
  const duration = Math.max(0, end - start);
  return Math.max(0, Math.min(duration, parseFloat(rel.toFixed(3))));
}

/**
 * Converts a clip-relative timestamp back to absolute source seconds
 * Accepts either:
 *   relativeToSourceSeconds(relativeTime, sourceStartSeconds, [sourceEndSeconds])
 * OR:
 *   relativeToSourceSeconds(relativeTime, timingObj)
 * @param {number} relativeTime - Time in clip seconds (0 .. duration)
 * @param {number|Object} startOrTiming - Clip start or canonical timing object
 * @param {number} [maybeEnd] - Optional clip end in source video
 * @returns {number} Absolute time in original video
 */
export function relativeToSourceSeconds(
  relativeTime,
  startOrTiming,
  maybeEnd = null
) {
  let start = 0;
  let end = null;
  if (startOrTiming && typeof startOrTiming === 'object') {
    start = startOrTiming.sourceStartSeconds ?? startOrTiming.start ?? 0;
    end = startOrTiming.sourceEndSeconds ?? startOrTiming.end ?? null;
  } else {
    start = Number(startOrTiming) || 0;
    end = maybeEnd !== null && maybeEnd !== undefined ? Number(maybeEnd) : null;
  }
  const abs = start + Math.max(0, relativeTime);
  if (end !== null) {
    return Math.min(end, parseFloat(abs.toFixed(3)));
  }
  return parseFloat(abs.toFixed(3));
}

/**
 * Extracts and re-times captions for a specific Short.
 * Filters only words and phrases overlapping [sourceStartSeconds, sourceEndSeconds]
 * and sets explicit source and clip-relative timestamps.
 *
 * relativeStart = sourceWordStart - sourceStartSeconds
 * relativeEnd = sourceWordEnd - sourceStartSeconds
 *
 * @param {Array<Object>} sourceCaptions - Full video captions
 * @param {number} sourceStartSeconds - Clip start in source video
 * @param {number} sourceEndSeconds - Clip end in source video
 * @returns {Array<Object>} Clip-specific captions with relative and source times
 */
export function segmentCaptionsForClip(
  sourceCaptions,
  sourceStartSeconds,
  sourceEndSeconds
) {
  if (!Array.isArray(sourceCaptions) || sourceCaptions.length === 0) {
    return [];
  }

  const duration = Math.max(0.1, sourceEndSeconds - sourceStartSeconds);

  // Filter overlapping phrases: caption end must be after clip start, and caption start must be before clip end
  const overlapping = sourceCaptions.filter((cap) => {
    const cStart = cap.sourceStartSeconds ?? cap.start ?? 0;
    const cEnd = cap.sourceEndSeconds ?? cap.end ?? cStart + 2.0;
    return cEnd > sourceStartSeconds && cStart < sourceEndSeconds;
  });

  return overlapping.map((cap, idx) => {
    const rawCStart = cap.sourceStartSeconds ?? cap.start ?? 0;
    const rawCEnd = cap.sourceEndSeconds ?? cap.end ?? rawCStart + 2.0;

    const relStart = Math.max(
      0,
      parseFloat((rawCStart - sourceStartSeconds).toFixed(3))
    );
    const relEnd = Math.min(
      duration,
      parseFloat((rawCEnd - sourceStartSeconds).toFixed(3))
    );

    // Re-time individual words if present
    const words = Array.isArray(cap.words)
      ? cap.words
          .filter((w) => {
            const wStart = w.sourceStartSeconds ?? w.start ?? rawCStart;
            const wEnd = w.sourceEndSeconds ?? w.end ?? rawCEnd;
            return wEnd > sourceStartSeconds && wStart < sourceEndSeconds;
          })
          .map((w) => {
            const wStart = w.sourceStartSeconds ?? w.start ?? rawCStart;
            const wEnd = w.sourceEndSeconds ?? w.end ?? rawCEnd;
            return {
              ...w,
              sourceStartSeconds: wStart,
              sourceEndSeconds: wEnd,
              clipRelativeStartSeconds: Math.max(
                0,
                parseFloat((wStart - sourceStartSeconds).toFixed(3))
              ),
              clipRelativeEndSeconds: Math.min(
                duration,
                parseFloat((wEnd - sourceStartSeconds).toFixed(3))
              ),
              start: Math.max(
                0,
                parseFloat((wStart - sourceStartSeconds).toFixed(3))
              ),
              end: Math.min(
                duration,
                parseFloat((wEnd - sourceStartSeconds).toFixed(3))
              ),
            };
          })
      : [];

    return {
      ...cap,
      id: cap.id || `cap_${idx + 1}`,
      sourceStartSeconds: rawCStart,
      sourceEndSeconds: rawCEnd,
      clipRelativeStartSeconds: relStart,
      clipRelativeEndSeconds: Math.max(relStart + 0.2, relEnd),
      // Set start/end to clip-relative time for all downstream renderers
      start: relStart,
      end: Math.max(relStart + 0.2, relEnd),
      words,
    };
  });
}
