## 1. A. v5 and migrations

- [x] 1.1 Decide the era-milestone table after the Ascension insertion (resolves the design open question), then make `tests/alpha-match.test.ts` pass by fixing the table or the scripted scenario; gate: `npm test` green (373/373, including `tests/alpha-milestones.test.ts`).
- [x] 1.2 Change the client projection to report the v5 envelope instead of `schemaVersion: 4` and update its consumers; gate: `npm run typecheck`, projection test.
- [x] 1.3 Add migration tests: v4 to v5 twice is idempotent, declared Hegemony era survives, corrupt and unknown-version input is refused and untouched; gate: `tests/alpha-migration.test.ts` (16 tests, v4 fixture in `tests/alpha-v4-fixture.ts`).
- [x] 1.4 Preserve the original snapshot when a legacy row is rewritten: the first v5 save copies the stored original to `AlphaMatchArchive` in the same transaction; reads never write; gate: `tests/alpha-postgres-migration.db.integration.ts` on real PostgreSQL (verified on an embedded PostgreSQL 18 binary; re-run on the Docker `db-test` container is still pending, see 9.1).
- [x] 1.5 Add a state invariant test that seven-resource and legacy pools never diverge after any command in the scripted match (temporary, removed in 2.3); gate: `npm test`.

## 2. B. Economy and cities

- [x] 2.1 Route every producer and spender (institutions, cards, treaties, routes, founding, civilization ability, upkeep) through `alphaGain` and `alphaPay`; gate: tests for purchase-after-production and unaffordable-rejection. Done for every alpha-owned path; core-reducer paths (claims, districts, founding cost, maintenance production) go through the transitional `commitLegacyReducer` adapter, removed in 2.3.
- [x] 2.2 Enforce storage capacity and overflow discard, reporting discards in the round report; implement metal sourcing (Producer + metal deposit + Mine, no new population role); gate: `tests/alpha-storage-metal.test.ts` (18 tests).
- [x] 2.3 Delete `commitLegacyReducer` (make the core reducer v5-aware) and the legacy-derived reads in alpha reducers; keep legacy fields only for the slice; gate: `npm test`, slice E2E. Core rules now receive an explicit resource-payment authority; Alpha charges the seven-resource pool directly while the slice keeps the five-resource default. Verified: 655 tests and 2 slice E2E.
- [x] 2.4 Implement the `URBAN_ACTION` handler with one action per city per round and per-round reset; gate: `tests/alpha-urban.test.ts` (30 tests). PRODUCE (with mining and first-PRODUCE institutional production), BUILD (district, building, fortification), RECRUIT, RESEARCH, PROMOTE_MOOD, SUPPORT_TRADE, CIVIC_ACTION. Legacy top-level RECRUIT and RESEARCH commands still exist in PLANNING for compatibility; converge them in workstream H.
- [x] 2.5 Implement mood effects, level growth, buildings and integration progress on `AlphaCity`; gate: city tests. Mood now affects production and maintenance stability, population drives all seven city levels, building metadata/effects stay synchronized, and integration remains incremental. Verified in 103 focused tests.
- [x] 2.6 Add city-record consistency tests for founding, capture, liberation and last-city loss (fixes already in place; lock them in); gate: `tests/alpha-cities.test.ts`.

## 3. C. Turn loop

