-- Folester media expansion. Run after schema.sql and social_mechanics.sql.

alter table public.posts add column if not exists media_url text;
alter table public.callouts add column if not exists media_url text;

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Public assets are readable" on storage.objects;
create policy "Public assets are readable"
  on storage.objects for select using (bucket_id = 'public-assets');

drop policy if exists "Users can upload their public assets" on storage.objects;
create policy "Users can upload their public assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Profile avatars and feed media both use <auth-user-id>/<filename>. These
-- policies permit only the owner of that first path segment to change/remove it.
drop policy if exists "Users can update their public assets" on storage.objects;
create policy "Users can update their public assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their public assets" on storage.objects;
create policy "Users can delete their public assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
