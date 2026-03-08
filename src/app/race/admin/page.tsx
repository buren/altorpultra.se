"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lap } from "@/lib/race/types";
import { formatTimeAgo } from "@/lib/race/format";

interface RecentLap extends Lap {
  runner_name: string;
  runner_bib: number;
}

export default function LapsPage() {
  const [recentLaps, setRecentLaps] = useState<RecentLap[]>([]);
  const [now, setNow] = useState(new Date());
  const [bibInput, setBibInput] = useState("");
  const [lapMessage, setLapMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const bibRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLaps = useCallback(async () => {
    const res = await fetch("/api/race/laps");
    const data = await res.json();
    if (data.ok) setRecentLaps(data.data);
  }, []);

  useEffect(() => {
    fetchLaps();
    const interval = setInterval(fetchLaps, 5000);
    return () => clearInterval(interval);
  }, [fetchLaps]);

  useEffect(() => {
    bibRef.current?.focus();
  }, [lapMessage]);

  async function handleRegisterLap(e: React.FormEvent) {
    e.preventDefault();
    const bib = parseInt(bibInput, 10);
    if (isNaN(bib)) {
      setLapMessage({ text: "Enter a valid bib number", type: "error" });
      return;
    }

    const res = await fetch("/api/race/laps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bib }),
    });
    const data = await res.json();

    if (data.ok) {
      const { runner, lap } = data.data;
      setLapMessage({
        text: `Lap ${lap.lap_number} registered for #${runner.bib} ${runner.name}`,
        type: "success",
      });
      setBibInput("");
      fetchLaps();
    } else {
      setLapMessage({ text: data.error, type: "error" });
    }
    bibRef.current?.focus();
  }

  async function handleDeleteLap(lapId: string) {
    const res = await fetch(`/api/race/laps?id=${lapId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.ok) fetchLaps();
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-4">Register Lap</h2>
          <form
            onSubmit={handleRegisterLap}
            className="flex gap-3 items-end"
          >
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Bib #
              </label>
              <input
                ref={bibRef}
                type="text"
                inputMode="numeric"
                value={bibInput}
                onChange={(e) => setBibInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Bib number"
                className="w-full border rounded-md px-3 py-3 text-2xl font-mono text-center"
                autoComplete="off"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-green-700"
            >
              Register
            </button>
          </form>
          {lapMessage && (
            <p
              className={`mt-3 text-sm font-medium ${
                lapMessage.type === "success"
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {lapMessage.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-4">Recent Laps</h2>
          {recentLaps.length === 0 ? (
            <p className="text-gray-500">No laps registered yet</p>
          ) : (
            <div className="space-y-2">
              {recentLaps.map((lap) => (
                <div
                  key={lap.id}
                  className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
                >
                  <div>
                    <span className="font-mono font-bold text-gray-600">
                      #{lap.runner_bib}
                    </span>{" "}
                    <span className="font-medium">{lap.runner_name}</span>
                    <span className="text-gray-500 ml-2">
                      Lap {lap.lap_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                      {formatTimeAgo(lap.timestamp, now)}
                    </span>
                    <button
                      onClick={() => handleDeleteLap(lap.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