- [x] 3.1 Make `state.phase` the single loop driver for the eight phases and adapt the legacy core phase; gate: `tests/alpha-phases.test.ts` (24 tests). The core phase is mirrored, never advanced through the core reducer.
- [x] 3.2 Draw and apply the world pulse in the first phase and report it; gate: pulse draw, application, ledger and report tests in `tests/alpha-phases.test.ts`.
- [x] 3.3 Make URBAN_ACTION the single domain path for BUILD, RECRUIT, RESEARCH, PRODUCE, PROMOTE_MOOD, SUPPORT_TRADE and CIVIC_ACTION: the legacy RECRUIT, RESEARCH and INTEGRATE_CITY commands are removed (no adapter needed), and MANAGE rejects BUILD_DISTRICT and BUILD_BUILDING with USE_URBAN_ACTION; integration is the paid, next-round CIVIC_ACTION on an occupied city; gate: `tests/alpha-phases.test.ts`, `tests/alpha-urban.test.ts`, `tests/alpha-cities.test.ts`, scripted match. Treaties stay in PLANNING and DIPLOMACY_TRADE by design (war must precede attack orders).
- [x] 3.4 Fix round-report arithmetic for seven resources and storage discards; gate: `tests/alpha-report.test.ts` (7 tests). Reports are built at END_ROUND from a per-round ledger (production, mining, trade, institutions, other, losses, expenses, upkeep, discarded); old reports still parse. The report keeps the legacy five-resource vocabulary (materials = wood + stone + metal); a per-resource seven-column report is left to the interface work in H.
- [x] 3.5 Correct Hegemony copy and error text to the six-era structure; keep the Scientific path metric aligned with the Ascension tier; gate: hegemony tests, copy grep. Verified: 25 focused tests; no stale five-era copy in current Alpha surfaces/docs.
- [x] 3.6 Extend the scripted full-match scenario to run through all eight phases and finish; gate: `tests/alpha-match.test.ts` twice deterministic (the scenario now takes PRODUCE and SUPPORT_TRADE urban actions every round).

## 4. D. Combat

- [x] 4.1 Implement posture and tactical faces in resolution and store real values in battle records; gate: combat tests with breakdown sums.
- [x] 4.2 Compute modifier breakdowns by source for both sides; gate: arithmetic invariant test.
- [x] 4.3 Enforce stack limits per hex (`alpha-stack.ts`, limits in `balance.stack`): MOVE at queue time and at resolution, RECRUIT, retreat, victorious advance; projected `stacks` view and preview notes share one verdict; gate: `tests/alpha-stack.test.ts` and the conflict E2E. Re-verified 2026-09-20: 588 tests and 4 of 4 E2E green.
- [x] 4.4 Add fortification levels and damage state to defense and siege; gate: city assault tests. Existing implementation covers all six levels, damage/breach progression and siege; reverified in 72 combat/stack tests.
- [x] 4.5 Expose a dice-free combat preview through the projection; gate: projection leak test. Existing allow-listed `orderPreviews` hides dice, RNG and defender posture; reverified in combat tests.

## 5. E. Culture

- [x] 5.1 Implement `CONTEST_PRESENCE` with two-dice resolution, three slots and the three-civilization cap; gate: culture tests.
- [x] 5.2 Implement presence levels, anchors and cohesion bounds; gate: bounds tests.
- [x] 5.3 Keep presence coherent on capture and integration; gate: capture tests.
- [x] 5.4 Feed cultural Hegemony metrics from the same records the UI reads; gate: metric parity test. Presence records are authoritative; compatibility counters, Hegemony and allow-listed projection derive from them. Verified: 54 focused tests.

## 6. F. World systems

- [x] 6.1 Implement the world pulse draw, apply, discard and deterministic reshuffle; gate: determinism and exhaustion tests in `tests/alpha-phases.test.ts`. Catalog unchanged: 24 single-module cards.
- [x] 6.2 Implement `INDEPENDENT_ACTION` for trade, negotiate, influence, protect, integrate, conquer with fog-safe results; gate: independent-people tests. Peoples are placed in contested ground for 2–6 seats; the projection lists each action with cost and the exact missing condition (dry run); `tests/alpha-independents.test.ts`.
- [x] 6.3 Implement raid-band movement and attacks; gate: deterministic raid test. Bands start in the wilderness and are projected only inside current vision; `tests/alpha-raids.test.ts`.
- [x] 6.4 Implement `PROPOSE_TRADE` and `RESPOND_TRADE` for the four offer types, with settle and default; gate: trade tests. Instant trade, gift, future promise and loan in the seven-resource vocabulary, exact goods only (no wealth substitution), refused at war or under embargo; unanswered offers lapse at round end; due promises and loans settle in maintenance or default with −2 Prestige, told to both parties; `tests/alpha-trade.test.ts`.
- [x] 6.5 Sever or suspend routes on capture and war; gate: route tests. Maintenance re-validates every route: war, embargo or a lost origin suspend it, peace restores it; a trade agreement opens the partner's territory to the route. `tests/alpha-routes.test.ts`.

