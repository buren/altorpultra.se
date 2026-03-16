"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { ScannerToasts, ScannerToast } from "./scanner-toasts";
import { DuplicateDialog } from "./duplicate-dialog";
import { useAudioFeedback } from "./use-audio-feedback";
import {
  parseBibFromQr,
  isDebounced,
  shouldShowDuplicateDialog,
} from "./scanner-utils";

function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);
  return canvas;
}

interface Props {
  onClose: () => void;
  fetchLaps: () => Promise<void>;
}

export function QrScannerOverlay({ onClose, fetchLaps }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recentScansRef = useRef(new Map<number, number>());
  const lastDecodedRef = useRef<{ bib: number; time: number } | null>(null);
  const pausedRef = useRef(false);

  const [toasts, setToasts] = useState<ScannerToast[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const [borderFlash, setBorderFlash] = useState<"green" | "red" | null>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    bib: number;
    secondsAgo: number;
  } | null>(null);

  const { playSuccessBeep, playErrorBeep, vibrate } = useAudioFeedback();

  const addToast = useCallback(
    (type: "success" | "error", message: string, lapId?: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [
        { id, type, message, lapId, dismissAt: Date.now() + 5000 },
        ...prev,
      ]);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const flashBorder = useCallback((color: "green" | "red") => {
    setBorderFlash(color);
    setTimeout(() => setBorderFlash(null), 300);
  }, []);

  const registerLap = useCallback(
    async (bib: number) => {
      try {
        const res = await fetch("/api/race/laps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bib }),
        });
        const data = await res.json();

        if (data.ok) {
          const { runner, lap } = data.data;
          addToast(
            "success",
            `Lap ${lap.lap_number} — #${runner.bib} ${runner.name}`,
            lap.id,
          );
          playSuccessBeep();
          vibrate(100);
          flashBorder("green");
          setScanCount((c) => c + 1);
          recentScansRef.current.set(bib, Date.now());
        } else {
          addToast("error", data.error ?? "Registration failed");
          playErrorBeep();
          vibrate([50, 50, 50]);
          flashBorder("red");
        }
      } catch {
        addToast("error", "Network error");
        playErrorBeep();
        vibrate([50, 50, 50]);
        flashBorder("red");
      }
    },
    [addToast, playSuccessBeep, playErrorBeep, vibrate, flashBorder],
  );

  const handleUndo = useCallback(
    async (lapId: string, toastId: string) => {
      try {
        const res = await fetch(`/api/race/laps?id=${lapId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.ok) {
          dismissToast(toastId);
          setScanCount((c) => Math.max(0, c - 1));
        }
      } catch {
        // silently fail
      }
    },
    [dismissToast],
  );

  // We keep registerLap in a ref so the effect doesn't re-run when it changes,
  // which would restart the camera and cause the play() abort error.
  const registerLapRef = useRef(registerLap);
  registerLapRef.current = registerLap;

  // Camera setup — runs once on mount
  useEffect(() => {
    // Capture ref value at effect time — guaranteed non-null by the guard
    const video = videoRef.current!;

    let stopped = false;
    let scanInterval: ReturnType<typeof setInterval> | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
      } catch {
        // Camera permission denied or not available
        return;
      }

      if (stopped) return;

      const reader = new BrowserQRCodeReader();

      scanInterval = setInterval(() => {
        if (stopped || !video.videoWidth) return;

        try {
          const result = reader.decodeFromCanvas(captureFrame(video));
          const bib = parseBibFromQr(result.getText());
          if (bib === null) return;

          const now = Date.now();
          if (isDebounced(lastDecodedRef.current, bib, now)) return;
          lastDecodedRef.current = { bib, time: now };

          if (pausedRef.current) return;

          if (shouldShowDuplicateDialog(recentScansRef.current, bib, now)) {
            const lastTime = recentScansRef.current.get(bib)!;
            const secondsAgo = Math.round((now - lastTime) / 1000);
            pausedRef.current = true;
            setDuplicatePrompt({ bib, secondsAgo });
          } else {
            registerLapRef.current(bib);
          }
        } catch {
          // No QR code found in this frame — expected
        }
      }, 250);
    }

    startCamera();

    return () => {
      stopped = true;
      if (scanInterval) clearInterval(scanInterval);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    fetchLaps();
    onClose();
  }, [fetchLaps, onClose]);

  const handleDuplicateConfirm = useCallback(() => {
    if (duplicatePrompt) {
      registerLap(duplicatePrompt.bib);
    }
    setDuplicatePrompt(null);
    pausedRef.current = false;
  }, [duplicatePrompt, registerLap]);

  const handleDuplicateCancel = useCallback(() => {
    setDuplicatePrompt(null);
    pausedRef.current = false;
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <ScannerToasts
        toasts={toasts}
        onDismiss={dismissToast}
        onUndo={handleUndo}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[55] flex items-center justify-between p-4">
        <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-white text-sm font-bold">
          {scanCount} scanned
        </div>
        <button
          onClick={handleClose}
          className="bg-white/20 backdrop-blur rounded-full p-2 text-white hover:bg-white/30"
          aria-label="Close scanner"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        className="flex-1 object-cover"
        playsInline
        muted
      />

      {/* Viewfinder */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-64 h-64 border-4 rounded-2xl transition-colors duration-200 ${
            borderFlash === "green"
              ? "border-green-400"
              : borderFlash === "red"
                ? "border-red-400"
                : "border-white/50"
          }`}
        />
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-10">
        <p className="text-white/80 text-center text-sm font-medium">
          Point camera at QR code
        </p>
      </div>

      {/* Duplicate dialog */}
      {duplicatePrompt && (
        <DuplicateDialog
          bib={duplicatePrompt.bib}
          secondsAgo={duplicatePrompt.secondsAgo}
          onConfirm={handleDuplicateConfirm}
          onCancel={handleDuplicateCancel}
        />
      )}
    </div>
  );
}
