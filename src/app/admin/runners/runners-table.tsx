"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Runner, Gender } from "@/lib/race/types";
import { RunnerRow } from "./runner-row";

type GenderFilter = "all" | Gender;

interface RunnersTableProps {
  runners: Runner[];
  highlightRunnerId: string | null;
  onUpdate: (runner: Runner) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RunnersTable({
  runners,
  highlightRunnerId,
  onUpdate,
  onDelete,
}: RunnersTableProps) {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [editingRunner, setEditingRunner] = useState<Runner | null>(null);

  const filtered = useMemo(() => {
    let result = runners;
    if (genderFilter !== "all") {
      result = result.filter((r) => r.gender === genderFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          String(r.bib).includes(q)
      );
    }
    return result;
  }, [runners, search, genderFilter]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRunner) return;
    await onUpdate(editingRunner);
    setEditingRunner(null);
  }

  async function handleDelete(id: string) {
    await onDelete(id);
    setEditingRunner(null);
  }

  const genderOptions: { value: GenderFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            Runners{" "}
            <span className="text-gray-400 font-normal text-base">
              {filtered.length !== runners.length
                ? `${filtered.length} of ${runners.length}`
                : runners.length}
            </span>
          </h2>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/race/export"
            className="bg-gray-900 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-800"
          >
            Export CSV
          </a>
        </div>

        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or bib..."
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {genderOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGenderFilter(opt.value)}
                className={`flex-1 text-center py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                  genderFilter === opt.value
                    ? "bg-blue-100 text-blue-800 border-blue-400 font-semibold"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500">
            {runners.length === 0 ? "No runners registered" : "No matches"}
          </p>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.map((r) => (
              <RunnerRow
                key={r.id}
                runner={r}
                isHighlighted={highlightRunnerId === r.id}
                isEditing={editingRunner?.id === r.id}
                editingRunner={editingRunner?.id === r.id ? editingRunner : null}
                onEdit={setEditingRunner}
                onEditChange={setEditingRunner}
                onSave={handleSave}
                onCancel={() => setEditingRunner(null)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
