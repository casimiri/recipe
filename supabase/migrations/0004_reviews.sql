-- Recipe-Snap: community reviews
-- One review per (recipe, user); rating 1–5 plus optional text. Author name +
-- avatar are denormalized at write time so listing is a single-table read.

create table if not exists public.recipe_reviews (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references public.recipes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null default '',
  author_name text,
  author_avatar text,
  created_at timestamptz not null default now(),
  unique (recipe_id, user_id)
);

alter table public.recipe_reviews enable row level security;

-- Reviews are public (a social feature); writes are scoped to the author.
create policy "reviews are readable by everyone"
  on public.recipe_reviews for select using (true);
create policy "users manage their own reviews"
  on public.recipe_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists recipe_reviews_recipe_idx
  on public.recipe_reviews (recipe_id, created_at desc);
