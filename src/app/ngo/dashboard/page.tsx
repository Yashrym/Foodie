"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { HandHeart, Leaf, Salad, Wallet } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNgo } from "@/hooks/use-provider";
import { formatCurrency } from "@/lib/utils";

export default function NgoDashboardPage() {
  const { ngo, user } = useNgo();
  const donations = useQuery(api.listings.listDonationReady, {});
  const myReservations = useQuery(
    api.reservations.listByUser,
    user ? { userId: user._id } : "skip",
  );

  if (!ngo) {
    return (
      <Card className="p-10 text-center space-y-3">
        <h2 className="text-xl font-semibold">No NGO profile yet</h2>
        <p className="text-muted-foreground text-sm">
          Register your organisation to start rescuing surplus food.
        </p>
        <Button asChild>
          <Link href="/onboarding?role=ngo">Register NGO</Link>
        </Button>
      </Card>
    );
  }

  const meals = ngo.rescuedMeals;
  const co2 = Math.round(meals * 2.5);
  const moneyEquiv = formatCurrency(meals * 350);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {ngo.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {donations?.length ?? "—"} donations available right now.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          icon={<Salad className="h-4 w-4" />}
          label="Meals rescued"
          value={meals}
        />
        <Stat
          icon={<Leaf className="h-4 w-4" />}
          label="CO₂ saved (kg)"
          value={co2}
        />
        <Stat
          icon={<Wallet className="h-4 w-4" />}
          label="Value rescued"
          value={moneyEquiv}
        />
        <Stat
          icon={<HandHeart className="h-4 w-4" />}
          label="Active pickups"
          value={
            myReservations?.filter(
              (r: any) => r.status === "pending" || r.status === "confirmed",
            ).length ?? 0
          }
        />
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Latest donation-ready food</h3>
          <Button asChild variant="ghost" size="sm">
            <Link href="/ngo/donations">View all</Link>
          </Button>
        </div>
        {!donations &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        {donations?.slice(0, 5).map((d: any) => (
          <Card
            key={d._id}
            className="p-3 flex items-center gap-3 border-emerald-200/60 dark:border-emerald-500/30"
          >
            <div className="h-12 w-12 rounded-md bg-muted overflow-hidden shrink-0">
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
              <div className="font-medium truncate">{d.title}</div>
              <div className="text-xs text-muted-foreground">
                {d.provider?.name} • {d.quantityRemaining} portions
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/marketplace/${d._id}`}>Claim</Link>
            </Button>
          </Card>
        ))}
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
