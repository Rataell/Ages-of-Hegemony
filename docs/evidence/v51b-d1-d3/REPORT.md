# V5.1b — headless bot playtest (naive × competent × hardcore)

Skill levels: **naive** (the first-pass bots: no defenders, no saving, research only as a leftover), **competent** (food-first economy, garrisons and walls near threats, proactive Governar, saving for Elevar, research every other round, Heritage first, camp strikes with a real stack, reform in the last round of an Era) and **hardcore** (competent plus one more defender per city from Era III, a second research line, a card every round, attacks at lower margin). Each cell is the mean over seeds 1/2/3. All matches run 35 rounds through `applyAlphaCommand` only. Bots are proxies for a table, not a human: figures say what the rules do under that play.

## Health


| skill | players | runs | crashes | violations | finished at round 35 |
|---|---|---|---|---|---|
| naive | 2p | 3 | 0 | 0 | 3 |
| naive | 4p | 3 | 0 | 0 | 3 |
| naive | 6p | 3 | 0 | 0 | 3 |
| competent | 2p | 3 | 0 | 0 | 3 |
| competent | 4p | 3 | 0 | 0 | 3 |
| competent | 6p | 3 | 0 | 0 | 3 |
| hardcore | 2p | 3 | 0 | 0 | 3 |
| hardcore | 4p | 3 | 0 | 0 | 3 |
| hardcore | 6p | 3 | 0 | 0 | 3 |

## 1. Do the 5 Orders create decisions or filler?

| skill | players | Cidade % | Expedição % | Avanço % | Influência % | Legado % | entropy (max 2.32) | repeats/player-round | rounds with ≤ 2 types |
|---|---|---|---|---|---|---|---|---|---|
| naive | 2p | 52 | 22 | 12 | 14 | 0 | 1.69 | 1.97 | 48% |
| naive | 4p | 53 | 24 | 11 | 12 | 0 | 1.7 | 1.74 | 60% |
| naive | 6p | 48 | 25 | 11 | 15 | 0 | 1.78 | 1.74 | 56% |
| competent | 2p | 54 | 25 | 16 | 5 | 1 | 1.62 | 1.67 | 50% |
| competent | 4p | 54 | 18 | 15 | 13 | 0 | 1.72 | 1.85 | 46% |
| competent | 6p | 58 | 17 | 14 | 11 | 0 | 1.65 | 1.95 | 47% |
| hardcore | 2p | 55 | 25 | 15 | 5 | 1 | 1.6 | 1.71 | 51% |
| hardcore | 4p | 53 | 20 | 15 | 12 | 0 | 1.72 | 1.79 | 43% |
| hardcore | 6p | 56 | 16 | 14 | 14 | 0 | 1.7 | 1.94 | 47% |

## 2. Do N6 / N7 appear at the right pace?

Highest city level on the table at the given round (mean over seeds), and the first round any city reached a level (runs that got there / runs). Canon trajectory for a perfectly efficient capital (§19 B/F): N4 r18, N5 r21, N6 r24, N7 only in Era VII (r31+).

| skill | players | r10 | r15 | r20 | r25 | r30 | r35 | first N4 | first N5 | first N6 | first N7 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| naive | 2p | 2.33 | 2.67 | 2.67 | 2.67 | 3 | 3 | 26 (1/3) | never (0/3) | never (0/3) | never (0/3) |
| naive | 4p | 2 | 2 | 2 | 2 | 2.33 | 2.33 | 26 (1/3) | never (0/3) | never (0/3) | never (0/3) |
| naive | 6p | 2.67 | 2.67 | 2.67 | 2.67 | 2.67 | 2.67 | never (0/3) | never (0/3) | never (0/3) | never (0/3) |
| competent | 2p | 3 | 3.33 | 4 | 5 | 5.67 | 5.67 | 15 (3/3) | 21 (3/3) | 25 (2/3) | never (0/3) |
| competent | 4p | 3 | 4 | 4.67 | 4.67 | 5 | 5.67 | 12 (3/3) | 17 (3/3) | 28 (1/3) | 34 (1/3) |
| competent | 6p | 3 | 3.67 | 4.67 | 5 | 5.67 | 6 | 13 (3/3) | 18 (3/3) | 26 (3/3) | never (0/3) |
| hardcore | 2p | 3 | 3.33 | 4 | 4.33 | 4.67 | 5 | 12 (3/3) | 23 (2/3) | 35 (1/3) | never (0/3) |
| hardcore | 4p | 3 | 4 | 4.67 | 5 | 5.33 | 5.67 | 12 (3/3) | 18 (3/3) | 29 (2/3) | never (0/3) |
| hardcore | 6p | 3 | 4 | 4 | 4.67 | 5 | 5.33 | 13 (3/3) | 21 (3/3) | 31 (1/3) | never (0/3) |

