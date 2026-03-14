import { describe, it, expect } from "vitest";
import {
  getNextLapNumber,
  getNextBibNumber,
  buildCsvExport,
  validateNewRunner,
  validateTimestamp,
  renumberLaps,
} from "./services";
import { LeaderboardEntry, Runner, Lap } from "./types";

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

function makeLap(
  runner_id: string,
  lap_number: number,
  timestamp: string
): Lap {
  return {
    id: `lap-${runner_id}-${lap_number}`,
    runner_id,
    timestamp,
    lap_number,
  };
}

describe("getNextLapNumber", () => {
  it("returns 1 when runner has no laps", () => {
    expect(getNextLapNumber([])).toBe(1);
  });

  it("returns next number after existing laps", () => {
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"),
      makeLap("r1", 2, "2026-05-09T11:20:00+02:00"),
    ];
    expect(getNextLapNumber(laps)).toBe(3);
  });

  it("handles gaps in lap numbers by using max + 1", () => {
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:40:00+02:00"),
      makeLap("r1", 3, "2026-05-09T11:20:00+02:00"), // gap: no lap 2
    ];
    expect(getNextLapNumber(laps)).toBe(4);
  });
});

describe("getNextBibNumber", () => {
  it("returns 1 when no runners exist", () => {
    expect(getNextBibNumber([])).toBe(1);
  });

  it("returns max bib + 1", () => {
    const runners = [
      makeRunner({ bib: 3 }),
      makeRunner({ bib: 7 }),
      makeRunner({ bib: 2 }),
    ];
    expect(getNextBibNumber(runners)).toBe(8);
  });
});

describe("validateNewRunner", () => {
  it("returns null for valid runner", () => {
    expect(validateNewRunner("Alice", 1, "female")).toBeNull();
  });

  it("accepts null bib (will be auto-assigned)", () => {
    expect(validateNewRunner("Alice", null, "female")).toBeNull();
  });

  it("rejects empty name", () => {
    expect(validateNewRunner("", 1, "male")).toBe("Name is required");
  });

  it("rejects whitespace-only name", () => {
    expect(validateNewRunner("   ", 1, "male")).toBe("Name is required");
  });

  it("rejects bib number 0", () => {
    expect(validateNewRunner("Alice", 0, "female")).toBe(
      "Bib number must be a positive integer"
    );
  });

  it("rejects negative bib number", () => {
    expect(validateNewRunner("Alice", -1, "female")).toBe(
      "Bib number must be a positive integer"
    );
  });

  it("rejects non-integer bib number", () => {
    expect(validateNewRunner("Alice", 1.5, "female")).toBe(
      "Bib number must be a positive integer"
    );
  });

  it("rejects invalid gender", () => {
    expect(validateNewRunner("Alice", 1, "unknown" as any)).toBe(
      "Gender must be male, female, or other"
    );
  });
});

describe("validateTimestamp", () => {
  it("returns null for valid ISO 8601 string", () => {
    expect(validateTimestamp("2026-05-09T10:30:00+02:00")).toBeNull();
  });

  it("returns null for UTC ISO string", () => {
    expect(validateTimestamp("2026-05-09T08:30:00Z")).toBeNull();
  });

  it("returns error for empty string", () => {
    expect(validateTimestamp("")).toBe("Timestamp is required");
  });

  it("returns error for garbage string", () => {
    expect(validateTimestamp("not-a-date")).toBe("Invalid timestamp");
  });

  it("returns error for partial date", () => {
    expect(validateTimestamp("2026-05-09")).toBe("Invalid timestamp");
  });
});

