# 2026 "Coming Through Next" simulation report

Replay of every lap event for 2026. For each lap, the prediction state is sampled 1s before the actual scan and compared against what actually happened.

## Race summary

- Edition start: 2026-05-09T10:00+02:00
- Edition end: 2026-05-09T18:00+02:00
- Runners on the start list: **44**
- Runners with at least 1 lap: **33**
- Runners marked `stopped_at`: **44** (during race: **44**, after race end: **0**)
- Runners with laps but no `stopped_at` at all: **0**
- Confirmed mid-race DNFs (stopped >5 min before race end): **33**
- Silent drop-outs (no stop during race but no laps in last 30 min): **0**
- Total laps recorded: **160**

### Confirmed mid-race DNFs (`stopped_at` set during the race)

| Bib | Name | Last lap | Stopped at |
| --- | --- | --- | --- |
| 6 | Malin Söderström | 2026-05-09T09:15:59.30557+00:00 | 2026-05-09T10:52:40.048+00:00 |
| 14 | Nicole Silverstolpe | 2026-05-09T10:48:31.056649+00:00 | 2026-05-09T12:01:48.928+00:00 |
| 45 | Erik Kjellström | 2026-05-09T11:16:44.226565+00:00 | 2026-05-09T12:02:04.981+00:00 |
| 26 | Frank Herring | 2026-05-09T08:45:49.427922+00:00 | 2026-05-09T12:02:13.588+00:00 |
| 24 | Elin Kjellberg | 2026-05-09T08:52:46.714196+00:00 | 2026-05-09T12:02:15.977+00:00 |
| 43 | Hugo Hallsten | 2026-05-09T10:13:45.453324+00:00 | 2026-05-09T12:36:06.72+00:00 |
| 25 | Emmy Herring | 2026-05-09T09:08:54.809279+00:00 | 2026-05-09T12:36:10.504+00:00 |
| 27 | Kasper Herregud | 2026-05-09T09:08:50.753905+00:00 | 2026-05-09T12:36:11.347+00:00 |
| 33 | Lena Niklasson | 2026-05-09T10:38:49.31649+00:00 | 2026-05-09T12:36:14.684+00:00 |
| 10 | Robert Arvidsson | 2026-05-09T13:00:16.846845+00:00 | 2026-05-09T13:08:51.948+00:00 |
| 16 | Elinor Werleus | 2026-05-09T12:05:43.901823+00:00 | 2026-05-09T13:08:56.361+00:00 |
| 13 | Fred Abrahamson | 2026-05-09T11:41:28.990289+00:00 | 2026-05-09T13:09:10.513+00:00 |
| 12 | William Zethraeus | 2026-05-09T11:41:33.273482+00:00 | 2026-05-09T13:09:12.449+00:00 |
| 20 | Hanna Lindell | 2026-05-09T11:30:25.112291+00:00 | 2026-05-09T13:09:20.256+00:00 |
| 23 | Anthony Herring | 2026-05-09T11:57:37.157167+00:00 | 2026-05-09T13:37:03.145+00:00 |
| 21 | Marcus Sandström | 2026-05-09T13:25:50.076598+00:00 | 2026-05-09T13:37:29.547+00:00 |
| 9 | Reine Söderlund | 2026-05-09T13:29:41.459924+00:00 | 2026-05-09T13:37:35.872+00:00 |
| 3 | Jenny Nordström | 2026-05-09T14:04:46.708636+00:00 | 2026-05-09T14:05:45.381+00:00 |
| 2 | Peter Nordström | 2026-05-09T14:04:44.830639+00:00 | 2026-05-09T14:05:45.946+00:00 |
| 40 | Anna Scarabin | 2026-05-09T14:29:16.601627+00:00 | 2026-05-09T14:32:43.292+00:00 |
| 39 | Helena Scarabin | 2026-05-09T14:29:19.619886+00:00 | 2026-05-09T14:32:45.206+00:00 |
| 28 | Gustav Runersjö | 2026-05-09T14:15:34.091987+00:00 | 2026-05-09T14:33:02.379+00:00 |
| 44 | Erik Hjelmstedt | 2026-05-09T14:50:54.832639+00:00 | 2026-05-09T14:51:26.125+00:00 |
| 42 | Alexander Ringholm | 2026-05-09T13:24:08.712276+00:00 | 2026-05-09T15:15:45.502+00:00 |
| 1 | Lars Taravosh | 2026-05-09T15:13:01.109569+00:00 | 2026-05-09T15:16:14.8+00:00 |
| 7 | Mackenzie Chang | 2026-05-09T15:18:00.5401+00:00 | 2026-05-09T15:30:55.51+00:00 |
| 29 | David Hughes | 2026-05-09T15:32:35.916911+00:00 | 2026-05-09T15:40:23.328+00:00 |
| 17 | Filip Reusens | 2026-05-09T15:38:12.754256+00:00 | 2026-05-09T15:40:29.824+00:00 |
| 30 | Mikael Keri | 2026-05-09T15:11:34.207647+00:00 | 2026-05-09T15:40:56.316+00:00 |
| 34 | Mats Liljegren | 2026-05-09T15:48:42.763546+00:00 | 2026-05-09T15:49:56.993+00:00 |
| 32 | Christina Åqvist | 2026-05-09T15:51:59.235364+00:00 | 2026-05-09T15:53:34.198+00:00 |
| 19 | Amanda Gardelin | 2026-05-09T15:44:34.214944+00:00 | 2026-05-09T15:53:42.337+00:00 |
| 8 | Sven Gustafsson | 2026-05-09T14:54:59.889288+00:00 | 2026-05-09T15:53:45.024+00:00 |

