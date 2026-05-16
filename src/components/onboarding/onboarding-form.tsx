"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { Building2, HandHeart, ShoppingBag } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CENTER,
  PROVIDER_TYPES,
  type Role,
} from "@/lib/constants";

const roleOptions: {
  id: Role;
  title: string;
  description: string;
  icon: any;
  accent: string;
}[] = [
  {
    id: "consumer",
    title: "Consumer",
    description: "Discover, reserve and rescue food near you.",
    icon: ShoppingBag,
    accent: "from-sky-300 to-sky-500",
  },
  {
    id: "provider",
    title: "Food provider",
    description: "Restaurant, cafe, bakery, grocery or hotel.",
    icon: Building2,
    accent: "from-emerald-300 to-emerald-500",
  },
  {
    id: "ngo",
    title: "NGO / Charity",
    description: "Coordinate donations & rescue meals for communities.",
    icon: HandHeart,
    accent: "from-rose-300 to-rose-500",
  },
];

export function OnboardingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();
  const upsertUser = useMutation(api.users.upsertFromAuth);
  const createProvider = useMutation(api.providers.create);
  const createNgo = useMutation(api.ngos.create);

  const initialRole = (params.get("role") as Role) ?? "consumer";
  const [role, setRoleLocal] = useState<Role>(initialRole);

  // Common fields
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [name, setName] = useState(session?.user?.name ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Provider fields
  const [orgName, setOrgName] = useState("");
  const [type, setType] = useState<(typeof PROVIDER_TYPES)[number]>("restaurant");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [cuisines, setCuisines] = useState("");
  const [dietaryTags, setDietaryTags] = useState("vegetarian");
  const [acceptsDonations, setAcceptsDonations] = useState(true);

  // NGO fields
  const [serviceAreas, setServiceAreas] = useState("");
  const [causes, setCauses] = useState("homeless, elderly");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalisedEmail = email.trim().toLowerCase();
    if (!normalisedEmail) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitting(true);
    try {
      const displayName = name.trim() || normalisedEmail.split("@")[0];

      // 1. Sign in (or stay signed in) via the credentials demo provider.
      if (status !== "authenticated") {
        const res = await signIn("credentials", {
          email: normalisedEmail,
          name: displayName,
          role,
          redirect: false,
        });
        if (res?.error) throw new Error(res.error);
      }

      // 2. Upsert the Convex user directly so we get a stable userId
      //    without depending on React state to update mid-submit.
      const userId = await upsertUser({
        email: normalisedEmail,
        name: displayName,
        role,
      });

      if (role === "provider") {
        if (!orgName.trim()) throw new Error("Business name is required");
        if (!address.trim()) throw new Error("Address is required");
        await createProvider({
          ownerId: userId,
          name: orgName,
          type,
          description,
          address,
          phone,
          cuisines: cuisines
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          dietaryTags: dietaryTags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          acceptsDonations,
          location: DEFAULT_CENTER,
        });
        toast.success("Provider profile created!");
        router.push("/provider/dashboard");
      } else if (role === "ngo") {
        if (!orgName.trim()) throw new Error("Organisation name is required");
        if (!address.trim()) throw new Error("Address is required");
        await createNgo({
          ownerId: userId,
          name: orgName,
          description,
          address,
          phone,
          location: DEFAULT_CENTER,
          serviceAreas: serviceAreas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          causes: causes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
        toast.success("NGO profile created!");
        router.push("/ngo/dashboard");
      } else {
        toast.success("Welcome to Foodie!");
        router.push("/marketplace");
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not complete onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-3">
        {roleOptions.map((r) => {
          const active = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleLocal(r.id)}
              className={cn(
                "text-left rounded-2xl border p-4 transition-all",
                active
                  ? "border-primary shadow-glow bg-accent/40"
                  : "border-border hover:border-primary/50 hover:bg-accent/20",
              )}
            >
              <div
                className={cn(
                  "inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white",
                  r.accent,
                )}
              >
                <r.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-semibold">{r.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {r.description}
              </div>
              {active && (
                <Badge className="mt-3" variant="success">
                  Selected
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      <Card className="p-6 space-y-5">
        <h2 className="font-semibold">Your account</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={status === "authenticated"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>
        </div>
      </Card>

      {role === "provider" && (
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold">About your business</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Business name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Blue Lagoon Cafe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell consumers about your food, vibe and values."
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cuisines (comma-separated)</Label>
              <Input
                value={cuisines}
                onChange={(e) => setCuisines(e.target.value)}
                placeholder="brunch, cafe, bakery"
              />
            </div>
            <div className="space-y-2">
              <Label>Dietary tags (comma-separated)</Label>
              <Input
                value={dietaryTags}
                onChange={(e) => setDietaryTags(e.target.value)}
                placeholder="vegetarian, vegan, halal"
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                checked={acceptsDonations}
                onCheckedChange={setAcceptsDonations}
                id="donations"
              />
              <Label htmlFor="donations" className="cursor-pointer">
                Accept donation pickups from NGOs
              </Label>
            </div>
          </div>
        </Card>
      )}

      {role === "ngo" && (
        <Card className="p-6 space-y-5">
          <h2 className="font-semibold">About your NGO</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organisation name</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Leo Club Colombo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 ..."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Mission</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Who you serve and how."
              />
            </div>
            <div className="space-y-2">
              <Label>Headquarters address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Service areas (comma-separated)</Label>
              <Input
                value={serviceAreas}
                onChange={(e) => setServiceAreas(e.target.value)}
                placeholder="Colombo 03, Colombo 07"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Causes (comma-separated)</Label>
              <Input
                value={causes}
                onChange={(e) => setCauses(e.target.value)}
                placeholder="homeless, elderly, schools"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/marketplace")}
        >
          Skip for now
        </Button>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting
            ? "Creating account…"
            : role === "consumer"
              ? "Start exploring"
              : `Create ${role} profile`}
        </Button>
      </div>
    </form>
  );
}

