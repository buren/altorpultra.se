"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardEntry } from "@/lib/race/types";
import {
  formatLapTime,
  formatTimestamp,
  formatTimeAgo,
} from "@/lib/race/format";
import { LapTimeChart } from "@/components/race/LapTimeChart";
import { LapEditForm } from "@/components/admin/lap-edit-form";
import { LapInsertForm } from "@/components/admin/lap-insert-form";
import { DeleteLapButton } from "@/components/admin/delete-lap-button";

export default function RunnerLapsPage() {
  const params = useParams();
  const runnerId = String(params.id);

  const [entry, setEntry] = useState<LeaderboardEntry | null>(null);
  const [startDateTime, setStartDateTime] = useState<string | null>(null);
  const [lapDistanceKm, setLapDistanceKm] = useState<number | null>(null);
  const [now, setNow] = useState(new Date());
  const [notFound, setNotFound] = useState(false);

  const [editingLapId, setEditingLapId] = useState<string | null>(null);
  const [insertingForLapId, setInsertingForLapId] = useState<string | null>(
    null
  );
  const [togglingStopped, setTogglingStopped] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/race/leaderboard");
    const data = await res.json();
    if (!data.ok) return;
    const list: LeaderboardEntry[] = data.data.leaderboard;
    const found = list.find((e) => e.runner.id === runnerId) ?? null;
    if (!found) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    setEntry(found);
    setStartDateTime(data.data.edition?.startDateTime ?? null);
    setLapDistanceKm(data.data.edition?.lapDistanceKm ?? null);
  }, [runnerId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleToggleStopped() {
    if (!entry) return;
    const stopped = !entry.runner.stopped_at;
    setTogglingStopped(true);
    try {
      const res = await fetch("/api/race/runners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runnerId: entry.runner.id, stopped }),
      });
      const data = await res.json();
      if (data.ok) await fetchData();
    } finally {
      setTogglingStopped(false);
    }
  }

  const orderedLaps = useMemo(() => {
    if (!entry) return [];
    return [...entry.laps].sort((a, b) => a.lap_number - b.lap_number);
  }, [entry]);

  if (notFound) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-500">Runner not found.</p>
            <Link
              href="/admin/runners"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to runners
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <p className="text-gray-400">Loading…</p>
      </main>
    );
  }

  const isStopped = !!entry.runner.stopped_at;

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/runners"
          className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Runners
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-gray-900 text-white font-mono font-bold text-xl w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                {entry.runner.bib}
              </div>
              <div className="min-w-0">
                <h2
                  className={`text-xl font-bold truncate ${isStopped ? "line-through text-gray-500" : ""}`}
                >
                  {entry.runner.name}
                </h2>
                <p className="text-sm text-gray-500 capitalize">
                  {entry.runner.gender}
                  {entry.lastLapTimestamp && (
                    <span className="ml-2 text-gray-400">
                      · last lap {formatTimeAgo(entry.lastLapTimestamp, now)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleStopped}
              disabled={togglingStopped}
              className={`min-h-[36px] inline-flex items-center justify-center rounded-md px-3 text-sm font-medium shrink-0 disabled:opacity-50 ${
                isStopped
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
              }`}
            >
              {isStopped ? "Resume" : "Stop"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <p className="text-xl font-bold">{entry.totalLaps}</p>
              <p className="text-xs text-gray-500">Laps</p>
            </div>
            <div>
              <p className="text-xl font-bold font-mono">
                {formatLapTime(entry.avgLapSeconds)}
              </p>
              <p className="text-xs text-gray-500">Avg lap</p>
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-green-600">
                {formatLapTime(entry.fastestLapSeconds)}
              </p>
              <p className="text-xs text-gray-500">Fastest</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {startDateTime && lapDistanceKm !== null && entry.laps.length >= 2 && (
        <Card>
          <CardContent className="p-4">
            <LapTimeChart
              laps={entry.laps}
              startDateTime={startDateTime}
              avgLapSeconds={entry.avgLapSeconds}
              title="Lap times"
              avgLabel="avg"
              lapLabel="Lap"
              lapDistanceKm={lapDistanceKm}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-3">
            All laps{" "}
            <span className="text-gray-400 font-normal text-base">
              {orderedLaps.length}
            </span>
          </h3>

          {orderedLaps.length === 0 ? (
            <p className="text-gray-500">No laps registered yet.</p>
          ) : (
            <div className="space-y-2">
              {orderedLaps.map((lap, i) => {
                const prevTs =
                  i > 0 ? orderedLaps[i - 1].timestamp : startDateTime;
                const durationSeconds = prevTs
                  ? (new Date(lap.timestamp).getTime() -
                      new Date(prevTs).getTime()) /
                    1000
                  : 0;
                const isEditing = editingLapId === lap.id;
                const isInserting = insertingForLapId === lap.id;
                const canInsertBefore = !!prevTs;

                return (
                  <div
                    key={lap.id}
                    className="rounded-md bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-gray-500 text-sm">
                            Lap {lap.lap_number}
                          </span>
                          <span className="font-mono text-sm">
                            {formatTimestamp(lap.timestamp)}
                          </span>
                          <span className="font-mono text-sm text-gray-500">
                            {durationSeconds > 0
                              ? formatLapTime(durationSeconds)
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingLapId(isEditing ? null : lap.id);
                            setInsertingForLapId(null);
                          }}
                          className="min-h-[32px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {isEditing ? "Close" : "Edit"}
                        </button>
                        {canInsertBefore && (
                          <button
                            onClick={() => {
                              setInsertingForLapId(
                                isInserting ? null : lap.id
                              );
                              setEditingLapId(null);
                            }}
                            className="min-h-[32px] inline-flex items-center justify-center rounded-md border border-amber-200 bg-white px-3 text-sm font-medium text-amber-700 hover:bg-amber-50 whitespace-nowrap"
                            title="Insert a missed lap before this one"
                          >
                            {isInserting ? "Close" : "Insert before"}
                          </button>
                        )}
                        <DeleteLapButton
                          lapId={lap.id}
                          onDeleted={fetchData}
                          size="sm"
                        />
                      </div>
                    </div>
                    {isEditing && (
                      <LapEditForm
                        lap={lap}
                        runnerLaps={entry.laps}
                        durationSeconds={durationSeconds}
                        startDateTime={startDateTime}
                        lapDistanceKm={lapDistanceKm}
                        avgLapSeconds={entry.avgLapSeconds}
                        onSaved={() => {
                          setEditingLapId(null);
                          fetchData();
                        }}
                        onCancel={() => setEditingLapId(null)}
                      />
                    )}
                    {isInserting && (
                      <LapInsertForm
                        lap={lap}
                        runnerId={entry.runner.id}
                        runnerLaps={entry.laps}
                        durationSeconds={durationSeconds}
                        startDateTime={startDateTime}
                        lapDistanceKm={lapDistanceKm}
                        avgLapSeconds={entry.avgLapSeconds}
                        onSaved={() => {
                          setInsertingForLapId(null);
                          fetchData();
                        }}
                        onCancel={() => setInsertingForLapId(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
