import { Metadata } from "next";
import { createServerClient } from "@/lib/race/supabase-server";
import { getRunners, getAllLaps, getEdition } from "@/lib/race/db";
import { buildLeaderboard } from "@/lib/race/leaderboard";
import { site } from "@/lib/config";
import RunnerClient from "./RunnerClient";

interface Props {
  params: Promise<{ locale: string; year: string; bib: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, bib } = await params;
  const yearNum = Number(year);
  const bibNum = Number(bib);

  try {
    const supabase = createServerClient();
    const edition = await getEdition(supabase, yearNum);
    if (!edition) return { title: `Runner #${bib} — ${site.name}` };

    const runners = await getRunners(supabase, yearNum);
    const laps = await getAllLaps(supabase, yearNum);
    const leaderboard = buildLeaderboard(
      runners,
      laps,
      edition.lapDistanceKm,
      edition.lapElevationM,
      edition.startDateTime
    );

    const idx = leaderboard.findIndex((e) => e.runner.bib === bibNum);
    if (idx === -1) return { title: `Runner #${bib} — ${site.name}` };

    const entry = leaderboard[idx];
    const rank = idx + 1;
    const title = `${entry.runner.name} — ${site.name} ${year}`;
    const description = `#${rank} · ${entry.totalLaps} laps · ${entry.totalDistanceKm} km · ${entry.totalElevationM} m elevation`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        siteName: site.name,
        url: `${site.website}/race/${year}/runner/${bib}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return { title: `Runner #${bib} — ${site.name}` };
  }
}

export default function RunnerPage() {
  return <RunnerClient />;
}
