"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CENTER } from "@/lib/constants";

export interface Geolocation {
  lat: number;
  lng: number;
  source: "browser" | "default";
}

export function useGeolocation(): {
  location: Geolocation;
  ready: boolean;
  error: string | null;
} {
  const [location, setLocation] = useState<Geolocation>({
    ...DEFAULT_CENTER,
    source: "default",
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "browser",
        });
        setReady(true);
      },
      (err) => {
        setError(err.message);
        setReady(true);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60_000 },
    );
  }, []);

  return { location, ready, error };
}
