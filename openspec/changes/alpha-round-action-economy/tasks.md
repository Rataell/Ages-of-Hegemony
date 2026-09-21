## 0. Decisions (owner)
- [ ] 0.1 Default `actionsPerRound`; do government / institution modifiers still add.
- [ ] 0.2 Confirm the classes marked "to be confirmed" in design.md.
- [ ] 0.3 Treaty proposals: asynchronous or same-round; resource validation model.

## 1. Slice A: economy without changing the turn
- [ ] 1.1 `actionsPerRound` in rules, room creation (5..10, rejected outside), persistence, migration for rooms without it.
- [ ] 1.2 `ACTION_CLASS` in `game-domain` (exhaustive over command types) and `chargeMainAction` as the only ledger writer.
- [ ] 1.3 Move existing paid commands onto it; urban actions charged, per-city limit kept with its own message; unify refusal code and wording.
- [ ] 1.4 Projection: `actions { used, reserved, limit }` and the class of each option; create form select "Ações por rodada"; counter "Ações 3 / 7" in the shell.
- [ ] 1.5 Tests: every command has a class (type-level and runtime); charged once; refusal is atomic; MOVE of several hexes = 1; cancel frees; group move = 1; urban charged plus per-city limit; 5 and 10 accepted, 4 and 11 rejected; old room loads with unchanged behaviour; property test over random command sequences (used never exceeds limit).
- [ ] 1.6 Visual check at 1366x768, 1440x900, 1920x1080 (counter, refusal messages, create form) and the full gates.

## 2. Slice B: private simultaneous planning
- [ ] 2.1 Reserve urban and diplomatic actions during planning; single READY for the three planning-like phases; CONFLICTS unchanged.
- [ ] 2.2 Others see only Planejando / Pronto; a test walks every projected field of other players for reserved ids, targets and costs.
- [ ] 2.3 Conservative validation at reservation, re-validation at resolution, "não pôde ser realizada" event.
- [ ] 2.4 Deterministic replay tests for every class; 2, 4 and 6 player full matches through the HTTP harness.

## 3. Slice C: visible resolution
- [ ] 3.1 Structured resolution events with per-player visibility (movement, exploration, foundation, production, construction, research, influence, combat, losses, retreat, advance, round events).
- [ ] 3.2 "RESOLVENDO A RODADA" phase and replay; visibility example (Ana moves, Beto sees it only if his own vision allows).
- [ ] 3.3 Screenshots and a two-browser E2E of the example.

## 4. Gates
- [ ] 4.1 lint, typecheck, tests, e2e, build, `openspec validate --strict --all`.
