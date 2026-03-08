"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Runner, Gender } from "@/lib/race/types";

export default function RunnersPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [newRunner, setNewRunner] = useState({
    name: "",
    bib: "",
    gender: "male" as Gender,
  });
  const [highlightRunnerId, setHighlightRunnerId] = useState<string | null>(
    null
  );
  const [editingRunner, setEditingRunner] = useState<Runner | null>(null);
  const [runnerMessage, setRunnerMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const fetchRunners = useCallback(async () => {
    const res = await fetch("/api/race/runners");
    const data = await res.json();
    if (data.ok) setRunners(data.data);
  }, []);

  useEffect(() => {
    fetchRunners();
    const interval = setInterval(fetchRunners, 5000);
    return () => clearInterval(interval);
  }, [fetchRunners]);

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
      fetchRunners();
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
      fetchRunners();
    } else {
      setRunnerMessage({ text: data.error, type: "error" });
    }
  }

  async function handleDeleteRunner(id: string) {
    const res = await fetch(`/api/race/runners?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.ok) {
      setEditingRunner(null);
      fetchRunners();
    }
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
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
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Bib #{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newRunner.bib}
                  onChange={(e) =>
                    setNewRunner({
                      ...newRunner,
                      bib: e.target.value.replace(/\D/g, ""),
                    })
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

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Runners ({runners.length})</h2>
            <a
              href="/api/race/export"
              className="bg-gray-900 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-800"
            >
              Export CSV
            </a>
          </div>
          {runners.length === 0 ? (
            <p className="text-gray-500">No runners registered</p>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
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
                          setEditingRunner({
                            ...editingRunner,
                            name: e.target.value,
                          })
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
                            bib:
                              parseInt(
                                e.target.value.replace(/\D/g, ""),
                                10
                              ) || 0,
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
    </main>
  );
}
