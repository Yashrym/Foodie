import { v } from "convex/values";
import { query } from "./_generated/server";

export const byProvider = query({
  args: { providerId: v.id("providers"), days: v.optional(v.number()) },
  handler: async (ctx, { providerId, days = 30 }) => {
    const rows = await ctx.db
      .query("analytics")
      .withIndex("by_provider_date", (q) => q.eq("providerId", providerId))
      .collect();
    rows.sort((a, b) => (a.dateKey > b.dateKey ? 1 : -1));
    return rows.slice(-days);
  },
});

export const global = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("analytics").collect();
    const totals = rows.reduce(
      (acc, r) => {
        acc.listingsCreated += r.listingsCreated;
        acc.listingsSold += r.listingsSold;
        acc.listingsDonated += r.listingsDonated;
        acc.revenue += r.revenue;
        acc.mealsSaved += r.mealsSaved;
        acc.co2SavedKg += r.co2SavedKg;
        acc.moneySavedConsumers += r.moneySavedConsumers;
        return acc;
      },
      {
        listingsCreated: 0,
        listingsSold: 0,
        listingsDonated: 0,
        revenue: 0,
        mealsSaved: 0,
        co2SavedKg: 0,
        moneySavedConsumers: 0,
      },
    );
    return { totals, days: rows.length };
  },
});

export const leaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const metrics = await ctx.db
      .query("sustainabilityMetrics")
      .collect();
    metrics.sort((a, b) => b.mealsRescued - a.mealsRescued);
    const top = metrics.slice(0, limit);
    return Promise.all(
      top.map(async (m) => ({
        ...m,
        user: await ctx.db.get(m.userId),
      })),
    );
  },
});

export const mySustainability = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const metric = await ctx.db
      .query("sustainabilityMetrics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return (
      metric ?? {
        mealsRescued: 0,
        co2SavedKg: 0,
        moneySaved: 0,
        streakDays: 0,
        lastActiveAt: 0,
      }
    );
  },
});
