-- # Tool History Infrastructure (IDEMPOTENT)
-- Covers: Lesson Quiz Builder, Course Generator, Blog Generator,
--         HTML Cleaner, Image-to-Text, Resource Generator, and all media tools.
-- Execute this script in the Supabase SQL Editor.

-- ═══════════════════════════════════════════════════════════════
-- 1. Create tool_history table
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tool_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tool_type TEXT NOT NULL,
    file_name TEXT DEFAULT 'Untitled',
    file_size BIGINT DEFAULT 0,
    output_format TEXT,
    output_size BIGINT DEFAULT 0,
    reduction_percent NUMERIC DEFAULT 0,
    result_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- 2. Clean duplicates & apply unique constraint for generator upsert
--    This powers saveGeneratorState() → onConflict: 'user_id,tool_type,result_url'
-- ═══════════════════════════════════════════════════════════════
-- Clean up any duplicates first (retain the newest one)
DELETE FROM public.tool_history a
USING public.tool_history b
WHERE (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id))
  AND a.user_id = b.user_id
  AND a.tool_type = b.tool_type
  AND a.result_url = b.result_url;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tool_history_user_tool_result_unique'
    ) THEN
        ALTER TABLE public.tool_history
        ADD CONSTRAINT tool_history_user_tool_result_unique
        UNIQUE (user_id, tool_type, result_url);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 3. Indexes for fast queries
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_tool_history_user_id
    ON public.tool_history (user_id);

CREATE INDEX IF NOT EXISTS idx_tool_history_tool_type
    ON public.tool_history (tool_type);

CREATE INDEX IF NOT EXISTS idx_tool_history_expires_at
    ON public.tool_history (expires_at);

CREATE INDEX IF NOT EXISTS idx_tool_history_user_tool
    ON public.tool_history (user_id, tool_type);

-- ═══════════════════════════════════════════════════════════════
-- 4. Enable Row Level Security
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.tool_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for clean re-deploy
DROP POLICY IF EXISTS "Users can view their own tool history" ON public.tool_history;
DROP POLICY IF EXISTS "Users can insert their own tool history" ON public.tool_history;
DROP POLICY IF EXISTS "Users can update their own tool history" ON public.tool_history;
DROP POLICY IF EXISTS "Users can delete their own tool history" ON public.tool_history;
DROP POLICY IF EXISTS "Admins can view all tool history" ON public.tool_history;

-- Users can CRUD their own records
CREATE POLICY "Users can view their own tool history"
ON public.tool_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tool history"
ON public.tool_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool history"
ON public.tool_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tool history"
ON public.tool_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all history (for Signal Monitor dashboard)
CREATE POLICY "Admins can view all tool history"
ON public.tool_history FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ═══════════════════════════════════════════════════════════════
-- 5. Enable Realtime for tool_history (powers HistoryList live sync)
-- ═══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_history;

-- ═══════════════════════════════════════════════════════════════
-- 6. Auto-purge expired records (optional cron via pg_cron)
--    Schedule this as a Supabase cron: every 1 hour
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.purge_expired_tool_history()
RETURNS void AS $$
BEGIN
    DELETE FROM public.tool_history
    WHERE expires_at < timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- If pg_cron is enabled, uncomment the following:
-- SELECT cron.schedule(
--     'purge-expired-tool-history',
--     '0 * * * *',  -- every hour
--     $$SELECT public.purge_expired_tool_history()$$
-- );

-- ═══════════════════════════════════════════════════════════════
-- 7. Verify: Quick sanity check
-- ═══════════════════════════════════════════════════════════════
-- Run this after setup to confirm everything is in place:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'tool_history' ORDER BY ordinal_position;
