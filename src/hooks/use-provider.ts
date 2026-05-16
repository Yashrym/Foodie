"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useProvider() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const provider = useQuery(
    api.providers.getByOwner,
    user ? { ownerId: user._id } : "skip",
  );
  return {
    user,
    provider: provider ?? null,
    isLoading:
      isLoading || (isAuthenticated && user && provider === undefined),
    isAuthenticated,
  };
}

export function useNgo() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const ngo = useQuery(
    api.ngos.getByOwner,
    user ? { ownerId: user._id } : "skip",
  );
  return {
    user,
    ngo: ngo ?? null,
    isLoading: isLoading || (isAuthenticated && user && ngo === undefined),
    isAuthenticated,
  };
}
