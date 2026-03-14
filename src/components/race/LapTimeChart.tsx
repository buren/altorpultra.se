"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Lap } from "@/lib/race/types";

interface LapTimeChartProps {
  laps: Lap[];
  startDateTime: string;
  avgLapSeconds: number | null;
  title: string;
  avgLabel: string;
  lapLabel: string;
  lapDistanceKm: number;
}

function formatMmSs(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(seconds: number, distanceKm: number): string {
  const paceSeconds = seconds / distanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function LapTimeChart({
  laps,
  startDateTime,
  avgLapSeconds,
  title,
  avgLabel,
  lapLabel,
  lapDistanceKm,
}: LapTimeChartProps) {
  const data = useMemo(() => {
    if (laps.length < 2) return [];

    return laps.map((lap, i) => {
      const prevTs = i > 0 ? laps[i - 1].timestamp : startDateTime;
      const durationSeconds =
        (new Date(lap.timestamp).getTime() - new Date(prevTs).getTime()) /
        1000;
      return {
        lap: lap.lap_number,
        seconds: durationSeconds > 0 ? durationSeconds : null,
      };
    });
  }, [laps, startDateTime]);

  if (data.length === 0) return null;

  const validSeconds = data
    .map((d) => d.seconds)
    .filter((s): s is number => s != null);
  const minSec = Math.min(...validSeconds);
  const maxSec = Math.max(...validSeconds);
  const padding = (maxSec - minSec) * 0.15 || 60;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-bold mb-3">{title}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -10 }}
          >
            <XAxis
              dataKey="lap"
              tick={{ fontSize: 12 }}
              label={{
                value: lapLabel,
                position: "insideBottom",
                offset: 0,
                fontSize: 12,
                fill: "#9ca3af",
              }}
            />
            <YAxis
              domain={[
                Math.max(0, Math.floor(minSec - padding)),
                Math.ceil(maxSec + padding),
              ]}
              tickFormatter={formatMmSs}
              tick={{ fontSize: 12 }}
              width={50}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const secs = payload[0].value as number;
                const pace = formatPace(secs, lapDistanceKm);
                return (
                  <div className="bg-white border rounded shadow-sm px-3 py-2 text-sm">
                    <p className="font-semibold">{lapLabel} {label}</p>
                    <p className="text-blue-600">
                      {formatMmSs(secs)} ({pace} min/km)
                    </p>
                    {avgLapSeconds != null && (
                      <p className="text-gray-400 text-xs mt-1">
                        {avgLabel}: {formatMmSs(avgLapSeconds)} ({formatPace(avgLapSeconds, lapDistanceKm)} min/km)
                      </p>
                    )}
                  </div>
                );
              }}
            />
            {avgLapSeconds != null && (
              <ReferenceLine
                y={avgLapSeconds}
                stroke="#9ca3af"
                strokeDasharray="6 3"
                label={{
                  value: avgLabel,
                  position: "right",
                  fontSize: 11,
                  fill: "#9ca3af",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="seconds"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2563eb" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
