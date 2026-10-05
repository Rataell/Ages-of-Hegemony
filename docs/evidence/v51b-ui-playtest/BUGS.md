# Bugs and defects found while playing through the UI

Found by `scripts/alpha-ui-playtest.mjs` (clicks only; see REPORT.md). Fixed items name the commit. Items marked **ENGINE/SERVER** were not fixed here (outside the UI scope of this round) and need an owner.

## Fixed (UI)

| # | Defect | Evidence | Fix |
|---|---|---|---|
| U-1 | **Pesquisar was disabled** with "Esta cidade já possui sua ação planejada nesta rodada" after the city had acted. Research is the Avanço Order (canon §2, fixed in the engine by 3020f26) but the UI gate still treated it as a city activation. A player with one city could not Produzir and Pesquisar in the same round. | `friction-*` in the first runs; REPORT §Friction | `cityActionGate` returns null for RESEARCH (308ed2d) |
| U-2 | **The selected city (and its neighbours) hid under the inspector.** The atlas was fitted to the whole viewport, so the right-hand hexes sat under the 380 px card; 9 of 30 hexes were covered at 1280×720. | `docs/evidence/v51b-map/before` | stage inset to the free area; fit to known hexes (308ed2d) |
| U-3 | The fit counted the unexplored `?` ring, so a tall territory shrank into a small island (hex 74 px instead of 83 px at 1366×768 after the first fix). | v51b-map metrics | fit to known hexes plus half a hex of fog (308ed2d) |

| U-4 | **A stale selection sent a dead piece with the next order.** After a Pioneiro founded a city, its id stayed in the selection; the next `MOVE` carried it and the server refused the whole order ("A ordem contém uma peça que não pertence a você"). Seen in the playtest log as a `RULE_FAILURE`. | `log-sample-ui-2p`, round 4 | selection pruned to live pieces (this commit) |
| U-5 | **The error banner covered the strip**, so Livro, Cofre and the civilization seal were unclickable until the banner was dismissed. In the 6p run the Livro click timed out 11 times under it. | `run-6p-quick/session.json` (`click-failed: open Livro`) | banner floats under the strip (this commit) |

## Open — ENGINE/SERVER (need an owner)

| # | Defect | Repro | Expected |
|---|---|---|---|
| E-1 | **Two RECRUIT actions planned in the same city with one Soldier are both accepted at planning**; the second fails at resolution ("Sem Soldado nem habitante Disponível para mobilizar") and the Order is lost. | 2p, warrior, city with pop 3 and 1 Soldier: plan `Recrutar Infantaria` in the first activation and `Recrutar` again in the second. Round 4 resolution shows "Ação não realizada". | The projection should mark the second Recrutar as blocked (Soldiers already reserved by the plan), or the UI should warn before confirming. |
| E-2 | **Version conflicts are frequent when 4–6 seats plan at the same time.** Every command from any seat bumps the version; the UI retries once and then shows "Estado atualizado por outra ação". At the start of a 4p/6p match several seats failed to confirm their ambitions and the table stayed on version 0. | `node scripts/alpha-ui-playtest.mjs --players=6` (first version of the driver, which did not retry). | By design (compare-and-swap, one retry). A person clicks again, but the first minute of a 6p table will show the banner. Decision for the owner: keep the single retry or allow 2–3 retries with jitter in `sendWithRecovery`. |

## Open — UI (design call, not fixed)

| # | Finding | Why it is not fixed here |
|---|---|---|
| D-1 | The **government reform picker lives at the bottom of the city card** (inspector, Cidade tab), under "Habitantes e papéis", "Distritos", "Edifícios". The Tabuleiro's Governo section shows the government but offers no action. A person looking for it in the Livro or the Tabuleiro will not find it. It was found only by reading the code. | Where it belongs is a layout decision (Tabuleiro Governo section is the natural home). |
| D-2 | The **Disponível** field says "Recém-chegado: arraste para um papel" but there is no drag: it is a number field plus "Aplicar distribuição". Canon §6 asks for draggable chips. | Feature, not a bug. |
| D-3 | **Ordering one piece out of a stack of two of the same class** (two Exploradores) requires opening "ver composição" and ticking a box; the class chip selects both and "Explorar região" then refuses ("Planejar com 2 peças"). Seen 8× in 6p. | Needs a design for single-piece selection. |
| D-4 | Pirata marker overlaps the city banner when the pirate sits on a hex next to the city (SEEDED shot). | Cosmetic. |
| D-5 | A reservation made with the first version race lost shows only the banner; the planned action is not highlighted as "not saved". | Copy/UX call. |
