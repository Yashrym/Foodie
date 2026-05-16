"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { HandHeart } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation } from "@/hooks/use-geolocation";
import { formatDistance, haversine } from "@/lib/utils";

export default function NgoDonationsQueuePage() {
  const { location } = useGeolocation();
  const donations = useQuery(api.listings.listDonationReady, {});

  if (donations === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const sorted = [...donations]
    .map((d: any) => ({
      ...d,
      distance: d.provider?.location
        ? haversine(location, d.provider.location)
        : undefined,
    }))
    .sort((a: any, b: any) => (a.distance ?? 1e9) - (b.distance ?? 1e9));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white">
          <HandHeart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Donation queue</h1>
          <p className="text-sm text-muted-foreground">
            All NGO-ready surplus, sorted by distance from your service area.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {sorted.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No donations right now. Check back soon — they update in realtime.
          </Card>
        )}
        {sorted.map((d: any) => (
          <Card key={d._id} className="p-4 flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
              {d.imageUrls?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.imageUrls[0]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/marketplace/${d._id}`}
                className="font-medium hover:underline truncate"
              >
                {d.title}
              </Link>
              <div className="text-xs text-muted-foreground">
                {d.provider?.name} • {d.quantityRemaining} portions
              </div>
            </div>
            <Badge variant="success">Donation</Badge>
            {d.distance !== undefined && (
              <Badge variant="outline">
                {formatDistance(d.distance)}
              </Badge>
            )}
            <Button asChild>
              <Link href={`/marketplace/${d._id}`}>Schedule pickup</Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
