-- BabiGames authentication + cloud scores
-- Run this in Supabase SQL Editor, then enable Email auth.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_key
  on public.profiles (lower(username));

create table if not exists public.scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in (
    'snake','minesweeper','chess','checkers',
    'connect4','2048','memory','tetris'
  )),
  best_score bigint not null check (best_score >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);

alter table public.profiles enable row level security;
alter table public.scores enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "scores_select_own" on public.scores;
create policy "scores_select_own" on public.scores
  for select using (auth.uid() = user_id);

drop policy if exists "scores_insert_own" on public.scores;
create policy "scores_insert_own" on public.scores
  for insert with check (auth.uid() = user_id);

drop policy if exists "scores_update_own" on public.scores;
create policy "scores_update_own" on public.scores
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      split_part(coalesce(new.email, 'joueur'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
