-- Run in Supabase SQL Editor.
-- Adds full body text and Outlook web link to outlook_emails.

ALTER TABLE public.outlook_emails
  ADD COLUMN IF NOT EXISTS body_text text,
  ADD COLUMN IF NOT EXISTS web_link  text;
