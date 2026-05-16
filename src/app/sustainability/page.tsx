"use client";

import { useQuery } from "convex/react";
import { Leaf, Salad, Sparkles, Trophy, Wallet } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SiteShell } from "@/components/layout/site-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatCurrency } from "@/lib/utils";

export default function SustainabilityPage() {
  const global = useQuery(api.analytics.global, {});
  const leaderboard = useQuery(api.analytics.leaderboard, { limit: 10 });
  const { user } = useCurrentUser();
  const mine = useQuery(
    api.analytics.mySustainability,
    user ? { userId: user._id } : "skip",
  );

  return (
    <SiteShell>
      <section className="container py-10 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Our collective impact
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Every meal you rescue keeps food out of landfill, lowers CO₂
            emissions and feeds someone in your community.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat
            icon={<Salad className="h-5 w-5" />}
            label="Meals rescued"
            value={global?.totals.mealsSaved ?? "—"}
            accent="text-eco-500"
          />
          <Stat
            icon={<Leaf className="h-5 w-5" />}
            label="CO₂ saved (kg)"
            value={Math.round(global?.totals.co2SavedKg ?? 0)}
            accent="text-emerald-500"
          />
          <Stat
            icon={<Wallet className="h-5 w-5" />}
            label="Saved by consumers"
            value={formatCurrency(global?.totals.moneySavedConsumers ?? 0)}
            accent="text-sky-500"
          />
          <Stat
            icon={<Sparkles className="h-5 w-5" />}
            label="Listings created"
            value={global?.totals.listingsCreated ?? "—"}
            accent="text-violet-500"
          />
        </div>

        {user && mine && (
          <Card className="p-6 glass-strong">
            <h2 className="font-semibold mb-3">Your impact</h2>
            <div className="grid sm:grid-cols-4 gap-4 text-sm">
              <Inline label="Meals" value={mine.mealsRescued} />
              <Inline label="CO₂ (kg)" value={Math.round(mine.co2SavedKg)} />
              <Inline label="Saved" value={formatCurrency(mine.moneySaved)} />
              <Inline label="Streak" value={`${mine.streakDays} days`} />
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Top rescuers leaderboard</h2>
          </div>
          {!leaderboard && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          )}
          {leaderboard?.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              The board is empty — be the first to rescue some food!
            </div>
          )}
          <div className="space-y-2">
            {leaderboard?.map((l: any, idx: number) => (
              <div
                key={l._id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Badge
                  variant={idx < 3 ? "default" : "secondary"}
                  className="w-10 justify-center"
                >
                  #{idx + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {l.user?.name ?? "Anonymous rescuer"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(l.co2SavedKg)} kg CO₂ saved
                  </div>
                </div>
                <div className="font-semibold text-eco-500">
                  {l.mealsRescued} meals
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </SiteShell>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card className="p-5 glass">
      <div className={`inline-flex p-2 rounded-lg bg-background ${accent ?? ""}`}>
        {icon}
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

function Inline({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