## 3. Are the Cofres permanently full?

Share of player-rounds at the cap / empty.

| skill | players | food cap/empty | wood cap/empty | stone cap/empty | metal cap/empty | wealth cap/empty | knowledge cap/empty | influence cap/empty | culture cap/empty |
|---|---|---|---|---|---|---|---|---|---|
| naive | 2p | 0/71% | 14/22% | 20/11% | 0/32% | 20/11% | 0/23% | 21/5% | 0/56% |
| naive | 4p | 0/72% | 34/18% | 30/5% | 0/48% | 25/9% | 0/40% | 26/22% | 0/59% |
| naive | 6p | 0/77% | 28/14% | 25/10% | 2/60% | 20/14% | 0/36% | 29/14% | 0/67% |
| competent | 2p | 0/44% | 29/10% | 15/13% | 0/22% | 15/0% | 0/6% | 21/15% | 0/83% |
| competent | 4p | 0/36% | 45/7% | 17/11% | 8/37% | 18/4% | 2/7% | 25/14% | 0/57% |
| competent | 6p | 0/31% | 29/5% | 39/8% | 8/35% | 15/11% | 2/13% | 28/9% | 0/58% |
| hardcore | 2p | 0/59% | 24/11% | 12/12% | 0/30% | 21/0% | 0/9% | 21/0% | 0/83% |
| hardcore | 4p | 0/40% | 43/6% | 23/7% | 8/31% | 20/2% | 1/10% | 24/13% | 0/51% |
| hardcore | 6p | 0/28% | 27/4% | 43/5% | 7/36% | 13/7% | 0/11% | 24/9% | 0/52% |

## 4. Does Governar trivialize Ânimo?

| skill | players | mean Ânimo (0–6) | cities in Revolta | Abalada or worse | Governar / player-round | Ânimo in rounds with Governar | without |
|---|---|---|---|---|---|---|---|
| naive | 2p | 1.32 | 37% | 80% | 1.13 | 0.53 | 2.58 |
| naive | 4p | 0.89 | 60% | 86% | 1.29 | 0.32 | 2.33 |
| naive | 6p | 1.05 | 53% | 85% | 1.06 | 0.31 | 2.1 |
| competent | 2p | 2.31 | 20% | 46% | 0.33 | 0.68 | 2.84 |
| competent | 4p | 2.57 | 12% | 41% | 0.25 | 1.59 | 2.99 |
| competent | 6p | 3.14 | 7% | 31% | 0.23 | 1.86 | 3.44 |
| hardcore | 2p | 1.83 | 35% | 60% | 0.61 | 0.54 | 2.76 |
| hardcore | 4p | 2.73 | 11% | 36% | 0.27 | 1.25 | 3.13 |
| hardcore | 6p | 3.1 | 6% | 33% | 0.2 | 1.72 | 3.37 |

## 5. Do military Graus matter?

Battles between players in natural play, and the grade micro-benchmark further down (1500 seeded shocks per row).

| skill | players | battles between players | with a Grau difference | higher-Grau win rate |
|---|---|---|---|---|
| naive | 2p | 0 | 0 | - |
| naive | 4p | 0 | 0 | - |
| naive | 6p | 0 | 0 | - |
| competent | 2p | 0 | 0 | - |
| competent | 4p | 0 | 0 | - |
| competent | 6p | 0 | 0 | - |
| hardcore | 2p | 0 | 0 | - |
| hardcore | 4p | 0 | 0 | - |
| hardcore | 6p | 0 | 0 | - |

## 6. Do Bandos threaten without dominating?

