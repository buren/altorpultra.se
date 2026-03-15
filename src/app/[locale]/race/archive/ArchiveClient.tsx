"use client";

import { Card, CardContent } from "@/components/ui/card";
import { site } from "@/lib/config";
import { ArrowRight, Trophy, Users, MapPin } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { EditionSummary } from "./page";

export default function ArchiveClient({ summaries }: { summaries: EditionSummary[] }) {
  const t = useTranslations("archive");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Altorp Ultra logo" width={32} height={32} className="rounded-full invert" />
              <h1 className="text-2xl font-bold">{site.name}</h1>
            </Link>
            <p className="text-gray-400 text-sm">{t("subtitle")}</p>
          </div>
          <LanguageSwitcher scrolled={false} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <h2 className="text-2xl font-bold">{t("title")}</h2>

        {summaries.length === 0 && (
          <p className="text-gray-500">{t("noEditions")}</p>
        )}

        {summaries.map((ed) => (
          <Link key={ed.year} href={`/race/${ed.year}`} className="block group">
            <Card className="transition-shadow group-hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">{ed.year}</span>
                      {ed.status === "published" && (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                          {t("upcoming")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {ed.dateFormatted} &middot; {ed.durationHours}h &middot; {ed.lapDistanceKm} km {t("loop")}
                    </p>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {ed.runnerCount} {t("runners")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {ed.totalLaps} {t("laps")} &middot; {ed.totalDistanceKm} km
                      </span>
                    </div>

                    {(ed.winnerMen || ed.winnerWomen) && (
                      <div className="space-y-0.5">
                        {ed.winnerMen && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                            <span className="text-gray-400">♂</span>
                            {ed.winnerMen.name} — {ed.winnerMen.laps} {t("laps")} ({ed.winnerMen.distanceKm} km)
                          </p>
                        )}
                        {ed.winnerWomen && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                            <span className="text-gray-400">♀</span>
                            {ed.winnerWomen.name} — {ed.winnerWomen.laps} {t("laps")} ({ed.winnerWomen.distanceKm} km)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-700 mt-1 shrink-0 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        {site.name} &middot; {site.website}
      </footer>
    </div>
  );
}
