## Context

Baseline verified on 2026-09-19 against the working tree (branch `feature/aoh-playable-alpha-v1`, HEAD `193bf87`, alpha work uncommitted).

Recovery result of this session: `npm run typecheck` and `npm run lint` are green; `npm test` is 355/356. The single failure is the scripted full-match test, which cannot satisfy the final era milestone (population 11 of 12) after the era table grew from five to six. Fixes applied while recovering: era comparisons in cards, institutions and military now use the six-value alpha era list; `SETTLER` became `PIONEER` everywhere; battle records carry posture, breakdown and tactical fields; `state.cities` metadata is created on founding and updated on capture and integration; migration preserves a declared Hegemony era; the Scientific path metric counts Ascension-tier research; `reconcileLegacyPools` folds legacy-pool changes into the seven-resource pool; the web map accepts a six-value era.

### Baseline: implemented versus missing

| Area | In code today | Missing or wrong |
|---|---|---|
| State envelope | `AlphaStateSchema` v5 with seven resources, eight phase names, six eras, `AlphaCity`, trade offers, independents, raid bands, world pulse, telemetry. v3/v4 to v5 migrations exist and are tested. | `alpha-projection.ts` still emits `schemaVersion: 4` in the client view. No test proves a v5 round trip through PostgreSQL. |
| Resources | Seven-resource pool is stored per player. Pay, storage caps and wealth conversion helpers exist. | Only `alphaPay` is called. `alphaGain`, `enforceStorage`, `initializeAlphaResources` are unused. Production, cards, treaties, routes, founding and ability still mutate the legacy five-resource pool and rely on `reconcileLegacyPools`. Metal has no producer. Storage caps are never enforced. |
| Turn loop | Legacy five-phase loop (`MAINTENANCE`, `PLANNING`, `RESOLUTION`, `REACTION`, `END_ROUND`) drives play. | The eight v5 phases (`WORLD_PULSE`, `URBAN_ACTIONS`, `ORDERS_MOVEMENT`, `DIPLOMACY_TRADE`, `CONFLICTS`, `INTEGRATION_MAINTENANCE`) are schema-only. `state.phase` is initialised and never advanced. |
| Cities | Founding, capture, integration, occupation work on the economic model. Metadata is now kept in sync. | `URBAN_ACTION` command has no handler. Mood, level, buildings, fortification, localCohesion, urbanActionsUsed are never changed. |
| Combat | Strength plus 2d6 with terrain, supply, city bonus, retreat. Deterministic. | Postures, tactical faces, modifier breakdowns, stack limits, fortification damage and a preview are not implemented; battle records store placeholders. |
| Culture | Foreign influence by envoys on cities. | `CONTEST_PRESENCE`, presence levels, anchors, culture dice are schema-only. |
| World | Regions, exploration, pioneers, independents and raid bands are generated at creation. | Independents and raid bands never act. World pulse deck is never drawn. `INDEPENDENT_ACTION`, `PROPOSE_TRADE`, `RESPOND_TRADE` have no handler. |
| Hegemony | Six paths, hold rounds, winner. | UI copy and error text still say "quinta era". |
| Server | Guest cookie, seats, CAS service, HTTP boundary, Prisma repository with decode-time v4 to v5 migration. | Never run against real PostgreSQL. `alpha-conflict.spec.ts` failed once opening its fixture ("Identificador de partida inválido"). |
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
2. **Seven-resource pool is the only authority.** The legacy five-resource pool becomes a derived view and finally disappears from alpha reducers. Order: (a) route every producer and spender through `alphaGain`/`alphaPay`; (b) delete `reconcileLegacyPools`; (c) keep legacy fields only where the v3 slice needs them. Alternative (keep the bridge) rejected: hides desync bugs, already produced the "production lost after a purchase" defect during this recovery.
3. **Phases advance through one reducer.** `state.phase` becomes the only loop driver; the legacy core phase is adapted, not consulted. Reactions and timers follow the same reducer. Alternative (dual phases) rejected for the same reason as decision 2.
4. **Determinism first.** All randomness (world pulse, dice, raids, decks) uses the private HMAC counter RNG; the client never sees seed or counter. Every new system ships with a replay test.
5. **Projection is an allow-list.** New v5 fields reach the client only through an explicit projection function with a leak test per field. Default deny.
6. **Polling remains the transport.** Simpler to host; scheduler for timers stays lazy (evaluated on next read or command) and is documented as a known limitation, not fixed here.
7. **Release order: local gates, PostgreSQL, deploy, playtest.** Nothing is committed as a release, tagged or deployed while a gate is red.

## Risks / Trade-offs

- **Milestone table shifted by the new era.** The final milestone (12 population, 12 research on STANDARD) may make a normal match unfinishable; the scripted scenario currently fails on it. Mitigation: decide the intended table in A before C, then fix scenario or table.
- **Legacy bridge hides defects until removed.** Mitigation: B removes it early.
- **Large surface, few end-to-end proofs.** E2E runs against an in-memory repository behind Playwright interception; real network and PostgreSQL are unproven. Mitigation: I and K are explicit gates.
- **Timers are lazy.** A table that nobody touches never advances. Acceptable for alpha; disclose to testers.
- **Cookie identity, no accounts.** Lost cookie means lost seat. Acceptable; document recovery expectations.
- **Secrets and infra unknown.** `ALPHA_SESSION_SECRET`, `ALPHA_PUBLIC_ORIGIN`, `DATABASE_URL`, Git remote, Railway, Supabase are not available. Never invent them; K blocks until supplied.
- **Uncommitted, large working tree.** Risk of accidental loss. Mitigation: no reset or clean; user decides when to checkpoint commit.

## Open Questions

- Intended era-milestone table after the ASCENSION insertion: keep five rows (last row gates Hegemony) or rebalance?
- Should metal have a producer in this alpha, or stay a purchasable-by-wealth resource only?
- Is one hosted database enough for playtest, or is a separate migration target needed?
- Which host is the target (Railway plus Supabase are documented but unconfirmed)?
