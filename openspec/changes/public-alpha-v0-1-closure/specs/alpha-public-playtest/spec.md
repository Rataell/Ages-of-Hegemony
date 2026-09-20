## Purpose

Defines the hosted environment and the real playtest that prove 2 to 6 people in separate browsers can finish a persistent match on a public URL.

## ADDED Requirements

### Requirement: Explicit deployment target and secrets
The deployment SHALL use only a target and credentials supplied by the project owner, with secrets held in the hosting service and never committed, logged or invented.

#### Scenario: Missing credential
- **WHEN** a required token or connection string is absent
- **THEN** deployment does not start and the missing item is reported

### Requirement: Public origin and cookies
The deployed service SHALL serve over HTTPS with a configured public origin and a private signing secret of at least 32 bytes.

#### Scenario: Misconfiguration
- **WHEN** the signing secret is shorter than 32 bytes
- **THEN** the service refuses to start or answers 503

### Requirement: Health and smoke test
The deployed service SHALL expose a health endpoint and SHALL pass a smoke test that creates a room, joins, plays a command and reloads.

#### Scenario: Smoke
- **WHEN** the smoke test runs against the public URL
- **THEN** it completes and the state persists across a reload

### Requirement: Multi-client public match
A playtest with 2 to 6 participants in separate browsers SHALL play a match to a winner on the public URL, including a server restart that loses no state.

#### Scenario: Full playtest
- **WHEN** the playtest is run
- **THEN** a winner is recorded, no participant loses their seat and the log of defects is saved

### Requirement: Tester disclosure
The public build SHALL be labelled as a test build and SHALL disclose lazy timers, cookie identity and lack of accounts.

#### Scenario: Landing page
- **WHEN** a tester opens the URL
- **THEN** the test-build label and limitations are visible before joining

### Requirement: Rollback plan
The deployment SHALL have a documented rollback that restores the previous build without dropping stored matches.

#### Scenario: Bad deploy
- **WHEN** a release is rolled back
- **THEN** stored matches remain readable
