import { describe, it, expect } from "vitest";
import { getRacePhase, secondsUntil, formatDuration } from "./clock";

const START = "2026-05-09T10:00:00+02:00";
const END = "2026-05-09T18:00:00+02:00";

describe("getRacePhase", () => {
  it("returns 'before' when now is before start", () => {
    expect(getRacePhase(START, END, new Date("2026-05-09T09:00:00+02:00"))).toBe("before");
  });

  it("returns 'during' when now is between start and end", () => {
    expect(getRacePhase(START, END, new Date("2026-05-09T14:00:00+02:00"))).toBe("during");
  });

  it("returns 'during' at exact start time", () => {
    expect(getRacePhase(START, END, new Date("2026-05-09T10:00:00+02:00"))).toBe("during");
  });

  it("returns 'after' at exact end time", () => {
    expect(getRacePhase(START, END, new Date("2026-05-09T18:00:00+02:00"))).toBe("after");
  });

  it("returns 'after' when now is past end", () => {
    expect(getRacePhase(START, END, new Date("2026-05-10T10:00:00+02:00"))).toBe("after");
  });
});

describe("secondsUntil", () => {
  it("returns seconds until a future time", () => {
    const now = new Date("2026-05-09T09:00:00+02:00");
    expect(secondsUntil(START, now)).toBe(3600);
  });

  it("returns 0 for a past time", () => {
    const now = new Date("2026-05-09T11:00:00+02:00");
    expect(secondsUntil(START, now)).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formats seconds into HH:MM:SS", () => {
    expect(formatDuration(0)).toBe("00:00:00");
    expect(formatDuration(61)).toBe("00:01:01");
    expect(formatDuration(3661)).toBe("01:01:01");
    expect(formatDuration(8 * 3600)).toBe("08:00:00");
  });
});
