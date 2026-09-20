## Purpose

Defines who can join, who can act and what each participant may see, so 2 to 6 people in separate browsers share one match without leaking private information or overwriting each other.

## ADDED Requirements

### Requirement: Guest identity and seats
The system SHALL identify each participant by a server-signed guest cookie, seat between 2 and 6 participants per room, and SHALL admit a participant only with a valid join code and only while seats remain.

#### Scenario: Room full
- **WHEN** a seventh participant, or one beyond the room's seat limit, tries to join
- **THEN** the join is rejected and the room is unchanged

#### Scenario: Forged cookie
- **WHEN** a request carries a tampered identity cookie
- **THEN** it is treated as unauthenticated

### Requirement: Server-side authorization
The system SHALL derive the acting player from the cookie, never from the request body, and SHALL let a participant command only their own civilization.

#### Scenario: Impersonation
- **WHEN** a client supplies another player's id in a command
- **THEN** the command is rejected with a forbidden code and state is unchanged

### Requirement: Private information projection
The system SHALL send each client only its own hand, ambitions, orders, hidden knowledge and resources, and SHALL never send random seeds, counters, deck order or tokens.

#### Scenario: Two clients
- **WHEN** two participants fetch their views of the same match
- **THEN** neither view contains the other's hand, ambitions, orders or unexplored terrain

#### Scenario: Secret fields
- **WHEN** any view is serialized
- **THEN** it contains no seed, counter, deck contents or session secret

### Requirement: Allow-list projection for new fields
The system SHALL expose each v5 field to clients only through an explicit projection with a test that fails when an unlisted field appears.

#### Scenario: New field added
- **WHEN** a field is added to the state without a projection entry
- **THEN** the leak test fails

### Requirement: Concurrent submission
The system SHALL serialize concurrent commands through compare-and-swap, applying exactly one and reporting a conflict to the other.

#### Scenario: Simultaneous commands
- **WHEN** two clients submit commands against the same version
- **THEN** exactly one succeeds and the other receives a version conflict

### Requirement: Reconnection
The system SHALL let a returning participant resume their seat from the same cookie after closing the browser or restarting the server.

#### Scenario: Reload
- **WHEN** a participant reloads mid-round
- **THEN** they see their current state and unfinished planning
