import { Runner, LeaderboardEntry } from "./types";
import { calcLapDurationsSeconds } from "./leaderboard";

export interface NextLapEstimate {
  runner: Runner;
  nextLapNumber: number;
  estimatedTimestamp: string;
  estimatedSecondsFromNow: number;
  confidence: "high" | "medium" | "low";
}

export function estimateNextLapSeconds(durations: number[]): number | null {
  if (durations.length === 0) return null;

  // Take last 5 laps for outlier detection
  const recent = durations.slice(-5);

  // Filter out break laps (> 1.5x median of recent window)
  const filtered = filterBreakLaps(recent);

  if (filtered.length === 0) return median(recent);
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return (filtered[0] + filtered[1]) / 2;

  // Weighted average of last 3: weights 1, 2, 3 (oldest to newest)
  const last3 = filtered.slice(-3);
  return (last3[0] * 1 + last3[1] * 2 + last3[2] * 3) / 6;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function filterBreakLaps(durations: number[]): number[] {
  if (durations.length <= 1) return durations;
  const med = median(durations);
  const threshold = med * 1.5;
  const filtered = durations.filter((d) => d <= threshold);
  return filtered.length > 0 ? filtered : durations;
}

export function buildNextRunnersList(
  entries: LeaderboardEntry[],
  startDateTime: string,
  now: Date,
  raceEndDateTime: string
): NextLapEstimate[] {
  const raceEndMs = new Date(raceEndDateTime).getTime();
  const nowMs = now.getTime();
  const estimates: NextLapEstimate[] = [];

  for (const entry of entries) {
    if (entry.totalLaps === 0 || !entry.lastLapTimestamp) continue;

    const durations = calcLapDurationsSeconds(entry.laps, startDateTime);
    if (durations.length === 0) continue;

    const estimated = estimateNextLapSeconds(durations);
    if (estimated === null) continue;

    const lastMs = new Date(entry.lastLapTimestamp).getTime();
    const estimatedMs = lastMs + estimated * 1000;

    // Exclude if estimate is past race end
    if (estimatedMs > raceEndMs) continue;

    // Exclude stale runners (overdue by more than 2x estimated lap)
    if (nowMs > estimatedMs + estimated * 2 * 1000) continue;

    const secondsFromNow = Math.max(0, (estimatedMs - nowMs) / 1000);

    // Format timestamp preserving timezone offset from lastLapTimestamp
    const tzMatch = entry.lastLapTimestamp.match(/([+-]\d{2}:\d{2})$/);
    const tzOffset = tzMatch ? tzMatch[1] : "Z";
    const estimatedDate = new Date(estimatedMs);

    let confidence: "high" | "medium" | "low";
    if (durations.length >= 3) confidence = "high";
    else if (durations.length === 2) confidence = "medium";
    else confidence = "low";

    estimates.push({
      runner: entry.runner,
      nextLapNumber: entry.totalLaps + 1,
      estimatedTimestamp: formatWithOffset(estimatedDate, tzOffset),
      estimatedSecondsFromNow: secondsFromNow,
      confidence,
    });
  }

  estimates.sort((a, b) => a.estimatedSecondsFromNow - b.estimatedSecondsFromNow);
  return estimates;
}

function formatWithOffset(date: Date, offset: string): string {
  if (offset === "Z") return date.toISOString();

  const sign = offset[0] === "+" ? 1 : -1;
  const [hh, mm] = offset.slice(1).split(":").map(Number);
  const offsetMs = sign * (hh * 60 + mm) * 60 * 1000;

  const local = new Date(date.getTime() + offsetMs);
  const iso = local.toISOString(); // gives UTC representation of local time
  // Replace Z with the offset
  return iso.replace("Z", offset);
}