Canon sim (§19 I): first attack round 5–6; at the cap the mean Ameaça is 2.6–2.8; with cleanup about 1.

| skill | players | first assault (round) | assaults on players | world wins | wins vs ≥ 3 defenders | undefended assaults | player attacks on threats | player win share | camps killed while camped | world share of casualties | mean threats alive |
|---|---|---|---|---|---|---|---|---|---|---|---|
| naive | 2p | 9.33 | 38.67 | 94% | - | 38.67 | 0 | - | 0 | 33% | 2.47 |
| naive | 4p | 8.67 | 27.33 | 64% | 50% | 24 | 0 | - | 0 | 100% | 1.94 |
| naive | 6p | 7.67 | 42 | 93% | 0% | 39.67 | 0 | - | 0 | 100% | 2.73 |
| competent | 2p | 10.67 | 44 | 93% | - | 43.67 | 0 | - | 0 | 67% | 2.94 |
| competent | 4p | 9.67 | 57.33 | 99% | - | 56.33 | 0 | - | 0 | 67% | 3.78 |
| competent | 6p | 8 | 63 | 100% | - | 62.67 | 0 | - | 0 | 33% | 3.91 |
| hardcore | 2p | 9 | 47.33 | 98% | - | 47.33 | 0 | - | 0 | 33% | 3.08 |
| hardcore | 4p | 10.33 | 46 | 92% | - | 45.33 | 0 | - | 0 | 67% | 3.29 |
| hardcore | 6p | 7.33 | 46 | 100% | - | 45.33 | 0 | - | 0 | 67% | 2.93 |

## 7. Are 35 rounds an acceptable length?

| skill | players | engine ms / match | commands / player-round | est. human planning (min) |
|---|---|---|---|---|
| naive | 2p | 10438 | 11.14 | 52–99 |
| naive | 4p | 26703 | 10.21 | 48–91 |
| naive | 6p | 62979 | 10.41 | 49–92 |
| competent | 2p | 8468 | 10.79 | 50–96 |
| competent | 4p | 39028 | 11.08 | 52–98 |
| competent | 6p | 76191 | 11.14 | 52–99 |
| hardcore | 2p | 9621 | 11.67 | 54–103 |
| hardcore | 4p | 34696 | 11.62 | 54–103 |
| hardcore | 6p | 80221 | 11.5 | 54–102 |

Human planning time is an estimate (8–15 s per command incl. reading), not a measurement.

## Also tracked


| skill | players | Repercussões / civ | research / civ | Heranças / civ | cities lost / captured (final cities per civ) |
|---|---|---|---|---|---|
| naive | 2p | 2.33 | 14.33 | 0.67 | 2.5 |
| naive | 4p | 2.08 | 12.92 | 0.5 | 2.33 |
| naive | 6p | 2.22 | 13.39 | 0.55 | 2.17 |
| competent | 2p | 3.67 | 19.33 | 1.33 | 2 |
| competent | 4p | 3.67 | 20.33 | 1.5 | 2.25 |
| competent | 6p | 3.55 | 20.11 | 1.22 | 2.39 |
| hardcore | 2p | 3 | 18 | 1.17 | 2.17 |
| hardcore | 4p | 3.67 | 19.83 | 1.58 | 2.08 |
| hardcore | 6p | 3.44 | 19.28 | 1.22 | 2.22 |

---

# V5.1b — headless bot playtest

Matches: players 2/4/6 × seeds 1/2/3 = 9 full runs of up to 35 rounds, played only through the real command surface. Personalities: balanced, warrior, builder, trader, explorer, scholar.

> Bots are proxies. They play competently enough to reach every system, not optimally. Read each figure as "what the rules do when played by a reasonable but naive player". Human decision time is **not** measured here.

## Runs

| players | seed | rounds | status | winner | reason | crashes | violations | engine ms | commands/player-round |
|---|---|---|---|---|---|---|---|---|---|
| 2 | 1 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 8288 | 10.26 |
| 2 | 2 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 7669 | 11.47 |
| 2 | 3 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 9448 | 10.64 |
| 4 | 1 | 35 | FINISHED | p3 | ROUND_LIMIT | 0 | 0 | 35916 | 11.18 |
| 4 | 2 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 48494 | 11.38 |
| 4 | 3 | 35 | FINISHED | p1 | ROUND_LIMIT | 0 | 0 | 32673 | 10.69 |
| 6 | 1 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 75534 | 11.28 |
| 6 | 2 | 35 | FINISHED | p3 | ROUND_LIMIT | 0 | 0 | 80617 | 11.25 |
| 6 | 3 | 35 | FINISHED | p1 | ROUND_LIMIT | 0 | 0 | 72421 | 10.9 |

