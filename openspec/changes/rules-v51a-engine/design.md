# Design notes

## Strangler, not big bang

The Alpha state has two layers: the legacy `core` (`GameStateSchema`: cities with population/stability/development/workers, 5-key resources) and the Alpha overlay (`players`, `cities` metadata). Rewriting both at once would stall tests for days. Each slice moves one truth into the Alpha layer and makes the legacy field derived or inert:

| Canon | Truth moves to | Legacy field becomes |
|---|---|---|
| 8 resources, caps | `players[].resources` (+`culture`), `rules.balance.limits` | `core.players[].resources` synced by `syncLegacyResources` (unchanged) |
| Level built + roles | `cities[].builtLevel`, `cities[].roles` | `core.city.population` stays the population total; `workers` mirrors roles (producer→farmers…), `development` fixed at 1, unused |
| Capacity | `cityCapacity(level)`, `effectiveCapacity(city)` in domain | `balance.cityActions`, `commandPoints` unused |
| Ânimo | `cities[].mood` (already 0–6) → 4 states mapped 0–1 Revolta, 2–3 Abalada, 4 Estável, 5–6 Próspera | `core.city.stability` frozen at 50 until removed |
| Administration | `administration(state, player)` in engine | `civilization.administrativeLoad/Capacity` written from the new formula for reports |
| Orders | `plannedActions`/`orders` carry an `order` tag; `ordersUsed` derived | `spentCommands` kept as the count |
| Web | `WEB_ADVANCES` (50) + `HERITAGE` (54) replace `ADVANCEMENTS` | `research: string[]` keeps ids; migration maps `adv-*` ids to the nearest new node by domain and era |

## Determinism and privacy

No new randomness. Every new command validates `expectedVersion`. The projection grows only through the allow-list; `tests/alpha-privacy.test.ts` pins the keys.

## Order of slices (each: lint, typecheck, test, deterministic tests, minimal playtest with `scripts/alpha-simulate.mjs`)

D1 resources+caps · D2 ladder/roles/Capacity/Elevar table · D3 districts/slots/buildings table · D4 administration · D5 Web+Heritage catalog · D6 Orders+commands · E1 planning 5 Orders · E2 Produzir by Capacity+roles · E3 Elevar · E4 redistribute/lock · E5 sustenance/Crescer · E6 mobilize/demobilize · E7 storage · E8 research+unlocks · E9 administration/Sobre-extensão · E10 Governar · S1 projection · W1–W6 UI · R1–R7 remaining systems.