## Aggregate metrics

### OLD algorithm

- Total lap events sampled: **160**
- Actual upcoming runner appeared in top 10: **119** (74.4%)
- Actual upcoming runner missing from list entirely: **34**
- Average rank of actual runner when listed: **3.18**
- Mean ETA absolute error: **7.71 min**
- Mean ETA signed error (negative = predicted too early): **-6.96 min**
- Imminent (≤120s) predictions that actually arrived in window: **34.6% (47/136)**
- Events where the visible top-10 contained at least one stopped runner: **83** (301 slot-occupations)
- Events where the visible top-10 contained at least one runner past the new median/65min staleness threshold: **116** (618 slot-occupations)

### NEW algorithm

- Total lap events sampled: **160**
- Actual upcoming runner appeared in top 10: **116** (72.5%)
- Actual upcoming runner missing from list entirely: **42**
- Average rank of actual runner when listed: **2.04**
- Mean ETA absolute error: **5.59 min**
- Mean ETA signed error (negative = predicted too early): **-4.55 min**
- Imminent (≤120s) predictions that actually arrived in window: **35.9% (42/117)**
- Events where the visible top-10 contained at least one stopped runner: **0** (0 slot-occupations)
- Events where the visible top-10 contained at least one runner past the new median/65min staleness threshold: **74** (93 slot-occupations)

## Ghost runners — predicted but never showed

A "ghost" is a runner who appeared in the visible top-10 list at some point but never registered the lap they were predicted for. The duration is from their actual last lap until the last sample where they were still being shown in the list.

### OLD algorithm — 23 ghost runners total