## 7. G. Multiplayer and privacy

- [x] 7.1 Add an allow-list projection for all v5 state and a test that fails on any unlisted field; gate: `tests/alpha-http.test.ts`. The gate lives in `tests/alpha-privacy.test.ts`: the exact top-level field list, and no aggregate, RNG, card zone, ledger or telemetry.
- [x] 7.2 Add a two-client leak test covering hands, ambitions, orders, unexplored terrain, seeds, counters and decks; gate: privacy test. `tests/alpha-privacy.test.ts`: a rival's planned urban action, order, war declaration, trade offer, hand, ambitions and the RNG seed never reach another player; per-piece and per-city options are own-only; territory is known or visible only; frontier hexes carry no terrain.
- [x] 7.3 Investigate and fix the `alpha-conflict.spec.ts` "Identificador de partida inválido" failure; gate: that spec green. Green on every E2E run of 2026-10-03.
- [x] 7.4 Test concurrent submission, forged cookie, impersonation and seat-limit rejection; gate: service tests. `tests/alpha-service.test.ts` (tampered or foreign-key cookies rejected, competing CAS has one winner, third seat refused), `tests/alpha-http.test.ts` (client identity fields rejected), `tests/alpha-conflict-recovery.test.ts` (simultaneous stale commands applied once).
- [x] 7.5 Test reconnection after reload and after server restart; gate: E2E plus service test. E2E `alpha-play` and `alpha-ux-round-1` reload and rejoin; `tests/alpha-service.test.ts` resolves the same identity and seat with a recreated session store and service over the same repository.
- [x] 7.6 Recover stale commands in the client: on an explicit VERSION_CONFLICT the client refreshes the projection, replaces only `expectedVersion`, and resends the same command exactly once; no retry for any other error, network failure or failed refresh; the server keeps compare-and-swap; gate: `tests/alpha-conflict-recovery.test.ts` (14 tests, real HTTP boundary) and E2E `alpha-play` without reload workarounds and with no error banner.

## 8. H. UI and playability

- [x] 8.1 Show seven resources, storage limits, city level, mood, integration and fortification; gate: component test and 1440 screenshot. Seven resources with warehouse gauges in the top bar; the city panel shows level, mood with its production and stability effect from the rules, fortification, integration when occupied, growth meter and food balance. Gate covered by E2E `alpha-play` and the playtest screenshots in `docs/alpha-playtest-2026-10-03.md`.
- [x] 8.2a Urban controls for every urban action (PRODUCE, BUILD district/building/fortification, RECRUIT, RESEARCH, PROMOTE_MOOD, SUPPORT_TRADE, CIVIC_ACTION) in one panel, with no legacy control left for the same actions; gate: E2E `alpha-play` (produce, build, recruit, research).
- [x] 8.2b Add controls for trade offers, independent-people actions, cultural contests and posture once their rules exist (F, E, D); gate: coverage test comparing commands with controls. Trade offers in each Diplomacy relation card; independent-people actions in the Território inspector; cultural presence and contests in the Território inspector of a city; influence missions offered to an Envoy next to a foreign city; attack and defence posture. `tests/alpha-ui-coverage.test.ts` fails if any schema command has no control.
- [x] 8.3 Show costs, missing resources and reasons before commitment for urban actions: cost, effect, requirements, actions left and the exact block reason come from the server preview (`urbanOptions`), which shares its validators with the action and is tested for parity; gate: `tests/alpha-urban-options.test.ts`, E2E `alpha-play` disabled-state assertions. Other commands (treaties, cards, projects) still show costs only.
- [x] 8.7 Converge `/alpha` gameplay onto the slice shell (`.game-shell`, `.top-bar`, `.main-nav`, `.play-layout`, `.civilization-panel`, `.world-column`, `.context-inspector`, `.action-bar` from `style.css`), group own pieces by hex and class, keep attack posture contextual, move defence posture out of the piece list and fold combat preview into a summary with an expandable breakdown; gate: E2E and 1440/1280/390 screenshots in `docs/evidence/alpha-convergence`.
- [ ] 8.4 Show round report, world pulse and battle detail with modifier sources; gate: E2E battle scenario.
- [ ] 8.5 Correct Portuguese copy for eras, phases, victory and the compendium against the implemented rules; gate: review checklist in the report.
- [ ] 8.6 Verify 1440, 1280 and 390 pixel layouts in both themes and keyboard access; gate: screenshots and manual notes.

