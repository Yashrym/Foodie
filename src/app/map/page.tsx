import { SiteShell } from "@/components/layout/site-shell";
import { MapBrowser } from "@/components/map/map-browser";

export const metadata = { title: "Map" };

export default function MapPage() {
  return (
    <SiteShell>
      <section className="container py-6 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Map browsing
          </h1>
          <p className="text-muted-foreground">
            Find surplus food on the map — tap a pin for details.
          </p>
        </div>
        <MapBrowser />
      </section>
    </SiteShell>
  );
}
