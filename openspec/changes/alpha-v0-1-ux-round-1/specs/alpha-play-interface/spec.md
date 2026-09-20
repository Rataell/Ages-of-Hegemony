## ADDED Requirements

### Requirement: Invites
The lobby SHALL offer separate actions to copy only the join code and to copy the full invite link, each with short visual confirmation, and SHALL keep manual entry by code.

#### Scenario: Copy code
- **WHEN** a person chooses "Copiar código"
- **THEN** only the join code is placed on the clipboard and "Código copiado" is shown

#### Scenario: Copy link
- **WHEN** a person chooses "Copiar link"
- **THEN** `<origin>/alpha?join=<code>` is placed on the clipboard and "Link copiado" is shown

### Requirement: Leaving a match
The interface SHALL offer "Sair da partida" in the lobby and during a match. Leaving SHALL only clear the remembered match and the `game` URL parameter in this browser and return to `/alpha`, without sending anything that changes a saved match. Removing a player from a started match is not offered.

#### Scenario: Leave and return
- **WHEN** a seated person leaves and later enters the same code
- **THEN** they return to their own seat with the match unchanged

### Requirement: Creation options
The create form SHALL offer the world presets Continental, Arquipélago, Mar Interior and Misto, sending `worldPreset`, and SHALL offer only the planning deadlines the schema accepts: none, 3 minutes, 5 minutes, 8 minutes, 1 hour, 4 hours and 8 hours.

#### Scenario: Every option is valid
- **WHEN** any offered option is submitted
- **THEN** the server accepts it

### Requirement: Atlas framing
The atlas SHALL frame exactly the tiles the server projected to the player, fit that area by default and on "Centralizar", and SHALL NOT draw tiles the server did not project. On desktop the council and inspector SHALL be collapsible.

#### Scenario: Start of a match
- **WHEN** a match starts with a few known hexes
- **THEN** those hexes fill the atlas instead of a fixed minimum area
