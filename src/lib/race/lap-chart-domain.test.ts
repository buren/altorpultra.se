import { describe, expect, it } from "vitest";
import { computeLapTimeDomain } from "./lap-chart-domain";

describe("computeLapTimeDomain", () => {
  it("returns the default 35–60 min window when there are no values", () => {
    expect(computeLapTimeDomain([])).toEqual([2100, 3600]);
  });

  it("returns the default window when all laps fall inside it", () => {
    expect(computeLapTimeDomain([2400, 2700, 3000])).toEqual([2100, 3600]);
  });

  it("expands the lower bound (with padding) when a lap is faster than 35 min", () => {
    const [min, max] = computeLapTimeDomain([1800, 2400, 3000]);
    expect(min).toBeLessThan(1800);
    expect(max).toBe(3600);
  });

  it("expands the upper bound (with padding) when a lap is slower than 60 min", () => {
    const [min, max] = computeLapTimeDomain([2400, 3000, 4200]);
    expect(min).toBe(2100);
    expect(max).toBeGreaterThan(4200);
  });

  it("expands both bounds when laps fall outside on both sides", () => {
    const [min, max] = computeLapTimeDomain([1500, 4500]);
    expect(min).toBeLessThan(1500);
    expect(max).toBeGreaterThan(4500);
  });

  it("never returns a negative lower bound", () => {
    const [min] = computeLapTimeDomain([10, 20]);
    expect(min).toBeGreaterThanOrEqual(0);
  });
});
