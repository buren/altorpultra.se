"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardEntry, Gender } from "@/lib/race/types";
import { formatLapTime, formatTimestamp, formatLastCompleted } from "@/lib/race/format";
import { site, currentYear, event } from "@/lib/constants";
import { supabase } from "@/lib/race/supabase";
import { getRacePhase, secondsUntil, formatDuration } from "@/lib/race/clock";
import { Search } from "lucide-react";
import Link from "next/link";

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  topMen: LeaderboardEntry[];
  topWomen: LeaderboardEntry[];
}

function GenderIcon({ gender }: { gender: Gender }) {
  if (gender === "male") return <span title="Male">♂</span>;
  if (gender === "female") return <span title="Female">♀</span>;
  return <span title="Other">–</span>;
}

function formatPace(avgLapSeconds: number | null): string {
  if (avgLapSeconds == null) return "–";
  const paceSeconds = avgLapSeconds / event.lapDistanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const PAGE_SIZES = [10, 20, 50, 100] as const;

function LeaderboardTable({
  entries,
  title,
  showMedals,
  showGender,
  now,
  paginate,
}: {
  entries: LeaderboardEntry[];
  title: string;
  showMedals?: boolean;
  showGender?: boolean;
  now?: Date;
  paginate?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [nameFilter, setNameFilter] = useState("");
  const filterRef = React.useRef<HTMLInputElement>(null);

  // Reset to first page when entries or filter change
  useEffect(() => {
    setPage(0);
  }, [entries.length, nameFilter]);

  if (entries.length === 0) {
    return null;
  }

  const indexedEntries = entries.map((e, i) => ({ entry: e, rank: i + 1 }));
  const filteredEntries = nameFilter
    ? indexedEntries.filter((item) =>
        item.entry.runner.name.toLowerCase().includes(nameFilter.toLowerCase())
      )
    : indexedEntries;

  const totalPages = paginate ? Math.ceil(filteredEntries.length / pageSize) : 1;
  const offset = paginate ? page * pageSize : 0;
  const visibleEntries = paginate ? filteredEntries.slice(offset, offset + pageSize) : filteredEntries;

  const medals = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <h2 className="text-xl font-bold">
          {title}
          {paginate && (
            <button
              type="button"
              onClick={() => filterRef.current?.focus()}
              className="ml-2 text-gray-400 hover:text-gray-600 align-middle sm:hidden"
            >
              <Search className="h-5 w-5 inline align-text-bottom" />
            </button>
          )}
        </h2>
        {paginate && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hidden sm:block" />
            <input
              ref={filterRef}
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Filter by name…"
              className="border rounded-md px-3 py-1.5 text-sm w-full sm:w-48 sm:pl-8"
            />
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-500">
            <tr>
              <th className="px-3 py-2 w-10">#</th>
              <th className="px-3 py-2 w-14">Bib</th>
              {showGender && <th className="px-3 py-2 w-10"></th>}
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
              {now && (
                <th className="px-3 py-2 text-right hidden sm:table-cell">
                  Last Lap
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleEntries.map(({ entry: e, rank }) => (
              <React.Fragment key={e.runner.id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedId(
                      expandedId === e.runner.id ? null : e.runner.id
                    )
                  }
                >
                  <td className="px-3 py-2">
                    {showMedals && rank <= 3 ? (
                      <span className={`font-bold ${medals[rank - 1]}`}>{rank}</span>
                    ) : (
                      <span className="text-gray-500">{rank}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-gray-600">
                    {e.runner.bib}
                  </td>
                  {showGender && (
                    <td className="px-3 py-2 text-gray-500">
                      <GenderIcon gender={e.runner.gender} />
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/race/${e.runner.bib}`} className="hover:underline" onClick={(ev) => ev.stopPropagation()}>
                      {e.runner.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {e.totalLaps}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden sm:table-cell">
                    {e.totalDistanceKm} km
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden md:table-cell">
                    {formatLapTime(e.avgLapSeconds)}
                    {e.avgLapSeconds != null && (
                      <span className="text-gray-400 text-xs ml-1">&middot; {formatPace(e.avgLapSeconds)} min/km</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden md:table-cell">
                    {formatLapTime(e.fastestLapSeconds)}
                    {e.fastestLapSeconds != null && (
                      <span className="text-gray-400 text-xs ml-1">&middot; {formatPace(e.fastestLapSeconds)} min/km</span>
                    )}
                  </td>
                  {now && (
                    <td className="px-3 py-2 text-right text-gray-500 text-sm hidden sm:table-cell">
                      {formatLastCompleted(e.lastLapTimestamp, now)}
                    </td>
                  )}
                </tr>
                {expandedId === e.runner.id && (
                  <tr>
                    <td colSpan={(showGender ? 8 : 7) + (now ? 1 : 0)} className="bg-gray-50 px-6 py-3">
                      <p className="text-sm font-semibold text-gray-500 mb-2">
                        #{e.runner.bib} {e.runner.name}
                        <Link href={`/race/${e.runner.bib}`} className="ml-2 text-xs font-normal text-blue-500 hover:underline">View profile &rarr;</Link>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div className="bg-white border rounded px-3 py-2 text-sm">
                          <span className="text-gray-400 block text-xs">Distance</span>
                          <span className="font-semibold">{e.totalDistanceKm} km</span>
                        </div>
                        <div className="bg-white border rounded px-3 py-2 text-sm">
                          <span className="text-gray-400 block text-xs">Avg Lap</span>
                          <span className="font-semibold font-mono">{formatLapTime(e.avgLapSeconds)}</span>
                          {e.avgLapSeconds != null && (
                            <span className="text-gray-400 text-xs ml-1">&middot; {formatPace(e.avgLapSeconds)} min/km</span>
                          )}
                        </div>
                        <div className="bg-white border rounded px-3 py-2 text-sm">
                          <span className="text-gray-400 block text-xs">Fastest</span>
                          <span className="font-semibold font-mono">{formatLapTime(e.fastestLapSeconds)}</span>
                          {e.fastestLapSeconds != null && (
                            <span className="text-gray-400 text-xs ml-1">&middot; {formatPace(e.fastestLapSeconds)} min/km</span>
                          )}
                        </div>
                        {now && e.lastLapTimestamp && (
                          <div className="bg-white border rounded px-3 py-2 text-sm">
                            <span className="text-gray-400 block text-xs">Last Lap</span>
                            <span className="font-semibold">{formatLastCompleted(e.lastLapTimestamp, now)}</span>
                          </div>
                        )}
                      </div>
                      {e.laps.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-400 mb-1">Lap splits</p>
                          <div className="flex flex-wrap gap-2">
                            {e.laps.map((lap, li) => {
                              const prevTs =
                                li > 0
                                  ? e.laps[li - 1].timestamp
                                  : event.startDateTime;
                              const dur =
                                (new Date(lap.timestamp).getTime() -
                                  new Date(prevTs).getTime()) /
                                1000;
                              const showDur = dur > 0;
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
                                  {showDur && (
                                    <>
                                      <span className="text-gray-500 ml-1">
                                        {formatLapTime(dur)}
                                      </span>
                                      <span className="text-gray-400 text-xs ml-1">
                                        &middot; {formatPace(dur)} min/km
                                      </span>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {paginate && totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="border rounded px-2 py-1 bg-white"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500">
              {offset + 1}–{Math.min(offset + pageSize, filteredEntries.length)} of {filteredEntries.length}
            </span>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RacePage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/race/leaderboard");
    const json = await res.json();
    if (json.ok) setData(json.data);
  }, []);

  // Polling + realtime updates
  // Polling ensures data is always fresh; realtime provides instant updates when working.
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

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
      clearInterval(interval);
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
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{site.name} {currentYear}</h1>
            <p className="text-gray-400 text-sm">Live Results</p>
          </div>
          <div className="text-right">
            {(() => {
              const phase = getRacePhase(event.startDateTime, event.endDateTime, now);
              if (phase === "before") {
                const secs = secondsUntil(event.startDateTime, now);
                return (
                  <div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">
                      {formatDuration(secs)}
                    </div>
                    <div className="text-xs text-gray-400">until race starts</div>
                  </div>
                );
              }
              if (phase === "during") {
                const secs = secondsUntil(event.endDateTime, now);
                return (
                  <div>
                    <div className="text-2xl font-mono font-bold text-green-400">
                      {formatDuration(secs)}
                    </div>
                    <div className="text-xs text-gray-400">remaining</div>
                  </div>
                );
              }
              return (
                <span className="text-gray-400 font-semibold">Race completed</span>
              );
            })()}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{totalLaps}</p>
              <p className="text-sm text-gray-500">Total Laps</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{activeRunners}</p>
              <p className="text-sm text-gray-500">Started</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{data.leaderboard.length}</p>
              <p className="text-sm text-gray-500">Runners</p>
            </CardContent>
          </Card>
        </div>

        {/* Full Leaderboard */}
        <LeaderboardTable
          entries={data.leaderboard}
          title="Overall Leaderboard"
          showGender
          showMedals
          now={now}
          paginate
        />

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
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        {site.name} &middot; {site.website}
      </footer>
    </div>
  );
}
