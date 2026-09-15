-- Korean Study — avatar storage + account deletion.
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- 1. Storage bucket for profile pictures.
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- Allow authenticated users to upload/update their own avatar.
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

-- Public read access for avatars.
create policy "avatar read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

-- Allow users to delete their own avatar.
create policy "avatar delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Database function to delete a user account and all associated data.
-- Called from the client via: supabase.rpc('delete_user')
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  -- Delete synced data
  delete from public.progress where user_id = uid;
  delete from public.srs where user_id = uid;

  -- Delete avatar from storage
  delete from storage.objects
    where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = uid::text;

  -- Delete the auth user (requires service_role or security definer)
  delete from auth.users where id = uid;
end;
$$;
