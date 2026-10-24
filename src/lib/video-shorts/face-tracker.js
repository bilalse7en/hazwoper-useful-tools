/**
 * Face Detection & Smart 9:16 Crop Positioning Engine
 * Implements exponential moving average (EMA) smoothing for cinematic camera panning.
 * 100% Free, browser canvas & computer vision processing.
 */

/**
 * Detects active speaker face and lip-movement activity in canvas frame
 * Combines skin-tone luma/chroma with mouth/lip region motion analysis.
 */
export function detectActiveSpeakerCentroid(
  imageData,
  prevImageData = null,
  isSpeaking = true
) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let lipMotionSum = 0;
  let lipMotionCount = 0;

  // We look at the upper 65% of the frame where faces/heads naturally appear
  const maxScanY = Math.floor(height * 0.7);

  for (let y = 10; y < maxScanY; y += 4) {
    for (let x = 10; x < width - 10; x += 4) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Convert RGB to YCbCr skin tone detection rule
      // Standard face detection chrominance range: Cb in [77, 127], Cr in [133, 173]
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;

      const isSkin =
        cr >= 130 && cr <= 175 && cb >= 77 && cb <= 128 && r > g && g > b;

      if (isSkin) {
        // Measure lip/mouth motion delta if previous frame exists in lower half of face
        let motionFactor = 1.0;
        if (prevImageData && y > height * 0.35 && y < height * 0.6) {
          const pr = prevImageData.data[idx];
          const pg = prevImageData.data[idx + 1];
          const pb = prevImageData.data[idx + 2];
          const delta =
            (Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb)) / 3;
          if (delta > 8) {
            motionFactor = 1.4; // Boost weight for moving lips
            lipMotionSum += delta;
            lipMotionCount++;
          }
        }

        const centerDist = Math.abs(x - width / 2) / (width / 2);
        const weight = (1.0 - centerDist * 0.25) * motionFactor;

        weightedX += x * weight;
        weightedY += y * weight;
        totalWeight += weight;
      }
    }
  }

  // 2. Scan for physical action & body movement if previous frame exists
  let actionWeight = 0;
  let actionX = 0;
  let actionY = 0;

  if (prevImageData) {
    for (let y = 10; y < height - 10; y += 6) {
      for (let x = 10; x < width - 10; x += 6) {
        const idx = (y * width + x) * 4;
        const dr = Math.abs(data[idx] - prevImageData.data[idx]);
        const dg = Math.abs(data[idx + 1] - prevImageData.data[idx + 1]);
        const db = Math.abs(data[idx + 2] - prevImageData.data[idx + 2]);
        const diff = (dr + dg + db) / 3;

        if (diff > 16) {
          actionX += x * diff;
          actionY += y * diff;
          actionWeight += diff;
        }
      }
    }
  }

  const lipActivity = lipMotionCount > 5 ? lipMotionSum / lipMotionCount : 0;
  const isLipSyncActive = isSpeaking && lipActivity > 10;
  const hasActionMovement = actionWeight > 250;

  if (totalWeight > 50) {
    let finalX = weightedX / totalWeight;
    let finalY = weightedY / totalWeight;

    // If active body motion/gestures are occurring, blend motion smoothly
    if (hasActionMovement) {
      const actCentroidX = actionX / actionWeight;
      finalX = finalX * 0.75 + actCentroidX * 0.25;
    }

    return {
      x: finalX,
      y: finalY,
      confidence: Math.min(1.0, totalWeight / 600),
      detected: true,
      isLipSyncActive,
      isActionActive: hasActionMovement,
      zoomFactor: isLipSyncActive || hasActionMovement ? 1.06 : 1.0, // Kinetic punchy zoom
    };
  }

  // If face wasn't found, but action movement in the video was detected:
  if (hasActionMovement) {
    return {
      x: actionX / actionWeight,
      y: actionY / actionWeight,
      confidence: 0.75,
      detected: true,
      isLipSyncActive: false,
      isActionActive: true,
      zoomFactor: 1.04,
    };
  }

  // Fallback: Default to center
  return {
    x: width / 2,
    y: height / 2.5,
    confidence: 0,
    detected: false,
    isLipSyncActive: false,
    isActionActive: false,
    zoomFactor: 1.0,
  };
}

