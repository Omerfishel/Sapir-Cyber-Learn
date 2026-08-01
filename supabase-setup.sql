-- Sapir Cyber Learn — contest schema. Run once in Supabase → SQL Editor → New query → Run.

create table if not exists public.players (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text        not null default 'Anonymous',
  done       int         not null default 0,
  hours      numeric     not null default 0,
  pct        int         not null default 0,
  streak     int         not null default 0,
  state      jsonb,
  updated_at timestamptz not null default now()
);

alter table public.players enable row level security;

-- Each user can read & write ONLY their own row. This keeps every player's
-- private `state` (their notes/progress) invisible to everyone else.
drop policy if exists "players read own"   on public.players;
drop policy if exists "players insert own" on public.players;
drop policy if exists "players update own" on public.players;
create policy "players read own"   on public.players for select using (auth.uid() = id);
create policy "players insert own" on public.players for insert with check (auth.uid() = id);
create policy "players update own" on public.players for update using (auth.uid() = id) with check (auth.uid() = id);

-- Public leaderboard = SAFE columns only (no `state`), readable by every signed-in user.
-- This view intentionally runs with definer rights so everyone can see the ranking,
-- while the base table above stays private per-user.
create or replace view public.leaderboard as
  select id, name, done, hours, pct, streak, updated_at
  from public.players;

grant select on public.leaderboard to authenticated;
