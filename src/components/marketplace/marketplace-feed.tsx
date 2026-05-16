"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import {
  FiltersBar,
  DEFAULT_FILTERS,
  type MarketplaceFilters,
} from "@/components/marketplace/filters-bar";
import {
  ListingCard,
  ListingCardSkeleton,
} from "@/components/marketplace/listing-card";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const JUST_ADDED_MS = 1000 * 60 * 10;

export function MarketplaceFeed() {
  const [filters, setFilters] = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const { location } = useGeolocation();

  const listings = useQuery(api.listings.listActive, {
    near: { lat: location.lat, lng: location.lng },
    radiusKm: filters.radiusKm,
    category: filters.category === "all" ? undefined : filters.category,
    dietary: filters.dietary.length ? filters.dietary : undefined,
    donationOnly: filters.donationOnly ? true : undefined,
    search: filters.search.trim() || undefined,
  });

  const sorted = useMemo(() => {
    if (!listings) return undefined;
    const arr = [...listings];
    switch (filters.sort) {
      case "discount":
        arr.sort((a, b) => discount(b) - discount(a));
        break;
      case "urgency":
        arr.sort((a, b) => urgencyWeight(b.urgency) - urgencyWeight(a.urgency));
        break;
      case "new":
        arr.sort((a, b) => b.createdAt - a.createdAt);
        break;
      default:
        arr.sort((a, b) => (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9));
    }
    return arr;
  }, [listings, filters.sort]);

  const justAddedCount =
    sorted?.filter((l) => Date.now() - l.createdAt < JUST_ADDED_MS).length ?? 0;

  return (
    <div className="space-y-6">
      <FiltersBar value={filters} onChange={setFilters} />

      {justAddedCount > 0 && (
        <Card className="glass-strong border-sky-200/60 dark:border-sky-500/30 p-4 flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-sky-500 text-white animate-pulse-ring">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="text-sm">
            <strong>{justAddedCount}</strong> new deal{justAddedCount > 1 ? "s" : ""}{" "}
            added near you in the last 10 minutes.
          </div>
        </Card>
      )}

      {sorted === undefined && (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {sorted && sorted.length === 0 && (
        <Card className="p-10 text-center space-y-2">
          <h3 className="font-semibold text-lg">No surplus food nearby yet</h3>
          <p className="text-sm text-muted-foreground">
            Try widening your radius or removing dietary filters.
          </p>
        </Card>
      )}

      {sorted && sorted.length > 0 && (
        <motion.div
          layout
          className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence initial={false}>
            {sorted.map((l) => (
              <ListingCard
                key={l._id}
                listing={l as any}
                highlight={Date.now() - l.createdAt < JUST_ADDED_MS}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function urgencyWeight(u: string) {
  return u === "critical" ? 3 : u === "medium" ? 2 : 1;
}
function discount(l: { originalPrice: number; currentPrice: number }) {
  return (l.originalPrice - l.currentPrice) / Math.max(1, l.originalPrice);
}
