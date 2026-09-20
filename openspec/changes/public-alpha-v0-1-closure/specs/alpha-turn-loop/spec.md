## Purpose

Defines the round structure, readiness, timing, reporting and victory logic so a match always advances legally and ends with a verifiable winner.

## ADDED Requirements

### Requirement: Eight-phase round
The system SHALL run each round through world pulse, planning, urban actions, orders and movement, diplomacy and trade, conflicts, integration and maintenance, and end of round, in that order, driven by one authoritative phase indicator.

#### Scenario: Phase order
- **WHEN** all players confirm readiness in a decision phase
- **THEN** the match advances to the next phase in the fixed order and never skips or repeats one

#### Scenario: Wrong phase
- **WHEN** a command is submitted outside the phases that accept it
- **THEN** it is rejected with a wrong-phase code without changing state

#### Scenario: Automatic phases
- **WHEN** a decision phase closes
- **THEN** the world pulse, orders and movement, conflicts, integration and maintenance, and end of round run in order without waiting for players, and the round stops only at the next phase that needs decisions

#### Scenario: Unbuilt commands
- **WHEN** a client sends a command whose rules are not implemented yet
- **THEN** it receives a not-implemented error instead of a silent success

### Requirement: Command capacity and readiness
The system SHALL limit each player's spending commands per round to their capacity, SHALL mark readiness per player, and SHALL reject further commands after a player confirms.

#### Scenario: Capacity exhausted
- **WHEN** a player has used all command points
- **THEN** another spending command is rejected with a capacity message

#### Scenario: Already ready
- **WHEN** a ready player submits a command
- **THEN** it is rejected with an already-ready code

### Requirement: Optimistic concurrency
The system SHALL reject any command whose expected version differs from the stored version.

#### Scenario: Stale client
- **WHEN** a client sends a command with an old version
- **THEN** it receives a version-conflict error and state is unchanged

### Requirement: Round report arithmetic
The system SHALL publish a per-player round report whose closing balances equal opening plus institutions plus trade plus mining plus economy net change minus upkeep paid minus storage discarded, for every resource.

#### Scenario: Consistent report
- **WHEN** a round completes
- **THEN** every report line satisfies the equation and the state validates

### Requirement: Era progression by criteria count
The system SHALL let a player advance one era at a time through Foundation, Expansion, Civilization, Empires, Ascension and Hegemony when at least the configured number of that step's criteria (cities, population, territory, districts, research, development, government, contacts) is met, so specialised civilizations need not meet every criterion. The thresholds and required counts SHALL live in one central configuration.

#### Scenario: Specialised advance
- **WHEN** a player meets the required count of criteria but not all of them
- **THEN** the advance succeeds

#### Scenario: Below the required count
- **WHEN** a player meets fewer criteria than required
- **THEN** the command is rejected with the counts met and needed, and the era is unchanged

#### Scenario: One era per evaluation
- **WHEN** a player meets every criterion of every later step
- **THEN** a single advance moves exactly one era

#### Scenario: Breakdown
- **WHEN** a client requests progress
- **THEN** it receives each criterion with its current value, minimum and met flag, plus the satisfied and needed counts

#### Scenario: Finishable match
- **WHEN** the scripted full-match scenario runs on the STANDARD preset
- **THEN** it reaches a legitimate winner within the preset's round limit without hand-edited state

### Requirement: Hegemony and round-limit victory
The system SHALL award victory to a player who declares a path, meets its requirements and holds them for the configured consolidation rounds, or to the prestige leader at the round limit.

#### Scenario: Consolidation
- **WHEN** a qualified player holds requirements for two full rounds
- **THEN** the match finishes with a Hegemony winner

#### Scenario: Requirement lost
- **WHEN** the requirements are lost before consolidation completes
- **THEN** consolidation restarts and no winner is declared

### Requirement: Deterministic replay
The system SHALL produce identical states and event histories when the same command script is replayed on the same seed.

#### Scenario: Replay
- **WHEN** the full scenario is run twice
- **THEN** final states and command traces are equal

### Requirement: No automatic production
The system SHALL credit city output only through the PRODUCE urban action (mining included), credit persistent institutional production once per round on the player's first PRODUCE, and SHALL NOT credit any city output by advancing a phase or a round.

#### Scenario: Idle round
- **WHEN** a round completes and no city took PRODUCE
- **THEN** every player's report shows zero production, mining and institutional gains, and only upkeep, world pulse and discards change balances

#### Scenario: Growth
- **WHEN** maintenance computes population growth
- **THEN** only food produced that round can feed it
