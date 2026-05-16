import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

export const upsertFromAuth = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("consumer"),
        v.literal("provider"),
        v.literal("ngo"),
        v.literal("admin"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        image: args.image ?? existing.image,
        role: args.role ?? existing.role,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      role: args.role ?? "consumer",
      preferences: {
        dietary: [],
        radiusKm: 5,
        notifications: {
          nearbyDeals: true,
          flashDiscounts: true,
          pickupReminders: true,
          donationRequests: false,
        },
      },
      createdAt: Date.now(),
    });
  },
});

export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("consumer"),
      v.literal("provider"),
      v.literal("ngo"),
      v.literal("admin"),
    ),
  },
  handler: async (ctx, { userId, role }) => {
    await ctx.db.patch(userId, { role });
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
      }),
    ),
    preferences: v.optional(
      v.object({
        dietary: v.array(v.string()),
        radiusKm: v.number(),
        notifications: v.object({
          nearbyDeals: v.boolean(),
          flashDiscounts: v.boolean(),
          pickupReminders: v.boolean(),
          donationRequests: v.boolean(),
        }),
      }),
    ),
  },
  handler: async (ctx, { userId, ...patch }) => {
    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.phone !== undefined) updates.phone = patch.phone;
    if (patch.location !== undefined) updates.location = patch.location;
    if (patch.preferences !== undefined) updates.preferences = patch.preferences;
    await ctx.db.patch(userId, updates);
  },
});

export const toggleFavorite = mutation({
  args: { userId: v.id("users"), providerId: v.id("providers") },
  handler: async (ctx, { userId, providerId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const favs = user.favoriteProviderIds ?? [];
    const next = favs.includes(providerId)
      ? favs.filter((id) => id !== providerId)
      : [...favs, providerId];
    await ctx.db.patch(userId, { favoriteProviderIds: next });
    return next.includes(providerId);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("users").collect(),
});
