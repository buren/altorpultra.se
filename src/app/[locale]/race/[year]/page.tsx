import type { Metadata } from "next";
import { site } from "@/lib/config";
import { getEdition } from "@/lib/race/db";
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

export default function RaceYearPage() {
  return <RaceYearClient />;
}
