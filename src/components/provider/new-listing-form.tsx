"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  Camera,
  HandHeart,
  ImagePlus,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { api } from "@convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DIETARY_TAGS,
  FOOD_CATEGORIES,
  URGENCY_STYLES,
  type Urgency,
} from "@/lib/constants";
import { useProvider } from "@/hooks/use-provider";
import { cn, formatCurrency } from "@/lib/utils";
import { priceAfterDiscount } from "@/lib/ai/pricing";

interface AnalysisResult {
  category: string;
  title: string;
  description: string;
  ingredients: string[];
  dietaryTags: string[];
  suggestedDiscountPct: number;
  suggestedPickupHours: number;
  urgency: Urgency;
  confidence: number;
  rationale: string;
  model: string;
}

export function NewListingForm() {
  const router = useRouter();
  const { provider, user } = useProvider();
  const createListing = useMutation(api.listings.create);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [foodName, setFoodName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [createdMinutesAgo, setCreatedMinutesAgo] = useState(60);
  const [quantity, setQuantity] = useState(10);
  const [originalPrice, setOriginalPrice] = useState(500);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("meals");
  const [dietary, setDietary] = useState<string[]>([]);
  const [donationOnly, setDonationOnly] = useState(false);
  const [pickupHours, setPickupHours] = useState(3);
  const [discountPct, setDiscountPct] = useState(40);
  const [urgency, setUrgency] = useState<Urgency>("medium");

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImageDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const resp = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl,
          imageUrl: imageDataUrl ? undefined : imageUrl || undefined,
          foodName,
          ingredients,
          quantity,
          originalPrice,
          createdMinutesAgo,
        }),
      });
      if (!resp.ok) {
        throw new Error("AI analysis failed");
      }
      const json = await resp.json();
      const a: AnalysisResult = json.analysis;
      setAnalysis(a);
      setTitle(a.title);
      setDescription(a.description);
      setCategory(a.category);
      setDietary(a.dietaryTags);
      setDiscountPct(a.suggestedDiscountPct);
      setPickupHours(Math.max(0.5, a.suggestedPickupHours));
      setUrgency(a.urgency);
      toast.success("AI analysis ready — review and tweak before publishing.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not analyze");
    } finally {
      setAnalyzing(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !user) {
      toast.error("Sign in as a provider first");
      return;
    }
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    setSubmitting(true);
    try {
      const now = Date.now();
      const pickupStart = now;
      const pickupEnd = now + pickupHours * 60 * 60 * 1000;
      const currentPrice = donationOnly
        ? 0
        : priceAfterDiscount(originalPrice, discountPct);
      await createListing({
        providerId: provider._id,
        createdBy: user._id,
        title,
        description,
        imageUrls: imageDataUrl
          ? [imageDataUrl]
          : imageUrl
            ? [imageUrl]
            : [],
        category,
        ingredients: ingredients
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean),
        dietaryTags: dietary,
        quantityTotal: quantity,
        originalPrice,
        currentPrice,
        currency: "LKR",
        pickupStart,
        pickupEnd,
        preparedAt: now - createdMinutesAgo * 60 * 1000,
        location: provider.location,
        donationOnly,
        aiAnalysis: analysis
          ? {
              suggestedDiscountPct: analysis.suggestedDiscountPct,
              suggestedPickupHours: analysis.suggestedPickupHours,
              urgency: analysis.urgency,
              confidence: analysis.confidence,
              rationale: analysis.rationale,
              model: analysis.model,
              generatedAt: Date.now(),
            }
          : undefined,
      });
      toast.success("Listing published!");
      router.push("/provider/listings");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not publish");
    } finally {
      setSubmitting(false);
    }
  };

  const currentPrice = donationOnly
    ? 0
    : priceAfterDiscount(originalPrice, discountPct);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            AI-assisted upload
          </h1>
          <p className="text-sm text-muted-foreground">
            Snap a photo or paste a URL, fill in a few details, and let Foodie
            draft the rest.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="p-5 space-y-5">
          <div>
            <Label>Photo of the food</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="cursor-pointer aspect-video rounded-xl border-2 border-dashed flex items-center justify-center text-sm text-muted-foreground hover:bg-accent overflow-hidden relative">
                {imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageDataUrl}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="h-5 w-5 mb-1" />
                    Upload photo
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickFile(f);
                  }}
                />
              </label>
              <div className="aspect-video rounded-xl border p-3 space-y-2">
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <ImagePlus className="h-3.5 w-3.5" /> or paste image URL
                </div>
                <Input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="h-9"
                />
                {imageUrl && !imageDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="h-16 w-full object-cover rounded-md"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Food name</Label>
              <Input
                placeholder="e.g. 20 cheese sandwiches from lunch buffet"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Ingredients</Label>
              <Textarea
                placeholder="bread, cheese, tomato, basil..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prepared (mins ago)</Label>
              <Input
                type="number"
                min={0}
                value={createdMinutesAgo}
                onChange={(e) =>
                  setCreatedMinutesAgo(Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Original price (per portion)</Label>
              <Input
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                disabled
                value={provider?.address ?? "Provider address"}
              />
            </div>
          </div>

          <Separator />

          <Button
            type="button"
            onClick={runAnalysis}
            disabled={analyzing}
            variant="eco"
            className="w-full"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {analyzing ? "Analyzing…" : "Generate with AI"}
          </Button>
        </Card>

        <Card className="p-5 space-y-5">
          {analysis && (
            <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 p-3 text-sm border border-sky-200/60 dark:border-sky-500/30">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">AI suggestion</span>
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {Math.round(analysis.confidence * 100)}% confident
                </Badge>
              </div>
              <p className="text-sky-900 dark:text-sky-100 mt-1.5">
                {analysis.rationale}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brunch boxes – chicken pesto"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell consumers what's left and how fresh it is."
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (fresh)</SelectItem>
                  <SelectItem value="medium">Medium (pickup soon)</SelectItem>
                  <SelectItem value="critical">Critical (within 1h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dietary tags</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => {
                const active = dietary.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setDietary(
                        active
                          ? dietary.filter((d) => d !== tag)
                          : [...dietary, tag],
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <HandHeart className="h-4 w-4 text-emerald-500" />
              <Label htmlFor="donation" className="cursor-pointer flex-1">
                Donation only (NGOs can claim for free)
              </Label>
              <Switch
                id="donation"
                checked={donationOnly}
                onCheckedChange={setDonationOnly}
              />
            </div>
            {!donationOnly && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Discount</span>
                    <Badge variant="secondary">{discountPct}% off</Badge>
                  </div>
                  <Slider
                    min={0}
                    max={90}
                    step={5}
                    value={[discountPct]}
                    onValueChange={([v]) => setDiscountPct(v)}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Original {formatCurrency(originalPrice)}</span>
                    <span className="text-foreground font-semibold">
                      {formatCurrency(currentPrice)} now
                    </span>
                  </div>
                </div>
              </>
            )}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Pickup window</span>
                <Badge variant="secondary">{pickupHours.toFixed(1)} h</Badge>
              </div>
              <Slider
                min={0.5}
                max={8}
                step={0.5}
                value={[pickupHours]}
                onValueChange={([v]) => setPickupHours(v)}
              />
              <div className="flex items-center justify-between text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold",
                    URGENCY_STYLES[urgency].bg,
                    URGENCY_STYLES[urgency].text,
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      URGENCY_STYLES[urgency].dot,
                    )}
                  />
                  {URGENCY_STYLES[urgency].label}
                </span>
                <span className="text-muted-foreground">
                  Closes at{" "}
                  {new Date(Date.now() + pickupHours * 3600 * 1000).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Publishing…" : "Publish listing"}
          </Button>
        </Card>
      </div>
    </form>
  );
}
