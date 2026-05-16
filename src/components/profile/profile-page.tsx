"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Heart, Leaf, Salad, Sparkles, Wallet } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { DIETARY_TAGS } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

export function ProfilePage() {
  const { user, session, isLoading, isAuthenticated } = useCurrentUser();
  const sustainability = useQuery(
    api.analytics.mySustainability,
    user ? { userId: user._id } : "skip",
  );
  const reservations = useQuery(
    api.reservations.listByUser,
    user ? { userId: user._id } : "skip",
  );
  const update = useMutation(api.users.updateProfile);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [radius, setRadius] = useState(5);
  const [dietary, setDietary] = useState<string[]>([]);
  const [prefs, setPrefs] = useState({
    nearbyDeals: true,
    flashDiscounts: true,
    pickupReminders: true,
    donationRequests: false,
  });

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
    setRadius(user.preferences?.radiusKm ?? 5);
    setDietary(user.preferences?.dietary ?? []);
    setPrefs(
      user.preferences?.notifications ?? {
        nearbyDeals: true,
        flashDiscounts: true,
        pickupReminders: true,
        donationRequests: false,
      },
    );
  }, [user]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (!isAuthenticated || !user) {
    return (
      <Card className="p-10 text-center space-y-3">
        <h1 className="font-semibold text-lg">Sign in to view your profile</h1>
        <Button asChild>
          <Link href="/login?callbackUrl=/profile">Sign in</Link>
        </Button>
      </Card>
    );
  }

  const onSave = async () => {
    await update({
      userId: user._id,
      name,
      phone,
      preferences: {
        dietary,
        radiusKm: radius,
        notifications: prefs,
      },
    });
    toast.success("Profile saved");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <Avatar className="h-16 w-16">
          {session?.user?.image && <AvatarImage src={session.user.image} />}
          <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <Badge className="mt-2" variant="secondary">
            {user.role}
          </Badge>
        </div>
      </Card>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Personal info</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Dietary preferences</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_TAGS.map((t) => {
                  const active = dietary.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() =>
                        setDietary(
                          active
                            ? dietary.filter((d) => d !== t)
                            : [...dietary, t],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Search radius</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[radius]}
                  onValueChange={([v]) => setRadius(v)}
                  min={1}
                  max={25}
                  step={1}
                />
                <Badge variant="secondary" className="shrink-0">
                  {radius} km
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Notifications</h3>
            {(
              [
                ["nearbyDeals", "Nearby deal alerts"],
                ["flashDiscounts", "Flash discount alerts"],
                ["pickupReminders", "Pickup reminders"],
                ["donationRequests", "NGO donation requests"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="cursor-pointer">{label}</Label>
                <Switch
                  checked={prefs[key as keyof typeof prefs]}
                  onCheckedChange={(v) =>
                    setPrefs({ ...prefs, [key]: v } as typeof prefs)
                  }
                />
              </div>
            ))}
          </Card>

          <div className="flex justify-end">
            <Button onClick={onSave}>Save preferences</Button>
          </div>
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <ImpactStat
              icon={<Salad className="h-4 w-4" />}
              label="Meals rescued"
              value={sustainability?.mealsRescued ?? 0}
            />
            <ImpactStat
              icon={<Leaf className="h-4 w-4" />}
              label="CO₂ saved (kg)"
              value={Math.round(sustainability?.co2SavedKg ?? 0)}
            />
            <ImpactStat
              icon={<Wallet className="h-4 w-4" />}
              label="Money saved"
              value={formatCurrency(sustainability?.moneySaved ?? 0)}
            />
            <ImpactStat
              icon={<Sparkles className="h-4 w-4" />}
              label="Day streak"
              value={sustainability?.streakDays ?? 0}
            />
          </div>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              Every meal rescued saves roughly 2.5 kg of CO₂ from being
              released as your food avoids landfill. Keep going!
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <FavoritesGrid favs={user.favoriteProviderIds ?? []} />
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Past reservations</h3>
            <div className="space-y-2">
              {(reservations ?? [])
                .filter(
                  (r: any) =>
                    r.status === "picked-up" || r.status === "cancelled",
                )
                .slice(0, 20)
                .map((r: any) => (
                  <div
                    key={r._id}
                    className="flex items-center gap-3 rounded-lg border p-2.5"
                  >
                    <div className="h-10 w-10 rounded-md bg-muted overflow-hidden">
                      {r.listing?.imageUrls?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.listing.imageUrls[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.listing?.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.provider?.name} • {r.quantity} portion(s)
                      </div>
                    </div>
                    <Badge
                      variant={
                        r.status === "picked-up" ? "success" : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FavoritesGrid({ favs }: { favs: any[] }) {
  if (favs.length === 0)
    return (
      <Card className="p-10 text-center text-muted-foreground text-sm">
        <Heart className="h-6 w-6 mx-auto mb-2 text-rose-500" />
        Tap the heart on a provider's page to save them for quick access.
      </Card>
    );
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {favs.map((id) => (
        <FavoriteRow key={String(id)} id={id} />
      ))}
    </div>
  );
}

function FavoriteRow({ id }: { id: any }) {
  const provider = useQuery(api.providers.getById, { providerId: id });
  if (!provider) return <Skeleton className="h-16" />;
  return (
    <Card className="p-3 flex items-center gap-3">
      {provider.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={provider.logoUrl}
          alt=""
          className="h-12 w-12 rounded-md object-cover"
        />
      ) : (
        <div className="h-12 w-12 rounded-md bg-sky-100 dark:bg-sky-500/10 grid place-items-center text-sky-600 font-bold">
          {provider.name.slice(0, 1)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{provider.name}</div>
        <div className="text-xs text-muted-foreground">
          {provider.type} • {provider.address}
        </div>
      </div>
    </Card>
  );
}

function ImpactStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="inline-flex p-2 rounded-lg bg-muted text-emerald-500">
        {icon}
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
