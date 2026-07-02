import { toBlobURL } from '@ffmpeg/util';

/**
 * Loads FFmpeg core + WASM with automatic local assets and CDN fallback.
 */

export async function loadFFmpegCore(ffmpeg) {
  let lastError;

  // Build local source path if running in the browser
  const localUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/ffmpeg` : null;
  const sources = [];
  if (localUrl) {
    sources.push(localUrl);
  }
  sources.push('https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd');
  sources.push('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd');

  for (const baseURL of sources) {
    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          'application/wasm'
        ),
      });
      return true;
    } catch (err) {
      console.warn(`[FFmpeg] Load failed for source: ${baseURL}`, err.message);
      lastError = err;
    }
  }

  throw (
    lastError || new Error('All FFmpeg loading sources failed (local & CDNs).')
  );
}
