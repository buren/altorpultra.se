"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardEntry } from "@/lib/race/types";
import { formatLapTime, formatTimestamp } from "@/lib/race/format";
import { site, currentYear, event } from "@/lib/constants";
import { supabase } from "@/lib/race/supabase";

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  topMen: LeaderboardEntry[];
  topWomen: LeaderboardEntry[];
}

function LeaderboardTable({
  entries,
  title,
  showMedals,
}: {
  entries: LeaderboardEntry[];
  title: string;
  showMedals?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return null;
  }

  const medals = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-500">
            <tr>
              <th className="px-3 py-2 w-10">#</th>
              <th className="px-3 py-2 w-14">Bib</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2 text-right">Laps</th>
              <th className="px-3 py-2 text-right hidden sm:table-cell">
                Distance
              </th>
              <th className="px-3 py-2 text-right hidden md:table-cell">
                Avg Lap
              </th>
              <th className="px-3 py-2 text-right hidden md:table-cell">
                Fastest
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((e, i) => (
              <>
                <tr
                  key={e.runner.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedId(
                      expandedId === e.runner.id ? null : e.runner.id
                    )
                  }
                >
                  <td className="px-3 py-2">
                    {showMedals && i < 3 ? (
                      <span className={`font-bold ${medals[i]}`}>{i + 1}</span>
                    ) : (
                      <span className="text-gray-500">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-gray-600">
                    {e.runner.bib}
                  </td>
                  <td className="px-3 py-2 font-medium">{e.runner.name}</td>
                  <td className="px-3 py-2 text-right font-bold">
                    {e.totalLaps}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden sm:table-cell">
                    {e.totalDistanceKm} km
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden md:table-cell">
                    {formatLapTime(e.avgLapSeconds)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden md:table-cell">
                    {formatLapTime(e.fastestLapSeconds)}
                  </td>
                </tr>
                {expandedId === e.runner.id && e.laps.length > 0 && (
                  <tr key={`${e.runner.id}-detail`}>
                    <td colSpan={7} className="bg-gray-50 px-6 py-3">
                      <p className="text-sm font-semibold text-gray-500 mb-2">
                        Lap splits for #{e.runner.bib} {e.runner.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {e.laps.map((lap, li) => {
                          const prevTs =
                            li > 0 ? e.laps[li - 1].timestamp : null;
                          const dur = prevTs
                            ? (new Date(lap.timestamp).getTime() -
                                new Date(prevTs).getTime()) /
                              1000
                            : null;
                          return (
                            <div
                              key={lap.id}
                              className="bg-white border rounded px-2 py-1 text-sm"
                            >
                              <span className="text-gray-400">
                                L{lap.lap_number}
                              </span>{" "}
                              <span className="font-mono">
                                {formatTimestamp(lap.timestamp)}
                              </span>
                              {dur !== null && (
                                <span className="text-gray-500 ml-1">
                                  ({formatLapTime(dur)})
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RacePage() {
  const [data, setData] = useState<LeaderboardData | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/race/leaderboard");
    const json = await res.json();
    if (json.ok) setData(json.data);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("race-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "laps" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "runners" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const totalLaps = data.leaderboard.reduce(
    (sum, e) => sum + e.totalLaps,
    0
  );
  const activeRunners = data.leaderboard.filter(
    (e) => e.totalLaps > 0
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white px-4 py-4">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl font-bold">{site.name} {currentYear}</h1>
          <p className="text-gray-400 text-sm">Live Results</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{data.leaderboard.length}</p>
              <p className="text-sm text-gray-500">Runners</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{activeRunners}</p>
              <p className="text-sm text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{totalLaps}</p>
              <p className="text-sm text-gray-500">Total Laps</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Men & Women side by side */}
        {(data.topMen.length > 0 || data.topWomen.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LeaderboardTable
              entries={data.topMen}
              title="Top Men"
              showMedals
            />
            <LeaderboardTable
              entries={data.topWomen}
              title="Top Women"
              showMedals
            />
          </div>
        )}

        {/* Full Leaderboard */}
        <LeaderboardTable
          entries={data.leaderboard}
          title="Overall Leaderboard"
        />
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        {site.name} &middot; {site.website}
      </footer>
    </div>
  );
}
