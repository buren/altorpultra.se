// ── Year-over-year config ──
// Update these values each year. Everything else derives from them.

export const currentYear = 2026;

export const event = {
  name: "Altorp Ultra",
  date: "2026-05-09",
  startTime: "10:00",
  endTime: "18:00",
  startDateTime: "2026-05-09T10:00:00+02:00",
  endDateTime: "2026-05-09T18:00:00+02:00",
  durationHours: 8,
  dateFormatted: "May 9, 2026",
  location: "Altorp, Djursholm",
  region: "Stockholm",
  priceSEK: 300,
  lapDistanceKm: 7.0,
  lapElevationM: 100,
  email: "altorpultra@gmail.com",
  instagram: "https://www.instagram.com/altorpultra",
  website: "https://altorpultra.se",
} as const;

export const raceIdUrl = "https://raceid.com/en/races/14211/registration?distance=26641";

export const stravaRoutes: Record<number, string> = {
  2025: "https://www.strava.com/routes/3337146615650736332",
  2026: "https://www.strava.com/routes/3456172908731637010",
};

export const googleMaps = {
  startPin: "https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9",
  parkingPin: "https://maps.app.goo.gl/UBk2QJHDFteU7duH9",
  routeEmbed: "https://www.google.com/maps/d/embed?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&ehbc=2E312F",
  routeViewer: "https://www.google.com/maps/d/viewer?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&femb=1&ll=59.4162307464269%2C18.07003&z=14",
} as const;
