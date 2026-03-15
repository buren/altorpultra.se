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

export default async function RunnerPage({ params }: Props) {
  const { year, bib } = await params;
  const yearNum = Number(year);
  const bibNum = Number(bib);

  let jsonLd = null;
  try {
    const supabase = createServerClient();
    const edition = await getEdition(supabase, yearNum);
    if (edition) {
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
      if (idx !== -1) {
        const entry = leaderboard[idx];
        const rank = idx + 1;
        jsonLd = [
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: `${site.name} ${year}`,
                item: `${site.website}/race/${year}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: entry.runner.name,
                item: `${site.website}/race/${year}/runner/${bib}`,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            name: `${site.name} ${year}`,
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
            url: `${site.website}/race/${year}`,
            sport: "Ultramarathon",
            competitor: {
              "@type": "Person",
              name: entry.runner.name,
              description: `#${rank} — ${entry.totalLaps} laps, ${entry.totalDistanceKm} km, ${entry.totalElevationM} m elevation`,
            },
          },
        ];
      }
    }
  } catch {
    // Structured data is non-critical; skip on error
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RunnerClient />
    </>
  );
}
