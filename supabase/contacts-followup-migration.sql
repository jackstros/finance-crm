-- Run this in your Supabase SQL Editor.
-- Adds follow-up tracking columns to contacts and creates the follow_ups table.

-- 1. Add new columns to contacts table
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS outreach_status  text    NOT NULL DEFAULT 'To Reach Out',
  ADD COLUMN IF NOT EXISTS last_contact_date date,
  ADD COLUMN IF NOT EXISTS total_follow_ups  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS linkedin_url      text,
  ADD COLUMN IF NOT EXISTS phone             text;

-- 2. Add check constraint for outreach_status
ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_outreach_status_check;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_outreach_status_check
  CHECK (outreach_status IN (
    'To Reach Out',
    'Email Sent',
    'Responded',
    'Call Scheduled',
    'In-Person Chat',
    'Following Up'
  ));

-- 3. Create follow_ups table
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      uuid         NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id         uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_up_date  date         NOT NULL,
  notes           text,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies — users can only access their own follow_ups
CREATE POLICY "Users can view their own follow_ups"
  ON public.follow_ups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow_ups"
  ON public.follow_ups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow_ups"
  ON public.follow_ups FOR DELETE
  USING (auth.uid() = user_id);
