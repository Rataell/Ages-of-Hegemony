## Purpose

Defines how armies and fleets fight, so battles are random only through the private dice, previewable from public inputs and explainable after the fact.

## ADDED Requirements

### Requirement: Legal attack orders
The system SHALL accept an attack only from units of one hex, against an enemy at war and known to the attacker, with units that exist and are not already committed.

#### Scenario: No war
- **WHEN** a player orders an attack on a non-belligerent
- **THEN** the order is rejected and asks for a war declaration

### Requirement: Strength and dice resolution
The system SHALL resolve a battle by comparing each side's strength plus modifiers, where the modifiers include the outcome of one six-sided tactical die per participating combat unit drawn from the private random source (faces EMPTY, IMPACT, IMPACT, GUARD, MANEUVER, COMMAND), with the higher total winning and ties going to the defender. Every number involved SHALL live in the central combat configuration.

#### Scenario: Determinism
- **WHEN** the same battle is resolved twice from identical state
- **THEN** results are identical

#### Scenario: Arithmetic
- **WHEN** a battle record is stored
- **THEN** each total equals strength plus the sum of the recorded modifier breakdown

### Requirement: Postures and tactical faces
The system SHALL let each side hold an assault, hold or maneuver posture, with a small circular advantage (no posture wins automatically), and SHALL record per-unit tactical faces. COMMAND SHALL act by unit class: infantry impact or guard by posture, guard extra guard and city protection, ranged converting one empty allied die to impact, cavalry flank where terrain allows, siege breaching fortifications, fleet naval superiority. GUARD cancels enemy IMPACT. The defender's posture is private until a battle is resolved.

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
The system SHALL enforce per-civilization, per-hex limits taken from the central balance: land military 6 (7 with Command I, 8 with Command II); civilians 2 extra; city garrison 6 raised by a military district, fortification level and protection doctrine, capped at 10; fleets 4 (5 with the naval upgrade). Civilians, army and fleets are separate stacks. Existing stacks above a limit are never altered; only new arrivals are refused.

#### Scenario: Over the limit
- **WHEN** a move would end above a stack limit
- **THEN** the move is rejected with "limite de pilha atingido", both when queued (counting other queued arrivals) and when it resolves

#### Scenario: Recruit
- **WHEN** a city's garrison, civilian or fleet stack is full
- **THEN** recruiting that class is blocked with the same reason

#### Scenario: Retreat and victory advance
- **WHEN** a defeated force retreats
- **THEN** only a hex with room for every survivor is legal, otherwise the existing loss rule applies
- **AND** a victorious force advances only as many pieces as the target hex allows, in id order, the rest staying where they attacked from

#### Scenario: Preview parity
- **WHEN** the client warns about a move or attack
- **THEN** it uses the same verdict as the server, computed from the projected stack view

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
