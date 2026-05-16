import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Re-evaluate dynamic pricing + urgency for every active listing.
 * Lightweight enough to run every minute on the marketplace tier.
 */
crons.interval(
  "tick-pricing",
  { minutes: 1 },
  internal.listings.tickPricing,
  {},
);

export default crons;
