export interface Edition {
  year: number;
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
  publishedAt: string | null;
}

export type EditionStatus = "draft" | "published" | "completed";

export function getEditionStatus(edition: Edition, now: Date): EditionStatus {
  if (edition.publishedAt === null) return "draft";
  if (new Date(edition.endDateTime).getTime() < now.getTime()) return "completed";
  return "published";
}

export function resolveCurrentEdition(
  editions: Edition[],
  now: Date,
  daysBeforeSwitch: number
): Edition | null {
  const published = editions.filter((e) => e.publishedAt !== null);
  if (published.length === 0) return null;

  // Sort by year ascending for consistent processing
  const sorted = [...published].sort((a, b) => a.year - b.year);

  const switchMs = daysBeforeSwitch * 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();

  // Find the next upcoming edition (hasn't ended yet)
  const upcoming = sorted.find(
    (e) => new Date(e.startDateTime).getTime() > nowMs
  );

  // If there's an upcoming edition and we're within the switch window, show it
  if (upcoming) {
    const msUntilStart = new Date(upcoming.startDateTime).getTime() - nowMs;
    if (msUntilStart <= switchMs) return upcoming;
  }

  // Otherwise return the most recent past/active edition
  // (the last one whose startDateTime <= now, or if none, the earliest overall)
  const pastOrActive = sorted.filter(
    (e) => new Date(e.startDateTime).getTime() <= nowMs
  );

  if (pastOrActive.length > 0) return pastOrActive[pastOrActive.length - 1];

  // All editions are in the future but outside the switch window — show the nearest
  return sorted[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbRowToEdition(row: any): Edition {
  return {
    year: row.year,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    startDateTime: row.start_date_time,
    endDateTime: row.end_date_time,
    durationHours: row.duration_hours,
    dateFormatted: row.date_formatted,
    priceSEK: row.price_sek,
    lapDistanceKm: row.lap_distance_km,
    lapElevationM: row.lap_elevation_m,
    raceIdUrl: row.race_id_url,
    stravaRoute: row.strava_route,
    googleMaps: {
      startPin: row.google_maps_start_pin,
      parkingPin: row.google_maps_parking_pin,
      routeEmbed: row.google_maps_route_embed,
      routeViewer: row.google_maps_route_viewer,
    },
    publishedAt: row.published_at,
  };
}

export function mapEditionToDbRow(edition: Edition) {
  return {
    year: edition.year,
    date: edition.date,
    start_time: edition.startTime,
    end_time: edition.endTime,
    start_date_time: edition.startDateTime,
    end_date_time: edition.endDateTime,
    duration_hours: edition.durationHours,
    date_formatted: edition.dateFormatted,
    price_sek: edition.priceSEK,
    lap_distance_km: edition.lapDistanceKm,
    lap_elevation_m: edition.lapElevationM,
    race_id_url: edition.raceIdUrl,
    strava_route: edition.stravaRoute,
    google_maps_start_pin: edition.googleMaps.startPin,
    google_maps_parking_pin: edition.googleMaps.parkingPin,
    google_maps_route_embed: edition.googleMaps.routeEmbed,
    google_maps_route_viewer: edition.googleMaps.routeViewer,
    published_at: edition.publishedAt,
  };
}
