import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    ownerId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("restaurant"),
      v.literal("cafe"),
      v.literal("bakery"),
      v.literal("grocery"),
      v.literal("hotel"),
    ),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    address: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    phone: v.optional(v.string()),
    cuisines: v.array(v.string()),
    dietaryTags: v.array(v.string()),
    openHours: v.optional(v.string()),
    acceptsDonations: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ownerId, { role: "provider" });
    return await ctx.db.insert("providers", {
      ...args,
      rating: 0,
      reviewCount: 0,
      verified: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    providerId: v.id("providers"),
    patch: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      coverUrl: v.optional(v.string()),
      address: v.optional(v.string()),
      phone: v.optional(v.string()),
      cuisines: v.optional(v.array(v.string())),
      dietaryTags: v.optional(v.array(v.string())),
      openHours: v.optional(v.string()),
      acceptsDonations: v.optional(v.boolean()),
      location: v.optional(
        v.object({ lat: v.number(), lng: v.number() }),
      ),
    }),
  },
  handler: async (ctx, { providerId, patch }) => {
    await ctx.db.patch(providerId, patch);
  },
});

export const list = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("restaurant"),
        v.literal("cafe"),
        v.literal("bakery"),
        v.literal("grocery"),
        v.literal("hotel"),
      ),
    ),
  },
  handler: async (ctx, { type }) => {
    if (type) {
      return await ctx.db
        .query("providers")
        .withIndex("by_type", (q) => q.eq("type", type))
        .collect();
    }
    return await ctx.db.query("providers").collect();
  },
});

export const getById = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, { providerId }) => ctx.db.get(providerId),
});

export const getByOwner = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) =>
    ctx.db
      .query("providers")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first(),
});

export const recomputeRating = mutation({
  args: { providerId: v.id("providers") },
  handler: async (ctx, { providerId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_provider", (q) => q.eq("providerId", providerId))
      .collect();
    if (reviews.length === 0) {
      await ctx.db.patch(providerId, { rating: 0, reviewCount: 0 });
      return;
    }
    const avg =
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    await ctx.db.patch(providerId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: reviews.length,
    });
  },
});
