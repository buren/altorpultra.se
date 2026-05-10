/**
 * Parameter sweep for the "coming through next" staleness rule.
 *
 *   pnpm tsx scripts/sweep-staleness-2026.ts
 *
 * Replays all 2026 lap events under each candidate stale-rule and reports:
 *   - ghost runners (predicted but never arrived) — lower = better
 *   - total ghost-minutes on screen — lower = better
 *   - false evictions (real runner was on list 5min before arrival, gone 30s before) — lower = better
 *   - imminent precision (ETA <= 2min predictions that actually arrived in 2 min) — higher = better
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { buildLeaderboard, calcLapDurationsSeconds } from "../src/lib/race/leaderboard";
import { estimateNextLapSeconds } from "../src/lib/race/eta";
import type { Runner, Lap, LeaderboardEntry } from "../src/lib/race/types";

function loadEnv() {
  const p = resolve(__dirname, "../.env.local");
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}
loadEnv();

const YEAR = 2026;
const TOP_N = 10;
const IMMINENT_WINDOW_SEC = 120;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

type Variant = {
  name: string;
  /**
   * Returns the maximum allowed silence (seconds since last lap) before the
   * runner drops off the next-runners list. `durations` includes the
   * start→lap1 leg. `estimated` is the predicted next lap duration in seconds.
   */
  staleSeconds: (durations: number[], estimated: number) => number;
};

const variants: Variant[] = [
  {
    name: "OLD (2 × estimated)",
    staleSeconds: (_d, e) => e * 2,
  },
  {
    name: "Current NEW (median×1.75 / 65min fallback)",
    staleSeconds: (d, _e) => (d.length >= 3 ? median(d) * 1.75 : 65 * 60),
  },
  {
    name: "predicted + 10min",
    staleSeconds: (_d, e) => e + 10 * 60,
  },
  {
    name: "predicted + 15min",
    staleSeconds: (_d, e) => e + 15 * 60,
  },
  {
    name: "predicted + 20min",
    staleSeconds: (_d, e) => e + 20 * 60,
  },
  {
    name: "predicted + 30min",
    staleSeconds: (_d, e) => e + 30 * 60,
  },
  {
    name: "min(median×1.75, predicted+15)",
    staleSeconds: (d, e) =>
      d.length >= 3
        ? Math.min(median(d) * 1.75, e + 15 * 60)
        : Math.min(65 * 60, e + 15 * 60),
  },
  {
    name: "min(median×1.75, predicted+10)",
    staleSeconds: (d, e) =>
      d.length >= 3
        ? Math.min(median(d) * 1.75, e + 10 * 60)
        : Math.min(65 * 60, e + 10 * 60),
  },
];

type Prediction = {
  runnerId: string;
  nextLapNumber: number;
  estimatedMs: number;
  estimatedSecondsFromNow: number;
};

