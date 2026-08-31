-- Folester follow system. Run after schema.sql.
-- Assumes public.follows(follower_id uuid, following_id uuid) already exists.

create unique index if not exists follows_follower_following_unique_idx
  on public.follows (follower_id, following_id);

alter table public.follows enable row level security;

drop policy if exists "Follows are visible to everyone" on public.follows;
create policy "Follows are visible to everyone"
  on public.follows for select using (true);

drop policy if exists "Users can follow" on public.follows;
create policy "Users can follow"
  on public.follows for insert to authenticated
  with check (auth.uid() = follower_id and follower_id <> following_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete to authenticated
  using (auth.uid() = follower_id);