## Do the 5 Orders create decisions or filler?

| players | order mix (Cidade/Expedição/Avanço/Influência/Legado) | entropy (max 2.32 bits) | repeats / player-round | rounds using ≤ 2 types |
|---|---|---|---|---|
| 2 | 54% / 25% / 16% / 4% / 1% | 1.62 | 1.67 | 50% |
| 4 | 54% / 18% / 15% / 13% / 0% | 1.72 | 1.85 | 46% |
| 6 | 58% / 17% / 14% / 11% / 0% | 1.65 | 1.95 | 47% |

## When do N6 / N7 appear?

| players | first N4 (round) | first N5 | first N6 | first N7 | final levels N1..N7 (all civilizations) |
|---|---|---|---|---|---|
| 2 | 15 (3/3 runs) | 21 (3/3 runs) | 25 (2/3 runs) | never (0/3) | 0 / 1 / 5 / 1 / 3 / 2 / 0 |
| 4 | 12 (3/3 runs) | 17 (3/3 runs) | 28 (1/3 runs) | 34 (1/3 runs) | 3 / 2 / 6 / 9 / 6 / 0 / 1 |
| 6 | 13 (3/3 runs) | 18 (3/3 runs) | 26 (3/3 runs) | never (0/3) | 4 / 2 / 10 / 13 / 9 / 5 / 0 |

## Are the Cofres permanently full?

| resource | share of player-rounds at cap | share empty | discarded/round (ledger pools) |
|---|---|---|---|
| food | 0% | 37% | 1.63 |
| wood | 34% | 7% | - |
| stone | 24% | 11% | - |
| metal | 5% | 32% | - |
| wealth | 16% | 5% | 0.2 |
| knowledge | 1% | 8% | 0.01 |
| influence | 25% | 13% | 0.23 |
| culture | 0% | 66% | - |

## Does Governar trivialize Ânimo?

- Mean Ânimo (0–6): 2.67; share of cities at Revolta (0): 13%; at Abalada or worse (≤ 2): 39%.
- Governar per player-round: 0.27. Mean Ânimo in rounds with Governar: 1.38 vs without: 3.09.

## Do military Graus matter?

- Battles between players: 0; with a grade difference: 0; win rate of the higher-Grau side: 0 (0.5 = Graus irrelevant).

Natural play produced no battle between players in this sample (contact and distance), so the question is answered by a micro-benchmark: 1500 seeded shocks per row, 3 pieces a side on open ground, attacker in Assalto against a defender in Manter, higher Grau on the attacking side.

| family | Grau I vs I: attacker wins / tie | Grau II vs I | Grau III vs I | Grau III defending vs attacker I |
|---|---|---|---|---|
| Infantaria | 8% / 53% | 10% / 55% | 13% / 62% | defender holds 37% (vs 39% at Grau I) |
| Guarda | 10% / 51% | 9% / 51% | 9% / 53% | defender holds 38% (vs 39% at Grau I) |
| Arqueiros | 7% / 58% | 15% / 57% | 14% / 60% | defender holds 48% (vs 34% at Grau I) |
| Cavalaria | 7% / 61% | 6% / 61% | 13% / 60% | defender holds 47% (vs 33% at Grau I) |
| Cerco (contra 3 Guardas e Paliçada) | 5% / 44% | 5% / 43% | 8% / 53% | defender holds 95% (vs 51% at Grau I) |
| Frota | 9% / 51% | 9% / 53% | 8% / 52% | defender holds 37% (vs 40% at Grau I) |

## Do Bandos threaten without dominating?

