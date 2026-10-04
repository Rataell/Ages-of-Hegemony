# Rules V5.1a → engine

## Why

`docs/product/rules-v5-proposal.md` (V5.1a FINAL) is the canonical baseline. The running Alpha still implements the pre-V5 ruleset: 7 resources, Estabilidade 0–100, Desenvolvimento 1–5, 7 urban actions, 7 actions per round, a generated 50-node Web with no real unlocks, no population roles, no Elevar, administration by Capacity sum. When code and canon diverge, the code migrates.

## What changes (by dependency)

1. **game-domain** — 8 resources with limits 15/10 and hard caps 30/20; city ladder (7 levels, built level + population roles + effective Capacity); 8 districts and slots; Elevar table; administration load/capacity; Web 40 + 10 Convergences with real prerequisites and unlocks; Heritage 18 × 3; 5 Orders and the command surface (ELEVATE, REDISTRIBUTE, DEMOBILIZE, government via Influência).
2. **game-engine** — planning with 5 Orders; Cidade: Produzir / Construir / Recrutar / Governar / Elevar reading Capacity as activation power; redistribution locked on READY; sustenance 1 per 2, Crescer 3; mobilization lifecycle; storage with caps; universal and Heritage research with unlocks; administration and Sobre-extensão as Ânimo/activation effects. Estabilidade, Coesão and Desenvolvimento leave the rules (fields stay only until the migration removes them).
3. **server projection** — allow-list extended (roles, built level, effective Capacity, orders usage, Web/Heritage, administration); privacy test re-pinned; CAS and determinism intact.
4. **web V2.2** — tray with 5 Orders; city seal `N·Capacidade` (and `2/3` when degraded); roles strip; Elevar card; Cofre with 8 resources; Livro·Teia 40 + 10 + Heritage; Ânimo/Administration feedback.
5. **remaining systems** — Leaders, Manobras, Ambições, Pressão/Pulso (no reset at Era turn), Governos (Influência Order), Hegemonia (Era VII), then combat/naval/diplomacy reconciliation.

## Non-goals

No new design. Playtest numbers stay as listed in the canon §26. No push, merge, deploy.
