import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import {
  formatDurationHHMMSS,
  buildItraWorkbook,
} from "./itra-export";
import type { LeaderboardEntry, Runner } from "./types";

describe("formatDurationHHMMSS", () => {
  it("formats whole hours with zero minutes and seconds", () => {
    expect(formatDurationHHMMSS(8)).toBe("08:00:00");
  });

  it("zero-pads single-digit hours", () => {
    expect(formatDurationHHMMSS(6)).toBe("06:00:00");
  });

  it("handles fractional hours as minutes", () => {
    expect(formatDurationHHMMSS(8.5)).toBe("08:30:00");
  });
});

function makeEntry(
  bib: number,
  name: string,
  gender: Runner["gender"],
  totalLaps: number,
  lapDistanceKm: number,
  stopped_at: string | null = null
): LeaderboardEntry {
  return {
    runner: {
      id: `id-${bib}`,
      bib,
      name,
      gender,
      notes: null,
      edition_year: 2026,
      stopped_at,
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
    path.join(process.cwd(), "src/lib/race/itra-template.xlsx")
  );
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function parseBuffer(buffer: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

function getSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet {
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error("no worksheet");
  return sheet;
}

describe("buildItraWorkbook", () => {
  it("preserves the original header row and adds a Distance (km) column at L1", async () => {
    const tpl = await loadTemplate();
    const buf = await buildItraWorkbook(
      { durationHours: 8, entries: [] },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = getSheet(wb);
    expect(sheet.getCell("A1").value).toBe("Ranking");
    expect(sheet.getCell("B1").value).toBe("Time");
    expect(sheet.getCell("C1").value).toBe("Family Name");
    expect(sheet.getCell("D1").value).toBe("First Name");
    expect(sheet.getCell("E1").value).toBe("Gender");
    expect(sheet.getCell("I1").value).toBe("Bib number");
    expect(sheet.getCell("K1").value).toBe("Team");
    expect(sheet.getCell("L1").value).toBe("Distance (km)");
  });

  it("clears the Simpson family example data from rows 2-6", async () => {
    const tpl = await loadTemplate();
    const buf = await buildItraWorkbook(
      { durationHours: 8, entries: [] },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = getSheet(wb);
    for (let r = 2; r <= 6; r++) {
      for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]) {
        expect(sheet.getCell(`${col}${r}`).value).toBeFalsy();
      }
    }
  });

  it("writes one data row per entry starting at row 2", async () => {
    const tpl = await loadTemplate();
    const entries = [
      makeEntry(101, "Carl Eliasson", "male", 11, 7),
      makeEntry(102, "Anna Burenstam Linder", "female", 10, 7),
    ];
    const buf = await buildItraWorkbook(
      { durationHours: 8, entries },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = getSheet(wb);

    expect(sheet.getCell("A2").value).toBe(1);
    expect(sheet.getCell("B2").value).toBe("08:00:00");
    expect(sheet.getCell("C2").value).toBe("Eliasson");
    expect(sheet.getCell("D2").value).toBe("Carl");
    expect(sheet.getCell("E2").value).toBe("M");
    expect(sheet.getCell("I2").value).toBe(101);
    expect(sheet.getCell("L2").value).toBe(77);

    expect(sheet.getCell("A3").value).toBe(2);
    expect(sheet.getCell("B3").value).toBe("08:00:00");
    expect(sheet.getCell("C3").value).toBe("Burenstam Linder");
    expect(sheet.getCell("D3").value).toBe("Anna");
    expect(sheet.getCell("E3").value).toBe("F");
    expect(sheet.getCell("I3").value).toBe(102);
    expect(sheet.getCell("L3").value).toBe(70);
  });

  it("leaves Birthdate, Nationality, ITRA ID, City, Team blank", async () => {
    const tpl = await loadTemplate();
    const entries = [makeEntry(101, "Carl Eliasson", "male", 11, 7)];
    const buf = await buildItraWorkbook(
      { durationHours: 8, entries },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = getSheet(wb);
    expect(sheet.getCell("F2").value).toBeFalsy();
    expect(sheet.getCell("G2").value).toBeFalsy();
    expect(sheet.getCell("H2").value).toBeFalsy();
    expect(sheet.getCell("J2").value).toBeFalsy();
    expect(sheet.getCell("K2").value).toBeFalsy();
  });

  it("ranks runners who stopped early normally by distance, no DNF marker", async () => {
    const tpl = await loadTemplate();
    const entries = [
      makeEntry(101, "Carl Eliasson", "male", 11, 7),
      makeEntry(102, "Stopped Runner", "male", 5, 7, "2026-05-09T15:00:00Z"),
    ];
    const buf = await buildItraWorkbook(
      { durationHours: 8, entries },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = getSheet(wb);
    expect(sheet.getCell("A3").value).toBe(2);
    expect(sheet.getCell("B3").value).toBe("08:00:00");
    expect(sheet.getCell("C3").value).toBe("Runner");
    expect(sheet.getCell("D3").value).toBe("Stopped");
  });

  it("rounds distance to three decimals", async () => {
    const tpl = await loadTemplate();
    const entry: LeaderboardEntry = {
      ...makeEntry(101, "Carl Eliasson", "male", 1, 7),
      totalDistanceKm: 77.123456,
    };
    const buf = await buildItraWorkbook(
      { durationHours: 8, entries: [entry] },
      tpl
    );
    const wb = await parseBuffer(buf);
    const sheet = getSheet(wb);
    expect(sheet.getCell("L2").value).toBe(77.123);
  });
});
