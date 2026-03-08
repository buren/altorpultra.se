import { NextRequest, NextResponse } from "next/server";
import { getRunners, getAllLaps, getEdition, resolveCurrentEditionFromDb } from "@/lib/race/db";
import { buildLeaderboard, filterByGender } from "@/lib/race/leaderboard";
import { createServerClient } from "@/lib/race/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
      edition.lapElevationM,
      edition.startDateTime
    );

    return NextResponse.json({
      ok: true,
      data: {
        edition: {
          year: edition.year,
          startDateTime: edition.startDateTime,
          endDateTime: edition.endDateTime,
          lapDistanceKm: edition.lapDistanceKm,
          lapElevationM: edition.lapElevationM,
          dateFormatted: edition.dateFormatted,
        },
        leaderboard,
        topMen: filterByGender(leaderboard, "male").slice(0, 10),
        topWomen: filterByGender(leaderboard, "female").slice(0, 10),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
