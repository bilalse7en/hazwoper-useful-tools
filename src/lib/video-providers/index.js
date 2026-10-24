/**
 * Third-Party Video Provider Adapter Layer
 * Canonical entry point for OpusClip, Shotstack, and Urdu AI processing.
 */

export * from './opusclip.js';
export * from './shotstack.js';
export * from './transcription.js';
export * from './face-tracking.js';

import {
  hasOpusClipCredentials,
  submitOpusClipProject,
  getOpusClipProjectStatus,
} from './opusclip.js';
import {
  hasShotstackCredentials,
  renderShotstackShort,
  getShotstackRenderStatus,
} from './shotstack.js';
import {
  hasTranscriptionCredentials,
  transcribeUrduNaat,
} from './transcription.js';

/**
 * Returns a live diagnostics report of available cloud providers
 */
export function getProvidersStatusReport() {
  return {
    opusclip: {
      enabled: hasOpusClipCredentials(),
      name: 'OpusClip AI Clipping API',
      status: hasOpusClipCredentials() ? 'connected' : 'unconfigured',
      description: 'Automated AI viral moments curation & speaker tracking',
    },
    shotstack: {
      enabled: hasShotstackCredentials(),
      name: 'Shotstack Cloud Video API',
      status: hasShotstackCredentials() ? 'connected' : 'unconfigured',
      description: 'Distributed cloud video rendering & B-roll composition',
    },
    transcription: {
      enabled: hasTranscriptionCredentials(),
      name: 'Urdu Speech Recognition AI',
      status: hasTranscriptionCredentials() ? 'connected' : 'local-engine',
      description:
        'Urdu Nastaliq transcription & phonetic Roman Urdu transliteration',
    },
  };
}
