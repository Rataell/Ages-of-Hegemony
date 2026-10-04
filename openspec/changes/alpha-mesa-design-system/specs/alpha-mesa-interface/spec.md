## ADDED Requirements

### Requirement: One design system
The product SHALL take its colors, type and component styles from one token source, the same one the AoH Design System artifact is built from. Every color variable used by the Alpha CSS SHALL be defined by that source.

#### Scenario: No undefined token
- **WHEN** the Alpha stylesheets are checked
- **THEN** every `var(--name)` they use is a token of `apps/web/app/design/tokens.json`

#### Scenario: Compiled CSS is current
- **WHEN** `tokens.json` changes
- **THEN** the compiled `tokens.css` matches it, or the test fails

### Requirement: One dominant action
At any moment of a match the interface SHALL show at most one enabled gold (`.primary`) action. Selection, paths, targets and alerts SHALL NOT use the gold accent.

#### Scenario: Planning
- **WHEN** a player is planning with no card in focus and no panel open
- **THEN** the only enabled gold action is the tray's confirmation

#### Scenario: Card in focus
- **WHEN** a card of the hand is in focus
- **THEN** its "Jogar carta" is the only enabled gold action

### Requirement: Map-first table
During a match the map SHALL fill the screen between a strip of at most 52 px and a tray of at most 72 px. Resources (Cofre) and the areas (Livro) SHALL open on demand over the map and close back to it. The page itself SHALL NOT scroll.

#### Scenario: 1366×768
- **WHEN** a match is open at 1366×768
- **THEN** the map occupies at least 75% of the viewport width and the document does not scroll

#### Scenario: Livro
- **WHEN** a player opens the Livro and chooses an area
- **THEN** the area shows over the map, and "Voltar ao mapa" or Esc returns to the map with the selection kept
