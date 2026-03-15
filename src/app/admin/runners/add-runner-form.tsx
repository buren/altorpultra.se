"use client";

import { useState } from "react";
import { Gender } from "@/lib/race/types";

interface AddRunnerFormProps {
  onAdded: (runner: { id: string; bib: number; name: string }) => void;
}

export function AddRunnerForm({ onAdded }: AddRunnerFormProps) {
  const [newRunner, setNewRunner] = useState({
    name: "",
    bib: "",
    gender: "male" as Gender,
  });
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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
      setMessage({
        text: `Added #${data.data.bib} ${data.data.name}`,
        type: "success",
      });
      setNewRunner({ name: "", bib: "", gender: "male" });
      onAdded(data.data);
    } else {
      setMessage({ text: data.error, type: "error" });
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Runner</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
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
                  onChange={() => setNewRunner({ ...newRunner, gender: g })}
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
      {message && (
        <p
          className={`mt-3 text-sm font-medium ${
            message.type === "success" ? "text-green-700" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
