"use client";

import {
  BarChart3,
  Building2,
  HandHeart,
  LayoutDashboard,
  Salad,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/providers", label: "Providers", icon: Building2 },
  { href: "/admin/ngos", label: "NGOs", icon: HandHeart },
  { href: "/admin/listings", label: "Listings", icon: Salad },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      title="Admin"
      description="Platform moderation & analytics"
      navLinks={NAV}
      allowedRoles={["admin"]}
    >
      {children}
    </DashboardShell>
  );
}
