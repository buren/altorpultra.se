"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { Runner, Lap, Gender } from "@/lib/race/types";
import { formatTimeAgo } from "@/lib/race/format";
import { getRacePhase, secondsUntil, formatDuration } from "@/lib/race/clock";
import { site, currentYear, event } from "@/lib/constants";

interface RecentLap extends Lap {
  runner_name: string;
  runner_bib: number;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [runners, setRunners] = useState<Runner[]>([]);
  const [recentLaps, setRecentLaps] = useState<RecentLap[]>([]);
  const [now, setNow] = useState(new Date());

  // Lap registration
  const [bibInput, setBibInput] = useState("");
  const [lapMessage, setLapMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const bibRef = useRef<HTMLInputElement>(null);

  // Add runner
  const [newRunner, setNewRunner] = useState({
    name: "",
    bib: "",
    gender: "male" as Gender,
  });
  const [highlightRunnerId, setHighlightRunnerId] = useState<string | null>(null);
  const [editingRunner, setEditingRunner] = useState<Runner | null>(null);
  const [runnerMessage, setRunnerMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Check existing auth cookie on mount
  useEffect(() => {
    fetch("/api/race/auth")
      .then((res) => {
        if (res.ok) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  // Clock tick for "time ago"
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async () => {
    const [runnersRes, lapsRes] = await Promise.all([
      fetch("/api/race/runners"),
      fetch("/api/race/laps"),
    ]);
    const [runnersData, lapsData] = await Promise.all([
      runnersRes.json(),
      lapsRes.json(),
    ]);
    if (runnersData.ok) setRunners(runnersData.data);
    if (lapsData.ok) setRecentLaps(lapsData.data);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  // Auto-focus bib input
  useEffect(() => {
    if (authenticated) bibRef.current?.focus();
  }, [authenticated, lapMessage]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/race/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.ok) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError(data.error);
    }
  }

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
      fetchData();
    } else {
      setLapMessage({ text: data.error, type: "error" });
    }
    bibRef.current?.focus();
  }

  async function handleDeleteLap(lapId: string) {
    const res = await fetch(`/api/race/laps?id=${lapId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      fetchData();
    }
  }

  async function handleAddRunner(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/race/runners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRunner.name,
        ...(newRunner.bib.trim() ? { bib: parseInt(newRunner.bib, 10) } : {}),
        gender: newRunner.gender,
      }),
    });
    const data = await res.json();

    if (data.ok) {
      setRunnerMessage({
        text: `Added #${data.data.bib} ${data.data.name}`,
        type: "success",
      });
      setHighlightRunnerId(data.data.id);
      setTimeout(() => setHighlightRunnerId(null), 2000);
      setNewRunner({ name: "", bib: "", gender: "male" });
      fetchData();
    } else {
      setRunnerMessage({ text: data.error, type: "error" });
    }
  }

  async function handleUpdateRunner(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRunner) return;
    const res = await fetch(`/api/race/runners`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingRunner.id,
        name: editingRunner.name,
        bib: editingRunner.bib,
        gender: editingRunner.gender,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setEditingRunner(null);
      fetchData();
    } else {
      setRunnerMessage({ text: data.error, type: "error" });
    }
  }

