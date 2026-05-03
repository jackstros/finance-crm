-- Run in Supabase SQL Editor.
-- Adds outreach-tracking columns to outlook_emails for the Outreach tab.

ALTER TABLE public.outlook_emails
  ADD COLUMN IF NOT EXISTS direction     text    NOT NULL DEFAULT 'received',
  ADD COLUMN IF NOT EXISTS to_email      text,
  ADD COLUMN IF NOT EXISTS to_name       text,
  ADD COLUMN IF NOT EXISTS is_recruiting boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_id    uuid    REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Fast lookup for the Outreach tab
CREATE INDEX IF NOT EXISTS outlook_emails_sent_idx
  ON public.outlook_emails (user_id, direction, is_recruiting)
  WHERE direction = 'sent';

-- Enable RLS if not already on (safe to run if already enabled)
ALTER TABLE public.outlook_emails ENABLE ROW LEVEL SECURITY;

-- RLS policy (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'outlook_emails'
      AND policyname = 'Users can manage their own emails'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can manage their own emails"
        ON public.outlook_emails FOR ALL
        USING  (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    $policy$;
  END IF;
END $$;
