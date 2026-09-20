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
- **THEN** it is rejected without changing state

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
The system SHALL publish a per-player round report whose closing balances equal opening plus institutions plus trade plus economy net change minus upkeep paid, for every resource.

#### Scenario: Consistent report
- **WHEN** a round completes
- **THEN** every report line satisfies the equation and the state validates

### Requirement: Era progression and milestones
The system SHALL let a player advance through Foundation, Expansion, Civilization, Empires, Ascension and Hegemony only when the milestone row for the current era is met.

#### Scenario: Milestones unmet
- **WHEN** a player asks to advance with a missing milestone
- **THEN** the command is rejected and the projection lists the missing items

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
