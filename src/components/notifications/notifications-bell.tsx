"use client";

import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { timeFromNow } from "@/lib/utils";

export function NotificationsBell() {
  const { user } = useCurrentUser();
  const notifications = useQuery(
    api.notifications.listForUser,
    user ? { userId: user._id, limit: 12 } : "skip",
  );
  const markAllRead = useMutation(api.notifications.markAllRead);

  const unread =
    (notifications as any[] | undefined)?.filter((n) => !n.read).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {user && unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead({ userId: user._id })}
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {(notifications ?? []).length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          )}
          {((notifications as any[] | undefined) ?? []).map((n) => (
            <Link
              key={n._id}
              href={n.href ?? "#"}
              className="block px-3 py-2.5 hover:bg-accent rounded-md mx-1"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full ${n.read ? "bg-muted-foreground/40" : "bg-sky-500"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {n.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {n.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {n.body}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {timeFromNow(n.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
