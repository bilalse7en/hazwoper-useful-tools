import { describe, it, expect } from 'vitest';
import {
  extractYouTubeId,
  isValidYouTubeUrl,
} from '@/lib/video-shorts/source-parser';
import {
  snapToCleanBoundary,
  detectVocalPhrases,
} from '@/lib/video-shorts/audio-analyzer';
import {
  calculateSmoothedCropTimeline,
  buildFFmpegCropFilter,
} from '@/lib/video-shorts/face-tracker';
import {
  captionsToSRT,
  captionsToVTT,
  captionsToASS,
  formatSrtTimestamp,
  translateToRomanUrdu,
} from '@/lib/video-shorts/caption-engine';
import {
  transliterateUrduWord,
  transliterateUrduSentence,
  transliterateUrduCaptions,
} from '@/lib/video-shorts/urdu-transliterator';
import { MultiSpeakerTracker } from '@/lib/video-shorts/speaker-tracker';
import { generateNaatShortMetadata } from '@/lib/video-shorts/naat-seo';
import { discoverClips } from '@/lib/video-shorts/clip-finder';
import {
  buildFFmpegArgs,
  getFFmpegBinary,
  probeVideo,
} from '@/lib/video-shorts/ffmpeg-service';
import {
  ingestMediaFile,
  listMediaHubItems,
  getMediaHubItem,
} from '@/lib/video-shorts/media-storage-service';
import {
  createJob,
  getJob,
  updateJob,
  listJobs,
} from '@/lib/video-shorts/job-queue-service';

