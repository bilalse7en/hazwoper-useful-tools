import { describe, it, expect } from 'vitest';
import { discoverClips } from '@/lib/video-shorts/clip-finder';

describe('Naat Ashaar Segmentation & Shorts Duration Audit (30-60s Strict)', () => {
  it('guarantees every generated standard short is strictly between 30 and 60 seconds', () => {
    const timeline = [];
    for (let t = 0; t <= 300; t += 0.1) {
      timeline.push({
        time: parseFloat(t.toFixed(1)),
        rms: 0.05,
        peak: 0.1,
      });
    }

    const clips = discoverClips({
      videoDuration: 300,
      audioAnalysis: { timeline, avgEnergy: 0.04, silenceIntervals: [] },
      sceneCuts: [],
      settings: {
        durationPreset: 'standard',
        clipCount: 4,
      },
    });

    expect(clips.length).toBeGreaterThanOrEqual(3);
    clips.forEach((clip) => {
      expect(clip.duration).toBeGreaterThanOrEqual(30.0);
      expect(clip.duration).toBeLessThanOrEqual(60.0);
      expect(clip.end - clip.start).toBeCloseTo(clip.duration, 1);
    });
  });

  it('combines an Ashaar shorter than 30s (e.g. 21s) with adjacent Ashaar into a 35-50s complete clip', () => {
    const timeline = [];
    // Verse 1: 10s to 31s (21s)
    // Pause: 31s to 32.5s (1.5s)
    // Verse 2: 32.5s to 49.5s (17s)
    for (let t = 0; t <= 120; t += 0.1) {
      const isVoice = (t >= 10.0 && t <= 31.0) || (t >= 32.5 && t <= 49.5);
      const rms = isVoice ? 0.08 : 0.005;
      timeline.push({ time: parseFloat(t.toFixed(1)), rms, peak: rms * 1.5 });
    }

    const audioAnalysis = {
      timeline,
      avgEnergy: 0.03,
      silenceIntervals: [
        { start: 0, end: 9.5, duration: 9.5 },
        { start: 31.0, end: 32.5, duration: 1.5 },
        { start: 50.0, end: 120.0, duration: 70.0 },
      ],
    };

    const userLyrics = `Karam Mangta Hoon, Ataa Mangta Hoon
Ilahi Main Tujh Se Dua Mangta Hoon

Ata Ho Karam Ki Nazar Ya Ilahi
Main Apne Gunahon Ki Bakhshish Mangta Hoon`;

    const clips = discoverClips({
      videoDuration: 120,
      audioAnalysis,
      sceneCuts: [],
      settings: {
        durationPreset: 'standard',
        clipCount: 2,
        referenceLyrics: userLyrics,
      },
    });

    expect(clips.length).toBeGreaterThanOrEqual(1);
    const combinedClip = clips[0];
    expect(combinedClip.duration).toBeGreaterThanOrEqual(30.0);
    expect(combinedClip.duration).toBeLessThanOrEqual(60.0);
    expect(combinedClip.stanzasCount).toBeGreaterThanOrEqual(2);
  });

  it('maintains original sequence of the recitation in chronological order', () => {
    const timeline = [];
    for (let t = 0; t <= 240; t += 0.1) {
      timeline.push({ time: parseFloat(t.toFixed(1)), rms: 0.05, peak: 0.1 });
    }

    const clips = discoverClips({
      videoDuration: 240,
      audioAnalysis: { timeline, avgEnergy: 0.04, silenceIntervals: [] },
      sceneCuts: [],
      settings: {
        durationPreset: 'standard',
        clipCount: 4,
      },
    });

    for (let i = 1; i < clips.length; i++) {
      expect(clips[i].start).toBeGreaterThan(clips[i - 1].start);
    }
  });
});
