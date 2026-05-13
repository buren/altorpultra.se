"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Lap, LeaderboardEntry } from "@/lib/race/types";
import { countActiveAndStopped } from "@/lib/race/leaderboard";
import { formatTimeAgo, formatLapTime, formatTimestamp } from "@/lib/race/format";
import { RecentLapDialog } from "@/components/admin/recent-lap-dialog";
import { findRecentLapWarning } from "@/components/admin/lap-warnings";
import { LapEditForm } from "@/components/admin/lap-edit-form";
import { LapInsertForm } from "@/components/admin/lap-insert-form";
import { DeleteLapButton } from "@/components/admin/delete-lap-button";
import { Spinner } from "@/components/admin/spinner";
import {
  toLocalDatetimeValue,
  fromLocalDatetimeValue,
} from "@/components/admin/lap-datetime";
import {
  findLapAnomalies,
  AuditConfig,
  AnomalyReason,
} from "@/lib/race/audit";

interface RecentLap extends Lap {
  runner_name: string;
  runner_bib: number;
}

const LAPS_PAGE_SIZE = 20;

const AUDIT_CONFIG_KEY = "altorp.audit.config";
const AUDIT_HIDDEN_REASONS_KEY = "altorp.audit.hidden_reasons";

const ALL_REASONS: AnomalyReason[] = [
  "runner_fast",
  "runner_slow",
  "absolute_fast",
  "absolute_slow",
];

function isAnomalyReason(value: unknown): value is AnomalyReason {
  return (
    typeof value === "string" &&
    (ALL_REASONS as string[]).includes(value)
  );
}

function loadHiddenReasons(): Set<AnomalyReason> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(AUDIT_HIDDEN_REASONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(isAnomalyReason));
  } catch {
    return new Set();
  }
}

const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  perRunner: { enabled: true, multiplier: 1.8 },
  absoluteFast: { enabled: true, seconds: 30 * 60 },
  absoluteSlow: { enabled: true, seconds: 90 * 60 },
};

function loadAuditConfig(): AuditConfig {
  if (typeof window === "undefined") return DEFAULT_AUDIT_CONFIG;
  try {
    const raw = window.localStorage.getItem(AUDIT_CONFIG_KEY);
    if (!raw) return DEFAULT_AUDIT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      perRunner: {
        enabled: !!parsed?.perRunner?.enabled,
        multiplier: Number(parsed?.perRunner?.multiplier) || 1.8,
      },
      absoluteFast: {
        enabled: !!parsed?.absoluteFast?.enabled,
        seconds: Number(parsed?.absoluteFast?.seconds) || 30 * 60,
      },
      absoluteSlow: {
        enabled: !!parsed?.absoluteSlow?.enabled,
        seconds: Number(parsed?.absoluteSlow?.seconds) || 90 * 60,
      },
    };
  } catch {
    return DEFAULT_AUDIT_CONFIG;
  }
}

const REASON_LABELS: Record<AnomalyReason, string> = {
  runner_fast: "fast vs runner",
  runner_slow: "slow vs runner",
  absolute_fast: "below fast threshold",
  absolute_slow: "above slow threshold",
};

const REASON_CLASSES: Record<AnomalyReason, string> = {
  runner_fast: "bg-blue-100 text-blue-700",
  runner_slow: "bg-amber-100 text-amber-700",
  absolute_fast: "bg-blue-100 text-blue-700",
  absolute_slow: "bg-amber-100 text-amber-700",
};

