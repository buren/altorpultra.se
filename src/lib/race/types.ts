export type Gender = "male" | "female" | "other";

export interface Runner {
  id: string;
  bib: number;
  name: string;
  gender: Gender;
  notes: string | null;
  edition_year: number;
}

export interface Lap {
  id: string;
  runner_id: string;
  timestamp: string; // ISO 8601
  lap_number: number;
}

export interface LeaderboardEntry {
  runner: Runner;
  totalLaps: number;
  totalDistanceKm: number;
  totalElevationM: number;
  lastLapTimestamp: string | null;
  avgLapSeconds: number | null;
  fastestLapSeconds: number | null;
  slowestLapSeconds: number | null;
  laps: Lap[];
}
