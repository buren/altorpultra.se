-- Seed data for local development

insert into editions (year, date, start_time, end_time, start_date_time, end_date_time, duration_hours, date_formatted, price_sek, lap_distance_km, lap_elevation_m, race_id_url, strava_route, google_maps_start_pin, google_maps_parking_pin, google_maps_route_embed, google_maps_route_viewer, published_at)
values
  (2025, '2025-05-10', '10:00', '18:00', '2025-05-10T10:00:00+02:00', '2025-05-10T18:00:00+02:00', 8, 'May 10, 2025', 200, 7.0, 100, '', 'https://www.strava.com/routes/3337146615650736332', 'https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9', 'https://maps.app.goo.gl/UBk2QJHDFteU7duH9', 'https://www.google.com/maps/d/embed?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&ehbc=2E312F', 'https://www.google.com/maps/d/viewer?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&femb=1&ll=59.4162307464269%2C18.07003&z=14', now()),
  (2026, '2026-05-09', '10:00', '18:00', '2026-05-09T10:00:00+02:00', '2026-05-09T18:00:00+02:00', 8, 'May 9, 2026', 300, 7.0, 100, 'https://raceid.com/en/races/14211/registration?distance=26641', 'https://www.strava.com/routes/3456172908731637010', 'https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9', 'https://maps.app.goo.gl/UBk2QJHDFteU7duH9', 'https://www.google.com/maps/d/embed?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&ehbc=2E312F', 'https://www.google.com/maps/d/viewer?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&femb=1&ll=59.4162307464269%2C18.07003&z=14', now())
on conflict (year) do nothing;

-- Sample runners for 2026
insert into runners (bib, name, gender, edition_year) values
  (1, 'Alice Andersson', 'female', 2026),
  (2, 'Bob Bergström', 'male', 2026),
  (3, 'Charlie Carlsson', 'male', 2026),
  (4, 'Diana Dahl', 'female', 2026),
  (5, 'Erik Eriksson', 'male', 2026)
on conflict (bib, edition_year) do nothing;
