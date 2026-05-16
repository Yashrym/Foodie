"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useProvider } from "@/hooks/use-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderSettingsPage() {
  const { provider } = useProvider();
  const update = useMutation(api.providers.update);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptsDonations, setAcceptsDonations] = useState(true);
  const [cuisines, setCuisines] = useState("");
  const [openHours, setOpenHours] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  useEffect(() => {
    if (!provider) return;
    setName(provider.name);
    setDescription(provider.description ?? "");
    setAddress(provider.address);
    setPhone(provider.phone ?? "");
    setAcceptsDonations(provider.acceptsDonations);
    setCuisines(provider.cuisines.join(", "));
    setOpenHours(provider.openHours ?? "");
    setLogoUrl(provider.logoUrl ?? "");
    setCoverUrl(provider.coverUrl ?? "");
  }, [provider]);

  if (!provider) return <Skeleton className="h-72 w-full" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await update({
      providerId: provider._id,
      patch: {
        name,
        description,
        address,
        phone,
        acceptsDonations,
        openHours,
        logoUrl,
        coverUrl,
        cuisines: cuisines
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    });
    toast.success("Profile updated");
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Business name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Open hours</Label>
            <Input
              value={openHours}
              onChange={(e) => setOpenHours(e.target.value)}
              placeholder="8am – 9pm"
            />
          </div>
          <div className="space-y-2">
            <Label>Cuisines</Label>
            <Input
              value={cuisines}
              onChange={(e) => setCuisines(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Cover URL</Label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
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
      <div className="flex justify-end">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}
