import { LeaderboardEntry } from "./types";
import { filterByGender } from "./leaderboard";

type RecordGender = "male" | "female";

export interface CourseRecord {
  name: string;
  bib: number;
  year: number;
  totalLaps: number;
  totalDistanceKm: number;
}

export interface CourseRecords {
  male: CourseRecord | null;
  female: CourseRecord | null;
}

export interface EditionLeaderboard {
  year: number;
  leaderboard: LeaderboardEntry[];
}

/**
 * Compute the all-time course records per gender across editions,
 * excluding the given year (typically the edition being viewed).
 * Record = most laps completed.
 */
export function computeCourseRecords(
  editions: EditionLeaderboard[],
  excludeYear?: number
): CourseRecords {
  const records: CourseRecords = { male: null, female: null };

  for (const { year, leaderboard } of editions) {
    if (year === excludeYear) continue;

    for (const gender of ["male", "female"] as RecordGender[]) {
      const top = filterByGender(leaderboard, gender)[0];
      if (!top || top.totalLaps === 0) continue;

      const current = records[gender];
      if (!current || top.totalLaps > current.totalLaps) {
        records[gender] = {
          name: top.runner.name,
          bib: top.runner.bib,
          year,
          totalLaps: top.totalLaps,
          totalDistanceKm: top.totalDistanceKm,
        };
      }
    }
  }

  return records;
}

/**
 * Find runner IDs in a leaderboard whose performance matches or beats
 * the course record for their gender.
 * Only the #1 ranked runner per gender is tagged (most laps, earliest
 * last-lap timestamp as tiebreak — matching leaderboard sort order).
 */
export function findCourseRecordHolderIds(
  leaderboard: LeaderboardEntry[],
  records: CourseRecords
): Set<string> {
  const ids = new Set<string>();

  for (const gender of ["male", "female"] as RecordGender[]) {
    const record = records[gender];
    if (!record) continue;

    const top = filterByGender(leaderboard, gender)[0];
    if (top && top.totalLaps > 0 && top.totalLaps >= record.totalLaps) {
      ids.add(top.runner.id);
    }
  }

  return ids;
}
