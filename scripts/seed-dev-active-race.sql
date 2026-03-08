-- Dev seed: Active 2026 race with realistic lap data
-- Race: 10:00-18:00 CET on 2026-03-08
-- Designed to be run ~7.5h into the race for interesting ETA data

-- Clear existing 2026 data
DELETE FROM laps WHERE runner_id IN (SELECT id FROM runners WHERE edition_year = 2026);
DELETE FROM runners WHERE edition_year = 2026;

-- Update 2026 edition to today's date
UPDATE editions SET date = '2026-03-08', start_time = '10:00', end_time = '18:00'
WHERE year = 2026;

-- Insert 10 runners with varied paces
INSERT INTO runners (bib, name, gender, edition_year) VALUES
  (1,  'Erik Lindqvist',    'male',   2026),
  (2,  'Oscar Björk',       'male',   2026),
  (3,  'Sara Holm',         'female', 2026),
  (4,  'Magnus Nyström',    'male',   2026),
  (5,  'Linnea Forsberg',   'female', 2026),
  (6,  'Henrik Wallin',     'male',   2026),
  (7,  'Maja Engström',     'female', 2026),
  (8,  'Gustav Sandberg',   'male',   2026),
  (9,  'Frida Lund',        'female', 2026),
  (10, 'Axel Bergman',      'male',   2026);

-- Runner 1: Erik Lindqvist (M) — fast, ~36 min avg, 12 laps
-- Last lap 17:22, next expected ~17:58
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 1,  '2026-03-08T10:35:12+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 2,  '2026-03-08T11:09:47+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 3,  '2026-03-08T11:45:22+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 4,  '2026-03-08T12:21:05+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 5,  '2026-03-08T12:57:41+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 6,  '2026-03-08T13:34:18+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 7,  '2026-03-08T14:11:52+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 8,  '2026-03-08T14:49:03+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 9,  '2026-03-08T15:27:38+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 10, '2026-03-08T16:06:55+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 11, '2026-03-08T16:44:21+01:00'),
  ((SELECT id FROM runners WHERE bib=1 AND edition_year=2026), 12, '2026-03-08T17:22:48+01:00');

-- Runner 2: Oscar Björk (M) — strong, ~40 min avg, 10 laps
-- Last lap 16:52, next expected ~17:33 -> overdue, "any moment"
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 1,  '2026-03-08T10:39:44+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 2,  '2026-03-08T11:18:31+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 3,  '2026-03-08T11:58:12+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 4,  '2026-03-08T12:39:05+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 5,  '2026-03-08T13:20:38+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 6,  '2026-03-08T14:02:22+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 7,  '2026-03-08T14:44:51+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 8,  '2026-03-08T15:28:14+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 9,  '2026-03-08T16:12:03+01:00'),
  ((SELECT id FROM runners WHERE bib=2 AND edition_year=2026), 10, '2026-03-08T16:52:47+01:00');

-- Runner 3: Sara Holm (F) — steady, ~43 min avg, 9 laps
-- Last lap 16:55, next expected ~17:39 -> ~1 min from now
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 1,  '2026-03-08T10:42:18+01:00'),
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 2,  '2026-03-08T11:24:55+01:00'),
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 3,  '2026-03-08T12:08:33+01:00'),
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 4,  '2026-03-08T12:52:07+01:00'),
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 5,  '2026-03-08T13:36:41+01:00'),
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 6,  '2026-03-08T14:21:19+01:00'),
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 7,  '2026-03-08T15:06:28+01:00'),
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 8,  '2026-03-08T15:52:44+01:00'),
  ((SELECT id FROM runners WHERE bib=3 AND edition_year=2026), 9,  '2026-03-08T16:55:10+01:00');

-- Runner 4: Magnus Nyström (M) — average, ~46 min avg, 9 laps
-- Last lap 17:05, next expected ~17:52 -> ~14 min
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 1,  '2026-03-08T10:45:33+01:00'),
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 2,  '2026-03-08T11:30:11+01:00'),
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 3,  '2026-03-08T12:17:48+01:00'),
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 4,  '2026-03-08T13:04:22+01:00'),
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 5,  '2026-03-08T13:52:05+01:00'),
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 6,  '2026-03-08T14:40:37+01:00'),
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 7,  '2026-03-08T15:29:14+01:00'),
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 8,  '2026-03-08T16:18:51+01:00'),
  ((SELECT id FROM runners WHERE bib=4 AND edition_year=2026), 9,  '2026-03-08T17:05:28+01:00');

-- Runner 5: Linnea Forsberg (F) — average, ~48 min avg, 8 laps
-- Last lap 16:30, next expected ~17:19 -> overdue, "any moment"
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=5 AND edition_year=2026), 1,  '2026-03-08T10:47:22+01:00'),
  ((SELECT id FROM runners WHERE bib=5 AND edition_year=2026), 2,  '2026-03-08T11:34:15+01:00'),
  ((SELECT id FROM runners WHERE bib=5 AND edition_year=2026), 3,  '2026-03-08T12:23:41+01:00'),
  ((SELECT id FROM runners WHERE bib=5 AND edition_year=2026), 4,  '2026-03-08T13:12:08+01:00'),
  ((SELECT id FROM runners WHERE bib=5 AND edition_year=2026), 5,  '2026-03-08T14:02:33+01:00'),
  ((SELECT id FROM runners WHERE bib=5 AND edition_year=2026), 6,  '2026-03-08T14:53:47+01:00'),
  ((SELECT id FROM runners WHERE bib=5 AND edition_year=2026), 7,  '2026-03-08T15:44:12+01:00'),
  ((SELECT id FROM runners WHERE bib=5 AND edition_year=2026), 8,  '2026-03-08T16:30:55+01:00');

