## Why

The PO tested the V2.2 table art in the real Alpha and approved it. The rest of the interface still looks and behaves like the older shell:
- a top bar plus a row of area tabs;
- a Council on the left and an Inspector on the right;
- several gold buttons at once;
- fonts that are named but never loaded.

The approved AoH artifacts describe a different table, the Experience V2.1 Mesa. Its traits:
- the map leads;
- a compact strip on top;
- a tray with one dominant action;
- the Cofre (resources) and the Livro (book of areas) open on demand;
- a contextual card next to what is selected;
- the hand as a fan.

The artifacts are:
- Experience V2.1 concepts and boards;
- the playable prototype;
- the V2.2 identity atlas;
- the approved UXDEC-016…020.

This change gives the product one design system taken from those artifacts and moves the Alpha interface to the Mesa, one slice at a time, without changing any rule.

## What exists today versus target

| Area | Today (code) | Target (artifacts) |
|---|---|---|
| Tokens | Hand-written `:root` in `style.css`, a LIGHT override in `alpha.css`, many literal colors in components | One token source (`apps/web/app/design/tokens.json`) compiled to CSS and published as the AoH Design System artifact |
| Type | Cinzel named, never loaded; system sans | Cinzel (display), Source Sans 3 (body), Cormorant Garamond (chronicle), loaded once |
| Table art | Done (V2.2: cities, fortification, pieces, banners, borders, marks) | Kept; documented as design-system components |
| Shell | Top bar (64) + area tabs (36) + Council \| Atlas \| Inspector + bottom bar | Strip on top, map full-bleed, Tray at the bottom, Cofre and Livro as overlays, contextual card |
| Gold | Primary class used in several places at once | One dominant action per state (UXDEC-020) |
| Mobile | Stacked panels | Strip, map, tray; card and Livro as sheets; hand as drawer |

## What Changes

- **A. Design system as code:**
  - `tokens.json` is the single source;
  - a script compiles it to `tokens.css` for the product and writes the Design System artifact files;
  - component classes go in `aoh.css`;
  - `table-art.ts` is the art bundle.
- **B. Type and base:** load the three families; set the type scale; use the base tokens everywhere, with no literal colors in new code.
- **C. Mesa shell:**
  - the strip shows the civilization seal, Era and round, phase and deadline, the seats' seals with ready state, the Cofre and the Livro;
  - the map fills the rest;
  - the tray holds the planning summary and the single dominant action.
- **D. Cofre and Livro:**
  - the Cofre opens from the strip with the seven resources, caps and the round forecast;
  - the Livro is an overlay with the current areas (Teia, Cartas & Projetos, Diplomacia, Eras & Hegemonia, Crônicas) and closes back to the map.
- **E. Contextual card:**
  - the city, territory and military inspectors become one card beside the selection;
  - the Council's contents move to the card, the Livro and the map.
- **F. Lobby and entry:** restyled with the system (roster, seals, banners).
- **G. Mobile:** strip, map and tray; the card and the Livro open as sheets; the hand is the horizontal drawer.
- **H. Gates:** the e2e suite is updated to the new shell; evidence is taken at 1366×768, 1440×900, 1920×1080 and 390×844.

## Non-goals

- No rule, schema or projection change. The engine and server stay as they are.
- No new mechanics, cards or civilizations.
- No live presence, pause or suspend: that is server work tracked as GR-34.
- No push, merge, deploy or production change.

## Capabilities

### Added Capabilities
- `alpha-mesa-interface`: the design system and the Mesa shell of the Alpha.

## Impact

- `apps/web/app/design/*` (new);
- `apps/web/app/alpha/*`;
- `apps/web/app/play/hex-map.tsx`;
- `apps/web/app/style.css`;
- `apps/web/app/layout.tsx`;
- `scripts/design-system.mjs` (new);
- e2e specs and evidence;
- the AoH Design System artifact.
