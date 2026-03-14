import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/race/supabase-server";
import { getRunners, addRunner, resolveCurrentEditionFromDb } from "@/lib/race/db";
import { validateStartlistRows, StartlistRow } from "@/lib/race/import-startlist";
import { Gender } from "@/lib/race/types";

export const dynamic = "force-dynamic";

const VALID_GENDERS = new Set<string>(["male", "female", "other"]);

export async function POST(req: NextRequest) {
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  if (password !== serverPassword) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const edition = await resolveCurrentEditionFromDb(supabase);
  if (!edition) {
    return NextResponse.json({ ok: false, error: "No edition found" }, { status: 404 });
  }

  let body: { runners: StartlistRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.runners) || body.runners.length === 0) {
    return NextResponse.json({ ok: false, error: "No runners provided" }, { status: 400 });
  }

  // Validate each row shape
  for (const r of body.runners) {
    if (!Number.isInteger(r.bib) || r.bib < 1) {
      return NextResponse.json({ ok: false, error: `Invalid bib: ${r.bib}` }, { status: 400 });
    }
    if (!r.name || typeof r.name !== "string" || !r.name.trim()) {
      return NextResponse.json({ ok: false, error: `Invalid name for bib ${r.bib}` }, { status: 400 });
    }
    if (!VALID_GENDERS.has(r.gender)) {
      return NextResponse.json({ ok: false, error: `Invalid gender for bib ${r.bib}` }, { status: 400 });
    }
  }

  // Check bib conflicts with existing runners
  const existing = await getRunners(supabase, edition.year);
  const validationErr = validateStartlistRows(body.runners, existing);
  if (validationErr) {
    return NextResponse.json({ ok: false, error: validationErr }, { status: 400 });
  }

  // Bulk insert
  try {
    for (const r of body.runners) {
      await addRunner(supabase, {
        bib: r.bib,
        name: r.name.trim(),
        gender: r.gender as Gender,
        notes: null,
        edition_year: edition.year,
      });
    }
    return NextResponse.json({ ok: true, count: body.runners.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
