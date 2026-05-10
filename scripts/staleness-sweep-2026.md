# Staleness-rule sweep — 2026 data

Replay of all 2026 lap events under each candidate stale rule.
All variants apply the same `stopped_at` filter and the same
estimator (`estimateNextLapSeconds`); only the staleness threshold differs.

Metrics (lower = better unless noted):

- **Ghosts** — distinct runners shown in top-10 who never registered the predicted lap
- **Ghost-minutes** — total time those ghosts occupied the visible list
- **Silent slot-occupations** — across all minute-samples × top-10 slots, how many slots were filled by a runner already silent past median×1.75 / 65 min (variant-independent reference)
- **False evictions** — actual lap events where the runner was visible in the list 5 min before arrival but NOT 1 min before arrival (UX wart: they "popped off" then back on)
- **Actual missing** — actual lap events where the upcoming runner was not in the visible top-10 1s before they scanned (lower = better)
- **Imminent precision** — of "ETA ≤ 2 min" predictions, share that actually arrived within 2 min (higher = better)

| Rule | Ghosts | Ghost-min | Silent slots | False evictions | Actual missing | Imminent precision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| OLD (2 × estimated) | 16 | 1349 | 908 | 0 | 39 | 33.3% (42/126) |
| Current NEW (median×1.75 / 65min fallback) | 13 | 782 | 315 | 1 | 44 | 35.9% (42/117) |
| predicted + 10min | 17 | 1028 | 455 | 8 | 61 | 32.8% (41/125) |
| predicted + 15min | 17 | 1078 | 504 | 1 | 44 | 33.3% (42/126) |
| predicted + 20min | 17 | 1124 | 548 | 0 | 41 | 33.3% (42/126) |
| predicted + 30min | 17 | 1195 | 643 | 0 | 41 | 33.3% (42/126) |
| min(median×1.75, predicted+15) | 14 | 737 | 304 | 2 | 48 | 35.9% (42/117) |
| min(median×1.75, predicted+10) | 14 | 715 | 301 | 8 | 63 | 35.3% (41/116) |

## Recommendation

Best by composite score (1 ghost-minute = 1 point, 1 false eviction = 30 points, 1 missing actual = 5 points): **Current NEW (median×1.75 / 65min fallback)**

Compared to the current NEW rule:
- Ghost-minutes: 782 → **782** (+0)
- Ghost runners: 13 → **13**
- False evictions: 1 → **1** (+0)
- Actual upcoming runner missing: 44 → **44**
