/**
 * Export race results in DUV (Deutsche Ultramarathon-Vereinigung) format.
 *
 * Copies the DUV template and fills it with race data from Supabase.
 *
 * Usage:
 *   pnpm tsx scripts/export-duv.ts [year]
 *
 * Defaults to the most recent edition year.
 * Reads Supabase credentials from .env.local.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { buildLeaderboard } from "../src/lib/race/leaderboard";
import { toStockholmISO } from "../src/lib/race/editions";
import type { Runner, Lap } from "../src/lib/race/types";

// ---------------------------------------------------------------------------
// Load env from .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split "John Smith" into { first: "John", last: "Smith" } */
function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  const first = parts[0];
  const last = parts.slice(1).join(" ");
  return { first, last };
}

/** Format total distance as DUV "performance" for a timed race: total km */
function formatPerformanceKm(distanceKm: number): string {
  return `${distanceKm.toFixed(3)} km`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const yearArg = process.argv[2];

  // Fetch edition
  let editionQuery = supabase.from("editions").select("*");
  if (yearArg) {
    editionQuery = editionQuery.eq("year", parseInt(yearArg, 10));
  } else {
    editionQuery = editionQuery.order("year", { ascending: false }).limit(1);
  }

  const { data: editions, error: edErr } = await editionQuery;
  if (edErr || !editions?.length) {
    console.error("Could not fetch edition:", edErr?.message ?? "not found");
    process.exit(1);
  }
  const edition = editions[0];
  const year: number = edition.year;

  console.log(`Exporting DUV results for ${year} edition...`);

  // Fetch runners and laps
  const { data: runners, error: rErr } = await supabase
    .from("runners")
    .select("*")
    .eq("edition_year", year);

  if (rErr || !runners) {
    console.error("Could not fetch runners:", rErr?.message);
    process.exit(1);
  }

  const runnerIds = runners.map((r: Runner) => r.id);
  const { data: laps, error: lErr } = await supabase
    .from("laps")
    .select("*")
    .in("runner_id", runnerIds);

  if (lErr || !laps) {
    console.error("Could not fetch laps:", lErr?.message);
    process.exit(1);
  }

  console.log(`  ${runners.length} runners, ${laps.length} laps`);

  const startDateTime = toStockholmISO(edition.date, edition.start_time);
  const leaderboard = buildLeaderboard(
    runners as Runner[],
    laps as Lap[],
    Number(edition.lap_distance_km),
    Number(edition.lap_elevation_m),
    startDateTime
  );

  // ---------------------------------------------------------------------------
  // Build Excel from template
  // ---------------------------------------------------------------------------
  const templatePath = resolve(__dirname, "../templates/DUV_Results_Template.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const sheet = workbook.getWorksheet("DUV Results");
  if (!sheet) {
    console.error("Could not find 'DUV Results' sheet in template");
    process.exit(1);
  }

  // Fill event metadata
  sheet.getCell("C2").value = "Altorp Ultra";
  sheet.getCell("C3").value = edition.date;
  const startHour = parseInt(edition.start_time.slice(0, 2), 10);
  const endHour = parseInt(edition.end_time.slice(0, 2), 10);
  sheet.getCell("C4").value = `${endHour - startHour}h`;

  // Clear example data row (row 9)
  for (let col = 1; col <= 16; col++) {
    sheet.getRow(9).getCell(col).value = null;
  }
  // Clear placeholder rows 10-14
  for (let row = 10; row <= 14; row++) {
    for (let col = 1; col <= 16; col++) {
      sheet.getRow(row).getCell(col).value = null;
    }
  }

  // Fill results starting at row 9
  const DATA_START_ROW = 9;
  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    const row = sheet.getRow(DATA_START_ROW + i);
    const { first, last } = splitName(entry.runner.name);

    row.getCell(1).value = i + 1; // Rank
    row.getCell(2).value = last; // Surname
    row.getCell(3).value = first; // First Name
    row.getCell(4).value = entry.runner.gender === "male" ? "M" : "F"; // Gender
    // E (YoB) - we don't have this data
    row.getCell(6).value = "SWE"; // Nationality - default, adjust if needed
    row.getCell(7).value = formatPerformanceKm(entry.totalDistanceKm); // Performance
    // M (Length/Duration) - marks section for this distance category
    if (i === 0) {
      row.getCell(13).value = "8h";
    }
  }

  // Write output
  const tmpDir = resolve(__dirname, "../tmp");
  const { mkdirSync } = await import("fs");
  mkdirSync(tmpDir, { recursive: true });
  const outputPath = resolve(tmpDir, `duv-results-${year}.xlsx`);
  await workbook.xlsx.writeFile(outputPath);
  console.log(`\nWritten to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
