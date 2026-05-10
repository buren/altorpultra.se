"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Runner } from "@/lib/race/types";

type Tab = "not-checked-in" | "checked-in";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function matchesQuery(runner: Runner, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (String(runner.bib).includes(q)) return true;
  return runner.name.toLowerCase().includes(q);
}

export default function CheckInPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("not-checked-in");

  const fetchRunners = useCallback(async () => {
    const res = await fetch("/api/race/runners");
    const data = await res.json();
    if (data.ok) setRunners(data.data);
  }, []);

  useEffect(() => {
    fetchRunners();
    const interval = setInterval(fetchRunners, 10000);
    return () => clearInterval(interval);
  }, [fetchRunners]);

  async function setCheckedIn(runner: Runner, checkedIn: boolean) {
    const previous = runner.checked_in_at;
    setPending((prev) => new Set(prev).add(runner.id));
    setRunners((prev) =>
      prev.map((r) =>
        r.id === runner.id
          ? { ...r, checked_in_at: checkedIn ? new Date().toISOString() : null }
          : r
      )
    );

    const res = await fetch("/api/race/runners/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runnerId: runner.id, checkedIn }),
    });
    const data = await res.json();

    setPending((prev) => {
      const next = new Set(prev);
      next.delete(runner.id);
      return next;
    });

    if (data.ok && data.data) {
      setRunners((prev) =>
        prev.map((r) => (r.id === runner.id ? (data.data as Runner) : r))
      );
    } else {
      setRunners((prev) =>
        prev.map((r) =>
          r.id === runner.id ? { ...r, checked_in_at: previous } : r
        )
      );
    }
  }

  const { notCheckedIn, checkedIn } = useMemo(() => {
    const sortedByBib = [...runners].sort((a, b) => a.bib - b.bib);
    const filtered = sortedByBib.filter((r) => matchesQuery(r, query));
    return {
      notCheckedIn: filtered.filter((r) => !r.checked_in_at),
      checkedIn: filtered
        .filter((r) => r.checked_in_at)
        .sort((a, b) =>
          (b.checked_in_at as string).localeCompare(a.checked_in_at as string)
        ),
    };
  }, [runners, query]);

  const totalCheckedIn = runners.filter((r) => r.checked_in_at).length;
  const totalNotCheckedIn = runners.length - totalCheckedIn;

  const list = tab === "not-checked-in" ? notCheckedIn : checkedIn;
  const emptyMessage =
    runners.length === 0
      ? "Loading…"
      : query
      ? "No matches."
      : tab === "not-checked-in"
      ? "Everyone is checked in."
      : "No one checked in yet.";

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Check-in</h1>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bib or name"
            className="w-full border rounded-md px-3 py-2 text-base"
            autoFocus
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex border-b" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "not-checked-in"}
              onClick={() => setTab("not-checked-in")}
              className={`flex-1 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === "not-checked-in"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Not checked in{" "}
              <span className="text-gray-400 font-normal">
                ({totalNotCheckedIn})
              </span>
            </button>
            <button
              role="tab"
              aria-selected={tab === "checked-in"}
              onClick={() => setTab("checked-in")}
              className={`flex-1 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === "checked-in"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Checked in{" "}
              <span className="text-gray-400 font-normal">
                ({totalCheckedIn})
              </span>
            </button>
          </div>

          <div className="p-6">
            {list.length === 0 ? (
              <p className="text-gray-500 text-sm">{emptyMessage}</p>
            ) : (
              <ul className="divide-y">
                {list.map((runner) => (
                  <li
                    key={runner.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="font-mono font-bold shrink-0">
                        #{runner.bib}
                      </span>
                      <span className="truncate">{runner.name}</span>
                      {tab === "checked-in" && (
                        <span className="text-gray-500 text-sm shrink-0">
                          {formatTime(runner.checked_in_at as string)}
                        </span>
                      )}
                    </div>
                    {tab === "not-checked-in" ? (
                      <button
                        onClick={() => setCheckedIn(runner, true)}
                        disabled={pending.has(runner.id)}
                        className="shrink-0 whitespace-nowrap bg-gray-900 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                      >
                        Check in
                      </button>
                    ) : (
                      <button
                        onClick={() => setCheckedIn(runner, false)}
                        disabled={pending.has(runner.id)}
                        className="shrink-0 whitespace-nowrap text-gray-600 hover:text-gray-900 text-sm underline disabled:opacity-50"
                      >
                        Undo
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
