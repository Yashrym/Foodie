"use client";

import { useQuery } from "convex/react";
import { Leaf, Salad, Wallet } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNgo } from "@/hooks/use-provider";
import { formatCurrency } from "@/lib/utils";

export default function NgoReportsPage() {
  const { ngo, user } = useNgo();
  const reservations = useQuery(
    api.reservations.listByUser,
    user ? { userId: user._id } : "skip",
  );

  if (!ngo) {
    return (
      <Card className="p-10 text-center">
        <h2 className="font-semibold">NGO profile required</h2>
      </Card>
    );
  }
  if (reservations === undefined) {
    return <Skeleton className="h-72 w-full" />;
  }

  const completed = reservations.filter((r: any) => r.status === "picked-up");
  const meals = completed.reduce((acc: number, r: any) => acc + r.quantity, 0);
  const moneyEquiv = completed.reduce(
    (acc: number, r: any) => acc + (r.listing?.originalPrice ?? 0) * r.quantity,
    0,
  );
  const co2 = Math.round(meals * 2.5);

  const byProvider = new Map<string, number>();
  for (const r of completed) {
    const name = (r as any).provider?.name ?? "Unknown";
    byProvider.set(name, (byProvider.get(name) ?? 0) + r.quantity);
  }
  const partners = [...byProvider.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impact report</h1>
        <p className="text-sm text-muted-foreground">
          Total rescue stats for {ngo.name}. Export-ready for partners and
          donors.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<Salad className="h-4 w-4" />} label="Meals rescued" value={meals} />
        <Stat icon={<Leaf className="h-4 w-4" />} label="CO₂ saved (kg)" value={co2} />
        <Stat
          icon={<Wallet className="h-4 w-4" />}
          label="Retail value rescued"
          value={formatCurrency(moneyEquiv)}
        />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Top partner providers</h3>
        {partners.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No completed pickups yet.
          </div>
        )}
        <div className="space-y-2">
          {partners.map(([name, m]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border p-2.5"
            >
              <span className="text-sm font-medium">{name}</span>
              <span className="text-sm text-muted-foreground">
                {m} meals
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="inline-flex p-2 rounded-lg bg-muted text-emerald-500">
        {icon}
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
