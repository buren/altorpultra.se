"use client";

import { useEffect, useState } from "react";

function getTimeLeft(startDateTime: string) {
  const now = new Date();
  const diff = new Date(startDateTime).getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
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

export default function Countdown({ startDateTime }: { startDateTime: string }) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(startDateTime));
    const interval = setInterval(() => setTimeLeft(getTimeLeft(startDateTime)), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !timeLeft) return null;

  return (
    <div className="flex gap-1 md:gap-2 text-white">
      <CountdownUnit value={timeLeft.days} label="Days" />
      <span className="text-4xl md:text-6xl font-light text-white/40 self-start">:</span>
      <CountdownUnit value={timeLeft.hours} label="Hours" />
      <span className="text-4xl md:text-6xl font-light text-white/40 self-start">:</span>
      <CountdownUnit value={timeLeft.minutes} label="Min" />
      <span className="text-4xl md:text-6xl font-light text-white/40 self-start">:</span>
      <CountdownUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
}