## 9. I. PostgreSQL

- [ ] 9.1 Run the integration suite on the Docker `db-test` container (`npm run test:db:docker`). Infra is written (`docker-compose.yml`, `scripts/test-db.mjs`, `.env.example`, `docs/database-local.md`) but Docker is not installed on this machine, so it is unexecuted; the suite has passed only on an embedded PostgreSQL 18 binary. Supabase is never used for tests; gate: `npm run test:db:docker` green.
- [ ] 9.2 Apply the additive migrations to the Docker dev database (`npm run db:up`, `npm run db:deploy`) and to a fresh `db-test`; gate: `prisma migrate status` up to date on both. (Verified so far on the embedded binary: 3 migrations apply and status is up to date.)
- [ ] 9.3 Add a v4-row read, migrate and save test on real PostgreSQL; gate: `tests/alpha-postgres.db.integration.ts`.
- [ ] 9.4 Add concurrent-save and restart-durability tests; gate: same suite.
- [ ] 9.5 Verify 503 when database or secret is missing; gate: HTTP test.

## 10. J. Release gates

- [ ] 10.1 Run lint, typecheck, test, build, `db:validate` and `git diff --check`; record counts; gate: all zero failures.
- [ ] 10.2 Run the slice and all alpha Playwright scenarios; add battle and finish scenarios; gate: E2E green.
- [ ] 10.3 Run the manual play checklist of every action with two browsers and record untested items; gate: signed report.
- [ ] 10.4 Update `docs/known-limitations.md` and `docs/playable-alpha-report.md` to the real results; gate: report matches logs.
- [ ] 10.5 Ask the owner before any release commit or tag; gate: all of 10.1 to 10.4 green.

## 11. K. Deploy and public playtest

- [ ] 11.1 Obtain Git remote, hosting target, `ALPHA_SESSION_SECRET` and `ALPHA_PUBLIC_ORIGIN` from the owner; gate: all present, none invented.
- [ ] 11.2 Configure the hosting environment and apply migrations with the deploy command; gate: health endpoint returns ok.
- [ ] 11.3 Run the public smoke test: create, join, act, reload; gate: pass. `scripts/alpha-smoke.mjs` exists and passed locally against a production build and real PostgreSQL, including a process restart; the public run is pending.
- [ ] 11.4 Add the test-build label and limitations disclosure to the landing page; gate: visual check. Label, test-environment notice, feedback link (`NEXT_PUBLIC_ALPHA_FEEDBACK_URL`) and diagnostics copy are in the entry page and the in-game about panel; the visual check is pending.
- [ ] 11.5 Run a 2 to 6 participant playtest to a winner including a server restart; gate: recorded outcome and defect log.
- [ ] 11.6 Document rollback and verify stored matches survive it; gate: rollback drill.

## 12. Leaders (small addition)

- [x] 12.1 Add one permanent leader per civilization (12) with a small passive and a once-per-Era ability, centralised in `packages/game-domain/src/alpha-leaders.ts` (`ALPHA_LEADER_BUDGET`); leaders are assigned automatically, are distinct from advisors, and are shown in the era panel with an avatar placeholder; gate: `tests/alpha-leaders.test.ts` (17 tests).
