import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  computeUrgency,
  dateKey,
  dynamicDiscountPct,
  haversine,
  priceAfterDiscount,
} from "./_helpers";

const urgencyValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("critical"),
);

const statusValidator = v.union(
  v.literal("active"),
  v.literal("reserved"),
  v.literal("sold-out"),
  v.literal("expired"),
  v.literal("donated"),
);

export const create = mutation({
  args: {
    providerId: v.id("providers"),
    createdBy: v.id("users"),
    title: v.string(),
    description: v.string(),
    imageUrls: v.array(v.string()),
    category: v.string(),
    ingredients: v.array(v.string()),
    dietaryTags: v.array(v.string()),
    quantityTotal: v.number(),
    originalPrice: v.number(),
    currentPrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    pickupStart: v.number(),
    pickupEnd: v.number(),
    preparedAt: v.optional(v.number()),
    location: v.object({ lat: v.number(), lng: v.number() }),
    donationOnly: v.boolean(),
    aiAnalysis: v.optional(
      v.object({
        suggestedDiscountPct: v.number(),
        suggestedPickupHours: v.number(),
        urgency: urgencyValidator,
        confidence: v.number(),
        rationale: v.string(),
        model: v.string(),
        generatedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const urgency =
      args.aiAnalysis?.urgency ??
      computeUrgency({ pickupEnd: args.pickupEnd, now });
    const discount =
      args.aiAnalysis?.suggestedDiscountPct ??
      dynamicDiscountPct({
        pickupStart: args.pickupStart,
        pickupEnd: args.pickupEnd,
        now,
      });
    const currentPrice =
      args.currentPrice ??
      priceAfterDiscount(args.originalPrice, args.donationOnly ? 100 : discount);

    const id = await ctx.db.insert("foodListings", {
      providerId: args.providerId,
      createdBy: args.createdBy,
      title: args.title,
      description: args.description,
      imageUrls: args.imageUrls,
      category: args.category,
      ingredients: args.ingredients,
      dietaryTags: args.dietaryTags,
      quantityTotal: args.quantityTotal,
      quantityRemaining: args.quantityTotal,
      originalPrice: args.originalPrice,
      currentPrice,
      currency: args.currency ?? "LKR",
      pickupStart: args.pickupStart,
      pickupEnd: args.pickupEnd,
      preparedAt: args.preparedAt ?? now,
      location: args.location,
      donationOnly: args.donationOnly,
      donationReady: args.donationOnly,
      aiAnalysis: args.aiAnalysis,
      urgency,
      status: "active",
      discountSchedule: buildSchedule({
        pickupStart: args.pickupStart,
        pickupEnd: args.pickupEnd,
      }),
      createdAt: now,
      updatedAt: now,
    });

    await bumpAnalytics(ctx, args.providerId, "listingsCreated", 1);
    return id;
  },
});

export const update = mutation({
  args: {
    listingId: v.id("foodListings"),
    patch: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      imageUrls: v.optional(v.array(v.string())),
      quantityRemaining: v.optional(v.number()),
      currentPrice: v.optional(v.number()),
      donationReady: v.optional(v.boolean()),
      pickupEnd: v.optional(v.number()),
      status: v.optional(statusValidator),
      urgency: v.optional(urgencyValidator),
    }),
  },
  handler: async (ctx, { listingId, patch }) => {
    await ctx.db.patch(listingId, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { listingId: v.id("foodListings") },
  handler: async (ctx, { listingId }) => {
    await ctx.db.delete(listingId);
  },
});

export const getById = query({
  args: { listingId: v.id("foodListings") },
  handler: async (ctx, { listingId }) => {
    const listing = await ctx.db.get(listingId);
    if (!listing) return null;
    const provider = await ctx.db.get(listing.providerId);
    return { ...listing, provider };
  },
});

export const listActive = query({
  args: {
    near: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    radiusKm: v.optional(v.number()),
    category: v.optional(v.string()),
    dietary: v.optional(v.array(v.string())),
    donationOnly: v.optional(v.boolean()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("foodListings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const providersMap = new Map<string, any>();
    const enriched = await Promise.all(
      listings.map(async (l) => {
        let provider = providersMap.get(String(l.providerId));
        if (!provider) {
          provider = await ctx.db.get(l.providerId);
          providersMap.set(String(l.providerId), provider);
        }
        const distance =
          args.near && provider
            ? haversine(args.near, l.location)
            : undefined;
        return { ...l, provider, distanceM: distance };
      }),
    );

    let filtered = enriched.filter((l) => l.quantityRemaining > 0);

    if (args.category) {
      filtered = filtered.filter((l) => l.category === args.category);
    }
    if (args.dietary && args.dietary.length > 0) {
      filtered = filtered.filter((l) =>
        args.dietary!.every((d) => l.dietaryTags.includes(d)),
      );
    }
    if (args.donationOnly) {
      filtered = filtered.filter((l) => l.donationOnly);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.ingredients.join(" ").toLowerCase().includes(q) ||
          l.provider?.name?.toLowerCase().includes(q),
      );
    }
    if (args.near && args.radiusKm) {
      const r = args.radiusKm * 1000;
      filtered = filtered.filter(
        (l) => l.distanceM === undefined || l.distanceM <= r,
      );
    }

    filtered.sort((a, b) => {
      if (a.distanceM !== undefined && b.distanceM !== undefined) {
        return a.distanceM - b.distanceM;
      }
      return b.createdAt - a.createdAt;
    });

    if (args.limit) filtered = filtered.slice(0, args.limit);
    return filtered;
  },
});

export const listByProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, { providerId }) =>
    ctx.db
      .query("foodListings")
      .withIndex("by_provider", (q) => q.eq("providerId", providerId))
      .order("desc")
      .collect(),
});

export const listDonationReady = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("foodListings")
      .withIndex("by_donation", (q) => q.eq("donationReady", true))
      .collect();
    return Promise.all(
      items
        .filter((i) => i.status === "active" && i.quantityRemaining > 0)
        .map(async (i) => ({ ...i, provider: await ctx.db.get(i.providerId) })),
    );
  },
});

