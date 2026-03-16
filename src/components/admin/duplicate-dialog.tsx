"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  bib: number;
  secondsAgo: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const AUTO_DISMISS_MS = 3000;

export function DuplicateDialog({ bib, secondsAgo, onConfirm, onCancel }: Props) {
  const [remaining, setRemaining] = useState(AUTO_DISMISS_MS);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const next = AUTO_DISMISS_MS - elapsed;
      if (next <= 0) {
        clearInterval(interval);
        setRemaining(0);
        onCancelRef.current();
      } else {
        setRemaining(next);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl mx-6 p-6 max-w-sm w-full shadow-2xl">
        <h3 className="text-lg font-bold mb-2">Duplicate scan</h3>
        <p className="text-gray-600 mb-4">
          Runner <span className="font-mono font-bold">#{bib}</span> was scanned{" "}
          <span className="font-bold">{secondsAgo >= 60 ? `${Math.floor(secondsAgo / 60)}m` : `${secondsAgo}s`}</span> ago — register another lap?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
          >
            Register
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel ({Math.ceil(remaining / 1000)}s)
          </button>
        </div>
      </div>
    </div>
  );
}
