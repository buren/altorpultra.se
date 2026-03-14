# CLAUDE.md

## Project

Next.js 15 app for **Altorp Ultra** — a timed 8-hour ultramarathon in Altorp, Djursholm, Stockholm.

## Stack

- Next.js 15, React 19, TypeScript, Tailwind CSS
- Vitest for testing, Supabase for race tracking
- pnpm as package manager
- Path alias: `@/` → `./src/`

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm test` — run all tests (vitest)
- `pnpm tsc --noEmit` — type-check

## Rules

### Testing
- Write tests for new logic — use red/green TDD (write a failing test first, then make it pass).
- Test files live next to the source file (e.g. `leaderboard.test.ts` beside `leaderboard.ts`).

### i18n
- Two locales: `sv` (default) and `en`. Translation files: `messages/sv.json` and `messages/en.json`.
- When adding or updating user-facing text, always update **both** language files. Never leave them out of sync.

### Quality gates
Before considering work done, ensure all three pass:
1. `pnpm tsc --noEmit` — no type errors
2. `pnpm test` — all tests green
3. `pnpm build` — build succeeds
