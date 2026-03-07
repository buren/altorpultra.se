import { NextRequest, NextResponse } from "next/server";
import { handleAddRunner } from "@/lib/race/api-handlers";
import { getRunners, updateRunner, deleteRunner } from "@/lib/race/db";
import { createServerClient } from "@/lib/race/supabase-server";
import { currentYear } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const runners = await getRunners(createServerClient(), currentYear);
    return NextResponse.json({ ok: true, data: runners });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  const result = await handleAddRunner(body, currentYear, password, serverPassword);

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
