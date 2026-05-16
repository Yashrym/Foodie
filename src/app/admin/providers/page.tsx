"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProvidersPage() {
  const providers = useQuery(api.providers.list, {});
  if (providers === undefined) return <Skeleton className="h-72" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Providers</h1>
      <div className="grid sm:grid-cols-2 gap-3">
        {providers.map((p: any) => (
          <Card key={p._id} className="p-4 flex items-center gap-3">
            {p.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.logoUrl}
                alt=""
                className="h-12 w-12 rounded-md object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-sky-100 dark:bg-sky-500/10 grid place-items-center text-sky-600 font-bold">
                {p.name.slice(0, 1)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {p.type} • {p.address}
              </div>
            </div>
            <Badge variant={p.verified ? "success" : "outline"}>
              {p.verified ? "Verified" : "Pending"}
            </Badge>
          </Card>
        ))}
        {providers.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground text-sm sm:col-span-2">
            No providers yet.
          </Card>
        )}
      </div>
    </div>
  );
}
