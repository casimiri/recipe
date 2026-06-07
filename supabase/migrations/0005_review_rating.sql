-- Recipe-Snap: make community reviews drive the shown rating everywhere.
-- The catalog `rating`/`reviews` become the *display* aggregate; the original
-- seed values are preserved in `base_rating`/`base_reviews` and used as a prior,
-- so a couple of real reviews nudge an established score rather than replace it.

alter table public.recipes add column if not exists base_rating numeric;
alter table public.recipes add column if not exists base_reviews int;

-- Snapshot the current catalog values as the baseline (idempotent).
update public.recipes
  set base_rating = coalesce(base_rating, rating),
      base_reviews = coalesce(base_reviews, reviews)
  where base_rating is null or base_reviews is null;

-- Recompute one recipe's display aggregate from its reviews + the baseline.
create or replace function public.recompute_recipe_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rid text := coalesce(NEW.recipe_id, OLD.recipe_id);
  n int;
  s numeric;
  br numeric;
  bn int;
begin
  select count(*), coalesce(sum(rating), 0) into n, s
    from public.recipe_reviews where recipe_id = rid;
  select coalesce(base_rating, 0), coalesce(base_reviews, 0) into br, bn
    from public.recipes where id = rid;
  update public.recipes
    set reviews = bn + n,
        rating = case when bn + n = 0 then br else round(((br * bn) + s) / (bn + n), 1) end
    where id = rid;
  return null;
end;
$$;

drop trigger if exists recipe_reviews_aggregate on public.recipe_reviews;
create trigger recipe_reviews_aggregate
  after insert or update or delete on public.recipe_reviews
  for each row execute function public.recompute_recipe_rating();

-- One-time backfill for any recipes that already have reviews.
update public.recipes r set
  reviews = coalesce(r.base_reviews, 0) + agg.n,
  rating = case when coalesce(r.base_reviews, 0) + agg.n = 0 then coalesce(r.base_rating, 0)
                else round((coalesce(r.base_rating, 0) * coalesce(r.base_reviews, 0) + agg.s)
                           / (coalesce(r.base_reviews, 0) + agg.n), 1) end
from (select recipe_id, count(*) n, sum(rating) s from public.recipe_reviews group by recipe_id) agg
where r.id = agg.recipe_id;
