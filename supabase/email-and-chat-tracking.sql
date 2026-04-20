-- Run this in your Supabase SQL Editor.
-- Adds email send time and coffee chat date tracking to contacts.

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS email_sent_time  timestamptz,
  ADD COLUMN IF NOT EXISTS coffee_chat_date timestamptz;
