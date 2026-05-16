"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminNgosPage() {
  const ngos = useQuery(api.ngos.list, {});
  if (ngos === undefined) return <Skeleton className="h-72" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">NGOs</h1>
      <div className="grid sm:grid-cols-2 gap-3">
        {ngos.map((n: any) => (
          <Card key={n._id} className="p-4 flex items-center gap-3">
            {n.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.logoUrl}
                alt=""
                className="h-12 w-12 rounded-md object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-emerald-100 dark:bg-emerald-500/10 grid place-items-center text-emerald-600 font-bold">
                {n.name.slice(0, 1)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{n.name}</div>
              <div className="text-xs text-muted-foreground">
                {n.address} • {n.rescuedMeals} meals rescued
              </div>
            </div>
            <Badge variant={n.verified ? "success" : "outline"}>
              {n.verified ? "Verified" : "Pending"}
            </Badge>
          </Card>
        ))}
        {ngos.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground text-sm sm:col-span-2">
            No NGOs yet.
          </Card>
        )}
      </div>
    </div>
  );
}
