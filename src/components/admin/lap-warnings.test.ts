import { describe, it, expect } from "vitest";
import { findRecentLapWarning } from "./lap-warnings";

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
