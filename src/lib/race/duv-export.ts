import ExcelJS from "exceljs";
import type { Gender, LeaderboardEntry } from "./types";

export interface DuvExportArgs {
  eventName: string;
  date: string;
  durationLabel: string;
  lapDistanceKm: number;
  entries: LeaderboardEntry[];
}

export function splitName(full: string): { firstName: string; surname: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", surname: "" };
  const [firstName, ...rest] = parts;
  return { firstName, surname: rest.join(" ") };
}

export function formatPerformance(km: number): string {
  return `${km.toFixed(3)} km`;
}

export function mapGender(gender: Gender): "M" | "F" | "" {
  if (gender === "male") return "M";
  if (gender === "female") return "F";
  return "";
}

const FIRST_DATA_ROW = 9;

export async function buildDuvWorkbook(
  args: DuvExportArgs,
  templateBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const sheet = workbook.getWorksheet("DUV Results");
  if (!sheet) throw new Error("Template missing 'DUV Results' sheet");

  sheet.getCell("B2").value = args.eventName;
  sheet.getCell("B3").value = args.date;
  sheet.getCell("B4").value = args.durationLabel;
  sheet.getCell("B5").value = "from race director";

  const ALL_COLS = [
    "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P",
  ] as const;

  args.entries.forEach((entry, i) => {
    const r = FIRST_DATA_ROW + i;
    const { firstName, surname } = splitName(entry.runner.name);

    // Clear every column first so template example data doesn't leak through.
    for (const col of ALL_COLS) sheet.getCell(`${col}${r}`).value = null;

    sheet.getCell(`A${r}`).value = i + 1;
    sheet.getCell(`B${r}`).value = surname;
    sheet.getCell(`C${r}`).value = firstName;
    sheet.getCell(`D${r}`).value = mapGender(entry.runner.gender);
    sheet.getCell(`G${r}`).value = formatPerformance(entry.totalDistanceKm);
    if (i === 0) {
      sheet.getCell(`M${r}`).value = args.durationLabel;
    }
  });

  const out = await workbook.xlsx.writeBuffer();
  return out as ArrayBuffer;
}
