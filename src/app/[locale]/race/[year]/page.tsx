import type { Metadata } from "next";
import { site } from "@/lib/config";
import { getEdition, getRunners, getAllLaps } from "@/lib/race/db";
import { buildLeaderboard } from "@/lib/race/leaderboard";
import { createServerClient } from "@/lib/race/supabase-server";
import RaceYearClient from "./RaceYearClient";

type Props = {
  params: Promise<{ year: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year: yearStr } = await params;
  const year = Number(yearStr);

  const supabase = createServerClient();
  const edition = await getEdition(supabase, year);

  const title = edition
    ? `${site.name} ${year} – Results`
    : `${site.name} ${year}`;
  const description = edition
    ? `Live leaderboard and results for ${site.name} ${year}. ${edition.lapDistanceKm} km loop, ${edition.durationHours}-hour ultramarathon in ${site.location}.`
    : `Results for ${site.name} ${year}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function RaceYearPage({ params }: Props) {
  const { year: yearStr } = await params;
  const year = Number(yearStr);

  const supabase = createServerClient();
  const edition = await getEdition(supabase, year);

  let jsonLd = null;
  if (edition) {
    const runners = await getRunners(supabase, year);
    const laps = await getAllLaps(supabase, year);
    const leaderboard = buildLeaderboard(
      runners,
      laps,
      edition.lapDistanceKm,
      edition.lapElevationM,
      edition.startDateTime
    );

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${site.name} ${year}`,
      description: `${edition.durationHours}-hour ultramarathon on a ${edition.lapDistanceKm} km loop in ${site.location}.`,
      startDate: edition.startDateTime,
      endDate: edition.endDateTime,
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
      organizer: {
        "@type": "Organization",
        name: site.name,
        url: site.website,
      },
      url: `${site.website}/race/${year}`,
      sport: "Ultramarathon",
      ...(leaderboard.length > 0 && {
        competitor: leaderboard.slice(0, 20).map((entry, i) => ({
          "@type": "Person",
          name: entry.runner.name,
          description: `#${i + 1} — ${entry.totalLaps} laps, ${entry.totalDistanceKm} km`,
        })),
      }),
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RaceYearClient />
    </>
  );
}
