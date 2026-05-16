import { SiteShell } from "@/components/layout/site-shell";
import { ProfilePage } from "@/components/profile/profile-page";

export const metadata = { title: "Profile" };

export default function Page() {
  return (
    <SiteShell>
      <section className="container py-8 max-w-4xl">
        <ProfilePage />
      </section>
    </SiteShell>
  );
}
