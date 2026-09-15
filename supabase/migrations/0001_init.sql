-- Korean Study — user sync storage.
-- Run this once in the Supabase SQL editor after creating the free project
-- (Dashboard → SQL Editor → New query → paste → Run).

-- Two tables, one JSONB row per user. The shape of `data` matches exactly
-- what the app keeps in localStorage today, so client-side merge logic can
-- operate on native objects.

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.srs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: every policy keeps each user locked to their own row.
-- The anon/publishable key can call INSERT/SELECT/UPDATE only through these.

alter table public.progress enable row level security;
alter table public.srs enable row level security;

create policy "own progress" on public.progress
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own srs" on public.srs
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-bump updated_at on writes so we can read it back.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_progress_updated_at on public.progress;
create trigger set_progress_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();

drop trigger if exists set_srs_updated_at on public.srs;
create trigger set_srs_updated_at
  before update on public.srs
  for each row execute function public.set_updated_at();