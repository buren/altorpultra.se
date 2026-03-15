"use client";

import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Runner } from "@/lib/race/types";
import {
  parseStartlistBuffer,
  validateStartlistRows,
  StartlistRow,
} from "@/lib/race/import-startlist";
import { getNextBibNumber } from "@/lib/race/services";

interface ImportRunnersProps {
  runners: Runner[];
  onImported: (count: number) => void;
}

export function ImportRunners({ runners, onImported }: ImportRunnersProps) {
  const [importRows, setImportRows] = useState<StartlistRow[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [autoGenerateBibs, setAutoGenerateBibs] = useState(false);
  const rawImportRows = useRef<StartlistRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyBibStrategy(
    rows: StartlistRow[],
    autoGenerate: boolean
  ): StartlistRow[] {
    if (!autoGenerate) return rows;
    const startBib = getNextBibNumber(runners);
    return rows.map((r, i) => ({ ...r, bib: startBib + i }));
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    setImportRows(null);
    rawImportRows.current = null;

    if (!file.name.endsWith(".xlsx")) {
      setImportError("Only .xlsx files are supported");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parseStartlistBuffer(buffer);
      rawImportRows.current = parsed;
      const rows = applyBibStrategy(parsed, autoGenerateBibs);
      const err = validateStartlistRows(rows, runners);
      if (err) {
        setImportError(err);
        return;
      }
      setImportRows(rows);
    } catch (e: any) {
      setImportError(e.message || "Failed to parse file");
    }
  }

  async function handleImportConfirm() {
    if (!importRows) return;
    setImporting(true);
    setImportError(null);

    try {
      const res = await fetch("/api/race/runners/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runners: importRows }),
      });
      const data = await res.json();

      if (data.ok) {
        setImportRows(null);
        onImported(data.count);
      } else {
        setImportError(data.error);
      }
    } catch {
      setImportError("Network error during import");
    } finally {
      setImporting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file);
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Import from Race ID
      </h3>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          Drop .xlsx startlist here or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <label className="flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={autoGenerateBibs}
          onChange={(e) => {
            const checked = e.target.checked;
            setAutoGenerateBibs(checked);
            if (rawImportRows.current) {
              const rows = applyBibStrategy(rawImportRows.current, checked);
              const err = validateStartlistRows(rows, runners);
              if (err) {
                setImportError(err);
                setImportRows(null);
              } else {
                setImportError(null);
                setImportRows(rows);
              }
            }
          }}
          className="rounded border-gray-300"
        />
        Auto-generate new bibs
      </label>

      {importError && (
        <p className="mt-3 text-sm font-medium text-red-600">{importError}</p>
      )}

      {importRows && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{importRows.length}</span> runners
            found
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {importRows.map((r) => (
              <div
                key={r.bib}
                className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded text-sm"
              >
                <span>
                  <span className="font-mono font-bold text-gray-600">
                    #{r.bib}
                  </span>{" "}
                  {r.name}
                </span>
                <span className="text-gray-400 capitalize">{r.gender}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImportConfirm}
              disabled={importing}
              className="flex-1 bg-gray-900 text-white rounded-md py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {importing
                ? "Importing..."
                : `Import ${importRows.length} runners`}
            </button>
            <button
              onClick={() => {
                setImportRows(null);
                setImportError(null);
              }}
              className="border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