describe("renumberLaps", () => {
  it("returns lap_number 1 and no updates for empty laps", () => {
    const result = renumberLaps([], "2026-05-09T10:30:00Z");
    expect(result).toEqual({ newLapNumber: 1, updates: [] });
  });

  it("returns next number and no updates when inserting at the end", () => {
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:00:00Z"),
      makeLap("r1", 2, "2026-05-09T10:30:00Z"),
    ];
    const result = renumberLaps(laps, "2026-05-09T11:00:00Z");
    expect(result.newLapNumber).toBe(3);
    expect(result.updates).toEqual([]);
  });

  it("renumbers when inserting at the beginning", () => {
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:30:00Z"),
      makeLap("r1", 2, "2026-05-09T11:00:00Z"),
    ];
    const result = renumberLaps(laps, "2026-05-09T10:00:00Z");
    expect(result.newLapNumber).toBe(1);
    expect(result.updates).toEqual([
      { lapId: "lap-r1-1", newLapNumber: 2 },
      { lapId: "lap-r1-2", newLapNumber: 3 },
    ]);
  });

  it("renumbers when inserting in the middle", () => {
    const laps = [
      makeLap("r1", 1, "2026-05-09T10:00:00Z"),
      makeLap("r1", 2, "2026-05-09T10:30:00Z"),
      makeLap("r1", 3, "2026-05-09T11:00:00Z"),
    ];
    const result = renumberLaps(laps, "2026-05-09T10:15:00Z");
    expect(result.newLapNumber).toBe(2);
    expect(result.updates).toEqual([
      { lapId: "lap-r1-2", newLapNumber: 3 },
      { lapId: "lap-r1-3", newLapNumber: 4 },
    ]);
  });
});

describe("buildCsvExport", () => {
  it("returns header row when no entries", () => {
    const csv = buildCsvExport([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      "Rank,Bib,Name,Gender,Laps,Distance (km),Elevation (m),Avg Lap,Fastest Lap,Slowest Lap"
    );
  });

  it("formats runner data correctly", () => {
    const entry: LeaderboardEntry = {
      runner: makeRunner({ bib: 42, name: "Alice", gender: "female" }),
      totalLaps: 5,
      totalDistanceKm: 35,
      totalElevationM: 500,
      lastLapTimestamp: "2026-05-09T14:00:00+02:00",
      avgLapSeconds: 2700, // 45:00
      fastestLapSeconds: 2400, // 40:00
      slowestLapSeconds: 3000, // 50:00
      laps: [],
    };

    const csv = buildCsvExport([entry]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("1,42,Alice,female,5,35,500,45:00,40:00,50:00");
  });

  it("handles runner with no laps", () => {
    const entry: LeaderboardEntry = {
      runner: makeRunner({ bib: 7, name: "Bob", gender: "male" }),
      totalLaps: 0,
      totalDistanceKm: 0,
      totalElevationM: 0,
      lastLapTimestamp: null,
      avgLapSeconds: null,
      fastestLapSeconds: null,
      slowestLapSeconds: null,
      laps: [],
    };

    const csv = buildCsvExport([entry]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("1,7,Bob,male,0,0,0,,,");
  });

  it("escapes commas in runner names", () => {
    const entry: LeaderboardEntry = {
      runner: makeRunner({ bib: 1, name: "Last, First" }),
      totalLaps: 1,
      totalDistanceKm: 7,
      totalElevationM: 100,
      lastLapTimestamp: "2026-05-09T10:40:00+02:00",
      avgLapSeconds: null,
      fastestLapSeconds: null,
      slowestLapSeconds: null,
      laps: [],
    };

    const csv = buildCsvExport([entry]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('1,1,"Last, First",male,1,7,100,,,');
  });

  it("assigns rank based on position in array", () => {
    const entries: LeaderboardEntry[] = [
      {
        runner: makeRunner({ id: "r1", bib: 1, name: "First" }),
        totalLaps: 3,
        totalDistanceKm: 21,
        totalElevationM: 300,
        lastLapTimestamp: "2026-05-09T12:00:00+02:00",
        avgLapSeconds: 2700,
        fastestLapSeconds: 2400,
        slowestLapSeconds: 3000,
        laps: [],
      },
      {
        runner: makeRunner({ id: "r2", bib: 2, name: "Second" }),
        totalLaps: 2,
        totalDistanceKm: 14,
        totalElevationM: 200,
        lastLapTimestamp: "2026-05-09T11:30:00+02:00",
        avgLapSeconds: 2700,
        fastestLapSeconds: 2700,
        slowestLapSeconds: 2700,
        laps: [],
      },
    ];

    const csv = buildCsvExport(entries);
    const lines = csv.split("\n");
    expect(lines[1]).toMatch(/^1,/);
    expect(lines[2]).toMatch(/^2,/);
  });
});
