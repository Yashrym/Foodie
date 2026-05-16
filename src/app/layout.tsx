import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AppProviders } from "@/components/providers/app-providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} – ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Foodie connects restaurants, cafes, bakeries and grocers with nearby consumers and NGOs to rescue surplus food before it goes to waste.",
  keywords: [
    "food waste",
    "surplus food",
    "donate",
    "marketplace",
    "sustainability",
    "ngo",
  ],
  openGraph: {
    title: APP_NAME,
    description: APP_TAGLINE,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#bae6fd",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
