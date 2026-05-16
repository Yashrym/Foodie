"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import type { ComponentType } from "react";

export interface DashboardNavLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export function DashboardShell({
  title,
  description,
  navLinks,
  children,
  allowedRoles,
}: {
  title: string;
  description?: string;
  navLinks: DashboardNavLink[];
  children: React.ReactNode;
  allowedRoles?: ("provider" | "ngo" | "admin")[];
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  const denied =
    status === "authenticated" &&
    allowedRoles &&
    role &&
    !allowedRoles.includes(role as any);

  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient dark:bg-dark-hero">
      <Navbar />
      <div className="container py-8 grid gap-6 md:grid-cols-[240px_1fr] flex-1">
        <aside className="md:sticky md:top-20 self-start">
          <div className="rounded-2xl border bg-card/60 backdrop-blur p-3">
            <div className="px-2 py-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {title}
              </div>
              {description && (
                <div className="text-xs text-muted-foreground/80 mt-0.5">
                  {description}
                </div>
              )}
            </div>
            <nav className="mt-2 space-y-1">
              {navLinks.map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent",
                    )}
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="space-y-6 min-w-0">
          {denied ? (
            <div className="rounded-2xl border bg-card p-10 text-center">
              <h2 className="font-semibold text-lg">Restricted area</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your account doesn't have access to this dashboard. Switch
                roles from your profile or sign in with the correct account.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
