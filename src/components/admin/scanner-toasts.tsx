"use client";

import { useEffect, useRef } from "react";

export interface ScannerToast {
  id: string;
  type: "success" | "error";
  message: string;
  lapId?: string;
  dismissAt: number;
}

interface Props {
  toasts: ScannerToast[];
  onDismiss: (id: string) => void;
  onUndo: (lapId: string, toastId: string) => void;
}

export function ScannerToasts({ toasts, onDismiss, onUndo }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (toasts.length === 0) return;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      for (const t of toasts) {
        if (now >= t.dismissAt) {
          onDismiss(t.id);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex flex-col items-center gap-2 p-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg px-4 py-3 shadow-lg text-white text-sm font-medium flex items-center gap-3 animate-slide-down w-full max-w-sm ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          {toast.type === "success" && toast.lapId && (
            <button
              onClick={() => onUndo(toast.lapId!, toast.id)}
              className="shrink-0 bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-xs font-bold"
            >
              Undo
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
