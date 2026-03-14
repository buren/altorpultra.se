"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardEntry } from "@/lib/race/types";
import { formatLapTime, formatTimestamp } from "@/lib/race/format";
import { site } from "@/lib/config";
import { supabase } from "@/lib/race/supabase";
import { ArrowLeft } from "lucide-react";
import { LapTimeChart } from "@/components/race/LapTimeChart";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface EditionInfo {
  year: number;
  startDateTime: string;
  endDateTime: string;
  lapDistanceKm: number;
  lapElevationM: number;
  dateFormatted: string;
}

function formatPace(seconds: number | null, lapDistanceKm: number): string {
  if (seconds == null) return "–";
  const paceSeconds = seconds / lapDistanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function RunnerPage() {
  const t = useTranslations('runner');
  const params = useParams();
  const year = Number(params.year);
  const bib = Number(params.bib);

  const [entry, setEntry] = useState<LeaderboardEntry | null>(null);
  const [edition, setEdition] = useState<EditionInfo | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/race/leaderboard?year=${year}`);
    const json = await res.json();
    if (!json.ok) return;

    setEdition(json.data.edition);
    const leaderboard: LeaderboardEntry[] = json.data.leaderboard;
    const idx = leaderboard.findIndex((e) => e.runner.bib === bib);
    if (idx === -1) {
      setNotFound(true);
      return;
    }
    setEntry(leaderboard[idx]);
    setRank(idx + 1);
    setNotFound(false);
  }, [bib, year]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

    const channel = supabase
      .channel("runner-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "laps" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "runners" }, () => fetchData())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">{t('notFound', { bib })}</p>
        <Link href={`/race/${year}`} className="text-blue-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {t('backToLeaderboard')}
        </Link>
      </div>
    );
  }

  if (!entry || !edition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">{t('loading')}</p>
      </div>
    );
  }

  const e = entry;
  const leaderboardHref = `/race/${edition.year}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Altorp Ultra logo" width={32} height={32} className="rounded-full invert" />
              <h1 className="text-2xl font-bold">{site.name} {edition.year}</h1>
            </Link>
            <p className="text-gray-400 text-sm">{t('liveResults')}</p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher scrolled={false} />
            <Link href={leaderboardHref} className="bg-gray-700 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-600">
              {t('viewLeaderboard')}
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-gray-900 text-white font-mono font-bold text-2xl w-14 h-14 rounded-lg flex items-center justify-center">
            {e.runner.bib}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{e.runner.name}</h2>
            <p className="text-gray-500 text-sm">
              {e.runner.gender === "male" ? `♂ ${t('male')}` : e.runner.gender === "female" ? `♀ ${t('female')}` : t('other')}
              {rank != null && <span className="ml-2">&middot; {t('rank', { rank })}</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{e.totalLaps}</p>
              <p className="text-sm text-gray-500">{t('laps')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{e.totalDistanceKm} <span className="text-base font-normal text-gray-500">km</span></p>
              <p className="text-sm text-gray-500">{t('distance')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{e.totalElevationM} <span className="text-base font-normal text-gray-500">m</span></p>
              <p className="text-sm text-gray-500">{t('elevation')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold font-mono">{formatPace(e.avgLapSeconds, edition.lapDistanceKm)}</p>
              <p className="text-sm text-gray-500">{t('avgPace')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xl font-bold font-mono">{formatLapTime(e.avgLapSeconds)}</p>
              <p className="text-sm text-gray-500">{t('avgLap')}</p>
              {e.avgLapSeconds != null && <p className="text-xs text-gray-400">{formatPace(e.avgLapSeconds, edition.lapDistanceKm)} min/km</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xl font-bold font-mono text-green-600">{formatLapTime(e.fastestLapSeconds)}</p>
              <p className="text-sm text-gray-500">{t('fastestLap')}</p>
              {e.fastestLapSeconds != null && <p className="text-xs text-gray-400">{formatPace(e.fastestLapSeconds, edition.lapDistanceKm)} min/km</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xl font-bold font-mono text-red-500">{formatLapTime(e.slowestLapSeconds)}</p>
              <p className="text-sm text-gray-500">{t('slowestLap')}</p>
              {e.slowestLapSeconds != null && <p className="text-xs text-gray-400">{formatPace(e.slowestLapSeconds, edition.lapDistanceKm)} min/km</p>}
            </CardContent>
          </Card>
        </div>

        <LapTimeChart
          laps={e.laps}
          startDateTime={edition.startDateTime}
          avgLapSeconds={e.avgLapSeconds}
          title={t('lapTimeProgression')}
          avgLabel={t('avg')}
          lapLabel={t('lapHeader')}
          lapDistanceKm={edition.lapDistanceKm}
        />

        {e.laps.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3">{t('lapSplits')}</h3>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-sm text-gray-500">
                  <tr>
                    <th className="px-4 py-2">{t('lapHeader')}</th>
                    <th className="px-4 py-2">{t('time')}</th>
                    <th className="px-4 py-2 text-right">{t('duration')}</th>
                    <th className="px-4 py-2 text-right">{t('pace')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {e.laps.map((lap, li) => {
                    const prevTs = li > 0 ? e.laps[li - 1].timestamp : edition.startDateTime;
                    const dur = (new Date(lap.timestamp).getTime() - new Date(prevTs).getTime()) / 1000;
                    const isFastest = dur === e.fastestLapSeconds;
                    const isSlowest = dur === e.slowestLapSeconds;

                    return (
                      <tr key={lap.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{lap.lap_number}</td>
                        <td className="px-4 py-2 font-mono">{formatTimestamp(lap.timestamp)}</td>
                        <td className={`px-4 py-2 text-right font-mono font-medium ${isFastest ? "text-green-600" : isSlowest ? "text-red-500" : ""}`}>
                          {dur > 0 ? formatLapTime(dur) : "–"}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-500">
                          {dur > 0 ? `${formatPace(dur, edition.lapDistanceKm)} min/km` : "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="pt-2">
          <Link href={leaderboardHref} className="bg-gray-700 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-600 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {t('viewLeaderboard')}
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        {site.name} &middot; {site.website}
      </footer>
    </div>
  );
}
