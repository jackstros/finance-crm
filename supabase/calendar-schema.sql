-- Run in Supabase SQL Editor.
-- Creates the calendar_events table for Outlook calendar sync.

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outlook_event_id text,
  contact_id       uuid        REFERENCES public.contacts(id) ON DELETE SET NULL,
  title            text        NOT NULL,
  start_time       timestamptz NOT NULL,
  end_time         timestamptz NOT NULL,
  location         text,
  body_preview     text,
  organizer_email  text,
  attendees        jsonb       NOT NULL DEFAULT '[]',
  is_recruiting    boolean     NOT NULL DEFAULT false,
  follow_up_logged boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index: only enforce uniqueness on outlook_event_id when it exists
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_user_outlook_idx
  ON public.calendar_events (user_id, outlook_event_id)
  WHERE outlook_event_id IS NOT NULL;

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar_events"
  ON public.calendar_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ALSO: Add Calendars.ReadWrite to your Azure app registration scopes,
-- then reconnect via Settings > Integrations to grant calendar access.
