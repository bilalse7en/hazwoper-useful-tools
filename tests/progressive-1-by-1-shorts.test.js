import { describe, it, expect, beforeEach } from 'vitest';
import {
  createJob,
  getJob,
  updateJob,
  loadAllJobs,
  saveAllJobs,
} from '@/lib/video-shorts/job-queue-service';

describe('Progressive 1-by-1 Shorts Generation & Card Progress Lifecycle', () => {
  it('1. Initializes discovered clips with Short #1 active and remaining shorts queued', () => {
    const jobId = 'test_progressive_init';
    const mockClips = [
      { id: 'clip-1', index: 1, duration: 30, title: 'Hook 1' },
      { id: 'clip-2', index: 2, duration: 32, title: 'Hook 2' },
      { id: 'clip-3', index: 3, duration: 28, title: 'Hook 3' },
    ];

    const initialClips = mockClips.map((c, idx) => ({
      ...c,
      isRendered: false,
      renderStatus: idx === 0 ? 'rendering' : 'queued',
      renderProgress: idx === 0 ? 15 : 0,
      renderStage:
        idx === 0
          ? 'Preparing 9:16 vertical crop...'
          : `Queued (#${idx + 1} in line)`,
    }));

    const job = createJob({
      sourceMediaId: 'media_123',
      fileName: 'recitation.mp4',
    });

    updateJob(job.id, {
      output: {
        clips: initialClips,
      },
    });

    const retrieved = getJob(job.id);
    expect(retrieved.output.clips).toHaveLength(3);
    // Short #1 must be rendering
    expect(retrieved.output.clips[0].renderStatus).toBe('rendering');
    expect(retrieved.output.clips[0].renderProgress).toBe(15);
    // Short #2 and #3 must be queued
    expect(retrieved.output.clips[1].renderStatus).toBe('queued');
    expect(retrieved.output.clips[1].renderProgress).toBe(0);
    expect(retrieved.output.clips[2].renderStatus).toBe('queued');
  });

  it('2. Transitions Short #1 to completed while Short #2 transitions to rendering 1-by-1', () => {
    const jobId = 'test_progressive_step';
    const mockClips = [
      { id: 'clip-1', index: 1, duration: 30, title: 'Hook 1' },
      { id: 'clip-2', index: 2, duration: 32, title: 'Hook 2' },
      { id: 'clip-3', index: 3, duration: 28, title: 'Hook 3' },
    ];

    // Simulate Short #1 completing
    const renderedShorts = [
      {
        ...mockClips[0],
        videoUrl: '/media-hub/short_1.mp4',
        downloadUrl: '/media-hub/short_1.mp4',
        isRendered: true,
        renderStatus: 'completed',
        renderProgress: 100,
        renderStage: '✓ Ready to play',
      },
    ];

    const stageOutputs = mockClips.map((c, idx) => {
      if (idx === 0) return renderedShorts[0];
      if (idx === 1) {
        return {
          ...c,
          isRendered: false,
          renderStatus: 'rendering',
          renderProgress: 25,
          renderStage: 'Cutting 9:16 vertical crop...',
        };
      }
      return {
        ...c,
        isRendered: false,
        renderStatus: 'queued',
        renderProgress: 0,
        renderStage: `Queued (#${idx + 1} in line)`,
      };
    });

    const job = createJob({
      sourceMediaId: 'media_456',
      fileName: 'gameplay.mp4',
    });

    updateJob(job.id, {
      output: {
        clips: stageOutputs,
      },
    });

    const retrieved = getJob(job.id);
    // Short #1 is finished and playable
    expect(retrieved.output.clips[0].renderStatus).toBe('completed');
    expect(retrieved.output.clips[0].renderProgress).toBe(100);
    expect(retrieved.output.clips[0].isRendered).toBe(true);
    expect(retrieved.output.clips[0].videoUrl).toBe('/media-hub/short_1.mp4');

    // Short #2 is now actively rendering with its own progress
    expect(retrieved.output.clips[1].renderStatus).toBe('rendering');
    expect(retrieved.output.clips[1].renderProgress).toBe(25);
    expect(retrieved.output.clips[1].isRendered).toBe(false);

    // Short #3 is still queued
    expect(retrieved.output.clips[2].renderStatus).toBe('queued');
  });
});