  async function handleDeleteRunner(id: string) {
    const res = await fetch(`/api/race/runners?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      setEditingRunner(null);
      fetchData();
    }
  }

  // --- Login screen ---
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-1">{site.name}</h1>
            <p className="text-gray-500 mb-6">Race Admin</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full border rounded-md px-3 py-2 text-lg pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {authError && (
                <p className="text-red-600 text-sm">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full bg-gray-900 text-white rounded-md py-2 font-semibold hover:bg-gray-800"
              >
                Log in
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold">{site.name} Admin</h1>
              <p className="text-gray-400 text-sm">{currentYear}</p>
            </div>
            <a
              href="/race"
              target="_blank"
              className="bg-gray-700 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-600"
            >
              View Leaderboard
            </a>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Lap Registration + Recent Laps */}
          <div className="space-y-6">
            {/* Lap Registration */}
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

            {/* Recent Laps */}
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
                          <span className="font-medium">
                            {lap.runner_name}
                          </span>
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
          </div>

          {/* Right column: Runner Management */}
          <div className="space-y-6">
            {/* Add Runner */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4">Add Runner</h2>
                <form onSubmit={handleAddRunner} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newRunner.name}
                        onChange={(e) =>
                          setNewRunner({ ...newRunner, name: e.target.value })
                        }
                        placeholder="Full name"
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Bib # <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newRunner.bib}
                        onChange={(e) =>
                          setNewRunner({ ...newRunner, bib: e.target.value.replace(/\D/g, "") })
                        }
                        placeholder="Auto"
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-600 mb-2">
                      Gender
                    </legend>
                    <div className="flex gap-4">
                      {(["male", "female", "other"] as const).map((g) => (
                        <label
                          key={g}
                          className={`flex-1 text-center py-2 rounded-md border cursor-pointer transition-colors ${
                            newRunner.gender === g
                              ? "bg-blue-100 text-blue-800 border-blue-400 font-semibold"
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={newRunner.gender === g}
                            onChange={() =>
                              setNewRunner({ ...newRunner, gender: g })
                            }
                            className="sr-only"
                          />
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white rounded-md py-2 font-semibold hover:bg-gray-800"
                  >
                    Add Runner
                  </button>
                </form>
                {runnerMessage && (
                  <p
                    className={`mt-3 text-sm font-medium ${
                      runnerMessage.type === "success"
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {runnerMessage.text}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Runner List */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4">
                  Runners ({runners.length})
                </h2>
                {runners.length === 0 ? (
                  <p className="text-gray-500">No runners registered</p>
                ) : (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {runners.map((r) =>
                      editingRunner?.id === r.id ? (
                        <form
                          key={r.id}
                          onSubmit={handleUpdateRunner}
                          className="bg-white border border-blue-300 rounded-md p-3 space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editingRunner.name}
                              onChange={(e) =>
                                setEditingRunner({ ...editingRunner, name: e.target.value })
                              }
                              className="border rounded px-2 py-1 text-sm"
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              value={editingRunner.bib}
                              onChange={(e) =>
                                setEditingRunner({
                                  ...editingRunner,
                                  bib: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
                                })
                              }
                              className="border rounded px-2 py-1 text-sm font-mono"
                              placeholder="Bib"
                            />
                          </div>
                          <div className="flex gap-2">
                            {(["male", "female", "other"] as const).map((g) => (
                              <label
                                key={g}
                                className={`flex-1 text-center py-1 rounded border cursor-pointer text-sm transition-colors ${
                                  editingRunner.gender === g
                                    ? "bg-blue-100 text-blue-800 border-blue-400 font-semibold"
                                    : "bg-white text-gray-700 border-gray-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="edit-gender"
                                  value={g}
                                  checked={editingRunner.gender === g}
                                  onChange={() =>
                                    setEditingRunner({ ...editingRunner, gender: g })
                                  }
                                  className="sr-only"
                                />
                                {g.charAt(0).toUpperCase() + g.slice(1)}
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 bg-gray-900 text-white rounded py-1 text-sm font-semibold hover:bg-gray-800"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRunner(null)}
                              className="flex-1 border border-gray-300 rounded py-1 text-sm font-medium hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRunner(r.id)}
                              className="border border-red-300 text-red-600 rounded px-3 py-1 text-sm font-medium hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div
                          key={r.id}
                          onClick={() => setEditingRunner(r)}
                          className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 transition-colors duration-1000 ${
                            highlightRunnerId === r.id
                              ? "bg-green-100"
                              : "bg-gray-50"
                          }`}
                        >
                          <div>
                            <span className="font-mono font-bold text-gray-600">
                              #{r.bib}
                            </span>{" "}
                            <span className="font-medium">{r.name}</span>
                          </div>
                          <span className="text-sm text-gray-400 capitalize">
                            {r.gender}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4">Results</h2>
            <a
              href="/api/race/export"
              className="inline-block bg-gray-900 text-white px-5 py-2 rounded-md font-semibold hover:bg-gray-800"
            >
              Export CSV
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
