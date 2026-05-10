"use client";

import { useState } from "react";
import { Lap } from "@/lib/race/types";
import { formatLapTime, formatTimestamp } from "@/lib/race/format";
import { LapTimeChart } from "@/components/race/LapTimeChart";
import { Spinner } from "./spinner";
import { fromLocalDatetimeValue, toLocalDatetimeValue } from "./lap-datetime";

interface LapEditFormProps {
  lap: Lap;
  runnerLaps: Lap[];
  durationSeconds: number;
  startDateTime: string | null;
  lapDistanceKm: number | null;
  avgLapSeconds: number | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function LapEditForm({
  lap,
  runnerLaps,
  durationSeconds,
  startDateTime,
  lapDistanceKm,
  avgLapSeconds,
  onSaved,
  onCancel,
}: LapEditFormProps) {
  const [value, setValue] = useState(toLocalDatetimeValue(lap.timestamp));
  const [saving, setSaving] = useState(false);

  const sortedLaps = [...runnerLaps].sort(
    (a, b) => a.lap_number - b.lap_number
  );
  const idx = sortedLaps.findIndex((l) => l.id === lap.id);
  const prevLap = idx > 0 ? sortedLaps[idx - 1] : null;
  const nextLap =
    idx >= 0 && idx < sortedLaps.length - 1 ? sortedLaps[idx + 1] : null;

  let proposedMs: number | null = null;
  try {
    if (value) {
      const ms = new Date(fromLocalDatetimeValue(value)).getTime();
      proposedMs = Number.isNaN(ms) ? null : ms;
    }
  } catch {
    proposedMs = null;
  }

  const prevMs = prevLap
    ? new Date(prevLap.timestamp).getTime()
    : startDateTime
      ? new Date(startDateTime).getTime()
      : null;
  const nextMs = nextLap ? new Date(nextLap.timestamp).getTime() : null;
  const origThisMs = new Date(lap.timestamp).getTime();

  const newDurThis =
    proposedMs !== null && prevMs !== null
      ? (proposedMs - prevMs) / 1000
      : null;
  const newDurNext =
    proposedMs !== null && nextMs !== null
      ? (nextMs - proposedMs) / 1000
      : null;
  const origDurNext = nextMs !== null ? (nextMs - origThisMs) / 1000 : null;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/race/laps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lapId: lap.id,
          timestamp: fromLocalDatetimeValue(value),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      <div className="text-xs font-mono space-y-1">
        {prevLap ? (
          <div className="grid grid-cols-[3rem_1fr_auto] gap-3 text-gray-600 px-2">
            <span>Lap {prevLap.lap_number}</span>
            <span>{formatTimestamp(prevLap.timestamp)}</span>
            <span className="text-gray-400">—</span>
          </div>
        ) : (
          <div className="grid grid-cols-[3rem_1fr_auto] gap-3 text-gray-400 px-2">
            <span>start</span>
            <span>
              {startDateTime ? formatTimestamp(startDateTime) : "—"}
            </span>
            <span>—</span>
          </div>
        )}
        <div className="grid grid-cols-[3rem_1fr_auto] gap-3 bg-amber-50 rounded px-2 py-1 font-semibold">
          <span>Lap {lap.lap_number}</span>
          <span>
            {proposedMs !== null
              ? formatTimestamp(new Date(proposedMs).toISOString())
              : formatTimestamp(lap.timestamp)}
          </span>
          <span>
            {newDurThis !== null
              ? formatLapTime(newDurThis)
              : formatLapTime(durationSeconds)}
            {newDurThis !== null &&
              Math.abs(newDurThis - durationSeconds) > 0.5 && (
                <span className="text-gray-400 line-through font-normal ml-1">
                  {formatLapTime(durationSeconds)}
                </span>
              )}
          </span>
        </div>
        {nextLap && (
          <div className="grid grid-cols-[3rem_1fr_auto] gap-3 text-gray-600 px-2">
            <span>Lap {nextLap.lap_number}</span>
            <span>{formatTimestamp(nextLap.timestamp)}</span>
            <span>
              {newDurNext !== null
                ? formatLapTime(newDurNext)
                : origDurNext !== null
                  ? formatLapTime(origDurNext)
                  : "—"}
              {newDurNext !== null &&
                origDurNext !== null &&
                Math.abs(newDurNext - origDurNext) > 0.5 && (
                  <span className="text-gray-400 line-through font-normal ml-1">
                    {formatLapTime(origDurNext)}
                  </span>
                )}
            </span>
          </div>
        )}
      </div>

      {startDateTime && lapDistanceKm !== null && runnerLaps.length >= 2 && (
        <div className="-mx-2">
          <LapTimeChart
            laps={runnerLaps}
            startDateTime={startDateTime}
            avgLapSeconds={avgLapSeconds}
            title=""
            avgLabel="avg"
            lapLabel="Lap"
            lapDistanceKm={lapDistanceKm}
            highlightLapNumber={lap.lap_number}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="datetime-local"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border rounded px-2 py-2 text-sm flex-1"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 rounded border flex-1 sm:flex-none disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
