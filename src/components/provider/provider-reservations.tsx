"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Check, CircleCheck, ScanLine, X } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProvider } from "@/hooks/use-provider";
import { formatCurrency, timeFromNow } from "@/lib/utils";

export function ProviderReservations() {
  const { provider, user } = useProvider();
  const reservations = useQuery(
    api.reservations.listByProvider,
    provider ? { providerId: provider._id } : "skip",
  );
  const confirm = useMutation(api.reservations.confirm);
  const cancel = useMutation(api.reservations.cancel);
  const markPickedUp = useMutation(api.reservations.markPickedUp);

  const [code, setCode] = useState("");

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !user) return;
    try {
      await markPickedUp({
        pickupCode: code.trim().toUpperCase(),
        confirmedBy: user._id,
      });
      toast.success("Pickup confirmed!");
      setCode("");
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid code");
    }
  };

  if (!provider) {
    return (
      <Card className="p-10 text-center">
        <h2 className="font-semibold">Provider profile required</h2>
      </Card>
    );
  }
  if (reservations === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const buckets = {
    pending: reservations.filter((r: any) => r.status === "pending"),
    confirmed: reservations.filter((r: any) => r.status === "confirmed"),
    pickedUp: reservations.filter((r: any) => r.status === "picked-up"),
    cancelled: reservations.filter(
      (r: any) => r.status === "cancelled" || r.status === "expired",
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="text-sm text-muted-foreground">
          Confirm pickups, verify codes and keep your operations smooth.
        </p>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500 text-white">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold leading-tight">Verify pickup code</div>
            <div className="text-xs text-muted-foreground">
              Type or scan the consumer's pickup code to mark as collected.
            </div>
          </div>
        </div>
        <form onSubmit={submitCode} className="ml-auto flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="FD-ABCDE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono uppercase tracking-widest"
          />
          <Button type="submit" variant="eco">
            <CircleCheck className="h-4 w-4" /> Confirm
          </Button>
        </form>
      </Card>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({buckets.pending.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({buckets.confirmed.length})
          </TabsTrigger>
          <TabsTrigger value="pickedUp">
            Completed ({buckets.pickedUp.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({buckets.cancelled.length})
          </TabsTrigger>
        </TabsList>
        {(["pending", "confirmed", "pickedUp", "cancelled"] as const).map(
          (key) => (
            <TabsContent key={key} value={key}>
              <div className="grid gap-3">
                {buckets[key].length === 0 && (
                  <Card className="p-8 text-center text-muted-foreground text-sm">
                    Nothing here.
                  </Card>
                )}
                {buckets[key].map((r: any) => (
                  <Card key={r._id} className="p-4 flex flex-wrap items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                      {r.listing?.imageUrls?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.listing.imageUrls[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {r.listing?.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.user?.name ?? r.user?.email} • Qty {r.quantity} •{" "}
                        {timeFromNow(r.createdAt)}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono tracking-widest">
                      {r.pickupCode}
                    </Badge>
                    <div className="text-sm font-semibold">
                      {r.isDonation
                        ? "Donation"
                        : formatCurrency(r.totalPrice, r.listing?.currency)}
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            confirm({ reservationId: r._id }).then(() =>
                              toast.success("Reservation confirmed"),
                            )
                          }
                        >
                          <Check className="h-4 w-4" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-500"
                          onClick={() =>
                            cancel({
                              reservationId: r._id,
                              cancelledBy: "provider",
                            }).then(() =>
                              toast.success("Reservation rejected"),
                            )
                          }
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                    {r.status === "confirmed" && user && (
                      <Button
                        size="sm"
                        variant="eco"
                        onClick={() =>
                          markPickedUp({
                            pickupCode: r.pickupCode,
                            confirmedBy: user._id,
                          }).then(() => toast.success("Pickup completed"))
                        }
                      >
                        <CircleCheck className="h-4 w-4" /> Mark picked up
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}
