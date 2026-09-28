-- Friends Game Room: run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null,
  status text not null default 'lobby' check (status in ('lobby','countdown','playing','results')),
  game text check (game is null or game in ('reaction','shake','pingpong','tetris','snake')),
  round integer not null default 0 check (round >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 18),
  avatar text not null default '◒' check (char_length(avatar) between 1 and 4),
  joined_at timestamptz not null default now()
);

-- host_id is a logical anonymous player id. It is intentionally not a foreign
-- key because room creation inserts the room and its first player atomically
-- from the browser in two short requests.

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 18),
  message text not null check (char_length(message) between 1 and 240),
  created_at timestamptz not null default now()
);

create table if not exists public.room_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  type text not null check (type in ('start','result')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists room_players_room_id_idx on public.room_players(room_id, joined_at);
create index if not exists room_messages_room_id_idx on public.room_messages(room_id, created_at);
create index if not exists room_events_room_id_idx on public.room_events(room_id, created_at);

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_messages enable row level security;
alter table public.room_events enable row level security;

drop policy if exists rooms_public_read on public.rooms;
create policy rooms_public_read on public.rooms for select to anon, authenticated using (true);
drop policy if exists rooms_public_insert on public.rooms;
create policy rooms_public_insert on public.rooms for insert to anon, authenticated with check (code ~ '^[A-Z0-9]{5}$' and round = 0 and status = 'lobby');
drop policy if exists rooms_public_update on public.rooms;
create policy rooms_public_update on public.rooms for update to anon, authenticated using (true) with check (status in ('lobby','countdown','playing','results'));

drop policy if exists players_public_read on public.room_players;
create policy players_public_read on public.room_players for select to anon, authenticated using (true);
drop policy if exists players_public_insert on public.room_players;
create policy players_public_insert on public.room_players for insert to anon, authenticated with check (char_length(nickname) between 2 and 18 and char_length(avatar) between 1 and 4);
drop policy if exists players_public_delete on public.room_players;
create policy players_public_delete on public.room_players for delete to anon, authenticated using (true);

drop policy if exists messages_public_read on public.room_messages;
create policy messages_public_read on public.room_messages for select to anon, authenticated using (true);
drop policy if exists messages_public_insert on public.room_messages;
create policy messages_public_insert on public.room_messages for insert to anon, authenticated with check (char_length(nickname) between 2 and 18 and char_length(message) between 1 and 240);

drop policy if exists events_public_read on public.room_events;
create policy events_public_read on public.room_events for select to anon, authenticated using (true);
drop policy if exists events_public_insert on public.room_events;
create policy events_public_insert on public.room_events for insert to anon, authenticated with check (type in ('start','result'));

-- Realtime replication for the four shared tables.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.room_messages;
alter publication supabase_realtime add table public.room_events;
