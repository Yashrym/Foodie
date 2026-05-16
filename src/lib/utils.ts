import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "LKR",
) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

export function formatDistance(meters: number) {
  if (!Number.isFinite(meters)) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Haversine distance in meters between two lat/lng points. */
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371e3;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);
  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function timeFromNow(timestampMs: number) {
  const diff = timestampMs - Date.now();
  const abs = Math.abs(diff);
  const sign = diff < 0 ? "ago" : "left";
  const mins = Math.round(abs / 60000);
  if (mins < 1) return diff < 0 ? "just now" : "any moment";
  if (mins < 60) return `${mins}m ${sign}`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ${sign}`;
  const days = Math.round(hours / 24);
  return `${days}d ${sign}`;
}

export function truncate(str: string, n = 120) {
  if (!str) return "";
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