export function detectSubjectCentroid(imageData) {
  return detectActiveSpeakerCentroid(imageData, null, false);
}

/**
 * Calculates 9:16 Portrait Crop Coordinates inside a Source Video (e.g. 1920x1080)
 * Applies Exponential Moving Average (EMA) smoothing to eliminate camera jitter.
 *
 * @param {Array<{ time: number, targetX: number }>} detectedPoints - Raw detected positions over time
 * @param {number} sourceWidth - e.g. 1920
 * @param {number} sourceHeight - e.g. 1080
 * @param {number} alpha - Smoothing factor between 0.08 and 0.15 (lower = smoother pan)
 * @returns {Array<{ time: number, cropX: number, cropY: number, cropW: number, cropH: number }>}
 */
export function calculateSmoothedCropTimeline(
  detectedPoints,
  sourceWidth = 1920,
  sourceHeight = 1080,
  alpha = 0.12
) {
  // Target 9:16 dimensions inside source height
  const cropH = sourceHeight;
  const cropW = Math.round(sourceHeight * (9 / 16));
  const maxCropX = Math.max(0, sourceWidth - cropW);

  if (!detectedPoints || detectedPoints.length === 0) {
    // Default center crop
    return [
      {
        time: 0,
        cropX: Math.round((sourceWidth - cropW) / 2),
        cropY: 0,
        cropW,
        cropH,
      },
    ];
  }

  const result = [];
  const centerX = (sourceWidth - cropW) / 2; // Default center crop if uninitialized
  let currentSmoothedX = centerX;

  for (let i = 0; i < detectedPoints.length; i++) {
    const pt = detectedPoints[i];
    // Ideal crop centered directly on detected face/subject
    const rawCropX = Math.max(0, Math.min(maxCropX, pt.targetX - cropW / 2));

    // Smooth transition
    currentSmoothedX = alpha * rawCropX + (1 - alpha) * currentSmoothedX;

    result.push({
      time: pt.time,
      cropX: Math.round(currentSmoothedX),
      cropY: 0,
      cropW,
      cropH,
    });
  }

  return result;
}

/**
 * Generates an FFmpeg complex filter string for smart 9:16 portrait video
 * @param {string} mode - 'smart-face', 'center-crop', 'blurred-bg', 'split-screen'
 * @param {number} cropX - starting horizontal crop coordinate
 * @param {number} sourceWidth - 1920
 * @param {number} sourceHeight - 1080
 */
export function buildFFmpegCropFilter(
  mode = 'smart-face',
  cropX = null,
  sourceWidth = 1920,
  sourceHeight = 1080
) {
  const targetW = 1080;
  const targetH = 1920;
  const cropW = Math.round(sourceHeight * (9 / 16));
  const defaultCropX =
    cropX !== null ? cropX : Math.round((sourceWidth - cropW) / 2);

  switch (mode) {
    case 'blurred-bg':
      // Original 16:9 scaled to fit width + blurred 9:16 background
      return `[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,boxblur=20:5,setsar=1[bg];[0:v]scale=${targetW}:-1:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;

    case 'split-screen':
      // Stack two 9:8 sections or dual crop
      return `[0:v]crop=${cropW}:${sourceHeight}:${defaultCropX}:0,scale=${targetW}:${targetH / 2}[top];[0:v]crop=${cropW}:${sourceHeight}:${defaultCropX}:0,scale=${targetW}:${targetH / 2}[bot];[top][bot]vstack`;

    case 'center-crop':
      return `crop=${cropW}:${sourceHeight}:${Math.round((sourceWidth - cropW) / 2)}:0,scale=${targetW}:${targetH}`;

    case 'trending-ai-speaker':
    case 'smart-face':
    default:
      return `crop=${cropW}:${sourceHeight}:${defaultCropX}:0,scale=${targetW}:${targetH}`;
  }
}
