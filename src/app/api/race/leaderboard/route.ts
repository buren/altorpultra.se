import { NextRequest, NextResponse } from "next/server";
import { getRunners, getAllLaps, getEdition, getPublishedEditions, resolveCurrentEditionFromDb } from "@/lib/race/db";
import { buildLeaderboard, filterByGender } from "@/lib/race/leaderboard";
import { createServerClient } from "@/lib/race/supabase-server";
import { computeCourseRecords, findCourseRecordHolderIds, EditionLeaderboard } from "@/lib/race/course-records";
import { buildNextRunnersList } from "@/lib/race/eta";

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

    // Build leaderboards for all published editions to compute course records
    const allEditions = await getPublishedEditions(supabase);
    const editionLeaderboards: EditionLeaderboard[] = [];
    for (const ed of allEditions) {
      if (ed.year === edition.year) {
        editionLeaderboards.push({ year: ed.year, leaderboard });
      } else {
        const edRunners = await getRunners(supabase, ed.year);
        const edLaps = await getAllLaps(supabase, ed.year);
        const edBoard = buildLeaderboard(edRunners, edLaps, ed.lapDistanceKm, ed.lapElevationM, ed.startDateTime);
        editionLeaderboards.push({ year: ed.year, leaderboard: edBoard });
      }
    }

    const courseRecords = computeCourseRecords(editionLeaderboards);
    const courseRecordHolderIds = Array.from(findCourseRecordHolderIds(leaderboard, courseRecords));

    const nextRunners = buildNextRunnersList(
      leaderboard,
      edition.startDateTime,
      new Date(),
      edition.endDateTime
    ).slice(0, 10);

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
        courseRecords,
        courseRecordHolderIds,
        nextRunners,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
