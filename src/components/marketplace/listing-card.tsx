"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, MapPin, Sparkles, Tag, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDistance } from "@/lib/utils";
import { URGENCY_STYLES, type Urgency } from "@/lib/constants";
import { useCountdown } from "@/hooks/use-countdown";

export interface ListingCardData {
  _id: string;
  title: string;
  description: string;
  imageUrls: string[];
  category: string;
  dietaryTags: string[];
  quantityRemaining: number;
  quantityTotal: number;
  originalPrice: number;
  currentPrice: number;
  currency: string;
  pickupEnd: number;
  donationOnly: boolean;
  urgency: Urgency;
  createdAt: number;
  distanceM?: number;
  provider?: {
    name: string;
    logoUrl?: string;
    type?: string;
    address?: string;
  } | null;
}

const JUST_ADDED_MS = 1000 * 60 * 10;

export function ListingCard({
  listing,
  highlight,
}: {
  listing: ListingCardData;
  highlight?: boolean;
}) {
  const discountPct = Math.max(
    0,
    Math.round(
      ((listing.originalPrice - listing.currentPrice) /
        Math.max(1, listing.originalPrice)) *
        100,
    ),
  );
  const countdown = useCountdown(listing.pickupEnd);
  const urgencyStyle = URGENCY_STYLES[listing.urgency];
  const isNew = Date.now() - listing.createdAt < JUST_ADDED_MS;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
    >
      <Card
        className={cn(
          "group overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all",
          highlight && "ring-2 ring-sky-300/60 shadow-glow",
        )}
      >
        <Link
          href={`/marketplace/${listing._id}`}
          className="block relative aspect-[4/3] overflow-hidden bg-muted"
        >
          {listing.imageUrls?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrls[0]}
              alt={listing.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <Tag className="h-8 w-8" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {listing.donationOnly ? (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Donation
              </Badge>
            ) : discountPct > 0 ? (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
                -{discountPct}%
              </Badge>
            ) : null}
            {isNew && (
              <Badge className="bg-sky-500 hover:bg-sky-600 text-white animate-pulse-ring">
                <Sparkles className="h-3 w-3" /> Just added
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur",
                urgencyStyle.bg,
                urgencyStyle.text,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", urgencyStyle.dot)} />
              {urgencyStyle.label}
            </span>
          </div>
        </Link>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold leading-tight truncate">
                {listing.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {listing.provider?.name ?? "Local provider"}
                {listing.distanceM !== undefined && (
                  <>
                    <span className="mx-1">•</span>
                    {formatDistance(listing.distanceM)}
                  </>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              {listing.donationOnly ? (
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
                  Free
                </div>
              ) : (
                <>
                  <div className="font-bold text-base">
                    {formatCurrency(listing.currentPrice, listing.currency)}
                  </div>
                  {discountPct > 0 && (
                    <div className="text-[11px] text-muted-foreground line-through">
                      {formatCurrency(listing.originalPrice, listing.currency)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>

          <div className="flex flex-wrap gap-1">
            {listing.dietaryTags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
            <Badge variant="outline" className="text-[10px]">
              {listing.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {countdown.expired ? "Closed" : countdown.label}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {listing.quantityRemaining}/{listing.quantityTotal}
            </span>
          </div>

          <Button asChild className="w-full" size="sm">
            <Link href={`/marketplace/${listing._id}`}>
              {listing.donationOnly ? "Claim for pickup" : "Reserve"}
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-9 w-full" />
      </div>
    </Card>
  );
}
