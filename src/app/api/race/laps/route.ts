import { NextRequest, NextResponse } from "next/server";
import { handleRegisterLap, handleDeleteLap } from "@/lib/race/api-handlers";
import { getRecentLaps } from "@/lib/race/db";
import { supabaseServer } from "@/lib/race/supabase-server";
import { currentYear } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const laps = await getRecentLaps(supabaseServer, currentYear, 20);
    return NextResponse.json({ ok: true, data: laps });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  const result = await handleRegisterLap(body, currentYear, password, serverPassword);

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
