import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  CO2_PER_MEAL_KG,
  dateKey,
  generatePickupCode,
} from "./_helpers";

const RESERVATION_TTL_MS = 1000 * 60 * 30; // 30 min

export const create = mutation({
  args: {
    listingId: v.id("foodListings"),
    userId: v.id("users"),
    quantity: v.number(),
    actorRole: v.union(v.literal("consumer"), v.literal("ngo")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    if (listing.status !== "active") {
      throw new Error("Listing is no longer available");
    }
    if (args.quantity > listing.quantityRemaining) {
      throw new Error(
        `Only ${listing.quantityRemaining} portion(s) remaining`,
      );
    }

    const existing = await ctx.db
      .query("reservations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("listingId"), args.listingId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "confirmed"),
          ),
        ),
      )
      .first();
    if (existing) {
      throw new Error("You already have an active reservation for this item");
    }

    const isDonation = listing.donationOnly || args.actorRole === "ngo";
    const totalPrice = isDonation ? 0 : listing.currentPrice * args.quantity;
    const pickupCode = generatePickupCode();

    const newRemaining = listing.quantityRemaining - args.quantity;
    await ctx.db.patch(args.listingId, {
      quantityRemaining: newRemaining,
      status: newRemaining <= 0 ? "sold-out" : listing.status,
      updatedAt: Date.now(),
    });

    const id = await ctx.db.insert("reservations", {
      listingId: args.listingId,
      providerId: listing.providerId,
      userId: args.userId,
      actorRole: args.actorRole,
      quantity: args.quantity,
      totalPrice,
      isDonation,
      status: "pending",
      pickupCode,
      qrPayload: `foodie://reservation/${pickupCode}`,
      expiresAt: Date.now() + RESERVATION_TTL_MS,
      notes: args.notes,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "reservation-update",
      title: "Reservation placed",
      body: `Your pickup code is ${pickupCode}. Confirm with the provider on arrival.`,
      relatedListingId: args.listingId,
      relatedReservationId: id,
      href: `/reservations/${id}`,
      read: false,
      createdAt: Date.now(),
    });

    const provider = await ctx.db.get(listing.providerId);
    if (provider) {
      await ctx.db.insert("notifications", {
        userId: provider.ownerId,
        type: "reservation-update",
        title: `New reservation • ${listing.title}`,
        body: `${args.quantity} portion(s) reserved. Code ${pickupCode}.`,
        relatedListingId: args.listingId,
        relatedReservationId: id,
        href: `/provider/reservations`,
        read: false,
        createdAt: Date.now(),
      });
    }

    return { reservationId: id, pickupCode };
  },
});

