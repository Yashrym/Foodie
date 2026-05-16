"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Urgency } from "@/lib/constants";

// Fix default marker icons in next/webpack
const defaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
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
  process.env.NEXT_PUBLIC_OSM_ATTRIBUTION ??
  "© OpenStreetMap contributors";

function FlyTo({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [lat, lng, zoom, map]);
  return null;
}

export function ListingMapInner({
  center,
  marker,
}: {
  center: { lat: number; lng: number };
  marker?: { lat: number; lng: number; label?: string };
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      {marker && (
        <Marker position={[marker.lat, marker.lng]}>
          {marker.label && <Popup>{marker.label}</Popup>}
        </Marker>
      )}
    </MapContainer>
  );
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
  const selected = listings.find((l) => l._id === selectedId);
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
      {selected && (
        <FlyTo
          lat={selected.location.lat}
          lng={selected.location.lng}
          zoom={15}
        />
      )}
      {listings.map((l) => {
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
        return (
          <Marker
            key={l._id}
            position={[l.location.lat, l.location.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelect?.(l._id),
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">{l.title}</div>
                <div className="text-xs opacity-80">
                  {l.provider?.name ?? "Local provider"}
                </div>
                <div className="text-sm font-bold">
                  {l.donationOnly
                    ? "Donation"
                    : formatCurrency(l.currentPrice, l.currency)}
                </div>
                <Link
                  href={`/marketplace/${l._id}`}
                  className="text-xs text-sky-600 underline"
                >
                  View details
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
