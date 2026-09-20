## Purpose

Defines cultural influence between civilizations as a peaceful path to power, so influence and cultural hegemony are earned by visible, contestable actions.

## ADDED Requirements

### Requirement: Foreign presence levels
The system SHALL record each city's foreign cultural presence at contact, rooted or predominant level, with at most three foreign civilizations per city.

#### Scenario: Cap
- **WHEN** a fourth civilization tries to establish presence in a city
- **THEN** the command is rejected

### Requirement: Presence contests
The system SHALL resolve a contested presence with two dice from the private random source, using three cultural slots and the participants' modifiers, and SHALL record the result in telemetry.

#### Scenario: Contest recorded
- **WHEN** a defender is challenged
- **THEN** the outcome, both totals and modifiers are stored and the loser's level cannot rise above the winner's

### Requirement: Cultural anchor and cohesion
The system SHALL let a city hold at most one cultural anchor and SHALL keep local cohesion between 0 and 100.

#### Scenario: Cohesion bounds
- **WHEN** cohesion would fall below 0 or rise above 100
- **THEN** it is clamped

### Requirement: Cultural victory metrics
The system SHALL count cultural districts, foreign-influenced cities and influence toward the cultural Hegemony path from the same records the interface shows.

#### Scenario: Metric parity
- **WHEN** a player views the cultural path
- **THEN** the displayed values equal the values the engine uses to qualify

### Requirement: Occupation interaction
The system SHALL keep foreign presence attached to a city when it changes hands and SHALL NOT let an occupier gain presence in a city it already owns.

#### Scenario: Capture
- **WHEN** a city with foreign presence is captured
- **THEN** its presence list remains valid and contains no entry for its current owner
