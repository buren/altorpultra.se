import { describe, it, expect } from "vitest";
import { findLapAnomalies, AuditConfig } from "./audit";
import { buildLeaderboard } from "./leaderboard";
import { Runner, Lap } from "./types";

function makeRunner(overrides: Partial<Runner> = {}): Runner {
  return {
    id: "r1",
    bib: 1,
    name: "Test Runner",
    gender: "male",
    notes: null,
    edition_year: 2026,
    stopped_at: null,
    ...overrides,
  };
}

function makeLap(runner_id: string, lap_number: number, timestamp: string): Lap {
  return {
    id: `lap-${runner_id}-${lap_number}`,
    runner_id,
    timestamp,
    lap_number,
  };
}

const START = "2026-09-12T08:00:00Z";

// Helper to add seconds to the start datetime as ISO
function at(seconds: number): string {
  return new Date(new Date(START).getTime() + seconds * 1000).toISOString();
}

function makeEntries(runners: Runner[], laps: Lap[]) {
  return buildLeaderboard(runners, laps, 7, 100, START);
}

const allDisabled: AuditConfig = {
  perRunner: { enabled: false, multiplier: 2 },
  absoluteFast: { enabled: false, seconds: 600 },
  absoluteSlow: { enabled: false, seconds: 1800 },
};

