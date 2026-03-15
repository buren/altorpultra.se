"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { LeaderboardEntry } from "@/lib/race/types";

interface LapDistributionChartProps {
  entries: LeaderboardEntry[];
  title: string;
  runnersLabel: string;
  lapsLabel: string;
}

export function LapDistributionChart({
  entries,
  title,
  runnersLabel,
  lapsLabel,
}: LapDistributionChartProps) {
  const data = useMemo(() => {
    if (entries.length === 0) return [];

    const counts = new Map<number, number>();
    for (const e of entries) {
      if (e.totalLaps === 0) continue;
      counts.set(e.totalLaps, (counts.get(e.totalLaps) ?? 0) + 1);
    }

    if (counts.size === 0) return [];

    const min = Math.min(...counts.keys());
    const max = Math.max(...counts.keys());

    const result: { laps: number; runners: number }[] = [];
    for (let i = min; i <= max; i++) {
      result.push({ laps: i, runners: counts.get(i) ?? 0 });
    }
    return result;
  }, [entries]);

  if (data.length === 0) return null;

  const maxRunners = Math.max(...data.map((d) => d.runners));

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-xl font-bold mb-3">{title}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <XAxis
              dataKey="laps"
              tick={{ fontSize: 12 }}
              label={{
                value: lapsLabel,
                position: "insideBottom",
                offset: 0,
                fontSize: 12,
                fill: "#9ca3af",
              }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              label={{
                value: runnersLabel,
                angle: -90,
                position: "insideLeft",
                offset: 24,
                fontSize: 12,
                fill: "#9ca3af",
              }}
            />
            <Tooltip
              formatter={(value) => [value, runnersLabel]}
              labelFormatter={(label) =>
                `${label} ${lapsLabel.toLowerCase()}`
              }
            />
            <Bar dataKey="runners" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.runners === maxRunners ? "#2563eb" : "#93c5fd"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
