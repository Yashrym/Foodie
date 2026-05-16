"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Leaf, Salad, Wallet, Users } from "lucide-react";

export function ImpactStats() {
  const data = useQuery(api.analytics.global, {});
  const totals = data?.totals;

  const items = [
    {
      label: "Meals rescued",
      value: totals?.mealsSaved ?? 0,
      icon: Salad,
      hue: "text-eco-500",
    },
    {
      label: "CO₂ saved (kg)",
      value: Math.round(totals?.co2SavedKg ?? 0),
      icon: Leaf,
      hue: "text-emerald-500",
    },
    {
      label: "Saved by consumers",
      value: Math.round(totals?.moneySavedConsumers ?? 0),
      icon: Wallet,
      hue: "text-sky-500",
    },
    {
      label: "Listings created",
      value: totals?.listingsCreated ?? 0,
      icon: Users,
      hue: "text-violet-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((s) => (
        <Card key={s.label} className="p-5 glass">
          <div className={`inline-flex p-2 rounded-lg bg-background ${s.hue}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div className="mt-3 text-2xl font-bold">
            {s.value.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
        </Card>
      ))}
    </div>
  );
}
