"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Copy, Plus } from "lucide-react";

interface Edition {
  year: number;
  date: string;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
  durationHours: number;
  dateFormatted: string;
  priceSEK: number;
  lapDistanceKm: number;
  lapElevationM: number;
  raceIdUrl: string;
  stravaRoute: string;
  googleMaps: {
    startPin: string;
    parkingPin: string;
    routeEmbed: string;
    routeViewer: string;
  };
  publishedAt: string | null;
}

const emptyEdition: Edition = {
  year: new Date().getFullYear() + 1,
  date: "",
  startTime: "10:00",
  endTime: "18:00",
  startDateTime: "",
  endDateTime: "",
  durationHours: 8,
  dateFormatted: "",
  priceSEK: 300,
  lapDistanceKm: 7.0,
  lapElevationM: 100,
  raceIdUrl: "",
  stravaRoute: "",
  googleMaps: {
    startPin: "",
    parkingPin: "",
    routeEmbed: "",
    routeViewer: "",
  },
  publishedAt: null,
};

export default function EditionsPage() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [editing, setEditing] = useState<Edition | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const fetchEditions = useCallback(async () => {
    const res = await fetch("/api/race/editions");
    const data = await res.json();
    if (data.ok) {
      setEditions(data.data.editions);
      setCurrentYear(data.data.currentYear);
    }
  }, []);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions]);

  function startNew() {
    setEditing({ ...emptyEdition });
    setIsNew(true);
    setMessage(null);
  }

  function startEdit(edition: Edition) {
    setEditing({ ...edition, googleMaps: { ...edition.googleMaps } });
    setIsNew(false);
    setMessage(null);
  }

  async function handleDuplicate(sourceYear: number) {
    const nextYear = Math.max(...editions.map((e) => e.year)) + 1;
    const res = await fetch(
      `/api/race/editions?duplicate_from=${sourceYear}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: nextYear }),
      }
    );
    const data = await res.json();
    if (data.ok) {
      setMessage({ text: `Duplicated ${sourceYear} as ${nextYear}`, type: "success" });
      fetchEditions();
      startEdit(data.data);
    } else {
      setMessage({ text: data.error, type: "error" });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const method = isNew ? "POST" : "PUT";
    const res = await fetch("/api/race/editions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const data = await res.json();

    if (data.ok) {
      setMessage({
        text: isNew ? `Created ${editing.year}` : `Updated ${editing.year}`,
        type: "success",
      });
      setEditing(null);
      setIsNew(false);
      fetchEditions();
    } else {
      setMessage({ text: data.error, type: "error" });
    }
  }

  async function handleDelete(year: number) {
    if (!confirm(`Delete edition ${year}? This cannot be undone.`)) return;
    const res = await fetch(`/api/race/editions?year=${year}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.ok) {
      setMessage({ text: `Deleted ${year}`, type: "success" });
      if (editing?.year === year) setEditing(null);
      fetchEditions();
    } else {
      setMessage({ text: data.error, type: "error" });
    }
  }

  async function handleTogglePublish(edition: Edition) {
    const res = await fetch("/api/race/editions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: edition.year,
        publishedAt: edition.publishedAt ? null : new Date().toISOString(),
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessage({
        text: edition.publishedAt
          ? `Unpublished ${edition.year}`
          : `Published ${edition.year}`,
        type: "success",
      });
      fetchEditions();
    } else {
      setMessage({ text: data.error, type: "error" });
    }
  }

  function updateEditing(updates: Partial<Edition>) {
    if (!editing) return;
    setEditing({ ...editing, ...updates });
  }

  function updateGoogleMaps(updates: Partial<Edition["googleMaps"]>) {
    if (!editing) return;
    setEditing({
      ...editing,
      googleMaps: { ...editing.googleMaps, ...updates },
    });
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      {message && (
        <p
          className={`text-sm font-medium ${
            message.type === "success" ? "text-green-700" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Edition list */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Editions</h2>
            <button
              onClick={startNew}
              className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              New Edition
            </button>
          </div>
          {editions.length === 0 ? (
            <p className="text-gray-500">No editions yet</p>
          ) : (
            <div className="space-y-2">
              {editions.map((ed) => (
                <div
                  key={ed.year}
                  className="bg-gray-50 rounded-md px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-lg">{ed.year}</span>
                      {ed.year === currentYear && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Current
                        </span>
                      )}
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                          ed.publishedAt
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {ed.publishedAt ? "Published" : "Draft"}
                      </span>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {ed.dateFormatted || ed.date} &middot; {ed.startTime}–
                        {ed.endTime} &middot; {ed.lapDistanceKm} km &middot;{" "}
                        {ed.priceSEK} SEK
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTogglePublish(ed)}
                        className={`px-3 py-1 rounded text-xs font-medium hidden sm:block ${
                          ed.publishedAt
                            ? "border border-gray-300 text-gray-600 hover:bg-gray-100"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {ed.publishedAt ? "Unpublish" : "Publish"}
                      </button>
                    <button
                      onClick={() => startEdit(ed)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(ed.year)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ed.year)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:hidden">
                    <button
                      onClick={() => handleTogglePublish(ed)}
                      className={`w-full px-3 py-1.5 rounded text-xs font-medium ${
                        ed.publishedAt
                          ? "border border-gray-300 text-gray-600 hover:bg-gray-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {ed.publishedAt ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / New form */}
      {editing && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4">
              {isNew ? "New Edition" : `Edit ${editing.year}`}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Core fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={editing.year}
                    onChange={(e) =>
                      updateEditing({ year: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    disabled={!isNew}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(e) => updateEditing({ date: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editing.startTime}
                    onChange={(e) =>
                      updateEditing({ startTime: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editing.endTime}
                    onChange={(e) => updateEditing({ endTime: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={editing.durationHours}
                    onChange={(e) =>
                      updateEditing({
                        durationHours: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Price (SEK)
                  </label>
                  <input
                    type="number"
                    value={editing.priceSEK}
                    onChange={(e) =>
                      updateEditing({
                        priceSEK: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Lap Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editing.lapDistanceKm}
                    onChange={(e) =>
                      updateEditing({
                        lapDistanceKm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Lap Elevation (m)
                  </label>
                  <input
                    type="number"
                    value={editing.lapElevationM}
                    onChange={(e) =>
                      updateEditing({
                        lapElevationM: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Date Formatted
                  </label>
                  <input
                    type="text"
                    value={editing.dateFormatted}
                    onChange={(e) =>
                      updateEditing({ dateFormatted: e.target.value })
                    }
                    placeholder="e.g. May 9, 2026"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    RaceID URL
                  </label>
                  <input
                    type="text"
                    value={editing.raceIdUrl}
                    onChange={(e) =>
                      updateEditing({ raceIdUrl: e.target.value })
                    }
                    placeholder="https://raceid.com/..."
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* DateTime fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Start DateTime (ISO)
                  </label>
                  <input
                    type="text"
                    value={editing.startDateTime}
                    onChange={(e) =>
                      updateEditing({ startDateTime: e.target.value })
                    }
                    placeholder="2026-05-09T10:00:00+02:00"
                    className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    End DateTime (ISO)
                  </label>
                  <input
                    type="text"
                    value={editing.endDateTime}
                    onChange={(e) =>
                      updateEditing({ endDateTime: e.target.value })
                    }
                    placeholder="2026-05-09T18:00:00+02:00"
                    className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Strava Route
                </label>
                <input
                  type="text"
                  value={editing.stravaRoute}
                  onChange={(e) =>
                    updateEditing({ stravaRoute: e.target.value })
                  }
                  placeholder="https://www.strava.com/routes/..."
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>

              {/* Google Maps */}
              <fieldset className="border rounded-md p-3 space-y-3">
                <legend className="text-sm font-medium text-gray-600 px-1">
                  Google Maps
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Start Pin
                    </label>
                    <input
                      type="text"
                      value={editing.googleMaps.startPin}
                      onChange={(e) =>
                        updateGoogleMaps({ startPin: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Parking Pin
                    </label>
                    <input
                      type="text"
                      value={editing.googleMaps.parkingPin}
                      onChange={(e) =>
                        updateGoogleMaps({ parkingPin: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Route Embed
                    </label>
                    <input
                      type="text"
                      value={editing.googleMaps.routeEmbed}
                      onChange={(e) =>
                        updateGoogleMaps({ routeEmbed: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Route Viewer
                    </label>
                    <input
                      type="text"
                      value={editing.googleMaps.routeViewer}
                      onChange={(e) =>
                        updateGoogleMaps({ routeViewer: e.target.value })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-5 py-2 rounded-md font-semibold text-sm hover:bg-gray-800"
                >
                  {isNew ? "Create" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setIsNew(false);
                  }}
                  className="border border-gray-300 px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
