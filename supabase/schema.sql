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

-- Enable realtime for leaderboard
alter publication supabase_realtime add table laps;
alter publication supabase_realtime add table runners;
