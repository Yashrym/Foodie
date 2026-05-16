import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-hero-gradient dark:bg-dark-hero">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
