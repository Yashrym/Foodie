"use client";

import { useQuery } from "convex/react";
import {
  Building2,
  HandHeart,
  Leaf,
  Salad,
  TrendingUp,
  Users,
} from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function AdminOverviewPage() {
  const users = useQuery(api.users.listAll, {});
  const providers = useQuery(api.providers.list, {});
  const ngos = useQuery(api.ngos.list, {});
  const global = useQuery(api.analytics.global, {});

  if (
    users === undefined ||
    providers === undefined ||
    ngos === undefined ||
    global === undefined
  ) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform overview</h1>
        <p className="text-sm text-muted-foreground">
          Realtime snapshot of users, providers, NGOs, and rescue activity.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<Users className="h-4 w-4" />} label="Users" value={users.length} />
        <Stat
          icon={<Building2 className="h-4 w-4" />}
          label="Providers"
          value={providers.length}
        />
        <Stat
          icon={<HandHeart className="h-4 w-4" />}
          label="NGOs"
          value={ngos.length}
        />
        <Stat
          icon={<Salad className="h-4 w-4" />}
          label="Listings created"
          value={global.totals.listingsCreated}
        />
        <Stat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Revenue"
          value={formatCurrency(global.totals.revenue)}
        />
        <Stat
          icon={<Leaf className="h-4 w-4" />}
          label="CO₂ saved (kg)"
          value={Math.round(global.totals.co2SavedKg)}
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Role distribution</h3>
          <RoleDist users={users} />
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Latest providers</h3>
          <div className="space-y-2">
            {providers.slice(-6).reverse().map((p: any) => (
              <div
                key={p._id}
                className="flex items-center gap-3 rounded-lg border p-2.5"
              >
                <div className="h-10 w-10 rounded-md bg-sky-100 dark:bg-sky-500/10 grid place-items-center text-sky-600 font-bold">
                  {p.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.type} • {p.address}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
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
      <div className="inline-flex p-2 rounded-lg bg-muted text-sky-500">
        {icon}
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

function RoleDist({ users }: { users: any[] }) {
  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});
  const total = users.length || 1;
  return (
    <div className="space-y-2">
      {Object.entries(counts).map(([role, c]) => (
        <div key={role} className="text-sm">
          <div className="flex justify-between">
            <span className="capitalize">{role}</span>
            <span className="text-muted-foreground">{c}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary mt-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-sky-600"
              style={{ width: `${(c / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
