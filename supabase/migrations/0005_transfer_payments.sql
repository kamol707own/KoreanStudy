-- Transfer payments with screenshot proof.
-- 1) Owner card settings (key-value), server-only writes via service_role.
-- 2) Orders gain an optional payment-proof screenshot path.
-- 3) Private `payment-proofs` storage bucket policies (owner-r/w only).

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- Deny everything to anon/authenticated; the server reads/writes with
-- service_role (bypasses RLS). A public GET endpoint exposes the card info.
alter table public.settings enable row level security;

alter table public.orders add column if not exists proof_path text;

-- Storage policies for the private proof bucket. A user may touch only files
-- under their own uid prefix; service_role (admin panel) bypasses RLS and
-- issues short-lived signed URLs for viewing.
drop policy if exists "proof upload" on storage.objects;
create policy "proof upload" on storage.objects
  for insert to authenticated
  with check ((bucket_id = 'payment-proofs'::text) and ((storage.foldername(name))[1] = (auth.uid())::text));

drop policy if exists "proof read own" on storage.objects;
create policy "proof read own" on storage.objects
  for select to authenticated
  using ((bucket_id = 'payment-proofs'::text) and ((storage.foldername(name))[1] = (auth.uid())::text));

drop policy if exists "proof update own" on storage.objects;
create policy "proof update own" on storage.objects
  for update to authenticated
  using ((bucket_id = 'payment-proofs'::text) and ((storage.foldername(name))[1] = (auth.uid())::text));

drop policy if exists "proof delete own" on storage.objects;
create policy "proof delete own" on storage.objects
  for delete to authenticated
  using ((bucket_id = 'payment-proofs'::text) and ((storage.foldername(name))[1] = (auth.uid())::text));