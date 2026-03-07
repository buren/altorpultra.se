import { NextRequest, NextResponse } from "next/server";
import { handleAddRunner } from "@/lib/race/api-handlers";
import { getRunners } from "@/lib/race/db";
import { supabase } from "@/lib/race/supabase";
import { currentYear } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const runners = await getRunners(supabase, currentYear);
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
