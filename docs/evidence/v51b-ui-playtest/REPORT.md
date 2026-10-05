# Playtest through the real UI — 2, 4 and 6 seats

Date 2026-10-05 · branch `fix/aoh-alpha-correctness-pre-v2` · rules V5.1b · preset **QUICK** (7 Eras × 3 rounds = 21 rounds).

## What was done and how

`scripts/alpha-ui-playtest.mjs` plays a table through **clicks only** in Chromium against `npm run dev:alpha`. It reads what the screen already shows (the projection the page itself polls, taken from its own network responses, so it adds no requests) and decides like a person: opens the Tabuleiro, the Teia, the city card, the Livro; picks options by the seat's strategy; confirms. It never POSTs a command and never imports engine rules. When a control is missing, covered or disabled it records the friction instead of working around it.

Strategies per seat: expansionist, warrior, scholar, trader, diplomat, builder (cycled). Every session below is **NATURAL** (no seeded state, no reveal-map). The seeded images are in `seeded/` and labelled SEEDED.

| Session | Seats | Rounds | Wall time | Ended | UI clicks | Friction events |
|---|---|---|---|---|---|---|
| `run-2p-quick` | expansionist, warrior | 21 | 8 min | round limit (Prestígio) | 1 399 | 5 (all "no government open yet") |
| `run-2p-reform` | trader, trader | 21 | 6 min | round limit | 904 | 8 (same) |
| `run-4p-quick` | + scholar, trader | 21 | 10 min | round limit | 2 598 | 24 |
| `run-6p-quick` | + diplomat, builder | 21 | 12 min | round limit | 4 057 | 76 |

A STANDARD (35-round) table was **not** played through the UI: 6 seats × 35 rounds is ~25 min of driver time per run and QUICK already crosses every Era turn. The planning time below is the driver's, not a human's.

## Contact between players (item 5)

| Table | First contact | First shared border | First treaty | First war | First player-vs-player combat |
|---|---|---|---|---|---|
| 2p expansionist / warrior | round 18 | not seen | 21 | 20 | none |
| 2p trader / trader | **never** | — | — | — | — |
| 4p | round 9 | not seen | 12 | 11 | **12** |
| 6p | round 3 | not seen | 12 | 8 | none |

- In 2p the two civilizations did not meet until round 18 of 21 (the driver explores a little each round; capitals are 6–8 hexes apart). One 2p table never met at all. This is the "each player alone for two thirds of the match" failure the Alpha must avoid. **It needs a human to tell whether it is the map, the pace of exploration or the strategies**; the data says a 2p QUICK table does not force contact.
- 4p and 6p make contact early (rounds 3 to 9). Treaties follow 3–9 rounds later. Only the 4p table produced player-vs-player combat (3 combats); 6p declared war in round 8 and never fought.
- "Shared border" is detected from the hexes a seat can see (two adjacent claimed hexes of different owners). It never fired, so "no table reached a border" holds only for what was visible.

## What the tables looked like at the end (round 21)

Everyone ended small: biggest city **N3**, most civilizations with one or two cities of 1–7 inhabitants. Nobody reached N4. Only the scholar seats got deep into the Teia (19 and 14 advances), and the two highest Prestígio scores came from research and Obras, not from conquest.

- **Starvation shapes the match.** The warrior seats recruited Soldiers out of cities of 2–4 inhabitants (canon §6), stopped growing and stayed at N1 with 1–3 inhabitants for the whole match. The expansionist in the 2p table fell from N3/8 to N3/6 plus two N1/1 colonies.
- **Bandos hurt the same seat repeatedly.** In the 2p table one seat suffered 18 battles against the world and the other 7. In 4p one seat took 21. A Bando II attack on an undefended capital was recorded as "Ataque 14 × Defesa 1, Δ +13". The Bando is visible rounds before (the dashed line to the city) and the driver did not react; a person would. This matches F1's finding that a city without defenders loses.
- **Orders.** Average 3.4–3.7 of 5 Orders planned per seat-round. Cidade 26–63 %, Expedição 32–66 %, Avanço 5–12 %, Influência 0–2 %, **Legado 0 %**. The driver has no Legado intent (it never opened Obras), so this does not show that Legado is dominated; it shows the UI never gave the driver a reason to choose it.
- **Planning time (driver)**: 9–26 s per seat-round; the driver plays at the pace of its clicks, not of thought.

## Friction and dead-ends (what a person would feel)

Fixed in this round (details and commits in `BUGS.md`):

