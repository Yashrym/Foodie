import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    address: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    phone: v.optional(v.string()),
    serviceAreas: v.array(v.string()),
    causes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ownerId, { role: "ngo" });
    return await ctx.db.insert("ngos", {
      ...args,
      verified: false,
      rescuedMeals: 0,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("ngos").collect(),
});

export const getById = query({
  args: { ngoId: v.id("ngos") },
  handler: async (ctx, { ngoId }) => ctx.db.get(ngoId),
});

export const getByOwner = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) =>
    ctx.db
      .query("ngos")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .first(),
});

export const incrementRescued = mutation({
  args: { ngoId: v.id("ngos"), meals: v.number() },
  handler: async (ctx, { ngoId, meals }) => {
    const ngo = await ctx.db.get(ngoId);
    if (!ngo) return;
    await ctx.db.patch(ngoId, { rescuedMeals: ngo.rescuedMeals + meals });
  },
});
