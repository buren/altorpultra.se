import ExcelJS from "exceljs";
import { Gender, Runner } from "./types";

export interface StartlistRow {
  bib: number;
  name: string;
  gender: Gender;
}

const GENDER_MAP: Record<string, Gender> = {
  male: "male",
  female: "female",
  man: "male",
  kvinna: "female",
};

function mapGender(raw: string): Gender {
  const lower = raw.trim().toLowerCase();
  return GENDER_MAP[lower] ?? "other";
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "object" && "richText" in v) {
    return (v as ExcelJS.CellRichTextValue).richText
      .map((r) => r.text)
      .join("");
  }
  return String(v).trim();
}

interface ColumnMap {
  bib: number;
  firstName: number;
  lastName: number;
  gender: number;
}

/**
 * Find required columns by scanning the header row for known names.
 * This makes the parser resilient to column order changes in Race ID exports.
 */
function findColumns(headerRow: ExcelJS.Row): ColumnMap {
  const map: Partial<ColumnMap> = {};

  headerRow.eachCell((cell, colNumber) => {
    const text = cellText(cell).toLowerCase();
    if (text === "bib") map.bib = colNumber;
    else if (text === "first name") map.firstName = colNumber;
    else if (text === "last name") map.lastName = colNumber;
    else if (text === "gender") map.gender = colNumber;
  });

  const missing: string[] = [];
  if (!map.bib) missing.push("Bib");
  if (!map.firstName) missing.push("First Name");
  if (!map.lastName) missing.push("Last Name");
  if (!map.gender) missing.push("Gender");

  if (missing.length > 0) {
    throw new Error(
      `Missing required columns in header row: ${missing.join(", ")}`
    );
  }

  return map as ColumnMap;
}

/**
 * Parse a Race ID startlist Excel buffer into StartlistRow[].
 * Auto-detects column positions from the header row.
 */
export async function parseStartlistBuffer(
  buffer: ArrayBuffer
): Promise<StartlistRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("No worksheet found in file");

  const cols = findColumns(sheet.getRow(1));
  const rows: StartlistRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const bibRaw = cellText(row.getCell(cols.bib));
    const firstName = cellText(row.getCell(cols.firstName));
    const lastName = cellText(row.getCell(cols.lastName));
    const genderRaw = cellText(row.getCell(cols.gender));

    // Skip completely empty rows
    if (!bibRaw && !firstName && !lastName) return;

    const bib = parseInt(bibRaw, 10);
    if (!Number.isInteger(bib) || bib < 1) {
      throw new Error(
        `Row ${rowNumber}: Invalid bib number "${bibRaw}"`
      );
    }

    const name = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!name) {
      throw new Error(`Row ${rowNumber}: Missing name`);
    }

    if (!genderRaw.trim()) {
      throw new Error(`Row ${rowNumber}: Missing gender`);
    }

    rows.push({
      bib,
      name,
      gender: mapGender(genderRaw),
    });
  });

  return rows;
}

/**
 * Validate parsed rows against existing runners.
 * Returns an error message string, or null if valid.
 */
export function validateStartlistRows(
  rows: StartlistRow[],
  existingRunners: Runner[]
): string | null {
  if (rows.length === 0) {
    return "No runners found in file";
  }

  // Check duplicate bibs within the file
  const bibSet = new Set<number>();
  for (const row of rows) {
    if (bibSet.has(row.bib)) {
      return `Duplicate bib number ${row.bib} in file`;
    }
    bibSet.add(row.bib);
  }

  // Check bib conflicts with existing runners
  const existingBibs = new Set(existingRunners.map((r) => r.bib));
  for (const row of rows) {
    if (existingBibs.has(row.bib)) {
      return `Bib number ${row.bib} is already registered`;
    }
  }

  return null;
}
