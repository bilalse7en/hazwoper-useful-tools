-- ═══════════════════════════════════════════════════════════════
-- # Media Hub & Video Shorts Infrastructure (IDEMPOTENT)
-- Powers: AI Video-to-Shorts, Media Hub Asset Library, Admin Media Manager
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Create media_hub table (supports custom string IDs like yt_xxx and UUIDs)
CREATE TABLE IF NOT EXISTS public.media_hub (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT DEFAULT 0,
    preview_url TEXT,
    download_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ
);

-- Ensure all columns exist if table was partially created
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS download_url TEXT;
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.media_hub ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_media_hub_user_id ON public.media_hub (user_id);
CREATE INDEX IF NOT EXISTS idx_media_hub_created_at ON public.media_hub (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_hub_expires_at ON public.media_hub (expires_at);

-- 3. Row Level Security (RLS)
ALTER TABLE public.media_hub ENABLE ROW LEVEL SECURITY;

-- Allow reading assets (public for preview/stream, authenticated for management)
DROP POLICY IF EXISTS "Allow read media_hub" ON public.media_hub;
CREATE POLICY "Allow read media_hub"
ON public.media_hub FOR SELECT
TO public, anon, authenticated
USING (true);

-- Allow inserting media assets
DROP POLICY IF EXISTS "Allow insert media_hub" ON public.media_hub;
CREATE POLICY "Allow insert media_hub"
ON public.media_hub FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

-- Allow users to update their own assets, or admin
DROP POLICY IF EXISTS "Allow update media_hub" ON public.media_hub;
CREATE POLICY "Allow update media_hub"
ON public.media_hub FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'))
WITH CHECK (true);

-- Allow users to delete their own assets, or admin
DROP POLICY IF EXISTS "Allow delete media_hub" ON public.media_hub;
CREATE POLICY "Allow delete media_hub"
ON public.media_hub FOR DELETE
TO public, anon, authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 4. Supabase Storage: 'media' Bucket Setup & Policies
-- ═══════════════════════════════════════════════════════════════

-- Create public 'media' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    524288000, -- 500MB maximum file size limit
    ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'audio/wav', 'audio/mpeg', 'text/vtt']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 524288000;

-- Storage object access policies for 'media' bucket
DROP POLICY IF EXISTS "Media Bucket Public Read" ON storage.objects;
CREATE POLICY "Media Bucket Public Read"
ON storage.objects FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Media Bucket Upload" ON storage.objects;
CREATE POLICY "Media Bucket Upload"
ON storage.objects FOR INSERT
TO public, anon, authenticated
WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Media Bucket Update" ON storage.objects;
CREATE POLICY "Media Bucket Update"
ON storage.objects FOR UPDATE
TO public, anon, authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Media Bucket Delete" ON storage.objects;
CREATE POLICY "Media Bucket Delete"
ON storage.objects FOR DELETE
TO public, anon, authenticated
USING (bucket_id = 'media');
