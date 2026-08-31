-- Folester Phase 3.5: social mechanics and discovery
-- Run this after supabase/schema.sql in the Supabase SQL Editor.

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  callout_id uuid references public.callouts(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_exactly_one_target check (num_nonnulls(post_id, callout_id) = 1)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  callout_id uuid references public.callouts(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint comments_exactly_one_target check (num_nonnulls(post_id, callout_id) = 1)
);

-- PostgreSQL considers NULL values distinct in a normal unique constraint, so
-- partial indexes enforce one like per user for each possible target type.
create unique index if not exists likes_user_post_unique_idx
  on public.likes (user_id, post_id) where post_id is not null;
create unique index if not exists likes_user_callout_unique_idx
  on public.likes (user_id, callout_id) where callout_id is not null;
create index if not exists likes_post_id_idx on public.likes (post_id) where post_id is not null;
create index if not exists likes_callout_id_idx on public.likes (callout_id) where callout_id is not null;
create index if not exists comments_post_created_at_idx on public.comments (post_id, created_at asc) where post_id is not null;
create index if not exists comments_callout_created_at_idx on public.comments (callout_id, created_at asc) where callout_id is not null;

alter table public.likes enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Likes are visible to everyone" on public.likes;
create policy "Likes are visible to everyone"
  on public.likes for select using (true);
drop policy if exists "Users can create their own likes" on public.likes;
create policy "Users can create their own likes"
  on public.likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can remove their own likes" on public.likes;
create policy "Users can remove their own likes"
  on public.likes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Comments are visible to everyone" on public.comments;
create policy "Comments are visible to everyone"
  on public.comments for select using (true);
drop policy if exists "Users can create their own comments" on public.comments;
create policy "Users can create their own comments"
  on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments"
  on public.comments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete to authenticated using (auth.uid() = user_id);
