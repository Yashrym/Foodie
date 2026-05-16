"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { HandHeart, Plus, Trash2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProvider } from "@/hooks/use-provider";
import { formatCurrency } from "@/lib/utils";

export function ProviderListings() {
  const { provider } = useProvider();
  const listings = useQuery(
    api.listings.listByProvider,
    provider ? { providerId: provider._id } : "skip",
  );
  const markDonation = useMutation(api.listings.markDonation);
  const remove = useMutation(api.listings.remove);

  if (!provider) {
    return (
      <Card className="p-10 text-center">
        <h2 className="font-semibold">Set up your provider profile first</h2>
        <Button asChild className="mt-3">
          <Link href="/onboarding?role=provider">Create profile</Link>
        </Button>
      </Card>
    );
  }
  if (listings === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your listings</h1>
        <Button asChild>
          <Link href="/provider/listings/new">
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <h2 className="font-semibold">No listings yet</h2>
          <p className="text-muted-foreground text-sm">
            Create your first listing — Foodie's AI helps with everything.
          </p>
          <Button asChild>
            <Link href="/provider/listings/new">Create listing</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {(listings as any[]).map((l: any) => {
            const discount = Math.round(
              ((l.originalPrice - l.currentPrice) /
                Math.max(1, l.originalPrice)) *
                100,
            );
            return (
              <Card key={l._id} className="p-4 flex flex-col sm:flex-row gap-4">
                <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0">
                  {l.imageUrls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.imageUrls[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/marketplace/${l._id}`}
                      className="font-semibold hover:underline"
                    >
                      {l.title}
                    </Link>
                    <Badge
                      variant={
                        l.status === "active"
                          ? "success"
                          : l.status === "sold-out"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {l.status}
                    </Badge>
                    {l.donationOnly && (
                      <Badge variant="outline">Donation</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {l.description}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span>
                      {l.donationOnly
                        ? "Free"
                        : formatCurrency(l.currentPrice, l.currency)}
                      {!l.donationOnly && discount > 0 && (
                        <span className="ml-2 text-rose-500 text-xs font-semibold">
                          -{discount}%
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {l.quantityRemaining}/{l.quantityTotal} left
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Button
                    size="sm"
                    variant={l.donationReady ? "eco" : "outline"}
                    onClick={() =>
                      markDonation({
                        listingId: l._id,
                        donationReady: !l.donationReady,
                      }).then(() =>
                        toast.success(
                          l.donationReady
                            ? "Removed from donation queue"
                            : "Marked for NGO pickup",
                        ),
                      )
                    }
                  >
                    <HandHeart className="h-4 w-4" />
                    {l.donationReady ? "NGO-ready" : "Mark for NGO"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={() =>
                      remove({ listingId: l._id }).then(() =>
                        toast.success("Listing removed"),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
