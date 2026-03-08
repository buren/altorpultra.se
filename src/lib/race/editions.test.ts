import { describe, it, expect } from "vitest";
import {
  getEditionStatus,
  resolveCurrentEdition,
  mapDbRowToEdition,
  mapEditionToDbRow,
  Edition,
} from "./editions";

function makeEdition(overrides: Partial<Edition> = {}): Edition {
  return {
    year: 2026,
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
    raceIdUrl: "",
    stravaRoute: "",
    googleMaps: {
      startPin: "",
      parkingPin: "",
      routeEmbed: "",
      routeViewer: "",
    },
    publishedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getEditionStatus", () => {
  it("returns 'draft' when publishedAt is null", () => {
    const edition = makeEdition({ publishedAt: null });
    expect(getEditionStatus(edition, new Date("2026-03-01"))).toBe("draft");
  });

  it("returns 'published' when published and endDateTime is in the future", () => {
    const edition = makeEdition();
    const now = new Date("2026-05-09T14:00:00+02:00"); // during race
    expect(getEditionStatus(edition, now)).toBe("published");
  });

  it("returns 'published' when published and endDateTime has not passed", () => {
    const edition = makeEdition();
    const now = new Date("2026-04-01"); // before race
    expect(getEditionStatus(edition, now)).toBe("published");
  });

  it("returns 'completed' when published and endDateTime is in the past", () => {
    const edition = makeEdition();
    const now = new Date("2026-05-10T00:00:00+02:00"); // day after race
    expect(getEditionStatus(edition, now)).toBe("completed");
  });
});

describe("resolveCurrentEdition", () => {
  const edition2025 = makeEdition({
    year: 2025,
    startDateTime: "2025-05-10T10:00:00+02:00",
    endDateTime: "2025-05-10T18:00:00+02:00",
    publishedAt: "2025-01-01T00:00:00Z",
  });
  const edition2026 = makeEdition({
    year: 2026,
    startDateTime: "2026-05-09T10:00:00+02:00",
    endDateTime: "2026-05-09T18:00:00+02:00",
    publishedAt: "2026-01-01T00:00:00Z",
  });
  const edition2027 = makeEdition({
    year: 2027,
    startDateTime: "2027-06-07T10:00:00+02:00",
    endDateTime: "2027-06-07T18:00:00+02:00",
    publishedAt: "2027-01-01T00:00:00Z",
  });

  it("returns null when no editions exist", () => {
    expect(resolveCurrentEdition([], new Date(), 7)).toBeNull();
  });

  it("returns null when all editions are drafts", () => {
    const draft = makeEdition({ publishedAt: null });
    expect(resolveCurrentEdition([draft], new Date(), 7)).toBeNull();
  });

  it("returns the active edition during race day", () => {
    const now = new Date("2026-05-09T14:00:00+02:00");
    const result = resolveCurrentEdition([edition2025, edition2026], now, 7);
    expect(result?.year).toBe(2026);
  });

  it("returns the most recent completed edition when no upcoming exists", () => {
    const now = new Date("2026-08-01"); // months after 2026 race, no 2027
    const result = resolveCurrentEdition([edition2025, edition2026], now, 7);
    expect(result?.year).toBe(2026);
  });

  it("returns next edition when previous has ended even if >7 days before next", () => {
    const now = new Date("2027-05-20"); // 18 days before 2027 race, but 2026 ended
    const result = resolveCurrentEdition(
      [edition2025, edition2026, edition2027],
      now,
      7
    );
    expect(result?.year).toBe(2027);
  });

  it("switches to upcoming edition when within 7 days of start", () => {
    const now = new Date("2027-06-01"); // 6 days before 2027 race
    const result = resolveCurrentEdition(
      [edition2025, edition2026, edition2027],
      now,
      7
    );
    expect(result?.year).toBe(2027);
  });

  it("switches exactly at 7 days boundary", () => {
    // Exactly 7 days before = 2027-05-31T10:00:00+02:00
    const now = new Date("2027-05-31T10:00:00+02:00");
    const result = resolveCurrentEdition(
      [edition2025, edition2026, edition2027],
      now,
      7
    );
    expect(result?.year).toBe(2027);
  });

  it("returns next edition when all past editions have ended", () => {
    const now = new Date("2027-05-30T09:00:00+02:00"); // >7 days but 2026 ended
    const result = resolveCurrentEdition(
      [edition2025, edition2026, edition2027],
      now,
      7
    );
    expect(result?.year).toBe(2027);
  });

  it("ignores draft editions", () => {
    const draft2027 = makeEdition({
      year: 2027,
      startDateTime: "2027-06-07T10:00:00+02:00",
      publishedAt: null,
    });
    const now = new Date("2027-06-01"); // within 7 days but it's a draft
    const result = resolveCurrentEdition(
      [edition2025, edition2026, draft2027],
      now,
      7
    );
    expect(result?.year).toBe(2026);
  });

  it("works with a single published edition", () => {
    const now = new Date("2026-03-01");
    const result = resolveCurrentEdition([edition2026], now, 7);
    expect(result?.year).toBe(2026);
  });
});

