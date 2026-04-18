-- Run this in your Supabase SQL Editor AFTER running schema.sql

-- Microsoft OAuth tokens (one row per user)
create table public.microsoft_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  microsoft_email text,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.microsoft_tokens enable row level security;

create policy "Users can manage their own tokens"
  on public.microsoft_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Synced Outlook emails linked to contacts/firms
create table public.outlook_emails (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  message_id text not null,
  subject text,
  from_email text,
  from_name text,
  received_at timestamptz,
  body_preview text,
  contact_id uuid references public.contacts(id) on delete set null,
  firm_id uuid references public.firms(id) on delete set null,
  created_at timestamptz default now(),
  unique (user_id, message_id)
);

alter table public.outlook_emails enable row level security;

create policy "Users can manage their own emails"
  on public.outlook_emails for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at for microsoft_tokens
create trigger microsoft_tokens_updated_at
  before update on public.microsoft_tokens
  for each row execute function update_updated_at();

-- NOTE: Register http://localhost:3001/api/auth/microsoft/callback
-- as a Redirect URI in your Azure app registration (Platform: Web).
-- For production, also add your deployed URL.
