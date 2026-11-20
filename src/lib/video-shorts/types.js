/**
 * AI Video-to-Shorts Studio Type Definitions & Preset Configurations
 * 100% Free and Open-Source
 */

export const ASPECT_RATIOS = {
  PORTRAIT: {
    id: '9:16',
    name: 'Portrait (Shorts, Reels, TikTok)',
    width: 1080,
    height: 1920,
    aspect: 9 / 16,
    icon: 'Smartphone',
    recommendedFor: 'YouTube Shorts, Instagram Reels, TikTok',
  },
  LANDSCAPE: {
    id: '16:9',
    name: 'Landscape (Standard Video)',
    width: 1920,
    height: 1080,
    aspect: 16 / 9,
    icon: 'Laptop',
    recommendedFor: 'YouTube, LinkedIn, Desktop Web',
  },
  SQUARE: {
    id: '1:1',
    name: 'Square (Social Feeds)',
    width: 1080,
    height: 1080,
    aspect: 1,
    icon: 'Square',
    recommendedFor: 'Instagram Feeds, Facebook, X / Twitter',
  },
};

export const DURATION_PRESETS = [
  {
    id: 'standard',
    label: '30 - 40 seconds',
    min: 30,
    max: 40,
    target: 35,
    description: 'ALL USEFUL TOOLS High-Retention Standard (Recommended)',
  },
  {
    id: 'extended',
    label: '45 - 60 seconds',
    min: 45,
    max: 60,
    target: 52,
    description: 'Extended Short',
  },
  {
    id: 'custom',
    label: 'Custom (Min 30s)',
    min: 30,
    max: 90,
    target: 45,
    description: 'User Defined',
  },
];

export const CLIP_COUNT_PRESETS = [
  { count: 3, label: '3 Best Shorts' },
  { count: 4, label: '4 Best Shorts (Recommended)' },
  { count: 5, label: '5 Extended Shorts' },
];

export const FRAMING_MODES = {
  TRENDING_AI_SPEAKER: {
    id: 'trending-ai-speaker',
    name: 'Trending AI Speaker & Lip-Sync Tracking',
    badge: 'TRENDING',
    description:
      'Auto-detects face & vocal lip movement, keeping active speaker centered with dynamic punchy framing.',
  },
  ACTION_TRACKING: {
    id: 'action-tracking',
    name: 'Gameplay Action & Vehicle Tracking',
    badge: 'GTA AI',
    description:
      'Tracks moving vehicles, stunt trajectories, explosions, and gameplay subjects without requiring facecam.',
  },
  RHYTHM_FRAMING: {
    id: 'rhythm-framing',
    name: 'Dynamic Rhythm & Beat Framing',
    badge: 'MUSIC AI',
    description:
      'Dynamically scales and subtle-punches on beat drops and vocal climaxes for maximum music video vibe.',
  },
  SMART_FACE: {
    id: 'smart-face',
    name: 'Smooth Face Tracking',
    description:
      'Smoothly pans and centers the active speaker in 9:16 portrait.',
  },
  CENTER_CROP: {
    id: 'center-crop',
    name: 'Static Center Crop',
    description: 'Fixed center framing without panning.',
  },
  BLURRED_BG: {
    id: 'blurred-bg',
    name: 'Blurred Background Fill',
    description:
      'Full original video centered with an ambient blurred copy behind.',
  },
  GAMEPLAY_BLUR_BG: {
    id: 'gameplay-blur-bg',
    name: 'Gameplay Landscape with Blurred Ambient Fill',
    badge: 'NO CROP',
    description:
      'Full 16:9 gameplay field-of-view preserved with HUD visible, bordered by ambient blurred background.',
  },
  SPLIT_SCREEN: {
    id: 'split-screen',
    name: 'Stacked Split Screen',
    description: 'Top and bottom split layout ideal for 2 speakers or slides.',
  },
};

