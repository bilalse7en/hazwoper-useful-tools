-- ==============================================================================
-- ALL USEFUL TOOLS - COMPREHENSIVE ROLE & ACCESS CONTROL INFRASTRUCTURE
-- ==============================================================================
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- This script is 100% IDEMPOTENT and safe to run multiple times.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENSURE PROFILES TABLE & ACCESS CONTROL COLUMNS EXIST
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    has_generator_access BOOLEAN DEFAULT FALSE,
    has_course_creator_access BOOLEAN DEFAULT FALSE,
    has_ai_access BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Idempotently add any missing columns to existing profiles table
DO $$ 
BEGIN
    -- Role column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;

    -- Generator suite access column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'has_generator_access'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN has_generator_access BOOLEAN DEFAULT FALSE;
    END IF;

    -- AI Course Creator dedicated access column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'has_course_creator_access'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN has_course_creator_access BOOLEAN DEFAULT FALSE;
    END IF;

    -- AI Tools / OCR paid access column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'has_ai_access'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN has_ai_access BOOLEAN DEFAULT FALSE;
    END IF;

    -- Online status tracking columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_online'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_seen_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.role IS 'User authorization role: admin, superadmin, course_creator, blog_creator, content_creator, user';
COMMENT ON COLUMN public.profiles.has_generator_access IS 'Grants unlimited PRO access to all Generator Suite Tools.';
COMMENT ON COLUMN public.profiles.has_course_creator_access IS 'Grants dedicated PRO clearance to AI Course Generator & LMS Management.';
COMMENT ON COLUMN public.profiles.has_ai_access IS 'Grants unlimited PRO access specifically to AI OCR & Image-to-Text features.';

-- Create indexes for quick profile role & access queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_course_creator ON public.profiles(has_course_creator_access);

-- ==============================================================================
-- 3. AUTOMATIC PRIVILEGE SYNCHRONIZATION
-- ==============================================================================
-- Upgrade all existing Admins with full access
UPDATE public.profiles
SET has_generator_access = TRUE,
    has_course_creator_access = TRUE,
    has_ai_access = TRUE
WHERE role IN ('admin', 'superadmin');

-- Upgrade all existing Course Creators
UPDATE public.profiles
SET has_course_creator_access = TRUE,
    has_generator_access = TRUE
WHERE role = 'course_creator';

-- ==============================================================================
-- 4. HELPER SECURITY DEFINER FUNCTIONS
-- ==============================================================================

-- Check if active session belongs to an Admin or Superadmin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if active session has permission to create and manage courses
CREATE OR REPLACE FUNCTION public.is_course_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (
            role IN ('admin', 'superadmin', 'course_creator')
            OR has_course_creator_access = TRUE
            OR has_generator_access = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master Function: Set user role by email
CREATE OR REPLACE FUNCTION public.set_user_role_by_email(target_email TEXT, target_role TEXT)
RETURNS TEXT AS $$
DECLARE
    matched_count INTEGER;
BEGIN
    UPDATE public.profiles
    SET role = target_role,
        has_generator_access = CASE 
            WHEN target_role IN ('admin', 'superadmin', 'course_creator') THEN TRUE 
            ELSE has_generator_access 
        END,
        has_course_creator_access = CASE 
            WHEN target_role IN ('admin', 'superadmin', 'course_creator') THEN TRUE 
            ELSE has_course_creator_access 
        END,
        has_ai_access = CASE 
            WHEN target_role IN ('admin', 'superadmin') THEN TRUE 
            ELSE has_ai_access 
        END,
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email);

    GET DIAGNOSTICS matched_count = ROW_COUNT;

    IF matched_count = 0 THEN
        RETURN 'No profile found with email: ' || target_email;
    END IF;

    RETURN 'Successfully upgraded ' || target_email || ' to role: ' || target_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Grant Full Admin by Email
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(target_email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN public.set_user_role_by_email(target_email, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Revoke Admin by Email (reverts to standard user)
CREATE OR REPLACE FUNCTION public.revoke_admin_by_email(target_email TEXT)
RETURNS TEXT AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'user',
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email);

    RETURN 'Revoked admin clearance for: ' || target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Grant AI Course Creator PRO by Email
CREATE OR REPLACE FUNCTION public.grant_course_creator_by_email(target_email TEXT)
RETURNS TEXT AS $$
BEGIN
    UPDATE public.profiles
    SET has_course_creator_access = TRUE,
        has_generator_access = TRUE,
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email);

    RETURN 'Authorized AI Course Creator PRO access for: ' || target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Revoke AI Course Creator PRO by Email
