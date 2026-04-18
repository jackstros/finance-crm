-- Run this in your Supabase SQL Editor

create table public.questions (
  id         uuid        default gen_random_uuid() primary key,
  question   text        not null,
  answer     text        not null,
  topic      text        not null check (topic in ('accounting','valuation','dcf','lbo','other','brainteaser')),
  difficulty text        not null check (difficulty in ('easy','medium','advanced')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.questions enable row level security;

-- All authenticated users can read questions (used by the practice page)
create policy "Authenticated users can read questions"
  on public.questions for select
  using (auth.role() = 'authenticated');

-- Only the admin email can write (replace with your actual email)
create policy "Admin can insert questions"
  on public.questions for insert
  with check (auth.jwt() ->> 'email' = 'jacktmastros@icloud.com');

create policy "Admin can update questions"
  on public.questions for update
  using  (auth.jwt() ->> 'email' = 'jacktmastros@icloud.com')
  with check (auth.jwt() ->> 'email' = 'jacktmastros@icloud.com');

create policy "Admin can delete questions"
  on public.questions for delete
  using (auth.jwt() ->> 'email' = 'jacktmastros@icloud.com');

-- Auto-update updated_at
create trigger questions_updated_at
  before update on public.questions
  for each row execute function update_updated_at();
