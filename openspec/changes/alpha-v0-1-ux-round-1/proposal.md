## Why

The first human test of the closed alpha found four friction points: the lobby only copied a link, there was no way out of a match, the create form offered planning deadlines the schema rejects and hid the world preset, and the atlas looked small at the start of a match.

## What Changes

- Lobby: separate "Copiar código" and "Copiar link" with short visual feedback; manual code entry stays.
- "Sair da partida" in the lobby and in a running match. It only forgets the match in this browser (clears `aoh-alpha-room`, drops `game` from the URL, returns to `/alpha`). Nothing is sent, the saved match and every seat are untouched. The invite code brings the person back.
- Create form: world preset (Continental, Arquipélago, Mar Interior, Misto) sent as `worldPreset`; planning deadlines limited to the schema values (0, 3 min, 5 min, 8 min, 1 h, 4 h, 8 h).
- Atlas: frame computed from the real bounds of the projected tiles plus padding; "Centralizar" fits the known area; desktop council and inspector can fold away.
- World size: audited, see design.

Out of scope: removing a player from a started match, ending the guest session, new mechanics, redesign, deploy.

## Capabilities

### Modified Capabilities
- `alpha-play-interface`: invites, leaving, creation options, atlas framing.

## Impact

`apps/web/app/alpha/*`, `apps/web/app/play/hex-map.tsx` (+ pure `map-frame.ts`), tests, screenshots under `docs/evidence/alpha-ux-round-1`.
