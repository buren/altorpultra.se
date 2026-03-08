import { describe, it, expect } from "vitest";
import {
  buildLeaderboard,
  filterByGender,
  calcLapDurationsSeconds,
} from "./leaderboard";
import { Runner, Lap } from "./types";

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

const LAP_DISTANCE_KM = 7;
const LAP_ELEVATION_M = 100;

describe("buildLeaderboard", () => {
  it("returns empty array when no runners", () => {
    const result = buildLeaderboard([], [], LAP_DISTANCE_KM, LAP_ELEVATION_M);
    expect(result).toEqual([]);
  });

  it("returns runner with zero laps", () => {
    const runner = makeRunner();
    const result = buildLeaderboard([runner], [], LAP_DISTANCE_KM, LAP_ELEVATION_M);
    expect(result).toHaveLength(1);
    expect(result[0].totalLaps).toBe(0);
    expect(result[0].totalDistanceKm).toBe(0);
    expect(result[0].totalElevationM).toBe(0);
    expect(result[0].avgLapSeconds).toBeNull();
    expect(result[0].fastestLapSeconds).toBeNull();
    expect(result[0].slowestLapSeconds).toBeNull();
    expect(result[0].lastLapTimestamp).toBeNull();
  });

  it("calculates stats for runner with multiple laps", () => {
    const runner = makeRunner({ id: "r1" });
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"), // 40 min (from race start assumed)
      makeLap("r1", 2, "2026-05-09T11:25:00+02:00"), // 45 min
      makeLap("r1", 3, "2026-05-09T12:00:00+02:00"), // 35 min
    ];

    const result = buildLeaderboard([runner], laps, LAP_DISTANCE_KM, LAP_ELEVATION_M);

    expect(result[0].totalLaps).toBe(3);
    expect(result[0].totalDistanceKm).toBe(21);
    expect(result[0].totalElevationM).toBe(300);
    expect(result[0].lastLapTimestamp).toBe("2026-05-09T12:00:00+02:00");
  });

  it("sorts by most laps descending", () => {
    const r1 = makeRunner({ id: "r1", bib: 1, name: "Few laps" });
    const r2 = makeRunner({ id: "r2", bib: 2, name: "Many laps" });

    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"),
      makeLap("r2", 1, "2026-05-09T10:42:00+02:00"),
      makeLap("r2", 2, "2026-05-09T11:30:00+02:00"),
    ];

    const result = buildLeaderboard([r1, r2], laps, LAP_DISTANCE_KM, LAP_ELEVATION_M);

    expect(result[0].runner.name).toBe("Many laps");
    expect(result[1].runner.name).toBe("Few laps");
  });

  it("breaks tie by earliest last-lap timestamp", () => {
    const r1 = makeRunner({ id: "r1", bib: 1, name: "Finished later" });
    const r2 = makeRunner({ id: "r2", bib: 2, name: "Finished earlier" });

    const laps = [
      makeLap("r1", 1, "2026-05-09T11:00:00+02:00"),
      makeLap("r2", 1, "2026-05-09T10:50:00+02:00"),
    ];

    const result = buildLeaderboard([r1, r2], laps, LAP_DISTANCE_KM, LAP_ELEVATION_M);

    expect(result[0].runner.name).toBe("Finished earlier");
    expect(result[1].runner.name).toBe("Finished later");
  });

  it("places runners with zero laps last", () => {
    const r1 = makeRunner({ id: "r1", bib: 1, name: "No laps" });
    const r2 = makeRunner({ id: "r2", bib: 2, name: "Has laps" });

    const laps = [makeLap("r2", 1, "2026-05-09T10:40:00+02:00")];

    const result = buildLeaderboard([r1, r2], laps, LAP_DISTANCE_KM, LAP_ELEVATION_M);

    expect(result[0].runner.name).toBe("Has laps");
    expect(result[1].runner.name).toBe("No laps");
  });
});

describe("calcLapDurationsSeconds", () => {
  it("returns empty array for no laps", () => {
    expect(calcLapDurationsSeconds([])).toEqual([]);
  });

  it("returns empty array for single lap without startDateTime", () => {
    const laps = [makeLap("r1", 1, "2026-05-09T10:40:00+02:00")];
    expect(calcLapDurationsSeconds(laps)).toEqual([]);
  });

  it("returns first lap duration when startDateTime is provided", () => {
    const laps = [makeLap("r1", 1, "2026-05-09T10:40:00+02:00")];
    // 40 min = 2400s from race start
    expect(calcLapDurationsSeconds(laps, "2026-05-09T10:00:00+02:00")).toEqual([2400]);
  });

  it("calculates durations between consecutive laps", () => {
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"),
      makeLap("r1", 2, "2026-05-09T11:25:00+02:00"), // 45 min = 2700s
      makeLap("r1", 3, "2026-05-09T12:00:00+02:00"), // 35 min = 2100s
    ];
    expect(calcLapDurationsSeconds(laps)).toEqual([2700, 2100]);
  });

  it("includes first lap duration when startDateTime is provided", () => {
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"), // 40 min = 2400s
      makeLap("r1", 2, "2026-05-09T11:25:00+02:00"), // 45 min = 2700s
    ];
    expect(calcLapDurationsSeconds(laps, "2026-05-09T10:00:00+02:00")).toEqual([2400, 2700]);
  });
});

describe("filterByGender", () => {
  it("filters leaderboard entries by gender", () => {
    const entries = [
      { runner: makeRunner({ id: "r1", gender: "male" }) } as any,
      { runner: makeRunner({ id: "r2", gender: "female" }) } as any,
      { runner: makeRunner({ id: "r3", gender: "male" }) } as any,
      { runner: makeRunner({ id: "r4", gender: "other" }) } as any,
    ];

    expect(filterByGender(entries, "male")).toHaveLength(2);
    expect(filterByGender(entries, "female")).toHaveLength(1);
    expect(filterByGender(entries, "other")).toHaveLength(1);
  });
});
