"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, Phone } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, timeFromNow } from "@/lib/utils";

export function ReservationDetail({
  reservationId,
}: {
  reservationId: Id<"reservations">;
}) {
  const r = useQuery(api.reservations.getById, { reservationId });
  const cancel = useMutation(api.reservations.cancel);

  if (r === undefined) return <Skeleton className="h-80 w-full rounded-2xl" />;
  if (!r) {
    return (
      <Card className="p-10 text-center">
        <h2 className="font-semibold">Reservation not found</h2>
        <Button asChild className="mt-4">
          <Link href="/reservations">Back to reservations</Link>
        </Button>
      </Card>
    );
  }

  const statusColors: Record<string, "success" | "warning" | "danger" | "default" | "secondary"> = {
    pending: "warning",
    confirmed: "default",
    "picked-up": "success",
    cancelled: "danger",
    expired: "secondary",
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/reservations">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <Card className="p-6 space-y-6 text-center">
        <div className="space-y-2">
          <Badge variant={statusColors[r.status] ?? "secondary"}>{r.status}</Badge>
          <h1 className="text-2xl font-bold">{r.listing?.title}</h1>
          <p className="text-sm text-muted-foreground">
            Show this code to {r.provider?.name} at pickup
          </p>
        </div>

        <div className="grid place-items-center">
          <div className="rounded-2xl bg-white p-4 shadow-md inline-block">
            <QRCodeSVG value={r.qrPayload} size={220} includeMargin={false} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Pickup code
          </div>
          <div className="text-3xl font-bold tracking-[0.3em] mt-1">
            {r.pickupCode}
          </div>
        </div>

        <Separator />

        <div className="text-left space-y-3 text-sm">
          <Row
            icon={<MapPin className="h-4 w-4" />}
            label="Pickup at"
            value={
              <div>
                <div className="font-medium">{r.provider?.name}</div>
                <div className="text-muted-foreground">{r.provider?.address}</div>
              </div>
            }
          />
          {r.provider?.phone && (
            <Row
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={<a href={`tel:${r.provider.phone}`}>{r.provider.phone}</a>}
            />
          )}
          <Row
            icon={<Calendar className="h-4 w-4" />}
            label="Reserved"
            value={timeFromNow(r.createdAt)}
          />
          <Row
            label="Quantity"
            value={`${r.quantity} portion${r.quantity > 1 ? "s" : ""}`}
          />
          <Row
            label="Total"
            value={
              r.isDonation
                ? "Free (donation)"
                : formatCurrency(r.totalPrice, r.listing?.currency)
            }
          />
        </div>

        {(r.status === "pending" || r.status === "confirmed") && (
          <Button
            variant="outline"
            className="w-full text-rose-500 hover:text-rose-600"
            onClick={() =>
              cancel({ reservationId: r._id }).then(() =>
                toast.success("Reservation cancelled"),
              )
            }
          >
            Cancel reservation
          </Button>
        )}
      </Card>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground pt-0.5 flex items-center gap-1.5 min-w-[110px]">
        {icon}
        {label}
      </div>
      <div className="flex-1">{value}</div>
    </div>
  );
}
