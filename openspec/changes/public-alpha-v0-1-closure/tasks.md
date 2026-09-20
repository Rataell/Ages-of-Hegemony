## 1. A. v5 and migrations

- [ ] 1.1 Decide the era-milestone table after the Ascension insertion (resolves the design open question), then make `tests/alpha-match.test.ts` pass by fixing the table or the scripted scenario; gate: `npm test` 356/356.
- [ ] 1.2 Change the client projection to report the v5 envelope instead of `schemaVersion: 4` and update its consumers; gate: `npm run typecheck`, projection test.
- [ ] 1.3 Add migration tests: v4 to v5 twice is idempotent, declared Hegemony era survives, corrupt and unknown-version input is refused and untouched; gate: `tests/alpha-migration.test.ts`.
- [ ] 1.4 Preserve the original snapshot on migrate-on-load in the repository decode path and test rollback; gate: repository unit test.
- [ ] 1.5 Add a state invariant test that seven-resource and legacy pools never diverge after any command in the scripted match (temporary, removed in 2.3); gate: `npm test`.

## 2. B. Economy and cities

- [ ] 2.1 Route every producer and spender (institutions, cards, treaties, routes, founding, civilization ability, upkeep) through `alphaGain` and `alphaPay`; gate: tests for purchase-after-production and unaffordable-rejection.
- [ ] 2.2 Enforce storage capacity and overflow discard; add metal sourcing decision and implementation; gate: storage tests.
- [ ] 2.3 Delete `reconcileLegacyPools` and the legacy-derived reads in alpha reducers; keep legacy fields only for the slice; gate: `npm test`, slice E2E.
- [ ] 2.4 Implement the `URBAN_ACTION` handler with one action per city per round and per-round reset; gate: urban-action tests.
- [ ] 2.5 Implement mood effects, level growth, buildings and integration progress on `AlphaCity`; gate: city tests.
- [ ] 2.6 Add city-record consistency tests for founding, capture, liberation and last-city loss (fixes already in place; lock them in); gate: `tests/alpha-cities.test.ts`.

## 3. C. Turn loop

- [ ] 3.1 Make `state.phase` the single loop driver for the eight phases and adapt the legacy core phase; gate: phase-order tests.
- [ ] 3.2 Draw and apply the world pulse in the first phase and report it; gate: pulse determinism test (belongs to F.1, wired here).
- [ ] 3.3 Move urban actions, orders, diplomacy, conflicts and integration into their own phases with per-phase readiness and command limits; gate: phase tests.
- [ ] 3.4 Fix round-report arithmetic for seven resources and storage discards; gate: report tests.
- [ ] 3.5 Correct Hegemony copy and error text to the six-era structure; keep the Scientific path metric aligned with the Ascension tier; gate: hegemony tests, copy grep.
- [ ] 3.6 Extend the scripted full-match scenario to run through all eight phases and finish; gate: `tests/alpha-match.test.ts` twice deterministic.

## 4. D. Combat

- [ ] 4.1 Implement posture and tactical faces in resolution and store real values in battle records; gate: combat tests with breakdown sums.
- [ ] 4.2 Compute modifier breakdowns by source for both sides; gate: arithmetic invariant test.
- [ ] 4.3 Enforce stack limits per hex; gate: movement rejection tests.
- [ ] 4.4 Add fortification levels and damage state to defense and siege; gate: city assault tests.
- [ ] 4.5 Expose a dice-free combat preview through the projection; gate: projection leak test.

## 5. E. Culture

- [ ] 5.1 Implement `CONTEST_PRESENCE` with two-dice resolution, three slots and the three-civilization cap; gate: culture tests.
- [ ] 5.2 Implement presence levels, anchors and cohesion bounds; gate: bounds tests.
- [ ] 5.3 Keep presence coherent on capture and integration; gate: capture tests.
- [ ] 5.4 Feed cultural Hegemony metrics from the same records the UI reads; gate: metric parity test.

## 6. F. World systems

- [ ] 6.1 Implement the world pulse draw, apply, discard and deterministic reshuffle; gate: determinism test.
- [ ] 6.2 Implement `INDEPENDENT_ACTION` for trade, negotiate, influence, protect, integrate, conquer with fog-safe results; gate: independent-people tests.
- [ ] 6.3 Implement raid-band movement and attacks; gate: deterministic raid test.
- [ ] 6.4 Implement `PROPOSE_TRADE` and `RESPOND_TRADE` for the four offer types, with settle and default; gate: trade tests.
- [ ] 6.5 Sever or suspend routes on capture and war; gate: route tests.

## 7. G. Multiplayer and privacy

- [ ] 7.1 Add an allow-list projection for all v5 state and a test that fails on any unlisted field; gate: `tests/alpha-http.test.ts`.
- [ ] 7.2 Add a two-client leak test covering hands, ambitions, orders, unexplored terrain, seeds, counters and decks; gate: privacy test.
- [ ] 7.3 Investigate and fix the `alpha-conflict.spec.ts` "Identificador de partida inválido" failure; gate: that spec green.
- [ ] 7.4 Test concurrent submission, forged cookie, impersonation and seat-limit rejection; gate: service tests.
- [ ] 7.5 Test reconnection after reload and after server restart; gate: E2E plus service test.

## 8. H. UI and playability

- [ ] 8.1 Show seven resources, storage limits, city level, mood, integration and fortification; gate: component test and 1440 screenshot.
- [ ] 8.2 Add controls for urban actions, trade offers, independent-people actions, cultural contests and posture; gate: coverage test comparing commands with controls.
- [ ] 8.3 Show costs, missing resources and reasons before commitment; gate: disabled-state E2E.
- [ ] 8.4 Show round report, world pulse and battle detail with modifier sources; gate: E2E battle scenario.
- [ ] 8.5 Correct Portuguese copy for eras, phases, victory and the compendium against the implemented rules; gate: review checklist in the report.
- [ ] 8.6 Verify 1440, 1280 and 390 pixel layouts in both themes and keyboard access; gate: screenshots and manual notes.

## 9. I. PostgreSQL

- [ ] 9.1 Obtain a dedicated database URL from the owner; do not invent one; gate: `ALPHA_TEST_DATABASE_URL` present.
- [ ] 9.2 Deploy the additive migration to that database and run `npm run test:db`; gate: suite green.
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
- [ ] 11.3 Run the public smoke test: create, join, act, reload; gate: pass.
- [ ] 11.4 Add the test-build label and limitations disclosure to the landing page; gate: visual check.
- [ ] 11.5 Run a 2 to 6 participant playtest to a winner including a server restart; gate: recorded outcome and defect log.
- [ ] 11.6 Document rollback and verify stored matches survive it; gate: rollback drill.
