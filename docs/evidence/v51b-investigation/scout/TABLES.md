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
| scout | 2 | 4 (2/2) | 7.5 (2/2) | 16 (2/2) | 20 (1/2) | 29 (1/2) | never (0/2) |
| scout | 4 | 4 (2/2) | 7 (2/2) | 13 (2/2) | 19 (2/2) | 30 (1/2) | never (0/2) |
| scout | 6 | 4 (2/2) | 7 (2/2) | 13.5 (2/2) | 24.5 (2/2) | never (0/2) | never (0/2) |

### Elevar bottleneck: share of city-rounds (next level not yet built) by FIRST failing condition

| variant | players | city-rounds | population | Era | Web advance | cost | all four met | ready but not elevated next round | below pop ceiling | …of which Alimento < 3 |
|---|---|---|---|---|---|---|---|---|---|---|
| scout | 2 | 267 | 53% | 2% | 8% | 26% | 10% | 11/28 | 53% | 81% |
| scout | 4 | 579 | 46% | 3% | 14% | 23% | 14% | 31/78 | 46% | 81% |
| scout | 6 | 866 | 47% | 3% | 16% | 23% | 11% | 30/95 | 47% | 84% |

### Any-failing share (a condition counted whenever it fails, not only first)

| variant | players | population | Era | Web advance | cost |
|---|---|---|---|---|---|
| scout | 2 | 53% | 6% | 22% | 46% |
| scout | 4 | 46% | 9% | 33% | 48% |
| scout | 6 | 47% | 8% | 38% | 51% |

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
| scout | 2 | 5 (2/2) | never (0/2) | 8 (1/2) | 13 (1/2) | never (0/2) | 0/2 |
| scout | 4 | 4 (2/2) | never (0/2) | 11 (2/2) | 13 (1/2) | never (0/2) | 0/2 |
| scout | 6 | 4 (2/2) | 5.5 (2/2) | 8 (2/2) | 13 (2/2) | never (0/2) | 0/2 |

## A (cont.). What happens at the gate: outcome of world assaults by variant

| variant | players | world assaults / match | Bando wins | tie | defender wins | player attacks on threats | camps killed camped | mean pieces / civ-round | mean pop / civ-round | civ-rounds with a degraded city |
|---|---|---|---|---|---|---|---|---|---|---|
| scout | 2 | 47.5 | 89% | 11% | 0% | 0 | 0 | 0.44 | 10.78 | 30% |
| scout | 4 | 49.5 | 100% | 0% | 0% | 0 | 0 | 0.15 | 14.59 | 11% |
| scout | 6 | 65.5 | 92% | 8% | 0% | 0 | 0 | 0.03 | 14.26 | 11% |
