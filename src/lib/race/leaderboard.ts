import { Gender, Lap, LeaderboardEntry, Runner } from "./types";

export function calcLapDurationsSeconds(laps: Lap[]): number[] {
  if (laps.length < 2) return [];

  const sorted = [...laps].sort((a, b) => a.lap_number - b.lap_number);
  const durations: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].timestamp).getTime();
    const curr = new Date(sorted[i].timestamp).getTime();
    durations.push((curr - prev) / 1000);
  }

  return durations;
}

export function buildLeaderboard(
  runners: Runner[],
  laps: Lap[],
  lapDistanceKm: number,
  lapElevationM: number
): LeaderboardEntry[] {
  const lapsByRunner = new Map<string, Lap[]>();

  for (const lap of laps) {
    const arr = lapsByRunner.get(lap.runner_id) ?? [];
    arr.push(lap);
    lapsByRunner.set(lap.runner_id, arr);
  }

  const entries: LeaderboardEntry[] = runners.map((runner) => {
    const runnerLaps = lapsByRunner.get(runner.id) ?? [];
    const sorted = [...runnerLaps].sort((a, b) => a.lap_number - b.lap_number);
    const totalLaps = sorted.length;
    const durations = calcLapDurationsSeconds(sorted);

    const lastLapTimestamp =
      totalLaps > 0 ? sorted[sorted.length - 1].timestamp : null;

    let avgLapSeconds: number | null = null;
    let fastestLapSeconds: number | null = null;
    let slowestLapSeconds: number | null = null;

    if (durations.length > 0) {
      avgLapSeconds =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;
      fastestLapSeconds = Math.min(...durations);
      slowestLapSeconds = Math.max(...durations);
    }

    return {
      runner,
      totalLaps,
      totalDistanceKm: totalLaps * lapDistanceKm,
      totalElevationM: totalLaps * lapElevationM,
      lastLapTimestamp,
      avgLapSeconds,
      fastestLapSeconds,
      slowestLapSeconds,
      laps: sorted,
    };
  });

  entries.sort((a, b) => {
    if (b.totalLaps !== a.totalLaps) return b.totalLaps - a.totalLaps;

    // Tiebreak: earliest last-lap timestamp wins
    if (a.lastLapTimestamp && b.lastLapTimestamp) {
      return (
        new Date(a.lastLapTimestamp).getTime() -
        new Date(b.lastLapTimestamp).getTime()
      );
    }
    // Runners with laps before runners without
    if (a.lastLapTimestamp) return -1;
    if (b.lastLapTimestamp) return 1;
    return 0;
  });

  return entries;
}

export function filterByGender(
  entries: LeaderboardEntry[],
  gender: Gender
): LeaderboardEntry[] {
  return entries.filter((e) => e.runner.gender === gender);
}
