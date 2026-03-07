// ── Year-over-year config ──
// Add a new entry to `editions` each year, then update `currentYear`.

export const currentYear = 2026;

export interface Edition {
  date: string;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
  durationHours: number;
  dateFormatted: string;
  priceSEK: number;
  lapDistanceKm: number;
  lapElevationM: number;
  raceIdUrl: string;
  stravaRoute: string;
  googleMaps: {
    startPin: string;
    parkingPin: string;
    routeEmbed: string;
    routeViewer: string;
  };
}

export const editions: Record<number, Edition> = {
  2025: {
    date: "2025-05-10",
    startTime: "10:00",
    endTime: "18:00",
    startDateTime: "2025-05-10T10:00:00+02:00",
    endDateTime: "2025-05-10T18:00:00+02:00",
    durationHours: 8,
    dateFormatted: "May 10, 2025",
    priceSEK: 200,
    lapDistanceKm: 7.0,
    lapElevationM: 100,
    raceIdUrl: "",
    stravaRoute: "https://www.strava.com/routes/3337146615650736332",
    googleMaps: {
      startPin: "https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9",
      parkingPin: "https://maps.app.goo.gl/UBk2QJHDFteU7duH9",
      routeEmbed: "https://www.google.com/maps/d/embed?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&ehbc=2E312F",
      routeViewer: "https://www.google.com/maps/d/viewer?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&femb=1&ll=59.4162307464269%2C18.07003&z=14",
    },
  },
  2026: {
    date: "2026-05-09",
    startTime: "10:00",
    endTime: "18:00",
    startDateTime: "2026-05-09T10:00:00+02:00",
    endDateTime: "2026-05-09T18:00:00+02:00",
    durationHours: 8,
    dateFormatted: "May 9, 2026",
    priceSEK: 300,
    lapDistanceKm: 7.0,
    lapElevationM: 100,
    raceIdUrl: "https://raceid.com/en/races/14211/registration?distance=26641",
    stravaRoute: "https://www.strava.com/routes/3456172908731637010",
    googleMaps: {
      startPin: "https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9",
      parkingPin: "https://maps.app.goo.gl/UBk2QJHDFteU7duH9",
      routeEmbed: "https://www.google.com/maps/d/embed?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&ehbc=2E312F",
      routeViewer: "https://www.google.com/maps/d/viewer?mid=17KhHxrunD84z9Jz_3hDSuNhpK0fFMZ0&femb=1&ll=59.4162307464269%2C18.07003&z=14",
    },
  },
};

// Current edition shortcut — used by all components
export const event = editions[currentYear];
export const raceIdUrl = event.raceIdUrl;
export const googleMaps = event.googleMaps;

// Stable across all years
export const site = {
  name: "Altorp Ultra",
  location: "Altorp, Djursholm",
  region: "Stockholm",
  email: "altorpultra@gmail.com",
  instagram: "https://www.instagram.com/altorpultra",
  website: "https://altorpultra.se",
} as const;
