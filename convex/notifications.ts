import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const typeValidator = v.union(
  v.literal("nearby-deal"),
  v.literal("flash-discount"),
  v.literal("reservation-update"),
  v.literal("pickup-reminder"),
  v.literal("donation-request"),
  v.literal("system"),
);

export const listForUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    const items = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return limit ? items.slice(0, limit) : items;
  },
});

export const unreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", userId).eq("read", false),
      )
      .collect();
    return items.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", userId).eq("read", false),
      )
      .collect();
    for (const n of items) await ctx.db.patch(n._id, { read: true });
  },
});

export const push = mutation({
  args: {
    userId: v.id("users"),
    type: typeValidator,
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
    relatedListingId: v.optional(v.id("foodListings")),
    relatedReservationId: v.optional(v.id("reservations")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});
