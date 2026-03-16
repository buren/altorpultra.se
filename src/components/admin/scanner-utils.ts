const DUPLICATE_WINDOW_MS = 25 * 60 * 1_000;
const DEBOUNCE_MS = 1_000;

export function parseBibFromQr(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const n = parseInt(trimmed, 10);
  if (isNaN(n) || String(n) !== trimmed) return null;
  return n;
}

export function isDebounced(
  lastDecoded: { bib: number; time: number } | null,
  bib: number,
  now: number,
): boolean {
  if (!lastDecoded) return false;
  return lastDecoded.bib === bib && now - lastDecoded.time < DEBOUNCE_MS;
}

export function shouldShowDuplicateDialog(
  recentScans: Map<number, number>,
  bib: number,
  now: number,
): boolean {
  const lastTime = recentScans.get(bib);
  if (lastTime === undefined) return false;
  return now - lastTime < DUPLICATE_WINDOW_MS;
}
