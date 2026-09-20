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

### Requirement: One urban panel, previewed before confirming
The interface SHALL offer every urban action through a single panel that shows, before confirmation, the cost, the requirements, the main effect, the actions the city has left and the exact reason an option is blocked, and SHALL NOT offer any second control for the same action.

#### Scenario: Blocked option
- **WHEN** a player selects an option they cannot take
- **THEN** the reason is shown and the confirm control stays disabled

#### Scenario: PRODUCE is a choice
- **WHEN** a player views a city during the urban phase
- **THEN** the interface states that a city that does not produce yields nothing, works no resources and extracts no metal

#### Scenario: Reconnecting
- **WHEN** a player reloads during the urban phase
- **THEN** the panel shows the city's remaining actions as the server holds them
