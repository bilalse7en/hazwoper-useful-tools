/**
 * Urdu Speech-to-Text & Couplet Alignment Provider Adapter
 * Integrates specialized STT APIs (OpenAI Whisper API, Custom Transcription API)
 * with robust local Whisper Urdu model fallback.
 */

import { transliterateUrduSentence } from '../video-shorts/urdu-transliterator.js';

/**
 * Checks if a third-party transcription API key is present
 */
export function hasTranscriptionCredentials() {
  const customKey = process.env.TRANSCRIPTION_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  return Boolean(
    (customKey && customKey.length > 5) || (openAiKey && openAiKey.length > 5)
  );
}

/**
 * Transcribes Urdu audio using third-party API if available, or local Whisper engine
 * @param {Object} options
 * @param {string|Buffer} options.audioSource - Audio file path or URL
 * @param {number} [options.maxDurationSeconds] - Max seconds to transcribe
 * @returns {Promise<{ transcript: string, captions: Array<Object>, provider: string }>}
 */
export async function transcribeUrduNaat({
  audioSource,
  maxDurationSeconds = 300,
}) {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  // Strategy 1: OpenAI Whisper API if configured
  if (
    openAiKey &&
    typeof audioSource === 'string' &&
    audioSource.startsWith('http')
  ) {
    try {
      // If public URL is provided, call external Whisper API
      // Note: OpenAI requires multipart file upload for /v1/audio/transcriptions
      // We check if fetch audio succeeds
      const audioRes = await fetch(audioSource);
      if (audioRes.ok) {
        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
        formData.append('file', blob, 'audio.mp3');
        formData.append('model', 'whisper-1');
        formData.append('language', 'ur');
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'segment');

        const apiRes = await fetch(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openAiKey}`,
            },
            body: formData,
          }
        );

        if (apiRes.ok) {
          const result = await apiRes.json();
          const segments = result.segments || [];
          const captions = segments.map((seg, i) => {
            const urduText = seg.text.trim();
            const romanText = transliterateUrduSentence(urduText);
            return {
              id: `cap_${i + 1}`,
              start: parseFloat(seg.start.toFixed(2)),
              end: parseFloat(seg.end.toFixed(2)),
              text: urduText,
              roman: romanText,
              confidence: 0.95,
            };
          });

          return {
            transcript: result.text || '',
            captions,
            provider: 'whisper-api',
          };
        }
      }
    } catch (apiErr) {
      console.warn(
        'Third-party STT API warning, falling back to local Whisper:',
        apiErr.message
      );
    }
  }

  // Strategy 2: Local Whisper ONNX Engine (Configured specifically for Urdu phonetics)
  const { transcribeUrduVideo } =
    await import('../video-shorts/transcription-service.js');
  const result = await transcribeUrduVideo(audioSource, maxDurationSeconds);

  return {
    transcript: result.transcript || '',
    captions: (result.captions || []).map((c) => ({
      ...c,
      roman: c.roman || transliterateUrduSentence(c.text),
    })),
    provider: 'local-whisper-ur',
  };
}
