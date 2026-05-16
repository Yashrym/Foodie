import { SiteShell } from "@/components/layout/site-shell";
import { MyReservations } from "@/components/reservations/my-reservations";

export const metadata = { title: "My reservations" };

export default function ReservationsPage() {
  return (
    <SiteShell>
      <section className="container py-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            My reservations
          </h1>
          <p className="text-muted-foreground">
            Track pickups, scan codes and review providers.
          </p>
        </div>
        <MyReservations />
      </section>
    </SiteShell>
  );
}
