## Decisions

- **Leave is client-only.** Removing a player from a started match would need rules for their cities, units, ready state and victory checks; none exist. `join` is idempotent for a seated guest, so the invite code is a safe way back. The code is shown in the leave confirmation and in the in-game "Sobre o teste" panel.
- **Guest session is not ended.** The session cookie is HttpOnly, so only a server endpoint could clear it, and clearing it would orphan the seat for good (identity is the only key to it). Proposal for a later change: an explicit "trocar de identidade" that first warns the seat is lost.
- **Atlas frame.** `mapFrame()` measures only the tiles handed to the map (the ones the server projected), adds 24 units of padding and applies a small floor (300 x 260) only against a one-hex atlas. Zoom 1 shows the whole frame; the old 600 x 500 minimums are gone. `HexMap` is shared with the local slice, which now also opens fitted.
- **Collapsible panels** are desktop-only (>= 901px), stored per browser, and never hide the atlas information the server did not project.

## World size audit

The concept sizes 37 / 61 / 91 regions are **not supported**. `createAlphaGame` builds a fixed 6 x 5 grid of 30 regions (210 hexes, 7 per region) with home regions at fixed grid positions for up to six players (`homes` in `alpha-world.ts`; 6 homeland and 24 frontier templates in `alpha-regions.ts`). There is no size parameter in `AlphaRulesSchema`, the room schema or the create payload, and no test for another size. Supporting them needs, in a separate change: a size in rules and room, generators for 37/61/91 region layouts, home placement per player count, template supply (30 templates today), and determinism, projection, supply and stack tests per size. No size selector is exposed.
