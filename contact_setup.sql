CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  status TEXT DEFAULT 'unread',
  reply_message TEXT,
  replied_at TIMESTAMPTZ,
  ai_draft TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread';
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS reply_message TEXT;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS replied_by_name TEXT;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS replied_by_email TEXT;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS ai_draft TEXT;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public inserts on contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow public inserts on contact_inquiries"
  ON public.contact_inquiries
  FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contact_inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Allow read contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow read contact_inquiries"
  ON public.contact_inquiries
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update contact_inquiries"
  ON public.contact_inquiries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can delete contact_inquiries"
  ON public.contact_inquiries
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries (status);

