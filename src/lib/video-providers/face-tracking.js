/**
 * Face Detection & 9:16 Reframing Provider Adapter
 * Integrates provider-side active speaker metadata with local computer vision tracking
 * to guarantee reciter and singer faces remain centered in vertical shorts.
 */

import { MultiSpeakerTracker } from '../video-shorts/speaker-tracker.js';
import { calculateSmoothedCropTimeline } from '../video-shorts/face-tracker.js';

/**
 * Calculates optimal 9:16 crop timeline from speaker detection
 * @param {Object} options
 * @param {number} options.sourceWidth
 * @param {number} options.sourceHeight
 * @param {Array<Object>} [options.detectedPoints] - Optional array of { time, targetX }
 * @returns {Array<Object>} Timeline of { time, cropX, cropY, cropW, cropH }
 */
export function getOptimalPortraitCropTimeline({
  sourceWidth = 1920,
  sourceHeight = 1080,
  detectedPoints = [],
}) {
  return calculateSmoothedCropTimeline(
    detectedPoints,
    sourceWidth,
    sourceHeight
  );
}

/**
 * Creates an instance of the MultiSpeakerTracker for real-time canvas framing
 */
export function createSpeakerTracker(options = {}) {
  return new MultiSpeakerTracker(options);
}
