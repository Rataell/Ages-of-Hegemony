## Why

The playable alpha was in the middle of a v4 to v5 transition (Concept Bible: seven resources, eight phases, six eras, city metadata, world pulse, independents, culture, tactical combat) when the previous agent stopped. The domain schema now speaks v5, but the turn loop, economy, combat, culture, projection, persistence and UI mostly still run v4 rules behind a transitional bridge. Public Alpha v0.1 cannot ship until 2 to 6 people in separate browsers can finish one persistent match on a public URL, and today no gate proves that.

## What Changes

- Finish the v4 to v5 transition so engine, server projection, persistence and UI agree on one authoritative v5 state.
- Wire the v5 systems that exist only as schema today: urban actions with one action per city, seven-resource storage and wealth conversion, mood and integration, world pulse, independent peoples and raid bands, posture and tactical-face combat, cultural presence contests, trade offers.
- Replace the transitional legacy-pool bridge with a single resource authority, then retire the bridge.
- Extend projections and UI so every v5 mechanic is playable, explained in PT-BR and privacy-safe.
- Prove durability on real PostgreSQL, then release gates, then deploy and a public playtest.
- Explicit non-breaking rule: the slice at `/`, v3 snapshots and v4 snapshots stay readable. Migration is expand-only and idempotent; the original snapshot is never overwritten in place without a preserved copy.

## Capabilities

### New Capabilities
- `alpha-state-migration`: v3 and v4 to v5 snapshot conversion, single authoritative envelope, rollback safety (workstream A).
- `alpha-economy-cities`: seven resources, storage, wealth conversion, city levels, mood, integration, founding, capture (B).
- `alpha-turn-loop`: eight-phase round, command capacity, readiness, timers, reports, era milestones, victory (C).
- `alpha-combat`: stacks, postures, tactical faces, supply, terrain, fortification, casualties, occupation (D).
- `alpha-culture`: foreign presence levels, contests, anchors, influence victory metrics (E).
- `alpha-world-systems`: regions, exploration, world pulse, independents, raid bands, trade offers and routes (F).
- `alpha-multiplayer-privacy`: guest identity, seats, authorization, projections, CAS conflicts (G).
- `alpha-play-interface`: PT-BR playable UI for all v5 actions, previews, breakdowns, responsive layout (H).
- `alpha-persistence`: PostgreSQL storage, migrations, restart durability, decode-time migration (I).
- `alpha-release-gates`: the automated and manual gates that must be green before any tag, commit of a release or deploy (J).
- `alpha-public-playtest`: deploy target, environment, smoke test and a real 2 to 6 player playtest (K).

### Modified Capabilities
<!-- None. openspec/specs/ is empty; this change introduces the first specs for the brownfield project. -->

## Non-goals

- No AI opponents, spectators, matchmaking, ranking, audio, accounts or WebSockets (polling stays).
- No new civilizations, advancements or cards beyond fixing broken references.
- No rebalancing beyond what is needed to make a normal match finishable; balance is a playtest output, not an input.
- No trademark clearance; that remains a pre-commercial task.
- No deploy, push or commit as part of writing this change. Invented credentials are forbidden.

## Impact

- `packages/game-domain`: `alpha.ts`, `alpha-concept.ts`, `alpha-catalog.ts`, `alpha-institutions.ts`.
- `packages/game-engine`: `alpha-turn.ts`, `alpha-resources.ts`, `alpha-cities.ts`, `alpha-military.ts`, `alpha-world.ts`, `alpha-migration.ts`, `alpha-diplomacy.ts`, `alpha-hegemony.ts`.
- `apps/server`: `alpha-projection.ts`, `alpha-service.ts`, `alpha-prisma-repository.ts`, `alpha-http.ts`.
- `apps/web/app/alpha`, `apps/web/app/api/alpha`, `e2e/`, `tests/`.
- `prisma/schema.prisma` and `prisma/migrations/20260919000100_alpha_match` (additive only).
- External, not yet available: PostgreSQL database, Git remote, Railway/Supabase targets and tokens.