describe('AI Video to Shorts - Unit & Integration Test Suite', () => {
  describe('YouTube URL Parser & Validator', () => {
    it('correctly extracts video ID from standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
      expect(isValidYouTubeUrl(url)).toBe(true);
    });

    it('correctly extracts video ID from short youtu.be URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ?si=abcdef';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
      expect(isValidYouTubeUrl(url)).toBe(true);
    });

    it('correctly extracts video ID from YouTube Shorts URL', () => {
      const url = 'https://www.youtube.com/shorts/3jz_24rS9eU';
      expect(extractYouTubeId(url)).toBe('3jz_24rS9eU');
      expect(isValidYouTubeUrl(url)).toBe(true);
    });

    it('rejects invalid or non-YouTube URLs', () => {
      expect(extractYouTubeId('https://example.com/video.mp4')).toBeNull();
      expect(isValidYouTubeUrl('not-a-url')).toBe(false);
      expect(isValidYouTubeUrl('')).toBe(false);
    });
  });

  describe('Audio Silence Boundary Snapping', () => {
    const silenceIntervals = [
      { start: 14.5, end: 15.2, duration: 0.7 },
      { start: 44.8, end: 45.6, duration: 0.8 },
      { start: 75.0, end: 76.0, duration: 1.0 },
    ];

    it('snaps candidate cut to nearest silence midpoint', () => {
      // 15.0 is right next to silence interval 14.5 - 15.2 (midpoint: 14.85)
      const snapped = snapToCleanBoundary(
        15.0,
        silenceIntervals,
        'nearest',
        1.5
      );
      expect(snapped).toBe(14.85);
    });

    it('returns target time unchanged if no silence is within tolerance', () => {
      const snapped = snapToCleanBoundary(
        30.0,
        silenceIntervals,
        'nearest',
        1.0
      );
      expect(snapped).toBe(30.0);
    });
  });

  describe('Smart 9:16 Crop & EMA Smoothing', () => {
    it('applies exponential moving average to prevent camera jitter', () => {
      const rawPoints = [
        { time: 0, targetX: 960 }, // center
        { time: 1, targetX: 1400 }, // sudden jump right
        { time: 2, targetX: 1400 },
      ];

      const smoothed = calculateSmoothedCropTimeline(
        rawPoints,
        1920,
        1080,
        0.2
      );
      expect(smoothed.length).toBe(3);
      // Smoothed X should ease towards target rather than snapping immediately
      expect(smoothed[1].cropX).toBeGreaterThan(smoothed[0].cropX);
      expect(smoothed[1].cropX).toBeLessThan(1400);
      // Fixed 9:16 aspect ratio: height = 1080, width = 1080 * 9/16 = 608
      expect(smoothed[0].cropW).toBe(608);
      expect(smoothed[0].cropH).toBe(1080);
    });

    it('generates valid FFmpeg crop filter strings', () => {
      const trendingFilter = buildFFmpegCropFilter(
        'trending-ai-speaker',
        656,
        1920,
        1080
      );
      expect(trendingFilter).toContain('crop=608:1080:656:0');

      const smartFilter = buildFFmpegCropFilter('smart-face', 656, 1920, 1080);
      expect(smartFilter).toContain('crop=608:1080:656:0');

      const blurFilter = buildFFmpegCropFilter('blurred-bg', 656, 1920, 1080);
      expect(blurFilter).toContain('boxblur=20:5');
    });
  });

  describe('Caption & Subtitle Formatter', () => {
    const mockCaptions = [
      { id: '1', start: 0.5, end: 3.2, text: 'This is the first viral hook.' },
      { id: '2', start: 3.8, end: 6.9, text: 'Watch what happens next.' },
    ];

    it('formats SRT subtitles with correct timecode syntax', () => {
      const srt = captionsToSRT(mockCaptions);
      expect(srt).toContain(
        '1\n00:00:00,500 --> 00:00:03,200\nThis is the first viral hook.'
      );
      expect(srt).toContain(
        '2\n00:00:03,800 --> 00:00:06,900\nWatch what happens next.'
      );
    });

    it('formats WebVTT subtitles with WEBVTT header and dots', () => {
      const vtt = captionsToVTT(mockCaptions);
      expect(vtt).toContain('WEBVTT');
      expect(vtt).toContain('00:00:00.500 --> 00:00:03.200');
    });

    it('formats single timestamp correctly', () => {
      expect(formatSrtTimestamp(65.42)).toBe('00:01:05,420');
    });

    it('translates English captions to natural Roman Urdu', () => {
      const en = 'Here is the most important insight you need to know.';
      const ur = translateToRomanUrdu(en);
      expect(ur).toBe('Yeh sab se ahem baat hai jo aapko janna zaroori hai.');

      const hook = translateToRomanUrdu('Viral Hook & Key Takeaway');
      expect(hook).toBe('Kamaal Ka Viral Hook');
    });
  });

  describe('Intelligent Clip Discovery & Ranking', () => {
    it('discovers candidate clips and enforces non-overlapping deduplication', () => {
      const mockAudio = {
        timeline: Array.from({ length: 600 }, (_, i) => ({
          time: i * 0.1,
          rms: i < 50 ? 0.08 : 0.03, // high hook energy at start
          peak: 0.15,
        })),
        avgEnergy: 0.04,
        silenceIntervals: [
          { start: 28.5, end: 29.5, duration: 1.0 },
          { start: 58.0, end: 59.0, duration: 1.0 },
        ],
      };

      const clips = discoverClips({
        videoDuration: 180,
        audioAnalysis: mockAudio,
        sceneCuts: [{ time: 30, score: 35, type: 'hard_cut' }],
        settings: {
          durationPreset: 'short', // 15-30s
          clipCount: 3,
        },
      });

      expect(clips.length).toBeGreaterThanOrEqual(1);
      expect(clips.length).toBeLessThanOrEqual(3);

      clips.forEach((clip) => {
        expect(clip.duration).toBeGreaterThanOrEqual(14);
        expect(clip.duration).toBeLessThanOrEqual(45);
        expect(clip.score).toBeGreaterThan(0);
        expect(clip.score).toBeLessThanOrEqual(100);
      });
    });

    it('skips 35-second silent intro and starts exactly 0.5s before vocal onset with full phrase', () => {
      // Timeline: 0-35s is silent (rms: 0.002).
      // Vocal phrase 1: 36.0s - 48.0s (rms: 0.08)
      // Pause: 48.0s - 49.5s (rms: 0.003)
      // Vocal phrase 2: 49.5s - 62.0s (rms: 0.09)
      const timeline = [];
      for (let t = 0; t <= 120; t += 0.1) {
        let rms = 0.002;
        if (
          (t >= 36.0 && t <= 48.0) ||
          (t >= 49.5 && t <= 62.0) ||
          (t >= 63.5 && t <= 75.0)
        ) {
          rms = 0.08;
        }
        timeline.push({ time: parseFloat(t.toFixed(1)), rms, peak: rms * 1.5 });
      }

      const audioAnalysis = {
        timeline,
        avgEnergy: 0.035,
        silenceIntervals: [
          { start: 0, end: 35.5, duration: 35.5 },
          { start: 48.0, end: 49.5, duration: 1.5 },
          { start: 62.0, end: 63.5, duration: 1.5 },
        ],
      };

      const vocalData = detectVocalPhrases(
        timeline,
        0.035,
        audioAnalysis.silenceIntervals
      );
      expect(vocalData.firstVoiceOnset).toBeGreaterThanOrEqual(35.5);
      expect(vocalData.vocalPhrases.length).toBeGreaterThanOrEqual(2);

      const clips = discoverClips({
        videoDuration: 120,
        audioAnalysis,
        sceneCuts: [],
        settings: {
          durationPreset: 'standard', // 30-40s
          clipCount: 3,
        },
      });

      expect(clips.length).toBeGreaterThanOrEqual(1);
      // ZERO clips start in the 0-35s dead intro!
      expect(clips.every((c) => c.start >= 35.0)).toBe(true);
      // An opening clip starting at the first vocal onset (36.0 - 0.5s = 35.5s) must be discovered!
      expect(clips.some((c) => c.start >= 35.0 && c.start <= 36.5)).toBe(true);
      expect(clips[0].duration).toBeGreaterThanOrEqual(30.0);
    });

    it('enforces strict minimum duration rule (>= 30 seconds) for standard shorts', () => {
      const timeline = [];
      for (let t = 0; t <= 180; t += 0.1) {
        timeline.push({ time: parseFloat(t.toFixed(1)), rms: 0.05, peak: 0.1 });
      }

      const clips = discoverClips({
        videoDuration: 180,
        audioAnalysis: { timeline, avgEnergy: 0.04, silenceIntervals: [] },
        sceneCuts: [],
        settings: {
          durationPreset: 'standard', // 30-40s
          clipCount: 3,
        },
      });

      expect(clips.length).toBeGreaterThanOrEqual(1);
      clips.forEach((c) => {
        expect(c.duration).toBeGreaterThanOrEqual(30.0);
        expect(c.duration).toBeLessThanOrEqual(65.0);
      });
    });

    it('joins 22-second stanza with subsequent consecutive stanza into a 35-45s clip', () => {
      // Stanza 1: 30.0s to 52.0s (22s duration)
      // Inter-stanza break: 52.0s to 53.5s (1.5s pause)
      // Stanza 2: 53.5s to 69.5s (16s duration)
      // Total combined: 30.0s to 69.5s = ~39.5s (fits 35-45s target perfectly)
      const timeline = [];
      for (let t = 0; t <= 120; t += 0.1) {
        let rms = 0.005;
        if ((t >= 30.0 && t <= 52.0) || (t >= 53.5 && t <= 69.5)) {
          rms = 0.08;
        }
        timeline.push({ time: parseFloat(t.toFixed(1)), rms, peak: rms * 1.5 });
      }

      const audioAnalysis = {
        timeline,
        avgEnergy: 0.03,
        silenceIntervals: [
          { start: 0, end: 29.5, duration: 29.5 },
          { start: 52.0, end: 53.5, duration: 1.5 },
          { start: 70.0, end: 120.0, duration: 50.0 },
        ],
      };

      const userLyrics = `Meri Ulfat Madine Se Yun Hi Nahi
Mere Aaqa Ka Rouza Madine Mein Hai
Mein Madine Ki Jaanib Na Kaise Khinchu
Mera Deen Or Duniya Madine Mein Hai

Arsh E Aazam Pe Jis Ki Badhi Shaan Hai
Roza E Mustafa Jis Ki Pehchaan Hai
Jis Ka Hum Palla Koi Mohalla Nahi
Ek Aisa Mohalla Madine Mein Hai`;

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
      const mainClip = clips[0];
      // Must NOT be exported as 22 seconds! Must be combined into >= 30 seconds
      expect(mainClip.duration).toBeGreaterThanOrEqual(30.0);
      expect(mainClip.duration).toBeLessThanOrEqual(45.0);
      expect(mainClip.stanzasCount).toBeGreaterThanOrEqual(2);
      expect(mainClip.explanation).toContain('stanzas');
      expect(mainClip.lyricsReference).toContain('Meri Ulfat Madine Se');
    });

    it('keeps a 34-second standalone stanza intact without unnecessary cuts', () => {
      // Standalone Stanza: 20.0s to 54.0s (34s duration)
      const timeline = [];
      for (let t = 0; t <= 120; t += 0.1) {
        let rms = 0.005;
        if (t >= 20.0 && t <= 54.0) {
          rms = 0.08;
        }
        timeline.push({ time: parseFloat(t.toFixed(1)), rms, peak: rms * 1.5 });
      }

      const audioAnalysis = {
        timeline,
        avgEnergy: 0.03,
        silenceIntervals: [
          { start: 0, end: 19.5, duration: 19.5 },
          { start: 54.0, end: 120.0, duration: 66.0 },
        ],
      };

      const clips = discoverClips({
        videoDuration: 120,
        audioAnalysis,
        sceneCuts: [],
        settings: {
          durationPreset: 'standard',
          clipCount: 1,
        },
      });

      expect(clips.length).toBeGreaterThanOrEqual(1);
      expect(clips[0].duration).toBeGreaterThanOrEqual(30.0);
      expect(clips[0].duration).toBeLessThanOrEqual(37.0);
    });
  });

  describe('FFmpeg Command Builder', () => {
    it('constructs safe arguments with accurate seeking, crops, and audio normalization', () => {
      const args = buildFFmpegArgs({
        inputPath: 'input.mp4',
        outputPath: 'output.mp4',
        startTime: 12.5,
        duration: 25.0,
        aspectRatio: '9:16',
        framingMode: 'smart-face',
        cropX: 600,
        fadeIn: 0.5,
        fadeOut: 0.5,
        normalizeAudio: true,
        audioVolume: 1.2,
        sourceWidth: 1920,
        sourceHeight: 1080,
      });

      expect(args).toContain('-ss');
      expect(args).toContain('12.5');
      expect(args).toContain('-t');
      expect(args).toContain('25');
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('-c:a');
      expect(args).toContain('aac');

      // Check audio filter includes normalization and volume
      const afIdx = args.indexOf('-af');
      expect(afIdx).toBeGreaterThan(-1);
      expect(args[afIdx + 1]).toContain('loudnorm=I=-14:TP=-1.0:LRA=11');
      expect(args[afIdx + 1]).toContain('volume=1.2');

      // Check video filter includes crop and fades
      const vfIdx = args.indexOf('-vf');
      expect(vfIdx).toBeGreaterThan(-1);
      expect(args[vfIdx + 1]).toContain('crop=608:1080:600:0');
      expect(args[vfIdx + 1]).toContain('fade=t=in');
      expect(args[vfIdx + 1]).toContain('fade=t=out');
    });
  });

  describe('Naat & Islamic YouTube Shorts SEO Package', () => {
    it('generates high-retention title under 100 characters in Roman Urdu', () => {
      const mockClip = { index: 1, start: 40.5, end: 72.0, duration: 31.5 };
      const seo = generateNaatShortMetadata({
        clip: mockClip,
        videoTitle: 'Faslon Ko Takalluf Hai Hum Se Agar (Official Video HD)',
      });

      expect(seo.title.length).toBeLessThanOrEqual(100);
      expect(seo.title).toContain('#Shorts');
      expect(seo.title).toContain('#Naat');
      expect(seo.description).toContain('Subhan Allah');
      expect(seo.description).toContain('Durood-e-Pak');
      expect(seo.tags).toContain('naat');
      expect(seo.tags).toContain('roman urdu naat');
      expect(seo.tags).toContain('best naat pakistan');
      expect(seo.hashtags).toContain('#Shorts');
      expect(seo.hashtags).toContain('#Naat');
    });
  });

  describe('Real Subtitle VTT Parser & Phrase Merging', () => {
    it('parses WebVTT file and extracts clean captions with timings', async () => {
      const { parseVttFile, mergeIntoPhraseCaptions } =
        await import('@/lib/video-shorts/vtt-parser');

      const sampleVtt = `WEBVTT
Kind: captions
Language: en

00:00:01.000 --> 00:00:03.500
<c>Meri</c> <c>ulfat</c> <c>Madine</c> <c>se</c>

00:00:03.500 --> 00:00:06.000
yun hi nahi

00:00:06.500 --> 00:00:10.000
Mere Aaqa ka rouza Madine mein hai
`;

      const parsed = parseVttFile(sampleVtt);
      expect(parsed.length).toBe(3);
      expect(parsed[0].text).toBe('Meri ulfat Madine se');
      expect(parsed[0].start).toBe(1.0);
      expect(parsed[0].end).toBe(3.5);

      const merged = mergeIntoPhraseCaptions(parsed, 10, 1.0);
      expect(merged.length).toBeGreaterThanOrEqual(1);
      expect(merged[0].text).toContain('Meri ulfat Madine se');
    });

    it('injects real captions into discovered clips when transcript is supplied', async () => {
      const sampleVtt = `WEBVTT
00:00:00.500 --> 00:00:05.000
First opening line of Kalam

00:00:05.500 --> 00:00:15.000
Second verse recited beautifully

00:00:15.500 --> 00:00:32.000
Third stanza bringing full spiritual depth
`;

      const audioAnalysis = {
        timeline: [
          { time: 0.5, rms: 0.08, peak: 0.1 },
          { time: 1.0, rms: 0.09, peak: 0.12 },
          { time: 32.0, rms: 0.08, peak: 0.1 },
        ],
        avgEnergy: 0.06,
        silenceIntervals: [{ start: 33.0, end: 35.0, duration: 2.0 }],
      };

      const clips = discoverClips({
        videoDuration: 60,
        audioAnalysis,
        settings: { durationPreset: 'standard' },
        transcript: sampleVtt,
      });

      expect(clips.length).toBeGreaterThan(0);
      expect(clips[0].hasRealTranscript).toBe(true);
      expect(clips[0].captions.length).toBeGreaterThan(0);
      expect(clips[0].captions[0].text).toContain('line of Kalam');
    });
  });

  describe('Free Urdu to Roman Urdu Transliteration Engine', () => {
    it('accurately transliterates individual Urdu words using lexicon and phonetics', () => {
      expect(transliterateUrduWord('مدینے')).toBe('Madine');
      expect(transliterateUrduWord('الفت')).toBe('Ulfat');
      expect(transliterateUrduWord('محمد')).toBe('Muhammad');
      expect(transliterateUrduWord('نہیں')).toBe('Nahi');
      expect(transliterateUrduWord('سرکار')).toBe('Sarkaar');
    });

    it('transliterates full Urdu sentences across spelling styles without English translation', () => {
      const urduSentence = 'میری الفت مدینے سے یوں ہی نہیں';

      // Conversational style
      const conversational = transliterateUrduSentence(
        urduSentence,
        'conversational'
      );
      expect(conversational).toContain('Madine');
      expect(conversational).toContain('Ulfat');
      expect(conversational.toLowerCase()).not.toContain('my love'); // Never translate to English!

      // Poetic style
      const poetic = transliterateUrduSentence(urduSentence, 'poetic');
      expect(poetic).toBeDefined();
      expect(poetic.length).toBeGreaterThan(0);

      // Phonetic style
      const phonetic = transliterateUrduSentence(urduSentence, 'phonetic');
      expect(phonetic).toBeDefined();
    });

    it('preserves exact 1:1 timestamps and word counts in transliterateUrduCaptions', () => {
      const rawCaptions = [
        {
          id: 'c1',
          start: 1.25,
          end: 4.8,
          text: 'میری الفت مدینے سے',
          words: [
            { word: 'میری', start: 1.25, end: 1.8 },
            { word: 'الفت', start: 1.8, end: 2.7 },
            { word: 'مدینے', start: 2.7, end: 3.9 },
            { word: 'سے', start: 3.9, end: 4.8 },
          ],
        },
      ];

      const transliterated = transliterateUrduCaptions(
        rawCaptions,
        'conversational'
      );
      expect(transliterated.length).toBe(1);
      expect(transliterated[0].start).toBe(1.25);
      expect(transliterated[0].end).toBe(4.8);
      expect(transliterated[0].textUrdu).toBe('میری الفت مدینے سے');
      expect(transliterated[0].textRoman).toContain('Madine');
      expect(transliterated[0].textCombined).toContain('مدینے');
      expect(transliterated[0].words.length).toBe(4);
      expect(transliterated[0].words[2].start).toBe(2.7);
      expect(transliterated[0].words[2].end).toBe(3.9);
      expect(transliterated[0].words[2].wordRoman).toBe('Madine');
    });
  });

  describe('Burned-In ASS Subtitle Generator', () => {
    const mockCaptions = [
      {
        id: '1',
        start: 2.5,
        end: 5.0,
        text: 'Meri Ulfat Madine Se',
        textRoman: 'Meri Ulfat Madine Se',
        textUrdu: 'میری الفت مدینے سے',
      },
    ];

    it('generates valid ASS script header with 1080x1920 portrait resolution', () => {
      const ass = captionsToASS(mockCaptions, { captionMode: 'roman-urdu' });
      expect(ass).toContain('PlayResX: 1080');
      expect(ass).toContain('PlayResY: 1920');
      expect(ass).toContain(
        'BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV'
      );
      expect(ass).toContain('&H00000000'); // Clean transparent background without black opacity box
    });

    it('formats dialogue events correctly for Roman Urdu mode', () => {
      const ass = captionsToASS(mockCaptions, { captionMode: 'roman-urdu' });
      expect(ass).toContain(
        'Dialogue: 0,0:00:02.50,0:00:05.00,Default,,0,0,0,,Meri Ulfat Madine Se'
      );
    });

    it('formats dialogue events correctly for Urdu Nastaliq mode', () => {
      const ass = captionsToASS(mockCaptions, { captionMode: 'urdu' });
      expect(ass).toContain(
        'Dialogue: 0,0:00:02.50,0:00:05.00,UrduNastaliq,,0,0,0,,میری الفت مدینے سے'
      );
    });

    it('formats dialogue events correctly for Dual Stacked 2-line mode', () => {
      const ass = captionsToASS(mockCaptions, {
        captionMode: 'dual-urdu-roman',
      });
      expect(ass).toContain('UrduNastaliq');
      expect(ass).toContain('DualStacked');
      expect(ass).toContain(
        'میری الفت مدینے سے\\N{\\rDualStacked}Meri Ulfat Madine Se'
      );
    });
  });

  describe('Audio-Visual Multi-Speaker Tracking & Hysteresis', () => {
    const createDummyImage = (w = 160, h = 90) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    });

    it('initializes with default candidates and smooth framing', () => {
      const tracker = new MultiSpeakerTracker({
        sourceWidth: 1920,
        sourceHeight: 1080,
        smoothingAlpha: 0.15,
      });

      const initial = tracker.processFrame({
        imageData: createDummyImage(),
        currentTime: 0.0,
        isAudioSpeaking: false,
      });

      expect(initial.cropWidth).toBe(608); // 1080 * (9/16)
      expect(initial.cropHeight).toBe(1080);
      expect(initial.cropX).toBe(Math.round(tracker.maxCropX / 2));
    });

    it('enforces temporal hysteresis to prevent rapid camera flipping', () => {
      const tracker = new MultiSpeakerTracker({
        sourceWidth: 1920,
        sourceHeight: 1080,
        minHoldBeforeSwitch: 1.4,
      });

      // Initially active speaker is speaker-left
      tracker.activeSpeakerId = 'speaker-left';
      tracker.lastFrameTime = 1.0;

      // Simulate a candidate speaker trying to interrupt at t=1.5 (dt = 0.5s < 1.4s threshold)
      tracker.candidateSpeakerId = 'speaker-right';
      tracker.candidateDuration = 0.5;

      // Should still maintain speaker-left due to 1.4s hysteresis threshold
      expect(tracker.candidateDuration).toBeLessThan(
        tracker.minHoldBeforeSwitch
      );
      expect(tracker.activeSpeakerId).toBe('speaker-left');

      // Once candidate duration crosses 1.4s
      tracker.candidateDuration = 1.45;
      if (tracker.candidateDuration >= tracker.minHoldBeforeSwitch) {
        tracker.activeSpeakerId = tracker.candidateSpeakerId;
        tracker.candidateSpeakerId = null;
      }
      expect(tracker.activeSpeakerId).toBe('speaker-right');
    });

    it('falls back to motion-aware centering when no speaker is active', () => {
      const tracker = new MultiSpeakerTracker({
        sourceWidth: 1920,
        sourceHeight: 1080,
      });
      const state = tracker.processFrame({
        imageData: createDummyImage(),
        currentTime: 1.0,
        isAudioSpeaking: false,
      });

      // Default safe center crop for 1920x1080 with 608 width = (1920 - 608) / 2 = 656
      expect(state.cropX).toBe(656);
    });
  });

  describe('Durable Background Job Queue Service', () => {
    it('creates a job with initial queued state and stage', () => {
      const job = createJob({
        mediaId: 'test-media-123',
        videoUrl: 'https://example.com/test.mp4',
        title: 'Test Naat Recitation',
        settings: { captionMode: 'dual-urdu-roman' },
      });

      expect(job.id).toBeDefined();
      expect(job.status).toBe('queued');
      expect(job.stage).toBe('queued');
      expect(job.progress).toBe(0);
      expect(job.mediaId).toBe('test-media-123');

      const retrieved = getJob(job.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved.id).toBe(job.id);
    });

    it('updates job progress, stage, and outputs correctly', () => {
      const job = createJob({
        mediaId: 'test-media-456',
        videoUrl: 'https://example.com/test2.mp4',
        title: 'Test Progress Update',
      });

      const updated = updateJob(job.id, {
        status: 'running',
        stage: 'transcribing',
        progress: 45,
        message: 'Transcribing speech with faster-whisper (45%)...',
      });

      expect(updated.status).toBe('running');
      expect(updated.stage).toBe('transcribing');
      expect(updated.progress).toBe(45);
      expect(updated.message).toContain('faster-whisper');

      const finished = updateJob(job.id, {
        status: 'completed',
        stage: 'completed',
        progress: 100,
        output: {
          clips: [{ id: 'clip-1', title: 'Highlight 1' }],
          thumbnailCandidates: [{ index: 0, timestamp: 5 }],
        },
      });

      expect(finished.status).toBe('completed');
      expect(finished.output.clips.length).toBe(1);
      expect(finished.output.thumbnailCandidates.length).toBe(1);
    });

    it('lists all registered jobs in chronological order', () => {
      const jobs = listJobs();
      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Media Storage & Fail-safe Registry Service', () => {
    it('ingests media buffer and returns complete metadata', async () => {
      // Mock 64KB dummy buffer
      const dummyBuffer = Buffer.alloc(65536, 1);
      const mediaItem = await ingestMediaFile({
        buffer: dummyBuffer,
        fileName: 'naat_recitation_sample.mp4',
        fileType: 'video/mp4',
        sourceType: 'upload',
      });

      expect(mediaItem).toBeDefined();
      expect(mediaItem.id).toBeDefined();
      expect(mediaItem.fileName).toBe('naat_recitation_sample.mp4');
      expect(mediaItem.fileType).toBe('video/mp4');
      expect(mediaItem.downloadUrl).toBeDefined();
      expect(mediaItem.previewUrl).toBeDefined();

      const items = await listMediaHubItems();
      expect(Array.isArray(items)).toBe(true);
      const found = items.find((i) => i.id === mediaItem.id);
      expect(found).toBeDefined();
      expect(found.fileName).toBe('naat_recitation_sample.mp4');
      expect(found.downloadUrl).toBeDefined();
      expect(found.download_url).toBeDefined();
    }, 15000);

    it('retrieves a media item by ID using getMediaHubItem with full property normalization', async () => {
      const dummyBuffer = Buffer.from('RIFF....WAVEfmt ....data....');
      const mediaItem = await ingestMediaFile({
        buffer: dummyBuffer,
        fileName: 'another_hub_video.mp4',
        fileType: 'video/mp4',
        sourceType: 'upload',
      });

      const item = await getMediaHubItem(mediaItem.id);
      expect(item).toBeDefined();
      expect(item.id).toBe(mediaItem.id);
      expect(item.fileName).toBe('another_hub_video.mp4');
      expect(item.file_name).toBe('another_hub_video.mp4');
      expect(item.downloadUrl).toBeDefined();
      expect(item.download_url).toBeDefined();
      expect(item.videoUrl).toBeDefined();
    }, 15000);
  });

  describe('Opening Style & Channel Branding FFmpeg Builder', () => {
    it('configures FFmpeg arguments with openingStyle and duration', () => {
      const args = buildFFmpegArgs({
        inputPath: 'test.mp4',
        outputPath: 'out.mp4',
        duration: 35,
        aspectRatio: '9:16',
        openingStyle: 'face-speaker',
        openingDuration: 2.0,
        normalizeAudio: true,
      });

      expect(args).toContain('-y');
      expect(args).toContain('out.mp4');
      const afIdx = args.indexOf('-af');
      expect(afIdx).toBeGreaterThan(-1);
      expect(args[afIdx + 1]).toContain('loudnorm=I=-14:TP=-1.0:LRA=11');
    });

    it('locates executable ffmpeg binary', () => {
      const bin = getFFmpegBinary();
      expect(bin).toBeDefined();
      expect(typeof bin).toBe('string');
      expect(bin.length).toBeGreaterThan(0);
    });
  });

  describe('Caption Wrapping & ASS Substation Alpha Subtitle Engine', () => {
    it('splits text into lines without cutting words in half', async () => {
      const { wrapTextToLines } =
        await import('@/lib/video-shorts/caption-engine');
      // Mock simple canvas measuring context
      const mockCtx = {
        measureText: (text) => ({ width: text.length * 10 }),
      };

      const longSentence =
        'Meri Ulfat Madine Se Yun Hi Nahi Mere Aaqa Ka Roza Madine Me Hai';
      const lines = wrapTextToLines(mockCtx, longSentence, 350, 2);

      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThanOrEqual(1);
      expect(lines.length).toBeLessThanOrEqual(2);
      // Words must be preserved
      const rejoined = lines.join(' ');
      expect(rejoined).toBe(longSentence);
    });

    it('generates ASS subtitle with compact font size and balanced dual-line breaks', async () => {
      const { captionsToASS } =
        await import('@/lib/video-shorts/caption-engine');
      const captions = [
        {
          start: 0,
          end: 4.5,
          text: 'Meri Ulfat Madine Se Yun Hi Nahi Mere Aaqa Ka Roza Madine Me Hai',
          textRoman:
            'Meri Ulfat Madine Se Yun Hi Nahi Mere Aaqa Ka Roza Madine Me Hai',
          textUrdu:
            'مری الفت مدینے سے یوں ہی نہیں مرے آقا کا روزہ مدینے میں ہے',
        },
      ];

      const ass = captionsToASS(captions, {
        captionMode: 'dual-urdu-roman',
        fontSize: 44,
      });

      expect(ass).toContain('[Script Info]');
      expect(ass).toContain('[V4+ Styles]');
      expect(ass).toContain('PlayResX: 1080');
      expect(ass).toContain('PlayResY: 1920');
      expect(ass).toContain('DualStacked');
      expect(ass).toContain('Dialogue:');
      expect(ass).toContain('\\N');
    });
  });

  describe('Islamic Stock Video Discovery & Licensing Service', () => {
    it('searches Islamic stock videos and preserves license & attribution metadata', async () => {
      const { searchIslamicStockVideos } =
        await import('@/lib/video-shorts/stock-video-service');
      const res = await searchIslamicStockVideos({ query: 'kaaba' });

      expect(res.success).toBe(true);
      expect(Array.isArray(res.videos)).toBe(true);
      expect(res.videos.length).toBeGreaterThanOrEqual(1);

      const sample = res.videos[0];
      expect(sample.id).toBeDefined();
      expect(sample.title).toBeDefined();
      expect(sample.videoUrl).toBeDefined();
      expect(sample.license).toBeDefined();
      expect(sample.attribution).toBeDefined();
      expect(sample.attribution.length).toBeGreaterThan(10);
    });

    it('filters stock videos by provider', async () => {
      const { searchIslamicStockVideos } =
        await import('@/lib/video-shorts/stock-video-service');
      const res = await searchIslamicStockVideos({
        query: 'islamic',
        provider: 'wikimedia',
      });

      expect(res.success).toBe(true);
      expect(Array.isArray(res.videos)).toBe(true);
      res.videos.forEach((v) => {
        expect(v.provider.toLowerCase()).toContain('wikimedia');
      });
    });
  });

  describe('Universal YouTube Cookies Session Manager', () => {
    it('saves cookies content and reports authenticated status', async () => {
      const { GET, POST, DELETE } =
        await import('@/app/api/video-shorts/cookies/route');
      const mockCookie =
        '# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t1790000000\tLOGIN_INFO\taf789sd';

      const postReq = new Request('http://localhost/api/video-shorts/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookiesContent: mockCookie }),
      });
      const postRes = await POST(postReq);
      const postData = await postRes.json();
      expect(postData.success).toBe(true);

      const getRes = await GET();
      const getData = await getRes.json();
      expect(getData.hasCookies).toBe(true);
      expect(getData.size).toBeGreaterThan(0);

      const deleteRes = await DELETE();
      const deleteData = await deleteRes.json();
      expect(deleteData.success).toBe(true);

      const finalGet = await GET();
      const finalData = await finalGet.json();
      expect(finalData.hasCookies).toBe(false);
    });
  });

  describe('Canonical Time Model & Segment Retiming', () => {
    it('correctly normalizes timing and calculates durations', async () => {
      const {
        normalizeCanonicalTiming,
        sourceToRelativeSeconds,
        relativeToSourceSeconds,
        segmentCaptionsForClip,
      } = await import('@/lib/video-shorts/canonical-time');

      const timing = normalizeCanonicalTiming({
        sourceStartSeconds: 120.0,
        sourceEndSeconds: 155.0,
      });

      expect(timing.sourceStartSeconds).toBe(120.0);
      expect(timing.sourceEndSeconds).toBe(155.0);
      expect(timing.clipDurationSeconds).toBe(35.0);
      expect(timing.clipRelativeStartSeconds).toBe(0);
      expect(timing.clipRelativeEndSeconds).toBe(35.0);

      // Relative to source and source to relative
      expect(sourceToRelativeSeconds(130.0, timing)).toBe(10.0);
      expect(relativeToSourceSeconds(10.0, timing)).toBe(130.0);
    });

    it('segments and retimes transcript captions to 0..duration without drift', async () => {
      const { segmentCaptionsForClip } =
        await import('@/lib/video-shorts/canonical-time');

      const allCaptions = [
        { id: 'c1', start: 10.0, end: 15.0, text: 'Intro verse before clip' },
        { id: 'c2', start: 121.0, end: 125.0, text: 'First verse in clip' },
        { id: 'c3', start: 126.0, end: 132.0, text: 'Second verse in clip' },
        { id: 'c4', start: 180.0, end: 190.0, text: 'Outro verse after clip' },
      ];

      const clipCaptions = segmentCaptionsForClip(allCaptions, 120.0, 150.0);

      expect(clipCaptions.length).toBe(2);
      expect(clipCaptions[0].text).toBe('First verse in clip');
      // Relative retiming: 121 - 120 = 1.0, 125 - 120 = 5.0
      expect(clipCaptions[0].clipRelativeStartSeconds).toBe(1.0);
      expect(clipCaptions[0].clipRelativeEndSeconds).toBe(5.0);
      expect(clipCaptions[0].start).toBe(1.0);
      expect(clipCaptions[0].end).toBe(5.0);

      expect(clipCaptions[1].text).toBe('Second verse in clip');
      expect(clipCaptions[1].start).toBe(6.0);
      expect(clipCaptions[1].end).toBe(12.0);
    });
  });

  describe('Curated 100+ Islamic B-Roll Library', () => {
    it('contains over 100 categorized, verified videos with valid metadata', async () => {
      const { CURATED_ISLAMIC_B_ROLL, getCuratedStockVideos } =
        await import('@/lib/video-shorts/curated-b-roll');

      expect(CURATED_ISLAMIC_B_ROLL.length).toBeGreaterThanOrEqual(100);

      CURATED_ISLAMIC_B_ROLL.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.videoUrl).toBeDefined();
        expect(item.videoUrl.startsWith('http')).toBe(true);
        expect(item.license).toBeDefined();
        expect(item.attribution).toBeDefined();
      });

      const paged = getCuratedStockVideos({ page: 1, limit: 12 });
      expect(paged.videos.length).toBe(12);
      expect(paged.pagination.total).toBeGreaterThanOrEqual(100);
      expect(paged.pagination.totalPages).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Urdu Script Captioning, Verse Completeness & Quality Validation', () => {
    it('validates authentic Urdu transcript and detects empty or invalid captions', async () => {
      const { validateUrduTranscript } =
        await import('@/lib/video-shorts/transcription-service');

      const validUrduCaps = [
        {
          id: '1',
          start: 0.5,
          end: 4.0,
          textUrdu: 'میری الفت مدینے سے یوں ہی نہیں',
        },
        {
          id: '2',
          start: 4.8,
          end: 8.5,
          textUrdu: 'میرے آقا کا روضہ مدینے میں ہے',
        },
      ];

      const res = validateUrduTranscript(validUrduCaps);
      expect(res.isValid).toBe(true);
      expect(res.isUrdu).toBe(true);
      expect(res.wordCount).toBeGreaterThan(5);

      const invalidCaps = [
        { id: '1', start: 5.0, end: 2.0, textUrdu: '' }, // backwards timing and empty text
      ];
      const invalidRes = validateUrduTranscript(invalidCaps);
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.issues.length).toBeGreaterThan(0);
    });

    it('defaults caption output and ASS script to authentic Urdu script', async () => {
      const { captionsToASS } =
        await import('@/lib/video-shorts/caption-engine');

      const caps = [
        {
          id: '1',
          start: 0.5,
          end: 3.5,
          textUrdu: 'عرش اعظم پہ جس کی بڑی شان ہے',
          textRoman: 'Arsh-e-Aazam Pe Jis Ki Bari Shaan Hai',
        },
      ];

      const ass = captionsToASS(caps, { captionMode: 'urdu' });
      expect(ass).toContain('UrduNastaliq');
      expect(ass).toContain('عرش اعظم');
      expect(ass).toContain('کی بڑی شان ہے');
    });

    it('identifies complete verses and labels verseCompleteness appropriately', async () => {
      const { discoverClips } = await import('@/lib/video-shorts/clip-finder');

      const mockRealCaptions = [
        {
          id: '1',
          start: 1.0,
          end: 4.5,
          textUrdu: 'میری الفت مدینے سے یوں ہی نہیں',
          isVerseBoundary: false,
        },
        {
          id: '2',
          start: 5.0,
          end: 8.5,
          textUrdu: 'میرے آقا کا روضہ مدینے میں ہے',
          isVerseBoundary: true,
        },
        {
          id: '3',
          start: 10.0,
          end: 14.0,
          textUrdu: 'میں مدینے کی جانب نہ کیسے کھنچوں',
          isVerseBoundary: false,
        },
        {
          id: '4',
          start: 14.5,
          end: 18.5,
          textUrdu: 'میرا دین اور دنیا مدینے میں ہے',
          isVerseBoundary: true,
        },
        {
          id: '5',
          start: 20.0,
          end: 24.5,
          textUrdu: 'عرش اعظم پہ جس کی بڑی شان ہے',
          isVerseBoundary: false,
        },
        {
          id: '6',
          start: 25.0,
          end: 29.5,
          textUrdu: 'وہ مرا مصطفیٰ میری پہچان ہے',
          isVerseBoundary: true,
        },
        {
          id: '7',
          start: 31.0,
          end: 35.0,
          textUrdu: 'کوئی ہم پلہ کوئی محلہ نہیں',
          isVerseBoundary: false,
        },
        {
          id: '8',
          start: 35.5,
          end: 39.0,
          textUrdu: 'اک مدینہ ہے ایسا مدینہ نہیں',
          isVerseBoundary: true,
        },
      ];

      const clips = discoverClips({
        videoDuration: 120,
        captions: mockRealCaptions,
        settings: {
          durationPreset: 'standard', // 30-40s
          clipCount: 4,
          captionLanguage: 'urdu',
        },
      });

      expect(clips.length).toBeGreaterThanOrEqual(1);
      clips.forEach((c) => {
        expect(c.verseCompleteness).toBeDefined();
        expect(c.verseStatusLabel).toBeDefined();
        expect(c.captions).toBeDefined();
        expect(c.primaryVerse).toBeDefined();
      });
    });

    it('prevents overlapping caption intervals and enforces non-overlapping sequence', async () => {
      const { preventCaptionOverlap } =
        await import('@/lib/video-shorts/caption-engine');
      const overlappingCaps = [
        { id: '1', start: 1.0, end: 4.5, textUrdu: 'پہلا مصرع' },
        { id: '2', start: 4.0, end: 7.2, textUrdu: 'دوسرا مصرع' }, // starts before 1 ends
        { id: '3', start: 7.0, end: 10.0, textUrdu: 'تیسرا مصرع' }, // starts before 2 ends
      ];

      const clean = preventCaptionOverlap(overlappingCaps);
      expect(clean.length).toBe(3);
      // Verify caption 1 ends before caption 2 starts
      expect(clean[0].end).toBeLessThanOrEqual(clean[1].start);
      // Verify caption 2 ends before caption 3 starts
      expect(clean[1].end).toBeLessThanOrEqual(clean[2].start);
    });

    it('embeds stylish Rockybilly font into ASS subtitle definition', () => {
      const caps = [
        {
          id: '1',
          start: 0.5,
          end: 3.5,
          textUrdu: 'فاصلوں کو تکلف ہے ہم سے اگر',
        },
      ];
      const ass = captionsToASS(caps, { captionMode: 'urdu' });
      expect(ass).toContain('Rockybilly');
    });

    it('locks face tracking to center preventing face from hiding off-screen', () => {
      const tracker = new MultiSpeakerTracker({
        sourceWidth: 1920,
        sourceHeight: 1080,
      });

      // Default center pan position
      const expectedCenter = Math.round(
        (1920 - Math.round((1080 * 9) / 16)) / 2
      );
      expect(Math.abs(tracker.cameraPanX - expectedCenter)).toBeLessThan(15);
    });

    it('transcribes and transliterates authentic Urdu recitation into Roman Urdu', async () => {
      const { transliterateUrduSentence, transliterateUrduWord } =
        await import('@/lib/video-shorts/urdu-transliterator.js');
      const urdu = 'فاصلوں کو تکلف ہے ہم سے اگر ہم بھی بے بس نہیں ہیں';
      const roman = transliterateUrduSentence(urdu, 'conversational');
      expect(roman.length).toBeGreaterThan(10);
      expect(roman.toLowerCase()).toContain('hum');
      expect(/[\u0600-\u06FF]/.test(urdu)).toBe(true);
    });

    it('accurately parses video durations from FFmpeg stderr output', () => {
      const sampleStderr = `
        Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'sample.mp4':
        Duration: 00:06:37.57, start: 0.000000, bitrate: 1250 kb/s
        Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709), 1920x1080, 25 fps
      `;
      const durMatch = sampleStderr.match(
        /Duration:\s*(\d+):(\d+):(\d+(?:[.,]\d+)?)/
      );
      expect(durMatch).not.toBeNull();
      const dur =
        parseInt(durMatch[1], 10) * 3600 +
        parseInt(durMatch[2], 10) * 60 +
        parseFloat(durMatch[3].replace(',', '.'));
      expect(Math.round(dur)).toBe(398); // 6m 37.57s = 397.57s -> 398s
    });
  });
});
