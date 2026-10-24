/**
 * OpusClip Third-Party Provider Adapter
 * Official REST API integration for automated AI video clipping and reframing.
 * Reference: https://api.opus.pro/api/clip-projects
 */

const OPUS_API_BASE = 'https://api.opus.pro/api';

/**
 * Checks if OpusClip API credentials are configured in the environment
 */
export function hasOpusClipCredentials() {
  const key = process.env.OPUSCLIP_API_KEY?.trim();
  return Boolean(key && key.length > 8);
}

/**
 * Submits a video URL to OpusClip for automated AI clipping
 * @param {Object} options
 * @param {string} options.videoUrl - Public YouTube or direct MP4 URL
 * @param {string} [options.title] - Project title
 * @param {Array<number>} [options.clipDurationRange] - e.g. [30, 60]
 * @param {string} [options.webhookUrl] - Optional webhook callback URL
 * @returns {Promise<{ success: boolean, projectId: string, status: string, raw?: any }>}
 */
export async function submitOpusClipProject({
  videoUrl,
  title = 'AI Naat Short Project',
  clipDurationRange = [30, 60],
  webhookUrl = null,
}) {
  const apiKey = process.env.OPUSCLIP_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'OPUSCLIP_API_KEY is not configured. Please add OPUSCLIP_API_KEY to your environment variables.'
    );
  }

  const payload = {
    videoUrl,
    curationPref: {
      clipDurations: [clipDurationRange],
      genre: 'Auto',
      topicKeywords: ['Islamic', 'Naat', 'Recitation', 'Shorts'],
    },
    importPref: {
      sourceLang: 'auto',
    },
  };

  if (webhookUrl) {
    payload.conclusionActions = [
      {
        type: 'webhook',
        url: webhookUrl,
      },
    ];
  }

  const response = await fetch(`${OPUS_API_BASE}/clip-projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data.message ||
      data.error ||
      `OpusClip API error (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  const projectId = data.projectId || data.id || data.project_id;
  if (!projectId) {
    throw new Error('OpusClip API did not return a valid projectId.');
  }

  return {
    success: true,
    projectId,
    status: data.status || 'processing',
    raw: data,
  };
}

/**
 * Polls or retrieves generated exportable clips from OpusClip
 * @param {string} projectId - OpusClip Project ID
 * @returns {Promise<{ status: string, progress: number, clips: Array<any> }>}
 */
export async function getOpusClipProjectStatus(projectId) {
  const apiKey = process.env.OPUSCLIP_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPUSCLIP_API_KEY is not configured.');
  }

  // 1. Query exportable clips for this project
  const clipsUrl = `${OPUS_API_BASE}/exportable-clips?q=findByProjectId&projectId=${encodeURIComponent(
    projectId
  )}`;

  const res = await fetch(clipsUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    // If not ready yet or 404, return processing status
    if (res.status === 404 || res.status === 202) {
      return {
        status: 'processing',
        progress: 45,
        clips: [],
      };
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `OpusClip query failed (${res.status})`);
  }

  const data = await res.json();
  const rawClips = Array.isArray(data) ? data : data.clips || data.items || [];

  if (rawClips.length > 0) {
    // Normalize clips into standardized internal format
    const clips = rawClips.map((c, idx) => ({
      id: c.clipId || c.id || `opus_${projectId}_${idx + 1}`,
      index: idx + 1,
      title: c.headline || c.title || `Short #${idx + 1}`,
      duration: c.duration || 35,
      score: c.score || c.viralityScore || 92,
      previewUrl: c.previewUrl || c.videoUrl || c.downloadUrl,
      downloadUrl: c.downloadUrl || c.videoUrl,
      thumbnailUrl: c.thumbnailUrl || c.coverUrl,
      transcript: c.transcript || '',
      captions: Array.isArray(c.captions) ? c.captions : [],
      start: c.startSec ?? c.start ?? 0,
      end: c.endSec ?? c.end ?? (c.duration || 35),
      provider: 'opusclip',
      providerJobId: projectId,
    }));

    return {
      status: 'completed',
      progress: 100,
      clips,
    };
  }

  return {
    status: 'processing',
    progress: 65,
    clips: [],
  };
}
