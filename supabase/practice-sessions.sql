-- Run this in your Supabase SQL Editor to add practice session tracking.

create table public.practice_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_type text not null,
  mode text check (mode in ('custom', 'freestyle')) default 'custom',
  questions_answered int default 0 not null,
  questions_correct int default 0 not null,
  questions_skipped int default 0 not null,
  topics text[],
  difficulties text[],
  created_at timestamptz default now()
);

alter table public.practice_sessions enable row level security;

create policy "Users can manage their own practice sessions"
  on public.practice_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
