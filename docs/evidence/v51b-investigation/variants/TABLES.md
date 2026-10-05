## A/C. Threat timeline (baseline, competent bots)

| players | seed | threat | created | nearest city (hexes) | path len at 1st sight | launched (round) | gone (round) | first world assault | camped window (rounds) |
|---|---|---|---|---|---|---|---|---|---|

### Spawns by source round (baseline): THREAT_SPAWNED / THREAT_REINFORCED / THREAT_MARCHING event rounds

| players | seed | spawned (rounds) | reinforced | marching events | world assaults | assaults on undefended hex | assaults on city | camps killed camped | player attacks on threats |
|---|---|---|---|---|---|---|---|---|---|

### Assaults per target (baseline): how many times the same hex is assaulted

| players | seed | distinct hexes | assaults | max on one hex | share on the 2 most-hit hexes |
|---|---|---|---|---|---|

## B. Urban pace: first round reaching each level, by variant

| variant | players | N2 | N3 | N4 | N5 | N6 | N7 |
|---|---|---|---|---|---|---|---|
| nothreat | 2 | 4 (2/2) | 7 (2/2) | 17 (2/2) | 25 (2/2) | 30.5 (2/2) | never (0/2) |
| nothreat | 4 | 4 (2/2) | 7 (2/2) | 14.5 (2/2) | 20 (2/2) | 26 (1/2) | never (0/2) |
| nothreat | 6 | 4 (2/2) | 7 (2/2) | 15.5 (2/2) | 20.5 (2/2) | 29.5 (2/2) | never (0/2) |
| garrison | 2 | 4 (2/2) | 10.5 (2/2) | never (0/2) | never (0/2) | never (0/2) | never (0/2) |
| garrison | 4 | 4 (2/2) | 9 (1/2) | never (0/2) | never (0/2) | never (0/2) | never (0/2) |
| garrison | 6 | 4 (2/2) | 8.5 (2/2) | never (0/2) | never (0/2) | never (0/2) | never (0/2) |

### Elevar bottleneck: share of city-rounds (next level not yet built) by FIRST failing condition

| variant | players | city-rounds | population | Era | Web advance | cost | all four met | ready but not elevated next round | below pop ceiling | …of which Alimento < 3 |
|---|---|---|---|---|---|---|---|---|---|---|
| nothreat | 2 | 303 | 64% | 2% | 17% | 2% | 15% | 7/43 | 64% | 79% |
| nothreat | 4 | 579 | 53% | 3% | 21% | 11% | 12% | 13/69 | 53% | 82% |
| nothreat | 6 | 868 | 53% | 3% | 21% | 11% | 12% | 12/105 | 53% | 81% |
| garrison | 2 | 236 | 77% | 0% | 0% | 13% | 9% | 12/19 | 77% | 90% |
| garrison | 4 | 501 | 93% | 0% | 1% | 1% | 6% | 21/29 | 93% | 95% |
| garrison | 6 | 772 | 85% | 0% | 3% | 6% | 6% | 22/44 | 85% | 94% |

### Any-failing share (a condition counted whenever it fails, not only first)

| variant | players | population | Era | Web advance | cost |
|---|---|---|---|---|---|
| nothreat | 2 | 64% | 5% | 41% | 22% |
| nothreat | 4 | 53% | 9% | 41% | 37% |
| nothreat | 6 | 53% | 8% | 45% | 36% |
| garrison | 2 | 77% | 3% | 17% | 43% |
| garrison | 4 | 93% | 3% | 13% | 27% |
| garrison | 6 | 85% | 4% | 17% | 28% |

## D. Soldados (baseline)

| players | pop (mean/civ-round) | Soldados (mean) | pieces (mean) | civ-rounds with a degraded city | …with ≥1 piece but no Soldado reserve | pieces at r10 | r20 | r30 | cities (mean) |
|---|---|---|---|---|---|---|---|---|---|
| 2 | null | null | null | - | - | null | null | null | null |
| 4 | null | null | null | - | - | null | null | null | null |
| 6 | null | null | null | - | - | null | null | null | null |

### Recruitment and losses (baseline totals per match)

