## Context

Baseline verified on 2026-09-19 against the working tree (branch `feature/aoh-playable-alpha-v1`, HEAD `193bf87`, alpha work uncommitted).

Recovery result: `npm run typecheck`, `npm run lint` and `npm test` (373 tests) are green. A checkpoint commit holds the recovered v5 domain foundation. Fixes applied while recovering: era comparisons use the six-value alpha era list; `SETTLER` became `PIONEER` everywhere; battle records carry posture, breakdown and tactical fields; `state.cities` metadata is created on founding and updated on capture and integration; migration preserves a declared Hegemony era; the Scientific path metric counts Ascension-tier research; the web map accepts a six-value era. Era progression now uses a centralized criteria-count table (`ALPHA_ERA_MILESTONES`). Alpha producers and spenders (institutions, cards, treaties, routes, civilization ability, upkeep) go through `alphaGain`/`alphaPay`/`alphaDrain`; the legacy core reducer is wrapped by `commitLegacyReducer`, a narrow transitional adapter.

### Baseline: implemented versus missing

| Area | In code today | Missing or wrong |
|---|---|---|
| State envelope | `AlphaStateSchema` v5 with seven resources, eight phase names, six eras, `AlphaCity`, trade offers, independents, raid bands, world pulse, telemetry. v3/v4 to v5 migrations exist and are tested. | `alpha-projection.ts` still emits `schemaVersion: 4` in the client view. No test proves a v5 round trip through PostgreSQL. |
| Resources | Seven-resource pool is stored per player. Pay, storage caps and wealth conversion helpers exist. | No production is automatic: cities produce only through PRODUCE (metal is mined in the same action). Recurring institutional effects have explicit timing: MAINTENANCE (civilization passives, advancements, non-productive great projects), ROUND_START (advisors), ON_PRODUCE (great projects in agrarian or industrial districts, credited with that city's PRODUCE) and ONCE (cards, civilization ability, world choices). Alpha producers and spenders use `alphaGain`/`alphaPay`/`alphaDrain`. The legacy core reducer (claims, improvements, districts, founding, maintenance production) still mutates the five-resource pool and is bridged by `commitLegacyReducer`. Metal comes only from a worked hex with a metal deposit and a Mine (regions carry at most one deposit: first mountain, else first hill). Storage caps are enforced: overflow from action-time gains is discarded with an event, and maintenance discards are recorded in the round report (`discarded`, plus `mining` for metal). |
| Turn loop | `state.phase` drives the eight-phase round: WORLD_PULSE (ledgers, cards, one pulse), PLANNING, URBAN_ACTIONS, ORDERS_MOVEMENT (explore, move, route), DIPLOMACY_TRADE (treaties settle at close), CONFLICTS (reaction cards, then attacks and influence), INTEGRATION_MAINTENANCE (upkeep, population food and growth, stability, storage), END_ROUND (reports, victory, initiative, next round). The legacy core phase is mirrored, never advanced through the core reducer. | Legacy `RECRUIT`, `RESEARCH`, `INTEGRATE_CITY` and treaty proposals still live in PLANNING. `PROPOSE_TRADE`, `RESPOND_TRADE`, `CONTEST_PRESENCE`, `INDEPENDENT_ACTION` answer NOT_IMPLEMENTED. |
| Cities | Founding, capture, integration, occupation work on the economic model. Metadata is kept in sync. `URBAN_ACTION` is real: one action per city per round (PRODUCE, BUILD, RECRUIT, RESEARCH, PROMOTE_MOOD, SUPPORT_TRADE, CIVIC_ACTION). Mood scales production; fortification upgrades and CIVIC_ACTION integration change city records. | City level never grows. Alpha-only buildings (for example Foundry) are not buildable. Fortification has no combat effect yet (workstream D). |
| Combat | Strength plus 2d6 with terrain, supply, city bonus, retreat. Deterministic. | Postures, tactical faces, modifier breakdowns, stack limits, fortification damage and a preview are not implemented; battle records store placeholders. |
| Culture | Foreign influence by envoys on cities. | `CONTEST_PRESENCE`, presence levels, anchors, culture dice are schema-only. |
| World | Regions, exploration, pioneers, independents and raid bands are generated at creation. | Independents and raid bands never act. World pulse deck is never drawn. `INDEPENDENT_ACTION`, `PROPOSE_TRADE`, `RESPOND_TRADE` have no handler. |
| Hegemony | Six paths, hold rounds, winner. | UI copy and error text still say "quinta era". |
| Server | Guest cookie, seats, CAS service, HTTP boundary, Prisma repository with decode-time v4 to v5 migration. | Migration and CAS integration now pass on real PostgreSQL (embedded 18 binary); Docker itself is unexecuted (not installed). Original snapshots are archived on first v5 save. `alpha-conflict.spec.ts` failed once opening its fixture ("Identificador de partida inválido"). |
| UI | `/alpha` lobby, board, cards, diplomacy, research, reports, hegemony. | None of the v5-only mechanics has a control. Seven resources are displayed through the legacy shape. |
| Release | No remote, no database, no Railway/Supabase access. | Everything in workstream K depends on the user supplying these. |

## Goals / Non-Goals

**Goals:**
- One authoritative v5 state with no dual resource pools.
- Every v5 mechanic reachable through validated commands, deterministic reducers and PT-BR UI.
- A repeatable proof that 2 to 6 separate browser clients finish a persisted match against real PostgreSQL, then on a public URL.

**Non-Goals:**
- New content, AI, spectators, accounts, WebSockets, ranking, audio.
- Deleting or rewriting the slice at `/`, v3 or v4 snapshot readers, or `.agents/`.
- Balance tuning beyond making a normal-length match finishable.

## Decisions

1. **Expand-only migration, no contraction.** v5 is a superset. Decoders accept v3, v4, v5; unknown versions fail without writing. The original snapshot bytes are preserved on migration. Alternative (in-place rewrite) rejected: cannot roll back.
2. **Seven-resource pool is the only authority.** The legacy five-resource pool becomes a derived view and finally disappears from alpha reducers. Order: (a) route every producer and spender through `alphaGain`/`alphaPay`; (b) shrink `commitLegacyReducer` to zero by making the core reducer v5-aware; (c) keep legacy fields only where the v3 slice needs them. Alternative (keep a global reconcile bridge) rejected and removed: it hid desync bugs and already produced a "production lost after a purchase" defect. A scripted-match invariant now asserts both pools stay equal after every command.
3. **Phases advance through one reducer.** `state.phase` becomes the only loop driver; the legacy core phase is adapted, not consulted. Reactions and timers follow the same reducer. Alternative (dual phases) rejected for the same reason as decision 2.
4. **Determinism first.** All randomness (world pulse, dice, raids, decks) uses the private HMAC counter RNG; the client never sees seed or counter. Every new system ships with a replay test.
5. **Projection is an allow-list.** New v5 fields reach the client only through an explicit projection function with a leak test per field. Default deny.
6. **Polling remains the transport.** Simpler to host; scheduler for timers stays lazy (evaluated on next read or command) and is documented as a known limitation, not fixed here.
7. **Release order: local gates, PostgreSQL, deploy, playtest.** Nothing is committed as a release, tagged or deployed while a gate is red.

## Risks / Trade-offs

- **Milestone table is a first ALPHA guess.** Criteria-count progression (4 or 5 of 7 to 8 criteria) is implemented and tested; whether normal players can finish within the round limit is only proven by the scripted scenario, not by real play. Mitigation: playtest in K, retune only `ALPHA_ERA_MILESTONES`.
- **Effect timing is authored by family, not per card.** Advancements are all MAINTENANCE and advisors all ROUND_START; only great projects in agrarian and industrial districts are ON_PRODUCE. Revisit in playtest.
- **The urban panel is the only control for urban actions.** Old planning controls for build, recruit, research and integrate were removed; trade offers, independent peoples, culture and posture controls wait for their rules.
- **Legacy bridge hides defects until removed.** Mitigation: B removes it early.
- **Large surface, few end-to-end proofs.** E2E runs against an in-memory repository behind Playwright interception; real network and PostgreSQL are unproven. Mitigation: I and K are explicit gates.
- **Timers are lazy.** A table that nobody touches never advances. Acceptable for alpha; disclose to testers.
- **Cookie identity, no accounts.** Lost cookie means lost seat. Acceptable; document recovery expectations.
- **Secrets and infra unknown.** `ALPHA_SESSION_SECRET`, `ALPHA_PUBLIC_ORIGIN`, `DATABASE_URL`, Git remote, Railway, Supabase are not available. Never invent them; K blocks until supplied.
- **Uncommitted, large working tree.** Risk of accidental loss. Mitigation: no reset or clean; user decides when to checkpoint commit.

## Open Questions

- Resolved: era milestones use a centralized criteria-count table (Decision 2026-09-20). Metal is produced only by a Producer working an eligible hex with a metal deposit and a Mine or equivalent improvement; no new Miner role. Host: Railway for web/server, Supabase for PostgreSQL.
- Resolved: metal uses the existing METAL terrain feature and MINE improvement; the alpha adds the rule `deposit + Mine + assigned Producer` without changing the shared core catalog.
- Resolved: development and integration tests use Docker PostgreSQL (`db-dev` persistent, `db-test` ephemeral). Supabase holds only the Public Alpha database and is never used by `test:db`.
- Open: Docker is not installed on the development machine; the Docker path is written but unexecuted.
