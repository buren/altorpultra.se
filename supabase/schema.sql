-- Race tracking schema for Altorp Ultra

create table if not exists runners (
  id uuid primary key default gen_random_uuid(),
  bib integer not null,
  name text not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  notes text,
  edition_year integer not null,
  created_at timestamptz not null default now(),
  unique (bib, edition_year)
);

create table if not exists laps (
  id uuid primary key default gen_random_uuid(),
  runner_id uuid not null references runners(id) on delete cascade,
  lap_number integer not null,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (runner_id, lap_number)
);

-- Index for fast leaderboard queries
create index if not exists idx_laps_runner_id on laps(runner_id);
create index if not exists idx_runners_edition_year on runners(edition_year);

-- Row Level Security
alter table runners enable row level security;
alter table laps enable row level security;

-- Anon users can read (for public leaderboard + realtime)
create policy "Public read runners" on runners
  for select using (true);

create policy "Public read laps" on laps
  for select using (true);

-- Only service_role can insert/update/delete (server-side API routes)
create policy "Service insert runners" on runners
  for insert with check (auth.role() = 'service_role');

create policy "Service update runners" on runners
  for update using (auth.role() = 'service_role');

create policy "Service delete runners" on runners
  for delete using (auth.role() = 'service_role');

create policy "Service insert laps" on laps
  for insert with check (auth.role() = 'service_role');

create policy "Service update laps" on laps
  for update using (auth.role() = 'service_role');

create policy "Service delete laps" on laps
  for delete using (auth.role() = 'service_role');

-- Enable realtime for leaderboard
alter publication supabase_realtime add table laps;
alter publication supabase_realtime add table runners;
