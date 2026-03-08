import { NextRequest, NextResponse } from "next/server";
import { handleAddRunner } from "@/lib/race/api-handlers";
import { getRunners, updateRunner, deleteRunner, resolveCurrentEditionFromDb, getEdition } from "@/lib/race/db";
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
    const runners = await getRunners(createServerClient(), edition.year);
    return NextResponse.json({ ok: true, data: runners });
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
  const result = await handleAddRunner(body, edition.year, password, serverPassword);

  if (!result.ok) {
    const status = result.error === "Unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  if (password !== serverPassword) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, bib, gender } = await req.json();
  try {
    const runner = await updateRunner(createServerClient(), id, { name, bib, gender });
    return NextResponse.json({ ok: true, data: runner });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  if (password !== serverPassword) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  try {
    await deleteRunner(createServerClient(), id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