| players | pieces recruited / match | casualties in world battles | casualties in PvP | upkeep Alimento / match (military) |
|---|---|---|---|---|
| 2 | null | null assaults | null battles | n/a (ledger: see data.json) |
| 4 | null | null assaults | null battles | n/a (ledger: see data.json) |
| 6 | null | null assaults | null battles | n/a (ledger: see data.json) |

## E. Graus (engine shock core, 1500 trials per row)

| family | I vs I: A / tie / D | II vs I | III vs I | I vs III defending |
|---|---|---|---|---|
| Infantaria | 8 / 53 / 39 | 10 / 55 / 35 | 13 / 62 / 26 | 9 / 54 / 37 |
| Guarda | 10 / 51 / 39 | 9 / 51 / 39 | 9 / 53 / 38 | 10 / 52 / 38 |
| Arqueiros | 7 / 58 / 34 | 15 / 57 / 28 | 14 / 60 / 26 | 5 / 48 / 48 |
| Cavalaria | 7 / 61 / 33 | 6 / 61 / 32 | 13 / 60 / 26 | 5 / 48 / 47 |
| Cerco (contra 3 Guardas e Paliçada) | 5 / 44 / 51 | 5 / 43 / 52 | 8 / 53 / 38 | 0 / 5 / 95 |
| Frota | 9 / 51 / 40 | 9 / 53 / 38 | 8 / 52 / 40 | 11 / 53 / 37 |

## F. Orders and Legado (baseline)

| players | Legado orders / match | matches with any Legado | BUILD_PROJECT sent | rejected | probe attempts | probe OK | most common refusal |
|---|---|---|---|---|---|---|---|
| 2 | null | 0/0 | null | null | 0 | 0 | - |
| 4 | null | 0/0 | null | null | 0 | 0 | - |
| 6 | null | 0/0 | null | null | 0 | 0 | - |

## 5. Contact milestones (baseline; round observed at the start of planning)

| players | seed | capital distance (min / mean) | first contact | first shared border | first diplomacy | first hostility (war) | first PvP battle | first world assault |
|---|---|---|---|---|---|---|---|---|

### Means by table size and variant

| variant | players | contact | shared border | diplomacy | war | PvP battle | matches with PvP |
|---|---|---|---|---|---|---|---|
| nothreat | 2 | 31 (1/2) | never (0/2) | 32 (1/2) | never (0/2) | never (0/2) | 0/2 |
| nothreat | 4 | 13.5 (2/2) | 18 (1/2) | 20 (2/2) | 18 (1/2) | never (0/2) | 0/2 |
| nothreat | 6 | 12.5 (2/2) | 4.5 (2/2) | 14 (2/2) | 13 (1/2) | never (0/2) | 0/2 |
| garrison | 2 | 14 (1/2) | never (0/2) | 20 (1/2) | never (0/2) | never (0/2) | 0/2 |
| garrison | 4 | 14 (2/2) | never (0/2) | 17 (2/2) | 18 (1/2) | never (0/2) | 0/2 |
| garrison | 6 | 12 (2/2) | 4.5 (2/2) | 14 (2/2) | 13 (1/2) | never (0/2) | 0/2 |

## A (cont.). What happens at the gate: outcome of world assaults by variant

| variant | players | world assaults / match | Bando wins | tie | defender wins | player attacks on threats | camps killed camped | mean pieces / civ-round | mean pop / civ-round | civ-rounds with a degraded city |
|---|---|---|---|---|---|---|---|---|---|---|
| nothreat | 2 | 0 | - | - | - | 0 | 0 | 0.25 | 15.84 | 21% |
| nothreat | 4 | 0 | - | - | - | 0 | 0 | 0.13 | 15.44 | 15% |
| nothreat | 6 | 0 | - | - | - | 0 | 0 | 0.08 | 15.73 | 18% |
| garrison | 2 | 39 | 87% | 13% | 0% | 0 | 0 | 1.88 | 4.9 | 34% |
| garrison | 4 | 27 | 85% | 9% | 6% | 0 | 0 | 2.44 | 4.17 | 42% |
| garrison | 6 | 57 | 94% | 6% | 0% | 0 | 0 | 2.49 | 4.68 | 49% |

> Variant `scout` was rerun after a script fix and lives in ../scout/ (the first run crashed in the observer, not in the engine).
