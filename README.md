# Altorp Ultra

Website for Altorp Ultra — a timed 8-hour ultramarathon (7 km laps) in Altorp, Djursholm, Stockholm.

Built with Next.js 14, React 18, TypeScript, Tailwind CSS, and Supabase.

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)

### Setup

```bash
pnpm install

# Start local Supabase (runs migrations + seed data)
supabase start

# Create .env.development.local with the local keys printed by supabase start
cp .env.local.example .env.development.local
# Then fill in the local URL/keys from the supabase start output

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Files

- `.env.development.local` — Local Supabase keys, used by `pnpm dev`
- `.env.local` — Production Supabase keys, used by `pnpm build`
- `.env.local.example` — Template with instructions

### Local Supabase

```bash
supabase start       # Start containers
supabase stop        # Stop containers
supabase db reset    # Wipe DB and re-run migrations + seed data
```

- Schema: `supabase/migrations/`
- Seed data: `supabase/seed.sql` (sample editions + runners)
- Studio UI: http://127.0.0.1:54323

## Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Production build
- `pnpm start` — Start production server
- `pnpm lint` — Run ESLint
- `pnpm test` — Run tests (Vitest)
- `pnpm test:watch` — Run tests in watch mode

## Race Tracking

The site includes a live race tracking system:

- `/race` — Redirects to current edition's leaderboard
- `/race/:year` — Leaderboard for a specific edition with real-time results
- `/race/:year/runner/:bib` — Individual runner detail page
- `/race/admin` — Admin dashboard for registering laps
- `/race/admin/runners` — Manage runners
- `/race/admin/editions` — Manage editions (create, edit, publish, duplicate)

Race data is stored in Supabase. Admin access is protected by a shared password (`RACE_ADMIN_PASSWORD` env var).

## Preparing for a New Year

Edition data (dates, prices, routes, map links) is stored in the Supabase `editions` table — there are no hardcoded edition values in the codebase. To set up a new edition:

1. **Create a new edition** — Go to `/race/admin/editions` and either duplicate last year's edition or create one from scratch. Fill in all fields (date, times, price, route links, etc.).

2. **Publish** — Click "Publish" when the edition is ready to go live. The site automatically resolves and displays the current edition based on dates.

3. **Update the Strava route embed** — If the route changed, update `src/components/StravaRouteEmbed.tsx` with the new embed ID.

4. **Update route photos** — If you have new photos, update `src/lib/route-photos.ts` and add image files to `src/public/`.

5. **Review one-off content** — Check `src/components/AltorpUltra.tsx` for any year-specific copy (e.g. the "New for {year}" kids race banner) and update or remove as needed.

## Architecture

- `src/lib/config.ts` — Stable site-wide constants (name, location, email)
- `src/lib/race/` — Core race domain logic (types, leaderboard, clock, editions, DB queries)
- `src/app/api/race/` — API routes for leaderboard, laps, runners, editions, auth
- `src/components/` — UI components, all accept edition data as props (no hardcoded config)
