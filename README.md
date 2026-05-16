# Foodie — AI-powered food waste marketplace

Foodie is a realtime, mobile-first marketplace that helps restaurants, cafes,
bakeries, grocery stores and hotels sell or donate surplus food to nearby
consumers and NGOs — before it goes to waste.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Shadcn UI**, **Convex** (realtime DB + functions), **NextAuth**,
**OpenStreetMap** (via React Leaflet) and **OpenAI** for AI features.

---

## ✨ Highlights

- **AI upload assistant** — snap a photo, fill a few fields, and OpenAI
  generates the title, description, urgency tag and a fair discount.
- **Dynamic discount engine** — pure-TS pricing curves that drop prices as
  pickup time approaches (20% → 35% → 50% → 65% → 80%).
- **Spoilage prediction** — heuristic shelf-life model based on category,
  prep time and (optional) weather context.
- **Live marketplace** — Convex reactive queries make new listings, prices
  and reservation counts update instantly.
- **OpenStreetMap-powered map** — interactive marker browsing using
  React-Leaflet (no Google Maps key required).
- **NGO donation lane** — providers can mark batches as donation-ready;
  NGOs see them in a dedicated queue and claim with one tap.
- **QR-based pickup verification** — every reservation gets a 5-char code
  with a QR fallback for fast in-shop confirmation.
- **Sustainability dashboard** — global stats, per-user impact and a
  meals-rescued leaderboard.
- **Role-aware shell** — consumer, provider, NGO and admin dashboards each
  get a dedicated sidebar, with route guards.

---

## 🧱 Architecture

```
.
├── convex/              # Convex schema + queries/mutations/crons
│   ├── schema.ts
│   ├── listings.ts
│   ├── reservations.ts
│   ├── providers.ts
│   ├── ngos.ts
│   ├── notifications.ts
│   ├── analytics.ts
│   ├── reviews.ts
│   ├── users.ts
│   ├── seed.ts
│   ├── crons.ts
│   └── _helpers.ts      # Pricing + urgency + distance helpers
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (marketplace)/marketplace/
│   │   ├── admin/        # Admin moderation + analytics
│   │   ├── api/auth/[...nextauth]/
│   │   ├── api/ai/analyze/
│   │   ├── map/
│   │   ├── ngo/          # NGO dashboard
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── provider/     # Provider dashboard
│   │   ├── reservations/
│   │   └── sustainability/
│   ├── components/
│   │   ├── ui/           # Shadcn primitives (Button, Card, Dialog...)
│   │   ├── layout/       # Navbar, footer, shells
│   │   ├── landing/
│   │   ├── marketplace/
│   │   ├── map/          # React-Leaflet wrapper (dynamic import)
│   │   ├── notifications/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── provider/
│   │   ├── reservations/
│   │   └── providers/    # App-wide React providers
│   ├── hooks/            # use-current-user, use-geolocation, use-countdown
│   ├── lib/
│   │   ├── ai/           # food-vision.ts, pricing.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── auth.ts           # NextAuth config
├── tailwind.config.ts
├── components.json
└── .env.example
```

> The Convex helpers are intentionally dependency-free so a future Python
> microservice can reuse the same pricing & spoilage logic without
> coupling to Next.js.

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

- `OPENAI_API_KEY` — for the AI upload assistant. Without it, Foodie will
  silently fall back to a deterministic heuristic so the UI still works.
- `AUTH_SECRET` — any long random string (run
  `npx auth secret` to generate one, or `openssl rand -base64 32`).
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (optional) — for Google OAuth.
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (optional) — for GitHub OAuth.

If you skip OAuth, Foodie ships a passwordless **Credentials** provider so
reviewers can sign in with any email + role from the `/login` page.

### 3. Start Convex

In a separate terminal:

```bash
npx convex dev
```

The first run will walk you through creating (or linking) a Convex deployment
and will auto-write `NEXT_PUBLIC_CONVEX_URL` + `CONVEX_DEPLOYMENT` to your
`.env.local`. Keep this terminal running while you develop — it generates
`convex/_generated/` and pushes schema changes live.

### 4. Seed sample data (optional)

```bash
npx convex run seed:run
```

This creates a few demo providers, listings, an NGO, and a consumer so the
marketplace, map and dashboards have content immediately.

### 5. Run the Next.js app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in via the
demo credentials provider, or pick a role from the landing page to
onboard.

---

## 🧪 Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run dev:convex` | Run Convex dev (codegen + live push) |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript-only verification |
| `npm run lint` | ESLint (Next.js core-web-vitals) |
| `npx convex run seed:run` | Seed demo data |

---

## 🧠 AI flows

- **`/api/ai/analyze`** (Next.js route) — receives an image and seller
  notes, returns a strict-JSON analysis from `gpt-4o-mini` (Vision). The
  response shape is enforced by Zod and falls back to a rule-based
  heuristic if the API key is missing or the call fails.
- **`src/lib/ai/pricing.ts`** — pure-TS dynamic discount + spoilage
  prediction. Mirror this file in Python later if the workload grows.

---

## 🗺️ Maps & geolocation

Foodie ships with the OpenStreetMap tile server by default — no key needed.
Override the tile URL or attribution via `NEXT_PUBLIC_OSM_TILE_URL` /
`NEXT_PUBLIC_OSM_ATTRIBUTION`. The default map centre is Colombo, LK; tweak
with `NEXT_PUBLIC_DEFAULT_LAT` / `NEXT_PUBLIC_DEFAULT_LNG`. Consumers'
browsers are prompted for geolocation on first visit to power
distance-based sorting.

---

## 🛡️ Role guards

Each dashboard layout (`provider/`, `ngo/`, `admin/`) renders a friendly
"restricted area" panel for sessions whose role doesn't match. To bump a
demo account to provider/NGO/admin, sign in with the admin role or use
`/admin/users` to change roles directly.

---

## 🪜 Extending to a Python AI microservice

Because the pricing & spoilage helpers are dependency-free
(`convex/_helpers.ts` + `src/lib/ai/pricing.ts`), porting them to a Python
service later means re-implementing pure functions only. The Convex schema
already includes an `aiAnalysis` object so the microservice can post
results back via Convex HTTP actions without DB migrations.

---

## 📦 Tech stack summary

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI |
| State / DB / Realtime | Convex |
| Auth | NextAuth 5 (Credentials + Google/GitHub) |
| Maps | OpenStreetMap via React Leaflet |
| AI | OpenAI `gpt-4o-mini` Vision + Zod validation |
| Animations | Framer Motion |
| Icons | Lucide React |
| Validation | Zod, react-hook-form |
| QR codes | `qrcode.react` |

---

## 📝 License

MIT — use it, fork it, ship it.
