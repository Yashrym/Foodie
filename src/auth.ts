import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      role?: Role;
    };
  }
}

const providers = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

// Always-on demo credentials so the app boots in dev without OAuth setup.
providers.push(
  Credentials({
    name: "Demo",
    credentials: {
      email: { label: "Email", type: "email" },
      name: { label: "Name", type: "text" },
      role: { label: "Role", type: "text" },
    },
    async authorize(credentials) {
      const email = (credentials?.email as string)?.toLowerCase().trim();
      if (!email) return null;
      const name = (credentials?.name as string) || email.split("@")[0];
      const role = ((credentials?.role as string) || "consumer") as Role;
      return {
        id: email,
        email,
        name,
        role,
      } as any;
    },
  }),
);

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  // Vercel preview deployments have rotating URLs. `trustHost` makes
  // Auth.js trust the X-Forwarded-Host header set by Vercel's proxy
  // so callbacks resolve correctly without hard-coding AUTH_URL.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "consumer";
        token.id = (user as any).id ?? token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? session.user.email!;
        session.user.role = (token.role as Role) ?? "consumer";
      }
      return session;
    },
  },
});
