import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  getRunners,
  getAllLaps,
  resolveCurrentEditionFromDb,
  getEdition,
} from "@/lib/race/db";
import { buildLeaderboard } from "@/lib/race/leaderboard";
import { buildDuvWorkbook } from "@/lib/race/duv-export";
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

    const entries = leaderboard.filter((e) => e.totalLaps >= 1);

    const templateBuf = await readFile(
      path.join(process.cwd(), "src/lib/race/duv-template.xlsx")
    );
    const templateBuffer = templateBuf.buffer.slice(
      templateBuf.byteOffset,
      templateBuf.byteOffset + templateBuf.byteLength
    );

    const xlsx = await buildDuvWorkbook(
      {
        eventName: "Altorp Ultra",
        date: edition.date,
        durationLabel: `${edition.durationHours}h`,
        lapDistanceKm: edition.lapDistanceKm,
        entries,
      },
      templateBuffer
    );

    return new NextResponse(xlsx, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="altorp-ultra-${edition.year}-duv.xlsx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
