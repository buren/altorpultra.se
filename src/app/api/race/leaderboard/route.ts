import { NextRequest, NextResponse } from "next/server";
import { getRunners, getAllLaps, getEdition, getPublishedEditions, resolveCurrentEditionFromDb } from "@/lib/race/db";
import { buildLeaderboard, filterByGender } from "@/lib/race/leaderboard";
import { createServerClient } from "@/lib/race/supabase-server";
import { Gender } from "@/lib/race/types";

export const dynamic = "force-dynamic";

interface CourseRecord {
  name: string;
  year: number;
  totalLaps: number;
  totalDistanceKm: number;
}

async function getCourseRecords(supabase: ReturnType<typeof createServerClient>) {
  const editions = await getPublishedEditions(supabase);

  const records: Record<string, CourseRecord | null> = { male: null, female: null };

  for (const ed of editions) {
    const runners = await getRunners(supabase, ed.year);
    const laps = await getAllLaps(supabase, ed.year);
    const board = buildLeaderboard(runners, laps, ed.lapDistanceKm, ed.lapElevationM, ed.startDateTime);

    for (const gender of ["male", "female"] as Gender[]) {
      const top = filterByGender(board, gender)[0];
      if (!top || top.totalLaps === 0) continue;
      const current = records[gender];
      if (!current || top.totalLaps > current.totalLaps) {
        records[gender] = {
          name: top.runner.name,
          year: ed.year,
          totalLaps: top.totalLaps,
          totalDistanceKm: top.totalDistanceKm,
        };
      }
    }
  }

  return records;
}

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

    const courseRecords = await getCourseRecords(supabase);

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
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
