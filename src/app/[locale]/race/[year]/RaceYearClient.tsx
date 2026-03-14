"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardEntry, Gender } from "@/lib/race/types";
import {
  formatLapTime,
  formatTimestamp,
  formatLastCompleted,
} from "@/lib/race/format";
import { site } from "@/lib/config";
import { supabase } from "@/lib/race/supabase";
import { getRacePhase, secondsUntil, formatDuration } from "@/lib/race/clock";
import { NextLapEstimate } from "@/lib/race/eta";
import { Search, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface EditionInfo {
  year: number;
  startDateTime: string;
  endDateTime: string;
  lapDistanceKm: number;
  lapElevationM: number;
  dateFormatted: string;
}

interface CourseRecord {
  name: string;
  bib: number;
  year: number;
  totalLaps: number;
  totalDistanceKm: number;
}

interface LeaderboardData {
  edition: EditionInfo;
  leaderboard: LeaderboardEntry[];
  topMen: LeaderboardEntry[];
  topWomen: LeaderboardEntry[];
  courseRecords: { male: CourseRecord | null; female: CourseRecord | null };
  courseRecordHolderIds: string[];
  nextRunners: NextLapEstimate[];
}

function GenderIcon({ gender }: { gender: Gender }) {
  if (gender === "male") return <span title="Male">♂</span>;
  if (gender === "female") return <span title="Female">♀</span>;
  return <span title="Other">–</span>;
}

function formatPace(
  lapSeconds: number | null,
  lapDistanceKm: number
): string {
  if (lapSeconds == null) return "–";
  const paceSeconds = lapSeconds / lapDistanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatEta(estimatedTimestamp: string, now: Date, t: ReturnType<typeof useTranslations<'race'>>): string {
  const diffMs = new Date(estimatedTimestamp).getTime() - now.getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs <= 0) return t('anyMoment');
  if (secs < 60) return t('lessThanOneMin');
  const mins = Math.round(secs / 60);
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `~${h}h ${m}m`;
}

function NextRunnersCard({
  nextRunners,
  now,
  year,
  t,
}: {
  nextRunners: NextLapEstimate[];
  now: Date;
  year: number;
  t: ReturnType<typeof useTranslations<'race'>>;
}) {
  if (nextRunners.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-bold mb-3">{t('comingThroughNext')}</h2>
        <div className="divide-y divide-gray-100">
          {nextRunners.map((est) => (
            <div
              key={est.runner.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-gray-500 w-8 text-right">
                  {est.runner.bib}
                </span>
                <Link
                  href={`/race/${year}/runner/${est.runner.bib}`}
                  className="font-medium hover:underline"
                >
                  {est.runner.name}
                </Link>
                <span className="text-xs text-gray-400">
                  {t('lap', { number: est.nextLapNumber })}
                </span>
              </div>
              <span
                className={`text-sm font-medium ${
                  formatEta(est.estimatedTimestamp, now, t) === t('anyMoment')
                    ? "text-green-600"
                    : "text-gray-600"
                }`}
              >
                {formatEta(est.estimatedTimestamp, now, t)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const PAGE_SIZES = [10, 20, 50, 100] as const;

function CourseRecordTag() {
  return (
    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-1.5 py-0.5 rounded ml-2">
      CR
    </span>
  );
}

function LeaderboardTable({
  entries,
  title,
  showMedals,
  showGender,
  now,
  paginate,
  lapDistanceKm,
  startDateTime,
  year,
  courseRecordHolderIds,
  t,
}: {
  entries: LeaderboardEntry[];
  title: string;
  showMedals?: boolean;
  showGender?: boolean;
  now?: Date;
  paginate?: boolean;
  lapDistanceKm: number;
  startDateTime: string;
  year: number;
  courseRecordHolderIds?: Set<string>;
  t: ReturnType<typeof useTranslations<'race'>>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [nameFilter, setNameFilter] = useState("");
  const [filterFlash, setFilterFlash] = useState(false);
  const filterRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPage(0);
  }, [entries.length, nameFilter]);

  if (entries.length === 0) {
    return null;
  }

  const indexedEntries = entries.map((e, i) => ({ entry: e, rank: i + 1 }));
  const filteredEntries = nameFilter
    ? indexedEntries.filter((item) =>
        item.entry.runner.name
          .toLowerCase()
          .includes(nameFilter.toLowerCase())
      )
    : indexedEntries;

  const totalPages = paginate
    ? Math.ceil(filteredEntries.length / pageSize)
    : 1;
  const offset = paginate ? page * pageSize : 0;
  const visibleEntries = paginate
    ? filteredEntries.slice(offset, offset + pageSize)
    : filteredEntries;

  const medals = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {title}
          {paginate && (
            <button
              type="button"
              onClick={() => {
                filterRef.current?.focus();
                setFilterFlash(true);
                setTimeout(() => setFilterFlash(false), 600);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Search className="h-5 w-5" />
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
              placeholder={t('filterByName')}
              className={`border rounded-md px-3 py-1.5 text-sm w-full sm:w-48 sm:pl-8 transition-all duration-500 ${filterFlash ? "bg-blue-100 ring-2 ring-blue-300 border-blue-300" : ""}`}
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
              <th className="px-3 py-2">{t('name')}</th>
              <th className="px-3 py-2 text-right">{t('laps')}</th>
              <th className="px-3 py-2 text-right hidden sm:table-cell">
                {t('distance')}
              </th>
              <th className="px-3 py-2 text-right hidden md:table-cell">
                {t('avgLap')}
              </th>
              <th className="px-3 py-2 text-right hidden md:table-cell">
                {t('fastest')}
              </th>
              {now && (
                <th className="px-3 py-2 text-right hidden sm:table-cell">
                  {t('lastLap')}
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
                      <span className={`font-bold ${medals[rank - 1]}`}>
                        {rank}
                      </span>
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
                    <Link
                      href={`/race/${year}/runner/${e.runner.bib}`}
                      className="hover:underline"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      {e.runner.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {e.totalLaps}
                    {courseRecordHolderIds?.has(e.runner.id) && (
                      <CourseRecordTag />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden sm:table-cell">
                    {e.totalDistanceKm} km
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden md:table-cell">
                    {formatLapTime(e.avgLapSeconds)}
                    {e.avgLapSeconds != null && (
                      <span className="text-gray-400 text-xs ml-1">
                        &middot;{" "}
                        {formatPace(e.avgLapSeconds, lapDistanceKm)} min/km
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 hidden md:table-cell">
                    {formatLapTime(e.fastestLapSeconds)}
                    {e.fastestLapSeconds != null && (
                      <span className="text-gray-400 text-xs ml-1">
                        &middot;{" "}
                        {formatPace(e.fastestLapSeconds, lapDistanceKm)}{" "}
                        min/km
                      </span>
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
                    <td
                      colSpan={(showGender ? 8 : 7) + (now ? 1 : 0)}
                      className="bg-gray-50 px-6 py-3"
                    >
                      <p className="text-sm font-semibold text-gray-500 mb-2">
                        #{e.runner.bib} {e.runner.name}
                        <Link
                          href={`/race/${year}/runner/${e.runner.bib}`}
                          className="ml-2 text-xs font-normal text-blue-500 hover:underline"
                        >
                          {t('viewProfile')} &rarr;
                        </Link>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div className="bg-white border rounded px-3 py-2 text-sm">
                          <span className="text-gray-400 block text-xs">
                            {t('distance')}
                          </span>
                          <span className="font-semibold">
                            {e.totalDistanceKm} km
                          </span>
                        </div>
                        <div className="bg-white border rounded px-3 py-2 text-sm">
                          <span className="text-gray-400 block text-xs">
                            {t('avgLap')}
                          </span>
                          <span className="font-semibold font-mono">
                            {formatLapTime(e.avgLapSeconds)}
                          </span>
                          {e.avgLapSeconds != null && (
                            <span className="text-gray-400 text-xs ml-1">
                              &middot;{" "}
                              {formatPace(e.avgLapSeconds, lapDistanceKm)}{" "}
                              min/km
                            </span>
                          )}
                        </div>
                        <div className="bg-white border rounded px-3 py-2 text-sm">
                          <span className="text-gray-400 block text-xs">
                            {t('fastest')}
                          </span>
                          <span className="font-semibold font-mono">
                            {formatLapTime(e.fastestLapSeconds)}
                          </span>
                          {e.fastestLapSeconds != null && (
                            <span className="text-gray-400 text-xs ml-1">
                              &middot;{" "}
                              {formatPace(
                                e.fastestLapSeconds,
                                lapDistanceKm
                              )}{" "}
                              min/km
                            </span>
                          )}
                        </div>
                        {now && e.lastLapTimestamp && (
                          <div className="bg-white border rounded px-3 py-2 text-sm">
                            <span className="text-gray-400 block text-xs">
                              {t('lastLap')}
                            </span>
                            <span className="font-semibold">
                              {formatLastCompleted(e.lastLapTimestamp, now)}
                            </span>
                          </div>
                        )}
                      </div>
                      {e.laps.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-400 mb-1">
                            {t('lapSplits')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {e.laps.map((lap, li) => {
                              const prevTs =
                                li > 0
                                  ? e.laps[li - 1].timestamp
                                  : startDateTime;
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
                                        &middot;{" "}
                                        {formatPace(dur, lapDistanceKm)}{" "}
                                        min/km
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
            <span>{t('show')}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="border rounded px-2 py-1 bg-white"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500">
              {offset + 1}–
              {Math.min(offset + pageSize, filteredEntries.length)} {t('of')}{" "}
              {filteredEntries.length}
            </span>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('prev')}
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RaceYearClient() {
  const t = useTranslations('race');
  const params = useParams();
  const router = useRouter();
  const year = Number(params.year);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/race/leaderboard?year=${year}`);
    const json = await res.json();
    if (json.ok) {
      setData(json.data);
      setError(null);
    } else {
      setError(json.error);
    }
  }, [year]);

  useEffect(() => {
    fetch("/api/race/editions")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          const years = json.data.editions
            .filter((e: { publishedAt: string | null }) => e.publishedAt !== null)
            .map((e: { year: number }) => e.year)
            .sort((a: number, b: number) => b - a);
          setAvailableYears(years);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

    const channel = supabase
      .channel(`race-realtime-${year}`)
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
  }, [fetchData, year]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('editionNotFound', { year })}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">{t('loading')}</p>
      </div>
    );
  }

  const { edition } = data;
  const totalLaps = data.leaderboard.reduce(
    (sum, e) => sum + e.totalLaps,
    0
  );
  const totalDistanceKm = data.leaderboard.reduce(
    (sum, e) => sum + e.totalDistanceKm,
    0
  );
  const totalElevationM = data.leaderboard.reduce(
    (sum, e) => sum + e.totalElevationM,
    0
  );
  const courseRecordHolderIds = new Set(data.courseRecordHolderIds);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {site.name}
              </h1>
              {availableYears.length > 1 ? (
                <div className="relative">
                  <select
                    value={year}
                    onChange={(e) => router.push(`/race/${e.target.value}`)}
                    className="appearance-none bg-gray-800 text-white text-2xl font-bold rounded-md pl-2 pr-7 py-0.5 cursor-pointer hover:bg-gray-700 border-none focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              ) : (
                <span className="text-2xl font-bold">{edition.year}</span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              {getRacePhase(edition.startDateTime, edition.endDateTime, now) === "during"
                ? t('liveResults')
                : t('results')}
            </p>
          </div>
          <div className="text-right">
            {(() => {
              const phase = getRacePhase(
                edition.startDateTime,
                edition.endDateTime,
                now
              );
              if (phase === "before") {
                const secs = secondsUntil(edition.startDateTime, now);
                return (
                  <div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">
                      {formatDuration(secs)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {t('untilRaceStarts')}
                    </div>
                  </div>
                );
              }
              if (phase === "during") {
                const secs = secondsUntil(edition.endDateTime, now);
                return (
                  <div>
                    <div className="text-2xl font-mono font-bold text-green-400">
                      {formatDuration(secs)}
                    </div>
                    <div className="text-xs text-gray-400">{t('remaining')}</div>
                  </div>
                );
              }
              return (
                <span className="text-gray-400 font-semibold">
                  {t('raceCompleted')}
                </span>
              );
            })()}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{totalLaps}</p>
              <p className="text-sm text-gray-500">{t('totalLaps')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{totalDistanceKm.toLocaleString()} km</p>
              <p className="text-sm text-gray-500">{t('totalDistance')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{totalElevationM.toLocaleString()} m</p>
              <p className="text-sm text-gray-500">{t('totalElevation')}</p>
            </CardContent>
          </Card>
        </div>

        {getRacePhase(edition.startDateTime, edition.endDateTime, now) === "during" && (
          <NextRunnersCard nextRunners={data.nextRunners} now={now} year={year} t={t} />
        )}

        <LeaderboardTable
          entries={data.leaderboard}
          title={t('overallLeaderboard')}
          showGender
          showMedals
          now={now}
          paginate
          lapDistanceKm={edition.lapDistanceKm}
          startDateTime={edition.startDateTime}
          year={year}
          courseRecordHolderIds={courseRecordHolderIds}
          t={t}
        />

        {(data.topMen.length > 0 || data.topWomen.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LeaderboardTable
              entries={data.topMen}
              title={t('topMen')}
              showMedals
              lapDistanceKm={edition.lapDistanceKm}
              startDateTime={edition.startDateTime}
              year={year}
              courseRecordHolderIds={courseRecordHolderIds}
              t={t}
            />
            <LeaderboardTable
              entries={data.topWomen}
              title={t('topWomen')}
              showMedals
              lapDistanceKm={edition.lapDistanceKm}
              startDateTime={edition.startDateTime}
              year={year}
              courseRecordHolderIds={courseRecordHolderIds}
              t={t}
            />
          </div>
        )}

        {(data.courseRecords.male || data.courseRecords.female) && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{t('courseRecords')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.courseRecords.male && (
                  <Link href={`/race/${data.courseRecords.male.year}/runner/${data.courseRecords.male.bib}`} className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <p className="text-sm text-gray-500 mb-1">{t('men')}</p>
                    <p className="text-lg font-bold">{data.courseRecords.male.name}</p>
                    <p className="text-gray-700">
                      {data.courseRecords.male.totalLaps} {t('laps')} ({data.courseRecords.male.totalDistanceKm} km)
                    </p>
                    <p className="text-sm text-gray-500">{data.courseRecords.male.year}</p>
                  </Link>
                )}
                {data.courseRecords.female && (
                  <Link href={`/race/${data.courseRecords.female.year}/runner/${data.courseRecords.female.bib}`} className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <p className="text-sm text-gray-500 mb-1">{t('women')}</p>
                    <p className="text-lg font-bold">{data.courseRecords.female.name}</p>
                    <p className="text-gray-700">
                      {data.courseRecords.female.totalLaps} {t('laps')} ({data.courseRecords.female.totalDistanceKm} km)
                    </p>
                    <p className="text-sm text-gray-500">{data.courseRecords.female.year}</p>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        {site.name} &middot; {site.website}
      </footer>
    </div>
  );
}
