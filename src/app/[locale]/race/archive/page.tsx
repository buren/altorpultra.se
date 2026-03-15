import type { Metadata } from "next";
import { site } from "@/lib/config";
import { createServerClient } from "@/lib/race/supabase-server";
import { getPublishedEditions, getRunners, getAllLaps } from "@/lib/race/db";
import { buildLeaderboard, filterByGender } from "@/lib/race/leaderboard";
import { getEditionStatus } from "@/lib/race/editions";
import ArchiveClient from "./ArchiveClient";

export async function generateMetadata(): Promise<Metadata> {
  const title = `Results Archive — ${site.name}`;
  const description = `Browse results from all ${site.name} editions.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: site.name },
  };
}

export interface EditionSummary {
  year: number;
  date: string;
  dateFormatted: string;
  durationHours: number;
  lapDistanceKm: number;
  lapElevationM: number;
  runnerCount: number;
  totalLaps: number;
  totalDistanceKm: number;
  status: "published" | "completed";
  winnerMen: { name: string; bib: number; laps: number; distanceKm: number } | null;
  winnerWomen: { name: string; bib: number; laps: number; distanceKm: number } | null;
}

export default async function ArchivePage() {
  const supabase = createServerClient();
  const editions = await getPublishedEditions(supabase);
  const now = new Date();

  const summaries: EditionSummary[] = [];

  for (const edition of editions) {
    const status = getEditionStatus(edition, now);
    if (status === "draft") continue;

    const runners = await getRunners(supabase, edition.year);
    const laps = await getAllLaps(supabase, edition.year);
    const leaderboard = buildLeaderboard(
      runners,
      laps,
      edition.lapDistanceKm,
      edition.lapElevationM,
      edition.startDateTime
    );

    const totalLaps = leaderboard.reduce((s, e) => s + e.totalLaps, 0);
    const totalDistanceKm = leaderboard.reduce((s, e) => s + e.totalDistanceKm, 0);

    const topMan = filterByGender(leaderboard, "male")[0] ?? null;
    const topWoman = filterByGender(leaderboard, "female")[0] ?? null;
    const toWinner = (e: typeof topMan) =>
      e && e.totalLaps > 0
        ? { name: e.runner.name, bib: e.runner.bib, laps: e.totalLaps, distanceKm: e.totalDistanceKm }
        : null;

    summaries.push({
      year: edition.year,
      date: edition.date,
      dateFormatted: edition.dateFormatted,
      durationHours: edition.durationHours,
      lapDistanceKm: edition.lapDistanceKm,
      lapElevationM: edition.lapElevationM,
      runnerCount: runners.length,
      totalLaps,
      totalDistanceKm,
      status: status as "published" | "completed",
      winnerMen: toWinner(topMan),
      winnerWomen: toWinner(topWoman),
    });
  }

  // Sort newest first
  summaries.sort((a, b) => b.year - a.year);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} — Results Archive`,
    itemListElement: summaries.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SportsEvent",
        name: `${site.name} ${s.year}`,
        startDate: s.date,
        url: `${site.website}/race/${s.year}`,
        location: {
          "@type": "Place",
          name: "Altorp",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Djursholm",
            addressRegion: site.region,
            addressCountry: "SE",
          },
        },
        sport: "Ultramarathon",
        description: `${s.durationHours}-hour ultramarathon. ${s.runnerCount} runners, ${s.totalLaps} laps, ${s.totalDistanceKm} km total.`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArchiveClient summaries={summaries} />
    </>
  );
}
