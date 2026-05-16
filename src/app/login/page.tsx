"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

type Role = "consumer" | "provider" | "ngo";

const DEFAULT_DESTINATION: Record<Role, string> = {
  consumer: "/marketplace",
  provider: "/provider/dashboard",
  ngo: "/ngo/dashboard",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const explicitCallback = params.get("callbackUrl");

  const upsertUser = useMutation(api.users.upsertFromAuth);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("consumer");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalisedEmail = email.trim().toLowerCase();
    if (!normalisedEmail) return;
    setSubmitting(true);
    try {
      const displayName = name.trim() || normalisedEmail.split("@")[0];

      const res = await signIn("credentials", {
        email: normalisedEmail,
        name: displayName,
        role,
        redirect: false,
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }

      // Sync DB role immediately so the destination page sees the right
      // record on first render (avoids the "No provider profile yet"
      // flash when an existing user picks a new role at login).
      try {
        await upsertUser({
          email: normalisedEmail,
          name: displayName,
          role,
        });
      } catch (e) {
        console.warn("Convex user upsert failed", e);
      }

      toast.success(`Welcome to Foodie, ${displayName}!`);
      const destination = explicitCallback ?? DEFAULT_DESTINATION[role];
      router.push(destination);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-hero-gradient dark:bg-dark-hero p-6">
      <Card className="w-full max-w-md p-8 glass-strong">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold text-center">Welcome back</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Sign in to reserve food, list surplus or rescue donations.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              placeholder="Optional"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>I am a…</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consumer">Consumer</SelectItem>
                <SelectItem value="provider">Food provider</SelectItem>
                <SelectItem value="ngo">NGO / Charity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Continue"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          This demo uses passwordless credentials so reviewers can boot the
          app instantly. Plug your own OAuth providers via{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded">AUTH_*</code> env vars.
        </p>

        <p className="text-sm text-center mt-4">
          New here?{" "}
          <Link href="/onboarding" className="text-primary underline">
            Get started
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center bg-hero-gradient dark:bg-dark-hero p-6">
          <Card className="w-full max-w-md p-8 glass-strong">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Loading…
            </p>
          </Card>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
