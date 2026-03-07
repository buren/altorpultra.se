This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
