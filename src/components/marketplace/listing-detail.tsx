"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Heart,
  Leaf,
  MapPin,
  Minus,
  Phone,
  Plus,
  Sparkles,
  Star,
  Timer,
} from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCountdown } from "@/hooks/use-countdown";
import { useGeolocation } from "@/hooks/use-geolocation";
import { cn, formatCurrency, formatDistance, haversine } from "@/lib/utils";
import { URGENCY_STYLES } from "@/lib/constants";
import { computePricing } from "@/lib/ai/pricing";
import { ListingMap } from "@/components/map/listing-map";

export function ListingDetail({
  listingId,
}: {
  listingId: Id<"foodListings">;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useCurrentUser();
  const { location } = useGeolocation();
  const listing = useQuery(api.listings.getById, { listingId });
  const reviews = useQuery(
    api.reviews.listByProvider,
    listing?.provider?._id
      ? { providerId: listing.provider._id as Id<"providers"> }
      : "skip",
  );
  const toggleFavorite = useMutation(api.users.toggleFavorite);
  const reserve = useMutation(api.reservations.create);

  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const countdown = useCountdown(listing?.pickupEnd ?? Date.now());
  const pricing = listing
    ? computePricing({
        pickupStart: listing.pickupStart,
        pickupEnd: listing.pickupEnd,
      })
    : null;

  if (listing === undefined) {
    return (
      <section className="container py-8">
        <Skeleton className="h-72 w-full rounded-2xl" />
      </section>
    );
  }
  if (!listing) {
    return (
      <section className="container py-16 text-center">
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="text-muted-foreground mt-2">
          It may have been claimed or removed.
        </p>
        <Button asChild className="mt-6">
          <Link href="/marketplace">Back to marketplace</Link>
        </Button>
      </section>
    );
  }

  const urgencyStyle =
    URGENCY_STYLES[(listing.urgency as keyof typeof URGENCY_STYLES) ?? "low"];
  const distance =
    listing.provider?.location && location
      ? haversine(location, listing.provider.location)
      : undefined;
  const totalPrice = listing.donationOnly ? 0 : listing.currentPrice * qty;
  const isFav = user?.favoriteProviderIds?.includes(
    listing.provider?._id as any,
  );

  const onReserve = async () => {
    if (!isAuthenticated || !user) {
      router.push(`/login?callbackUrl=/marketplace/${listing._id}`);
      return;
    }
    if (qty < 1 || qty > listing.quantityRemaining) {
      toast.error(`Pick a quantity between 1 and ${listing.quantityRemaining}`);
      return;
    }
    setBusy(true);
    try {
      const res = await reserve({
        listingId: listing._id,
        userId: user._id,
        quantity: qty,
        actorRole: user.role === "ngo" ? "ngo" : "consumer",
      });
      toast.success(`Reserved! Pickup code ${res.pickupCode}`);
      router.push(`/reservations/${res.reservationId}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not reserve");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container py-6 space-y-8">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/marketplace">
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            {listing.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.imageUrls[0]}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {listing.donationOnly ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Donation only
                </Badge>
              ) : (
                <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
                  -{Math.round(
                    ((listing.originalPrice - listing.currentPrice) /
                      Math.max(1, listing.originalPrice)) *
                      100,
                  )}
                  %
                </Badge>
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur",
                  urgencyStyle.bg,
                  urgencyStyle.text,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", urgencyStyle.dot)} />
                {urgencyStyle.label}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {listing.title}
            </h1>
            <p className="text-muted-foreground mt-2">{listing.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{listing.category}</Badge>
              {listing.dietaryTags.map((t: string) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          {listing.aiAnalysis && (
            <Card className="p-5 glass-strong border-sky-200/60 dark:border-sky-500/20">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">AI insight</span>
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {Math.round(listing.aiAnalysis.confidence * 100)}% confident
                </Badge>
              </div>
              <p className="text-sm mt-2">{listing.aiAnalysis.rationale}</p>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {listing.ingredients.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  Not specified
                </span>
              )}
              {listing.ingredients.map((i: string) => (
                <Badge key={i} variant="outline">
                  {i}
                </Badge>
              ))}
            </div>
          </Card>

          {listing.provider && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">About the provider</h3>
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toggleFavorite({
                        userId: user._id,
                        providerId: listing.provider!._id as Id<"providers">,
                      })
                    }
                    aria-label="Favorite"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isFav && "fill-rose-500 text-rose-500",
                      )}
                    />
                  </Button>
                )}
              </div>
              <div className="flex gap-4">
                {listing.provider.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.provider.logoUrl}
                    alt={listing.provider.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-sky-100 dark:bg-sky-500/10 grid place-items-center text-sky-600 font-bold">
                    {listing.provider.name.slice(0, 1)}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="font-semibold">{listing.provider.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="capitalize">{listing.provider.type}</span>
                    {listing.provider.rating > 0 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {listing.provider.rating} ({listing.provider.reviewCount})
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {listing.provider.address}
                  </div>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden h-56 border">
                <ListingMap
                  center={listing.provider.location}
                  marker={{
                    lat: listing.provider.location.lat,
                    lng: listing.provider.location.lng,
                    label: listing.provider.name,
                  }}
                />
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Reviews</h3>
            {!reviews && (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            {reviews && reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No reviews yet. Be the first to leave one after pickup!
              </p>
            )}
            <div className="space-y-3">
              {(reviews ?? []).slice(0, 5).map((r: any) => (
                <div key={r._id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {r.user?.name ?? "Anonymous"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      {r.rating.toFixed(1)}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground mt-1.5">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 self-start">
          <Card className="p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                {listing.donationOnly ? (
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    Free
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {formatCurrency(listing.currentPrice, listing.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground line-through">
                      {formatCurrency(listing.originalPrice, listing.currency)}
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Pickup ends</div>
                <div className="text-lg font-semibold inline-flex items-center gap-1.5">
                  <Timer className="h-4 w-4 text-rose-500" />
                  {countdown.expired ? "Closed" : countdown.label}
                </div>
              </div>
            </div>

            {pricing && pricing.nextStepPct && !listing.donationOnly && (
              <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-200 p-3 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Next discount {pricing.nextStepPct}% off in&nbsp;
                <span className="font-semibold">
                  <ToCountdown ms={pricing.nextStepInMs ?? 0} />
                </span>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-12 text-center text-base font-semibold">
                    {qty}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQty(Math.min(listing.quantityRemaining, qty + 1))}
                    disabled={qty >= listing.quantityRemaining}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available</span>
                <span className="font-medium">
                  {listing.quantityRemaining} / {listing.quantityTotal}
                </span>
              </div>
              {!listing.donationOnly && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">
                    {formatCurrency(totalPrice, listing.currency)}
                  </span>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={onReserve}
              disabled={busy || countdown.expired || listing.quantityRemaining < 1}
            >
              {countdown.expired
                ? "Pickup window closed"
                : busy
                  ? "Reserving…"
                  : listing.donationOnly
                    ? "Claim for pickup"
                    : "Reserve pickup"}
            </Button>

            <div className="space-y-2 text-xs text-muted-foreground">
              {distance !== undefined && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {formatDistance(distance)} from your location
                </div>
              )}
              {listing.provider?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {listing.provider.phone}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Leaf className="h-3.5 w-3.5" />
                Rescuing this saves ~{(qty * 2.5).toFixed(1)} kg CO₂
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function ToCountdown({ ms }: { ms: number }) {
  const c = useCountdown(Date.now() + ms);
  return <>{c.label}</>;
}
