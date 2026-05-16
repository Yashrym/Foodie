"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

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

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/marketplace";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"consumer" | "provider" | "ngo">("consumer");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    const res = await signIn("credentials", {
      email,
      name: name || email.split("@")[0],
      role,
      redirect: false,
    });
    setSubmitting(false);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Welcome to Foodie, ${name || email.split("@")[0]}!`);
    router.push(callbackUrl);
    router.refresh();
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
