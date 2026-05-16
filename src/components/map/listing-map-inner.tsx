"use client";

// This module is rendered ONLY on the client (see `listing-map.tsx` which
// imports it via `next/dynamic({ ssr: false })`). We drive Leaflet directly
// instead of going through react-leaflet to side-step the well-known
// "Map container is already initialized" bug that fires under React 19
// Strict Mode / HMR with react-leaflet 4.x.

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";

import { formatCurrency } from "@/lib/utils";
import type { Urgency } from "@/lib/constants";

// Default Leaflet marker icons need explicit URLs because Webpack doesn't
// resolve the relative ones from inside the leaflet package.
const DEFAULT_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DEFAULT_ICON;

const TILE_URL =
  process.env.NEXT_PUBLIC_OSM_TILE_URL ??
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  process.env.NEXT_PUBLIC_OSM_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Initialize a Leaflet map exactly once on the given container and tear it
 * down cleanly on unmount. Returns the map instance via the ref so callers
 * can mutate it from sibling effects (add markers, fly to, etc.).
 */
function useLeafletMap(opts: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  center: { lat: number; lng: number };
  zoom: number;
  scrollWheelZoom?: boolean;
}) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = opts.containerRef.current;
    if (!el) return;

    // Strict Mode in dev mounts the effect twice. If the previous mount
    // already initialized Leaflet on this node, tear it down before
    // re-initializing on the second mount.
    if ((el as any)._leaflet_id) {
      try {
        // Find and remove any existing map instance attached to this element
        const existing = (el as any)._leaflet_map as L.Map | undefined;
        existing?.remove();
      } catch {
        // Fall through — we'll force-clear the stamp below.
      }
      delete (el as any)._leaflet_id;
    }

    const map = L.map(el, {
      center: [opts.center.lat, opts.center.lng],
      zoom: opts.zoom,
      scrollWheelZoom: opts.scrollWheelZoom ?? true,
      zoomControl: true,
    });
    (el as any)._leaflet_map = map;

    L.tileLayer(TILE_URL, {
      attribution: ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Leaflet sometimes paints before the container has its final size
    // (e.g. inside a flex layout). Force a recalc on next tick.
    const sizeTimer = setTimeout(() => map.invalidateSize(), 0);

    return () => {
      clearTimeout(sizeTimer);
      try {
        map.remove();
      } catch {
        // ignore
      }
      if (el) {
        delete (el as any)._leaflet_map;
        delete (el as any)._leaflet_id;
      }
      mapRef.current = null;
    };
    // We intentionally only set up the map once — center/zoom changes are
    // applied via separate effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return mapRef;
}

// ---------------------------------------------------------------------------
// Single-pin map for the listing detail page
// ---------------------------------------------------------------------------

export function ListingMapInner({
  center,
  marker,
}: {
  center: { lat: number; lng: number };
  marker?: { lat: number; lng: number; label?: string };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useLeafletMap({
    containerRef,
    center,
    zoom: 14,
    scrollWheelZoom: false,
  });
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], 14, { animate: false });
  }, [center.lat, center.lng, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (marker) {
      const m = L.marker([marker.lat, marker.lng]).addTo(map);
      if (marker.label) m.bindPopup(marker.label);
      markerRef.current = m;
    }
  }, [marker?.lat, marker?.lng, marker?.label, mapRef, marker]);

  return <div ref={containerRef} className="h-full w-full" />;
}

// ---------------------------------------------------------------------------
// Multi-pin marketplace map
// ---------------------------------------------------------------------------

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

function urgencyColor(u: Urgency) {
  return u === "critical" ? "#e11d48" : u === "medium" ? "#f59e0b" : "#0ea5e9";
}

function buildMarkerIcon(l: MapListing) {
  const color = urgencyColor(l.urgency);
  const html = `<div style="
    background:${color};
    width:28px;height:28px;border-radius:9999px;
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-weight:700;font-size:11px;
    box-shadow:0 6px 16px ${color}55;
    border:2px solid #fff;
  ">${l.donationOnly ? "&hearts;" : "&bull;"}</div>`;
  return L.divIcon({
    html,
    className: "foodie-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function buildPopupHtml(l: MapListing) {
  const price = l.donationOnly
    ? "Donation"
    : formatCurrency(l.currentPrice, l.currency);
  const provider = l.provider?.name ?? "Local provider";
  // Anchor uses standard navigation so it works inside a Leaflet popup,
  // which renders outside React's tree.
  return `
    <div style="min-width:180px;font-family:inherit;">
      <div style="font-weight:600;font-size:14px;line-height:1.2;">${escapeHtml(l.title)}</div>
      <div style="font-size:12px;opacity:.7;margin-top:2px;">${escapeHtml(provider)}</div>
      <div style="font-weight:700;font-size:14px;margin-top:6px;">${escapeHtml(price)}</div>
      <a href="/marketplace/${encodeURIComponent(l._id)}"
         style="display:inline-block;margin-top:6px;color:#0284c7;font-size:12px;text-decoration:underline;">
        View details
      </a>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  const mapRef = useLeafletMap({
    containerRef,
    center,
    zoom: 13,
    scrollWheelZoom: true,
  });
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Recenter when the geolocation resolves later.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, mapRef]);

  // Build a stable key derived from listing positions so we don't churn
  // markers on every parent re-render.
  const listingsKey = useMemo(
    () =>
      listings
        .map((l) => `${l._id}:${l.location.lat},${l.location.lng}:${l.urgency}`)
        .join("|"),
    [listings],
  );

  // Sync markers when the set of listings changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();

    for (const l of listings) {
      seen.add(l._id);
      const existing = markersRef.current.get(l._id);
      if (existing) {
        existing.setLatLng([l.location.lat, l.location.lng]);
        existing.setIcon(buildMarkerIcon(l));
        existing.setPopupContent(buildPopupHtml(l));
        continue;
      }
      const marker = L.marker([l.location.lat, l.location.lng], {
        icon: buildMarkerIcon(l),
      })
        .addTo(map)
        .bindPopup(buildPopupHtml(l));
      marker.on("click", () => {
        onSelectRef.current?.(l._id);
      });
      markersRef.current.set(l._id, marker);
    }

    // Remove markers that no longer exist
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
    // listingsKey captures the relevant shape of `listings` for memoization.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingsKey, mapRef]);

  // Fly to the currently selected listing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const sel = listings.find((l) => l._id === selectedId);
    if (!sel) return;
    map.flyTo([sel.location.lat, sel.location.lng], 15, { duration: 0.6 });
    const marker = markersRef.current.get(sel._id);
    marker?.openPopup();
  }, [selectedId, listings, mapRef]);

  return <div ref={containerRef} className="h-full w-full min-h-[400px]" />;
}
