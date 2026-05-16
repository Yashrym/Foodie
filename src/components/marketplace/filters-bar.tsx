"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DIETARY_TAGS,
  FOOD_CATEGORIES,
  type DietaryTag,
  type FoodCategory,
} from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export interface MarketplaceFilters {
  search: string;
  category: FoodCategory | "all";
  dietary: DietaryTag[];
  radiusKm: number;
  donationOnly: boolean;
  sort: "distance" | "discount" | "urgency" | "new";
}

export const DEFAULT_FILTERS: MarketplaceFilters = {
  search: "",
  category: "all",
  dietary: [],
  radiusKm: 10,
  donationOnly: false,
  sort: "distance",
};

export function FiltersBar({
  value,
  onChange,
}: {
  value: MarketplaceFilters;
  onChange: (next: MarketplaceFilters) => void;
}) {
  const update = (patch: Partial<MarketplaceFilters>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search restaurants, dishes, ingredients…"
            value={value.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9 bg-background/80"
          />
          {value.search && (
            <button
              onClick={() => update({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select
          value={value.category}
          onValueChange={(v) => update({ category: v as any })}
        >
          <SelectTrigger className="md:w-[180px] bg-background/80">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {FOOD_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.sort}
          onValueChange={(v) => update({ sort: v as any })}
        >
          <SelectTrigger className="md:w-[180px] bg-background/80">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Nearest first</SelectItem>
            <SelectItem value="discount">Biggest discount</SelectItem>
            <SelectItem value="urgency">Most urgent</SelectItem>
            <SelectItem value="new">Just added</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={value.donationOnly ? "eco" : "outline"}
          onClick={() => update({ donationOnly: !value.donationOnly })}
        >
          {value.donationOnly ? "Showing donations" : "Donation only"}
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {DIETARY_TAGS.map((tag) => {
            const active = value.dietary.includes(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  update({
                    dietary: active
                      ? value.dietary.filter((d) => d !== tag)
                      : [...value.dietary, tag],
                  })
                }
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="md:ml-auto flex items-center gap-3 min-w-[220px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Within
          </span>
          <Slider
            value={[value.radiusKm]}
            onValueChange={([v]) => update({ radiusKm: v })}
            min={1}
            max={25}
            step={1}
            className="flex-1"
          />
          <Badge variant="secondary" className="shrink-0">
            {value.radiusKm} km
          </Badge>
        </div>
      </div>
    </div>
  );
}