export const markDonation = mutation({
  args: { listingId: v.id("foodListings"), donationReady: v.boolean() },
  handler: async (ctx, { listingId, donationReady }) => {
    await ctx.db.patch(listingId, { donationReady, updatedAt: Date.now() });
  },
});

export const justAdded = query({
  args: { sinceMs: v.number() },
  handler: async (ctx, { sinceMs }) => {
    const items = await ctx.db
      .query("foodListings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return items.filter((l) => l.createdAt >= sinceMs);
  },
});

/** Cron-friendly: re-evaluate price + urgency + expire stale listings. */
export const tickPricing = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const items = await ctx.db
      .query("foodListings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const l of items) {
      if (l.pickupEnd <= now) {
        await ctx.db.patch(l._id, { status: "expired", updatedAt: now });
        continue;
      }
      const discount = dynamicDiscountPct({
        pickupStart: l.pickupStart,
        pickupEnd: l.pickupEnd,
        now,
      });
      const newPrice = l.donationOnly
        ? 0
        : priceAfterDiscount(l.originalPrice, discount);
      const newUrgency = computeUrgency({ pickupEnd: l.pickupEnd, now });
      if (newPrice !== l.currentPrice || newUrgency !== l.urgency) {
        await ctx.db.patch(l._id, {
          currentPrice: newPrice,
          urgency: newUrgency,
          updatedAt: now,
        });
      }
    }
    return { processed: items.length };
  },
});

function buildSchedule(opts: { pickupStart: number; pickupEnd: number }) {
  const total = opts.pickupEnd - opts.pickupStart;
  if (total <= 0) return [];
  const steps = [0.25, 0.5, 0.75, 0.95];
  return steps.map((s) => ({
    atMs: Math.round(opts.pickupStart + total * s),
    discountPct: Math.round(20 + s * 60),
    applied: false,
  }));
}

async function bumpAnalytics(
  ctx: { db: any },
  providerId: any,
  field:
    | "listingsCreated"
    | "listingsSold"
    | "listingsDonated"
    | "revenue"
    | "mealsSaved"
    | "co2SavedKg"
    | "moneySavedConsumers",
  delta: number,
) {
  const dk = dateKey();
  const existing = await ctx.db
    .query("analytics")
    .withIndex("by_provider_date", (q: any) =>
      q.eq("providerId", providerId).eq("dateKey", dk),
    )
    .first();
  if (!existing) {
    await ctx.db.insert("analytics", {
      providerId,
      dateKey: dk,
      listingsCreated: field === "listingsCreated" ? delta : 0,
      listingsSold: field === "listingsSold" ? delta : 0,
      listingsDonated: field === "listingsDonated" ? delta : 0,
      revenue: field === "revenue" ? delta : 0,
      mealsSaved: field === "mealsSaved" ? delta : 0,
      co2SavedKg: field === "co2SavedKg" ? delta : 0,
      moneySavedConsumers: field === "moneySavedConsumers" ? delta : 0,
    });
  } else {
    await ctx.db.patch(existing._id, {
      [field]: (existing[field] ?? 0) + delta,
    });
  }
}
