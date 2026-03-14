/**
 * Transform tmp/laps1.json into SQL inserts for the 2025 edition.
 * Run: npx tsx scripts/import-2025.ts > supabase/seed-2025.sql
 */

import { readFileSync } from "fs";

interface LapRow {
  journeyId: string;
  email: string;
  name: string;
  cardId: string;
  memberCardId: string;
  teamId: string;
  triggerType: number;
  triggerTypeName: string;
  triggeredAt: string;
  scanLocationId: string | null;
  scanLocation: string | null;
}

// Gender mapping by memberCardId
const genderMap: Record<string, "male" | "female"> = {
  // Female
  "4a89e4d5-3afc-4ca8-9015-3b6b2878421f": "female", // Amanda Gardelin
  "5974ddb3-3c3d-40b9-82df-f2d2ba0170ca": "female", // Jonina
  "827f37af-d484-4bd2-9ccb-a2c31097d4cb": "female", // Anna Scarabin
  "ae4bea23-a32f-4865-bfc6-73490e25c9f1": "female", // Anna Westlund
  "69426f58-cb41-430a-96aa-88bbd4b70e77": "female", // Veronika Tynnerman
  "4e3e0380-b69d-4a40-b398-f47bdce12058": "female", // Helena Scarabin
  "ce87fde2-fefb-4ea7-8716-a8e085d5e8d7": "female", // Jenny Nordström
  "845a7ab4-753e-4a35-b521-5f5b592af924": "female", // Linda Hoff
  "b43dbd60-8eeb-49fe-8d76-5e208f51abf3": "female", // Annett Luleich
  "f0a06dbf-9a07-4903-b138-cf1ff7f509f7": "female", // Katrin Muschter
  "6e7ab7cd-d535-4eb0-b923-c470387d762b": "female", // Nicole Silverstolpe
  "3eb00ea0-9510-472e-8ce2-3fcc4da45d1b": "female", // Lisa Unghanse
  "687d37f5-4d54-4780-95ac-e2a728d853e9": "female", // Filipha Sandberg
  // Male (all others)
  "d4112bae-25a1-4276-ba0d-b3c2e0e40978": "male", // Carl William Eliasson
  "d33e0151-dfa6-47bb-933f-7e2c9b69fff6": "male", // David Åhman
  "e13747dc-e9f8-4fd6-930d-c2054a56dd66": "male", // Lars Taravosh
  "049a6bec-2123-478b-ad2f-5be695229937": "male", // Mads Thamsborg
  "fbdf52c2-15c1-4e9c-ab0a-64898d90289f": "male", // Robert Ingram
  "0d9f7ec9-cb37-4484-9c94-f55b28bd855e": "male", // Fredrik Nilsson
  "ce6428c2-5d00-4444-a0a4-8571eaa27cbe": "male", // Erik Kjellström
  "7fa12697-83df-4aac-b5ca-f87bd4a1ed64": "male", // Alvin Bauer
  "bfe60c94-5134-4547-aeea-6dab43ce1fdb": "male", // Marcus Sandström
  "2e93b96f-f320-4b2a-8c34-32e9c70027e7": "male", // William Landgren
  "a1a99d1c-5e68-4232-9ec8-2b4b4c95786d": "male", // Daniel Andersson
  "7fe8036b-5460-47a8-ab16-5015b152c4c2": "male", // Peter Nordström
  "e3acc293-ffef-4a59-baa4-4583123cd83e": "male", // Sebastian Thamsborg
  "c3c8516d-7909-4eb0-aa91-8c429dad20ce": "male", // Gustav Runersjö
  "dafda75e-b37e-48f0-876c-3d16e07333ba": "male", // Carl Lundin
  "5c053a3d-cf51-4a1d-81fa-8f9f1ef51e77": "male", // Carl Nordling
  "ca9539ce-2f24-4035-b2e6-ca126a4f9278": "male", // Fredric Ghatan
  "1da58634-da2a-4e00-8afd-ff08cdbd6bc3": "male", // Maurits Munninghoff
  "d1ec2f59-5d57-41f0-9c8f-0b620a03423a": "male", // Jacob Klerfelt
  "286197a5-3f9a-4f95-8847-2f543a1b8312": "male", // Philip Ghatan
  "e4c71708-b86b-4b28-8e6a-f4f7c394afdf": "male", // Fredrik Westermark
  "7d3e6a8b-69a1-47ac-bd47-7136a39d0078": "male", // Hugo Hållsten
  "60081435-5638-4c4b-a85c-995c71a8776a": "male", // Martin Puig de la Bellacasa Cristiansson
  "8dd216bb-939f-4f36-9312-28a6692a0786": "male", // Elias
  "888c597d-0d75-4644-af96-6721ea661595": "male", // Martin Svensson
  "52d74cbf-c51a-46a5-b815-ad5c8af089f4": "male", // Johan Hedström
  "ec3e3dfe-efdc-4e88-83a4-f09bb6a37cb3": "male", // Jens Rastad
};

const raw = JSON.parse(readFileSync("tmp/laps1.json", "utf-8"));
const rows: LapRow[] = raw.data.rows.map((r: unknown[]) => ({
  journeyId: r[0],
  email: r[1],
  name: r[2],
  cardId: r[3],
  memberCardId: r[4],
  teamId: r[5],
  triggerType: r[6],
  triggerTypeName: r[7],
  triggeredAt: r[8],
  scanLocationId: r[9],
  scanLocation: r[10],
}));

// Group by runner (memberCardId)
const byRunner = new Map<string, { name: string; laps: LapRow[] }>();
for (const row of rows) {
  const existing = byRunner.get(row.memberCardId);
  if (existing) {
    existing.laps.push(row);
  } else {
    byRunner.set(row.memberCardId, { name: row.name.trim(), laps: [row] });
  }
}

// Sort runners by lap count desc (leaderboard order), assign bib numbers
const runners = Array.from(byRunner.entries())
  .map(([id, data]) => ({ memberCardId: id, ...data }))
  .sort((a, b) => b.laps.length - a.laps.length);

function escSql(s: string): string {
  return s.replace(/'/g, "''");
}

console.log("-- 2025 Edition: Real race data imported from RaceID scans");
console.log("-- 40 runners, 200 laps from May 10, 2025\n");

// Insert runners
console.log("INSERT INTO runners (bib, name, gender, edition_year) VALUES");
const runnerValues = runners.map((r, i) => {
  const bib = i + 1;
  const gender = genderMap[r.memberCardId] ?? "other";
  return `  (${bib}, '${escSql(r.name)}', '${gender}', 2025)`;
});
console.log(runnerValues.join(",\n"));
console.log("ON CONFLICT (bib, edition_year) DO NOTHING;\n");

// Insert laps — we need runner IDs, so use a CTE approach with bib lookup
console.log("-- Insert laps using bib-based runner lookup");
console.log("INSERT INTO laps (runner_id, lap_number, timestamp) VALUES");

const lapValues: string[] = [];
for (let i = 0; i < runners.length; i++) {
  const r = runners[i];
  const bib = i + 1;
  // Sort laps chronologically to assign lap numbers
  const sorted = [...r.laps].sort(
    (a, b) => new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime()
  );
  for (let lap = 0; lap < sorted.length; lap++) {
    lapValues.push(
      `  ((SELECT id FROM runners WHERE bib = ${bib} AND edition_year = 2025), ${lap + 1}, '${sorted[lap].triggeredAt}')`
    );
  }
}
console.log(lapValues.join(",\n"));
console.log("ON CONFLICT (runner_id, lap_number) DO NOTHING;");
