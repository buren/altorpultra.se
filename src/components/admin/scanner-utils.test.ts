import { describe, it, expect } from "vitest";
import {
  parseBibFromQr,
  isDebounced,
  shouldShowDuplicateDialog,
  findRecentLapWarning,
} from "./scanner-utils";

describe("parseBibFromQr", () => {
  it("parses a valid integer string", () => {
    expect(parseBibFromQr("42")).toBe(42);
  });

  it("returns null for non-numeric text", () => {
    expect(parseBibFromQr("abc")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseBibFromQr("")).toBeNull();
  });

  it("returns null for floating point", () => {
    expect(parseBibFromQr("3.14")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(parseBibFromQr("  7  ")).toBe(7);
  });
});

describe("isDebounced", () => {
  it("returns true for same bib within 1s", () => {
    const now = 10_000;
    expect(isDebounced({ bib: 5, time: 9_500 }, 5, now)).toBe(true);
  });

  it("returns false for same bib after 1s", () => {
    const now = 11_001;
    expect(isDebounced({ bib: 5, time: 10_000 }, 5, now)).toBe(false);
  });

  it("returns false for different bib", () => {
    const now = 10_000;
    expect(isDebounced({ bib: 5, time: 9_900 }, 6, now)).toBe(false);
  });

  it("returns false when no previous decode", () => {
    expect(isDebounced(null, 5, 10_000)).toBe(false);
  });
});

describe("shouldShowDuplicateDialog", () => {
  const WINDOW = 25 * 60 * 1_000; // 25 min

  it("returns true for same bib within 25 min", () => {
    const scans = new Map([[42, 0]]);
    expect(shouldShowDuplicateDialog(scans, 42, WINDOW - 1)).toBe(true);
  });

  it("returns false for same bib after 25 min", () => {
    const scans = new Map([[42, 0]]);
    expect(shouldShowDuplicateDialog(scans, 42, WINDOW + 1)).toBe(false);
  });

  it("returns false for unseen bib", () => {
    const scans = new Map<number, number>();
    expect(shouldShowDuplicateDialog(scans, 42, 10_000)).toBe(false);
  });
});

describe("findRecentLapWarning", () => {
  const WINDOW = 35 * 60 * 1_000; // 35 min

  it("returns null when there is no last lap", () => {
    expect(findRecentLapWarning(null, 10_000)).toBeNull();
  });

  it("returns secondsAgo when last lap is within 35 min", () => {
    const lastLap = new Date(0).toISOString();
    const now = WINDOW - 60_000; // 34 min after
    expect(findRecentLapWarning(lastLap, now)).toEqual({
      secondsAgo: Math.round((WINDOW - 60_000) / 1000),
    });
  });

  it("returns null when last lap is exactly at the boundary", () => {
    const lastLap = new Date(0).toISOString();
    expect(findRecentLapWarning(lastLap, WINDOW)).toBeNull();
  });

  it("returns null when last lap is more than 35 min ago", () => {
    const lastLap = new Date(0).toISOString();
    expect(findRecentLapWarning(lastLap, WINDOW + 1_000)).toBeNull();
  });

  it("returns null for a future timestamp (defensive)", () => {
    const lastLap = new Date(10_000).toISOString();
    expect(findRecentLapWarning(lastLap, 0)).toBeNull();
  });

  it("returns null for an unparseable timestamp", () => {
    expect(findRecentLapWarning("not-a-date", 10_000)).toBeNull();
  });
});
