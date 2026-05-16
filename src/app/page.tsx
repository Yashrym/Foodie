import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Clock,
  HandHeart,
  Map as MapIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RolePicker } from "@/components/landing/role-picker";
import { ImpactStats } from "@/components/landing/impact-stats";

const features = [
  {
    icon: Brain,
    title: "AI upload assistant",
    body: "Snap a photo and Foodie writes the title, description, urgency level and a fair discount in seconds.",
  },
  {
    icon: Clock,
    title: "Dynamic discount engine",
    body: "Prices drop automatically as pickup time approaches, so nothing goes to waste at the end of the day.",
  },
  {
    icon: ShieldCheck,
    title: "Spoilage prediction",
    body: "Smart urgency tags help providers prioritise what to push out first, based on category and prep time.",
  },
  {
    icon: MapIcon,
    title: "Live marketplace map",
    body: "Browse nearby surplus on an OpenStreetMap-powered map with realtime inventory.",
  },
  {
    icon: HandHeart,
    title: "NGO donation lane",
    body: "Mark batches as donation-ready and let local NGOs claim them with one tap.",
  },
  {
    icon: Sparkles,
    title: "Sustainability dashboard",
    body: "Track meals rescued, CO₂ saved and money saved for every user and provider.",
  },
];

export default function LandingPage() {
  return (
    <SiteShell>
      <section className="container py-12 md:py-20 space-y-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" /> AI-powered
              food rescue
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Rescue surplus food.{" "}
              <span className="bg-gradient-to-br from-sky-400 to-sky-700 bg-clip-text text-transparent">
                Feed your city.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Foodie connects restaurants, cafes, bakeries and grocers with
              nearby consumers and NGOs — turning end-of-day surplus into
              affordable meals and rescued donations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl">
                <Link href="/marketplace">
                  Browse nearby food <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass">
                <Link href="/onboarding?role=provider">
                  I’m a provider
                </Link>
              </Button>
            </div>
            <div className="pt-4">
              <ImpactStats />
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-[2rem] glass-strong overflow-hidden shadow-glow relative">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"
                alt="Hero"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sky-900/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 space-y-3">
                <Card className="glass-strong p-3 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500 text-white text-xs font-bold">
                    -65%
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">Sourdough loaves</div>
                    <div className="text-muted-foreground text-xs">
                      Sunrise Bakery • 0.4 km
                    </div>
                  </div>
                  <Badge className="ml-auto bg-amber-500">Pickup 1h</Badge>
                </Card>
                <Card className="glass-strong p-3 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white text-xs font-bold">
                    Free
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">30 sandwich donation</div>
                    <div className="text-muted-foreground text-xs">
                      Blue Lagoon Cafe • For NGO pickup
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              Pick how you'd like to use Foodie
            </h2>
            <p className="text-muted-foreground">
              Buyers, sellers and NGOs each get a tailored experience.
            </p>
          </div>
          <RolePicker />
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              Built for less waste, more plates
            </h2>
            <p className="text-muted-foreground">
              A modern stack with realtime Convex backend, OpenAI-powered AI
              flows and OpenStreetMap mapping.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="p-6 glass hover:shadow-md transition-shadow">
                <div className="inline-flex p-2.5 rounded-xl bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
