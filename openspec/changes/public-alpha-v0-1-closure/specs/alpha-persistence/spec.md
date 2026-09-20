## Purpose

Defines durable storage of matches on PostgreSQL so a match survives process restarts and concurrent writers, and so deployment does not require destructive database operations.

## ADDED Requirements

### Requirement: Additive migrations only
The system SHALL apply schema changes only through additive Prisma migrations deployed with the deploy command, and SHALL NOT run reset or dev-migrate against a shared or public database.

#### Scenario: Deploy
- **WHEN** migrations are deployed to an empty database
- **THEN** the alpha match table exists and no existing table is dropped or altered destructively

### Requirement: Versioned compare-and-swap writes
The system SHALL store one snapshot row per room with a version and SHALL update it only when the stored version equals the expected version.

#### Scenario: Stale writer
- **WHEN** a writer saves with an outdated version
- **THEN** the write is refused and the stored row is unchanged

### Requirement: Restart durability
The system SHALL restore an in-progress match exactly after the server process restarts.

#### Scenario: Restart
- **WHEN** the server restarts mid-round
- **THEN** every participant can resume with the same state, including pending orders and readiness

### Requirement: Decode-time migration
The system SHALL migrate an older stored snapshot when it is read, persist the v5 result only under compare-and-swap, and fail closed on unknown versions.

#### Scenario: Stored v4
- **WHEN** a v4 row is read
- **THEN** the client sees a valid v5 match and the row is saved as v5 on the next successful command

### Requirement: Real database proof
The system SHALL provide an integration suite that runs against a dedicated PostgreSQL database and SHALL NOT claim durability from in-memory tests.

#### Scenario: Integration run
- **WHEN** the suite is run with a dedicated database URL
- **THEN** create, read, migrate, concurrent-save and restart scenarios pass

### Requirement: Missing configuration fails visibly
The system SHALL respond with a service-unavailable error, never an in-memory fallback, when the database or the signing secret is missing.

#### Scenario: No database
- **WHEN** the alpha API is called without a configured database
- **THEN** it responds 503 and stores nothing