export const cancel = mutation({
  args: {
    reservationId: v.id("reservations"),
    // Who initiated the cancel? Drives which side gets a notification.
    cancelledBy: v.optional(
      v.union(
        v.literal("provider"),
        v.literal("consumer"),
        v.literal("system"),
      ),
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { reservationId, cancelledBy = "consumer", reason }) => {
    const r = await ctx.db.get(reservationId);
    if (!r) return;
    if (r.status === "picked-up") {
      throw new Error("Reservation already completed");
    }
    if (r.status === "cancelled") return; // idempotent

    await ctx.db.patch(reservationId, {
      status: "cancelled",
      cancelledAt: Date.now(),
    });

    const listing = await ctx.db.get(r.listingId);
    if (listing) {
      await ctx.db.patch(r.listingId, {
        quantityRemaining: listing.quantityRemaining + r.quantity,
        status:
          listing.status === "sold-out"
            ? "active"
            : listing.status,
        updatedAt: Date.now(),
      });
    }

    const listingTitle = listing?.title ?? "your reservation";
    const now = Date.now();

    if (cancelledBy === "provider") {
      // Provider rejected → tell the consumer.
      await ctx.db.insert("notifications", {
        userId: r.userId,
        type: "reservation-update",
        title: `Reservation declined • ${listingTitle}`,
        body: reason
          ? `The provider can't fulfil this reservation: "${reason}". Your portions were released back to the marketplace.`
          : `Sorry — the provider declined this reservation. Your portions were released back to the marketplace.`,
        relatedListingId: r.listingId,
        relatedReservationId: reservationId,
        href: `/reservations/${reservationId}`,
        read: false,
        createdAt: now,
      });
    } else if (cancelledBy === "consumer") {
      // Consumer self-cancelled → tell the provider.
      const provider = listing ? await ctx.db.get(listing.providerId) : null;
      if (provider) {
        await ctx.db.insert("notifications", {
          userId: provider.ownerId,
          type: "reservation-update",
          title: `Reservation cancelled • ${listingTitle}`,
          body: `The customer cancelled. ${r.quantity} portion(s) are back in your inventory.`,
          relatedListingId: r.listingId,
          relatedReservationId: reservationId,
          href: `/provider/reservations`,
          read: false,
          createdAt: now,
        });
      }
    } else {
      // System cancel (e.g. cron expiry) → tell both sides.
      await ctx.db.insert("notifications", {
        userId: r.userId,
        type: "reservation-update",
        title: `Reservation expired • ${listingTitle}`,
        body:
          reason ??
          "Your reservation window elapsed and the portions were released.",
        relatedListingId: r.listingId,
        relatedReservationId: reservationId,
        href: `/reservations/${reservationId}`,
        read: false,
        createdAt: now,
      });
      const provider = listing ? await ctx.db.get(listing.providerId) : null;
      if (provider) {
        await ctx.db.insert("notifications", {
          userId: provider.ownerId,
          type: "reservation-update",
          title: `Reservation expired • ${listingTitle}`,
          body: `${r.quantity} portion(s) returned to your inventory.`,
          relatedListingId: r.listingId,
          relatedReservationId: reservationId,
          href: `/provider/reservations`,
          read: false,
          createdAt: now,
        });
      }
    }
  },
});

export const confirm = mutation({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, { reservationId }) => {
    const r = await ctx.db.get(reservationId);
    if (!r) return;
    if (r.status === "confirmed" || r.status === "picked-up") return;

    await ctx.db.patch(reservationId, {
      status: "confirmed",
      confirmedAt: Date.now(),
    });

    // Tell the consumer the provider accepted.
    const listing = await ctx.db.get(r.listingId);
    await ctx.db.insert("notifications", {
      userId: r.userId,
      type: "reservation-update",
      title: `Reservation accepted • ${listing?.title ?? "your reservation"}`,
      body: `The provider confirmed your pickup. Show code ${r.pickupCode} at the counter.`,
      relatedListingId: r.listingId,
      relatedReservationId: reservationId,
      href: `/reservations/${reservationId}`,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markPickedUp = mutation({
  args: {
    pickupCode: v.string(),
    confirmedBy: v.id("users"),
  },
  handler: async (ctx, { pickupCode, confirmedBy }) => {
    const reservation = await ctx.db
      .query("reservations")
      .withIndex("by_pickup_code", (q) => q.eq("pickupCode", pickupCode))
      .first();
    if (!reservation) throw new Error("Invalid pickup code");
    if (reservation.status === "picked-up") return reservation;

    await ctx.db.patch(reservation._id, {
      status: "picked-up",
      pickedUpAt: Date.now(),
    });

    const listing = await ctx.db.get(reservation.listingId);
    if (listing) {
      const co2 = reservation.quantity * CO2_PER_MEAL_KG;
      // sustainability metrics for the consumer/ngo
      const metric = await ctx.db
        .query("sustainabilityMetrics")
        .withIndex("by_user", (q) => q.eq("userId", reservation.userId))
        .first();
      if (metric) {
        await ctx.db.patch(metric._id, {
          mealsRescued: metric.mealsRescued + reservation.quantity,
          co2SavedKg: metric.co2SavedKg + co2,
          moneySaved:
            metric.moneySaved +
            Math.max(
              0,
              (listing.originalPrice - listing.currentPrice) *
                reservation.quantity,
            ),
          lastActiveAt: Date.now(),
        });
      } else {
        await ctx.db.insert("sustainabilityMetrics", {
          userId: reservation.userId,
          mealsRescued: reservation.quantity,
          co2SavedKg: co2,
          moneySaved: Math.max(
            0,
            (listing.originalPrice - listing.currentPrice) *
              reservation.quantity,
          ),
          streakDays: 1,
          lastActiveAt: Date.now(),
        });
      }

      // analytics rollup
      const dk = dateKey();
      const ax = await ctx.db
        .query("analytics")
        .withIndex("by_provider_date", (q) =>
          q.eq("providerId", listing.providerId).eq("dateKey", dk),
        )
        .first();
      const patch: Record<string, number> = {
        listingsSold: reservation.isDonation ? 0 : reservation.quantity,
        listingsDonated: reservation.isDonation ? reservation.quantity : 0,
        revenue: reservation.totalPrice,
        mealsSaved: reservation.quantity,
        co2SavedKg: co2,
        moneySavedConsumers: Math.max(
          0,
          (listing.originalPrice - listing.currentPrice) * reservation.quantity,
        ),
      };
      if (ax) {
        await ctx.db.patch(ax._id, {
          listingsSold: ax.listingsSold + patch.listingsSold,
          listingsDonated: ax.listingsDonated + patch.listingsDonated,
          revenue: ax.revenue + patch.revenue,
          mealsSaved: ax.mealsSaved + patch.mealsSaved,
          co2SavedKg: ax.co2SavedKg + patch.co2SavedKg,
          moneySavedConsumers:
            ax.moneySavedConsumers + patch.moneySavedConsumers,
        });
      } else {
        await ctx.db.insert("analytics", {
          providerId: listing.providerId,
          dateKey: dk,
          listingsCreated: 0,
          listingsSold: patch.listingsSold,
          listingsDonated: patch.listingsDonated,
          revenue: patch.revenue,
          mealsSaved: patch.mealsSaved,
          co2SavedKg: patch.co2SavedKg,
          moneySavedConsumers: patch.moneySavedConsumers,
        });
      }
    }

    await ctx.db.insert("notifications", {
      userId: reservation.userId,
      type: "reservation-update",
      title: "Pickup confirmed",
      body: "Thank you for rescuing food today!",
      relatedReservationId: reservation._id,
      read: false,
      createdAt: Date.now(),
    });

    return { ...reservation, confirmedBy };
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query("reservations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return Promise.all(
      items.map(async (r) => ({
        ...r,
        listing: await ctx.db.get(r.listingId),
        provider: await ctx.db.get(r.providerId),
      })),
    );
  },
});

export const listByProvider = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, { providerId }) => {
    const items = await ctx.db
      .query("reservations")
      .withIndex("by_provider", (q) => q.eq("providerId", providerId))
      .order("desc")
      .collect();
    return Promise.all(
      items.map(async (r) => ({
        ...r,
        listing: await ctx.db.get(r.listingId),
        user: await ctx.db.get(r.userId),
      })),
    );
  },
});

export const getById = query({
  args: { reservationId: v.id("reservations") },
  handler: async (ctx, { reservationId }) => {
    const r = await ctx.db.get(reservationId);
    if (!r) return null;
    return {
      ...r,
      listing: await ctx.db.get(r.listingId),
      provider: await ctx.db.get(r.providerId),
      user: await ctx.db.get(r.userId),
    };
  },
});
