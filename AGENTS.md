# HAZWOPER Useful Tools — Engineering Guide & Agent Guidelines (AGENTS.md)

Welcome to the **HAZWOPER Useful Tools** project. This document serves as the canonical architectural guide for Google Jules, Antigravity, and collaborating software engineers.

---

## 1. System Overview & Technology Stack

- **Framework**: Next.js 16.2.7 (App Router, Turbopack, React 19)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Storage Buckets, Realtime WebSockets)
- **Deployment Platform**: Vercel Serverless (Node.js runtime, Ephemeral `/tmp` filesystem)
- **Video Processing**: Native FFmpeg with ASS subtitles, dynamic 9:16 portrait framing, -14 LUFS loudness normalization
- **Speech Recognition & AI**: Transformers.js / ONNX Whisper base model (configured for Urdu speech recognition & phonetics)
- **Test Framework**: Vitest 4.1.10 (fast in-memory test runner)

---

## 2. Core Architectural Invariants

### A. ID Architecture & PostgreSQL UUID Decoupling
- **PostgreSQL Rule**: The `public.media_hub.id` column in Supabase can be configured as `UUID` or `TEXT`.
- **Application IDs**: External systems generate structured string IDs (e.g. `yt_<id>`, `stock_<id>`, `short_<job>_<index>`, `vid_<timestamp>_<hash>`).
- **Safety Guarantee**: In `src/lib/video-shorts/media-storage-service.js`, all database writes validate IDs with `isValidUUID(id)`. If an ID is a string, a genuine v4 UUID (`crypto.randomUUID()`) is used as `dbId`, and the external string ID is stored in `metadata.external_id`.
- **Query Rule**: Lookups in `getMediaHubItem(id)` match both `id`, `db_id`, and `metadata.external_id`.

### B. Durable Storage & Storage Limits
- **Bucket Configuration**: Storage bucket `media` in Supabase is configured with a 500MB file size limit (`file_size_limit: 524288000`).
- **Idempotent Migration**: See `media_hub_setup.sql`. If a database was initialized with `id UUID`, the migration safely runs `ALTER TABLE public.media_hub ALTER COLUMN id TYPE TEXT USING id::text;` and creates an index on `metadata->>'external_id'`.
- **Vercel Ephemeral Filesystem**: On Vercel, `/tmp` storage is ephemeral across serverless invocations. All permanent assets must be persisted to Supabase Storage.

### C. B-Roll Replacement Engine
- **Visual Source Replacement**: When a user selects Islamic or scenic B-roll in `IslamicStockGalleryModal`, clicking **Apply to Short** replaces the segment's visual source (`isStock: true`, `stockVideoUrl: url`).
- **Canvas Rendering**: In `StudioEditor` (`studio-editor.jsx`), the canvas monitor draws from the offscreen B-roll video element (`brollVideoRef.current`), while the main video element (`videoRef.current`) plays the original recitation audio.
- **FFmpeg Render Pipeline**: In `ffmpeg-service.js` (`buildFFmpegArgs`), when `brollPath` is provided:
  - Input 0: `-ss <start> -i <recitation_video>` (provides audio)
  - Input 1: `-stream_loop -1 -i <broll_video>` (provides visual)
  - `-filter_complex`: Crops and scales `[1:v]` to 9:16, burns timed ASS subtitles onto the B-roll visual, applies audio filters to `[0:a]`, and maps `[vfinal]` and `[afinal]`.

### D. React Lifecycle & Render-Loop Guards
- **No Unconditional State Updates in Effects**: `renderFrame` inside `StudioEditor` canvas effect strictly draws to `<canvas>` and throttles `setCurrentTime` state updates to >=150ms intervals during playback only. When paused, `renderFrame()` has ZERO state update side effects.
- **Thumbnail Selection**: In `ThumbnailEditorModal`, prop sync effects track previous values with `useRef` and guard against repeated object recreations.
- **Event Listeners**: Keyboard shortcuts (`Space`, `KeyC`) are bound once on mount using function refs to avoid re-binding on every animation frame.

### E. Speech Recognition & Subtitle Engine
- **Urdu Native Recognition**: In `job-queue-service.js` and `transcription-service.js`, Whisper base is forced with `language: 'ur'`, `task: 'transcribe'`.
- **AudioContext Elimination**: Node.js environments lack Web Audio `AudioContext`. In Node.js, `loadAudioToFloat32Array` extracts single-channel 16kHz PCM audio buffers without depending on browser audio APIs.
- **Dual Subtitles**: Timed subtitles produce authentic Urdu Nastaliq (`Kumail` font) and phonetically accurate Roman Urdu (`Rockybilly` font) without English machine translation.

---

## 3. Verification & Testing

Always verify the project after modifications using the standard test suite:

```bash
# 1. Run full test suite (90+ unit and integration tests)
npx vitest run

# 2. Run specific video-shorts tests
npx vitest run tests/video-shorts.test.js

# 3. Build verification
npm run build
```

---

## 4. Security & Access Rules

1. **Environment Secrets**: Never commit or client-expose `SUPABASE_SERVICE_ROLE_KEY`, `PEXELS_API_KEY`, or `PIXABAY_API_KEY`.
2. **SSRF Guard**: Remote media URL fetching in `/api/video-shorts/render` and `stock-video-service.js` restricts schemes to `http`/`https` and blocks internal addresses.
3. **Attribution**: All stock video assets preserve author, provider, and YouTube-ready attribution text.
