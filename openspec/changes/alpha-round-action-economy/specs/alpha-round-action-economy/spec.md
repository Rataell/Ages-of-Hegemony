## ADDED Requirements

### Requirement: Configurable main actions per round
A match SHALL have an integer number of main actions per round per player, chosen when the table is created, from 5 to 10 in the Alpha. The value SHALL be part of the match rules, persisted with the match, and applied by the engine, the server, the projection and the interface. A value outside the range SHALL be refused at creation.

#### Scenario: Valid choices
- **WHEN** a table is created with 5, 6, 7, 8, 9 or 10 actions per round
- **THEN** the server accepts it and every player of that match has that many main actions each round

#### Scenario: Invalid choices
- **WHEN** a table is created with 4 or 11 actions per round
- **THEN** the server refuses it with a readable message and no table is created

#### Scenario: Older matches
- **WHEN** a match created before this rule is loaded
- **THEN** it behaves exactly as before

### Requirement: One central classification of commands
Every command SHALL belong to exactly one class defined in one place: MAIN (spends one main action), FREE (spends none) or REACTION (a defensive answer to an enemy action, never consuming a previously planned action). Engine, projection and interface SHALL read that classification and SHALL NOT keep another counter.

#### Scenario: Adding a command
- **WHEN** a command type exists without a class
- **THEN** the build fails

#### Scenario: One decision, one charge
- **WHEN** a decision is accepted
- **THEN** exactly one main action is charged, once, and a refused decision changes nothing

### Requirement: Movement counts decisions
Moving one unit or one group along a path within its mobility SHALL cost one main action, however many hexes the path has.

#### Scenario: Three-hex move
- **WHEN** a player orders a unit from 5,3 through 6,3 to 7,4 within its mobility
- **THEN** one main action is used

### Requirement: Urban actions use the same economy
Each urban action SHALL cost one main action. A city MAY keep its own activation limit as a different restriction with its own message.

#### Scenario: City exhausted, player not
- **WHEN** a city has used its activation limit and the player still has main actions
- **THEN** a second action in that city is refused with the city message, and other cities remain available

### Requirement: Private simultaneous planning
Each player SHALL reserve actions up to their limit without other players receiving the reserved actions. Other players SHALL receive only the previous public state and the status Planejando or Pronto. Confirming SHALL lock the reservations.

#### Scenario: Opponent view
- **WHEN** Ana reserves an explorer move and Beto reads the match before resolution
- **THEN** Beto's projection contains no reserved order, target or cost of Ana, only her status

#### Scenario: Confirmation
- **WHEN** a player confirms with 7 of 7 actions planned
- **THEN** the interface shows "Ações planejadas: 7 / 7 · Você está pronto" and who is still awaited

### Requirement: Explicit resolution
When every player has confirmed, the server SHALL close planning and the interface SHALL show the phase "RESOLVENDO A RODADA". The server SHALL stay authoritative, and the interface SHALL replay only results the viewer is allowed to see.

#### Scenario: Visibility of a move
- **WHEN** Ana's explorer move resolves
- **THEN** Ana sees it and may reveal the region, and Beto sees it only if his own vision allows
