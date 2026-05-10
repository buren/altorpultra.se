import { describe, it, expect } from "vitest";
import {
  formatDistanceKm,
  formatLapTime,
  formatTimestamp,
  formatTimeAgo,
  formatLastCompleted,
} from "./format";

describe("formatDistanceKm", () => {
  it("rounds away floating-point noise from laps × lapDistance", () => {
    expect(formatDistanceKm(9 * 7.31)).toBe("65.79");
    expect(formatDistanceKm(7 * 7.31)).toBe("51.17");
  });

  it("trims trailing zeros", () => {
    expect(formatDistanceKm(73.1)).toBe("73.1");
    expect(formatDistanceKm(70)).toBe("70");
  });

  it("preserves up to two decimals", () => {
    expect(formatDistanceKm(80.41)).toBe("80.41");
  });
});

describe("formatLapTime", () => {
  it("formats seconds into MM:SS", () => {
    expect(formatLapTime(2700)).toBe("45:00");
    expect(formatLapTime(2400)).toBe("40:00");
    expect(formatLapTime(3661)).toBe("61:01");
  });

  it("returns dash for null", () => {
    expect(formatLapTime(null)).toBe("–");
  });

  it("handles sub-minute times", () => {
    expect(formatLapTime(45)).toBe("0:45");
  });
});

describe("formatTimestamp", () => {
  it("formats ISO timestamp to HH:MM:SS local time string", () => {
    // We test the output format, not the exact value (timezone-dependent)
    const result = formatTimestamp("2026-05-09T10:30:00+02:00");
    expect(result).toMatch(/^\d{1,2}:\d{2}:\d{2}$/);
  });

  it("returns dash for null", () => {
    expect(formatTimestamp(null)).toBe("–");
  });
});

describe("formatTimeAgo", () => {
  it("returns 'just now' for < 60 seconds", () => {
    const now = new Date("2026-05-09T10:00:30+02:00");
    expect(formatTimeAgo("2026-05-09T10:00:00+02:00", now)).toBe("just now");
  });

  it("returns minutes for < 60 minutes", () => {
    const now = new Date("2026-05-09T10:05:00+02:00");
    expect(formatTimeAgo("2026-05-09T10:00:00+02:00", now)).toBe("5 min ago");
  });

  it("returns hours and minutes for >= 60 minutes", () => {
    const now = new Date("2026-05-09T11:30:00+02:00");
    expect(formatTimeAgo("2026-05-09T10:00:00+02:00", now)).toBe("1h 30m ago");
  });

  it("returns dash for null", () => {
    expect(formatTimeAgo(null, new Date())).toBe("–");
  });
});

describe("formatLastCompleted", () => {
  it("returns 'just now' for < 1 minute", () => {
    const now = new Date("2026-05-09T10:00:30+02:00");
    expect(formatLastCompleted("2026-05-09T10:00:00+02:00", now)).toBe("just now");
  });

  it("returns minutes for < 60 minutes", () => {
    const now = new Date("2026-05-09T10:25:00+02:00");
    expect(formatLastCompleted("2026-05-09T10:00:00+02:00", now)).toBe("25 min ago");
  });

  it("returns HH:MM for >= 60 minutes", () => {
    const now = new Date("2026-05-09T12:00:00+02:00");
    const result = formatLastCompleted("2026-05-09T10:00:00+02:00", now);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("returns dash for null", () => {
    expect(formatLastCompleted(null, new Date())).toBe("–");
  });
});
