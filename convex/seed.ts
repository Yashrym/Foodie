import { mutation } from "./_generated/server";

/**
 * Seed sample data so the marketplace, dashboards and maps have
 * something to render the first time you boot the app.
 * Run via:  npx convex run seed:run
 */
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").take(1);
    if (existing.length > 0) {
      return { ok: true, message: "Data already exists, skipping seed" };
    }

    const now = Date.now();
    const hr = 1000 * 60 * 60;

    const providerOwner = await ctx.db.insert("users", {
      name: "Asha Fernando",
      email: "asha@bluelagoon.lk",
      role: "provider",
      createdAt: now,
    });
    const ngoOwner = await ctx.db.insert("users", {
      name: "Leo Club Colombo",
      email: "leos@colombo.org",
      role: "ngo",
      createdAt: now,
    });
    const consumer = await ctx.db.insert("users", {
      name: "Demo Consumer",
      email: "consumer@foodie.dev",
      role: "consumer",
      createdAt: now,
    });

    const providers = await Promise.all([
      ctx.db.insert("providers", {
        ownerId: providerOwner,
        name: "Blue Lagoon Cafe",
        type: "cafe",
        description: "Specialty coffee + brunch in Colombo 7.",
        coverUrl:
          "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
        logoUrl:
          "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=200&q=80",
        address: "12 Park Rd, Colombo 07",
        location: { lat: 6.9099, lng: 79.8636 },
        cuisines: ["cafe", "brunch"],
        dietaryTags: ["vegetarian"],
        rating: 4.6,
        reviewCount: 84,
        verified: true,
        acceptsDonations: true,
        openHours: "8am – 9pm",
        createdAt: now,
      }),
      ctx.db.insert("providers", {
        ownerId: providerOwner,
        name: "Sunrise Bakery",
        type: "bakery",
        description: "Fresh sourdough, pastries, and bakes daily.",
        coverUrl:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
        address: "44 Galle Rd, Colombo 03",
        location: { lat: 6.9214, lng: 79.8569 },
        cuisines: ["bakery"],
        dietaryTags: ["vegetarian"],
        rating: 4.8,
        reviewCount: 132,
        verified: true,
        acceptsDonations: true,
        openHours: "6am – 8pm",
        createdAt: now,
      }),
      ctx.db.insert("providers", {
        ownerId: providerOwner,
        name: "Green Bowl",
        type: "restaurant",
        description: "Plant-forward rice bowls and salads.",
        coverUrl:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
        address: "5 Marine Dr, Mount Lavinia",
        location: { lat: 6.8336, lng: 79.8633 },
        cuisines: ["healthy", "salads"],
        dietaryTags: ["vegan", "vegetarian"],
        rating: 4.4,
        reviewCount: 56,
        verified: true,
        acceptsDonations: true,
        openHours: "11am – 10pm",
        createdAt: now,
      }),
    ]);

    await ctx.db.insert("ngos", {
      ownerId: ngoOwner,
      name: "Leo Club Colombo",
      description:
        "Youth-led service organization providing meals to underserved communities.",
      logoUrl:
        "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=200&q=80",
      address: "Independence Sq, Colombo 07",
      location: { lat: 6.9061, lng: 79.866 },
      serviceAreas: ["Colombo 03", "Colombo 07", "Mount Lavinia"],
      causes: ["homeless", "elderly"],
      verified: true,
      rescuedMeals: 1284,
      createdAt: now,
    });

    const listings = [
      {
        providerId: providers[0],
        title: "Brunch boxes – chicken pesto",
        description:
          "12 boxes left from today's brunch buffet. Picked fresh, packed at 11am.",
        imageUrls: [
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
        ],
        category: "meals",
        ingredients: ["chicken", "pesto", "pasta", "tomato"],
        dietaryTags: [],
        quantityTotal: 12,
        originalPrice: 1200,
        donationOnly: false,
        pickupEnd: now + 3 * hr,
      },
      {
        providerId: providers[1],
        title: "Assorted croissants & pastries",
        description:
          "20 mixed pastries from today's bake. Best enjoyed within the day.",
        imageUrls: [
          "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
        ],
        category: "bakery",
        ingredients: ["butter", "flour", "chocolate"],
        dietaryTags: ["vegetarian"],
        quantityTotal: 20,
        originalPrice: 300,
        donationOnly: false,
        pickupEnd: now + 2 * hr,
      },
      {
        providerId: providers[2],
        title: "Vegan buddha bowls",
        description:
          "8 fresh vegan bowls with quinoa, hummus, roasted veg.",
        imageUrls: [
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
        ],
        category: "meals",
        ingredients: ["quinoa", "chickpea", "kale", "tahini"],
        dietaryTags: ["vegan", "vegetarian"],
        quantityTotal: 8,
        originalPrice: 1500,
        donationOnly: false,
        pickupEnd: now + 4 * hr,
      },
      {
        providerId: providers[0],
        title: "Day-end sandwich donation",
        description:
          "30 sandwiches from lunch. Marked for NGO pickup only.",
        imageUrls: [
          "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
        ],
        category: "sandwiches",
        ingredients: ["bread", "cheese", "tomato"],
        dietaryTags: ["vegetarian"],
        quantityTotal: 30,
        originalPrice: 350,
        donationOnly: true,
        pickupEnd: now + 90 * 60 * 1000,
      },
    ];

    for (const l of listings) {
      const ratio = Math.min(0.9, (now - (now - hr)) / (l.pickupEnd - now));
      const discountPct = Math.round(20 + ratio * 50);
      const currentPrice = l.donationOnly
        ? 0
        : Math.round(l.originalPrice * (1 - discountPct / 100));
      const urgency =
        l.pickupEnd - now < hr
          ? "critical"
          : l.pickupEnd - now < 3 * hr
            ? "medium"
            : "low";
      const provider = await ctx.db.get(l.providerId);
      await ctx.db.insert("foodListings", {
        providerId: l.providerId,
        createdBy: providerOwner,
        title: l.title,
        description: l.description,
        imageUrls: l.imageUrls,
        category: l.category,
        ingredients: l.ingredients,
        dietaryTags: l.dietaryTags,
        quantityTotal: l.quantityTotal,
        quantityRemaining: l.quantityTotal,
        originalPrice: l.originalPrice,
        currentPrice,
        currency: "LKR",
        pickupStart: now - hr,
        pickupEnd: l.pickupEnd,
        preparedAt: now - hr,
        location: provider?.location ?? { lat: 6.9271, lng: 79.8612 },
        donationOnly: l.donationOnly,
        donationReady: l.donationOnly,
        urgency,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("sustainabilityMetrics", {
      userId: consumer,
      mealsRescued: 14,
      co2SavedKg: 35,
      moneySaved: 4200,
      streakDays: 3,
      lastActiveAt: now,
    });

    return { ok: true, providers: providers.length, listings: listings.length };
  },
});
