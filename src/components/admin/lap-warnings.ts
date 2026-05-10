const RECENT_LAP_WARNING_WINDOW_MS = 35 * 60 * 1_000;

export function findRecentLapWarning(
  lastLapTimestamp: string | null,
  now: number,
): { secondsAgo: number } | null {
  if (!lastLapTimestamp) return null;
  const lastTime = new Date(lastLapTimestamp).getTime();
  if (isNaN(lastTime)) return null;
  const diff = now - lastTime;
  if (diff < 0 || diff >= RECENT_LAP_WARNING_WINDOW_MS) return null;
  return { secondsAgo: Math.round(diff / 1000) };
}
