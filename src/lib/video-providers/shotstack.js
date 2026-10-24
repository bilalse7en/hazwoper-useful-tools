/**
 * Shotstack Cloud Video Rendering Provider Adapter
 * Official REST API integration for automated cloud rendering of 9:16 vertical shorts,
 * B-roll footage replacements, and subtitle overlays.
 * Reference: https://shotstack.io/docs/api/
 */

/**
 * Checks if Shotstack API credentials are configured in the environment
 */
export function hasShotstackCredentials() {
  const key = process.env.SHOTSTACK_API_KEY?.trim();
  return Boolean(key && key.length > 8);
}

/**
 * Returns Shotstack API base URL according to configured environment ('stage' or 'v1')
 */
export function getShotstackBaseUrl() {
  const env = (process.env.SHOTSTACK_ENV || 'stage').toLowerCase().trim();
  return `https://api.shotstack.io/edit/${env === 'production' || env === 'prod' || env === 'v1' ? 'v1' : 'stage'}`;
}

/**
 * Submits a custom video edit timeline to Shotstack Cloud Rendering API
 * @param {Object} options
 * @param {string} options.videoUrl - Public source video URL
 * @param {number} [options.startTime] - Start seek in seconds
 * @param {number} [options.duration] - Clip duration in seconds
 * @param {string} [options.aspectRatio] - '9:16' | '16:9' | '1:1'
 * @param {string} [options.brollUrl] - Optional Islamic B-roll replacement video URL
 * @param {Array<Object>} [options.captions] - Array of timed captions { start, end, text, roman }
 * @param {string} [options.webhookUrl] - Webhook callback URL
 * @returns {Promise<{ success: boolean, renderId: string, status: string, response: any }>}
 */
export async function renderShotstackShort({
  videoUrl,
  startTime = 0,
  duration = 30,
  aspectRatio = '9:16',
  brollUrl = null,
  captions = [],
  webhookUrl = null,
}) {
  const apiKey = process.env.SHOTSTACK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'SHOTSTACK_API_KEY is not configured. Please add SHOTSTACK_API_KEY to your environment variables.'
    );
  }

  const tracks = [];

  // Track 1 (Top): Captions / Subtitle overlay track if present
  if (Array.isArray(captions) && captions.length > 0) {
    const titleClips = captions.slice(0, 40).map((cap) => {
      const capStart = Math.max(0, (cap.start || 0) - startTime);
      const capLength = Math.max(
        1,
        (cap.end || capStart + 2) - (cap.start || 0)
      );
      const textToDisplay = cap.text || cap.roman || '';

      return {
        asset: {
          type: 'title',
          text: textToDisplay,
          style: 'future',
          color: '#ffffff',
          size: 'large',
          position: 'bottom',
          offset: { y: 0.15 },
        },
        start: parseFloat(capStart.toFixed(2)),
        length: parseFloat(capLength.toFixed(2)),
        fit: 'none',
      };
    });

    tracks.push({ clips: titleClips });
  }

  // Track 2: Visual Layer (B-Roll Replacement or Cropped Main Video)
  if (brollUrl) {
    // When Islamic B-roll is selected, B-roll provides the visual stream
    tracks.push({
      clips: [
        {
          asset: {
            type: 'video',
            src: brollUrl,
            trim: 0,
          },
          start: 0,
          length: duration,
          fit: 'crop',
          scale: 1.0,
        },
      ],
    });
  } else {
    // Primary video stream
    tracks.push({
      clips: [
        {
          asset: {
            type: 'video',
            src: videoUrl,
            trim: startTime,
          },
          start: 0,
          length: duration,
          fit: 'crop',
          scale: 1.0,
        },
      ],
    });
  }

  // Track 3 (Audio): Audio Track preserving original naat recitation
  tracks.push({
    clips: [
      {
        asset: {
          type: 'audio',
          src: videoUrl,
          trim: startTime,
          volume: 1.0,
        },
        start: 0,
        length: duration,
      },
    ],
  });

  const timeline = {
    tracks,
  };

  const output = {
    format: 'mp4',
    resolution: '1080',
    aspectRatio:
      aspectRatio === '9:16' ? '9:16' : aspectRatio === '1:1' ? '1:1' : '16:9',
    fps: 30,
  };

  const payload = {
    timeline,
    output,
  };

  if (webhookUrl) {
    payload.callback = webhookUrl;
  }

  const endpoint = `${getShotstackBaseUrl()}/render`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.response?.id) {
    const errorMsg =
      data.message ||
      data.response?.message ||
      `Shotstack render failed (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  return {
    success: true,
    renderId: data.response.id,
    status: data.response.status || 'queued',
    response: data.response,
  };
}

/**
 * Polls the status of an active Shotstack render job
 * @param {string} renderId - Shotstack Render ID
 * @returns {Promise<{ status: 'queued'|'rendering'|'done'|'failed', url?: string, error?: string, raw?: any }>}
 */
export async function getShotstackRenderStatus(renderId) {
  const apiKey = process.env.SHOTSTACK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('SHOTSTACK_API_KEY is not configured.');
  }

  const endpoint = `${getShotstackBaseUrl()}/render/${encodeURIComponent(renderId)}`;

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.message || `Failed to fetch Shotstack render status (${res.status})`
    );
  }

  const resp = data.response || {};
  const status = resp.status; // 'queued' | 'fetching' | 'rendering' | 'saving' | 'done' | 'failed'

  if (status === 'done') {
    return {
      status: 'done',
      url: resp.url,
      duration: resp.duration,
      renderId,
      raw: resp,
    };
  }

  if (status === 'failed') {
    return {
      status: 'failed',
      error: resp.error || 'Shotstack cloud render failed.',
      renderId,
      raw: resp,
    };
  }

  return {
    status: 'rendering',
    renderId,
    raw: resp,
  };
}