export const CAPTION_STYLES = [
  {
    id: 'beast-bold',
    name: 'Dynamic Viral Bold',
    fontFamily: 'Impact, sans-serif',
    textColor: '#FFDF00',
    highlightColor: '#00FF66',
    strokeColor: '#000000',
    strokeWidth: 4,
    bgColor: 'rgba(0, 0, 0, 0.65)',
    uppercase: true,
    animation: 'pop',
  },
  {
    id: 'clean-minimal',
    name: 'Clean Modern Minimal',
    fontFamily: 'Inter, sans-serif',
    textColor: '#FFFFFF',
    highlightColor: '#38BDF8',
    strokeColor: '#000000',
    strokeWidth: 2,
    bgColor: 'rgba(15, 23, 42, 0.75)',
    uppercase: false,
    animation: 'fade',
  },
  {
    id: 'karaoke-glow',
    name: 'Karaoke Word Glow',
    fontFamily: 'Orbitron, sans-serif',
    textColor: '#E2E8F0',
    highlightColor: '#A855F7',
    strokeColor: '#3B0764',
    strokeWidth: 3,
    bgColor: 'rgba(0, 0, 0, 0.8)',
    uppercase: true,
    animation: 'glow',
  },
  {
    id: 'subtle-sub',
    name: 'Classic Subtitle',
    fontFamily: 'sans-serif',
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    bgColor: 'transparent',
    uppercase: false,
    animation: 'none',
  },
];

export const CAPTION_LANGUAGES = [
  { id: 'urdu', label: 'Urdu Nastaliq (اردو نستعلیق)', badge: 'AUTHENTIC' },
  { id: 'roman-urdu', label: 'Roman Urdu (رومن اردو)', badge: 'TRENDING' },
  { id: 'en', label: 'English', badge: 'STANDARD' },
];

export const CAPTION_MODES = [
  {
    id: 'urdu',
    label: 'اردو خط نستعلیق (Urdu Script)',
    badge: 'RECOMMENDED',
    description:
      'Native Urdu script in elegant Nastaliq font (Default for Naats)',
  },
  {
    id: 'dual-urdu-roman',
    label: 'Dual Stacked (اردو + Roman)',
    badge: 'POPULAR',
    description: 'Two aligned lines without covering speaker face',
  },
  {
    id: 'roman-urdu',
    label: 'Roman Urdu (رومن اردو)',
    badge: 'LATIN',
    description: 'Clean Roman Urdu phonetic subtitles',
  },
  {
    id: 'english',
    label: 'English Viral Pop',
    badge: 'GTA AI',
    description: 'Dynamic word-by-word viral typography in Montserrat',
  },
  {
    id: 'english-clean',
    label: 'English Clean Minimal',
    badge: 'MINIMAL',
    description: 'Crisp minimal white captions with drop shadow',
  },
];

export const GAMING_CAPTION_MODES = [
  {
    id: 'english',
    label: 'English Viral Pop',
    badge: 'RECOMMENDED',
    description: 'Dynamic word-by-word viral typography in Montserrat',
  },
  {
    id: 'english-clean',
    label: 'English Clean Minimal',
    badge: 'MINIMAL',
    description: 'Crisp minimal captions with subtle drop shadow',
  },
  {
    id: 'off',
    label: 'Subtitles Off',
    badge: 'OFF',
    description: 'Clean gameplay export without any subtitles burned in',
  },
];

export const MUSIC_CAPTION_MODES = [
  {
    id: 'karaoke-glow',
    label: 'Karaoke Neon Glow (Active Word Glow)',
    badge: 'RECOMMENDED',
    description:
      'Word-by-word active glow with cyan-to-pink gradient for songs',
  },
  {
    id: 'kinetic-lyrics',
    label: 'Kinetic Pop Lyrics',
    badge: 'VIRAL',
    description:
      'Bouncing rhythm-synced typography synchronized to vocal hooks',
  },
  {
    id: 'minimal-lyrics',
    label: 'Minimalist Clean Lyrics',
    badge: 'CLEAN',
    description:
      'Elegant centered song subtitle with subtle ambient drop shadow',
  },
  {
    id: 'off',
    label: 'Subtitles Off (Pure Music)',
    badge: 'OFF',
    description: 'No text overlays — pure cinematic music short',
  },
];

export const QUALITY_PRESETS = [
  {
    id: '4k',
    label: '4K Ultra HD (2160x3840)',
    badge: '4K MASTER',
    description: 'Pristine 4K 60fps master rendering with 65Mbps bitrate',
    width: 2160,
    height: 3840,
  },
  {
    id: '1080p',
    label: 'Full HD 1080p (1080x1920)',
    badge: 'FHD',
    description: 'High-definition 1080x1920 vertical format for fast export',
    width: 1080,
    height: 1920,
  },
];

export const TRANSLITERATION_STYLES = [
  {
    id: 'conversational',
    label: 'Conversational',
    example: 'Khuda Ke Fazl Se Hum Par Hai Saya',
  },
  {
    id: 'poetic',
    label: 'Poetic / Diacritics',
    example: 'Khudā Ke Fazl Se Hum Par Hai Sāya',
  },
  {
    id: 'phonetic',
    label: 'Phonetic',
    example: 'Khuda Key Fazl Sey Hum Par Hai Saaya',
  },
];