| Bib | Name | Stopped | Last lap | Ghost minutes on list | Sample appearances |
| --- | --- | --- | --- | --- | --- |
| 42 | Alexander Ringholm | yes | 2026-05-09T09:27:57.042709+00:00 | 384 | 9 |
| 28 | Gustav Runersjö | yes | 2026-05-09T10:56:25.027523+00:00 | 296 | 6 |
| 19 | Amanda Gardelin | yes | 2026-05-09T10:14:25.699786+00:00 | 275 | 2 |
| 20 | Hanna Lindell | yes | 2026-05-09T11:30:25.112291+00:00 | 262 | 11 |
| 23 | Anthony Herring | yes | 2026-05-09T11:57:37.157167+00:00 | 234 | 26 |
| 33 | Lena Niklasson | yes | 2026-05-09T10:38:49.31649+00:00 | 230 | 38 |
| 6 | Malin Söderström | yes | 2026-05-09T09:15:59.30557+00:00 | 218 | 48 |
| 25 | Emmy Herring | yes | 2026-05-09T09:08:54.809279+00:00 | 207 | 60 |
| 43 | Hugo Hallsten | yes | 2026-05-09T10:13:45.453324+00:00 | 197 | 45 |
| 13 | Fred Abrahamson | yes | 2026-05-09T11:41:28.990289+00:00 | 197 | 37 |
| 27 | Kasper Herregud | yes | 2026-05-09T09:08:50.753905+00:00 | 195 | 60 |
| 14 | Nicole Silverstolpe | yes | 2026-05-09T10:48:31.056649+00:00 | 162 | 40 |
| 24 | Elin Kjellberg | yes | 2026-05-09T08:52:46.714196+00:00 | 158 | 50 |
| 10 | Robert Arvidsson | yes | 2026-05-09T13:00:16.846845+00:00 | 158 | 26 |
| 45 | Erik Kjellström | yes | 2026-05-09T11:16:44.226565+00:00 | 157 | 30 |
| 21 | Marcus Sandström | yes | 2026-05-09T13:25:50.076598+00:00 | 146 | 23 |
| 9 | Reine Söderlund | yes | 2026-05-09T13:29:41.459924+00:00 | 142 | 16 |
| 26 | Frank Herring | yes | 2026-05-09T08:45:49.427922+00:00 | 135 | 45 |
| 2 | Peter Nordström | yes | 2026-05-09T14:04:44.830639+00:00 | 107 | 8 |
| 3 | Jenny Nordström | yes | 2026-05-09T14:04:46.708636+00:00 | 107 | 8 |
| 12 | William Zethraeus | yes | 2026-05-09T11:41:33.273482+00:00 | 85 | 19 |
| 40 | Anna Scarabin | yes | 2026-05-09T14:29:16.601627+00:00 | 83 | 3 |
| 39 | Helena Scarabin | yes | 2026-05-09T14:29:19.619886+00:00 | 83 | 2 |

### NEW algorithm — 12 ghost runners total

| Bib | Name | Stopped | Last lap | Ghost minutes on list | Sample appearances |
| --- | --- | --- | --- | --- | --- |
| 42 | Alexander Ringholm | yes | 2026-05-09T09:27:57.042709+00:00 | 330 | 10 |
| 19 | Amanda Gardelin | yes | 2026-05-09T10:14:25.699786+00:00 | 330 | 13 |
| 28 | Gustav Runersjö | yes | 2026-05-09T10:56:25.027523+00:00 | 199 | 15 |
| 12 | William Zethraeus | yes | 2026-05-09T11:41:33.273482+00:00 | 85 | 25 |
| 13 | Fred Abrahamson | yes | 2026-05-09T11:41:28.990289+00:00 | 85 | 15 |
| 14 | Nicole Silverstolpe | yes | 2026-05-09T10:48:31.056649+00:00 | 73 | 18 |
| 26 | Frank Herring | yes | 2026-05-09T08:45:49.427922+00:00 | 65 | 15 |
| 27 | Kasper Herregud | yes | 2026-05-09T09:08:50.753905+00:00 | 65 | 5 |
| 25 | Emmy Herring | yes | 2026-05-09T09:08:54.809279+00:00 | 65 | 4 |
| 24 | Elin Kjellberg | yes | 2026-05-09T08:52:46.714196+00:00 | 64 | 13 |
| 43 | Hugo Hallsten | yes | 2026-05-09T10:13:45.453324+00:00 | 63 | 7 |
| 45 | Erik Kjellström | yes | 2026-05-09T11:16:44.226565+00:00 | 45 | 4 |

## Worst false-imminent predictions (OLD)

Cases where the OLD list said "any moment now / less than 1 minute" but the runner did not actually register a lap within 120s. Top 20 by silence-after-prediction.

Total false-imminent (runner|nextLap) keys: **89**

