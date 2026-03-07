import { Gender, Lap, LeaderboardEntry, Runner } from "./types";

export function getNextLapNumber(existingLaps: Lap[]): number {
  if (existingLaps.length === 0) return 1;
  const max = Math.max(...existingLaps.map((l) => l.lap_number));
  return max + 1;
}

export function getNextBibNumber(existingRunners: Runner[]): number {
  if (existingRunners.length === 0) return 1;
  const max = Math.max(...existingRunners.map((r) => r.bib));
  return max + 1;
}

const VALID_GENDERS: Gender[] = ["male", "female", "other"];

export function validateNewRunner(
  name: string,
  bib: number | null,
  gender: string
): string | null {
  if (!name.trim()) return "Name is required";
  if (bib !== null && (!Number.isInteger(bib) || bib < 1))
    return "Bib number must be a positive integer";
  if (!VALID_GENDERS.includes(gender as Gender))
    return "Gender must be male, female, or other";
  return null;
}

function formatLapTime(seconds: number | null): string {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvExport(entries: LeaderboardEntry[]): string {
  const header =
    "Rank,Bib,Name,Gender,Laps,Distance (km),Elevation (m),Avg Lap,Fastest Lap,Slowest Lap";

  const rows = entries.map((e, i) => {
    return [
      i + 1,
      e.runner.bib,
      escapeCsvField(e.runner.name),
      e.runner.gender,
      e.totalLaps,
      e.totalDistanceKm,
      e.totalElevationM,
      formatLapTime(e.avgLapSeconds),
      formatLapTime(e.fastestLapSeconds),
      formatLapTime(e.slowestLapSeconds),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
