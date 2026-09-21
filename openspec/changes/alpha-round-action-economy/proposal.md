## Why

Today a player has one shared budget of "command points" (`baseCommandPoints` = 4, plus government and institution modifiers). Strategic orders and only *some* other commands spend it: territory claims, improvements, development, specialization, road, era advance, civilization ability, settle, treaty proposals, war declarations, advisors and great projects. Urban actions (produce, build, recruit, research, mood, trade support, civic action) spend nothing from it and instead obey a second, per-city limit of one activation per round. The same kind of decision is therefore charged in different places, refused with different codes (`COMMAND_LIMIT` vs `RULE_FAILURE`) and different wording, and cheap territory commands can starve the decisions that matter: in the audit playtests (2, 4 and 6 players, QUICK) founding a second city, proposing a treaty and declaring war were refused with "Sem pontos de comando disponíveis" because two territory claims, one improvement and one road had already used all four points.

The playtest goal is to compare different amounts of *decisions per round*. That needs one global, configurable, well-defined **action economy**, not a "Command Points" currency with a parallel budget.

## What Changes

- **Main actions per round** (`actionsPerRound`): an integer chosen when the table is created, Alpha range 5 to 10 (options 5, 6, 7, 8, 9, 10). It is a match rule: it lives in the rules of the match, is persisted with it, reaches the engine, the server, the projection and the interface. No balance value is decided here; the default only exists so old clients and rooms keep working.
- **One central classification** of every command into MAIN (spends exactly one main action), FREE (spends none) or REACTION (a defensive answer to an enemy action; never consumes a previously planned action), defined once in `game-domain`, exhaustive by construction (a command type without a class does not compile) and consumed by the engine, the projection and the interface. No second counter.
- **Movement**: one MOVE order (one unit or one group) is one main action, whatever the number of hexes, as long as the path stays within the unit's mobility. Mobility is distance; the economy counts decisions.
- **Urban actions join the same economy**: producing in Aurora, building in Travessia and researching each cost one main action. A city keeps its own activation limit as a *different* restriction with its own message ("Aurora já foi ativada nesta rodada"), so a player can still have actions left while one city is exhausted.
- **Simultaneous private planning**: each player reserves up to their limit; other players receive only the previous public state and the status Planejando / Pronto, never the reserved orders. Confirming locks them ("Ações planejadas: 7 / 7 · Você está pronto · Aguardando Beto e Clara").
- **Explicit resolution**: when everyone confirms, the server closes planning and shows a phase "RESOLVENDO A RODADA". The server stays authoritative; resolution follows phase, initiative, dependencies and conflicts already defined; the interface replays the *authorized* results as structured events projected per player.
- **Fewer confirmations**: PULSO DO MUNDO, PLANEJAMENTO DAS AÇÕES, TODOS CONFIRMAM, RESOLUÇÃO, MANUTENÇÃO, FIM DA RODADA. The engine keeps its internal sub-phases for correct resolution; only the number of "Concluir fase" clicks the player sees goes down. See design.

Out of scope: choosing the definitive number of actions, changing costs, combat, economy or map rules, new units or mechanics, deploy.

## Capabilities

### New Capabilities
- `alpha-round-action-economy`: configurable main actions per round, central command classification, private simultaneous planning, explicit resolution.

## Impact

`packages/game-domain/src/alpha.ts` (rules, command classification, resolution events), `packages/game-engine/src/alpha-turn.ts`, `alpha-phases.ts`, `alpha-urban.ts`, `alpha-migration.ts`, `apps/server/src/alpha-room.ts`, `alpha-service.ts`, `alpha-projection.ts`, `apps/web/app/alpha/*`, persisted room/state schema (additive, with migration for rooms created before the change), tests and screenshots. It touches turn flow, so it is proposed as three slices with a go-ahead between them (design, "Slices").
