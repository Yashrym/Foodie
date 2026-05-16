"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  HandHeart,
  Salad,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProvider } from "@/hooks/use-provider";
import { formatCurrency } from "@/lib/utils";

export function ProviderOverview() {
  const { provider, isLoading } = useProvider();

  const listings = useQuery(
    api.listings.listByProvider,
    provider ? { providerId: provider._id } : "skip",
  );
  const reservations = useQuery(
    api.reservations.listByProvider,
    provider ? { providerId: provider._id } : "skip",
  );
  const analytics = useQuery(
    api.analytics.byProvider,
    provider ? { providerId: provider._id, days: 30 } : "skip",
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }
  if (!provider) {
    return (
      <Card className="p-10 text-center space-y-3">
        <h2 className="text-xl font-semibold">No provider profile yet</h2>
        <p className="text-muted-foreground text-sm">
          Set one up in seconds — Foodie's AI will help with every listing.
        </p>
        <Button asChild>
          <Link href="/onboarding?role=provider">Create provider profile</Link>
        </Button>
      </Card>
    );
  }

  const activeListings =
    (listings as any[] | undefined)?.filter((l: any) => l.status === "active")
      .length ?? 0;
  const pendingReservations =
    (reservations as any[] | undefined)?.filter(
      (r: any) => r.status === "pending",
    ).length ?? 0;
  const totals = ((analytics as any[] | undefined) ?? []).reduce(
    (acc: any, a: any) => {
      acc.revenue += a.revenue;
      acc.mealsSaved += a.mealsSaved;
      acc.co2 += a.co2SavedKg;
      return acc;
    },
    { revenue: 0, mealsSaved: 0, co2: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {provider.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your surplus today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/provider/listings/new">
              <Sparkles className="h-4 w-4" /> AI upload
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Active listings"
          value={activeListings}
          icon={<Salad className="h-4 w-4" />}
          hint={`${listings?.length ?? 0} total`}
        />
        <StatCard
          label="Pending pickups"
          value={pendingReservations}
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="Awaiting confirmation"
          accent="text-amber-500"
        />
        <StatCard
          label="Revenue (30d)"
          value={formatCurrency(totals.revenue)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="text-eco-500"
        />
        <StatCard
          label="Meals rescued"
          value={Math.round(totals.mealsSaved)}
          icon={<HandHeart className="h-4 w-4" />}
          hint={`${Math.round(totals.co2)} kg CO₂ saved`}
          accent="text-sky-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent listings</h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/provider/listings">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            {((listings as any[] | undefined) ?? []).slice(0, 5).map((l: any) => (
              <div
                key={l._id}
                className="flex items-center gap-3 rounded-lg border p-2.5"
              >
                <div className="h-10 w-10 rounded-md bg-muted overflow-hidden">
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
                  <div className="text-sm font-medium truncate">
                    {l.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {l.quantityRemaining}/{l.quantityTotal} left •{" "}
                    {l.donationOnly
                      ? "Donation"
                      : formatCurrency(l.currentPrice, l.currency)}
                  </div>
                </div>
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
              </div>
            ))}
            {((listings as any[] | undefined) ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                You haven't listed anything yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Latest reservations</h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/provider/reservations">
                Manage <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            {((reservations as any[] | undefined) ?? [])
              .slice(0, 5)
              .map((r: any) => (
              <div
                key={r._id}
                className="flex items-center gap-3 rounded-lg border p-2.5"
              >
                <div className="grid h-10 w-10 place-items-center rounded-md bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-bold">
                  {r.pickupCode.split("-")[1]?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {r.listing?.title ?? "Reserved item"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.quantity} × {r.user?.name ?? "Consumer"}
                  </div>
                </div>
                <Badge
                  variant={
                    r.status === "picked-up"
                      ? "success"
                      : r.status === "pending"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {r.status}
                </Badge>
              </div>
            ))}
            {((reservations as any[] | undefined) ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No reservations yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className={`inline-flex p-2 rounded-lg bg-muted ${accent ?? ""}`}>
        {icon}
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {hint && (
        <div className="text-[11px] text-muted-foreground/80 mt-0.5">
          {hint}
        </div>
      )}
    </Card>
  );
}
