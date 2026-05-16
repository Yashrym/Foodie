import { SiteShell } from "@/components/layout/site-shell";
import { ListingDetail } from "@/components/marketplace/listing-detail";
import { Id } from "@convex/_generated/dataModel";

export const metadata = { title: "Listing" };

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SiteShell>
      <ListingDetail listingId={id as Id<"foodListings">} />
    </SiteShell>
  );
}
