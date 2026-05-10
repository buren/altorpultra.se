"use client";

import { useState } from "react";
import { Spinner } from "./spinner";

interface DeleteLapButtonProps {
  lapId: string;
  onDeleted: () => void;
  label?: string;
  size?: "sm" | "md";
}

export function DeleteLapButton({
  lapId,
  onDeleted,
  label = "Delete",
  size = "md",
}: DeleteLapButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/race/laps?id=${lapId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setConfirming(false);
        onDeleted();
      }
    } finally {
      setDeleting(false);
    }
  }

  const heightClass = size === "sm" ? "min-h-[32px]" : "min-h-[36px]";
  const minWidthClass = size === "sm" ? "" : "min-w-[44px]";
  const textClass = size === "sm" ? "text-xs" : "text-sm";
  const padClass = size === "sm" ? "px-2" : "px-3";

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`${heightClass} ${minWidthClass} inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 ${padClass} ${textClass} font-medium text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-60`}
        >
          {deleting ? (
            <>
              <Spinner />
              Deleting…
            </>
          ) : (
            "Confirm"
          )}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className={`${heightClass} ${minWidthClass} inline-flex items-center justify-center rounded-md border border-gray-200 bg-white ${padClass} ${textClass} font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60`}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`${heightClass} ${minWidthClass} inline-flex items-center justify-center rounded-md border border-red-200 bg-white ${padClass} ${textClass} font-medium text-red-600 hover:bg-red-50 active:bg-red-100`}
    >
      {label}
    </button>
  );
}
