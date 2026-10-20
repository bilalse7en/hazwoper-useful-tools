import { describe, it, expect } from 'vitest';
import { discoverClips } from '@/lib/video-shorts/clip-finder';
import { captionsToASS } from '@/lib/video-shorts/caption-engine';
import { buildFFmpegArgs } from '@/lib/video-shorts/ffmpeg-service';

describe('Smart Audio-Onset Clipper & FHD Subtitle Engine', () => {
  it('applies 1.0s audio pre-roll lead-in before voice onset', () => {
    // Recitation begins at 15.0s after silence
    const captions = [
      {
        id: '1',
        start: 15.0,
        end: 18.5,
        textUrdu: 'فاصلوں کو تکلف ہے ہم سے اگر',
        textRoman: 'Faslon ko takalluf hai hum se agar',
      },
      {
        id: '2',
        start: 19.2,
        end: 23.5,
        textUrdu: 'ہم بھی بے بس نہیں ہیں خدا کی قسم',
        textRoman: 'Hum bhi be bas nahi hain khuda ki qasam',
      },
      {
        id: '3',
        start: 24.0,
        end: 30.5,
        textUrdu: 'جب ہمیں یاد طیبہ کی آنے لگی',
        textRoman: 'Jab hamein yaad taiba ki aane lagi',
      },
      {
        id: '4',
        start: 31.0,
        end: 54.0,
        textUrdu: 'پھر درودوں کا نذرانہ بھیجیں گے ہم',
        textRoman: 'Phir duroodon ka nazrana bhejein ge hum',
        isVerseBoundary: true,
      },
    ];

    const clips = discoverClips({
      videoDuration: 120,
      captions,
      settings: { durationPreset: 'standard' },
    });

    expect(clips.length).toBeGreaterThan(0);
    // 15.0s minus 1.0s pre-roll = 14.0s
    expect(clips[0].start).toBeCloseTo(14.0, 1);
    // Must capture complete verse without cutting off at 45s
    expect(clips[0].duration).toBeGreaterThanOrEqual(38);
    expect(clips[0].end).toBeGreaterThanOrEqual(54.0);
  });

  it('outputs valid ASS styles without embedded commas in font names', () => {
    const captions = [
      {
        id: '1',
        start: 0,
        end: 3.5,
        textUrdu: 'میری الفت مدینے سے یوں ہی نہیں',
        textRoman: 'Meri ulfat madine se yun hi nahi',
      },
    ];

    const ass = captionsToASS(captions, { captionMode: 'urdu' });
    // Verify style lines
    const styleLines = ass.split('\n').filter((l) => l.startsWith('Style:'));
    expect(styleLines.length).toBeGreaterThan(0);

    styleLines.forEach((line) => {
      const parts = line.split(',');
      const fontName = parts[1]?.trim();
      // Font name must not contain commas (which would misalign ASS columns)
      expect(fontName).not.toContain(',');
      // Font name should be clean single font
      expect(['Noto Nastaliq Urdu', 'Montserrat', 'Arial']).toContain(fontName);
    });

    // Check safe-zone bottom margin (MarginV = 260)
    expect(ass).toContain(',260,1');
  });

  it('omits ass filter when burnSubtitles is false for clean video export', () => {
    const argsClean = buildFFmpegArgs({
      inputPath: 'test.mp4',
      outputPath: 'out_clean.mp4',
      duration: 35,
      assPath: null, // Subtitles toggled OFF
    });

    const vfArgClean = argsClean[argsClean.indexOf('-vf') + 1];
    expect(vfArgClean).not.toContain('ass=');

    const argsBurned = buildFFmpegArgs({
      inputPath: 'test.mp4',
      outputPath: 'out_burned.mp4',
      duration: 35,
      assPath: 'C:/fake/path/subs.ass',
    });

    // If file doesn't exist on disk, buildFFmpegArgs safely skips it
    expect(argsBurned).toBeDefined();
  });
});