describe("findLapAnomalies", () => {
  it("returns empty when no rules enabled", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(1200)),
      makeLap("r1", 3, at(1800)),
    ];
    const entries = makeEntries([runner], laps);
    expect(findLapAnomalies(entries, START, allDisabled)).toEqual([]);
  });

  it("returns empty when all laps within thresholds", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(900)), // 15 min
      makeLap("r1", 2, at(1800)), // 15 min
      makeLap("r1", 3, at(2700)), // 15 min
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      absoluteFast: { enabled: true, seconds: 600 },
      absoluteSlow: { enabled: true, seconds: 1800 },
    });
    expect(result).toEqual([]);
  });

  it("flags lap below absolute fast threshold", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(900)),
      makeLap("r1", 2, at(1000)), // 100s — way too fast
      makeLap("r1", 3, at(1900)),
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      absoluteFast: { enabled: true, seconds: 600 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].lap.lap_number).toBe(2);
    expect(result[0].reasons).toContain("absolute_fast");
    expect(result[0].durationSeconds).toBe(100);
  });

  it("flags lap above absolute slow threshold", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(900)),
      makeLap("r1", 2, at(1800)),
      makeLap("r1", 3, at(5400)), // 60 min — too slow
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      absoluteSlow: { enabled: true, seconds: 1800 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].lap.lap_number).toBe(3);
    expect(result[0].reasons).toContain("absolute_slow");
    expect(result[0].durationSeconds).toBe(3600);
  });

  it("checks lap 1 against race start", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(60)), // 60s from start — too fast
      makeLap("r1", 2, at(960)),
      makeLap("r1", 3, at(1860)),
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      absoluteFast: { enabled: true, seconds: 300 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].lap.lap_number).toBe(1);
    expect(result[0].previousTimestamp).toBeNull();
  });

  it("flags lap >=2x local baseline (per-runner slow)", () => {
    const runner = makeRunner();
    // All neighbors of lap 4 are 600s — lap 4 takes 1800s (3x baseline).
    const laps = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(1200)),
      makeLap("r1", 3, at(1800)),
      makeLap("r1", 4, at(3600)), // 1800s — 3x neighbors
      makeLap("r1", 5, at(4200)),
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 2 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].lap.lap_number).toBe(4);
    expect(result[0].reasons).toContain("runner_slow");
    expect(result[0].runnerBaselineSeconds).toBe(600);
  });

  it("flags lap <median/multiplier (per-runner fast)", () => {
    const runner = makeRunner();
    // Median is 600s. Lap 3 takes 100s (median/6).
    const laps = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(1200)),
      makeLap("r1", 3, at(1300)), // 100s
      makeLap("r1", 4, at(1900)),
      makeLap("r1", 5, at(2500)),
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 2 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].lap.lap_number).toBe(3);
    expect(result[0].reasons).toContain("runner_fast");
  });

  it("skips per-runner check when runner has fewer than 3 laps", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(10000)), // huge gap — but only 2 laps total
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 2 },
    });
    expect(result).toEqual([]);
  });

  it("still applies absolute rules for runners with <3 laps", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(10000)), // 9400s — exceeds absolute slow
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 2 },
      absoluteSlow: { enabled: true, seconds: 1800 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].reasons).toEqual(["absolute_slow"]);
  });

  it("merges multiple reasons on the same lap", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(1200)),
      makeLap("r1", 3, at(1800)),
      makeLap("r1", 4, at(7200)), // 5400s: >absolute slow AND >2x median
      makeLap("r1", 5, at(7800)),
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 2 },
      absoluteSlow: { enabled: true, seconds: 1800 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].reasons).toEqual(
      expect.arrayContaining(["runner_slow", "absolute_slow"])
    );
  });

  it("sorts anomalies by severity (largest deviation first)", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(3000)), // 2400s — 4x median (most severe)
      makeLap("r1", 3, at(3600)), // 600s
      makeLap("r1", 4, at(5400)), // 1800s — 3x median
      makeLap("r1", 5, at(6000)),
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 2 },
    });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].lap.lap_number).toBe(2);
    expect(result[1].lap.lap_number).toBe(4);
  });

  it("handles multiple runners independently", () => {
    const r1 = makeRunner({ id: "r1", bib: 1 });
    const r2 = makeRunner({ id: "r2", bib: 2, name: "Other" });
    // r1 median ~600s, has slow outlier
    const lapsR1 = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(1200)),
      makeLap("r1", 3, at(1800)),
      makeLap("r1", 4, at(3600)),
      makeLap("r1", 5, at(4200)),
    ];
    // r2 median ~1500s, all consistent
    const lapsR2 = [
      makeLap("r2", 1, at(1500)),
      makeLap("r2", 2, at(3000)),
      makeLap("r2", 3, at(4500)),
      makeLap("r2", 4, at(6000)),
    ];
    const entries = makeEntries([r1, r2], [...lapsR1, ...lapsR2]);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 2 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].runner.id).toBe("r1");
    expect(result[0].lap.lap_number).toBe(4);
  });

  it("populates previousTimestamp for non-first laps", () => {
    const runner = makeRunner();
    const laps = [
      makeLap("r1", 1, at(600)),
      makeLap("r1", 2, at(700)), // 100s — too fast
    ];
    const entries = makeEntries([runner], laps);
    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      absoluteFast: { enabled: true, seconds: 600 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].previousTimestamp).toBe(at(600));
  });

  it("flags an impossibly fast last lap and not its slow neighbor (Robert pattern)", () => {
    // Real-world durations from bib #10 in 2026 edition (in seconds):
    // 2624, 2990, 3079, 2891, 3174, 3256, 296
    // Lap 7 = 4:56 is the actual fast outlier. Lap 6 = 54:16 should NOT be
    // flagged: previously the drop-max baseline rule made lap 7's 4:56 the
    // dominant value in lap 6's window, causing a false "slow vs runner" flag.
    const runner = makeRunner();
    const cumulative = [0, 2624, 5614, 8693, 11584, 14758, 18014, 18310];
    const laps = cumulative
      .slice(1)
      .map((sec, idx) => makeLap("r1", idx + 1, at(sec)));
    const entries = makeEntries([runner], laps);

    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 1.8 },
    });

    expect(result.map((a) => a.lap.lap_number)).toEqual([7]);
    expect(result[0].reasons).toContain("runner_fast");
  });

  it("local baseline catches a missed lap that global median would miss (Filip pattern)", () => {
    // Real-world durations from bib #17 in 2026 edition (in minutes):
    // 36:05, 36:55, 39:08, 78:35 (missed lap), 47:01, 49:10, 53:48, 61:14, 56:13
    // Pace drift from fatigue inflates the global median, masking the missed lap.
    // Global median = 49:10s. Lap 4 / global median ≈ 1.60 (would NOT trigger at 1.7x).
    // Local baseline (median of laps 2,3,5,6) ≈ 43:05. Lap 4 / local ≈ 1.82 (DOES trigger).
    const runner = makeRunner();
    const cumulative = [0, 2165, 4380, 6728, 11443, 14264, 17214, 20442, 24117, 27490];
    const laps = cumulative
      .slice(1)
      .map((sec, idx) => makeLap("r1", idx + 1, at(sec)));
    const entries = makeEntries([runner], laps);

    const result = findLapAnomalies(entries, START, {
      ...allDisabled,
      perRunner: { enabled: true, multiplier: 1.7 },
    });

    const flagged = result.find((a) => a.lap.lap_number === 4);
    expect(flagged).toBeDefined();
    expect(flagged!.reasons).toContain("runner_slow");
    // Sanity: at the same multiplier, no other laps should be flagged for this runner.
    expect(result.every((a) => a.lap.lap_number === 4)).toBe(true);
  });
});
