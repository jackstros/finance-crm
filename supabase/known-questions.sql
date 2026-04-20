-- Run this in your Supabase SQL Editor to add the known questions table.

create table public.known_questions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id text not null,
  created_at timestamptz default now(),
  unique (user_id, question_id)
);

alter table public.known_questions enable row level security;

create policy "Users can manage their own known questions"
  on public.known_questions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
