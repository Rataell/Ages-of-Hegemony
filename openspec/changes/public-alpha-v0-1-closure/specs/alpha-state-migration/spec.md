## Purpose

Defines how older match snapshots become the current v5 alpha state without data loss, so persisted matches survive the release and can be rolled back.

## ADDED Requirements

### Requirement: Single authoritative v5 envelope
The system SHALL represent every active alpha match as one schema-version-5 state whose seven-resource pool, eight-phase indicator and six-era progression are the only sources of truth for those concepts.

#### Scenario: Round trip
- **WHEN** a valid v5 state is serialized and deserialized
- **THEN** the result is deeply equal and passes the state schema

#### Scenario: No divergent resource pools
- **WHEN** any command or phase changes a player's resources
- **THEN** no second stored pool for that player differs from the authoritative pool

### Requirement: Explicit idempotent migration
The system SHALL convert v3 and v4 snapshots to v5 only through an explicit migration that is idempotent and returns an error, leaving the input untouched, for invalid or unknown input.

#### Scenario: Migrating v4 twice
- **WHEN** a v4 snapshot is migrated and the result is migrated again
- **THEN** the second result equals the first

#### Scenario: Unknown version
- **WHEN** a snapshot with an unrecognized schema version is decoded
- **THEN** decoding fails with an error and no stored data changes

#### Scenario: Declared Hegemony is preserved
- **WHEN** a v4 player already in the Hegemony era with a declaration is migrated
- **THEN** the migrated player is still in the Hegemony era with the same declaration

### Requirement: Rollback safety
The system SHALL keep the original snapshot recoverable whenever it migrates persisted data, and SHALL NOT perform any destructive schema contraction in this release.

#### Scenario: Read does not write
- **WHEN** a persisted v4 room is loaded and migrated in memory
- **THEN** the stored row is unchanged and no archive is created

#### Scenario: First v5 save archives the original
- **WHEN** the first successful compare-and-swap save rewrites a legacy row
- **THEN** the exact original snapshot is stored in an archive in the same transaction and later saves add no archive

### Requirement: Legacy slice compatibility
The system SHALL keep the local slice at `/` and v3 snapshots readable and playable.

#### Scenario: Slice regression
- **WHEN** the pre-alpha slice tests and its Playwright scenario run
- **THEN** they pass unchanged
