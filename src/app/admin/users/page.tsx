"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES } from "@/lib/constants";

export default function AdminUsersPage() {
  const users = useQuery(api.users.listAll, {});
  const setRole = useMutation(api.users.setRole);
  const [q, setQ] = useState("");

  if (users === undefined) return <Skeleton className="h-72" />;
  const list = users as any[];
  const filtered = list.filter(
    (u: any) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <Input
          placeholder="Search by name or email"
          className="max-w-xs"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs uppercase tracking-wider text-muted-foreground border-b">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2 text-right">Joined</div>
        </div>
        {filtered.map((u: any) => (
          <div
            key={u._id}
            className="grid grid-cols-12 gap-3 px-4 py-3 items-center border-b last:border-0 hover:bg-accent/30"
          >
            <div className="col-span-4 font-medium">{u.name}</div>
            <div className="col-span-4 text-sm text-muted-foreground truncate">
              {u.email}
            </div>
            <div className="col-span-2">
              <Select
                value={u.role}
                onValueChange={(v) =>
                  setRole({ userId: u._id, role: v as any }).then(() =>
                    toast.success("Role updated"),
                  )
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 text-right text-xs text-muted-foreground">
              {new Date(u.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No matching users.
          </div>
        )}
      </Card>
    </div>
  );
}
