/**
 * Test Suite: GTA 6 Gameplay to YouTube Shorts Generator
 * Tests multimodal event analysis, motion curves, audio spikes, classification,
 * action-tracking framing, and end-to-end integration.
 */

import { describe, it, expect } from 'vitest';
import {
  GTA_EVENT_CATEGORIES,
  buildMotionCurve,
  detectAudioEventSpikes,
  classifyGameplayEvent,
  discoverGameplayMoments,
  calculateActionFramingCrop,
} from '../src/lib/video-shorts/gta-event-detector.js';
import { discoverClips } from '../src/lib/video-shorts/clip-finder.js';
import { buildFFmpegArgs } from '../src/lib/video-shorts/ffmpeg-service.js';

describe('GTA 6 Gameplay Shorts Generator - Unit & Integration Test Suite', () => {
  describe('Motion Curve Construction & Normalization', () => {
    it('constructs a normalized motion curve with centroids', () => {
      const samples = [
        { time: 0.5, score: 20, centroidX: 45 },
        { time: 1.0, score: 80, centroidX: 65 },
        { time: 1.5, score: 100, centroidX: 70 },
        { time: 2.0, score: 40, centroidX: 50 },
      ];

      const curve = buildMotionCurve(samples, 5.0, 0.5);
      expect(curve.step).toBe(0.5);
      expect(curve.values.length).toBe(10);
      // Peak value at time 1.5 should be normalized to 1.0
      expect(curve.values[3]).toBe(1.0);
      expect(curve.centroids[3]).toBe(70);
    });

    it('handles empty samples safely', () => {
      const curve = buildMotionCurve([], 0, 0.5);
      expect(curve.values).toEqual([]);
      expect(curve.centroids).toEqual([]);
    });
  });

  describe('Audio Transient Spike Detection', () => {
    it('detects sound bursts and explosive acoustic peaks', () => {
      const timeline = [
        { time: 0.0, energy: 0.05 },
        { time: 1.0, energy: 0.06 },
        { time: 2.0, energy: 0.08 },
        { time: 3.0, energy: 0.95 }, // Sharp acoustic transient (e.g. explosion or crash)
        { time: 4.0, energy: 0.1 },
        { time: 5.0, energy: 0.07 },
        { time: 8.0, energy: 0.88 }, // Second spike
        { time: 9.0, energy: 0.05 },
      ];

      const spikes = detectAudioEventSpikes(timeline, 10.0, 0.5);
      expect(spikes.length).toBe(2);
      expect(spikes[0].time).toBe(3.0);
      expect(spikes[0].peakScore).toBeGreaterThanOrEqual(70);
      expect(spikes[0].type).toBe('blast_or_impact');
      expect(spikes[1].time).toBe(8.0);
    });
  });

  describe('GTA 6 Event Classification & Explainable Scoring', () => {
    it('classifies explosions with high optical flash and loud acoustic energy', () => {
      const result = classifyGameplayEvent({
        motionScore: 70,
        audioScore: 92,
        visualScore: 88,
        duration: 32,
      });

      expect(result.category.id).toBe(GTA_EVENT_CATEGORIES.EXPLOSION.id);
      expect(result.confidence).toBeGreaterThanOrEqual(85);
      expect(result.reason).toContain('explosion');
    });

    it('classifies car crash from sudden deceleration and impact acoustics', () => {
      const result = classifyGameplayEvent({
        motionScore: 60,
        audioScore: 78,
        visualScore: 65,
        duration: 30,
      });

      expect(result.category.id).toBe(GTA_EVENT_CATEGORIES.CAR_CRASH.id);
      expect(result.reason).toContain('collision');
    });

    it('classifies high-speed police chases from sustained motion and scene cuts', () => {
      const result = classifyGameplayEvent({
        motionScore: 85,
        audioScore: 65,
        visualScore: 60,
        duration: 35,
        sceneCutCount: 3,
      });

      expect(result.category.id).toBe(GTA_EVENT_CATEGORIES.POLICE_CHASE.id);
      expect(result.reason).toContain('pursuit');
    });

    it('classifies vehicle stunts from airborne trajectory motion', () => {
      const result = classifyGameplayEvent({
        motionScore: 82,
        audioScore: 40,
        visualScore: 60,
        duration: 30,
        sceneCutCount: 0,
      });

      expect(result.category.id).toBe(GTA_EVENT_CATEGORIES.VEHICLE_STUNT.id);
      expect(result.reason).toContain('stunt');
    });

    it('classifies gunfights from rhythmic audio bursts', () => {
      const result = classifyGameplayEvent({
        motionScore: 48,
        audioScore: 72,
        visualScore: 45,
        duration: 35,
      });

      expect(result.category.id).toBe(GTA_EVENT_CATEGORIES.GUNFIGHT.id);
      expect(result.reason).toContain('combat');
    });
  });

  describe('Action Tracking 9:16 Crop Geometry', () => {
    it('calculates 9:16 portrait crop centered around moving vehicle target', () => {
      const crop = calculateActionFramingCrop({
        sourceWidth: 1920,
        sourceHeight: 1080,
        targetCropXPct: 75, // Action is on the right side of screen
        protectMinimap: false,
      });

      expect(crop.cropW).toBe(608); // 1080 * 9/16 = 607.5 -> 608
      expect(crop.cropH).toBe(1080);
      expect(crop.cropX).toBeGreaterThan(1000); // Shifted right
      expect(crop.cropXPct).toBeGreaterThan(70);
    });

    it('protects GTA minimap on the lower left when action is far left', () => {
      const cropWithoutProtection = calculateActionFramingCrop({
        sourceWidth: 1920,
        sourceHeight: 1080,
        targetCropXPct: 5,
        protectMinimap: false,
      });

      const cropWithProtection = calculateActionFramingCrop({
        sourceWidth: 1920,
        sourceHeight: 1080,
        targetCropXPct: 5,
        protectMinimap: true,
      });

      expect(cropWithProtection.cropX).toBeGreaterThanOrEqual(120);
      expect(cropWithProtection.cropX).toBeGreaterThanOrEqual(
        cropWithoutProtection.cropX
      );
    });
  });

  describe('End-to-End Gameplay Clip Discovery (discoverClips)', () => {
    it('discovers and ranks GTA clips using gaming-gta content type', () => {
      const videoDuration = 180; // 3 minute gameplay video
      const audioAnalysis = {
        avgEnergy: 0.1,
        timeline: [
          { time: 10, rms: 0.05 },
          { time: 25, rms: 0.95 }, // Peak 1 at 25s (explosion)
          { time: 40, rms: 0.08 },
          { time: 75, rms: 0.88 }, // Peak 2 at 75s (crash)
          { time: 90, rms: 0.06 },
          { time: 130, rms: 0.9 }, // Peak 3 at 130s (gunfight)
          { time: 160, rms: 0.05 },
        ],
      };
      const sceneCuts = [
        { time: 5.0, score: 30 },
        { time: 20.0, score: 45 },
        { time: 55.0, score: 35 },
        { time: 70.0, score: 50 },
        { time: 120.0, score: 40 },
      ];

      const clips = discoverClips({
        videoDuration,
        audioAnalysis,
        sceneCuts,
        settings: {
          contentType: 'gaming-gta',
          minDuration: 30,
          maxDuration: 45,
          clipCount: 3,
        },
        videoTitle: 'GTA 6 Unbelievable Police Escape and Car Pileup',
      });

      expect(clips.length).toBeGreaterThanOrEqual(2);
      expect(clips[0].category).toBeDefined();
      expect(clips[0].score).toBeGreaterThanOrEqual(60);
      expect(clips[0].duration).toBeGreaterThanOrEqual(30);
      expect(clips[0].duration).toBeLessThanOrEqual(45);
      expect(clips[0].viralHookText).toContain('UNREAL');
      expect(clips[0].hashtags).toContain('#GTA6');
    });
  });

  describe('FFmpeg Rendering Arguments for Gameplay Framing', () => {
    it('generates correct FFmpeg crop arguments for action-tracking mode', () => {
      const args = buildFFmpegArgs({
        inputPath: 'test_input.mp4',
        outputPath: 'output_short.mp4',
        startTime: 15,
        duration: 35,
        aspectRatio: '9:16',
        framingMode: 'action-tracking',
        cropX: 65, // Crop centered at 65% horizontal
      });

      expect(args).toContain('-ss');
      expect(args).toContain('15');
      expect(args).toContain('-t');
      expect(args).toContain('35');

      const vfIndex = args.indexOf('-vf');
      const fcIndex = args.indexOf('-filter_complex');
      const filterArg = vfIndex !== -1 ? args[vfIndex + 1] : args[fcIndex + 1];
      expect(filterArg).toContain('crop=');
      expect(filterArg).toContain('scale=1080:1920');
      expect(filterArg).toContain('65');
    });

    it('generates correct blurred background filtergraph for gameplay-blur-bg', () => {
      const args = buildFFmpegArgs({
        inputPath: 'test_input.mp4',
        outputPath: 'output_blur.mp4',
        startTime: 0,
        duration: 30,
        aspectRatio: '9:16',
        framingMode: 'blurred-bg',
      });

      const vfIndex = args.indexOf('-vf');
      const fcIndex = args.indexOf('-filter_complex');
      const filterComplex =
        vfIndex !== -1 ? args[vfIndex + 1] : args[fcIndex + 1];
      expect(filterComplex).toContain('boxblur=20:5');
      expect(filterComplex).toContain('scale=1080:1920');
      expect(filterComplex).toContain('overlay=(W-w)/2:(H-h)/2');
    });

    it('generates pristine 4K 2160x3840 vertical master arguments when quality=4k', () => {
      const args = buildFFmpegArgs({
        inputPath: 'test_4k.mp4',
        outputPath: 'output_4k.mp4',
        startTime: 0,
        duration: 25,
        aspectRatio: '9:16',
        cropX: 50,
        quality: '4k',
      });

      const vfIndex = args.indexOf('-vf');
      const filterArg = args[vfIndex + 1];
      expect(filterArg).toContain('scale=2160:3840');
      expect(args).toContain('-maxrate');
      expect(args).toContain('65M');
      expect(args).toContain('-crf');
      expect(args).toContain('15');
    });
  });
});
