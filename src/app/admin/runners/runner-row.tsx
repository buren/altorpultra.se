"use client";

import { Pencil } from "lucide-react";
import { Runner } from "@/lib/race/types";

interface RunnerRowProps {
  runner: Runner;
  isHighlighted: boolean;
  isEditing: boolean;
  editingRunner: Runner | null;
  onEdit: (runner: Runner) => void;
  onEditChange: (runner: Runner) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

export function RunnerRow({
  runner,
  isHighlighted,
  isEditing,
  editingRunner,
  onEdit,
  onEditChange,
  onSave,
  onCancel,
  onDelete,
}: RunnerRowProps) {
  if (isEditing && editingRunner) {
    return (
      <form
        onSubmit={onSave}
        className="bg-white border border-blue-300 rounded-md p-3 space-y-2"
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={editingRunner.name}
            onChange={(e) =>
              onEditChange({ ...editingRunner, name: e.target.value })
            }
            className="border rounded px-2 py-1 text-sm"
            placeholder="Name"
          />
          <input
            type="text"
            inputMode="numeric"
            value={editingRunner.bib}
            onChange={(e) =>
              onEditChange({
                ...editingRunner,
                bib:
                  parseInt(e.target.value.replace(/\D/g, ""), 10) || 0,
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
                  onEditChange({ ...editingRunner, gender: g })
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
            onClick={onCancel}
            className="flex-1 border border-gray-300 rounded py-1 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onDelete(runner.id)}
            className="border border-red-300 text-red-600 rounded px-3 py-1 text-sm font-medium hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      onClick={() => onEdit(runner)}
      className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 transition-colors duration-1000 ${
        isHighlighted ? "bg-green-100" : "bg-gray-50"
      }`}
    >
      <div>
        <span className="font-mono font-bold text-gray-600">
          #{runner.bib}
        </span>{" "}
        <span className="font-medium">{runner.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 capitalize">
          {runner.gender}
        </span>
        <Pencil className="h-3.5 w-3.5 text-gray-300" />
      </div>
    </div>
  );
}
