"use client";

import { MyReservations } from "@/components/reservations/my-reservations";

export default function NgoPickupsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My pickups</h1>
        <p className="text-sm text-muted-foreground">
          Donation claims your team has scheduled.
        </p>
      </div>
      <MyReservations />
    </div>
  );
}
