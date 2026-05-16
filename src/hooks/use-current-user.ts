"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Bridge NextAuth session → Convex user.
 * Upserts the auth user on first call so the rest of the app can
 * use a stable Convex `Id<"users">`.
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();
  const upsert = useMutation(api.users.upsertFromAuth);

  const email = session?.user?.email ?? null;
  const dbUser = useQuery(
    api.users.getByEmail,
    email ? { email } : "skip",
  );

  useEffect(() => {
    if (status !== "authenticated" || !email) return;
    if (dbUser === undefined) return; // still loading
    if (dbUser) return; // already exists
    upsert({
      email,
      name: session?.user?.name ?? email,
      image: session?.user?.image ?? undefined,
      role: (session?.user?.role as any) ?? "consumer",
    }).catch(() => undefined);
  }, [status, email, dbUser, session, upsert]);

  return {
    session,
    user: dbUser ?? null,
    isLoading: status === "loading" || (status === "authenticated" && dbUser === undefined),
    isAuthenticated: status === "authenticated",
  };
}
