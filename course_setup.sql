-- ==============================================================================
-- ALL USEFUL TOOLS — AI COURSE PLATFORM INFRASTRUCTURE (IDEMPOTENT SQL SETUP)
-- ==============================================================================
-- Execute this script in your Supabase Project SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- This script sets up tables, constraints, storage buckets, RLS security policies,
-- and automated helper functions for the LMS / AI Course Generator & Player.
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. COURSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    category TEXT DEFAULT 'safety',
    duration INTEGER DEFAULT 7200, -- Duration in seconds (e.g. 7200 = 2 hours, 144000 = 40 hours)
    duration_label TEXT DEFAULT '2 Hours',
    thumbnail TEXT,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    settings JSONB DEFAULT '{
        "requireSequential": true,
        "passingScore": 70,
        "allowRetakes": true,
        "maxRetakes": 3,
        "showProgress": true,
        "enableTTS": true,
        "ttsVoice": "en-US",
        "ttsRate": 1,
        "certificate": {
            "enabled": true,
            "template": "standard"
        }
    }'::jsonb,
    modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    final_exam JSONB DEFAULT '{
        "id": "exam-default",
        "title": "Final Examination",
        "passingScore": 70,
        "timeLimit": 3600,
        "questions": []
    }'::jsonb,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by category and status
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);

-- ==============================================================================
-- 3. COURSE PROGRESS TABLE (Learner Tracking & Resumption)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    completed_topics JSONB DEFAULT '[]'::jsonb,
    completed_lessons JSONB DEFAULT '[]'::jsonb,
    completed_modules JSONB DEFAULT '[]'::jsonb,
    quiz_results JSONB DEFAULT '{}'::jsonb,
    exam_result JSONB DEFAULT NULL,
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    certificate_earned BOOLEAN DEFAULT FALSE,
    certificate_id TEXT,
    time_spent INTEGER DEFAULT 0, -- Total seconds active in player
    last_topic_id TEXT,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_progress_user ON public.course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON public.course_progress(course_id);

-- ==============================================================================
-- 4. COURSE CERTIFICATES TABLE (Official Digital Verifications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.course_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT,
    course_title TEXT NOT NULL,
    duration_hours NUMERIC DEFAULT 2,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    verification_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_certificates_cert_num ON public.course_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.course_certificates(user_id);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for idempotent execution
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.course_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.course_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.course_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.course_progress;
DROP POLICY IF EXISTS "Anyone can verify valid certificates" ON public.course_certificates;
DROP POLICY IF EXISTS "Users and Admins can create certificates" ON public.course_certificates;
DROP POLICY IF EXISTS "Course managers can manage all courses" ON public.courses;

-- Helper function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can author / manage courses
CREATE OR REPLACE FUNCTION public.is_course_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (
            role = 'admin' 
            OR role = 'superadmin' 
            OR role = 'course_creator'
            OR has_course_creator_access = TRUE
            OR has_generator_access = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COURSES POLICIES
-- 1. Anyone (public & authenticated) can view published courses
CREATE POLICY "Anyone can view published courses"
ON public.courses FOR SELECT
USING (status = 'published' OR public.is_course_manager());

-- 2. Course managers & Admins have full access (INSERT, UPDATE, DELETE, SELECT) to all courses
CREATE POLICY "Course managers can manage all courses"
ON public.courses FOR ALL
TO authenticated
USING (public.is_course_manager())
WITH CHECK (public.is_course_manager());

-- PROGRESS POLICIES
-- 1. Users can view their own progress (or course managers/admins can view all)
CREATE POLICY "Users can view their own progress"
ON public.course_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_course_manager());

-- 2. Users can insert their own progress
CREATE POLICY "Users can insert their own progress"
ON public.course_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own progress
CREATE POLICY "Users can update their own progress"
ON public.course_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_course_manager())
WITH CHECK (auth.uid() = user_id OR public.is_course_manager());

-- CERTIFICATES POLICIES
-- 1. Anyone can verify certificates by certificate_number or view their own
CREATE POLICY "Anyone can verify valid certificates"
ON public.course_certificates FOR SELECT
USING (true);

-- 2. Authenticated users and course managers/admins can create earned certificates
CREATE POLICY "Users and Admins can create certificates"
ON public.course_certificates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_course_manager());

-- ==============================================================================
-- 6. AUTOMATIC UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_courses_updated_at ON public.courses;
CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. STORAGE BUCKET FOR COURSE MEDIA & IMAGES (Optional if storage schema exists)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('course-media', 'course-media', true)
        ON CONFLICT (id) DO NOTHING;

        -- Allow public read access to course images
        DROP POLICY IF EXISTS "Public Course Media Access" ON storage.objects;
        CREATE POLICY "Public Course Media Access" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'course-media' OR bucket_id = 'media');

        -- Allow authenticated users / admins to upload course media
        DROP POLICY IF EXISTS "Admin Course Media Upload" ON storage.objects;
        CREATE POLICY "Admin Course Media Upload" 
        ON storage.objects FOR INSERT 
        TO authenticated 
        WITH CHECK (bucket_id = 'course-media' OR bucket_id = 'media');
    END IF;
END $$;

-- ==============================================================================
-- SUMMARY OF READY CAPABILITIES
-- ==============================================================================
-- Tables Created:
--   - public.courses (Course curricula, modules, topics, quizzes, final exam, settings)
--   - public.course_progress (User topic completion, quiz scores, resumption state)
--   - public.course_certificates (Verified digital certificates of completion)
-- RLS Security: Configured for secure public learning + administrative authoring.
-- ==============================================================================
