/**
 * OpusClip-Style Intelligent Clip Moment Discovery & Ranking Engine
 * Combines transcript awareness, stanza/verse boundary detection, vocal dynamics,
 * silence boundaries, and scene analysis to discover top viral shorts.
 * 100% Free and transparent scoring algorithm.
 */

import { snapToCleanBoundary, detectVocalPhrases } from './audio-analyzer';
import { generateCadenceCaptions } from './caption-engine';
import { parseVttFile, mergeIntoPhraseCaptions } from './vtt-parser';
import { transliterateUrduCaptions } from './urdu-transliterator';
import {
  normalizeCanonicalTiming,
  segmentCaptionsForClip,
} from './canonical-time';

/**
 * Parses user reference lyrics into stanzas and lines.
 * Stanzas are separated by blank lines or 2-4 line verses.
 *
 * @param {string} lyricsText - Raw lyrics text
 * @returns {Array<{ index: number, text: string, lines: Array<string>, wordCount: number }>}
 */
export function parseReferenceLyrics(lyricsText) {
  if (!lyricsText || typeof lyricsText !== 'string') return [];

  const rawStanzas = lyricsText
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawStanzas.length === 1 && rawStanzas[0].includes('\n')) {
    // If user pasted lines without double spaces, group by 4 lines per stanza
    const lines = rawStanzas[0]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 4) {
      const grouped = [];
      for (let i = 0; i < lines.length; i += 4) {
        const chunk = lines.slice(i, i + 4);
        grouped.push({
          index: grouped.length + 1,
          text: chunk.join('\n'),
          lines: chunk,
          wordCount: chunk.join(' ').split(/\s+/).filter(Boolean).length,
        });
      }
      return grouped;
    }
  }

  return rawStanzas.map((stanza, idx) => {
    const lines = stanza
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    return {
      index: idx + 1,
      text: stanza,
      lines,
      wordCount: stanza.split(/\s+/).filter(Boolean).length,
    };
  });
}

/**
 * Groups consecutive vocal phrases into recitation stanzas.
 * A break in reciting (> 1.4s) or a group of 2-4 phrases marks stanza boundaries.
 */
export function groupVocalPhrasesIntoStanzas(
  vocalPhrases,
  silenceIntervals = []
) {
  if (!vocalPhrases || vocalPhrases.length === 0) return [];

  const stanzas = [];
  let currentGroup = [vocalPhrases[0]];

  for (let i = 1; i < vocalPhrases.length; i++) {
    const prev = vocalPhrases[i - 1];
    const curr = vocalPhrases[i];
    const gap = curr.start - prev.end;

    // Check if silence interval between them is significant (musical interlude / stanza break)
    const hasLongPause = gap >= 1.4 || currentGroup.length >= 4;

    if (hasLongPause) {
      const start = currentGroup[0].start;
      const end = currentGroup[currentGroup.length - 1].end;
      stanzas.push({
        index: stanzas.length + 1,
        start,
        end,
        duration: parseFloat((end - start).toFixed(2)),
        phrases: currentGroup,
      });
      currentGroup = [curr];
    } else {
      currentGroup.push(curr);
    }
  }

  if (currentGroup.length > 0) {
    const start = currentGroup[0].start;
    const end = currentGroup[currentGroup.length - 1].end;
    stanzas.push({
      index: stanzas.length + 1,
      start,
      end,
      duration: parseFloat((end - start).toFixed(2)),
      phrases: currentGroup,
    });
  }

  return stanzas;
}

/**
 * Discovers and ranks candidate short clips from a video's analysis signals.
 * Enforces OpusClip standards:
 * - Strict 30s minimum duration rule for standard Shorts.
 * - Stanza-aware segmentation: combines consecutive short stanzas (e.g. 22s + next stanza -> 35-45s)
 *   without cutting any verse or altering recitation order.
 * - 0.5s voice onset pre-roll.
 * - Transparent quality scoring & explanation.
 *
 * @param {object} params
 * @param {number} params.videoDuration - Total duration of the source video in seconds
 * @param {object} params.audioAnalysis - Result from analyzeAudioEnergy
 * @param {Array} params.sceneCuts - Result from detectSceneCuts
 * @param {object} params.settings - Studio settings (duration preset, clip count, referenceLyrics)
 * @param {string} [params.videoTitle] - Title of video for descriptive clip labels
 * @returns {Array<object>} Array of scored, non-overlapping candidate clips
 */
