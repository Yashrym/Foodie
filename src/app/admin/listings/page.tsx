"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function AdminListingsPage() {
  const listings = useQuery(api.listings.listActive, {});
  const remove = useMutation(api.listings.remove);

  if (listings === undefined) return <Skeleton className="h-72" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Active listings</h1>
      <div className="grid gap-3">
        {listings.map((l: any) => (
          <Card key={l._id} className="p-4 flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
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
              <Link
                href={`/marketplace/${l._id}`}
                className="font-medium hover:underline"
              >
                {l.title}
              </Link>
              <div className="text-xs text-muted-foreground">
                {l.provider?.name} • {l.quantityRemaining}/{l.quantityTotal}
              </div>
            </div>
            <Badge
              variant={
                l.urgency === "critical"
                  ? "danger"
                  : l.urgency === "medium"
                    ? "warning"
                    : "success"
              }
            >
              {l.urgency}
            </Badge>
            <div className="text-sm font-semibold">
              {l.donationOnly
                ? "Free"
                : formatCurrency(l.currentPrice, l.currency)}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-500"
              onClick={() =>
                remove({ listingId: l._id }).then(() =>
                  toast.success("Removed"),
                )
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
        {listings.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No active listings.
          </Card>
        )}
      </div>
    </div>
  );
}
