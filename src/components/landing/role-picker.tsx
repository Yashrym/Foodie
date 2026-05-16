"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, HandHeart, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ROLES = [
  {
    id: "consumer",
    title: "I want to buy or rescue food",
    description:
      "Discover discounted meals, pastries and groceries near you — and reduce waste while you eat.",
    icon: ShoppingBag,
    cta: "Browse the marketplace",
    href: "/marketplace",
    accent: "from-sky-300 to-sky-500",
  },
  {
    id: "provider",
    title: "I run a restaurant, cafe or shop",
    description:
      "Turn surplus into revenue, support your community and let our AI price each batch automatically.",
    icon: Building2,
    cta: "List my surplus food",
    href: "/onboarding?role=provider",
    accent: "from-emerald-300 to-emerald-500",
  },
  {
    id: "ngo",
    title: "I represent an NGO or charity",
    description:
      "Receive realtime alerts on donation-ready food and coordinate pickups for the communities you serve.",
    icon: HandHeart,
    cta: "Join as an NGO",
    href: "/onboarding?role=ngo",
    accent: "from-rose-300 to-rose-500",
  },
];

export function RolePicker() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {ROLES.map((r, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 * i, duration: 0.4 }}
        >
          <Card className="h-full p-6 glass hover:shadow-glow transition-all group">
            <div
              className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${r.accent} text-white shadow-glow`}
            >
              <r.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {r.description}
            </p>
            <Button asChild className="mt-6 w-full" variant="glass">
              <Link href={r.href}>{r.cta}</Link>
            </Button>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
