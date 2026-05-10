import { Lap, LeaderboardEntry, Runner } from "./types";

export type AnomalyReason =
  | "runner_fast"
  | "runner_slow"
  | "absolute_fast"
  | "absolute_slow";

export interface LapAnomaly {
  reasons: AnomalyReason[];
  runner: Runner;
  lap: Lap;
  durationSeconds: number;
  previousTimestamp: string | null;
  runnerBaselineSeconds: number | null;
  severity: number;
}

export interface AuditConfig {
  perRunner: { enabled: boolean; multiplier: number };
  absoluteFast: { enabled: boolean; seconds: number };
  absoluteSlow: { enabled: boolean; seconds: number };
}

const MIN_LAPS_FOR_BASELINE = 3;
const NEIGHBOR_OFFSETS = [-2, -1, 1, 2] as const;
const MIN_WINDOW_SIZE = 2;
// Filter neighbors against the runner's overall median so a single fast or
// slow outlier neighbor doesn't bias this lap's baseline in either direction.
const OUTLIER_LOW_RATIO = 0.4;
const OUTLIER_HIGH_RATIO = 2.5;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function localBaseline(
  durations: number[],
  i: number,
  runnerMedian: number
): number | null {
  const lowBound = runnerMedian * OUTLIER_LOW_RATIO;
  const highBound = runnerMedian * OUTLIER_HIGH_RATIO;
  const window: number[] = [];
  for (const offset of NEIGHBOR_OFFSETS) {
    const j = i + offset;
    if (j < 0 || j >= durations.length) continue;
    const d = durations[j];
    if (d >= lowBound && d <= highBound) window.push(d);
  }
  if (window.length < MIN_WINDOW_SIZE) return null;
  return median(window);
}

export function findLapAnomalies(
  entries: LeaderboardEntry[],
  startDateTime: string,
  cfg: AuditConfig
): LapAnomaly[] {
  const anyEnabled =
    cfg.perRunner.enabled ||
    cfg.absoluteFast.enabled ||
    cfg.absoluteSlow.enabled;
  if (!anyEnabled) return [];

  const startMs = new Date(startDateTime).getTime();
  const anomalies: LapAnomaly[] = [];

  for (const entry of entries) {
    const sortedLaps = [...entry.laps].sort(
      (a, b) => a.lap_number - b.lap_number
    );
    if (sortedLaps.length === 0) continue;

    const durations: number[] = [];
    for (let i = 0; i < sortedLaps.length; i++) {
      const currMs = new Date(sortedLaps[i].timestamp).getTime();
      const prevMs =
        i === 0 ? startMs : new Date(sortedLaps[i - 1].timestamp).getTime();
      durations.push((currMs - prevMs) / 1000);
    }

    const perRunnerEligible =
      cfg.perRunner.enabled && durations.length >= MIN_LAPS_FOR_BASELINE;
    const runnerMedian = perRunnerEligible ? median(durations) : 0;

    for (let i = 0; i < sortedLaps.length; i++) {
      const lap = sortedLaps[i];
      const duration = durations[i];
      const reasons: AnomalyReason[] = [];
      let severity = 0;
      let baseline: number | null = null;

      if (cfg.absoluteFast.enabled && duration < cfg.absoluteFast.seconds) {
        reasons.push("absolute_fast");
        severity = Math.max(
          severity,
          cfg.absoluteFast.seconds / Math.max(duration, 1)
        );
      }
      if (cfg.absoluteSlow.enabled && duration > cfg.absoluteSlow.seconds) {
        reasons.push("absolute_slow");
        severity = Math.max(severity, duration / cfg.absoluteSlow.seconds);
      }
      if (perRunnerEligible && runnerMedian > 0) {
        // Prefer a local baseline so we don't false-flag laps inside a
        // pace-drift window. When local neighbors are themselves outliers
        // (e.g. a 3-lap runner with one huge and one impossibly-short lap),
        // fall back to the runner's overall median so the anomaly still
        // surfaces instead of being silently dropped.
        baseline = localBaseline(durations, i, runnerMedian) ?? runnerMedian;
        if (baseline > 0) {
          const m = cfg.perRunner.multiplier;
          if (duration >= baseline * m) {
            reasons.push("runner_slow");
            severity = Math.max(severity, duration / baseline);
          } else if (duration <= baseline / m) {
            reasons.push("runner_fast");
            severity = Math.max(severity, baseline / Math.max(duration, 1));
          }
        }
      }

      if (reasons.length === 0) continue;

      anomalies.push({
        reasons,
        runner: entry.runner,
        lap,
        durationSeconds: duration,
        previousTimestamp: i === 0 ? null : sortedLaps[i - 1].timestamp,
        runnerBaselineSeconds: baseline,
        severity,
      });
    }
  }

  anomalies.sort((a, b) => b.severity - a.severity);
  return anomalies;
}
