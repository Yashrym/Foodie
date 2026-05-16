import { Suspense } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Get started" };

export default function OnboardingPage() {
  return (
    <SiteShell>
      <section className="container py-10 max-w-3xl">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Join Foodie
          </h1>
          <p className="text-muted-foreground">
            Pick how you'd like to use the platform and we'll set up your
            profile in seconds.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <OnboardingForm />
        </Suspense>
      </section>
    </SiteShell>
  );
}
