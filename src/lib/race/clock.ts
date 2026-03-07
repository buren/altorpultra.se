export type RacePhase = "before" | "during" | "after";

export function getRacePhase(
  startDateTime: string,
  endDateTime: string,
  now: Date
): RacePhase {
  const start = new Date(startDateTime).getTime();
  const end = new Date(endDateTime).getTime();
  const nowMs = now.getTime();

  if (nowMs < start) return "before";
  if (nowMs >= end) return "after";
  return "during";
}

export function secondsUntil(dateTime: string, now: Date): number {
  return Math.max(0, Math.floor((new Date(dateTime).getTime() - now.getTime()) / 1000));
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}
