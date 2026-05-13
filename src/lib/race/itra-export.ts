import ExcelJS from "exceljs";
import { splitName, mapGender } from "./duv-export";
import type { LeaderboardEntry } from "./types";

export interface ItraExportArgs {
  durationHours: number;
  entries: LeaderboardEntry[];
}

export function formatDurationHHMMSS(hours: number): string {
  const totalSeconds = Math.round(hours * 3600);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

const HEADER_ROW = 1;
const FIRST_DATA_ROW = 2;
const EXAMPLE_ROWS_TO_CLEAR = 5; // template ships with rows 2-6 populated
const ALL_COLS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
] as const;

export async function buildItraWorkbook(
  args: ItraExportArgs,
  templateBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("ITRA template has no worksheet");

  sheet.getCell(`L${HEADER_ROW}`).value = "Distance (km)";

  for (let r = FIRST_DATA_ROW; r < FIRST_DATA_ROW + EXAMPLE_ROWS_TO_CLEAR; r++) {
    for (const col of ALL_COLS) sheet.getCell(`${col}${r}`).value = null;
  }

  const time = formatDurationHHMMSS(args.durationHours);

  args.entries.forEach((entry, i) => {
    const r = FIRST_DATA_ROW + i;
    const { firstName, surname } = splitName(entry.runner.name);

    for (const col of ALL_COLS) sheet.getCell(`${col}${r}`).value = null;

    sheet.getCell(`A${r}`).value = i + 1;
    sheet.getCell(`B${r}`).value = time;
    sheet.getCell(`C${r}`).value = surname;
    sheet.getCell(`D${r}`).value = firstName;
    sheet.getCell(`E${r}`).value = mapGender(entry.runner.gender);
    sheet.getCell(`I${r}`).value = entry.runner.bib;
    sheet.getCell(`L${r}`).value = Number(entry.totalDistanceKm.toFixed(3));
  });

  const out = await workbook.xlsx.writeBuffer();
  return out as ArrayBuffer;
}
