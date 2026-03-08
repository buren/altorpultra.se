import { describe, it, expect } from "vitest";
import {
  computeCourseRecords,
  findCourseRecordHolderIds,
  EditionLeaderboard,
  CourseRecords,
} from "./course-records";
import { LeaderboardEntry, Runner } from "./types";

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

function makeEntry(
  runner: Runner,
  totalLaps: number,
  lastLapTimestamp: string | null = null
): LeaderboardEntry {
  return {
    runner,
    totalLaps,
    totalDistanceKm: totalLaps * 7,
    totalElevationM: totalLaps * 100,
    lastLapTimestamp,
    avgLapSeconds: null,
    fastestLapSeconds: null,
    slowestLapSeconds: null,
    laps: [],
  };
}

describe("computeCourseRecords", () => {
  it("returns nulls for no editions", () => {
    const result = computeCourseRecords([]);
    expect(result).toEqual({ male: null, female: null });
  });

  it("returns nulls when all runners have zero laps", () => {
    const edition: EditionLeaderboard = {
      year: 2025,
      leaderboard: [
        makeEntry(makeRunner({ id: "r1", gender: "male" }), 0),
        makeEntry(makeRunner({ id: "r2", gender: "female" }), 0),
      ],
    };
    const result = computeCourseRecords([edition]);
    expect(result).toEqual({ male: null, female: null });
  });

  it("finds records from a single edition", () => {
    const edition: EditionLeaderboard = {
      year: 2025,
      leaderboard: [
        makeEntry(makeRunner({ id: "r1", name: "Bob", gender: "male" }), 10, "2025-05-09T16:00:00Z"),
        makeEntry(makeRunner({ id: "r2", name: "Alice", gender: "female" }), 8, "2025-05-09T15:30:00Z"),
        makeEntry(makeRunner({ id: "r3", name: "Charlie", gender: "male" }), 7, "2025-05-09T15:00:00Z"),
      ],
    };
    const result = computeCourseRecords([edition]);
    expect(result.male).toEqual({ name: "Bob", year: 2025, totalLaps: 10, totalDistanceKm: 70 });
    expect(result.female).toEqual({ name: "Alice", year: 2025, totalLaps: 8, totalDistanceKm: 56 });
  });

  it("picks the best across multiple editions", () => {
    const editions: EditionLeaderboard[] = [
      {
        year: 2025,
        leaderboard: [
          makeEntry(makeRunner({ id: "r1", name: "Bob 2025", gender: "male" }), 10, "2025-05-09T16:00:00Z"),
          makeEntry(makeRunner({ id: "r2", name: "Alice 2025", gender: "female" }), 8, "2025-05-09T15:30:00Z"),
        ],
      },
      {
        year: 2026,
        leaderboard: [
          makeEntry(makeRunner({ id: "r3", name: "Bob 2026", gender: "male" }), 12, "2026-05-09T17:00:00Z"),
          makeEntry(makeRunner({ id: "r4", name: "Alice 2026", gender: "female" }), 6, "2026-05-09T14:00:00Z"),
        ],
      },
    ];
    const result = computeCourseRecords(editions);
    expect(result.male?.name).toBe("Bob 2026");
    expect(result.male?.totalLaps).toBe(12);
    expect(result.female?.name).toBe("Alice 2025");
    expect(result.female?.totalLaps).toBe(8);
  });

  it("excludes the specified year", () => {
    const editions: EditionLeaderboard[] = [
      {
        year: 2025,
        leaderboard: [
          makeEntry(makeRunner({ id: "r1", name: "Bob 2025", gender: "male" }), 8, "2025-05-09T15:00:00Z"),
        ],
      },
      {
        year: 2026,
        leaderboard: [
          makeEntry(makeRunner({ id: "r2", name: "Bob 2026", gender: "male" }), 12, "2026-05-09T17:00:00Z"),
        ],
      },
    ];
    const result = computeCourseRecords(editions, 2026);
    expect(result.male?.name).toBe("Bob 2025");
    expect(result.male?.totalLaps).toBe(8);
  });

  it("returns nulls when only edition is excluded", () => {
    const editions: EditionLeaderboard[] = [
      {
        year: 2026,
        leaderboard: [
          makeEntry(makeRunner({ id: "r1", name: "Bob", gender: "male" }), 5, "2026-05-09T12:00:00Z"),
        ],
      },
    ];
    const result = computeCourseRecords(editions, 2026);
    expect(result).toEqual({ male: null, female: null });
  });

  it("handles edition with only one gender", () => {
    const edition: EditionLeaderboard = {
      year: 2025,
      leaderboard: [
        makeEntry(makeRunner({ id: "r1", name: "Bob", gender: "male" }), 5, "2025-05-09T12:00:00Z"),
      ],
    };
    const result = computeCourseRecords([edition]);
    expect(result.male?.totalLaps).toBe(5);
    expect(result.female).toBeNull();
  });

  it("ignores 'other' gender runners", () => {
    const edition: EditionLeaderboard = {
      year: 2025,
      leaderboard: [
        makeEntry(makeRunner({ id: "r1", name: "Sam", gender: "other" }), 15, "2025-05-09T17:00:00Z"),
      ],
    };
    const result = computeCourseRecords([edition]);
    expect(result.male).toBeNull();
    expect(result.female).toBeNull();
  });
});

