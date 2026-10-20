/**
 * Audio Energy & Silence Boundary Analyzer
 * Uses Web Audio API & PCM analysis to detect speech peaks, hooks, and natural pause boundaries.
 * 100% Free, local browser processing.
 */

/**
 * Extracts and decodes PCM audio buffer from a video/audio File or Blob
 */
export async function decodeAudioFromFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  // Standard or webkit AudioContext
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  const audioCtx = new AudioContextClass();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    audioCtx.close();
  }
}

/**
 * Analyzes audio energy profile across the duration of a video.
 * @param {AudioBuffer} audioBuffer - Decoded audio PCM data
 * @param {number} windowSizeSec - Analysis window in seconds (default 0.1s = 100ms)
 * @returns {{ timeline: Array<{ time: number, rms: number, peak: number }>, avgEnergy: number, silenceIntervals: Array<{ start: number, end: number, duration: number }> }}
 */
export function analyzeAudioEnergy(audioBuffer, windowSizeSec = 0.1) {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const channelData = audioBuffer.getChannelData(0); // primary channel
  const totalSamples = channelData.length;
  const windowSamples = Math.max(1, Math.floor(sampleRate * windowSizeSec));

  const timeline = [];
  let totalEnergySum = 0;
  let count = 0;

  for (let i = 0; i < totalSamples; i += windowSamples) {
    let sumSquares = 0;
    let peak = 0;
    const end = Math.min(i + windowSamples, totalSamples);
    const len = end - i;

    for (let j = i; j < end; j++) {
      const val = channelData[j];
      const absVal = Math.abs(val);
      if (absVal > peak) peak = absVal;
      sumSquares += val * val;
    }

    const rms = Math.sqrt(sumSquares / len);
    const timeSec = i / sampleRate;

    timeline.push({
      time: parseFloat(timeSec.toFixed(2)),
      rms: parseFloat(rms.toFixed(4)),
      peak: parseFloat(peak.toFixed(4)),
    });

    totalEnergySum += rms;
    count++;
  }

  const avgEnergy = count > 0 ? totalEnergySum / count : 0.05;

  // Detect silences (RMS below 25% of average energy, sustained for at least 0.25 seconds)
  const silenceThreshold = Math.max(0.008, avgEnergy * 0.3);
  const minSilenceSec = 0.25;

  const silenceIntervals = [];
  let inSilence = false;
  let silenceStart = 0;

  for (let i = 0; i < timeline.length; i++) {
    const item = timeline[i];
    const isSilent = item.rms < silenceThreshold;

    if (isSilent && !inSilence) {
      inSilence = true;
      silenceStart = item.time;
    } else if (!isSilent && inSilence) {
      inSilence = false;
      const duration = item.time - silenceStart;
      if (duration >= minSilenceSec) {
        silenceIntervals.push({
          start: silenceStart,
          end: item.time,
          duration: parseFloat(duration.toFixed(2)),
        });
      }
    }
  }

  if (inSilence) {
    const lastTime = timeline[timeline.length - 1]?.time || 0;
    const duration = lastTime - silenceStart;
    if (duration >= minSilenceSec) {
      silenceIntervals.push({
        start: silenceStart,
        end: lastTime,
        duration: parseFloat(duration.toFixed(2)),
      });
    }
  }

  return {
    timeline,
    avgEnergy,
    silenceThreshold,
    silenceIntervals,
  };
}

/**
 * Snaps a candidate timestamp to the nearest natural speech pause or silence boundary
 * Prevents words from being cut in half.
 */
export function snapToCleanBoundary(
  targetTime,
  silenceIntervals,
  direction = 'nearest',
  maxSnapSec = 1.8
) {
  if (!silenceIntervals || silenceIntervals.length === 0) {
    return targetTime;
  }

  let bestTime = targetTime;
  let minDiff = Infinity;

  for (const interval of silenceIntervals) {
    // A clean cut point is right in the middle of a silence gap
    const candidateCut = (interval.start + interval.end) / 2;
    const diff = Math.abs(candidateCut - targetTime);

    if (diff <= maxSnapSec) {
      if (direction === 'start' && candidateCut <= targetTime + maxSnapSec) {
        if (diff < minDiff) {
          minDiff = diff;
          bestTime = candidateCut;
        }
      } else if (
        direction === 'end' &&
        candidateCut >= targetTime - maxSnapSec
      ) {
        if (diff < minDiff) {
          minDiff = diff;
          bestTime = candidateCut;
        }
      } else if (direction === 'nearest') {
        if (diff < minDiff) {
          minDiff = diff;
          bestTime = candidateCut;
        }
      }
    }
  }

  return parseFloat(bestTime.toFixed(2));
}

