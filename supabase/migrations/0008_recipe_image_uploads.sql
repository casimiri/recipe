-- Let signed-in users upload a recipe's hero photo from the client (the
-- edit/create flow). The `recipe-images` bucket already exists (photo imports
-- upload to it via the import-recipe function using the service role, which
-- bypasses RLS). These policies additionally allow authenticated users to write
-- under their own "<uid>/…" folder; reads stay public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "recipe images are readable by everyone" on storage.objects;
create policy "recipe images are readable by everyone"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

drop policy if exists "users upload their own recipe image" on storage.objects;
create policy "users upload their own recipe image"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users update their own recipe image" on storage.objects;
create policy "users update their own recipe image"
  on storage.objects for update to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);