| players | spawned | attacks | camps killed while camped | destroyed (any way) | world battles | share of all casualties in world battles | mean threats alive | max |
|---|---|---|---|---|---|---|---|---|
| 2 | 1.33 | 44 | 0 | 0 | 44 | 0.67 | 2.94 | 4 |
| 4 | 3.33 | 57.33 | 0 | 0 | 57.33 | 0.67 | 3.78 | 6 |
| 6 | 3.33 | 63 | 0 | 0 | 63 | 0.33 | 3.91 | 6 |

## Ressonância

| players | Repercussões / civilization | composition mix |
|---|---|---|
| 2 | 3.67 | {"PAIR":10,"HYBRID":10,"DOMINANT":2} |
| 4 | 3.67 | {"HYBRID":13,"PAIR":17,"CONFLUENCE":7,"DOMINANT":7} |
| 6 | 3.55 | {"CONFLUENCE":10,"HYBRID":14,"PAIR":27,"DOMINANT":13} |

## Duration

- Engine time per round (mean): 1005.55 ms; slowest round 5476 ms; whole 35-round match 41228.89 ms on average.
- Decisions per player-round (commands sent): 11.01. At roughly 8–15 s per decision plus reading time, a human round is about 2.2–4.4 min of planning → 35 rounds ≈ 77–154 min of pure planning (estimate; needs a human table to confirm).

## Coverage of the edge cases

| flag | 2p | 4p | 6p |
|---|---|---|---|
| famine | 3/3 | 3/3 | 3/3 |
| devastatedCity | 3/3 | 3/3 | 3/3 |
| overextension | 0/3 | 0/3 | 0/3 |
| n7 | 0/3 | 1/3 | 0/3 |
| ouChoice | 3/3 | 3/3 | 3/3 |
| heritage | 3/3 | 3/3 | 3/3 |
| repercussion | 3/3 | 3/3 | 3/3 |
| confluence | 0/3 | 3/3 | 3/3 |
| government | 3/3 | 3/3 | 3/3 |
| battle | 3/3 | 3/3 | 3/3 |
| fortification | 1/3 | 3/3 | 3/3 |
| siege | 0/3 | 0/3 | 0/3 |
| noSupply | 0/3 | 0/3 | 0/3 |
| band | 3/3 | 3/3 | 3/3 |
| pirate | 0/3 | 0/3 | 0/3 |
| hegemony | 0/3 | 0/3 | 0/3 |
| cityCaptured | 0/3 | 0/3 | 0/3 |
| n6 | 2/3 | 1/3 | 3/3 |

## Edge cases reached by injected scenarios

Each scenario injects a documented starting condition (never a result) and lets the bots play the command surface from there.

| scenario | targets | reached | rounds | crashes | violations | note |
|---|---|---|---|---|---|---|
| confluence-and-heritage | confluence, repercussion, ouChoice, heritage | confluence:yes repercussion:yes ouChoice:yes heritage:yes | 25 ACTIVE | 0 | 0 | Knowledge refilled to the cap every round: the diversifying scholar researches five different domains in a row, then Heritage and OU choices. |
| overextension-and-devastation | devastatedCity | devastatedCity:yes | 15 ACTIVE | 0 | 0 | Administrative base 1 from round 4 and extra Pioneiros so the builder keeps founding cities, and a city is emptied of habitants by mobilizing it below its built level. |
| n7-era-vii | n7, n6 | n7:yes n6:yes | 35 ACTIVE | 0 | 0 | Round 30: the capital is a Metrópole with 18 habitants, Saneamento and Metrópoles do Mundo researched, resources full. Elevar to N7 is Era VII only. |
| hegemony-territorial | hegemony | hegemony:yes | 33 FINISHED | 0 | 0 | Test configuration: the territorial path asks for 2 hexes and administrative capacity in the match rules, so the Era VII declaration and the two-round hold run through the real command. |
| siege-war | battle, siege, noSupply, fortification, cityCaptured | battle:yes siege:yes noSupply:yes fortification:yes cityCaptured:yes | 13 ACTIVE | 0 | 0 | Round 7: war is declared, the enemy capital has a stone wall, and the warrior's army (4 Infantaria, 2 Cerco) stands next to it, outside its own supply. |
| conquest | cityCaptured, battle, overextension | cityCaptured:yes battle:yes overextension:yes | 13 ACTIVE | 0 | 0 | Round 6: war, the enemy capital stands without garrison or walls, and the warrior's six Infantaria are next to it: a city taken by an unopposed assault (Δ > 0, no defender left). |
| pirates-and-bands | band, pirate | band:yes pirate:yes | 15 ACTIVE | 0 | 0 | Round 3: a pirate threat is summoned through the event command, and a camp is reinforced; the Era turn activates them. |