/**
 * Detects real human vocal phrases and exact speech onset in an audio energy profile.
 * Completely skips initial silent intros, background logo music, or dead space.
 * Enforces a 1.0 second pre-roll lead time before voice onset so words/recitation start naturally.
 *
 * @param {Array<{ time: number, rms: number, peak: number }>} timeline
 * @param {number} avgEnergy
 * @param {Array<{ start: number, end: number, duration: number }>} [silenceIntervals]
 * @returns {{
 *   firstVoiceOnset: number,
 *   vocalPhrases: Array<{ start: number, end: number, duration: number, peakEnergy: number, isLoudOnset: boolean }>,
 *   loudSurges: Array<{ time: number, rms: number }>
 * }}
 */
export function detectVocalPhrases(timeline, avgEnergy, silenceIntervals = []) {
  if (!timeline || timeline.length === 0) {
    return { firstVoiceOnset: 0, vocalPhrases: [], loudSurges: [] };
  }

  const baseAvg = avgEnergy || 0.05;
  // Voice threshold: Human singing/reciting energy is consistently above ambient noise floor
  const voiceThreshold = Math.max(0.012, baseAvg * 0.4);
  const loudThreshold = Math.max(0.025, baseAvg * 1.35); // Loud passionate reciting / hook
  const minPhraseDuration = 1.0; // Vocal phrase/line is at least 1.0s
  const vocalPhrases = [];
  const loudSurges = [];

  let inPhrase = false;
  let phraseStart = 0;
  let phrasePeak = 0;
  let phraseHasLoud = false;

  for (let i = 0; i < timeline.length; i++) {
    const pt = timeline[i];
    const isVoice = pt.rms >= voiceThreshold;
    const isLoud = pt.rms >= loudThreshold;

    if (isLoud) {
      // Record loud surge points (at least 4s apart)
      if (
        loudSurges.length === 0 ||
        pt.time - loudSurges[loudSurges.length - 1].time >= 4.0
      ) {
        loudSurges.push({ time: pt.time, rms: pt.rms });
      }
    }

    if (isVoice) {
      if (!inPhrase) {
        inPhrase = true;
        phraseStart = pt.time;
        phrasePeak = pt.rms;
        phraseHasLoud = isLoud;
      } else {
        if (pt.rms > phrasePeak) phrasePeak = pt.rms;
        if (isLoud) phraseHasLoud = true;
      }
    } else if (inPhrase) {
      // Check if this momentary dip is sustained silence or just a short consonant/pause (<0.4s)
      const lookahead = timeline.slice(i, i + 4);
      const stillActiveSoon = lookahead.some((p) => p.rms >= voiceThreshold);

      if (!stillActiveSoon) {
        inPhrase = false;
        const phraseEnd = pt.time;
        const duration = phraseEnd - phraseStart;

        if (duration >= minPhraseDuration) {
          vocalPhrases.push({
            start: parseFloat(phraseStart.toFixed(2)),
            end: parseFloat(phraseEnd.toFixed(2)),
            duration: parseFloat(duration.toFixed(2)),
            peakEnergy: parseFloat(phrasePeak.toFixed(4)),
            isLoudOnset: phraseHasLoud,
          });
        }
      }
    }
  }

  // If ended while still vocalizing
  if (inPhrase) {
    const lastTime = timeline[timeline.length - 1].time;
    const duration = lastTime - phraseStart;
    if (duration >= minPhraseDuration) {
      vocalPhrases.push({
        start: parseFloat(phraseStart.toFixed(2)),
        end: parseFloat(lastTime.toFixed(2)),
        duration: parseFloat(duration.toFixed(2)),
        peakEnergy: parseFloat(phrasePeak.toFixed(4)),
        isLoudOnset: phraseHasLoud,
      });
    }
  }

  // Identify first true voice onset (where the person actually starts reciting/singing)
  const firstVoiceOnset = vocalPhrases.length > 0 ? vocalPhrases[0].start : 0;

  return {
    firstVoiceOnset,
    vocalPhrases,
    loudSurges,
  };
}
