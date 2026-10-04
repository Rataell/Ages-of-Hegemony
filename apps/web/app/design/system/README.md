Ages of Hegemony is a strategy board game played around a table in the browser. The interface is that table, the **Mesa**: the map leads, the chrome stays small, and the player sees one decision at a time. Build every Alpha screen with this system; the product compiles the same `tokens.json` this page shows.

## Content fundamentals

- Write in Brazilian Portuguese for players. Use the game's own nouns: **Mesa**, **Faixa** (strip), **Bandeja** (tray), **Cofre** (resources), **Livro** (areas), **Pioneiro**, **Explorador**, **Enviado**, **Frota**, **Embarcação Costeira**, **Era**, **Rodada**, **Prestígio**, **Hegemonia**.
- Name what happens, in the active voice: "Confirmar planejamento", "Jogar carta", "Desembarcar · 1 ação". A refusal explains the rule and the way out: "Fronteira fechada, cidade inimiga ou presença de outra civilização: ataque a partir da frota."
- Say plainly when something does nothing yet: "planejado", "sem efeito nos recursos". Never promise an inert rule.
- No emoji. Numbers come with their unit: "+3 Riqueza", "2 de 2 nesta rodada".

## Visual foundations

- **Map first.** During a match the map fills the screen between the strip (`strip-height`, 52 px at most) and the tray (`tray-height`, 72 px at most). Everything else opens on demand over the map and closes back to it.
- **One gold.** `accent` (gold) is only for the single dominant action of the current state: the tray's confirmation while planning, "Jogar carta" while a card is in focus, "Continuar" while a round resolves. When one of these is open the others step down. Selection, paths, targets, claimable hexes and result halos use `mark`; attention uses `warning`; losses use `danger`, always with a word.
- **Shape, then color, then text.** On the map a piece is read by its silhouette, a city by its plan, a wall by its layer. The seat color (`civ-1` … `civ-6`) only says whose it is; the civilization is told by its emblem, seal, banner and border pattern, so it survives another seat color, grayscale and 16 px. No seat color is gold.
- **Surfaces.** Ground `background`; panels `surface` with the `.aoh-glass` treatment; raised controls `surface-elevated`; insets `well`. Parchment objects (cards, event scrolls, result tags) use `parchment` with `parchment-ink` and a `bronze` edge.
- **Type.** Display in Cinzel (`title-xl`, `title`, `heading`) for names, numerals and section heads only; running text in Source Sans 3 (`body`, `body-strong`, `small`); section labels in `eyebrow` (uppercase, accent); chronicle entries and quotes in Cormorant Garamond (`chronicle`).
- **Space and shape.** Gutter `space-4`; panel padding `space-3`–`space-4`; sections `space-6`. Radii: `radius` for controls, `radius-card` for cards, `radius-panel` for strip, tray, card and Livro, `radius-pill` for seals and the tray pill. Floating panels carry `shadow`; cards `shadow-sm`; popovers `shadow-lg`.
- **Focus.** Every control shows a solid `mark` outline at 2 px when focused from the keyboard.
- **Motion.** Short and functional: the fan lifts in 150–180 ms; nothing animates at rest; respect reduced motion.

## The table art (map)

The bundle `AOH` draws every map object as SVG for a pointy-top hex of radius 52:

- `cityArt(level, r, {color, seed, depth})` — top-down city that fills its hex; level 1–7 (Posto … Metrópole Imperial) reads through the plan. `depth` is the Focus variant only.
- `fortificationArt(level, state, r)` — independent layer on the rim: Paliçada, Muralha de Pedra, Fortaleza, Baluarte, Cidadela; DAMAGED and BREACHED open gaps.
- `pieceArt(kind, color, px, count, signature)` — family silhouettes with an `ink` outline; Explorador, Pioneiro and Enviado have their own shapes; a signature piece carries the star. Minimum size `piece-min` (28 px).
- `bannerArt(mark, color, px)`, `sealArt(mark, color, r)`, `emblemArt(...)`, `borderStrokes(pattern, color)` — the civilization mark.

## Iconography

There is no icon font. Map objects are the table art above; resources use their resource color token (`food`, `wood`, `stone`, `metal`, `wealth`, `knowledge`, `influence`) with a word. Never use emoji as icons.
