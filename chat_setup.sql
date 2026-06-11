-- # Neural Chat Infrastructure & Security Protocols (IDEMPOTENT VERSION)
-- Execute this script in the Supabase SQL Editor. 
-- This script replaces existing policies to ensure 100% compliance with new protocols.

-- 1. Ensure Profiles Table has necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_granted BOOLEAN DEFAULT FALSE;

-- 2. Create User Channels Table for persistent tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, partner_id)
);

-- 3. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- 4. Clean up existing policies for 100% fresh deployment
-- User Channels
DROP POLICY IF EXISTS "Users can view their own channels" ON public.user_channels;
DROP POLICY IF EXISTS "Users can initialize their own channels" ON public.user_channels;

-- Messages
DROP POLICY IF EXISTS "Users can view relevant messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Purge protocols" ON public.messages;
DROP POLICY IF EXISTS "Mark messages as read" ON public.messages;

-- Interactions
DROP POLICY IF EXISTS "Users can create interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Admins can view all interactions" ON public.user_interactions;

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 5. User Channels Policies
CREATE POLICY "Users can view their own channels" 
ON public.user_channels FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can initialize their own channels" 
ON public.user_channels FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 6. Message Policies
CREATE POLICY "Users can view relevant messages" 
ON public.messages FOR SELECT 
TO authenticated 
USING (is_global = true OR auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Purge protocols" 
ON public.messages FOR DELETE 
TO authenticated 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

CREATE POLICY "Mark messages as read" 
ON public.messages FOR UPDATE 
TO authenticated 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 7. User Interactions (Reports/Blocks)
CREATE POLICY "Users can create interactions" 
ON public.user_interactions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all interactions" 
ON public.user_interactions FOR SELECT 
TO authenticated 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 8. Profiles Permissions
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 9. Trigger: Automatically Link Users in user_channels upon first message
CREATE OR REPLACE FUNCTION public.handle_new_message() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_global = FALSE AND NEW.receiver_id IS NOT NULL THEN
        -- Insert for sender to see receiver
        INSERT INTO public.user_channels (user_id, partner_id)
        VALUES (NEW.sender_id, NEW.receiver_id)
        ON CONFLICT (user_id, partner_id) DO NOTHING;
        
        -- Insert for receiver to see sender
        INSERT INTO public.user_channels (user_id, partner_id)
        VALUES (NEW.receiver_id, NEW.sender_id)
        ON CONFLICT (user_id, partner_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- 10. Presence Handling
CREATE OR REPLACE FUNCTION public.handle_presence_update()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
