import { SiteShell } from "@/components/layout/site-shell";
import { ReservationDetail } from "@/components/reservations/reservation-detail";
import type { Id } from "@convex/_generated/dataModel";

export const metadata = { title: "Reservation" };

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SiteShell>
      <section className="container py-8 max-w-2xl">
        <ReservationDetail reservationId={id as Id<"reservations">} />
      </section>
    </SiteShell>
  );
}
