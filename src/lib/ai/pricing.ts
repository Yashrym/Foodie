/**
 * Dynamic discount engine + spoilage prediction.
 * Keep pure & dependency-free so it can be ported to a Python
 * microservice later without changes to the wire format.
 */

export type Urgency = "low" | "medium" | "critical";

export interface PricingInput {
  pickupStart: number;
  pickupEnd: number;
  now?: number;
  basePct?: number;
  maxPct?: number;
}

export interface PricingResult {
  discountPct: number;
  nextStepInMs: number | null;
  nextStepPct: number | null;
  urgency: Urgency;
  countdownLabel: string;
}

const STEPS = [
  { ratio: 0.0, pct: 20 },
  { ratio: 0.25, pct: 35 },
  { ratio: 0.5, pct: 50 },
  { ratio: 0.75, pct: 65 },
  { ratio: 0.95, pct: 80 },
];

export function computePricing(input: PricingInput): PricingResult {
  const now = input.now ?? Date.now();
  const total = Math.max(1, input.pickupEnd - input.pickupStart);
  const ratio = Math.min(1, Math.max(0, (now - input.pickupStart) / total));

  let current = input.basePct ?? STEPS[0].pct;
  let nextStep: (typeof STEPS)[number] | null = null;
  for (const step of STEPS) {
    if (ratio >= step.ratio) {
      current = step.pct;
    } else if (!nextStep) {
      nextStep = step;
    }
  }
  current = Math.min(input.maxPct ?? 80, current);

  const minsLeft = (input.pickupEnd - now) / 60000;
  const urgency: Urgency =
    minsLeft <= 60 ? "critical" : minsLeft <= 180 ? "medium" : "low";

  const nextStepInMs = nextStep
    ? Math.max(0, input.pickupStart + nextStep.ratio * total - now)
    : null;

  return {
    discountPct: current,
    nextStepInMs,
    nextStepPct: nextStep?.pct ?? null,
    urgency,
    countdownLabel: nextStepInMs
      ? `Next discount in ${formatMs(nextStepInMs)}`
      : "Maximum discount reached",
  };
}

export function priceAfterDiscount(original: number, pct: number) {
  const clamped = Math.max(0, Math.min(95, pct));
  return Math.round(original * (1 - clamped / 100));
}

/** Heuristic spoilage prediction. */
export function predictSpoilage(opts: {
  category: string;
  preparedAt: number;
  pickupEnd: number;
  temperatureC?: number;
  humidity?: number;
  now?: number;
}): { urgency: Urgency; rationale: string; minutesUntilCritical: number } {
  const now = opts.now ?? Date.now();
  const minsSincePrep = (now - opts.preparedAt) / 60000;
  const minsUntilEnd = (opts.pickupEnd - now) / 60000;

  // Base shelf life by category (minutes from preparation)
  const shelfLife: Record<string, number> = {
    bakery: 12 * 60,
    sandwiches: 5 * 60,
    meals: 4 * 60,
    drinks: 6 * 60,
    desserts: 8 * 60,
    produce: 24 * 60,
    dairy: 6 * 60,
    snacks: 24 * 60,
    other: 6 * 60,
  };
  let base = shelfLife[opts.category] ?? 6 * 60;
  if (opts.temperatureC && opts.temperatureC > 28) base *= 0.7;
  if (opts.humidity && opts.humidity > 70) base *= 0.85;

  const minutesUntilCritical = Math.max(0, base - minsSincePrep);
  const effective = Math.min(minutesUntilCritical, minsUntilEnd);

  const urgency: Urgency =
    effective <= 60 ? "critical" : effective <= 180 ? "medium" : "low";

  return {
    urgency,
    minutesUntilCritical: Math.round(effective),
    rationale: `Category "${opts.category}" has ~${Math.round(
      base,
    )} min shelf-life. ${Math.round(minsSincePrep)} min since prep, ${Math.round(
      Math.max(0, minsUntilEnd),
    )} min until pickup end.`,
  };
}

function formatMs(ms: number) {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "<1 min";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${hrs}h ${m}m` : `${hrs}h`;
}