describe("findCourseRecordHolderIds", () => {
  it("returns empty set when no records exist", () => {
    const records: CourseRecords = { male: null, female: null };
    const leaderboard = [
      makeEntry(makeRunner({ id: "r1", gender: "male" }), 5, "2026-05-09T12:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.size).toBe(0);
  });

  it("tags runner who beats the record (more laps)", () => {
    const records: CourseRecords = {
      male: { name: "Old Champ", year: 2025, totalLaps: 10, totalDistanceKm: 70 },
      female: null,
    };
    const leaderboard = [
      makeEntry(makeRunner({ id: "m1", name: "New Champ", gender: "male" }), 11, "2026-05-09T16:30:00Z"),
      makeEntry(makeRunner({ id: "m2", name: "Second", gender: "male" }), 9, "2026-05-09T15:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.has("m1")).toBe(true);
    expect(result.has("m2")).toBe(false);
  });

  it("tags runner who ties the record (same laps)", () => {
    const records: CourseRecords = {
      male: { name: "Old Champ", year: 2025, totalLaps: 10, totalDistanceKm: 70 },
      female: null,
    };
    const leaderboard = [
      makeEntry(makeRunner({ id: "m1", name: "Ties Record", gender: "male" }), 10, "2026-05-09T15:30:00Z"),
      makeEntry(makeRunner({ id: "m2", name: "Below", gender: "male" }), 8, "2026-05-09T14:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.has("m1")).toBe(true);
    expect(result.has("m2")).toBe(false);
  });

  it("does not tag anyone when top performer is below the record", () => {
    const records: CourseRecords = {
      male: { name: "Old Champ", year: 2025, totalLaps: 12, totalDistanceKm: 84 },
      female: null,
    };
    const leaderboard = [
      makeEntry(makeRunner({ id: "m1", name: "Best Current", gender: "male" }), 8, "2026-05-09T15:00:00Z"),
      makeEntry(makeRunner({ id: "m2", name: "Second", gender: "male" }), 5, "2026-05-09T13:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.size).toBe(0);
  });

  it("tags both genders independently", () => {
    const records: CourseRecords = {
      male: { name: "Prev Male", year: 2025, totalLaps: 10, totalDistanceKm: 70 },
      female: { name: "Prev Female", year: 2025, totalLaps: 8, totalDistanceKm: 56 },
    };
    const leaderboard = [
      makeEntry(makeRunner({ id: "m1", name: "Male CR", gender: "male" }), 11, "2026-05-09T16:00:00Z"),
      makeEntry(makeRunner({ id: "m2", name: "Other Male", gender: "male" }), 8, "2026-05-09T14:00:00Z"),
      makeEntry(makeRunner({ id: "f1", name: "Female CR", gender: "female" }), 9, "2026-05-09T15:00:00Z"),
      makeEntry(makeRunner({ id: "f2", name: "Other Female", gender: "female" }), 7, "2026-05-09T14:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.has("m1")).toBe(true);
    expect(result.has("m2")).toBe(false);
    expect(result.has("f1")).toBe(true);
    expect(result.has("f2")).toBe(false);
  });

  it("tags multiple runners who both beat the record", () => {
    const records: CourseRecords = {
      male: { name: "Prev", year: 2025, totalLaps: 8, totalDistanceKm: 56 },
      female: null,
    };
    const leaderboard = [
      makeEntry(makeRunner({ id: "m1", name: "Tied A", gender: "male" }), 10, "2026-05-09T15:00:00Z"),
      makeEntry(makeRunner({ id: "m2", name: "Tied B", gender: "male" }), 10, "2026-05-09T15:30:00Z"),
      makeEntry(makeRunner({ id: "m3", name: "Below", gender: "male" }), 7, "2026-05-09T14:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.has("m1")).toBe(true);
    expect(result.has("m2")).toBe(true);
    expect(result.has("m3")).toBe(false);
  });

  it("tags only runners at or above the record, not those below", () => {
    const records: CourseRecords = {
      male: { name: "Prev", year: 2025, totalLaps: 10, totalDistanceKm: 70 },
      female: null,
    };
    const leaderboard = [
      makeEntry(makeRunner({ id: "m1", name: "Beats", gender: "male" }), 12, "2026-05-09T17:00:00Z"),
      makeEntry(makeRunner({ id: "m2", name: "Ties", gender: "male" }), 10, "2026-05-09T16:00:00Z"),
      makeEntry(makeRunner({ id: "m3", name: "Below", gender: "male" }), 9, "2026-05-09T15:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.has("m1")).toBe(true);
    expect(result.has("m2")).toBe(true);
    expect(result.has("m3")).toBe(false);
  });

  it("does not tag 'other' gender runners", () => {
    const records: CourseRecords = {
      male: { name: "Champ", year: 2025, totalLaps: 5, totalDistanceKm: 35 },
      female: null,
    };
    const leaderboard = [
      makeEntry(makeRunner({ id: "o1", name: "Other Runner", gender: "other" }), 10, "2026-05-09T15:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.size).toBe(0);
  });

  it("handles empty leaderboard", () => {
    const records: CourseRecords = {
      male: { name: "Champ", year: 2025, totalLaps: 10, totalDistanceKm: 70 },
      female: null,
    };
    const result = findCourseRecordHolderIds([], records);
    expect(result.size).toBe(0);
  });

  it("skips runners with zero laps", () => {
    const records: CourseRecords = {
      male: { name: "Prev", year: 2025, totalLaps: 1, totalDistanceKm: 7 },
      female: null,
    };
    const leaderboard = [
      makeEntry(makeRunner({ id: "m1", gender: "male" }), 0, null),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.size).toBe(0);
  });

  it("no CR tags when records come only from current (excluded) edition", () => {
    // Simulates: only one edition exists, it's excluded, so no records
    const records: CourseRecords = { male: null, female: null };
    const leaderboard = [
      makeEntry(makeRunner({ id: "m1", gender: "male" }), 5, "2026-05-09T12:00:00Z"),
      makeEntry(makeRunner({ id: "f1", gender: "female" }), 3, "2026-05-09T11:00:00Z"),
    ];
    const result = findCourseRecordHolderIds(leaderboard, records);
    expect(result.size).toBe(0);
  });
});
