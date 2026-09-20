-- Folester tipping ledger and leaderboard support. Run after schema.sql.
-- A row is written by the client after Nimiq Hub reports a completed checkout.

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(20, 5) not null check (amount > 0),
  tx_hash text,
  created_at timestamptz not null default now(),
  constraint tips_different_users check (sender_id <> receiver_id)
);

alter table public.tips add column if not exists tx_hash text;

create index if not exists tips_receiver_id_idx on public.tips (receiver_id);
create index if not exists tips_sender_id_idx on public.tips (sender_id);

alter table public.tips enable row level security;

drop policy if exists "Tips are visible to everyone" on public.tips;
create policy "Tips are visible to everyone"
  on public.tips for select using (true);
drop policy if exists "Users can record their own tips" on public.tips;
create policy "Users can record their own tips"
  on public.tips for insert to authenticated
  with check (auth.uid() = sender_id and sender_id <> receiver_id);
