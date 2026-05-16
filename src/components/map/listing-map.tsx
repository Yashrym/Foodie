"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const ListingMap = dynamic(
  () => import("./listing-map-inner").then((m) => m.ListingMapInner),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
  },
);

export const MarketplaceMap = dynamic(
  () => import("./listing-map-inner").then((m) => m.MarketplaceMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
  },
);
