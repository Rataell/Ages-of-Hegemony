## Purpose

Defines the seven-resource economy and city lifecycle so players can grow, spend, store and lose cities under rules that are enforced identically for every participant.

## ADDED Requirements

### Requirement: Seven-resource accounting
The system SHALL track food, wood, stone, metal, wealth, knowledge and influence per player as non-negative integers, and every gain, spend and conversion SHALL go through one accounting path.

#### Scenario: Purchase after production
- **WHEN** a player receives production and then buys something
- **THEN** the production is still present in the remaining balance

#### Scenario: Insufficient funds
- **WHEN** a player attempts an action they cannot afford
- **THEN** the command is rejected and the state is byte-identical to before

### Requirement: Wealth substitution limits
The system SHALL allow wealth to cover a shortfall of wood, stone or metal at two wealth per missing unit, up to at most half of the material cost.

#### Scenario: Within limit
- **WHEN** a cost is short by no more than half of its material component and enough wealth exists
- **THEN** the purchase succeeds and wealth decreases by twice the shortfall

#### Scenario: Above limit
- **WHEN** the shortfall exceeds half of the material component
- **THEN** the purchase is rejected

### Requirement: Storage capacity
The system SHALL cap stored resources by base capacity plus building bonuses and SHALL discard the excess after the action that caused it.

#### Scenario: Overflow
- **WHEN** production would raise food above the player's capacity
- **THEN** stored food equals capacity and the excess is discarded

### Requirement: Urban actions
The system SHALL let each city take at most one urban action per round from produce, build, recruit, research, promote mood, support trade and civic action, validating actor, ownership, phase, remaining actions, resources, infrastructure and prerequisites on the server, and SHALL reset the counter when the urban phase opens. Occupied cities SHALL be limited to the civic action, which advances integration. Public investment SHALL raise mood by one and SHALL NOT lift a city above the configured ceiling by itself. Fortification upgrades and advanced pieces SHALL cost metal, all from one central Alpha table.

#### Scenario: Second action in a round
- **WHEN** a city that already acted submits another urban action
- **THEN** the command is rejected with a message naming the limit

#### Scenario: New round
- **WHEN** the next round begins
- **THEN** every city can act again

### Requirement: Mood and integration
The system SHALL keep each city's mood in seven ordered states that scale production and stability, and SHALL keep integration between 0 and 100 with newly captured cities at 0 and occupied cities blocked from administration until integrated.

#### Scenario: Occupied city administration
- **WHEN** an owner tries to build in an occupied, unintegrated city
- **THEN** the command is rejected

#### Scenario: Integration payment
- **WHEN** the occupier pays the integration cost in a round after the capture
- **THEN** the city becomes owned and integration is 100

### Requirement: Founding and capture keep city records consistent
The system SHALL create city metadata when a pioneer founds a city and SHALL update owner, status, integration and capital flag when a city changes hands.

#### Scenario: Founding
- **WHEN** a pioneer founds a city
- **THEN** exactly one new city record exists, the pioneer is consumed and the state validates

#### Scenario: Losing the last city
- **WHEN** a player loses their final city but keeps a pioneer
- **THEN** the player stays in the match and can found a new city

### Requirement: Metal requires a deposit, a mine and a producer
The system SHALL produce metal only when a worked hex of a non-occupied city has a metal deposit, a Mine and an assigned Producer, at the configured rate per hex per round, and SHALL NOT give a generic Producer, an unmined deposit or a deposit-less Mine any metal. No separate mining population role SHALL exist.

#### Scenario: All three present
- **WHEN** a Producer works a hex with a metal deposit and a Mine
- **THEN** the owner gains the configured metal at round maintenance and the round report shows it as mining

#### Scenario: Missing element
- **WHEN** the hex lacks the deposit, the Mine or an assigned Producer
- **THEN** no metal is produced

#### Scenario: Occupied city
- **WHEN** the city is occupied and not integrated
- **THEN** it produces no metal

### Requirement: Generic material costs never demand metal
The system SHALL pay a generic material cost from wood, then stone, then metal, and SHALL NOT add a metal requirement of its own.

#### Scenario: Wood exhausted
- **WHEN** a player without wood pays a generic material cost
- **THEN** stone is spent first and metal only if stone is also short

### Requirement: Storage discards are recorded
The system SHALL record every storage discard, in an event for action-time gains and in the round report for maintenance gains, so reports still balance.

#### Scenario: Maintenance overflow
- **WHEN** maintenance production exceeds capacity
- **THEN** the excess is discarded, the report's discarded amounts equal it and closing plus discarded reconciles with opening plus income minus upkeep
