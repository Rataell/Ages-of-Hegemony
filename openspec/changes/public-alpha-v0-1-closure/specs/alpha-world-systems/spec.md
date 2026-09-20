## Purpose

Defines the shared world around the players: exploration, events, independent peoples, raiders and trade, so the map feels alive without giving anyone hidden knowledge.

## ADDED Requirements

### Requirement: Exploration and knowledge
The system SHALL reveal regions and hexes only to players whose units, cities or territory can see them, and SHALL persist that knowledge.

#### Scenario: Unexplored hex
- **WHEN** a player has never seen a hex
- **THEN** the client receives no terrain, owner or unit information for it

### Requirement: World pulse
The system SHALL draw one card from the 24-card world pulse deck at the start of each round using the private random source, apply its modules to every player, and discard it.

#### Scenario: Draw and apply
- **WHEN** a round begins
- **THEN** exactly one card is drawn, its effects appear in the round report and the deck shrinks by one

#### Scenario: Empty deck
- **WHEN** the deck is empty
- **THEN** the discard pile is reshuffled deterministically

### Requirement: Independent peoples
The system SHALL let players trade with, negotiate with, influence, protect, integrate or conquer independent peoples, each action subject to attitude and cost, with results visible only under fog-of-war rules.

#### Scenario: Integration
- **WHEN** a player with enough influence integrates an independent people
- **THEN** it becomes a city owned by that player and the record is marked integrated

### Requirement: Raid bands
The system SHALL move raid bands by deterministic rules, let them attack exposed weak targets, and let players fight them.

#### Scenario: Raid movement
- **WHEN** a round ends
- **THEN** each band moves at most once and its last-moved round is updated

### Requirement: Trade offers
The system SHALL support instant trades, gifts, future promises and loans, each with a proposer, recipient, status and due round, and SHALL settle or default them on schedule.

#### Scenario: Accepted trade
- **WHEN** a recipient accepts an instant trade
- **THEN** both balances change atomically and the offer is settled

#### Scenario: Defaulted promise
- **WHEN** a promise passes its due round unpaid
- **THEN** it is marked defaulted and both parties see the outcome

### Requirement: Trade routes
The system SHALL let a player run a route between two cities along a legal path, pay route income each round, and suspend it when the path is severed or a party is at war.

#### Scenario: Severed route
- **WHEN** a captured city lies on a route
- **THEN** the route is removed or suspended and income stops
