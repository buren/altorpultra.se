import { NextResponse } from "next/server";
import { getRunners, getLaps } from "@/lib/race/db";
import { buildLeaderboard, filterByGender } from "@/lib/race/leaderboard";
import { supabaseServer } from "@/lib/race/supabase-server";
import { currentYear, event } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [runners, laps] = await Promise.all([
      getRunners(supabaseServer, currentYear),
      getLaps(supabaseServer, currentYear),
    ]);

    const leaderboard = buildLeaderboard(
      runners,
      laps,
      event.lapDistanceKm,
      event.lapElevationM
    );

    return NextResponse.json({
      ok: true,
      data: {
        leaderboard,
        topMen: filterByGender(leaderboard, "male").slice(0, 10),
        topWomen: filterByGender(leaderboard, "female").slice(0, 10),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
