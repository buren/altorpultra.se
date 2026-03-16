"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lap } from "@/lib/race/types";
import { formatTimeAgo } from "@/lib/race/format";
import { QrScannerOverlay } from "@/components/admin/qr-scanner-overlay";

interface RecentLap extends Lap {
  runner_name: string;
  runner_bib: number;
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fromLocalDatetimeValue(local: string): string {
  return new Date(local).toISOString();
}

export default function LapsPage() {
  const [recentLaps, setRecentLaps] = useState<RecentLap[]>([]);
  const [now, setNow] = useState(new Date());
  const [bibInput, setBibInput] = useState("");
  const [lapMessage, setLapMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [editingLapId, setEditingLapId] = useState<string | null>(null);
  const [editTimestamp, setEditTimestamp] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
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
  const [scannerOpen, setScannerOpen] = useState(false);
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
      setHighlightLapId(lap.id);
      setTimeout(() => setHighlightLapId(null), 3000);
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
    if (data.ok) {
      setConfirmingDeleteId(null);
      fetchLaps();
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
      fetchLaps();
    }
  }

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
      fetchLaps();
    } else {
      setBackdatedMessage({ text: putData.error, type: "error" });
    }
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
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
                className="w-full border rounded-md px-3 py-3 text-2xl font-mono text-center"
                autoComplete="off"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold text-lg hover:bg-green-700 w-full sm:w-auto"
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="bg-gray-800 text-white px-4 py-3 rounded-md font-semibold text-lg hover:bg-gray-900 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a3 3 0 013-3h3M21 9V6a3 3 0 00-3-3h-3M3 15v3a3 3 0 003 3h3M21 15v3a3 3 0 01-3 3h-3" />
              </svg>
              Scan
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
                  className={`rounded-md px-3 py-2 transition-colors duration-1000 ${
                    highlightLapId === lap.id
                      ? "bg-green-100"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div>
                        <span className="font-mono font-bold text-gray-600">
                          #{lap.runner_bib}
                        </span>{" "}
                        <span className="font-medium">{lap.runner_name}</span>
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
                      <button
                        onClick={() => startEditLap(lap)}
                        className="min-h-[36px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                      >
                        Edit
                      </button>
                      {confirmingDeleteId === lap.id ? (
                        <span className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteLap(lap.id)}
                            className="min-h-[36px] min-w-[44px] inline-flex items-center justify-center rounded-md bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmingDeleteId(null)}
                            className="min-h-[36px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100"
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
                  {editingLapId === lap.id && (
                    <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="datetime-local"
                        step="1"
                        value={editTimestamp}
                        onChange={(e) => setEditTimestamp(e.target.value)}
                        className="border rounded px-2 py-2 text-sm flex-1"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveTimestamp(lap.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 flex-1 sm:flex-none"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingLapId(null)}
                          className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 rounded border flex-1 sm:flex-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {scannerOpen && (
        <QrScannerOverlay
          onClose={() => setScannerOpen(false)}
          fetchLaps={fetchLaps}
        />
      )}
    </main>
  );
}
