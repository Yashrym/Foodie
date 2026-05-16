"use client";

import {
  BarChart3,
  Calendar,
  HandHeart,
  LayoutDashboard,
  Salad,
  Settings,
  Upload,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const NAV = [
  { href: "/provider/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/provider/listings", label: "Listings", icon: Salad },
  { href: "/provider/listings/new", label: "Upload (AI)", icon: Upload },
  { href: "/provider/reservations", label: "Reservations", icon: Calendar },
  { href: "/provider/donations", label: "Donations", icon: HandHeart },
  { href: "/provider/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/provider/settings", label: "Settings", icon: Settings },
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      title="Provider"
      description="Manage surplus, reservations & impact"
      navLinks={NAV}
      allowedRoles={["provider", "admin"]}
    >
      {children}
    </DashboardShell>
  );
}
