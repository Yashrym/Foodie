"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url =
      process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud";
    return new ConvexReactClient(url, {
      unsavedChangesWarning: false,
    });
  }, []);

  return (
    <SessionProvider>
      <ConvexProvider client={convex}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="system"
          />
        </ThemeProvider>
      </ConvexProvider>
    </SessionProvider>
  );
}
