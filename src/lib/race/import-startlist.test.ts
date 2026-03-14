import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { parseStartlistBuffer, validateStartlistRows, StartlistRow } from "./import-startlist";
import { Runner } from "./types";

/** Convert exceljs writeBuffer result to ArrayBuffer */
function toArrayBuffer(buf: ExcelJS.Buffer): ArrayBuffer {
  const u8 = new Uint8Array(buf as ArrayBuffer);
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

/**
 * Build a Race ID-style xlsx with the right column positions.
 * Col B=Bib, Col I=First Name, Col J=Last Name, Col K=Gender.
 * Fills other columns with empty strings.
 */
async function buildRaceIdXlsx(
  dataRows: { bib: number | string; firstName: string; lastName: string; gender: string }[]
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");

  // Header: A(1) is empty, B(2)=Bib, ..., I(9)=First Name, J(10)=Last Name, K(11)=Gender
  const header = ["", "Bib", "", "", "", "", "", "", "First Name", "Last Name", "Gender"];
  ws.addRow(header);

  for (const row of dataRows) {
    const r = ["", row.bib, "", "", "", "", "", "", row.firstName, row.lastName, row.gender];
    ws.addRow(r);
  }

  const nodeBuffer = await wb.xlsx.writeBuffer();
  return toArrayBuffer(nodeBuffer);
}

describe("parseStartlistBuffer", () => {
  it("parses valid rows correctly", async () => {
    const buf = await buildRaceIdXlsx([
      { bib: 1, firstName: "Anna", lastName: "Svensson", gender: "Female" },
      { bib: 2, firstName: "Erik", lastName: "Johansson", gender: "Male" },
    ]);

    const rows = await parseStartlistBuffer(buf);
    expect(rows).toEqual([
      { bib: 1, name: "Anna Svensson", gender: "female" },
      { bib: 2, name: "Erik Johansson", gender: "male" },
    ]);
  });

  it("maps unknown gender to 'other'", async () => {
    const buf = await buildRaceIdXlsx([
      { bib: 5, firstName: "Alex", lastName: "Kim", gender: "Non-binary" },
    ]);

    const rows = await parseStartlistBuffer(buf);
    expect(rows[0].gender).toBe("other");
  });

  it("maps Swedish gender values", async () => {
    const buf = await buildRaceIdXlsx([
      { bib: 1, firstName: "A", lastName: "B", gender: "Man" },
      { bib: 2, firstName: "C", lastName: "D", gender: "Kvinna" },
    ]);

    const rows = await parseStartlistBuffer(buf);
    expect(rows[0].gender).toBe("male");
    expect(rows[1].gender).toBe("female");
  });

  it("trims and concatenates names", async () => {
    const buf = await buildRaceIdXlsx([
      { bib: 1, firstName: "  Anna  ", lastName: "  Svensson  ", gender: "Female" },
    ]);

    const rows = await parseStartlistBuffer(buf);
    expect(rows[0].name).toBe("Anna Svensson");
  });

  it("throws on invalid bib number", async () => {
    const buf = await buildRaceIdXlsx([
      { bib: "abc", firstName: "Anna", lastName: "S", gender: "Female" },
    ]);

    await expect(parseStartlistBuffer(buf)).rejects.toThrow("Invalid bib number");
  });

  it("throws on missing name", async () => {
    const buf = await buildRaceIdXlsx([
      { bib: 1, firstName: "", lastName: "", gender: "Male" },
    ]);

    await expect(parseStartlistBuffer(buf)).rejects.toThrow("Missing name");
  });

  it("throws on missing gender", async () => {
    const buf = await buildRaceIdXlsx([
      { bib: 1, firstName: "A", lastName: "B", gender: "" },
    ]);

    await expect(parseStartlistBuffer(buf)).rejects.toThrow("Missing gender");
  });

  it("throws on invalid header row", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    ws.addRow(["", "Number", "", "", "", "", "", "", "Namn", "Efternamn", "Kön"]);
    ws.addRow(["", 1, "", "", "", "", "", "", "A", "B", "Male"]);
    const nodeBuffer = await wb.xlsx.writeBuffer();
    const buf = toArrayBuffer(nodeBuffer);

    await expect(parseStartlistBuffer(buf)).rejects.toThrow("Missing required columns");
  });

  it("skips empty rows", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    ws.addRow(["", "Bib", "", "", "", "", "", "", "First Name", "Last Name", "Gender"]);
    ws.addRow(["", 1, "", "", "", "", "", "", "A", "B", "Male"]);
    ws.addRow(["", "", "", "", "", "", "", "", "", "", ""]); // empty row
    ws.addRow(["", 2, "", "", "", "", "", "", "C", "D", "Female"]);
    const nodeBuffer = await wb.xlsx.writeBuffer();
    const buf = toArrayBuffer(nodeBuffer);

    const rows = await parseStartlistBuffer(buf);
    expect(rows).toHaveLength(2);
  });
});

describe("validateStartlistRows", () => {
  const makeRunner = (bib: number): Runner => ({
    id: `id-${bib}`,
    bib,
    name: `Runner ${bib}`,
    gender: "male",
    notes: null,
    edition_year: 2026,
  });

  it("returns null for valid rows with no conflicts", () => {
    const rows: StartlistRow[] = [
      { bib: 1, name: "A", gender: "male" },
      { bib: 2, name: "B", gender: "female" },
    ];
    expect(validateStartlistRows(rows, [])).toBeNull();
  });

  it("returns error for empty rows", () => {
    expect(validateStartlistRows([], [])).toBe("No runners found in file");
  });

  it("returns error for duplicate bib in file", () => {
    const rows: StartlistRow[] = [
      { bib: 1, name: "A", gender: "male" },
      { bib: 1, name: "B", gender: "female" },
    ];
    expect(validateStartlistRows(rows, [])).toBe("Duplicate bib number 1 in file");
  });

  it("returns error for bib conflict with existing runners", () => {
    const rows: StartlistRow[] = [
      { bib: 5, name: "A", gender: "male" },
    ];
    expect(validateStartlistRows(rows, [makeRunner(5)])).toBe(
      "Bib number 5 is already registered"
    );
  });
});
