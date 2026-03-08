import { TIMEZONE } from "@/lib/config";

/**
 * Build an ISO 8601 string with the correct Stockholm offset for a given date/time.
 * e.g. ("2026-05-09", "10:00") -> "2026-05-09T10:00:00+02:00"
 */
export function toStockholmISO(date: string, time: string): string {
  // Parse the date in Stockholm timezone to determine the correct UTC offset
  const dt = new Date(`${date}T${time}:00`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    timeZoneName: "longOffset",
  });
  const parts = formatter.formatToParts(dt);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const offset = tzPart.replace("GMT", "") || "+00:00";
  return `${date}T${time}:00${offset}`;
}

/**
 * Format a date string like "2026-05-09" to "May 9, 2026".
 */
export function formatEditionDate(date: string): string {
  const dt = new Date(`${date}T12:00:00`); // noon to avoid timezone edge issues
  return dt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TIMEZONE,
  });
}

/**
 * Compute duration in hours between two ISO datetime strings.
 */
export function computeDurationHours(startISO: string, endISO: string): number {
  return Math.round(
    (new Date(endISO).getTime() - new Date(startISO).getTime()) / (1000 * 60 * 60)
  );
}

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
  kidsRaceStartedAt: string | null;
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

  // Find any currently active edition (started but not yet ended)
  const active = sorted.find(
    (e) =>
      new Date(e.startDateTime).getTime() <= nowMs &&
      new Date(e.endDateTime).getTime() > nowMs
  );
  if (active) return active;

  // Find the next upcoming edition (hasn't started yet)
  const upcoming = sorted.find(
    (e) => new Date(e.startDateTime).getTime() > nowMs
  );

  // If all past editions have ended and there's an upcoming one, use it
  const allPastEnded = sorted
    .filter((e) => new Date(e.startDateTime).getTime() <= nowMs)
    .every((e) => new Date(e.endDateTime).getTime() <= nowMs);

  if (upcoming && allPastEnded) return upcoming;

  // If there's an upcoming edition within the switch window, show it
  if (upcoming) {
    const msUntilStart = new Date(upcoming.startDateTime).getTime() - nowMs;
    if (msUntilStart <= switchMs) return upcoming;
  }

  // Otherwise return the most recent past edition
  const pastOrActive = sorted.filter(
    (e) => new Date(e.startDateTime).getTime() <= nowMs
  );

  if (pastOrActive.length > 0) return pastOrActive[pastOrActive.length - 1];

  // All editions are in the future but outside the switch window — show the nearest
  return sorted[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbRowToEdition(row: any): Edition {
  const startDateTime = toStockholmISO(row.date, row.start_time);
  const endDateTime = toStockholmISO(row.date, row.end_time);
  return {
    year: row.year,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    startDateTime,
    endDateTime,
    durationHours: computeDurationHours(startDateTime, endDateTime),
    dateFormatted: formatEditionDate(row.date),
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
    kidsRaceStartedAt: row.kids_race_started_at ?? null,
  };
}

// Fields that are computed from date/startTime/endTime — not stored in the DB.
export const DERIVED_EDITION_FIELDS = new Set([
  "startDateTime",
  "endDateTime",
  "durationHours",
  "dateFormatted",
]);

export function mapEditionToDbRow(edition: Edition) {
  return {
    year: edition.year,
    date: edition.date,
    start_time: edition.startTime,
    end_time: edition.endTime,
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
    kids_race_started_at: edition.kidsRaceStartedAt,
  };
}
