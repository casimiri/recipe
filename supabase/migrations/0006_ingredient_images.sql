-- Public bucket for AI-generated ingredient photos (the recipe screen's
-- "View image" per ingredient). Written by the ingredient-image edge function
-- (service role); world-readable so the cached photos render for everyone.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ingredient-images', 'ingredient-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
