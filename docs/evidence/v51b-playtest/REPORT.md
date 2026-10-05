# V5.1b — headless bot playtest

Matches: players 2/4/6 × seeds 1/2/3 = 9 full runs of up to 35 rounds, played only through the real command surface. Personalities: balanced, warrior, builder, trader, explorer, scholar.

> Bots are proxies. They play competently enough to reach every system, not optimally. Read each figure as "what the rules do when played by a reasonable but naive player". Human decision time is **not** measured here.

## Runs

| players | seed | rounds | status | winner | reason | crashes | violations | engine ms | commands/player-round |
|---|---|---|---|---|---|---|---|---|---|
| 2 | 1 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 8146 | 16.3 |
| 2 | 2 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 8527 | 17.24 |
| 2 | 3 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 11335 | 16.97 |
| 4 | 1 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 26128 | 16.14 |
| 4 | 2 | 35 | FINISHED | p2 | ROUND_LIMIT | 0 | 0 | 25815 | 15.09 |
| 4 | 3 | 35 | FINISHED | p4 | ROUND_LIMIT | 0 | 0 | 25901 | 15.51 |
| 6 | 1 | 35 | FINISHED | p5 | ROUND_LIMIT | 0 | 0 | 55716 | 15.47 |
| 6 | 2 | 35 | FINISHED | p3 | ROUND_LIMIT | 0 | 0 | 60837 | 15.29 |
| 6 | 3 | 35 | FINISHED | p6 | ROUND_LIMIT | 0 | 0 | 59438 | 15.11 |

## Do the 5 Orders create decisions or filler?

| players | order mix (Cidade/Expedição/Avanço/Influência/Legado) | entropy (max 2.32 bits) | repeats / player-round | rounds using ≤ 2 types |
|---|---|---|---|---|
| 2 | 58% / 21% / 9% / 12% / 1% | 1.65 | 1.42 | 74% |
| 4 | 59% / 24% / 7% / 10% / 0% | 1.56 | 1.31 | 78% |
| 6 | 67% / 18% / 7% / 8% / 0% | 1.38 | 1.46 | 82% |

## When do N6 / N7 appear?

| players | first N4 (round) | first N5 | first N6 | first N7 | final levels N1..N7 (all civilizations) |
|---|---|---|---|---|---|
| 2 | 26 (1/3 runs) | never (0/3) | never (0/3) | never (0/3) | 3 / 3 / 5 / 2 / 0 / 0 / 0 |
| 4 | never (0/3) | never (0/3) | never (0/3) | never (0/3) | 12 / 4 / 8 / 0 / 0 / 0 / 0 |
| 6 | never (0/3) | never (0/3) | never (0/3) | never (0/3) | 22 / 10 / 9 / 0 / 0 / 0 / 0 |

## Are the Cofres permanently full?

| resource | share of player-rounds at cap | share empty | discarded/round (ledger pools) |
|---|---|---|---|
| food | 0% | 69% | 0.41 |
| wood | 22% | 23% | - |
| stone | 20% | 14% | - |
| metal | 1% | 50% | - |
| wealth | 27% | 7% | 0.26 |
| knowledge | 27% | 13% | 0.26 |
| influence | 29% | 7% | 0.25 |
| culture | 0% | 68% | - |

## Does Governar trivialize Ânimo?

- Mean Ânimo (0–6): 1.29; share of cities at Revolta (0): 39%; at Abalada or worse (≤ 2): 79%.
- Governar per player-round: 1.02. Mean Ânimo in rounds with Governar: 0.59 vs without: 2.36.

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
| 2 | 1.67 | 31.33 | 0 | 0 | 31.33 | 0.67 | 3.01 | 4 |
| 4 | 1 | 38.33 | 0 | 0 | 38.33 | 1 | 2.58 | 4 |
| 6 | 2.33 | 48.67 | 0 | 0 | 48.67 | 1 | 3.4 | 5 |

## Ressonância

| players | Repercussões / civilization | composition mix |
|---|---|---|
| 2 | 1.83 | {"DOMINANT":7,"CONFLUENCE":1,"HYBRID":2,"PAIR":1} |
| 4 | 1.33 | {"PAIR":8,"DOMINANT":6,"CONFLUENCE":1,"HYBRID":1} |
| 6 | 1.06 | {"CONFLUENCE":4,"PAIR":9,"DOMINANT":4,"HYBRID":2} |

## Duration

- Engine time per round (mean): 763.76 ms; slowest round 3369 ms; whole 35-round match 31315.89 ms on average.
- Decisions per player-round (commands sent): 15.9. At roughly 8–15 s per decision plus reading time, a human round is about 3.2–6.4 min of planning → 35 rounds ≈ 111–223 min of pure planning (estimate; needs a human table to confirm).

## Coverage of the edge cases

| flag | 2p | 4p | 6p |
|---|---|---|---|
| famine | 3/3 | 3/3 | 3/3 |
| devastatedCity | 3/3 | 3/3 | 3/3 |
| overextension | 0/3 | 0/3 | 0/3 |
| n7 | 0/3 | 0/3 | 0/3 |
| ouChoice | 1/3 | 1/3 | 3/3 |
| heritage | 3/3 | 1/3 | 3/3 |
| repercussion | 3/3 | 3/3 | 3/3 |
| confluence | 1/3 | 1/3 | 2/3 |
| government | 2/3 | 3/3 | 3/3 |
| battle | 3/3 | 3/3 | 3/3 |
| fortification | 2/3 | 3/3 | 3/3 |
| siege | 0/3 | 0/3 | 0/3 |
| noSupply | 0/3 | 0/3 | 0/3 |
| band | 3/3 | 2/3 | 3/3 |
| pirate | 1/3 | 0/3 | 2/3 |
| hegemony | 0/3 | 0/3 | 0/3 |
| cityCaptured | 0/3 | 0/3 | 0/3 |
| n6 | 0/3 | 0/3 | 0/3 |

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
| n7 | no | yes |
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
| pirate | yes | yes |
| hegemony | no | yes |
| cityCaptured | no | yes |
| n6 | no | yes |

Every edge case was reached at least once.

## Defects

- No crashes or softlocks.
- No invariant violations (storage, negatives, population ≥ 1).

Most frequent rejected commands (bots probe the options, so rejections are expected): BUILD_PROJECT:RULE_FAILURE ×7466, URBAN_ACTION:RULE_FAILURE ×1295, QUEUE_ORDER:RULE_FAILURE ×793, PLAY_CARD:RULE_FAILURE ×514, LEADER_ABILITY:RULE_FAILURE ×51, MANAGE:INVALID_WORKED_HEXES ×30
