export const APP_NAME = "Foodie";
export const APP_TAGLINE = "Rescue surplus food. Feed your city.";

export const ROLES = ["consumer", "provider", "ngo", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PROVIDER_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "grocery",
  "hotel",
] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const FOOD_CATEGORIES = [
  "meals",
  "sandwiches",
  "bakery",
  "desserts",
  "drinks",
  "produce",
  "dairy",
  "snacks",
  "other",
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "gluten-free",
  "dairy-free",
  "nut-free",
] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const LISTING_STATUSES = [
  "active",
  "reserved",
  "sold-out",
  "expired",
  "donated",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const URGENCY_LEVELS = ["low", "medium", "critical"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "picked-up",
  "cancelled",
  "expired",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "nearby-deal",
  "flash-discount",
  "reservation-update",
  "pickup-reminder",
  "donation-request",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const URGENCY_STYLES: Record<
  Urgency,
  { label: string; bg: string; text: string; dot: string }
> = {
  low: {
    label: "Fresh",
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Pickup soon",
    bg: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  critical: {
    label: "Critical",
    bg: "bg-rose-100 dark:bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export const DEFAULT_CENTER = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? 6.9271),
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? 79.8612),
};
