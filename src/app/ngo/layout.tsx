"use client";

import { BarChart3, HandHeart, LayoutDashboard, Map } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const NAV = [
  { href: "/ngo/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/ngo/donations", label: "Donation queue", icon: HandHeart },
  { href: "/ngo/pickups", label: "My pickups", icon: Map },
  { href: "/ngo/reports", label: "Impact reports", icon: BarChart3 },
];

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      title="NGO"
      description="Coordinate rescues and impact"
      navLinks={NAV}
      allowedRoles={["ngo", "admin"]}
    >
      {children}
    </DashboardShell>
  );
}