-- Runner 6: Henrik Wallin (M) — consistent, ~50 min avg, 8 laps
-- Last lap 16:50, next expected ~17:41 -> ~3 min
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=6 AND edition_year=2026), 1,  '2026-03-08T10:49:08+01:00'),
  ((SELECT id FROM runners WHERE bib=6 AND edition_year=2026), 2,  '2026-03-08T11:38:44+01:00'),
  ((SELECT id FROM runners WHERE bib=6 AND edition_year=2026), 3,  '2026-03-08T12:29:21+01:00'),
  ((SELECT id FROM runners WHERE bib=6 AND edition_year=2026), 4,  '2026-03-08T13:20:55+01:00'),
  ((SELECT id FROM runners WHERE bib=6 AND edition_year=2026), 5,  '2026-03-08T14:12:32+01:00'),
  ((SELECT id FROM runners WHERE bib=6 AND edition_year=2026), 6,  '2026-03-08T15:04:18+01:00'),
  ((SELECT id FROM runners WHERE bib=6 AND edition_year=2026), 7,  '2026-03-08T15:57:41+01:00'),
  ((SELECT id FROM runners WHERE bib=6 AND edition_year=2026), 8,  '2026-03-08T16:50:03+01:00');

-- Runner 7: Maja Engström (F) — slower, ~55 min avg, 7 laps
-- Last lap 16:28, next expected ~17:24 -> overdue, "any moment"
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=7 AND edition_year=2026), 1,  '2026-03-08T10:54:16+01:00'),
  ((SELECT id FROM runners WHERE bib=7 AND edition_year=2026), 2,  '2026-03-08T11:48:33+01:00'),
  ((SELECT id FROM runners WHERE bib=7 AND edition_year=2026), 3,  '2026-03-08T12:44:12+01:00'),
  ((SELECT id FROM runners WHERE bib=7 AND edition_year=2026), 4,  '2026-03-08T13:40:45+01:00'),
  ((SELECT id FROM runners WHERE bib=7 AND edition_year=2026), 5,  '2026-03-08T14:37:08+01:00'),
  ((SELECT id FROM runners WHERE bib=7 AND edition_year=2026), 6,  '2026-03-08T15:34:52+01:00'),
  ((SELECT id FROM runners WHERE bib=7 AND edition_year=2026), 7,  '2026-03-08T16:28:19+01:00');

-- Runner 8: Gustav Sandberg (M) — casual, ~60 min avg, 7 laps
-- Last lap 17:08, next expected ~18:09 -> past race end, excluded from ETA
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=8 AND edition_year=2026), 1,  '2026-03-08T10:59:35+01:00'),
  ((SELECT id FROM runners WHERE bib=8 AND edition_year=2026), 2,  '2026-03-08T11:58:22+01:00'),
  ((SELECT id FROM runners WHERE bib=8 AND edition_year=2026), 3,  '2026-03-08T12:58:07+01:00'),
  ((SELECT id FROM runners WHERE bib=8 AND edition_year=2026), 4,  '2026-03-08T14:00:44+01:00'),
  ((SELECT id FROM runners WHERE bib=8 AND edition_year=2026), 5,  '2026-03-08T15:02:31+01:00'),
  ((SELECT id FROM runners WHERE bib=8 AND edition_year=2026), 6,  '2026-03-08T16:04:18+01:00'),
  ((SELECT id FROM runners WHERE bib=8 AND edition_year=2026), 7,  '2026-03-08T17:08:55+01:00');

-- Runner 9: Frida Lund (F) — beginner, ~65 min avg, 6 laps
-- Last lap 16:38, next expected ~17:44 -> ~6 min
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=9 AND edition_year=2026), 1,  '2026-03-08T11:04:28+01:00'),
  ((SELECT id FROM runners WHERE bib=9 AND edition_year=2026), 2,  '2026-03-08T12:08:15+01:00'),
  ((SELECT id FROM runners WHERE bib=9 AND edition_year=2026), 3,  '2026-03-08T13:14:42+01:00'),
  ((SELECT id FROM runners WHERE bib=9 AND edition_year=2026), 4,  '2026-03-08T14:22:11+01:00'),
  ((SELECT id FROM runners WHERE bib=9 AND edition_year=2026), 5,  '2026-03-08T15:30:38+01:00'),
  ((SELECT id FROM runners WHERE bib=9 AND edition_year=2026), 6,  '2026-03-08T16:38:05+01:00');

-- Runner 10: Axel Bergman (M) — DNF after 3 laps, stopped at 12:20
-- Should be filtered as stale (overdue by >2x estimated lap)
INSERT INTO laps (runner_id, lap_number, timestamp) VALUES
  ((SELECT id FROM runners WHERE bib=10 AND edition_year=2026), 1, '2026-03-08T10:45:11+01:00'),
  ((SELECT id FROM runners WHERE bib=10 AND edition_year=2026), 2, '2026-03-08T11:32:44+01:00'),
  ((SELECT id FROM runners WHERE bib=10 AND edition_year=2026), 3, '2026-03-08T12:20:18+01:00');
