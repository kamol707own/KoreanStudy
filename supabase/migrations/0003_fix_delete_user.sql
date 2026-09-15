-- Korean Study — fix avatar storage + account deletion (idempotent, safe to re-run).
-- Run this if 0002 failed or gave an error. Supabase SQL Editor → paste → Run.

-- 1. Storage bucket (idempotent)
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- 2. Policies (drop first so re-running never fails)
drop policy if exists "avatar upload" on storage.objects;
drop policy if exists "avatar update" on storage.objects;
drop policy if exists "avatar read" on storage.objects;
drop policy if exists "avatar delete" on storage.objects;

create policy "avatar upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

create policy "avatar delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. delete_user — security definer (runs as postgres superuser, bypasses RLS).
--    Drops first so re-running never fails with "already exists".
drop function if exists public.delete_user();
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception using errcode = 'not_authenticated', message = 'no active session';
  end if;

  -- Avatar files in storage
  delete from storage.objects
    where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = uid::text;

  -- Synced rows
  delete from public.progress where user_id = uid;
  delete from public.srs where user_id = uid;

  -- The auth user itself
  delete from auth.users where id = uid;
end;
$$;

-- Explicitly allow the authenticated role to call it
revoke all on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated, service_role;