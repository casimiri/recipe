-- ── billing: Pro subscription + admin-configurable price / AI quota ─────────
-- app_config holds the single admin-tunable config row: the monthly price and
-- the free monthly AI quota. World-readable so the app can show the price and
-- enforce the quota; only the service role (admin via SQL/dashboard) can change
-- it — there is no user write policy.
create table if not exists public.app_config (
  id text primary key default 'default',
  price_cents int not null default 199,
  currency text not null default 'EUR',
  free_ai_quota int not null default 5,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create policy "app_config is readable by everyone"
  on public.app_config for select using (true);

insert into public.app_config (id) values ('default') on conflict (id) do nothing;

-- subscriptions is the authoritative per-user Pro state + AI usage counter.
-- Users may read their own row; only edge functions (service role) write it —
-- the subscribe function flips `pro`, and the AI functions bump ai_count.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pro boolean not null default false,
  renews_at timestamptz,
  ai_period text,            -- 'YYYY-MM' the ai_count applies to
  ai_count int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "users read their own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);
