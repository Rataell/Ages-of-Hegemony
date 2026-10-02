## Current behaviour (audited on `feature/aoh-alpha-full-audit-v1`, from `packages/game-engine/src/alpha-turn.ts`)

Capacity = `alphaCommandCapacity(state, actor)` = `rules.baseCommandPoints` (4) + government delta + institution bonus `COMMAND`. Used = `player.spentCommands + player.orders.length`, reset every round in `alpha-phases.ts`. A queued order occupies a slot until it is cancelled or replaced by the same id; the other paid commands increment `spentCommands`.

### Classification of the real commands

| Command | Today | Proposed class | Notes |
|---|---|---|---|
| `QUEUE_ORDER` MOVE (unit or group) | 1 slot per order | MAIN | one order, up to mobility, however many hexes; group = one decision |
| `QUEUE_ORDER` EXPLORE | 1 slot | MAIN | |
| `QUEUE_ORDER` ATTACK | 1 slot | MAIN | attacker's decision |
| `QUEUE_ORDER` TRADE (route) | 1 slot | MAIN | |
| `QUEUE_ORDER` INFLUENCE | 1 slot | MAIN | |
| `CANCEL_ORDER` | frees the slot | FREE | cancel of an unresolved order |
| `SETTLE` (found a city) | 1 | MAIN | |
| `MANAGE` CLAIM_HEX | 1 | MAIN | competes with everything else today |
| `MANAGE` IMPROVE_HEX | 1 | MAIN | |
| `MANAGE` DEVELOP_CITY, SPECIALIZE_CITY | 1 | MAIN | |
| `MANAGE` ASSIGN_POPULATION, ASSIGN_WORKED_HEXES, ADOPT_GOVERNMENT | 0 | FREE | to be confirmed with the owner: adopting a government is arguably a main decision |
| `BUILD_ROAD` | 1 | MAIN | |
| `ADVANCE_ERA` | 1 | MAIN | to be confirmed: it is a milestone, not a per-round decision |
| `CIVILIZATION_ABILITY` | 1 | MAIN | |
| `LEADER_ABILITY` | 0 (once per Era) | FREE, own limit | to be confirmed |
| `PROPOSE_TREATY`, `DECLARE_WAR` | 1 | MAIN | "relevant diplomatic action" |
| `RESPOND_TREATY`, `END_TREATY` | 0 | FREE | answering is not a new initiative |
| `HIRE_ADVISOR`, `BUILD_PROJECT` | 1 | MAIN | start or contribute to a project |
| `URBAN_ACTION` (produce, build, recruit, research, mood, trade support, civic action) | 0 main, 1 per city | MAIN, plus per-city limit | the per-city limit stays as a different restriction with its own message |
| `PLAY_CARD` in PLANNING | 0 | FREE (to be confirmed) | cards have their own costs and limits |
| `PLAY_CARD` in CONFLICTS | 0 | REACTION | a reaction never consumes a planned action |
| `SET_DEFENSE_POSTURE` | 0 | FREE | posture is a standing setting; a defensive response caused by an enemy attack is a REACTION |
| `CHOOSE_AMBITIONS`, `WORLD_CHOICE`, `DECLARE_HEGEMONY` | 0 | FREE | |
| `READY` | 0 | FREE | confirms planning |
| Select, inspect, pan, zoom, open a panel, read rules, preview, change tab | client only | FREE | never sent to the server |
| `PROPOSE_TRADE`, `RESPOND_TRADE`, `CONTEST_PRESENCE`, `INDEPENDENT_ACTION` | `NOT_IMPLEMENTED` | not classified | remain refused until implemented |

Inconsistencies found while classifying (all recorded in the audit report): `MANAGE` refuses with `COMMAND_LIMIT`, the others with `RULE_FAILURE` and a different sentence; urban actions ignore the budget; the same territory decision costs a point while the same amount of effort spent through an urban action costs nothing.

## Decisions confirmed for the playable Alpha