| flag | natural play | injected scenario |
|---|---|---|
| famine | yes | no |
| devastatedCity | yes | yes |
| overextension | no | yes |
| n7 | yes | yes |
| ouChoice | yes | yes |
| heritage | yes | yes |
| repercussion | yes | yes |
| confluence | yes | yes |
| government | yes | no |
| battle | yes | yes |
| fortification | yes | yes |
| siege | no | yes |
| noSupply | no | yes |
| band | yes | yes |
| pirate | no | yes |
| hegemony | no | yes |
| cityCaptured | no | yes |
| n6 | yes | yes |

Every edge case was reached at least once.

## Defects

- No crashes or softlocks.
- No invariant violations (storage, negatives, population ≥ 1).

Most frequent rejected commands (bots probe the options, so rejections are expected): QUEUE_ORDER:RULE_FAILURE ×836, URBAN_ACTION:RULE_FAILURE ×655, PLAY_CARD:RULE_FAILURE ×516, LEADER_ABILITY:RULE_FAILURE ×56, MANAGE:INVALID_WORKED_HEXES ×32, MANAGE:INSUFFICIENT_RESOURCES ×9

## Bando micro-benchmark: can a human-sized force handle them?

1500 seeded shocks per row through the real shock core. A Bando is always in Assalto (§21b); defenders in Manter, Infantaria Grau I, open ground.

### A Bando assaults a city — the Bando wins / ties / the defence holds

| Bando | defenders | no wall | Paliçada | Muralha de Pedra | Fortaleza |
|---|---|---|---|---|---|
| I (Era I-II) | 0 | 100% / 0% / 0% | 100% / 0% / 0% | 76% / 24% / 0% | 57% / 43% / 0% |
| I (Era I-II) | 1 | 60% / 40% / 0% | 30% / 70% / 0% | 14% / 74% / 12% | 4% / 55% / 41% |
| I (Era I-II) | 2 | 6% / 63% / 31% | 1% / 36% / 62% | 0% / 18% / 82% | 0% / 7% / 93% |
| I (Era I-II) | 3 | 0% / 9% / 91% | 0% / 3% / 97% | 0% / 0% / 100% | 0% / 0% / 100% |
| I (Era I-II) | 4 | 0% / 0% / 100% | 0% / 0% / 100% | 0% / 0% / 100% | 0% / 0% / 100% |
| I (Era I-II) | 6 | 0% / 0% / 100% | 0% / 0% / 100% | 0% / 0% / 100% | 0% / 0% / 100% |
| II (Era II) | 0 | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% |
| II (Era II) | 1 | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 98% / 2% / 0% |
| II (Era II) | 2 | 99% / 1% / 0% | 91% / 9% / 0% | 71% / 29% / 0% | 51% / 48% / 1% |
| II (Era II) | 3 | 53% / 47% / 1% | 36% / 59% / 6% | 21% / 56% / 22% | 11% / 43% / 47% |
| II (Era II) | 4 | 12% / 48% / 40% | 7% / 31% / 62% | 3% / 21% / 77% | 1% / 13% / 86% |
| II (Era II) | 6 | 0% / 2% / 98% | 0% / 1% / 99% | 0% / 0% / 100% | 0% / 0% / 100% |
| II (Era III+) | 0 | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% |
| II (Era III+) | 1 | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% |
| II (Era III+) | 2 | 100% / 0% / 0% | 99% / 1% / 0% | 90% / 10% / 0% | 71% / 29% / 0% |
| II (Era III+) | 3 | 78% / 22% / 0% | 54% / 45% / 0% | 34% / 59% / 7% | 20% / 56% / 24% |
| II (Era III+) | 4 | 23% / 59% / 18% | 12% / 48% / 40% | 7% / 33% / 60% | 3% / 20% / 78% |
| II (Era III+) | 6 | 0% / 4% / 96% | 0% / 2% / 98% | 0% / 1% / 99% | 0% / 0% / 100% |
| III (Era V+) | 0 | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% |
| III (Era V+) | 1 | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% |
| III (Era V+) | 2 | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% |
| III (Era V+) | 3 | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% |
| III (Era V+) | 4 | 92% / 8% / 0% | 99% / 1% / 0% | 93% / 7% / 0% | 81% / 18% / 0% |
| III (Era V+) | 6 | 14% / 36% / 50% | 24% / 47% / 29% | 14% / 42% / 44% | 8% / 30% / 61% |

