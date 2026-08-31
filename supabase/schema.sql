-- Folester database schema. Run this once in the Supabase SQL Editor.
-- It includes row-level security policies required by the React client.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  bio text not null default '',
  avatar_url text
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  topic text not null default '' check (char_length(topic) <= 80),
  coin_tag text not null default '' check (char_length(coin_tag) <= 32),
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.callouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  thesis text not null check (char_length(trim(thesis)) between 1 and 10000),
  sources text not null default '' check (char_length(sources) <= 10000),
  coin_tag text not null default '' check (char_length(coin_tag) <= 32),
  media_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists callouts_created_at_idx on public.callouts (created_at desc);

-- A profile is created transactionally with every new account. Username is passed
-- through auth metadata by the signup form and remains nullable if omitted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'username'), ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.callouts enable row level security;

create policy "Profiles are visible to everyone"
  on public.profiles for select using (true);
create policy "Users can update their profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Posts are visible to everyone"
  on public.posts for select using (true);
create policy "Authenticated users can publish posts"
  on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their posts"
  on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their posts"
  on public.posts for delete to authenticated using (auth.uid() = user_id);

create policy "Callouts are visible to everyone"
  on public.callouts for select using (true);
create policy "Authenticated users can publish callouts"
  on public.callouts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their callouts"
  on public.callouts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their callouts"
  on public.callouts for delete to authenticated using (auth.uid() = user_id);
