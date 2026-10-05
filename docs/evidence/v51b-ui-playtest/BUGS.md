# Bugs and defects found while playing through the UI

Found by `scripts/alpha-ui-playtest.mjs` (clicks only; see REPORT.md). Fixed items name the commit. Items marked **ENGINE/SERVER** were not fixed here (outside the UI scope of this round) and need an owner.

## Fixed (UI)

| # | Defect | Evidence | Fix |
|---|---|---|---|
| U-1 | **Pesquisar was disabled** with "Esta cidade já possui sua ação planejada nesta rodada" after the city had acted. Research is the Avanço Order (canon §2, fixed in the engine by 3020f26) but the UI gate still treated it as a city activation. A player with one city could not Produzir and Pesquisar in the same round. | `friction-*` in the first runs; REPORT §Friction | `cityActionGate` returns null for RESEARCH (308ed2d) |
| U-2 | **The selected city (and its neighbours) hid under the inspector.** The atlas was fitted to the whole viewport, so the right-hand hexes sat under the 380 px card; 9 of 30 hexes were covered at 1280×720. | `docs/evidence/v51b-map/before` | stage inset to the free area; fit to known hexes (308ed2d) |
| U-3 | The fit counted the unexplored `?` ring, so a tall territory shrank into a small island (hex 74 px instead of 83 px at 1366×768 after the first fix). | v51b-map metrics | fit to known hexes plus half a hex of fog (308ed2d) |

## Open — ENGINE/SERVER (need an owner)

| # | Defect | Repro | Expected |
|---|---|---|---|
| E-1 | **Two RECRUIT actions planned in the same city with one Soldier are both accepted at planning**; the second fails at resolution ("Sem Soldado nem habitante Disponível para mobilizar") and the Order is lost. | 2p, warrior, city with pop 3 and 1 Soldier: plan `Recrutar Infantaria` in the first activation and `Recrutar` again in the second. Round 4 resolution shows "Ação não realizada". | The projection should mark the second Recrutar as blocked (Soldiers already reserved by the plan), or the UI should warn before confirming. |
| E-2 | **Version conflicts are frequent when 4–6 seats plan at the same time.** Every command from any seat bumps the version; the UI retries once and then shows "Estado atualizado por outra ação". At the start of a 4p/6p match several seats failed to confirm their ambitions and the table stayed on version 0. | `node scripts/alpha-ui-playtest.mjs --players=6` (first version of the driver, which did not retry). | By design (compare-and-swap, one retry). A person clicks again, but the first minute of a 6p table will show the banner. Decision for the owner: keep the single retry or allow 2–3 retries with jitter in `sendWithRecovery`. |
