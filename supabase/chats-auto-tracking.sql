-- Run this in your Supabase SQL Editor.
-- Renames coffee_chat_date → next_chat_date, adds chats_completed column,
-- and creates the completed_chats history table.

-- 1. Rename coffee_chat_date to next_chat_date
ALTER TABLE public.contacts
  RENAME COLUMN coffee_chat_date TO next_chat_date;

-- 2. Add chats_completed column
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS chats_completed integer NOT NULL DEFAULT 0;

-- 3. Create completed_chats history table
CREATE TABLE IF NOT EXISTS public.completed_chats (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_date   date        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE public.completed_chats ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies — users can only access their own rows
CREATE POLICY "Users can view their own completed_chats"
  ON public.completed_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed_chats"
  ON public.completed_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed_chats"
  ON public.completed_chats FOR DELETE
  USING (auth.uid() = user_id);
