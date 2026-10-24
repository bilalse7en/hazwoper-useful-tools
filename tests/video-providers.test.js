import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hasOpusClipCredentials,
  submitOpusClipProject,
  getOpusClipProjectStatus,
  hasShotstackCredentials,
  getShotstackBaseUrl,
  renderShotstackShort,
  getShotstackRenderStatus,
  hasTranscriptionCredentials,
  getOptimalPortraitCropTimeline,
  createSpeakerTracker,
  getProvidersStatusReport,
} from '@/lib/video-providers';

describe('Third-Party Video Providers Adapter Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('OpusClip Provider Adapter', () => {
    it('accurately detects missing credentials when OPUSCLIP_API_KEY is not set', () => {
      delete process.env.OPUSCLIP_API_KEY;
      expect(hasOpusClipCredentials()).toBe(false);
    });

    it('accurately detects present credentials when OPUSCLIP_API_KEY is configured', () => {
      process.env.OPUSCLIP_API_KEY = 'test_opusclip_api_key_12345';
      expect(hasOpusClipCredentials()).toBe(true);
    });

    it('rejects project submission cleanly with helpful error when credentials missing', async () => {
      delete process.env.OPUSCLIP_API_KEY;
      await expect(
        submitOpusClipProject({
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        })
      ).rejects.toThrow('OPUSCLIP_API_KEY is not configured');
    });

    it('rejects status poll cleanly when credentials missing', async () => {
      delete process.env.OPUSCLIP_API_KEY;
      await expect(getOpusClipProjectStatus('sample_proj_id')).rejects.toThrow(
        'OPUSCLIP_API_KEY is not configured'
      );
    });
  });

  describe('Shotstack Provider Adapter', () => {
    it('accurately detects missing credentials when SHOTSTACK_API_KEY is not set', () => {
      delete process.env.SHOTSTACK_API_KEY;
      expect(hasShotstackCredentials()).toBe(false);
    });

    it('accurately detects present credentials when SHOTSTACK_API_KEY is configured', () => {
      process.env.SHOTSTACK_API_KEY = 'test_shotstack_api_key_67890';
      expect(hasShotstackCredentials()).toBe(true);
    });

    it('resolves stage endpoint by default', () => {
      delete process.env.SHOTSTACK_ENV;
      expect(getShotstackBaseUrl()).toBe('https://api.shotstack.io/edit/stage');
    });

    it('resolves v1 production endpoint when SHOTSTACK_ENV=v1 or production', () => {
      process.env.SHOTSTACK_ENV = 'v1';
      expect(getShotstackBaseUrl()).toBe('https://api.shotstack.io/edit/v1');
      process.env.SHOTSTACK_ENV = 'production';
      expect(getShotstackBaseUrl()).toBe('https://api.shotstack.io/edit/v1');
    });

    it('rejects render call cleanly when credentials missing', async () => {
      delete process.env.SHOTSTACK_API_KEY;
      await expect(
        renderShotstackShort({ videoUrl: 'https://example.com/test.mp4' })
      ).rejects.toThrow('SHOTSTACK_API_KEY is not configured');
    });

    it('rejects render status poll cleanly when credentials missing', async () => {
      delete process.env.SHOTSTACK_API_KEY;
      await expect(
        getShotstackRenderStatus('render_sample_id')
      ).rejects.toThrow('SHOTSTACK_API_KEY is not configured');
    });
  });

  describe('Transcription Provider Adapter', () => {
    it('detects transcription credentials from either TRANSCRIPTION_API_KEY or OPENAI_API_KEY', () => {
      delete process.env.TRANSCRIPTION_API_KEY;
      delete process.env.OPENAI_API_KEY;
      expect(hasTranscriptionCredentials()).toBe(false);

      process.env.OPENAI_API_KEY = 'sk-sample-openai-key-test';
      expect(hasTranscriptionCredentials()).toBe(true);
    });
  });

  describe('Face Detection & 9:16 Crop Adapter', () => {
    it('computes 9:16 portrait dimensions and smooths crop timeline centered on target points', () => {
      const points = [
        { time: 0, targetX: 960 },
        { time: 1.0, targetX: 980 },
        { time: 2.0, targetX: 950 },
      ];

      const timeline = getOptimalPortraitCropTimeline({
        sourceWidth: 1920,
        sourceHeight: 1080,
        detectedPoints: points,
      });

      expect(timeline).toBeDefined();
      expect(timeline.length).toBe(3);
      expect(timeline[0].cropW).toBe(Math.round(1080 * (9 / 16)));
      expect(timeline[0].cropH).toBe(1080);
      expect(typeof timeline[0].cropX).toBe('number');
    });

    it('creates an initialized MultiSpeakerTracker instance', () => {
      const tracker = createSpeakerTracker({
        sourceWidth: 1920,
        sourceHeight: 1080,
      });
      expect(tracker).toBeDefined();
      expect(tracker.sourceWidth).toBe(1920);
      expect(tracker.cropWidth).toBe(Math.round(1080 * (9 / 16)));
    });
  });

  describe('Providers Status Report', () => {
    it('returns structured diagnostic status without leaking secret values', () => {
      const report = getProvidersStatusReport();
      expect(report).toBeDefined();
      expect(report.opusclip).toBeDefined();
      expect(typeof report.opusclip.enabled).toBe('boolean');
      expect(report.shotstack).toBeDefined();
      expect(typeof report.shotstack.enabled).toBe('boolean');
      expect(report.transcription).toBeDefined();
      expect(typeof report.transcription.enabled).toBe('boolean');

      // Crucial: Guarantee secret keys are NEVER leaked in status report
      const json = JSON.stringify(report);
      expect(json).not.toContain(process.env.OPUSCLIP_API_KEY || 'SECRET');
      expect(json).not.toContain(process.env.SHOTSTACK_API_KEY || 'SECRET');
    });
  });
});
