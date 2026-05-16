import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    providerId: v.id("providers"),
    userId: v.id("users"),
    reservationId: v.optional(v.id("reservations")),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const id = await ctx.db.insert("reviews", {
      ...args,
      createdAt: Date.now(),
    });

    // Recompute provider rating inline
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .collect();
    const avg =
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await ctx.db.patch(args.providerId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: reviews.length,
    });

    return id;
  },
});

export const listByProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, { providerId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", providerId))
      .order("desc")
      .collect();
    return Promise.all(
      reviews.map(async (r) => ({
        ...r,
        user: await ctx.db.get(r.userId),
      })),
    );
  },
});
