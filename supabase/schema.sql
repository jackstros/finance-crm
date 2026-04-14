-- Run this in your Supabase SQL Editor to set up the database schema.

-- Contacts table
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  firm text,
  email text,
  date_of_contact date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contacts enable row level security;

create policy "Users can manage their own contacts"
  on public.contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Firms table
create table public.firms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  firm_name text not null,
  role text,
  status text check (status in ('researching', 'applied', 'interview', 'offer', 'rejected')) default 'researching' not null,
  interview_notes text,
  last_contacted date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.firms enable row level security;

create policy "Users can manage their own firms"
  on public.firms for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Follow-up dismissals table
create table public.follow_up_dismissals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  entity_type text check (entity_type in ('contact', 'firm')) not null,
  entity_id uuid not null,
  dismissed_at timestamptz default now(),
  unique (user_id, entity_type, entity_id)
);

alter table public.follow_up_dismissals enable row level security;

create policy "Users can manage their own dismissals"
  on public.follow_up_dismissals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function update_updated_at();

create trigger firms_updated_at
  before update on public.firms
  for each row execute function update_updated_at();