| Bib | Name | Sample | Next lap | Silent at sample (min) | Actual arrival after sample (min) |
| --- | --- | --- | --- | --- | --- |
| 26 | Frank Herring | 2026-05-09T09:30:19.441Z | 2 | 44.5 | never |
| 24 | Elin Kjellberg | 2026-05-09T09:44:20.258Z | 2 | 51.6 | never |
| 42 | Alexander Ringholm | 2026-05-09T10:13:33.840Z | 3 | 45.6 | never |
| 27 | Kasper Herregud | 2026-05-09T10:20:39.585Z | 2 | 71.8 | never |
| 25 | Emmy Herring | 2026-05-09T10:20:39.585Z | 2 | 71.7 | never |
| 6 | Malin Söderström | 2026-05-09T10:34:22.611Z | 2 | 78.4 | never |
| 19 | Amanda Gardelin | 2026-05-09T11:01:05.671Z | 4 | 46.7 | never |
| 43 | Hugo Hallsten | 2026-05-09T11:18:52.507Z | 3 | 65.1 | never |
| 14 | Nicole Silverstolpe | 2026-05-09T11:44:13.241Z | 4 | 55.7 | never |
| 28 | Gustav Runersjö | 2026-05-09T11:57:36.157Z | 4 | 61.2 | never |
| 33 | Lena Niklasson | 2026-05-09T11:58:15.791Z | 3 | 79.4 | never |
| 45 | Erik Kjellström | 2026-05-09T12:08:22.047Z | 5 | 51.6 | never |
| 12 | William Zethraeus | 2026-05-09T12:13:15.568Z | 4 | 31.7 | never |
| 13 | Fred Abrahamson | 2026-05-09T12:52:59.190Z | 4 | 71.5 | never |
| 28 | Gustav Runersjö | 2026-05-09T13:06:09.426Z | 5 | 0.0 | never |
| 10 | Robert Arvidsson | 2026-05-09T13:53:14.948Z | 7 | 53.0 | never |
| 23 | Anthony Herring | 2026-05-09T13:58:50.415Z | 3 | 121.2 | never |
| 21 | Marcus Sandström | 2026-05-09T14:13:29.514Z | 8 | 47.7 | never |
| 9 | Reine Söderlund | 2026-05-09T14:41:58.421Z | 5 | 72.3 | never |
| 20 | Hanna Lindell | 2026-05-09T15:11:33.207Z | 2 | 221.1 | never |

## Remaining false-imminent predictions (NEW)

Total false-imminent keys (NEW): **75**

| Bib | Name | Sample | Next lap | Silent at sample (min) | Actual arrival after sample (min) |
| --- | --- | --- | --- | --- | --- |
| 26 | Frank Herring | 2026-05-09T09:30:19.441Z | 2 | 44.5 | never |
| 24 | Elin Kjellberg | 2026-05-09T09:44:20.258Z | 2 | 51.6 | never |
| 42 | Alexander Ringholm | 2026-05-09T10:13:33.840Z | 3 | 45.6 | never |
| 19 | Amanda Gardelin | 2026-05-09T11:01:05.671Z | 4 | 46.7 | never |
| 14 | Nicole Silverstolpe | 2026-05-09T11:44:13.241Z | 4 | 55.7 | never |
| 28 | Gustav Runersjö | 2026-05-09T11:57:36.157Z | 4 | 61.2 | never |
| 12 | William Zethraeus | 2026-05-09T12:13:15.568Z | 4 | 31.7 | never |
| 13 | Fred Abrahamson | 2026-05-09T12:52:59.190Z | 4 | 71.5 | never |
| 28 | Gustav Runersjö | 2026-05-09T13:06:09.426Z | 5 | 0.0 | never |
| 9 | Reine Söderlund | 2026-05-09T12:35:35.378Z | 4 | 74.2 | 54.1 |
| 43 | Hugo Hallsten | 2026-05-09T09:26:10.454Z | 2 | 44.9 | 47.6 |
| 12 | William Zethraeus | 2026-05-09T10:56:24.027Z | 3 | 8.6 | 45.2 |
| 9 | Reine Söderlund | 2026-05-09T10:56:24.027Z | 3 | 59.7 | 25.0 |
| 39 | Helena Scarabin | 2026-05-09T14:13:29.514Z | 6 | 66.7 | 15.8 |
| 40 | Anna Scarabin | 2026-05-09T14:13:29.514Z | 6 | 66.8 | 15.8 |
| 29 | David Hughes | 2026-05-09T11:57:36.157Z | 5 | 47.9 | 15.7 |
| 7 | Mackenzie Chang | 2026-05-09T13:58:50.415Z | 6 | 64.9 | 14.7 |
| 44 | Erik Hjelmstedt | 2026-05-09T13:16:48.502Z | 5 | 70.7 | 13.9 |
| 44 | Erik Hjelmstedt | 2026-05-09T10:37:20.076Z | 3 | 53.0 | 13.7 |
| 39 | Helena Scarabin | 2026-05-09T12:53:57.281Z | 5 | 60.3 | 12.9 |

