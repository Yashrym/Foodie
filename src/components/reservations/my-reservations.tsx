"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Calendar, MapPin, QrCode, X } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatCurrency, timeFromNow } from "@/lib/utils";

const STATUS_STYLE: Record<
  string,
  { variant: "success" | "warning" | "danger" | "secondary" | "outline" | "default"; label: string }
> = {
  pending: { variant: "warning", label: "Pending" },
  confirmed: { variant: "default", label: "Confirmed" },
  "picked-up": { variant: "success", label: "Picked up" },
  cancelled: { variant: "danger", label: "Cancelled" },
  expired: { variant: "secondary", label: "Expired" },
};

export function MyReservations() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const reservations = useQuery(
    api.reservations.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const cancel = useMutation(api.reservations.cancel);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!isAuthenticated || !user) {
    return (
      <Card className="p-10 text-center space-y-3">
        <h2 className="font-semibold">Sign in to view your reservations</h2>
        <Button asChild>
          <Link href="/login?callbackUrl=/reservations">Sign in</Link>
        </Button>
      </Card>
    );
  }
  if (reservations === undefined) return <Skeleton className="h-48 w-full" />;

  const list = reservations as any[];
  const active = list.filter(
    (r: any) => r.status === "pending" || r.status === "confirmed",
  );
  const history = list.filter(
    (r: any) =>
      r.status === "picked-up" ||
      r.status === "cancelled" ||
      r.status === "expired",
  );

  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
        <TabsTrigger value="history">History ({history.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        {active.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">
            No active reservations.
            <div className="mt-3">
              <Button asChild variant="outline">
                <Link href="/marketplace">Browse marketplace</Link>
              </Button>
            </div>
          </Card>
        )}
        <div className="grid gap-3">
          {active.map((r: any) => (
            <ReservationRow
              key={r._id}
              r={r}
              onCancel={(id) =>
                cancel({ reservationId: id }).then(() =>
                  toast.success("Reservation cancelled"),
                )
              }
            />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="history">
        <div className="grid gap-3">
          {history.map((r: any) => (
            <ReservationRow key={r._id} r={r} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ReservationRow({
  r,
  onCancel,
}: {
  r: any;
  onCancel?: (id: any) => void;
}) {
  const style = STATUS_STYLE[r.status] ?? { variant: "secondary", label: r.status };
  return (
    <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0">
        {r.listing?.imageUrls?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.listing.imageUrls[0]}
            alt={r.listing.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold truncate">
            {r.listing?.title ?? "Listing"}
          </span>
          <Badge variant={style.variant}>{style.label}</Badge>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap mt-0.5">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {r.provider?.name}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {timeFromNow(r.createdAt)}
          </span>
          <span>Qty {r.quantity}</span>
          <span className="font-medium text-foreground">
            {r.isDonation
              ? "Free"
              : formatCurrency(r.totalPrice, r.listing?.currency)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/reservations/${r._id}`}>
            <QrCode className="h-4 w-4" /> Pickup code
          </Link>
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(r._id)}
            className="text-rose-500 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}