1. **Pesquisar disabled by the city's activation**: a real rule/UI contradiction, research is the Avanço Order. (U-1)
2. **Selected city and neighbours hidden under the inspector**: 9 of 30 hexes covered at 1280×720. (U-2, U-3)
3. **Dead piece in the selection** after a Pioneiro founded a city, so the whole order was refused. (U-4)
4. **Error banner over the strip** blocked Livro, Cofre and the seal. (U-5)

Seen and not fixed (see `BUGS.md`):

- Version-race banner "Estado atualizado por outra ação": 0 in the 2p tables, 3 in 4p, 15 in 6p (all at the start of a match, when every seat confirms ambitions at once). The UI's single automatic retry loses when several seats act in the same second. A person clicks again; in the first minute of a 6p table they will see the banner. Decision for the owner (E-2).
- **Two Recrutar planned in a city with one Soldier are both accepted; the second fails at resolution** and the Order is lost (E-1).
- The government reform picker is at the bottom of the city card, where nobody looks (D-1). One seat reserved Oligarquia naturally (`run-2p-reform` shots) only because the driver was told where it is.
- No drag for the population chips (D-2); one piece of a stack of two needs "ver composição" (D-3).

Worked without friction: ambitions (after the retry), the Pulso/Encontro/Repercussão parchments, Elevar and its three conditions, the Tabuleiro (Teia nodes, Herança, Reserva de Marcos), the research flow, the conflict call, the Era-turn panel with its single "Confirmar Virada", the finale.

## Map experience (item 6)

`docs/evidence/v51b-map/{before,after}` at 1366×768, 1440×900 and 1280×720, with `metrics-*.json`.

| | Before | After |
|---|---|---|
| Hexes hidden under a panel (1280×720, inspector open) | 9 of 30 | **0** of 34–39 |
| Hexes hidden (1366×768 / 1440×900, inspector open) | 2 / 6 | **0 / 0** |
| Selected city under the inspector | yes (it sat at the edge of the card) | no |
| Global scroll in the match | none | none |

The fit now frames the **known** hexes (plus half a hex of fog so explore targets stay visible and clickable) inside the free rectangle between the strip, the tray and the open inspector. The territory is tall in most tables, so it is height-bound: hex width is 68–101 px depending on viewport and shape, using 81–86 % of the free height and only 45–53 % of the width. That is the shape of the territory, not wasted layout. The `<svg>` stays full-bleed (the e2e rule "the map is the table" holds); only its viewport is padded.

## Evidence index

NATURAL (played through the UI):

| Item | File |
|---|---|
| Combat against the world, Δ and "venceu de forma decisiva" | `run-4p-quick/shots/Jogador-A-city-degraded.png` (resolution panel); `*-combat-first-world.png` in each run |
| Player-vs-player combat | `run-4p-quick/shots/*-combat-first-pvp.png` |
| City with degraded Capacidade | `run-4p-quick/shots/Jogador-A-city-degraded.png`, `run-6p-quick/shots/Jogador-{A,D,F}-city-degraded.png` |
| Threat visible with its target line | `*-threat-visible.png` in 4p and 6p |
| Era turn | `*-era-turn.png` |
| Government reform list and reservation | `run-2p-reform/shots/Jogador-{A,B}-government-reform-{list,reserved}.png` |
| End of match (round limit, standings) | `*-finale.png` |
| Tabuleiro, research flow | `*-tabuleiro-open.png`, `*-after-research.png` |

SEEDED (state built with the engine, only to check how it looks): `seeded/SEEDED-acampamento-antes-de-ativar.png`, `SEEDED-bando-em-marcha.png`, `SEEDED-pirata-no-mar.png`, `SEEDED-cidade-n6.png`, `SEEDED-cidade-n7.png`, `SEEDED-cidade-capacidade-degradada.png`.

NOT obtained naturally: **N6 and N7** (no table passed N3), **Pirata** (no coast threat came into sight), **Acampamento before activation** (see F1's investigation; the seeded image shows how the UI draws it), **victory by Hegemonia** (every table ended on the round limit).

## Limits of this report

- The driver is a competent clicker, not a person. It does not read tips, does not hesitate and ignores threats it can see. Its friction list is a lower bound for UI problems and says nothing about comprehension.
- Only QUICK. STANDARD pacing (5 rounds per Era) was exercised by the headless bots (`docs/evidence/v51b-playtest/`), not by the UI.
- `log-sample-ui-2p/` shows what `ALPHA_PLAYTEST_LOG=1` records for a UI-driven table (planning time, rejected commands with code and message, Orders, threats).