function predict(
  variant: Variant,
  entries: LeaderboardEntry[],
  startISO: string,
  nowMs: number,
  raceEndMs: number
): Prediction[] {
  const out: Prediction[] = [];
  for (const e of entries) {
    if (e.totalLaps === 0 || !e.lastLapTimestamp) continue;
    if (e.runner.stopped_at) continue;
    const durations = calcLapDurationsSeconds(e.laps, startISO);
    if (durations.length === 0) continue;
    const est = estimateNextLapSeconds(durations);
    if (est === null) continue;
    const lastMs = new Date(e.lastLapTimestamp).getTime();
    const estMs = lastMs + est * 1000;
    if (estMs > raceEndMs) continue;
    const stale = variant.staleSeconds(durations, est);
    if (nowMs - lastMs > stale * 1000) continue;
    out.push({
      runnerId: e.runner.id,
      nextLapNumber: e.totalLaps + 1,
      estimatedMs: estMs,
      estimatedSecondsFromNow: Math.max(0, (estMs - nowMs) / 1000),
    });
  }
  out.sort((a, b) => a.estimatedSecondsFromNow - b.estimatedSecondsFromNow);
  return out;
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: edition } = await supabase
    .from("editions")
    .select("*")
    .eq("year", YEAR)
    .single();
  const startISO = `${edition.date}T${edition.start_time}+02:00`;
  const endISO = `${edition.date}T${edition.end_time}+02:00`;
  const lapKm = Number(edition.lap_distance_km);
  const lapEle = Number(edition.lap_elevation_m);
  const raceEndMs = new Date(endISO).getTime();

  const { data: runners } = await supabase
    .from("runners")
    .select("*")
    .eq("edition_year", YEAR);
  const ids = (runners as Runner[]).map((r) => r.id);
  const { data: laps } = await supabase
    .from("laps")
    .select("*")
    .in("runner_id", ids)
    .order("timestamp", { ascending: true });

  const sortedLaps = [...(laps as Lap[])].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Build sample times: every minute throughout the race + 1s before each lap event.
  // Minute-by-minute samples power ghost-minutes & false-eviction metrics; lap-event
  // samples power imminent precision.
  const startMs = new Date(startISO).getTime();
  const minuteSamples: number[] = [];
  for (let t = startMs; t <= raceEndMs; t += 60_000) minuteSamples.push(t);

  const eventSamples: number[] = sortedLaps.map(
    (l) => new Date(l.timestamp).getTime() - 1000
  );

  const lapByRunner = new Map<string, Lap[]>();
  for (const l of sortedLaps) {
    const arr = lapByRunner.get(l.runner_id) ?? [];
    arr.push(l);
    lapByRunner.set(l.runner_id, arr);
  }

  // ---------- Per-variant simulation ----------

  type Result = {
    name: string;
    ghostCount: number;
    ghostMinutes: number;
    falseEvictions: number;
    imminentTrue: number;
    imminentTotal: number;
    actualInTopAtArrival: number;
    actualMissingAtArrival: number;
    silentSlotOccupations: number;
  };

  const results: Result[] = [];

  for (const variant of variants) {
    // For each runner: which snapshots had them in top-10
    const visibleAt = new Map<string, Set<number>>();
    // For each (runner, nextLapNumber): true if that lap was actually completed
    const actualLapByKey = new Map<string, Lap>();
    for (const lap of sortedLaps) {
      actualLapByKey.set(`${lap.runner_id}|${lap.lap_number}`, lap);
    }

    // Build leaderboard cache: only laps before sample time count, and stopped_at
    // is masked to None if it was set after the sample.
    function buildAtSample(sampleMs: number): LeaderboardEntry[] {
      const seen = sortedLaps.filter(
        (l) => new Date(l.timestamp).getTime() <= sampleMs
      );
      const runnersAtSample = (runners as Runner[]).map((r) => {
        if (r.stopped_at && new Date(r.stopped_at).getTime() > sampleMs) {
          return { ...r, stopped_at: null };
        }
        return r;
      });
      return buildLeaderboard(runnersAtSample, seen, lapKm, lapEle, startISO);
    }

    // Walk minute samples for visibility tracking + silent slot count.
    let silentSlots = 0;
    const STALE_FALLBACK_SECONDS = 65 * 60;
    const STALE_MEDIAN_MULTIPLIER = 1.75;
    const MIN_LAPS_FOR_PERSONAL_STALE = 3;

    for (const sampleMs of minuteSamples) {
      const entries = buildAtSample(sampleMs);
      const list = predict(variant, entries, startISO, sampleMs, raceEndMs).slice(
        0,
        TOP_N
      );
      for (const p of list) {
        const set = visibleAt.get(p.runnerId) ?? new Set<number>();
        set.add(sampleMs);
        visibleAt.set(p.runnerId, set);

        // Silent slot count uses fixed reference (median*1.75 / 65min) to
        // make this metric variant-independent — it always reflects the
        // user-facing "this runner has been silent too long" judgement.
        const arr = lapByRunner.get(p.runnerId) ?? [];
        const completedLaps = arr.filter(
          (l) => l.lap_number <= p.nextLapNumber - 1
        );
        const lastTs = completedLaps[completedLaps.length - 1]?.timestamp;
        if (lastTs) {
          const silenceSec = (sampleMs - new Date(lastTs).getTime()) / 1000;
          const dur = calcLapDurationsSeconds(completedLaps, startISO);
          const ref =
            dur.length < MIN_LAPS_FOR_PERSONAL_STALE
              ? STALE_FALLBACK_SECONDS
              : median(dur) * STALE_MEDIAN_MULTIPLIER;
          if (silenceSec > ref) silentSlots++;
        }
      }
    }

    // Ghosts: runners who were visible at some sample but never registered
    // their predicted lap. Use the last-laps-completed at each visible sample
    // to determine which "next lap" they were predicted for.
    const ghostByRunner = new Map<
      string,
      { firstVisibleMs: number; lastVisibleMs: number; lastActualLapMs: number }
    >();
    for (const sampleMs of minuteSamples) {
      const entries = buildAtSample(sampleMs);
      const list = predict(variant, entries, startISO, sampleMs, raceEndMs).slice(
        0,
        TOP_N
      );
      for (const p of list) {
        // Did this runner actually complete the predicted lap?
        const actual = actualLapByKey.get(`${p.runnerId}|${p.nextLapNumber}`);
        if (actual) continue;
        // No future lap — this is a ghost prediction for this slot
        const arr = lapByRunner.get(p.runnerId) ?? [];
        const lastLap = arr.find((l) => l.lap_number === p.nextLapNumber - 1);
        if (!lastLap) continue;
        const lastActualLapMs = new Date(lastLap.timestamp).getTime();
        const existing = ghostByRunner.get(p.runnerId);
        if (!existing) {
          ghostByRunner.set(p.runnerId, {
            firstVisibleMs: sampleMs,
            lastVisibleMs: sampleMs,
            lastActualLapMs,
          });
        } else {
          existing.lastVisibleMs = Math.max(existing.lastVisibleMs, sampleMs);
        }
      }
    }
    let ghostMinutes = 0;
    for (const g of ghostByRunner.values()) {
      ghostMinutes += Math.round((g.lastVisibleMs - g.lastActualLapMs) / 60_000);
    }

    // False evictions: for each actual lap event, was the runner visible in
    // any sample at lap_time - 30..5min, but NOT visible at lap_time - 1min?
    let falseEvictions = 0;
    for (const lap of sortedLaps) {
      const lapMs = new Date(lap.timestamp).getTime();
      const set = visibleAt.get(lap.runner_id) ?? new Set<number>();
      const farMs = lapMs - 5 * 60 * 1000;
      const nearMs = lapMs - 60 * 1000;
      let visibleFar = false;
      let visibleNear = false;
      for (const t of set) {
        if (t >= farMs && t <= lapMs) {
          if (t <= farMs + 60_000) visibleFar = true;
          if (t >= nearMs - 30_000 && t <= nearMs + 30_000) visibleNear = true;
        }
      }
      if (visibleFar && !visibleNear) falseEvictions++;
    }

    // Imminent precision + actual-runner-in-list at lap-event samples.
    let imminentTrue = 0;
    let imminentTotal = 0;
    let actualInTopAtArrival = 0;
    let actualMissingAtArrival = 0;
    const seenImminent = new Set<string>();
    for (let i = 0; i < eventSamples.length; i++) {
      const sampleMs = eventSamples[i];
      const lap = sortedLaps[i];
      const entries = buildAtSample(sampleMs);
      const list = predict(variant, entries, startISO, sampleMs, raceEndMs).slice(
        0,
        TOP_N
      );

      const actualIdx = list.findIndex((p) => p.runnerId === lap.runner_id);
      if (actualIdx >= 0) actualInTopAtArrival++;
      else actualMissingAtArrival++;

      for (const p of list) {
        if (p.estimatedSecondsFromNow > IMMINENT_WINDOW_SEC) continue;
        const key = `${p.runnerId}|${p.nextLapNumber}`;
        if (seenImminent.has(key)) continue;
        seenImminent.add(key);
        imminentTotal++;
        const actual = actualLapByKey.get(key);
        if (
          actual &&
          new Date(actual.timestamp).getTime() - sampleMs <=
            IMMINENT_WINDOW_SEC * 1000
        ) {
          imminentTrue++;
        }
      }
    }

    results.push({
      name: variant.name,
      ghostCount: ghostByRunner.size,
      ghostMinutes,
      falseEvictions,
      imminentTrue,
      imminentTotal,
      actualInTopAtArrival,
      actualMissingAtArrival,
      silentSlotOccupations: silentSlots,
    });

    console.log(
      `${variant.name}: ghosts=${ghostByRunner.size}/${ghostMinutes}min  falseEv=${falseEvictions}  imminent=${imminentTrue}/${imminentTotal}  silentSlots=${silentSlots}`
    );
  }

  // ---------- Render ----------

  const md: string[] = [];
  md.push(`# Staleness-rule sweep — 2026 data`);
  md.push(``);
  md.push(`Replay of all 2026 lap events under each candidate stale rule.`);
  md.push(`All variants apply the same \`stopped_at\` filter and the same`);
  md.push(`estimator (\`estimateNextLapSeconds\`); only the staleness threshold differs.`);
  md.push(``);
  md.push(`Metrics (lower = better unless noted):`);
  md.push(``);
  md.push(`- **Ghosts** — distinct runners shown in top-${TOP_N} who never registered the predicted lap`);
  md.push(`- **Ghost-minutes** — total time those ghosts occupied the visible list`);
  md.push(`- **Silent slot-occupations** — across all minute-samples × top-${TOP_N} slots, how many slots were filled by a runner already silent past median×1.75 / 65 min (variant-independent reference)`);
  md.push(`- **False evictions** — actual lap events where the runner was visible in the list 5 min before arrival but NOT 1 min before arrival (UX wart: they "popped off" then back on)`);
  md.push(`- **Actual missing** — actual lap events where the upcoming runner was not in the visible top-${TOP_N} 1s before they scanned (lower = better)`);
  md.push(`- **Imminent precision** — of "ETA ≤ 2 min" predictions, share that actually arrived within 2 min (higher = better)`);
  md.push(``);
  md.push(
    `| Rule | Ghosts | Ghost-min | Silent slots | False evictions | Actual missing | Imminent precision |`
  );
  md.push(`| --- | ---: | ---: | ---: | ---: | ---: | ---: |`);
  for (const r of results) {
    const prec =
      r.imminentTotal > 0
        ? `${((r.imminentTrue / r.imminentTotal) * 100).toFixed(1)}% (${r.imminentTrue}/${r.imminentTotal})`
        : "n/a";
    md.push(
      `| ${r.name} | ${r.ghostCount} | ${r.ghostMinutes} | ${r.silentSlotOccupations} | ${r.falseEvictions} | ${r.actualMissingAtArrival} | ${prec} |`
    );
  }
  md.push(``);

  // Findings
  const baseline = results.find((r) =>
    r.name.startsWith("Current NEW")
  )!;
  const best = [...results]
    .filter((r) => !r.name.startsWith("OLD"))
    .sort((a, b) => {
      // Composite ranking: penalize ghosts strongly, false evictions moderately,
      // missing-actual lightly. Keep imminent precision as a tiebreaker.
      const aScore =
        a.ghostMinutes + a.falseEvictions * 30 + a.actualMissingAtArrival * 5;
      const bScore =
        b.ghostMinutes + b.falseEvictions * 30 + b.actualMissingAtArrival * 5;
      return aScore - bScore;
    })[0];

  md.push(`## Recommendation`);
  md.push(``);
  md.push(
    `Best by composite score (1 ghost-minute = 1 point, 1 false eviction = 30 points, 1 missing actual = 5 points): **${best.name}**`
  );
  md.push(``);
  md.push(`Compared to the current NEW rule:`);
  md.push(`- Ghost-minutes: ${baseline.ghostMinutes} → **${best.ghostMinutes}** (${best.ghostMinutes - baseline.ghostMinutes >= 0 ? "+" : ""}${best.ghostMinutes - baseline.ghostMinutes})`);
  md.push(`- Ghost runners: ${baseline.ghostCount} → **${best.ghostCount}**`);
  md.push(`- False evictions: ${baseline.falseEvictions} → **${best.falseEvictions}** (${best.falseEvictions - baseline.falseEvictions >= 0 ? "+" : ""}${best.falseEvictions - baseline.falseEvictions})`);
  md.push(`- Actual upcoming runner missing: ${baseline.actualMissingAtArrival} → **${best.actualMissingAtArrival}**`);
  md.push(``);

  const out = resolve(__dirname, "staleness-sweep-2026.md");
  writeFileSync(out, md.join("\n"), "utf-8");
  console.log(`\nWritten ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
