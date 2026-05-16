import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Foodie – Convex schema.
 *
 * Designed so a future Python AI microservice can read/write
 * exactly the same tables without coupling to Next.js.
 */
export default defineSchema({
  // ──────────────────────────────────────────────────────
  // Identity & profiles
  // ──────────────────────────────────────────────────────
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: v.union(
      v.literal("consumer"),
      v.literal("provider"),
      v.literal("ngo"),
      v.literal("admin"),
    ),
    phone: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
      }),
    ),
    favoriteProviderIds: v.optional(v.array(v.id("providers"))),
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
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  providers: defineTable({
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
    rating: v.number(),
    reviewCount: v.number(),
    verified: v.boolean(),
    openHours: v.optional(v.string()),
    acceptsDonations: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_type", ["type"]),

  ngos: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    address: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    phone: v.optional(v.string()),
    serviceAreas: v.array(v.string()),
    causes: v.array(v.string()), // "homeless", "elderly", "schools", ...
    verified: v.boolean(),
    rescuedMeals: v.number(),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  // ──────────────────────────────────────────────────────
  // Marketplace
  // ──────────────────────────────────────────────────────
  foodListings: defineTable({
    providerId: v.id("providers"),
    createdBy: v.id("users"),

    title: v.string(),
    description: v.string(),
    imageUrls: v.array(v.string()),

    category: v.string(), // FoodCategory
    ingredients: v.array(v.string()),
    dietaryTags: v.array(v.string()), // DietaryTag[]

    quantityTotal: v.number(),
    quantityRemaining: v.number(),

    originalPrice: v.number(),
    currentPrice: v.number(),
    currency: v.string(),

    pickupStart: v.number(),
    pickupEnd: v.number(),
    preparedAt: v.number(),

    location: v.object({ lat: v.number(), lng: v.number() }),

    donationOnly: v.boolean(),
    donationReady: v.boolean(), // available for NGO claim

    aiAnalysis: v.optional(
      v.object({
        suggestedDiscountPct: v.number(),
        suggestedPickupHours: v.number(),
        urgency: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("critical"),
        ),
        confidence: v.number(),
        rationale: v.string(),
        model: v.string(),
        generatedAt: v.number(),
      }),
    ),

    urgency: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("critical"),
    ),

    status: v.union(
      v.literal("active"),
      v.literal("reserved"),
      v.literal("sold-out"),
      v.literal("expired"),
      v.literal("donated"),
    ),

    discountSchedule: v.optional(
      v.array(
        v.object({
          atMs: v.number(),
          discountPct: v.number(),
          applied: v.boolean(),
        }),
      ),
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_provider", ["providerId"])
    .index("by_status", ["status"])
    .index("by_status_and_urgency", ["status", "urgency"])
    .index("by_donation", ["donationReady"]),

  reservations: defineTable({
    listingId: v.id("foodListings"),
    providerId: v.id("providers"),
    userId: v.id("users"),
    actorRole: v.union(v.literal("consumer"), v.literal("ngo")),

    quantity: v.number(),
    totalPrice: v.number(),
    isDonation: v.boolean(),

    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("picked-up"),
      v.literal("cancelled"),
      v.literal("expired"),
    ),

    pickupCode: v.string(), // 6-char alphanumeric used by QR
    qrPayload: v.string(),

    expiresAt: v.number(),
    confirmedAt: v.optional(v.number()),
    pickedUpAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),

    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_listing", ["listingId"])
    .index("by_provider", ["providerId"])
    .index("by_pickup_code", ["pickupCode"])
    .index("by_status", ["status"]),

  reviews: defineTable({
    providerId: v.id("providers"),
    userId: v.id("users"),
    reservationId: v.optional(v.id("reservations")),
    rating: v.number(), // 1..5
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_provider", ["providerId"])
    .index("by_user", ["userId"]),

  // ──────────────────────────────────────────────────────
  // Notifications & analytics
  // ──────────────────────────────────────────────────────
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("nearby-deal"),
      v.literal("flash-discount"),
      v.literal("reservation-update"),
      v.literal("pickup-reminder"),
      v.literal("donation-request"),
      v.literal("system"),
    ),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
    relatedListingId: v.optional(v.id("foodListings")),
    relatedReservationId: v.optional(v.id("reservations")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"]),

  analytics: defineTable({
    providerId: v.optional(v.id("providers")),
    ngoId: v.optional(v.id("ngos")),
    dateKey: v.string(), // YYYY-MM-DD bucket
    listingsCreated: v.number(),
    listingsSold: v.number(),
    listingsDonated: v.number(),
    revenue: v.number(),
    mealsSaved: v.number(),
    co2SavedKg: v.number(),
    moneySavedConsumers: v.number(),
  })
    .index("by_provider_date", ["providerId", "dateKey"])
    .index("by_ngo_date", ["ngoId", "dateKey"]),

  sustainabilityMetrics: defineTable({
    userId: v.id("users"),
    mealsRescued: v.number(),
    co2SavedKg: v.number(),
    moneySaved: v.number(),
    streakDays: v.number(),
    lastActiveAt: v.number(),
  }).index("by_user", ["userId"]),
});