CREATE OR REPLACE FUNCTION public.revoke_course_creator_by_email(target_email TEXT)
RETURNS TEXT AS $$
BEGIN
    UPDATE public.profiles
    SET has_course_creator_access = FALSE,
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email) 
      AND role NOT IN ('admin', 'superadmin');

    RETURN 'Revoked AI Course Creator access for: ' || target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Grant Paid AI Tools Access by Email
CREATE OR REPLACE FUNCTION public.grant_ai_access_by_email(target_email TEXT)
RETURNS TEXT AS $$
BEGIN
    UPDATE public.profiles
    SET has_ai_access = TRUE,
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email);

    RETURN 'Authorized AI Suite access for: ' || target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Revoke Paid AI Tools Access by Email
CREATE OR REPLACE FUNCTION public.revoke_ai_access_by_email(target_email TEXT)
RETURNS TEXT AS $$
BEGIN
    UPDATE public.profiles
    SET has_ai_access = FALSE,
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email) 
      AND role NOT IN ('admin', 'superadmin');

    RETURN 'Revoked AI Suite access for: ' || target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) FOR PROFILES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles read policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 1. All authenticated & public users can read profiles (for avatars, authors, names)
CREATE POLICY "Public profiles read policy"
ON public.profiles FOR SELECT
USING (true);

-- 2. Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile details
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Admins & Superadmins have full read/write/update access to manage any profile
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 6. TOOL SETTINGS TABLE (Monetization & Free/Paid Toggles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tool_settings (
    id TEXT PRIMARY KEY,
    is_free BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tool_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read tool settings" ON public.tool_settings;
DROP POLICY IF EXISTS "Admins can manage tool settings" ON public.tool_settings;

CREATE POLICY "Anyone can read tool settings"
ON public.tool_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tool settings"
ON public.tool_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. AI DAILY USAGE TRACKING & INCREMENT RPC
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_daily_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily AI usage" ON public.ai_daily_usage;
DROP POLICY IF EXISTS "Users can insert own daily AI usage" ON public.ai_daily_usage;
DROP POLICY IF EXISTS "Users can update own daily AI usage" ON public.ai_daily_usage;

CREATE POLICY "Users can view own daily AI usage" 
ON public.ai_daily_usage FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own daily AI usage" 
ON public.ai_daily_usage FOR INSERT 
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own daily AI usage" 
ON public.ai_daily_usage FOR UPDATE 
USING (auth.uid() = user_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.increment_ai_daily_usage(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    INSERT INTO public.ai_daily_usage (user_id, usage_date, count)
    VALUES (target_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET 
        count = public.ai_daily_usage.count + 1,
        updated_at = timezone('utc'::text, now())
    RETURNING count INTO current_count;
    
    RETURN current_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. SUMMARY & EXAMPLE MANAGEMENT COMMANDS
-- ==============================================================================
-- Grant full Admin access to an account:
--   SELECT public.grant_admin_by_email('your_admin_email@example.com');
--
-- Grant separate AI Course Creator PRO access:
--   SELECT public.grant_course_creator_by_email('creator@example.com');
--
-- Grant Paid AI Tools / OCR access:
--   SELECT public.grant_ai_access_by_email('subscriber@example.com');
--
-- Set specific role:
--   SELECT public.set_user_role_by_email('editor@example.com', 'course_creator');
-- ==============================================================================
