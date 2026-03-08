import { NextRequest, NextResponse } from "next/server";
import { getRunners, getAllLaps, resolveCurrentEditionFromDb, getEdition } from "@/lib/race/db";
import { buildLeaderboard } from "@/lib/race/leaderboard";
import { buildCsvExport } from "@/lib/race/services";
import { createServerClient } from "@/lib/race/supabase-server";

export async function GET(req: NextRequest) {
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";

  if (password !== serverPassword || !serverPassword) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    const yearParam = new URL(req.url).searchParams.get("year");
    const edition = yearParam
      ? await getEdition(supabase, Number(yearParam))
      : await resolveCurrentEditionFromDb(supabase);

    if (!edition) {
      return NextResponse.json({ ok: false, error: "No edition found" }, { status: 404 });
    }

    const runners = await getRunners(supabase, edition.year);
    const laps = await getAllLaps(supabase, edition.year);

    const leaderboard = buildLeaderboard(
      runners,
      laps,
      edition.lapDistanceKm,
      edition.lapElevationM
    );

    const csv = buildCsvExport(leaderboard);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="altorp-ultra-${edition.year}-results.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
