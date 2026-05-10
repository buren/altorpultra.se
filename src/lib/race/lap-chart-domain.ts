const FLOOR_SEC = 35 * 60;
const CEIL_SEC = 60 * 60;

export function computeLapTimeDomain(values: number[]): [number, number] {
  if (values.length === 0) return [FLOOR_SEC, CEIL_SEC];
  const minSec = Math.min(...values);
  const maxSec = Math.max(...values);
  const padding = (maxSec - minSec) * 0.15 || 60;
  const paddedMin = Math.max(0, Math.floor(minSec - padding));
  const paddedMax = Math.ceil(maxSec + padding);
  return [Math.min(FLOOR_SEC, paddedMin), Math.max(CEIL_SEC, paddedMax)];
}
