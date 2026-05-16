"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

import { formatCurrency } from "@/lib/utils";
import type { Urgency } from "@/lib/constants";

// Fix default marker icons in next/webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const TILE_URL =
  process.env.NEXT_PUBLIC_OSM_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  process.env.NEXT_PUBLIC_OSM_ATTRIBUTION ?? "© OpenStreetMap contributors";

/** Clear Leaflet's internal id so React strict-mode remounts don't throw. */
function resetLeafletContainer(el: HTMLElement) {
  const anyEl = el as HTMLElement & { _leaflet_id?: number };
  if (anyEl._leaflet_id != null) {
    delete anyEl._leaflet_id;
  }
}

export function ListingMapInner({
  center,
  marker,
}: {
  center: { lat: number; lng: number };
  marker?: { lat: number; lng: number; label?: string };
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    resetLeafletContainer(el);

    const map = L.map(el, {
      center: [center.lat, center.lng],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION }).addTo(map);

    let popupMarker: L.Marker | undefined;
    if (marker) {
      popupMarker = L.marker([marker.lat, marker.lng]).addTo(map);
      if (marker.label) {
        popupMarker.bindPopup(marker.label);
      }
    }

    return () => {
      popupMarker?.remove();
      map.remove();
      resetLeafletContainer(el);
    };
  }, [center.lat, center.lng, marker?.lat, marker?.lng, marker?.label]);

  return <div ref={containerRef} className="h-full w-full z-0" />;
}

export interface MapListing {
  _id: string;
  title: string;
  currency: string;
  currentPrice: number;
  originalPrice: number;
  urgency: Urgency;
  donationOnly: boolean;
  location: { lat: number; lng: number };
  provider?: { name: string } | null;
}

export function MarketplaceMap({
  center,
  listings,
  selectedId,
  onSelect,
}: {
  center: { lat: number; lng: number };
  listings: MapListing[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    resetLeafletContainer(el);

    const map = L.map(el, {
      center: [center.lat, center.lng],
      zoom: 13,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION }).addTo(map);

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      resetLeafletContainer(el);
    };
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    listings.forEach((l) => {
      const color =
        l.urgency === "critical"
          ? "#e11d48"
          : l.urgency === "medium"
            ? "#f59e0b"
            : "#0ea5e9";
      const html = `<div style="
          background:${color};
          width:28px;height:28px;border-radius:9999px;
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-weight:700;font-size:11px;
          box-shadow:0 6px 16px ${color}55;
          border:2px solid #fff;
        ">${l.donationOnly ? "♥" : "•"}</div>`;
      const icon = L.divIcon({
        html,
        className: "foodie-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([l.location.lat, l.location.lng], { icon }).addTo(
        map,
      );
      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif">
          <div style="font-weight:600">${l.title}</div>
          <div style="font-size:12px;opacity:0.8">${l.provider?.name ?? "Local provider"}</div>
          <div style="font-size:14px;font-weight:700;margin-top:4px">
            ${l.donationOnly ? "Donation" : formatCurrency(l.currentPrice, l.currency)}
          </div>
          <a href="/marketplace/${l._id}" style="font-size:12px;color:#0284c7">View details</a>
        </div>
      `);
      marker.on("click", () => onSelect?.(l._id));
      markersRef.current.push(marker);
    });
  }, [listings, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const selected = listings.find((l) => l._id === selectedId);
    if (!selected) return;
    map.flyTo([selected.location.lat, selected.location.lng], 15, {
      duration: 0.8,
    });
  }, [selectedId, listings]);

  return <div ref={containerRef} className="h-full w-full z-0" />;
}