export const CONTENT_TYPES = [
  {
    id: 'gaming-gta',
    name: 'GTA & Gaming Action',
    badge: '4K ACTION',
    icon: 'Gamepad2',
    color: 'purple',
    description:
      'Multimodal AI gameplay event detection (car chases, stunts, explosions, combat), vehicle tracking & bold English typography.',
  },
  {
    id: 'naat-recitation',
    name: 'Islamic Naat & Recitation',
    badge: 'SACRED VERSE',
    icon: 'Moon',
    color: 'emerald',
    description:
      'Preserves complete recitation stanzas, zero verse truncation, authentic Urdu Nastaliq & Islamic scenic B-Roll.',
  },
  {
    id: 'music-songs',
    name: 'Songs, Music & Viral Hooks',
    badge: 'VIRAL CHORUS',
    icon: 'Music',
    color: 'pink',
    description:
      'Beat-drop alignment, catchy chorus & hook detection, word-by-word karaoke glow subtitles & rhythm cuts.',
  },
  {
    id: 'podcast-interview',
    name: 'Podcast & Interview',
    badge: 'TALK',
    icon: 'Mic',
    color: 'blue',
    description:
      'Active speaker tracking, punchy questions & answers, conversational hook retention.',
  },
];

export const VISUAL_SOURCES = [
  {
    id: 'ai-choice',
    label: 'AI Choose Best Option',
    badge: 'DEFAULT',
    description:
      'Intelligently balances reciter face centering with relevant scenic B-roll transitions.',
  },
  {
    id: 'original-video',
    label: 'Use Original Video',
    badge: 'SPEAKER FOCUS',
    description:
      'Keeps original video footage with face strictly centered in 9:16 vertical portrait.',
  },
  {
    id: 'b-roll',
    label: 'Use Relevant B-roll',
    badge: 'SCENIC & MOSQUE',
    description:
      'Layers spiritual Islamic scenic B-roll (Kaaba, Madinah, Mosques) over original recitation audio.',
  },
];

export const OPENING_STYLES = [
  {
    id: 'face-speaker',
    name: 'Visible Reciter / Face',
    badge: 'RECOMMENDED',
    description: 'Auto-centers on the reciter/speaker face',
  },
  {
    id: 'original-video',
    name: 'Original Video Opening',
    badge: 'AUTHENTIC',
    description: 'Genuine initial video footage of recitation',
  },
  {
    id: 'channel-logo',
    name: 'Channel Logo Opening',
    badge: 'BRANDING',
    description: 'Shows your channel logo at the start',
  },
  {
    id: 'title-card',
    name: 'Custom Title Card',
    badge: 'EDITORIAL',
    description: 'Combines logo, Naat title, and reciter name',
  },
  {
    id: 'none',
    name: 'Instant (0s Intro)',
    badge: 'DIRECT',
    description: 'Begins directly with recitation without intro',
  },
];

export const DEFAULT_STUDIO_SETTINGS = {
  contentType: 'naat-recitation',
  visualSourceMode: 'ai-choice', // 'ai-choice' | 'original-video' | 'b-roll'
  aspectRatio: '9:16',
  durationPreset: 'standard', // 30 - 40s
  customMinDuration: 30,
  customMaxDuration: 40,
  clipCount: 4, // 3-4 Best Shorts default
  framingMode: 'trending-ai-speaker',
  cropPosition: 50, // 0 to 100 horizontal center
  openingStyle: 'face-speaker',
  openingDuration: 1.5, // 0, 1, 2, or 3 seconds
  channelLogoUrl: null,
  reciterName: '',
  enableCaptions: false,
  autoSubtitles: false,
  captionMode: 'dual-urdu-roman', // Both authentic Urdu script and Roman Urdu subtitles by default
  captionLanguage: 'urdu',
  transliterationStyle: 'conversational',
  captionStyle: 'beast-bold',
  captionPosition: 76, // vertical percent from top (bottom-center safe area)
  captionFontSize: 24, // small, clean, mobile-optimized
  bgOpacity: 0.72, // semi-transparent black panel
  referenceLyrics: '', // Optional user reference lyrics for Naat/recitation alignment
  fadeInDuration: 0.5,
  fadeOutDuration: 0.5,
  normalizeAudio: true,
  audioVolume: 1.0,
  bgmVolume: 0.15,
  exportQuality: '4k', // '4k' (2160x3840 Ultra HD), 'high' (1080p FHD), 'medium' (720p)
};