export function discoverClips({
  videoDuration,
  audioAnalysis = null,
  sceneCuts = [],
  settings = {},
  videoTitle = 'Highlight',
  transcript = null,
  captions = [],
}) {
  if (!videoDuration || videoDuration < 10) {
    return [];
  }

  // Parse real transcript from VTT if available, or use passed captions
  let realCaptions = captions && captions.length > 0 ? captions : null;
  if (
    !realCaptions &&
    transcript &&
    typeof transcript === 'string' &&
    transcript.includes('-->')
  ) {
    try {
      const rawCaptions = parseVttFile(transcript);
      realCaptions = mergeIntoPhraseCaptions(rawCaptions, 10, 0.8);
    } catch (e) {
      console.warn(
        'VTT transcript parsing failed, falling back to synthetic captions:',
        e
      );
    }
  }

  // 1. Elastic Duration Bounds: 30s to 85s (up to 1m 25s so continuous verses and Ash'aar are never truncated)
  let minDuration = 30;
  let maxDuration = 85;

  if (settings.durationPreset === 'standard' || !settings.durationPreset) {
    minDuration = 30;
    maxDuration = 85;
  } else if (settings.durationPreset === 'short') {
    minDuration = 15;
    maxDuration = 45;
  } else if (
    settings.durationPreset === 'extended' ||
    settings.durationPreset === 'long'
  ) {
    minDuration = 45;
    maxDuration = 90;
  } else if (settings.durationPreset === 'medium') {
    minDuration = 30;
    maxDuration = 75;
  } else if (settings.durationPreset === 'custom') {
    minDuration = Math.max(25, settings.customMinDuration || 30);
    maxDuration = Math.min(
      videoDuration,
      Math.max(minDuration + 10, settings.customMaxDuration || 85)
    );
  }

  // Edge case: If source video itself is shorter than 30s, warn & clamp
  const isUndersizedSource = videoDuration < 30;
  if (isUndersizedSource) {
    minDuration = Math.max(10, Math.floor(videoDuration - 1));
    maxDuration = videoDuration;
  } else if (videoDuration < maxDuration) {
    maxDuration = Math.floor(videoDuration);
    if (minDuration > maxDuration) {
      minDuration = Math.min(30, maxDuration);
    }
  }

  const desiredClipCount = settings.clipCount || 4;
  const targetDuration = (minDuration + maxDuration) / 2;

  const silenceIntervals = audioAnalysis?.silenceIntervals || [];
  const timeline = audioAnalysis?.timeline || [];
  const avgEnergy = audioAnalysis?.avgEnergy || 0.05;

  // Step 1: Detect True Vocal/Recitation Phrases & First Speech Onset
  const { firstVoiceOnset, vocalPhrases } = detectVocalPhrases(
    timeline,
    avgEnergy,
    silenceIntervals
  );

  // Parse reference lyrics if provided by user
  const referenceStanzas = parseReferenceLyrics(settings.referenceLyrics);

  const candidateClips = [];

  const isRomanUrdu = settings.captionLanguage !== 'en';
  const romanUrduHookLabels = [
    'Kamaal Ka Viral Hook',
    'Subhan Allah • Dil Ko Choo Lene Wala Kalam',
    'Yeh Naat Sun Kar Ro Parein Ge',
    'Durood-o-Salam Ki Barkat',
    'Sab Se Ahem Aur Khoobsurat Kalam',
    'Madine Ki Yaad Mein',
    'Aakhir Tak Zaroor Dekhein',
  ];

  const englishHookLabels = [
    'Viral Hook & Key Takeaway',
    'High-Impact Explanation',
    'Crucial Concept Breakdown',
    'The Big Transformation',
    'Surprising Revelation',
    'Core Lesson & Master Tip',
    'Actionable Secret Revealed',
  ];

  const hookLabels = isRomanUrdu ? romanUrduHookLabels : englishHookLabels;

  const formatDurationTag = (sec) => {
    const s = Math.round(sec);
    if (s < 60) return `${s}s`;
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  };

  const buildCandidateClip = (start, end, duration, metadata = {}) => {
    // Factor A: Hook Score (Energy in first 3 seconds compared to average)
    let hookEnergySum = 0;
    let hookSamples = 0;
    timeline.forEach((pt) => {
      if (pt.time >= start && pt.time <= start + 3.0) {
        hookEnergySum += pt.rms;
        hookSamples++;
      }
    });
    const hookAvg = hookSamples > 0 ? hookEnergySum / hookSamples : avgEnergy;
    const hookScore = Math.min(
      100,
      Math.round((hookAvg / Math.max(0.01, avgEnergy)) * 50)
    );

    // Factor B: Speech Density (Proportion of time with vocal energy above silence)
    let activeTime = 0;
    timeline.forEach((pt) => {
      if (pt.time >= start && pt.time <= end && pt.rms > avgEnergy * 0.4) {
        activeTime += 0.1;
      }
    });
    const densityRatio = duration > 0 ? activeTime / duration : 0.5;
    const densityScore = Math.min(100, Math.round(densityRatio * 100));

    // Factor C: Visual Dynamics (Number of scene transitions in clip)
    const cutsInClip = sceneCuts.filter(
      (c) => c.time >= start && c.time <= end
    ).length;
    const visualScore = Math.min(100, 60 + cutsInClip * 12);

    // Factor D: Duration Optimal Fit
    const lengthDiff = Math.abs(duration - targetDuration);
    const lengthScore = Math.max(
      50,
      Math.round(100 - (lengthDiff / targetDuration) * 50)
    );

    // Factor E: Contextual & Stanza Completeness
    const completenessScore =
      metadata.stanzasCount >= 2 ? 98 : metadata.isFullStanza ? 95 : 88;

    // Transparent Weighted Composite Score
    const compositeScore = Math.round(
      hookScore * 0.3 +
        densityScore * 0.25 +
        completenessScore * 0.2 +
        visualScore * 0.15 +
        lengthScore * 0.1
    );

    const labelIndex = candidateClips.length % hookLabels.length;
    const isOpeningVerse = start <= (firstVoiceOnset || 0) + 0.5;
    const durLabel = formatDurationTag(duration);

    let explanation = '';
    if (metadata.stanzasCount >= 2) {
      explanation = isRomanUrdu
        ? `${metadata.stanzasCount} mukammal stanzas natural flow ke sath jore gaye (${durLabel}). Koi verse adhoora nahi chora.`
        : `${metadata.stanzasCount} consecutive stanzas seamlessly joined (${durLabel}) satisfying complete verse closure.`;
    } else if (metadata.isFullStanza) {
      explanation = isRomanUrdu
        ? `Mukammal standalone stanza (${durLabel}). Subhan Allah, khubsoorat recitation aur clean audio pause.`
        : `Complete standalone stanza (${durLabel}) with natural opening hook and complete verse closure.`;
    } else {
      explanation = isRomanUrdu
        ? `Voice onset ke 1.0s pehle shuru ho kar mukammal phrase tak (${durLabel}). High vocal cadence.`
        : `Cleanly segmented thought from ${Math.round(start)}s to ${Math.round(end)}s (${durLabel}).`;
    }

    return {
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
      duration,
      score: Math.min(99, Math.max(65, compositeScore)),
      breakdown: {
        hookScore,
        densityScore,
        completenessScore,
        visualScore,
        lengthScore,
      },
      hookScore,
      densityScore,
      isOpeningVerse,
      stanzasCount: metadata.stanzasCount || 1,
      verseCompleteness:
        metadata.verseCompleteness ||
        (metadata.isFullStanza ? 'complete_verse' : 'uncertain'),
      title: isOpeningVerse
        ? `Subhan Allah • Pehla Kalam (${durLabel})`
        : `${hookLabels[labelIndex]} (${durLabel})`,
      summary: explanation,
      explanation,
      cutsCount: cutsInClip,
      lyricsReference: metadata.lyricsText || null,
    };
  };

  // Step 2: Form Candidate Clips using Semantic Stanza & Phrase Intelligence
  // Technique 0: Prioritize real spoken phrase boundaries from subtitles with 1.0s lead-in
  if (realCaptions && realCaptions.length > 0) {
    let currentStartIndex = 0;
    while (
      currentStartIndex < realCaptions.length &&
      candidateClips.length < desiredClipCount * 2
    ) {
      const startPhrase = realCaptions[currentStartIndex];
      // 1.0s breath pre-roll lead-in before voice onset
      const start = Math.max(
        0,
        parseFloat((startPhrase.start - 1.0).toFixed(2))
      );
      let bestEndPhraseIndex = currentStartIndex;
      let bestDuration = 0;
      let foundVerseBoundary = false;

      // Look ahead for complete verse or couplet closure without cutting mid-phrase
      for (let j = currentStartIndex; j < realCaptions.length; j++) {
        const curEndPhrase = realCaptions[j];
        const nextPhrase =
          j < realCaptions.length - 1 ? realCaptions[j + 1] : null;
        const dur = curEndPhrase.end + 0.4 - start;

        // An acoustic pause > 0.75s or explicit isVerseBoundary marks completion of a verse
        const isPause = nextPhrase
          ? nextPhrase.start - curEndPhrase.end >= 0.75
          : true;
        const isPoeticVerseBoundary = curEndPhrase.isVerseBoundary || isPause;

        // If we hit a natural verse boundary within flexible range (28s to maxDuration + 20s)
        if (
          isPoeticVerseBoundary &&
          dur >= Math.min(28, minDuration) &&
          dur <= maxDuration + 20
        ) {
          bestEndPhraseIndex = j;
          bestDuration = dur;
          foundVerseBoundary = true;
          // If we reached an optimal complete stanza length (e.g. 40s - 75s), break cleanly!
          if (dur >= 38) break;
        }

        // If duration is in acceptable range, keep it as candidate
        if (dur >= minDuration && dur <= maxDuration + 15) {
          bestEndPhraseIndex = j;
          bestDuration = dur;
        } else if (dur > maxDuration + 25) {
          if (bestDuration === 0 && j > currentStartIndex) {
            bestEndPhraseIndex = j - 1;
            bestDuration = realCaptions[j - 1].end - start;
          }
          break;
        }
      }

      if (bestDuration >= Math.min(20, minDuration)) {
        const end = Math.min(
          videoDuration,
          parseFloat((realCaptions[bestEndPhraseIndex].end + 0.4).toFixed(2))
        );
        const matchedCaptions = realCaptions.slice(
          currentStartIndex,
          bestEndPhraseIndex + 1
        );
        const actualDur = parseFloat((end - start).toFixed(2));
        const completeness = foundVerseBoundary
          ? matchedCaptions.length >= 4
            ? 'multi_verse'
            : 'complete_verse'
          : 'uncertain';

        candidateClips.push(
          buildCandidateClip(start, end, actualDur, {
            isFullStanza: true,
            stanzasCount: matchedCaptions.length,
            verseCompleteness: completeness,
            lyricsText: matchedCaptions
              .map((c) => c.textUrdu || c.text || c.textRoman)
              .join('\n'),
            firstVerse:
              matchedCaptions[0]?.textUrdu ||
              matchedCaptions[0]?.text ||
              'Recitation Verse',
          })
        );
        currentStartIndex = bestEndPhraseIndex + 1;
      } else {
        currentStartIndex++;
      }
    }
  }

  if (vocalPhrases.length > 0 && candidateClips.length < desiredClipCount) {
    // Group vocal phrases into natural stanzas with 1.0s pre-roll
    const stanzas = groupVocalPhrasesIntoStanzas(
      vocalPhrases,
      silenceIntervals
    );

    for (let i = 0; i < stanzas.length; i++) {
      const startStanza = stanzas[i];
      // 1.0s pre-roll lead-in before vocal onset
      const start = Math.max(
        0,
        parseFloat((startStanza.start - 1.0).toFixed(2))
      );

      // Check single standalone stanza
      const singleCandidateEnd = Math.min(
        videoDuration,
        parseFloat((startStanza.end + 0.4).toFixed(2))
      );
      const singleSnappedEnd = snapToCleanBoundary(
        singleCandidateEnd,
        silenceIntervals,
        'end',
        1.4
      );
      const singleDuration = parseFloat((singleSnappedEnd - start).toFixed(2));

      if (singleDuration >= minDuration && singleDuration <= maxDuration + 10) {
        const matchedLyric = referenceStanzas[i]?.text || null;
        candidateClips.push(
          buildCandidateClip(start, singleSnappedEnd, singleDuration, {
            isFullStanza: true,
            stanzasCount: 1,
            lyricsText: matchedLyric,
          })
        );
      } else {
        // Evaluate joining consecutive stanzas for natural complete couplets
        let accumulatedEnd = startStanza.end;
        let stanzasCombined = 1;

        for (let j = i + 1; j < stanzas.length; j++) {
          const nextStanza = stanzas[j];
          accumulatedEnd = nextStanza.end;
          stanzasCombined++;

          const multiCandidateEnd = Math.min(
            videoDuration,
            parseFloat((accumulatedEnd + 0.4).toFixed(2))
          );
          const multiSnappedEnd = snapToCleanBoundary(
            multiCandidateEnd,
            silenceIntervals,
            'end',
            1.4
          );
          const multiDuration = parseFloat(
            (multiSnappedEnd - start).toFixed(2)
          );

          if (
            multiDuration >= minDuration &&
            multiDuration <= maxDuration + 20
          ) {
            const joinedLyrics =
              referenceStanzas
                .slice(i, i + stanzasCombined)
                .map((s) => s.text)
                .join('\n\n') || null;

            candidateClips.push(
              buildCandidateClip(start, multiSnappedEnd, multiDuration, {
                isFullStanza: true,
                stanzasCount: stanzasCombined,
                lyricsText: joinedLyrics,
              })
            );
            break;
          } else if (multiDuration > maxDuration + 20) {
            break;
          }
        }
      }
    }
  }

  // Elastic silence-gap fallback (never forces identical 45s chunks)
  if (candidateClips.length === 0) {
    const candidateStarts = [];
    const initialSilence = silenceIntervals.find(
      (s) => s.start <= 0.5 && s.duration > 1.5
    );
    const safeFirstStart = initialSilence
      ? Math.max(0, initialSilence.end - 0.5)
      : 0;

    if (safeFirstStart < videoDuration - minDuration) {
      candidateStarts.push(safeFirstStart);
    }

    silenceIntervals.forEach((interval) => {
      // 1.0s lead-in prior to speech resuming
      const resumeStart = Math.max(0, interval.end - 1.0);
      if (resumeStart < videoDuration - minDuration) {
        candidateStarts.push(resumeStart);
      }
    });

    const uniqueStarts = Array.from(
      new Set(candidateStarts.map((s) => Math.round(s * 2) / 2))
    )
      .filter((s) => s >= 0 && s <= videoDuration - minDuration)
      .sort((a, b) => a - b);

    // Dynamic varied durations (38s, 52s, 68s, 1m 15s)
    const naturalSpanTargets = [38, 52, 65, 78, 44, 58];
    let spanIdx = 0;

    for (const rawStart of uniqueStarts) {
      const start = snapToCleanBoundary(rawStart, silenceIntervals, 'start');
      const targetSpan = Math.min(
        maxDuration,
        Math.max(
          minDuration,
          naturalSpanTargets[spanIdx % naturalSpanTargets.length]
        )
      );
      spanIdx++;

      const idealEnd = start + targetSpan;
      if (idealEnd > videoDuration + 5) continue;
      const end = Math.min(
        videoDuration,
        snapToCleanBoundary(idealEnd, silenceIntervals, 'end', 3.0)
      );
      const duration = parseFloat((end - start).toFixed(2));
      if (duration < minDuration || duration > maxDuration) continue;
      candidateClips.push(buildCandidateClip(start, end, duration));
    }
  }

  // Step 3: Sort to prioritize opening verse where recitation begins, then by composite quality score
  candidateClips.sort((a, b) => {
    if (a.isOpeningVerse && !b.isOpeningVerse) return -1;
    if (!a.isOpeningVerse && b.isOpeningVerse) return 1;
    return b.score - a.score;
  });

  // Step 4: Deduplication (Non-overlapping filter)
  const selectedClips = [];
  const minGapSec = 6.0; // Clips must not overlap by more than 6 seconds

  for (const candidate of candidateClips) {
    const overlaps = selectedClips.some((sel) => {
      return (
        Math.max(candidate.start, sel.start) <
        Math.min(candidate.end, sel.end) - minGapSec
      );
    });

    if (!overlaps) {
      selectedClips.push(candidate);
      if (selectedClips.length >= desiredClipCount) {
        break;
      }
    }
  }

  // Sort selected clips chronologically so Short #1 is the opening kalam, Short #2 is the next, etc.
  selectedClips.sort((a, b) => a.start - b.start);

  return selectedClips.map((clip, idx) => {
    const clipId = `clip-${idx + 1}`;
    const timing = normalizeCanonicalTiming({
      sourceStartSeconds: clip.start,
      sourceEndSeconds: clip.end,
      duration: clip.duration,
    });

    let clipCaptions = null;

    // Priority 1: Use REAL transcript captions from VTT / speech model if available
    if (realCaptions && realCaptions.length > 0) {
      clipCaptions = segmentCaptionsForClip(
        realCaptions,
        timing.sourceStartSeconds,
        timing.sourceEndSeconds
      );
    }

    // Priority 2: User explicitly provided reference lyrics
    if (
      (!clipCaptions || clipCaptions.length === 0) &&
      settings.referenceLyrics
    ) {
      const userLyricsText = settings.referenceLyrics;
      const isUrduScript = settings.captionLanguage === 'urdu';
      const lines = userLyricsText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        const startLineIdx = (idx * 2) % lines.length;
        const versesForClip = [
          lines[startLineIdx],
          lines[(startLineIdx + 1) % lines.length],
        ].filter(Boolean);
        const halfDuration =
          timing.clipDurationSeconds / Math.max(1, versesForClip.length);
        clipCaptions = versesForClip.map((verseText, vIdx) => {
          const cStart = parseFloat((vIdx * halfDuration + 0.3).toFixed(2));
          const cEnd = parseFloat(((vIdx + 1) * halfDuration - 0.2).toFixed(2));
          const words = verseText.split(/\s+/).map((w, wIdx, arr) => {
            const wStep = (cEnd - cStart) / arr.length;
            return {
              word: w,
              start: parseFloat((cStart + wIdx * wStep).toFixed(2)),
              end: parseFloat((cStart + (wIdx + 1) * wStep).toFixed(2)),
            };
          });

          return {
            id: `cap-${vIdx + 1}`,
            start: cStart,
            end: cEnd,
            text: verseText,
            words,
          };
        });
      }
    }

    // Priority 3: Cadence fallback if no transcript exists
    if (!clipCaptions || clipCaptions.length === 0) {
      clipCaptions = generateCadenceCaptions(
        timing.clipDurationSeconds,
        silenceIntervals.map((si) => ({
          start: Math.max(0, si.start - timing.sourceStartSeconds),
          end: Math.max(0, si.end - timing.sourceStartSeconds),
        })),
        145,
        '',
        settings.captionLanguage || 'urdu'
      );
    }

    // Enrich captions with synchronized Urdu Nastaliq and Roman Urdu tokens
    const enrichedCaptions = transliterateUrduCaptions(
      clipCaptions || [],
      settings.transliterationStyle || 'conversational'
    );

    // Update clip hook text so the card hook preview shows the genuine recited line in authentic Urdu!
    const hookText =
      enrichedCaptions?.[0]?.textUrdu ||
      enrichedCaptions?.[0]?.text ||
      clip.title;
    const completeness =
      clip.verseCompleteness ||
      (clip.stanzasCount >= 2
        ? 'multi_verse'
        : clip.isFullStanza
          ? 'complete_verse'
          : 'uncertain');
    const statusLabel =
      completeness === 'multi_verse'
        ? '✓ 2 Complete Verses'
        : completeness === 'complete_verse'
          ? '✓ Complete Verse'
          : 'Phrase Selection';

    return {
      ...clip,
      ...timing,
      id: clipId,
      clipId,
      index: idx + 1,
      captions: enrichedCaptions,
      primaryVerse: hookText,
      verseCompleteness: completeness,
      verseStatusLabel: statusLabel,
      hasRealTranscript: !!(realCaptions && realCaptions.length > 0),
      syncStatus:
        realCaptions && realCaptions.length > 0
          ? 'synchronized'
          : 'needs_manual_review',
      renderStatus: 'ready',
      lastModified: new Date().toISOString(),
    };
  });
}
