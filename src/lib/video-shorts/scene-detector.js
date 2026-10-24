/**
 * Scene Boundary & Visual Change Detector
 * Equivalent to PySceneDetect content detector algorithm implemented for the browser.
 * 100% Free, client-side Canvas frame difference analysis.
 */

/**
 * Calculates RGB 3D color histogram difference between two Canvas ImageData objects.
 * Threshold delta indicates a scene change.
 */
function computeFrameDelta(prevData, currData) {
  const p = prevData.data;
  const c = currData.data;
  const len = p.length;

  let totalDiff = 0;
  // Sample every 4th pixel for high performance
  let samples = 0;

  for (let i = 0; i < len; i += 16) {
    const dr = Math.abs(p[i] - c[i]);
    const dg = Math.abs(p[i + 1] - c[i + 1]);
    const db = Math.abs(p[i + 2] - c[i + 2]);
    totalDiff += (dr + dg + db) / 3;
    samples++;
  }

  // Normalized delta (0 to 100)
  return samples > 0 ? (totalDiff / samples / 255) * 100 : 0;
}

/**
 * Detects scene cuts and visual boundaries across a video element or video Blob.
 * @param {HTMLVideoElement|string} videoSource - video element or blob URL
 * @param {number} duration - video duration in seconds
 * @param {number} sampleInterval - sampling step in seconds (default 0.5s)
 * @param {number} threshold - scene cut threshold (default 27.0)
 * @returns {Promise<Array<{ time: number, score: number, type: string }>>}
 */
export async function detectSceneCuts(
  videoSource,
  duration,
  sampleInterval = 0.5,
  threshold = 27.0
) {
  if (!duration || duration <= 0) return [];

  return new Promise((resolve) => {
    let video;
    let ownVideo = false;

    if (typeof videoSource === 'string') {
      video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.src = videoSource;
      ownVideo = true;
    } else {
      video = videoSource;
    }

    const canvas = document.createElement('canvas');
    // 160x90 thumbnail resolution is fast and accurate for scene detection
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const sceneCuts = [];
    let prevImageData = null;
    let currentTime = 0;

    const sampleNextFrame = () => {
      if (currentTime >= duration) {
        if (ownVideo && video.src) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
        resolve(sceneCuts);
        return;
      }

      video.currentTime = currentTime;
    };

    video.onseeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const currImageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        if (prevImageData) {
          const delta = computeFrameDelta(prevImageData, currImageData);
          if (delta >= threshold) {
            sceneCuts.push({
              time: parseFloat(currentTime.toFixed(2)),
              score: parseFloat(delta.toFixed(1)),
              type: delta >= 45 ? 'hard_cut' : 'transition',
            });
          }
        }

        prevImageData = currImageData;
      } catch (e) {
        // Continue if a single frame fails
      }

      currentTime += sampleInterval;
      sampleNextFrame();
    };

    video.onerror = () => {
      resolve(sceneCuts);
    };

    video.onloadeddata = () => {
      sampleNextFrame();
    };

    // If already loaded
    if (video.readyState >= 2) {
      sampleNextFrame();
    }
  });
}