export default function LapsPage() {
  const [recentLaps, setRecentLaps] = useState<RecentLap[]>([]);
  const [lapsPage, setLapsPage] = useState(1);
  const [lapsTotal, setLapsTotal] = useState(0);
  const [now, setNow] = useState(new Date());
  const [bibInput, setBibInput] = useState("");
  const [lapMessage, setLapMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [editingLapId, setEditingLapId] = useState<string | null>(null);
  const [editTimestamp, setEditTimestamp] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingLapId, setDeletingLapId] = useState<string | null>(null);
  const [insertingForLapId, setInsertingForLapId] = useState<string | null>(null);
  const [showBackdated, setShowBackdated] = useState(false);
  const [backdatedBib, setBackdatedBib] = useState("");
  const [backdatedTimestamp, setBackdatedTimestamp] = useState(() =>
    toLocalDatetimeValue(new Date().toISOString())
  );
  const [backdatedMessage, setBackdatedMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [highlightLapId, setHighlightLapId] = useState<string | null>(null);
  const [registeringLap, setRegisteringLap] = useState(false);
  const [recentLapPrompt, setRecentLapPrompt] = useState<{
    bib: number;
    secondsAgo: number;
  } | null>(null);
  const [runners, setRunners] = useState<LeaderboardEntry[]>([]);
  const [startDateTime, setStartDateTime] = useState<string | null>(null);
  const [lapDistanceKm, setLapDistanceKm] = useState<number | null>(null);
  const [togglingRunnerId, setTogglingRunnerId] = useState<string | null>(null);
  const [tab, setTab] = useState<"recent" | "status" | "audit">("recent");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === "recent" || hash === "status" || hash === "audit") {
      setTab(hash);
    }
  }, []);

  function selectTab(next: "recent" | "status" | "audit") {
    setTab(next);
    history.replaceState(null, "", `#${next}`);
  }
  const [statusFilter, setStatusFilter] = useState("");
  const [auditConfig, setAuditConfig] = useState<AuditConfig>(DEFAULT_AUDIT_CONFIG);
  const [hiddenReasons, setHiddenReasons] = useState<Set<AnomalyReason>>(
    () => new Set()
  );
  const bibRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuditConfig(loadAuditConfig());
    setHiddenReasons(loadHiddenReasons());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUDIT_CONFIG_KEY, JSON.stringify(auditConfig));
  }, [auditConfig]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      AUDIT_HIDDEN_REASONS_KEY,
      JSON.stringify([...hiddenReasons])
    );
  }, [hiddenReasons]);

  function toggleReasonHidden(reason: AnomalyReason) {
    setHiddenReasons((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) next.delete(reason);
      else next.add(reason);
      return next;
    });
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLaps = useCallback(async (page: number) => {
    const res = await fetch(
      `/api/race/laps?page=${page}&pageSize=${LAPS_PAGE_SIZE}`
    );
    const data = await res.json();
    if (data.ok) {
      setRecentLaps(data.data);
      const total: number = data.pagination?.total ?? data.data.length;
      setLapsTotal(total);
      const totalPages = Math.max(1, Math.ceil(total / LAPS_PAGE_SIZE));
      if (page > totalPages) setLapsPage(totalPages);
    }
  }, []);

  const fetchRunners = useCallback(async () => {
    const res = await fetch("/api/race/leaderboard");
    const data = await res.json();
    if (data.ok) {
      setRunners(data.data.leaderboard);
      setStartDateTime(data.data.edition?.startDateTime ?? null);
      setLapDistanceKm(data.data.edition?.lapDistanceKm ?? null);
    }
  }, []);

  useEffect(() => {
    fetchLaps(lapsPage);
    fetchRunners();
    const interval = setInterval(() => {
      fetchLaps(lapsPage);
      fetchRunners();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLaps, fetchRunners, lapsPage]);

  async function handleToggleStopped(runnerId: string, stopped: boolean) {
    setTogglingRunnerId(runnerId);
    const res = await fetch("/api/race/runners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runnerId, stopped }),
    });
    const data = await res.json();
    setTogglingRunnerId(null);
    if (data.ok) fetchRunners();
  }

  useEffect(() => {
    bibRef.current?.focus();
  }, [lapMessage]);

  async function submitLap(bib: number) {
    setRegisteringLap(true);
    try {
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
        setHighlightLapId(lap.id);
        setTimeout(() => setHighlightLapId(null), 3000);
        setBibInput("");
        if (lapsPage === 1) {
          fetchLaps(1);
        } else {
          setLapsPage(1);
        }
        fetchRunners();
      } else {
        setLapMessage({ text: data.error, type: "error" });
      }
    } finally {
      setRegisteringLap(false);
      bibRef.current?.focus();
    }
  }

  async function handleRegisterLap(e: React.FormEvent) {
    e.preventDefault();
    const bib = parseInt(bibInput, 10);
    if (isNaN(bib)) {
      setLapMessage({ text: "Enter a valid bib number", type: "error" });
      return;
    }

    const entry = runners.find((r) => r.runner.bib === bib);
    const warning = findRecentLapWarning(
      entry?.lastLapTimestamp ?? null,
      Date.now(),
    );
    if (warning) {
      setRecentLapPrompt({ bib, secondsAgo: warning.secondsAgo });
      return;
    }

    await submitLap(bib);
  }

  async function handleRecentLapConfirm() {
    if (!recentLapPrompt) return;
    const { bib } = recentLapPrompt;
    setRecentLapPrompt(null);
    await submitLap(bib);
  }

  function handleRecentLapCancel() {
    setRecentLapPrompt(null);
    bibRef.current?.focus();
  }

  async function handleDeleteLap(lapId: string) {
    setDeletingLapId(lapId);
    try {
      const res = await fetch(`/api/race/laps?id=${lapId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setConfirmingDeleteId(null);
        await Promise.all([fetchLaps(lapsPage), fetchRunners()]);
      }
    } finally {
      setDeletingLapId(null);
    }
  }

  function startEditLap(lap: RecentLap) {
    setEditingLapId(lap.id);
    setEditTimestamp(toLocalDatetimeValue(lap.timestamp));
  }

  async function handleSaveTimestamp(lapId: string) {
    const res = await fetch("/api/race/laps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lapId,
        timestamp: fromLocalDatetimeValue(editTimestamp),
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setEditingLapId(null);
      fetchLaps(lapsPage);
    }
  }

  const anomalies = useMemo(() => {
    if (!startDateTime) return [];
    return findLapAnomalies(runners, startDateTime, auditConfig);
  }, [runners, startDateTime, auditConfig]);

  // A lap is hidden only when every one of its reasons is on the hidden list,
  // so a lap flagged by both runner_slow and absolute_slow stays visible if
  // either reason is still active.
  const visibleAnomalies = useMemo(
    () =>
      anomalies.filter((a) =>
        a.reasons.some((r) => !hiddenReasons.has(r))
      ),
    [anomalies, hiddenReasons]
  );

  const reasonCounts = useMemo(() => {
    const counts: Record<AnomalyReason, number> = {
      runner_fast: 0,
      runner_slow: 0,
      absolute_fast: 0,
      absolute_slow: 0,
    };
    for (const a of anomalies) {
      for (const r of a.reasons) counts[r]++;
    }
    return counts;
  }, [anomalies]);

  async function handleInsertBackdatedLap(e: React.FormEvent) {
    e.preventDefault();
    if (!backdatedBib || !backdatedTimestamp) {
      setBackdatedMessage({ text: "Bib and timestamp are required", type: "error" });
      return;
    }

    // First look up the runner by bib from recent laps or fetch runners
    const res = await fetch("/api/race/runners");
    const runnersData = await res.json();
    if (!runnersData.ok) {
      setBackdatedMessage({ text: runnersData.error || "Failed to load runners", type: "error" });
      return;
    }

    const runner = runnersData.data?.find(
      (r: { bib: number }) => r.bib === parseInt(backdatedBib, 10)
    );
    if (!runner) {
      setBackdatedMessage({ text: `No runner found with bib #${backdatedBib}`, type: "error" });
      return;
    }

    const putRes = await fetch("/api/race/laps", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runnerId: runner.id,
        timestamp: fromLocalDatetimeValue(backdatedTimestamp),
      }),
    });
    const putData = await putRes.json();

    if (putData.ok) {
      setBackdatedMessage({
        text: `Backdated lap inserted for #${runner.bib} ${runner.name}`,
        type: "success",
      });
      if (putData.data?.id) {
        setHighlightLapId(putData.data.id);
        setTimeout(() => setHighlightLapId(null), 3000);
      }
      setBackdatedBib("");
      setBackdatedTimestamp(toLocalDatetimeValue(new Date().toISOString()));
      fetchLaps(lapsPage);
    } else {
      setBackdatedMessage({ text: putData.error, type: "error" });
    }
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <div ref={topRef} />
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-4">Register Lap</h2>
          <form
            onSubmit={handleRegisterLap}
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="bib-input" className="block text-sm font-medium text-gray-600 mb-1">
                Bib #
              </label>
              <input
                id="bib-input"
                ref={bibRef}
                type="text"
                inputMode="numeric"
                value={bibInput}
                onChange={(e) => setBibInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Bib number"
                className="w-full border rounded-md px-3 py-3 text-2xl font-mono text-center disabled:bg-gray-100 disabled:text-gray-400"
                autoComplete="off"
                autoFocus
                disabled={registeringLap}
              />
            </div>
            <button
              type="submit"
              disabled={registeringLap}
              className="bg-green-600 text-white px-6 rounded-md font-semibold text-lg hover:bg-green-700 w-full sm:w-auto sm:h-[58px] py-3 sm:py-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {registeringLap && <Spinner className="h-5 w-5" />}
              Register
            </button>
          </form>
          {lapMessage && (
            <p
              className={`mt-3 font-semibold ${
                lapMessage.type === "success"
                  ? "text-green-700 text-base"
                  : "text-red-600 text-sm"
              }`}
            >
              {lapMessage.text}
            </p>
          )}
          {!showBackdated && (
            <button
              type="button"
              onClick={() => setShowBackdated(true)}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 font-medium"
            >
              + Insert Backdated Lap
            </button>
          )}
        </CardContent>
      </Card>

      {showBackdated && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Insert Backdated Lap</h2>
              <button
                type="button"
                onClick={() => {
                  setShowBackdated(false);
                  setBackdatedMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Use this when a runner missed a check-in and you need to add the lap with the correct time.
            </p>
            <form
              onSubmit={handleInsertBackdatedLap}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="backdated-bib" className="block text-sm font-medium text-gray-600 mb-1">
                    Bib #
                  </label>
                  <input
                    id="backdated-bib"
                    type="text"
                    inputMode="numeric"
                    value={backdatedBib}
                    onChange={(e) => setBackdatedBib(e.target.value.replace(/\D/g, ""))}
                    placeholder="Bib number"
                    className="w-full border rounded-md px-3 py-2 font-mono"
                    autoComplete="off"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="backdated-timestamp" className="block text-sm font-medium text-gray-600 mb-1">
                    Timestamp
                  </label>
                  <input
                    id="backdated-timestamp"
                    type="datetime-local"
                    step="1"
                    value={backdatedTimestamp}
                    onChange={(e) => setBackdatedTimestamp(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-amber-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-amber-700 w-full sm:w-auto"
              >
                Insert Lap
              </button>
            </form>
            {backdatedMessage && (
              <p
                className={`mt-3 text-sm font-medium ${
                  backdatedMessage.type === "success"
                    ? "text-green-700"
                    : "text-red-600"
                }`}
              >
                {backdatedMessage.text}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {(() => {
        const { active, stopped } = countActiveAndStopped(runners);
        if (active === 0 && stopped === 0) return null;
        return (
          <p className="text-center text-sm text-gray-600">
            <span className="font-semibold text-green-700">{active}</span>{" "}
            still running
            {stopped > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-gray-500">{stopped}</span>{" "}
                stopped
              </>
            )}
          </p>
        );
      })()}

      <Card>
        <CardContent className="p-6">
          <div className="flex border-b border-gray-200 mb-4 -mt-2">
            <button
              type="button"
              onClick={() => selectTab("recent")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === "recent"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Recent Laps
            </button>
            <button
              type="button"
              onClick={() => selectTab("status")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === "status"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Runner Status
            </button>
            <button
              type="button"
              onClick={() => selectTab("audit")}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === "audit"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Audit
              {anomalies.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold px-1.5 min-w-[1.25rem]">
                  {anomalies.length}
                </span>
              )}
            </button>
          </div>

          {tab === "status" && (() => {
            const sorted = [...runners].sort((a, b) => {
              const aStopped = !!a.runner.stopped_at;
              const bStopped = !!b.runner.stopped_at;
              if (aStopped !== bStopped) return aStopped ? 1 : -1;
              if (!a.lastLapTimestamp && !b.lastLapTimestamp) return 0;
              if (!a.lastLapTimestamp) return 1;
              if (!b.lastLapTimestamp) return -1;
              return (
                new Date(a.lastLapTimestamp).getTime() -
                new Date(b.lastLapTimestamp).getTime()
              );
            });
            const q = statusFilter.trim().toLowerCase();
            const filtered = q
              ? sorted.filter(
                  (r) =>
                    r.runner.name.toLowerCase().includes(q) ||
                    String(r.runner.bib).includes(q)
                )
              : sorted;

            return (
              <>
                <input
                  type="text"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder="Filter by name or bib"
                  className="border rounded-md px-3 py-2 text-sm w-full mb-3"
                />
                {runners.length === 0 ? (
                  <p className="text-gray-500">No runners yet</p>
                ) : filtered.length === 0 ? (
                  <p className="text-gray-500">No runners match</p>
                ) : (
                  <div className="space-y-1">
                    {filtered.map((entry) => {
                      const isStopped = !!entry.runner.stopped_at;
                      const isToggling = togglingRunnerId === entry.runner.id;
                      return (
                        <div
                          key={entry.runner.id}
                          className={`flex items-center justify-between rounded-md px-3 py-2 ${
                            isStopped ? "bg-gray-100 text-gray-400" : "bg-white"
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <Link
                              href={`/admin/runners/${entry.runner.id}/laps`}
                              className="min-w-0 flex items-center gap-2 hover:underline"
                            >
                              <span className="font-mono font-bold text-gray-600 w-10">
                                #{entry.runner.bib}
                              </span>
                              <span className={`font-medium truncate ${isStopped ? "line-through" : ""}`}>
                                {entry.runner.name}
                              </span>
                            </Link>
                            <span className="text-sm text-gray-400 whitespace-nowrap">
                              {entry.totalLaps} {entry.totalLaps === 1 ? "lap" : "laps"}
                              {" · "}
                              {entry.lastLapTimestamp
                                ? formatTimeAgo(entry.lastLapTimestamp, now)
                                : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/admin/runners/${entry.runner.id}/laps`}
                              className="min-h-[36px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Laps
                            </Link>
                            <button
                              onClick={() => handleToggleStopped(entry.runner.id, !isStopped)}
                              disabled={isToggling}
                              className={`min-h-[36px] inline-flex items-center justify-center rounded-md px-3 text-sm font-medium disabled:opacity-50 ${
                                isStopped
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {isStopped ? "Resume" : "Stop"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}

          {tab === "audit" && (
            <div className="space-y-4">
              <div className="space-y-3 border-b pb-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={auditConfig.perRunner.enabled}
                    onChange={(e) =>
                      setAuditConfig((c) => ({
                        ...c,
                        perRunner: { ...c.perRunner, enabled: e.target.checked },
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium flex-1">Per-runner outliers</span>
                  <span className="text-sm text-gray-500">×</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={auditConfig.perRunner.multiplier}
                    onChange={(e) =>
                      setAuditConfig((c) => ({
                        ...c,
                        perRunner: {
                          ...c.perRunner,
                          multiplier: Number(e.target.value) || 1,
                        },
                      }))
                    }
                    className="border rounded px-2 py-1 text-sm w-20"
                    aria-label="Per-runner baseline multiplier"
                  />
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={auditConfig.absoluteFast.enabled}
                    onChange={(e) =>
                      setAuditConfig((c) => ({
                        ...c,
                        absoluteFast: {
                          ...c.absoluteFast,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium flex-1">
                    Faster than (minutes)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={Math.round(auditConfig.absoluteFast.seconds / 60)}
                    onChange={(e) =>
                      setAuditConfig((c) => ({
                        ...c,
                        absoluteFast: {
                          ...c.absoluteFast,
                          seconds: (Number(e.target.value) || 1) * 60,
                        },
                      }))
                    }
                    className="border rounded px-2 py-1 text-sm w-24"
                    aria-label="Absolute fast threshold in minutes"
                  />
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={auditConfig.absoluteSlow.enabled}
                    onChange={(e) =>
                      setAuditConfig((c) => ({
                        ...c,
                        absoluteSlow: {
                          ...c.absoluteSlow,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium flex-1">
                    Slower than (minutes)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={Math.round(auditConfig.absoluteSlow.seconds / 60)}
                    onChange={(e) =>
                      setAuditConfig((c) => ({
                        ...c,
                        absoluteSlow: {
                          ...c.absoluteSlow,
                          seconds: (Number(e.target.value) || 1) * 60,
                        },
                      }))
                    }
                    className="border rounded px-2 py-1 text-sm w-24"
                    aria-label="Absolute slow threshold in minutes"
                  />
                </label>
              </div>

              {!auditConfig.perRunner.enabled &&
              !auditConfig.absoluteFast.enabled &&
              !auditConfig.absoluteSlow.enabled ? (
                <p className="text-gray-500 text-sm">
                  Enable at least one rule to start auditing.
                </p>
              ) : anomalies.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No anomalies for current thresholds.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">Filter:</span>
                    {ALL_REASONS.map((reason) => {
                      const count = reasonCounts[reason];
                      if (count === 0) return null;
                      const hidden = hiddenReasons.has(reason);
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => toggleReasonHidden(reason)}
                          aria-pressed={!hidden}
                          className={`text-xs font-medium rounded px-1.5 py-0.5 transition-opacity ${REASON_CLASSES[reason]} ${
                            hidden ? "opacity-40 line-through" : ""
                          }`}
                        >
                          {REASON_LABELS[reason]} ({count})
                        </button>
                      );
                    })}
                    {hiddenReasons.size > 0 && (
                      <span className="text-xs text-gray-500">
                        Showing {visibleAnomalies.length} of {anomalies.length}
                      </span>
                    )}
                  </div>
                  {visibleAnomalies.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      All anomalies hidden by filter.
                    </p>
                  ) : (
                <div className="space-y-2">
                  {visibleAnomalies.map((a) => {
                    const isSlow = a.reasons.some(
                      (r) => r === "runner_slow" || r === "absolute_slow"
                    );
                    return (
                      <div
                        key={a.lap.id}
                        className={`rounded-md px-3 py-2 transition-colors duration-1000 ${
                          highlightLapId === a.lap.id
                            ? "bg-green-100"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div>
                              <Link
                                href={`/admin/runners/${a.runner.id}/laps`}
                                className="hover:underline"
                                title="View all laps for this runner"
                              >
                                <span className="font-mono font-bold text-gray-600">
                                  #{a.runner.bib}
                                </span>{" "}
                                <span className="font-medium">{a.runner.name}</span>
                              </Link>
                              <span className="text-gray-500 ml-2">
                                Lap {a.lap.lap_number}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-0.5">
                              <span className="font-mono">
                                {formatLapTime(a.durationSeconds)}
                              </span>
                              {a.runnerBaselineSeconds !== null && (
                                <span className="text-gray-400">
                                  {" "}
                                  · baseline {formatLapTime(a.runnerBaselineSeconds)}
                                </span>
                              )}
                              <span className="text-gray-400">
                                {" "}
                                · {formatTimestamp(a.lap.timestamp)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {a.reasons.map((r) => (
                                <span
                                  key={r}
                                  className={`inline-block text-xs font-medium rounded px-1.5 py-0.5 ${REASON_CLASSES[r]}`}
                                >
                                  {REASON_LABELS[r]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() =>
                                startEditLap({
                                  ...a.lap,
                                  runner_name: a.runner.name,
                                  runner_bib: a.runner.bib,
                                })
                              }
                              className="min-h-[32px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            {isSlow && (
                              <button
                                onClick={() => {
                                  setInsertingForLapId(a.lap.id);
                                  setEditingLapId(null);
                                  setConfirmingDeleteId(null);
                                }}
                                className="min-h-[32px] inline-flex items-center justify-center rounded-md border border-amber-200 bg-white px-3 text-sm font-medium text-amber-700 hover:bg-amber-50 whitespace-nowrap"
                              >
                                Insert missed
                              </button>
                            )}
                            <DeleteLapButton
                              lapId={a.lap.id}
                              onDeleted={() =>
                                Promise.all([
                                  fetchLaps(lapsPage),
                                  fetchRunners(),
                                ])
                              }
                              size="sm"
                            />
                          </div>
                        </div>
                        {editingLapId === a.lap.id && (() => {
                          const entry = runners.find(
                            (r) => r.runner.id === a.runner.id
                          );
                          if (!entry) return null;
                          return (
                            <LapEditForm
                              lap={a.lap}
                              runnerLaps={entry.laps}
                              durationSeconds={a.durationSeconds}
                              startDateTime={startDateTime}
                              lapDistanceKm={lapDistanceKm}
                              avgLapSeconds={entry.avgLapSeconds}
                              onSaved={() => {
                                setEditingLapId(null);
                                fetchLaps(lapsPage);
                                fetchRunners();
                              }}
                              onCancel={() => setEditingLapId(null)}
                            />
                          );
                        })()}
                        {insertingForLapId === a.lap.id && (() => {
                          const entry = runners.find(
                            (r) => r.runner.id === a.runner.id
                          );
                          if (!entry) return null;
                          return (
                            <LapInsertForm
                              lap={a.lap}
                              runnerId={a.runner.id}
                              runnerLaps={entry.laps}
                              durationSeconds={a.durationSeconds}
                              startDateTime={startDateTime}
                              lapDistanceKm={lapDistanceKm}
                              avgLapSeconds={entry.avgLapSeconds}
                              onSaved={() => {
                                setInsertingForLapId(null);
                                fetchLaps(lapsPage);
                                fetchRunners();
                              }}
                              onCancel={() => setInsertingForLapId(null)}
                            />
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "recent" && (() => {
            const totalPages = Math.max(
              1,
              Math.ceil(lapsTotal / LAPS_PAGE_SIZE)
            );
            return (
            <>
              {recentLaps.length === 0 ? (
            <p className="text-gray-500">No laps registered yet</p>
          ) : (
            <div className="space-y-2">
              {recentLaps.map((lap) => (
                <div
                  key={lap.id}
                  className={`rounded-md px-3 py-2 transition-colors duration-1000 ${
                    highlightLapId === lap.id
                      ? "bg-green-100"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div>
                        <Link
                          href={`/admin/runners/${lap.runner_id}/laps`}
                          className="hover:underline"
                        >
                          <span className="font-mono font-bold text-gray-600">
                            #{lap.runner_bib}
                          </span>{" "}
                          <span className="font-medium">{lap.runner_name}</span>
                        </Link>
                        <span className="text-gray-500 ml-2">
                          Lap {lap.lap_number}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-0.5 sm:hidden">
                        {formatTimeAgo(lap.timestamp, now)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-gray-400 hidden sm:inline">
                        {formatTimeAgo(lap.timestamp, now)}
                      </span>
                      {confirmingDeleteId === lap.id ? (
                        <span className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteLap(lap.id)}
                            disabled={deletingLapId === lap.id}
                            className="min-h-[36px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-60"
                          >
                            {deletingLapId === lap.id ? (
                              <>
                                <Spinner />
                                Deleting…
                              </>
                            ) : (
                              "Confirm"
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmingDeleteId(null)}
                            disabled={deletingLapId === lap.id}
                            className="min-h-[36px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmingDeleteId(lap.id)}
                          className="min-h-[36px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
              {lapsTotal > LAPS_PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setLapsPage((p) => Math.max(1, p - 1))}
                    disabled={lapsPage <= 1}
                    className="min-h-[36px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {lapsPage} of {totalPages}
                    <span className="text-gray-400">
                      {" · "}
                      {lapsTotal} {lapsTotal === 1 ? "lap" : "laps"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLapsPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={lapsPage >= totalPages}
                    className="min-h-[36px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
            );
          })()}
        </CardContent>
      </Card>
      {recentLapPrompt && (
        <RecentLapDialog
          bib={recentLapPrompt.bib}
          secondsAgo={recentLapPrompt.secondsAgo}
          onConfirm={handleRecentLapConfirm}
          onCancel={handleRecentLapCancel}
        />
      )}
    </main>
  );
}
