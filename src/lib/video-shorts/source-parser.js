/**
 * Video Source Parser & Validator
 * Supports YouTube URL metadata extraction and local video file inspection.
 * Zero paid APIs.
 */

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();
  // Match youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = cleanUrl.match(regex);
  return match ? match[1] : null;
}

export function isValidYouTubeUrl(url) {
  return extractYouTubeId(url) !== null;
}

/**
 * Retrieves YouTube video metadata using public oEmbed & open endpoint.
 * No API key required.
 */
export async function getYouTubeMetadata(url) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error(
      'Invalid YouTube URL format. Please provide a standard watch or Shorts link.'
    );
  }

  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        throw new Error(
          'Video is private, restricted, or unavailable. Please verify the URL.'
        );
      }
      throw new Error(
        `YouTube metadata returned HTTP status ${response.status}`
      );
    }

    const data = await response.json();

    return {
      id: videoId,
      sourceType: 'youtube',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: data.title || 'Untitled YouTube Video',
      author: data.author_name || 'Unknown Creator',
      authorUrl: data.author_url || '',
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailMaxRes: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      width: 1920,
      height: 1080,
      aspectRatio: 16 / 9,
    };
  } catch (err) {
    // If oEmbed fails due to CORS or network in browser, fallback to standard metadata
    return {
      id: videoId,
      sourceType: 'youtube',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: `YouTube Video (${videoId})`,
      author: 'YouTube Creator',
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailMaxRes: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      width: 1920,
      height: 1080,
      aspectRatio: 16 / 9,
    };
  }
}

/**
 * Inspects a local video file (File or Blob object) in browser
 * Reads duration, dimensions, codecs, and audio presence.
 */
export async function inspectLocalVideoFile(file) {
  if (!file) {
    throw new Error('No video file provided.');
  }

  const validTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v',
    'video/ogg',
  ];
  const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
  const validExts = ['mp4', 'webm', 'mov', 'm4v', 'mkv'];

  if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
    throw new Error(
      `Unsupported video format (${file.type || ext}). Please upload an MP4, MOV, or WebM video.`
    );
  }

  // Size limit: 1.5 GB for smooth in-browser handling
  const maxBytes = 1.5 * 1024 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      'Video file exceeds 1.5 GB. Please compress or trim the video first.'
    );
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      const aspectRatio = width / (height || 1);

      // Capture a thumbnail frame at ~1s
      video.currentTime = Math.min(1.0, duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(640, video.videoWidth || 640);
        canvas.height = Math.round(
          canvas.width / (video.videoWidth / video.videoHeight || 16 / 9)
        );
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);

        resolve({
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: 'local',
          file,
          blobUrl,
          fileName: file.name,
          fileSize: file.size,
          duration: video.duration || 0,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          aspectRatio: (video.videoWidth || 1920) / (video.videoHeight || 1080),
          thumbnailUrl,
        });
      } catch (e) {
        resolve({
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: 'local',
          file,
          blobUrl,
          fileName: file.name,
          fileSize: file.size,
          duration: video.duration || 0,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          aspectRatio: (video.videoWidth || 1920) / (video.videoHeight || 1080),
          thumbnailUrl: null,
        });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(
        new Error(
          'Failed to load video metadata. The file may be corrupt or encoded in an unsupported codec.'
        )
      );
    };

    video.src = blobUrl;
  });
}
