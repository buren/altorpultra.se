import { NextRequest, NextResponse } from "next/server";
import { handleRegisterLap, handleDeleteLap, handleEditLapTimestamp, handleInsertBackdatedLap } from "@/lib/race/api-handlers";
import { getRecentLaps, resolveCurrentEditionFromDb, getEdition } from "@/lib/race/db";
import { createServerClient } from "@/lib/race/supabase-server";

export const dynamic = "force-dynamic";

async function resolveYear(req: NextRequest) {
  const supabase = createServerClient();
  const yearParam = new URL(req.url).searchParams.get("year");
  const edition = yearParam
    ? await getEdition(supabase, Number(yearParam))
    : await resolveCurrentEditionFromDb(supabase);
  return edition;
}

export async function GET(req: NextRequest) {
  try {
    const edition = await resolveYear(req);
    if (!edition) {
      return NextResponse.json({ ok: false, error: "No edition found" }, { status: 404 });
    }
    const laps = await getRecentLaps(createServerClient(), edition.year, 20);
    return NextResponse.json({ ok: true, data: laps });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const edition = await resolveYear(req);
  if (!edition) {
    return NextResponse.json({ ok: false, error: "No edition found" }, { status: 404 });
  }

  const body = await req.json();
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  const result = await handleRegisterLap(body, edition.year, password, serverPassword);

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lapId = searchParams.get("id") ?? "";
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  const result = await handleDeleteLap(lapId, password, serverPassword);

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  const result = await handleEditLapTimestamp(body, password, serverPassword);

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  const result = await handleInsertBackdatedLap(body, password, serverPassword);

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result, { status: 201 });
}