describe("mapDbRowToEdition", () => {
  it("maps snake_case DB row to camelCase Edition with nested googleMaps", () => {
    const row = {
      year: 2026,
      date: "2026-05-09",
      start_time: "10:00",
      end_time: "18:00",
      start_date_time: "2026-05-09T10:00:00+02:00",
      end_date_time: "2026-05-09T18:00:00+02:00",
      duration_hours: 8,
      date_formatted: "May 9, 2026",
      price_sek: 300,
      lap_distance_km: 7.0,
      lap_elevation_m: 100,
      race_id_url: "https://example.com",
      strava_route: "https://strava.com/route",
      google_maps_start_pin: "https://maps/start",
      google_maps_parking_pin: "https://maps/parking",
      google_maps_route_embed: "https://maps/embed",
      google_maps_route_viewer: "https://maps/viewer",
      published_at: "2026-01-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
    };

    const edition = mapDbRowToEdition(row);

    expect(edition.year).toBe(2026);
    expect(edition.startTime).toBe("10:00");
    expect(edition.endTime).toBe("18:00");
    expect(edition.startDateTime).toBe("2026-05-09T10:00:00+02:00");
    expect(edition.endDateTime).toBe("2026-05-09T18:00:00+02:00");
    expect(edition.durationHours).toBe(8);
    expect(edition.dateFormatted).toBe("May 9, 2026");
    expect(edition.priceSEK).toBe(300);
    expect(edition.lapDistanceKm).toBe(7.0);
    expect(edition.lapElevationM).toBe(100);
    expect(edition.raceIdUrl).toBe("https://example.com");
    expect(edition.stravaRoute).toBe("https://strava.com/route");
    expect(edition.googleMaps.startPin).toBe("https://maps/start");
    expect(edition.googleMaps.parkingPin).toBe("https://maps/parking");
    expect(edition.googleMaps.routeEmbed).toBe("https://maps/embed");
    expect(edition.googleMaps.routeViewer).toBe("https://maps/viewer");
    expect(edition.publishedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("handles null publishedAt", () => {
    const row = {
      year: 2027,
      date: "2027-06-07",
      start_time: "10:00",
      end_time: "18:00",
      start_date_time: "2027-06-07T10:00:00+02:00",
      end_date_time: "2027-06-07T18:00:00+02:00",
      duration_hours: 8,
      date_formatted: "June 7, 2027",
      price_sek: 300,
      lap_distance_km: 7.0,
      lap_elevation_m: 100,
      race_id_url: "",
      strava_route: "",
      google_maps_start_pin: "",
      google_maps_parking_pin: "",
      google_maps_route_embed: "",
      google_maps_route_viewer: "",
      published_at: null,
      created_at: "2027-01-01T00:00:00Z",
    };

    expect(mapDbRowToEdition(row).publishedAt).toBeNull();
  });
});

describe("mapEditionToDbRow", () => {
  it("maps camelCase Edition to snake_case DB row with flat googleMaps", () => {
    const edition: Edition = {
      year: 2026,
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
      raceIdUrl: "https://example.com",
      stravaRoute: "https://strava.com/route",
      googleMaps: {
        startPin: "https://maps/start",
        parkingPin: "https://maps/parking",
        routeEmbed: "https://maps/embed",
        routeViewer: "https://maps/viewer",
      },
      publishedAt: "2026-01-01T00:00:00Z",
    };

    const row = mapEditionToDbRow(edition);

    expect(row.year).toBe(2026);
    expect(row.start_time).toBe("10:00");
    expect(row.end_time).toBe("18:00");
    expect(row.start_date_time).toBe("2026-05-09T10:00:00+02:00");
    expect(row.end_date_time).toBe("2026-05-09T18:00:00+02:00");
    expect(row.duration_hours).toBe(8);
    expect(row.date_formatted).toBe("May 9, 2026");
    expect(row.price_sek).toBe(300);
    expect(row.lap_distance_km).toBe(7.0);
    expect(row.lap_elevation_m).toBe(100);
    expect(row.race_id_url).toBe("https://example.com");
    expect(row.strava_route).toBe("https://strava.com/route");
    expect(row.google_maps_start_pin).toBe("https://maps/start");
    expect(row.google_maps_parking_pin).toBe("https://maps/parking");
    expect(row.google_maps_route_embed).toBe("https://maps/embed");
    expect(row.google_maps_route_viewer).toBe("https://maps/viewer");
    expect(row.published_at).toBe("2026-01-01T00:00:00Z");
    // Should not include created_at or googleMaps nested object
    expect("googleMaps" in row).toBe(false);
    expect("created_at" in row).toBe(false);
  });
});
