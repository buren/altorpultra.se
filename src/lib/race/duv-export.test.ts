import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import {
  splitName,
  formatPerformance,
  mapGender,
  buildDuvWorkbook,
} from "./duv-export";
import type { LeaderboardEntry, Runner } from "./types";

describe("splitName", () => {
  it("splits a typical Swedish first/last name", () => {
    expect(splitName("Carl Eliasson")).toEqual({
      firstName: "Carl",
      surname: "Eliasson",
    });
  });

  it("treats everything after the first word as the surname", () => {
    expect(splitName("Anna Burenstam Linder")).toEqual({
      firstName: "Anna",
      surname: "Burenstam Linder",
    });
  });

  it("returns an empty surname for single-word names", () => {
    expect(splitName("Madonna")).toEqual({
      firstName: "Madonna",
      surname: "",
    });
  });

  it("trims and collapses extra whitespace", () => {
    expect(splitName("  Anna   Maria   Berg ")).toEqual({
      firstName: "Anna",
      surname: "Maria Berg",
    });
  });
});

describe("formatPerformance", () => {
  it("formats whole kilometers with three decimals and km suffix", () => {
    expect(formatPerformance(77)).toBe("77.000 km");
  });

  it("formats fractional kilometers", () => {
    expect(formatPerformance(56.5)).toBe("56.500 km");
  });

  it("rounds to three decimals", () => {
    expect(formatPerformance(42.123456)).toBe("42.123 km");
  });
});

describe("mapGender", () => {
  it("maps male to M", () => {
    expect(mapGender("male")).toBe("M");
  });

  it("maps female to F", () => {
    expect(mapGender("female")).toBe("F");
  });

  it("maps other to empty string", () => {
    expect(mapGender("other")).toBe("");
  });
});

function makeEntry(
  rank: number,
  bib: number,
  name: string,
  gender: Runner["gender"],
  totalLaps: number,
  lapDistanceKm: number
): LeaderboardEntry {
  return {
    runner: {
      id: `id-${bib}`,
      bib,
      name,
      gender,
      notes: null,
      edition_year: 2026,
      stopped_at: null,
      checked_in_at: null,
    },
    totalLaps,
    totalDistanceKm: totalLaps * lapDistanceKm,
    totalElevationM: 0,
    lastLapTimestamp: null,
    avgLapSeconds: null,
    fastestLapSeconds: null,
    slowestLapSeconds: null,
    laps: [],
  };
}

async function loadTemplate(): Promise<ArrayBuffer> {
  const buf = await readFile(
    path.join(process.cwd(), "src/lib/race/duv-template.xlsx")
  );
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function parseBuffer(buffer: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

describe("buildDuvWorkbook", () => {
  it("fills the yellow header cells with event metadata", async () => {
    const tpl = await loadTemplate();
    const buf = await buildDuvWorkbook(
      {
        eventName: "Altorp Ultra",
        date: "2026-05-09",
        durationLabel: "8h",
        lapDistanceKm: 7,
        entries: [],
      },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = wb.getWorksheet("DUV Results")!;
    expect(sheet.getCell("B2").value).toBe("Altorp Ultra");
    expect(sheet.getCell("B3").value).toBe("2026-05-09");
    expect(sheet.getCell("B4").value).toBe("8h");
    expect(sheet.getCell("B5").value).toBe("from race director");
  });

  it("writes one data row per entry starting at row 9", async () => {
    const tpl = await loadTemplate();
    const entries = [
      makeEntry(1, 101, "Carl Eliasson", "male", 11, 7),
      makeEntry(2, 102, "Anna Burenstam Linder", "female", 10, 7),
    ];
    const buf = await buildDuvWorkbook(
      {
        eventName: "Altorp Ultra",
        date: "2026-05-09",
        durationLabel: "8h",
        lapDistanceKm: 7,
        entries,
      },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = wb.getWorksheet("DUV Results")!;

    expect(sheet.getCell("A9").value).toBe(1);
    expect(sheet.getCell("B9").value).toBe("Eliasson");
    expect(sheet.getCell("C9").value).toBe("Carl");
    expect(sheet.getCell("D9").value).toBe("M");
    expect(sheet.getCell("E9").value).toBeFalsy();
    expect(sheet.getCell("F9").value).toBeFalsy();
    expect(sheet.getCell("G9").value).toBe("77.000 km");

    expect(sheet.getCell("A10").value).toBe(2);
    expect(sheet.getCell("B10").value).toBe("Burenstam Linder");
    expect(sheet.getCell("C10").value).toBe("Anna");
    expect(sheet.getCell("D10").value).toBe("F");
    expect(sheet.getCell("G10").value).toBe("70.000 km");
  });

  it("writes the duration marker in column M only on the first data row", async () => {
    const tpl = await loadTemplate();
    const entries = [
      makeEntry(1, 101, "Carl Eliasson", "male", 11, 7),
      makeEntry(2, 102, "Anna Linder", "female", 10, 7),
    ];
    const buf = await buildDuvWorkbook(
      {
        eventName: "Altorp Ultra",
        date: "2026-05-09",
        durationLabel: "8h",
        lapDistanceKm: 7,
        entries,
      },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = wb.getWorksheet("DUV Results")!;
    expect(sheet.getCell("M9").value).toBe("8h");
    expect(sheet.getCell("M10").value).toBeFalsy();
  });

  it("leaves nationality (column F) blank for every row", async () => {
    const tpl = await loadTemplate();
    const entries = [makeEntry(1, 101, "Carl Eliasson", "male", 11, 7)];
    const buf = await buildDuvWorkbook(
      {
        eventName: "Altorp Ultra",
        date: "2026-05-09",
        durationLabel: "8h",
        lapDistanceKm: 7,
        entries,
      },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = wb.getWorksheet("DUV Results")!;
    expect(sheet.getCell("F9").value).toBeFalsy();
  });
});
