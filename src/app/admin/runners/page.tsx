"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Runner } from "@/lib/race/types";
import { AddRunnerForm } from "./add-runner-form";
import { ImportRunners } from "./import-runners";
import { RunnersTable } from "./runners-table";

export default function RunnersPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [highlightRunnerId, setHighlightRunnerId] = useState<string | null>(
    null
  );
  const [addOpen, setAddOpen] = useState(false);

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

  function handleRunnerAdded(runner: { id: string }) {
    setHighlightRunnerId(runner.id);
    setTimeout(() => setHighlightRunnerId(null), 2000);
    fetchRunners();
  }

  function handleImported() {
    fetchRunners();
  }

  async function handleUpdate(runner: Runner) {
    const res = await fetch("/api/race/runners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: runner.id,
        name: runner.name,
        bib: runner.bib,
        gender: runner.gender,
      }),
    });
    const data = await res.json();
    if (data.ok) fetchRunners();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/race/runners?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.ok) fetchRunners();
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-0">
          <button
            onClick={() => setAddOpen(!addOpen)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h2 className="text-lg font-bold">Add / Import Runners</h2>
            {addOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {addOpen && (
            <div className="px-6 pb-6 space-y-6 border-t pt-6">
              <AddRunnerForm onAdded={handleRunnerAdded} />
              <hr className="border-gray-200" />
              <ImportRunners
                runners={runners}
                onImported={handleImported}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <RunnersTable
        runners={runners}
        highlightRunnerId={highlightRunnerId}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </main>
  );
}
