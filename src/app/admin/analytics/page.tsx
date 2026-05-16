"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const global = useQuery(api.analytics.global, {});
  if (global === undefined) return <Skeleton className="h-48" />;
  const t = global.totals;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform analytics</h1>
        <p className="text-sm text-muted-foreground">
          Lifetime totals across all providers and consumers.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Listings created" value={t.listingsCreated} />
        <Stat label="Sold portions" value={t.listingsSold} />
        <Stat label="Donated portions" value={t.listingsDonated} />
        <Stat label="Revenue" value={formatCurrency(t.revenue)} />
        <Stat label="Meals saved" value={Math.round(t.mealsSaved)} />
        <Stat label="CO₂ saved (kg)" value={Math.round(t.co2SavedKg)} />
        <Stat
          label="Consumer savings"
          value={formatCurrency(t.moneySavedConsumers)}
        />
        <Stat label="Tracked days" value={global.days} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </Card>
  );
}
