"use client";

import { useEffect, useState } from "react";

export function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, targetMs - now);
  const secs = Math.floor(remaining / 1000);
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  return {
    remainingMs: remaining,
    expired: remaining <= 0,
    days,
    hours,
    minutes,
    seconds,
    label:
      days > 0
        ? `${days}d ${hours}h`
        : hours > 0
          ? `${hours}h ${String(minutes).padStart(2, "0")}m`
          : `${minutes}:${String(seconds).padStart(2, "0")}`,
  };
}
