"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function diffToUnits(diff: number) {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function getCountdownState(startDateTime: string, endDateTime?: string) {
  const now = new Date();
  const startDiff = new Date(startDateTime).getTime() - now.getTime();

  if (startDiff > 0) {
    return { phase: "before" as const, ...diffToUnits(startDiff) };
  }

  if (endDateTime) {
    const endDiff = new Date(endDateTime).getTime() - now.getTime();
    if (endDiff > 0) {
      return { phase: "during" as const, ...diffToUnits(endDiff) };
    }
  }

  return null;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl md:text-6xl font-bold tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs md:text-sm uppercase tracking-widest mt-1 text-white/70">
        {label}
      </span>
    </div>
  );
}

export default function Countdown({ startDateTime, endDateTime }: { startDateTime: string; endDateTime?: string }) {
  const t = useTranslations('countdown');
  const [state, setState] = useState<ReturnType<typeof getCountdownState>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setState(getCountdownState(startDateTime, endDateTime));
    const interval = setInterval(() => setState(getCountdownState(startDateTime, endDateTime)), 1000);
    return () => clearInterval(interval);
  }, [startDateTime, endDateTime]);

  if (!mounted || !state) return null;

  return (
    <div className="flex flex-col items-center gap-2 text-white">
      {state.phase === "during" && (
        <span className="text-sm md:text-base uppercase tracking-widest text-green-400 font-semibold">
          {t('raceInProgress')}
        </span>
      )}
      <div className="flex gap-1 md:gap-2">
        {state.days > 0 && (
          <>
            <CountdownUnit value={state.days} label={t('days')} />
            <span className="text-4xl md:text-6xl font-light text-white/40 self-start">:</span>
          </>
        )}
        <CountdownUnit value={state.hours} label={t('hours')} />
        <span className="text-4xl md:text-6xl font-light text-white/40 self-start">:</span>
        <CountdownUnit value={state.minutes} label={t('min')} />
        <span className="text-4xl md:text-6xl font-light text-white/40 self-start">:</span>
        <CountdownUnit value={state.seconds} label={t('sec')} />
      </div>
    </div>
  );
}
