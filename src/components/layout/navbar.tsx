"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShoppingBag,
  Sparkles,
  User as UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/map", label: "Map", icon: Map },
  { href: "/sustainability", label: "Impact", icon: Sparkles },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-foreground",
                  pathname.startsWith(href) && "bg-accent text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {status === "authenticated" ? (
            <>
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1 hover:bg-accent transition-colors">
                    <Avatar className="h-8 w-8">
                      {session?.user?.image ? (
                        <AvatarImage src={session.user.image} />
                      ) : null}
                      <AvatarFallback>
                        {(session?.user?.name ?? session?.user?.email ?? "U")
                          .slice(0, 1)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {session?.user?.name ?? "Account"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="text-sm font-medium">
                      {session?.user?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session?.user?.email}
                    </div>
                    <div className="mt-1 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {role ?? "consumer"}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/reservations">
                      <ShoppingBag className="h-4 w-4" /> My reservations
                    </Link>
                  </DropdownMenuItem>
                  {role === "provider" && (
                    <DropdownMenuItem asChild>
                      <Link href="/provider/dashboard">
                        <LayoutDashboard className="h-4 w-4" /> Provider dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {role === "ngo" && (
                    <DropdownMenuItem asChild>
                      <Link href="/ngo/dashboard">
                        <LayoutDashboard className="h-4 w-4" /> NGO dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <LayoutDashboard className="h-4 w-4" /> Admin panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/onboarding">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
