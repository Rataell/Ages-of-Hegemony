## Purpose

Defines the browser experience so a new player can understand and perform every v5 action in Portuguese, on desktop and phone widths, without reading source code.

## ADDED Requirements

### Requirement: Every rule has a control
The interface SHALL provide a control for each command a player can legally issue, including urban actions, trade offers, independent-people actions, cultural contests, posture choice and combat preview.

#### Scenario: Coverage
- **WHEN** the command list is compared with the interface
- **THEN** every command has at least one reachable control or is documented as engine-only

### Requirement: Costs and availability before commitment
The interface SHALL show cost, missing resources and the reason an action is unavailable before the player tries it.

#### Scenario: Unaffordable action
- **WHEN** a player cannot afford an action
- **THEN** the control is disabled and states what is missing

### Requirement: Seven resources and city state visible
The interface SHALL display all seven resources, storage limits, city level, mood, integration and fortification.

#### Scenario: Overflow warning
- **WHEN** a resource is near its capacity
- **THEN** the interface warns before the round ends

### Requirement: Portuguese copy matches the rules
The interface text SHALL be Portuguese and SHALL describe the six-era structure, eight phases and current victory rules accurately.

#### Scenario: Hegemony copy
- **WHEN** a player reads the Hegemony panel
- **THEN** it names the Hegemony era, not a fifth era

### Requirement: Round report and battle explanation
The interface SHALL show a per-round report and, for each battle, postures, dice, modifier sources and casualties.

#### Scenario: After a battle
- **WHEN** a participant opens the battle record
- **THEN** every modifier and its source is listed

### Requirement: Responsive and accessible layout
The interface SHALL be usable at 1440, 1280 and 390 pixel widths, in light and dark themes, with keyboard focus, labels and no horizontal page scroll.

#### Scenario: Phone width
- **WHEN** the board is opened at 390 pixels
- **THEN** all primary actions are reachable without horizontal page scrolling

### Requirement: Player help
The interface SHALL provide an onboarding flow and a compendium that match implemented rules.

#### Scenario: First match
- **WHEN** a new participant opens the help
- **THEN** it explains the round, resources, cities, combat and victory paths as implemented
