import { NextRequest, NextResponse } from "next/server";
import { getRunners, getAllLaps } from "@/lib/race/db";
import { buildLeaderboard } from "@/lib/race/leaderboard";
import { buildCsvExport } from "@/lib/race/services";
import { createServerClient } from "@/lib/race/supabase-server";
import { currentYear, event } from "@/lib/config";

export async function GET(req: NextRequest) {
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";

  if (password !== serverPassword || !serverPassword) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const runners = await getRunners(supabase, currentYear);
    const laps = await getAllLaps(supabase);

    const leaderboard = buildLeaderboard(
      runners,
      laps,
      event.lapDistanceKm,
      event.lapElevationM
    );

    const csv = buildCsvExport(leaderboard);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="altorp-ultra-${currentYear}-results.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
