-- Race tracking schema for Altorp Ultra

create table if not exists editions (
  year integer primary key,
  date text not null,
  start_time text not null,
  end_time text not null,
  start_date_time timestamptz not null,
  end_date_time timestamptz not null,
  duration_hours integer not null,
  date_formatted text not null,
  price_sek integer not null,
  lap_distance_km numeric not null,
  lap_elevation_m integer not null,
  race_id_url text not null default '',
  strava_route text not null default '',
  google_maps_start_pin text not null default '',
  google_maps_parking_pin text not null default '',
  google_maps_route_embed text not null default '',
  google_maps_route_viewer text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists runners (
  id uuid primary key default gen_random_uuid(),
  bib integer not null,
  name text not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  notes text,
  edition_year integer not null references editions(year),
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

-- RLS is disabled. All writes go through the service_role key (server-side API
-- routes with admin password auth). The anon key is only used client-side for
-- realtime subscriptions. With RLS disabled, realtime broadcasts all changes
-- to all subscribers without per-subscriber policy checks.

-- Enable realtime for leaderboard
alter publication supabase_realtime add table laps;
alter publication supabase_realtime add table runners;

-- Seed editions
insert into editions (year, date, start_time, end_time, start_date_time, end_date_time, duration_hours, date_formatted, price_sek, lap_distance_km, lap_elevation_m, race_id_url, strava_route, google_maps_start_pin, google_maps_parking_pin, google_maps_route_embed, google_maps_route_viewer, published_at)
values
  (2025, '2025-05-10', '10:00', '18:00', '2025-05-10T10:00:00+02:00', '2025-05-10T18:00:00+02:00', 8, 'May 10, 2025', 200, 7.0, 100, '', 'https://www.strava.com/routes/3337146615650736332', 'https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9', 'https://maps.app.goo.gl/UBk2QJHDFteU7duH9', 'https://www.google.com/maps/d/embed?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&ehbc=2E312F', 'https://www.google.com/maps/d/viewer?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&femb=1&ll=59.4162307464269%2C18.07003&z=14', now()),
  (2026, '2026-05-09', '10:00', '18:00', '2026-05-09T10:00:00+02:00', '2026-05-09T18:00:00+02:00', 8, 'May 9, 2026', 300, 7.0, 100, 'https://raceid.com/en/races/14211/registration?distance=26641', 'https://www.strava.com/routes/3456172908731637010', 'https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9', 'https://maps.app.goo.gl/UBk2QJHDFteU7duH9', 'https://www.google.com/maps/d/embed?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&ehbc=2E312F', 'https://www.google.com/maps/d/viewer?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&femb=1&ll=59.4162307464269%2C18.07003&z=14', now())
on conflict (year) do nothing;
