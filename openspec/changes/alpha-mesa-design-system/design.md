## Context

The sources are, in order of authority:
1. the approved decisions (UXDEC-001…020, the 2026-10-04 decisions);
2. the Experience V2.1 Mesa (`docs/product/experience-v2/04-calm-strategy.md`, `05-living-table.md`, `concepts/v21-concepts.html`, boards c01–c20);
3. the V2.2 identity work (`10-identidade-visual-v22.md`, `concepts/v22-identity.html`, `concepts/art-v22.js`);
4. the playable prototype (`prototype/index.html`).

The prototype is a UI reference only, never a rule source (doc 09).

## Baseline

| Piece | In code | Missing |
|---|---|---|
| Color tokens | `style.css :root` (dark), `alpha.css [data-alpha-theme=LIGHT]` | single source, parchment, bronze, neutral mark, seat names, docs |
| Fonts | `--serif: 'Cinzel'…` without loading; system sans | the three families loaded; type scale |
| Table art | `apps/web/app/alpha/table-art.ts`, HexMap art mode | listing as design-system components |
| Card fan | `alpha-hand.tsx` | nothing |
| Top chrome | `.top-bar` + `.main-nav` | Strip (Faixa) |
| Side panels | Council, Inspector | contextual card; Council folded into card, Livro and map |
| Bottom | footer bar with confirm | Tray with one dominant action |
| Resources | always visible in the top bar | Cofre on demand, with alerts only when something needs attention |
| Areas | tabs replacing the map | Livro overlay over the map |

## Decisions

### Design system as code

`apps/web/app/design/tokens.json` follows the Design System artifact format:
- color themes `dark` (first) and `light`;
- type families and styles;
- spacing, radius, shadow.

`scripts/design-system.mjs`:
- compiles it into `apps/web/app/design/tokens.css` (`:root` = dark, `[data-alpha-theme='LIGHT']` = light, the theme switch the product already has);
- writes the artifact folder: `README.md`, `tokens.json`, `components/*`, with `components/bundle.css` from `aoh.css` and `components/bundle.js` from the table art.

The product and the artifact cannot drift: both come from the same files. Token names keep the product's existing variable names (`background`, `surface`, `accent`…), so no component needs a rename. New ones are only added:
- `parchment`, `parchment-ink`, `bronze`, `mark` (neutral path and selection);
- `seat-1…6`, with `civ-1…6` kept as aliases.

### One gold

- `accent` is reserved for the single dominant action of the current state.
- The Tray owns it during planning. A focused card, the resolution panel or a modal take it while open, and the Tray steps down.
- Selection, path, target and alerts use `mark` and the semantic colors, never `accent`.

### Mesa shell

The board renders `Strip`, `Map`, `Tray`, `Hand` and, on demand, `Cofre`, `Livro` and `ContextCard`.

The existing panels move inside them unchanged first:
- the inspector bodies go inside the card;
- the areas go inside the Livro.

Rules and the projection are not touched. The DOM labels the e2e suite relies on ("Confirmar planejamento", civilization buttons with a heading, "Selecionar todas", "Escolher produzir"…) are kept where they still make sense. Selectors that named removed containers (`.alpha-council`, `.main-nav`) are updated in the same task that removes them.

### Risks

- The e2e suite pins the old shell (fullscreen spec, council toggles). Each shell task updates its specs in the same commit.
- The map must stay protagonist at 1366×768: the strip is at most 52 px and the tray at most 72 px.
