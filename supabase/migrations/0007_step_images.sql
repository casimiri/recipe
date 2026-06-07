-- Public bucket for AI-generated cook-mode step illustrations (one image per
-- recipe step). Written by the step-image edge function (service role);
-- world-readable so cached illustrations render for everyone.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('step-images', 'step-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
