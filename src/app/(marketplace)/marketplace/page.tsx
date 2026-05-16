import { SiteShell } from "@/components/layout/site-shell";
import { MarketplaceFeed } from "@/components/marketplace/marketplace-feed";

export const metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <SiteShell>
      <section className="container py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Rescue food near you
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Discover surplus meals, pastries and groceries from nearby
            providers — at a fraction of the price, or free for NGOs.
          </p>
        </div>
        <MarketplaceFeed />
      </section>
    </SiteShell>
  );
}
