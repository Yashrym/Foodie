"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { MarketplaceMap } from "@/components/map/listing-map";
import { useGeolocation } from "@/hooks/use-geolocation";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/listing-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MapBrowser() {
  const { location } = useGeolocation();
  const [selected, setSelected] = useState<string | null>(null);
  const listings = useQuery(api.listings.listActive, {
    near: { lat: location.lat, lng: location.lng },
    radiusKm: 25,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px] h-[calc(100vh-12rem)] min-h-[600px]">
      <Card className="overflow-hidden p-0">
        <MarketplaceMap
          center={location}
          listings={(listings ?? []) as any}
          selectedId={selected}
          onSelect={setSelected}
        />
      </Card>
      <Card className="overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Nearby listings</h2>
          <Badge variant="secondary">{listings?.length ?? 0}</Badge>
        </div>
        <div className="overflow-y-auto p-3 space-y-3 flex-1">
          {!listings &&
            Array.from({ length: 4 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          {(listings as any[] | undefined)?.map((l) => (
            <div
              key={l._id}
              onMouseEnter={() => setSelected(l._id)}
              onClick={() => setSelected(l._id)}
              className="cursor-pointer"
            >
              <ListingCard listing={l as any} highlight={selected === l._id} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
