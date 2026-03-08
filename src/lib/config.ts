// ── App Config ──
// Stable site-wide configuration that does NOT vary per edition.
// Per-edition data (dates, distances, prices, map links, etc.)
// lives in the Supabase `editions` table.

// How many days before the next edition's start date the /race redirect
// switches to show the upcoming edition's leaderboard.
export const DAYS_BEFORE_LEADERBOARD_SWITCH = 7;

// How many days after an edition ends we show a "View {year} Results" link
// on the homepage.
export const DAYS_SHOW_RESULTS_LINK = 30;

// Stable across all years
export const site = {
  name: "Altorp Ultra",
  location: "Altorp, Djursholm",
  region: "Stockholm",
  email: "altorpultra@gmail.com",
  instagram: "https://www.instagram.com/altorpultra",
  website: "https://altorpultra.se",
} as const;
