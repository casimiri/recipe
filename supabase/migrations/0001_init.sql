-- Recipe-Snap schema
-- Tables: profiles, recipes, user_state
-- Recipes are world-readable (shared catalog). User-owned imports and per-user
-- app state (saved/plan/grocery/tastes) are protected by RLS.

create extension if not exists "pgcrypto";

-- ── profiles ───────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  handle text unique,
  avatar text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by everyone"
  on public.profiles for select using (true);
create policy "users manage their own profile"
  on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, handle)
  values (new.id, split_part(new.email, '@', 1), '@' || split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── recipes ────────────────────────────────────────────────
create table if not exists public.recipes (
  id text primary key,
  title text not null,
  cuisine text,
  meal text,
  time int,
  servings int,
  cal int,
  difficulty text,
  rating numeric,
  reviews int,
  img text,
  source jsonb,
  saves int default 0,
  cooked int default 0,
  description text,
  tags jsonb,
  nutrition jsonb,
  ingredients jsonb,
  steps jsonb,
  imported boolean default false,
  owner uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

-- The seeded catalog (owner is null) plus any user's own imports are readable.
create policy "recipes are readable"
  on public.recipes for select using (owner is null or auth.uid() = owner);
create policy "users insert their own recipes"
  on public.recipes for insert with check (auth.uid() = owner);
create policy "users update their own recipes"
  on public.recipes for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "users delete their own recipes"
  on public.recipes for delete using (auth.uid() = owner);

-- ── user_state (per-user app state blob) ───────────────────
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "users manage their own state"
  on public.user_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
