# Foodie - AI-powered Food Waste Marketplace

Foodie is a realtime, mobile-first marketplace that helps restaurants, cafes,
bakeries, grocery stores, and hotels sell or donate surplus food to nearby
consumers and NGOs before it goes to waste.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Shadcn UI**, **Convex** (realtime DB + functions), **NextAuth**,
**OpenStreetMap** (via React Leaflet), and **OpenAI** for AI features.

---

## Achievement

Grand Champions - Cursor 24hr Buildathon Sri Lanka

Foodie was awarded the **Grand Champion title** and **Best use of Convex** at the **Cursor 24hr Buildathon Sri Lanka**, recognized for its innovative approach to reducing food waste through AI-powered realtime technology and sustainability-focused impact.

---

## Highlights

- **AI upload assistant** - snap a photo, fill a few fields, and OpenAI
  generates the title, description, urgency tag, and a fair discount.
- **Dynamic discount engine** - pure TypeScript pricing curves that drop
  prices as pickup time approaches (20% → 35% → 50% → 65% → 80%).
- **Spoilage prediction** - heuristic shelf-life model based on category,
  prep time, and optional weather context.
- **Live marketplace** - Convex reactive queries make new listings, prices,
  and reservation counts update instantly.
- **OpenStreetMap-powered map** - interactive marker browsing using
  React-Leaflet with no Google Maps key required.
- **NGO donation lane** - providers can mark batches as donation-ready;
  NGOs see them in a dedicated queue and claim with one tap.
- **QR-based pickup verification** - every reservation gets a 5-character
  code with a QR fallback for fast in-shop confirmation.
- **Sustainability dashboard** - global stats, per-user impact, and a
  meals-rescued leaderboard.
- **Role-aware shell** - consumer, provider, NGO, and admin dashboards each
  get a dedicated sidebar with route guards.

---

## Architecture

```bash
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
│   │   ├── ui/           # Shadcn primitives
│   │   ├── layout/
│   │   ├── landing/
│   │   ├── marketplace/
│   │   ├── map/
│   │   ├── notifications/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── provider/
│   │   ├── reservations/
│   │   └── providers/
│   ├── hooks/
│   ├── lib/
│   │   ├── ai/
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── auth.ts
├── tailwind.config.ts
├── components.json
└── .env.example
```

> The Convex helpers are intentionally dependency-free so a future Python
> microservice can reuse the same pricing and spoilage logic without
> coupling to Next.js.

---

## Setup

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
- `AUTH_SECRET` — any long random string.

Generate one using:

```bash
npx auth secret
```

or

```bash
openssl rand -base64 32
```

Optional OAuth providers:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

If OAuth is skipped, Foodie ships with a passwordless **Credentials**
provider so reviewers can sign in with any email and role from the `/login`
page.

### 3. Start Convex

Run in a separate terminal:

```bash
npx convex dev
```

The first run will guide you through creating or linking a Convex deployment
and automatically generate:

- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`

Keep this terminal running during development.

### 4. Seed sample data (optional)

```bash
npx convex run seed:run
```

Creates demo providers, listings, NGOs, and consumers so the marketplace,
map, and dashboards have immediate content.

### 5. Run the Next.js app

```bash
npm run dev
```

Visit:

```txt
http://localhost:3000
```

---

## Useful Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run dev:convex` | Run Convex dev |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript verification |
| `npm run lint` | ESLint checks |
| `npx convex run seed:run` | Seed demo data |

---

## AI Flows

- **`/api/ai/analyze`** — receives an image and seller notes, returns a
  strict JSON analysis from `gpt-4o-mini` Vision.
- **`src/lib/ai/pricing.ts`** — pure TypeScript dynamic discount and
  spoilage prediction logic.

The system falls back to deterministic heuristics if OpenAI is unavailable.

---

## Maps & Geolocation

Foodie uses OpenStreetMap tiles by default with no API key required.

Override map settings with:

- `NEXT_PUBLIC_OSM_TILE_URL`
- `NEXT_PUBLIC_OSM_ATTRIBUTION`
- `NEXT_PUBLIC_DEFAULT_LAT`
- `NEXT_PUBLIC_DEFAULT_LNG`

The default map center is Colombo, Sri Lanka.

Consumers are prompted for geolocation access to enable
distance-based sorting.

---

## Role Guards

Each dashboard layout:

- `provider/`
- `ngo/`
- `admin/`

includes friendly restricted-access handling for unauthorized users.

Roles can be updated via:

```txt
/admin/users
```

---

## Extending to a Python AI Microservice

Because the pricing and spoilage helpers are dependency-free:

- `convex/_helpers.ts`
- `src/lib/ai/pricing.ts`

they can easily be ported into a Python AI service later.

The Convex schema already includes an `aiAnalysis` object so external AI
services can post results back through Convex HTTP actions without
additional database migrations.

---

## Tech Stack Summary

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Shadcn UI |
| State / DB / Realtime | Convex |
| Auth | NextAuth 5 |
| Maps | OpenStreetMap + React Leaflet |
| AI | OpenAI `gpt-4o-mini` Vision |
| Animations | Framer Motion |
| Icons | Lucide React |
| Validation | Zod, react-hook-form |
| QR Codes | `qrcode.react` |

---

## License

MIT — use it, fork it, ship it.
