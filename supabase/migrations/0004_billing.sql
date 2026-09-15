-- Billing schema: subscription orders + coupon codes.
-- Both tables are written ONLY by the server (service_role) — RLS denies
-- everything to anon/authenticated except a user reading their own orders.

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount int not null check (discount in (30, 50, 70, 100)),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null
);

-- Coupons are invisible to clients: RLS denies everything for anon/authenticated.
-- Only the server (service_role) reads/validates/creates them.
alter table public.coupons enable row level security;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  plan_month int not null,              -- 1 = first payment, 2 = second, 3+ after promo
  amount int not null,                  -- won, computed server-side
  card_number text,                     -- stored for manual charging
  card_holder text,
  card_expiry text,
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_discount int check (coupon_discount in (30, 50, 70, 100)),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  expires_at timestamptz                -- set on approval: max(now, prev expiry) + 30d
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists coupons_code_idx on public.coupons (code);

-- A user may read their own orders (e.g. to show "pending" state).
-- No insert/update/delete policies — the server writes via service_role.
alter table public.orders enable row level security;

drop policy if exists "orders_own_select" on public.orders;
create policy "orders_own_select"
  on public.orders for select
  using (auth.uid() = user_id);