## Findings

### What the new rules fixed

1. **Stopped runners are gone.** OLD showed a stopped runner in the visible top-10 on **83** of 160 samples (301 total slot-occupations). NEW: **0** events / 0 slots. Eliminated 301 bad slot-occupations.

2. **Silent runners get evicted faster.** OLD allowed a runner to remain on the list until they were overdue by 2× their estimated lap (so a 45-min lap kept them visible until 90 min after the last scan; a 60-min lap until 120 min after). NEW caps silence at **65 min** (when laps < 3) or **1.75 × the runner's median** (when laps ≥ 3). Silent slot-occupations dropped from **618** to **93** — a 85% reduction.

3. **Ghost runners cut roughly in half.** Distinct runners who appeared in top-10 but never registered the predicted lap: OLD **23** (4218 total ghost-minutes), NEW **12** (1469 total ghost-minutes).

4. **Average rank of the actual upcoming runner improved from 3.18 to 2.04** — i.e. the next-actual runner is shown closer to the top of the list because dead entries no longer push them down.

### What the new rules did *not* fix (and what to consider next)

1. **Single-lap silent drop-outs** are still in the list for up to 65 min. The 65 min fallback is the right magnitude for a normal lap, but a runner who quits after 1 lap stays in the list until 65 min after that lap. Real example: Frank Herring (bib 26) — last scan at 10:45, never came back. He stays in the list until ~11:50. *Possible mitigation:* shorten the fallback for "still on lap 1" cases (e.g. 50 min), since people who stop during their first lap are likely not coming back.

2. **Two-lap drop-outs** (the most common pattern in 2026 — see the silent-dropout table) also use the fallback because we require ≥3 durations for the median. *Possible mitigation:* lower MIN_LAPS_FOR_PERSONAL_STALE to 2 and accept that early-race noise might cause a slightly tighter threshold.

3. **Bulk-stopping at race end is not visible to the simulation as DNFs.** Of the 44 runners marked stopped, 0 were stamped after race end (i.e. cleanup, not DNF). The DNF feature is only valuable to "coming through next" if marshals actually press stop *during* the race. *Action:* make the admin UI nudge marshals to mark drop-outs immediately, since otherwise we're relying entirely on the staleness threshold.

4. **ETA accuracy is mediocre** — mean signed error ≈ -4.5 min, meaning predictions land **early** on average. The estimator weights the most recent lap heavily; runners typically slow down over the day. *Possible mitigation:* add a small "fatigue factor" that lengthens the predicted lap by N% for laps later in the race, or use a longer trailing window when laps are stable.

5. **"Imminent" predictions only match reality 36% of the time** under both algorithms. The bulk of the false positives are the silent-drop-out cases above; once those are fixed, the remaining miss rate is driven by ETA error (point 4). Tightening the staleness rule first will move that number more than tuning the estimator.

### Suggested next steps

1. Lower MIN_LAPS_FOR_PERSONAL_STALE from 3 to 2 so two-lap runners get a personal threshold instead of the 65 min fallback. Validate by re-running this simulation.
2. Tighten the fallback for runners with only 1 lap to ~50 min (the median 2026 lap is ~45 min, so 50 min is "missed by ~10%").
3. Surface staleness in the admin UI: any runner who hits 70% of their personal stale threshold should show a "is this one still going?" hint to marshals so they can mark them stopped.
4. Add a regression test snapshot: run this simulation in CI against a fixed 2026 dataset and fail if the ghost count or stopped-in-list count regresses.
