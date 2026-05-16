import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            Foodie helps restaurants, cafes, bakeries and grocers rescue
            surplus food and feed nearby communities and NGOs.
          </p>
        </div>
        <FooterCol
          title="Marketplace"
          links={[
            { label: "Discover food", href: "/marketplace" },
            { label: "Map view", href: "/map" },
            { label: "Sustainability impact", href: "/sustainability" },
          ]}
        />
        <FooterCol
          title="For partners"
          links={[
            { label: "Become a provider", href: "/onboarding?role=provider" },
            { label: "Register an NGO", href: "/onboarding?role=ngo" },
            { label: "Provider dashboard", href: "/provider/dashboard" },
          ]}
        />
        <FooterCol
          title="Foodie"
          links={[
            { label: "Sign in", href: "/login" },
            { label: "Profile", href: "/profile" },
            { label: "Admin", href: "/admin" },
          ]}
        />
      </div>
      <div className="border-t border-border/60 py-6">
        <div className="container text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Foodie. Less waste. More plates.</span>
          <span>
            Map data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              className="underline"
            >
              OpenStreetMap
            </a>{" "}
            contributors
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
