## Purpose

Defines the checks that must be green, and the evidence that must exist, before the alpha is committed as a release, tagged or deployed, so a claim of readiness always rests on a reproducible result.

## ADDED Requirements

### Requirement: Automated gates
The release SHALL require lint, typecheck, unit and integration tests, production build, Prisma validation and a whitespace check to pass with zero failures.

#### Scenario: All green
- **WHEN** every automated gate is run on the release commit
- **THEN** each exits successfully and the counts are recorded in the report

#### Scenario: One red
- **WHEN** any gate fails
- **THEN** no release commit, tag, push or deploy is made

### Requirement: Browser gates
The release SHALL require the slice scenario and every alpha browser scenario, including a battle and a match finish, to pass with at least two independent clients.

#### Scenario: Conflict scenario
- **WHEN** the conflict scenario opens its fixture
- **THEN** it passes and does not fail on match identifier validation

### Requirement: Database gate
The release SHALL require the PostgreSQL integration suite to pass against a real database before deploy.

#### Scenario: Database unavailable
- **WHEN** no dedicated test database is configured
- **THEN** the gate is reported as not run, never as passed

### Requirement: Privacy gate
The release SHALL require the two-client privacy audit to pass with no hidden information in any projection.

#### Scenario: Leak found
- **WHEN** a view contains another player's private data
- **THEN** the release is blocked

### Requirement: Manual play gate
The release SHALL require a recorded manual run of every player action in the browser and a documented review of the manual against the rules.

#### Scenario: Missing action
- **WHEN** an action was not exercised
- **THEN** the report lists it as untested

### Requirement: Truthful reporting
The project report and known-limitations file SHALL state actual gate results, including skipped and failing items, and SHALL NOT claim a public release before it exists.

#### Scenario: Report matches evidence
- **WHEN** the report says a gate passed
- **THEN** a log or artifact from that run exists
