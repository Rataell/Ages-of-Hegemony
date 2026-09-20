## Purpose

Gives each civilization one permanent leader whose small passive and once-per-Era ability reinforce the civilization's existing identity, without adding a new economy, recruitment or victory route.

## ADDED Requirements

### Requirement: One leader per civilization, assigned automatically
The system SHALL give each of the twelve civilizations exactly one leader, assign it when the civilization is chosen, keep it for the whole match, and keep leaders distinct from advisors.

#### Scenario: Match start
- **WHEN** a match starts
- **THEN** every player already has the leader of their civilization and no player can hold another civilization's leader

#### Scenario: Older states
- **WHEN** a state or snapshot created before leaders is loaded
- **THEN** each player with a civilization receives its leader without changing anything else

### Requirement: Small standing passive
The system SHALL apply the leader's passive continuously and exactly once, limited to extra storage of one resource, one extra hex of supply for the civilization's pieces, or extra integration from the civic action, and SHALL NOT produce resources.

#### Scenario: No stacking
- **WHEN** a passive applies
- **THEN** it changes exactly the one figure it names by exactly its configured amount

### Requirement: One era ability per Era
The system SHALL let a leader use its ability once per Era during planning without spending command points, SHALL restrict its effect to the acting civilization, SHALL refuse it when it would change nothing, and SHALL make it available again only when the civilization advances to the next Era.

#### Scenario: Second use
- **WHEN** a leader tries to use the ability twice in the same Era
- **THEN** the second use is refused and state is unchanged

#### Scenario: Era reset
- **WHEN** the civilization advances an Era
- **THEN** the ability becomes available again

#### Scenario: Round-limited bonuses
- **WHEN** an ability grants strength, movement or command
- **THEN** the bonus lasts only for the round in which it was used

### Requirement: Comparable power from one table
The system SHALL define every leader number in one central configuration so leader power stays comparable, and no leader SHALL grant free repeatable units, bypass technology requirements, duplicate the civilization's resource production or win the game.

#### Scenario: Budget check
- **WHEN** the catalog is validated
- **THEN** every passive and ability amount equals its entry in the central table

### Requirement: Visible in the civilization panel
The interface SHALL show the leader's name, title, passive, era ability and whether the ability is available or used, using a placeholder avatar.

#### Scenario: Used ability
- **WHEN** the ability has been used this Era
- **THEN** the panel marks it as used and disables the control
