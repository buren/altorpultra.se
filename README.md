# Altorp Ultra

Website for Altorp Ultra — a timed 8-hour ultramarathon (7 km laps) in Altorp, Djursholm, Stockholm.

Built with Next.js 14, React 18, TypeScript, Tailwind CSS, and Supabase.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Production build
- `pnpm start` — Start production server
- `pnpm lint` — Run ESLint
- `pnpm test` — Run tests (Vitest)
- `pnpm test:watch` — Run tests in watch mode

## Race Tracking

The site includes a live race tracking system:

- `/race` — Public leaderboard with real-time results
- `/race/admin` — Admin dashboard for registering laps
- `/race/admin/runners` — Admin dashboard for managing runners

Race data is stored in Supabase. Admin access is protected by a shared password (`RACE_ADMIN_PASSWORD` env var).

## Preparing for a New Year

All year-specific configuration lives in `src/lib/constants.ts`. To get the site ready for the next edition:

1. **Add a new edition entry** — In `constants.ts`, add a new entry to the `editions` record with the upcoming year as the key. Fill in all fields:
   - `date`, `startDateTime`, `endDateTime`, `dateFormatted` — the event date and times
   - `startTime`, `endTime`, `durationHours` — schedule details
   - `priceSEK` — registration price
   - `lapDistanceKm`, `lapElevationM` — route stats (update if the route changes)
   - `raceIdUrl` — registration link from [RaceID](https://raceid.com) (leave empty until registration is live)
   - `stravaRoute` — link to the Strava route (update if the route changes)
   - `googleMaps` — start pin, parking pin, route embed and viewer URLs (update if the route changes)

2. **Update `currentYear`** — Change the `currentYear` constant at the top of `constants.ts` to the new year. This automatically updates all components (dates, countdown, registration links, structured data, etc.).

3. **Update the Strava route embed** — If the route changed, update `src/components/StravaRouteEmbed.tsx` with the new embed URL/ID.

4. **Update route photos** — If you have new route/course photos, update `src/lib/route-photos.ts` and add image files to `src/public/`.

5. **Review one-off content** — Check `src/components/AltorpUltra.tsx` for any year-specific copy (e.g. the "New for {year}" kids race banner) and update or remove as needed.