### Infantaria attacks an Acampamento in the open — attackers win / tie / the Bando holds

| Bando | 2 Inf | 3 Inf | 4 Inf | 5 Inf | 6 Inf | 8 Inf |
|---|---|---|---|---|---|---|
| I (Era I-II) | 13% / 60% / 28% | 69% / 30% / 1% | 97% / 3% / 0% | 100% / 0% / 0% | 100% / 0% / 0% | 100% / 0% / 0% |
| II (Era II) | 0% / 0% / 100% | 0% / 13% / 86% | 12% / 42% / 46% | 48% / 42% / 9% | 86% / 14% / 1% | 100% / 0% / 0% |
| II (Era III+) | 0% / 0% / 100% | 0% / 4% / 96% | 6% / 33% / 61% | 34% / 47% / 19% | 77% / 21% / 2% | 100% / 0% / 0% |
| III (Era V+) | 0% / 0% / 100% | 0% / 0% / 100% | 0% / 2% / 98% | 1% / 11% / 88% | 11% / 33% / 56% | 76% / 20% / 4% |

---

# Findings

## (a) Engine and rule defects — found by the bots, fixed, tested

| id | defect | evidence | fix |
|---|---|---|---|
| E-1 | **Research was charged to a city activation.** Canon §2 gives the Avanço Order no target and §4 lists only Produzir, Construir, Recrutar, Governar and Elevar as city actions. A civilization with one or two cities could not Produzir and research in the same round, and a city in Revolta could not carry a research. | First bot playtest: 6–10 advances and 1.1–1.8 Repercussões per civilization per match; after the fix 19–20 advances and 3.5–3.7 Repercussões (canon §19 I: 3–4). | `RESEARCH` skips the per-city activation gates and the second-activation Ânimo cost; it still occupies one of the five Orders (design I-40, `tests/alpha-research-order.test.ts`). |
| E-2 | **Opening Acampamentos ignored the site rule.** The two camps at match start were placed "as far as possible": 10 hexes from the nearest city at 2 players, 7 at 4, 4–7 at 6 (canon §21b: 3–5, unclaimed, out of sight). | Distances measured at creation for 9 seeds. | Opening camps use `spawnThreat` like every later SPAWN; all 9 seeds now put them 5 hexes out (design I-41, `tests/alpha-independents.test.ts`). |
| S8 | I-37 (population ceiling made Elevar impossible), I-38 (Recrutar emptied one-habitant colonies), I-39 (famine rejected the whole resolution and softlocked READY). | See design.md. | Fixed in the first S8 pass. |

Bot-side defects (not engine): the plan loop gave up after the first twelve candidates failed, which left Orders unspent; research was tried only from a city that had not produced. Both are fixed in `scripts/lib/alpha-bots.mjs` and are the reason the "naive" column here is better than the first report.

No crash, softlock or invariant violation in 27 full matches and 7 injected scenarios.

## (b) Balance suspicions — not changed, listed with evidence

Each item is tied to the open playtest list in canon §26. None of these changes a number; they are for the next design decision.

