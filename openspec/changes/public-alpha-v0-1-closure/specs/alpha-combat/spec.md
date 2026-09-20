## Purpose

Defines how armies and fleets fight, so battles are random only through the private dice, previewable from public inputs and explainable after the fact.

## ADDED Requirements

### Requirement: Legal attack orders
The system SHALL accept an attack only from units of one hex, against an enemy at war and known to the attacker, with units that exist and are not already committed.

#### Scenario: No war
- **WHEN** a player orders an attack on a non-belligerent
- **THEN** the order is rejected and asks for a war declaration

### Requirement: Strength and dice resolution
The system SHALL resolve a battle by comparing each side's strength plus modifiers plus two six-sided dice drawn from the private random source, with the higher total winning and ties going to the defender.

#### Scenario: Determinism
- **WHEN** the same battle is resolved twice from identical state
- **THEN** results are identical

#### Scenario: Arithmetic
- **WHEN** a battle record is stored
- **THEN** each total equals strength plus modifiers plus both dice

### Requirement: Postures and tactical faces
The system SHALL let each side hold an assault, hold or maneuver posture, with a one-point advantage under the posture rules, and SHALL record per-unit tactical faces.

#### Scenario: Posture recorded
- **WHEN** a battle is resolved
- **THEN** the record shows both postures and the tactical faces used

### Requirement: Modifier breakdown by source
The system SHALL store and expose every modifier's source and amount for both sides.

#### Scenario: Explainable result
- **WHEN** a player opens a resolved battle
- **THEN** each modifier appears with its source and the amounts sum to the recorded modifier total

### Requirement: Supply, terrain and fortification
The system SHALL penalise unsupplied attackers, grant defenders terrain bonuses on hills and mountains, and apply fortification level and damage state to city defense.

#### Scenario: Unsupplied attackers
- **WHEN** an attacking unit is outside supply range
- **THEN** the configured penalty applies and appears in the breakdown

### Requirement: Stack limits
The system SHALL enforce per-hex limits for military units, civilians, fleets and cities.

#### Scenario: Over the limit
- **WHEN** a move would exceed a stack limit
- **THEN** the move is rejected

### Requirement: Casualties, retreat and occupation
The system SHALL remove losses in proportion to victory margin, retreat the loser when a legal hex exists, and occupy a captured city with the winner while transferring its controlled hexes.

#### Scenario: Winner takes a city
- **WHEN** an attacker defeats a city's defenders
- **THEN** the city is occupied, integration is 0 and the previous owner's records stay consistent

### Requirement: Combat preview
The system SHALL show an attacker, before committing, the expected strengths and modifier breakdown without revealing hidden information or dice.

#### Scenario: Preview
- **WHEN** a player selects attackers and a target
- **THEN** the preview lists both strengths and modifiers and no dice values
