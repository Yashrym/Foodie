"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { toast } from "sonner";
import { HandHeart } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useProvider } from "@/hooks/use-provider";
import { formatCurrency } from "@/lib/utils";

export default function ProviderDonationsPage() {
  const { provider } = useProvider();
  const listings = useQuery(
    api.listings.listByProvider,
    provider ? { providerId: provider._id } : "skip",
  );
  const markDonation = useMutation(api.listings.markDonation);

  if (!provider) {
    return (
      <Card className="p-10 text-center">
        <h2 className="font-semibold">Set up your provider profile first</h2>
      </Card>
    );
  }
  if (listings === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white">
          <HandHeart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Donations</h1>
          <p className="text-sm text-muted-foreground">
            Flag large batches for NGO pickup. Verified NGOs in your area will be notified.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {(listings as any[])
          .filter((l: any) => l.status === "active")
          .map((l: any) => (
            <Card
              key={l._id}
              className="p-4 flex flex-wrap items-center gap-4"
            >
              <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden">
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
                  {l.quantityRemaining} portions • {l.donationOnly ? "Donation only" : formatCurrency(l.currentPrice)}
                </div>
              </div>
              <Badge variant={l.donationReady ? "success" : "outline"}>
                {l.donationReady ? "Available for NGOs" : "Not flagged"}
              </Badge>
              <Switch
                checked={l.donationReady}
                onCheckedChange={(v) =>
                  markDonation({ listingId: l._id, donationReady: v }).then(
                    () =>
                      toast.success(
                        v ? "Available for NGOs" : "Removed from donation queue",
                      ),
                  )
                }
              />
            </Card>
          ))}
        {(listings as any[]).filter((l: any) => l.status === "active").length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            You have no active listings to donate yet.
            <div className="mt-3">
              <Button asChild>
                <Link href="/provider/listings/new">Create a listing</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
