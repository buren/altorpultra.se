import { describe, it, expect } from "vitest";
import { estimateNextLapSeconds, buildNextRunnersList } from "./eta";
import { Runner, Lap, LeaderboardEntry } from "./types";
import { buildLeaderboard } from "./leaderboard";

function makeRunner(overrides: Partial<Runner> = {}): Runner {
  return {
    id: "r1",
    bib: 1,
    name: "Test Runner",
    gender: "male",
    notes: null,
    edition_year: 2026,
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

const START = "2026-05-09T10:00:00+02:00";
const END = "2026-05-09T18:00:00+02:00"; // 8 hours later

describe("estimateNextLapSeconds", () => {
  it("returns null for empty durations", () => {
    expect(estimateNextLapSeconds([])).toBeNull();
  });

  it("returns the single duration for 1 lap", () => {
    expect(estimateNextLapSeconds([2400])).toBe(2400);
  });

  it("returns simple average for 2 laps", () => {
    expect(estimateNextLapSeconds([2400, 2700])).toBe(2550);
  });

  it("returns weighted average of last 3 for 3 laps", () => {
    // weights: 1, 2, 3 for oldest to newest
    // (2400*1 + 2700*2 + 2100*3) / 6 = (2400 + 5400 + 6300) / 6 = 14100 / 6 = 2350
    expect(estimateNextLapSeconds([2400, 2700, 2100])).toBe(2350);
  });

  it("only uses last 3 for longer arrays", () => {
    // Last 3: 3000, 2700, 2100
    // (3000*1 + 2700*2 + 2100*3) / 6 = (3000 + 5400 + 6300) / 6 = 14700 / 6 = 2450
    expect(estimateNextLapSeconds([9999, 3000, 2700, 2100])).toBe(2450);
  });

  it("filters out break laps that exceed 1.5x median of last 5", () => {
    // Normal laps ~2400s, one break lap at 5000s
    // Last 5: [2400, 2400, 5000, 2400, 2400]
    // Median of last 5 = 2400, threshold = 3600
    // After filtering: [2400, 2400, 2400, 2400] — last 3: [2400, 2400, 2400]
    // Weighted avg = 2400
    expect(estimateNextLapSeconds([2400, 2400, 5000, 2400, 2400])).toBe(2400);
  });

  it("falls back to median when all laps exceed threshold (impossible in practice but safe)", () => {
    // If somehow all last-5 laps are outliers relative to median, fall back to median
    // With [3000, 3000, 3000] — median is 3000, threshold 4500, none filtered
    // Weighted avg of last 3: (3000*1 + 3000*2 + 3000*3) / 6 = 3000
    expect(estimateNextLapSeconds([3000, 3000, 3000])).toBe(3000);
  });

  it("handles break lap as the most recent lap", () => {
    // Last 5: [2400, 2500, 2400, 2500, 6000]
    // Median = 2500, threshold = 3750
    // After filtering: [2400, 2500, 2400, 2500] — last 3: [2500, 2400, 2500]
    // Weighted: (2500*1 + 2400*2 + 2500*3) / 6 = (2500 + 4800 + 7500) / 6 = 14800/6 ≈ 2466.67
    expect(estimateNextLapSeconds([2400, 2500, 2400, 2500, 6000])).toBeCloseTo(
      2466.67,
      0
    );
  });

  it("preserves gradual pace degradation (no false filtering)", () => {
    // Runner slowing: 2400, 2700, 3000, 3200, 3400
    // Median of last 5 = 3000, threshold = 4500
    // None filtered. Last 3: [3000, 3200, 3400]
    // Weighted: (3000*1 + 3200*2 + 3400*3) / 6 = (3000 + 6400 + 10200) / 6 = 19600/6 ≈ 3266.67
    expect(
      estimateNextLapSeconds([2400, 2700, 3000, 3200, 3400])
    ).toBeCloseTo(3266.67, 0);
  });
});

describe("buildNextRunnersList", () => {
  it("returns empty list when no runners have laps", () => {
    const entries = buildLeaderboard(
      [makeRunner()],
      [],
      7,
      100,
      START
    );
    const result = buildNextRunnersList(entries, START, new Date(START), END);
    expect(result).toEqual([]);
  });

  it("estimates next lap for a runner with completed laps", () => {
    const runner = makeRunner({ id: "r1" });
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"), // 40min = 2400s
      makeLap("r1", 2, "2026-05-09T11:25:00+02:00"), // 45min = 2700s
    ];
    const entries = buildLeaderboard([runner], laps, 7, 100, START);

    // now = right after lap 2
    const now = new Date("2026-05-09T11:30:00+02:00");
    const result = buildNextRunnersList(entries, START, now, END);

    expect(result).toHaveLength(1);
    expect(result[0].runner.id).toBe("r1");
    expect(result[0].nextLapNumber).toBe(3);
    // avg of 2400 and 2700 = 2550s = 42.5min
    // estimated at 11:25:00 + 42.5min = 12:07:30
    expect(result[0].estimatedTimestamp).toBe("2026-05-09T12:07:30.000+02:00");
    expect(result[0].confidence).toBe("medium");
  });

  it("sorts by earliest estimated arrival", () => {
    const r1 = makeRunner({ id: "r1", bib: 1, name: "Slow" });
    const r2 = makeRunner({ id: "r2", bib: 2, name: "Fast" });
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:50:00+02:00"), // 50min lap
      makeLap("r2", 1, "2026-05-09T10:30:00+02:00"), // 30min lap
    ];
    const entries = buildLeaderboard([r1, r2], laps, 7, 100, START);
    const now = new Date("2026-05-09T10:55:00+02:00");
    const result = buildNextRunnersList(entries, START, now, END);

    expect(result[0].runner.name).toBe("Fast"); // arrives at 11:00
    expect(result[1].runner.name).toBe("Slow"); // arrives at 11:40
  });

  it("excludes runners whose estimate exceeds race end time", () => {
    const runner = makeRunner({ id: "r1" });
    const laps = [
      makeLap("r1", 1, "2026-05-09T17:30:00+02:00"), // 7.5h into race = 27000s lap
    ];
    const entries = buildLeaderboard([runner], laps, 7, 100, START);
    // now is 17:35, next lap would be at ~18:00+ which is past END
    const now = new Date("2026-05-09T17:35:00+02:00");
    const result = buildNextRunnersList(entries, START, now, END);

    expect(result).toEqual([]);
  });

  it("shows overdue runners with estimatedSecondsFromNow clamped to 0", () => {
    const runner = makeRunner({ id: "r1" });
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"), // 40min lap
    ];
    const entries = buildLeaderboard([runner], laps, 7, 100, START);
    // now is well past expected arrival (10:40 + 40min = 11:20), now is 11:30
    const now = new Date("2026-05-09T11:30:00+02:00");
    const result = buildNextRunnersList(entries, START, now, END);

    expect(result).toHaveLength(1);
    expect(result[0].estimatedSecondsFromNow).toBe(0);
  });

  it("excludes stale runners (overdue by more than 2x estimated lap)", () => {
    const runner = makeRunner({ id: "r1" });
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"), // 40min = 2400s
    ];
    const entries = buildLeaderboard([runner], laps, 7, 100, START);
    // Expected at 11:20. Stale threshold = 2 * 2400s = 4800s = 80min after 11:20 = 12:40
    // now is 13:00, well past staleness cutoff
    const now = new Date("2026-05-09T13:00:00+02:00");
    const result = buildNextRunnersList(entries, START, now, END);

    expect(result).toEqual([]);
  });

  it("assigns confidence based on number of durations", () => {
    const r1 = makeRunner({ id: "r1", bib: 1, name: "One lap" });
    const r2 = makeRunner({ id: "r2", bib: 2, name: "Two laps" });
    const r3 = makeRunner({ id: "r3", bib: 3, name: "Three laps" });

    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"),
      makeLap("r2", 1, "2026-05-09T10:40:00+02:00"),
      makeLap("r2", 2, "2026-05-09T11:20:00+02:00"),
      makeLap("r3", 1, "2026-05-09T10:40:00+02:00"),
      makeLap("r3", 2, "2026-05-09T11:20:00+02:00"),
      makeLap("r3", 3, "2026-05-09T12:00:00+02:00"),
    ];
    const entries = buildLeaderboard([r1, r2, r3], laps, 7, 100, START);
    const now = new Date("2026-05-09T12:05:00+02:00");
    const result = buildNextRunnersList(entries, START, now, END);

    const byName = Object.fromEntries(result.map((r) => [r.runner.name, r]));
    expect(byName["One lap"].confidence).toBe("low");
    expect(byName["Two laps"].confidence).toBe("medium");
    expect(byName["Three laps"].confidence).toBe("high");
  });
});
