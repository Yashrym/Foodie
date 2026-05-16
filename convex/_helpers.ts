import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Shared helpers used across queries/mutations.
 * Keep these dependency-free so a future Python worker could
 * port the same logic if needed.
 */

const EARTH_RADIUS_M = 6371e3;

export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Generate a short pickup code like "FD-7K3Q9". */
export function generatePickupCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `FD-${out}`;
}

/** Discount curve: from 0% near pickup start to maxPct at pickup end. */
export function dynamicDiscountPct(opts: {
  pickupStart: number;
  pickupEnd: number;
  now?: number;
  maxPct?: number;
  basePct?: number;
}) {
  const now = opts.now ?? Date.now();
  const max = opts.maxPct ?? 80;
  const base = opts.basePct ?? 20;
  if (now <= opts.pickupStart) return base;
  if (now >= opts.pickupEnd) return max;
  const ratio =
    (now - opts.pickupStart) / Math.max(1, opts.pickupEnd - opts.pickupStart);
  return Math.round(base + ratio * (max - base));
}

export function computeUrgency(opts: {
  pickupEnd: number;
  now?: number;
}): "low" | "medium" | "critical" {
  const now = opts.now ?? Date.now();
  const minsLeft = (opts.pickupEnd - now) / 60000;
  if (minsLeft <= 60) return "critical";
  if (minsLeft <= 180) return "medium";
  return "low";
}

export function priceAfterDiscount(original: number, pct: number) {
  const clamped = Math.max(0, Math.min(95, pct));
  return Math.round(original * (1 - clamped / 100));
}

export function dateKey(ts: number = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
) {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return user;
}

/** Rough CO₂ saved estimate (kg) per meal rescued. */
export const CO2_PER_MEAL_KG = 2.5;