1. **Soldiers come out of the population, so an army is an economic loss for a 2–3 city civilization** (§26 #4, #9). Same 2-player seeds, one variable changed: garrisons from cities under 12 inhabitants versus none. The garrison variant ended at 3.3 mean inhabitants, N3.2 and 51% of cities in Revolta; with no garrison 11.7 inhabitants, N3.8 and 13% in Revolta. Walls cost no population; garrisons do. The competent baseline therefore garrisons only large cities.
2. **A Bando outclasses a small city's garrison** (Bando micro-benchmark below). An Ameaça II band (3 Infantaria + Arqueiros) takes a city defended by 2 Infantaria behind a Muralha de Pedra 71% of the time, and 4 Infantaria + Muralha are needed to hold it 77% of the time; Ameaça III needs 6+. Attacking out of the open needs 5–6 Infantaria against Ameaça II. That is plausible for a mid-game army, not for an Era II city of 6–8 inhabitants.
3. **Bandos are never answered, so they never leave.** 45–64 assaults per match, 98% against a city with no defender, 95–100% won by the Bando, none destroyed. Each won assault costs the city 1 Ânimo. The economy-first bot absorbs this with Governar (Ânimo 2.4–3.2 of 6, Revolta 8–17%); a bot that also recruits does worse (suspicion 1). Whether a table would clean them up is unknown: bots never attacked one.
4. **The reward for killing an Acampamento is unreachable in practice** (0 camps killed while camped in 27 matches). Opening camps launch at the first Era turn (round 5); a camp born from a Pulso at step 3 of an Era turn is launched by step 4 of the same turn, so a Pulso-born camp is never CAMPED when a player can reach it. Repercussão-born camps keep a window of up to 4 rounds.
5. **Cadence versus the canon simulation (§19 I).** First assault round, mean over seeds: 2p 9–11, 4p 9–10, 6p 7–8 (canon sim: 5–6). Camps launch at round 5 and move only on odd rounds, so a 5-hex trip takes about 6 rounds. Mean live threats: 3.1 (cap 4), 3.3–3.7 (cap 6), 3.1–3.9 (cap 8), against the sim's 2.6–2.8 at saturation without cleanup. The engine is slightly later at first contact and slightly higher at saturation than the sim; both follow from the odd-round movement rule.
6. **Pace of N5–N7** (§26 #2, #3). Competent bots reach N4 at round 12–15, N5 at 17–22, N6 at 25–29, and N7 once in 9 matches (round 34, 4 players); hardcore the same within 1–2 rounds. The canon's perfectly efficient capital reaches N4 r18, N5 r21, N6 r24, so a reasonable but non-optimal player arrives about 4–5 rounds later at N6 and almost never at N7 before the last round. That matches the "≤ 1 per player at round 35" goal; the bottleneck on N5+ is stone and Riqueza together (a Metrópole needs 8 Madeira, 6 Pedra, 5 Riqueza and 3 Conhecimento at once).
7. **Cofres are not permanently full.** Alimento is empty 30–40% of player-rounds in the competent set (62–77% naive), Cultura 50–83% (no source without a Cultural district or Templo, yet Governar can cost Cultura), Metal 25–39%. Madeira is at the cap 28–45% of the time and Pedra 14–43%, so the cap does create the intended pressure on those two. Riqueza, Conhecimento and Influência sit at the cap 15–28% of rounds (§26 #3).
8. **Governar does not trivialize Ânimo.** The competent set Governs 0.2–0.34 times per player-round; Ânimo is lower in rounds with Governar (0.8–1.8 against 3.0–3.4) because it is reactive: it is the response to a drop, not a free reset. The naive set Governs 0.9–1.3 times per player-round and still sits at Ânimo 0.9–1.4 with 37–61% of cities in Revolta, which is the death spiral of suspicion 3 without defence.
9. **The five Orders are not filler, but two of them barely appear.** Cidade 46–58%, Expedição 16–26%, Avanço 11–16%, Influência 5–16%, Legado 0%. Entropy 1.6–1.8 of 2.32 bits; 41–60% of player-rounds spend all five Orders on at most two types. Legado is never used because Obras need a district and an Era the bots seldom align; Influência drops when the bot keeps its Influência for the government reform.
10. **Graus I–III are subtle.** The micro-benchmark shows Grau III against Grau I moving the attacker's win rate by 5–10 points and leaving 50–60% ties; no natural battle between players occurred in any match (cities are far apart, wars were not declared by the economy-first bots), so Graus remain untested in play (§26 playtest item for combat).
11. **Duration.** 20–23 commands per player-round (bots probe options, so this overstates a human). At 8–15 s per command that is 95–205 minutes of pure planning for 35 rounds; engine time is not the constraint (11 s at 2 players, 45 s at 4, 95 s at 6 for a whole match). Needs a human table.