1. `actionsPerRound` defaults to 7. New matches use that fixed configured limit; government and institution command modifiers remain only for legacy matches whose rules lack `actionsPerRound`.
2. `ADOPT_GOVERNMENT` and `ADVANCE_ERA` are MAIN. `LEADER_ABILITY` and planning `PLAY_CARD` are FREE; conflict `PLAY_CARD` is REACTION.
3. Treaty proposals reserved during planning resolve asynchronously and can be answered in the next planning window.
4. Reserved actions use conservative validation without escrow and are re-validated during resolution.

## Design

- **Rule**: `AlphaRulesSchema.actionsPerRound` (int 5..10). Rooms and states persisted before the change have no value; migration derives it from `baseCommandPoints` so their behaviour is byte-for-byte the same. `CreateAlphaRoomSchema` gains an optional `actionsPerRound` (default decided in question 1). The create form gets a select "Ações por rodada" with 5, 6, 7, 8, 9, 10.
- **One counter**: `player.spentCommands + player.orders.length` remains the only ledger; it is renamed in the projection to `actions: { used, reserved, limit }`. A single function `chargeMainAction(state, actor, decisionId)` is the only place that checks and increments it; commands call it through their class, never with their own arithmetic. `decisionId` makes charging idempotent so the same decision is never charged twice (replaying a request already fails on the version check; this covers commands that internally trigger another).
- **Classification module** in `game-domain`: `const ACTION_CLASS = { ... } as const satisfies Record<CommandType, ActionClass>`. Adding a command without deciding its class fails typecheck. The projection exposes the class of each option so the interface can show a cost badge without duplicating the table.
- **Urban**: `urbanBlock()` keeps its per-city message; a new check reports "Sem ações principais nesta rodada" first, so the player can tell the two restrictions apart. Option `blocked` strings stay identical to the server refusal (existing parity test, 0 mismatches in the audit).
- **Privacy**: reservations already live in `player.orders` and are not projected to others. Urban and diplomatic reservations (slice B) follow the same allow-list rule: the projection to another player carries only `{ playerId, status: PLANNING | READY }`. A test walks every field of every other player's projection looking for reserved ids, targets and costs. Nothing private is sent and hidden with CSS.
- **Resolution events**: `resolution: ResolutionEvent[]` in the round report, each with `visibleTo` computed by the same visibility rules as the map (movement, exploration, foundation, production, construction, research, influence, combat, losses, retreat, advance, round events). The projection filters per player; the interface replays the filtered list under "RESOLVENDO A RODADA".
- **Rhythm**: today a player presses READY up to four times per round (PLANNING, URBAN_ACTIONS, DIPLOMACY_TRADE, and CONFLICTS when an attack exists and someone holds a reaction card). With private reservation of urban actions and diplomacy inside PLANNING, one READY covers the first three. CONFLICTS stays a separate interactive step because reactions need the attacker's revealed order. The engine phases `URBAN_ACTIONS`, `ORDERS_MOVEMENT`, `DIPLOMACY_TRADE` remain as resolution sub-phases, so the resolution order that tests rely on does not change; only the interactive phases shown to the player are reduced. Not done: removing sub-phases, changing initiative, changing when income is paid.

## Slices (go-ahead needed between them)

- **A. Economy without changing the turn**: `actionsPerRound` option, classification module, single ledger, urban actions charged, counter in the interface, tests. Urban actions still execute immediately in their phase. Lowest risk; enough for the playtest goal (compare 5 vs 10 decisions).
- **B. Private simultaneous planning**: reservation of urban and diplomatic actions during planning, single READY, resolution at close, "Planejando / Pronto" status for others.
- **C. Visible resolution**: "RESOLVENDO A RODADA", per-player projected events, replay, screenshots.

## Risks

Turn flow and persisted schema are touched; slice B moves urban effects from "immediate" to "at resolution", which changes what a player sees between decisions (a produced resource is no longer available to a later action of the same round unless the resolution order provides it). Mitigation: fixed resolution order, conservative validation, an explicit "não pôde ser realizada" event, and the existing deterministic replay tests extended to every class.
