"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useProvider } from "@/hooks/use-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export function ProviderAnalytics() {
  const { provider } = useProvider();
  const data = useQuery(
    api.analytics.byProvider,
    provider ? { providerId: provider._id, days: 30 } : "skip",
  );

  if (!provider) {
    return (
      <Card className="p-10 text-center">
        <h2 className="font-semibold">Set up your provider profile first</h2>
      </Card>
    );
  }
  if (data === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const totals = (data as any[]).reduce(
    (acc: any, d: any) => {
      acc.created += d.listingsCreated;
      acc.sold += d.listingsSold;
      acc.donated += d.listingsDonated;
      acc.revenue += d.revenue;
      acc.meals += d.mealsSaved;
      acc.co2 += d.co2SavedKg;
      acc.savedForConsumers += d.moneySavedConsumers;
      return acc;
    },
    {
      created: 0,
      sold: 0,
      donated: 0,
      revenue: 0,
      meals: 0,
      co2: 0,
      savedForConsumers: 0,
    },
  );

  const maxRevenue = Math.max(1, ...(data as any[]).map((d: any) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Last 30 days of activity for {provider.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Listings created" value={totals.created} />
        <Stat label="Sold portions" value={totals.sold} />
        <Stat label="Donated portions" value={totals.donated} />
        <Stat label="Revenue" value={formatCurrency(totals.revenue)} />
        <Stat label="Meals saved" value={Math.round(totals.meals)} />
        <Stat label="CO₂ saved (kg)" value={Math.round(totals.co2)} />
        <Stat
          label="Consumer savings"
          value={formatCurrency(totals.savedForConsumers)}
        />
        <Stat
          label="Avg revenue / day"
          value={formatCurrency(totals.revenue / Math.max(1, data.length))}
        />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Daily revenue</h3>
        {data.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center">
            No data for the last 30 days yet.
          </div>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {(data as any[]).map((d: any) => (
              <div
                key={d._id}
                className="flex-1 flex flex-col items-center justify-end gap-1"
                title={`${d.dateKey} • ${formatCurrency(d.revenue)}`}
              >
                <div
                  className="w-full rounded-md bg-gradient-to-t from-sky-300 to-sky-500"
                  style={{
                    height: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%`,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {d.dateKey.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
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
